// ===============================
// V32.2 FINANCE + ROLLING REPAIR
// V32.1 bozulmasını geri alır, tab bugını çözer, rolling kartlarını kontrollü büyütür.
// ===============================

(function () {
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.from(document.querySelectorAll(s)); }

  function mode() { return window._FINANCE_MODE === "crypto" ? "crypto" : "bet"; }

  function hardSetFinanceMode(next) {
    const m = next === "crypto" ? "crypto" : "bet";
    window._FINANCE_MODE = m;

    const betTab = qs("#finance-tab-bet");
    const cryptoTab = qs("#finance-tab-crypto");
    const betPanel = qs("#finance-panel-bet");
    const cryptoPanel = qs("#finance-panel-crypto");

    if (betTab) {
      betTab.classList.toggle("active", m === "bet");
      betTab.setAttribute("aria-selected", m === "bet" ? "true" : "false");
      betTab.innerHTML = '<i class="fa-solid fa-ticket"></i> BAHİS PLANI';
    }

    if (cryptoTab) {
      cryptoTab.classList.toggle("active", m === "crypto");
      cryptoTab.setAttribute("aria-selected", m === "crypto" ? "true" : "false");
      cryptoTab.innerHTML = '<i class="fa-brands fa-bitcoin"></i> KRİPTO RİSK';
    }

    if (betPanel) {
      betPanel.classList.toggle("active", m === "bet");
      betPanel.style.display = m === "bet" ? "block" : "none";
    }

    if (cryptoPanel) {
      cryptoPanel.classList.toggle("active", m === "crypto");
      cryptoPanel.style.display = m === "crypto" ? "block" : "none";
    }
  }

  const oldMode = window.omega_SetFinanceMode;
  window.omega_SetFinanceMode = function(next, refresh = true) {
    const m = next === "crypto" ? "crypto" : "bet";
    const result = typeof oldMode === "function" ? oldMode.call(this, m, refresh) : undefined;
    hardSetFinanceMode(m);
    setTimeout(() => hardSetFinanceMode(m), 25);
    setTimeout(() => hardSetFinanceMode(m), 160);
    return result;
  };

  function bindTabs() {
    const bet = qs("#finance-tab-bet");
    const crypto = qs("#finance-tab-crypto");
    if (bet && bet.dataset.v322 !== "1") {
      bet.dataset.v322 = "1";
      bet.onclick = (e) => {
        e.preventDefault();
        window.omega_SetFinanceMode("bet", true);
      };
    }
    if (crypto && crypto.dataset.v322 !== "1") {
      crypto.dataset.v322 = "1";
      crypto.onclick = (e) => {
        e.preventDefault();
        window.omega_SetFinanceMode("crypto", true);
      };
    }
  }

  function labelFinanceFields() {
    const head = qs(".finance-plan-card .finance-card-head h3");
    const sub = qs(".finance-plan-card .finance-card-head span");
    if (head) head.innerHTML = '<i class="fa-solid fa-sliders"></i> Planlayıcı';
    if (sub) sub.textContent = "Bahis ve kripto için ayrı risk planı";

    const betPanel = qs("#finance-panel-bet");
    const cryptoPanel = qs("#finance-panel-crypto");

    if (betPanel && !betPanel.querySelector(".v322-plan-title")) {
      betPanel.insertAdjacentHTML("afterbegin", `
        <div class="v322-plan-title">
          <div><b>BAHİS PLANI</b><span>Kupon / maç stake ve günlük hedef hesabı</span></div>
          <i class="fa-solid fa-ticket" style="color:#fbbf24"></i>
        </div>
      `);
    }

    if (cryptoPanel && !cryptoPanel.querySelector(".v322-plan-title")) {
      cryptoPanel.insertAdjacentHTML("afterbegin", `
        <div class="v322-plan-title">
          <div><b>KRİPTO RİSK</b><span>İşlem başı risk, kaldıraç ve hedef planı</span></div>
          <i class="fa-brands fa-bitcoin" style="color:#60a5fa"></i>
        </div>
      `);
    }

    const labels = {
      "finance-current-bank": "Kasa",
      "finance-split-count": "Kasayı kaç kupona böleyim?",
      "finance-trade-count": "Günlük bahis sayısı",
      "finance-default-odds": "Alınan oran",
      "finance-target-pct": "Günlük hedef %",
      "crypto-current-bank": "Kasa",
      "crypto-split-count": "Risk dağılımı",
      "crypto-trade-count": "Günlük işlem sayısı",
      "crypto-tp-pct": "Kâr al hedefi %",
      "crypto-leverage": "Kaldıraç",
      "crypto-target-pct": "Günlük hedef %",
      "crypto-default-exchange": "Borsa",
      "crypto-default-quote": "Parite",
      "crypto-default-symbol": "Alınan işlem / Coin",
      "crypto-default-side": "Yön"
    };

    Object.entries(labels).forEach(([id, text]) => {
      const el = qs("#" + id);
      const label = el?.closest(".finance-field")?.querySelector("label");
      if (label) label.textContent = text;
    });

    const betNote = qs(".simple-plan-help");
    if (betNote) betNote.textContent = "Bahis modunda tutar + oran yazılır. Kazandı/kaybetti kapatınca kasa ve P/L hesaplanır.";

    const cryptoNote = qs(".crypto-plan-note");
    if (cryptoNote) cryptoNote.textContent = "Kripto modunda coin, yön ve işlem sonucu takip edilir. Oran yerine işlem sonucu kâr/zarar üzerinden hesaplanır.";
  }

  function renderBalanceEmptyIfNeeded() {
    const box = qs("#omega-apex-chart-main");
    if (!box) return;

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem("v19_h") || "[]"); } catch {}
    if (!hist || hist.length <= 1) {
      if (!box.querySelector(".v322-balance-empty") && box.children.length === 0) {
        box.innerHTML = `<div class="v32-empty-chart v322-balance-empty"><div><b>Henüz bakiye geçmişi yok</b><span>Bahis veya kripto işlemleri kapandıkça kasa eğrisi burada oluşacak.</span></div></div>`;
      }
    }
  }

  function ensureRollingPlan() {
    if (!window._ROLLING_DB) {
      try { window._ROLLING_DB = JSON.parse(localStorage.getItem("v19_rolling") || "{}"); } catch { window._ROLLING_DB = {}; }
    }
    if (!window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS]) {
      window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS] = { startBal: 100, targetBal: window.ROLLING_TARGETS?.[window._ACTIVE_EXCEL_DAYS] || 1000, ops: {} };
    }
    const plan = window._ROLLING_DB[window._ACTIVE_EXCEL_DAYS];
    if (!plan.ops) plan.ops = {};
    return plan;
  }

  function saveRolling() {
    if (typeof window.omega_SaveRollingDB === "function") window.omega_SaveRollingDB();
    else localStorage.setItem("v19_rolling", JSON.stringify(window._ROLLING_DB));
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
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
    const filled = plan.ops[day].filter(Boolean).length;
    plan.ops[day].length = Math.max(Number(count || 10), filled, 1);
    saveRolling();
    window.omega_RenderExcelTable();
  };

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= window._ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      const filled = plan.ops[day].filter(Boolean).length;
      plan.ops[day].length = Math.max(Number(count || 10), filled, 1);
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

    let html = `
      <div class="rolling-toolbar-v322">
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
          if (op.res === "win") { runningBalance += pnl; totalProfit += pnl; dayProfit += pnl; }
          else { runningBalance -= pnl; totalProfit -= pnl; dayProfit -= pnl; }

          cards.push(`
            <div class="kapsul v322 ${op.res}">
              <button class="k-undo v322" onclick="omega_UndoExcelOp(${day}, ${slot})">×</button>
              <div class="k-result-v322">
                <div class="k-note-show">${op.note || "İşlem notu yok"}</div>
                <b>$${amt} × ${odds}</b>
                <span style="color:${op.res === "win" ? "var(--green)" : "var(--red)"}">${op.res === "win" ? "+" : "-"}$${pnl.toFixed(2)}</span>
              </div>
            </div>
          `);
        } else {
          cards.push(`
            <div class="kapsul v322">
              <input type="text" id="e-n-${day}-${slot}" placeholder="Maç / coin / işlem notu">
              <div class="k-inputs-v322">
                <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                <input type="number" id="e-o-${day}-${slot}" placeholder="Oran / RR">
              </div>
              <div class="k-actions v322">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">KAZANDI</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">KAYBETTİ</button>
              </div>
            </div>
          `);
        }
      }

      html += `
        <div class="day-row-capsule v322">
          <div class="day-info-v322">
            <h3>GÜN ${day}</h3>
            <span>Başlangıç: <b>$${dayStart.toFixed(2)}</b></span>
            <span>Gün P/L: <b style="color:${dayProfit >= 0 ? "var(--green)" : "var(--red)"}">${dayProfit >= 0 ? "+" : ""}$${dayProfit.toFixed(2)}</b></span>
            <div class="day-tools-v322">
              <button class="gold" onclick="omega_RollingAddSlot(${day})">+ İŞLEM</button>
              <button onclick="omega_RollingRemoveSlot(${day})">- SİL</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 10)">10</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 20)">20</button>
              <button onclick="omega_RollingClearDay(${day})">TEMİZLE</button>
            </div>
          </div>
          <div class="capsule-container v322">${cards.join("")}</div>
          <div class="day-result v322"><small>Gün Sonu</small>$${runningBalance.toFixed(2)}</div>
        </div>
      `;
    }

    wrapper.innerHTML = html;

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
    return result;
  };

  function boot() {
    bindTabs();
    labelFinanceFields();
    hardSetFinanceMode(window._FINANCE_MODE || "bet");
    renderBalanceEmptyIfNeeded();
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(boot, 600);
    setTimeout(boot, 1600);
  });

  window.addEventListener("hashchange", () => setTimeout(boot, 300));
  setInterval(() => {
    if (location.hash === "#finance") boot();
  }, 1200);
})();
