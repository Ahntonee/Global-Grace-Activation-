const Newsletter = require("../models/Newsletter");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const mail = require("../services/mail");

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

  mail.sendTemplate({
    to: email,
    subject: "You're subscribed — Global Grace Activation",
    template: "newsletter-welcome",
    data: {},
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

// Generic update — matches the create/list/get/update/delete convention
// every other module follows (dedicated unsubscribe stays below for the
// one-click admin action / public unsubscribe-link flow).
exports.updateSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
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
