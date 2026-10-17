(function () {
  const config = window.__ADMIN_MODULE__;
  const moduleKey = window.__ADMIN_MODULE_KEY__;
  const recordId = window.__ADMIN_RECORD_ID__;
  const form = document.getElementById("admin-record-form");
  const errorBox = document.getElementById("form-error");
  if (!config || !form) return;

  const writeBase = config.apiBaseWrite || config.apiBase.split("?")[0];
  const isEdit = !!recordId;

  const MEDIA_TYPES = ["image-upload", "file-upload"];

  // Mount an upload widget (preview / replace / remove) for every media field.
  const mediaFields = {};
  form.querySelectorAll(".media-field").forEach((el) => {
    mediaFields[el.dataset.name] = window.MediaField.mount(el);
  });

  function setNested(obj, path, value) {
    const parts = path.split(".");
    let cursor = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      cursor[parts[i]] = cursor[parts[i]] || {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  async function buildPayload() {
    const payload = {};

    for (const f of config.fields) {
      if (MEDIA_TYPES.includes(f.type)) {
        const widget = mediaFields[f.name];
        if (!widget) continue;

        const ids = await widget.resolve();
        if (widget.isArray) {
          setNested(payload, f.name, ids);
        } else if (ids.length) {
          setNested(payload, f.name, ids[0]);
        } else if (isEdit) {
          // Removed in the widget — clear the link on the record.
          setNested(payload, f.name, null);
        }
        continue;
      }

      const el = form.querySelector(`[name="${f.name}"]`);
      if (!el) continue;

      let value;
      if (f.type === "checkbox") {
        value = el.checked;
      } else if (f.type === "number") {
        value = el.value === "" ? undefined : Number(el.value);
      } else if (f.type === "tags") {
        value = el.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        value = el.value;
      }

      setNested(payload, f.name, value);
    }

    return payload;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;

    try {
      const pending = Object.values(mediaFields).some((w) => w.hasPending());
      if (pending) submitBtn.textContent = "Uploading…";

      const payload = await buildPayload();

      submitBtn.textContent = "Saving…";

      const url = isEdit ? `${writeBase}/${recordId}` : writeBase;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message === "Validation failed" && body.errors
          ? body.errors.map((er) => er.message).join(", ")
          : body.message || (body.errors && body.errors.map((er) => er.message).join(", ")) || "Save failed");
      }

      window.location.href = `/admin/${moduleKey}`;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
      submitBtn.textContent = originalLabel;
      submitBtn.disabled = false;
    }
  });

  const deleteBtn = document.getElementById("admin-delete-btn");
  if (deleteBtn && recordId) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete this ${config.singular.toLowerCase()}? This can't be undone.`)) return;
      const res = await fetch(`${writeBase}/${recordId}`, { method: "DELETE", credentials: "same-origin" });
      if (res.ok) {
        window.location.href = `/admin/${moduleKey}`;
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.message || "Delete failed");
      }
    });
  }
})();
