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
      name: String(slot.name || "").trim() || (mode === "crypto" ? "Kripto işlem" : "Bahis / maç"),
      stake: Number(slot.stake || 0),
      odds: Number(slot.odds || 0),
      status: slot.status,
      pnl: Number(slot.pnl || 0)
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
  function activeRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count).map((slot, index) => ({ ...slot, index })).filter(s => String(s.name || "").trim() || Number(s.stake || 0) || Number(s.odds || 0));
  }
  function pendingRowsForMode(mode, state) {
    return activeRowsForMode(mode, state).filter(s => s.status !== "win" && s.status !== "loss");
  }
  function betDisplayType(slot, totalActive = 1) {
    const raw = String(slot?.betType || "").toLowerCase();
    if (raw === "single" || raw === "tek") return "single";
    if (raw === "combo" || raw === "kombine") return "combo";
    return totalActive > 1 ? "combo" : "single";
  }
  function betCouponId(slot) {
    const id = Math.max(1, Math.min(4, Number(slot?.couponId || 1)));
    return Number.isFinite(id) ? id : 1;
  }
  function getBetCouponGroups(state) {
    const rows = pendingRowsForMode("bet", state);
    const totalActive = rows.length;
    const singles = [];
    const groups = {};
    rows.forEach(row => {
      const type = betDisplayType(row, totalActive);
      if (type === "single") {
        singles.push(row);
        return;
      }
      const id = betCouponId(row);
      if (!groups[id]) groups[id] = [];
      groups[id].push(row);
    });
    const coupons = Object.entries(groups).map(([id, list]) => ({ id: Number(id), rows: list })).sort((a,b) => a.id - b.id);
    return { singles, coupons, rows };
  }
  function couponTotals(rows) {
    const clean = (rows || []).filter(Boolean);
    const odds = clean.reduce((p, s) => p * Math.max(1, Number(s.odds || 1)), 1);
    const firstStake = clean.find(s => Number(s.stake || 0) > 0);
    const stake = Number(firstStake?.stake || 0);
    const possibleReturn = stake * odds;
    const netProfit = possibleReturn - stake;
    return { stake, odds, possibleReturn, netProfit };
  }
  function renderPendingEditRow(mode, row, index, totalActive) {
    const isCrypto = mode === "crypto";
    const slotIndex = Number(row.index ?? index);
    const betType = !isCrypto ? betDisplayType(row, totalActive) : "";
    const couponId = !isCrypto ? betCouponId(row) : 1;
    const resultWin = isCrypto ? "KAZANÇ" : "KAZANDI";
    const resultLoss = isCrypto ? "KAYIP" : "KAYBETTİ";
    return `
      <div class="v759-pending-edit-row ${mode}">
        <span class="v759-row-no">#${slotIndex + 1}</span>
        ${!isCrypto ? `<select data-pending-edit="${mode}:${slotIndex}:betType"><option value="single" ${betType === "single" ? "selected" : ""}>Tek</option><option value="combo" ${betType === "combo" ? "selected" : ""}>Kombine</option></select><select data-pending-edit="${mode}:${slotIndex}:couponId" ${betType === "combo" ? "" : "disabled"}>${[1,2,3,4].map(n => `<option value="${n}" ${couponId === n ? "selected" : ""}>Kupon ${n}</option>`).join("")}</select>` : ""}
        <input data-pending-edit="${mode}:${slotIndex}:name" value="${escapeHtml(row.name || "")}" placeholder="${isCrypto ? "İşlem" : "Maç / seçim"}">
        <input data-pending-edit="${mode}:${slotIndex}:stake" type="number" step="0.01" value="${row.stake || ""}" placeholder="Tutar">
        <input data-pending-edit="${mode}:${slotIndex}:odds" type="number" step="0.01" value="${row.odds || ""}" placeholder="${isCrypto ? "Net K/Z $" : "Oran"}">
        <div class="v759-pending-actions">
          <button type="button" class="win" data-mode="${mode}" data-slot="${slotIndex}" data-status="win">${resultWin}</button>
          <button type="button" class="loss" data-mode="${mode}" data-slot="${slotIndex}" data-status="loss">${resultLoss}</button>
        </div>
      </div>`;
  }
  function v902BetStakeInput(slot) {
    return document.querySelector(`[data-pending-edit="bet:${slot}:stake"]`) || document.querySelector(`input[data-mode="bet"][data-slot="${slot}"][data-key="stake"]`);
  }
  function v902ResetBetStakeInlineWarning(input) {
    if (!input || input.dataset.v902StakeWarn !== "1") return;
    input.placeholder = input.dataset.v902StakePlaceholder || "Tutar";
    delete input.dataset.v902StakeWarn;
    delete input.dataset.v902StakePlaceholder;
  }
  function v902ShowBetStakeInlineWarning(slot) {
    const input = v902BetStakeInput(slot);
    if (!input) return false;
    if (!input.dataset.v902StakePlaceholder) input.dataset.v902StakePlaceholder = input.getAttribute("placeholder") || "Tutar";
    input.value = "";
    input.placeholder = "Bir tutar gir";
    input.dataset.v902StakeWarn = "1";
    input.focus({ preventScroll: false });
    window.clearTimeout(input._v902StakeTimer);
    input._v902StakeTimer = window.setTimeout(() => {
      if (input.dataset.v902StakeWarn === "1" && !input.value) v902ResetBetStakeInlineWarning(input);
    }, 2200);
    return false;
  }
  function v902BetStakeValue(state, slot) {
    const input = v902BetStakeInput(slot);
    if (input) return Number(input.value || 0);
    return Number(state?.modeSlots?.bet?.[slot]?.stake || 0);
  }

  function addCouponHistoryRecord(state, coupon, status) {
    const totals = couponTotals(coupon.rows);
    const h = loadHistory();
    const now = Date.now();
    const names = coupon.rows.map(s => String(s.name || "").trim()).filter(Boolean);
    const rec = {
      id: "rh_" + now + "_coupon_" + Math.random().toString(36).slice(2),
      mode: "bet",
      ts: now,
      row: coupon.id,
      name: `${coupon.rows.length > 1 ? `Kupon ${coupon.id}` : "Tek Bahis"}: ${names.join(" + ") || "Bahis / maç"}`,
      stake: totals.stake,
      odds: Number(totals.odds.toFixed(4)),
      status,
      pnl: status === "win" ? totals.netProfit : -totals.stake
    };
    h.bet.unshift(rec);
    saveHistory(h);
    coupon.rows.forEach(row => {
      const slot = state.modeSlots.bet[row.index];
      if (!slot) return;
      slot.status = status;
      slot.pnl = row.index === coupon.rows[0].index ? rec.pnl : 0;
      slot.historyId = rec.id;
      slot.historyStatus = status;
    });
  }
  function renderPendingBoard(mode, state) {
    const isCrypto = mode === "crypto";
    if (isCrypto) {
      const rows = pendingRowsForMode(mode, state);
      const totalStake = rows.reduce((sum, s) => sum + Number(s.stake || 0), 0);
      const cryptoTarget = rows.reduce((sum, s) => sum + Math.abs(Number(s.odds || 0)), 0);
      return `
        <div class="v757-pending-board v759-pending-board crypto">
          <div class="v757-pending-head">
            <div>
              <b>Aktif Kripto İşlemleri</b>
              <span>Kutuya yazdığın işlem otomatik aktif işlem sayılır; sonuç verince Geçmiş'e işlenir.</span>
            </div>
            <div class="v757-pending-metrics">
              <span>${rows.length} aktif</span>
              <span>${money(totalStake)} toplam marjin</span>
              <span>${money(cryptoTarget)} net hedef</span>
            </div>
          </div>
          <div class="v759-pending-editor">
            ${rows.length ? rows.map((r, idx) => renderPendingEditRow(mode, r, idx, rows.length)).join("") : `<div class="v759-empty-note">Kutulara kripto işlem/tutar/net K/Z yazınca burada aktif işlem olarak görünür.</div>`}
          </div>
        </div>`;
    }
    const grouped = getBetCouponGroups(state);
    const totalRows = grouped.rows.length;
    const singleCards = grouped.singles.length ? `
      <div class="v759-pending-section">
        <h4>Tek Bahisler <span>${grouped.singles.length}</span></h4>
        <div class="v759-pending-editor">${grouped.singles.map((r, idx) => renderPendingEditRow("bet", r, idx, totalRows)).join("")}</div>
      </div>` : "";
    const couponCards = grouped.coupons.length ? grouped.coupons.map(coupon => {
      const totals = couponTotals(coupon.rows);
      const showNumbered = grouped.coupons.length > 1;
      return `
        <div class="v759-coupon-card">
          <div class="v759-coupon-head">
            <div>
              <b>${showNumbered ? `Kupon ${coupon.id}` : "Kombine Kupon"}</b>
              <span>Bahis Türü: Kombine · ${coupon.rows.length} maç</span>
            </div>
            <div class="v759-coupon-actions">
              <button type="button" class="win" data-settle-coupon="${coupon.id}:win">KAZANDI</button>
              <button type="button" class="loss" data-settle-coupon="${coupon.id}:loss">KAYBETTİ</button>
            </div>
          </div>
          <div class="v759-coupon-metrics">
            <span>Bahis tutarı <b>${money(totals.stake)}</b></span>
            <span>Toplam oran <b>${totals.odds ? totals.odds.toFixed(2) : "-"}</b></span>
            <span title="Kazanırsa geri alınacak toplam tutar">Olası dönüş <b>${totals.possibleReturn ? money(totals.possibleReturn) : "-"}</b></span>
            <span>Net kâr <b>${totals.netProfit ? money(totals.netProfit) : "-"}</b></span>
          </div>
          <div class="v759-pending-editor">${coupon.rows.map((r, idx) => renderPendingEditRow("bet", r, idx, totalRows)).join("")}</div>
        </div>`;
    }).join("") : "";
    return `
      <div class="v757-pending-board v759-pending-board bet">
        <div class="v757-pending-head">
          <div>
            <b>Aktif Bahisler / Kuponlar</b>
            <span>Tek bahis ve kombine kuponlar ayrı görünür. Kombine için kupon numarasını satırdan değiştirebilirsin.</span>
          </div>
          <div class="v757-pending-metrics">
            <span>${grouped.singles.length} tek</span>
            <span>${grouped.coupons.length} kupon</span>
            <span>${totalRows} aktif maç</span>
          </div>
        </div>
        ${singleCards || ""}
        ${couponCards || ""}
        ${!totalRows ? `<div class="v759-empty-note">Kutulara maç/seçim, tutar ve oran yazınca burada aktif bahis veya kupon olarak görünür.</div>` : ""}
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
              <b>${isCrypto ? "KRİPTO GEÇMİŞ / RAPOR" : "BAHİS GEÇMİŞ / RAPOR"}</b>
              <span>Sonuçlanan kayıtlar, silme işlemleri ve rapor görselleri tek merkezde.</span>
            </div>
            <button type="button" data-log-center-close>×</button>
          </div>
          <div class="v753-log-strip v757-log-strip-modal v758-log-strip-modal">
            <div><span>Bugün</span><b>${today.length} kayıt</b><em class="${pnl(today) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(today))}</em></div>
            <div><span>Bu Hafta</span><b>${week.length} kayıt</b><em class="${pnl(week) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(week))}</em></div>
            <div><span>Bu Ay</span><b>${month.length} kayıt</b><em class="${pnl(month) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(month))}</em></div>
            <button type="button" data-report-create="${mode}"><i class="fa-solid fa-image"></i> Rapor Resmi Oluştur</button>
          </div>
          <div class="v512-history-filters v758-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v758-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z / Sil</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
          <div class="v756-report-actions v758-report-actions">
            <span>Rapor görselleri sitede görünür, indirilebilir, manuel silinebilir ve 7 gün sonra otomatik temizlenir.</span>
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
              <b>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR"}</b>
              <span>Kutulara yazdığın satırlar otomatik aktif olarak burada toplanır; sonuç verince Geçmiş'e gider.</span>
            </div>
            <button type="button" data-pending-close>×</button>
          </div>
          ${renderPendingBoard(mode, state)}
        </section>
      </div>`;
  }

  function createSlot(type = "bet", i = 0) {
    return { id: i + 1, type, name: "", stake: "", odds: type === "bet" ? "1.30" : "", cryptoPnlMode: type === "crypto" ? "amount" : "odds", status: "pending", pnl: 0 };
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
    state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = i + 1; });
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
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls"><span>${count}/20 ${label}</span><button type="button" data-row-op="${mode}:minus" title="Alan azalt">−</button><button type="button" data-row-op="${mode}:plus" title="Alan ekle">+</button><button type="button" data-row-preset="${mode}:5">5</button><button type="button" data-row-preset="${mode}:10">10</button><button type="button" data-row-preset="${mode}:20">20</button><button type="button" class="v758-row-tool v759-row-tool active" data-pending-open="${mode}"><i class="fa-solid fa-list-check"></i> ${pendingLabel}</button><button type="button" class="v758-row-tool history" data-log-center="${mode}"><i class="fa-solid fa-clock-rotate-left"></i> Geçmiş</button><button type="button" class="v758-row-tool report" data-report-create="${mode}"><i class="fa-solid fa-image"></i> Rapor</button></div>`;
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
    return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table"><thead><tr><th></th><th>#</th><th>Tür</th><th>${noteHead}</th><th>Tutar</th><th>${valHead}</th><th>Durum</th><th>${pnlHead}</th><th>İşlem</th></tr></thead><tbody>${visible.map((s, i) => {
      const status = s.status === "win" ? winText : s.status === "loss" ? lossText : "BEKLİYOR";
      const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
      return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell"><span class="rolling-v47-type ${mode}">${isCrypto ? "Kripto" : "Bahis"}</span></div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePH}"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds || ""}" placeholder="${isCrypto ? "Net K/Z $" : "Oran"}"></td><td><span class="v757-status-pill ${s.status === "win" || s.status === "loss" ? s.status : "pending"}">${status}</span></td><td class="${pnlClass}">${money(s.pnl || 0)}</td><td><div class="rolling-v47-actions v757-actions"><button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win">${winText}</button><button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss">${lossText}</button></div></td></tr>`;
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
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-active-title" : "rolling-v493-fold-title bet rolling-v494-combine-title"}"><i class="fa-solid ${isCrypto ? "fa-chart-simple" : "fa-list-check"}"></i> <span>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "KOMBİNE KUPON MAÇLARI"}</span></summary>
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
      <div class="rolling-v495-quick-plan v755-target-plan v756-target-plan v757-target-plan v759-target-plan">
        <div class="v756-target-title v757-target-title v758-target-title v759-target-title">
          <b>Rolling Hedef Takibi</b>
        </div>
        <div class="v759-target-layout">
          <div class="v759-target-edit">
            <h4>Hedef Ayarları</h4>
            <label><span>Başlangıç $</span><input type="number" step="1" data-rolling-quick="start" value="${plan.start}"></label>
            <label><span>Hedef $</span><input type="number" step="1" data-rolling-quick="target" value="${plan.target || ""}" placeholder="Hedef gir"></label>
            <label><span>Manuel Güncel $</span><input type="number" step="1" data-rolling-quick="currentOverride" value="${plan.hasManualCurrent ? plan.current : ""}" placeholder="Otomatik kullan"></label>
          </div>
          <div class="v759-target-status">
            <h4>İlerleme Özeti</h4>
            <div class="v759-target-flow"><span>Başlangıç <b>${money(plan.start)}</b></span><i>→</i><span>Güncel <b class="${plan.pnl >= 0 ? "pos" : "neg"}">${money(plan.current)}</b></span><i>→</i><span>Hedef <b>${plan.target ? money(plan.target) : "Bekliyor"}</b></span></div>
            <div class="v759-target-pnl"><strong class="${plan.pnl >= 0 ? "pos" : "neg"}">${signedMoney(plan.pnl)}</strong><em>${pctText(plan.growth)} büyüme</em><small>Otomatik güncel: ${money(plan.autoCurrent)}</small></div>
            <div class="v759-target-bar"><u style="width:${plan.pct.toFixed(1)}%"></u></div>
            <div class="v755-target-actions v756-target-actions v757-target-actions v759-target-actions">
              <button type="button" class="v755-target-complete" data-target-complete ${plan.done ? "" : "disabled"}><i class="fa-solid fa-check"></i> HEDEFİ BİTİR</button>
              <button type="button" class="v755-target-reset" data-target-reset>YENİ HEDEF</button>
            </div>
          </div>
        </div>
        <details class="v756-target-log-fold v757-target-log-fold v759-target-log-fold">
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
        if (String(list[i].name || "").trim() || Number(list[i].stake || 0) || Number(list[i].odds || 0)) {
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
      HISTORY_FILTER = "today";
      renderModule();
    }));
    mount.querySelectorAll("[data-history-close]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = null;
      renderModule();
    }));
    mount.querySelectorAll("[data-log-center]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = btn.dataset.logCenter === "crypto" ? "crypto" : "bet";
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      renderModule();
    }));
    mount.querySelectorAll("[data-pending-open]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = btn.dataset.pendingOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
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
      if (mode === "bet" && !list[i].betType) list[i].betType = key === "betType" ? input.value : betDisplayType(list[i], activeRowsForMode("bet", state).length);
      if (mode === "bet" && !list[i].couponId) list[i].couponId = 1;
      if (String(list[i].name || "").trim() || Number(list[i].stake || 0) || Number(list[i].odds || 0)) {
        if (list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
      }
      if (mode === "crypto" && key === "odds") list[i].cryptoPnlMode = "amount";
      recalcSlot(list[i]);
      saveState(state);
      renderModule();
    }));
    mount.querySelectorAll('[data-pending-edit$=":stake"], input[data-mode="bet"][data-key="stake"]').forEach(input => {
      input.addEventListener("input", () => v902ResetBetStakeInlineWarning(input));
    });
    mount.querySelectorAll("[data-settle-coupon]").forEach(btn => btn.addEventListener("click", () => {
      const [couponRaw, status] = String(btn.dataset.settleCoupon || "1:win").split(":");
      const couponId = Math.max(1, Math.min(4, Number(couponRaw || 1)));
      const grouped = getBetCouponGroups(state);
      const coupon = grouped.coupons.find(c => c.id === couponId);
      if (!coupon || !coupon.rows.length) return;
      const totals = couponTotals(coupon.rows);
      if (!totals.stake) {
        const warnSlot = Number(coupon.rows[0]?.index || 0);
        v902ShowBetStakeInlineWarning(warnSlot);
        return;
      }
      CONFIRM_DIALOG = {
        type: "settleCoupon",
        couponId,
        status: status === "loss" ? "loss" : "win",
        tone: status === "loss" ? "danger" : "success",
        title: "Kupon sonucunu kaydet",
        message: `Kupon ${couponId} için ${status === "loss" ? "KAYBETTİ" : "KAZANDI"} sonucu kaydedilecek.`,
        detail: `${coupon.rows.length} maç · Bahis tutarı ${money(totals.stake)} · Olası dönüş ${money(totals.possibleReturn)}. Denemeyse iptal et.`,
        confirmText: status === "loss" ? "KAYBETTİ olarak kaydet" : "KAZANDI olarak kaydet"
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
      } else if (action.type === "settleCoupon") {
        const fresh = loadState();
        const coupon = getBetCouponGroups(fresh).coupons.find(c => c.id === Number(action.couponId || 1));
        if (coupon) {
          addCouponHistoryRecord(fresh, coupon, action.status === "loss" ? "loss" : "win");
          saveState(fresh);
        }
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
        if (mode === "bet" && !v902BetStakeValue(state, i)) {
          v902ShowBetStakeInlineWarning(i);
          return;
        }
        const label = mode === "crypto" ? "kripto işlem" : "bahis / maç";
        const resultLabel = nextStatus === "win" ? (mode === "crypto" ? "KAZANÇ" : "KAZANDI") : (mode === "crypto" ? "KAYIP" : "KAYBETTİ");
        const name = String(list[i].name || "").trim() || `${label} #${i + 1}`;
        CONFIRM_DIALOG = {
          type: "settle",
          mode,
          slot: i,
          status: nextStatus,
          tone: nextStatus === "loss" ? "danger" : "success",
          title: "Sonucu kaydetmeden önce onayla",
          message: `${name} için sonuç: ${resultLabel}.`,
          detail: "Bu kayıt Geçmiş/Rapor merkezine işlenecek. Deneme tıklamasıysa iptal et.",
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
    LOG_CENTER_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    HISTORY_FILTER = "today";
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
