const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/auth");
const pollRoutes = require("./routes/poll");
app.use("/api", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});