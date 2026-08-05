const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Registration — admin-only (see authRoutes.js); the first account is
// created by src/scripts/seedAdmin.js, not through this endpoint.
exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const exists = await User.findOne({ email });

  if (exists) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: role === "admin" ? "admin" : "editor",
  });

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    message: "User created successfully",
    token: generateToken(user._id),
    user: userResponse,
  });
});

// Login function
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const match = await user.comparePassword(password);

  if (!match) {
    throw new ApiError(401, "Invalid credentials");
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({
    message: "Login successful",
    token: generateToken(user._id),
    user: userResponse,
  });
});

// Logged-in user's profile
exports.getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Admin dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: `Welcome ${req.user.fullName}`,
  });
});
