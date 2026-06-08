// ===============================
// V48 ROLLING MAIN MODULE
// Bahis Rolling + Kombine Kupon Maçları / Kripto Rolling + Aktif Kripto İşlemleri
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1";
  const ROLLING_KEY = "v19_rolling";
  const PAGE_MODE_KEY = "v48_rolling_page_mode";
  const RAIL_KEY = "v48_rolling_rail_collapsed";
  const HISTORY_KEY = "v512_rolling_history_v1";
  const TARGET_LOG_KEY = "v755_rolling_target_log_v1";
  const SNAPSHOT_KEY = "v756_rolling_report_cards_v1";
  const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  let HISTORY_OPEN_MODE = null;
  let LOG_CENTER_OPEN_MODE = null;
  let REPORT_CENTER_OPEN_MODE = null;
  let PENDING_BOARD_OPEN_MODE = null;
  let HISTORY_FILTER = "today";
  let CONFIRM_DIALOG = null;

  const DEFAULT_STATE = {
    bank: 1000,
    modeSlots: { bet: createSlots("bet", 20), crypto: createSlots("crypto", 20) },
    rowCounts: { bet: 20, crypto: 20 },
    quickTemplates: { bet: { stake: "", odds: "1.30", name: "" }, crypto: { stake: "", odds: "", name: "" } }
  };

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
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      return {
        bet: Array.isArray(h.bet) ? h.bet : [],
        crypto: Array.isArray(h.crypto) ? h.crypto : []
      };
    } catch {
      return { bet: [], crypto: [] };
    }
  }
  function saveHistory(h) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    h.bet = (h.bet || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    h.crypto = (h.crypto || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  }
  function loadTargetLog() {
    try {
      const rows = JSON.parse(localStorage.getItem(TARGET_LOG_KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }
  function saveTargetLog(rows) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    localStorage.setItem(TARGET_LOG_KEY, JSON.stringify((rows || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 500)));
  }

  function escapeXml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function loadReportCards() {
    try {
      const now = Date.now();
      const rows = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "[]");
      const clean = Array.isArray(rows) ? rows.filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80) : [];
      if (clean.length !== (Array.isArray(rows) ? rows.length : 0)) localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(clean));
      return clean;
    } catch {
      return [];
    }
  }
  function saveReportCards(rows) {
    const now = Date.now();
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify((rows || []).filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80)));
  }
  function snapshotRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count).filter(s => {
      return String(s.name || "").trim() || Number(s.stake || 0) || Number(s.odds || 0) || s.status === "win" || s.status === "loss";
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
      return `<div class="v756-report-gallery empty"><span>Henüz rapor resmi yok.</span><b>İstediğin anda “Rapor Resmi Oluştur” butonuna bas.</b></div>`;
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
  function getPlanNumbers(state, totalPnl) {
    const plan = state.quickPlan || {};
    const start = Number.isFinite(Number(plan.start)) ? Number(plan.start) : 100;
    const target = plan.target === "" || plan.target === null || plan.target === undefined ? 0 : Number(plan.target || 0);
    const autoCurrent = start + Number(totalPnl || 0);
    const hasManualCurrent = plan.currentOverride !== "" && plan.currentOverride !== null && plan.currentOverride !== undefined && Number.isFinite(Number(plan.currentOverride));
    const current = hasManualCurrent ? Number(plan.currentOverride) : autoCurrent;
    const pnl = current - start;
    const growth = growthPct(pnl, start);
    const pct = target > start ? Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100)) : progressPct(current, target || start);
    const done = target > 0 && current >= target;
    return { start, target, current, autoCurrent, pnl, growth, pct, done, hasManualCurrent };
  }
  function addTargetLogRecord(state, totalPnl) {
    const plan = getPlanNumbers(state, totalPnl);
    if (!plan.target) return { ok: false, message: "Önce hedef tutarı gir." };
    if (!plan.done) return { ok: false, message: "Güncel bakiye hedefe ulaşmadan yeşil onay verilemez." };
    const rows = loadTargetLog();
    rows.unshift({
      id: "rt_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      ts: Date.now(),
      start: plan.start,
      target: plan.target,
      current: plan.current,
      pnl: plan.pnl,
      growth: plan.growth
    });
    saveTargetLog(rows);
    state.quickPlan = { start: Number(plan.current.toFixed(2)), target: "", currentOverride: "" };
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
      name: mode === "bet" ? `Bahis Türü: ${betTypeLabel(slot)} · ${String(slot.name || "").trim() || "Bahis / maç"}` : (String(slot.name || "").trim() || "Kripto işlem"),
      stake: Number(slot.stake || 0),
      odds: Number(slot.odds || 0),
      status: slot.status,
      pnl: Number(slot.pnl || 0),
      betType: mode === "bet" ? betDisplayType(slot) : "",
      matchStatus: mode === "bet" ? comboMatchStatus(slot) : ""
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

  function renderConfirmDialog() {
    if (!CONFIRM_DIALOG) return "";
    const tone = CONFIRM_DIALOG.tone || "warn";
    const metrics = Array.isArray(CONFIRM_DIALOG.metrics) && CONFIRM_DIALOG.metrics.length
      ? `<div class="v760-confirm-metrics">${CONFIRM_DIALOG.metrics.map(m => `<div><span>${escapeHtml(m.label || "")}</span><b>${escapeHtml(m.value || "-")}</b></div>`).join("")}</div>`
      : "";
    return `
      <div class="v757-confirm-overlay">
        <section class="v757-confirm-modal v760-confirm-modal ${tone}">
          <button type="button" class="v757-confirm-x" data-confirm-no>×</button>
          <div class="v757-confirm-icon"><i class="fa-solid ${tone === "danger" ? "fa-triangle-exclamation" : "fa-circle-check"}"></i></div>
          <div>
            <b>${escapeHtml(CONFIRM_DIALOG.title || "İşlem Onayı")}</b>
            <p>${escapeHtml(CONFIRM_DIALOG.message || "Bu işlemi onaylıyor musun?")}</p>
            ${CONFIRM_DIALOG.detail ? `<span>${escapeHtml(CONFIRM_DIALOG.detail)}</span>` : ""}
          </div>
          ${metrics}
          <div class="v760-confirm-warning"><i class="fa-solid fa-shield-halved"></i><span>Onaydan sonra kayıt LOG/Geçmiş merkezine işlenir. Deneme tıklamasıysa iptal et.</span></div>
          <div class="v757-confirm-actions">
            <button type="button" class="ghost" data-confirm-no>İptal</button>
            <button type="button" class="ok" data-confirm-yes>${escapeHtml(CONFIRM_DIALOG.confirmText || "Onayla")}</button>
          </div>
        </section>
      </div>`;
  }

  function ensureQuickTemplates(state) {
    if (!state.quickTemplates || typeof state.quickTemplates !== "object") state.quickTemplates = {};
    if (!state.quickTemplates.bet || typeof state.quickTemplates.bet !== "object") state.quickTemplates.bet = { stake: "", odds: "1.30", name: "" };
    if (!state.quickTemplates.crypto || typeof state.quickTemplates.crypto !== "object") state.quickTemplates.crypto = { stake: "", odds: "", name: "" };
    if (state.quickTemplates.bet.odds === undefined || state.quickTemplates.bet.odds === null || state.quickTemplates.bet.odds === "") state.quickTemplates.bet.odds = "1.30";
    if (state.quickTemplates.crypto.odds === undefined || state.quickTemplates.crypto.odds === null) state.quickTemplates.crypto.odds = "";
  }
  function progressPct(current, target) {
    const t = Number(target || 0);
    if (!t) return 0;
    return Math.max(0, Math.min(100, (Number(current || 0) / t) * 100));
  }
  function matchHasAnyInput(match) {
    return !!(match && (String(match.name || "").trim() || Number(match.odds || 0) || String(match.status || "").toLowerCase() === "win" || String(match.status || "").toLowerCase() === "loss"));
  }
  function slotHasAnyInput(slot) {
    return !!(slot && (
      String(slot.name || "").trim() ||
      Number(slot.stake || 0) ||
      Number(slot.odds || 0) ||
      String(slot.couponStake || "").trim() ||
      (Array.isArray(slot.matches) && slot.matches.length > 0)
    ));
  }
  function activeRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count).map((slot, index) => ({ ...slot, index })).filter(slotHasAnyInput);
  }
  function pendingRowsForMode(mode, state) {
    return activeRowsForMode(mode, state).filter(s => s.status !== "win" && s.status !== "loss");
  }
  function getExtraBetMatches(slot) {
    return Array.isArray(slot?.matches) ? slot.matches : [];
  }
  function normalMatchStatus(value) {
    const raw = String(value || "pending").toLowerCase();
    return raw === "win" || raw === "loss" ? raw : "pending";
  }
  function getBetMatches(slot, includeEmptyBase = true) {
    if (!slot) return [];
    const rows = [];
    const base = { matchIndex: 0, name: String(slot.name || ""), odds: slot.odds || "", status: normalMatchStatus(slot.matchStatus) };
    if (includeEmptyBase || matchHasAnyInput(base) || Number(slot.stake || 0) > 0) rows.push(base);
    getExtraBetMatches(slot).forEach((m, idx) => {
      rows.push({ matchIndex: idx + 1, name: String(m?.name || ""), odds: m?.odds || "", status: normalMatchStatus(m?.status) });
    });
    return rows;
  }
  function betMatchCount(slot) {
    if (!slotHasAnyInput(slot)) return 0;
    const extras = getExtraBetMatches(slot).length;
    if (extras > 0) return 1 + extras;
    const filled = getBetMatches(slot, false).length;
    return Math.max(1, filled);
  }
  function isComboSlot(slot) {
    return betMatchCount(slot) >= 2;
  }
  function betDisplayType(slot) {
    return isComboSlot(slot) ? "combo" : "single";
  }
  function betTypeLabel(slot) {
    return isComboSlot(slot) ? "Kombine" : "Tek";
  }
  function comboMatchStatus(slot) {
    return normalMatchStatus(slot?.matchStatus);
  }
  function getBetCouponGroups(state) {
    const rows = pendingRowsForMode("bet", state);
    const singles = [];
    const combos = [];
    rows.forEach(row => {
      if (isComboSlot(row)) combos.push(row);
      else singles.push(row);
    });
    return { singles, coupons: combos.map(row => ({ id: row.index + 1, row, rows: [row] })), combos, rows };
  }
  function matchStatusFor(slot, matchIndex) {
    if (Number(matchIndex || 0) === 0) return normalMatchStatus(slot?.matchStatus);
    const m = getExtraBetMatches(slot)[Number(matchIndex || 0) - 1];
    return normalMatchStatus(m?.status);
  }
  function setMatchStatusFor(slot, matchIndex, status) {
    const clean = status === "loss" ? "loss" : "win";
    const idx = Number(matchIndex || 0);
    if (idx === 0) {
      slot.matchStatus = clean;
      return;
    }
    if (!Array.isArray(slot.matches)) slot.matches = [];
    while (slot.matches.length < idx) slot.matches.push({ name: "", odds: "", status: "pending" });
    slot.matches[idx - 1] = { ...(slot.matches[idx - 1] || {}), status: clean };
  }
  function comboTotals(slot) {
    const matches = getBetMatches(slot, true);
    const stake = Number(slot?.stake || 0);
    const missingStake = stake <= 0;
    const missingMatchCount = matches.length < 2;
    const missingOdds = missingMatchCount || matches.some(m => Number(m.odds || 0) <= 0);
    const odds = missingOdds ? 0 : matches.reduce((p, m) => p * Number(m.odds || 1), 1);
    const possibleReturn = (!missingStake && !missingOdds) ? stake * odds : 0;
    const netProfit = (!missingStake && !missingOdds) ? possibleReturn - stake : 0;
    const allSettled = matches.length >= 2 && matches.every(m => matchStatusFor(slot, m.matchIndex) === "win" || matchStatusFor(slot, m.matchIndex) === "loss");
    const finalStatus = allSettled ? (matches.every(m => matchStatusFor(slot, m.matchIndex) === "win") ? "win" : "loss") : "pending";
    return { stake, odds, possibleReturn, netProfit, missingStake, missingOdds, missingMatchCount, complete: !missingStake && !missingOdds, matches, allSettled, finalStatus };
  }
  function singleTotals(slot) {
    const stake = Number(slot?.stake || 0);
    const odds = Number(slot?.odds || 0);
    const missingStake = stake <= 0;
    const missingOdds = odds <= 0;
    const possibleReturn = (!missingStake && !missingOdds) ? stake * odds : 0;
    const netProfit = (!missingStake && !missingOdds) ? possibleReturn - stake : 0;
    return { stake, odds, possibleReturn, netProfit, missingStake, missingOdds, complete: !missingStake && !missingOdds };
  }
  function missingInfoForSlot(mode, slot, opts = {}) {
    const isCrypto = mode === "crypto";
    const missing = [];
    if (isCrypto) {
      if (Number(slot?.stake || 0) <= 0) missing.push("tutar");
      if (Number(slot?.odds || 0) <= 0) missing.push("net K/Z");
      return missing;
    }
    if (opts.matchOnly) {
      if (Number(slot?.odds || 0) <= 0) missing.push("oran");
      return missing;
    }
    if (isComboSlot(slot)) {
      const totals = comboTotals(slot);
      if (totals.missingStake) missing.push("tutar");
      if (totals.missingMatchCount) missing.push("2. maç");
      if (totals.missingOdds) missing.push("oran");
      return [...new Set(missing)];
    }
    const totals = singleTotals(slot);
    if (totals.missingStake) missing.push("tutar");
    if (totals.missingOdds) missing.push("oran");
    return missing;
  }
  function isResultReady(mode, slot, opts = {}) {
    return missingInfoForSlot(mode, slot, opts).length === 0;
  }
  function infoPillForSlot(mode, slot, opts = {}) {
    const missing = missingInfoForSlot(mode, slot, opts);
    if (!missing.length) return `<span class="v760-info-pill ready">Bilgi tamam</span>`;
    return `<span class="v760-info-pill missing">Eksik bilgi: ${escapeHtml(missing.join(" + "))}</span>`;
  }
  function moneyMetric(value, ok = true) {
    return ok ? money(value) : `<em class="v760-missing-text">Eksik bilgi</em>`;
  }
  function oddsMetric(value, ok = true) {
    return ok ? Number(value || 0).toFixed(2) : `<em class="v760-missing-text">Eksik bilgi</em>`;
  }
  function renderCryptoEditRow(row, index) {
    const slotIndex = Number(row.index ?? index);
    const resultWin = "KAZANÇ";
    const resultLoss = "KAYIP";
    const ready = isResultReady("crypto", row);
    const matchStatus = row.status === "win" || row.status === "loss" ? row.status : "pending";
    const matchStatusText = matchStatus === "win" ? resultWin : matchStatus === "loss" ? resultLoss : "BEKLİYOR";
    const disabledAttr = ready ? "" : "disabled";
    return `
      <div class="v759-pending-edit-row v760-pending-edit-row crypto">
        <span class="v759-row-no">#${slotIndex + 1}</span>
        <input data-pending-edit="crypto:${slotIndex}:name" value="${escapeHtml(row.name || "")}" placeholder="İşlem">
        <input data-pending-edit="crypto:${slotIndex}:stake" type="number" step="0.01" value="${row.stake || ""}" placeholder="Tutar">
        <input data-pending-edit="crypto:${slotIndex}:odds" type="number" step="0.01" value="${row.odds || ""}" placeholder="Net K/Z $">
        <div class="v760-row-state"><span class="v757-status-pill ${matchStatus}">${matchStatusText}</span>${infoPillForSlot("crypto", row)}</div>
        <div class="v759-pending-actions">
          <button type="button" class="win" data-mode="crypto" data-slot="${slotIndex}" data-status="win" ${disabledAttr}>${resultWin}</button>
          <button type="button" class="loss" data-mode="crypto" data-slot="${slotIndex}" data-status="loss" ${disabledAttr}>${resultLoss}</button>
        </div>
      </div>`;
  }
  function renderSingleBetCard(row) {
    const slotIndex = Number(row.index || 0);
    const totals = singleTotals(row);
    const disabledAttr = totals.complete ? "" : "disabled";
    const title = String(row.name || "").trim() || `Bahis #${slotIndex + 1}`;
    return `
      <article class="v761-active-card single">
        <div class="v761-active-head">
          <div>
            <b>${escapeHtml(title)}</b>
            <span>Bahis Türü: Tek ${infoPillForSlot("bet", row)}</span>
          </div>
          <button type="button" class="v761-add-match" data-add-bet-match="${slotIndex}"><i class="fa-solid fa-plus"></i> Maç/Oran ekle</button>
        </div>
        <div class="v761-bet-edit-grid single">
          <label><span>Maç</span><input data-bet-match-edit="${slotIndex}:0:name" value="${escapeHtml(row.name || "")}" placeholder="Maç / seçim"></label>
          <label><span>Oran</span><input data-bet-match-edit="${slotIndex}:0:odds" type="number" step="0.01" value="${row.odds || ""}" placeholder="Oran"></label>
          <label><span>Tutar</span><input data-bet-stake="${slotIndex}" type="number" step="0.01" value="${row.stake || ""}" placeholder="Tutar"></label>
        </div>
        <div class="v761-metrics">
          <span>Bahis tutarı <b>${moneyMetric(totals.stake, !totals.missingStake)}</b></span>
          <span>Oran <b>${oddsMetric(totals.odds, !totals.missingOdds)}</b></span>
          <span>Olası dönüş <b>${moneyMetric(totals.possibleReturn, totals.complete)}</b></span>
          <span>Net kâr <b>${moneyMetric(totals.netProfit, totals.complete)}</b></span>
        </div>
        <div class="v759-pending-actions v761-card-actions">
          <button type="button" class="win" data-mode="bet" data-slot="${slotIndex}" data-status="win" ${disabledAttr}>KAZANDI</button>
          <button type="button" class="loss" data-mode="bet" data-slot="${slotIndex}" data-status="loss" ${disabledAttr}>KAYBETTİ</button>
        </div>
      </article>`;
  }
  function renderComboMatchRow(slotIndex, match) {
    const idx = Number(match.matchIndex || 0);
    const status = matchStatusFor({ ...match, matchStatus: match.status }, 0);
    const statusText = status === "win" ? "KAZANDI" : status === "loss" ? "KAYBETTİ" : "BEKLİYOR";
    const ready = Number(match.odds || 0) > 0;
    const disabledAttr = ready ? "" : "disabled";
    const removeBtn = idx > 0 ? `<button type="button" class="v761-remove-match" data-remove-bet-match="${slotIndex}:${idx}" title="Maçı kaldır"><i class="fa-solid fa-trash"></i></button>` : "";
    return `
      <div class="v761-combo-match-row ${status}">
        <span class="v761-match-no">Maç ${idx + 1}</span>
        <input data-bet-match-edit="${slotIndex}:${idx}:name" value="${escapeHtml(match.name || "")}" placeholder="Maç / seçim">
        <input data-bet-match-edit="${slotIndex}:${idx}:odds" type="number" step="0.01" value="${match.odds || ""}" placeholder="Oran">
        <span class="v757-status-pill ${status}">${statusText}</span>
        <div class="v759-pending-actions compact">
          <button type="button" class="win" data-combo-match-status="${slotIndex}:${idx}:win" ${disabledAttr}>KAZANDI</button>
          <button type="button" class="loss" data-combo-match-status="${slotIndex}:${idx}:loss" ${disabledAttr}>KAYBETTİ</button>
        </div>
        ${removeBtn}
      </div>`;
  }
  function renderComboBetCard(row, order, totalCombos) {
    const slotIndex = Number(row.index || 0);
    const totals = comboTotals(row);
    const title = "Kombine";
    const missingMatchResults = totals.matches.filter(m => matchStatusFor(row, m.matchIndex) === "pending").length;
    const names = totals.matches.map(m => String(m.name || "").trim()).filter(Boolean).join(" + ");
    return `
      <details class="v761-active-card combo" open>
        <summary class="v761-active-head combo">
          <div>
            <b>${title}</b>
            <span>Bahis Türü: Kombine · ${totals.matches.length} maç · ${missingMatchResults ? `${missingMatchResults} maç sonucu bekliyor` : "tüm maçlar işaretlendi"}</span>
            ${names ? `<em>${escapeHtml(names)}</em>` : ""}
          </div>
          <i class="fa-solid fa-chevron-down"></i>
        </summary>
        <div class="v761-combo-stake-line">
          <label><span>Kupon Tutarı</span><input data-bet-stake="${slotIndex}" type="number" step="0.01" value="${row.stake || ""}" placeholder="Tek tutar"></label>
          <button type="button" class="v761-add-match" data-add-bet-match="${slotIndex}"><i class="fa-solid fa-plus"></i> Maç/Oran ekle</button>
          ${infoPillForSlot("bet", row)}
        </div>
        <div class="v761-metrics">
          <span>Bahis tutarı <b>${moneyMetric(totals.stake, !totals.missingStake)}</b></span>
          <span>Toplam oran <b>${oddsMetric(totals.odds, !totals.missingOdds)}</b></span>
          <span>Olası dönüş <b>${moneyMetric(totals.possibleReturn, totals.complete)}</b></span>
          <span>Net kâr <b>${moneyMetric(totals.netProfit, totals.complete)}</b></span>
        </div>
        <div class="v761-combo-note">Kombine aktif kalır. Tüm maçlara KAZANDI/KAYBETTİ onayı verildiğinde otomatik Geçmiş’e taşınır.</div>
        <div class="v761-combo-match-list">${totals.matches.map(m => renderComboMatchRow(slotIndex, m)).join("")}</div>
      </details>`;
  }
  function addComboHistoryRecord(state, row) {
    const slot = state.modeSlots.bet[row.index];
    if (!slot) return false;
    const totals = comboTotals(slot);
    if (!totals.complete || !totals.allSettled) return false;
    const status = totals.finalStatus;
    const h = loadHistory();
    const now = Date.now();
    const names = totals.matches.map(s => String(s.name || "").trim()).filter(Boolean);
    const rec = {
      id: "rh_" + now + "_combo_" + Math.random().toString(36).slice(2),
      mode: "bet",
      ts: now,
      row: row.index + 1,
      name: `Bahis Türü: Kombine · ${names.join(" + ") || "Bahis / maç"}`,
      stake: totals.stake,
      odds: Number(totals.odds.toFixed(4)),
      status,
      pnl: status === "win" ? totals.netProfit : -totals.stake,
      betType: "combo",
      matches: totals.matches.map((m, idx) => ({ no: idx + 1, name: String(m.name || "").trim(), odds: Number(m.odds || 0), status: matchStatusFor(slot, m.matchIndex) }))
    };
    h.bet.unshift(rec);
    saveHistory(h);
    slot.status = status;
    slot.pnl = rec.pnl;
    slot.historyId = rec.id;
    slot.historyStatus = status;
    return true;
  }
  function renderPendingBoard(mode, state) {
    const isCrypto = mode === "crypto";
    if (isCrypto) {
      const rows = pendingRowsForMode(mode, state);
      const totalStake = rows.reduce((sum, s) => sum + Number(s.stake || 0), 0);
      const cryptoTarget = rows.reduce((sum, s) => sum + Math.abs(Number(s.odds || 0)), 0);
      const missing = rows.filter(s => !isResultReady("crypto", s)).length;
      return `
        <div class="v757-pending-board v759-pending-board v760-crypto-edit-board crypto">
          <div class="v757-pending-head">
            <div>
              <b>Aktif Kripto İşlemleri</b>
              <span>Ayrı kripto düzenleme modalı: işlem/tutar/net K/Z girilen kutu aktif kabul edilir; eksik tutar veya net K/Z varsa sonuç butonu kilitli kalır.</span>
            </div>
            <div class="v757-pending-metrics">
              <span>${rows.length} aktif</span>
              <span>${missing} eksik bilgi</span>
              <span>${money(totalStake)} toplam marjin</span>
              <span>${money(cryptoTarget)} net hedef</span>
            </div>
          </div>
          <div class="v759-pending-editor v760-pending-editor">
            ${rows.length ? rows.map((r, idx) => renderCryptoEditRow(r, idx)).join("") : `<div class="v759-empty-note">Kutulara kripto işlem/tutar/net K/Z yazınca burada aktif işlem olarak görünür.</div>`}
          </div>
        </div>`;
    }
    const grouped = getBetCouponGroups(state);
    const totalRows = grouped.rows.length;
    const singleMissing = grouped.singles.filter(s => !isResultReady("bet", s)).length;
    const comboMissing = grouped.combos.filter(s => !comboTotals(s).complete).length;
    const singleCards = grouped.singles.length ? `
      <div class="v759-pending-section v760-single-section v761-active-section">
        <h4>Tek Bahisler <span>Bahis Türü: Tek · ${grouped.singles.length}</span></h4>
        <div class="v760-section-note">Tek bahis kendi maç adı, tutarı ve oranıyla görünür. Kazandı/Kaybetti onayından sonra aktiften düşer ve Geçmiş’e gider.</div>
        <div class="v761-active-list">${grouped.singles.map(renderSingleBetCard).join("")}</div>
      </div>` : "";
    const comboCards = grouped.combos.length ? `
      <div class="v759-pending-section v760-combo-section v761-active-section">
        <h4>Kombine Bahisler <span>Bahis Türü: Kombine · ${grouped.combos.length}</span></h4>
        <div class="v760-section-note">2 veya daha fazla maç/oran satırı varsa sistem otomatik Kombine kabul eder. Tek tutar kullanılır; tüm maçlar işaretlenince kayıt otomatik kapanır.</div>
        <div class="v761-active-list combo">${grouped.combos.map((r, idx) => renderComboBetCard(r, idx, grouped.combos.length)).join("")}</div>
      </div>` : "";
    return `
      <div class="v757-pending-board v759-pending-board v760-bet-board v761-bet-board bet">
        <div class="v757-pending-head">
          <div>
            <b>Aktif Bahisler / Kuponlar</b>
            <span>1 kutu = 1 bahis kaydı. 1 maç varsa Tek, 2+ maç/oran varsa Kombine otomatik oluşur; manuel seçim butonu yok.</span>
          </div>
          <div class="v757-pending-metrics">
            <span>${grouped.singles.length} tek</span>
            <span>${grouped.combos.length} kombine</span>
            <span>${totalRows} aktif kayıt</span>
            <span>${singleMissing + comboMissing} eksik bilgi</span>
          </div>
        </div>
        ${singleCards || ""}
        ${comboCards || ""}
        ${!totalRows ? `<div class="v759-empty-note">Kutulara maç/seçim, oran ve tutar yazınca burada aktif bahis veya kombine olarak görünür.</div>` : ""}
      </div>`;
  }


  function renderModeCommand(mode, slots, state, summary, rollSummaryForMode) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const pending = visible.filter(s => (s.status === "pending" || s.status === "empty" || !s.status) && (String(s.name || "").trim() || Number(s.stake || 0) || Number(s.odds || 0))).length;
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
        <td><div class="v757-history-pnl-cell"><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</span><button type="button" class="v757-history-delete" data-history-delete="${mode}:${escapeHtml(r.id || "")}" title="Bu geçmiş kaydını sil"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="v512-history-empty">Bu filtrede geçmiş kaydı yok.</td></tr>`;
    return `
      <div class="v757-log-center-overlay v758-log-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO GEÇMİŞİ" : "BAHİS GEÇMİŞİ"}</b>
              <span>Sonuçlanan kayıtlar ve silme işlemleri burada. Rapor ayrı merkezde açılır.</span>
            </div>
            <button type="button" data-log-center-close>×</button>
          </div>
          <div class="v753-log-strip v757-log-strip-modal v758-log-strip-modal">
            <div><span>Bugün</span><b>${today.length} kayıt</b><em class="${pnl(today) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(today))}</em></div>
            <div><span>Bu Hafta</span><b>${week.length} kayıt</b><em class="${pnl(week) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(week))}</em></div>
            <div><span>Bu Ay</span><b>${month.length} kayıt</b><em class="${pnl(month) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(month))}</em></div>
          </div>
          <div class="v512-history-filters v758-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v758-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z / Sil</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function renderReportCenterModal(state) {
    if (!REPORT_CENTER_OPEN_MODE) return "";
    const mode = REPORT_CENTER_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const cards = loadReportCards().filter(x => x.mode === mode);
    const history = loadHistory()[mode] || [];
    const totalPnl = history.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    return `
      <div class="v757-log-center-overlay v761-report-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal v761-report-center-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO RAPOR" : "BAHİS RAPOR"}</b>
              <span>Rapor görselleri, oluşturma, indirme ve silme işlemleri Geçmiş’ten ayrı tutulur.</span>
            </div>
            <button type="button" data-report-center-close>×</button>
          </div>
          <div class="v753-log-strip v757-log-strip-modal v758-log-strip-modal v761-report-strip">
            <div><span>Geçmiş kayıt</span><b>${history.length}</b><em class="${totalPnl >= 0 ? "pos" : "neg"}">${signedMoney(totalPnl)}</em></div>
            <div><span>Rapor görseli</span><b>${cards.length}</b><em>7 gün saklanır</em></div>
            <button type="button" data-report-create="${mode}"><i class="fa-solid fa-image"></i> Rapor Resmi Oluştur</button>
          </div>
          <div class="v756-report-actions v758-report-actions">
            <span>Rapor merkezi sadece görsel rapor içindir. Bahis/işlem geçmişi Geçmiş butonunda ayrı açılır.</span>
          </div>
          ${renderReportGallery(mode)}
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
              <b>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ / DÜZENLE" : "AKTİF BAHİSLER / KUPONLAR"}</b>
              <span>${isCrypto ? "Kripto işlemleri burada ayrı modalda düzenlenir; tutar + net K/Z tamamlanınca sonuç onayı açılır." : "Tek bahis ve kombine kuponlar ayrı akışta tutulur; eksikler etiketlenir, sonuçlar onayla Geçmiş’e gider."}</span>
            </div>
            <button type="button" data-pending-close>×</button>
          </div>
          ${renderPendingBoard(mode, state)}
        </section>
      </div>`;
  }

  function createSlot(type = "bet", i = 0) {
    return { id: i + 1, type, name: "", stake: "", odds: type === "bet" ? "1.30" : "", matches: type === "bet" ? [] : undefined, cryptoPnlMode: type === "crypto" ? "amount" : "odds", status: "pending", pnl: 0 };
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
    if (!state.rowCounts || typeof state.rowCounts !== "object") state.rowCounts = { bet: 20, crypto: 20 };
    if (!state.quickPlan || typeof state.quickPlan !== "object") state.quickPlan = { start: 100, target: 1000, currentOverride: "" };
    if (state.quickPlan.currentOverride === undefined || state.quickPlan.currentOverride === null) state.quickPlan.currentOverride = "";
    if (state.quickPlan.target === undefined || state.quickPlan.target === null) state.quickPlan.target = 1000;
    if (state.quickPlan.start === undefined || state.quickPlan.start === null || state.quickPlan.start === "") state.quickPlan.start = 100;
    ensureQuickTemplates(state);
    state.rowCounts.bet = Math.max(1, Math.min(20, Number(state.rowCounts.bet || 20)));
    state.rowCounts.crypto = Math.max(1, Math.min(20, Number(state.rowCounts.crypto || 20)));
    while (state.modeSlots.bet.length < state.rowCounts.bet) state.modeSlots.bet.push(createSlot("bet", state.modeSlots.bet.length));
    while (state.modeSlots.crypto.length < state.rowCounts.crypto) state.modeSlots.crypto.push(createSlot("crypto", state.modeSlots.crypto.length));
    state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = i + 1; if (!Array.isArray(s.matches)) s.matches = []; });
    state.modeSlots.crypto.forEach((s, i) => { s.type = "crypto"; s.id = i + 1; if (!s.cryptoPnlMode) s.cryptoPnlMode = "amount"; });
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
        const fee = Math.max(0, Number(op.fee || op.cost || 0));
        const pnl = mode === "crypto"
          ? (op.netMode === "amount" ? Math.abs(val) + (op.res === "loss" ? fee : -fee) : Math.abs(amt * (val / 100)))
          : (op.res === "win" ? (amt * val) - amt : amt);
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
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const label = mode === "crypto" ? "Kripto" : "Bahis";
    const pendingLabel = mode === "crypto" ? "Aktif İşlemler" : "Aktif Bahisler / Kuponlar";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls"><span>${count}/20 ${label}</span><button type="button" data-row-op="${mode}:minus" title="Alan azalt">−</button><button type="button" data-row-op="${mode}:plus" title="Alan ekle">+</button><button type="button" data-row-preset="${mode}:5">5</button><button type="button" data-row-preset="${mode}:10">10</button><button type="button" data-row-preset="${mode}:20">20</button><button type="button" class="v758-row-tool v759-row-tool active" data-pending-open="${mode}"><i class="fa-solid fa-list-check"></i> ${pendingLabel}</button><button type="button" class="v758-row-tool history" data-history-open="${mode}"><i class="fa-solid fa-clock-rotate-left"></i> Geçmiş</button><button type="button" class="v758-row-tool report" data-report-center="${mode}"><i class="fa-solid fa-image"></i> Rapor</button></div>`;
  }

  function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderTable(mode, slots, state) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const noteHead = isCrypto ? "AKTİF İŞLEM" : "MAÇ";
    const notePH = isCrypto ? "İşlem" : "Maç";
    const valHead = isCrypto ? "NET K/Z $" : "ORAN";
    const winText = isCrypto ? "KAZANÇ" : "KAZANDI";
    const lossText = isCrypto ? "KAYIP" : "KAYBETTİ";
    const pnlHead = isCrypto ? "PNL" : "K/Z";
    return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table v761-active-table"><thead><tr><th></th><th>#</th><th>Tür</th><th>${noteHead}</th><th>${valHead}</th><th>Tutar</th><th>Durum</th><th>${pnlHead}</th><th>İşlem</th></tr></thead><tbody>${visible.map((s, i) => {
      const betType = !isCrypto ? betDisplayType(s) : "";
      const isCombo = !isCrypto && betType === "combo";
      const rowStatus = isCombo ? (comboTotals(s).allSettled ? comboTotals(s).finalStatus : "pending") : (s.status === "win" || s.status === "loss" ? s.status : "pending");
      const status = rowStatus === "win" ? winText : rowStatus === "loss" ? lossText : (isCombo ? `${betMatchCount(s)} MAÇ BEKLİYOR` : "BEKLİYOR");
      const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
      const typeText = isCrypto ? "Kripto" : betTypeLabel(s);
      const ready = isResultReady(mode, s);
      const disabledAttr = ready ? "" : "disabled";
      const comboNames = isCombo ? getBetMatches(s, true).map(m => String(m.name || "").trim()).filter(Boolean).join(" + ") : "";
      const displayName = isCombo ? (comboNames || `${betMatchCount(s)} maçlık kombine`) : (s.name || "");
      const oddsVal = isCombo ? (comboTotals(s).odds ? comboTotals(s).odds.toFixed(2) : "") : (s.odds || "");
      const pnlValue = isCombo && s.status !== "win" && s.status !== "loss" ? `<span class="v760-muted-dash">Tüm maçlar bekliyor</span>` : money(s.pnl || 0);
      const actions = isCombo
        ? `<button type="button" class="ghost" data-pending-open="bet">DÜZENLE</button>`
        : `<button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win" ${disabledAttr}>${winText}</button><button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss" ${disabledAttr}>${lossText}</button>`;
      return `<tr class="${!ready && slotHasAnyInput(s) ? "v760-row-missing" : ""}"><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell"><span class="rolling-v47-type ${mode} ${isCombo ? "combo" : ""}">${typeText}</span></div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(displayName)}" placeholder="${notePH}" ${isCombo ? "readonly" : ""}></td><td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${oddsVal}" placeholder="${isCrypto ? "Net K/Z $" : "Oran"}" ${isCombo ? "readonly" : ""}></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td><td><div class="v760-table-status"><span class="v757-status-pill ${rowStatus}">${status}</span>${slotHasAnyInput(s) ? infoPillForSlot(mode, s) : ""}</div></td><td class="${pnlClass}">${pnlValue}</td><td><div class="rolling-v47-actions v757-actions">${actions}</div></td></tr>`;
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
            <h3 class="${isCrypto ? "rolling-v493-title crypto" : "rolling-v493-title bet"}">${isCrypto ? '<span class="rolling-v518-crypto-icons"><i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i><img class="rolling-v521-ethereum-svg rolling-v518-ethereum-icon" src="assets/icons/ethereum.svg" alt="Ethereum" loading="lazy"></span>' : '<span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span>'} <span>${isCrypto ? "KRİPTO" : "BAHİS"}</span></h3>
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
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-active-title" : "rolling-v493-fold-title bet rolling-v494-combine-title"}"><i class="fa-solid ${isCrypto ? "fa-chart-simple" : "fa-list-check"}"></i> <span>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR"}</span></summary>
          <div class="rolling-v47-section-title">
            <div>${renderRowControls(mode, state)}</div>
            <button type="button" data-clear="${mode}">${isCrypto ? "KRİPTOYU TEMİZLE" : "BAHİSİ TEMİZLE"}</button>
          </div>
          ${renderTable(mode, slots, state)}
        </details>
      </section>`;
  }
  function renderPlanControl(state, totalPnl) {
    const plan = getPlanNumbers(state, totalPnl);
    const rows = loadTargetLog();
    const latest = rows.slice(0, 4).map(r => `
      <li>
        <span>${escapeHtml(formatDateTime(r.ts))}</span>
        <b>${money(r.start)} → ${money(r.target)}</b>
        <em class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${signedMoney(r.pnl)} · ${pctText(r.growth)}</em>
      </li>`).join("") || `<li class="empty"><span>Kayıt yok</span><b>Hedefi bitirince burada kalır.</b><em>-</em></li>`;
    return `
      <div class="rolling-v495-quick-plan v755-target-plan v756-target-plan v757-target-plan v759-target-plan v760-target-plan">
        <div class="v756-target-title v757-target-title v758-target-title v759-target-title v760-target-title">
          <b>Rolling Hedef Takibi</b>
          <span>Başlangıç, güncel ve hedef tek ayar alanında tutulur; durum kartları sadece ilerlemeyi gösterir.</span>
        </div>
        <div class="v759-target-layout v760-target-layout">
          <div class="v759-target-edit v760-target-edit">
            <h4>Hedef Ayarları</h4>
            <label><span>Başlangıç $</span><input type="number" step="1" data-rolling-quick="start" value="${plan.start}"></label>
            <label><span>Güncel $</span><input type="number" step="1" data-rolling-quick="currentOverride" value="${plan.hasManualCurrent ? plan.current : ""}" placeholder="Boşsa otomatik"></label>
            <label><span>Hedef $</span><input type="number" step="1" data-rolling-quick="target" value="${plan.target || ""}" placeholder="Hedef gir"></label>
            <small>Güncel alanı boşsa sistem başlangıç + toplam K/Z üzerinden otomatik hesaplar.</small>
          </div>
          <div class="v759-target-status v760-target-status">
            <h4>Durum Özeti</h4>
            <div class="v760-target-cards">
              <div><span>K/Z</span><b class="${plan.pnl >= 0 ? "pos" : "neg"}">${signedMoney(plan.pnl)}</b></div>
              <div><span>Büyüme</span><b>${pctText(plan.growth)}</b></div>
              <div><span>İlerleme</span><b>${plan.target ? `${plan.pct.toFixed(1)}%` : "Hedef bekliyor"}</b></div>
            </div>
            <div class="v759-target-bar v760-target-bar"><u style="width:${plan.pct.toFixed(1)}%"></u></div>
            <div class="v760-target-mini"><span>Otomatik güncel: <b>${money(plan.autoCurrent)}</b></span><span>Manuel güncel: <b>${plan.hasManualCurrent ? money(plan.current) : "Kapalı"}</b></span></div>
            <div class="v755-target-actions v756-target-actions v757-target-actions v759-target-actions v760-target-actions">
              <button type="button" class="v755-target-complete" data-target-complete ${plan.done ? "" : "disabled"}><i class="fa-solid fa-check"></i> HEDEFİ BİTİR</button>
              <button type="button" class="v755-target-reset" data-target-reset>YENİ HEDEF</button>
            </div>
          </div>
        </div>
        <details class="v756-target-log-fold v757-target-log-fold v759-target-log-fold v760-target-log-fold">
          <summary>Hedef Geçmişi <span>${rows.length} kayıt</span></summary>
          <ul class="v755-target-log v756-target-log">${latest}</ul>
        </details>
      </div>`;
  }


  function renderModule() {
    const mount = qs("omega-rolling-render");
    if (!mount) return;
    const state = loadState();
    const betSum = slotSummary(state.modeSlots.bet);
    const cryptoSum = slotSummary(state.modeSlots.crypto);
    const betRollSum = rollingSummary("bet");
    const cryptoRollSum = rollingSummary("crypto");
    const rollSum = rollingSummary();
    const betTotalPnl = betSum.pnl + betRollSum.pnlTotal;
    const cryptoTotalPnl = cryptoSum.pnl + cryptoRollSum.pnlTotal;
    const totalPnl = betTotalPnl + cryptoTotalPnl;
    const betGrowth = growthPct(betTotalPnl, betRollSum.startTotal || state.quickPlan?.start || 100);
    const cryptoGrowth = growthPct(cryptoTotalPnl, cryptoRollSum.startTotal || state.quickPlan?.start || 100);
    const totalGrowth = growthPct(totalPnl, (betRollSum.startTotal || 0) + (cryptoRollSum.startTotal || 0) || state.quickPlan?.start || 100);
    const mode = activeMode();
    mount.innerHTML = `
      <div class="rolling-v47-page v48-rolling-page v49-rolling-page">
        <div class="rolling-v47-hero v48-rolling-hero">
          <div><h2><i class="fa-solid fa-layer-group"></i> ROLLING</h2></div>
          <div class="rolling-v47-hero-kpis v753-rolling-kpis v756-rolling-kpis">
            <div><span>Bahis Kar/Zarar</span><b class="${betTotalPnl >= 0 ? "pos" : "neg"}">${signedMoney(betTotalPnl)}</b><em>${pctText(betGrowth)} büyüme</em></div>
            <div><span>Kripto Kar/Zarar</span><b class="${cryptoTotalPnl >= 0 ? "pos" : "neg"}">${signedMoney(cryptoTotalPnl)}</b><em>${pctText(cryptoGrowth)} büyüme</em></div>
            <div><span>Toplam Kar/Zarar</span><b class="${totalPnl >= 0 ? "pos" : "neg"}">${signedMoney(totalPnl)}</b><em>${pctText(totalGrowth)} büyüme</em></div>
          </div>
        </div>

        ${renderPlanControl(state, totalPnl)}

        <div class="rolling-v48-layout v49-rolling-layout">
          <aside class="rolling-v48-rail v49-rolling-rail">
            <div class="rolling-v48-rail-toggle v49-rolling-rail-title"><i class="fa-solid fa-bars"></i><span>ROLLING MENÜSÜ</span></div>
            <button type="button" class="rolling-v48-rail-tab bet ${mode === "bet" ? "active" : ""}" data-roll-tab="bet"><span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span><span class="rolling-v493-rail-label">BAHİS</span></button>
            <button type="button" class="rolling-v48-rail-tab crypto ${mode === "crypto" ? "active" : ""}" data-roll-tab="crypto"><span class="rolling-v518-crypto-icons"><i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i><img class="rolling-v521-ethereum-svg rolling-v518-ethereum-icon" src="assets/icons/ethereum.svg" alt="Ethereum" loading="lazy"></span><span class="rolling-v493-rail-label">KRİPTO</span></button>
          </aside>
          <main class="rolling-v48-main">${renderModePanel(mode, state)}</main>
        </div>
        ${renderPendingModal(state)}
        ${renderLogCenterModal(state)}
        ${renderReportCenterModal(state)}
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
    if (mode === "bet" && isComboSlot(list[i])) {
      setMatchStatusFor(list[i], 0, nextStatus === "loss" ? "loss" : "win");
      list[i].status = "pending";
      const row = { ...list[i], index: i };
      addComboHistoryRecord(state, row);
      return;
    }
    list[i].status = nextStatus;
    recalcSlot(list[i]);
    if ((list[i].status === "win" || list[i].status === "loss") && (prevStatus !== list[i].status || list[i].historyStatus !== list[i].status)) {
      addHistoryRecord(mode, list[i], i);
    }
  }

  function deleteHistoryRecord(mode, id) {
    const h = loadHistory();
    h[mode] = (h[mode] || []).filter(r => r.id !== id);
    saveHistory(h);
    const state = loadState();
    ["bet", "crypto"].forEach(m => (state.modeSlots[m] || []).forEach(slot => {
      if (slot && slot.historyId === id) { slot.historyId = ""; slot.historyStatus = ""; }
    }));
    saveState(state);
  }

  function bindEvents(mount, state) {
    mount.querySelectorAll("[data-roll-tab]").forEach(btn => btn.addEventListener("click", () => { setActiveMode(btn.dataset.rollTab); renderModule(); }));
    mount.querySelectorAll("[data-roll]").forEach(btn => btn.addEventListener("click", () => { const [mode, days] = String(btn.dataset.roll || "bet:7").split(":"); openRolling(mode, Number(days || 7)); }));
    mount.querySelectorAll("[data-row-op]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, op] = String(btn.dataset.rowOp || "bet:plus").split(":");
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      const current = Math.max(1, Math.min(20, Number(state.rowCounts[mode] || 20)));
      if (op === "plus") {
        state.rowCounts[mode] = Math.min(20, current + 1);
        while (state.modeSlots[mode].length < state.rowCounts[mode]) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      } else state.rowCounts[mode] = Math.max(1, current - 1);
      saveState(state); renderModule();
    }));
    mount.querySelectorAll("[data-row-preset]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, raw] = String(btn.dataset.rowPreset || "bet:20").split(":");
      const count = Math.max(1, Math.min(20, Number(raw || 20)));
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      state.rowCounts[mode] = count;
      while (state.modeSlots[mode].length < count) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      saveState(state);
      renderModule();
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
      renderModule();
    }));
    mount.querySelectorAll("input[data-mode]").forEach(input => {
      const saveInput = () => {
        const mode = input.dataset.mode, i = Number(input.dataset.slot), key = input.dataset.key;
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        if (!list[i]) list[i] = createSlot(mode, i);
        list[i][key] = input.value;
        list[i].type = mode;
        if (slotHasAnyInput(list[i])) {
          if (list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
        }
        if (mode === "crypto" && key === "odds") list[i].cryptoPnlMode = "amount";
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
        state.quickPlan = state.quickPlan || { start: 100, target: 1000, currentOverride: "" };
        const key = input.dataset.rollingQuick;
        state.quickPlan[key] = input.value === "" ? "" : Number(input.value || 0);
        saveState(state);
      });
      input.addEventListener("change", () => renderModule());
    });
    mount.querySelectorAll("[data-target-complete]").forEach(btn => btn.addEventListener("click", () => {
      const betSum = slotSummary(state.modeSlots.bet);
      const cryptoSum = slotSummary(state.modeSlots.crypto);
      const betRollSum = rollingSummary("bet");
      const cryptoRollSum = rollingSummary("crypto");
      const totalPnl = Number(betSum.pnl || 0) + Number(cryptoSum.pnl || 0) + Number(betRollSum.pnlTotal || 0) + Number(cryptoRollSum.pnlTotal || 0);
      const result = addTargetLogRecord(state, totalPnl);
      if (!result.ok) { alert(result.message); return; }
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-target-reset]").forEach(btn => btn.addEventListener("click", () => {
      const betSum = slotSummary(state.modeSlots.bet);
      const cryptoSum = slotSummary(state.modeSlots.crypto);
      const betRollSum = rollingSummary("bet");
      const cryptoRollSum = rollingSummary("crypto");
      const totalPnl = Number(betSum.pnl || 0) + Number(cryptoSum.pnl || 0) + Number(betRollSum.pnlTotal || 0) + Number(cryptoRollSum.pnlTotal || 0);
      const plan = getPlanNumbers(state, totalPnl);
      state.quickPlan = { start: Number(plan.current.toFixed(2)), target: "", currentOverride: "" };
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-history-open]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = btn.dataset.historyOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      renderModule();
    }));
    mount.querySelectorAll("[data-history-close]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-log-center]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = btn.dataset.logCenter === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      renderModule();
    }));
    mount.querySelectorAll("[data-pending-open]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = btn.dataset.pendingOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-report-center]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = btn.dataset.reportCenter === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-pending-edit]").forEach(input => input.addEventListener("change", () => {
      const [mode, slotRaw, key] = String(input.dataset.pendingEdit || "bet:0:name").split(":");
      const i = Number(slotRaw || 0);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      if (!list[i]) list[i] = createSlot(mode, i);
      list[i].type = mode;
      if (key === "couponId") list[i][key] = Math.max(1, Math.min(4, Number(input.value || 1)));
      else list[i][key] = input.value;
      if (mode === "bet" && key === "betType") {
        list[i].betType = input.value === "combo" ? "combo" : "single";
        if (list[i].betType === "combo") {
          if (list[i].status === "win" || list[i].status === "loss") list[i].status = "pending";
          list[i].historyId = "";
          list[i].historyStatus = "";
          list[i].matchStatus = comboMatchStatus(list[i]);
        } else {
          list[i].matchStatus = "";
        }
      }
      if (mode === "bet" && !list[i].betType) list[i].betType = "single";
      if (mode === "bet" && !list[i].couponId) list[i].couponId = 1;
      if (slotHasAnyInput(list[i])) {
        if (list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
      }
      if (mode === "crypto" && key === "odds") list[i].cryptoPnlMode = "amount";
      recalcSlot(list[i]);
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-bet-stake]").forEach(input => {
      const saveStake = () => {
        const i = Number(input.dataset.betStake || 0);
        const list = state.modeSlots.bet || [];
        if (!list[i]) list[i] = createSlot("bet", i);
        list[i].type = "bet";
        list[i].stake = input.value;
        if (slotHasAnyInput(list[i]) && list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
        recalcSlot(list[i]);
        saveState(state);
      };
      input.addEventListener("input", saveStake);
      input.addEventListener("change", () => { saveStake(); renderModule(); });
    });
    mount.querySelectorAll("[data-bet-match-edit]").forEach(input => {
      const saveMatch = () => {
        const [slotRaw, matchRaw, key] = String(input.dataset.betMatchEdit || "0:0:name").split(":");
        const i = Number(slotRaw || 0);
        const matchIndex = Number(matchRaw || 0);
        const list = state.modeSlots.bet || [];
        if (!list[i]) list[i] = createSlot("bet", i);
        list[i].type = "bet";
        if (matchIndex === 0) {
          if (key === "name") list[i].name = input.value;
          if (key === "odds") list[i].odds = input.value;
        } else {
          if (!Array.isArray(list[i].matches)) list[i].matches = [];
          while (list[i].matches.length < matchIndex) list[i].matches.push({ name: "", odds: "", status: "pending" });
          const m = { ...(list[i].matches[matchIndex - 1] || {}) };
          if (key === "name") m.name = input.value;
          if (key === "odds") m.odds = input.value;
          if (!m.status) m.status = "pending";
          list[i].matches[matchIndex - 1] = m;
        }
        if (slotHasAnyInput(list[i]) && list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
        saveState(state);
      };
      input.addEventListener("input", saveMatch);
      input.addEventListener("change", () => { saveMatch(); renderModule(); });
    });
    mount.querySelectorAll("[data-add-bet-match]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.addBetMatch || 0);
      if (!state.modeSlots.bet[i]) state.modeSlots.bet[i] = createSlot("bet", i);
      if (!Array.isArray(state.modeSlots.bet[i].matches)) state.modeSlots.bet[i].matches = [];
      state.modeSlots.bet[i].matches.push({ name: "", odds: "", status: "pending" });
      state.modeSlots.bet[i].status = "pending";
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-remove-bet-match]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, matchRaw] = String(btn.dataset.removeBetMatch || "0:0").split(":");
      const i = Number(slotRaw || 0);
      const matchIndex = Number(matchRaw || 0);
      const slot = state.modeSlots.bet?.[i];
      if (!slot || matchIndex <= 0 || !Array.isArray(slot.matches)) return;
      slot.matches.splice(matchIndex - 1, 1);
      if (slot.status !== "win" && slot.status !== "loss") slot.status = "pending";
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-combo-match-status]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, matchRaw, statusRaw] = String(btn.dataset.comboMatchStatus || "0:0:win").split(":");
      const i = Number(slotRaw || 0);
      const matchIndex = Number(matchRaw || 0);
      const status = statusRaw === "loss" ? "loss" : "win";
      const row = state.modeSlots.bet?.[i];
      if (!row) return;
      const resultLabel = status === "loss" ? "KAYBETTİ" : "KAZANDI";
      CONFIRM_DIALOG = {
        type: "comboMatch",
        slot: i,
        matchIndex,
        status,
        tone: status === "loss" ? "danger" : "success",
        title: "Kombine maç sonucunu işaretle",
        message: `${String(row.name || "Maç / seçim").trim()} için sonuç: ${resultLabel}.`,
        detail: "Bu işlem kombine içindeki tek maç sonucudur. Tüm maçlar işaretlenince kombine otomatik Geçmiş'e taşınır.",
        metrics: [
          { label: "Bahis Türü", value: "Kombine" },
          { label: "Kombine", value: `${betMatchCount(row)} maç` },
          { label: "Oran", value: Number((matchIndex === 0 ? row.odds : row.matches?.[matchIndex - 1]?.odds) || 0) > 0 ? Number((matchIndex === 0 ? row.odds : row.matches?.[matchIndex - 1]?.odds) || 0).toFixed(2) : "Eksik bilgi" }
        ],
        confirmText: `${resultLabel} işaretle`
      };
      renderModule();
    }));
    mount.querySelectorAll("[data-pending-close]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll(".v758-pending-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      PENDING_BOARD_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-log-center-close]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll(".v757-log-center-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      LOG_CENTER_OPEN_MODE = null;
      renderModule();
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
      renderModule();
    }));
    mount.querySelectorAll("[data-report-center-close]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll(".v761-report-center-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      REPORT_CENTER_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-confirm-no]").forEach(btn => btn.addEventListener("click", () => {
      CONFIRM_DIALOG = null;
      renderModule();
    }));
    mount.querySelectorAll(".v757-confirm-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      CONFIRM_DIALOG = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-confirm-yes]").forEach(btn => btn.addEventListener("click", () => {
      const action = CONFIRM_DIALOG;
      CONFIRM_DIALOG = null;
      if (!action) return renderModule();
      if (action.type === "settle") {
        const fresh = loadState();
        applySlotResult(fresh, action.mode, Number(action.slot || 0), action.status);
        saveState(fresh);
      } else if (action.type === "comboMatch") {
        const fresh = loadState();
        const i = Number(action.slot || 0);
        if (!fresh.modeSlots.bet[i]) fresh.modeSlots.bet[i] = createSlot("bet", i);
        setMatchStatusFor(fresh.modeSlots.bet[i], Number(action.matchIndex || 0), action.status === "loss" ? "loss" : "win");
        if (fresh.modeSlots.bet[i].status !== "win" && fresh.modeSlots.bet[i].status !== "loss") fresh.modeSlots.bet[i].status = "pending";
        addComboHistoryRecord(fresh, { ...fresh.modeSlots.bet[i], index: i });
        saveState(fresh);
      } else if (action.type === "deleteHistory") {
        deleteHistoryRecord(action.mode, action.id);
      }
      renderModule();
    }));
    mount.querySelectorAll(".v512-history-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      HISTORY_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-history-filter]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_FILTER = btn.dataset.historyFilter || "today";
      renderModule();
    }));
    mount.querySelectorAll("[data-report-create]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.reportCreate === "crypto" ? "crypto" : "bet";
      createReportCard(mode, state);
      REPORT_CENTER_OPEN_MODE = mode;
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("[data-report-delete]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.reportDelete;
      saveReportCards(loadReportCards().filter(x => x.id !== id));
      renderModule();
    }));
    mount.querySelectorAll("[data-report-download]").forEach(btn => btn.addEventListener("click", () => {
      downloadReportCard(btn.dataset.reportDownload);
    }));
    mount.querySelectorAll("button[data-status]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.mode, i = Number(btn.dataset.slot);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      if (!list[i]) list[i] = createSlot(mode, i);
      const nextStatus = btn.dataset.status;
      if (nextStatus === "win" || nextStatus === "loss") {
        const isCombo = mode === "bet" && betDisplayType(list[i]) === "combo";
        const ready = isResultReady(mode, list[i], { comboMatch: isCombo });
        if (!ready) return;
        const label = mode === "crypto" ? "kripto işlem" : (isCombo ? "kombine maç" : "tek bahis");
        const resultLabel = nextStatus === "win" ? (mode === "crypto" ? "KAZANÇ" : "KAZANDI") : (mode === "crypto" ? "KAYIP" : "KAYBETTİ");
        const name = String(list[i].name || "").trim() || `${label} #${i + 1}`;
        const stake = Number(list[i].stake || 0);
        const val = Number(list[i].odds || 0);
        CONFIRM_DIALOG = {
          type: isCombo ? "comboMatch" : "settle",
          mode,
          slot: i,
          status: nextStatus,
          tone: nextStatus === "loss" ? "danger" : "success",
          title: isCombo ? "Kombine maç sonucunu işaretle" : "Sonucu kaydetmeden önce onayla",
          message: `${name} için sonuç: ${resultLabel}.`,
          detail: isCombo ? "Bu sadece kombine içindeki maç sonucunu işaretler; tüm maçlar tamamlanınca kayıt otomatik Geçmiş’e gider." : "Bu kayıt Geçmiş/Rapor merkezine işlenecek.",
          metrics: [
            { label: "Bahis Türü", value: mode === "crypto" ? "Kripto" : (isCombo ? "Kombine" : "Tek") },
            { label: "Tutar", value: mode === "crypto" ? money(stake) : (isCombo ? "Kupon tutarı" : money(stake)) },
            { label: mode === "crypto" ? "Net K/Z" : "Oran", value: mode === "crypto" ? money(val) : val.toFixed(2) },
            { label: "Beklenen K/Z", value: mode === "crypto" ? money(Math.abs(val)) : (isCombo ? "Kupondan hesaplanır" : money(stake * (val - 1))) }
          ],
          confirmText: `${resultLabel} olarak kaydet`
        };
        renderModule();
        return;
      }
      applySlotResult(state, mode, i, nextStatus);
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll("button[data-clear]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.clear;
      if (!confirm(mode === "crypto" ? "Kripto işlem alanları temizlensin mi?" : "Bahis kupon alanları temizlensin mi?")) return;
      state.modeSlots[mode] = createSlots(mode, 20); saveState(state); renderModule();
    }));
  }
  window.omega_RenderRollingModule = renderModule;
  window.omega_RollingOpenLogCenter = function(mode = "bet") {
    HISTORY_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    LOG_CENTER_OPEN_MODE = null;
    REPORT_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_FILTER = "today";
    renderModule();
  };
  window.omega_RollingOpenPending = function(mode = "bet") {
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
    const fresh = loadState();
    createReportCard(mode === "crypto" ? "crypto" : "bet", fresh);
    saveState(fresh);
    renderModule();
  };
  window.omega_RollingV47 = { loadState, saveState, slotSummary, rollingSummary, money };
  window.addEventListener("storage", e => { if ((e.key === STORAGE_KEY || e.key === ROLLING_KEY) && location.hash.startsWith("#rolling")) renderModule(); });
})();
