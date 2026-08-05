(function () {
  const listBody = document.getElementById("broadcast-list-body");
  const form = document.getElementById("broadcast-form");
  const errorBox = document.getElementById("broadcast-error");
  const modPanel = document.getElementById("moderation-panel");
  if (!listBody) return;

  let socket = null;
  let currentModeratedId = null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function loadBroadcasts() {
    const res = await fetch("/api/broadcasts", { credentials: "same-origin" });
    const body = await res.json();
    const broadcasts = body.broadcasts || [];

    if (!broadcasts.length) {
      listBody.innerHTML = '<tr><td colspan="4" class="admin-empty">No broadcasts yet — create one above.</td></tr>';
    } else {
      listBody.innerHTML = broadcasts
        .map((b) => {
          const badge = `<span class="admin-badge ${b.status === "Live" ? "yes" : "no"}">${b.status}</span>`;
          const actionBtn =
            b.status === "Live"
              ? `<button type="button" class="btn btn-sm btn-outline-dark" data-end="${b._id}">End Broadcast</button>`
              : `<button type="button" class="btn btn-sm btn-primary" data-go-live="${b._id}">Go Live</button>`;
          return `<tr>
            <td>${escapeHtml(b.title)}</td>
            <td>${b.platform}</td>
            <td>${badge}</td>
            <td>${actionBtn} <button type="button" class="btn btn-sm btn-outline-dark" data-delete="${b._id}">Delete</button></td>
          </tr>`;
        })
        .join("");

      listBody.querySelectorAll("[data-go-live]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await fetch(`/api/broadcasts/${btn.getAttribute("data-go-live")}/go-live`, { method: "PUT", credentials: "same-origin" });
          loadBroadcasts();
        })
      );
      listBody.querySelectorAll("[data-end]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await fetch(`/api/broadcasts/${btn.getAttribute("data-end")}/end`, { method: "PUT", credentials: "same-origin" });
          loadBroadcasts();
        })
      );
      listBody.querySelectorAll("[data-delete]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this broadcast?")) return;
          await fetch(`/api/broadcasts/${btn.getAttribute("data-delete")}`, { method: "DELETE", credentials: "same-origin" });
          loadBroadcasts();
        })
      );
    }

    const live = broadcasts.find((b) => b.status === "Live");
    setupModeration(live);
  }

  function setupModeration(liveBroadcast) {
    if (!liveBroadcast) {
      modPanel.innerHTML = '<p class="admin-empty">No broadcast is currently live.</p>';
      currentModeratedId = null;
      return;
    }

    if (currentModeratedId === liveBroadcast._id) return; // already watching this one
    currentModeratedId = liveBroadcast._id;

    modPanel.innerHTML = `<div class="chat-window" style="height:280px;"><div class="chat-messages" id="mod-chat-messages"></div></div>`;
    const msgEl = document.getElementById("mod-chat-messages");

    if (!socket && typeof io !== "undefined") {
      socket = io({ withCredentials: true });
    }
    if (!socket) return;

    socket.emit("join-room", { broadcastId: liveBroadcast._id });

    socket.off("chat:history");
    socket.off("chat:message");
    socket.off("chat:hidden");

    function renderMsg(m) {
      const div = document.createElement("div");
      div.className = "chat-msg";
      div.dataset.messageId = m._id;
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.gap = "8px";
      div.innerHTML = `<span><b>${escapeHtml(m.displayName)}:</b> ${escapeHtml(m.message)}</span><button type="button" class="btn btn-sm btn-outline-dark" data-hide="${m._id}" style="flex:none;">Hide</button>`;
      msgEl.appendChild(div);
      msgEl.scrollTop = msgEl.scrollHeight;

      div.querySelector("[data-hide]").addEventListener("click", async () => {
        await fetch(`/api/broadcasts/chat/${m._id}/hide`, { method: "PUT", credentials: "same-origin" });
        div.remove();
      });
    }

    socket.on("chat:history", (history) => {
      msgEl.innerHTML = "";
      history.forEach(renderMsg);
    });
    socket.on("chat:message", renderMsg);
    socket.on("chat:hidden", ({ messageId }) => {
      const el = msgEl.querySelector(`[data-message-id="${messageId}"]`);
      if (el) el.remove();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");
    const data = Object.fromEntries(new FormData(form).entries());
    data.chatEnabled = !!data.chatEnabled;

    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to create broadcast");
      form.reset();
      loadBroadcasts();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
    }
  });

  loadBroadcasts();
  setInterval(loadBroadcasts, 8000); // catch status changes made elsewhere without a hard reload
})();
