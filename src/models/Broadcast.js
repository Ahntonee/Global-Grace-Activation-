const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: ["YouTube", "Facebook", "Custom-HLS", "Zoom", "Other"],
      required: true,
    },

    embedUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Live", "Ended"],
      default: "Scheduled",
    },

    scheduledStart: Date,
    actualStart: Date,
    actualEnd: Date,

    // Flyer / thumbnail shown on the public Live page.
    thumbnail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    chatEnabled: {
      type: Boolean,
      default: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Broadcast", broadcastSchema);
