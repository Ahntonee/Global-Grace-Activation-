const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const payments = require("../services/payments");
const { findTargetByReference, markPaid, markFailed, reconcileFlutterwave } = require("../services/paymentReconcile");
const { paystackService, flutterwaveService } = payments;


// Paystack webhook — public, unauthenticated by design (the gateway can't
// send a JWT). Signature verification over the raw body is what stands in
// for auth here.
exports.paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  if (!signature || !paystackService.verifyWebhookSignature(req.rawBody, signature)) {
    throw new ApiError(401, "Invalid signature");
  }

  const event = req.body;
  const reference = event.data && event.data.reference;
  if (!reference) return res.status(200).json({ received: true });

  const target = await findTargetByReference(reference);
  if (!target.doc) return res.status(200).json({ received: true });

  if (event.event === "charge.success") {
    // Re-verify against Paystack's API rather than trusting the webhook
    // payload alone — the webhook says something happened, verification
    // confirms it actually did.
    const result = await paystackService.verify({ reference });
    if (result.success) {
      await markPaid(target, result.providerTransactionId);
    } else {
      await markFailed(target);
    }
  } else if (event.event === "charge.failed") {
    await markFailed(target);
  }

  res.status(200).json({ received: true });
});

// Flutterwave webhook — same public/unauthenticated shape, verified via a
// static shared-secret header instead of an HMAC signature.
exports.flutterwaveWebhook = asyncHandler(async (req, res) => {
  const verifHash = req.headers["verif-hash"];

  if (!flutterwaveService.verifyWebhookSignature(verifHash)) {
    throw new ApiError(401, "Invalid signature");
  }

  const event = req.body;
  const reference = event.data && event.data.tx_ref;
  if (!reference) return res.status(200).json({ received: true });

  const target = await findTargetByReference(reference);
  if (!target.doc) return res.status(200).json({ received: true });

  if (event.data.status === "successful") {
    // Re-verifies with Flutterwave AND checks reference/amount/currency match.
    const outcome = await reconcileFlutterwave(target, event.data.id);
    if (outcome === "mismatch") {
      console.error(`[payments] Flutterwave transaction ${event.data.id} does not match ${reference} — ignored`);
    }
  } else {
    await markFailed(target);
  }

  res.status(200).json({ received: true });
});

// Mock-mode only — simulates a gateway webhook so the full order/donation
// flow is testable with zero real payment keys. Refuses to run unless
// PAYMENT_MODE=mock, so this can never become a real-money backdoor.
exports.mockCallback = asyncHandler(async (req, res) => {
  if (!payments.isMock()) {
    throw new ApiError(403, "Mock payment callback is disabled outside PAYMENT_MODE=mock");
  }

  const { reference, outcome } = req.body;
  const target = await findTargetByReference(reference);

  if (!target.doc) {
    throw new ApiError(404, "No matching order or donation for that reference");
  }

  if (outcome === "success") {
    await markPaid(target, `mock-${Date.now()}`);
  } else {
    await markFailed(target);
  }

  res.json({ success: true, kind: target.kind, status: outcome });
});
