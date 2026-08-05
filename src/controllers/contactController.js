const Contact = require("../models/Contact");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Submit Contact Form
exports.submitContact = asyncHandler(async (req, res) => {
  const { fullName, email, phone, subject, category, message } = req.body;

  const contact = await Contact.create({
    fullName,
    email,
    phone,
    subject,
    category,
    message,
  });

  res.status(201).json({
    success: true,
    contact,
  });
});

// Get All Contacts
exports.getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    contacts,
  });
});

// Get Single Contact
exports.getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  res.json({
    success: true,
    contact,
  });
});

// Update Contact
exports.updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  res.json({
    success: true,
    contact,
  });
});

// Delete Contact
exports.deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  await contact.deleteOne();

  res.json({
    success: true,
    message: "Contact deleted successfully",
  });
});
