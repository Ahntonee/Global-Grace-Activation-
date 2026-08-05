const express = require("express");

const router = express.Router();

const {
  createDonation,
  getDonationStatus,
  getDonations,
  getDonation,
} = require("../controllers/donationController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.post("/", createDonation);
router.get("/:reference/status", getDonationStatus);

// Admin
router.get("/", protect, authorize("admin"), getDonations);
router.get("/:id", protect, authorize("admin"), getDonation);

module.exports = router;
