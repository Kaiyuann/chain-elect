import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { fileURLToPath } from "url";
import path from "path";

import { startAutoClosePolls } from "./utils/autoClosePolls.js";

import authRoutes from "./routes/auth.js";
import pollRoutes from "./routes/poll.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  key: "session_id",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60
  }
}));

app.use("/api", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

startAutoClosePolls();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});