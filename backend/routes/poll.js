import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2";
import crypto from "crypto";
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
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

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
           p.startTime, p.endTime, p.status
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

export default router;