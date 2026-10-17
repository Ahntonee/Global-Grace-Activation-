const Speaker = require("../models/Speaker");
const { wantsAll } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

exports.createSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.create(req.body);

  res.status(201).json({
    success: true,
    speaker,
  });
});

exports.getSpeakers = asyncHandler(async (req, res) => {
  const filter = wantsAll(req) ? {} : { isPublished: true };
  if (req.query.type) filter.type = req.query.type;
  const speakers = await Speaker.find(filter)
    .populate("photo")
    .sort({ order: 1, createdAt: 1 });

  res.json({
    success: true,
    speakers,
  });
});

exports.getSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.findById(req.params.id).populate("photo");

  if (!speaker) {
    throw new ApiError(404, "Speaker not found");
  }

  res.json({
    success: true,
    speaker,
  });
});

exports.updateSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!speaker) {
    throw new ApiError(404, "Speaker not found");
  }

  res.json({
    success: true,
    speaker,
  });
});

exports.deleteSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.findById(req.params.id);

  if (!speaker) {
    throw new ApiError(404, "Speaker not found");
  }

  await speaker.deleteOne();

  res.json({
    success: true,
    message: "Speaker deleted successfully",
  });
});
