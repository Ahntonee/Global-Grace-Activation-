const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// The blanket /api rate limiter in app.js (100 req/15min) is far too loose
// to slow down password guessing on its own — it's shared across every
// public read too. Login gets its own tighter cap on top of it.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const {
  register,
  login,
  logout,
  getProfile,
  dashboard,
} = require("../controllers/authController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const { registerValidation, loginValidation } = require("../validations/authValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public Routes
router.post("/login", loginLimiter, loginValidation, handleValidationErrors, login);
router.post("/logout", logout);

// Admin Only Route — account creation is invite-only, not public self-registration
router.post(
  "/register",
  protect,
  authorize("admin"),
  registerValidation,
  handleValidationErrors,
  register
);

// Protected Routes
router.get("/profile", protect, getProfile);

// Admin Only Route
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  dashboard
);

module.exports = router;