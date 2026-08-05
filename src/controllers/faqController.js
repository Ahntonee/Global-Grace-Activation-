const Faq = require("../models/Faq");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

exports.createFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.create(req.body);

  res.status(201).json({
    success: true,
    faq,
  });
});

exports.getFaqs = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isPublished: true };
  if (req.query.context) filter.context = req.query.context;

  const faqs = await Faq.find(filter).sort({ order: 1, createdAt: 1 });

  res.json({
    success: true,
    faqs,
  });
});

exports.getFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);

  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }

  res.json({
    success: true,
    faq,
  });
});

exports.updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }

  res.json({
    success: true,
    faq,
  });
});

exports.deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);

  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }

  await faq.deleteOne();

  res.json({
    success: true,
    message: "FAQ deleted successfully",
  });
});
