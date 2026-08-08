(function () {
  const config = window.__ADMIN_MODULE__;
  const moduleKey = window.__ADMIN_MODULE_KEY__;
  const recordId = window.__ADMIN_RECORD_ID__;
  const form = document.getElementById("admin-record-form");
  const errorBox = document.getElementById("form-error");
  if (!config || !form) return;

  const writeBase = config.apiBaseWrite || config.apiBase;

  function setNested(obj, path, value) {
    const parts = path.split(".");
    let cursor = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      cursor[parts[i]] = cursor[parts[i]] || {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  // Uploads one file to the Media library and returns the new Media._id.
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/media/upload", {
      method: "POST",
      credentials: "same-origin",
      body: fd,
    });
    const body = await res.json();

    if (!res.ok) {
      throw new Error(body.message || "File upload failed");
    }

    return body.media._id;
  }

  async function buildPayload() {
    const payload = {};

    for (const f of config.fields) {
      const el = form.querySelector(`[name="${f.name}"]`);
      if (!el) continue;

      if (f.type === "image-upload" || f.type === "file-upload") {
        // No new file chosen — leave the field out of the payload entirely
        // so an edit doesn't wipe out whatever's already linked.
        if (!el.files || !el.files[0]) continue;

        const mediaId = await uploadFile(el.files[0]);
        setNested(payload, f.name, el.dataset.uploadField === "single-array" ? [mediaId] : mediaId);
        continue;
      }

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
      const hasFileField = config.fields.some((f) => f.type === "image-upload" || f.type === "file-upload");
      if (hasFileField) submitBtn.textContent = "Uploading…";

      const payload = await buildPayload();

      submitBtn.textContent = originalLabel;

      const isEdit = !!recordId;
      const url = isEdit ? `${writeBase}/${recordId}` : writeBase;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || (body.errors && body.errors.map((e) => e.message).join(", ")) || "Save failed");
      }

      window.location.href = `/admin/${moduleKey}`;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
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
