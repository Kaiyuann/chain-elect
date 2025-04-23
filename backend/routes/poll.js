const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const crypto = require("crypto");

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

router.post("/", (req, res) => {
    const { title, description, endTime, options } = req.body;

    const insertPollSql = "INSERT INTO poll (title, description, endTime, creator_id) VALUES (?, ?, ?, ?)";
    const values = [title, description, endTime, req.cookies.session_id || 1];

    db.query(insertPollSql, values, (err, result) => {
        if (err) {
            console.error("Failed to create poll:", err);
            return res.status(500).json({ message: "Poll creation failed" });
        }
        const pollId = result.insertId;
        const optionSql = "INSERT INTO poll_options (poll_id, label) VALUES ?";
        const optionValues = options.map(opt => [pollId, opt]);

        db.query(optionSql, [optionValues], (err2) => {
            if (err2) {
                return res.status(500).json({ message: "Poll created, but options failed" });
            }

            const tokens = generateTokens(pollId, 100); // 100 tokens per poll

            const tokenSql = "INSERT INTO poll_token (poll_id, token) VALUES ?";
            db.query(tokenSql, [tokens], (err3) => {
                if (err3) {
                    console.error("Failed to insert poll tokens:", err3);
                    return res.status(500).json({ message: "Poll and options created, but token generation failed" });
                }

                res.status(201).json({
                    message: "Poll, options, and tokens created successfully",
                    pollId: pollId
                });
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

module.exports = router;