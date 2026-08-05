const Page = require("../models/Page");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Create page
exports.createPage = asyncHandler(async (req, res) => {
  const page = await Page.create(req.body);

  res.status(201).json({
    success: true,
    page,
  });
});

// Get all pages
exports.getPages = asyncHandler(async (req, res) => {
  const pages = await Page.find();

  res.json({
    success: true,
    pages,
  });
});

// Get one page by slug
exports.getPage = asyncHandler(async (req, res) => {
  const page = await Page.findOne({
    slug: req.params.slug,
  });

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  res.json({
    success: true,
    page,
  });
});

// Update page
exports.updatePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  res.json({
    success: true,
    page,
  });
});

// Delete page
exports.deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndDelete(req.params.id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  res.json({
    success: true,
    message: "Page deleted successfully",
  });
});
