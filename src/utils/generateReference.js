const crypto = require("crypto");

// e.g. GGA-1735689600000-A1B2C3 — timestamp keeps it roughly sortable,
// the random suffix keeps concurrent requests from colliding.
module.exports = function generateReference(prefix) {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
};
