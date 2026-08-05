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

  function buildPayload() {
    const payload = {};

    config.fields.forEach((f) => {
      const el = form.querySelector(`[name="${f.name}"]`);
      if (!el) return;

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
    });

    return payload;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    const payload = buildPayload();
    const isEdit = !!recordId;
    const url = isEdit ? `${writeBase}/${recordId}` : writeBase;
    const method = isEdit ? "PUT" : "POST";

    try {
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
