const { validationResult } = require("express-validator");

// Run after a set of express-validator chains; short-circuits with a 400
// and the field-level errors if any chain failed, otherwise calls next().
module.exports = function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};
