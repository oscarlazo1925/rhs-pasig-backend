const express = require("express");
const User = require("../models/User");

const router = express.Router();

// POST /api/init/make-admin
// Body: { email: "you@example.com" }
// Header: x-init-token: <INIT_ADMIN_TOKEN>
router.post("/make-admin", async (req, res) => {
  const token = req.headers["x-init-token"];
  if (!token || token !== process.env.INIT_ADMIN_TOKEN) {
    return res.status(401).json({ message: "Invalid init token" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = "admin";
  await user.save();
  res.json({ message: "User promoted to admin", user: { id: user._id, email: user.email, role: user.role } });
});

module.exports = router;
