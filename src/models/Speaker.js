const mongoose = require("mongoose");

const speakerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    // "conference-speaker" shows on the Speakers page (and, if featured,
    // on the homepage highlight); "leadership" shows on the About page's
    // team grid instead. Kept as one model since both are the same shape.
    type: {
      type: String,
      enum: ["conference-speaker", "leadership"],
      default: "conference-speaker",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    bio: {
      type: String,
      default: "",
    },

    photo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    socialLinks: {
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      spotify: { type: String, default: "" },
      facebook: { type: String, default: "" },
      tiktok: { type: String, default: "" },
    },

    order: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Speaker", speakerSchema);
