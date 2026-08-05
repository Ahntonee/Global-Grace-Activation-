const express = require("express");

const router = express.Router();

const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Public
router.get("/", getBlogs);
router.get("/:slug", getBlog);

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