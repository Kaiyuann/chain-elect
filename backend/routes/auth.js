import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import rateLimit from "express-rate-limit";
import validator from "validator";
import bcrypt from "bcrypt";
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

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const saltRounds = 10;

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req, res) => {
        const retryAfter = Math.ceil((req.rateLimit.resetTime - new Date()) / 1000);
        res.status(429).json({
            message: `Too many login attempts. Please try again after ${retryAfter} seconds.`,
            retryAfterSeconds: retryAfter,
            remainingAttempts: req.rateLimit.remaining
        });
    }
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

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    if (
        !validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
    ) {
        return res.status(400).json({
            message:
                "Password must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO user (username, email, password) VALUES (?, ?, ?)`;
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error("Register error:", err);
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ message: "Email already registered." });
                }
                return res.status(500).json({ message: "User registration failed." });
            }
            return res.status(201).json({ message: "Registration successful." });
        });
    } catch (error) {
        console.error("Hashing error:", error);
        return res.status(500).json({ message: "Error processing registration." });
    }
});

router.post("/login", loginLimiter, (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    const sql = "SELECT * FROM user WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed." });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = results[0];

        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;

                const { password: _, ...userWithoutPassword } = user;

                return res.json({ message: "Login successful", user: userWithoutPassword });
            } else {
                return res.status(401).json({ message: "Invalid credentials." });
            }
        } catch (compareErr) {
            console.error("Error comparing passwords:", compareErr);
            return res.status(500).json({ message: "Login failed." });
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

router.post("/upload-profile", authMiddleware, (req, res, next) => {
    upload.single("profile")(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            console.error("Multer error:", err.message);
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "File too large. Maximum allowed size is 5MB." });
            }
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const sessionId = req.session.userId;
        const newFileName = req.file.filename;

        const sql = `UPDATE user SET profilepicture = ? WHERE id = ?`;
        db.query(sql, [newFileName, sessionId], (dbErr, result) => {
            if (dbErr) {
                console.error("Error updating profile picture:", dbErr);
                return res.status(500).json({ message: "Update failed" });
            }
            res.json({ message: "Profile picture updated" });
        });
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