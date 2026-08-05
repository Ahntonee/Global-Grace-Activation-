const { body } = require("express-validator");

exports.submitPrayerValidation = [
  body("isAnonymous").optional().isBoolean().withMessage("isAnonymous must be true or false"),
  body("fullName")
    .if(body("isAnonymous").not().equals(true))
    .trim()
    .notEmpty()
    .withMessage("Full name is required unless submitting anonymously"),
  body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").optional().trim(),
  body("category")
    .optional()
    .isIn(["Healing", "Family", "Marriage", "Financial", "Salvation", "Thanksgiving", "Deliverance", "Other"])
    .withMessage("Invalid category"),
  body("request").trim().notEmpty().withMessage("Prayer request is required"),
  body("isConfidential").optional().isBoolean(),
];
