const SiteContent = require("../models/SiteContent");
const Media = require("../models/Media");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { getRegistry, getGroups, getOverrides, clearCache } = require("../services/siteContent");

const MAX_TEXT = 3000;

// Admin — every editable item for one page, with its saved override.
exports.getPageContent = asyncHandler(async (req, res) => {
  const group = getGroups().find((g) => g.page === req.params.page);
  if (!group) throw new ApiError(404, "Unknown page");

  const overrides = await getOverrides();

  const sections = group.sections.map((s) => ({
    section: s.section,
    title: s.title,
    fields: s.fields.map((f) => {
      const o = overrides[f.key];
      return {
        key: f.key,
        type: f.type,
        label: f.label,
        default: f.default,
        text: o ? o.text : "",
        media: o && o.media ? { _id: String(o.media._id), url: o.media.url, originalName: o.media.originalName || "" } : null,
      };
    }),
  }));

  res.json({ success: true, page: group.page, title: group.title, sections });
});

// Admin — save edits. Body: { items: [ { key, text? , media? (id | null) } ] }
// (a list rather than an object keyed by "home.hero.line1": the request
// sanitizer strips any field name that contains a dot.)
// Empty text / null media removes the override, so the original value returns.
exports.savePageContent = asyncHandler(async (req, res) => {
  const registry = getRegistry();
  const items = req.body && req.body.items;
  if (!Array.isArray(items)) throw new ApiError(400, "Nothing to save");
  if (items.length > 500) throw new ApiError(400, "Too many items in one save");

  const ops = [];
  for (const v of items) {
    const key = v && typeof v.key === "string" ? v.key : "";
    const field = registry.get(key);
    if (!field || field.page !== req.params.page) throw new ApiError(400, `Unknown item: ${key}`);

    if (field.type === "text" || field.type === "textarea") {
      const text = typeof v.text === "string" ? v.text.replace(/\r\n/g, "\n").trim() : "";
      if (text.length > MAX_TEXT) throw new ApiError(400, `"${field.label}" is too long (max ${MAX_TEXT} characters)`);
      ops.push(text ? SiteContent.updateOne({ key }, { $set: { text, media: null } }, { upsert: true }) : SiteContent.deleteOne({ key }));
    } else {
      const mediaId = v.media || null;
      if (!mediaId) {
        ops.push(SiteContent.deleteOne({ key }));
        continue;
      }
      const media = await Media.findById(mediaId).select("_id");
      if (!media) throw new ApiError(400, `The file chosen for "${field.label}" no longer exists — please upload it again`);
      ops.push(SiteContent.updateOne({ key }, { $set: { media: media._id, text: "" } }, { upsert: true }));
    }
  }

  await Promise.all(ops);
  clearCache();

  res.json({ success: true });
});

exports.listPages = (req, res) => {
  res.json({ success: true, pages: getGroups().map((g) => ({ page: g.page, title: g.title, items: g.sections.reduce((n, s) => n + s.fields.length, 0) })) });
};
