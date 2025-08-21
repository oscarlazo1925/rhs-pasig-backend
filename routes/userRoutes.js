const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");




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

module.exports = router;
