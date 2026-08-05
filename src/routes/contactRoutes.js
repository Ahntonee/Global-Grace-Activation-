const express = require("express");

const router = express.Router();

const {
  submitContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
} = require("../controllers/contactController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const { submitContactValidation } = require("../validations/contactValidation");
const handleValidationErrors = require("../validations/handleValidationErrors");

// Public
router.post("/", submitContactValidation, handleValidationErrors, submitContact);

// Admin
router.get(
  "/",
  protect,
  authorize("admin"),
  getContacts
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getContact
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateContact
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteContact
);

module.exports = router;