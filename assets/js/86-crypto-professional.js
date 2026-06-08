// ===============================
// V32 PROFESSIONAL UPGRADE
// Ses paneli, Rolling + işlem sayısı, kasa boş durumları ve küçük UI temizlikleri.
// ===============================

(function () {
  const SOUND_KEY = "v28_alarm_audio_settings";
  const POPULAR = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","TON","TRX","DOT","MATIC","NEAR","ATOM","APT","ARB","OP","INJ","SUI","PEPE","WIF","FET","RNDR","LTC","BCH","ETC","UNI","AAVE","FIL"];

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function getSoundSettings() {
    try {
      return {
        enabled: false,
        sound: "digital",
        volume: 0.75,
        durationSec: 60,
        customDataUrl: "",
        customName: "",
        customStart: 0,
        customEnd: 0,
        ...JSON.parse(localStorage.getItem(SOUND_KEY) || "{}")
      };
    } catch {
      return { enabled: false, sound: "digital", volume: 0.75, durationSec: 60, customDataUrl: "", customName: "", customStart: 0, customEnd: 0 };
    }
  }

  function setSoundSettings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next };
    merged.volume = 1;
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  let v499fPreviewAudio = null;
  let v499fPreviewUrl = "";
  let v499fPreviewTimer = null;
  let v499fDuration = 1;

  function v499fFormat(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v499fSettings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next, enabled: true, volume: 1 };
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function v499fStopPreview() {
    if (v499fPreviewTimer) {
      clearTimeout(v499fPreviewTimer);
      v499fPreviewTimer = null;
    }
    if (v499fPreviewAudio) {
      try { v499fPreviewAudio.pause(); } catch {}
    }
    if (v499fPreviewUrl) {
      try { URL.revokeObjectURL(v499fPreviewUrl); } catch {}
    }
    v499fPreviewAudio = null;
    v499fPreviewUrl = "";
    qs("#v499f-play-custom")?.classList.remove("playing");
    qs("#v32-sound-test")?.classList.remove("testing");
    const top = qs("#v32-sound-test");
    if (top) top.textContent = "OYNAT";
  }

  async function v499fRows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v499fSelectedRow() {
    const id = qs("#v47-custom-select")?.value || (window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "");
    if (!id) return null;
    const rows = await v499fRows();
    return rows.find(r => r.id === id) || null;
  }

  function v499fGetSegment() {
    const max = Math.max(1, Number(qs("#v499f-start")?.max || qs("#v499f-end")?.max || v499fDuration || 1));
    let start = Math.max(0, Math.min(max - 1, Number(qs("#v499f-start")?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(qs("#v499f-end")?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    const s = qs("#v499f-start");
    const e = qs("#v499f-end");
    if (s) s.value = Math.floor(start);
    if (e) e.value = Math.floor(end);
    return { start, end, max };
  }

  function v499fUpdateUI(current = null) {
    const { start, end, max } = v499fGetSegment();
    const label = qs("#v499f-range-label");
    const cur = qs("#v499f-current");
    const total = qs("#v499f-total");
    const fill = qs("#v499f-fill");
    const progress = qs("#v499f-progress");
    const startHandle = qs("#v499f-start-handle");
    const endHandle = qs("#v499f-end-handle");

    if (label) label.textContent = `${v499fFormat(start)} - ${v499fFormat(end)}`;
    if (cur) cur.textContent = v499fFormat(current == null ? Number(progress?.value || start) : current);
    if (total) total.textContent = v499fFormat(max);

    const left = (start / max) * 100;
    const right = (end / max) * 100;
    const width = Math.max(0, right - left);

    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.width = `${width}%`;
    }
    if (startHandle) {
      startHandle.style.left = `${left}%`;
      startHandle.textContent = "[";
    }
    if (endHandle) {
      endHandle.style.left = `${right}%`;
      endHandle.textContent = "]";
    }
    if (progress) {
      progress.max = max;
      if (current != null) progress.value = Math.min(max, Math.max(0, Math.floor(current)));
    }
  }

  async function v499fLoadMeta() {
    const row = await v499fSelectedRow();
    if (!row?.blob) {
      v499fDuration = 1;
      ["#v499f-progress", "#v499f-start", "#v499f-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = 1;
      });
      v499fUpdateUI(0);
      return;
    }

    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(a.duration || 1));
      v499fDuration = total;
      const st = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
      const start = Math.max(0, Math.min(total - 1, Number(st.customStart || 0)));
      const rawEnd = Number(st.customEnd || 0);
      const end = rawEnd > start ? Math.min(total, rawEnd) : total;

      ["#v499f-progress", "#v499f-start", "#v499f-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = total;
      });
      const s = qs("#v499f-start");
      const e = qs("#v499f-end");
      if (s) s.value = Math.floor(start);
      if (e) e.value = Math.floor(end);
      v499fUpdateUI(start);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  async function v499fPlayCustomPreview() {
    const row = await v499fSelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }
    v499fStopPreview();

    const { start, end } = v499fGetSegment();
    v499fPreviewUrl = URL.createObjectURL(row.blob);
    v499fPreviewAudio = new Audio(v499fPreviewUrl);
    v499fPreviewAudio.volume = 1;

    v499fPreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v499fPreviewAudio.duration || 1));
      const safeStart = Math.min(start, total - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : total, total);
      v499fPreviewAudio.currentTime = safeStart;
      v499fUpdateUI(safeStart);

      v499fPreviewAudio.ontimeupdate = () => {
        if (!v499fPreviewAudio) return;
        v499fUpdateUI(v499fPreviewAudio.currentTime);
        if (v499fPreviewAudio.currentTime >= safeEnd) v499fStopPreview();
      };
      v499fPreviewAudio.onended = v499fStopPreview;
      v499fPreviewAudio.onerror = v499fStopPreview;

      qs("#v499f-play-custom")?.classList.add("playing");
      const top = qs("#v32-sound-test");
      if (top) {
        top.classList.add("testing");
        top.textContent = "ÇALIYOR...";
      }

      try {
        await v499fPreviewAudio.play();
        v499fPreviewTimer = setTimeout(v499fStopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v499fStopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v499fPlaySelectedSound() {
    const type = qs("#v32-sound-type")?.value || "digital";
    if (type === "custom") return v499fPlayCustomPreview();

    v499fStopPreview();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v499fSettings({ sound: type, volume: 1, enabled: true });
    const top = qs("#v32-sound-test");
    if (top) {
      top.classList.add("testing");
      top.textContent = "ÇALIYOR...";
    }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
    setTimeout(() => {
      if (top) {
        top.classList.remove("testing");
        top.textContent = "OYNAT";
      }
    }, 1200);
  }

  function v499fBindTimeline() {
    const track = qs("#v499f-track");
    const startInput = qs("#v499f-start");
    const endInput = qs("#v499f-end");
    if (!track || !startInput || !endInput || track.dataset.bound === "v499f") return;
    track.dataset.bound = "v499f";

    const secFromEvent = ev => {
      const rect = track.getBoundingClientRect();
      const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const max = Math.max(1, Number(startInput.max || endInput.max || v499fDuration || 1));
      return Math.round(pct * max);
    };

    let mode = null;
    let offset = 0;

    const choose = (sec, target) => {
      const { start, end } = v499fGetSegment();
      if (target?.id === "v499f-start-handle") return "start";
      if (target?.id === "v499f-end-handle") return "end";
      if (target?.id === "v499f-fill" || (sec > start && sec < end)) {
        offset = sec - start;
        return "range";
      }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "start" : "end";
    };

    const apply = sec => {
      const { start, end, max } = v499fGetSegment();
      const len = Math.max(1, end - start);
      if (mode === "start") {
        startInput.value = Math.min(sec, end - 1);
      } else if (mode === "end") {
        endInput.value = Math.max(sec, start + 1);
      } else if (mode === "range") {
        const newStart = Math.max(0, Math.min(max - len, sec - offset));
        startInput.value = Math.floor(newStart);
        endInput.value = Math.floor(newStart + len);
      }
      v499fUpdateUI();
    };

    const down = ev => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      mode = choose(sec, ev.target);
      apply(sec);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };
    const move = ev => {
      ev.preventDefault();
      if (mode) apply(secFromEvent(ev));
    };
    const up = () => {
      mode = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };

    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });
  }

  function renderSoundPanel(force = false) {
    if (typeof window.V512RenderSoundCenter === "function") {
      window.V512RenderSoundCenter(!!force);
    }
  }

  

  async function renderSoundLibrary() {
    const select = qs("#v47-custom-select");
    if (!select || !window.V26AlarmAudio?.listCustomFiles) return;

    const s = window.V26AlarmAudio.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    const files = await window.V26AlarmAudio.listCustomFiles();

    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const size = file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "";
      return `<option value="${file.id}" ${active ? "selected" : ""}>${active ? "✓ " : ""}${file.name}${size ? " · " + size : ""}</option>`;
    }).join("");

    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";

    const note = qs("#v499f-file-note");
    if (note) {
      const text = current ? "Aktif: " + current.name : "Dosya seçilmedi";
      note.textContent = text;
      note.title = text;
    }
  }

  function prepareCryptoForm() {
    let list = qs("#crypto-symbol-list");
    if (!list) {
      list = document.createElement("datalist");
      list.id = "crypto-symbol-list";
      document.body.appendChild(list);
    }
    list.innerHTML = POPULAR.map(s => `<option value="${s}">${s}USDT</option>`).join("");

    qsa(".crypto-v28-tab").forEach(btn => {
      const panel = btn.dataset.cryptoPanel;
      if (panel === "graph") btn.querySelector("span") && (btn.querySelector("span").textContent = "Grafik");
      if (panel === "plan") btn.querySelector("span") && (btn.querySelector("span").textContent = "İşlem");
      if (panel === "alarm") btn.querySelector("span") && (btn.querySelector("span").textContent = "Alarm");
      if (panel === "sound") btn.querySelector("span") && (btn.querySelector("span").textContent = "Ses");
      if (panel === "settings") btn.querySelector("span") && (btn.querySelector("span").textContent = "Ayar");
    });
  }

  function fixFinanceEmptyState() {
    const chart = qs("#omega-apex-chart-main");
    if (!chart) return;
    const values = (() => {
      try { return JSON.parse(localStorage.getItem("v19_h") || "[]"); } catch { return []; }
    })();

    if (!values || values.length <= 1) {
      chart.innerHTML = `<div class="v32-empty-chart"><div><b>Henüz bakiye geçmişi yok</b><span>İlk işlem veya kasa güncellemesi sonrası grafik oluşacak.</span></div></div>`;
    }
  }

  function ensureRollingPlan() {
    const mode = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    const key = (typeof window.omega_GetRollingPlanKeyV47 === "function") ? window.omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS) : `${mode}_${_ACTIVE_EXCEL_DAYS}`;
    if (!_ROLLING_DB[key]) _ROLLING_DB[key] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {}, mode, days: _ACTIVE_EXCEL_DAYS };
    const plan = _ROLLING_DB[key];
    plan.mode = mode;
    plan.days = _ACTIVE_EXCEL_DAYS;
    if (!plan.targetBal) plan.targetBal = ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
    if (!plan.ops) plan.ops = {};
    return plan;
  }

  function setDayCount(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    plan.ops[day].push(null);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    if (plan.ops[day].length > 1) plan.ops[day].pop();
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = setDayCount;

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = [];
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  function v763EscapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function v763ComboRows(day, slot) {
    return Array.from(document.querySelectorAll(`[data-v763-extra-row="${day}:${slot}"]`)).map(row => ({
      note: (row.querySelector(`[data-v763-extra-note]`)?.value || "").trim(),
      odds: Number(row.querySelector(`[data-v763-extra-odds]`)?.value || 0)
    })).filter(x => x.note || x.odds);
  }

  window.omega_RollingToggleComboRow = function(day, slot, dir) {
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return;
    const list = kapsul.querySelector(".v765-extra-match-list");
    if (!list) return;
    if (dir === "minus") {
      const rows = list.querySelectorAll(".v765-extra-match-row");
      rows[rows.length - 1]?.remove();
      return;
    }
    const count = list.querySelectorAll(".v765-extra-match-row").length + 2;
    const row = document.createElement("div");
    row.className = "v765-extra-match-row";
    row.setAttribute("data-v763-extra-row", `${day}:${slot}`);
    row.innerHTML = `<input type="text" data-v763-extra-note placeholder="Maç"><input type="number" data-v763-extra-odds placeholder="Oran" step="0.01">`;
    list.appendChild(row);
    row.querySelector("input")?.focus();
  };

  function v763BetTotalOdds(primary, comboRows) {
    let total = Number(primary || 0);
    if (!total) return 0;
    comboRows.forEach(row => {
      const o = Number(row.odds || 0);
      if (o) total *= o;
    });
    return total;
  }

  function v763DayToolButtons(mode) {
    const activeLabel = mode === "crypto" ? "Aktif Kripto İşlemleri" : "Aktif Bahisler / Kuponlar";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls v767-excel-feature-controls" data-v767-feature-controls="${mode}">
      <button type="button" class="v758-row-tool v759-row-tool active" data-v767-feature-open="${mode}:active" onclick="return window.omega_RollingExcelOpenFeature(event, '${mode}', 'active')">${activeLabel}</button>
      <button type="button" class="v758-row-tool v759-row-tool history" data-v767-feature-open="${mode}:history" onclick="return window.omega_RollingExcelOpenFeature(event, '${mode}', 'history')">Geçmiş</button>
      <button type="button" class="v758-row-tool v759-row-tool report" data-v767-feature-open="${mode}:report" onclick="return window.omega_RollingExcelOpenFeature(event, '${mode}', 'report')">Rapor</button>
    </div>`;
  }

  window.omega_RollingExcelOpenFeature = function(event, mode = "bet", kind = "active") {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    if (typeof window.omega_RollingOpenFloatingPanel === "function") {
      window.omega_RollingOpenFloatingPanel(k, m);
      setTimeout(() => {
        const host = document.getElementById("omega-rolling-feature-host");
        if (host) {
          host.style.display = "block";
          host.style.position = "relative";
          host.style.zIndex = "100600";
        }
      }, 0);
      return false;
    }
    // Son güvenlik: 70-rolling-core eski kalırsa buton pasif görünmesin.
    if (k === "history" && typeof window.omega_RollingOpenLogCenter === "function") window.omega_RollingOpenLogCenter(m);
    else if (k === "report" && typeof window.omega_RollingOpenReportCenter === "function") window.omega_RollingOpenReportCenter(m);
    else if (typeof window.omega_RollingOpenPendingBoard === "function") window.omega_RollingOpenPendingBoard(m);
    return false;
  };

  if (!window.__omegaV766ExcelFeatureDelegationBound) {
    window.__omegaV766ExcelFeatureDelegationBound = true;
    document.addEventListener("click", function(event) {
      const btn = event.target.closest && event.target.closest("[data-v767-feature-open], [data-v766-feature-open]");
      if (!btn) return;
      const [modeRaw, kindRaw] = String(btn.dataset.v767FeatureOpen || btn.dataset.v766FeatureOpen || "bet:active").split(":");
      window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
    }, true);
  }

  function v765BindExcelFeatureControls(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-v767-feature-open], [data-v766-feature-open]").forEach(btn => {
      if (btn.dataset.v767Bound === "1") return;
      btn.dataset.v767Bound = "1";
      btn.addEventListener("click", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v767FeatureOpen || btn.dataset.v766FeatureOpen || "bet:active").split(":");
        window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
      });
    });
  }

  window.omega_RenderExcelTable = function() {
    const wrapper = qs("#excel-body-content");
    if (!wrapper) return;
    const currentPlan = ensureRollingPlan();
    const rollModeV491 = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    const isCryptoV491 = rollModeV491 === "crypto";
    const overlayV493 = qs("#rolling-excel-overlay");
    if (overlayV493) overlayV493.setAttribute("data-roll-mode", rollModeV491);
    let runningBalance = Number(currentPlan.startBal || 100);
    let totalProfit = 0;
    let htmlBuffer = "";

    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
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
          const baseOdds = Number(op.odds || 0);
          const comboRows = Array.isArray(op.combo) ? op.combo : [];
          const totalOdds = isCryptoV491 ? baseOdds : v763BetTotalOdds(baseOdds, comboRows);
          const pnl = isCryptoV491 ? Math.abs(baseOdds) : (op.res === "win" ? (amt * totalOdds) - amt : amt);
          const effect = op.res === "win" ? pnl : -pnl;
          runningBalance += effect; totalProfit += effect; dayProfit += effect;
          const title = isCryptoV491
            ? (op.note || "İşlem")
            : (comboRows.length ? "Kombine" : (op.note || "Maç"));
          const detail = isCryptoV491
            ? `$${amt} · Net $${Number(baseOdds || 0).toFixed(2)}`
            : (comboRows.length ? `${comboRows.length + 1} maç · $${amt} x ${Number(totalOdds || 0).toFixed(2)}` : `$${amt} x ${baseOdds}`);
          const comboHtml = (!isCryptoV491 && comboRows.length) ? `<ul class="v763-result-combo-list"><li>${v763EscapeHtml(op.note || "Maç")} <b>${Number(baseOdds || 0).toFixed(2)}</b></li>${comboRows.map(row => `<li>${v763EscapeHtml(row.note || "Maç")} <b>${Number(row.odds || 0).toFixed(2)}</b></li>`).join("")}</ul>` : "";
          cards.push(`
            <div class="kapsul v32 ${op.res}">
              <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
              <div class="k-result">
                <div class="k-note-show">${v763EscapeHtml(title)}</div>
                <b>${detail}</b>
                <span>${effect >= 0 ? '+' : '-'}$${Math.abs(effect).toFixed(2)}</span>
                ${comboHtml}
              </div>
            </div>
          `);
        } else {
          cards.push(`
            <div class="kapsul v32 ${isCryptoV491 ? "" : "v765-bet-kapsul"}" data-v765-kapsul="${day}:${slot}">
              ${isCryptoV491 ? `
                <input type="text" id="e-n-${day}-${slot}" placeholder="İşlem">
                <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                <input type="number" id="e-o-${day}-${slot}" placeholder="Net K/Z $">
              ` : `
                <div class="v765-bet-entry">
                  <div class="v765-match-line">
                    <div class="v765-inline-combo-controls">
                      <button type="button" onclick="omega_RollingToggleComboRow(${day}, ${slot}, 'plus')" title="Maç + oran ekle">+</button>
                      <button type="button" onclick="omega_RollingToggleComboRow(${day}, ${slot}, 'minus')" title="Son ek maçı sil">−</button>
                    </div>
                    <input type="text" id="e-n-${day}-${slot}" placeholder="Maç">
                  </div>
                  <input type="number" id="e-o-${day}-${slot}" placeholder="Oran" step="0.01">
                  <div class="v765-extra-match-list"></div>
                  <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar" step="0.01">
                </div>
              `}
              <div class="k-actions v32">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">${isCryptoV491 ? "KAZANÇ" : "KAZANDI"}</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">${isCryptoV491 ? "KAYIP" : "KAYBETTİ"}</button>
              </div>
            </div>
          `);
        }
      }

      htmlBuffer += `
        <div class="day-row-capsule v32">
          <div class="day-info-v32">
            <h3>GÜN ${day}</h3>
            <span>Başlangıç: $${dayStart.toFixed(2)}</span>
            <span>${isCryptoV491 ? "Gün P/L" : "Gün K/Z"}: ${(dayProfit >= 0 ? "+" : "")}$${dayProfit.toFixed(2)}</span>
            <div class="day-tools-v32">
              <button class="gold" onclick="omega_RollingAddSlot(${day})">+ İŞLEM</button>
              <button onclick="omega_RollingRemoveSlot(${day})">- SİL</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 10)">10</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 20)">20</button>
              <button onclick="omega_RollingClearDay(${day})">TEMİZLE</button>
            </div>
            ${day === 1 ? v763DayToolButtons(rollModeV491) : ""}
          </div>
          <div class="capsule-container v32">${cards.join("")}</div>
          <div class="day-result v32"><small>Gün Sonu</small>$${runningBalance.toFixed(2)}</div>
        </div>
      `;
    }

    wrapper.innerHTML = htmlBuffer;
    v765BindExcelFeatureControls(wrapper);

    const current = qs("#excel-current-bal");
    if (current) current.innerText = `$${runningBalance.toFixed(2)}`;

    const pnlElement = qs("#excel-pnl");
    if (pnlElement) {
      pnlElement.innerText = (totalProfit >= 0 ? "+" : "") + "$" + totalProfit.toFixed(2);
      pnlElement.style.color = totalProfit >= 0 ? "var(--green)" : "var(--red)";
    }

    const targetBal = currentPlan.targetBal || ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
    const progressPercentage = Math.min((runningBalance / targetBal) * 100, 100);
    const progressBar = qs("#excel-progress-bar");
    if (progressBar) progressBar.style.width = progressPercentage + "%";

    omega_SaveRollingDB();
  };

  window.omega_ResolveExcelOp = function(day, slot, result) {
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const isCrypto = localStorage.getItem("finance_rolling_mode") === "crypto";
    const amt = parseFloat(document.getElementById(`e-a-${day}-${slot}`)?.value);
    const odds = parseFloat(document.getElementById(`e-o-${day}-${slot}`)?.value);
    const comboRows = isCrypto ? [] : v763ComboRows(day, slot);
    const hasComboGap = comboRows.some(row => !row.note || !Number(row.odds || 0));
    if (isNaN(amt) || isNaN(odds) || (!isCrypto && hasComboGap)) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast(isCrypto ? "Tutar ve Net K/Z $ alanını doldur." : "Maç, oran, tutar ve ek maç oranlarını doldur.");
      return;
    }
    if (!note) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast(isCrypto ? "İşlem adını yaz." : "Maç adını yaz.");
      return;
    }
    const currentPlan = ensureRollingPlan();
    if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
    currentPlan.ops[day][slot] = { note, amt, odds, combo: comboRows, res: result, netMode: isCrypto ? "amount" : "odds" };
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  const oldOpenRolling = window.omega_OpenRollingExcel;
  window.omega_OpenRollingExcel = function(days, skipHash = false) {
    const result = typeof oldOpenRolling === "function" ? oldOpenRolling(days, skipHash) : undefined;
    document.documentElement.classList.remove("rolling-hash-boot");
    document.body.classList.add("rolling-active");
    if(!skipHash) {
      const baseHash = (document.getElementById("omega-rolling-block") && getComputedStyle(document.getElementById("omega-rolling-block")).display !== "none") ? "rolling" : "finance";
      history.replaceState(null, "", `#${baseHash}/rolling/${days}`);
    }
    return result;
  };

  
  document.addEventListener("click", function(e) {
    const disabled = e.target.closest(".crypto-v28-tab-disabled");
    if(disabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  function reviveRollingFromHashV39() {
    const m = String(location.hash || "").match(/^#(?:finance|rolling)\/rolling\/(\d+)/);
    if (!m) return;
    const days = Number(m[1]);
    if ([7,15,30,60,90].includes(days) && typeof window.omega_OpenRollingExcel === "function") {
      setTimeout(() => window.omega_OpenRollingExcel(days, true), 60);
    }
  }

  
  function omega_RemoveOldRollingLaunchCardV46A2() {
    document.querySelectorAll(".finance-rolling-launch-card, .finance-rolling-selector, .finance-rolling-options").forEach(el => {
      const card = el.closest(".finance-card") || el;
      if (card && card.parentNode) card.remove();
    });
  }

function boot() {
    omega_RemoveOldRollingLaunchCardV46A2();
    prepareCryptoForm();
    renderSoundPanel();
    fixFinanceEmptyState();
    reviveRollingFromHashV39();
    setTimeout(() => {
      if (location.hash === "#crypto") prepareCryptoForm();
      if (location.hash.startsWith("#finance")) fixFinanceEmptyState();
    }, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 120));
  else setTimeout(boot, 120);

  window.addEventListener("hashchange", () => setTimeout(boot, 120));
})();
