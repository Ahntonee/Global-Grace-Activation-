const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

exports.shopList = asyncHandler(async (req, res) => {
  const filter = { isPublished: true, type: { $in: ["physical", "digital"] } };
  if (req.query.type) filter.type = req.query.type;

  const products = await Product.find(filter).populate("images").sort({ createdAt: -1 });

  res.render("pages/shop", {
    title: "Shop | Global Grace Activation",
    description: "Merchandise, resources and digital downloads from Global Grace Activation.",
    currentPage: "shop",
    products,
  });
});

exports.productDetail = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isPublished: true })
    .populate("images")
    .populate("relatedEvent", "title slug");

  if (!product) {
    return res.status(404).render("pages/404", { title: "Product not found" });
  }

  res.render("pages/product-detail", {
    title: `${product.name} | Shop | Global Grace Activation`,
    description: product.shortDescription || product.description,
    currentPage: "shop",
    product,
  });
});

exports.cart = (req, res) => {
  res.render("pages/cart", {
    title: "Your Cart | Global Grace Activation",
    description: "Review your cart before checkout.",
    currentPage: "shop",
  });
};

exports.checkout = (req, res) => {
  res.render("pages/checkout", {
    title: "Checkout | Global Grace Activation",
    description: "Complete your order.",
    currentPage: "shop",
    paymentMode: process.env.PAYMENT_MODE === "mock",
  });
};

exports.orderConfirmation = (req, res) => {
  res.render("pages/order-confirmation", {
    title: "Order Confirmation | Global Grace Activation",
    description: "Your order confirmation.",
    currentPage: "shop",
    reference: req.query.reference || "",
  });
};

exports.giveConfirmation = (req, res) => {
  res.render("pages/give-confirmation", {
    title: "Thank You | Global Grace Activation",
    description: "Your giving confirmation.",
    currentPage: "give",
    reference: req.query.reference || "",
  });
};

// Mock-mode-only simulated gateway checkout page — replaces the real
// Paystack/Flutterwave hosted page when PAYMENT_MODE=mock, so the full
// order/donation flow can be tested without real gateway keys.
exports.mockCheckout = (req, res) => {
  if (process.env.PAYMENT_MODE !== "mock") {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  res.render("pages/mock-checkout", {
    layout: "layouts/blank",
    title: "Mock Checkout",
    reference: req.query.reference || "",
    provider: req.query.provider || "",
  });
};
