// ===============================
// V48 ROLLING MAIN MODULE
// Bahis Rolling + Kombine Kupon Maçları / Kripto Rolling + Aktif Kripto İşlemleri
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1"; // V972: legacy ortak kayıt; sadece migration/fallback için okunur.
  const STORAGE_KEY_BET = "v972_rolling_bet_state_v1";
  const STORAGE_KEY_CRYPTO = "v972_rolling_crypto_state_v1";
  const STORAGE_KEY_UI = "v972_rolling_ui_state_v1";
  const ROLLING_KEY = "v19_rolling";
  const PAGE_MODE_KEY = "v48_rolling_page_mode";
  const RAIL_KEY = "v48_rolling_rail_collapsed";
  const HISTORY_KEY = "v512_rolling_history_v1"; // legacy ortak history; yeni kayıtlar mode bazlı tutulur.
  const HISTORY_KEY_BET = "v972_rolling_history_bet_v1";
  const HISTORY_KEY_CRYPTO = "v972_rolling_history_crypto_v1";
  const TARGET_LOG_KEY = "v755_rolling_target_log_v1"; // legacy ortak hedef logu.
  const TARGET_LOG_KEY_BET = "v972_rolling_target_log_bet_v1";
  const TARGET_LOG_KEY_CRYPTO = "v972_rolling_target_log_crypto_v1";
  const SNAPSHOT_KEY = "v756_rolling_report_cards_v1"; // legacy ortak rapor kartları.
  const SNAPSHOT_KEY_BET = "v972_rolling_report_cards_bet_v1";
  const SNAPSHOT_KEY_CRYPTO = "v972_rolling_report_cards_crypto_v1";
  const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const TARGET_CARD_OPEN_KEY = "v798_rolling_target_card_open";
  const TARGET_LOG_OPEN_KEY = "v802_rolling_target_log_open";
  const TARGET_ITEMS_KEY = "v810_rolling_target_items_v1"; // legacy ortak aktif hedef listesi.
  const TARGET_ITEMS_KEY_BET = "v972_rolling_target_items_bet_v1";
  const TARGET_ITEMS_KEY_CRYPTO = "v972_rolling_target_items_crypto_v1";
  const TARGET_CLOSED_PNL_KEY = "v829_rolling_target_closed_pnl_v1"; // legacy ortak kapalı P/L.
  const TARGET_CLOSED_PNL_KEY_BET = "v972_rolling_target_closed_pnl_bet_v1";
  const TARGET_CLOSED_PNL_KEY_CRYPTO = "v972_rolling_target_closed_pnl_crypto_v1";
  let HISTORY_OPEN_MODE = null;
  let LOG_CENTER_OPEN_MODE = null;
  let REPORT_CENTER_OPEN_MODE = null;
  let PENDING_BOARD_OPEN_MODE = null;
  let TARGET_HISTORY_OPEN_MODE = null;
  let HISTORY_FILTER = "today";
  let CONFIRM_DIALOG = null;
  let CONFIRM_RETURN_PANEL_MODE = null;
  let ACTIVE_COMBO_DETAIL_SLOT = null;

  function restoreActivePanelAfterConfirm(mode) {
    const panelMode = mode === "crypto" ? "crypto" : "bet";
    PENDING_BOARD_OPEN_MODE = panelMode;
    LOG_CENTER_OPEN_MODE = null;
    REPORT_CENTER_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    CONFIRM_RETURN_PANEL_MODE = panelMode;
    setTimeout(() => {
      PENDING_BOARD_OPEN_MODE = panelMode;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      CONFIRM_DIALOG = null;
      renderFloatingPanel();
    }, 0);
  }

  const DEFAULT_STATE = {
    bank: 1000,
    modeSlots: { bet: createSlots("bet", 20), crypto: createSlots("crypto", 20) },
    rowCounts: { bet: 20, crypto: 20 },
    quickTemplates: { bet: { stake: "", odds: "", name: "" }, crypto: { stake: "", odds: "", name: "" } }
  };

  function storageHas(key) {
    try { return localStorage.getItem(key) !== null; } catch { return false; }
  }
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
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function modeStateKey(mode) { return mode === "crypto" ? STORAGE_KEY_CRYPTO : STORAGE_KEY_BET; }
  function modeHistoryKey(mode) { return mode === "crypto" ? HISTORY_KEY_CRYPTO : HISTORY_KEY_BET; }
  function modeTargetLogKey(mode) { return mode === "crypto" ? TARGET_LOG_KEY_CRYPTO : TARGET_LOG_KEY_BET; }
  function modeSnapshotKey(mode) { return mode === "crypto" ? SNAPSHOT_KEY_CRYPTO : SNAPSHOT_KEY_BET; }
  function modeTargetItemsKey(mode) { return mode === "crypto" ? TARGET_ITEMS_KEY_CRYPTO : TARGET_ITEMS_KEY_BET; }
  function modeTargetClosedPnlKey(mode) { return mode === "crypto" ? TARGET_CLOSED_PNL_KEY_CRYPTO : TARGET_CLOSED_PNL_KEY_BET; }
  function legacyCombinedState() {
    const raw = readJson(STORAGE_KEY, {});
    const state = { ...DEFAULT_STATE, ...(raw && typeof raw === "object" ? raw : {}) };
    try { ensureStateShape(state); } catch {}
    return state;
  }
  function normalizeModeStore(mode, raw, legacy) {
    const safeMode = mode === "crypto" ? "crypto" : "bet";
    const source = raw && typeof raw === "object" ? raw : {};
    const fallbackSlots = Array.isArray(legacy?.modeSlots?.[safeMode]) ? legacy.modeSlots[safeMode] : createSlots(safeMode, 20);
    const fallbackQuick = safeMode === "crypto"
      ? { stake: "", odds: "", name: "" }
      : { stake: "", odds: "", name: "" };
    const fallbackPlan = safeMode === "crypto"
      ? { start: legacy?.quickPlan?.start ?? 100, target: "", currentOverride: "" }
      : { ...(legacy?.quickPlan || {}), start: legacy?.quickPlan?.start ?? 100, target: legacy?.quickPlan?.target ?? 1000, currentOverride: legacy?.quickPlan?.currentOverride ?? "" };
    return {
      version: 984,
      mode: safeMode,
      slots: Array.isArray(source.slots) ? source.slots : fallbackSlots,
      rowCount: Math.max(1, Math.min(20, Number(source.rowCount ?? legacy?.rowCounts?.[safeMode] ?? 20))),
      quickTemplate: source.quickTemplate && typeof source.quickTemplate === "object"
        ? { ...fallbackQuick, ...source.quickTemplate }
        : { ...fallbackQuick, ...(legacy?.quickTemplates?.[safeMode] || {}) },
      quickPlan: source.quickPlan && typeof source.quickPlan === "object"
        ? { ...fallbackPlan, ...source.quickPlan }
        : { ...fallbackPlan, ...(legacy?.quickPlans?.[safeMode] || {}) }
    };
  }
  function buildModeStore(mode, state) {
    const safeMode = mode === "crypto" ? "crypto" : "bet";
    ensureQuickTemplates(state);
    ensureQuickPlans(state);
    return {
      version: 984,
      mode: safeMode,
      updatedAt: Date.now(),
      slots: Array.isArray(state.modeSlots?.[safeMode]) ? state.modeSlots[safeMode] : createSlots(safeMode, 20),
      rowCount: Math.max(1, Math.min(20, Number(state.rowCounts?.[safeMode] || 20))),
      quickTemplate: { ...(state.quickTemplates?.[safeMode] || {}) },
      quickPlan: { ...(state.quickPlans?.[safeMode] || {}) }
    };
  }
  function splitArrayByMode(rows) {
    const out = { bet: [], crypto: [] };
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const mode = row?.mode === "crypto" ? "crypto" : "bet";
      out[mode].push(row);
    });
    return out;
  }

  function qs(id) { return document.getElementById(id); }
  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function signedMoney(v) {
    const n = Number(v || 0);
    return (n >= 0 ? "+" : "-") + money(Math.abs(n));
  }
  function pctText(v) {
    const n = Number.isFinite(Number(v)) ? Number(v) : 0;
    return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
  }
  function growthPct(pnl, base) {
    const b = Math.abs(Number(base || 0));
    return b ? (Number(pnl || 0) / b) * 100 : 0;
  }
  function loadHistory() {
    const legacy = readJson(HISTORY_KEY, {});
    const hasBet = storageHas(HISTORY_KEY_BET);
    const hasCrypto = storageHas(HISTORY_KEY_CRYPTO);
    const bet = hasBet ? readJson(HISTORY_KEY_BET, []) : (Array.isArray(legacy.bet) ? legacy.bet : []);
    const crypto = hasCrypto ? readJson(HISTORY_KEY_CRYPTO, []) : (Array.isArray(legacy.crypto) ? legacy.crypto : []);
    const h = { bet: Array.isArray(bet) ? bet : [], crypto: Array.isArray(crypto) ? crypto : [] };
    if (!hasBet && h.bet.length) writeJson(HISTORY_KEY_BET, h.bet);
    if (!hasCrypto && h.crypto.length) writeJson(HISTORY_KEY_CRYPTO, h.crypto);
    return h;
  }
  function saveHistory(h) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    const bet = (h.bet || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    const crypto = (h.crypto || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    writeJson(HISTORY_KEY_BET, bet);
    writeJson(HISTORY_KEY_CRYPTO, crypto);
  }
  function loadTargetLog() {
    const legacy = readJson(TARGET_LOG_KEY, []);
    const legacySplit = splitArrayByMode(legacy);
    const hasBet = storageHas(TARGET_LOG_KEY_BET);
    const hasCrypto = storageHas(TARGET_LOG_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_LOG_KEY_BET, []) : legacySplit.bet;
    const crypto = hasCrypto ? readJson(TARGET_LOG_KEY_CRYPTO, []) : legacySplit.crypto;
    if (!hasBet && bet.length) writeJson(TARGET_LOG_KEY_BET, bet);
    if (!hasCrypto && crypto.length) writeJson(TARGET_LOG_KEY_CRYPTO, crypto);
    return [...(Array.isArray(bet) ? bet : []), ...(Array.isArray(crypto) ? crypto : [])]
      .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
  }
  function saveTargetLog(rows) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    const clean = (rows || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 500);
    const split = splitArrayByMode(clean);
    writeJson(TARGET_LOG_KEY_BET, split.bet.slice(0, 500));
    writeJson(TARGET_LOG_KEY_CRYPTO, split.crypto.slice(0, 500));
  }

  function syncStateWithHistory(state) {
    const h = loadHistory();
    const ids = new Set([...(h.bet || []), ...(h.crypto || [])].map(r => String(r.id || "")).filter(Boolean));
    ["bet", "crypto"].forEach(mode => {
      const list = state.modeSlots?.[mode] || [];
      list.forEach(slot => {
        if (!slot) return;
        const finished = slot.status === "win" || slot.status === "loss";
        const historyId = String(slot.historyId || "");
        const orphanFinished = finished && (!historyId || !ids.has(historyId));
        if (!orphanFinished) return;
        slot.status = slotHasUserEntry(slot, mode) ? "pending" : "pending";
        slot.pnl = 0;
        slot.historyId = "";
        slot.historyStatus = "";
        if (mode === "bet") {
          slot.comboResults = [];
          if (!betCouponGroup(slot)) slot.betKind = "single";
        }
      });
    });
    return state;
  }

  function escapeXml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function loadReportCards() {
    const now = Date.now();
    const legacy = readJson(SNAPSHOT_KEY, []);
    const legacySplit = splitArrayByMode(legacy);
    const hasBet = storageHas(SNAPSHOT_KEY_BET);
    const hasCrypto = storageHas(SNAPSHOT_KEY_CRYPTO);
    const rawBet = hasBet ? readJson(SNAPSHOT_KEY_BET, []) : legacySplit.bet;
    const rawCrypto = hasCrypto ? readJson(SNAPSHOT_KEY_CRYPTO, []) : legacySplit.crypto;
    const bet = (Array.isArray(rawBet) ? rawBet : [])
      .filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    const crypto = (Array.isArray(rawCrypto) ? rawCrypto : [])
      .filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    if (!hasBet && bet.length) writeJson(SNAPSHOT_KEY_BET, bet);
    if (!hasCrypto && crypto.length) writeJson(SNAPSHOT_KEY_CRYPTO, crypto);
    return [...bet, ...crypto].sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
  }
  function saveReportCards(rows) {
    const now = Date.now();
    const clean = (rows || []).filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    const split = splitArrayByMode(clean);
    writeJson(SNAPSHOT_KEY_BET, split.bet.slice(0, 80));
    writeJson(SNAPSHOT_KEY_CRYPTO, split.crypto.slice(0, 80));
  }
  function snapshotRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count).filter(s => {
      return slotHasUserEntry(s, mode) || s.status === "win" || s.status === "loss";
    });
  }
  function makeReportSvg(mode, state) {
    const isCrypto = mode === "crypto";
    const rows = snapshotRowsForMode(mode, state);
    const sum = slotSummary(mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet);
    const title = isCrypto ? "KRİPTO İŞLEM RAPORU" : "BAHİS / MAÇ RAPORU";
    const date = formatDateTime(Date.now());
    const safeRows = rows.slice(0, 20);
    const rowHeight = 34;
    const height = 230 + Math.max(1, safeRows.length) * rowHeight;
    const line = (txt, x, y, size = 17, fill = "#ffffff", weight = 800) => `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(txt)}</text>`;
    const rowSvg = (safeRows.length ? safeRows : [{ name: "Henüz rapora girecek satır yok", stake: "", odds: "", status: "pending", pnl: 0 }]).map((s, idx) => {
      const y = 196 + idx * rowHeight;
      const status = s.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : s.status === "loss" ? (isCrypto ? "KAYIP" : "KAYBETTİ") : "BEKLİYOR";
      const pnl = Number(s.pnl || 0);
      const color = pnl >= 0 ? "#22c55e" : "#ef4444";
      return `
        <rect x="42" y="${y - 22}" width="996" height="29" rx="9" fill="${idx % 2 ? '#111827' : '#0b1220'}" opacity=".92"/>
        ${line(String(idx + 1).padStart(2, '0'), 58, y, 13, "#94a3b8", 900)}
        ${line(String(s.name || (isCrypto ? "Kripto işlem" : "Bahis / maç")).slice(0, 44), 108, y, 14, "#f8fafc", 900)}
        ${line(money(s.stake || 0), 560, y, 14, "#e5e7eb", 900)}
        ${line(isCrypto ? money(s.odds || 0) : String(s.odds || "-"), 705, y, 14, "#e5e7eb", 900)}
        ${line(status, 825, y, 13, status === "BEKLİYOR" ? "#fbbf24" : color, 950)}
        ${line(signedMoney(pnl), 940, y, 14, color, 950)}`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="${isCrypto ? '#0f172a' : '#1f1300'}"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="${height}" rx="34" fill="url(#bg)"/>
        <rect x="28" y="28" width="1024" height="${height - 56}" rx="28" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="2"/>
        ${line("BULTEN · ROLLING", 48, 74, 18, "#fbbf24", 950)}
        ${line(title, 48, 112, 34, "#ffffff", 950)}
        ${line(date, 48, 143, 15, "#94a3b8", 850)}
        ${line("Kayıt: " + safeRows.length, 48, 174, 15, "#cbd5e1", 850)}
        ${line("W/L: " + sum.wins + " / " + sum.losses, 178, 174, 15, "#cbd5e1", 850)}
        ${line("Toplam K/Z: " + signedMoney(sum.pnl), 315, 174, 15, Number(sum.pnl) >= 0 ? "#22c55e" : "#ef4444", 950)}
        ${line("Not: Görsel rapor 7 gün saklanır.", 740, 174, 13, "#94a3b8", 750)}
        <rect x="42" y="184" width="996" height="1" fill="rgba(255,255,255,.16)"/>
        ${rowSvg}
      </svg>`;
  }
  function createReportCard(mode, state) {
    const svg = makeReportSvg(mode, state);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const rows = snapshotRowsForMode(mode, state);
    const sum = slotSummary(mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet);
    const card = {
      id: "rp_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      ts: Date.now(),
      mode,
      title: mode === "crypto" ? "Kripto işlem raporu" : "Bahis / maç raporu",
      count: rows.length,
      pnl: Number(sum.pnl || 0),
      dataUrl
    };
    const all = loadReportCards();
    all.unshift(card);
    saveReportCards(all);
    return card;
  }
  function renderReportGallery(mode) {
    const rows = loadReportCards().filter(x => x.mode === mode).slice(0, 6);
    if (!rows.length) {
      return `<div class="v756-report-gallery empty"><span>Henüz rapor resmi yok.</span><b>Kayıtlı rapor görseli oluştuğunda burada görünür.</b></div>`;
    }
    return `<div class="v756-report-gallery">${rows.map(r => `
      <article class="v756-report-card" data-report-id="${escapeHtml(r.id)}">
        <img src="${r.dataUrl}" alt="${escapeHtml(r.title)}">
        <div>
          <b>${escapeHtml(r.title)}</b>
          <span>${escapeHtml(formatDateTime(r.ts))} · ${r.count} satır · <em class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${signedMoney(r.pnl)}</em></span>
        </div>
        <button type="button" data-report-download="${escapeHtml(r.id)}"><i class="fa-solid fa-download"></i></button>
        <button type="button" data-report-delete="${escapeHtml(r.id)}"><i class="fa-solid fa-trash"></i></button>
      </article>`).join("")}</div>`;
  }
  function downloadReportCard(id) {
    const card = loadReportCards().find(x => x.id === id);
    if (!card) return;
    const fallback = () => {
      const a = document.createElement("a");
      a.href = card.dataUrl;
      a.download = `bulten-${card.mode}-rapor-${new Date(card.ts).toISOString().slice(0,10)}.svg`;
      document.body.appendChild(a); a.click(); a.remove();
    };
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1080;
        canvas.height = img.naturalHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (!blob) return fallback();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bulten-${card.mode}-rapor-${new Date(card.ts).toISOString().slice(0,10)}.png`;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }, "image/png");
      };
      img.onerror = fallback;
      img.src = card.dataUrl;
    } catch { fallback(); }
  }
  function ensureQuickPlans(state) {
    if (!state.quickPlans || typeof state.quickPlans !== "object") state.quickPlans = {};
    if (!state.quickPlans.bet) state.quickPlans.bet = { ...(state.quickPlan || {}), start: state.quickPlan?.start ?? 100, target: state.quickPlan?.target ?? "", currentOverride: state.quickPlan?.currentOverride ?? "" };
    if (!state.quickPlans.crypto) state.quickPlans.crypto = { start: state.quickPlan?.start ?? 100, target: "", currentOverride: "" };
    return state.quickPlans;
  }
  function getModeQuickPlan(state, mode) {
    const plans = ensureQuickPlans(state);
    const m = mode === "crypto" ? "crypto" : "bet";
    if (!plans[m] || typeof plans[m] !== "object") plans[m] = { start: 100, target: "", currentOverride: "" };
    return plans[m];
  }
  function getPlanNumbers(state, totalPnl, mode = "bet") {
    const plan = getModeQuickPlan(state, mode);
    const start = Number.isFinite(Number(plan.start)) ? Number(plan.start) : 100;
    const target = plan.target === "" || plan.target === null || plan.target === undefined ? 0 : Number(plan.target || 0);
    const targetSelfPnl = typeof v812TargetRealizedPnl === "function" ? v812TargetRealizedPnl(mode) : 0;
    const targetOwnPnl = Number(targetSelfPnl || 0);
    const autoCurrent = start + targetOwnPnl;
    const hasOverrideValue = plan.currentOverride !== "" && plan.currentOverride !== null && plan.currentOverride !== undefined && Number.isFinite(Number(plan.currentOverride));
    const manualCurrent = hasOverrideValue ? Number(plan.currentOverride) : autoCurrent;
    const hasManualCurrent = hasOverrideValue;
    const current = hasManualCurrent ? manualCurrent : autoCurrent;
    const pnl = current - start;
    const growth = growthPct(pnl, start);
    const pct = target > start ? Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100)) : progressPct(current, target || start);
    const done = target > 0 && current >= target;
    const remaining = target > 0 ? Math.max(0, target - current) : 0;
    const stateLabel = done ? "Hedefe Ulaşıldı" : target > 0 ? (pnl >= 0 ? "Devam Ediyor" : "Geride") : "Hedef Bekliyor";
    return { start, target, current, autoCurrent, pnl, growth, pct, done, hasManualCurrent, remaining, stateLabel, mode: mode === "crypto" ? "crypto" : "bet" };
  }
  function addTargetLogRecord(state, totalPnl, mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const plan = getPlanNumbers(state, totalPnl, m);
    if (!plan.target) return { ok: false, message: "Önce hedef tutarı gir." };
    if (!plan.done) return { ok: false, message: "Güncel bakiye hedefe ulaşmadan yeşil onay verilemez." };
    const rows = loadTargetLog();
    rows.unshift({
      id: "rt_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      mode: m,
      ts: Date.now(),
      start: plan.start,
      target: plan.target,
      current: plan.current,
      pnl: plan.pnl,
      growth: plan.growth
    });
    saveTargetLog(rows);
    const quick = getModeQuickPlan(state, m);
    quick.start = Number(plan.current.toFixed(2));
    quick.target = "";
    quick.currentOverride = "";
    return { ok: true, plan };
  }
  function addHistoryRecord(mode, slot, index) {
    if (!slot || (slot.status !== "win" && slot.status !== "loss")) return;
    const h = loadHistory();
    const now = Date.now();
    const rec = {
      id: "rh_" + now + "_" + Math.random().toString(36).slice(2),
      mode,
      ts: now,
      row: index + 1,
      name: String(slot.name || "").trim() || (mode === "crypto" ? "Kripto işlem" : "Bahis / maç"),
      stake: Number(slot.stake || 0),
      odds: Number(slot.odds || 0),
      status: slot.status,
      pnl: Number(slot.pnl || 0),
      entryPrice: slot.entryPrice || "",
      liquidationPrice: slot.liquidationPrice || "",
      leverage: slot.leverage || 1,
      takeProfits: Array.isArray(slot.takeProfits) ? slot.takeProfits.map(tp => ({ ...tp })) : []
    };
    h[mode].unshift(rec);
    saveHistory(h);
    slot.historyId = rec.id;
    slot.historyStatus = slot.status;
  }
  function historyFilterLabel(filter) {
    return ({ today: "Bugün", yesterday: "Dün", week: "Bu Hafta", month: "Bu Ay", year: "Bu Yıl", twoYears: "Son 2 Yıl", all: "Tümü" })[filter] || "Bugün";
  }
  function filterHistoryRows(rows, filter) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    const tsStart = start.getTime();
    if (filter === "today") return rows.filter(r => r.ts >= tsStart);
    if (filter === "yesterday") {
      const y0 = tsStart - 86400000;
      return rows.filter(r => r.ts >= y0 && r.ts < tsStart);
    }
    if (filter === "week") {
      const d = new Date(start);
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "month") {
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "threeMonths") return rows.filter(r => r.ts >= Date.now() - 92 * 86400000);
    if (filter === "sixMonths") return rows.filter(r => r.ts >= Date.now() - 183 * 86400000);
    if (filter === "year") {
      const d = new Date(start.getFullYear(), 0, 1);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "twoYears") return rows.filter(r => r.ts >= Date.now() - 730 * 86400000);
    return rows;
  }
  function formatDateTime(ts) {
    try {
      return new Date(Number(ts || Date.now())).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
    } catch { return "-"; }
  }
  function renderHistoryModal() {
    if (!HISTORY_OPEN_MODE) return "";
    const mode = HISTORY_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const all = loadHistory()[mode] || [];
    const rows = filterHistoryRows(all, HISTORY_FILTER);
    const pnl = rows.reduce((s, r) => s + Number(r.pnl || 0), 0);
    const wins = rows.filter(r => r.status === "win").length;
    const losses = rows.filter(r => r.status === "loss").length;
    const filters = ["today","yesterday","week","month","year","twoYears","all"].map(f => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${historyFilterLabel(f)}</button>`).join("");
    const body = rows.length ? rows.map(r => `
      <tr>
        <td>${escapeHtml(formatDateTime(r.ts))}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${money(r.stake)}</td>
        <td>${isCrypto ? money(r.odds || 0) : escapeHtml(String(r.odds || 0))}</td>
        <td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td>
        <td><div class="v757-history-pnl-cell"><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</span><button type="button" class="v757-history-delete" data-history-delete="${mode}:${escapeHtml(r.id || "")}" title="Bu LOG kaydını sil"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="v512-history-empty">Bu filtrede geçmiş kaydı yok.</td></tr>`;
    return `
      <div class="v512-history-overlay">
        <div class="v512-history-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO İŞLEM GEÇMİŞİ" : "BAHİS GEÇMİŞİ"}</b>
              <span>${historyFilterLabel(HISTORY_FILTER)} · ${rows.length} kayıt · ${wins} kazanç / ${losses} kayıp · K/Z ${money(pnl)}</span>
            </div>
            <button type="button" data-history-close>×</button>
          </div>
          <div class="v512-history-filters">${filters}</div>
          <div class="v512-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z</th></tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }


  function renderTargetHistoryModal() {
    if (!TARGET_HISTORY_OPEN_MODE) return "";
    const mode = TARGET_HISTORY_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const all = loadTargetLog().filter(r => (r.mode || "bet") === mode);
    const rows = filterHistoryRows(all, HISTORY_FILTER);
    const pnl = rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const modeLabel = isCrypto ? "Kripto" : "Bahis";
    const targetFilters = [
      ["all", "Tümü"],
      ["today", "Bugün"],
      ["week", "1 Hafta"],
      ["month", "1 Ay"],
      ["threeMonths", "3 Ay"],
      ["sixMonths", "6 Ay"],
      ["year", "1 Yıl"]
    ];
    const filters = targetFilters.map(([f, label]) => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${label}</button>`).join("") + `<button type="button" class="v985-date-filter" disabled>Tarih Seç</button>`;
    const body = rows.length ? `
      <table class="v512-history-table v985-target-history-table">
        <thead><tr><th>Tarih / Saat</th><th>Başlangıç</th><th>Hedef</th><th>Güncel</th><th>K/Z</th><th>Sil</th></tr></thead>
        <tbody>${rows.map(r => `
          <tr>
            <td>${escapeHtml(formatDateTime(r.ts))}</td>
            <td>${money(r.start)}</td>
            <td>${r.target ? money(r.target) : "-"}</td>
            <td>${money(r.current ?? (Number(r.start || 0) + Number(r.pnl || 0)))}</td>
            <td><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${signedMoney(r.pnl)}</span></td>
            <td><button type="button" class="v757-history-delete" data-target-history-delete="${escapeHtml(r.id || "")}" title="Bu kasa hedefi kaydını sil"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`).join("")}</tbody>
      </table>` : `<div class="v512-history-empty v985-target-history-empty">Seçilen tarih aralığında kasa hedefi geçmiş kaydı yok.</div>`;
    return `
      <div class="v512-history-overlay v985-target-history-overlay" data-target-history-overlay>
        <section class="v512-history-modal v985-target-history-modal ${mode}" onclick="event.stopPropagation()">
          <div class="v512-history-head v985-target-history-head">
            <div>
              <b>Geçmiş</b>
              <span>${modeLabel} kasa hedefi · ${historyFilterLabel(HISTORY_FILTER)} · ${rows.length} kayıt · K/Z ${signedMoney(pnl)}</span>
            </div>
            <button type="button" data-target-history-close>×</button>
          </div>
          <div class="v512-history-filters v985-target-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v985-target-history-body">${body}</div>
        </section>
      </div>`;
  }

  function renderConfirmDialog() {
    if (!CONFIRM_DIALOG) return "";
    const tone = CONFIRM_DIALOG.tone || "warn";
    return `
      <div class="v757-confirm-overlay">
        <section class="v757-confirm-modal ${tone}">
          <button type="button" class="v757-confirm-x" data-confirm-no>×</button>
          <div class="v757-confirm-icon"><i class="fa-solid ${tone === "danger" ? "fa-triangle-exclamation" : "fa-circle-check"}"></i></div>
          <div>
            <b>${escapeHtml(CONFIRM_DIALOG.title || "İşlem Onayı")}</b>
            <p>${escapeHtml(CONFIRM_DIALOG.message || "Bu işlemi onaylıyor musun?")}</p>
            ${CONFIRM_DIALOG.detail ? `<span>${escapeHtml(CONFIRM_DIALOG.detail)}</span>` : ""}
          </div>
          <div class="v757-confirm-actions">
            <button type="button" class="ghost" data-confirm-no>İptal</button>
            <button type="button" class="ok" data-confirm-yes>${escapeHtml(CONFIRM_DIALOG.confirmText || "Onayla")}</button>
          </div>
        </section>
      </div>`;
  }

  function ensureQuickTemplates(state) {
    if (!state.quickTemplates || typeof state.quickTemplates !== "object") state.quickTemplates = {};
    if (!state.quickTemplates.bet || typeof state.quickTemplates.bet !== "object") state.quickTemplates.bet = { stake: "", odds: "", name: "" };
    if (!state.quickTemplates.crypto || typeof state.quickTemplates.crypto !== "object") state.quickTemplates.crypto = { stake: "", odds: "", name: "" };
    if (state.quickTemplates.bet.odds === undefined || state.quickTemplates.bet.odds === null) state.quickTemplates.bet.odds = "";
    if (state.quickTemplates.crypto.odds === undefined || state.quickTemplates.crypto.odds === null) state.quickTemplates.crypto.odds = "";
  }
  function progressPct(current, target) {
    const t = Number(target || 0);
    if (!t) return 0;
    return Math.max(0, Math.min(100, (Number(current || 0) / t) * 100));
  }
  function cleanText(value) { return String(value || "").trim(); }
  function isFinishedStatus(status) { return status === "win" || status === "loss"; }
  function slotHasUserEntry(slot, mode) {
    if (!slot) return false;
    if (mode === "crypto") return !!cleanText(slot.name);
    if (cleanText(slot.name)) return true;
    return Array.isArray(slot.extraMatches) && slot.extraMatches.some(m => cleanText(m?.name));
  }
  function activeRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count)
      .map((slot, index) => ({ ...slot, index }))
      .filter(s => slotHasUserEntry(s, mode));
  }
  function pendingRowsForMode(mode, state) {
    return activeRowsForMode(mode, state).filter(s => !isFinishedStatus(s.status));
  }
  function modeStorageLabel(mode) {
    return mode === "crypto" ? "Kripto kayıt alanı" : "Bahis kayıt alanı";
  }
  function modeSeparationText(mode) {
    return "";
  }
  function modeUiCounts(mode, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const slots = m === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const history = loadHistory()[m] || [];
    const today = filterHistoryRows(history, "today");
    const sum = slotSummary(slots);
    const roll = rollingSummary(m);
    return {
      active: pendingRowsForMode(m, state).length,
      entered: activeRowsForMode(m, state).length,
      closed: sum.settled,
      today: today.length,
      pnl: Number(sum.pnl || 0) + Number(roll.pnlTotal || 0)
    };
  }
  function canAutoAttachToCombo(row) {
    return !!row && !!cleanText(row.name) && !Number(row.stake || 0);
  }
  function betCouponGroup(slot) {
    const raw = cleanText(slot?.couponGroup || slot?.couponNo || "");
    const n = Number(raw || 0);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? String(n) : "";
  }
  function betKind(slot) {
    return betCouponGroup(slot) ? "combo" : "single";
  }
  function normalizeBetCouponGroups(slots) {
    const list = Array.isArray(slots) ? slots : [];
    list.forEach((slot, index) => {
      if (!slot || slot.type !== "bet") return;
      slot.id = index + 1;
      if (!slot.couponGroup && slot.betKind === "combo") slot.couponGroup = "1";
      const group = betCouponGroup(slot);
      slot.couponGroup = group;
      slot.betKind = group ? "combo" : "single";
      if (!group) slot.comboResults = [];
    });
    const groups = {};
    list.forEach((slot, index) => {
      const group = betCouponGroup(slot);
      if (!group) return;
      if (!groups[group]) groups[group] = [];
      groups[group].push(index);
    });
    Object.entries(groups).forEach(([group, indices]) => {
      if (!indices || indices.length < 2) return;
      const first = Math.min(...indices);
      const last = Math.max(...indices);
      for (let i = first; i <= last; i++) {
        if (!list[i]) list[i] = createSlot("bet", i);
        list[i].type = "bet";
        list[i].id = i + 1;
        list[i].couponGroup = group;
        list[i].betKind = "combo";
      }
    });
    return list;
  }
  const normalizeBetComboRanges = normalizeBetCouponGroups;
  function buildExplicitComboRow(rows = []) {
    const ordered = (Array.isArray(rows) ? rows : []).filter(Boolean).sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    const first = ordered[0] || {};
    const stakeRow = ordered.find(row => Number(row.stake || 0));
    const rest = ordered.slice(1).map(row => ({ name: cleanText(row.name), odds: row.odds, sourceIndex: row.index }));
    return {
      ...first,
      stake: stakeRow ? stakeRow.stake : first.stake,
      autoCombo: false,
      manualCombo: true,
      autoComboRows: ordered.map(row => row.index),
      extraMatches: rest,
      comboResults: Array.isArray(first.comboResults) ? first.comboResults.slice() : []
    };
  }
  function buildAutoComboRow(base, preRows = [], postRows = []) {
    const ordered = [...(preRows || []), base, ...(postRows || [])].filter(Boolean);
    const first = ordered[0] || base;
    const rest = ordered.slice(1).map(row => ({ name: cleanText(row.name), odds: row.odds, sourceIndex: row.index }));
    return {
      ...base,
      name: cleanText(first.name),
      odds: first.odds,
      autoCombo: true,
      autoComboRows: ordered.map(row => row.index),
      extraMatches: rest,
      comboResults: Array.isArray(base.comboResults) ? base.comboResults.slice() : []
    };
  }
  function getSlotMatches(slot) {
    const matches = [];
    if (cleanText(slot?.name)) matches.push({ name: cleanText(slot.name), odds: slot.odds, index: 0, status: slot?.comboResults?.[0] || "" });
    if (Array.isArray(slot?.extraMatches)) {
      slot.extraMatches.forEach((m, idx) => {
        if (!cleanText(m?.name)) return;
        matches.push({ name: cleanText(m.name), odds: m.odds, index: idx + 1, status: slot?.comboResults?.[idx + 1] || "" });
      });
    }
    return matches;
  }
  function getBetCouponGroups(state) {
    const source = Array.isArray(state?.modeSlots?.bet) ? state.modeSlots.bet : [];
    normalizeBetCouponGroups(source);
    const rows = pendingRowsForMode("bet", state).sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    const singles = [];
    const coupons = [];
    const consumed = new Set();

    const grouped = {};
    rows.forEach(row => {
      const group = betCouponGroup(row);
      if (!group) return;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(row);
    });

    Object.entries(grouped).forEach(([group, groupRows]) => {
      const ordered = groupRows
        .filter(Boolean)
        .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
      ordered.forEach(row => consumed.add(row.index));
      if (ordered.length >= 2) {
        const comboRow = buildExplicitComboRow(ordered);
        comboRow.couponGroup = group;
        coupons.push({
          id: Number(group),
          group,
          label: `Kupon ${group}`,
          slotIndex: Number(ordered[0].index || 0),
          row: comboRow,
          rows: ordered,
          matches: getSlotMatches(comboRow)
        });
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || consumed.has(row.index)) continue;

      const manualMatchCount = getSlotMatches(row).length;
      if (manualMatchCount > 1) {
        coupons.push({
          id: Number(row.index || 0) + 1,
          group: "manual-" + (Number(row.index || 0) + 1),
          label: "Kombine Kupon",
          slotIndex: Number(row.index || 0),
          row,
          rows: [row],
          matches: getSlotMatches(row)
        });
        consumed.add(row.index);
        continue;
      }

      singles.push(row);
      consumed.add(row.index);
    }

    coupons.sort((a, b) => Number(a.slotIndex || 0) - Number(b.slotIndex || 0));
    singles.sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    return { singles, coupons, rows };
  }
  function getBetCouponForSlot(state, slotIndex) {
    const idx = Number(slotIndex || 0);
    return getBetCouponGroups(state).coupons.find(coupon => {
      if (Number(coupon?.slotIndex ?? -1) === idx) return true;
      return Array.isArray(coupon?.rows) && coupon.rows.some(row => Number(row?.index ?? -1) === idx);
    }) || null;
  }
  function getBetCouponMatchIndex(coupon, slotIndex) {
    const idx = Number(slotIndex || 0);
    const rows = Array.isArray(coupon?.rows) ? coupon.rows : [];
    const rowIndex = rows.findIndex(row => Number(row?.index ?? -1) === idx);
    if (rowIndex >= 0) return rowIndex;
    if (Number(coupon?.slotIndex ?? -1) === idx) return 0;
    return 0;
  }
  function getBetComboStatusLookup(state) {
    const lookup = {};
    getBetCouponGroups(state).coupons.forEach(coupon => {
      const matches = Array.isArray(coupon.matches) ? coupon.matches : [];
      const rows = Array.isArray(coupon.rows) && coupon.rows.length ? coupon.rows : [coupon.row].filter(Boolean);
      rows.forEach((row, idx) => {
        const status = matches[idx]?.status || '';
        if (status === 'win' || status === 'loss') lookup[Number(row.index || 0)] = status;
      });
    });
    return lookup;
  }
  function rowBetTotals(row) {
    const matches = getSlotMatches(row);
    const stake = Number(row?.stake || 0);
    let completeOdds = true;
    const odds = matches.reduce((p, m) => {
      const o = Number(m.odds || 0);
      if (!o) completeOdds = false;
      return p * (o || 1);
    }, 1);
    const possibleWin = stake && completeOdds && matches.length ? stake * odds : 0;
    return { stake, odds: completeOdds && matches.length ? odds : 0, possibleWin, completeOdds, missing: !cleanText(row?.name) || !stake || !completeOdds };
  }
  function couponTotals(rows) {
    const row = Array.isArray(rows) ? rows[0] : rows;
    const t = rowBetTotals(row || {});
    return { stake: t.stake, odds: t.odds, possibleReturn: t.possibleWin, netProfit: t.possibleWin ? t.possibleWin - t.stake : 0 };
  }
  function v810ShortLabel(value, limit = 30) {
    const raw = cleanText(value);
    if (!raw) return "-";
    return raw.length > limit ? raw.slice(0, limit - 1) + "…" : raw;
  }
  function loadTargetItems() {
    const legacy = readJson(TARGET_ITEMS_KEY, {});
    const hasBet = storageHas(TARGET_ITEMS_KEY_BET);
    const hasCrypto = storageHas(TARGET_ITEMS_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_ITEMS_KEY_BET, []) : (Array.isArray(legacy.bet) ? legacy.bet : []);
    const crypto = hasCrypto ? readJson(TARGET_ITEMS_KEY_CRYPTO, []) : (Array.isArray(legacy.crypto) ? legacy.crypto : []);
    const clean = {
      bet: Array.isArray(bet) ? bet : [],
      crypto: Array.isArray(crypto) ? crypto : []
    };
    if (!hasBet && clean.bet.length) writeJson(TARGET_ITEMS_KEY_BET, clean.bet.slice(-80));
    if (!hasCrypto && clean.crypto.length) writeJson(TARGET_ITEMS_KEY_CRYPTO, clean.crypto.slice(-80));
    return clean;
  }
  function saveTargetItems(data) {
    const bet = Array.isArray(data?.bet) ? data.bet.slice(-80) : [];
    const crypto = Array.isArray(data?.crypto) ? data.crypto.slice(-80) : [];
    writeJson(TARGET_ITEMS_KEY_BET, bet);
    writeJson(TARGET_ITEMS_KEY_CRYPTO, crypto);
  }
  function loadTargetClosedPnl() {
    const legacy = readJson(TARGET_CLOSED_PNL_KEY, {});
    const hasBet = storageHas(TARGET_CLOSED_PNL_KEY_BET);
    const hasCrypto = storageHas(TARGET_CLOSED_PNL_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_CLOSED_PNL_KEY_BET, 0) : Number(legacy.bet || 0);
    const crypto = hasCrypto ? readJson(TARGET_CLOSED_PNL_KEY_CRYPTO, 0) : Number(legacy.crypto || 0);
    if (!hasBet && Number(bet || 0)) writeJson(TARGET_CLOSED_PNL_KEY_BET, Number(bet || 0));
    if (!hasCrypto && Number(crypto || 0)) writeJson(TARGET_CLOSED_PNL_KEY_CRYPTO, Number(crypto || 0));
    return { bet: Number(bet || 0), crypto: Number(crypto || 0) };
  }
  function saveTargetClosedPnl(data) {
    writeJson(TARGET_CLOSED_PNL_KEY_BET, Number(data?.bet || 0));
    writeJson(TARGET_CLOSED_PNL_KEY_CRYPTO, Number(data?.crypto || 0));
  }
  function addTargetClosedPnl(mode, amount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const data = loadTargetClosedPnl();
    data[m] = Number(data[m] || 0) + Number(amount || 0);
    saveTargetClosedPnl(data);
  }
  function v810TargetItemId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function v810NumberOrBlank(value) {
    if (value === "" || value === undefined || value === null) return "";
    const n = Number(value);
    return Number.isFinite(n) ? n : "";
  }
  function v813NumberText(value, empty = "-") {
    const n = v810NumberOrBlank(value);
    return n === "" ? empty : String(n);
  }
  function v813MoneyOrDash(value, prefix = "") {
    const n = v810NumberOrBlank(value);
    if (n === "") return "-";
    return prefix + money(Math.abs(Number(n || 0)));
  }
  function v813CryptoTps(item) {
    const list = Array.isArray(item?.tps) ? item.tps : [];
    const cleaned = list.map((tp, idx) => ({
      target: cleanText(tp?.target || ""),
      profit: v810NumberOrBlank(tp?.profit),
      done: !!tp?.done,
      idx
    })).filter(tp => tp.target || tp.profit !== "" || tp.done);
    if (!cleaned.length && v810NumberOrBlank(item?.profit) !== "") {
      cleaned.push({ target: cleanText(item?.target || ""), profit: v810NumberOrBlank(item?.profit), done: cleanText(item?.result || "") === "tp", idx: 0 });
    }
    return cleaned;
  }
  function v811CryptoTps(item) { return v813CryptoTps(item); }
  function v813CryptoTpProfitTotal(item) {
    return v813CryptoTps(item).reduce((sum, tp) => tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
  }
  function v813CryptoTpDoneProfit(item) {
    return v813CryptoTps(item).reduce((sum, tp) => tp.done && tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
  }
  function v812BetLegs(item) {
    const list = Array.isArray(item?.legs) ? item.legs : [];
    const cleaned = list.map(leg => ({
      name: cleanText(leg?.name || ""),
      odds: v810NumberOrBlank(leg?.odds),
      result: cleanText(leg?.result || "")
    })).filter(leg => leg.name || leg.odds !== "" || leg.result);
    if (!cleaned.length && (cleanText(item?.name || "") || v810NumberOrBlank(item?.odds) !== "")) {
      cleaned.push({ name: cleanText(item?.name || ""), odds: v810NumberOrBlank(item?.odds), result: cleanText(item?.result || "") });
    }
    return cleaned.length ? cleaned : [{ name: "", odds: "", result: "" }];
  }
  function v812BetOddsProduct(item) {
    const legs = v812BetLegs(item).filter(leg => Number(leg.odds || 0) > 0);
    if (!legs.length) return 0;
    return legs.reduce((total, leg) => total * Number(leg.odds || 1), 1);
  }
  function v812BetPotential(item) {
    const stake = Number(item?.stake || 0);
    const odds = v812BetOddsProduct(item);
    if (!stake || !odds) return 0;
    return stake * odds;
  }
  function v812BetNet(item) {
    const stake = Number(item?.stake || 0);
    const result = cleanText(item?.result || "");
    if (result === "loss") return -Math.abs(stake || 0);
    if (result === "win") {
      const possible = v812BetPotential(item);
      return possible ? possible - stake : 0;
    }
    return 0;
  }
  function v811CryptoTpProfit(item) {
    const tps = v813CryptoTps(item);
    const values = tps.map(tp => v810NumberOrBlank(tp.profit)).filter(v => v !== "");
    if (!values.length) return { value: 0, source: "none", count: tps.length, profitCount: 0 };
    return { value: values.reduce((sum, v) => sum + Number(v || 0), 0), source: "manual", count: tps.length, profitCount: values.length };
  }
  function v812CryptoStopLoss(item) {
    const raw = v810NumberOrBlank(item?.stopLoss);
    return raw === "" ? 0 : Math.abs(Number(raw || 0));
  }
  function v812CryptoNet(item) {
    const result = cleanText(item?.result || "");
    if (result === "stop") return -v812CryptoStopLoss(item);
    if (result === "tp" || result === "win") return Number(v813CryptoTpProfitTotal(item) || 0);
    return Number(v813CryptoTpDoneProfit(item) || 0);
  }
  function v810TargetItemProfit(item, mode) {
    if (mode === "crypto") return { value: v812CryptoNet(item), source: item?.result || v813CryptoTpDoneProfit(item) ? "result" : "none" };
    return { value: v812BetNet(item), source: item?.result ? "result" : "none" };
  }
  function v812TargetRealizedPnl(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = loadTargetItems();
    const rows = (store[m] || []).filter(Boolean);
    const openPnl = rows.reduce((sum, item) => sum + Number(v810TargetItemProfit(item, m).value || 0), 0);
    const closed = loadTargetClosedPnl();
    return Number(closed[m] || 0) + openPnl;
  }
  function v812ResultBadge(item, mode) {
    const result = cleanText(item?.result || "");
    if (mode === "crypto") {
      if (result === "stop") return "STOP";
      if (result === "tp" || result === "win") return "Kâr";
      const tps = v813CryptoTps(item);
      const done = tps.filter(tp => tp.done).length;
      return done ? `TP ${done}/${tps.length || done}` : "Bekliyor";
    }
    if (!result) return "Bekliyor";
    return result === "loss" ? "Kaybetti" : "Kazandı";
  }
  function v812BetTitle(item) {
    const legs = v812BetLegs(item);
    if (legs.length <= 1) return "Tek";
    return `Kombine ${legs.length} maç`;
  }
  function v812BetInfo(item) {
    const legs = v812BetLegs(item);
    const odds = v812BetOddsProduct(item);
    const stake = Number(item?.stake || 0);
    const oddsText = odds ? odds.toFixed(2) : "-";
    const stakeText = stake ? money(stake) : "Tutar -";
    if (legs.length <= 1) return `${oddsText} · ${stakeText}`;
    return `${legs.length} maç · ${oddsText} · ${stakeText}`;
  }
  function v812BetLegText(item) {
    return v812BetLegs(item).map((leg, i) => {
      const name = cleanText(leg.name || "") || `Maç ${i + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds || 0).toFixed(2) : "-";
      return `${name} (${odds})`;
    }).join(" · ");
  }
  function v813BetLegRowsHtml(item) {
    return v812BetLegs(item).map((leg, i) => {
      const name = cleanText(leg.name || "") || `Maç ${i + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds || 0).toFixed(2) : "-";
      const result = cleanText(leg.result || "");
      const id = escapeHtml(item?.id || "");
      return `<div class="v813-bet-match-line v819-bet-match-line v822-bet-match-line ${result ? "done " + result : ""}">
        <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <b>${escapeHtml(odds)}</b>
        <div class="v819-leg-actions">
          <button type="button" class="leg-win ${result === "win" ? "active" : ""}" data-target-bet-leg-result="bet:${id}:${i}:win" title="Maç kazandı"><i class="fa-solid fa-check"></i></button>
          <button type="button" class="leg-loss ${result === "loss" ? "active" : ""}" data-target-bet-leg-result="bet:${id}:${i}:loss" title="Maç kaybetti"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    }).join("");
  }
  function v813CryptoTpRowsHtml(item) {
    const tps = v813CryptoTps(item);
    if (!tps.length) return "";
    return tps.map((tp, i) => {
      const isDone = cleanText(item?.result || "") === "tp" || !!tp.done;
      const profit = tp.profit !== "" ? signedMoney(Number(tp.profit || 0)) : "+$0.00";
      return `<div class="v813-crypto-detail-line v814-crypto-detail-line v815-crypto-detail-line tp ${isDone ? "done" : ""}">
        <span>TP ${i + 1}</span>
        <div class="v814-crypto-values v815-crypto-values"><b>${escapeHtml(tp.target || "-")}</b><em>${escapeHtml(profit)}</em></div>
        <button type="button" class="tp-check v815-result-btn ${isDone ? "active" : ""}" data-target-self-tp-done="crypto:${escapeHtml(item.id || "")}:${i}" title="Kazanç"><i class="fa-solid fa-check"></i></button>
      </div>`;
    }).join("");
  }
  function v813CryptoStopRowHtml(item) {
    const stopRaw = cleanText(item?.stop || "");
    const loss = v812CryptoStopLoss(item);
    if (!stopRaw && !loss) return "";
    const stop = stopRaw || "-";
    const active = cleanText(item?.result || "") === "stop";
    return `<div class="v813-crypto-detail-line v814-crypto-detail-line v815-crypto-detail-line stop ${active ? "done" : ""}">
      <span>STOP</span>
      <div class="v814-crypto-values v815-crypto-values"><b>${escapeHtml(stop)}</b><em>${loss ? "-" + money(loss) : "-$0.00"}</em></div>
      <button type="button" class="stop-x v815-result-btn ${active ? "active" : ""}" data-target-self-result="crypto:${escapeHtml(item.id || "")}:stop" title="Kaybetti"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }
  function v814EntryText(item) {
    const entry = cleanText(item?.entry || item?.entryPrice || "");
    return entry || "-";
  }
  function v810TargetSelfData(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = loadTargetItems();
    const rows = (store[m] || []).filter(Boolean);
    if (m === "crypto") {
      const details = rows.slice(-8).reverse().map(item => {
        const result = cleanText(item.result || "");
        return `<li class="v812-target-detail-row v813-target-detail-row v814-target-detail-row crypto ${result ? "done " + result : ""}" data-target-self-row="${escapeHtml(item.id || "")}">
          <div class="v814-crypto-detail-head v819-crypto-detail-head"><span title="${escapeHtml(cleanText(item.name || "") || "İşlem")}">${escapeHtml(cleanText(item.name || "") || "İşlem")}</span><button type="button" class="photo" data-target-self-photo="${m}:${escapeHtml(item.id || "")}" title="İşlem fotoğrafı"><i class="fa-solid fa-camera"></i></button></div>
          <div class="v814-crypto-meta-grid"><span>Tutar <b>${Number(item.stake || 0) ? money(item.stake) : "-"}</b></span><span>Giriş <b>${escapeHtml(v814EntryText(item))}</b></span></div>
          <div class="v813-crypto-lines v814-crypto-lines">${v813CryptoTpRowsHtml(item)}${v813CryptoStopRowHtml(item)}</div>
          <div class="v819-target-card-footer crypto"><button type="button" class="delete" data-target-self-delete="${m}:${escapeHtml(item.id || "")}" title="Sil"><i class="fa-solid fa-trash"></i></button></div>
        </li>`;
      }).join("");
      return { mode: m, hasRows: rows.length > 0, summary: "", sub: "", details };
    }
    const details = rows.slice(-8).reverse().map(item => {
      const result = cleanText(item.result || "");
      const legs = v812BetLegs(item);
      const odds = v812BetOddsProduct(item);
      const possibleReturn = v812BetPotential(item);
      const stake = Number(item?.stake || 0);
      const typeClass = legs.length > 1 ? "combo" : "single";
      const title = v812BetTitle(item);
      const oddsText = odds ? odds.toFixed(2) : "-";
      const stakeText = stake ? money(stake) : "-";
      const profitOnly = possibleReturn && stake ? Math.max(0, possibleReturn - stake) : 0;
      const profitOnlyText = profitOnly ? money(profitOnly) : "-";
      return `<li class="v812-target-detail-row v813-target-detail-row v814-target-detail-row v835-bet-detail-row v1026-bet-detail-row v1027-bet-detail-row v1028-bet-detail-row bet ${typeClass} ${result ? "done " + result : ""}" data-target-self-row="${escapeHtml(item.id || "")}">
        <div class="v813-detail-head v814-bet-detail-head v821-bet-detail-head v835-bet-detail-head v1026-bet-detail-head"><span class="v1026-bet-type-label ${typeClass}" title="${escapeHtml(title)}">${escapeHtml(title)}</span><button type="button" class="photo" data-target-self-photo="${m}:${escapeHtml(item.id || "")}" title="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button></div>
        <div class="v813-bet-match-list v814-bet-match-list v822-bet-match-list v835-bet-match-list">${v813BetLegRowsHtml(item)}</div>
        <div class="v819-target-card-footer v821-target-card-footer v822-target-card-footer v1027-bet-detail-footer v1028-bet-detail-footer bet">
          <div class="v835-bet-detail-meta v1026-bet-detail-meta v1027-bet-detail-meta v1028-bet-detail-meta"><span>Tutar <b>${escapeHtml(stakeText)}</b></span><span>Kazanç <b>${escapeHtml(profitOnlyText)}</b></span></div>
          <button type="button" class="delete" data-target-self-delete="${m}:${escapeHtml(item.id || "")}" title="Sil"><i class="fa-solid fa-trash"></i></button>
        </div>
      </li>`;
    }).join("");
    return { mode: m, hasRows: rows.length > 0, summary: "", sub: "", details };
  }

  function v811CryptoTpRow() {
    return `<div class="v811-target-tp-row v813-target-tp-row v814-target-tp-row" data-target-self-tp="crypto">
      <input type="text" data-target-self-tp-field="target" placeholder="Hedef TP">
      <input type="number" step="0.01" inputmode="decimal" data-target-self-tp-field="profit" placeholder="Kâr">
    </div>`;
  }
  function v824CryptoEntryRow(index = 0) {
    const label = index > 0 ? `İşlem ${index + 1}` : "İşlem";
    return `<div class="v824-target-crypto-entry" data-target-crypto-entry="1">
      <div class="v824-target-crypto-entry-title"><span>${escapeHtml(label)}</span><button type="button" data-target-crypto-entry-remove title="Bu işlem kutusunu kapat"><i class="fa-solid fa-xmark"></i></button></div>
      <input type="text" data-target-self-field="crypto:name" placeholder="İşlem adı">
      <input type="number" step="0.01" inputmode="decimal" data-target-self-field="crypto:stake" placeholder="Tutar">
      <input type="text" data-target-self-field="crypto:entry" placeholder="Giriş fiyatı">
      <div class="v811-target-tp-box v812-target-tp-box v813-target-tp-box v814-target-tp-box">
        <div class="v814-target-tp-grid">
          <div class="v811-target-tp-list v813-target-tp-list v814-target-tp-list" data-target-tp-list="crypto">${v811CryptoTpRow()}</div>
          <div class="v814-target-tp-actions"><button type="button" data-target-tp-add="crypto">+ TP</button><button type="button" data-target-tp-remove-last="crypto" title="Son TP kaldır">−</button></div>
        </div>
      </div>
      <div class="v812-target-stop-row v813-target-stop-row v814-target-stop-row">
        <input type="text" data-target-self-field="crypto:stop" placeholder="Stop">
        <input type="number" step="0.01" inputmode="decimal" data-target-self-field="crypto:stopLoss" placeholder="Olası zarar">
      </div>
    </div>`;
  }
  function v812BetLegRow() {
    return `<div class="v812-target-bet-leg v813-target-bet-leg v814-target-bet-leg" data-target-bet-leg="bet">
      <input type="text" data-target-bet-leg-field="name" placeholder="Maç">
      <input type="number" step="0.01" inputmode="decimal" data-target-bet-leg-field="odds" placeholder="Oran">
      <button type="button" data-target-bet-leg-remove title="Maç sil">×</button>
    </div>`;
  }
  function renderTargetActiveBox(state, mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const data = v810TargetSelfData(m);
    if (m === "crypto") {
      return `<div class="v810-target-self v811-target-self v812-target-self v813-target-self v814-target-self crypto">
        <div class="v812-target-self-title v814-target-self-title"><b>İşlem</b></div>
        <div class="v810-target-self-form v811-target-self-form v812-target-self-form v813-target-self-form v814-target-self-form v815-target-self-form crypto" data-target-crypto-autosave="1">
          <div class="v824-target-crypto-entry-list" data-target-crypto-entry-list>${v824CryptoEntryRow(0)}</div>
          <button type="button" class="v811-target-main-add v814-target-main-add v824-target-add-entry" data-target-crypto-entry-add="${m}">+ İşlem</button>
        </div>
        ${data.hasRows ? `<details open class="v810-target-self-details v811-target-self-details v812-target-self-details v813-target-self-details v814-target-self-details"><summary>Detay</summary><ul>${data.details}</ul></details>` : ""}
      </div>`;
    }
    return `<div class="v810-target-self v811-target-self v812-target-self v813-target-self v814-target-self bet">
      <div class="v812-target-self-title v814-target-self-title"><b>Bahis</b></div>
      <div class="v810-target-self-form v811-target-self-form v812-target-self-form v813-target-self-form v814-target-self-form v815-target-self-form bet" data-target-bet-autosave="1">
        <div class="v812-target-bet-leg-list v813-target-bet-leg-list v814-target-bet-leg-list" data-target-bet-leg-list="${m}">${v812BetLegRow()}</div>
        <input type="number" step="0.01" inputmode="decimal" data-target-self-field="${m}:stake" placeholder="Tutar">
        <div class="v812-target-form-actions v814-target-form-actions"><button type="button" data-target-bet-leg-add="${m}">+ Maç</button></div>
      </div>
      ${data.hasRows ? `<details open class="v810-target-self-details v811-target-self-details v812-target-self-details v813-target-self-details v814-target-self-details v835-target-self-details"><summary>Detay</summary><ul>${data.details}</ul></details>` : ""}
    </div>`;
  }

  function renderCardShotButton(id) {
    return `<button type="button" class="v763-shot-btn" data-card-screenshot="${escapeHtml(id)}" title="Fotoğraf önizle" aria-label="Fotoğraf önizle"><i class="fa-solid fa-camera"></i></button>`;
  }

  function v781RowsForPhoto(mode, state) {
    if (mode === "bet") {
      const grouped = getBetCouponGroups(state);
      const singles = grouped.singles.map(row => {
        const totals = rowBetTotals(row);
        return {
          index: row.index + 1,
          type: "Bahis",
          name: cleanText(row.name),
          matchLines: [cleanText(row.name)],
          matchOdds: [Number(row.odds || 0)],
          matchResults: [cleanText(row.status || "")],
          stake: Number(row.stake || 0),
          odds: Number(totals.odds || 0),
          possible: Number(totals.possibleWin || 0)
        };
      });
      const coupons = grouped.coupons.map(coupon => {
        const totals = rowBetTotals(coupon.row);
        return {
          index: coupon.slotIndex + 1,
          type: "Kombine",
          name: coupon.matches.map(m => cleanText(m.name)).filter(Boolean).join(" + "),
          matchLines: coupon.matches.map(m => cleanText(m.name)).filter(Boolean),
          matchOdds: coupon.matches.map(m => Number(m.odds || 0)),
          stake: Number(coupon.row.stake || 0),
          odds: Number(totals.odds || 0),
          possible: Number(totals.possibleWin || 0)
        };
      });
      return [...singles, ...coupons].sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    }
    return activeRowsForMode(mode, state).map(row => ({
      index: row.index + 1,
      type: "Kripto",
      name: cleanText(row.name),
      matchLines: [cleanText(row.name)],
      matchOdds: [Number(row.odds || 0)],
      stake: Number(row.stake || 0),
      odds: Number(row.odds || 0),
      possible: Number(row.pnl || 0)
    }));
  }
  function v785WrapPhotoText(text, limit = 42) {
    const raw = String(text || "").trim();
    if (!raw) return [""];
    const words = raw.split(/\s+/);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= limit) current = candidate;
      else {
        if (current) lines.push(current);
        if (word.length > limit) {
          for (let i = 0; i < word.length; i += limit) lines.push(word.slice(i, i + limit));
          current = "";
        } else current = word;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [raw];
  }

  function v788PhotoEntryLines(entry) {
    const names = Array.isArray(entry.matchLines) && entry.matchLines.length ? entry.matchLines : [entry.name || "Maç"];
    const odds = Array.isArray(entry.matchOdds) && entry.matchOdds.length ? entry.matchOdds : [entry.odds || 0];
    const results = Array.isArray(entry.matchResults) ? entry.matchResults : [];
    const rows = [];
    names.forEach((name, idx) => {
      const prefix = names.length > 1 ? `${idx + 1}. ` : "";
      const wrapped = v785WrapPhotoText(prefix + String(name || "Maç").trim(), 44).slice(0, 4);
      wrapped.forEach((line, partIndex) => {
        rows.push({
          text: line,
          odds: partIndex === 0 ? Number(odds[idx] || 0) : 0,
          result: partIndex === 0 ? cleanText(results[idx] || "") : ""
        });
      });
    });
    return rows.length ? rows : [{ text: "Maç", odds: Number(entry.odds || 0), result: cleanText(entry.status || "") }];
  }

  function v788PhotoTitle(rows, titleText) {
    if (Array.isArray(rows) && rows.length === 1) {
      if (rows[0].type === "Kombine") return "KOMBİNE KUPON";
      if (rows[0].type === "Bahis") return "TEKLİ BAHİS";
    }
    return titleText || "AKTİF BAHİSLER / KUPONLAR";
  }

  function v785BuildBetPhotoSvg(rows, titleText) {
    const data = (rows || []).filter(Boolean);
    if (!data.length) return null;

    const width = 900;
    const padX = 42;
    const rowX = 42;
    const rowW = 816;
    const textX = 64;
    const oddsX = 830;
    const lineH = 25;
    const rowGap = 10;
    let cursorY = 150;
    const rowHtml = [];

    data.forEach((entry, entryIndex) => {
      const lineRows = v788PhotoEntryLines(entry);
      const isMultiEntry = data.length > 1;
      if (isMultiEntry) {
        const groupTitle = `${entryIndex + 1}. ${entry.type === "Kombine" ? "Kombine Kupon" : "Tekli Bahis"}`;
        rowHtml.push(`<text x="${textX}" y="${cursorY - 12}" fill="#c084fc" font-size="16" font-family="Arial" font-weight="900">${escapeHtml(groupTitle)}</text>`);
      }
      lineRows.forEach(line => {
        const wrapped = v785WrapPhotoText(line.text, 40).slice(0, 4);
        const hasResult = !!line.result;
        const rowH = Math.max(40, 16 + wrapped.length * lineH);
        const statusText = line.result === "loss" ? "KAYBETTİ" : "KAZANDI";
        const statusColor = line.result === "loss" ? "#ef4444" : "#22c55e";
        const statusX = oddsX - 76;
        rowHtml.push(`
          <rect x="${rowX}" y="${cursorY - 28}" width="${rowW}" height="${rowH}" rx="12" fill="#0f172a" stroke="#334155"/>
          ${wrapped.map((txt, idx) => `<text x="${textX}" y="${cursorY - 3 + idx * lineH}" fill="#f8fafc" font-size="19" font-family="Arial" font-weight="800">${escapeHtml(txt)}</text>`).join("")}
          ${hasResult ? `<text x="${statusX}" y="${cursorY - 3}" text-anchor="end" fill="${statusColor}" font-size="19" font-family="Arial" font-weight="900">${statusText}</text>` : ""}
          ${line.odds ? `<text x="${oddsX}" y="${cursorY - 3}" text-anchor="end" fill="#fbbf24" font-size="19" font-family="Arial" font-weight="900">${Number(line.odds).toFixed(2)}</text>` : ""}`);
        cursorY += rowH + rowGap;
      });
      if (isMultiEntry) cursorY += 8;
    });

    const totalStake = data.reduce((sum, row) => sum + Number(row.stake || 0), 0);
    const totalPossible = data.reduce((sum, row) => sum + Number(row.possible || 0), 0);
    const totalOdds = data.length === 1 ? Number(data[0].odds || 0) : 0;
    const title = v788PhotoTitle(data, titleText);
    const footerY = cursorY + 20;
    const footerH = 130;
    const height = Math.max(430, footerY + footerH + 46);
    const totalOddsLabel = totalOdds ? totalOdds.toFixed(2) : "-";
    const totalPossibleLabel = totalPossible ? money(totalPossible) : "-";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#020617"/>
      <rect x="22" y="22" width="856" height="${height - 44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/>
      <text x="${padX}" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">${escapeHtml(title)}</text>
      <text x="${padX}" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">${new Date().toLocaleString("tr-TR")}</text>
      ${rowHtml.join("")}
      <rect x="${rowX}" y="${footerY}" width="${rowW}" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/>
      <text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Toplam Oran:</text>
      <text x="836" y="${footerY + 34}" text-anchor="end" fill="#fbbf24" font-size="20" font-family="Arial" font-weight="900">${totalOddsLabel}</text>
      <text x="64" y="${footerY + 70}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text>
      <text x="836" y="${footerY + 70}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${money(totalStake)}</text>
      <text x="64" y="${footerY + 106}" fill="#22c55e" font-size="19" font-family="Arial" font-weight="900">Tahmini Kazanç:</text>
      <text x="836" y="${footerY + 106}" text-anchor="end" fill="#22c55e" font-size="20" font-family="Arial" font-weight="900">${totalPossibleLabel}</text>
    </svg>`;
  }
  function v816BuildCryptoPhotoSvg(item) {
    const tps = v813CryptoTps(item);
    const stopRaw = cleanText(item?.stop || "");
    const stopLoss = v812CryptoStopLoss(item);
    const width = 900;
    const padX = 42;
    const rowX = 42;
    const rowW = 816;
    const textX = 64;
    const valueX = 830;
    const rowGap = 10;
    let cursorY = 150;
    const rowHtml = [];
    const pushRow = (label, value, accent = '#fbbf24') => {
      rowHtml.push(`
        <rect x="${rowX}" y="${cursorY - 28}" width="${rowW}" height="40" rx="12" fill="#0f172a" stroke="#334155"/>
        <text x="${textX}" y="${cursorY - 3}" fill="#f8fafc" font-size="19" font-family="Arial" font-weight="800">${escapeHtml(label)}</text>
        <text x="${valueX}" y="${cursorY - 3}" text-anchor="end" fill="${accent}" font-size="19" font-family="Arial" font-weight="900">${escapeHtml(value)}</text>`);
      cursorY += 50;
    };
    pushRow('İşlem', cleanText(item?.name || '') || 'Kripto İşlem', '#e5e7eb');
    pushRow('Giriş', v814EntryText(item), '#fbbf24');
    tps.forEach((tp, idx) => {
      const target = cleanText(tp.target || '') || '-';
      const profit = tp.profit !== '' ? signedMoney(Number(tp.profit || 0)) : '+$0.00';
      const status = tp.done || cleanText(item?.result || '') === 'tp' ? ' · KAZANDI' : '';
      pushRow(`TP ${idx + 1} · ${target}`, `${profit}${status}`, '#22c55e');
    });
    if (stopRaw || stopLoss) {
      const status = cleanText(item?.result || '') === 'stop' ? ' · KAYBETTİ' : '';
      pushRow(`STOP · ${stopRaw || '-'}`, `${stopLoss ? '-' + money(stopLoss) : '-$0.00'}${status}`, '#dc2626');
    }
    const footerY = cursorY + 20;
    const footerH = 88;
    const height = Math.max(420, footerY + footerH + 46);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#020617"/>
      <rect x="22" y="22" width="856" height="${height - 44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/>
      <text x="${padX}" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">KRİPTO İŞLEM FOTOĞRAFI</text>
      <text x="${padX}" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">${new Date().toLocaleString('tr-TR')}</text>
      ${rowHtml.join('')}
      <rect x="${rowX}" y="${footerY}" width="${rowW}" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/>
      <text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text>
      <text x="836" y="${footerY + 34}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${Number(item?.stake || 0) ? money(item.stake) : '-'}</text>
      <text x="64" y="${footerY + 68}" fill="#22c55e" font-size="19" font-family="Arial" font-weight="900">Toplam TP Kârı:</text>
      <text x="836" y="${footerY + 68}" text-anchor="end" fill="#22c55e" font-size="20" font-family="Arial" font-weight="900">${signedMoney(Number(v813CryptoTpProfitTotal(item) || 0))}</text>
    </svg>`;
  }
  function v816BuildTargetItemPhotoData(mode, id) {
    const m = mode === 'crypto' ? 'crypto' : 'bet';
    const store = loadTargetItems();
    const row = (store[m] || []).find(item => String(item.id || '') === String(id || ''));
    if (!row) return null;
    if (m === 'bet') {
      const entry = {
        index: 1,
        type: v812BetLegs(row).length > 1 ? 'Kombine' : 'Bahis',
        matchLines: v812BetLegs(row).map(leg => cleanText(leg.name || '') || 'Maç'),
        matchOdds: v812BetLegs(row).map(leg => Number(leg.odds || 0)),
        matchResults: v812BetLegs(row).map(leg => cleanText(leg.result || row.result || '')),
        stake: Number(row.stake || 0),
        odds: Number(v812BetOddsProduct(row) || 0),
        possible: Number(v812BetPotential(row) || 0)
      };
      const svg = v785BuildBetPhotoSvg([entry], entry.type === 'Kombine' ? 'KOMBİNE KUPON' : 'BAHİS FOTOĞRAFI');
      if (!svg) return null;
      return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), label: 'Bahis Fotoğrafı', file: `bulten-bahis-${new Date().toISOString().slice(0,10)}.png` };
    }
    const svg = v816BuildCryptoPhotoSvg(row);
    if (!svg) return null;
    return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), label: 'Kripto Fotoğrafı', file: `bulten-kripto-${new Date().toISOString().slice(0,10)}.png` };
  }
  function openTargetResultConfirm(options, onConfirm) {
    const opts = options || {};
    const tone = opts.tone === "loss" || opts.tone === "danger" || opts.tone === "stop" ? "danger" : "success";
    let host = document.getElementById("omega-target-confirm-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-target-confirm-host";
      document.body.appendChild(host);
    }
    const title = escapeHtml(opts.title || "Onay gerekiyor");
    const message = escapeHtml(opts.message || "Bu işlemi onaylıyor musun?");
    const okText = escapeHtml(opts.okText || "Onayla");
    const cancelText = escapeHtml(opts.cancelText || "Vazgeç");
    const icon = tone === "danger" ? "fa-xmark" : "fa-check";
    host.innerHTML = `<div class="v823-confirm-overlay" data-v823-confirm-cancel>
      <section class="v823-confirm-modal ${tone}" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="v823-confirm-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="v823-confirm-copy"><b>${title}</b><p>${message}</p></div>
        <div class="v823-confirm-actions">
          <button type="button" class="cancel" data-v823-confirm-cancel>${cancelText}</button>
          <button type="button" class="ok" data-v823-confirm-ok>${okText}</button>
        </div>
      </section>
    </div>`;
    host.style.display = "block";
    const close = () => { host.innerHTML = ""; host.style.display = "none"; };
    host.querySelectorAll("[data-v823-confirm-cancel]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !el.hasAttribute("data-v823-confirm-cancel")) return;
      close();
    }));
    host.querySelector("[data-v823-confirm-ok]")?.addEventListener("click", () => {
      close();
      if (typeof onConfirm === "function") onConfirm();
    });
  }
  function openRollingPhotoPreview(dataUrl, filename, title = "Fotoğraf", subtitle = "ROLLING") {
    if (!dataUrl) return;
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>${escapeHtml(title)}</b><span>${escapeHtml(subtitle)}</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${dataUrl}" alt="Rolling fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v781-photo-download]")?.addEventListener("click", () => {
      v781DownloadPngFromSvg(dataUrl, filename);
    });
  }

  function openTargetItemPhoto(mode, id) {
    const payload = v816BuildTargetItemPhotoData(mode, id);
    if (!payload) {
      alert(mode === 'crypto' ? 'Fotoğraf için önce işlem gir.' : 'Fotoğraf için önce maç bilgisi gir.');
      return;
    }
    let host = document.getElementById('omega-rolling-feature-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'omega-rolling-feature-host';
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>${payload.label}</b><span>Kasa Hedefi</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${payload.dataUrl}" alt="Kasa hedefi fotoğrafı"></section></div>`;
    host.style.display = 'block';
    host.querySelectorAll('[data-v781-photo-close]').forEach(el => el.addEventListener('click', event => {
      if (event.target !== el && !event.target.hasAttribute('data-v781-photo-close')) return;
      host.innerHTML = '';
      host.style.display = 'none';
    }));
    host.querySelector('[data-v781-photo-download]')?.addEventListener('click', () => {
      v781DownloadPngFromSvg(payload.dataUrl, payload.file);
    });
  }
  function v781BuildTablePhotoSvg(mode, state) {
    const rows = v781RowsForPhoto(mode, state);
    if (!rows.length) return null;
    const title = mode === "crypto" ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR";
    const svg = v785BuildBetPhotoSvg(rows, title);
    return svg ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) : null;
  }
  function v781DownloadPngFromSvg(svgUri, filename) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }, "image/png");
    };
    img.onerror = () => alert("Resim hazırlanamadı.");
    img.src = svgUri;
  }
  function openTablePhoto(mode, state) {
    const dataUrl = v781BuildTablePhotoSvg(mode, state);
    if (!dataUrl) {
      alert(mode === "crypto" ? "Fotoğraf için önce işlem yaz." : "Fotoğraf için önce maç yaz.");
      return;
    }
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>Kupon Fotoğrafı</b><span>Ana ROLLING</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${dataUrl}" alt="Rolling fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v781-photo-download]")?.addEventListener("click", () => {
      v781DownloadPngFromSvg(dataUrl, `bulten-${mode}-aktif-rolling-${new Date().toISOString().slice(0,10)}.png`);
    });
  }
  function renderBetInfoBar(row) {
    const t = rowBetTotals(row);
    const matches = getSlotMatches(row);
    const oddsLabel = matches.length > 1 ? "Toplam Oran" : "Oran";
    return `<div class="v763-card-info">
      <span>${oddsLabel} <b>${t.odds ? t.odds.toFixed(2) : "-"}</b></span>
      <span>Tutar <b>${t.stake ? money(t.stake) : "-"}</b></span>
      <span>Olası Kazanç <b>${t.possibleWin ? money(t.possibleWin) : "-"}</b></span>
      ${t.missing ? `<em>Eksik bilgi</em>` : ""}
    </div>`;
  }
  function renderBetSingleCard(row) {
    const cardId = `v763-bet-card-${row.index}`;
    return `<article class="v763-active-card bet single v801-bet-card" id="${cardId}">
      <div class="v763-card-top">
        <div><b>${escapeHtml(cleanText(row.name) || "Bahis")}</b><span>Tekli Bahis</span></div>
        ${renderCardShotButton(cardId)}
      </div>
      ${renderBetInfoBar(row)}
      <div class="v763-card-actions v801-bet-close-actions">
        <button type="button" class="win" data-mode="bet" data-slot="${row.index}" data-status="win">Kupon Kazandı</button>
        <button type="button" class="loss" data-mode="bet" data-slot="${row.index}" data-status="loss">Kupon Kaybetti</button>
      </div>
    </article>`;
  }
  function renderBetComboCard(coupon) {
    const row = coupon.row;
    const cardId = `v763-bet-card-${row.index}`;
    const matches = coupon.matches;
    const done = matches.filter(m => m.status === "win" || m.status === "loss").length;
    const keepOpen = ACTIVE_COMBO_DETAIL_SLOT === row.index || (done > 0 && done < matches.length);
    const matchRows = matches.map((m, idx) => `<li class="${m.status || "pending"}">
      <span>${idx + 1}. ${escapeHtml(m.name)}</span>
      <b>${Number(m.odds || 0) ? Number(m.odds).toFixed(2) : "Oran eksik"}</b>
      <div>
        <button type="button" class="win ${m.status === "win" ? "selected" : ""}" data-combo-match-status="${row.index}:${idx}:win">KAZANDI</button>
        <button type="button" class="loss ${m.status === "loss" ? "selected" : ""}" data-combo-match-status="${row.index}:${idx}:loss">KAYBETTİ</button>
      </div>
    </li>`).join("");
    return `<article class="v763-active-card bet combo v801-bet-card" id="${cardId}">
      <details ${keepOpen ? "open" : ""}>
        <summary>
          <div><b>${escapeHtml(coupon.label || "Kombine")}</b><span>${matches.length} maç · ${done}/${matches.length} sonuçlandı</span></div>
          ${renderCardShotButton(cardId)}
        </summary>
        ${renderBetInfoBar(row)}
        <ul class="v763-combo-match-list">${matchRows}</ul>
        <div class="v763-card-actions v801-bet-close-actions">
          <button type="button" class="win" data-mode="bet" data-slot="${row.index}" data-status="win">Kupon Kazandı</button>
          <button type="button" class="loss" data-mode="bet" data-slot="${row.index}" data-status="loss">Kupon Kaybetti</button>
        </div>
      </details>
    </article>`;
  }
  function cryptoTpProfit(row, tp) {
    const stake = Number(row?.stake || 0);
    const manualProfit = tp?.profitAmount !== "" && tp?.profitAmount !== undefined && tp?.profitAmount !== null && Number.isFinite(Number(tp.profitAmount));
    if (!manualProfit) return { pct: 0, usd: 0, ok: false };
    let usd = Number(tp.profitAmount || 0);
    if (tp?.result === "stop") usd = -Math.abs(usd || stake);
    const pct = stake ? (usd / stake) * 100 : 0;
    return { pct, usd, ok: true };
  }
  function cryptoTpPercentLabel(row, tp) {
    const p = cryptoTpProfit(row, tp);
    if (!p.ok) return "+0.0%";
    return `${p.pct >= 0 ? "+" : ""}${p.pct.toFixed(1)}%`;
  }
  function cryptoRealizedProfit(row) {
    const tps = Array.isArray(row?.takeProfits) ? row.takeProfits : [];
    const done = tps.filter(tp => tp && (tp.result === "tp" || tp.result === "stop"));
    const sum = done.reduce((acc, tp) => acc + cryptoTpProfit(row, tp).usd, 0);
    if (done.length && Number.isFinite(sum)) return sum;
    return Number(row?.odds || 0);
  }
  function cryptoFormatPrice(v) {
    const n = Number(v || 0);
    return n ? n.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "-";
  }

  function renderCryptoCard(row) {
    const cardId = `v763-crypto-card-${row.index}`;
    const missing = !cleanText(row.name) || !Number(row.stake || 0);
    const tps = Array.isArray(row.takeProfits) && row.takeProfits.length ? row.takeProfits : [{ price: "", profitAmount: "", note: "TP1", result: "" }];
    const realized = cryptoRealizedProfit(row);
    const tpRows = tps.map((tp, idx) => {
      const label = tp?.note || `TP${idx + 1}`;
      const result = tp?.result || (tp?.done ? "tp" : "");
      const p = cryptoTpProfit(row, tp);
      const finalText = result && p.ok ? `${cryptoTpPercentLabel(row, tp)} ${signedMoney(p.usd)}` : "";
      return `
      <div class="v800-crypto-tp-row v801-crypto-tp-row v802-crypto-tp-row v803-crypto-tp-row ${result ? "done " + result : ""}">
        <span class="tp-label">${escapeHtml(label)}</span>
        <input class="tp-price" type="number" step="0.01" data-crypto-tp="${row.index}:${idx}:price" value="${escapeHtml(tp?.price ?? "")}" placeholder="">
        <input class="tp-profit" type="number" step="0.01" data-crypto-tp="${row.index}:${idx}:profitAmount" value="${escapeHtml(tp?.profitAmount ?? "")}" placeholder="Kâr">
        <div class="tp-result-actions">
          <button type="button" class="tp ${result === "tp" ? "selected" : ""}" data-crypto-tp-result="${row.index}:${idx}:tp">${result === "tp" ? "Kar alındı" : "TP ✓"}</button>
          <button type="button" class="stop ${result === "stop" ? "selected" : ""}" data-crypto-tp-result="${row.index}:${idx}:stop">${result === "stop" ? "Zarar" : "STOP"}</button>
        </div>
        <span class="tp-final ${result === "stop" ? "neg" : result === "tp" ? "pos" : "muted"}">${escapeHtml(finalText)}</span>
      </div>`;
    }).join("");
    return `<article class="v763-active-card crypto v799-crypto-card v800-crypto-card v801-crypto-card v802-crypto-card v803-crypto-card" id="${cardId}">
      <div class="v763-card-top">
        <div><b>${escapeHtml(cleanText(row.name) || "Kripto işlem")}</b></div>
        ${renderCardShotButton(cardId)}
      </div>
      <div class="v763-card-info v799-crypto-info v800-crypto-info v802-crypto-info">
        <span>Tutar <b>${Number(row.stake || 0) ? money(row.stake) : "-"}</b></span>
        <span>Kaldıraç <b>${Number(row.leverage || 1)}x</b></span>
        <span>Giriş <b>${cryptoFormatPrice(row.entryPrice)}</b></span>
        <span>Liq <b>${cryptoFormatPrice(row.liquidationPrice)}</b></span>
        <span>TP Kar <b class="${realized >= 0 ? "pos" : "neg"}">${signedMoney(realized)}</b></span>
        ${missing ? `<em>Eksik bilgi</em>` : ""}
      </div>
      <div class="v799-crypto-detail-grid v800-crypto-detail-grid v801-crypto-detail-grid v802-crypto-detail-grid">
        <label><span>Tutar</span><input type="number" step="0.01" data-crypto-detail="${row.index}:stake" value="${escapeHtml(row.stake || "")}" placeholder="300"></label>
        <label><span>Kaldıraç</span><input type="number" step="1" data-crypto-detail="${row.index}:leverage" value="${escapeHtml(row.leverage || 1)}" placeholder="10"></label>
        <label><span>Giriş Fiyatı</span><input type="number" step="0.01" data-crypto-detail="${row.index}:entryPrice" value="${escapeHtml(row.entryPrice || "")}" placeholder="68000"></label>
        <label><span>Likidasyon</span><input type="number" step="0.01" data-crypto-detail="${row.index}:liquidationPrice" value="${escapeHtml(row.liquidationPrice || "")}" placeholder="62000"></label>
      </div>
      <div class="v799-crypto-tp-box v800-crypto-tp-box v801-crypto-tp-box v802-crypto-tp-box v803-crypto-tp-box">
        <div class="v799-crypto-tp-head v800-crypto-tp-head">
          <b>Kar Alma Noktaları</b>
          <div>
            <button type="button" class="tp-add" data-crypto-tp-op="${row.index}:0:plus">+ TP</button>
            <button type="button" class="tp-remove" data-crypto-tp-op="${row.index}:0:minus" ${tps.length <= 1 ? "disabled" : ""}>− TP</button>
          </div>
        </div>
        ${tpRows}
      </div>
      <div class="v800-crypto-close-row v801-crypto-close-row">
        <button type="button" class="close-trade" data-crypto-close="${row.index}">İşlem Kapandı</button>
      </div>
    </article>`;
  }

  function addCouponHistoryRecord(state, coupon, status) {
    const row = coupon.row || coupon.rows?.[0];
    if (!row) return;
    const totals = rowBetTotals(row);
    const h = loadHistory();
    const now = Date.now();
    const names = getSlotMatches(row).map(m => m.name).filter(Boolean);
    const finalStatus = status === "loss" ? "loss" : "win";
    const rec = {
      id: "rh_" + now + "_coupon_" + Math.random().toString(36).slice(2),
      mode: "bet",
      ts: now,
      row: row.index + 1,
      name: `Kombine: ${names.join(" + ") || "Bahis / maç"}`,
      stake: totals.stake,
      odds: Number((totals.odds || 0).toFixed(4)),
      status: finalStatus,
      pnl: finalStatus === "win" ? Math.max(0, totals.possibleWin - totals.stake) : -totals.stake
    };
    h.bet.unshift(rec);
    saveHistory(h);
    const sourceRows = Array.isArray(coupon.rows) && coupon.rows.length ? coupon.rows : [row];
    sourceRows.forEach((src, idx) => {
      const slot = state.modeSlots.bet[Number(src.index || 0)];
      if (!slot) return;
      slot.status = finalStatus;
      slot.pnl = idx === 0 ? rec.pnl : 0;
      slot.historyId = rec.id;
      slot.historyStatus = finalStatus;
    });
  }
  function applyComboMatchStatus(fresh, requestedIndex, matchIndex, status) {
    const couponBefore = getBetCouponForSlot(fresh, requestedIndex);
    const baseIndex = Number(couponBefore?.slotIndex ?? requestedIndex);
    const slot = fresh?.modeSlots?.bet?.[baseIndex];
    if (!slot) return false;
    if (!Array.isArray(slot.comboResults)) slot.comboResults = [];
    if (status === "pending") slot.comboResults[Number(matchIndex || 0)] = "";
    else slot.comboResults[Number(matchIndex || 0)] = status === "loss" ? "loss" : "win";
    slot.comboResults = slot.comboResults.map(v => (v === "win" || v === "loss") ? v : "");
    const updatedCoupon = getBetCouponForSlot(fresh, baseIndex);
    const matches = updatedCoupon ? getSlotMatches(updatedCoupon.row) : getSlotMatches({ ...slot, index: baseIndex });
    const allDone = status !== "pending" && matches.length > 1 && matches.every(m => m.status === "win" || m.status === "loss");
    if (allDone) {
      const finalStatus = matches.every(m => m.status === "win") ? "win" : "loss";
      addCouponHistoryRecord(fresh, updatedCoupon || { row: { ...slot, index: baseIndex }, rows: [{ ...slot, index: baseIndex }], matches }, finalStatus);
    }
    return true;
  }

  function renderPendingBoard(mode, state) {
    const isCrypto = mode === "crypto";
    if (isCrypto) {
      const rows = pendingRowsForMode(mode, state);
      return `
        <div class="v757-pending-board v759-pending-board v763-pending-board crypto">
          <div class="v757-pending-head v763-pending-head">
            <div>
              <b>Aktif Kripto İşlemleri</b>
              <span>İşlem adı yazılan kutular burada görünür; sonuç verince aktiften düşüp Geçmiş'e gider.</span>
            </div>
            <div class="v757-pending-metrics"><span>${rows.length} aktif</span></div>
          </div>
          <div class="v763-active-list">
            ${rows.length ? rows.map(renderCryptoCard).join("") : `<div class="v759-empty-note">Aktif kripto işlemi yok.</div>`}
          </div>
        </div>`;
    }
    const grouped = getBetCouponGroups(state);
    const cards = [
      ...grouped.singles.map(renderBetSingleCard),
      ...grouped.coupons.map(renderBetComboCard)
    ];
    return `
      <div class="v757-pending-board v759-pending-board v763-pending-board bet">
        <div class="v757-pending-head v763-pending-head">
          <div>
            <b>Aktif Bahisler / Kuponlar</b>
            <span>Tek seçilen satır tekli gider; Kupon 1/2/3/4 seçilen satırlar kendi kupon grubunda birleşir.</span>
          </div>
          <div class="v757-pending-metrics"><span>${grouped.rows.length} aktif</span></div>
        </div>
        <div class="v763-active-list">
          ${cards.length ? cards.join("") : `<div class="v759-empty-note">Aktif bahis veya kupon yok.</div>`}
        </div>
      </div>`;
  }

  function renderModeCommand(mode, slots, state, summary, rollSummaryForMode) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const pending = visible.filter(s => (s.status === "pending" || s.status === "empty" || !s.status) && slotHasUserEntry(s, mode)).length;
    const settled = visible.filter(s => s.status === "win" || s.status === "loss").length;
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const todayPnl = today.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    return `
      <div class="v751-roll-command v753-roll-log-command v757-roll-compact-command ${mode}">
        <div class="v757-command-summary">
          <div>
            <b>${isCrypto ? "Kripto İşlem Paneli" : "Bahis Kupon Paneli"}</b>
            <span>${pending} aktif/bekleyen · ${settled} kapalı · Bugün ${today.length} geçmiş · ${summary.wins} W / ${summary.losses} L · ROI ${Number(summary.roi || 0).toFixed(1)}%</span>
          </div>
        </div>
        <div class="v757-command-micro">
          <span>Bugün <b class="${todayPnl >= 0 ? "pos" : "neg"}">${signedMoney(todayPnl)}</b></span>
          <span>Bu hafta <b>${week.length} kayıt</b></span>
          <span>Sonuç verirken profesyonel onay penceresi açılır; deneme tıklaması Geçmiş'e düşmez.</span>
        </div>
      </div>`;
  }

  function renderLogCenterModal(state) {
    if (!LOG_CENTER_OPEN_MODE) return "";
    const mode = LOG_CENTER_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const month = filterHistoryRows(history, "month");
    const rows = filterHistoryRows(history, HISTORY_FILTER);
    const pnl = rows => rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const filters = ["today","yesterday","week","month","year","twoYears","all"].map(f => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${historyFilterLabel(f)}</button>`).join("");
    const tableRows = rows.length ? rows.map(r => `
      <tr>
        <td>${escapeHtml(formatDateTime(r.ts))}</td>
        <td>${escapeHtml(r.name || (isCrypto ? "Kripto işlem" : "Bahis / maç"))}</td>
        <td>${money(r.stake)}</td>
        <td>${isCrypto ? money(r.odds || 0) : escapeHtml(String(r.odds || 0))}</td>
        <td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td>
        <td><div class="v757-history-pnl-cell v800-history-actions"><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</span><button type="button" class="v800-history-restore" data-history-restore="${mode}:${escapeHtml(r.id || "")}" title="Aktife geri al"><i class="fa-solid fa-rotate-left"></i></button><button type="button" class="v757-history-delete" data-history-delete="${mode}:${escapeHtml(r.id || "")}" title="Bu geçmiş kaydını sil"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="v512-history-empty">Bu filtrede geçmiş kaydı yok.</td></tr>`;
    return `
      <div class="v757-log-center-overlay v758-log-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO GEÇMİŞİ" : "BAHİS GEÇMİŞİ"}</b>
              <span>Sonuçlanan kayıtlar ve silme işlemleri.</span>
            </div>
            <button type="button" data-log-center-close>×</button>
          </div>
          <div class="v753-log-strip v757-log-strip-modal v758-log-strip-modal v763-history-strip">
            <div><span>Bugün</span><b>${today.length} kayıt</b><em class="${pnl(today) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(today))}</em></div>
            <div><span>Bu Hafta</span><b>${week.length} kayıt</b><em class="${pnl(week) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(week))}</em></div>
            <div><span>Bu Ay</span><b>${month.length} kayıt</b><em class="${pnl(month) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(month))}</em></div>
          </div>
          <div class="v512-history-filters v758-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v758-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z / İşlem</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function reportMetricBlock(label, rows) {
    const pnl = rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const stake = rows.reduce((sum, r) => sum + Number(r.stake || 0), 0);
    const wins = rows.filter(r => r.status === "win").length;
    const losses = rows.filter(r => r.status === "loss").length;
    const roi = stake ? (pnl / stake) * 100 : 0;
    return `<div><span>${label}</span><b class="${pnl >= 0 ? "pos" : "neg"}">${signedMoney(pnl)}</b><em>${rows.length} kayıt · ${wins} W / ${losses} L · ROI ${roi.toFixed(1)}%</em></div>`;
  }
  function renderReportCenterModal(state) {
    if (!REPORT_CENTER_OPEN_MODE) return "";
    const mode = REPORT_CENTER_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const month = filterHistoryRows(history, "month");
    const all = filterHistoryRows(history, "all");
    const recent = all.slice(0, 8).map(r => `<tr><td>${escapeHtml(formatDateTime(r.ts))}</td><td>${escapeHtml(r.name || "-")}</td><td>${money(r.stake)}</td><td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td><td class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</td></tr>`).join("") || `<tr><td colspan="5" class="v512-history-empty">Henüz rapora girecek kayıt yok.</td></tr>`;
    return `
      <div class="v757-log-center-overlay v758-log-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal v763-report-modal v799-report-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO RAPOR" : "BAHİS RAPOR"}</b>
              <span>Rapor, Geçmiş kayıtlarından otomatik hesaplanır. Geçmiş silinirse rapor da sıfırlanır.</span>
            </div>
            <button type="button" data-report-center-close>×</button>
          </div>
          <div class="v799-report-metrics">
            ${reportMetricBlock("Bugün", today)}
            ${reportMetricBlock("Bu Hafta", week)}
            ${reportMetricBlock("Bu Ay", month)}
            ${reportMetricBlock("Tümü", all)}
          </div>
          <div class="v512-history-table-wrap v799-report-table">
            <table class="v512-history-table">
              <thead><tr><th>Tarih</th><th>${isCrypto ? "İşlem" : "Maç / Kupon"}</th><th>Tutar</th><th>Sonuç</th><th>K/Z</th></tr></thead>
              <tbody>${recent}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function renderPendingModal(state) {
    if (!PENDING_BOARD_OPEN_MODE) return "";
    const mode = PENDING_BOARD_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    return `
      <div class="v758-pending-overlay">
        <section class="v758-pending-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR"}</b>
            </div>
            <button type="button" data-pending-close>×</button>
          </div>
          ${renderPendingBoard(mode, state)}
        </section>
      </div>`;
  }

  function createSlot(type = "bet", i = 0) {
    const slot = { id: i + 1, type, name: "", stake: "", odds: "", cryptoPnlMode: type === "crypto" ? "amount" : "odds", status: "pending", pnl: 0 };
    if (type === "bet") { slot.betKind = "single"; slot.couponGroup = ""; }
    return slot;
  }
  function createSlots(type = "bet", count = 5) {
    return Array.from({ length: count }, (_, i) => createSlot(type, i));
  }
  function sanitizeEmptyPendingSlot(slot, type) {
    if (!slot || slot.status === "win" || slot.status === "loss") return;
    const hasMainName = !!cleanText(slot.name);
    const hasExtraName = Array.isArray(slot.extraMatches) && slot.extraMatches.some(m => cleanText(m?.name));
    if (hasMainName || hasExtraName) return;
    slot.name = "";
    slot.stake = "";
    slot.odds = "";
    slot.pnl = 0;
    slot.status = "pending";
    if (type === "bet") {
      slot.extraMatches = [];
      slot.comboResults = [];
      slot.couponGroup = "";
      slot.betKind = "single";
    }
  }
  function ensureStateShape(state) {
    if (!state.modeSlots || typeof state.modeSlots !== "object") {
      const old = Array.isArray(state.slots) ? state.slots : createSlots("bet", 5);
      state.modeSlots = { bet: old.map((s, i) => ({ ...createSlot("bet", i), ...s, type: "bet" })), crypto: createSlots("crypto", 5) };
    }
    if (!Array.isArray(state.modeSlots.bet)) state.modeSlots.bet = createSlots("bet", 5);
    if (!Array.isArray(state.modeSlots.crypto)) state.modeSlots.crypto = createSlots("crypto", 5);
    if (!state.rowCounts || typeof state.rowCounts !== "object") state.rowCounts = { bet: 20, crypto: 20 };
    if (!state.quickPlan || typeof state.quickPlan !== "object") state.quickPlan = { start: 100, target: 1000, currentOverride: "" };
    if (state.quickPlan.currentOverride === undefined || state.quickPlan.currentOverride === null) state.quickPlan.currentOverride = "";
    if (state.quickPlan.target === undefined || state.quickPlan.target === null) state.quickPlan.target = 1000;
    if (state.quickPlan.start === undefined || state.quickPlan.start === null || state.quickPlan.start === "") state.quickPlan.start = 100;
    ensureQuickTemplates(state);
    ensureQuickPlans(state);
    state.rowCounts.bet = Math.max(1, Math.min(20, Number(state.rowCounts.bet || 20)));
    state.rowCounts.crypto = Math.max(1, Math.min(20, Number(state.rowCounts.crypto || 20)));
    while (state.modeSlots.bet.length < state.rowCounts.bet) state.modeSlots.bet.push(createSlot("bet", state.modeSlots.bet.length));
    while (state.modeSlots.crypto.length < state.rowCounts.crypto) state.modeSlots.crypto.push(createSlot("crypto", state.modeSlots.crypto.length));
    state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = i + 1; sanitizeEmptyPendingSlot(s, "bet"); });
    normalizeBetCouponGroups(state.modeSlots.bet);
    state.modeSlots.crypto.forEach((s, i) => {
      s.type = "crypto";
      s.id = i + 1;
      if (!s.cryptoPnlMode) s.cryptoPnlMode = "amount";
      if (s.entryPrice === undefined || s.entryPrice === null) s.entryPrice = "";
      if (s.liquidationPrice === undefined || s.liquidationPrice === null) s.liquidationPrice = "";
      if (s.leverage === undefined || s.leverage === null || s.leverage === "") s.leverage = 1;
      if (!Array.isArray(s.takeProfits)) s.takeProfits = [];
      if (!s.takeProfits.length) s.takeProfits = [{ price: "", profitAmount: "", note: "TP1", result: "" }];
      sanitizeEmptyPendingSlot(s, "crypto");
    });
  }
  function loadState() {
    try {
      const legacy = legacyCombinedState();
      const hasSplit = storageHas(STORAGE_KEY_BET) || storageHas(STORAGE_KEY_CRYPTO) || storageHas(STORAGE_KEY_UI);
      const ui = readJson(STORAGE_KEY_UI, {});
      const betStore = normalizeModeStore("bet", readJson(STORAGE_KEY_BET, null), legacy);
      const cryptoStore = normalizeModeStore("crypto", readJson(STORAGE_KEY_CRYPTO, null), legacy);
      const state = {
        ...DEFAULT_STATE,
        bank: Number(ui.bank ?? legacy.bank ?? DEFAULT_STATE.bank),
        modeSlots: { bet: betStore.slots, crypto: cryptoStore.slots },
        rowCounts: { bet: betStore.rowCount, crypto: cryptoStore.rowCount },
        quickTemplates: { bet: betStore.quickTemplate, crypto: cryptoStore.quickTemplate },
        quickPlans: { bet: betStore.quickPlan, crypto: cryptoStore.quickPlan },
        quickPlan: ui.quickPlan && typeof ui.quickPlan === "object" ? ui.quickPlan : (legacy.quickPlan || DEFAULT_STATE.quickPlan)
      };
      ensureStateShape(state);
      syncStateWithHistory(state);
      if (!hasSplit && storageHas(STORAGE_KEY)) saveState(state);
      return state;
    } catch {
      const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      ensureStateShape(state);
      return state;
    }
  }
  function saveState(state) {
    ensureStateShape(state);
    writeJson(STORAGE_KEY_UI, {
      version: 984,
      updatedAt: Date.now(),
      bank: Number(state.bank || DEFAULT_STATE.bank),
      quickPlan: state.quickPlan || { start: 100, target: 1000, currentOverride: "" }
    });
    writeJson(STORAGE_KEY_BET, buildModeStore("bet", state));
    writeJson(STORAGE_KEY_CRYPTO, buildModeStore("crypto", state));
  }
  function recalcSlot(slot) {
    const stake = Number(slot.stake || 0);
    const val = Number(slot.odds || 0);
    if (slot.status === "win") {
      slot.pnl = slot.type === "bet" ? stake * (val - 1) : Math.abs(val);
    } else if (slot.status === "loss") {
      slot.pnl = slot.type === "bet" ? -stake : -Math.abs(val);
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
        const comboRows = Array.isArray(op.combo) ? op.combo : [];
        const totalOdds = comboRows.reduce((p, row) => p * (Number(row?.odds || 0) || 1), val || 0);
        const pnl = mode === "crypto"
          ? Math.abs(val)
          : (op.res === "win" ? (amt * totalOdds) - amt : amt);
        balance += op.res === "win" ? pnl : -pnl;
      }));
      startTotal += start; currentTotal += balance; pnlTotal += (balance - start);
    });
    return { startTotal, currentTotal, pnlTotal };
  }
  function routeMode() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("rolling/crypto") || raw.startsWith("finance/rolling/crypto")) return "crypto";
    if (raw.startsWith("rolling/bet") || raw.startsWith("rolling/bahis") || raw.startsWith("finance/rolling/bet")) return "bet";
    return "";
  }
  function activeMode() {
    const fromRoute = routeMode();
    if (fromRoute) {
      localStorage.setItem(PAGE_MODE_KEY, fromRoute);
      return fromRoute;
    }
    return localStorage.getItem(PAGE_MODE_KEY) === "crypto" ? "crypto" : "bet";
  }
  function setActiveMode(mode) {
    const next = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(PAGE_MODE_KEY, next);
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("rolling")) {
      try { history.replaceState({ tab: "rolling" }, "", "#rolling/" + next); } catch {}
    }
  }
  function targetCardOpen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return localStorage.getItem(TARGET_CARD_OPEN_KEY + "_" + m) === "1";
  }
  function setTargetCardOpen(mode, open) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(TARGET_CARD_OPEN_KEY + "_" + m, open ? "1" : "0");
  }
  function targetLogOpen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return localStorage.getItem(TARGET_LOG_OPEN_KEY + "_" + m) === "1";
  }
  function setTargetLogOpen(mode, open) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(TARGET_LOG_OPEN_KEY + "_" + m, open ? "1" : "0");
  }
  function railCollapsed() { return localStorage.getItem(RAIL_KEY) === "1"; }
  function setRailCollapsed(v) { localStorage.setItem(RAIL_KEY, v ? "1" : "0"); }
  function openRolling(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem("finance_rolling_mode", m);
    if (typeof window.omega_OpenRollingExcel === "function") {
      window.omega_OpenRollingExcel(days);
      const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
      if (raw.startsWith("rolling")) {
        try { history.replaceState({ tab: "rolling", mode: m, rollingDays: days }, "", `#rolling/${m}/rolling/${days}`); } catch {}
      }
    }
    else alert("Rolling modülü bulunamadı.");
  }
  function renderRollingButtons(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return [7, 15, 30, 60, 90].map(d => `<button type="button" data-roll="${m}:${d}"><span>${d} GÜNLÜK ROLLING</span></button>`).join("");
  }
  function renderRowControls(mode, state) {
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const label = mode === "crypto" ? "Kripto" : "Bahis";
    const pendingLabel = mode === "crypto" ? "Aktif Kripto İşlemleri" : "Aktif Bahisler / Kuponlar";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls"><span>${count}/20 ${label} Alanı</span><button type="button" data-row-op="${mode}:minus" title="Alan azalt">−</button><button type="button" data-row-op="${mode}:plus" title="Alan ekle">+</button><button type="button" data-row-preset="${mode}:5">5</button><button type="button" data-row-preset="${mode}:10">10</button><button type="button" data-row-preset="${mode}:20">20</button><button type="button" class="v758-row-tool v759-row-tool active" data-pending-open="${mode}"><i class="fa-solid fa-list-check"></i> ${pendingLabel}</button><button type="button" class="v758-row-tool history" data-log-center="${mode}"><i class="fa-solid fa-clock-rotate-left"></i> Geçmiş</button></div>`;
  }

  
  function v997BetMenuTypeLabel(slot) {
    const g = betCouponGroup(slot);
    return g ? `Kupon ${g}` : "Tekli Bahis";
  }
function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderTable(mode, slots, state) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const comboStatusLookup = isCrypto ? {} : getBetComboStatusLookup(state);
    if (isCrypto) {
      return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table v803-crypto-main-table"><thead><tr><th></th><th>#</th><th>Tür</th><th>AKTİF İŞLEM</th><th>Tutar</th></tr></thead><tbody>${visible.map((s, i) => {
        return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell v986-crypto-type-cell"><span class="rolling-v47-type ${mode}">Kripto</span></div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="İşlem"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td></tr>`;
      }).join("")}</tbody></table></div>`;
    }
    const noteHead = "MAÇ";
    const notePH = "Maç";
    const valHead = "ORAN";
    const winText = "KAZANDI";
    const lossText = "KAYBETTİ";
    const pnlHead = "K/Z";
    return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table"><thead><tr><th><button type="button" class="v781-table-photo-btn" data-main-table-photo="bet" title="Kupon fotoğrafı" aria-label="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button></th><th>#</th><th>Tür</th><th>${noteHead}</th><th>${valHead}</th><th>Tutar</th><th>Durum</th><th>${pnlHead}</th><th>İşlem</th></tr></thead><tbody>${visible.map((s, i) => {
      const comboStatus = comboStatusLookup[i] || "";
      const rowStatus = comboStatus || s.status || "pending";
      const status = rowStatus === "win" ? winText : rowStatus === "loss" ? lossText : "BEKLİYOR";
      const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
      const group = betCouponGroup(s);
      const kindClass = group ? "combo" : "single";
      const groupLabel = group ? `Kupon ${group}` : "Tek";
      const groupChoices = [`<button type="button" class="v995-bet-group-option single" data-bet-group-choice="${i}:">Tek</button>`].concat([1,2,3,4].map(n => `<button type="button" class="v995-bet-group-option combo" data-bet-group-choice="${i}:${n}">Kupon ${n}</button>`)).join("");
      const kindSelect = `<div class="v995-bet-group-menu ${kindClass}" data-bet-group-menu="${i}"><button type="button" class="v995-bet-group-toggle ${kindClass}" data-bet-group-toggle="${i}" title="Tekli / kupon grubu seç"><span>${groupLabel}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="v995-bet-group-list" role="menu">${groupChoices}</div></div>`;
      return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell v988-bet-type-cell"><span class="rolling-v47-type ${mode}">Bahis</span>${kindSelect}</div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePH}"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds || ""}" placeholder="Oran"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td><td><span class="v757-status-pill ${rowStatus === "win" || rowStatus === "loss" ? rowStatus : "pending"}">${status}</span></td><td class="${pnlClass}">${money(s.pnl || 0)}</td><td><div class="rolling-v47-actions v757-actions"><button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win">${winText}</button><button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss">${lossText}</button></div></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function renderModeSplitNotice(mode) {
    return "";
  }

  function renderModePanel(mode, state) {
    const isCrypto = mode === "crypto";
    const slots = isCrypto ? state.modeSlots.crypto : state.modeSlots.bet;
    const sum = slotSummary(slots);
    const rollSum = rollingSummary(mode);
    const menuTitle = isCrypto ? "KRİPTO İŞLEM MENÜSÜ" : "TEKLİ MAÇ / KOMBİNE KUPONLAR MENÜSÜ";
    return `
      <section class="rolling-v47-card ${mode} v49-mode-card">
        <div class="rolling-v47-head">
          <div>
            <h3 class="${isCrypto ? "rolling-v493-title crypto" : "rolling-v493-title bet"}">${isCrypto ? '<span class="rolling-v518-crypto-icons"><i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i><img class="rolling-v521-ethereum-svg rolling-v518-ethereum-icon" src="assets/icons/ethereum.svg" alt="Ethereum" loading="lazy"></span>' : '<span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span>'} <span>${isCrypto ? "KRİPTO" : "BAHİS"}</span></h3>
          </div>
          <div class="rolling-v47-mini">
            <span>Rolling ${money(rollSum.pnlTotal)} · Menü ${money(sum.pnl)}</span>
            <b class="${sum.pnl >= 0 ? "pos" : "neg"}">${money(sum.pnl)}</b>
          </div>
        </div>

        ${renderModeSplitNotice(mode)}

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-crypto-roll-title" : "rolling-v493-fold-title bet rolling-v494-bet-roll-title"}"><i class="fa-solid fa-layer-group"></i> <span ${isCrypto ? 'style="color:#fbbf24 !important;text-shadow:0 0 10px rgba(251,191,36,.24);"' : ""}>${isCrypto ? "KRİPTO ROLLING" : "BAHİS ROLLING"}</span></summary>
          <div class="rolling-v47-roll-panel ${mode}">
            <div class="rolling-v47-roll-buttons">${renderRollingButtons(mode)}</div>
          </div>
        </details>

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-active-title" : "rolling-v493-fold-title bet rolling-v494-combine-title"}"><i class="fa-solid ${isCrypto ? "fa-chart-simple" : "fa-list-check"}" ${isCrypto ? "" : 'style="color:#22c55e !important;text-shadow:0 0 10px rgba(34,197,94,.35);"'}></i> <span>${menuTitle}</span></summary>
          <div class="rolling-v47-section-title">
            <div>${renderRowControls(mode, state)}</div>
            <button type="button" data-clear="${mode}">TÜMÜNÜ TEMİZLE</button>
          </div>
          ${renderTable(mode, slots, state)}
        </details>
      </section>`;
  }
  function renderPlanControl(state, mode = "bet", modePnl = 0) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const plan = getPlanNumbers(state, modePnl, m);
    const modeLabel = m === "crypto" ? "Kripto" : "Bahis";
    return `
      <details class="v796-target-card v798-target-card v802-target-card v984-target-card ${m}" data-target-card="${m}" ${targetCardOpen(m) ? "open" : ""}>
        <summary class="v802-target-summary v984-target-summary v985-target-summary">
          <div class="v984-target-head v985-target-head">
            <button type="button" class="v758-row-tool history v984-target-history-btn" data-target-history-open="${m}">Geçmiş</button>
            <span class="v985-target-detail-toggle" aria-hidden="true"></span>
          </div>
          <b class="v984-target-title v985-target-title">${modeLabel} Kasa Hedefi</b>
          <div class="v802-target-mini-grid v984-target-mini-grid v985-target-mini-grid">
            <span>Başlangıç <b>${money(plan.start)}</b></span>
            <span>Hedef <b>${plan.target ? money(plan.target) : "Hedef gir"}</b></span>
            <span>Güncel <b>${money(plan.current)}</b></span>
            <span>Kalan <b>${plan.target ? money(plan.remaining) : "-"}</b></span>
          </div>
        </summary>

        <div class="v796-target-bar v798-target-bar"><u style="width:${plan.pct.toFixed(1)}%"></u></div>

        <div class="v796-target-metrics v798-target-metrics">
          <span>Kasa Hedefi K/Z <b class="${plan.pnl >= 0 ? "pos" : "neg"}">${signedMoney(plan.pnl)}</b></span>
          <span>Büyüme <b class="${plan.growth >= 0 ? "pos" : "neg"}">${pctText(plan.growth)}</b></span>
          <span>Kalan <b>${plan.target ? money(plan.remaining) : "-"}</b></span>
        </div>

        <div class="v798-target-detail v802-target-detail">
          <div class="v796-target-values">
            <label><span>Başlangıç</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="start" value="${plan.start}"></label>
            <label><span>Güncel</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="currentOverride" value="${plan.hasManualCurrent ? plan.current : ""}" placeholder="${money(plan.autoCurrent)}"></label>
            <label><span>Hedef</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="target" value="${plan.target || ""}" placeholder="Hedef gir"></label>
          </div>

          ${renderTargetActiveBox(state, m)}

          <div class="v796-target-actions">
            <button type="button" data-target-reset data-rolling-target-mode="${m}">Yeni Hedef</button>
            <button type="button" class="complete" data-target-complete data-rolling-target-mode="${m}" ${plan.done ? "" : "disabled"}>Hedefi Bitir</button>
          </div>
        </div>
      </details>`;
  }


  function renderModule() {
    const mount = qs("omega-rolling-render");
    if (!mount) return;
    const state = loadState();
    const betSum = slotSummary(state.modeSlots.bet);
    const cryptoSum = slotSummary(state.modeSlots.crypto);
    const betRollSum = rollingSummary("bet");
    const cryptoRollSum = rollingSummary("crypto");
    const mode = activeMode();
    const isCrypto = mode === "crypto";
    const modeSum = isCrypto ? cryptoSum : betSum;
    const modeRollSum = isCrypto ? cryptoRollSum : betRollSum;
    const modeLabel = isCrypto ? "KRİPTO" : "BAHİS";
    const modeIcon = isCrypto ? "fa-brands fa-bitcoin" : "fa-solid fa-layer-group";
    const modePlanPnl = v812TargetRealizedPnl(mode);
    const modePlanStart = getModeQuickPlan(state, mode).start || 100;
    const modePlanGrowth = growthPct(modePlanPnl, modePlanStart);
    const menuKpiLabel = isCrypto ? "Kripto İşlem Menüsü K/Z" : "Kombine Kuponlar Menüsü K/Z";
    mount.innerHTML = `
      <div class="rolling-v47-page v48-rolling-page v49-rolling-page" data-rolling-screen="${mode}">
        <div class="rolling-v47-hero v48-rolling-hero">
          <div><h2><i class="${modeIcon}"></i> <span ${isCrypto ? 'style="color:#fbbf24 !important;text-shadow:0 0 10px rgba(251,191,36,.24);"' : ""}>${modeLabel} ROLLING</span></h2><span class="v798-hero-note">${modeLabel} Genel Performans Özeti</span></div>
          <div class="rolling-v47-hero-kpis v753-rolling-kpis v756-rolling-kpis">
            <div><span>Kasa Hedefi K/Z</span><b class="${modePlanPnl >= 0 ? "pos" : "neg"}">${signedMoney(modePlanPnl)}</b><em>${pctText(modePlanGrowth)} hedef alanı</em></div>
            <div><span>${isCrypto ? "Kripto" : "Bahis"} Rolling K/Z</span><b class="${modeRollSum.pnlTotal >= 0 ? "pos" : "neg"}">${signedMoney(modeRollSum.pnlTotal)}</b><em>Başlangıç ${money(modeRollSum.startTotal || 0)}</em></div>
            <div><span>${menuKpiLabel}</span><b class="${modeSum.pnl >= 0 ? "pos" : "neg"}">${signedMoney(modeSum.pnl)}</b><em>${modeSum.settled} kapalı · Açık ${money(modeSum.open)}</em></div>
          </div>
        </div>

        <div class="rolling-v48-layout v49-rolling-layout">
          <aside class="rolling-v48-rail v49-rolling-rail" data-rolling-owned-menu="${mode}">
            ${renderPlanControl(state, mode, 0)}
          </aside>
          <main class="rolling-v48-main">${renderModePanel(mode, state)}</main>
        </div>
        ${renderPendingModal(state)}
        ${renderLogCenterModal(state)}
        ${renderHistoryModal()}
        ${renderConfirmDialog()}
      </div>`;
    bindEvents(mount, state);
  }
  function applySlotResult(state, mode, i, nextStatus) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    if (!list[i]) list[i] = createSlot(mode, i);
    const prevStatus = list[i].status;
    list[i].type = mode;
    if (nextStatus === "pending") {
      list[i].status = "pending";
      list[i].pnl = 0;
      list[i].historyStatus = "";
      list[i].historyId = "";
      return;
    }
    list[i].status = nextStatus;
    recalcSlot(list[i]);
    if ((list[i].status === "win" || list[i].status === "loss") && (prevStatus !== list[i].status || list[i].historyStatus !== list[i].status)) {
      addHistoryRecord(mode, list[i], i);
    }
  }
  function downloadActiveCardScreenshot(cardId) {
    const match = String(cardId || "").match(/v763-bet-card-(\d+)/);
    const slotIndex = match ? Number(match[1]) : -1;
    const state = loadState();
    const grouped = getBetCouponGroups(state);
    const coupon = grouped.coupons.find(c => Number(c.slotIndex) === slotIndex);
    const single = grouped.singles.find(r => Number(r.index) === slotIndex);
    let rows = [];
    if (coupon) {
      const totals = rowBetTotals(coupon.row);
      rows = [{
        index: coupon.slotIndex + 1,
        type: "Kombine",
        name: coupon.matches.map(m => cleanText(m.name)).filter(Boolean).join(" + "),
        matchLines: coupon.matches.map(m => cleanText(m.name)).filter(Boolean),
        matchOdds: coupon.matches.map(m => Number(m.odds || 0)),
        stake: Number(coupon.row.stake || 0),
        odds: Number(totals.odds || 0),
        possible: Number(totals.possibleWin || 0)
      }];
    } else if (single) {
      const totals = rowBetTotals(single);
      rows = [{
        index: single.index + 1,
        type: "Bahis",
        name: cleanText(single.name),
        matchLines: [cleanText(single.name)],
        matchOdds: [Number(single.odds || 0)],
        stake: Number(single.stake || 0),
        odds: Number(totals.odds || 0),
        possible: Number(totals.possibleWin || 0)
      }];
    }
    if (!rows.length) return;
    const svg = v785BuildBetPhotoSvg(rows, 'BAHİS FOTOĞRAFI');
    if (!svg) return;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    openRollingPhotoPreview(dataUrl, `bulten-bahis-fotografi-${new Date().toISOString().slice(0,10)}.png`, 'Bahis Fotoğrafı', 'Aktif Bahisler / Kuponlar');
  }

  function buildCryptoCardPhotoSvg(row) {
    const safe = escapeHtml;
    const tps = Array.isArray(row.takeProfits) && row.takeProfits.length ? row.takeProfits : [];
    const tpLines = tps.slice(0, 8).map((tp, idx) => {
      const y = 255 + idx * 42;
      const p = cryptoTpProfit(row, tp);
      const profit = p.ok ? `${p.usd >= 0 ? "+" : ""}${p.usd.toFixed(2)} $ · ${p.pct >= 0 ? "+" : ""}${p.pct.toFixed(1)}%` : "-";
      const status = tp?.result === "stop" ? "ZARAR" : (tp?.result === "tp" || tp?.done) ? "ALINDI" : "BEKLİYOR";
      return `<rect x="42" y="${y - 27}" width="816" height="34" rx="10" fill="#0f172a" stroke="#334155"/><text x="64" y="${y - 4}" fill="#f8fafc" font-size="18" font-family="Arial" font-weight="850">TP${idx + 1}</text><text x="160" y="${y - 4}" fill="#fbbf24" font-size="18" font-family="Arial" font-weight="900">${tp?.price ? safe(tp.price) : "-"}</text><text x="430" y="${y - 4}" fill="#22c55e" font-size="18" font-family="Arial" font-weight="950">${safe(profit)}</text><text x="830" y="${y - 4}" text-anchor="end" fill="${tp?.result === "stop" ? "#ef4444" : (tp?.result === "tp" || tp?.done) ? "#22c55e" : "#94a3b8"}" font-size="16" font-family="Arial" font-weight="950">${status}</text>`;
    }).join("");
    const footerY = 280 + Math.max(1, tps.length) * 42;
    const height = footerY + 130;
    const title = safe(cleanText(row.name) || "Kripto İşlem");
    const realized = cryptoRealizedProfit(row);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}"><rect width="900" height="${height}" fill="#020617"/><rect x="22" y="22" width="856" height="${height-44}" rx="24" fill="#0b1120" stroke="#38bdf8" stroke-width="2"/><text x="42" y="72" fill="#38bdf8" font-size="28" font-family="Arial" font-weight="900">AKTİF KRİPTO İŞLEMİ</text><text x="42" y="108" fill="#f8fafc" font-size="22" font-family="Arial" font-weight="900">${title}</text><text x="42" y="145" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="800">${new Date().toLocaleString("tr-TR")}</text><rect x="42" y="170" width="816" height="50" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="202" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="850">Giriş: ${row.entryPrice || "-"}</text><text x="330" y="202" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="850">Likidasyon: ${row.liquidationPrice || "-"}</text><text x="830" y="202" text-anchor="end" fill="${realized >= 0 ? "#22c55e" : "#ef4444"}" font-size="18" font-family="Arial" font-weight="950">TP Kar: ${signedMoney(realized)}</text><text x="42" y="246" fill="#94a3b8" font-size="15" font-family="Arial" font-weight="900">KAR ALMA NOKTALARI</text>${tpLines || `<text x="64" y="268" fill="#94a3b8" font-size="18" font-family="Arial" font-weight="800">TP noktası yok</text>`}<rect x="42" y="${footerY}" width="816" height="58" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="${footerY + 36}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="900">Tutar: ${money(row.stake || 0)}</text><text x="830" y="${footerY + 36}" text-anchor="end" fill="${Number(row.pnl || 0) >= 0 ? "#22c55e" : "#ef4444"}" font-size="20" font-family="Arial" font-weight="950">PNL: ${money(row.pnl || 0)}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function downloadCryptoCardScreenshot(slotIndex) {
    const state = loadState();
    const row = { ...(state.modeSlots.crypto[Number(slotIndex || 0)] || {}), index: Number(slotIndex || 0) };
    if (!slotHasUserEntry(row, "crypto")) return;
    const dataUrl = buildCryptoCardPhotoSvg(row);
    openRollingPhotoPreview(dataUrl, `bulten-kripto-islem-${new Date().toISOString().slice(0,10)}.png`, 'Kripto İşlem Fotoğrafı', 'Aktif Kripto İşlemleri');
  }

  function deleteHistoryRecord(mode, id) {
    const h = loadHistory();
    h[mode] = (h[mode] || []).filter(r => r.id !== id);
    saveHistory(h);
    const state = loadState();
    ["bet", "crypto"].forEach(m => (state.modeSlots[m] || []).forEach(slot => {
      if (slot && slot.historyId === id) {
        slot.historyId = "";
        slot.historyStatus = "";
        slot.status = slotHasUserEntry(slot, m) ? "pending" : "pending";
        slot.pnl = 0;
        if (m === "bet") { slot.comboResults = []; slot.couponGroup = ""; slot.betKind = "single"; }
      }
    }));
    syncStateWithHistory(state);
    saveState(state);
  }

  function restoreHistoryRecord(mode, id) {
    const h = loadHistory();
    const m = mode === "crypto" ? "crypto" : "bet";
    const rec = (h[m] || []).find(r => r.id === id);
    if (!rec) return;
    const state = loadState();
    const list = state.modeSlots[m] || [];
    let index = list.findIndex(s => s && s.historyId === id);
    if (index < 0) index = list.findIndex(s => !slotHasUserEntry(s, m));
    if (index < 0) {
      index = list.length;
      list.push(createSlot(m, index));
    }
    const slot = { ...createSlot(m, index), ...(list[index] || {}) };
    slot.type = m;
    slot.id = index + 1;
    slot.name = rec.name || "";
    slot.stake = rec.stake || "";
    slot.odds = rec.odds || "";
    slot.status = "pending";
    slot.pnl = 0;
    slot.historyId = "";
    slot.historyStatus = "";
    if (m === "crypto") {
      slot.entryPrice = rec.entryPrice || slot.entryPrice || "";
      slot.liquidationPrice = rec.liquidationPrice || slot.liquidationPrice || "";
      slot.leverage = rec.leverage || slot.leverage || 1;
      slot.takeProfits = Array.isArray(rec.takeProfits) && rec.takeProfits.length
        ? rec.takeProfits.map((tp, i) => ({ price: tp.price || "", profitAmount: tp.profitAmount || "", note: tp.note || `TP${i + 1}`, result: tp.result || (tp.done ? "tp" : ""), done: !!tp.done }))
        : [{ price: "", profitAmount: "", note: "TP1", result: "" }];
    }
    list[index] = slot;
    state.modeSlots[m] = list;
    h[m] = (h[m] || []).filter(r => r.id !== id);
    saveHistory(h);
    saveState(state);
  }

  function renderFloatingPanel() {
    let host = document.getElementById("omega-rolling-feature-host");
    const hasOpen = Boolean(PENDING_BOARD_OPEN_MODE || LOG_CENTER_OPEN_MODE || REPORT_CENTER_OPEN_MODE || TARGET_HISTORY_OPEN_MODE || CONFIRM_DIALOG);
    if (!hasOpen) {
      if (host) host.remove();
      return;
    }
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      host.dataset.rollingFloating = "1";
      document.body.appendChild(host);
    }
    const state = loadState();
    host.dataset.rollingFloating = "1";
    host.innerHTML = `${renderPendingModal(state)}${renderLogCenterModal(state)}${renderTargetHistoryModal()}${renderConfirmDialog()}`;
    bindEvents(host, state);
  }

  function refreshForMount(mount) {
    if (mount && mount.dataset && mount.dataset.rollingFloating === "1") renderFloatingPanel();
    else renderModule();
  }

  function bindEvents(mount, state) {
    const refresh = () => refreshForMount(mount);
    mount.querySelectorAll("[data-roll]").forEach(btn => btn.addEventListener("click", () => { const [mode, days] = String(btn.dataset.roll || "bet:7").split(":"); openRolling(mode, Number(days || 7)); }));
    mount.querySelectorAll("[data-row-op]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, op] = String(btn.dataset.rowOp || "bet:plus").split(":");
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      const current = Math.max(1, Math.min(20, Number(state.rowCounts[mode] || 20)));
      if (op === "plus") {
        state.rowCounts[mode] = Math.min(20, current + 1);
        while (state.modeSlots[mode].length < state.rowCounts[mode]) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      } else state.rowCounts[mode] = Math.max(1, current - 1);
      saveState(state); refresh();
    }));
    mount.querySelectorAll("[data-row-preset]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, raw] = String(btn.dataset.rowPreset || "bet:20").split(":");
      const count = Math.max(1, Math.min(20, Number(raw || 20)));
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      state.rowCounts[mode] = count;
      while (state.modeSlots[mode].length < count) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-quick-template]").forEach(input => input.addEventListener("input", () => {
      const [mode, key] = String(input.dataset.quickTemplate || "bet:stake").split(":");
      ensureQuickTemplates(state);
      state.quickTemplates[mode][key] = input.value;
      saveState(state);
    }));
    mount.querySelectorAll("[data-quick-apply]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.quickApply === "crypto" ? "crypto" : "bet";
      ensureQuickTemplates(state);
      const tpl = state.quickTemplates[mode];
      const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      let applied = 0;
      while (list.length < count) list.push(createSlot(mode, list.length));
      list.slice(0, count).forEach(slot => {
        if (slot.status === "win" || slot.status === "loss") return;
        slot.type = mode;
        if (tpl.stake !== "") slot.stake = tpl.stake;
        if (tpl.odds !== "") slot.odds = tpl.odds;
        if (mode === "crypto") slot.cryptoPnlMode = "amount";
        if (tpl.name && !String(slot.name || "").trim()) slot.name = tpl.name;
        slot.status = "pending";
        recalcSlot(slot);
        applied++;
      });
      saveState(state);
      refresh();
    }));
    const flashComboStakeTarget = (target) => {
      if (!target) return;
      target.classList.remove("v1018-combo-stake-target", "v1019-combo-stake-target", "v1020-combo-stake-target");
      void target.offsetWidth;
      target.classList.add("v1020-combo-stake-target");
      window.clearTimeout(target.__bultenV1020StakeFlashTimer);
      target.__bultenV1020StakeFlashTimer = window.setTimeout(() => {
        target.classList.remove("v1020-combo-stake-target");
      }, 750);
    };
    const captureScrollPositions = () => {
      const points = [{ el: window, x: window.scrollX || 0, y: window.scrollY || 0 }];
      document.querySelectorAll("*").forEach(el => {
        if (el && (el.scrollTop || el.scrollLeft)) points.push({ el, x: el.scrollLeft || 0, y: el.scrollTop || 0 });
      });
      return points;
    };
    const restoreScrollPositions = (points) => {
      (points || []).forEach(point => {
        try {
          if (point.el === window) window.scrollTo(point.x || 0, point.y || 0);
          else {
            point.el.scrollLeft = point.x || 0;
            point.el.scrollTop = point.y || 0;
          }
        } catch {}
      });
    };
    const focusStakeWithoutScroll = (target) => {
      if (!target) return;
      const points = captureScrollPositions();
      try { target.focus({ preventScroll: true }); }
      catch { try { target.focus(); } catch {} }
      restoreScrollPositions(points);
      window.requestAnimationFrame(() => restoreScrollPositions(points));
      window.setTimeout(() => restoreScrollPositions(points), 40);
    };
    const redirectComboStakeInput = (input, event) => {
      if (!input || input.dataset.mode !== "bet" || input.dataset.key !== "stake") return false;
      const slotIndex = Number(input.dataset.slot || 0);
      const list = state.modeSlots.bet || [];
      const group = betCouponGroup(list[slotIndex]);
      if (!group) return false;
      const firstIndex = list.findIndex(row => betCouponGroup(row) === group);
      if (!Number.isFinite(firstIndex) || firstIndex < 0 || firstIndex === slotIndex) return false;
      const target = mount.querySelector(`input[data-mode="bet"][data-slot="${firstIndex}"][data-key="stake"]`);
      if (!target) return false;
      if (event) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
      window.requestAnimationFrame(() => {
        focusStakeWithoutScroll(target);
        flashComboStakeTarget(target);
      });
      return true;
    };
    mount.querySelectorAll("input[data-mode]").forEach(input => {
      const saveInput = () => {
        const mode = input.dataset.mode, i = Number(input.dataset.slot), key = input.dataset.key;
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        if (!list[i]) list[i] = createSlot(mode, i);
        list[i][key] = input.value;
        list[i].type = mode;
        if (mode === "bet") {
          if (!betCouponGroup(list[i])) list[i].betKind = "single";
          normalizeBetCouponGroups(list);
        }
        if (slotHasUserEntry(list[i], mode)) {
          if (list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
        }
        if (mode === "crypto" && key === "odds") list[i].cryptoPnlMode = "amount";
        recalcSlot(list[i]);
        saveState(state);
      };
      if (input.dataset.mode === "bet" && input.dataset.key === "stake") {
        input.addEventListener("pointerdown", event => redirectComboStakeInput(input, event), true);
        input.addEventListener("focus", event => redirectComboStakeInput(input, event), true);
      }
      input.addEventListener("input", saveInput);
      input.addEventListener("change", saveInput);
    });
    const removeLegacyBetGroupPortals = () => {
      [
        "v1019-bet-group-portal","v1018-bet-group-portal","v1017-bet-group-portal","v1016-bet-group-portal","v1015-bet-group-portal",
        "v1014-bet-group-portal","v1013-bet-group-portal","v1012-bet-group-portal","v1011-bet-group-portal","v1010-bet-group-portal",
        "v1009-bet-group-portal","v1008-bet-group-portal","v1007-bet-group-portal"
      ].forEach(id => document.getElementById(id)?.remove());
      ["v1019-bet-group-layer","v1018-bet-group-layer","v1017-bet-group-layer"].forEach(id => document.getElementById(id)?.remove());
    };
    const closeBetGroupMenu = () => {
      removeLegacyBetGroupPortals();
      window.__bultenV1020BetGroupActiveSlot = null;
      document.querySelectorAll("[data-bet-group-menu].is-open").forEach(menu => {
        menu.classList.remove("is-open");
        menu.closest("tr")?.classList.remove("v995-group-row-open");
      });
    };
    const applyBetGroupChoice = (slotRaw, groupRaw) => {
      const slotIndex = Number(slotRaw || 0);
      if (!Number.isFinite(slotIndex) || slotIndex < 0) return;
      const group = betCouponGroup({ couponGroup: groupRaw || "" });
      if (!state.modeSlots.bet[slotIndex]) state.modeSlots.bet[slotIndex] = createSlot("bet", slotIndex);
      const slot = state.modeSlots.bet[slotIndex];
      slot.type = "bet";
      slot.id = slotIndex + 1;
      slot.couponGroup = group;
      slot.betKind = group ? "combo" : "single";
      if (!group) slot.comboResults = [];
      normalizeBetCouponGroups(state.modeSlots.bet);
      saveState(state);
      closeBetGroupMenu();
      refresh();
    };
    const toggleBetGroupMenu = (btn) => {
      if (!btn) return;
      const menu = btn.closest("[data-bet-group-menu]");
      if (!menu) return;
      const slotIndex = Number(btn.dataset.betGroupToggle || menu.dataset.betGroupMenu || 0);
      const wasOpen = menu.classList.contains("is-open") && Number(window.__bultenV1020BetGroupActiveSlot) === slotIndex;
      closeBetGroupMenu();
      if (wasOpen) return;
      window.__bultenV1020BetGroupActiveSlot = slotIndex;
      menu.classList.add("is-open");
      menu.closest("tr")?.classList.add("v995-group-row-open");
    };
    window.__bultenV1020CloseBetGroupMenu = closeBetGroupMenu;
    window.__bultenV1020BetGroupApply = applyBetGroupChoice;
    window.__bultenV1020ToggleBetGroupMenu = toggleBetGroupMenu;
    if (!window.__bultenV1020BetGroupPointerHandler) {
      window.__bultenV1020BetGroupPointerHandler = true;
      document.addEventListener("pointerdown", event => {
        const choice = event.target?.closest?.("[data-bet-group-choice]");
        if (choice) {
          event.preventDefault();
          event.stopPropagation();
          const [slotRaw, groupRaw] = String(choice.dataset.betGroupChoice || "0:").split(":");
          window.__bultenV1020BetGroupApply?.(slotRaw, groupRaw || "");
          return;
        }
        const toggle = event.target?.closest?.("[data-bet-group-toggle]");
        if (toggle) {
          event.preventDefault();
          event.stopPropagation();
          window.__bultenV1020ToggleBetGroupMenu?.(toggle);
          return;
        }
        if (event.target?.closest?.("[data-bet-group-menu]")) return;
        window.__bultenV1020CloseBetGroupMenu?.();
      }, true);
      window.addEventListener("resize", () => window.__bultenV1020CloseBetGroupMenu?.(), true);
    }
    const syncV1016TargetRail = () => {
      const rails = document.querySelectorAll(".rolling-v48-rail, .v49-rolling-rail");
      rails.forEach(rail => {
        const card = rail.querySelector(":scope > .v984-target-card, :scope > .v985-target-card, :scope > .v796-target-card");
        if (!card) return;

        /*
          V1024: Kasa Hedefi'nde fixed/sticky JS sistemi tamamen kapatıldı.
          V1022 fixed overlay, V1023 sticky + internal scroll davranışı;
          kartın altını kesiyor, mouse üstündeyken ana sayfa scroll'unu kilitliyor
          ve refresh/scroll sırasında performans hissini düşürüyordu.
          Kart artık sol rail içinde normal akışta kalır; CSS de position/overflow
          değerlerini statik ve sade tutar.
        */
        rail.style.removeProperty("--v1016-target-placeholder-height");
        rail.style.removeProperty("--v1016-target-left");
        rail.style.removeProperty("--v1016-target-width");
        rail.style.removeProperty("--v1016-target-top");
        rail.style.minHeight = "";
        delete rail.dataset.v1016NaturalTop;
        delete rail.dataset.v1016TargetHeight;
        delete rail.dataset.v1022TargetHeight;
        card.classList.remove("v1016-target-fixed", "v1023-target-sticky-card");
      });
    };
    window.__bultenV1016SyncTargetRail = syncV1016TargetRail;
    requestAnimationFrame(syncV1016TargetRail);
    setTimeout(syncV1016TargetRail, 60);
    setTimeout(syncV1016TargetRail, 180);
    if (!window.__bultenV1016TargetRailHandlers) {
      window.__bultenV1016TargetRailHandlers = true;
      const syncRail = () => window.__bultenV1016SyncTargetRail?.();
      window.addEventListener("resize", syncRail, true);
      window.addEventListener("orientationchange", syncRail, true);
    }

    mount.querySelectorAll("details.rolling-v49-fold").forEach(details => {
      details.open = true;
      const summary = details.querySelector(":scope > summary");
      if (summary && !summary.dataset.v1015StaticFold) {
        summary.dataset.v1015StaticFold = "1";
        summary.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          details.open = true;
        });
      }
      if (!details.dataset.v1015StaticFold) {
        details.dataset.v1015StaticFold = "1";
        details.addEventListener("toggle", () => {
          if (!details.open) details.open = true;
        });
      }
    });
    mount.querySelectorAll("[data-clear-row]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, slotRaw] = String(btn.dataset.clearRow || "bet:0").split(":");
      const i = Number(slotRaw || 0);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      list[i] = createSlot(mode, i);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-main-table-photo]").forEach(btn => btn.addEventListener("click", () => {
      openTablePhoto(btn.dataset.mainTablePhoto === "crypto" ? "crypto" : "bet", state);
    }));
    mount.querySelectorAll("[data-crypto-detail]").forEach(input => {
      const saveCryptoDetail = () => {
        const [slotRaw, key] = String(input.dataset.cryptoDetail || "0:entryPrice").split(":");
        const i = Number(slotRaw || 0);
        if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
        state.modeSlots.crypto[i][key] = input.value;
        state.modeSlots.crypto[i].status = state.modeSlots.crypto[i].status === "win" || state.modeSlots.crypto[i].status === "loss" ? state.modeSlots.crypto[i].status : "pending";
        if (key === "stake" || key === "odds") recalcSlot(state.modeSlots.crypto[i]);
        saveState(state);
      };
      input.addEventListener("input", saveCryptoDetail);
      input.addEventListener("change", () => { saveCryptoDetail(); refresh(); });
      input.addEventListener("blur", () => { saveCryptoDetail(); refresh(); });
    });
    mount.querySelectorAll("[data-crypto-tp]").forEach(input => {
      const saveTp = () => {
        const [slotRaw, tpRaw, key] = String(input.dataset.cryptoTp || "0:0:price").split(":");
        const i = Number(slotRaw || 0);
        const ti = Number(tpRaw || 0);
        if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
        const slot = state.modeSlots.crypto[i];
        if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
        while (slot.takeProfits.length <= ti) slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
        slot.takeProfits[ti][key] = input.value;
        if (!slot.takeProfits[ti].note) slot.takeProfits[ti].note = `TP${ti + 1}`;
        slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
        recalcSlot(slot);
        saveState(state);
      };
      input.addEventListener("input", saveTp);
      input.addEventListener("change", saveTp);
      input.addEventListener("blur", saveTp);
    });
    mount.querySelectorAll("[data-crypto-tp-op]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, tpRaw, op] = String(btn.dataset.cryptoTpOp || "0:0:plus").split(":");
      const i = Number(slotRaw || 0);
      if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
      const slot = state.modeSlots.crypto[i];
      if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
      if (op === "plus") slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
      else slot.takeProfits.pop();
      if (!slot.takeProfits.length) slot.takeProfits.push({ price: "", profitAmount: "", note: "TP1", result: "" });
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-crypto-tp-result]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, tpRaw, resultRaw] = String(btn.dataset.cryptoTpResult || "0:0:tp").split(":");
      const i = Number(slotRaw || 0);
      const ti = Number(tpRaw || 0);
      const result = resultRaw === "stop" ? "stop" : "tp";
      if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
      const slot = state.modeSlots.crypto[i];
      if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
      while (slot.takeProfits.length <= ti) slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
      slot.takeProfits[ti].result = slot.takeProfits[ti].result === result ? "" : result;
      slot.takeProfits[ti].done = slot.takeProfits[ti].result === "tp";
      slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
      recalcSlot(slot);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-crypto-close]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.cryptoClose || 0);
      const slot = state.modeSlots.crypto[i];
      if (!slot) return;
      slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
      recalcSlot(slot);
      saveState(state);
      CONFIRM_DIALOG = {
        type: "settle",
        mode: "crypto",
        slot: i,
        status: Number(slot.odds || 0) >= 0 ? "win" : "loss",
        keepActivePanel: "crypto",
        tone: Number(slot.odds || 0) >= 0 ? "success" : "danger",
        title: "Kripto işlemi kapatılsın mı?",
        message: `${cleanText(slot.name) || "Kripto işlem"} geçmişe alınacak.`,
        detail: "Hatalıysa Geçmişten aktife geri alabilirsin.",
        confirmText: "İşlem kapandı"
      };
      refresh();
    }));


    mount.querySelectorAll("[data-rolling-quick]").forEach(input => {
      input.addEventListener("input", () => {
        const mode = input.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
        const quick = getModeQuickPlan(state, mode);
        const key = input.dataset.rollingQuick;
        quick[key] = input.value === "" ? "" : Number(input.value || 0);
        saveState(state);
      });
      input.addEventListener("change", () => refresh());
    });
    mount.querySelectorAll("[data-target-complete]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
      const modeSum = slotSummary(state.modeSlots[mode]);
      const rollSum = rollingSummary(mode);
      const modePnl = Number(modeSum.pnl || 0) + Number(rollSum.pnlTotal || 0);
      const result = addTargetLogRecord(state, modePnl, mode);
      if (!result.ok) { alert(result.message); return; }
      const targetItems = loadTargetItems();
      targetItems[mode] = [];
      saveTargetItems(targetItems);
      const closedPnl = loadTargetClosedPnl();
      closedPnl[mode] = 0;
      saveTargetClosedPnl(closedPnl);
      saveState(state);
      refresh();
    }));
    const removeLastTargetTp = mode => {
      const m = mode === "crypto" ? "crypto" : "bet";
      const list = mount.querySelector(`[data-target-tp-list="${m}"]`);
      if (!list) return;
      const rows = Array.from(list.querySelectorAll("[data-target-self-tp]"));
      const last = rows[rows.length - 1];
      if (!last) return;
      if (rows.length <= 1) {
        last.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      last.remove();
    };
    const bindTargetBetLegRemove = btn => btn.addEventListener("click", () => {
      const row = btn.closest("[data-target-bet-leg]");
      const list = row?.parentElement;
      if (!row || !list) return;
      if (list.querySelectorAll("[data-target-bet-leg]").length <= 1) {
        row.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      row.remove();
    });
    const handleCryptoEntryRemove = btn => {
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.parentElement;
      if (!entry || !list) return;
      if (list.querySelectorAll('[data-target-crypto-entry="1"]').length <= 1) {
        entry.querySelectorAll('input').forEach(input => { input.value = ''; });
        entry.querySelectorAll('[data-target-self-tp="crypto"]').forEach((row, idx) => {
          if (idx === 0) row.querySelectorAll('input').forEach(input => { input.value = ''; });
          else row.remove();
        });
        return;
      }
      entry.remove();
    };
    mount.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const remove = target.closest('[data-target-crypto-entry-remove]');
      if (!remove || !mount.contains(remove)) return;
      event.preventDefault();
      event.stopPropagation();
      handleCryptoEntryRemove(remove);
    }, true);
    mount.querySelectorAll("[data-target-bet-leg-remove]").forEach(bindTargetBetLegRemove);
    mount.querySelectorAll('[data-target-crypto-entry-add],[data-target-crypto-entry-remove],[data-target-tp-add],[data-target-tp-remove-last],[data-target-bet-leg-add],[data-target-bet-leg-remove]').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (form) form.dataset.skipAutosaveOnce = '1';
      });
    });
    mount.querySelectorAll("[data-target-tp-remove-last]").forEach(btn => btn.addEventListener("click", () => {
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.querySelector('[data-target-tp-list="crypto"]');
      if (!list) return removeLastTargetTp(btn.dataset.targetTpRemoveLast);
      const rows = Array.from(list.querySelectorAll("[data-target-self-tp]"));
      const last = rows[rows.length - 1];
      if (!last) return;
      if (rows.length <= 1) {
        last.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      last.remove();
    }));
    mount.querySelectorAll("[data-target-tp-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetTpAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto") return;
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.querySelector('[data-target-tp-list="crypto"]') || mount.querySelector(`[data-target-tp-list="${mode}"]`);
      if (!list) return;
      if (list.querySelectorAll("[data-target-self-tp]").length >= 6) return;
      list.insertAdjacentHTML("beforeend", v811CryptoTpRow());
    }));
    mount.querySelectorAll("[data-target-crypto-entry-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetCryptoEntryAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto") return;
      const list = btn.closest('[data-target-crypto-autosave="1"]')?.querySelector("[data-target-crypto-entry-list]");
      if (!list) return;
      const count = list.querySelectorAll('[data-target-crypto-entry="1"]').length;
      if (count >= 8) return;
      list.insertAdjacentHTML("beforeend", v824CryptoEntryRow(count));
    }));
    mount.querySelectorAll("[data-target-bet-leg-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetBetLegAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "bet") return;
      const list = mount.querySelector(`[data-target-bet-leg-list="${mode}"]`);
      if (!list) return;
      if (list.querySelectorAll("[data-target-bet-leg]").length >= 8) return;
      list.insertAdjacentHTML("beforeend", v812BetLegRow());
      const last = list.lastElementChild;
      const removeBtn = last?.querySelector("[data-target-bet-leg-remove]");
      if (removeBtn) bindTargetBetLegRemove(removeBtn);
    }));
    const saveTargetSelfFromForm = modeRaw => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const pick = key => mount.querySelector(`[data-target-self-field="${mode}:${key}"]`);
      const name = cleanText(pick("name")?.value || "");
      const stake = v810NumberOrBlank(pick("stake")?.value || "");
      const store = loadTargetItems();
      store[mode] = Array.isArray(store[mode]) ? store[mode] : [];
      if (mode === "crypto") {
        const entries = Array.from(mount.querySelectorAll('[data-target-crypto-entry="1"]'));
        let added = false;
        entries.forEach(entryBox => {
          const entryPick = key => entryBox.querySelector(`[data-target-self-field="crypto:${key}"]`);
          const rowName = cleanText(entryPick("name")?.value || "");
          const rowStake = v810NumberOrBlank(entryPick("stake")?.value || "");
          const rowEntry = cleanText(entryPick("entry")?.value || "");
          const tps = Array.from(entryBox.querySelectorAll('[data-target-self-tp="crypto"]')).map(row => ({
            target: cleanText(row.querySelector('[data-target-self-tp-field="target"]')?.value || ""),
            profit: v810NumberOrBlank(row.querySelector('[data-target-self-tp-field="profit"]')?.value || "")
          })).filter(tp => tp.target || tp.profit !== "");
          const stop = cleanText(entryPick("stop")?.value || "");
          const stopLoss = v810NumberOrBlank(entryPick("stopLoss")?.value || "");
          const profit = tps.reduce((sum, tp) => tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
          if (!rowName && rowStake === "" && !rowEntry && !tps.length && !stop && stopLoss === "") return;
          store[mode].push({ id: v810TargetItemId(), ts: Date.now(), mode, kind: "crypto", name: rowName, stake: rowStake, entry: rowEntry, entryPrice: rowEntry, stop, stopLoss, tps, profit, result: "" });
          added = true;
        });
        if (!added) return false;
      } else {
        const legs = Array.from(mount.querySelectorAll(`[data-target-bet-leg="${mode}"]`)).map(row => ({
          name: cleanText(row.querySelector('[data-target-bet-leg-field="name"]')?.value || ""),
          odds: v810NumberOrBlank(row.querySelector('[data-target-bet-leg-field="odds"]')?.value || "")
        })).filter(leg => leg.name || leg.odds !== "");
        if (!legs.length && stake === "") return false;
        const cleanLegs = legs.length ? legs : [{ name: "", odds: "" }];
        store[mode].push({ id: v810TargetItemId(), ts: Date.now(), mode, kind: cleanLegs.length > 1 ? "combo" : "match", legs: cleanLegs, name: cleanLegs[0]?.name || "", odds: cleanLegs[0]?.odds || "", stake, result: "" });
      }
      saveTargetItems(store);
      return true;
    };
    mount.querySelectorAll("[data-target-self-add]").forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (form) form.dataset.skipAutosaveOnce = '1';
      });
      btn.addEventListener("click", () => {
        const mode = btn.dataset.targetSelfAdd === "crypto" ? "crypto" : "bet";
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (saveTargetSelfFromForm(mode)) refresh();
        if (form) delete form.dataset.skipAutosaveOnce;
      });
    });
    mount.querySelectorAll('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]').forEach(form => {
      const autosaveMode = form.matches('[data-target-crypto-autosave="1"]') ? "crypto" : "bet";
      form.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const saved = saveTargetSelfFromForm(autosaveMode);
        if (saved) refresh();
      });
      if (autosaveMode === "bet") {
        form.addEventListener('focusout', event => {
          window.setTimeout(() => {
            if (!mount.isConnected || !form.isConnected) return;
            if (form.dataset.skipAutosaveOnce === '1') {
              delete form.dataset.skipAutosaveOnce;
              return;
            }
            const active = document.activeElement;
            if (active && form.contains(active)) return;
            const related = event.relatedTarget;
            if (related instanceof Node && form.contains(related)) return;
            const saved = saveTargetSelfFromForm(autosaveMode);
            if (saved) refresh();
          }, 0);
        });
      }
    });
    const removeTargetItemAfterResult = (modeRaw, id, rowSnapshot) => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const latest = loadTargetItems();
      latest[mode] = Array.isArray(latest[mode]) ? latest[mode] : [];
      const row = rowSnapshot || latest[mode].find(item => String(item.id || "") === String(id));
      if (row) addTargetClosedPnl(mode, Number(v810TargetItemProfit(row, mode).value || 0));
      latest[mode] = latest[mode].filter(item => String(item.id || "") !== String(id));
      saveTargetItems(latest);
      refresh();
    };
    const askTargetCleanup = (modeRaw, id, rowSnapshot, tone = "success") => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const label = mode === "crypto" ? "işlemi" : "bahisi";
      openTargetResultConfirm({
        title: "Detay temizlensin mi?",
        message: `Sonuç işlendi. Bu ${label} detaydan kaldırılsın mı?`,
        okText: "Evet, temizle",
        cancelText: "Hayır, kalsın",
        tone
      }, () => removeTargetItemAfterResult(mode, id, rowSnapshot));
    };
    mount.querySelectorAll("[data-target-self-tp-done]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, indexRaw] = String(btn.dataset.targetSelfTpDone || "crypto::0").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto" || !id) return;
      const index = Math.max(0, Number(indexRaw || 0));
      const store = loadTargetItems();
      store.crypto = Array.isArray(store.crypto) ? store.crypto : [];
      const row = store.crypto.find(item => String(item.id || "") === String(id));
      if (!row) return;
      row.tps = Array.isArray(row.tps) ? row.tps : [];
      if (!row.tps[index]) return;
      const nextDone = !row.tps[index].done;
      const allDoneAfter = row.tps.length > 0 && row.tps.every((tp, idx) => idx === index ? nextDone : !!tp.done);
      const apply = () => {
        row.tps[index].done = nextDone;
        if (row.tps[index].done && row.result === "stop") row.result = "";
        const allDone = row.tps.length > 0 && row.tps.every(tp => !!tp.done);
        row.result = allDone ? "tp" : (row.result === "tp" ? "" : row.result || "");
        saveTargetItems(store);
        refresh();
        if (nextDone && allDone) askTargetCleanup("crypto", id, row, "success");
      };
      if (!nextDone) { apply(); return; }
      const label = cleanText(row.tps[index].target || '') || `TP ${index + 1}`;
      const profit = v810NumberOrBlank(row.tps[index].profit) !== "" ? ` · ${signedMoney(Number(row.tps[index].profit || 0))}` : "";
      openTargetResultConfirm({
        title: "TP kazancı onayı",
        message: `"${label}" hedefini kazanç olarak işlemek istiyor musun?${profit}`,
        okText: "Kazanç yaz",
        tone: "success"
      }, apply);
    }));
    mount.querySelectorAll("[data-target-bet-leg-result]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, indexRaw, resultRaw] = String(btn.dataset.targetBetLegResult || "bet:::").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (mode !== "bet" || !id) return;
      const index = Math.max(0, Number(indexRaw || 0));
      const result = resultRaw === "loss" ? "loss" : "win";
      const store = loadTargetItems();
      store.bet = Array.isArray(store.bet) ? store.bet : [];
      const row = store.bet.find(item => String(item.id || "") === String(id));
      if (!row) return;
      row.legs = Array.isArray(row.legs) ? row.legs : [];
      if (!row.legs[index]) return;
      const previous = cleanText(row.legs[index].result || "");
      const next = previous === result ? "" : result;
      const apply = () => {
        row.legs[index].result = next;
        row.result = "";
        const legs = v812BetLegs(row);
        const filled = legs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
        const anyLoss = filled.some(leg => cleanText(leg.result || "") === "loss");
        const allWin = filled.length > 0 && filled.every(leg => cleanText(leg.result || "") === "win");
        if (anyLoss) row.result = "loss";
        else if (allWin) row.result = "win";
        saveTargetItems(store);
        refresh();
        if (row.result) askTargetCleanup("bet", id, row, row.result === "loss" ? "danger" : "success");
      };
      if (!next) { apply(); return; }

      const currentLegs = v812BetLegs(row);
      const isComboTicket = currentLegs.length > 1;
      const currentFilled = currentLegs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
      const currentAnyLoss = currentFilled.some(leg => cleanText(leg.result || "") === "loss");
      const currentAllWin = currentFilled.length > 0 && currentFilled.every(leg => cleanText(leg.result || "") === "win");
      const currentFinalResult = currentAnyLoss ? "loss" : (currentAllWin ? "win" : "");
      const tmpLegs = row.legs.map((leg, idx) => idx === index ? { ...leg, result: next } : { ...leg });
      const filled = tmpLegs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
      const anyLoss = filled.some(leg => cleanText(leg.result || "") === "loss");
      const allWin = filled.length > 0 && filled.every(leg => cleanText(leg.result || "") === "win");
      const finalResult = anyLoss ? "loss" : (allWin ? "win" : "");

      if (isComboTicket) {
        const shouldConfirmComboLoss = result === "loss" && finalResult === "loss" && currentFinalResult !== "loss";
        const shouldConfirmComboWin = result === "win" && finalResult === "win" && currentFinalResult !== "win";
        if (!shouldConfirmComboLoss && !shouldConfirmComboWin) {
          apply();
          return;
        }
        openTargetResultConfirm({
          title: shouldConfirmComboLoss ? "Kombine kaybetti onayı" : "Kombine kazandı onayı",
          message: shouldConfirmComboLoss
            ? "Bu kırmızı seçimle kombine kupon kaybedecek. Onaylıyor musun?"
            : "Tüm maçlar yeşil oldu. Kombine kuponu kazandı olarak işaretlemek istiyor musun?",
          okText: "Onayla",
          tone: shouldConfirmComboLoss ? "danger" : "success"
        }, apply);
        return;
      }

      const label = result === "win" ? "Kazandı" : "Kaybetti";
      const title = result === "win" ? "Maç kazandı onayı" : "Maç kaybetti onayı";
      const msg = finalResult
        ? `Bu bahisi "${label}" olarak onaylıyor musun?`
        : `Bu maçı "${label}" olarak işlemek istiyor musun?`;
      openTargetResultConfirm({
        title,
        message: msg,
        okText: "Onayla",
        tone: result === "loss" ? "danger" : "success"
      }, apply);
    }));
    mount.querySelectorAll("[data-target-self-result]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, resultRaw] = String(btn.dataset.targetSelfResult || "bet::").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      const store = loadTargetItems();
      store[mode] = Array.isArray(store[mode]) ? store[mode] : [];
      const row = store[mode].find(item => String(item.id || "") === String(id));
      if (!row) return;
      const result = mode === "crypto" ? (resultRaw === "stop" ? "stop" : "tp") : (resultRaw === "loss" ? "loss" : "win");
      const apply = () => {
        row.result = row.result === result ? "" : result;
        if (mode === "crypto" && row.result === "stop" && Array.isArray(row.tps)) row.tps = row.tps.map(tp => ({ ...tp, done: false }));
        if (mode === "crypto" && row.result === "tp" && Array.isArray(row.tps)) row.tps = row.tps.map(tp => ({ ...tp, done: true }));
        saveTargetItems(store);
        refresh();
        if (mode === "crypto" && row.result === "stop") askTargetCleanup("crypto", id, row, "danger");
        if (mode === "crypto" && row.result === "tp") askTargetCleanup("crypto", id, row, "success");
        if (mode === "bet" && row.result) askTargetCleanup("bet", id, row, row.result === "loss" ? "danger" : "success");
      };
      const willActivate = row.result !== result;
      if (!willActivate) { apply(); return; }
      let message = 'Sonucu onaylıyor musun?';
      let title = 'Sonuç onayı';
      let tone = result === 'loss' || result === 'stop' ? 'danger' : 'success';
      if (mode === 'bet') {
        const combo = v812BetLegs(row).length > 1;
        title = result === 'loss' ? 'Bahis kaybetti onayı' : 'Bahis kazandı onayı';
        message = combo
          ? `Bu kombine kuponu "${result === 'loss' ? 'Kaybetti' : 'Kazandı'}" olarak işaretlemek istiyor musun?`
          : `Bu bahisi "${result === 'loss' ? 'Kaybetti' : 'Kazandı'}" olarak işaretlemek istiyor musun?`;
      } else {
        title = result === 'stop' ? 'Zarar onayı' : 'Kazanç onayı';
        message = result === 'stop' ? 'Bu işlemi zarar olarak işlemek istiyor musun?' : 'Bu işlemi kazanç olarak işlemek istiyor musun?';
      }
      openTargetResultConfirm({ title, message, okText: 'Onayla', tone }, apply);
    }));
    mount.querySelectorAll("[data-target-self-photo]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id] = String(btn.dataset.targetSelfPhoto || "bet:").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      openTargetItemPhoto(mode, id);
    }));
    mount.querySelectorAll("[data-target-self-delete]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id] = String(btn.dataset.targetSelfDelete || "bet:").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      const store = loadTargetItems();
      store[mode] = (store[mode] || []).filter(item => String(item.id || "") !== String(id));
      saveTargetItems(store);
      refresh();
    }));
    mount.querySelectorAll("[data-target-reset]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
      const plan = getPlanNumbers(state, 0, mode);
      const quick = getModeQuickPlan(state, mode);
      quick.start = Number(plan.current.toFixed(2));
      quick.target = "";
      quick.currentOverride = "";
      const targetItems = loadTargetItems();
      targetItems[mode] = [];
      saveTargetItems(targetItems);
      const closedPnl = loadTargetClosedPnl();
      closedPnl[mode] = 0;
      saveTargetClosedPnl(closedPnl);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-target-card]").forEach(card => {
      card.addEventListener("toggle", () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        setTargetCardOpen(card.dataset.targetCard === "crypto" ? "crypto" : "bet", card.open);
        requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" }));
      });
    });
    mount.querySelectorAll("[data-target-log-toggle]").forEach(btn => btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const mode = btn.dataset.targetLogToggle === "crypto" ? "crypto" : "bet";
      const wrap = btn.closest(".v802-target-log-wrap");
      const next = !(wrap && wrap.classList.contains("open"));
      mount.querySelectorAll(".v802-target-log-wrap.open").forEach(item => {
        if (item !== wrap) item.classList.remove("open");
      });
      setTargetLogOpen(mode, next);
      if (wrap) wrap.classList.toggle("open", next);
      const keep = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
      requestAnimationFrame(keep);
      setTimeout(keep, 0);
      setTimeout(keep, 80);
    }));
    mount.addEventListener("click", (event) => {
      if (event.target && event.target.closest && event.target.closest(".v802-target-log-wrap")) return;
      let changed = false;
      mount.querySelectorAll(".v802-target-log-wrap.open").forEach(wrap => {
        wrap.classList.remove("open");
        changed = true;
      });
      if (changed) {
        setTargetLogOpen("bet", false);
        setTargetLogOpen("crypto", false);
      }
    });
    if (!window.__omegaV803TargetLogOutsideBound) {
      window.__omegaV803TargetLogOutsideBound = true;
      document.addEventListener("click", (event) => {
        if (event.target && event.target.closest && event.target.closest(".v802-target-log-wrap")) return;
        const mainMount = qs("omega-rolling-render");
        if (!mainMount) return;
        let changed = false;
        mainMount.querySelectorAll(".v802-target-log-wrap.open").forEach(wrap => {
          wrap.classList.remove("open");
          changed = true;
        });
        if (changed) {
          setTargetLogOpen("bet", false);
          setTargetLogOpen("crypto", false);
        }
      });
    }
    mount.querySelectorAll("[data-target-history-open]").forEach(btn => btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      TARGET_HISTORY_OPEN_MODE = btn.dataset.targetHistoryOpen === "crypto" ? "crypto" : "bet";
      HISTORY_OPEN_MODE = null;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_FILTER = "all";
      renderFloatingPanel();
    }));
    mount.querySelectorAll("[data-target-history-close]").forEach(btn => btn.addEventListener("click", () => {
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-target-history-overlay]").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-open]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = btn.dataset.historyOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      refresh();
    }));
    mount.querySelectorAll("[data-history-close]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-log-center]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = btn.dataset.logCenter === "crypto" ? "crypto" : "bet";
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      refresh();
    }));
    mount.querySelectorAll("[data-pending-open]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = btn.dataset.pendingOpen === "crypto" ? "crypto" : "bet";
      CONFIRM_RETURN_PANEL_MODE = PENDING_BOARD_OPEN_MODE;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-report-open]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = btn.dataset.reportOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-report-center-close]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-pending-close]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      ACTIVE_COMBO_DETAIL_SLOT = null;
      refresh();
    }));
    mount.querySelectorAll(".v758-pending-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      PENDING_BOARD_OPEN_MODE = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      ACTIVE_COMBO_DETAIL_SLOT = null;
      refresh();
    }));
    mount.querySelectorAll("[data-log-center-close]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll(".v757-log-center-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-delete]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, id] = String(btn.dataset.historyDelete || "bet:").split(":");
      if (!id) return;
      CONFIRM_DIALOG = {
        type: "deleteHistory",
        mode: mode === "crypto" ? "crypto" : "bet",
        id,
        tone: "danger",
        title: "LOG kaydı silinsin mi?",
        message: "Bu işlem geçmişini tamamen silmek istediğinden emin misin?",
        detail: "Bu sadece LOG geçmişi kaydını siler; aktif kutudaki yazıları ayrıca istersen temizleyebilirsin.",
        confirmText: "Kalıcı olarak sil"
      };
      refresh();
    }));
    mount.querySelectorAll("[data-history-restore]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, id] = String(btn.dataset.historyRestore || "crypto:").split(":");
      if (!id) return;
      CONFIRM_DIALOG = {
        type: "restoreHistory",
        mode: mode === "crypto" ? "crypto" : "bet",
        id,
        keepActivePanel: mode === "crypto" ? "crypto" : "bet",
        tone: "success",
        title: "Kayıt tekrar aktife alınsın mı?",
        message: "Bu geçmiş kaydı aktif ekrana geri alınacak ve geçmişten kaldırılacak.",
        detail: "Hatalı kapanan işlemler için kullan.",
        confirmText: "Aktife geri al"
      };
      refresh();
    }));
    mount.querySelectorAll("[data-confirm-no]").forEach(btn => btn.addEventListener("click", () => {
      const keepPanel = CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_DIALOG = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) restoreActivePanelAfterConfirm(keepPanel);
      refresh();
    }));
    mount.querySelectorAll(".v757-confirm-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      const keepPanel = CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_DIALOG = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) restoreActivePanelAfterConfirm(keepPanel);
      refresh();
    }));
    mount.querySelectorAll("[data-confirm-yes]").forEach(btn => btn.addEventListener("click", () => {
      const action = CONFIRM_DIALOG;
      CONFIRM_DIALOG = null;
      if (!action) return refresh();
      if (action.type === "settle") {
        const fresh = loadState();
        const settleSlotIndex = Number(action.slot || 0);
        if (action.mode === "bet") {
          const coupon = getBetCouponForSlot(fresh, settleSlotIndex);
          const slot = fresh?.modeSlots?.bet?.[settleSlotIndex];
          if (coupon && Array.isArray(coupon.matches) && coupon.matches.length > 1) {
            const matchIndex = getBetCouponMatchIndex(coupon, settleSlotIndex);
            applyComboMatchStatus(fresh, settleSlotIndex, matchIndex, action.status === "loss" ? "loss" : action.status === "pending" ? "pending" : "win");
            saveState(fresh);
          } else if (betKind(slot) === "combo") {
            saveState(fresh);
          } else {
            applySlotResult(fresh, action.mode, settleSlotIndex, action.status);
            saveState(fresh);
          }
        } else {
          applySlotResult(fresh, action.mode, settleSlotIndex, action.status);
          saveState(fresh);
        }
      } else if (action.type === "settleCoupon") {
        const fresh = loadState();
        const coupon = getBetCouponGroups(fresh).coupons.find(c => c.id === Number(action.couponId || 1) || Number(c.slotIndex) === Number(action.couponSlot ?? -1));
        if (coupon) {
          addCouponHistoryRecord(fresh, coupon, action.status === "loss" ? "loss" : "win");
          saveState(fresh);
        }
      } else if (action.type === "comboMatch") {
        const fresh = loadState();
        const requestedIndex = Number(action.slot || 0);
        const beforeCoupon = getBetCouponForSlot(fresh, requestedIndex);
        const baseIndex = Number(beforeCoupon?.slotIndex ?? requestedIndex);
        ACTIVE_COMBO_DETAIL_SLOT = baseIndex;
        if (applyComboMatchStatus(fresh, requestedIndex, Number(action.match || 0), action.status === "loss" ? "loss" : action.status === "pending" ? "pending" : "win")) {
          saveState(fresh);
        }
      } else if (action.type === "deleteHistory") {
        deleteHistoryRecord(action.mode, action.id);
      } else if (action.type === "restoreHistory") {
        restoreHistoryRecord(action.mode, action.id);
      }
      const keepPanel = action.keepActivePanel || CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) {
        restoreActivePanelAfterConfirm(keepPanel);
        return;
      }
      refresh();
    }));
    mount.querySelectorAll(".v512-history-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-filter]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_FILTER = btn.dataset.historyFilter || "today";
      refresh();
    }));
    mount.querySelectorAll("[data-target-history-delete]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const id = btn.dataset.targetHistoryDelete || "";
      if (!id) return;
      saveTargetLog(loadTargetLog().filter(r => String(r.id || "") !== String(id)));
      refresh();
    }));
    mount.querySelectorAll("[data-combo-match-status]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, matchRaw, statusRaw] = String(btn.dataset.comboMatchStatus || "0:0:win").split(":");
      const i = Number(slotRaw || 0);
      const mi = Number(matchRaw || 0);
      const status = statusRaw === "loss" ? "loss" : "win";
      const list = state.modeSlots.bet;
      if (!list[i]) return;
      const groupedCoupon = getBetCouponForSlot(state, i);
      const matches = groupedCoupon ? groupedCoupon.matches : getSlotMatches(list[i]);
      const currentStatus = matches[mi]?.status || "";
      const nextStatus = currentStatus === status ? "pending" : status;
      ACTIVE_COMBO_DETAIL_SLOT = i;
      const matchName = matches[mi]?.name || `Maç ${mi + 1}`;
      const keepPanel = btn.closest(".v758-pending-modal") ? (PENDING_BOARD_OPEN_MODE || "bet") : (PENDING_BOARD_OPEN_MODE || null);
      if (keepPanel) CONFIRM_RETURN_PANEL_MODE = keepPanel;
      CONFIRM_DIALOG = {
        type: "comboMatch",
        slot: i,
        match: mi,
        status: nextStatus,
        keepActivePanel: keepPanel,
        tone: nextStatus === "loss" ? "danger" : "success",
        title: nextStatus === "pending" ? "Maçı bekliyor durumuna al" : "Kombine maç sonucunu onayla",
        message: nextStatus === "pending"
          ? `${matchName} tekrar BEKLİYOR durumuna alınacak.`
          : `${matchName} için ${nextStatus === "loss" ? "KAYBETTİ" : "KAZANDI"} sonucu kaydedilecek.`,
        detail: nextStatus === "pending" ? "Yanlış işaretleme yaptıysan bu maç aktif kupon içinde yeniden bekliyor olur." : "Kombine tüm maçlar sonuçlanana kadar aktif listede kalır.",
        confirmText: nextStatus === "pending" ? "BEKLİYOR olarak işaretle" : (nextStatus === "loss" ? "KAYBETTİ olarak işaretle" : "KAZANDI olarak işaretle")
      };
      refresh();
    }));
    mount.querySelectorAll("[data-card-screenshot]").forEach(btn => btn.addEventListener("click", () => {
      const cardId = btn.dataset.cardScreenshot || "";
      if (String(cardId).includes("crypto-card")) {
        const m = String(cardId).match(/v763-crypto-card-(\d+)/);
        downloadCryptoCardScreenshot(m ? Number(m[1]) : 0);
      } else {
        downloadActiveCardScreenshot(cardId);
      }
    }));
    mount.querySelectorAll("[data-report-create]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.reportCreate === "crypto" ? "crypto" : "bet";
      createReportCard(mode, state);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-report-delete]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.reportDelete;
      saveReportCards(loadReportCards().filter(x => x.id !== id));
      refresh();
    }));
    mount.querySelectorAll("[data-report-download]").forEach(btn => btn.addEventListener("click", () => {
      downloadReportCard(btn.dataset.reportDownload);
    }));
    mount.querySelectorAll("button[data-status]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.mode, i = Number(btn.dataset.slot);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      if (!list[i]) list[i] = createSlot(mode, i);
      const nextStatus = btn.dataset.status;
      if (!slotHasUserEntry(list[i], mode)) {
        alert(mode === "crypto" ? "Önce işlem adını yaz." : "Önce maç adını yaz.");
        return;
      }
      if (nextStatus === "win" || nextStatus === "loss") {
        const currentStatus = list[i]?.status || "";
        const finalStatus = currentStatus === nextStatus ? "pending" : nextStatus;
        const keepPanel = btn.closest(".v758-pending-modal") ? (PENDING_BOARD_OPEN_MODE || mode) : (PENDING_BOARD_OPEN_MODE || null);
        if (keepPanel) CONFIRM_RETURN_PANEL_MODE = keepPanel;
        if (mode === "bet" && finalStatus !== "pending") {
          const coupon = getBetCouponForSlot(state, i);
          if (coupon && Array.isArray(coupon.matches) && coupon.matches.length > 1) {
            const matchIndex = getBetCouponMatchIndex(coupon, i);
            const matchName = coupon.matches[matchIndex]?.name || `Maç ${matchIndex + 1}`;
            const currentMatchStatus = coupon.matches[matchIndex]?.status || "";
            const nextMatchStatus = currentMatchStatus === finalStatus ? "pending" : finalStatus;
            const resultLabel = nextMatchStatus === "win" ? "KAZANDI" : nextMatchStatus === "loss" ? "KAYBETTİ" : "BEKLİYOR";
            ACTIVE_COMBO_DETAIL_SLOT = Number(coupon.slotIndex || 0);
            CONFIRM_DIALOG = {
              type: "comboMatch",
              slot: i,
              match: matchIndex,
              status: nextMatchStatus,
              keepActivePanel: keepPanel,
              tone: nextMatchStatus === "loss" ? "danger" : "success",
              title: nextMatchStatus === "pending" ? "Maçı bekliyor durumuna al" : "Kombine maç sonucunu onayla",
              message: nextMatchStatus === "pending"
                ? `${matchName} tekrar BEKLİYOR durumuna alınacak.`
                : `${matchName} için ${resultLabel} sonucu kaydedilecek.`,
              detail: nextMatchStatus === "pending" ? "Yanlış işaretleme yaptıysan bu maç aktif kupon içinde yeniden bekliyor olur." : "Kombine tüm maçlar sonuçlanana kadar aktif listede kalır. Tek maç sonucu Geçmiş'e tek başına düşmez.",
              confirmText: nextMatchStatus === "pending" ? "BEKLİYOR olarak işaretle" : `${resultLabel} olarak işaretle`
            };
            refresh();
            return;
          }
          if (betKind(list[i]) === "combo") {
            alert("Kombine için en az iki satırı Kombine olarak seç. Tek satır Kombine geçmişe gönderilmez.");
            return;
          }
        }
        const label = mode === "crypto" ? "kripto işlem" : "bahis / maç";
        const resultLabel = finalStatus === "pending"
          ? "BEKLİYOR"
          : (finalStatus === "win" ? (mode === "crypto" ? "KAZANÇ" : "KAZANDI") : (mode === "crypto" ? "KAYIP" : "KAYBETTİ"));
        const name = String(list[i].name || "").trim() || `${label} #${i + 1}`;
        CONFIRM_DIALOG = {
          type: "settle",
          mode,
          slot: i,
          status: finalStatus,
          keepActivePanel: keepPanel,
          tone: finalStatus === "loss" ? "danger" : "success",
          title: finalStatus === "pending" ? "Tekrar bekliyor durumuna al" : "Sonucu kaydetmeden önce onayla",
          message: finalStatus === "pending" ? `${name} tekrar BEKLİYOR durumuna alınacak.` : `${name} için sonuç: ${resultLabel}.`,
          detail: finalStatus === "pending" ? "Yanlış işaretleme yaptıysan bu kayıt yeniden bekliyor olur." : "Bu kayıt Geçmiş/Rapor merkezine işlenecek. Deneme tıklamasıysa iptal et.",
          confirmText: finalStatus === "pending" ? "BEKLİYOR olarak kaydet" : `${resultLabel} olarak kaydet`
        };
        refresh();
        return;
      }
      applySlotResult(state, mode, i, nextStatus);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("button[data-clear]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.clear;
      if (!confirm(mode === "crypto" ? "Kripto işlem alanları temizlensin mi?" : "Bahis kupon alanları temizlensin mi?")) return;
      state.modeSlots[mode] = createSlots(mode, 20); saveState(state); refresh();
    }));
  }
  window.omega_RollingOpenFloatingPanel = function(kind = "active", mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    PENDING_BOARD_OPEN_MODE = k === "active" ? m : null;
    CONFIRM_RETURN_PANEL_MODE = k === "active" ? m : null;
    LOG_CENTER_OPEN_MODE = k === "history" ? m : null;
    REPORT_CENTER_OPEN_MODE = k === "report" ? m : null;
    HISTORY_OPEN_MODE = null;
    if (k === "history") HISTORY_FILTER = "today";
    renderFloatingPanel();
  };

  if (!window.__omegaV772ExcelRollingBridgeBound) {
    window.__omegaV772ExcelRollingBridgeBound = true;
    const openFromExcelButton = function(event) {
      const target = event.target;
      const overlay = target && target.closest ? target.closest("#rolling-excel-overlay") : null;
      if (!overlay) return;
      const pendingBtn = target.closest("[data-pending-open]");
      const historyBtn = target.closest("[data-log-center]");
      const reportBtn = target.closest("[data-report-open]");
      const btn = pendingBtn || historyBtn || reportBtn;
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      const rawMode = pendingBtn ? pendingBtn.dataset.pendingOpen : historyBtn ? historyBtn.dataset.logCenter : reportBtn.dataset.reportOpen;
      const mode = rawMode === "crypto" ? "crypto" : "bet";
      const kind = pendingBtn ? "active" : historyBtn ? "history" : "report";
      const stamp = `${mode}:${kind}`;
      window.__omegaV772ExcelOpenStamp = stamp;
      // Panel pointerdown aşamasında açılırsa aynı tıklama overlay'e denk gelip anında kapatabiliyor.
      // Bu yüzden sadece click bittikten sonra, bir sonraki macrotask içinde açıyoruz.
      setTimeout(() => {
        if (window.__omegaV772ExcelOpenStamp !== stamp) return;
        window.omega_RollingOpenFloatingPanel(kind, mode);
      }, 0);
      return false;
    };
    document.addEventListener("click", openFromExcelButton, true);
  }

  window.omega_RenderRollingModule = renderModule;
  window.omega_RollingOpenLogCenter = function(mode = "bet") {
    LOG_CENTER_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    REPORT_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    HISTORY_FILTER = "today";
    renderModule();
  };
  window.omega_RollingOpenPendingBoard = function(mode = "bet") {
    PENDING_BOARD_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    LOG_CENTER_OPEN_MODE = null;
    REPORT_CENTER_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  window.omega_RollingOpenReportCenter = function(mode = "bet") {
    REPORT_CENTER_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    LOG_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  window.omega_RollingCreateReport = function(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const fresh = loadState();
    createReportCard(m, fresh);
    saveState(fresh);
    REPORT_CENTER_OPEN_MODE = m;
    LOG_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  if (!window.__omegaV767RollingFeatureCoreDelegationBound) {
    window.__omegaV767RollingFeatureCoreDelegationBound = true;
    document.addEventListener("click", event => {
      const btn = event.target.closest && event.target.closest("[data-v767-feature-open]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      const [modeRaw, kindRaw] = String(btn.dataset.v767FeatureOpen || "bet:active").split(":");
      window.omega_RollingOpenFloatingPanel(kindRaw, modeRaw);
    }, true);
  }

  window.omega_RollingV47 = { loadState, saveState, slotSummary, rollingSummary, money };
  window.addEventListener("storage", e => {
    const watched = [STORAGE_KEY, STORAGE_KEY_BET, STORAGE_KEY_CRYPTO, STORAGE_KEY_UI, ROLLING_KEY, HISTORY_KEY_BET, HISTORY_KEY_CRYPTO, TARGET_ITEMS_KEY_BET, TARGET_ITEMS_KEY_CRYPTO];
    if (watched.includes(e.key) && location.hash.startsWith("#rolling")) renderModule();
  });
})();
