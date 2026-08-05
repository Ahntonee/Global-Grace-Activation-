const express = require("express");

const router = express.Router();

const {
  submitPrayer,
  getPrayers,
  getPrayer,
  updatePrayer,
  deletePrayer,
} = require("../controllers/prayerController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const { submitPrayerValidation } = require("../validations/prayerValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public
router.post("/", submitPrayerValidation, handleValidationErrors, submitPrayer);

// Admin
router.get(
  "/",
  protect,
  authorize("admin"),
  getPrayers
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getPrayer
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updatePrayer
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deletePrayer
);

module.exports = router;