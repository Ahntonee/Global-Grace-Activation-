(function () {
  const config = window.__ADMIN_MODULE__;
  const moduleKey = window.__ADMIN_MODULE_KEY__;
  const tbody = document.getElementById("admin-list-body");
  if (!config || !tbody) return;

  const writeBase = config.apiBaseWrite || config.apiBase.split("?")[0];
  const fromInput = document.getElementById("flt-from");
  const toInput = document.getElementById("flt-to");
  const searchInput = document.getElementById("flt-q");
  const countEl = document.getElementById("flt-count");

  let allItems = [];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtDate(val) {
    return val ? new Date(val).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  }

  function fmtCell(item, col) {
    const val = item[col.key];
    if (col.type === "boolean") {
      return `<span class="admin-badge ${val ? "yes" : "no"}">${val ? "Yes" : "No"}</span>`;
    }
    if (col.type === "date") return fmtDate(val);
    if (val === undefined || val === null || val === "") return "—";
    if (col.labels && col.labels[val]) return escapeHtml(col.labels[val]);
    return escapeHtml(val);
  }

  // The record's local calendar date as YYYY-MM-DD, to compare with <input type="date">.
  function localDay(value) {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function matchesFilters(item) {
    const from = fromInput && fromInput.value;
    const to = toInput && toInput.value;
    if ((from || to) && item.createdAt) {
      const day = localDay(item.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
    } else if ((from || to) && !item.createdAt) {
      return false;
    }

    const q = searchInput && searchInput.value.trim().toLowerCase();
    if (q) {
      const haystack = config.columns.map((c) => String(item[c.key] == null ? "" : item[c.key])).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  function rowLabel(item) {
    const first = config.columns[0];
    const v = item[first.key];
    return first.type === "date" ? fmtDate(v) : v;
  }

  function render() {
    const items = allItems.filter(matchesFilters);
    if (countEl) countEl.textContent = `${items.length} of ${allItems.length} record${allItems.length === 1 ? "" : "s"}`;

    if (!allItems.length) {
      tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="admin-empty">Nothing here yet — click "+ New ${escapeHtml(config.singular)}" to add one.</td></tr>`;
      return;
    }
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="admin-empty">No records match these filters.</td></tr>`;
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
        const id = btn.getAttribute("data-delete-id");
        const item = allItems.find((i) => i._id === id);
        const label = item ? rowLabel(item) : "";
        const name = label ? ` "${label}"` : "";
        if (!confirm(`Delete this ${config.singular.toLowerCase()}${name}?\n\nThis permanently removes the record and can't be undone.`)) return;

        const res = await fetch(`${writeBase}/${id}`, { method: "DELETE", credentials: "same-origin" });
        if (res.ok) {
          load();
        } else {
          const body = await res.json().catch(() => ({}));
          alert(body.message || "Delete failed");
        }
      });
    });
  }

  async function load() {
    try {
      const res = await fetch(config.apiBase, { credentials: "same-origin" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Request failed");
      allItems = body[config.dataKey || moduleKey] || [];
      render();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="admin-empty">Failed to load: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  [fromInput, toInput, searchInput].forEach((el) => el && el.addEventListener("input", render));

  const clearBtn = document.getElementById("flt-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      [fromInput, toInput, searchInput].forEach((el) => el && (el.value = ""));
      render();
    });
  }

  // Excel / CSV download — honours the date range currently selected.
  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const params = new URLSearchParams({ format: btn.getAttribute("data-export"), tz: String(new Date().getTimezoneOffset()) });
      if (fromInput && fromInput.value) params.set("from", fromInput.value);
      if (toInput && toInput.value) params.set("to", toInput.value);
      window.location.href = `/api/export/${moduleKey}?${params.toString()}`;
    });
  });

  const feedCopy = document.getElementById("feed-copy");
  if (feedCopy) {
    feedCopy.addEventListener("click", async () => {
      const input = document.getElementById("feed-url");
      try {
        await navigator.clipboard.writeText(input.value);
      } catch (e) {
        input.select();
        document.execCommand("copy");
      }
      feedCopy.textContent = "Copied ✓";
      setTimeout(() => (feedCopy.textContent = "Copy link"), 2000);
    });
  }

  load();
})();
