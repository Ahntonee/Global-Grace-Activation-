const { body } = require("express-validator");

exports.applyVolunteerValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("department")
    .optional()
    .isIn([
      "Ushering & Guest Care",
      "Media & Production",
      "Prayer & Altar Ministry",
      "Logistics & Security",
      "Registration Desk",
      "Hospitality",
    ])
    .withMessage("Invalid department"),
  body("availability")
    .optional()
    .isIn(["Weekdays", "Weekends", "Anytime"])
    .withMessage("Invalid availability"),
];
