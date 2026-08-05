const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
    },

    // Lets the same FAQ set be reused in more than one place (e.g. the
    // dedicated FAQs page and the shorter block on the Events page)
    context: {
      type: String,
      enum: ["general", "events"],
      default: "general",
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

module.exports = mongoose.model("Faq", faqSchema);
