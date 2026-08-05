const Blog = require("../models/Blog");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Create Blog Post
exports.createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create({
    ...req.body,
    author: req.user._id,
    publishedAt: req.body.isPublished ? new Date() : null,
  });

  res.status(201).json({
    success: true,
    blog,
  });
});

// Get all blogs
exports.getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find()
    .populate("author", "fullName email")
    .populate("featuredImage")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    blogs,
  });
});

// Get one blog
exports.getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({
    slug: req.params.slug,
  })
    .populate("author", "fullName email")
    .populate("featuredImage");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  res.json({
    success: true,
    blog,
  });
});

// Update blog
exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  res.json({
    success: true,
    blog,
  });
});

// Delete blog
exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  await blog.deleteOne();

  res.json({
    success: true,
    message: "Blog deleted successfully",
  });
});
