/*
 * Payment gateways currently accepted. Flutterwave is the only account that
 * is set up, so it's the only one enabled — Paystack stays in the codebase
 * and is switched back on by setting PAYMENT_PROVIDERS=flutterwave,paystack
 * once Paystack keys exist.
 */
const ENABLED = (process.env.PAYMENT_PROVIDERS || "flutterwave")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_PROVIDER = ENABLED[0] || "flutterwave";

module.exports = { ENABLED, DEFAULT_PROVIDER, isEnabled: (p) => ENABLED.includes(p) };
