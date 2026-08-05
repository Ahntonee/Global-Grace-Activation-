(function () {
  const form = document.getElementById("admin-login-form");
  const errorBox = document.getElementById("login-error");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const data = Object.fromEntries(new FormData(form).entries());
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || "Login failed");
      }

      if (body.user.role !== "admin") {
        throw new Error("This account doesn't have admin access.");
      }

      window.location.href = "/admin";
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      submitBtn.disabled = false;
    }
  });
})();
