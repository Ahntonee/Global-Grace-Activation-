(function () {
  const reference = window.__DONATION_REFERENCE__;
  const heading = document.getElementById("confirmation-heading");
  const body = document.getElementById("confirmation-body");
  if (!reference) return;

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: currency || "NGN" }).format(amount);
    } catch (e) {
      return `${currency || ""} ${Number(amount).toLocaleString()}`;
    }
  }

  // Flutterwave appends ?status=...&transaction_id=... to the return URL —
  // pass the id along so the server can confirm the payment right away.
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get("transaction_id");
  const returnedStatus = params.get("status");

  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  async function poll() {
    attempts++;
    try {
      const query = transactionId ? `?transaction_id=${encodeURIComponent(transactionId)}` : "";
      const res = await fetch(`/api/donations/${encodeURIComponent(reference)}/status${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation not found");

      const donation = data.donation;

      if (donation.status === "Successful") {
        heading.textContent = "Thank you for giving!";
        body.innerHTML = `<p style="color:var(--text);">Your gift of <strong>${formatMoney(donation.amount, donation.currency)}</strong> toward ${donation.fund} has been received. An email receipt is on its way.</p>`;
        return;
      }

      if (donation.status === "Failed") {
        heading.textContent = "Payment didn't go through.";
        body.innerHTML = `<p style="color:var(--mist);">Your payment was not successful. No charge was made. <a href="/give">Try again</a>.</p>`;
        return;
      }

      if (returnedStatus === "cancelled") {
        heading.textContent = "Payment cancelled";
        body.innerHTML = `<p style="color:var(--mist);">You cancelled the payment, so no gift was made. <a href="/give">Give again</a> whenever you're ready.</p>`;
        return;
      }

      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      } else {
        heading.textContent = "Still processing…";
        body.innerHTML = `<p style="color:var(--mist);">This is taking longer than expected. We'll email you a receipt as soon as it clears.</p>`;
      }
    } catch (err) {
      heading.textContent = "Couldn't check status";
      body.innerHTML = `<p style="color:var(--mist);">${err.message}</p>`;
    }
  }

  poll();
})();
