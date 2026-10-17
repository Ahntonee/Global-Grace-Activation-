const Testimony = require("../models/Testimony");
const { wantsAll } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Admin-created/edited testimony (published directly)
exports.createTestimony = asyncHandler(async (req, res) => {
  const testimony = await Testimony.create(req.body);

  res.status(201).json({
    success: true,
    testimony,
  });
});

// Public submission — goes in unpublished until an admin reviews it
exports.submitTestimony = asyncHandler(async (req, res) => {
  const { title, category, location, body, fullName, isAnonymous } = req.body;

  const testimony = await Testimony.create({
    title,
    category,
    location,
    body,
    submittedBy: {
      fullName: isAnonymous ? "" : fullName,
      isAnonymous: !!isAnonymous,
    },
    isPublished: false,
  });

  res.status(201).json({
    success: true,
    testimony,
  });
});

exports.getTestimonies = asyncHandler(async (req, res) => {
  const filter = wantsAll(req) ? {} : { isPublished: true };

  const testimonies = await Testimony.find(filter)
    .populate("thumbnail")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    testimonies,
  });
});

exports.getTestimony = asyncHandler(async (req, res) => {
  const testimony = await Testimony.findById(req.params.id).populate("thumbnail");

  if (!testimony) {
    throw new ApiError(404, "Testimony not found");
  }

  res.json({
    success: true,
    testimony,
  });
});

exports.updateTestimony = asyncHandler(async (req, res) => {
  const testimony = await Testimony.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!testimony) {
    throw new ApiError(404, "Testimony not found");
  }

  res.json({
    success: true,
    testimony,
  });
});

exports.deleteTestimony = asyncHandler(async (req, res) => {
  const testimony = await Testimony.findById(req.params.id);

  if (!testimony) {
    throw new ApiError(404, "Testimony not found");
  }

  await testimony.deleteOne();

  res.json({
    success: true,
    message: "Testimony deleted successfully",
  });
});
