const { body } = require("express-validator");

exports.submitPrayerValidation = [
  body("isAnonymous").optional().isBoolean().withMessage("isAnonymous must be true or false"),
  body("fullName")
    // .equals(true) would do a string comparison against a JSON boolean and
    // never match — use a plain predicate against the parsed request body.
    .if((value, { req }) => req.body.isAnonymous !== true)
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
