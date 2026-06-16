// ===============================
// V47 KASA YÖNETİMİ - GENEL KASA MERKEZİ
// Bu dosya artık işlem girişi yapmaz. Bahis/Kripto işlem alanları ROLLING modülündedir.
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1"; // legacy ortak kayıt; V972 split için fallback.
  const STORAGE_KEY_BET = "v972_rolling_bet_state_v1";
  const STORAGE_KEY_CRYPTO = "v972_rolling_crypto_state_v1";
  const STORAGE_KEY_UI = "v972_rolling_ui_state_v1";
  const SOURCES_KEY = "v47_cash_sources";
  const ROLLING_KEY = "v19_rolling";

  const DEFAULT_SOURCES = {
    exchanges: [
      { id: "binance", name: "Binance", balance: "" },
      { id: "okx", name: "OKX", balance: "" },
      { id: "bybit", name: "Bybit", balance: "" },
      { id: "mexc", name: "MEXC", balance: "" },
      { id: "gate", name: "Gate", balance: "" },
      { id: "other_exchange", name: "Diğer Borsa", balance: "" }
    ],
    sites: [
      { id: "site_1", name: "Site 1", balance: "" },
      { id: "site_2", name: "Site 2", balance: "" },
      { id: "site_3", name: "Site 3", balance: "" },
      { id: "site_4", name: "Site 4", balance: "" },
      { id: "site_5", name: "Site 5", balance: "" },
      { id: "site_6", name: "Site 6", balance: "" }
    ]
  };

  function qs(id) { return document.getElementById(id); }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === "") return fallback;
      const parsed = JSON.parse(raw);
      return parsed === undefined || parsed === null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }
  function storageHas(key) {
    try { return localStorage.getItem(key) !== null; } catch { return false; }
  }

  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(v) {
    const n = Number(v || 0);
    return "%" + n.toFixed(2);
  }

  function createSlots(type = "bet") {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type,
      name: "",
      stake: "",
      odds: type === "bet" ? "1.30" : "2",
      status: "pending",
      pnl: 0
    }));
  }

  function loadState() {
    try {
      const parsed = readJson(STORAGE_KEY, {});
      const state = {
        bank: 1000,
        modeSlots: { bet: createSlots("bet"), crypto: createSlots("crypto") },
        ...(parsed && typeof parsed === "object" ? parsed : {})
      };

      if (!state.modeSlots || typeof state.modeSlots !== "object") {
        const old = Array.isArray(state.slots) ? state.slots : createSlots("bet");
        state.modeSlots = {
          bet: old.map((s, i) => ({ ...createSlots("bet")[i], ...s, type: "bet" })),
          crypto: createSlots("crypto")
        };
      }

      const ui = readJson(STORAGE_KEY_UI, {});
      if (ui && typeof ui === "object" && ui.bank !== undefined) state.bank = Number(ui.bank || 1000);

      if (storageHas(STORAGE_KEY_BET)) {
        const betStore = readJson(STORAGE_KEY_BET, {});
        if (Array.isArray(betStore.slots)) state.modeSlots.bet = betStore.slots;
      }
      if (storageHas(STORAGE_KEY_CRYPTO)) {
        const cryptoStore = readJson(STORAGE_KEY_CRYPTO, {});
        if (Array.isArray(cryptoStore.slots)) state.modeSlots.crypto = cryptoStore.slots;
      }

      if (!Array.isArray(state.modeSlots.bet) || !state.modeSlots.bet.length) state.modeSlots.bet = createSlots("bet");
      if (!Array.isArray(state.modeSlots.crypto) || !state.modeSlots.crypto.length) state.modeSlots.crypto = createSlots("crypto");
      state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = s.id || i + 1; });
      state.modeSlots.crypto.forEach((s, i) => { s.type = "crypto"; s.id = s.id || i + 1; });
      return state;
    } catch {
      return { bank: 1000, modeSlots: { bet: createSlots("bet"), crypto: createSlots("crypto") } };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSources() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SOURCES_KEY) || "{}");
      return {
        exchanges: DEFAULT_SOURCES.exchanges.map((d, i) => ({ ...d, ...(parsed.exchanges?.[i] || {}) })),
        sites: DEFAULT_SOURCES.sites.map((d, i) => ({ ...d, ...(parsed.sites?.[i] || {}) }))
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_SOURCES));
    }
  }

  function saveSources(sources) {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
  }

  function slotSummary(slots) {
    const settled = slots.filter(s => s.status === "win" || s.status === "loss");
    const pnl = settled.reduce((sum, s) => sum + Number(s.pnl || 0), 0);
    const open = slots.filter(s => s.status === "pending").reduce((sum, s) => sum + Number(s.stake || 0), 0);
    const wins = settled.filter(s => s.status === "win").length;
    const losses = settled.filter(s => s.status === "loss").length;
    const used = settled.reduce((sum, s) => sum + Number(s.stake || 0), 0);
    const roi = used ? (pnl / used) * 100 : 0;
    return { settled: settled.length, pnl, open, wins, losses, roi };
  }

  function rollingSummary(modeFilter = "all") {
    let db = {};
    try { db = JSON.parse(localStorage.getItem(ROLLING_KEY) || "{}"); } catch {}

    let startTotal = 0;
    let currentTotal = 0;
    let opCount = 0;

    Object.entries(db).forEach(([key, plan]) => {
      if (!plan) return;
      const mode = plan.mode || (String(key).startsWith("crypto_") ? "crypto" : String(key).startsWith("bet_") ? "bet" : "bet");
      if (modeFilter !== "all" && mode !== modeFilter) return;

      let balance = Number(plan.startBal || 0);
      const start = balance;
      Object.values(plan.ops || {}).forEach(dayOps => {
        (dayOps || []).forEach(op => {
          if (!op) return;
          opCount++;
          const amt = Number(op.amt || 0);
          const val = Number(op.odds || 0);
          const pnl = mode === "crypto" ? Math.abs(amt * (val / 100)) : (op.res === "win" ? (amt * val) - amt : amt);
          balance += op.res === "win" ? pnl : -pnl;
        });
      });
      startTotal += start;
      currentTotal += balance;
    });

    return { startTotal, currentTotal, pnl: currentTotal - startTotal, opCount };
  }

  function totalSourceBalance(sources) {
    return [...sources.exchanges, ...sources.sites].reduce((sum, s) => sum + Number(s.balance || 0), 0);
  }

  function renderSourceInputs(title, icon, group, list) {
    return `
      <div class="cash-v47-source-card">
        <h3><i class="${icon}"></i> ${title}</h3>
        <div class="cash-v47-source-grid">
          ${list.map((src, i) => `
            <div class="cash-v47-source-row">
              <input data-source-name="${group}:${i}" value="${escapeHtml(src.name)}" placeholder="Ad">
              <input data-source-balance="${group}:${i}" type="number" step="0.01" value="${src.balance}" placeholder="$0.00">
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderRoot() {
    const root = qs("v19-finance-block");
    if (!root) return;

    const state = loadState();
    const sources = loadSources();

    const bet = slotSummary(state.modeSlots.bet);
    const crypto = slotSummary(state.modeSlots.crypto);
    const roll = rollingSummary();
    const betRoll = rollingSummary('bet');
    const cryptoRoll = rollingSummary('crypto');
    const sourcesTotal = totalSourceBalance(sources);
    const totalPnl = bet.pnl + crypto.pnl + roll.pnl;
    const currentBank = Number(state.bank || 0) + totalPnl + sourcesTotal;

    root.innerHTML = `
      <div class="cash-v47-root">
        <div class="cash-v47-hero">
          <div>
            <h2><i class="fa-solid fa-wallet"></i> KASA YÖNETİMİ</h2>
            <p>Bu bölüm artık sadece genel kasa merkezidir. Bahis/Kripto işlem girişleri ve rolling kayıtları ana menüdeki <b>ROLLING</b> bölümündedir.</p>
          </div>
          <div class="cash-v47-balance">
            <span>GENEL KASA</span>
            <b>${money(currentBank)}</b>
          </div>
        </div>

        <div class="cash-v47-kpi-grid">
          <div class="cash-v47-kpi gold"><span>Başlangıç Kasa</span><b>${money(state.bank)}</b></div>
          <div class="cash-v47-kpi"><span>Bahis P/L</span><b class="${bet.pnl >= 0 ? "pos" : "neg"}">${money(bet.pnl)}</b></div>
          <div class="cash-v47-kpi"><span>Kripto P/L</span><b class="${crypto.pnl >= 0 ? "pos" : "neg"}">${money(crypto.pnl)}</b></div>
          <div class="cash-v47-kpi"><span>Rolling P/L</span><b class="${roll.pnl >= 0 ? "pos" : "neg"}">${money(roll.pnl)}</b></div>
          <div class="cash-v47-kpi"><span>Borsa/Site Bakiyesi</span><b>${money(sourcesTotal)}</b></div>
          <div class="cash-v47-kpi"><span>Toplam K/Z</span><b class="${totalPnl >= 0 ? "pos" : "neg"}">${money(totalPnl)}</b></div>
        </div>

        <div class="cash-v47-chart-card">
          <div class="cash-v47-card-head">
            <div>
              <h3><i class="fa-solid fa-chart-line"></i> Genel Kasa Özeti</h3>
              <span>Rolling, bahis, kripto işlemleri ve manuel borsa/site bakiyeleri tek yerde toplanır.</span>
            </div>
            <a href="#rolling" class="cash-v47-link">ROLLING'E GİT</a>
          </div>
          <div class="cash-v47-bars">
            ${renderBar("Bahis", bet.pnl, totalPnl)}
            ${renderBar("Kripto", crypto.pnl, totalPnl)}
            ${renderBar("Rolling", roll.pnl, totalPnl)}
            ${renderBar("Borsa/Site", sourcesTotal, currentBank)}
          </div>
        </div>

        <div class="cash-v47-split">
          <div class="cash-v47-card">
            <h3><i class="fa-solid fa-ticket"></i> Bahis Durumu</h3>
            <div class="cash-v47-mini-grid">
              <div><span>Kapalı Kupon</span><b>${bet.settled}</b></div>
              <div><span>Kazanç/Kayıp</span><b>${bet.wins} / ${bet.losses}</b></div>
              <div><span>Açık Tutar</span><b>${money(bet.open)}</b></div>
              <div><span>Bahis Rolling</span><b>${money(betRoll.pnl)}</b></div>
            </div>
          </div>
          <div class="cash-v47-card">
            <h3><i class="fa-brands fa-bitcoin"></i> Kripto Durumu</h3>
            <div class="cash-v47-mini-grid">
              <div><span>Kapalı İşlem</span><b>${crypto.settled}</b></div>
              <div><span>Kazanç/Kayıp</span><b>${crypto.wins} / ${crypto.losses}</b></div>
              <div><span>Açık Marjin</span><b>${money(crypto.open)}</b></div>
              <div><span>Kripto Rolling</span><b>${money(cryptoRoll.pnl)}</b></div>
            </div>
          </div>
        </div>

        <div class="cash-v47-split">
          ${renderSourceInputs("Borsa Bakiyeleri", "fa-solid fa-coins", "exchanges", sources.exchanges)}
          ${renderSourceInputs("Site Bakiyeleri", "fa-solid fa-globe", "sites", sources.sites)}
        </div>

        <div class="cash-v47-actions">
          <button type="button" id="cash-v47-save">BAKİYELERİ KAYDET</button>
          <button type="button" id="cash-v47-reset">MANUEL BAKİYELERİ TEMİZLE</button>
        </div>
      </div>
    `;

    bindRoot(state, sources);
  }

  function renderBar(label, value, total) {
    const n = Math.abs(Number(value || 0));
    const denom = Math.max(1, Math.abs(Number(total || 0)));
    const w = Math.min(100, Math.max(5, (n / denom) * 100));
    const cls = Number(value || 0) >= 0 ? "pos" : "neg";
    return `
      <div class="cash-v47-bar-row">
        <span>${label}</span>
        <div><i class="${cls}" style="width:${w}%"></i></div>
        <b class="${cls}">${money(value)}</b>
      </div>
    `;
  }

  function bindRoot(state, sources) {
    document.querySelectorAll("[data-source-name]").forEach(input => {
      input.addEventListener("input", () => {
        const [group, idx] = input.dataset.sourceName.split(":");
        sources[group][Number(idx)].name = input.value;
      });
    });

    document.querySelectorAll("[data-source-balance]").forEach(input => {
      input.addEventListener("input", () => {
        const [group, idx] = input.dataset.sourceBalance.split(":");
        sources[group][Number(idx)].balance = input.value;
      });
    });

    qs("cash-v47-save")?.addEventListener("click", () => {
      saveSources(sources);
      renderRoot();
    });

    qs("cash-v47-reset")?.addEventListener("click", () => {
      if (!confirm("Manuel borsa/site bakiyeleri temizlensin mi?")) return;
      saveSources(JSON.parse(JSON.stringify(DEFAULT_SOURCES)));
      renderRoot();
    });
  }

  function boot() {
    const root = qs("v19-finance-block");
    if (root) renderRoot();
  }

  window.omega_RefreshFinanceDashboard = renderRoot;
  window.omega_RenderApexSupremeChart = function () {};
  window.omega_CalculateStakePlan = function () {};
  window.omega_ApplyStakeToEmptySlots = function () {};
  window.omega_ClearTodaySlots = function () {};
  window.omega_ResetFinanceAll = function () {};
  window.omega_SetFinanceMode = function () {};
  window.omega_FinanceRailAction = function () {};
  window.omega_ShowFinanceToast = function (msg) {
    try {
      const el = document.createElement("div");
      el.className = "v28-alarm-notice show";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    } catch {}
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.addEventListener("storage", e => {
    const watched = [STORAGE_KEY, STORAGE_KEY_BET, STORAGE_KEY_CRYPTO, STORAGE_KEY_UI, SOURCES_KEY, ROLLING_KEY];
    if (watched.includes(e.key)) {
      if (location.hash.startsWith("#finance")) renderRoot();
    }
  });
})();
