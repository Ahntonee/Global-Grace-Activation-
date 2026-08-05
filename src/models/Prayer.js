const mongoose = require("mongoose");

const prayerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: function () {
        return !this.isAnonymous;
      },
    },

    email: {
      type: String,
    },

    phone: {
      type: String,
    },

    category: {
      type: String,
      enum: [
        "Healing",
        "Family",
        "Marriage",
        "Financial",
        "Salvation",
        "Thanksgiving",
        "Deliverance",
        "Other",
      ],
      default: "Other",
    },

    request: {
      type: String,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    isConfidential: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Prayed For",
        "Completed",
      ],
      default: "Pending",
    },

    adminNotes: {
      type: String,
      default: "",
    },

    prayedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Prayer", prayerSchema);