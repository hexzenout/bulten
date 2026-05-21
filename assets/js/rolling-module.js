// ===============================
// V48 ROLLING MAIN MODULE
// Bahis Rolling + Kombine Kupon Maçları / Kripto Rolling + Aktif Kripto İşlemleri
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1";
  const ROLLING_KEY = "v19_rolling";
  const PAGE_MODE_KEY = "v48_rolling_page_mode";
  const RAIL_KEY = "v48_rolling_rail_collapsed";

  const DEFAULT_STATE = {
    bank: 1000,
    modeSlots: { bet: createSlots("bet", 5), crypto: createSlots("crypto", 5) },
    rowCounts: { bet: 5, crypto: 5 }
  };

  function qs(id) { return document.getElementById(id); }
  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function createSlot(type = "bet", i = 0) {
    return { id: i + 1, type, name: "", stake: "", odds: type === "bet" ? "1.30" : "2", status: "pending", pnl: 0 };
  }
  function createSlots(type = "bet", count = 5) {
    return Array.from({ length: count }, (_, i) => createSlot(type, i));
  }
  function ensureStateShape(state) {
    if (!state.modeSlots || typeof state.modeSlots !== "object") {
      const old = Array.isArray(state.slots) ? state.slots : createSlots("bet", 5);
      state.modeSlots = { bet: old.map((s, i) => ({ ...createSlot("bet", i), ...s, type: "bet" })), crypto: createSlots("crypto", 5) };
    }
    if (!Array.isArray(state.modeSlots.bet)) state.modeSlots.bet = createSlots("bet", 5);
    if (!Array.isArray(state.modeSlots.crypto)) state.modeSlots.crypto = createSlots("crypto", 5);
    if (!state.rowCounts || typeof state.rowCounts !== "object") state.rowCounts = { bet: 5, crypto: 5 };
    if (!state.quickPlan || typeof state.quickPlan !== "object") state.quickPlan = { start: 100, target: 1000 };
    state.rowCounts.bet = Math.max(1, Math.min(20, Number(state.rowCounts.bet || 5)));
    state.rowCounts.crypto = Math.max(1, Math.min(20, Number(state.rowCounts.crypto || 5)));
    while (state.modeSlots.bet.length < state.rowCounts.bet) state.modeSlots.bet.push(createSlot("bet", state.modeSlots.bet.length));
    while (state.modeSlots.crypto.length < state.rowCounts.crypto) state.modeSlots.crypto.push(createSlot("crypto", state.modeSlots.crypto.length));
    state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = i + 1; });
    state.modeSlots.crypto.forEach((s, i) => { s.type = "crypto"; s.id = i + 1; });
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = { ...DEFAULT_STATE, ...(raw ? JSON.parse(raw) : {}) };
      ensureStateShape(state);
      return state;
    } catch {
      const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      ensureStateShape(state);
      return state;
    }
  }
  function saveState(state) {
    ensureStateShape(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function recalcSlot(slot) {
    const stake = Number(slot.stake || 0);
    const val = Number(slot.odds || 0);
    if (slot.status === "win") {
      slot.pnl = slot.type === "bet" ? stake * (val - 1) : stake * (val / 100);
    } else if (slot.status === "loss") {
      slot.pnl = slot.type === "bet" ? -stake : -Math.abs(stake * (val / 100));
    } else slot.pnl = 0;
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
  function loadRollingDb() {
    try { return JSON.parse(localStorage.getItem(ROLLING_KEY) || "{}"); } catch { return {}; }
  }
  function rollingSummary(modeFilter = "all") {
    const db = loadRollingDb();
    let startTotal = 0, currentTotal = 0, pnlTotal = 0;
    Object.entries(db).forEach(([key, plan]) => {
      if (!plan) return;
      const mode = plan.mode || (String(key).startsWith("crypto_") ? "crypto" : "bet");
      if (modeFilter !== "all" && mode !== modeFilter) return;
      let balance = Number(plan.startBal || 0);
      const start = balance;
      Object.values(plan.ops || {}).forEach(dayOps => (dayOps || []).forEach(op => {
        if (!op) return;
        const amt = Number(op.amt || 0);
        const val = Number(op.odds || 0);
        const pnl = mode === "crypto" ? Math.abs(amt * (val / 100)) : (op.res === "win" ? (amt * val) - amt : amt);
        balance += op.res === "win" ? pnl : -pnl;
      }));
      startTotal += start; currentTotal += balance; pnlTotal += (balance - start);
    });
    return { startTotal, currentTotal, pnlTotal };
  }
  function activeMode() { return localStorage.getItem(PAGE_MODE_KEY) === "crypto" ? "crypto" : "bet"; }
  function setActiveMode(mode) { localStorage.setItem(PAGE_MODE_KEY, mode === "crypto" ? "crypto" : "bet"); }
  function railCollapsed() { return localStorage.getItem(RAIL_KEY) === "1"; }
  function setRailCollapsed(v) { localStorage.setItem(RAIL_KEY, v ? "1" : "0"); }
  function openRolling(mode, days) {
    localStorage.setItem("finance_rolling_mode", mode === "crypto" ? "crypto" : "bet");
    if (typeof window.omega_OpenRollingExcel === "function") window.omega_OpenRollingExcel(days);
    else alert("Rolling modülü bulunamadı.");
  }
  function renderRollingButtons(mode) {
    return [7, 15, 30, 60, 90].map(d => `<button type="button" data-roll="${mode}:${d}"><span>${d} GÜNLÜK ROLLING</span></button>`).join("");
  }
  function renderRowControls(mode, state) {
    const count = Number(state.rowCounts?.[mode] || 5);
    return `<div class="rolling-v48-row-controls"><span>${count} alan</span><button type="button" data-row-op="${mode}:minus" title="Alan azalt">−</button><button type="button" data-row-op="${mode}:plus" title="Alan ekle">+</button></div>`;
  }
  function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderTable(mode, slots, state) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 5)));
    const visible = slots.slice(0, rowCount);
    const noteHead = isCrypto ? "AKTİF İŞLEM" : "MAÇ";
    const notePH = isCrypto ? "İşlem" : "Maç";
    const valHead = isCrypto ? "KÂR %" : "ORAN";
    const winText = isCrypto ? "KAZANÇ" : "KAZANDI";
    const lossText = isCrypto ? "KAYIP" : "KAYBETTİ";
    const pnlHead = isCrypto ? "PNL" : "K/Z";
    return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table"><thead><tr><th></th><th>#</th><th>Tür</th><th>${noteHead}</th><th>Tutar</th><th>${valHead}</th><th>Durum</th><th>${pnlHead}</th><th>İşlem</th></tr></thead><tbody>${visible.map((s, i) => {
      const status = s.status === "win" ? winText : s.status === "loss" ? lossText : "BEKLİYOR";
      const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
      return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><span class="rolling-v47-type ${mode}">${isCrypto ? "Kripto" : "Bahis"}</span></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePH}"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds || ""}" placeholder="${isCrypto ? "Kâr %" : "Oran"}"></td><td>${status}</td><td class="${pnlClass}">${money(s.pnl || 0)}</td><td><div class="rolling-v47-actions"><button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win">${winText}</button><button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss">${lossText}</button><button type="button" class="pending" data-mode="${mode}" data-slot="${i}" data-status="pending">BEKLİYOR</button></div></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function renderModePanel(mode, state) {
    const isCrypto = mode === "crypto";
    const slots = isCrypto ? state.modeSlots.crypto : state.modeSlots.bet;
    const sum = slotSummary(slots);
    const rollSum = rollingSummary(mode);
    const total = sum.pnl + rollSum.pnlTotal;
    return `
      <section class="rolling-v47-card ${mode} v49-mode-card">
        <div class="rolling-v47-head">
          <div>
            <h3 class="${isCrypto ? "rolling-v493-title crypto" : "rolling-v493-title bet"}">${isCrypto ? '<i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i>' : '<span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span>'} <span>${isCrypto ? "KRİPTO" : "BAHİS"}</span></h3>
          </div>
          <div class="rolling-v47-mini">
            <span>${sum.settled} kapalı · Rolling ${money(rollSum.pnlTotal)}</span>
            <b class="${total >= 0 ? "pos" : "neg"}">${money(total)}</b>
          </div>
        </div>

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-crypto-roll-title" : "rolling-v493-fold-title bet rolling-v494-bet-roll-title"}"><i class="fa-solid fa-layer-group"></i> <span>${isCrypto ? "KRİPTO ROLLING" : "BAHİS ROLLING"}</span></summary>
          <div class="rolling-v47-roll-panel ${mode}">
            <div class="rolling-v47-roll-buttons">${renderRollingButtons(mode)}</div>
          </div>
        </details>

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-active-title" : "rolling-v493-fold-title bet rolling-v494-combine-title"}"><i class="fa-solid ${isCrypto ? "fa-chart-simple" : "fa-list-check"}"></i> <span>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "KOMBİNE KUPON MAÇLARI"}</span></summary>
          <div class="rolling-v47-section-title">
            <div>${renderRowControls(mode, state)}</div>
            <button type="button" data-clear="${mode}">${isCrypto ? "KRİPTOYU TEMİZLE" : "BAHİSİ TEMİZLE"}</button>
          </div>
          ${renderTable(mode, slots, state)}
        </details>
      </section>`;
  }
  function renderModule() {
    const mount = qs("omega-rolling-render");
    if (!mount) return;
    const state = loadState();
    const betSum = slotSummary(state.modeSlots.bet);
    const cryptoSum = slotSummary(state.modeSlots.crypto);
    const rollSum = rollingSummary();
    const totalPnl = betSum.pnl + cryptoSum.pnl + rollSum.pnlTotal;
    const mode = activeMode();
    mount.innerHTML = `
      <div class="rolling-v47-page v48-rolling-page v49-rolling-page">
        <div class="rolling-v47-hero v48-rolling-hero">
          <div><h2><i class="fa-solid fa-layer-group"></i> ROLLING</h2></div>
          <div class="rolling-v47-hero-kpis">
            <div><span>Bahis P/L</span><b class="${betSum.pnl >= 0 ? "pos" : "neg"}">${money(betSum.pnl)}</b></div>
            <div><span>Kripto P/L</span><b class="${cryptoSum.pnl >= 0 ? "pos" : "neg"}">${money(cryptoSum.pnl)}</b></div>
            <div><span>Rolling P/L</span><b class="${rollSum.pnlTotal >= 0 ? "pos" : "neg"}">${money(rollSum.pnlTotal)}</b></div>
            <div><span>Toplam</span><b class="${totalPnl >= 0 ? "pos" : "neg"}">${money(totalPnl)}</b></div>
          </div>
          <div class="rolling-v495-quick-plan">
            <label><span>BAŞLANGIÇ:</span><input type="number" step="1" data-rolling-quick="start" value="${Number(state.quickPlan?.start || 100)}"></label>
            <label><span>HEDEF:</span><input type="number" step="1" data-rolling-quick="target" value="${Number(state.quickPlan?.target || 1000)}"></label>
            <label><span>GÜNCEL:</span><b>${money(Number(state.quickPlan?.start || 100) + totalPnl)}</b></label>
          </div>
        </div>

        <div class="rolling-v48-layout v49-rolling-layout">
          <aside class="rolling-v48-rail v49-rolling-rail">
            <div class="rolling-v48-rail-toggle v49-rolling-rail-title"><i class="fa-solid fa-bars"></i><span>ROLLING MENÜSÜ</span></div>
            <button type="button" class="rolling-v48-rail-tab bet ${mode === "bet" ? "active" : ""}" data-roll-tab="bet"><span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span><span class="rolling-v493-rail-label">BAHİS</span></button>
            <button type="button" class="rolling-v48-rail-tab crypto ${mode === "crypto" ? "active" : ""}" data-roll-tab="crypto"><i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i><span class="rolling-v493-rail-label">KRİPTO</span></button>
          </aside>
          <main class="rolling-v48-main">${renderModePanel(mode, state)}</main>
        </div>
      </div>`;
    bindEvents(mount, state);
  }
  function bindEvents(mount, state) {
    mount.querySelectorAll("[data-roll-tab]").forEach(btn => btn.addEventListener("click", () => { setActiveMode(btn.dataset.rollTab); renderModule(); }));
    mount.querySelectorAll("[data-roll]").forEach(btn => btn.addEventListener("click", () => { const [mode, days] = String(btn.dataset.roll || "bet:7").split(":"); openRolling(mode, Number(days || 7)); }));
    mount.querySelectorAll("[data-row-op]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, op] = String(btn.dataset.rowOp || "bet:plus").split(":");
      state.rowCounts = state.rowCounts || { bet: 5, crypto: 5 };
      const current = Math.max(1, Math.min(20, Number(state.rowCounts[mode] || 5)));
      if (op === "plus") {
        state.rowCounts[mode] = Math.min(20, current + 1);
        while (state.modeSlots[mode].length < state.rowCounts[mode]) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      } else state.rowCounts[mode] = Math.max(1, current - 1);
      saveState(state); renderModule();
    }));
    mount.querySelectorAll("input[data-mode]").forEach(input => {
      const saveInput = () => {
        const mode = input.dataset.mode, i = Number(input.dataset.slot), key = input.dataset.key;
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        if (!list[i]) list[i] = createSlot(mode, i);
        list[i][key] = input.value;
        list[i].type = mode;
        recalcSlot(list[i]);
        saveState(state);
      };
      input.addEventListener("input", saveInput);
      input.addEventListener("change", () => { saveInput(); renderModule(); });
    });
    mount.querySelectorAll("[data-clear-row]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, slotRaw] = String(btn.dataset.clearRow || "bet:0").split(":");
      const i = Number(slotRaw || 0);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      list[i] = createSlot(mode, i);
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-rolling-quick]").forEach(input => {
      input.addEventListener("input", () => {
        state.quickPlan = state.quickPlan || { start: 100, target: 1000 };
        state.quickPlan[input.dataset.rollingQuick] = Number(input.value || 0);
        saveState(state);
      });
      input.addEventListener("change", () => renderModule());
    });
    mount.querySelectorAll("button[data-status]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.mode, i = Number(btn.dataset.slot);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      if (!list[i]) list[i] = createSlot(mode, i);
      list[i].type = mode; list[i].status = btn.dataset.status; recalcSlot(list[i]); saveState(state); renderModule();
    }));
    mount.querySelectorAll("button[data-clear]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.clear;
      if (!confirm(mode === "crypto" ? "Kripto işlem alanları temizlensin mi?" : "Bahis kupon alanları temizlensin mi?")) return;
      state.modeSlots[mode] = createSlots(mode, state.rowCounts?.[mode] || 5); saveState(state); renderModule();
    }));
  }
  window.omega_RenderRollingModule = renderModule;
  window.omega_RollingV47 = { loadState, saveState, slotSummary, rollingSummary, money };
  window.addEventListener("storage", e => { if ((e.key === STORAGE_KEY || e.key === ROLLING_KEY) && location.hash.startsWith("#rolling")) renderModule(); });
})();
