const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    photo: { type: String, required: true },
    displayName: { type: String, required: true },
    batchYear: { type: String, required: true },
    firstname: { type: String, required: false },
    middlename: { type: String, required: false },
    lastname: { type: String, required: false },
    role: { type: String, enum: ["user", "manager", "admin"], default: "user" },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    isGoogleUser: { type: Boolean, default: false },
    qrCode: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
