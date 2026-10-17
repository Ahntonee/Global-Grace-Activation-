(function () {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;

  const T = window.RecordTools;
  const FULFILLMENT_OPTIONS = ["Unfulfilled", "Processing", "Shipped", "Delivered", "Cancelled"];
  const totalsEl = document.getElementById("order-totals");
  const countEl = document.getElementById("flt-count");
  let all = [];

  const filters = T.bindFilters(render);
  T.bindExport("orders", () => filters.values());

  function matches(o, f) {
    if (!T.inDateRange(o, f.from, f.to)) return false;
    if (f.status && o.paymentStatus !== f.status) return false;
    if (f.q) {
      const hay = [o.orderNumber, o.customer && o.customer.fullName, o.customer && o.customer.email, (o.items || []).map((i) => i.name).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  }

  function renderTotals(items) {
    const byCurrency = {};
    items.filter((o) => o.paymentStatus === "Paid").forEach((o) => {
      const cur = o.currency || "NGN";
      byCurrency[cur] = byCurrency[cur] || { total: 0, count: 0 };
      byCurrency[cur].total += o.total;
      byCurrency[cur].count += 1;
    });
    const cards = Object.keys(byCurrency)
      .sort()
      .map((cur) => `<div class="admin-stat-card"><div class="num" style="font-size:1.5rem;">${T.escapeHtml(T.fmtMoney(byCurrency[cur].total, cur))}</div><div class="label">Paid orders (${cur})</div><div class="field-hint">${byCurrency[cur].count} order${byCurrency[cur].count === 1 ? "" : "s"}</div></div>`);
    cards.push(`<div class="admin-stat-card"><div class="num">${items.length}</div><div class="label">Records shown</div></div>`);
    totalsEl.innerHTML = cards.join("");
  }

  function render() {
    const f = filters.values();
    const orders = all.filter((o) => matches(o, f));
    if (countEl) countEl.textContent = `${orders.length} of ${all.length} record${all.length === 1 ? "" : "s"}`;
    renderTotals(orders);

    if (!all.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No orders yet.</td></tr>';
      return;
    }
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No orders match these filters.</td></tr>';
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const itemsSummary = o.items.map((i) => `${T.escapeHtml(i.name)} ×${i.quantity}`).join(", ");
        const paymentBadge = `<span class="admin-badge ${o.paymentStatus === "Paid" ? "yes" : "no"}">${T.escapeHtml(o.paymentStatus)}</span>`;
        const fulfillmentOptions = FULFILLMENT_OPTIONS.map(
          (s) => `<option value="${s}" ${s === o.fulfillmentStatus ? "selected" : ""}>${s}</option>`
        ).join("");

        return `<tr>
          <td>${T.fmtDate(o.createdAt)}</td>
          <td style="font-family:'Space Mono',monospace; font-size:12px;">${T.escapeHtml(o.orderNumber)}</td>
          <td>${T.escapeHtml(o.customer.fullName)}<br><small style="color:var(--mist);">${T.escapeHtml(o.customer.email)}</small></td>
          <td style="max-width:220px;">${itemsSummary}</td>
          <td>${T.escapeHtml(T.fmtMoney(o.total, o.currency))}</td>
          <td>${paymentBadge}</td>
          <td><select data-order-id="${o._id}" style="padding:6px 8px; border-radius:6px; border:1px solid var(--line);">${fulfillmentOptions}</select></td>
          <td class="admin-row-actions"><button type="button" class="btn btn-sm btn-outline-dark" data-delete="${o._id}">Delete</button></td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("select[data-order-id]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        const id = sel.getAttribute("data-order-id");
        await fetch(`/api/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fulfillmentStatus: sel.value }),
        });
      });
    });

    tbody.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-delete");
        const o = all.find((x) => x._id === id);
        if (await T.remove(`/api/orders/${id}`, o ? `order ${o.orderNumber}` : "this order")) load();
      })
    );
  }

  async function load() {
    try {
      const res = await fetch("/api/orders", { credentials: "same-origin" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Request failed");
      all = body.orders || [];
      render();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-empty">Failed to load: ${T.escapeHtml(err.message)}</td></tr>`;
    }
  }

  load();
})();
