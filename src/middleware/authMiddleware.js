const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Reads a JWT from either the Authorization header (API clients) or the
// httpOnly "token" cookie (the admin dashboard) — same token, two transports.
function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

// For JSON API routes — responds with 401 JSON on failure.
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

// For server-rendered admin pages — redirects to the login screen instead
// of returning JSON, since there's no client-side code there to handle a 401.
const protectView = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.redirect("/admin/login");
    }

    next();
  } catch (error) {
    return res.redirect("/admin/login");
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  protectView,
  authorize,
};
