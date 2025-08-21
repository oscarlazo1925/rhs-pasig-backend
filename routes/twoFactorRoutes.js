const express = require("express");
const router = express.Router();
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const admin = require("../config/firebase");
const User = require("../models/User");

// Validate Firebase Token middleware
const validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Generate 2FA secret + QR code
router.get("/setup", validateToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `UBIS (${req.user.email})`,
    });

    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

    // Save secret to user in DB
    await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { twoFactorSecret: secret.base32, twoFactorEnabled: false }
    );

    res.json({ qrCodeDataURL, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ message: "2FA setup failed", error });
  }
});

// Verify user-provided token
router.post("/verify", validateToken, async (req, res) => {
  const { token } = req.body;
  console.log("2fa verify:", token);
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || !user.twoFactorSecret)
      return res.status(400).json({ message: "No 2FA setup for this user." });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid 2FA code" });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: "2FA verified and enabled successfully" });
  } catch (err) {
    res.status(500).json({ message: "2FA verification failed", error: err });
  }
});

router.post("/verify-login", validateToken, async (req, res) => {
  console.log("twofactor-routes", req.headers.authorization);
  try {
    const { token: firebaseToken } = req.headers.authorization
      ? { token: req.headers.authorization.split(" ")[1] }
      : {};
    const { code } = req.body;

    if (!firebaseToken || !code) {
      return res.status(400).json({ message: "Missing token or code" });
    }

    // ✅ Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const uid = decodedToken.uid;

    // ✅ Find user in DB
    const user = await User.findOne({ firebaseUid: uid });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA not enabled" });
    }

    // ✅ Verify TOTP code using speakeasy
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid 2FA code" });
    }

    // ✅ Success
    res
      .status(200)
      .json({ message: "2FA verified", user, token: firebaseToken });
  } catch (err) {
    console.error("2FA verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/disable", validateToken, async (req, res) => {
  const user = await User.findOne({ firebaseUid: req.user.uid });

  if (!user) return res.status(404).json({ message: "User not found" });

  user.twoFactorSecret = null;
  user.twoFactorEnabled = false;
  await user.save();

  res.json({ message: "2FA disabled" });
});

module.exports = router;
