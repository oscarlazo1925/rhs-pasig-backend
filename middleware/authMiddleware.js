const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const User = require("../models/User");

const client = jwksClient({
  jwksUri:
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const protect = async (req, res, next) => {
  const hdr = req.headers.authorization || "";
  if (!hdr.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = hdr.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      audience: process.env.FIREBASE_PROJECT_ID, // your Firebase project ID
      issuer: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
    },
    async (err, decoded) => {
      if (err) {
        console.error("Auth error:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      try {
        req.firebaseUid = decoded.user_id;

        // Find or create Mongo user
        let user = await User.findOne({ firebaseUid: decoded.user_id });
        if (!user) {
          user = await User.create({
            firebaseUid: decoded.user_id,
            email: decoded.email,
            name: decoded.name || "Anonymous",
          });
        }

        // Get Firebase role (custom claim), fallback to "user"
        const firebaseRole = decoded.role || "user";

        if (user.role !== firebaseRole) {
          user.role = firebaseRole;
          await user.save();
        }

        req.user = user;
        next();
      } catch (dbErr) {
        console.error("DB error:", dbErr);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
};

const authorize = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};

module.exports = { protect, authorize };
