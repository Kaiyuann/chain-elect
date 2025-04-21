const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


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

    const insertpollsql = "INSERT INTO poll (title, description, endTime, creator_id) VALUES (?, ?, ?, ?)";
    const values = [title, description, endTime, req.cookies.session_id || 1];

    db.query(insertpollsql, values, (err, result) => {
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

            res.status(201).json({ message: "Poll and options created successfully" });
        });
    });
});

module.exports = router;