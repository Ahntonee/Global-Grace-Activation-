const SiteSetting = require("../models/SiteSetting");
const envDefaults = require("../config/site");

const TTL_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;

function shape(src) {
  const digits = (v) => String(v || "").replace(/[^\d]/g, "");
  const phone = String(src.phone || "").trim();
  return {
    phone,
    phoneTel: phone ? "+" + digits(phone) : "",
    whatsapp: digits(src.whatsapp),
    social: {
      instagram: String(src.instagram || "").trim(),
      youtube: String(src.youtube || "").trim(),
      facebook: String(src.facebook || "").trim(),
      tiktok: String(src.tiktok || "").trim(),
    },
  };
}

// Saved settings win; until anything has been saved, the .env values
// (SITE_PHONE etc.) are used so nothing changes for existing deployments.
async function getSite() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  let doc = null;
  try {
    doc = await SiteSetting.findOne({ key: "site" }).lean();
  } catch (err) {
    // fall through to env defaults — never break a page over this
  }

  cache = doc
    ? shape(doc)
    : shape({ phone: envDefaults.phone, whatsapp: envDefaults.whatsapp, ...envDefaults.social });
  cachedAt = Date.now();
  return cache;
}

function clearCache() {
  cache = null;
}

module.exports = { getSite, clearCache };
