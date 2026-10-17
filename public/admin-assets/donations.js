(function () {
  const tbody = document.getElementById("donations-body");
  if (!tbody) return;

  const T = window.RecordTools;
  const totalsEl = document.getElementById("donation-totals");
  const countEl = document.getElementById("flt-count");
  let all = [];

  const filters = T.bindFilters(render);
  T.bindExport("donations", () => filters.values());

  function matches(d, f) {
    if (!T.inDateRange(d, f.from, f.to)) return false;
    if (f.status && d.status !== f.status) return false;
    if (f.q) {
      const hay = [d.donor && d.donor.fullName, d.donor && d.donor.email, d.fund, d.paymentReference, d.currency].join(" ").toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  }

  // Successful gifts only, one card per currency — amounts in different
  // currencies are never added together.
  function renderTotals(items) {
    const byCurrency = {};
    items.filter((d) => d.status === "Successful").forEach((d) => {
      const cur = d.currency || "NGN";
      byCurrency[cur] = byCurrency[cur] || { total: 0, count: 0 };
      byCurrency[cur].total += d.amount;
      byCurrency[cur].count += 1;
    });

    const cards = Object.keys(byCurrency)
      .sort()
      .map((cur) => `<div class="admin-stat-card"><div class="num" style="font-size:1.5rem;">${T.escapeHtml(T.fmtMoney(byCurrency[cur].total, cur))}</div><div class="label">Received (${cur})</div><div class="field-hint">${byCurrency[cur].count} successful gift${byCurrency[cur].count === 1 ? "" : "s"}</div></div>`);

    const pending = items.filter((d) => d.status === "Pending").length;
    cards.push(`<div class="admin-stat-card"><div class="num">${items.length}</div><div class="label">Records shown</div><div class="field-hint">${pending} pending</div></div>`);
    totalsEl.innerHTML = cards.join("");
  }

  function render() {
    const f = filters.values();
    const items = all.filter((d) => matches(d, f));
    if (countEl) countEl.textContent = `${items.length} of ${all.length} record${all.length === 1 ? "" : "s"}`;
    renderTotals(items);

    if (!all.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No donations yet.</td></tr>';
      return;
    }
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No donations match these filters.</td></tr>';
      return;
    }

    tbody.innerHTML = items
      .map(
        (d) => `<tr>
          <td>${T.fmtDate(d.createdAt)}</td>
          <td>${d.donor.isAnonymous ? "Anonymous" : T.escapeHtml(d.donor.fullName)}<br><small style="color:var(--mist);">${T.escapeHtml(d.donor.email)}</small></td>
          <td>${T.escapeHtml(T.fmtMoney(d.amount, d.currency))}</td>
          <td>${T.escapeHtml(d.fund)}</td>
          <td>${T.escapeHtml(d.frequency)}</td>
          <td><span class="admin-badge ${d.status === "Successful" ? "yes" : "no"}">${T.escapeHtml(d.status)}</span></td>
          <td class="admin-row-actions"><button type="button" class="btn btn-sm btn-outline-dark" data-delete="${d._id}">Delete</button></td>
        </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-delete");
        const d = all.find((x) => x._id === id);
        const label = d ? `the ${T.fmtMoney(d.amount, d.currency)} donation from ${d.donor.isAnonymous ? "an anonymous donor" : d.donor.fullName}` : "this donation";
        if (await T.remove(`/api/donations/${id}`, label)) load();
      })
    );
  }

  async function load() {
    try {
      const res = await fetch("/api/donations", { credentials: "same-origin" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Request failed");
      all = body.donations || [];
      render();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="admin-empty">Failed to load: ${T.escapeHtml(err.message)}</td></tr>`;
    }
  }

  load();
})();
