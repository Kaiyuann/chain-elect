const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");



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

router.get("/me", (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return res.status(401).json({ loggedIn: false });

    res.json({ loggedIn: true });
});

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

            res.cookie("session_id", user.id, {
                httpOnly: false,
                sameSite: "Strict",
                secure: false
            });

            res.cookie("role", user.role, {
                httpOnly: false,
                sameSite: "Strict",
                secure: false
            });

            return res.json({ message: "Login successful", user });
        } else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    });
});

router.get("/profile", (req, res) => {
    const userId = req.cookies.session_id;

    if (!userId) {
        return res.status(401).json({ message: "Not logged in" });
    }

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

router.post("/upload-profile", upload.single("profile"), (req, res) => {
    const sessionId = req.cookies.session_id;
    const newFileName = req.file.filename;

    const sql = `UPDATE user SET profilepicture = ? WHERE id = ?`;
    db.query(sql, [newFileName, sessionId], (err, result) => {
        if (err) {
            console.error("Error updating profile picture:", err);
            return res.status(500).json({ message: "Update failed" });
        }
        res.json({ message: "Profile picture updated" });
    });
});

router.post("/logout", (req, res) => {
    res.clearCookie("session_id");
    res.clearCookie("role");
    res.json({ message: "Logged out successfully" });
});


router.get("/users", (req, res) => {
    const userId = req.cookies.session_id;

    if (!userId) {
        return res.status(401).json({ message: "Not logged in" }); //make sure there is a session
    }

    const getUserSql = "SELECT role FROM user WHERE id = ?";
    db.query(getUserSql, [userId], (err, userResult) => {      //make sure that the user and session is valid
        if (err || userResult.length === 0) {
            return res.status(403).json({ message: "Invalid user or session" });
        }

        const role = userResult[0].role;

        if (role !== "admin") {
            return res.status(403).json({ message: "Authentication Failed" });  //make sure that the user is admin
        }

        const sql = "SELECT id, username, email, password, role, profilepicture FROM user";
        db.query(sql, (err, results) => {                        //perform fetch user data
            if (err) {
                console.error("Error fetching users:", err);
                return res.status(500).json({ message: "Failed to retrieve users" });
            }
            res.json(results);
        });
    });
});
module.exports = router;