/*
 * One config object per admin-manageable content type. Drives the generic
 * list/form views (src/views/admin/generic-list.ejs, generic-form.ejs) and
 * the generic client-side CRUD scripts (public/admin-assets/crud-*.js), so
 * adding a new manageable content type is a config entry here, not a new set
 * of hand-written admin screens.
 *
 * Field types: text, email, url, number, textarea, select, checkbox, tags,
 * datetime-local, image-upload, file-upload.
 *   - image-upload / file-upload take `max` (how many files) and `array`
 *     (true when the model stores an array of Media ids, false for one id).
 *   - select options can be plain strings or { value, label }.
 * Column extras: type "boolean" | "date", or `labels` to map stored values
 * to friendlier display text.
 * Module extras: `exportable` (Excel/CSV download), `liveFeed` (shows the
 * live spreadsheet link), `populateFields` (refs loaded for the edit form).
 */
const SPEAKER_TYPES = [
  { value: "conference-speaker", label: "Minister" },
  { value: "leadership", label: "Leadership" },
];

const GALLERY_TYPES = [
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "highlight", label: "Highlights" },
];

module.exports = {
  products: {
    label: "Products",
    singular: "Product",
    apiBase: "/api/products?all=true",
    apiBaseWrite: "/api/products",
    idField: "slug",
    // Populated so the edit form can show the currently-linked image/file,
    // not just its ObjectId.
    populateFields: ["images", "digitalAsset"],
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "price", label: "Price" },
      { key: "stock", label: "Stock" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "type", label: "Type", type: "select", options: ["physical", "digital", "event-addon"] },
      { name: "shortDescription", label: "Short description (shop grid)", type: "textarea", rows: 2 },
      { name: "description", label: "Full description (product page)", type: "textarea", rows: 5, required: true },
      { name: "price", label: "Price (NGN)", type: "number", required: true },
      { name: "compareAtPrice", label: "Compare-at price (optional, shows as struck-through)", type: "number" },
      { name: "externalUrl", label: "External purchase link (Selar, Amazon, other store)", type: "url", placeholder: "https://selar.com/your-product", hint: "Optional. When filled in, the shop shows a \"Buy Now\" button that sends visitors to this link instead of the on-site cart." },
      { name: "category", label: "Category", type: "text", default: "General" },
      { name: "tags", label: "Tags (comma-separated)", type: "tags" },
      { name: "sku", label: "SKU", type: "text" },
      { name: "stock", label: "Stock (physical only — ignored for digital)", type: "number", default: 0 },
      { name: "weightGrams", label: "Weight in grams (physical only, for future shipping calc)", type: "number" },
      { name: "images", label: "Product image", type: "image-upload", max: 1, array: true, hint: "One photo shown on the shop grid and product page." },
      { name: "digitalAsset", label: "Digital file (PDF)", type: "file-upload", accept: ".pdf,application/pdf", max: 1, array: false, hint: "The file customers receive after payment — used for digital products." },
      { name: "featured", label: "Featured", type: "checkbox" },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
  },

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
    apiBase: "/api/blogs?all=true",
    apiBaseWrite: "/api/blogs",
    idField: "slug",
    populateFields: ["images", "featuredImage"],
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "createdAt", label: "Created", type: "date" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, required: true },
      { name: "images", label: "Images / flyers (up to 3)", type: "image-upload", max: 3, array: true, hint: "Upload up to three images. The first one is used as the thumbnail on the blog page; all of them are shown on the post." },
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
    apiBase: "/api/events?all=true",
    apiBaseWrite: "/api/events",
    idField: "slug",
    populateFields: ["flyers", "featuredImage"],
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
      { name: "flyers", label: "Event flyers (up to 3)", type: "image-upload", max: 3, array: true, hint: "Upload up to three flyers. They are shown on the Events page." },
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
    apiBase: "/api/speakers?all=true",
    apiBaseWrite: "/api/speakers",
    idField: "_id",
    populateFields: ["photo"],
    columns: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "type", label: "Category", labels: { "conference-speaker": "Minister", leadership: "Leadership" } },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "role", label: "Role / title", type: "text", required: true },
      { name: "type", label: "Category", type: "select", options: SPEAKER_TYPES, hint: "Minister → appears on the Speakers page. Leadership → appears in the team section of the About page." },
      { name: "photo", label: "Photo", type: "image-upload", max: 1, array: false, hint: "A portrait works best (square or 4:5). Shown on the Speakers page for ministers and the About page team section for leadership." },
      { name: "bio", label: "Bio", type: "textarea", rows: 3 },
      { name: "featured", label: "Featured on homepage (ministers only)", type: "checkbox" },
      { name: "order", label: "Display order", type: "number", default: 0 },
      { name: "socialLinks.instagram", label: "Instagram URL", type: "text" },
      { name: "socialLinks.youtube", label: "YouTube URL", type: "text" },
      { name: "socialLinks.spotify", label: "Spotify URL", type: "text" },
      { name: "isPublished", label: "Published", type: "checkbox", default: true },
    ],
  },

  gallery: {
    label: "Gallery",
    singular: "Gallery item",
    apiBase: "/api/gallery?all=true",
    apiBaseWrite: "/api/gallery",
    dataKey: "items",
    idField: "_id",
    populateFields: ["images"],
    columns: [
      { key: "caption", label: "Caption" },
      { key: "category", label: "Type", labels: { photo: "Photos", video: "Video", highlight: "Highlights" } },
      { key: "order", label: "Order" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "caption", label: "Caption", type: "text", hint: "Shown over the picture on the Gallery page. When you upload several photos at once, they all share this caption." },
      { name: "images", label: "Photos (up to 20)", type: "image-upload", max: 20, array: true, hint: "Select as many as you like in one go — each photo becomes its own tile on the Gallery page. For a video, the first photo is its cover picture." },
      { name: "category", label: "Which tab does it appear under?", type: "select", options: GALLERY_TYPES, default: "photo", hint: "The Gallery page has tabs for Photos, Videos and Highlights; everything also shows under All." },
      { name: "videoUrl", label: "Video link (optional)", type: "url", placeholder: "https://www.youtube.com/watch?v=...", hint: "Paste a YouTube link and the tile will open the video. Leave empty for ordinary photos." },
      { name: "wide", label: "Show the first photo as a large tile", type: "checkbox" },
      { name: "order", label: "Display order", type: "number", default: 0, hint: "Smaller numbers appear first. Items with the same number are shown oldest first." },
      { name: "isPublished", label: "Published", type: "checkbox", default: true },
    ],
  },

  testimonies: {
    label: "Testimonies",
    singular: "Testimony",
    apiBase: "/api/testimonies?all=true",
    apiBaseWrite: "/api/testimonies",
    idField: "_id",
    populateFields: ["thumbnail"],
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "location", label: "Location" },
      { key: "createdAt", label: "Submitted", type: "date" },
      { key: "isPublished", label: "Published", type: "boolean" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["Healing", "Breakthrough", "Salvation", "Restoration", "Deliverance", "Family"] },
      { name: "location", label: "Location", type: "text" },
      { name: "thumbnail", label: "Testimony image", type: "image-upload", max: 1, array: false, hint: "Shown on the testimony card on the public Testimonies page." },
      { name: "youtubeUrl", label: "YouTube video link", type: "url", placeholder: "https://www.youtube.com/watch?v=...", hint: "Optional. Paste a YouTube link (watch, youtu.be or embed). Visitors can play it right on the Testimonies page." },
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

  contacts: {
    label: "Contact Messages",
    singular: "Message",
    apiBase: "/api/contacts",
    idField: "_id",
    exportable: true,
    columns: [
      { key: "createdAt", label: "Date", type: "date" },
      { key: "fullName", label: "From" },
      { key: "subject", label: "Subject" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["General", "Support", "Partnership", "Donation", "Complaint", "Testimony"] },
      { name: "message", label: "Message", type: "textarea", rows: 5, required: true },
      { name: "status", label: "Status", type: "select", options: ["New", "In Progress", "Resolved", "Closed"] },
      { name: "adminNotes", label: "Internal notes", type: "textarea", rows: 3 },
    ],
  },

  prayers: {
    label: "Prayer Requests",
    singular: "Prayer Request",
    apiBase: "/api/prayers",
    idField: "_id",
    exportable: true,
    columns: [
      { key: "createdAt", label: "Date", type: "date" },
      { key: "fullName", label: "From" },
      { key: "category", label: "Category" },
      { key: "isConfidential", label: "Confidential", type: "boolean" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "fullName", label: "Full name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "category", label: "Category", type: "select", options: ["Healing", "Family", "Marriage", "Financial", "Salvation", "Thanksgiving", "Deliverance", "Other"] },
      { name: "request", label: "Request", type: "textarea", rows: 5, required: true },
      { name: "isAnonymous", label: "Anonymous", type: "checkbox" },
      { name: "isConfidential", label: "Confidential", type: "checkbox" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Prayed For", "Completed"] },
      { name: "adminNotes", label: "Internal notes", type: "textarea", rows: 3 },
    ],
  },

  volunteers: {
    label: "Volunteer Applications",
    singular: "Application",
    apiBase: "/api/volunteers",
    idField: "_id",
    exportable: true,
    columns: [
      { key: "createdAt", label: "Date", type: "date" },
      { key: "fullName", label: "Name" },
      { key: "department", label: "Department" },
      { key: "availability", label: "Availability" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "department", label: "Department", type: "select", options: ["Ushering & Guest Care", "Media & Production", "Prayer & Altar Ministry", "Logistics & Security", "Registration Desk", "Hospitality"] },
      { name: "availability", label: "Availability", type: "select", options: ["Weekdays", "Weekends", "Anytime"] },
      { name: "occupation", label: "Prior experience", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
      { name: "notes", label: "Internal notes", type: "textarea", rows: 3 },
    ],
  },

  eventRegistrations: {
    label: "Event Registrations",
    singular: "Registration",
    apiBase: "/api/event-registrations",
    dataKey: "eventRegistrations",
    idField: "_id",
    exportable: true,
    liveFeed: true,
    columns: [
      { key: "createdAt", label: "Date", type: "date" },
      { key: "fullName", label: "Name" },
      { key: "eventTitle", label: "Event" },
      { key: "guests", label: "Guests" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "country", label: "Country", type: "text", required: true },
      { name: "eventTitle", label: "Event", type: "text", required: true },
      { name: "guests", label: "Guests attending", type: "select", options: ["Just me", "2 people", "3 people", "4+ people"] },
      { name: "status", label: "Status", type: "select", options: ["Confirmed", "Cancelled"] },
    ],
  },

  newsletter: {
    label: "Newsletter Subscribers",
    singular: "Subscriber",
    apiBase: "/api/newsletters",
    dataKey: "subscribers",
    idField: "_id",
    exportable: true,
    columns: [
      { key: "createdAt", label: "Date", type: "date" },
      { key: "email", label: "Email" },
      { key: "fullName", label: "Name" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "fullName", label: "Full name", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Subscribed", "Unsubscribed"] },
    ],
  },
};
