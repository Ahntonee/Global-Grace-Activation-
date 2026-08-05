(function () {
  const reference = window.__DONATION_REFERENCE__;
  const heading = document.getElementById("confirmation-heading");
  const body = document.getElementById("confirmation-body");
  if (!reference) return;

  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  async function poll() {
    attempts++;
    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(reference)}/status`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation not found");

      const donation = data.donation;

      if (donation.status === "Successful") {
        heading.textContent = "Thank you for giving!";
        body.innerHTML = `<p style="color:var(--text);">Your gift of <strong>₦${donation.amount.toLocaleString()}</strong> toward ${donation.fund} has been received. An email receipt is on its way.</p>`;
        return;
      }

      if (donation.status === "Failed") {
        heading.textContent = "Payment didn't go through.";
        body.innerHTML = `<p style="color:var(--mist);">Your payment was not successful. No charge was made. <a href="/give">Try again</a>.</p>`;
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
