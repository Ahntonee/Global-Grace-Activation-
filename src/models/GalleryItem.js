const mongoose = require("mongoose");

// One admin-managed gallery entry. An entry can hold several photos (an
// "album": one caption and category shared by all of them) or a single photo,
// and optionally a video link. The public Gallery page turns every photo into
// its own tile.
const galleryItemSchema = new mongoose.Schema(
  {
    caption: { type: String, default: "", trim: true },

    category: {
      type: String,
      enum: ["photo", "video", "highlight"],
      default: "photo",
    },

    // Uploaded pictures (Media Library ids).
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],

    // Picture that ships with the site (e.g. /images/worship-crowd-1.jpg).
    // Only used when nothing has been uploaded for the entry.
    imageUrl: { type: String, default: "", trim: true },

    // YouTube / Vimeo link — the tile opens the video instead of the photo.
    videoUrl: { type: String, default: "", trim: true },

    // Shows the first picture as a larger tile.
    wide: { type: Boolean, default: false },

    order: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryItem", galleryItemSchema);
