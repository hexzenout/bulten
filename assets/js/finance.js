// ===============================
// V26 FINANCE CLEAN MODULE
// Sade Kasa Yönetimi
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1";

  const DEFAULT_STATE = {
    mode: "bet",
    bank: 1000,
    split: 20,
    tradeCount: 20,
    odds: 1.30,
    targetPct: 30,
    chartFilter: "all",
    activeView: "home",
    railCollapsed: false,
    modeSlots: null,

    cryptoRiskPct: 1,
    cryptoLeverage: 10,
    cryptoStopPct: 1,
    cryptoRR: 2,

    slots: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type: "bet",
      name: "",
      stake: "",
      odds: "1.30",
      status: "pending",
      pnl: 0
    }))
  };

  let state = loadState();
  let chart = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_STATE);

      const parsed = JSON.parse(raw);
      const merged = { ...clone(DEFAULT_STATE), ...parsed };

      if (!Array.isArray(merged.slots) || merged.slots.length !== 20) {
        merged.slots = clone(DEFAULT_STATE.slots);
      }

      if (!merged.activeView) merged.activeView = 'home';
      return merged;
    } catch (e) {
      return clone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  function ensureModeSlots() {
    if (!state.modeSlots || typeof state.modeSlots !== "object") {
      const old = Array.isArray(state.slots) ? state.slots : clone(DEFAULT_STATE.slots);
      state.modeSlots = {
        bet: old.map((s, i) => ({ ...createSlots("bet")[i], ...s, type: "bet" })),
        crypto: createSlots("crypto")
      };
    }

    if (!Array.isArray(state.modeSlots.bet) || state.modeSlots.bet.length !== 20) {
      state.modeSlots.bet = createSlots("bet");
    }

    if (!Array.isArray(state.modeSlots.crypto) || state.modeSlots.crypto.length !== 20) {
      state.modeSlots.crypto = createSlots("crypto");
    }

    state.modeSlots.bet.forEach(s => s.type = "bet");
    state.modeSlots.crypto.forEach(s => s.type = "crypto");
  }

  function activeSlots() {
    ensureModeSlots();
    return state.mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
  }

  function setActiveSlots(slots) {
    ensureModeSlots();
    if (state.mode === "crypto") state.modeSlots.crypto = slots;
    else state.modeSlots.bet = slots;
  }

  function allModeSlots() {
    ensureModeSlots();
    return [...state.modeSlots.bet, ...state.modeSlots.crypto];
  }

  function setView(view, mode = null) {
    if (mode) state.mode = mode;
    state.activeView = view;
    if (view === "betPlan" || view === "betDaily") state.mode = "bet";
    if (view === "cryptoRisk" || view === "cryptoDaily") state.mode = "crypto";
    saveState();
    renderRoot();
  }


  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function pct(v) {
    const n = Number(v || 0);
    return "%" + n.toFixed(2);
  }

  function qs(id) {
    return document.getElementById(id);
  }

  function showToast(message) {
    let toast = document.getElementById("finance-clean-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "finance-clean-toast";
      toast.className = "finance-clean-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.__financeCleanToastTimer);
    window.__financeCleanToastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function injectFinanceStyles() {
    if (document.getElementById("finance-clean-style")) return;

    const style = document.createElement("style");
    style.id = "finance-clean-style";
    style.innerHTML = `
      .finance-clean-toast {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 50000;
        background: #101010;
        border: 1px solid #333;
        color: #fff;
        padding: 12px 14px;
        border-radius: 12px;
        box-shadow: 0 18px 45px rgba(0,0,0,.55);
        font-size: .82em;
        font-weight: 850;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: .2s;
      }

      .finance-clean-toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .finance-clean-root {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .finance-clean-top {
        background: linear-gradient(135deg, #151515, #090909);
        border: 1px solid #2d2d2d;
        border-radius: 18px;
        padding: 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .finance-clean-top h2 {
        margin: 0 0 6px;
        color: var(--gold);
        font-size: 1.15em;
        font-weight: 950;
        letter-spacing: .8px;
      }

      .finance-clean-top p {
        margin: 0;
        color: #aaa;
        font-size: .82em;
        font-weight: 700;
        line-height: 1.5;
      }

      .finance-clean-balance-box {
        text-align: right;
        min-width: 190px;
      }

      .finance-clean-balance-box span {
        display: block;
        color: #888;
        font-size: .66em;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .7px;
        margin-bottom: 6px;
      }

      .finance-clean-balance-box b {
        color: var(--gold);
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.8em;
      }

      .finance-clean-kpis {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
      }

      .finance-clean-kpi {
        background: #111;
        border: 1px solid #292929;
        border-radius: 14px;
        padding: 13px;
        min-height: 74px;
      }

      .finance-clean-kpi span {
        display: block;
        color: #888;
        font-size: .58em;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .7px;
        margin-bottom: 8px;
      }

      .finance-clean-kpi b {
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.02em;
      }

      .finance-clean-kpi.good b { color: var(--green); }
      .finance-clean-kpi.bad b { color: var(--red); }
      .finance-clean-kpi.gold b { color: var(--gold); }

      .finance-clean-grid {
        display: grid;
        grid-template-columns: 1.1fr .9fr;
        gap: 16px;
        align-items: start;
      }

      .finance-clean-card {
        background: #101010;
        border: 1px solid #292929;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 14px 34px rgba(0,0,0,.2);
      }

      .finance-clean-head {
        padding: 15px 16px;
        border-bottom: 1px solid #242424;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        background: #141414;
      }

      .finance-clean-head h3 {
        margin: 0;
        color: #fff;
        font-size: .86em;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .6px;
      }

      .finance-clean-head span {
        color: #888;
        font-size: .72em;
        font-weight: 800;
      }

      .finance-clean-body {
        padding: 16px;
      }

      .finance-clean-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        background: #090909;
        border: 1px solid #2b2b2b;
        border-radius: 14px;
        padding: 8px;
        margin-bottom: 13px;
      }

      .finance-clean-tab {
        border: 1px solid transparent;
        background: transparent;
        color: #999;
        border-radius: 10px;
        padding: 11px;
        font-size: .78em;
        font-weight: 950;
        cursor: pointer;
      }

      .finance-clean-tab.active.bet {
        background: var(--gold);
        color: #171000;
      }

      .finance-clean-tab.active.crypto {
        background: var(--blue-accent);
        color: #06142b;
      }

      .finance-clean-form {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .finance-clean-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .finance-clean-field label {
        color: #aaa;
        font-size: .62em;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .7px;
      }

      .finance-clean-field input {
        background: #070707;
        border: 1px solid #333;
        color: #fff;
        border-radius: 10px;
        padding: 11px 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: .86em;
      }

      .finance-clean-field input:focus {
        border-color: var(--gold);
        box-shadow: 0 0 0 2px rgba(251,191,36,.08);
      }

      .finance-clean-result {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 9px;
        margin-top: 12px;
      }

      .finance-clean-result-box {
        background: #080808;
        border: 1px solid #292929;
        border-radius: 13px;
        padding: 12px;
      }

      .finance-clean-result-box span {
        display: block;
        color: #888;
        font-size: .58em;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .6px;
        margin-bottom: 7px;
      }

      .finance-clean-result-box b {
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 1em;
      }

      .finance-clean-result-box.main {
        border-color: rgba(251,191,36,.45);
      }

      .finance-clean-result-box.main b {
        color: var(--gold);
      }

      .finance-clean-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
        margin-top: 12px;
      }

      .finance-clean-btn {
        border: 1px solid #333;
        background: #1a1a1a;
        color: #fff;
        border-radius: 10px;
        padding: 11px 12px;
        font-size: .75em;
        font-weight: 950;
        cursor: pointer;
        letter-spacing: .5px;
        text-transform: uppercase;
      }

      .finance-clean-btn:hover {
        background: #242424;
        border-color: #555;
      }

      .finance-clean-btn.gold {
        background: var(--gold);
        color: #171000;
        border-color: var(--gold);
      }

      .finance-clean-btn.green {
        background: var(--green);
        color: #00170d;
        border-color: var(--green);
      }

      .finance-clean-btn.red {
        background: rgba(239,68,68,.12);
        color: #ff9a9a;
        border-color: rgba(239,68,68,.4);
      }

      .finance-clean-chart {
        height: 330px;
        background: #070707;
        border: 1px solid #262626;
        border-radius: 14px;
        padding: 8px;
      }

      .finance-clean-barriers {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .finance-clean-barrier {
        border: 1px solid #303030;
        background: #151515;
        color: #aaa;
        border-radius: 999px;
        padding: 7px 10px;
        font-family: 'JetBrains Mono', monospace;
        font-size: .68em;
        font-weight: 950;
      }

      .finance-clean-barrier.done {
        background: var(--green);
        border-color: var(--green);
        color: #00170d;
      }

      .finance-clean-barrier.next {
        background: var(--gold);
        border-color: var(--gold);
        color: #171000;
      }

      .finance-clean-table-wrap {
        overflow: auto;
        border: 1px solid #292929;
        border-radius: 14px;
        max-height: 610px;
      }

      .finance-clean-table {
        width: 100%;
        min-width: 900px;
        border-collapse: collapse;
        font-size: .78em;
      }

      .finance-clean-table th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #171717;
        color: #aaa;
        padding: 10px;
        text-align: left;
        font-size: .68em;
        text-transform: uppercase;
        letter-spacing: .6px;
      }

      .finance-clean-table td {
        border-bottom: 1px solid #222;
        padding: 8px;
        color: #eee;
      }

      .finance-clean-table input,
      .finance-clean-table select {
        width: 100%;
        background: #070707;
        border: 1px solid #333;
        color: #fff;
        border-radius: 8px;
        padding: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: .8em;
      }

      .finance-clean-mini-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        min-width: 170px;
      }

      .finance-clean-mini-actions button {
        border: none;
        border-radius: 8px;
        padding: 8px;
        font-size: .68em;
        font-weight: 950;
        cursor: pointer;
      }

      .finance-clean-mini-actions .win {
        background: var(--green);
        color: #00170d;
      }

      .finance-clean-mini-actions .loss {
        background: var(--red);
        color: #fff;
      }

      .finance-clean-mini-actions .pending {
        background: #262626;
        color: #ddd;
        grid-column: span 2;
      }

      .finance-clean-pnl-pos {
        color: var(--green);
        font-family: 'JetBrains Mono', monospace;
        font-weight: 950;
      }

      .finance-clean-pnl-neg {
        color: var(--red);
        font-family: 'JetBrains Mono', monospace;
        font-weight: 950;
      }

      .finance-clean-secondary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .finance-clean-rolling {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
      }

      .finance-clean-roll {
        background: #151515;
        border: 1px solid #292929;
        border-radius: 12px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
      }

      .finance-clean-roll:hover {
        border-color: var(--gold);
      }

      .finance-clean-roll span {
        display: block;
        color: #888;
        font-size: .6em;
        font-weight: 950;
        margin-bottom: 5px;
      }

      .finance-clean-roll b {
        color: var(--gold);
        font-family: 'JetBrains Mono', monospace;
        font-size: .84em;
      }

      @media(max-width: 1150px) {
        .finance-clean-grid,
        .finance-clean-secondary {
          grid-template-columns: 1fr;
        }

        .finance-clean-kpis {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media(max-width: 720px) {
        .finance-clean-top {
          flex-direction: column;
          align-items: flex-start;
        }

        .finance-clean-balance-box {
          text-align: left;
        }

        .finance-clean-kpis {
          grid-template-columns: repeat(2, 1fr);
        }

        .finance-clean-form,
        .finance-clean-actions,
        .finance-clean-result {
          grid-template-columns: 1fr;
        }

        .finance-clean-rolling {
          grid-template-columns: repeat(2, 1fr);
        }
      }


      /* V46C finance.js gerçek çözüm: eski alttaki rolling kartı artık yok, sol rail burada. */
      .finance-clean-layout {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }

      .finance-clean-main {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .finance-clean-rail {
        position: sticky;
        top: 78px;
        display: grid;
        gap: 12px;
        padding: 11px;
        border: 1px solid #2b2b2b;
        border-radius: 18px;
        background: #0b0b0b;
        box-shadow: 0 16px 42px rgba(0,0,0,.34);
      }

      .finance-clean-rail-section {
        display: grid;
        gap: 8px;
        padding-bottom: 11px;
        border-bottom: 1px solid #242424;
      }

      .finance-clean-rail-section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .finance-clean-rail-title {
        min-height: 26px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 950;
        letter-spacing: .8px;
        font-size: .73em;
        color: #aaa;
      }

      .finance-clean-rail-section.bet .finance-clean-rail-title,
      .finance-clean-rail-section.bet .finance-clean-rail-title i {
        color: #fbbf24;
      }

      .finance-clean-rail-section.crypto .finance-clean-rail-title,
      .finance-clean-rail-section.crypto .finance-clean-rail-title i {
        color: #60a5fa;
      }

      .finance-clean-rail-btn,
      .finance-clean-rail-roll summary,
      .finance-clean-rail-roll button {
        width: 100%;
        min-height: 38px;
        border: 1px solid #303030;
        border-radius: 11px;
        background: #151515;
        color: #e5e5e5;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        letter-spacing: .3px;
        font-size: .68em;
        text-align: center;
      }

      .finance-clean-rail-btn.bet.active,
      .finance-clean-rail-btn.bet:hover {
        background: rgba(251,191,36,.16);
        border-color: #fbbf24;
        color: #fbbf24;
      }

      .finance-clean-rail-btn.crypto.active,
      .finance-clean-rail-btn.crypto:hover {
        background: rgba(96,165,250,.15);
        border-color: #60a5fa;
        color: #60a5fa;
      }

      .finance-clean-rail-roll summary {
        list-style: none;
      }

      .finance-clean-rail-roll summary::-webkit-details-marker {
        display: none;
      }

      .finance-clean-rail-roll.bet summary {
        background: linear-gradient(135deg,#fbbf24,#f59e0b);
        border-color: #fbbf24;
        color: #111;
      }

      .finance-clean-rail-roll.crypto summary {
        background: linear-gradient(135deg,#60a5fa,#2563eb);
        border-color: #60a5fa;
        color: #06111f;
      }

      .finance-clean-rail-roll > div {
        display: grid;
        gap: 7px;
        margin-top: 8px;
      }

      .finance-clean-rail-roll button {
        min-height: 33px;
        background: #101010;
        font-size: .63em;
      }

      .finance-clean-chart-head {
        align-items: flex-start;
      }

      .finance-clean-chart-filters {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .finance-clean-chart-filters button {
        min-height: 32px;
        border: 1px solid #333;
        border-radius: 999px;
        padding: 0 12px;
        background: #111;
        color: #aaa;
        font-weight: 950;
        cursor: pointer;
        font-size: .68em;
      }

      .finance-clean-chart-filters button.active,
      .finance-clean-chart-filters button:hover {
        background: var(--gold);
        border-color: var(--gold);
        color: #111;
      }

      .finance-clean-chart-card .finance-clean-body {
        position: relative;
      }

      .finance-clean-chart-summary {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }

      .finance-clean-chart-summary div {
        border: 1px solid #292929;
        border-radius: 12px;
        background: #0b0b0b;
        padding: 10px;
      }

      .finance-clean-chart-summary span {
        display: block;
        color: #888;
        font-size: .62em;
        font-weight: 950;
        text-transform: uppercase;
        margin-bottom: 5px;
      }

      .finance-clean-chart-summary b {
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
        font-size: .86em;
      }

      .finance-clean-chart-summary b.pos {
        color: var(--green);
      }

      .finance-clean-chart-summary b.neg {
        color: var(--red);
      }

      .finance-clean-chart-empty {
        display: none;
        place-items: center;
        gap: 5px;
        min-height: 86px;
        border: 1px dashed #333;
        border-radius: 14px;
        background: #080808;
        color: #aaa;
        text-align: center;
        margin-top: 10px;
      }

      .finance-clean-chart-empty b {
        color: #fbbf24;
        font-size: .92em;
      }

      .finance-clean-chart-empty span {
        color: #888;
        font-size: .78em;
        font-weight: 700;
      }

      .finance-clean-secondary,
      .finance-clean-rolling,
      .finance-clean-roll {
        display: none !important;
      }

      @media(max-width: 1150px) {
        .finance-clean-layout {
          grid-template-columns: 1fr;
        }

        .finance-clean-rail {
          position: static;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .finance-clean-rail-section {
          border-bottom: none;
          border-right: 1px solid #242424;
          padding-right: 10px;
        }

        .finance-clean-rail-section:last-child {
          border-right: none;
          padding-right: 0;
        }

        .finance-clean-chart-summary {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media(max-width: 720px) {
        .finance-clean-rail {
          grid-template-columns: 1fr;
        }

        .finance-clean-rail-section {
          border-right: none;
          border-bottom: 1px solid #242424;
          padding-right: 0;
        }

        .finance-clean-chart-summary {
          grid-template-columns: 1fr;
        }
      }



      /* V46D mode split */
      .v46d-finance-root.rail-collapsed .finance-clean-rail {
        display: none !important;
      }

      .v46d-finance-root.rail-collapsed .finance-clean-layout {
        grid-template-columns: 1fr !important;
      }

      .finance-mobile-rail-toggle,
      .finance-clean-rail-top {
        min-height: 42px;
        border: 1px solid #333;
        border-radius: 12px;
        background: #151515;
        color: #fff;
        font-weight: 950;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
      }

      .finance-mobile-rail-toggle {
        width: 100%;
        margin-bottom: 10px;
        display: none;
      }

      .finance-clean-rail-section summary.finance-clean-rail-title {
        cursor: pointer;
        list-style: none;
      }

      .finance-clean-rail-section summary.finance-clean-rail-title::-webkit-details-marker {
        display: none;
      }

      .finance-clean-rail-body {
        display: grid;
        gap: 8px;
      }

      .finance-mode-home {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .finance-mode-card {
        min-height: 210px;
        border: 1px solid #2d2d2d;
        border-radius: 20px;
        background: linear-gradient(135deg, #151515, #080808);
        color: #fff;
        cursor: pointer;
        padding: 22px;
        text-align: left;
        display: grid;
        align-content: center;
        gap: 10px;
        transition: .18s;
      }

      .finance-mode-card:hover {
        transform: translateY(-2px);
        border-color: var(--gold);
      }

      .finance-mode-card.crypto:hover {
        border-color: #60a5fa;
      }

      .finance-mode-card i {
        font-size: 1.8em;
        color: var(--gold);
      }

      .finance-mode-card.crypto i {
        color: #60a5fa;
      }

      .finance-mode-card b {
        font-size: 1.05em;
        font-weight: 950;
        letter-spacing: .7px;
      }

      .finance-mode-card span {
        color: #aaa;
        font-weight: 750;
        line-height: 1.5;
      }

      .finance-fixed-type {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        min-height: 30px;
        border-radius: 999px;
        font-weight: 950;
        font-size: .72em;
      }

      .finance-fixed-type.bet {
        background: rgba(251,191,36,.15);
        color: #fbbf24;
      }

      .finance-fixed-type.crypto {
        background: rgba(96,165,250,.15);
        color: #60a5fa;
      }

      @media(max-width: 900px) {
        .finance-mobile-rail-toggle {
          display: flex;
        }
        .finance-mode-home {
          grid-template-columns: 1fr;
        }
      }

    `;

    document.head.appendChild(style);
  }

  function totalPnl() {
    return activeSlots().reduce((sum, s) => {
      if (s.status === "win" || s.status === "loss") return sum + Number(s.pnl || 0);
      return sum;
    }, 0);
  }

  function openRisk() {
    return activeSlots().reduce((sum, s) => {
      if (s.status === "pending" && Number(s.stake) > 0) return sum + Number(s.stake);
      return sum;
    }, 0);
  }

  function settledSlots() {
    return activeSlots().filter(s => s.status === "win" || s.status === "loss");
  }

  function winRate() {
    const settled = settledSlots();
    if (!settled.length) return 0;
    const wins = settled.filter(s => s.status === "win").length;
    return (wins / settled.length) * 100;
  }

  function roi() {
    const used = settledSlots().reduce((sum, s) => sum + Number(s.stake || 0), 0);
    if (!used) return 0;
    return (totalPnl() / used) * 100;
  }

  function currentBank() {
    return Number(state.bank || 0) + totalPnl();
  }

  function getBetPlan() {
    const bank = Number(state.bank || 0);
    const split = Math.max(1, Number(state.split || 1));
    const trades = Math.max(1, Math.min(20, Number(state.tradeCount || 1)));
    const odds = Math.max(1, Number(state.odds || 1));
    const targetPct = Number(state.targetPct || 0);

    const stake = bank / split;
    const perProfit = stake * (odds - 1);
    const dailyProfit = perProfit * trades;
    const targetProfit = bank * targetPct / 100;

    return { stake, perProfit, dailyProfit, targetProfit, odds, trades };
  }

  function getCryptoPlan() {
    const bank = Number(state.bank || 0);
    const riskPct = Math.max(0.01, Number(state.cryptoRiskPct || 1));
    const leverage = Math.max(1, Number(state.cryptoLeverage || 1));
    const stopPct = Math.max(0.01, Number(state.cryptoStopPct || 1));
    const rr = Math.max(0.1, Number(state.cryptoRR || 1));

    const maxLoss = bank * riskPct / 100;
    const margin = maxLoss / ((stopPct / 100) * leverage);
    const notional = margin * leverage;
    const targetProfit = maxLoss * rr;

    return { maxLoss, margin, notional, targetProfit, leverage, stopPct, rr };
  }

  function renderRoot() {
    injectFinanceStyles();
    ensureModeSlots();

    const root = qs("v19-finance-block");
    if (!root) return;

    const view = state.activeView || "home";
    const isBetView = view === "betPlan" || view === "betDaily";
    const isCryptoView = view === "cryptoRisk" || view === "cryptoDaily";
    const showPlan = view === "betPlan" || view === "cryptoRisk";
    const showDaily = view === "betDaily" || view === "cryptoDaily";
    const showChart = isBetView || isCryptoView;

    const modeTitle = state.mode === "crypto" ? "KRİPTO" : "BAHİS";
    const chartTitle = state.mode === "crypto" ? "Kripto Kasa Eğrisi" : "Bahis Kasa Eğrisi";
    const chartSub = state.mode === "crypto"
      ? "Aktif/kapanan kripto işlemlerinden gelen P/L eğrisi."
      : "Kombine kupon ve bahis sonuçlarından gelen kasa eğrisi.";
    const dailyTitle = state.mode === "crypto" ? "Aktif Kripto İşlemleri" : "Kombine Kupon Maçları";
    const dailySub = state.mode === "crypto"
      ? "Toplu kripto işlemlerini, manuel PNL / kâr yüzdesi ile takip et."
      : "Kombine kupon maçlarını, tutar ve oranla takip et.";

    root.innerHTML = `
      <div class="finance-clean-root v46d-finance-root ${state.railCollapsed ? "rail-collapsed" : ""}">
        <button class="finance-mobile-rail-toggle" id="finance-rail-toggle">
          <i class="fa-solid fa-bars"></i><span>KASA MENÜSÜ</span>
        </button>

        <div class="finance-clean-layout">
          <aside class="finance-clean-rail">
            <button class="finance-clean-rail-top" data-fin-action="toggleRail">
              <i class="fa-solid fa-bars"></i><span>KASA MENÜSÜ</span>
            </button>

            <details class="finance-clean-rail-section bet" open>
              <summary class="finance-clean-rail-title"><i class="fa-solid fa-ticket"></i><span>BAHİS</span></summary>
              <div class="finance-clean-rail-body">
                <button class="finance-clean-rail-btn bet ${view === "betPlan" ? "active" : ""}" data-fin-action="betPlan">
                  <i class="fa-solid fa-sliders"></i><span>BAHİS PLANI</span>
                </button>
                <details class="finance-clean-rail-roll bet">
                  <summary><i class="fa-solid fa-layer-group"></i><span>BAHİS ROLLING</span></summary>
                  <div>
                    <button data-mode-roll="bet:7">7 GÜN ROLLING</button>
                    <button data-mode-roll="bet:15">15 GÜN ROLLING</button>
                    <button data-mode-roll="bet:30">30 GÜN ROLLING</button>
                    <button data-mode-roll="bet:60">60 GÜN ROLLING</button>
                    <button data-mode-roll="bet:90">90 GÜN ROLLING</button>
                  </div>
                </details>
                <button class="finance-clean-rail-btn bet ${view === "betDaily" ? "active" : ""}" data-fin-action="betDaily">
                  <i class="fa-solid fa-table-cells"></i><span>KOMBİNE KUPON MAÇLARI</span>
                </button>
              </div>
            </details>

            <details class="finance-clean-rail-section crypto" open>
              <summary class="finance-clean-rail-title"><i class="fa-brands fa-bitcoin"></i><span>KRİPTO</span></summary>
              <div class="finance-clean-rail-body">
                <button class="finance-clean-rail-btn crypto ${view === "cryptoRisk" ? "active" : ""}" data-fin-action="cryptoRisk">
                  <i class="fa-solid fa-sliders"></i><span>KRİPTO RİSK</span>
                </button>
                <details class="finance-clean-rail-roll crypto">
                  <summary><i class="fa-solid fa-layer-group"></i><span>KRİPTO ROLLING</span></summary>
                  <div>
                    <button data-mode-roll="crypto:7">7 GÜN ROLLING</button>
                    <button data-mode-roll="crypto:15">15 GÜN ROLLING</button>
                    <button data-mode-roll="crypto:30">30 GÜN ROLLING</button>
                    <button data-mode-roll="crypto:60">60 GÜN ROLLING</button>
                    <button data-mode-roll="crypto:90">90 GÜN ROLLING</button>
                  </div>
                </details>
                <button class="finance-clean-rail-btn crypto ${view === "cryptoDaily" ? "active" : ""}" data-fin-action="cryptoDaily">
                  <i class="fa-solid fa-chart-simple"></i><span>AKTİF KRİPTO İŞLEMLERİ</span>
                </button>
              </div>
            </details>
          </aside>

          <div class="finance-clean-main">
            <div class="finance-clean-top">
              <div>
                <h2><i class="fa-solid fa-wallet"></i> KASA YÖNETİMİ</h2>
                <p>${view === "home" ? "Bahis veya kripto tarafını seç; sadece ilgili plan, eğri ve işlem defteri açılır." : modeTitle + " modu aktif."}</p>
              </div>
              <div class="finance-clean-balance-box">
                <span>Güncel Kasa</span>
                <b id="finance-clean-current-bank">$0.00</b>
              </div>
            </div>

            ${view === "home" ? `
              <div class="finance-mode-home">
                <button class="finance-mode-card bet" data-fin-action="betPlan">
                  <i class="fa-solid fa-ticket"></i>
                  <b>BAHİS YÖNETİMİ</b>
                  <span>Bahis planı, kombine kupon maçları, bahis kasa eğrisi ve bahis rolling.</span>
                </button>
                <button class="finance-mode-card crypto" data-fin-action="cryptoRisk">
                  <i class="fa-brands fa-bitcoin"></i>
                  <b>KRİPTO YÖNETİMİ</b>
                  <span>Kripto risk planı, aktif kripto işlemleri, P/L eğrisi ve kripto rolling.</span>
                </button>
              </div>
            ` : `
              <div class="finance-clean-kpis">
                <div class="finance-clean-kpi gold"><span>Başlangıç Kasa</span><b id="finance-clean-kpi-bank">$0.00</b></div>
                <div class="finance-clean-kpi"><span>${state.mode === "crypto" ? "Gün P/L" : "Gün K/Z"}</span><b id="finance-clean-kpi-day">$0.00</b></div>
                <div class="finance-clean-kpi"><span>Toplam P/L</span><b id="finance-clean-kpi-total">$0.00</b></div>
                <div class="finance-clean-kpi"><span>Açık Risk</span><b id="finance-clean-kpi-risk">$0.00</b></div>
                <div class="finance-clean-kpi"><span>Winrate</span><b id="finance-clean-kpi-winrate">%0.00</b></div>
                <div class="finance-clean-kpi"><span>ROI</span><b id="finance-clean-kpi-roi">%0.00</b></div>
              </div>

              ${showChart ? `
                <div class="finance-clean-card finance-clean-chart-card" id="finance-clean-chart-card">
                  <div class="finance-clean-head finance-clean-chart-head">
                    <div>
                      <h3><i class="fa-solid fa-chart-line"></i> ${chartTitle}</h3>
                      <span>${chartSub}</span>
                    </div>
                  </div>
                  <div class="finance-clean-body">
                    <div class="finance-clean-chart-summary" id="finance-clean-chart-summary"></div>
                    <div id="finance-clean-chart" class="finance-clean-chart"></div>
                    <div class="finance-clean-chart-empty" id="finance-clean-chart-empty">
                      <b>Henüz kapatılmış ${state.mode === "crypto" ? "kripto işlemi" : "bahis kaydı"} yok.</b>
                      <span>Kazandı/Kaybetti veya Kazanç/Kayıp dediğin satırlar burada kasa eğrisine dönüşecek.</span>
                    </div>
                    <div class="finance-clean-barriers" id="finance-clean-barriers"></div>
                  </div>
                </div>
              ` : ""}

              ${showPlan ? `
                <div class="finance-clean-card" id="finance-clean-plan-card">
                  <div class="finance-clean-head">
                    <div>
                      <h3><i class="fa-solid fa-calculator"></i> ${state.mode === "crypto" ? "Kripto Risk" : "Bahis Planı"}</h3>
                      <span>${state.mode === "crypto" ? "Risk, kaldıraç, stop ve hedef kâr hesabı." : "Kasa bölme, kupon tutarı, oran ve hedef hesaplama."}</span>
                    </div>
                  </div>
                  <div class="finance-clean-body">
                    <div id="finance-clean-plan-form"></div>
                    <div id="finance-clean-plan-result" class="finance-clean-result"></div>
                    <div class="finance-clean-actions">
                      <button class="finance-clean-btn gold" id="finance-clean-calc-btn">HESAPLA</button>
                      <button class="finance-clean-btn green" id="finance-clean-apply-btn">20 ALANA UYGULA</button>
                      <button class="finance-clean-btn" id="finance-clean-clear-btn">GÜNÜ TEMİZLE</button>
                      <button class="finance-clean-btn red" id="finance-clean-reset-btn">SIFIRLA</button>
                    </div>
                  </div>
                </div>
              ` : ""}

              ${showDaily ? `
                <div class="finance-clean-card" id="finance-clean-daily-card">
                  <div class="finance-clean-head">
                    <div>
                      <h3><i class="fa-solid fa-table-cells"></i> ${dailyTitle}</h3>
                      <span>${dailySub}</span>
                    </div>
                  </div>
                  <div class="finance-clean-body">
                    <div id="finance-clean-slots" class="finance-clean-table-wrap"></div>
                  </div>
                </div>
              ` : ""}

              <div class="finance-clean-card finance-clean-data-card">
                <div class="finance-clean-head">
                  <div>
                    <h3><i class="fa-solid fa-database"></i> ${modeTitle} Verisi</h3>
                    <span>Yedekleme ve hızlı temizlik</span>
                  </div>
                </div>
                <div class="finance-clean-body">
                  <div class="finance-clean-actions">
                    <button class="finance-clean-btn" id="finance-clean-export-btn">DIŞA AKTAR</button>
                    <button class="finance-clean-btn" id="finance-clean-import-btn">İÇE AKTAR</button>
                  </div>
                  <input type="file" id="finance-clean-import-file" accept=".json" style="display:none;">
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    bindRoot();
    renderAll();
  }

  function renderPlanForm() {
    const box = qs("finance-clean-plan-form");
    if (!box) return;

    if (state.mode === "bet") {
      box.innerHTML = `
        <div class="finance-clean-form">
          <div class="finance-clean-field">
            <label>Kasa</label>
            <input id="fin-bank" type="number" value="${state.bank}">
          </div>
          <div class="finance-clean-field">
            <label>Kasayı Kaç Kupona Böleyim?</label>
            <input id="fin-split" type="number" min="1" max="200" value="${state.split}">
          </div>
          <div class="finance-clean-field">
            <label>Günlük Kupon Sayısı</label>
            <input id="fin-trade-count" type="number" min="1" max="20" value="${state.tradeCount}">
          </div>
          <div class="finance-clean-field">
            <label>Ortalama Oran</label>
            <input id="fin-odds" type="number" step="0.01" value="${state.odds}">
          </div>
          <div class="finance-clean-field">
            <label>Günlük Hedef %</label>
            <input id="fin-target-pct" type="number" step="0.1" value="${state.targetPct}">
          </div>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div class="finance-clean-form">
          <div class="finance-clean-field">
            <label>Kasa</label>
            <input id="fin-bank" type="number" value="${state.bank}">
          </div>
          <div class="finance-clean-field">
            <label>İşlem Başı Risk %</label>
            <input id="fin-crypto-risk" type="number" step="0.1" value="${state.cryptoRiskPct}">
          </div>
          <div class="finance-clean-field">
            <label>Kaldıraç</label>
            <input id="fin-crypto-lev" type="number" step="1" value="${state.cryptoLeverage}">
          </div>
          <div class="finance-clean-field">
            <label>Stop Mesafesi %</label>
            <input id="fin-crypto-stop" type="number" step="0.1" value="${state.cryptoStopPct}">
          </div>
          <div class="finance-clean-field">
            <label>Hedef R/R</label>
            <input id="fin-crypto-rr" type="number" step="0.1" value="${state.cryptoRR}">
          </div>
        </div>
      `;
    }

    bindPlanInputs();
  }

  function bindPlanInputs() {
    const bind = (id, key, parser = Number) => {
      const el = qs(id);
      if (!el) return;
      el.addEventListener("input", () => {
        state[key] = parser(el.value);
        saveState();
        renderPlanResult(false);
        renderKpis();
        renderChart();
      });
    };

    bind("fin-bank", "bank");
    bind("fin-split", "split");
    bind("fin-trade-count", "tradeCount");
    bind("fin-odds", "odds");
    bind("fin-target-pct", "targetPct");
    bind("fin-crypto-risk", "cryptoRiskPct");
    bind("fin-crypto-lev", "cryptoLeverage");
    bind("fin-crypto-stop", "cryptoStopPct");
    bind("fin-crypto-rr", "cryptoRR");
  }

  function renderPlanResult(showMessage = false) {
    const box = qs("finance-clean-plan-result");
    if (!box) return;

    if (state.mode === "bet") {
      const p = getBetPlan();

      box.innerHTML = `
        <div class="finance-clean-result-box main">
          <span>Önerilen Tutar</span>
          <b>${money(p.stake)}</b>
        </div>
        <div class="finance-clean-result-box">
          <span>İşlem Başı Kâr</span>
          <b>${money(p.perProfit)}</b>
        </div>
        <div class="finance-clean-result-box">
          <span>Günlük Potansiyel</span>
          <b>${money(p.dailyProfit)}</b>
        </div>
        <div class="finance-clean-result-box">
          <span>Günlük Hedef</span>
          <b>${money(p.targetProfit)}</b>
        </div>
      `;

      if (showMessage) showToast("Bahis planı hesaplandı.");
      return p.stake;
    }

    const c = getCryptoPlan();

    box.innerHTML = `
      <div class="finance-clean-result-box main">
        <span>Önerilen Marjin</span>
        <b>${money(c.margin)}</b>
      </div>
      <div class="finance-clean-result-box">
        <span>Maksimum Zarar</span>
        <b>${money(c.maxLoss)}</b>
      </div>
      <div class="finance-clean-result-box">
        <span>Pozisyon Büyüklüğü</span>
        <b>${money(c.notional)}</b>
      </div>
      <div class="finance-clean-result-box">
        <span>Hedef Kâr</span>
        <b>${money(c.targetProfit)}</b>
      </div>
    `;

    if (showMessage) showToast("Kripto risk planı hesaplandı.");
    return c.margin;
  }

  function renderKpis() {
    const pnl = totalPnl();
    const risk = openRisk();
    const bankNow = currentBank();

    setText("finance-clean-current-bank", money(bankNow));
    setText("finance-clean-kpi-bank", money(state.bank));
    setText("finance-clean-kpi-day", money(pnl));
    setText("finance-clean-kpi-total", money(pnl));
    setText("finance-clean-kpi-risk", money(risk));
    setText("finance-clean-kpi-winrate", pct(winRate()));
    setText("finance-clean-kpi-roi", pct(roi()));

    colorKpi("finance-clean-kpi-day", pnl);
    colorKpi("finance-clean-kpi-total", pnl);
  }

  function setText(id, text) {
    const el = qs(id);
    if (el) el.textContent = text;
  }

  function colorKpi(id, value) {
    const el = qs(id);
    if (!el) return;

    el.classList.remove("finance-clean-pnl-pos", "finance-clean-pnl-neg");

    if (Number(value) > 0) el.classList.add("finance-clean-pnl-pos");
    if (Number(value) < 0) el.classList.add("finance-clean-pnl-neg");
  }

  function renderSlots() {
    const box = qs("finance-clean-slots");
    if (!box) return;

    const slots = activeSlots();
    const isCrypto = state.mode === "crypto";
    const typeLabel = isCrypto ? "Kripto" : "Bahis";
    const noteLabel = isCrypto ? "AKTİF İŞLEM" : "MAÇ";
    const notePlaceholder = isCrypto ? "BTC Long TP1 / ETH Short" : "Arsenal - Üst 2.5";
    const valueLabel = isCrypto ? "KÂR %" : "ORAN";
    const winLabel = isCrypto ? "KAZANÇ" : "KAZANDI";
    const lossLabel = isCrypto ? "KAYIP" : "KAYBETTİ";
    const statusWin = isCrypto ? "KAZANÇ" : "KAZANDI";
    const statusLoss = isCrypto ? "KAYIP" : "KAYBETTİ";

    let html = `
      <table class="finance-clean-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tür</th>
            <th>${noteLabel}</th>
            <th>Tutar</th>
            <th>${valueLabel}</th>
            <th>Durum</th>
            <th>${isCrypto ? "PNL" : "K/Z"}</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
    `;

    slots.forEach((s, i) => {
      s.type = isCrypto ? "crypto" : "bet";
      const pnlClass = Number(s.pnl) >= 0 ? "finance-clean-pnl-pos" : "finance-clean-pnl-neg";
      const statusText = s.status === "win" ? statusWin : s.status === "loss" ? statusLoss : "BEKLİYOR";

      html += `
        <tr>
          <td>${i + 1}</td>
          <td><span class="finance-fixed-type ${isCrypto ? "crypto" : "bet"}">${typeLabel}</span></td>
          <td>
            <input data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePlaceholder}">
          </td>
          <td>
            <input data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake}">
          </td>
          <td>
            <input data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds}">
          </td>
          <td>${statusText}</td>
          <td class="${pnlClass}">${money(s.pnl)}</td>
          <td>
            <div class="finance-clean-mini-actions">
              <button class="win" data-action="win" data-slot="${i}">${winLabel}</button>
              <button class="loss" data-action="loss" data-slot="${i}">${lossLabel}</button>
              <button class="pending" data-action="pending" data-slot="${i}">BEKLİYOR</button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    box.innerHTML = html;

    box.querySelectorAll("input").forEach(el => {
      el.addEventListener("input", () => {
        const i = Number(el.dataset.slot);
        const key = el.dataset.key;
        const slots = activeSlots();
        slots[i][key] = el.value;
        slots[i].type = isCrypto ? "crypto" : "bet";
        recalcSlot(i);
        saveState();
        renderKpis();
        renderChart();
      });
    });

    box.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.slot);
        const action = btn.dataset.action;
        const slots = activeSlots();

        slots[i].status = action;
        slots[i].type = isCrypto ? "crypto" : "bet";
        recalcSlot(i);

        saveState();
        renderAll();

        if (action === "win") showToast(isCrypto ? "İşlem kazanç olarak kapandı." : "Bahis kazandı olarak kapandı.");
        if (action === "loss") showToast(isCrypto ? "İşlem kayıp olarak kapandı." : "Bahis kaybetti olarak kapandı.");
      });
    });
  }

  function recalcSlot(i) {
    const slots = activeSlots();
    const s = slots[i];
    const stake = Number(s.stake || 0);
    const odds = Number(s.odds || (state.mode === "crypto" ? 0 : 1));

    if (s.status === "win") {
      if (s.type === "bet") {
        s.pnl = stake * (odds - 1);
      } else {
        s.pnl = stake * (odds / 100);
      }
    } else if (s.status === "loss") {
      if (s.type === "bet") s.pnl = -stake;
      else s.pnl = -Math.abs(stake * (odds / 100));
    } else {
      s.pnl = 0;
    }
  }

  function renderChart() {
    const el = qs("finance-clean-chart");
    if (!el || typeof ApexCharts === "undefined") return;

    const filter = state.mode === "crypto" ? "crypto" : "bet";
    const settled = activeSlots()
      .map((s, i) => ({ ...s, idx: i + 1 }))
      .filter(s => (s.status === "win" || s.status === "loss"));

    const points = [];
    let balance = Number(state.bank || 0);

    points.push({
      x: "Başlangıç",
      y: Number(balance.toFixed(2))
    });

    settled.forEach((s) => {
      balance += Number(s.pnl || 0);
      points.push({
        x: String(s.idx),
        y: Number(balance.toFixed(2))
      });
    });

    const empty = qs("finance-clean-chart-empty");
    if (empty) empty.style.display = settled.length ? "none" : "grid";

    if (!settled.length) {
      points.push({ x: "Bekliyor", y: Number(balance.toFixed(2)) });
    }

    const wins = settled.filter(s => s.status === "win").length;
    const losses = settled.filter(s => s.status === "loss").length;
    const pnl = settled.reduce((sum, s) => sum + Number(s.pnl || 0), 0);
    const used = settled.reduce((sum, s) => sum + Number(s.stake || 0), 0);
    const roiVal = used ? (pnl / used) * 100 : 0;

    const summary = qs("finance-clean-chart-summary");
    if (summary) {
      summary.innerHTML = `
        <div><span>Filtre</span><b>${filter === "all" ? "TÜMÜ" : filter === "bet" ? "BAHİS" : "KRİPTO"}</b></div>
        <div><span>Kapalı İşlem</span><b>${settled.length}</b></div>
        <div><span>Kazanç / Kayıp</span><b>${wins} / ${losses}</b></div>
        <div><span>Seçili P/L</span><b class="${pnl >= 0 ? "pos" : "neg"}">${money(pnl)}</b></div>
        <div><span>Seçili ROI</span><b class="${roiVal >= 0 ? "pos" : "neg"}">${pct(roiVal)}</b></div>
      `;
    }

    const options = {
      chart: {
        type: "area",
        height: 330,
        background: "transparent",
        toolbar: {
          show: true,
          tools: { download: false, selection: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
        },
        animations: { enabled: true, speed: 260 }
      },
      theme: { mode: "dark" },
      series: [{
        name: filter === "all" ? "Kasa Eğrisi" : filter === "bet" ? "Bahis Kasa Eğrisi" : "Kripto Kasa Eğrisi",
        data: points
      }],
      stroke: { curve: "smooth", width: 3 },
      markers: { size: settled.length ? 4 : 0, strokeWidth: 0 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 0.45, opacityFrom: 0.34, opacityTo: 0.03 }
      },
      grid: {
        borderColor: "#242424",
        strokeDashArray: 4,
        padding: { left: 8, right: 18 }
      },
      xaxis: {
        labels: { style: { colors: "#8f8f8f", fontSize: "11px" } },
        axisBorder: { color: "#333" },
        axisTicks: { color: "#333" }
      },
      yaxis: {
        labels: {
          style: { colors: "#8f8f8f", fontSize: "11px" },
          formatter: v => "$" + Number(v).toFixed(0)
        }
      },
      tooltip: {
        theme: "dark",
        y: { formatter: v => money(v) }
      },
      colors: [filter === "crypto" ? "#60a5fa" : filter === "bet" ? "#fbbf24" : "#22c55e"],
      annotations: {
        yaxis: [{
          y: Number(state.bank || 0),
          borderColor: "#666",
          strokeDashArray: 6,
          label: { text: "Başlangıç", style: { color: "#fff", background: "#333" } }
        }]
      }
    };

    if (chart) chart.updateOptions(options, true, true);
    else {
      chart = new ApexCharts(el, options);
      chart.render();
    }

    renderBarriers();
  }

  function renderBarriers() {
    const box = qs("finance-clean-barriers");
    if (!box) return;

    const barriers = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const bankNow = currentBank();

    let nextUsed = false;

    box.innerHTML = barriers.map(b => {
      let cls = "";

      if (bankNow >= b) {
        cls = "done";
      } else if (!nextUsed) {
        cls = "next";
        nextUsed = true;
      }

      return `<div class="finance-clean-barrier ${cls}">${money(b)}</div>`;
    }).join("");
  }

  function bindRoot() {
    qs("finance-rail-toggle")?.addEventListener("click", () => {
      state.railCollapsed = !state.railCollapsed;
      saveState();
      renderRoot();
    });

    document.querySelectorAll("[data-fin-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.finAction;
        if (action === "toggleRail") {
          state.railCollapsed = !state.railCollapsed;
          saveState();
          renderRoot();
          return;
        }
        if (action === "home") return setView("home");
        if (action === "betPlan") return setView("betPlan", "bet");
        if (action === "betDaily") return setView("betDaily", "bet");
        if (action === "cryptoRisk") return setView("cryptoRisk", "crypto");
        if (action === "cryptoDaily") return setView("cryptoDaily", "crypto");
      });
    });

    document.querySelectorAll("[data-mode-roll]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [mode, dayRaw] = String(btn.dataset.modeRoll || "bet:7").split(":");
        const safeMode = mode === "crypto" ? "crypto" : "bet";
        state.mode = safeMode;
        state.activeView = safeMode === "crypto" ? "cryptoDaily" : "betDaily";
        saveState();
        const days = Number(dayRaw || 7);
        localStorage.setItem("finance_rolling_mode", safeMode);
        if (typeof window.omega_OpenRollingExcel === "function") window.omega_OpenRollingExcel(days);
        else showToast("Rolling modülü bulunamadı.");
      });
    });

    qs("finance-clean-calc-btn")?.addEventListener("click", () => {
      readPlanInputs();
      renderPlanResult(true);
      saveState();
    });

    qs("finance-clean-apply-btn")?.addEventListener("click", () => {
      readPlanInputs();
      applyPlanToSlots();
    });

    qs("finance-clean-clear-btn")?.addEventListener("click", () => {
      if (!confirm("Bugünkü aktif alanlar temizlensin mi?")) return;
      setActiveSlots(createSlots(state.mode === "crypto" ? "crypto" : "bet"));
      saveState();
      renderAll();
      showToast("Gün temizlendi.");
    });

    qs("finance-clean-reset-btn")?.addEventListener("click", () => {
      if (!confirm("Kasa Yönetimi tamamen sıfırlansın mı?")) return;
      state = clone(DEFAULT_STATE);
      state.activeView = "home";
      saveState();
      renderRoot();
      showToast("Kasa sıfırlandı.");
    });

    qs("finance-clean-export-btn")?.addEventListener("click", exportFinance);
    qs("finance-clean-import-btn")?.addEventListener("click", () => qs("finance-clean-import-file")?.click());
    qs("finance-clean-import-file")?.addEventListener("change", importFinance);
  }

  function readPlanInputs() {
    const val = id => qs(id)?.value;

    if (val("fin-bank") !== undefined) state.bank = Number(val("fin-bank") || state.bank);
    if (val("fin-split") !== undefined) state.split = Number(val("fin-split") || state.split);
    if (val("fin-trade-count") !== undefined) state.tradeCount = Number(val("fin-trade-count") || state.tradeCount);
    if (val("fin-odds") !== undefined) state.odds = Number(val("fin-odds") || state.odds);
    if (val("fin-target-pct") !== undefined) state.targetPct = Number(val("fin-target-pct") || state.targetPct);

    if (val("fin-crypto-risk") !== undefined) state.cryptoRiskPct = Number(val("fin-crypto-risk") || state.cryptoRiskPct);
    if (val("fin-crypto-lev") !== undefined) state.cryptoLeverage = Number(val("fin-crypto-lev") || state.cryptoLeverage);
    if (val("fin-crypto-stop") !== undefined) state.cryptoStopPct = Number(val("fin-crypto-stop") || state.cryptoStopPct);
    if (val("fin-crypto-rr") !== undefined) state.cryptoRR = Number(val("fin-crypto-rr") || state.cryptoRR);
  }

  function applyPlanToSlots() {
    const amount = renderPlanResult(false);
    const count = Math.max(1, Math.min(20, Number(state.tradeCount || 20)));
    const slots = activeSlots();

    let applied = 0;

    for (let i = 0; i < slots.length && applied < count; i++) {
      const s = slots[i];

      if (s.status === "win" || s.status === "loss") continue;

      s.type = state.mode === "bet" ? "bet" : "crypto";
      s.stake = Number(amount || 0).toFixed(2);
      s.odds = state.mode === "bet"
        ? Number(state.odds || 1.30).toFixed(2)
        : Number(state.cryptoRR || 2).toFixed(2);

      recalcSlot(i);
      applied++;
    }

    saveState();
    renderAll();
    showToast(`${applied} satıra uygulandı.`);
  }

  function exportFinance() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "v26-kasa-yedek.json";
    a.click();

    URL.revokeObjectURL(a.href);
  }

  function importFinance(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        state = { ...clone(DEFAULT_STATE), ...imported };

        ensureModeSlots();

        saveState();
        renderRoot();
        showToast("Yedek içe aktarıldı.");
      } catch (err) {
        alert("Geçersiz JSON dosyası.");
      }
    };

    reader.readAsText(file);
  }

  function renderAll() {
    renderPlanForm();
    renderPlanResult(false);
    renderSlots();
    renderKpis();
    renderChart();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boot() {
    injectFinanceStyles();

    const root = qs("v19-finance-block");
    if (root) renderRoot();
  }

  window.omega_RefreshFinanceDashboard = function () {
    renderRoot();
  };

  window.omega_RenderApexSupremeChart = function () {
    renderChart();
  };

  window.omega_CalculateStakePlan = function () {
    return renderPlanResult(true);
  };

  window.omega_ApplyStakeToEmptySlots = function () {
    return applyPlanToSlots();
  };

  window.omega_ClearTodaySlots = function () {
    setActiveSlots(createSlots(state.mode === "crypto" ? "crypto" : "bet"));
    saveState();
    renderAll();
  };

  window.omega_ResetFinanceAll = function () {
    state = clone(DEFAULT_STATE);
    saveState();
    renderRoot();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
