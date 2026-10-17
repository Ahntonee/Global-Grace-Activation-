const Product = require("../models/Product");
const { wantsAll } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, product });
});

exports.getProducts = asyncHandler(async (req, res) => {
  const filter = wantsAll(req) ? {} : { isPublished: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.relatedEvent) filter.relatedEvent = req.query.relatedEvent;

  const products = await Product.find(filter)
    .populate("images")
    .populate("digitalAsset")
    .populate("relatedEvent", "title slug")
    .sort({ createdAt: -1 });

  res.json({ success: true, products });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    ...(req.user && req.user.role === "admin" ? {} : { isPublished: true }),
  })
    .populate("images")
    .populate("relatedEvent", "title slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await product.deleteOne();

  res.json({ success: true, message: "Product deleted successfully" });
});
