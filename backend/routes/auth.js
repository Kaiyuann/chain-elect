import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import rateLimit from "express-rate-limit";
const router = express.Router();


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error("DB Connection Error:", err);
    } else {
        console.log("MySQL connected.");
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../uploads"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (allowedTypes.test(ext) && mime.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only images are allowed."));
    }
};

const upload = multer({ storage, fileFilter });

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                   // Limit each IP to 5 login attempts
    message: "Too many login attempts. Please try again later.",
    standardHeaders: true,    // Return rate limit info in headers
    legacyHeaders: false,
});

const authMiddleware = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Not logged in" });
    }
};

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const sql = `INSERT INTO user (username, email, password) VALUES (?,?,?)`;

    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error("Register error:", err);
            return res.status(500).json({ message: "User registration failed." });
        }
        return res.status(201).json({ message: "Registration successful." });
    });
});

router.post("/login", loginLimiter, (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM user WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed." });
        }

        if (results.length > 0) {
            const user = results[0];

            req.session.userId = user.id

            return res.json({ message: "Login successful", user });
        } else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    });
});

router.get("/profile", authMiddleware, (req, res) => {
    const userId = req.session.userId;

    const sql = `SELECT * FROM user WHERE id = ?`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Profile error:", err);
            return res.status(500).json({ message: "Error fetching profile" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const { password, ...user } = results[0];
        res.json(user);
    });
});

router.post("/upload-profile", authMiddleware, upload.single("profile"), (req, res) => {
    const sessionId = req.session.userId;
    const newFileName = req.file.filename;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const sql = `UPDATE user SET profilepicture = ? WHERE id = ?`;
    db.query(sql, [newFileName, sessionId], (err, result) => {
        if (err) {
            console.error("Error updating profile picture:", err);
            return res.status(500).json({ message: "Update failed" });
        }
        res.json({ message: "Profile picture updated" });
    });
});

router.post("/logout", authMiddleware, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("session_id");
        res.json({ message: "Logged out successfully" });
    });
});



export default router;