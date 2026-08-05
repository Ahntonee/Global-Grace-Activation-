const { Server } = require("socket.io");
const ChatMessage = require("../models/ChatMessage");
const Broadcast = require("../models/Broadcast");

const RATE_LIMIT_MS = 1000; // one message per second per socket
const HISTORY_LIMIT = 50;

function roomFor(broadcastId) {
  return `broadcast:${broadcastId}`;
}

function initSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    let lastMessageAt = 0;
    let joinedBroadcastId = null;

    socket.on("join-room", async ({ broadcastId }) => {
      if (!broadcastId) return;

      // Guests can join without an account — this is a public stream.
      const broadcast = await Broadcast.findById(broadcastId).lean();
      if (!broadcast || !broadcast.chatEnabled) {
        socket.emit("chat:error", { message: "Chat is not available for this broadcast." });
        return;
      }

      joinedBroadcastId = broadcastId;
      socket.join(roomFor(broadcastId));

      const history = await ChatMessage.find({ broadcast: broadcastId, isHidden: false })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .lean();

      socket.emit("chat:history", history.reverse());
    });

    socket.on("chat:message", async ({ broadcastId, displayName, message }) => {
      if (!broadcastId || broadcastId !== joinedBroadcastId) return;
      if (!message || !message.trim()) return;

      const now = Date.now();
      if (now - lastMessageAt < RATE_LIMIT_MS) {
        socket.emit("chat:error", { message: "You're sending messages too quickly." });
        return;
      }
      lastMessageAt = now;

      const trimmedName = (displayName || "Guest").trim().slice(0, 40);
      const trimmedMessage = message.trim().slice(0, 500);

      try {
        const saved = await ChatMessage.create({
          broadcast: broadcastId,
          displayName: trimmedName,
          message: trimmedMessage,
        });

        io.to(roomFor(broadcastId)).emit("chat:message", {
          _id: saved._id,
          displayName: saved.displayName,
          message: saved.message,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        socket.emit("chat:error", { message: "Message could not be sent." });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
