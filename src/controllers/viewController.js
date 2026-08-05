const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const Speaker = require("../models/Speaker");
const Testimony = require("../models/Testimony");
const Faq = require("../models/Faq");
const Product = require("../models/Product");
const Broadcast = require("../models/Broadcast");
const asyncHandler = require("../utils/asyncHandler");

// A published Page doc is the primary content source. If one doesn't exist
// yet (e.g. a brand-new page nobody has edited in the CMS), fall back to a
// bare title/description so the route never breaks — it just renders with
// empty hero/content fields until someone fills them in via the admin.
async function getPage(slug, fallbackTitle) {
  const page = await Page.findOne({ slug, isPublished: true });
  return (
    page || {
      title: fallbackTitle,
      slug,
      heroTitle: fallbackTitle,
      heroSubtitle: "",
      heroImage: "",
      content: "",
      seoTitle: fallbackTitle,
      seoDescription: "",
    }
  );
}

exports.home = asyncHandler(async (req, res) => {
  const page = await getPage("home", "Home | Global Grace Activation");
  const [speakers, testimonies, blogs, featuredEvent] = await Promise.all([
    Speaker.find({ type: "conference-speaker", featured: true, isPublished: true }).sort({ order: 1 }).limit(4),
    Testimony.find({ isPublished: true }).sort({ createdAt: -1 }).limit(4),
    Blog.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3),
    Event.findOne({ featured: true, isPublished: true }).sort({ startDate: 1 }),
  ]);

  res.render("pages/home", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "home",
    page,
    speakers,
    testimonies,
    blogs,
    featuredEvent,
  });
});

exports.about = asyncHandler(async (req, res) => {
  const page = await getPage("about", "About | Global Grace Activation");
  const leadership = await Speaker.find({ type: "leadership", isPublished: true }).sort({ order: 1 });

  res.render("pages/about", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "about",
    page,
    leadership,
  });
});

exports.events = asyncHandler(async (req, res) => {
  const page = await getPage("events", "Events | Global Grace Activation");
  const [featuredEvent, upcoming, past, faqs] = await Promise.all([
    Event.findOne({ featured: true, isPublished: true }).sort({ startDate: 1 }),
    Event.find({ isPublished: true, startDate: { $gte: new Date() } }).sort({ startDate: 1 }),
    Event.find({ isPublished: true, startDate: { $lt: new Date() } }).sort({ startDate: -1 }).limit(3),
    Faq.find({ isPublished: true, context: "events" }).sort({ order: 1 }),
  ]);

  const addons = featuredEvent
    ? await Product.find({ relatedEvent: featuredEvent._id, type: "event-addon", isPublished: true }).populate("images")
    : [];

  res.render("pages/events", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "events",
    page,
    featuredEvent,
    upcoming,
    past,
    faqs,
    addons,
  });
});

exports.speakers = asyncHandler(async (req, res) => {
  const page = await getPage("speakers", "Speakers | Global Grace Activation");
  const speakers = await Speaker.find({ type: "conference-speaker", isPublished: true }).sort({ order: 1 });

  res.render("pages/speakers", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "speakers",
    page,
    speakers,
  });
});

exports.watchLive = asyncHandler(async (req, res) => {
  const page = await getPage("watch-live", "Watch Live | Global Grace Activation");

  // Same precedence as the API's GET /api/broadcasts/current: prefer
  // whatever's currently Live, otherwise the nearest upcoming Scheduled one.
  let broadcast = await Broadcast.findOne({ status: "Live", isPublished: true });
  if (!broadcast) {
    broadcast = await Broadcast.findOne({ status: "Scheduled", isPublished: true }).sort({ scheduledStart: 1 });
  }

  res.render("pages/watch-live", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "watch-live",
    page,
    broadcast,
  });
});

exports.give = asyncHandler(async (req, res) => {
  const page = await getPage("give", "Give | Global Grace Activation");

  res.render("pages/give", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "give",
    page,
  });
});

exports.gallery = asyncHandler(async (req, res) => {
  const page = await getPage("gallery", "Gallery | Global Grace Activation");

  res.render("pages/gallery", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "gallery",
    page,
  });
});

exports.blogList = asyncHandler(async (req, res) => {
  const page = await getPage("blog", "Blog | Global Grace Activation");
  const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });

  res.render("pages/blog", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "blog",
    page,
    blogs,
  });
});

exports.blogPost = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true }).populate("featuredImage");

  if (!blog) {
    return res.status(404).render("pages/404", { title: "Post not found" });
  }

  res.render("pages/blog-post", {
    title: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt,
    currentPage: "blog",
    blog,
  });
});

exports.contact = asyncHandler(async (req, res) => {
  const page = await getPage("contact", "Contact | Global Grace Activation");

  res.render("pages/contact", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "contact",
    page,
  });
});

exports.faqs = asyncHandler(async (req, res) => {
  const page = await getPage("faqs", "FAQs | Global Grace Activation");
  const faqs = await Faq.find({ isPublished: true, context: "general" }).sort({ order: 1 });

  res.render("pages/faqs", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "faqs",
    page,
    faqs,
  });
});

exports.prayer = asyncHandler(async (req, res) => {
  const page = await getPage("prayer", "Prayer Request | Global Grace Activation");

  res.render("pages/prayer", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "prayer",
    page,
  });
});

exports.testimonies = asyncHandler(async (req, res) => {
  const page = await getPage("testimonies", "Testimonies | Global Grace Activation");
  const testimonies = await Testimony.find({ isPublished: true }).sort({ createdAt: -1 });

  res.render("pages/testimonies", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "testimonies",
    page,
    testimonies,
  });
});

exports.volunteer = asyncHandler(async (req, res) => {
  const page = await getPage("volunteer", "Volunteer | Global Grace Activation");

  res.render("pages/volunteer", {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    currentPage: "volunteer",
    page,
  });
});
