(function () {
  const config = window.__ADMIN_MODULE__;
  const moduleKey = window.__ADMIN_MODULE_KEY__;
  const tbody = document.getElementById("admin-list-body");
  if (!config || !tbody) return;

  const writeBase = config.apiBaseWrite || config.apiBase;

  function fmtCell(item, col) {
    const val = item[col.key];
    if (col.type === "boolean") {
      return `<span class="admin-badge ${val ? "yes" : "no"}">${val ? "Yes" : "No"}</span>`;
    }
    if (col.type === "date") {
      return val ? new Date(val).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
    }
    if (val === undefined || val === null || val === "") return "—";
    return String(val).replace(/</g, "&lt;");
  }

  async function load() {
    try {
      const res = await fetch(config.apiBase, { credentials: "same-origin" });
      const body = await res.json();
      const items = body[moduleKey] || [];

      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="admin-empty">Nothing here yet — click "+ New ${config.singular}" to add one.</td></tr>`;
        return;
      }

      tbody.innerHTML = items
        .map((item) => {
          const editId = item[config.idField];
          const cells = config.columns.map((col) => `<td>${fmtCell(item, col)}</td>`).join("");
          return `<tr>
            ${cells}
            <td class="admin-row-actions">
              <a href="/admin/${moduleKey}/${encodeURIComponent(editId)}/edit" class="btn btn-sm btn-outline-dark">Edit</a>
              <button type="button" class="btn btn-sm btn-outline-dark" data-delete-id="${item._id}">Delete</button>
            </td>
          </tr>`;
        })
        .join("");

      tbody.querySelectorAll("[data-delete-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm(`Delete this ${config.singular.toLowerCase()}? This can't be undone.`)) return;
          const id = btn.getAttribute("data-delete-id");
          const res = await fetch(`${writeBase}/${id}`, { method: "DELETE", credentials: "same-origin" });
          if (res.ok) {
            load();
          } else {
            const body = await res.json().catch(() => ({}));
            alert(body.message || "Delete failed");
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="admin-empty">Failed to load: ${err.message}</td></tr>`;
    }
  }

  load();
})();
