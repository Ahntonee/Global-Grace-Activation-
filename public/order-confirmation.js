(function () {
  const reference = window.__ORDER_REFERENCE__;
  const heading = document.getElementById("confirmation-heading");
  const body = document.getElementById("confirmation-body");
  if (!reference) return;

  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  async function poll() {
    attempts++;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(reference)}/status`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order not found");

      const order = data.order;

      if (order.paymentStatus === "Paid") {
        heading.textContent = "Thank you — your order is confirmed!";
        body.innerHTML = `
          <p style="font-family:'Space Mono',monospace; font-size:13px; color:var(--mist); margin-bottom:14px;">Order ${order.orderNumber}</p>
          <p style="color:var(--text);">Total: <strong>₦${order.total.toLocaleString()}</strong></p>
          ${
            order.digitalDeliveryLinks && order.digitalDeliveryLinks.length
              ? `<p style="margin-top:14px; color:var(--text);">Your digital items are ready — check your email for download access.</p>`
              : ""
          }
          ${
            order.requiresShipping
              ? `<p style="margin-top:14px; color:var(--text);">We'll email you shipping updates as your order is processed.</p>`
              : ""
          }
        `;
        return;
      }

      if (order.paymentStatus === "Failed") {
        heading.textContent = "Payment didn't go through.";
        body.innerHTML = `<p style="color:var(--mist);">Your payment was not successful. No charge was made. <a href="/checkout">Try again</a>.</p>`;
        return;
      }

      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      } else {
        heading.textContent = "Still processing…";
        body.innerHTML = `<p style="color:var(--mist);">This is taking longer than expected. We'll email you a confirmation as soon as it clears.</p>`;
      }
    } catch (err) {
      heading.textContent = "Couldn't check order status";
      body.innerHTML = `<p style="color:var(--mist);">${err.message}</p>`;
    }
  }

  poll();
})();
