const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Get token endpoint
router.post("/token", async (req, res) => {
  try {
    const { username, password, role, permissions } = req.body;

    // For demo purposes, we'll create a user if it doesn't exist
    let user = await User.findOne({ username });

    if (!user) {
      user = new User({
        username,
        password,
        role: role || "VISITOR",
        permissions: permissions || ["READ"],
      });
      await user.save();
    } else {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1m" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
