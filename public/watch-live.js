(function () {
  if (typeof io === "undefined") return;

  const socket = io({ withCredentials: true });

  // Listen for live-status changes on every visit to this page, not just
  // while already live — this is what makes an open Watch Live tab update
  // itself the moment an admin goes live, without a manual refresh.
  socket.on("broadcast:status-changed", () => {
    window.location.reload();
  });

  if (!window.__BROADCAST_IS_LIVE__ || !window.__CHAT_ENABLED__ || !window.__BROADCAST_ID__) {
    return;
  }

  const messagesEl = document.getElementById("live-chat-messages");
  const placeholder = document.getElementById("chat-placeholder");
  const form = document.getElementById("live-chat-form");
  const nameInput = document.getElementById("live-chat-name");
  const textInput = document.getElementById("live-chat-input");

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function appendMessage(msg) {
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.dataset.messageId = msg._id;
    div.innerHTML = `<b>${escapeHtml(msg.displayName)}:</b> ${escapeHtml(msg.message)}`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  socket.emit("join-room", { broadcastId: window.__BROADCAST_ID__ });

  socket.on("chat:history", (history) => {
    if (placeholder) placeholder.remove();
    history.forEach(appendMessage);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  socket.on("chat:message", (msg) => {
    appendMessage(msg);
  });

  socket.on("chat:hidden", ({ messageId }) => {
    const el = messagesEl.querySelector(`[data-message-id="${messageId}"]`);
    if (el) el.remove();
  });

  socket.on("chat:error", (err) => {
    window.gcToast(err.message);
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = textInput.value.trim();
      if (!message) return;

      socket.emit("chat:message", {
        broadcastId: window.__BROADCAST_ID__,
        displayName: nameInput.value.trim() || "Guest",
        message,
      });

      textInput.value = "";
    });
  }
})();
