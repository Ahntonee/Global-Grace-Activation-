const asyncHandler = require("../utils/asyncHandler");
const adminModules = require("../config/adminModules");

const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const Speaker = require("../models/Speaker");
const GalleryItem = require("../models/GalleryItem");
const Testimony = require("../models/Testimony");
const Faq = require("../models/Faq");
const Contact = require("../models/Contact");
const Prayer = require("../models/Prayer");
const Volunteer = require("../models/Volunteer");
const EventRegistration = require("../models/EventRegistration");
const Newsletter = require("../models/Newsletter");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Donation = require("../models/Donation");
const { getFeedToken } = require("../utils/feedToken");

const modelsByKey = {
  pages: Page,
  blogs: Blog,
  events: Event,
  speakers: Speaker,
  gallery: GalleryItem,
  testimonies: Testimony,
  faqs: Faq,
  contacts: Contact,
  prayers: Prayer,
  volunteers: Volunteer,
  eventRegistrations: EventRegistration,
  newsletter: Newsletter,
  products: Product,
};

exports.loginPage = (req, res) => {
  res.render("admin/login", { layout: "layouts/admin", title: "Log in" });
};

exports.dashboard = asyncHandler(async (req, res) => {
  const [
    pages, blogs, blogsLive, events, eventsLive, speakers, ministers, leaders, galleryCount, galleryLive, testimonies, testimoniesPending, faqs,
    products, orders, ordersToFulfill, donations, donationsOk,
    registrations, contacts, contactsNew, prayers, prayersPending, volunteers, volunteersPending, subscribers,
  ] = await Promise.all([
    Page.countDocuments(),
    Blog.countDocuments(),
    Blog.countDocuments({ isPublished: true }),
    Event.countDocuments(),
    Event.countDocuments({ isPublished: true }),
    Speaker.countDocuments(),
    Speaker.countDocuments({ type: "conference-speaker" }),
    Speaker.countDocuments({ type: "leadership" }),
    GalleryItem.countDocuments(),
    GalleryItem.countDocuments({ isPublished: true }),
    Testimony.countDocuments(),
    Testimony.countDocuments({ isPublished: false }),
    Faq.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ fulfillmentStatus: "Unfulfilled", paymentStatus: "Paid" }),
    Donation.countDocuments(),
    Donation.countDocuments({ status: "Successful" }),
    EventRegistration.countDocuments(),
    Contact.countDocuments(),
    Contact.countDocuments({ status: "New" }),
    Prayer.countDocuments(),
    Prayer.countDocuments({ status: "Pending" }),
    Volunteer.countDocuments(),
    Volunteer.countDocuments({ status: "Pending" }),
    Newsletter.countDocuments(),
  ]);

  // Every total below is the full record count — the same number the
  // matching admin list shows. The small note under it is a subset.
  const cards = [
    { label: "Pages", total: pages, href: "/admin/pages" },
    { label: "Blog Posts", total: blogs, sub: `${blogsLive} published`, href: "/admin/blogs" },
    { label: "Events", total: events, sub: `${eventsLive} published`, href: "/admin/events" },
    { label: "Speakers & Leaders", total: speakers, sub: `${ministers} ministers · ${leaders} leadership`, href: "/admin/speakers" },
    { label: "Gallery", total: galleryCount, sub: `${galleryLive} published`, href: "/admin/gallery" },
    { label: "Testimonies", total: testimonies, sub: `${testimoniesPending} awaiting review`, href: "/admin/testimonies" },
    { label: "FAQs", total: faqs, href: "/admin/faqs" },
    { label: "Products", total: products, href: "/admin/products" },
    { label: "Orders", total: orders, sub: `${ordersToFulfill} to fulfil`, href: "/admin/orders" },
    { label: "Donations", total: donations, sub: `${donationsOk} successful`, href: "/admin/donations" },
    { label: "Event Registrations", total: registrations, href: "/admin/eventRegistrations" },
    { label: "Contact Messages", total: contacts, sub: `${contactsNew} new`, href: "/admin/contacts" },
    { label: "Prayer Requests", total: prayers, sub: `${prayersPending} pending`, href: "/admin/prayers" },
    { label: "Volunteer Applications", total: volunteers, sub: `${volunteersPending} pending`, href: "/admin/volunteers" },
    { label: "Newsletter Subscribers", total: subscribers, href: "/admin/newsletter" },
  ];

  const shortcuts = [
    { label: "+ New blog post", note: "Write a post with up to 3 images", href: "/admin/blogs/new" },
    { label: "+ New event", note: "Add an event with up to 3 flyers", href: "/admin/events/new" },
    { label: "+ New minister / leader", note: "Upload a photo and set their category", href: "/admin/speakers/new" },
    { label: "+ Add gallery photos", note: "Upload one photo or a whole batch at once", href: "/admin/gallery/new" },
    { label: "+ New testimony", note: "Add an image and YouTube video", href: "/admin/testimonies/new" },
    { label: "+ New product", note: "Image, PDF or an external Buy Now link", href: "/admin/products/new" },
    { label: "Event registrations", note: "View, filter and download to Excel", href: "/admin/eventRegistrations" },
    { label: "Donations", note: "Review gifts and download reports", href: "/admin/donations" },
    { label: "Live broadcast", note: "Go live, set the flyer, moderate chat", href: "/admin/broadcast" },
    { label: "Media library", note: "Everything uploaded so far", href: "/admin/media" },
  ];

  res.render("admin/dashboard", {
    layout: "layouts/admin",
    title: "GGA Admin Dashboard",
    currentModule: "dashboard",
    user: req.user,
    cards,
    shortcuts,
  });
});

exports.listPage = (req, res) => {
  const moduleKey = req.params.module;
  const config = adminModules[moduleKey];

  if (!config) {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  let feedUrl = null;
  if (config.liveFeed) {
    feedUrl = `${req.protocol}://${req.get("host")}/api/export/feed/${moduleKey}.csv?token=${getFeedToken()}`;
  }

  res.render("admin/generic-list", {
    layout: "layouts/admin",
    title: config.label,
    currentModule: moduleKey,
    user: req.user,
    moduleKey,
    config,
    feedUrl,
  });
};

exports.newFormPage = (req, res) => {
  const moduleKey = req.params.module;
  const config = adminModules[moduleKey];

  if (!config) {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  res.render("admin/generic-form", {
    layout: "layouts/admin",
    title: `New ${config.singular}`,
    currentModule: moduleKey,
    user: req.user,
    moduleKey,
    config,
    record: null,
    recordId: null,
  });
};

exports.editFormPage = asyncHandler(async (req, res) => {
  const moduleKey = req.params.module;
  const config = adminModules[moduleKey];
  const Model = modelsByKey[moduleKey];

  if (!config || !Model) {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  const lookup = config.idField === "_id" ? { _id: req.params.id } : { [config.idField]: req.params.id };
  let query = Model.findOne(lookup);
  (config.populateFields || []).forEach((field) => {
    query = query.populate(field);
  });
  const record = await query.lean();

  if (!record) {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  // Posts/events created before multi-image support only have the single
  // legacy image — show it in the new widget so it isn't lost on save.
  if (moduleKey === "blogs" && !(record.images && record.images.length) && record.featuredImage && record.featuredImage.url) {
    record.images = [record.featuredImage];
  }
  if (moduleKey === "events" && !(record.flyers && record.flyers.length) && record.featuredImage && record.featuredImage.url) {
    record.flyers = [record.featuredImage];
  }

  res.render("admin/generic-form", {
    layout: "layouts/admin",
    title: `Edit ${config.singular}`,
    currentModule: moduleKey,
    user: req.user,
    moduleKey,
    config,
    record,
    recordId: record._id,
  });
});

exports.contentIndex = (req, res) => {
  const pages = require("../services/siteContent").getGroups().map((g) => {
    const all = g.sections.flatMap((s) => s.fields);
    return {
      page: g.page,
      title: g.title,
      images: all.filter((f) => f.type === "image").length,
      videos: all.filter((f) => f.type === "video").length,
      texts: all.filter((f) => f.type === "text" || f.type === "textarea").length,
    };
  });

  res.render("admin/content-index", { layout: "layouts/admin", title: "Page Content", currentModule: "content", user: req.user, pages });
};

const LIVE_PATH = { home: "/", about: "/about", events: "/events", speakers: "/speakers", watch: "/watch-live", give: "/give", gallery: "/gallery", contact: "/contact", faqs: "/faqs", prayer: "/prayer", volunteer: "/volunteer", testimonies: "/testimonies", blog: "/blog", shop: "/shop", site: "/" };

exports.contentEdit = (req, res) => {
  const group = require("../services/siteContent").getGroups().find((g) => g.page === req.params.page);
  if (!group) return res.status(404).render("pages/404", { title: "Not found" });

  res.render("admin/content-edit", {
    layout: "layouts/admin",
    title: group.title,
    currentModule: "content",
    user: req.user,
    page: group.page,
    pageTitle: group.title,
    liveUrl: LIVE_PATH[group.page] || "/",
  });
};

exports.settingsPage = (req, res) => {
  res.render("admin/settings", {
    layout: "layouts/admin",
    title: "Site Settings",
    currentModule: "settings",
    user: req.user,
  });
};

exports.mediaPage = (req, res) => {
  res.render("admin/media", {
    layout: "layouts/admin",
    title: "Media Library",
    currentModule: "media",
    user: req.user,
  });
};

exports.ordersPage = (req, res) => {
  res.render("admin/orders", {
    layout: "layouts/admin",
    title: "Orders",
    currentModule: "orders",
    user: req.user,
  });
};

exports.donationsPage = (req, res) => {
  res.render("admin/donations", {
    layout: "layouts/admin",
    title: "Donations",
    currentModule: "donations",
    user: req.user,
  });
};

exports.broadcastPage = (req, res) => {
  res.render("admin/broadcast", {
    layout: "layouts/admin",
    title: "Broadcast Control",
    currentModule: "broadcast",
    user: req.user,
  });
};
