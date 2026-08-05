const Prayer = require("../models/Prayer");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Submit Prayer Request
exports.submitPrayer = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    category,
    request,
    isAnonymous,
    isConfidential,
  } = req.body;

  const prayer = await Prayer.create({
    fullName,
    email,
    phone,
    category,
    request,
    isAnonymous,
    isConfidential,
  });

  res.status(201).json({
    success: true,
    prayer,
  });
});

// Get All Prayer Requests
exports.getPrayers = asyncHandler(async (req, res) => {
  const prayers = await Prayer.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    prayers,
  });
});

// Get Single Prayer Request
exports.getPrayer = asyncHandler(async (req, res) => {
  const prayer = await Prayer.findById(req.params.id);

  if (!prayer) {
    throw new ApiError(404, "Prayer request not found");
  }

  res.json({
    success: true,
    prayer,
  });
});

// Update Prayer
exports.updatePrayer = asyncHandler(async (req, res) => {
  const prayer = await Prayer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!prayer) {
    throw new ApiError(404, "Prayer request not found");
  }

  res.json({
    success: true,
    prayer,
  });
});

// Delete Prayer
exports.deletePrayer = asyncHandler(async (req, res) => {
  const prayer = await Prayer.findById(req.params.id);

  if (!prayer) {
    throw new ApiError(404, "Prayer request not found");
  }

  await prayer.deleteOne();

  res.json({
    success: true,
    message: "Prayer request deleted successfully",
  });
});
