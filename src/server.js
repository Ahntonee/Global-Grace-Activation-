require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");
const allowedOrigins = require("./config/corsOrigins");

const PORT = process.env.PORT || 5000;

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
