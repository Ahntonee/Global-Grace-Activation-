const express = require("express");

const router = express.Router();

const {
  uploadMedia,
  getMedia,
  getSingleMedia,
  deleteMedia,
} = require("../controllers/mediaController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const { uploadSingle } = require("../middleware/uploadMiddleware");

// Upload (Admin only)
router.post(
  "/upload",
  protect,
  authorize("admin"),
  uploadSingle("file"),
  uploadMedia
);

// Public
router.get("/", getMedia);
router.get("/:id", getSingleMedia);

// Admin only
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteMedia
);

module.exports = router;