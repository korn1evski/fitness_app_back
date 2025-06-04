const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const rolePermissions = {
  ADMIN: ["READ", "WRITE", "DELETE", "UPDATE"],
  WRITER: ["READ", "WRITE"],
  VISITOR: ["READ"],
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    let user = await User.findOne({ username });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }
    const userRole = role || "VISITOR";
    const permissions = rolePermissions[userRole] || rolePermissions["VISITOR"];
    user = new User({
      username,
      password,
      role: userRole,
      permissions,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login an existing user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
