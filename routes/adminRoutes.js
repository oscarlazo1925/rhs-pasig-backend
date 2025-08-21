const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const admin = require("firebase-admin");

const router = express.Router();

// List users
router.get("/users", protect, authorize("admin", "manager"), async (req, res) => {
  const users = await User.find().select("-__v");
  res.json(users);
});

// Update role (sync Mongo + Firebase claims)
router.put("/users/:id/role", protect, authorize("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["user", "manager", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Update Mongo role
  user.role = role;
  await user.save();

  // Update Firebase custom claim
  await admin.auth().setCustomUserClaims(user.firebaseUid, { role });

  res.json({ message: "Role updated & synced with Firebase", user });
});

module.exports = router;
