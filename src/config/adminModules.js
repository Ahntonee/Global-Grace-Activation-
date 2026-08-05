/*
 * One config object per admin-manageable content type. Drives the generic
 * list/form views (src/views/admin/generic-list.ejs, generic-form.ejs) and
 * the generic client-side CRUD script (public/admin/crud.js), so adding a
 * new manageable content type is a config entry here, not a new set of
 * hand-written admin screens.
 */
module.exports = {
  pages: {
    label: "Pages",
    singular: "Page",
    apiBase: "/api/pages",
    idField: "slug",
    columns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, hint: "Must match the page route, e.g. \"about\"" },
      { name: "heroTitle", label: "Hero title", type: "text" },
      { name: "heroSubtitle", label: "Hero subtitle", type: "textarea", rows: 3 },
      { name: "content", label: "Body content (HTML)", type: "textarea", rows: 16, hint: "Raw HTML — rendered as-is on the page." },
      { name: "seoTitle", label: "SEO title (<title> tag)", type: "text" },
      { name: "seoDescription", label: "SEO description (meta description)", type: "textarea", rows: 2 },
      { name: "isPublished", label: "Published", type: "checkbox", default: true },
    ],
  },

  blogs: {
    label: "Blog Posts",
    singular: "Blog Post",
    apiBase: "/api/blogs",
    idField: "slug",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, required: true },
      { name: "content", label: "Content (HTML)", type: "textarea", rows: 16, required: true },
      { name: "category", label: "Category", type: "text", default: "General" },
      { name: "tags", label: "Tags (comma-separated)", type: "tags" },
      { name: "seoTitle", label: "SEO title", type: "text" },
      { name: "seoDescription", label: "SEO description", type: "textarea", rows: 2 },
      { name: "featured", label: "Featured", type: "checkbox" },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
  },

  events: {
    label: "Events",
    singular: "Event",
    apiBase: "/api/events",
    idField: "slug",
    columns: [
      { key: "title", label: "Title" },
      { key: "location", label: "Location" },
      { key: "startDate", label: "Start", type: "date" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "startDate", label: "Start date/time", type: "datetime-local", required: true },
      { name: "endDate", label: "End date/time", type: "datetime-local", required: true },
      { name: "isVirtual", label: "Virtual event", type: "checkbox" },
      { name: "meetingLink", label: "Meeting / stream link (if virtual)", type: "text" },
      { name: "capacity", label: "Capacity (0 = unlimited)", type: "number", default: 0 },
      { name: "featured", label: "Featured (flagship — only one at a time)", type: "checkbox" },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
  },

  speakers: {
    label: "Speakers & Leadership",
    singular: "Person",
    apiBase: "/api/speakers",
    idField: "_id",
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "type", label: "Type" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "role", label: "Role / title", type: "text", required: true },
      { name: "type", label: "Shows on", type: "select", options: ["conference-speaker", "leadership"], hint: "conference-speaker → Speakers page. leadership → About page team grid." },
      { name: "bio", label: "Bio", type: "textarea", rows: 3 },
      { name: "featured", label: "Featured on homepage (conference speakers only)", type: "checkbox" },
      { name: "order", label: "Display order", type: "number", default: 0 },
      { name: "socialLinks.instagram", label: "Instagram URL", type: "text" },
      { name: "socialLinks.youtube", label: "YouTube URL", type: "text" },
      { name: "socialLinks.spotify", label: "Spotify URL", type: "text" },
      { name: "isPublished", label: "Published", type: "checkbox", default: true },
    ],
  },

  testimonies: {
    label: "Testimonies",
    singular: "Testimony",
    apiBase: "/api/testimonies?all=true",
    apiBaseWrite: "/api/testimonies",
    idField: "_id",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "location", label: "Location" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["Healing", "Breakthrough", "Salvation", "Restoration", "Deliverance", "Family"] },
      { name: "location", label: "Location", type: "text" },
      { name: "body", label: "Full story", type: "textarea", rows: 6 },
      { name: "featured", label: "Featured", type: "checkbox" },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
  },

  faqs: {
    label: "FAQs",
    singular: "FAQ",
    apiBase: "/api/faqs?all=true",
    apiBaseWrite: "/api/faqs",
    idField: "_id",
    columns: [
      { key: "question", label: "Question" },
      { key: "context", label: "Context" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", rows: 4, required: true },
      { name: "context", label: "Shows on", type: "select", options: ["general", "events"], hint: "general → FAQs page. events → Events page FAQ block." },
      { name: "order", label: "Display order", type: "number", default: 0 },
      { name: "isPublished", label: "Published", type: "checkbox", default: true },
    ],
  },
};
