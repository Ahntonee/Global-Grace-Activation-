const crypto = require("crypto");

/*
 * Secret token for the live spreadsheet feed (Excel / Google Sheets can't
 * send a login cookie, so the feed URL itself carries a long random token).
 *
 * Set EXPORT_FEED_TOKEN in .env to choose your own; otherwise a stable token
 * is derived from JWT_SECRET so it works with zero extra configuration.
 * Changing either value invalidates every previously shared feed link.
 */
function getFeedToken() {
  if (process.env.EXPORT_FEED_TOKEN) return process.env.EXPORT_FEED_TOKEN;
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "").update("gga-export-feed-v1").digest("hex").slice(0, 48);
}

function verifyFeedToken(candidate) {
  if (!candidate || typeof candidate !== "string") return false;
  const expected = Buffer.from(getFeedToken());
  const given = Buffer.from(candidate);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

module.exports = { getFeedToken, verifyFeedToken };
