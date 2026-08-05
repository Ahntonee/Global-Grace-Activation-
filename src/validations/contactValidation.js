const { body } = require("express-validator");

exports.submitContactValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").optional().trim(),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("category")
    .optional()
    .isIn(["General", "Support", "Partnership", "Donation", "Complaint", "Testimony"])
    .withMessage("Invalid category"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];
