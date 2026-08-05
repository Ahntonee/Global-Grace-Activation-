const express = require("express");

const router = express.Router();

const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Public
router.get("/", getEvents);
router.get("/:slug", getEvent);

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