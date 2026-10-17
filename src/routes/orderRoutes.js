const express = require("express");

const router = express.Router();

const {
  createOrder,
  getOrderStatus,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public
router.post("/", createOrder);
router.get("/:reference/status", getOrderStatus);

// Admin
router.get("/", protect, authorize("admin"), getOrders);
router.get("/:id", protect, authorize("admin"), getOrder);
router.put("/:id", protect, authorize("admin"), updateOrder);
router.delete("/:id", protect, authorize("admin"), deleteOrder);

module.exports = router;
