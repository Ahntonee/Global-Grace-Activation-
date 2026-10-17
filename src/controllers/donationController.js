const Donation = require("../models/Donation");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const generateReference = require("../utils/generateReference");
const payments = require("../services/payments");
const { findTargetByReference, reconcileOnReturn } = require("../services/paymentReconcile");
const { CODES, DEFAULT_CURRENCY } = require("../config/currencies");
const { DEFAULT_PROVIDER, isEnabled } = require("../config/paymentProviders");

// Public
exports.createDonation = asyncHandler(async (req, res) => {
  const { donor, amount, fund, frequency } = req.body;
  const paymentProvider = req.body.paymentProvider || DEFAULT_PROVIDER;
  const currency = String(req.body.currency || DEFAULT_CURRENCY).toUpperCase();

  if (!donor || !donor.email) {
    throw new ApiError(400, "Donor email is required");
  }
  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }
  if (!isEnabled(paymentProvider)) {
    throw new ApiError(400, "That payment method isn't available right now");
  }
  if (!CODES.includes(currency)) {
    throw new ApiError(400, "That currency isn't supported");
  }

  const reference = generateReference("GGA-DON");

  const donation = await Donation.create({
    donor,
    amount: Number(amount),
    currency,
    fund,
    frequency,
    paymentProvider,
    paymentReference: reference,
  });

  const { checkoutUrl } = await payments.initiate({
    provider: paymentProvider,
    amount: donation.amount,
    currency: donation.currency,
    email: donor.email,
    reference,
    callbackUrl: `${process.env.PAYMENT_CALLBACK_BASE_URL}/give/confirmation?reference=${reference}`,
    metadata: { donationId: String(donation._id), type: "donation" },
  });

  res.status(201).json({
    success: true,
    reference,
    checkoutUrl,
  });
});

exports.getDonationStatus = asyncHandler(async (req, res) => {
  // If the customer just came back from Flutterwave and the webhook hasn't
  // landed yet, confirm the payment now using the transaction_id on the
  // redirect (re-verified against Flutterwave — never trusted as-is).
  if (req.query.transaction_id) {
    const target = await findTargetByReference(req.params.reference);
    await reconcileOnReturn(target, req.query.transaction_id);
  }

  const donation = await Donation.findOne({ paymentReference: req.params.reference }).select(
    "amount currency fund status createdAt"
  );

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  res.json({ success: true, donation });
});

// Admin
exports.getDonations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const donations = await Donation.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, donations });
});

exports.getDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new ApiError(404, "Donation not found");
  res.json({ success: true, donation });
});

exports.deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new ApiError(404, "Donation not found");
  await donation.deleteOne();
  res.json({ success: true, message: "Donation deleted successfully" });
});
