const Broadcast = require("../models/Broadcast");
const ChatMessage = require("../models/ChatMessage");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// Public — the one currently Live broadcast, or failing that the nearest
// upcoming Scheduled one, so the Watch Live page always has something
// sensible to show.
exports.getCurrentBroadcast = asyncHandler(async (req, res) => {
  let broadcast = await Broadcast.findOne({ status: "Live", isPublished: true });

  if (!broadcast) {
    broadcast = await Broadcast.findOne({ status: "Scheduled", isPublished: true }).sort({ scheduledStart: 1 });
  }

  res.json({ success: true, broadcast });
});

// Admin
exports.createBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, broadcast });
});

exports.getBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
  res.json({ success: true, broadcasts });
});

exports.getBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findById(req.params.id);
  if (!broadcast) throw new ApiError(404, "Broadcast not found");
  res.json({ success: true, broadcast });
});

exports.updateBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!broadcast) throw new ApiError(404, "Broadcast not found");
  res.json({ success: true, broadcast });
});

exports.deleteBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findById(req.params.id);
  if (!broadcast) throw new ApiError(404, "Broadcast not found");
  await broadcast.deleteOne();
  res.json({ success: true, message: "Broadcast deleted successfully" });
});

// Only one broadcast is ever "Live" at a time — going live on one
// auto-ends any other that was live.
exports.goLive = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findById(req.params.id);
  if (!broadcast) throw new ApiError(404, "Broadcast not found");

  await Broadcast.updateMany(
    { status: "Live", _id: { $ne: broadcast._id } },
    { status: "Ended", actualEnd: new Date() }
  );

  broadcast.status = "Live";
  broadcast.actualStart = broadcast.actualStart || new Date();
  await broadcast.save();

  const io = req.app.get("io");
  if (io) io.emit("broadcast:status-changed", { broadcastId: String(broadcast._id), status: "Live" });

  res.json({ success: true, broadcast });
});

exports.endBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findById(req.params.id);
  if (!broadcast) throw new ApiError(404, "Broadcast not found");

  broadcast.status = "Ended";
  broadcast.actualEnd = new Date();
  await broadcast.save();

  const io = req.app.get("io");
  if (io) io.emit("broadcast:status-changed", { broadcastId: String(broadcast._id), status: "Ended" });

  res.json({ success: true, broadcast });
});

// Admin moderation view — paginated chat history for a broadcast,
// independent of an open socket connection.
exports.getChatHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const messages = await ChatMessage.find({ broadcast: req.params.id })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ success: true, messages: messages.reverse() });
});

exports.hideChatMessage = asyncHandler(async (req, res) => {
  const message = await ChatMessage.findByIdAndUpdate(
    req.params.messageId,
    { isHidden: true },
    { new: true }
  );
  if (!message) throw new ApiError(404, "Message not found");

  const io = req.app.get("io");
  if (io) io.to(`broadcast:${message.broadcast}`).emit("chat:hidden", { messageId: String(message._id) });

  res.json({ success: true, message });
});
