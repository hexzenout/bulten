// ===============================
// V32.1 FINANCE + ROLLING PRO
// Bahis/Kripto aktif bug fix + profesyonel planlayıcı + büyük rolling kartları.
// ===============================

(function () {
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function normalizeFinanceMode(mode) {
    return mode === "crypto" ? "crypto" : "bet";
  }

  function forceFinanceMode(mode) {
    mode = normalizeFinanceMode(mode);
    window._FINANCE_MODE = mode;

    qsa(".finance-tab").forEach(tab => {
      const isActive = tab.id === "finance-tab-" + mode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    qsa(".finance-tab-panel").forEach(panel => {
      const isActive = panel.id === "finance-panel-" + mode;
      panel.classList.toggle("active", isActive);
      panel.style.display = isActive ? "block" : "none";
    });
  }

  function bindFinanceTabsHard() {
    const bet = qs("#finance-tab-bet");
    const crypto = qs("#finance-tab-crypto");

    if (bet && !bet.dataset.v321Bound) {
      bet.dataset.v321Bound = "1";
      bet.onclick = function (e) {
        e.preventDefault();
        if (typeof window.omega_SetFinanceMode === "function") window.omega_SetFinanceMode("bet", true);
        forceFinanceMode("bet");
      };
    }

    if (crypto && !crypto.dataset.v321Bound) {
      crypto.dataset.v321Bound = "1";
      crypto.onclick = function (e) {
        e.preventDefault();
        if (typeof window.omega_SetFinanceMode === "function") window.omega_SetFinanceMode("crypto", true);
        forceFinanceMode("crypto");
      };
    }
  }

  const oldFinanceMode = window.omega_SetFinanceMode;
  window.omega_SetFinanceMode = function(mode, refresh = true) {
    mode = normalizeFinanceMode(mode);
    const result = typeof oldFinanceMode === "function" ? oldFinanceMode.call(this, mode, refresh) : undefined;
    forceFinanceMode(mode);
    setTimeout(() => forceFinanceMode(mode), 20);
    setTimeout(() => forceFinanceMode(mode), 120);
    return result;
  };

  function upgradeFinancePlanner() {
    bindFinanceTabsHard();
    forceFinanceMode(window._FINANCE_MODE || "bet");

    const card = qs(".finance-plan-card");
    if (!card || card.dataset.v321Upgraded === "1") return;
    card.dataset.v321Upgraded = "1";

    const headSpan = card.querySelector(".finance-card-head span");
    if (headSpan) headSpan.textContent = "Risk, stake, stop mesafesi ve hedef kâr hesabı";

    // Wrap visible result-like boxes in professional cards when possible
    const labels = [
      ["ÖNERİLEN MARJİN", "İşleme ayrılacak önerilen tutar"],
      ["MAKSİMUM ZARAR", "Stop çalışırsa kaybedilecek tutar"],
      ["POZİSYON BÜYÜKLÜĞÜ", "Kaldıraç sonrası yaklaşık pozisyon"],
      ["HEDEF KÂR", "R/R hedefine göre potansiyel kâr"]
    ];

    // Do not destructively replace existing calculated elements; enhance boxes with class.
    qsa(".finance-plan-card .finance-field").forEach(field => {
      const text = (field.textContent || "").toLowerCase();
      if (text.includes("önerilen") || text.includes("maksimum") || text.includes("pozisyon") || text.includes("hedef k")) {
        field.classList.add("v321-result-card");
      }
    });
  }

  function ensureRollingPlan() {
    if (!window._ROLLING_DB) window._ROLLING_DB = JSON.parse(localStorage.getItem("v19_rolling") || "{}");
    if (!window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS]) {
      window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS] = { startBal: 100, targetBal: window.ROLLING_TARGETS?.[window._ACTIVE_EXCEL_DAYS] || 1000, ops: {} };
    }
    const plan = window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS];
    if (!plan.ops) plan.ops = {};
    return plan;
  }

  function saveRolling() {
    localStorage.setItem("v19_rolling", JSON.stringify(window._ROLLING_DB));
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = new Array(1).fill(null);
    plan.ops[day].push(null);
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    if (plan.ops[day].length > 1) plan.ops[day].pop();
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = function(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    const filledCount = plan.ops[day].filter(Boolean).length;
    plan.ops[day].length = Math.max(count, filledCount, 1);
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= window._ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      const filledCount = plan.ops[day].filter(Boolean).length;
      plan.ops[day].length = Math.max(count, filledCount, 1);
    }
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = new Array(1).fill(null);
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RenderExcelTable = function() {
    const wrapper = qs("#excel-body-content");
    if (!wrapper) return;

    const currentPlan = ensureRollingPlan();
    let runningBalance = Number(currentPlan.startBal || 100);
    let totalProfit = 0;

    let htmlBuffer = `
      <div class="rolling-toolbar-v321">
        <button class="gold" onclick="omega_RollingSetAllSlots(10)">TÜM GÜNLERİ 10 İŞLEM YAP</button>
        <button onclick="omega_RollingSetAllSlots(20)">TÜM GÜNLERİ 20 İŞLEM YAP</button>
      </div>
    `;

    for (let day = 1; day <= window._ACTIVE_EXCEL_DAYS; day++) {
      if (!currentPlan.ops[day]) currentPlan.ops[day] = new Array(10).fill(null);
      if (currentPlan.ops[day].length < 1) currentPlan.ops[day] = new Array(1).fill(null);

      const dayOps = currentPlan.ops[day];
      const dayStart = runningBalance;
      let dayProfit = 0;
      const cards = [];

      for (let slot = 0; slot < dayOps.length; slot++) {
        const op = dayOps[slot];

        if (op) {
          const amt = Number(op.amt || 0);
          const odds = Number(op.odds || 0);
          const pnl = op.res === "win" ? (amt * odds) - amt : amt;

          if (op.res === "win") {
            runningBalance += pnl;
            totalProfit += pnl;
            dayProfit += pnl;
          } else {
            runningBalance -= pnl;
            totalProfit -= pnl;
            dayProfit -= pnl;
          }

          cards.push(`
            <div class="kapsul v321 ${op.res}">
              <button class="k-undo v321" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
              <div class="k-result-v321">
                <div class="k-note-show">${op.note || "İşlem notu yok"}</div>
                <b>$${amt} × ${odds}</b>
                <span style="color:${op.res === "win" ? "var(--green)" : "var(--red)"}">${op.res === "win" ? "+" : "-"}$${pnl.toFixed(2)}</span>
              </div>
            </div>
          `);
        } else {
          cards.push(`
            <div class="kapsul v321">
              <input class="k-note-input-v321" type="text" id="e-n-${day}-${slot}" placeholder="Maç / coin / işlem notu">
              <div class="k-inputs-v321">
                <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                <input type="number" id="e-o-${day}-${slot}" placeholder="Oran / RR">
              </div>
              <div class="k-actions v321">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">KAZANDI</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">KAYBETTİ</button>
              </div>
            </div>
          `);
        }
      }

      htmlBuffer += `
        <div class="day-row-capsule v321">
          <div class="day-info-v321">
            <h3>GÜN ${day}</h3>
            <span>Başlangıç: <b>$${dayStart.toFixed(2)}</b></span>
            <span>Gün P/L: <b style="color:${dayProfit >= 0 ? "var(--green)" : "var(--red)"}">${dayProfit >= 0 ? "+" : ""}$${dayProfit.toFixed(2)}</b></span>

            <div class="day-tools-v321">
              <button class="gold" onclick="omega_RollingAddSlot(${day})">+ İŞLEM</button>
              <button onclick="omega_RollingRemoveSlot(${day})">- SİL</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 10)">10'A TAMAMLA</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 20)">20'YE TAMAMLA</button>
              <button onclick="omega_RollingClearDay(${day})">GÜNÜ TEMİZLE</button>
            </div>
          </div>

          <div class="capsule-container v321">${cards.join("")}</div>

          <div class="day-result v321">
            <small>Gün Sonu</small>
            $${runningBalance.toFixed(2)}
          </div>
        </div>
      `;
    }

    wrapper.innerHTML = htmlBuffer;

    const current = qs("#excel-current-bal");
    if (current) current.innerText = `$${runningBalance.toFixed(2)}`;

    const pnlElement = qs("#excel-pnl");
    if (pnlElement) {
      pnlElement.innerText = (totalProfit >= 0 ? "+" : "") + "$" + totalProfit.toFixed(2);
      pnlElement.style.color = totalProfit >= 0 ? "var(--green)" : "var(--red)";
    }

    const targetBal = currentPlan.targetBal || window.ROLLING_TARGETS?.[window._ACTIVE_EXCEL_DAYS] || 1000;
    const progressPercentage = Math.min((runningBalance / targetBal) * 100, 100);
    const progressBar = qs("#excel-progress-bar");
    if (progressBar) progressBar.style.width = progressPercentage + "%";

    saveRolling();
  };

  const oldOpenRolling = window.omega_OpenRollingExcel;
  window.omega_OpenRollingExcel = function(days) {
    const result = typeof oldOpenRolling === "function" ? oldOpenRolling.call(this, days) : undefined;
    setTimeout(() => window.omega_RenderExcelTable(), 80);
    setTimeout(() => window.omega_RenderExcelTable(), 250);
    return result;
  };

  function boot() {
    upgradeFinancePlanner();
    if (location.hash === "#finance") {
      forceFinanceMode(window._FINANCE_MODE || "bet");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(boot, 700);
    setTimeout(boot, 1800);
  });

  window.addEventListener("hashchange", () => setTimeout(boot, 350));
  setInterval(() => {
    if (location.hash === "#finance") boot();
  }, 1500);
})();
