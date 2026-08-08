const EventRegistration = require("../models/EventRegistration");
const Event = require("../models/Event");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const mail = require("../services/mail");

// Register for an event — public, no account required
exports.registerForEvent = asyncHandler(async (req, res) => {
  const { fullName, email, phone, country, guests, eventId, eventTitle } = req.body;

  let event = null;
  if (eventId) {
    event = await Event.findById(eventId);
  }

  const resolvedTitle = (event && event.title) || eventTitle || "GGA Global Conference 2026";

  const registration = await EventRegistration.create({
    event: event ? event._id : null,
    eventTitle: resolvedTitle,
    fullName,
    email,
    phone,
    country,
    guests,
  });

  if (event) {
    // Atomic $inc, not read-modify-write — under concurrent registrations
    // (e.g. hundreds of people registering in the same second), a
    // find-then-save pattern loses increments because two requests can read
    // the same starting count before either one commits its write.
    await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: 1 } });
  }

  res.status(201).json({
    success: true,
    registration,
  });

  mail.sendTemplate({
    to: email,
    subject: `You're registered — ${resolvedTitle}`,
    template: "event-registration-confirmation",
    data: { fullName, eventTitle: resolvedTitle, guests: guests || "Just me" },
  });
  mail.sendTemplate({
    to: process.env.MAIL_ADMIN_TO,
    subject: `New event registration: ${resolvedTitle}`,
    template: "event-registration-admin-notification",
    data: {
      fullName,
      email,
      phone,
      country,
      guests: guests || "Just me",
      eventTitle: resolvedTitle,
      adminUrl: `${process.env.FRONTEND_URL}/admin/eventRegistrations`,
    },
  });
});

// Get all registrations (Admin)
exports.getRegistrations = asyncHandler(async (req, res) => {
  const registrations = await EventRegistration.find()
    .populate("event", "title slug")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    eventRegistrations: registrations,
  });
});

// Get one registration (Admin)
exports.getRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findById(req.params.id).populate("event", "title slug");

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  res.json({
    success: true,
    registration,
  });
});

// Update registration (Admin)
exports.updateRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  res.json({
    success: true,
    registration,
  });
});

// Delete registration (Admin)
exports.deleteRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findById(req.params.id);

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  await registration.deleteOne();

  res.json({
    success: true,
    message: "Registration deleted successfully",
  });
});
