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
        heading.textContent = window.ggaT("orderConfirmedHeading", "Thank you — your order is confirmed!");

        const downloadableLinks = (order.digitalDeliveryLinks || []).filter((l) => l.url);
        const linksHtml = downloadableLinks.length
          ? `<div style="margin-top:18px;">
              <p style="color:var(--text); font-weight:700; margin-bottom:8px;">${ggaH('orderDigitalItems', 'Your digital items:')}</p>
              ${downloadableLinks
                .map((l) => {
                  const item = (order.items || []).find((i) => i.product === l.product || i.product === String(l.product));
                  const name = item ? item.name : window.ggaT("orderDownload", "Download");
                  return `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="margin:4px 8px 4px 0;">${name} &darr;</a>`;
                })
                .join("")}
              <p style="color:var(--mist); font-size:13px; margin-top:8px;">${ggaH('orderLinksNote', 'A copy of these links was also sent to your email.')}</p>
            </div>`
          : "";

        body.innerHTML = `
          <p style="font-family:'Space Mono',monospace; font-size:13px; color:var(--mist); margin-bottom:14px;">${ggaH('orderNumber', 'Order')} ${order.orderNumber}</p>
          <p style="color:var(--text);">${ggaH('orderTotal', 'Total:')} <strong>₦${order.total.toLocaleString()}</strong></p>
          ${linksHtml}
          ${
            order.requiresShipping
              ? `<p style="margin-top:14px; color:var(--text);">${ggaH('orderShippingNote', 'We\'ll email you shipping updates as your order is processed.')}</p>`
              : ""
          }
        `;
        return;
      }

      if (order.paymentStatus === "Failed") {
        heading.textContent = window.ggaT("payFailedHeading", "Payment didn't go through.");
        body.innerHTML = `<p style="color:var(--mist);">${ggaH('payFailedBody', 'Your payment was not successful. No charge was made.')} <a href="/checkout">${ggaH('tryAgain', 'Try again')}</a>.</p>`;
        return;
      }

      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      } else {
        heading.textContent = window.ggaT("processingHeading", "Still processing…");
        body.innerHTML = `<p style="color:var(--mist);">${ggaH('orderProcessingBody', 'This is taking longer than expected. We\'ll email you a confirmation as soon as it clears.')}</p>`;
      }
    } catch (err) {
      heading.textContent = window.ggaT("orderStatusErrorHeading", "Couldn't check order status");
      body.innerHTML = `<p style="color:var(--mist);">${err.message}</p>`;
    }
  }

  poll();
})();
