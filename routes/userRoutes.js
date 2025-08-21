const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User"); // ✅ import your User model



const router = express.Router();

router.get("/profile", protect, userController.getProfile );

router.put("/profile", protect, async (req, res) => {
  console.log('profile put')
  const { firstname, lastname, middlename, qrCode } = req.body;
  req.user.firstname = firstname ?? req.user.firstname;
  req.user.lastname = lastname ?? req.user.lastname;
  req.user.middlename = middlename ?? req.user.middlename;
  req.user.qrCode = qrCode ?? req.user.qrCode;
  await req.user.save();
  res.json(req.user);
});


// 🔹 Scan QR route
router.post("/scan-qr", async (req, res) => {
  console.log(req.body.qrCode, '/scan-qr')
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: "QR code is required" });
    }

    const user = await User.findOne({ qrCode });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User found",
      data: user
    });
  } catch (error) {
    console.error("QR Scan Error:", error);   // 👈 this should print the actual problem
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
