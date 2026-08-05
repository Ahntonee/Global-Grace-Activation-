const Order = require("../models/Order");
const Donation = require("../models/Donation");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const payments = require("../services/payments");
const { paystackService, flutterwaveService } = payments;

// References are generated as GGA-ORD-... / GGA-DON-... (see
// utils/generateReference.js), so the prefix alone tells us which
// collection to look in — no separate lookup table needed.
async function findTargetByReference(reference) {
  if (reference.startsWith("GGA-ORD-")) {
    return { kind: "order", doc: await Order.findOne({ paymentReference: reference }) };
  }
  if (reference.startsWith("GGA-DON-")) {
    return { kind: "donation", doc: await Donation.findOne({ paymentReference: reference }) };
  }
  return { kind: null, doc: null };
}

async function markPaid({ kind, doc }, providerTransactionId) {
  if (kind === "order") {
    doc.paymentStatus = "Paid";
    doc.providerTransactionId = providerTransactionId;

    // Digital items are delivered as soon as payment clears — no manual
    // fulfillment step needed for those specifically.
    doc.items
      .filter((i) => i.type === "digital")
      .forEach((i) => {
        if (!doc.digitalDeliveryLinks.some((l) => String(l.product) === String(i.product))) {
          doc.digitalDeliveryLinks.push({ product: i.product, deliveredAt: new Date() });
        }
      });

    await doc.save();
  } else if (kind === "donation") {
    doc.status = "Successful";
    doc.providerTransactionId = providerTransactionId;
    await doc.save();
  }
}

async function markFailed({ kind, doc }) {
  if (kind === "order") {
    doc.paymentStatus = "Failed";
    await doc.save();
  } else if (kind === "donation") {
    doc.status = "Failed";
    await doc.save();
  }
}

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
    const result = await flutterwaveService.verifyByTransactionId(event.data.id);
    if (result.success) {
      await markPaid(target, result.providerTransactionId);
    } else {
      await markFailed(target);
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
