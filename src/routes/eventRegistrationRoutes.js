const express = require("express");

const router = express.Router();

const {
  registerForEvent,
  getRegistrations,
  getRegistration,
  updateRegistration,
  deleteRegistration,
} = require("../controllers/eventRegistrationController");

const { protect, authorize } = require("../middleware/authMiddleware");

const { registerForEventValidation } = require("../validations/eventRegistrationValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public — no account required to register for an event
router.post("/", registerForEventValidation, handleValidationErrors, registerForEvent);

// Admin
router.get("/", protect, authorize("admin"), getRegistrations);
router.get("/:id", protect, authorize("admin"), getRegistration);
router.put("/:id", protect, authorize("admin"), updateRegistration);
router.delete("/:id", protect, authorize("admin"), deleteRegistration);

module.exports = router;
