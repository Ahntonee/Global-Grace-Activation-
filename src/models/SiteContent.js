const mongoose = require("mongoose");

// One document per edited page item (text, image or video). The item
// definitions and their original values live in the page templates; a
// document here only exists once an admin has overridden something.
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    text: { type: String, default: "" },
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
