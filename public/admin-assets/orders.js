(function () {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;

  const FULFILLMENT_OPTIONS = ["Unfulfilled", "Processing", "Shipped", "Delivered", "Cancelled"];

  function fmtNaira(n) {
    return "₦" + Number(n).toLocaleString();
  }

  async function load() {
    const res = await fetch("/api/orders", { credentials: "same-origin" });
    const body = await res.json();
    const orders = body.orders || [];

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No orders yet.</td></tr>';
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const itemsSummary = o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
        const paymentBadge = `<span class="admin-badge ${o.paymentStatus === "Paid" ? "yes" : "no"}">${o.paymentStatus}</span>`;
        const fulfillmentOptions = FULFILLMENT_OPTIONS.map(
          (s) => `<option value="${s}" ${s === o.fulfillmentStatus ? "selected" : ""}>${s}</option>`
        ).join("");

        return `<tr>
          <td style="font-family:'Space Mono',monospace; font-size:12px;">${o.orderNumber}</td>
          <td>${o.customer.fullName}<br><small style="color:var(--mist);">${o.customer.email}</small></td>
          <td style="max-width:220px;">${itemsSummary}</td>
          <td>${fmtNaira(o.total)}</td>
          <td>${paymentBadge}</td>
          <td><select data-order-id="${o._id}" style="padding:6px 8px; border-radius:6px; border:1px solid var(--line);">${fulfillmentOptions}</select></td>
          <td>${new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
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
  }

  load();
})();
