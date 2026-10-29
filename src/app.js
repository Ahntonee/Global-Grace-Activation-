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
const eventRegistrationRoutes = require("./routes/eventRegistrationRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const prayerRoutes = require("./routes/prayerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const testimonyRoutes = require("./routes/testimonyRoutes");
const faqRoutes = require("./routes/faqRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const donationRoutes = require("./routes/donationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const exportRoutes = require("./routes/exportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const contentRoutes = require("./routes/contentRoutes");
const siteContent = require("./services/siteContent");
const { getSite } = require("./services/siteSettings");

// Public site (server-rendered) routes
const viewRoutes = require("./routes/viewRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.disable("x-powered-by");

// Behind a reverse proxy (GoDaddy/cPanel Passenger, nginx, a load balancer)
// every request otherwise appears to come from the proxy's own IP, which
// makes the rate limiters below treat ALL visitors as one person — an admin
// uploading a few images could then be blocked with "Too many requests".
// TRUST_PROXY=0 turns this off; by default it is on in production.
const trustProxy = process.env.TRUST_PROXY !== undefined ? Number(process.env.TRUST_PROXY) : process.env.NODE_ENV === "production" ? 1 : 0;
if (trustProxy) app.set("trust proxy", trustProxy);

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Safe way to drop a server value into an inline <script> block
// (window.__X__ = <%- jsonScript(value) %>;). Plain JSON.stringify doesn't
// escape "<", so a value containing the literal text "</script>" closes the
// tag early at the HTML-parser level — before the JS parser ever sees it —
// letting anything after it render as new markup. Escaping "<" to "<"
// keeps the string intact as a single JS string literal instead.
app.locals.jsonScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

// Pulls the 11-character video id out of any common YouTube link style
// (watch?v=, youtu.be/, /embed/, /shorts/, /live/) — null if it isn't one.
app.locals.site = require("./config/site");

app.locals.youtubeId = (url) => {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : null;
};

// First available image URL for a record that has a list of Media docs and
// possibly a legacy single image — used for card thumbnails.
app.locals.firstImage = (list, legacy, fallback) => {
  const first = Array.isArray(list) ? list.find((m) => m && m.url) : null;
  if (first) return first.url;
  if (legacy && legacy.url) return legacy.url;
  return fallback || "";
};
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
        // Uploaded media is served from Cloudinary; blob: is for the admin's
        // instant preview of a file before it's uploaded; YouTube for
        // testimony video thumbnails.
        "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://i.ytimg.com", "https://img.youtube.com"],
        "media-src": ["'self'", "https://res.cloudinary.com"],
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

// A request carrying a valid login token (the admin cookie or a Bearer
// header) belongs to signed-in staff, not anonymous traffic.
const jwt = require("jsonwebtoken");
function hasValidSession(req) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer") ? header.split(" ")[1] : req.cookies && req.cookies.token;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

// Apply rate limiter BEFORE API routes. It exists to slow down anonymous
// abuse of the public endpoints; signed-in admins are skipped, otherwise a
// normal editing session (lists, saves, several image uploads) would run
// into "Too many requests". Login attempts have their own stricter limiter.
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: hasValidSession,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
}));

// API routes
// Public contact details / social links, editable under Admin > Site Settings.
// Overrides the env-based default in app.locals for every rendered page.
app.use(async (req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.locals.site = await getSite();
    // txt()/rich()/cimg()/cvid(): editable page content (Admin > Page Content)
    Object.assign(res.locals, siteContent.makeHelpers(await siteContent.getOverrides()));
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/event-registrations", eventRegistrationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/prayers", prayerRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/newsletters", newsletterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/testimonies", testimonyRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/content", contentRoutes);

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