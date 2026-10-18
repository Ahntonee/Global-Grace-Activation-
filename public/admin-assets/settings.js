(function () {
  const form = document.getElementById("settings-form");
  const errorBox = document.getElementById("settings-error");
  const saved = document.getElementById("settings-saved");
  if (!form) return;

  async function load() {
    try {
      const res = await fetch("/api/settings", { credentials: "same-origin" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Could not load settings");
      Object.entries(body.settings).forEach(([name, value]) => {
        if (form.elements[name]) form.elements[name].value = value;
      });
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");
    saved.style.display = "none";

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;

    try {
      const payload = {};
      ["phone", "whatsapp", "instagram", "youtube", "facebook", "tiktok"].forEach((n) => (payload[n] = form.elements[n].value));

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Save failed");

      saved.style.display = "inline";
      setTimeout(() => (saved.style.display = "none"), 4000);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
    } finally {
      btn.disabled = false;
    }
  });

  load();
})();
