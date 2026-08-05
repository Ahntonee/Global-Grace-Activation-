const express = require("express");

const router = express.Router();

const {
  getCurrentBroadcast,
  createBroadcast,
  getBroadcasts,
  getBroadcast,
  updateBroadcast,
  deleteBroadcast,
  goLive,
  endBroadcast,
  getChatHistory,
  hideChatMessage,
} = require("../controllers/broadcastController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.get("/current", getCurrentBroadcast);

// Admin
router.post("/", protect, authorize("admin"), createBroadcast);
router.get("/", protect, authorize("admin"), getBroadcasts);
router.get("/:id", protect, authorize("admin"), getBroadcast);
router.put("/:id", protect, authorize("admin"), updateBroadcast);
router.delete("/:id", protect, authorize("admin"), deleteBroadcast);
router.put("/:id/go-live", protect, authorize("admin"), goLive);
router.put("/:id/end", protect, authorize("admin"), endBroadcast);
router.get("/:id/chat", protect, authorize("admin"), getChatHistory);
router.put("/chat/:messageId/hide", protect, authorize("admin"), hideChatMessage);

module.exports = router;
