const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    broadcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broadcast",
      required: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    // Guests can chat without an account — this is a public ministry
    // stream, not gated content.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Soft-delete for moderation — admin can hide/unhide instead of
    // permanently destroying the record.
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ broadcast: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
