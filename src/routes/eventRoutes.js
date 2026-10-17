const express = require("express");

const router = express.Router();

const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const { protect, authorize, optionalAuth } = require("../middleware/authMiddleware");

// Public
router.get("/", optionalAuth, getEvents);
router.get("/:slug", optionalAuth, getEvent);

// Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  createEvent
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateEvent
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteEvent
);

module.exports = router;