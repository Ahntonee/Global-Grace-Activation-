(function () {
  const page = window.__CONTENT_PAGE__;
  const form = document.getElementById("content-form");
  const holder = document.getElementById("content-sections");
  const errorBox = document.getElementById("content-error");
  const saved = document.getElementById("content-saved");
  const saveBtn = document.getElementById("content-save");
  if (!form || !page) return;

  const widgets = {}; // key -> MediaField instance
  const fieldsByKey = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render(data) {
    holder.innerHTML = "";

    data.sections.forEach((section) => {
      const card = document.createElement("div");
      card.className = "admin-form-card content-section";
      card.innerHTML = `<h3 class="content-section-title">${esc(section.title)}</h3>`;

      section.fields.forEach((f) => {
        fieldsByKey[f.key] = f;
        const row = document.createElement("div");
        row.className = "field";
        const id = "c-" + f.key.replace(/[^a-z0-9]/gi, "-");

        if (f.type === "text") {
          row.innerHTML = `<label for="${id}">${esc(f.label)}</label>
            <input type="text" id="${id}" data-key="${esc(f.key)}" value="${esc(f.text)}" placeholder="${esc(f.default)}">`;
        } else if (f.type === "textarea") {
          const rows = Math.min(8, Math.max(3, Math.ceil(f.default.length / 90)));
          row.innerHTML = `<label for="${id}">${esc(f.label)}</label>
            <textarea id="${id}" data-key="${esc(f.key)}" rows="${rows}" placeholder="${esc(f.default)}">${esc(f.text)}</textarea>`;
        } else {
          const isVideo = f.type === "video";
          // The picture / file currently on the site: the admin's own upload, or the original.
          const current = f.media
            ? [{ _id: f.media._id, url: f.media.url, originalName: f.media.originalName }]
            : [{ _id: "", url: f.default, originalName: isVideo ? "Original video" : "Original picture" }];
          row.innerHTML = `<label>${esc(f.label)}</label>
            <div class="media-field" data-key="${esc(f.key)}" data-name="${esc(f.key)}" data-kind="${isVideo ? "file" : "image"}"
              data-max="1" data-array="false" data-accept="${isVideo ? "video/mp4,video/webm" : "image/*"}"></div>
            <div class="field-hint">${f.media ? "Your uploaded " + (isVideo ? "video" : "picture") + " is showing. Remove it to go back to the original." : "The original " + (isVideo ? "video" : "picture") + " is showing. Replace it to use your own."}</div>`;
          card.appendChild(row);
          const el = row.querySelector(".media-field");
          el.dataset.existing = JSON.stringify(current);
          widgets[f.key] = window.MediaField.mount(el);
          return;
        }
        card.appendChild(row);
      });

      holder.appendChild(card);
    });
  }

  async function load() {
    try {
      const res = await fetch(`/api/content/${encodeURIComponent(page)}`, { credentials: "same-origin" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Could not load this page's content");
      render(body);
    } catch (err) {
      holder.innerHTML = `<p class="admin-empty">${esc(err.message)}</p>`;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");
    saved.style.display = "none";
    saveBtn.disabled = true;
    const label = saveBtn.textContent;

    try {
      const items = [];

      holder.querySelectorAll("[data-key]").forEach((el) => {
        if (el.classList.contains("media-field")) return;
        items.push({ key: el.dataset.key, text: el.value });
      });

      const pending = Object.values(widgets).some((w) => w.hasPending());
      if (pending) saveBtn.textContent = "Uploading…";

      for (const [key, widget] of Object.entries(widgets)) {
        const ids = (await widget.resolve()).filter(Boolean); // "" = the original, not an upload
        items.push({ key, media: ids[0] || null });
      }

      saveBtn.textContent = "Saving…";
      const res = await fetch(`/api/content/${encodeURIComponent(page)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ items }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Save failed");

      saved.style.display = "inline";
      setTimeout(() => (saved.style.display = "none"), 5000);
      await load(); // re-read so "your upload / original" hints are accurate
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
    }
  });

  load();
})();
