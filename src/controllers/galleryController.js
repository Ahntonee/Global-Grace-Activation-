const GalleryItem = require("../models/GalleryItem");
const { wantsAll } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

exports.createGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.create(req.body);
  res.status(201).json({ success: true, item });
});

exports.getGalleryItems = asyncHandler(async (req, res) => {
  const filter = wantsAll(req) ? {} : { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  const items = await GalleryItem.find(filter).populate("images").sort({ order: 1, createdAt: 1 });
  res.json({ success: true, items });
});

exports.getGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id).populate("images");
  if (!item) throw new ApiError(404, "Gallery item not found");
  res.json({ success: true, item });
});

exports.updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "Gallery item not found");
  res.json({ success: true, item });
});

exports.deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Gallery item not found");
  await item.deleteOne();
  res.json({ success: true, message: "Gallery item deleted successfully" });
});
