import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2";
import crypto from "crypto";
import { keccak256, toUtf8Bytes } from "ethers"; 
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addressFilePath = path.join(__dirname, "..", "..", "shared", "contracts", "contract-address.json");
const abiFilePath = path.join(__dirname, "..", "..", "shared", "contracts", "Voting.json");

const contractAddress = JSON.parse(fs.readFileSync(addressFilePath, "utf-8")).Voting;
const contractArtifact = JSON.parse(fs.readFileSync(abiFilePath, "utf-8"));

const router = express.Router();

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const signer = await provider.getSigner(0);
const votingContract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


function generateTokens(pollId, count = 100) {
    const rawTokens = [];
    const hashedTokens = [];

    for (let i = 0; i < count; i++) {
        const rawToken = crypto.randomBytes(16).toString("hex"); // 32-character hex token
        const hashedToken = keccak256(toUtf8Bytes(rawToken));

        rawTokens.push({
            pollId: pollId,
            token: rawToken
        });

        hashedTokens.push(hashedToken);
    }

    return { rawTokens, hashedTokens };
}

router.get("/", (req, res) => {
    const sql = `
    SELECT id, title, description, creator_id, startTime, endTime, status
    FROM poll
    ORDER BY endTime DESC
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching polls:", err);
            return res.status(500).json({ message: "Failed to retrieve polls." });
        }

        res.json(results);
    });
});

router.post("/", async (req, res) => {
    const { title, description, endTime, options, allowLiveResults } = req.body;

    const insertPollSql = "INSERT INTO poll (title, description, endTime, creator_id, allow_live_results) VALUES (?, ?, ?, ?, ?)";
    const values = [title, description, endTime, req.cookies.session_id || 1, allowLiveResults ? 1 : 0];

    db.query(insertPollSql, values, async (err, result) => {
        if (err) {
            console.error("Failed to create poll:", err);
            return res.status(500).json({ message: "Poll creation failed" });
        }
        const pollId = result.insertId;
        const optionSql = "INSERT INTO poll_options (poll_id, label) VALUES ?";
        const optionValues = options.map(opt => [pollId, opt]);

        db.query(optionSql, [optionValues], async (err2) => {
            if (err2) {
                return res.status(500).json({ message: "Poll created, but options failed" });
            }

            const { rawTokens, hashedTokens } = generateTokens(pollId, 100); // 100 tokens per poll
            const tokenValues = rawTokens.map(t => [t.pollId, t.token]);

            const tokenSql = "INSERT INTO poll_token (poll_id, token) VALUES ?";
            db.query(tokenSql, [tokenValues], async (err3) => {
                if (err3) {
                    console.error("Failed to insert poll tokens:", err3);
                    return res.status(500).json({ message: "Poll and options created, but token generation failed" });
                }

                try {
                    const tx = await votingContract.createPoll(allowLiveResults, options.length);
                    const receipt = await tx.wait();

                    const blockchainPollId = Number(await votingContract.pollCount()) - 1;

                    const tokenTx = await votingContract.addValidTokens(blockchainPollId, hashedTokens);
                    await tokenTx.wait();

                    db.query(
                        "UPDATE poll SET blockchain_poll_id = ? WHERE id = ?",
                        [blockchainPollId, pollId],
                        (err4) => {
                            if (err4) {
                                console.error("Failed to update blockchain poll ID:", err4);
                                return res.status(500).json({ message: "Poll created but blockchain sync failed." });
                            }

                            res.status(201).json({
                                message: "Poll created successfully on both DB and blockchain",
                                pollId: pollId,
                                blockchainPollId: blockchainPollId
                            });
                        }
                    );
                } catch (blockchainError) {
                    console.error("Blockchain transaction failed:", blockchainError);
                    return res.status(500).json({ message: "Poll created in DB but failed on blockchain." });
                }
            });
        });
    });
});


router.get("/:id", (req, res) => {
    const pollId = req.params.id;

    const sqlPoll = `
    SELECT p.id, p.title, p.description, p.creator_id, u.username AS creator_name,
           p.startTime, p.endTime, p.allow_live_results, p.status, p.blockchain_poll_id
    FROM poll p
    JOIN user u ON p.creator_id = u.id
    WHERE p.id = ?
  `;
    const sqlOptions = "SELECT id, label FROM poll_options WHERE poll_id = ?";

    db.query(sqlPoll, [pollId], (err, pollResults) => {
        if (err || pollResults.length === 0) {
            return res.status(404).json({ message: "Poll not found" });
        }

        const poll = pollResults[0];

        db.query(sqlOptions, [pollId], (err2, optionResults) => {
            if (err2) {
                return res.status(500).json({ message: "Failed to fetch options" });
            }

            poll.options = optionResults;
            res.json(poll);
        });
    });
});

router.post("/:id/request-token", (req, res) => {
    const pollId = req.params.id;
    const userId = req.cookies.session_id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user has already received a token for this poll
    const checkIssuedSql = "SELECT * FROM token_issuance WHERE user_id = ? AND poll_id = ?";
    db.query(checkIssuedSql, [userId, pollId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error("Check token issuance error:", checkErr);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (checkResults.length > 0) {
            return res.status(400).json({ message: "You have already received a token for this poll." });
        }

        // Pick one unused token
        const selectTokenSql = "SELECT id, token FROM poll_token WHERE poll_id = ? AND issued = 0 ORDER BY RAND() LIMIT 1";
        db.query(selectTokenSql, [pollId], (selectErr, tokenResults) => {
            if (selectErr || tokenResults.length === 0) {
                console.error("Token selection error:", selectErr);
                return res.status(500).json({ message: "No available tokens for this poll." });
            }

            const tokenId = tokenResults[0].id;
            const token = tokenResults[0].token;

            // Mark token as issued
            const updateTokenSql = "UPDATE poll_token SET issued = 1 WHERE id = ?";
            db.query(updateTokenSql, [tokenId], (updateErr) => {
                if (updateErr) {
                    console.error("Token update error:", updateErr);
                    return res.status(500).json({ message: "Failed to issue token." });
                }

                // Record token issuance
                const insertIssuanceSql = "INSERT INTO token_issuance (user_id, poll_id, issued_at) VALUES (?, ?, NOW())";
                db.query(insertIssuanceSql, [userId, pollId], (insertErr) => {
                    if (insertErr) {
                        console.error("Issuance record error:", insertErr);
                        return res.status(500).json({ message: "Failed to record token issuance." });
                    }

                    // ✅ Send token back to frontend
                    res.json({ token: token });
                });
            });
        });
    });
});

export default router;