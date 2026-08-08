const Contact = require("../models/Contact");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const mail = require("../services/mail");

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

  // Fire-and-forget — a mail failure must never affect the submission
  // that already succeeded and was already responded to above.
  mail.sendTemplate({
    to: email,
    subject: "We received your message — Global Grace Activation",
    template: "contact-confirmation",
    data: { fullName, subject, message },
  });
  mail.sendTemplate({
    to: process.env.MAIL_ADMIN_TO,
    subject: `New contact message: ${subject}`,
    template: "contact-admin-notification",
    data: {
      fullName,
      email,
      category,
      subject,
      message,
      adminUrl: `${process.env.FRONTEND_URL}/admin/contacts`,
    },
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
