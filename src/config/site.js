/*
 * Public contact details and social links, set in .env so the client can
 * change them without touching code. Anything left blank is simply not shown
 * on the site (instead of displaying a fake number or a dead "#" link).
 */
const clean = (v) => (v || "").trim();
const digits = (v) => clean(v).replace(/[^\d]/g, "");

const phone = clean(process.env.SITE_PHONE);

module.exports = {
  phone,
  phoneTel: phone ? "+" + digits(phone) : "",
  whatsapp: digits(process.env.SITE_WHATSAPP),
  social: {
    instagram: clean(process.env.SITE_INSTAGRAM_URL),
    youtube: clean(process.env.SITE_YOUTUBE_URL),
    facebook: clean(process.env.SITE_FACEBOOK_URL),
    tiktok: clean(process.env.SITE_TIKTOK_URL),
  },
};
