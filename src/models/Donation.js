const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      fullName: { type: String, default: "" },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: String,
      isAnonymous: { type: Boolean, default: false },
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    fund: {
      type: String,
      enum: ["Offering", "Partnership", "Project Seed", "Missions", "Conference Support"],
      default: "Offering",
    },

    frequency: {
      type: String,
      enum: ["One-Time", "Monthly"],
      default: "One-Time",
    },

    paymentProvider: {
      type: String,
      enum: ["paystack", "flutterwave"],
      required: true,
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },

    providerTransactionId: String,

    status: {
      type: String,
      enum: ["Pending", "Successful", "Failed"],
      default: "Pending",
    },

    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Donation", donationSchema);
