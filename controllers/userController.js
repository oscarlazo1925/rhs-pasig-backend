exports.getProfile = async (req, res) => {
  console.log(req.user, 'req.user')
  try {
    if (req.user) {
      res.json({
        message: "User profile fetched successfully",
        user: req.user,
      });
    } else {
      res.json({
        message: "Firebase user authenticated, but no MongoDB profile yet",
        user: req.user,
      });
    }
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
