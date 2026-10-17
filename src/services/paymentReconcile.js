/*
 * Turning a gateway's "this payment happened" into our own records.
 * Shared by the webhook handlers and by the confirmation-page lookups, so a
 * donation/order is marked paid by whichever of the two reaches us first.
 */
const Order = require("../models/Order");
const Donation = require("../models/Donation");
const Product = require("../models/Product");
const mail = require("./mail");
const payments = require("./payments");

// References are generated as GGA-ORD-... / GGA-DON-... (see
// utils/generateReference.js), so the prefix alone tells us which
// collection to look in — no separate lookup table needed.
async function findTargetByReference(reference) {
  if (typeof reference !== "string") return { kind: null, doc: null };
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
    // comes from the product's digitalAsset (Media).
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
        currency: doc.currency || "NGN",
        fund: doc.fund,
        frequency: doc.frequency,
        reference: doc.paymentReference,
      },
    });
  }
}

async function markFailed({ kind, doc }) {
  // Never downgrade a payment that has already cleared.
  if (kind === "order" && doc.paymentStatus !== "Paid") {
    doc.paymentStatus = "Failed";
    await doc.save();
  } else if (kind === "donation" && doc.status !== "Successful") {
    doc.status = "Failed";
    await doc.save();
  }
}

// The transaction Flutterwave reports must be for THIS record: same
// reference, same currency, and at least the amount we asked for. Without
// this a customer could pay a trivial amount (or a different transaction)
// and have a large order/donation marked as paid.
function flutterwaveMatches({ kind, doc }, raw) {
  if (!raw) return false;
  const expectedAmount = kind === "order" ? doc.total : doc.amount;
  const expectedCurrency = (doc.currency || "NGN").toUpperCase();
  const reference = kind === "order" ? doc.paymentReference : doc.paymentReference;

  return (
    raw.tx_ref === reference &&
    String(raw.currency || "").toUpperCase() === expectedCurrency &&
    Number(raw.amount) >= Number(expectedAmount)
  );
}

/*
 * Verifies a Flutterwave transaction id against Flutterwave's API and, if it
 * is a genuine, matching, successful payment for this record, marks it paid.
 * Returns "paid" | "failed" | "pending" | "mismatch".
 */
async function reconcileFlutterwave(target, transactionId) {
  const result = await payments.flutterwaveService.verifyByTransactionId(transactionId);

  if (!flutterwaveMatches(target, result.raw)) return "mismatch";

  if (result.success) {
    await markPaid(target, result.providerTransactionId);
    return "paid";
  }
  if (result.raw && result.raw.status === "failed") {
    await markFailed(target);
    return "failed";
  }
  return "pending";
}

function isPending({ kind, doc }) {
  return kind === "order" ? doc.paymentStatus === "Pending" : doc.status === "Pending";
}

/*
 * Called when the customer lands back on our confirmation page. If the
 * webhook hasn't arrived yet (or isn't configured), the transaction_id
 * Flutterwave appended to the redirect lets us confirm the payment
 * ourselves — safely, because we re-verify it with Flutterwave.
 */
async function reconcileOnReturn(target, transactionId) {
  if (!target.doc || !isPending(target)) return;
  if (payments.isMock()) return;
  if (target.doc.paymentProvider !== "flutterwave") return;
  if (!/^\d{3,20}$/.test(String(transactionId || ""))) return;

  try {
    await reconcileFlutterwave(target, transactionId);
  } catch (err) {
    // Never fail the status lookup because verification had a hiccup — the
    // webhook (or the next poll) will still settle it.
    console.error("[payments] return-reconcile failed:", err.message);
  }
}

module.exports = {
  findTargetByReference,
  markPaid,
  markFailed,
  flutterwaveMatches,
  reconcileFlutterwave,
  reconcileOnReturn,
};
