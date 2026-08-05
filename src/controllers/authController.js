const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Keep this roughly in sync with JWT_EXPIRES_IN in .env — it only controls
// how long the browser holds onto the cookie, not the token's own validity.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

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

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  res.json({
    message: "Login successful",
    token,
    user: userResponse,
  });
});

// Clears the admin-dashboard session cookie. JSON API consumers using the
// Authorization header aren't affected — there's nothing server-side to
// revoke for a bearer token; they just stop sending it.
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
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
