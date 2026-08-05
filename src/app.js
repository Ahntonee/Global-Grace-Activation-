const path = require("path");
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
app.set("layout extractScripts", true);

// Security / perf middleware — applies to everything, including static files
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());

// Static assets (images, styles.css, script.js, hero video, etc.)
app.use(express.static(path.join(__dirname, "..", "public")));

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());
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