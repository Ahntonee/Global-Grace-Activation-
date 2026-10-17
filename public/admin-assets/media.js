(function () {
  const grid = document.getElementById("admin-media-grid");
  const form = document.getElementById("media-upload-form");
  const fileInput = document.getElementById("media-file-input");
  const errorBox = document.getElementById("media-error");
  if (!grid) return;

  async function load() {
    try {
      const res = await fetch("/api/media", { credentials: "same-origin" });
      const body = await res.json();
      const items = body.media || [];

      if (!items.length) {
        grid.innerHTML = '<p class="admin-empty">No media uploaded yet.</p>';
        return;
      }

      grid.innerHTML = items
        .map(
          (item) => `
        <div class="admin-media-item">
          ${/\.pdf$/i.test(item.url) || item.format === "pdf" || !/\/image\/upload\//.test(item.url)
            ? `<div style="height:140px;display:flex;align-items:center;justify-content:center;background:var(--paper-2);font-weight:700;color:var(--mist);">${(item.format || "FILE").toUpperCase()}</div>`
            : `<img src="${item.url}" alt="${(item.originalName || "").replace(/</g, "&lt;")}" loading="lazy">`}
          <div class="info">
            <small>${(item.originalName || "").replace(/</g, "&lt;")}</small>
            <small>${item.url}</small>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-sm btn-outline-dark" data-copy="${item.url}">Copy URL</button>
            <button type="button" class="btn btn-sm btn-outline-dark" data-delete="${item._id}">Delete</button>
          </div>
        </div>
      `
        )
        .join("");

      grid.querySelectorAll("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(btn.getAttribute("data-copy"));
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy URL"), 1200);
        });
      });

      grid.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this file? This can't be undone.")) return;
          const id = btn.getAttribute("data-delete");
          const res = await fetch(`/api/media/${id}`, { method: "DELETE", credentials: "same-origin" });
          if (res.ok) load();
          else alert("Delete failed");
        });
      });
    } catch (err) {
      grid.innerHTML = `<p class="admin-empty">Failed to load: ${err.message}</p>`;
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.classList.remove("show");
      if (!fileInput.files[0]) return;

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading…";

      try {
        // Shared uploader: shrinks big photos, checks size/type, and turns
        // server/network failures into readable messages.
        await window.MediaField.prepareAndUpload(fileInput.files[0]);
        form.reset();
        load();
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.add("show");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Upload";
      }
    });
  }

  load();
})();
