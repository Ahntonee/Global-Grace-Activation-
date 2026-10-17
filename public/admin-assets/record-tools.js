/*
 * Shared helpers for the custom admin record screens (donations, orders):
 * local-date filtering, money formatting, Excel/CSV download.
 */
(function () {
  function localDay(value) {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function fmtMoney(amount, currency) {
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: currency || "NGN" }).format(amount);
    } catch (e) {
      return `${currency || ""} ${Number(amount).toLocaleString()}`;
    }
  }

  function fmtDate(value) {
    return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Wires the shared filter bar (#flt-from, #flt-to, #flt-status, #flt-q).
  function bindFilters(onChange) {
    const ids = ["flt-from", "flt-to", "flt-status", "flt-q"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    els.forEach((el) => el.addEventListener("input", onChange));

    const clear = document.getElementById("flt-clear");
    if (clear) {
      clear.addEventListener("click", () => {
        els.forEach((el) => (el.value = ""));
        onChange();
      });
    }

    return {
      values() {
        return {
          from: (document.getElementById("flt-from") || {}).value || "",
          to: (document.getElementById("flt-to") || {}).value || "",
          status: (document.getElementById("flt-status") || {}).value || "",
          q: ((document.getElementById("flt-q") || {}).value || "").trim().toLowerCase(),
        };
      },
    };
  }

  function inDateRange(item, from, to) {
    if (!from && !to) return true;
    if (!item.createdAt) return false;
    const day = localDay(item.createdAt);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  }

  // Download buttons ([data-export="xlsx|csv"]) for a report kind.
  function bindExport(kind, getFilters) {
    document.querySelectorAll("[data-export]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = getFilters();
        const params = new URLSearchParams({ format: btn.getAttribute("data-export"), tz: String(new Date().getTimezoneOffset()) });
        if (f.from) params.set("from", f.from);
        if (f.to) params.set("to", f.to);
        if (f.status) params.set("status", f.status);
        window.location.href = `/api/export/${kind}?${params.toString()}`;
      });
    });
  }

  async function remove(url, label) {
    if (!confirm(`Delete ${label}?\n\nThis permanently removes the record and can't be undone.`)) return false;
    const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) return true;
    const body = await res.json().catch(() => ({}));
    alert(body.message || "Delete failed");
    return false;
  }

  window.RecordTools = { localDay, fmtMoney, fmtDate, escapeHtml, bindFilters, inDateRange, bindExport, remove };
})();
