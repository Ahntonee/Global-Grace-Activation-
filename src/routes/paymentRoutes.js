const express = require("express");

const router = express.Router();

const {
  paystackWebhook,
  flutterwaveWebhook,
  mockCallback,
} = require("../controllers/paymentController");

// All public/unauthenticated by design — gateways can't send a JWT, and
// the mock endpoint refuses to run outside PAYMENT_MODE=mock. Signature
// verification is the real gate on the two webhook routes.
router.post("/webhook/paystack", paystackWebhook);
router.post("/webhook/flutterwave", flutterwaveWebhook);
router.post("/mock/callback", mockCallback);

module.exports = router;
