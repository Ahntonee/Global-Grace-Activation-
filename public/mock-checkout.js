(function () {
  const reference = window.__MOCK_REFERENCE__;
  const successBtn = document.getElementById("mock-success-btn");
  const failBtn = document.getElementById("mock-fail-btn");
  const errorBox = document.getElementById("mock-error");

  function confirmationUrl() {
    return reference.startsWith("GGA-DON-")
      ? `/give/confirmation?reference=${encodeURIComponent(reference)}`
      : `/order-confirmation?reference=${encodeURIComponent(reference)}`;
  }

  async function simulate(outcome) {
    successBtn.disabled = true;
    failBtn.disabled = true;
    errorBox.classList.remove("show");

    try {
      const res = await fetch("/api/payments/mock/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, outcome }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Simulation failed");

      window.location.href = confirmationUrl();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      successBtn.disabled = false;
      failBtn.disabled = false;
    }
  }

  successBtn.addEventListener("click", () => simulate("success"));
  failBtn.addEventListener("click", () => simulate("failure"));
})();
