require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");
const allowedOrigins = require("./config/corsOrigins");

const PORT = process.env.PORT || 5000;

// Defense-in-depth: an unguarded async error anywhere outside Express's own
// request cycle (a socket.io handler, a fire-and-forget mail send, a stray
// promise) is an unhandled rejection, which crashes the entire process by
// default in modern Node — taking down every connected user, not just the
// one request that failed. Log it and keep serving instead.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

require("./utils/envCheck").runEnvCheck();

connectDB();

// Wrapped in http.createServer (rather than app.listen directly) so
// Socket.io can attach to the same underlying server and share the port —
// real-time chat and the REST API are the same process, same origin.
const server = http.createServer(app);
const io = initSocket(server, allowedOrigins);
app.set("io", io);

server.listen(PORT, () => {
    console.log(`
Global Grace Backend Started
Environment : ${process.env.NODE_ENV}
Port        : ${PORT}`);
});
