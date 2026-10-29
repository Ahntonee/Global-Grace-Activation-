const express = require("express");

const router = express.Router();

const {
  createGalleryItem,
  getGalleryItems,
  getGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require("../controllers/galleryController");

const { protect, authorize, optionalAuth } = require("../middleware/authMiddleware");

// Public
router.get("/", optionalAuth, getGalleryItems);
router.get("/:id", getGalleryItem);

// Admin
router.post("/", protect, authorize("admin"), createGalleryItem);
router.put("/:id", protect, authorize("admin"), updateGalleryItem);
router.delete("/:id", protect, authorize("admin"), deleteGalleryItem);

module.exports = router;
