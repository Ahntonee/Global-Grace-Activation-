const asyncHandler = require("../utils/asyncHandler");
const adminModules = require("../config/adminModules");

const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const Speaker = require("../models/Speaker");
const Testimony = require("../models/Testimony");
const Faq = require("../models/Faq");
const Contact = require("../models/Contact");
const Prayer = require("../models/Prayer");
const Volunteer = require("../models/Volunteer");
const Newsletter = require("../models/Newsletter");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Donation = require("../models/Donation");

const modelsByKey = {
  pages: Page,
  blogs: Blog,
  events: Event,
  speakers: Speaker,
  testimonies: Testimony,
  faqs: Faq,
  contacts: Contact,
  prayers: Prayer,
  volunteers: Volunteer,
  newsletter: Newsletter,
  products: Product,
};

exports.loginPage = (req, res) => {
  res.render("admin/login", { layout: "layouts/admin", title: "Log in" });
};

exports.dashboard = asyncHandler(async (req, res) => {
  const [pages, blogs, events, speakers, testimonies, faqs, products, pendingOrders, totalDonations] = await Promise.all([
    Page.countDocuments(),
    Blog.countDocuments(),
    Event.countDocuments(),
    Speaker.countDocuments(),
    Testimony.countDocuments(),
    Faq.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ fulfillmentStatus: "Unfulfilled", paymentStatus: "Paid" }),
    Donation.countDocuments({ status: "Successful" }),
  ]);

  res.render("admin/dashboard", {
    layout: "layouts/admin",
    title: "Dashboard",
    currentModule: "dashboard",
    user: req.user,
    stats: { pages, blogs, events, speakers, testimonies, faqs, products, pendingOrders, totalDonations },
  });
});

exports.listPage = (req, res) => {
  const moduleKey = req.params.module;
  const config = adminModules[moduleKey];

  if (!config) {
    return res.status(404).render("pages/404", { title: "Not found" });
  }

  res.render("admin/generic-list", {
    layout: "layouts/admin",
    title: config.label,
    currentModule: moduleKey,
    user: req.user,
    moduleKey,
    config,
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
  const record = await Model.findOne(lookup).lean();

  if (!record) {
    return res.status(404).render("pages/404", { title: "Not found" });
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
