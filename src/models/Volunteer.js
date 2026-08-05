const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    // Optional — the public volunteer form doesn't require an account.
    // Set only when a logged-in member applies through an authenticated flow.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: String,

    occupation: String,

    skills: [
      {
        type: String,
      },
    ],

    department: {
      type: String,
      enum: [
        "Ushering & Guest Care",
        "Media & Production",
        "Prayer & Altar Ministry",
        "Logistics & Security",
        "Registration Desk",
        "Hospitality",
      ],
    },

    availability: {
      type: String,
      enum: [
        "Weekdays",
        "Weekends",
        "Anytime",
      ],
      default: "Anytime",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Volunteer", volunteerSchema);