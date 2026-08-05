const express = require("express");

const router = express.Router();

const {

  applyVolunteer,
  getVolunteers,
  getVolunteer,
  updateVolunteer,
  deleteVolunteer,
  approveVolunteer,
  rejectVolunteer,

} = require("../controllers/volunteerController");

const {

  protect,
  authorize,

} = require("../middleware/authMiddleware");

const { applyVolunteerValidation } = require("../validations/volunteerValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public — no account required to submit a volunteer application
router.post("/apply", applyVolunteerValidation, handleValidationErrors, applyVolunteer);

// Admin
router.get("/", protect, authorize("admin"), getVolunteers);

router.get("/:id", protect, authorize("admin"), getVolunteer);

router.put("/:id", protect, authorize("admin"), updateVolunteer);

router.delete("/:id", protect, authorize("admin"), deleteVolunteer);

router.put("/:id/approve", protect, authorize("admin"), approveVolunteer);

router.put("/:id/reject", protect, authorize("admin"), rejectVolunteer);

module.exports = router;