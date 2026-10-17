(function () {
  const listBody = document.getElementById("broadcast-list-body");
  const form = document.getElementById("broadcast-form");
  const errorBox = document.getElementById("broadcast-error");
  const modPanel = document.getElementById("moderation-panel");
  if (!listBody) return;

  const thumbWidget = window.MediaField.mount(document.getElementById("broadcast-thumbnail"));
  const submitBtn = document.getElementById("broadcast-submit");
  const cancelBtn = document.getElementById("broadcast-cancel");
  const formTitle = document.getElementById("broadcast-form-title");
  let editingId = null;
  let broadcastsById = {};

  function toLocalInput(value) {
    if (!value) return "";
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function startEditing(b) {
    editingId = b._id;
    form.elements.title.value = b.title || "";
    form.elements.platform.value = b.platform || "YouTube";
    form.elements.embedUrl.value = b.embedUrl || "";
    form.elements.scheduledStart.value = toLocalInput(b.scheduledStart);
    form.elements.chatEnabled.checked = !!b.chatEnabled;
    thumbWidget.setItems(b.thumbnail ? [b.thumbnail] : []);
    formTitle.textContent = `Edit broadcast — ${b.title}`;
    submitBtn.textContent = "Save Changes";
    cancelBtn.style.display = "";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function stopEditing() {
    editingId = null;
    form.reset();
    thumbWidget.reset();
    formTitle.textContent = "Create a broadcast";
    submitBtn.textContent = "Create Broadcast";
    cancelBtn.style.display = "none";
    errorBox.classList.remove("show");
  }

  cancelBtn.addEventListener("click", stopEditing);

  let socket = null;
  let currentModeratedId = null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function loadBroadcasts() {
    const res = await fetch("/api/broadcasts", { credentials: "same-origin" });
    const body = await res.json();
    const broadcasts = body.broadcasts || [];
    broadcastsById = Object.fromEntries(broadcasts.map((b) => [b._id, b]));

    if (!broadcasts.length) {
      listBody.innerHTML = '<tr><td colspan="5" class="admin-empty">No broadcasts yet — create one above.</td></tr>';
    } else {
      listBody.innerHTML = broadcasts
        .map((b) => {
          const badge = `<span class="admin-badge ${b.status === "Live" ? "yes" : "no"}">${b.status}</span>`;
          const actionBtn =
            b.status === "Live"
              ? `<button type="button" class="btn btn-sm btn-outline-dark" data-end="${b._id}">End Broadcast</button>`
              : `<button type="button" class="btn btn-sm btn-primary" data-go-live="${b._id}">Go Live</button>`;
          const thumb = b.thumbnail && b.thumbnail.url
            ? `<img src="${escapeHtml(b.thumbnail.url)}" alt="Flyer" style="width:64px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">`
            : '<span style="color:var(--mist);">—</span>';
          return `<tr>
            <td>${thumb}</td>
            <td>${escapeHtml(b.title)}</td>
            <td>${b.platform}</td>
            <td>${badge}</td>
            <td>${actionBtn} <button type="button" class="btn btn-sm btn-outline-dark" data-edit="${b._id}">Edit</button> <button type="button" class="btn btn-sm btn-outline-dark" data-delete="${b._id}">Delete</button></td>
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
      listBody.querySelectorAll("[data-edit]").forEach((btn) =>
        btn.addEventListener("click", () => startEditing(broadcastsById[btn.getAttribute("data-edit")]))
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
    submitBtn.disabled = true;

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      data.chatEnabled = !!form.elements.chatEnabled.checked;
      if (!data.scheduledStart) delete data.scheduledStart;

      if (thumbWidget.hasPending()) submitBtn.textContent = "Uploading…";
      const ids = await thumbWidget.resolve();
      if (ids.length) data.thumbnail = ids[0];
      else if (editingId) data.thumbnail = null; // flyer removed

      submitBtn.textContent = "Saving…";
      const res = await fetch(editingId ? `/api/broadcasts/${editingId}` : "/api/broadcasts", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Failed to save broadcast");

      stopEditing();
      loadBroadcasts();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      submitBtn.textContent = editingId ? "Save Changes" : "Create Broadcast";
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadBroadcasts();
  setInterval(loadBroadcasts, 8000); // catch status changes made elsewhere without a hard reload
})();
