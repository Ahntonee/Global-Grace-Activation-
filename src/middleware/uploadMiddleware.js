const multer = require("multer");
const ApiError = require("../utils/apiError");

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB (Cloudinary's free-plan image ceiling)

// Images for flyers / photos / thumbnails, plus PDFs for digital downloads.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);

// Store file temporarily in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_BYTES,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new ApiError(415, "Unsupported file type. Please upload a JPG, PNG, WebP, GIF or PDF file."));
    }
    cb(null, true);
  },
});

/*
 * Wraps upload.single() so multer's own failures come back as clean JSON
 * with a human-readable message. Left unwrapped, an oversized file bubbled
 * up as a generic 500 (and the dropped connection looked like a network
 * error in the browser), which is what the admin saw as an "API error".
 */
function uploadSingle(fieldName) {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(413, `That file is too large. The maximum size is ${MAX_FILE_BYTES / 1024 / 1024}MB.`));
        }
        return next(new ApiError(400, `Upload failed: ${err.message}`));
      }

      next(err);
    });
  };
}

module.exports = upload;
module.exports.uploadSingle = uploadSingle;
module.exports.MAX_FILE_BYTES = MAX_FILE_BYTES;
