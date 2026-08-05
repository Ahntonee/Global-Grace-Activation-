const express = require("express");

const router = express.Router();

const {
  createSpeaker,
  getSpeakers,
  getSpeaker,
  updateSpeaker,
  deleteSpeaker,
} = require("../controllers/speakerController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.get("/", getSpeakers);
router.get("/:id", getSpeaker);

// Admin
router.post("/", protect, authorize("admin"), createSpeaker);
router.put("/:id", protect, authorize("admin"), updateSpeaker);
router.delete("/:id", protect, authorize("admin"), deleteSpeaker);

module.exports = router;
