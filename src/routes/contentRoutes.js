const express = require("express");

const router = express.Router();

const { getPageContent, savePageContent, listPages } = require("../controllers/contentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin"), listPages);
router.get("/:page", protect, authorize("admin"), getPageContent);
router.put("/:page", protect, authorize("admin"), savePageContent);

module.exports = router;
