module.exports = (err, req, res, next) => {
  console.error(err);

  // Malformed :id route params (e.g. "GET /api/testimonies/not-an-id")
  // throw a Mongoose CastError, which otherwise falls through to the raw
  // 500 branch below and leaks internal driver text to the client.
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Direct Model.create()/save() calls that skip express-validator (mostly
  // admin-authored writes) still hit Mongoose's own schema validation —
  // format those the same way handleValidationErrors does, instead of the
  // raw "Testimony validation failed: title: Path `title` is required"
  // string a Mongoose ValidationError produces by default.
  if (err.name === "ValidationError" && err.errors) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Duplicate key on a unique index (email, slug, paymentReference, ...) —
  // surfaces as a raw MongoServerError (code 11000) with the collection
  // and index name in the message otherwise.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res.status(409).json({
      success: false,
      message: `That ${field} is already in use.`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};