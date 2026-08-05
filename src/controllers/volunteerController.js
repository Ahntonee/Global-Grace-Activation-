const Volunteer = require("../models/Volunteer");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Apply as Volunteer — public, no account required
exports.applyVolunteer = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    address,
    occupation,
    skills,
    department,
    availability,
  } = req.body;

  const exists = await Volunteer.findOne({
    email: (email || "").toLowerCase(),
  });

  if (exists) {
    throw new ApiError(400, "You have already applied.");
  }

  const volunteer = await Volunteer.create({
    fullName,
    email,
    phone,
    address,
    occupation,
    skills,
    department,
    availability,
    user: req.user ? req.user._id : null,
  });

  res.status(201).json({
    success: true,
    volunteer,
  });
});

// Get all volunteers (Admin)
exports.getVolunteers = asyncHandler(async (req, res) => {
  const volunteers = await Volunteer.find()
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    volunteers,
  });
});

// Get one volunteer
exports.getVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id)
    .populate("user", "fullName email");

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }

  res.json({
    success: true,
    volunteer,
  });
});

// Update volunteer
exports.updateVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }

  res.json({
    success: true,
    volunteer,
  });
});

// Delete volunteer
exports.deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }

  await volunteer.deleteOne();

  res.json({
    success: true,
    message: "Volunteer deleted successfully",
  });
});

// Approve volunteer
exports.approveVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    {
      status: "Approved",
    },
    {
      new: true,
    }
  );

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }

  res.json({
    success: true,
    volunteer,
  });
});

// Reject volunteer
exports.rejectVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    {
      status: "Rejected",
    },
    {
      new: true,
    }
  );

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found");
  }

  res.json({
    success: true,
    volunteer,
  });
});
