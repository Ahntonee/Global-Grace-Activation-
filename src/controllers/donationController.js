const Donation = require("../models/Donation");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const generateReference = require("../utils/generateReference");
const payments = require("../services/payments");

// Public
exports.createDonation = asyncHandler(async (req, res) => {
  const { donor, amount, fund, frequency, paymentProvider } = req.body;

  if (!donor || !donor.email) {
    throw new ApiError(400, "Donor email is required");
  }
  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }
  if (!["paystack", "flutterwave"].includes(paymentProvider)) {
    throw new ApiError(400, "A valid payment provider is required");
  }

  const reference = generateReference("GGA-DON");

  const donation = await Donation.create({
    donor,
    amount: Number(amount),
    fund,
    frequency,
    paymentProvider,
    paymentReference: reference,
  });

  const { checkoutUrl } = await payments.initiate({
    provider: paymentProvider,
    amount: donation.amount,
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
