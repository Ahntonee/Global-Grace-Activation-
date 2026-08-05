const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");
const Prayer = require("../models/Prayer");
const Contact = require("../models/Contact");
const Newsletter = require("../models/Newsletter");
const asyncHandler = require("../utils/asyncHandler");

exports.getDashboardStats = asyncHandler(async (req, res) => {

  const [
    pages,
    blogs,
    events,
    volunteers,
    prayers,
    contacts,
    newsletterSubscribers,
    publishedBlogs,
    draftBlogs,
    publishedEvents,
    draftEvents,
    recentContacts,
    recentPrayers,
    recentVolunteers,
  ] = await Promise.all([

    Page.countDocuments(),

    Blog.countDocuments(),

    Event.countDocuments(),

    Volunteer.countDocuments(),

    Prayer.countDocuments(),

    Contact.countDocuments(),

    Newsletter.countDocuments(),

    Blog.countDocuments({ isPublished: true }),

    Blog.countDocuments({ isPublished: false }),

    Event.countDocuments({ isPublished: true }),

    Event.countDocuments({ isPublished: false }),

    Contact.find()
      .sort({ createdAt: -1 })
      .limit(5),

    Prayer.find()
      .sort({ createdAt: -1 })
      .limit(5),

    Volunteer.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5)

  ]);

  res.json({
    success: true,
    analytics: {
      pages,
      blogs,
      events,
      volunteers,
      prayers,
      contacts,
      newsletterSubscribers,

      publishedBlogs,
      draftBlogs,

      publishedEvents,
      draftEvents,

      recentContacts,
      recentPrayers,
      recentVolunteers
    }
  });
});
