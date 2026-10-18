const SiteSetting = require("../models/SiteSetting");
const envDefaults = require("../config/site");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { clearCache } = require("../services/siteSettings");

const FIELDS = ["phone", "whatsapp", "instagram", "youtube", "facebook", "tiktok"];

// Admin — current values (falls back to .env values until first save).
exports.getSettings = asyncHandler(async (req, res) => {
  const doc = await SiteSetting.findOne({ key: "site" }).lean();
  const settings = doc
    ? Object.fromEntries(FIELDS.map((f) => [f, doc[f] || ""]))
    : { phone: envDefaults.phone, whatsapp: envDefaults.whatsapp, ...envDefaults.social };

  res.json({ success: true, settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const clean = {};
  FIELDS.forEach((f) => {
    clean[f] = typeof req.body[f] === "string" ? req.body[f].trim() : "";
  });

  const phoneDigits = clean.phone.replace(/[^\d]/g, "");
  if (clean.phone && (phoneDigits.length < 7 || phoneDigits.length > 15 || !/^[+\d\s().-]+$/.test(clean.phone))) {
    throw new ApiError(400, "Enter the phone number with its country code, e.g. +234 803 000 0000");
  }
  const waDigits = clean.whatsapp.replace(/[^\d]/g, "");
  if (clean.whatsapp && (waDigits.length < 7 || waDigits.length > 15 || !/^[+\d\s().-]+$/.test(clean.whatsapp))) {
    throw new ApiError(400, "Enter the WhatsApp number with its country code, e.g. +234 803 000 0000");
  }
  for (const f of ["instagram", "youtube", "facebook", "tiktok"]) {
    if (clean[f] && !/^https?:\/\/\S+$/i.test(clean[f])) {
      throw new ApiError(400, `The ${f[0].toUpperCase() + f.slice(1)} link must be a full web address starting with https://`);
    }
  }

  const settings = await SiteSetting.findOneAndUpdate({ key: "site" }, { $set: clean }, { new: true, upsert: true, setDefaultsOnInsert: true });
  clearCache();

  res.json({ success: true, settings: Object.fromEntries(FIELDS.map((f) => [f, settings[f] || ""])) });
});
