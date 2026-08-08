const Order = require("../models/Order");
const Donation = require("../models/Donation");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const payments = require("../services/payments");
const mail = require("../services/mail");
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
  // Payment gateways deliver webhooks at-least-once — a timeout or non-200
  // response triggers a retry of the exact same event. Without this guard,
  // a retried "charge.success" re-runs the whole branch below and re-sends
  // the receipt email (and re-verifies with the provider) every time.
  if (kind === "order" && doc.paymentStatus === "Paid") return;
  if (kind === "donation" && doc.status === "Successful") return;

  if (kind === "order") {
    doc.paymentStatus = "Paid";
    doc.providerTransactionId = providerTransactionId;

    // Digital items are delivered as soon as payment clears — no manual
    // fulfillment step needed for those specifically. The actual asset URL
    // comes from the product's digitalAsset (Media) — previously this only
    // recorded *that* delivery happened, never the URL to deliver.
    const digitalItems = doc.items.filter((i) => i.type === "digital");
    if (digitalItems.length) {
      const products = await Product.find({ _id: { $in: digitalItems.map((i) => i.product) } }).populate("digitalAsset");
      const productsById = new Map(products.map((p) => [String(p._id), p]));

      digitalItems.forEach((i) => {
        if (doc.digitalDeliveryLinks.some((l) => String(l.product) === String(i.product))) return;
        const product = productsById.get(String(i.product));
        doc.digitalDeliveryLinks.push({
          product: i.product,
          url: product && product.digitalAsset ? product.digitalAsset.url : undefined,
          deliveredAt: new Date(),
        });
      });
    }

    await doc.save();

    mail.sendTemplate({
      to: doc.customer.email,
      subject: `Order confirmed — ${doc.orderNumber}`,
      template: "order-receipt",
      data: {
        customerName: doc.customer.fullName,
        orderNumber: doc.orderNumber,
        items: doc.items,
        total: doc.total,
        requiresShipping: doc.requiresShipping,
        digitalLinks: doc.digitalDeliveryLinks
          .filter((l) => l.url)
          .map((l) => {
            const item = doc.items.find((i) => String(i.product) === String(l.product));
            return { name: item ? item.name : "Digital item", url: l.url };
          }),
      },
    });
  } else if (kind === "donation") {
    doc.status = "Successful";
    doc.providerTransactionId = providerTransactionId;
    await doc.save();

    mail.sendTemplate({
      to: doc.donor.email,
      subject: "Thank you for giving — Global Grace Activation",
      template: "donation-receipt",
      data: {
        donorName: doc.donor.isAnonymous ? null : doc.donor.fullName,
        amount: doc.amount,
        fund: doc.fund,
        frequency: doc.frequency,
        reference: doc.paymentReference,
      },
    });
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
