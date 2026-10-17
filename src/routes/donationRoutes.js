const express = require("express");

const router = express.Router();

const {
  createDonation,
  getDonationStatus,
  getDonations,
  getDonation,
  deleteDonation,
} = require("../controllers/donationController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.post("/", createDonation);
router.get("/:reference/status", getDonationStatus);

// Admin
router.get("/", protect, authorize("admin"), getDonations);
router.get("/:id", protect, authorize("admin"), getDonation);
router.delete("/:id", protect, authorize("admin"), deleteDonation);

module.exports = router;
