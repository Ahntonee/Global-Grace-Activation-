const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
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

    description: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["physical", "digital", "event-addon"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    compareAtPrice: Number,

    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
      },
    ],

    category: {
      type: String,
      default: "General",
    },

    tags: [String],

    sku: String,

    // Ignored for type:"digital" (unlimited by definition)
    stock: {
      type: Number,
      default: 0,
    },

    // Set when type === "digital" — delivered post-payment
    digitalAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
    },

    // When set, the shop shows a "Buy Now" button that sends the visitor to
    // this third-party page (Selar, Amazon, etc.) instead of the on-site cart.
    externalUrl: {
      type: String,
      default: "",
      trim: true,
      validate: [(v) => !v || /^https?:\/\/\S+$/i.test(v), "External purchase link must start with http:// or https://"],
    },

    // Physical shipping calc input
    weightGrams: Number,

    // Set when type === "event-addon"
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Product", productSchema);
