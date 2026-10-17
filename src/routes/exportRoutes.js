const express = require("express");

const router = express.Router();

const { download, feed } = require("../controllers/exportController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Token-authenticated live feed (no cookie) — keep above the :kind route.
router.get("/feed/:kind", feed);

// Admin downloads
router.get("/:kind", protect, authorize("admin"), download);

module.exports = router;
