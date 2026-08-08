const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    // Snapshot of the event title at registration time — kept even if the
    // registration isn't tied to a specific Event (e.g. the generic
    // "Register Now" nav button) or the event is later renamed/removed.
    eventTitle: {
      type: String,
      required: true,
      trim: true,
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

    country: {
      type: String,
      required: true,
    },

    guests: {
      type: String,
      enum: ["Just me", "2 people", "3 people", "4+ people"],
      default: "Just me",
    },

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
