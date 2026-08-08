const { body } = require("express-validator");

exports.registerForEventValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("guests")
    .optional()
    .isIn(["Just me", "2 people", "3 people", "4+ people"])
    .withMessage("Invalid guest count"),
  body("eventId").optional().isMongoId().withMessage("Invalid event"),
];
