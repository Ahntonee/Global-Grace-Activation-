(function () {
  const form = document.getElementById("give-form");
  const errorBox = document.getElementById("give-error");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const activeAmtBtn = form.querySelector(".amt-btn.active");
    const customInput = document.getElementById("give-custom-amount");
    const amount =
      activeAmtBtn && activeAmtBtn.dataset.amt !== "custom"
        ? Number(activeAmtBtn.dataset.amt)
        : Number((customInput.value || "").replace(/[^\d]/g, ""));

    if (!amount || amount <= 0) {
      errorBox.textContent = "Please choose or enter a valid amount.";
      errorBox.classList.add("show");
      return;
    }

    const frequencyBtn = form.querySelector("#give-frequency-toggle button.active");
    const providerBtn = form.querySelector("#give-provider-toggle button.active");
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      donor: {
        fullName: data.fullName,
        email: data.email,
        isAnonymous: !!data.isAnonymous,
      },
      amount,
      fund: data.fund,
      frequency: frequencyBtn ? frequencyBtn.dataset.frequency : "One-Time",
      paymentProvider: providerBtn ? providerBtn.dataset.provider : "paystack",
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message || "Something went wrong");

      window.location.href = body.checkoutUrl;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      submitBtn.disabled = false;
    }
  });
})();
