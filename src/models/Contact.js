const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: String,

    subject: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "General",
        "Support",
        "Partnership",
        "Donation",
        "Complaint",
        "Testimony",
      ],
      default: "General",
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "New",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "New",
    },

    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", contactSchema);