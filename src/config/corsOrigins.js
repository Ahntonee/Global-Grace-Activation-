// Shared between Express's CORS middleware and Socket.io's CORS config so
// the allowed-origins list only lives in one place.
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

module.exports = allowedOrigins;
