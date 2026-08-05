const { body } = require("express-validator");

exports.subscribeValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("fullName").optional().trim(),
];
