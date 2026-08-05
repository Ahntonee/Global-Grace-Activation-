(function () {
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.href = "/admin/login";
    }
  });
})();
