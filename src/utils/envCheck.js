/*
 * Startup sanity check for settings that are easy to leave as the
 * placeholder from .env.example. Only warns (never stops the server) —
 * a half-configured site is better than one that won't start — but the
 * warning shows up at the top of `pm2 logs` so it can't be missed.
 */
const PLACEHOLDER = /^(replace_me|replace_with.*|change_me.*|your[_-].*|xxx+|todo|)$/i;

function isPlaceholder(value) {
  return PLACEHOLDER.test(String(value || "").trim());
}

function cloudinaryConfigured() {
  return !["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].some((k) => isPlaceholder(process.env[k]));
}

function runEnvCheck() {
  const problems = [];

  if (!cloudinaryConfigured()) {
    problems.push("CLOUDINARY_* are missing or still placeholders — image/PDF uploads will fail until real Cloudinary keys are set.");
  }
  if (isPlaceholder(process.env.JWT_SECRET) || String(process.env.JWT_SECRET || "").length < 32) {
    problems.push("JWT_SECRET is a placeholder or too short — admin logins are not secure. Set a long random value (64+ characters).");
  }
  if (process.env.PAYMENT_MODE !== "mock") {
    if (isPlaceholder(process.env.FLUTTERWAVE_SECRET_KEY)) problems.push("PAYMENT_MODE is live but FLUTTERWAVE_SECRET_KEY is empty — payments will fail.");
    if (isPlaceholder(process.env.FLUTTERWAVE_SECRET_HASH)) problems.push("FLUTTERWAVE_SECRET_HASH is empty — payment webhooks will be rejected (donations then rely on the return-page confirmation only).");
    if (/localhost|127\.0\.0\.1/.test(process.env.PAYMENT_CALLBACK_BASE_URL || "")) problems.push("PAYMENT_CALLBACK_BASE_URL points at localhost — donors would be sent to the wrong place after paying.");
  }
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(process.env.FRONTEND_URL || "")) {
    problems.push("FRONTEND_URL points at localhost in production.");
  }

  if (problems.length) {
    console.warn("\n⚠  CONFIGURATION WARNINGS");
    problems.forEach((p) => console.warn("   - " + p));
    console.warn("");
  }
  return problems;
}

module.exports = { runEnvCheck, isPlaceholder, cloudinaryConfigured };
