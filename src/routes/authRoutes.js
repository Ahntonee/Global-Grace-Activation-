const express = require("express");

const router = express.Router();

const {
  register,
  login,
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
router.post("/login", loginValidation, handleValidationErrors, login);

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