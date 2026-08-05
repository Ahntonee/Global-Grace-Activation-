const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Snapshot at purchase time — survives the product being edited/removed later
    name: String,
    type: {
      type: String,
      enum: ["physical", "digital", "event-addon"],
    },
    unitPrice: Number,
    quantity: {
      type: Number,
      default: 1,
    },
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: String,
    },

    // Guest checkout is supported — no account required
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    items: [orderItemSchema],

    requiresShipping: {
      type: Boolean,
      default: false,
    },

    shippingAddress: {
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      country: { type: String, default: "Nigeria" },
      phone: String,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    shippingFee: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    paymentProvider: {
      type: String,
      enum: ["paystack", "flutterwave"],
      required: true,
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },

    providerTransactionId: String,

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    fulfillmentStatus: {
      type: String,
      enum: ["Unfulfilled", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Unfulfilled",
    },

    digitalDeliveryLinks: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        url: String,
        deliveredAt: Date,
      },
    ],

    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
