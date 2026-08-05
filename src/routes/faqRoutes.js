const express = require("express");

const router = express.Router();

const {
  createFaq,
  getFaqs,
  getFaq,
  updateFaq,
  deleteFaq,
} = require("../controllers/faqController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.get("/", getFaqs);
router.get("/:id", getFaq);

// Admin
router.post("/", protect, authorize("admin"), createFaq);
router.put("/:id", protect, authorize("admin"), updateFaq);
router.delete("/:id", protect, authorize("admin"), deleteFaq);

module.exports = router;
