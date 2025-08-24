require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const initRoutes  = require("./routes/initRoutes");
const authRoutes  = require("./routes/authRoutes");

const app = express();

// --- Firebase ---
admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-admin-key.json"))
});

// --- MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB error:", err));

// --- Middleware ---
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
  origin: [
    "https://appindio.com",
    "http://localhost:5173",
    "https://oscarlazo1925.github.io",
    "https://rizalhs.org/"
  ],
  credentials: true
}));

// --- Routes ---
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/init",  initRoutes); // remove/disable after first use
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  // res.json({ message: "Backend with Firebase Auth + MongoDB running 🎉" });
  res.json({ message: "Good Job. 🎉" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

module.exports = app;
