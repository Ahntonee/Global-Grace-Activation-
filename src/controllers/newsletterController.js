const Newsletter = require("../models/Newsletter");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Subscribe
exports.subscribe = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;

  const exists = await Newsletter.findOne({ email });

  if (exists) {
    throw new ApiError(400, "Email already subscribed.");
  }

  const subscriber = await Newsletter.create({
    email,
    fullName,
  });

  res.status(201).json({
    success: true,
    subscriber,
  });
});

// Get all subscribers
exports.getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Newsletter.find()
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    subscribers,
  });
});

// Get one subscriber
exports.getSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findById(
    req.params.id
  );

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }

  res.json({
    success: true,
    subscriber,
  });
});

// Unsubscribe
exports.unsubscribe = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findByIdAndUpdate(
    req.params.id,
    {
      status: "Unsubscribed",
      unsubscribedAt: new Date(),
    },
    {
      new: true,
    }
  );

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }

  res.json({
    success: true,
    subscriber,
  });
});

// Delete subscriber
exports.deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findById(
    req.params.id
  );

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }

  await subscriber.deleteOne();

  res.json({
    success: true,
    message: "Subscriber deleted successfully",
  });
});
