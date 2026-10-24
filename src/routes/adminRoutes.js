const express = require("express");

const router = express.Router();

const adminViewController = require("../controllers/adminViewController");
const { protectView, authorize } = require("../middleware/authMiddleware");

router.get("/login", adminViewController.loginPage);

router.get("/", protectView, authorize("admin"), adminViewController.dashboard);
router.get("/media", protectView, authorize("admin"), adminViewController.mediaPage);
router.get("/orders", protectView, authorize("admin"), adminViewController.ordersPage);
router.get("/donations", protectView, authorize("admin"), adminViewController.donationsPage);
router.get("/content", protectView, authorize("admin"), adminViewController.contentIndex);
router.get("/content/:page", protectView, authorize("admin"), adminViewController.contentEdit);
router.get("/settings", protectView, authorize("admin"), adminViewController.settingsPage);
router.get("/broadcast", protectView, authorize("admin"), adminViewController.broadcastPage);

router.get("/:module", protectView, authorize("admin"), adminViewController.listPage);
router.get("/:module/new", protectView, authorize("admin"), adminViewController.newFormPage);
router.get("/:module/:id/edit", protectView, authorize("admin"), adminViewController.editFormPage);

module.exports = router;
