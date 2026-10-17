const express = require("express");

const router = express.Router();

const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");

const { protect, authorize, optionalAuth } = require("../middleware/authMiddleware");

// Public
router.get("/", optionalAuth, getBlogs);
router.get("/:slug", optionalAuth, getBlog);

// Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  createBlog
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateBlog
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteBlog
);

module.exports = router;