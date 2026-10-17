(function () {
  const form = document.getElementById("give-form");
  const errorBox = document.getElementById("give-error");
  if (!form) return;

  const currencies = window.__GIVE_CURRENCIES__ || [];
  const currencySelect = document.getElementById("give-currency");
  const amountsWrap = document.getElementById("give-amounts");
  const customInput = document.getElementById("give-custom-amount");

  function currentCurrency() {
    const code = currencySelect ? currencySelect.value : "NGN";
    return currencies.find((c) => c.code === code) || { code: "NGN", symbol: "₦", presets: [10000, 20000, 50000, 100000] };
  }

  function formatAmount(n, currency) {
    return `${currency.symbol}${Number(n).toLocaleString()}`;
  }

  // Rebuilds the preset amount buttons whenever the donor picks a currency,
  // so "₦10,000" becomes "$10" / "£10" etc. instead of a naira-only list.
  function renderPresets() {
    const currency = currentCurrency();
    const presetButtons = currency.presets
      .map((amt, i) => `<button class="amt-btn${i === 0 ? " active" : ""}" type="button" data-amt="${amt}">${formatAmount(amt, currency)}</button>`)
      .join("");

    amountsWrap.innerHTML =
      presetButtons +
      `<button class="amt-btn" type="button" data-amt="custom">Custom</button>` +
      `<input type="text" class="custom-amount amt-btn" id="give-custom-amount" placeholder="${currency.symbol} Amount" inputmode="decimal" style="text-align:center;">`;

    amountsWrap.querySelectorAll(".amt-btn[data-amt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        amountsWrap.querySelectorAll(".amt-btn[data-amt]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (btn.dataset.amt === "custom") {
          const input = document.getElementById("give-custom-amount");
          if (input) input.focus();
        }
      });
    });

    // Typing a custom amount switches to the "Custom" choice automatically.
    const input = document.getElementById("give-custom-amount");
    if (input) {
      input.addEventListener("input", () => {
        amountsWrap.querySelectorAll(".amt-btn[data-amt]").forEach((b) => b.classList.toggle("active", b.dataset.amt === "custom"));
      });
    }
  }

  if (currencySelect && amountsWrap) {
    currencySelect.addEventListener("change", renderPresets);
    renderPresets();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const activeAmtBtn = form.querySelector(".amt-btn.active");
    const customEl = document.getElementById("give-custom-amount") || customInput;
    const amount =
      activeAmtBtn && activeAmtBtn.dataset.amt !== "custom"
        ? Number(activeAmtBtn.dataset.amt)
        : Number(((customEl && customEl.value) || "").replace(/[^\d.]/g, ""));

    if (!amount || amount <= 0) {
      errorBox.textContent = "Please choose or enter a valid amount.";
      errorBox.classList.add("show");
      return;
    }

    const frequencyBtn = form.querySelector("#give-frequency-toggle button.active");
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      donor: {
        fullName: data.fullName,
        email: data.email,
        isAnonymous: !!data.isAnonymous,
      },
      amount,
      currency: currentCurrency().code,
      fund: data.fund,
      frequency: frequencyBtn ? frequencyBtn.dataset.frequency : "One-Time",
      paymentProvider: data.paymentProvider || "flutterwave",
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
