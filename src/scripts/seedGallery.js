/*
 * One-off: copies the 10 pictures that were fixed slots on the Gallery page into
 * the Gallery section of the admin dashboard, so they can be edited, re-ordered,
 * replaced or removed there.
 *
 * If someone already replaced a slot's picture or caption through Page Content,
 * that picture/caption is carried over — only slots nobody touched fall back to
 * the picture that shipped with the site. Safe to run more than once: it does
 * nothing if the gallery already has any items.
 *
 *   node src/scripts/seedGallery.js
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const GalleryItem = require("../models/GalleryItem");
const SiteContent = require("../models/SiteContent");
require("../models/Media");

const DEFAULTS = [
  ["GGA 2025 — Opening Night", "/images/worship-crowd-1.jpg", true, "photo"],
  ["Worship Under the Lights", "/images/worship-stage.jpg", false, "photo"],
  ["Altar Call, Night Two", "/images/conference-arena.jpg", false, "photo"],
  ["Nations Flag Procession", "/images/worship-team.jpg", false, "photo"],
  ["Prayer Room Moments", "/images/prayer-hands.jpg", false, "photo"],
  ["Crowd at Solution Arena", "/images/worship-crowd-2.jpg", true, "photo"],
  ["Backstage with the Team", "/images/prayer-gathering.jpg", false, "photo"],
  ["Volunteer Squad 2025", "/images/hero-bg.jpg", false, "photo"],
  ["Highlight Reel — Night One", "/images/pastor-podium.jpg", false, "highlight"],
  ["Kids Activation Corner", "/images/speaker-avatar.jpg", false, "photo"],
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await GalleryItem.countDocuments();
  if (existing) {
    console.log(`Gallery already has ${existing} item(s) — nothing to do.`);
    return;
  }

  const keys = DEFAULTS.flatMap((_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return [`gallery.photo${n}.image`, `gallery.photo${n}.caption`];
  });
  const overrides = {};
  (await SiteContent.find({ key: { $in: keys } }).lean()).forEach((d) => (overrides[d.key] = d));

  let carried = 0;
  const docs = DEFAULTS.map(([caption, imageUrl, wide, category], i) => {
    const n = String(i + 1).padStart(2, "0");
    const img = overrides[`gallery.photo${n}.image`];
    const cap = overrides[`gallery.photo${n}.caption`];
    const doc = { caption: (cap && cap.text) || caption, wide, category, order: i + 1, isPublished: true };
    if (img && img.media) {
      doc.images = [img.media];
      carried++;
    } else {
      doc.imageUrl = imageUrl;
    }
    return doc;
  });

  await GalleryItem.insertMany(docs);
  console.log(`Added ${docs.length} gallery items (${carried} with pictures carried over from Page Content).`);
})()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
