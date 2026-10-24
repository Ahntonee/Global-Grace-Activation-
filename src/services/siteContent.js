/*
 * Editable page content.
 *
 * Every editable piece of the public site is declared right where it is
 * used, in the page template:
 *
 *   <%= txt('home.hero.line1', 'A global move of God.', 'Headline') %>
 *   <%- rich('home.who.body', 'First paragraph...', 'Paragraph') %>
 *   <img src="<%= cimg('home.who.image', '/images/worship-crowd-2.jpg', 'Photo') %>">
 *   <source src="<%= cvid('home.hero.video', '/hero-bg.mp4', 'Background video') %>">
 *
 * The 2nd argument is the original value shown until an admin changes it,
 * the 3rd is the label in the dashboard. At startup the templates are
 * scanned for these calls, which builds the list the admin screen shows —
 * so the dashboard can never drift out of sync with what the pages hold.
 * Admin edits are saved as SiteContent documents and override the original.
 */
const fs = require("fs");
const path = require("path");
const SiteContent = require("../models/SiteContent");

const VIEWS = path.join(__dirname, "..", "views");
const SCAN_DIRS = ["pages", "partials", "layouts"];
const STR = `'((?:[^'\\\\]|\\\\.)*)'`;
const CALL = new RegExp(`\\b(txt|rich|cimg|cvid)\\(\\s*${STR}\\s*,\\s*${STR}(?:\\s*,\\s*${STR})?\\s*\\)`, "g");

const TYPE_OF = { txt: "text", rich: "textarea", cimg: "image", cvid: "video" };

const PAGES = {
  home: "Home page",
  about: "About page",
  events: "Events page",
  speakers: "Speakers page",
  watch: "Watch Live page",
  give: "Give page",
  gallery: "Gallery page",
  contact: "Contact page",
  faqs: "FAQs page",
  prayer: "Prayer Request page",
  volunteer: "Volunteer page",
  testimonies: "Testimonies page",
  blog: "Blog page",
  shop: "Shop page",
  site: "Site-wide (logo & footer)",
};
const PAGE_ORDER = Object.keys(PAGES);

function unescapeJs(s) {
  return s.replace(/\\(n|'|\\)/g, (m, c) => (c === "n" ? "\n" : c));
}

function humanize(s) {
  return s.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

let registry = null;

function scan() {
  const fields = new Map();
  let order = 0;

  for (const dir of SCAN_DIRS) {
    const full = path.join(VIEWS, dir);
    if (!fs.existsSync(full)) continue;

    for (const file of fs.readdirSync(full).sort()) {
      if (!file.endsWith(".ejs")) continue;
      const src = fs.readFileSync(path.join(full, file), "utf8");
      let m;
      CALL.lastIndex = 0;
      while ((m = CALL.exec(src))) {
        const [, fn, rawKey, rawDefault, rawLabel] = m;
        const key = unescapeJs(rawKey);
        if (fields.has(key)) continue; // same item used twice (e.g. stats) — first wins
        const [page, section = "general", ...rest] = key.split(".");
        const last = rest.length ? rest.join(" ") : section;
        fields.set(key, {
          key,
          type: TYPE_OF[fn],
          default: unescapeJs(rawDefault),
          label: rawLabel ? unescapeJs(rawLabel) : humanize(last),
          page,
          section,
          order: order++,
        });
      }
    }
  }
  return fields;
}

function getRegistry() {
  if (!registry) registry = scan();
  return registry;
}

// [{ page, title, sections: [{ section, title, fields: [...] }] }]
function getGroups() {
  const byPage = new Map();
  for (const f of getRegistry().values()) {
    if (!byPage.has(f.page)) byPage.set(f.page, new Map());
    const sections = byPage.get(f.page);
    if (!sections.has(f.section)) sections.set(f.section, []);
    sections.get(f.section).push(f);
  }

  const pages = [...byPage.keys()].sort((a, b) => {
    const ia = PAGE_ORDER.indexOf(a);
    const ib = PAGE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return pages.map((page) => ({
    page,
    title: PAGES[page] || humanize(page),
    sections: [...byPage.get(page).entries()].map(([section, fields]) => ({
      section,
      title: humanize(section),
      fields: fields.sort((x, y) => x.order - y.order),
    })),
  }));
}

// ---- overrides (cached briefly; cleared whenever the admin saves) ----
const TTL_MS = 20 * 1000;
let cache = null;
let cachedAt = 0;

async function getOverrides() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  const map = {};
  try {
    const docs = await SiteContent.find({}).populate("media", "url originalName format").lean();
    docs.forEach((d) => {
      map[d.key] = {
        text: d.text || "",
        url: d.media && d.media.url ? d.media.url : "",
        media: d.media || null,
      };
    });
  } catch (err) {
    console.error("[siteContent] could not load overrides:", err.message);
    return cache || {};
  }

  cache = map;
  cachedAt = Date.now();
  return map;
}

function clearCache() {
  cache = null;
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Template helpers bound to one request's overrides.
function makeHelpers(overrides) {
  const text = (key, def) => (overrides[key] && overrides[key].text ? overrides[key].text : def);
  const media = (key, def) => (overrides[key] && overrides[key].url ? overrides[key].url : def);
  return {
    txt: (key, def) => text(key, def),
    // multi-line text: escaped, line breaks kept (use with <%- %>)
    rich: (key, def) => escapeHtml(text(key, def)).replace(/\r?\n/g, "<br>"),
    cimg: (key, def) => media(key, def),
    cvid: (key, def) => media(key, def),
  };
}

module.exports = { getRegistry, getGroups, getOverrides, clearCache, makeHelpers, PAGES };
