const express = require("express");

const router = express.Router();

const {
  subscribe,
  getSubscribers,
  getSubscriber,
  unsubscribe,
  deleteSubscriber,
} = require("../controllers/newsletterController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const { subscribeValidation } = require("../validations/newsletterValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public
router.post("/subscribe", subscribeValidation, handleValidationErrors, subscribe);

// Admin
router.get(
  "/",
  protect,
  authorize("admin"),
  getSubscribers
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getSubscriber
);

router.put(
  "/:id/unsubscribe",
  protect,
  authorize("admin"),
  unsubscribe
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteSubscriber
);

module.exports = router;