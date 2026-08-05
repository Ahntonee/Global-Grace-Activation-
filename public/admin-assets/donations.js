(function () {
  const tbody = document.getElementById("donations-body");
  if (!tbody) return;

  function fmtNaira(n) {
    return "₦" + Number(n).toLocaleString();
  }

  async function load() {
    const res = await fetch("/api/donations", { credentials: "same-origin" });
    const body = await res.json();
    const donations = body.donations || [];

    if (!donations.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">No donations yet.</td></tr>';
      return;
    }

    tbody.innerHTML = donations
      .map(
        (d) => `<tr>
          <td>${d.donor.isAnonymous ? "Anonymous" : d.donor.fullName}<br><small style="color:var(--mist);">${d.donor.email}</small></td>
          <td>${fmtNaira(d.amount)}</td>
          <td>${d.fund}</td>
          <td>${d.frequency}</td>
          <td><span class="admin-badge ${d.status === "Successful" ? "yes" : "no"}">${d.status}</span></td>
          <td>${new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
        </tr>`
      )
      .join("");
  }

  load();
})();
