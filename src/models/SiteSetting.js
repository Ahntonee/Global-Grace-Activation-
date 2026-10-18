const mongoose = require("mongoose");

// One document (key "site") holding the public contact details and social
// links that the admin edits under Site Settings. Blank = hidden on the site.
const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    phone: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
