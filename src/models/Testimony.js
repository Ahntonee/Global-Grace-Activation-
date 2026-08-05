const mongoose = require("mongoose");

const testimonySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Healing", "Breakthrough", "Salvation", "Restoration", "Deliverance", "Family"],
      default: "Healing",
    },

    location: {
      type: String,
      default: "",
    },

    body: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    submittedBy: {
      fullName: { type: String, default: "" },
      isAnonymous: { type: Boolean, default: false },
    },

    featured: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimony", testimonySchema);
