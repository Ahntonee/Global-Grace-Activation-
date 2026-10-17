const cloudinary = require("../config/cloudinary");
const Media = require("../models/Media");
const streamifier = require("streamifier");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Upload Media
exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please upload a file");
  }

  const streamUpload = () => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "global-grace",
          // Without this, Cloudinary assumes "image" and rejects non-image
          // files (PDFs, etc.) outright — "auto" lets it detect and store
          // images/video/raw files correctly, since the Media library needs
          // to handle both product photos and digital-download PDFs.
          resource_type: "auto",
        },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  const result = await streamUpload();

  const media = await Media.create({
    url: result.secure_url,
    public_id: result.public_id,
    originalName: req.file.originalname,
    format: result.format,
    size: result.bytes,
    uploadedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    media,
  });
});

// Get all uploaded media
exports.getMedia = asyncHandler(async (req, res) => {
  const media = await Media.find()
    .populate("uploadedBy", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: media.length,
    media,
  });
});

// Get single media
exports.getSingleMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id)
    .populate("uploadedBy", "fullName email");

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  res.status(200).json({
    success: true,
    media,
  });
});

// Delete media
exports.deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  // Delete from Cloudinary — destroy() assumes "image" unless told the
  // resource type, and files uploaded with resource_type "auto" can have
  // landed as raw/video (it's in the stored URL).
  const resourceType = /\/(raw|video)\/upload\//.exec(media.url);
  await cloudinary.uploader.destroy(media.public_id, { resource_type: resourceType ? resourceType[1] : "image" });

  // Delete from MongoDB
  await media.deleteOne();

  res.status(200).json({
    success: true,
    message: "Media deleted successfully",
  });
});
