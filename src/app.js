const path = require("path");
const crypto = require("crypto");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoSanitize = require("./middleware/mongoSanitize");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");

// API routes
const authRoutes = require("./routes/authRoutes");
const pageRoutes = require("./routes/pageRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const blogRoutes = require("./routes/blogRoutes");
const eventRoutes = require("./routes/eventRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const prayerRoutes = require("./routes/prayerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const testimonyRoutes = require("./routes/testimonyRoutes");
const faqRoutes = require("./routes/faqRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const donationRoutes = require("./routes/donationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");

// Public site (server-rendered) routes
const viewRoutes = require("./routes/viewRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.disable("x-powered-by");

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");
// NOT using "layout extractScripts" — it was silently dropping
// page-specific <script> blocks instead of relocating them (found via
// browser testing, not visible from curl). Scripts render in their
// natural position in the content body instead, which works fine since
// everything they reference is already defined earlier in the same page.

// Per-request nonce for CSP script-src — every inline <script> block that
// passes server data to client JS (window.__X__ = ...) carries
// nonce="<%= nonce %>" so it's individually allowlisted rather than
// weakening script-src to 'unsafe-inline' site-wide. Must run before
// helmet so its CSP directive function below can read res.locals.nonce.
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Security / perf middleware — applies to everything, including static files
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        // Video embeds (Broadcast.platform) need their player origins allowed to frame us.
        "frame-src": [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://www.facebook.com",
          "https://zoom.us",
          "https://*.zoom.us",
        ],
      },
    },
  })
);
app.use(compression());

// Static assets (images, styles.css, script.js, hero video, etc.)
app.use(express.static(path.join(__dirname, "..", "public")));

const allowedOrigins = require("./config/corsOrigins");

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// Stashes the raw request body buffer so payment webhook handlers can
// verify gateway signatures (HMAC over the raw bytes) — by the time a
// route handler runs, express.json() has already parsed it, so this is
// the only place to capture it.
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Apply rate limiter BEFORE API routes
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/prayers", prayerRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/newsletters", newsletterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/testimonies", testimonyRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/broadcasts", broadcastRoutes);

app.get("/api/status", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Global Grace Backend API is running successfully",
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

// Server-rendered admin dashboard
app.use("/admin", adminRoutes);

// Server-rendered public site
app.use("/", viewRoutes);

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }
  res.status(404).render("pages/404", { title: "Page not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;