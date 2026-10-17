const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const generateReference = require("../utils/generateReference");
const { calculateShippingFee } = require("../config/shipping");
const payments = require("../services/payments");
const { findTargetByReference, reconcileOnReturn } = require("../services/paymentReconcile");
const { DEFAULT_PROVIDER, isEnabled } = require("../config/paymentProviders");

// Public — guest checkout. Prices are always recomputed server-side from
// the current Product records; the client only sends product IDs and
// quantities, never prices, so a tampered request can't change the total.
exports.createOrder = asyncHandler(async (req, res) => {
  const { customer, items, shippingAddress } = req.body;
  const paymentProvider = req.body.paymentProvider || DEFAULT_PROVIDER;

  if (!customer || !customer.fullName || !customer.email) {
    throw new ApiError(400, "Customer name and email are required");
  }
  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "At least one item is required");
  }
  if (!isEnabled(paymentProvider)) {
    throw new ApiError(400, "That payment method isn't available right now");
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isPublished: true });
  const productsById = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = [];
  let requiresShipping = false;

  for (const line of items) {
    const product = productsById.get(String(line.productId));
    if (!product) {
      throw new ApiError(400, `Product ${line.productId} is not available`);
    }
    const quantity = Math.max(1, Number(line.quantity) || 1);

    if (product.type === "physical" && product.stock > 0 && quantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} of "${product.name}" left in stock`);
    }
    if (product.type === "physical") requiresShipping = true;

    orderItems.push({
      product: product._id,
      name: product.name,
      type: product.type,
      unitPrice: product.price,
      quantity,
      relatedEvent: product.relatedEvent || undefined,
    });
  }

  if (requiresShipping) {
    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
      throw new ApiError(400, "A shipping address is required for physical items");
    }
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shippingFee = requiresShipping ? calculateShippingFee(shippingAddress) : 0;
  const total = subtotal + shippingFee;

  const reference = generateReference("GGA-ORD");

  const order = await Order.create({
    orderNumber: reference,
    customer,
    items: orderItems,
    requiresShipping,
    shippingAddress: requiresShipping ? shippingAddress : undefined,
    subtotal,
    shippingFee,
    total,
    paymentProvider,
    paymentReference: reference,
  });

  const { checkoutUrl } = await payments.initiate({
    provider: paymentProvider,
    amount: total,
    email: customer.email,
    reference,
    callbackUrl: `${process.env.PAYMENT_CALLBACK_BASE_URL}/order-confirmation?reference=${reference}`,
    metadata: { orderId: String(order._id), type: "order" },
  });

  res.status(201).json({
    success: true,
    orderNumber: order.orderNumber,
    reference,
    checkoutUrl,
  });
});

// Public — the confirmation page polls this by reference (not by Mongo
// _id, which is never exposed to an unauthenticated client for orders).
exports.getOrderStatus = asyncHandler(async (req, res) => {
  if (req.query.transaction_id) {
    const target = await findTargetByReference(req.params.reference);
    await reconcileOnReturn(target, req.query.transaction_id);
  }

  const order = await Order.findOne({ paymentReference: req.params.reference }).select(
    "orderNumber paymentStatus fulfillmentStatus total currency items digitalDeliveryLinks requiresShipping"
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.json({ success: true, order });
});

// Admin
exports.getOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.fulfillmentStatus) filter.fulfillmentStatus = req.query.fulfillmentStatus;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const allowed = ["fulfillmentStatus", "notes"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const order = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  await order.deleteOne();
  res.json({ success: true, message: "Order deleted successfully" });
});
