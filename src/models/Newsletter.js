const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Subscribed",
        "Unsubscribed",
      ],
      default: "Subscribed",
    },

    source: {
      type: String,
      default: "Website",
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },

    unsubscribedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Newsletter",
  newsletterSchema
);

