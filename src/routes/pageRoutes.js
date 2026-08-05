const express = require("express");

const router = express.Router();

const {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
} = require("../controllers/pageController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");


// Create page (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  createPage
);

// Public routes
router.get("/", getPages);
router.get("/:slug", getPage);
// Update page
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updatePage
);

// Delete page
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deletePage
);

module.exports = router;