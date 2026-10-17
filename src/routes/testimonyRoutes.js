const express = require("express");

const router = express.Router();

const {
  createTestimony,
  submitTestimony,
  getTestimonies,
  getTestimony,
  updateTestimony,
  deleteTestimony,
} = require("../controllers/testimonyController");

const { protect, authorize, optionalAuth } = require("../middleware/authMiddleware");
const { submitTestimonyValidation } = require("../validations/testimonyValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public
router.get("/", optionalAuth, getTestimonies);
router.get("/:id", getTestimony);
router.post("/submit", submitTestimonyValidation, handleValidationErrors, submitTestimony);

// Admin
router.post("/", protect, authorize("admin"), createTestimony);
router.put("/:id", protect, authorize("admin"), updateTestimony);
router.delete("/:id", protect, authorize("admin"), deleteTestimony);

module.exports = router;
