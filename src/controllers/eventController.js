const Event = require("../models/Event");
const { wantsAll } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Create Event
exports.createEvent = asyncHandler(async (req, res) => {
  // Only one event should ever be "featured" (it drives the homepage hero
  // and the Events page flagship section) — unset any previous one first.
  if (req.body.featured) {
    await Event.updateMany({ featured: true }, { featured: false });
  }

  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    event,
  });
});

// Get all events
exports.getEvents = asyncHandler(async (req, res) => {
  const filter = wantsAll(req) ? {} : { isPublished: true };
  const events = await Event.find(filter)
    .populate("createdBy", "fullName email")
    .populate("featuredImage")
    .populate("flyers")
    .sort({ startDate: 1 });

  res.json({
    success: true,
    events,
  });
});

// Get single event
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    slug: req.params.slug,
    ...(req.user && req.user.role === "admin" ? {} : { isPublished: true }),
  })
    .populate("createdBy", "fullName email")
    .populate("featuredImage")
    .populate("flyers");

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  res.json({
    success: true,
    event,
  });
});

// Update event
exports.updateEvent = asyncHandler(async (req, res) => {
  if (req.body.featured) {
    await Event.updateMany({ featured: true, _id: { $ne: req.params.id } }, { featured: false });
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  res.json({
    success: true,
    event,
  });
});

// Delete event
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  await event.deleteOne();

  res.json({
    success: true,
    message: "Event deleted successfully",
  });
});
