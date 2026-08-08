const { body } = require("express-validator");

exports.submitTestimonyValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("category")
    .optional()
    .isIn(["Healing", "Breakthrough", "Salvation", "Restoration", "Deliverance", "Family"])
    .withMessage("Invalid category"),
  body("body").trim().notEmpty().withMessage("Your testimony is required"),
  body("fullName").optional().trim(),
];
