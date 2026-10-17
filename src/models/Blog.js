const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    featuredImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    // Up to three flyers/images per post (the first one is the card thumbnail).
    images: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
      validate: [(v) => v.length <= 3, "A blog post can have at most 3 images"],
      default: [],
    },

    category: {
      type: String,
      default: "General",
    },

    tags: [
      {
        type: String,
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seoTitle: String,

    seoDescription: String,

    isPublished: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: true,
    },

    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);