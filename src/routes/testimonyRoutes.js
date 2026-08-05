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

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.get("/", getTestimonies);
router.get("/:id", getTestimony);
router.post("/submit", submitTestimony);

// Admin
router.post("/", protect, authorize("admin"), createTestimony);
router.put("/:id", protect, authorize("admin"), updateTestimony);
router.delete("/:id", protect, authorize("admin"), deleteTestimony);

module.exports = router;
