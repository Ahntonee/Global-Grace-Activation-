/* ============================================================
   Public form submissions — real API calls, replacing the
   data-fake-submit demo handler for the forms that now have a
   working backend endpoint behind them.
   ============================================================ */
(function () {
  function buildPayload(form) {
    const payload = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.disabled) return;
      if (el.type === "checkbox") {
        payload[el.name] = el.checked;
      } else if (el.type === "file") {
        // Not wired to the backend yet — silently skipped.
      } else if (el.value !== "") {
        payload[el.name] = el.value;
      }
    });
    return payload;
  }

  document.querySelectorAll("form[data-api-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const endpoint = form.getAttribute("data-endpoint");
      const successMsg = form.getAttribute("data-success") || "Thank you — received!";
      const submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(form)),
        });
        const body = await res.json();

        if (!res.ok) {
          const msg = body.message || (body.errors && body.errors.map((er) => er.message).join(", ")) || "Something went wrong — please try again.";
          throw new Error(msg);
        }

        window.gcToast(successMsg);
        form.reset();
      } catch (err) {
        window.gcToast(err.message);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
})();
