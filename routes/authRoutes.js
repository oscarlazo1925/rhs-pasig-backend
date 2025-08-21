const express = require("express");
const admin = require("firebase-admin");
const User = require("../models/User");

const router = express.Router();

/**
 * @route POST /api/auth/google
 * @desc  Verify Firebase Google ID token and add/fetch user
 */
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    const { uid, email, name, picture } = decodedToken;

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        displayName: name,
        photo: picture,
        isGoogleUser: true,
      });
    }

    return res.json({
      message: "User authenticated",
      user,
      token: token,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;

// firebaseUid: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     firstname: { type: String, required: false },
//     middlename: { type: String, required: false },
//     lastname: { type: String, required: false },
//     role: { type: String, enum: ["user", "manager", "admin"], default: "user" },
//     twoFactorSecret: { type: String },
//     twoFactorEnabled: { type: Boolean, default: false },
//     isGoogleUser: { type: Boolean, default: false },
