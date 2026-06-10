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
    if (!plan.pending) plan.pending = {};
    if (!plan.slotCounts) plan.slotCounts = {};
    return plan;
  }

  function v780DefaultSlotCount(day) {
    return Number(day) === 1 ? 4 : 1;
  }

  function v780HasPendingData(plan, day) {
    const rows = plan?.pending?.[day] || {};
    return Object.values(rows).some(row => {
      if (!row) return false;
      if (String(row.note || '').trim()) return true;
      if (String(row.amt || '').trim()) return true;
      if (String(row.odds || '').trim()) return true;
      return Array.isArray(row.combo) && row.combo.some(x => String(x?.note || '').trim() || Number(x?.odds || 0));
    });
  }

  function v780HasResolvedData(plan, day) {
    return (plan?.ops?.[day] || []).some(Boolean);
  }

  function v780DesiredSlotCount(plan, day) {
    const custom = Number(plan?.slotCounts?.[day] || 0);
    if (custom > 0) return Math.max(1, Math.min(20, custom));
    return v780DefaultSlotCount(day);
  }

  function v780EnsureDaySlots(plan, day) {
    if (!plan.ops[day]) plan.ops[day] = [];
    const desired = v780DesiredSlotCount(plan, day);
    const hasData = v780HasResolvedData(plan, day) || v780HasPendingData(plan, day);
    const hasCustom = Number(plan?.slotCounts?.[day] || 0) > 0;
    if (!hasCustom && !hasData && plan.ops[day].length !== desired) {
      plan.ops[day] = new Array(desired).fill(null);
      return;
    }
    if (plan.ops[day].length < desired) {
      while (plan.ops[day].length < desired) plan.ops[day].push(null);
    }
    if (!hasCustom && hasData && plan.ops[day].length < desired) {
      while (plan.ops[day].length < desired) plan.ops[day].push(null);
    }
    if (plan.ops[day].length < 1) plan.ops[day] = new Array(desired).fill(null);
  }

  function setDayCount(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    const nextLength = Math.max(count, plan.ops[day].filter(Boolean).length);
    plan.slotCounts[day] = Math.max(1, Math.min(20, nextLength));
    plan.ops[day].length = nextLength;
    if (plan.pending?.[day]) {
      Object.keys(plan.pending[day]).forEach(slot => {
        if (Number(slot) >= nextLength) delete plan.pending[day][slot];
      });
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    v780EnsureDaySlots(plan, day);
    plan.ops[day].push(null);
    plan.slotCounts[day] = Math.max(1, Math.min(20, plan.ops[day].length));
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    if (plan.ops[day].length > 1) {
      const removedSlot = plan.ops[day].length - 1;
      plan.ops[day].pop();
      if (plan.pending?.[day]) delete plan.pending[day][removedSlot];
      plan.slotCounts[day] = Math.max(1, plan.ops[day].length);
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = setDayCount;

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      const nextLength = Math.max(count, plan.ops[day].filter(Boolean).length);
      plan.slotCounts[day] = Math.max(1, Math.min(20, nextLength));
      plan.ops[day].length = nextLength;
      if (plan.pending?.[day]) {
        Object.keys(plan.pending[day]).forEach(slot => {
          if (Number(slot) >= nextLength) delete plan.pending[day][slot];
        });
      }
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = new Array(v780DefaultSlotCount(day)).fill(null);
    if (plan.pending) delete plan.pending[day];
    if (plan.slotCounts) delete plan.slotCounts[day];
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
    if (!kapsul) return false;
    const list = kapsul.querySelector(".v765-extra-match-list");
    if (!list) return false;
    if (dir === "minus") {
      const rows = list.querySelectorAll(".v765-extra-match-row");
      rows[rows.length - 1]?.remove();
      v768UpdateBetCalc(day, slot);
      v774SavePendingSlot(day, slot);
      return false;
    }
    const row = document.createElement("div");
    row.className = "v765-extra-match-row v768-extra-match-row";
    row.setAttribute("data-v763-extra-row", `${day}:${slot}`);
    row.innerHTML = `<input type="text" data-v763-extra-note placeholder="Maç"><input type="number" data-v763-extra-odds placeholder="Oran" step="0.01">`;
    list.appendChild(row);
    v768BindBetCalc(kapsul);
    v768UpdateBetCalc(day, slot);
    v774SavePendingSlot(day, slot);
    row.querySelector("input")?.focus();
    return false;
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

  function v768Money(value) {
    const n = Number(value || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function v847BetLegStatusLabel(status) {
    return status === "loss" ? "KAYBETTİ" : status === "win" ? "KAZANDI" : "BEKLİYOR";
  }

  function v847BetLegStatusClass(status) {
    return status === "loss" ? "loss" : status === "win" ? "win" : "pending";
  }

  function v847BetLegsFromDom(day, slot) {
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const odds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
    return [{ note, odds }, ...v763ComboRows(day, slot)].filter(row => row.note || Number(row.odds || 0));
  }

  function v847RenderBetLegResultPanel(day, slot) {
    const rows = v847BetLegsFromDom(day, slot);
    if (rows.length <= 1) return "";
    const pending = v774GetPendingSlot(day, slot);
    const results = Array.isArray(pending?.comboResults) ? pending.comboResults : [];
    const done = rows.filter((_, idx) => results[idx] === "win" || results[idx] === "loss").length;
    return `<div class="v847-leg-panel-inner">
      <div class="v847-leg-panel-head"><b>Maç Sonuçları</b><span>${done}/${rows.length} sonuçlandı</span></div>
      ${rows.map((row, idx) => {
        const status = results[idx] === "loss" ? "loss" : results[idx] === "win" ? "win" : "";
        const name = row.note || `Maç ${idx + 1}`;
        const odds = Number(row.odds || 0) ? Number(row.odds).toFixed(2) : "-";
        return `<div class="v847-leg-result-row ${status || "pending"}">
          <span title="${v763EscapeHtml(name)}">${idx + 1}. ${v763EscapeHtml(name)}</span>
          <b>${odds}</b>
          <div>
            <button type="button" class="win ${status === "win" ? "selected" : ""}" data-v847-leg-result="${day}:${slot}:${idx}:win" title="Bu maç kazandı">✓</button>
            <button type="button" class="loss ${status === "loss" ? "selected" : ""}" data-v847-leg-result="${day}:${slot}:${idx}:loss" title="Bu maç kaybetti">×</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function v847RenderBetResultCard(day, slot, op, amt, baseOdds, comboRows, totalOdds, effect) {
    const legs = [{ note: op.note || "Maç", odds: baseOdds }, ...comboRows.map(row => ({ note: row.note || "Maç", odds: Number(row.odds || 0) }))];
    const rawResults = Array.isArray(op.comboResults) ? op.comboResults : [];
    const isCombo = legs.length > 1;
    const finalStatus = op.res === "loss" ? "loss" : "win";
    const finalLabel = finalStatus === "loss" ? "KAYBETTİ" : "KAZANDI";
    const totalLabel = finalStatus === "loss" ? "Kayıp" : "Kazanç";
    const title = isCombo ? `KOMBİNE ${legs.length} MAÇ` : "TEKLİ BAHİS";
    const netValue = Number(effect || 0);
    const netText = `${netValue >= 0 ? "+" : "-"}$${Math.abs(netValue).toFixed(2)}`;
    const rowsHtml = legs.map((leg, idx) => {
      let status = rawResults[idx] === "loss" ? "loss" : rawResults[idx] === "win" ? "win" : "";
      if (!status && !isCombo) status = finalStatus;
      if (!status && finalStatus === "win") status = "win";
      if (!status && finalStatus === "loss" && rawResults.some(Boolean) === false) status = "loss";
      const name = leg.note || `Maç ${idx + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds).toFixed(2) : "-";
      const safeName = v763EscapeHtml(name);
      return `<li class="${v847BetLegStatusClass(status)}">
        <span>${idx + 1}. ${safeName}</span>
        <div class="v851-shot-line-meta">
          <b>Oran: ${odds}</b>
          <em>${v847BetLegStatusLabel(status)}</em>
        </div>
      </li>`;
    }).join("");
    return `<div class="kapsul v32 v847-shot-result ${finalStatus}">
      <div class="v850-shot-toolbar">
        <button type="button" class="v847-shot-back v850-shot-return" onclick="return omega_ReturnExcelOp(event, ${day}, ${slot})" title="Geri Dön"><i class="fa-solid fa-arrow-left"></i><span>Geri Dön</span></button>
        <button type="button" class="v850-shot-close" onclick="return omega_CloseExcelOp(event, ${day}, ${slot})" title="Kapat"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="v847-shot-head">
        <b>${title}</b>
        <div class="v847-shot-head-tools">
          <span class="${finalStatus}">${finalLabel}</span>
          <button type="button" class="v847-shot-camera" onclick="return omega_RollingResultPhoto(event, ${day}, ${slot})" title="Sonuç fotoğrafını göster"><i class="fa-solid fa-camera"></i></button>
        </div>
      </div>
      <ul class="v847-shot-lines">${rowsHtml}</ul>
      <div class="v847-shot-footer v851-shot-footer">
        <span>Toplam Oran <b>${Number(totalOdds || 0) ? Number(totalOdds).toFixed(2) : "-"}</b></span>
        <span>Tutar <b>${v768Money(amt)}</b></span>
        <span class="v851-result-total ${finalStatus}">${totalLabel} <b class="${netValue >= 0 ? "pos" : "neg"}">${netText}</b></span>
      </div>
    </div>`;
  }

  function v847SetBetLegResult(day, slot, index, status) {
    if (!Number.isFinite(day) || !Number.isFinite(slot) || !Number.isFinite(index)) return false;
    v774SavePendingSlot(day, slot);
    const pending = v774GetPendingSlot(day, slot) || v774PendingFromDom(day, slot);
    if (!pending || !pending.note) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Önce maç, oran ve tutar alanlarını doldur.");
      return false;
    }
    const legs = [{ note: pending.note, odds: pending.odds }, ...(Array.isArray(pending.combo) ? pending.combo : [])].filter(row => row.note || Number(row.odds || 0));
    if (legs.length <= 1) return false;
    const results = Array.from({ length: legs.length }, (_, i) => {
      const v = Array.isArray(pending.comboResults) ? pending.comboResults[i] : "";
      return v === "loss" ? "loss" : v === "win" ? "win" : "";
    });
    const next = status === "loss" ? "loss" : "win";
    results[index] = results[index] === next ? "" : next;
    v774SetPendingSlot(day, slot, { ...pending, comboResults: results, updatedAt: Date.now() });
    const anyLoss = results.includes("loss");
    const allWin = results.length > 1 && results.every(v => v === "win");
    if (anyLoss || allWin) {
      omega_ResolveExcelOp(day, slot, anyLoss ? "loss" : "win", { comboResults: results });
      return false;
    }
    omega_RenderExcelTable();
    return false;
  }

  function v768SlotOdds(day, slot) {
    const mainOdds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
    const extras = v763ComboRows(day, slot);
    return v763BetTotalOdds(mainOdds, extras);
  }

  function v768UpdateBetCalc(day, slot) {
    const box = document.querySelector(`[data-v768-calc="${day}:${slot}"]`);
    if (!box) return;
    const totalOdds = v768SlotOdds(day, slot);
    const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || 0);
    const possible = totalOdds && stake ? stake * totalOdds : 0;
    box.innerHTML = `<span>Toplam Oran: <b>${totalOdds ? totalOdds.toFixed(2) : "-"}</b></span><span>Tahmini Kazanç: <b>${possible ? v768Money(possible) : "-"}</b></span>`;
    const legPanel = document.querySelector(`[data-v847-leg-panel="${day}:${slot}"]`);
    if (legPanel) legPanel.innerHTML = v847RenderBetLegResultPanel(day, slot);
    const actions = document.querySelector(`[data-v847-main-actions="${day}:${slot}"]`);
    if (actions) actions.classList.toggle("v847-hide-main-actions", v847BetLegsFromDom(day, slot).length > 1);
  }

  function v768BindBetCalc(root) {
    const scope = root || document;
    scope.querySelectorAll('[id^="e-o-"], [id^="e-a-"], [data-v763-extra-odds]').forEach(input => {
      if (input.dataset.v768CalcBound === "1") return;
      input.dataset.v768CalcBound = "1";
      input.addEventListener("input", () => {
        const kapsul = input.closest("[data-v765-kapsul]");
        if (!kapsul) return;
        const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
        v768UpdateBetCalc(day, slot);
      });
    });
  }

  function v774SmartMemoryEnabled() {
    const mode = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    return mode === "bet" && (_ACTIVE_EXCEL_DAYS === 7 || _ACTIVE_EXCEL_DAYS === 15);
  }

  function v774EnsurePending(plan) {
    if (!plan.pending) plan.pending = {};
    return plan.pending;
  }

  function v774NormalizePendingEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const note = String(entry.note || "").trim();
    const stake = entry.amt === "" || entry.amt == null ? "" : Number(entry.amt || 0);
    const odds = entry.odds === "" || entry.odds == null ? "" : Number(entry.odds || 0);
    const combo = Array.isArray(entry.combo) ? entry.combo.map(row => ({
      note: String(row?.note || "").trim(),
      odds: row?.odds === "" || row?.odds == null ? "" : Number(row.odds || 0)
    })).filter(row => row.note || Number(row.odds || 0)) : [];
    if (!note && stake === "" && odds === "" && !combo.length) return null;
    const comboResults = Array.isArray(entry.comboResults) ? entry.comboResults.map(v => v === "loss" ? "loss" : v === "win" ? "win" : "").slice(0, combo.length + 1) : [];
    return { note, amt: stake, odds, combo, comboResults, status: "pending", updatedAt: Number(entry.updatedAt || Date.now()) };
  }

  function v774PendingFromDom(day, slot) {
    if (!v774SmartMemoryEnabled()) return null;
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return null;
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const stakeText = document.getElementById(`e-a-${day}-${slot}`)?.value || "";
    const oddsText = document.getElementById(`e-o-${day}-${slot}`)?.value || "";
    const stake = stakeText === "" ? "" : Number(stakeText || 0);
    const odds = oddsText === "" ? "" : Number(oddsText || 0);
    const combo = v763ComboRows(day, slot).map(row => ({ note: row.note, odds: row.odds || "" }));
    const previous = v774GetPendingSlot(day, slot);
    const comboResults = Array.isArray(previous?.comboResults) ? previous.comboResults : [];
    const hasAny = Boolean(note || stakeText !== "" || oddsText !== "" || combo.length);
    if (!hasAny) return null;
    return { note, amt: stake, odds, combo, comboResults, status: "pending", updatedAt: Date.now() };
  }

  function v774SetPendingSlot(day, slot, entry) {
    if (!v774SmartMemoryEnabled()) return;
    const plan = ensureRollingPlan();
    const pending = v774EnsurePending(plan);
    if (!pending[day]) pending[day] = {};
    const normalized = v774NormalizePendingEntry(entry);
    // Maç adı olmayan satırları aktif/bekliyor sayma; eski tutar/oran kalıntısını temizle.
    if (!normalized || !normalized.note) {
      delete pending[day][slot];
      if (Object.keys(pending[day]).length === 0) delete pending[day];
      omega_SaveRollingDB();
      return;
    }
    pending[day][slot] = normalized;
    omega_SaveRollingDB();
  }

  function v774GetPendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    return v774NormalizePendingEntry(plan.pending?.[day]?.[slot]);
  }

  function v774ClearPendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    if (plan.pending?.[day]) {
      delete plan.pending[day][slot];
      if (Object.keys(plan.pending[day]).length === 0) delete plan.pending[day];
      omega_SaveRollingDB();
    }
  }

  window.omega_RollingClearSlot = function(day, slot) {
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return false;
    const plan = ensureRollingPlan();
    if (plan.ops?.[day]?.[slot]) return false;
    const note = document.getElementById(`e-n-${day}-${slot}`);
    const stake = document.getElementById(`e-a-${day}-${slot}`);
    const odds = document.getElementById(`e-o-${day}-${slot}`);
    const fee = document.getElementById(`e-f-${day}-${slot}`);
    if (note) note.value = "";
    if (stake) stake.value = "";
    if (odds) odds.value = "";
    if (fee) fee.value = "";
    kapsul.querySelectorAll(".v765-extra-match-row, .v768-extra-match-row").forEach(row => row.remove());
    v774ClearPendingSlot(day, slot);
    v768UpdateBetCalc(day, slot);
    omega_SaveRollingDB();
    return false;
  };

  function v774SavePendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    if (plan.ops?.[day]?.[slot]) {
      v774ClearPendingSlot(day, slot);
      return;
    }
    v774SetPendingSlot(day, slot, v774PendingFromDom(day, slot));
  }

  function v774FlushAllPendingFromDom() {
    if (!v774SmartMemoryEnabled()) return;
    document.querySelectorAll('#rolling-excel-overlay [data-v765-kapsul]').forEach(kapsul => {
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      if (day && Number.isInteger(slot)) v774SavePendingSlot(day, slot);
    });
  }

  function v768LiveRows(mode) {
    const plan = ensureRollingPlan();
    const isCrypto = mode === "crypto";
    const smartBet = !isCrypto && v774SmartMemoryEnabled();
    const rows = [];
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      const dayOps = plan.ops?.[day] || [];
      const dayPending = smartBet ? (plan.pending?.[day] || {}) : {};
      const domSlots = Array.from(document.querySelectorAll(`#rolling-excel-overlay [data-v765-kapsul^="${day}:"]`)).map(el => Number(String(el.dataset.v765Kapsul || "0:0").split(":")[1] || 0));
      const maxSlots = Math.max(dayOps.length || 0, ...Object.keys(dayPending).map(Number).map(n => n + 1), ...domSlots.map(n => n + 1), 0);
      for (let slot = 0; slot < maxSlots; slot++) {
        const saved = dayOps[slot];
        if (saved) continue;
        if (!smartBet) {
          const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
          const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || 0);
          const odds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
          const combo = isCrypto ? [] : v763ComboRows(day, slot);
          if (!note && !stake && !odds && !combo.length) continue;
          const totalOdds = isCrypto ? odds : v763BetTotalOdds(odds, combo);
          rows.push({ day, slot, note, stake, odds, combo, totalOdds, possible: (!isCrypto && stake && totalOdds) ? stake * totalOdds : 0 });
          continue;
        }
        const pending = v774GetPendingSlot(day, slot);
        const hasDom = Boolean(document.getElementById(`e-n-${day}-${slot}`));
        const domPending = hasDom ? v774PendingFromDom(day, slot) : null;
        const src = v774NormalizePendingEntry(domPending) || pending;
        if (!src || !src.note) continue;
        const stake = Number(src.amt || 0);
        const odds = Number(src.odds || 0);
        const combo = Array.isArray(src.combo) ? src.combo : [];
        const totalOdds = v763BetTotalOdds(odds, combo);
        rows.push({ day, slot, note: src.note, stake, odds, combo, comboResults: Array.isArray(src.comboResults) ? src.comboResults : [], totalOdds, possible: (stake && totalOdds) ? stake * totalOdds : 0, pending: true });
      }
    }
    return rows;
  }

  function v768HistoryRows(mode) {
    const plan = ensureRollingPlan();
    const isCrypto = mode === "crypto";
    const rows = [];
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      const dayOps = plan.ops?.[day] || [];
      dayOps.forEach((op, slot) => {
        if (!op) return;
        const combo = Array.isArray(op.combo) ? op.combo : [];
        const totalOdds = isCrypto ? Number(op.odds || 0) : v763BetTotalOdds(Number(op.odds || 0), combo);
        const stake = Number(op.amt || 0);
        const pnl = isCrypto ? Number(op.odds || 0) : (op.res === "win" ? (stake * totalOdds) - stake : -stake);
        rows.push({ day, slot, note: op.note || (isCrypto ? "İşlem" : "Maç"), stake, odds: op.odds, combo, totalOdds, possible: (!isCrypto && stake && totalOdds) ? stake * totalOdds : 0, res: op.res, pnl });
      });
    }
    return rows;
  }

  function v768FeatureRowsHtml(mode, kind) {
    const isCrypto = mode === "crypto";
    const rows = kind === "active" ? v768LiveRows(mode) : v768HistoryRows(mode);
    if (!rows.length) return `<div class="v768-feature-empty">${kind === "active" ? "Aktif kutu yok. Maç/işlem yazınca burada görünür." : "Geçmiş kayıt yok."}</div>`;
    return rows.map(row => {
      const comboHtml = (!isCrypto && row.combo?.length) ? `<ul>${[`<li>${v763EscapeHtml(row.note || "Maç")} <b>${Number(row.odds || 0).toFixed(2)}</b></li>`, ...row.combo.map(x => `<li>${v763EscapeHtml(x.note || "Maç")} <b>${Number(x.odds || 0).toFixed(2)}</b></li>`)].join("")}</ul>` : "";
      const title = isCrypto ? (row.note || "İşlem") : (row.combo?.length ? "Kombine" : (row.note || "Maç"));
      const status = kind === "history" ? `<em class="${row.res === "win" ? "pos" : "neg"}">${row.res === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</em>` : `<em>Bekliyor</em>`;
      const metric = isCrypto ? `Tutar: ${v768Money(row.stake)} · Net K/Z: ${v768Money(row.odds)}` : `Tutar: ${v768Money(row.stake)} · Toplam Oran: ${row.totalOdds ? row.totalOdds.toFixed(2) : "-"} · Tahmini Kazanç: ${row.possible ? v768Money(row.possible) : "-"}`;
      return `<article class="v768-feature-card"><div><b>${v763EscapeHtml(title)}</b>${status}</div><span>Gün ${row.day} · Kutu ${row.slot + 1}</span><p>${metric}</p>${comboHtml}</article>`;
    }).join("");
  }

  function v768OpenFeaturePanel(mode = "bet", kind = "active") {
    v774FlushAllPendingFromDom();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    const title = k === "active" ? (m === "crypto" ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR") : k === "history" ? "Geçmiş" : "Rapor";
    const reportRows = v768HistoryRows(m);
    const reportHtml = k === "report" ? `<div class="v768-feature-report"><div><span>Kayıt</span><b>${reportRows.length}</b></div><div><span>Toplam K/Z</span><b>${v768Money(reportRows.reduce((a,r)=>a+Number(r.pnl||0),0))}</b></div><button type="button" data-v768-report-download="${m}">Rapor Özeti İndir</button></div>` : v768FeatureRowsHtml(m, k);
    host.innerHTML = `<div class="v768-feature-overlay" data-v768-feature-panel><section class="v768-feature-modal ${m}"><div class="v768-feature-head"><div><b>${title}</b><span>${m === "crypto" ? "Kripto rolling" : "Bahis rolling"} · ${_ACTIVE_EXCEL_DAYS} günlük modal</span></div><button type="button" data-v768-feature-close>×</button></div><div class="v768-feature-body">${reportHtml}</div></section></div>`;
    host.style.display = "block";
  }

  function v768DownloadReport(mode) {
    const rows = v768HistoryRows(mode);
    const pnl = rows.reduce((a,r)=>a+Number(r.pnl||0),0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" viewBox="0 0 900 420"><rect width="900" height="420" rx="28" fill="#020617"/><rect x="26" y="26" width="848" height="368" rx="22" fill="none" stroke="#fbbf24" stroke-width="2"/><text x="52" y="80" fill="#fbbf24" font-size="26" font-family="Arial" font-weight="900">BULTEN · ${mode === "crypto" ? "KRİPTO" : "BAHİS"} ROLLING RAPOR</text><text x="52" y="140" fill="#fff" font-size="22" font-family="Arial" font-weight="800">Kayıt: ${rows.length}</text><text x="52" y="180" fill="#fff" font-size="22" font-family="Arial" font-weight="800">Toplam K/Z: ${v768Money(pnl)}</text><text x="52" y="230" fill="#94a3b8" font-size="16" font-family="Arial">${new Date().toLocaleString("tr-TR")}</text></svg>`;
    const a = document.createElement("a");
    a.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    a.download = `bulten-${mode}-rolling-rapor.svg`;
    document.body.appendChild(a); a.click(); a.remove();
  }


  function v776SlotPhotoRows(day, slot) {
    const plan = ensureRollingPlan();
    const resolved = plan.ops?.[day]?.[slot] || null;
    if (resolved) {
      const combo = Array.isArray(resolved.combo) ? resolved.combo : [];
      const rawResults = Array.isArray(resolved.comboResults) ? resolved.comboResults : [];
      const rows = [{ note: resolved.note || "Maç", odds: Number(resolved.odds || 0) }, ...combo.map(row => ({ note: row.note || "Maç", odds: Number(row.odds || 0) }))].map((row, idx) => {
        let result = rawResults[idx] === "loss" ? "loss" : rawResults[idx] === "win" ? "win" : "";
        if (!result && resolved.res === "win") result = "win";
        if (!result && resolved.res === "loss" && !rawResults.some(Boolean)) result = "loss";
        return { ...row, result };
      });
      const stake = Number(resolved.amt || 0);
      const totalOdds = v763BetTotalOdds(Number(resolved.odds || 0), combo);
      const possible = stake && totalOdds ? stake * totalOdds : 0;
      return { rows, stake, totalOdds, possible, result: resolved.res === "loss" ? "loss" : "win" };
    }
    const pending = v774GetPendingSlot(day, slot);
    const baseNote = (document.getElementById(`e-n-${day}-${slot}`)?.value || pending?.note || "").trim();
    const baseOdds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || pending?.odds || 0);
    const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || pending?.amt || 0);
    const combo = v763ComboRows(day, slot);
    const savedCombo = Array.isArray(pending?.combo) ? pending.combo : [];
    const rows = [];
    if (baseNote || baseOdds) rows.push({ note: baseNote || "Maç", odds: baseOdds });
    const comboSource = combo.length ? combo : savedCombo;
    comboSource.forEach(row => {
      const note = String(row.note || "").trim();
      const odds = Number(row.odds || 0);
      if (note || odds) rows.push({ note: note || "Maç", odds });
    });
    const oddsList = rows.map(r => Number(r.odds || 0)).filter(v => v > 0);
    const totalOdds = oddsList.length ? oddsList.reduce((acc, val) => acc * val, 1) : 0;
    const possible = stake && totalOdds ? stake * totalOdds : 0;
    return { rows, stake, totalOdds, possible };
  }

  function v776BuildSlotPhotoSvg(day, slot) {
    const data = v776SlotPhotoRows(day, slot);
    if (!data.rows.length) return null;
    const safe = v763EscapeHtml;
    const footerY = 150 + data.rows.length * 48 + 40;
    const footerH = 130;
    const height = Math.max(520, footerY + footerH + 46);
    const totalOddsLabel = data.totalOdds ? data.totalOdds.toFixed(2) : "-";
    const hasFinalResult = data.result === "loss" || data.result === "win";
    const resultNet = hasFinalResult ? (data.result === "loss" ? -Number(data.stake || 0) : Number(data.possible || 0) - Number(data.stake || 0)) : 0;
    const resultLabel = hasFinalResult ? (data.result === "loss" ? "Kayıp:" : "Kazanç:") : "Tahmini Kazanç:";
    const resultColor = hasFinalResult ? (resultNet >= 0 ? "#22c55e" : "#ef4444") : "#22c55e";
    const possibleLabel = hasFinalResult ? `${resultNet >= 0 ? "+" : "-"}$${Math.abs(resultNet).toFixed(2)}` : (data.possible ? v768Money(data.possible) : "-");
    const rowHtml = data.rows.map((row, idx) => {
      const y = 150 + idx * 48;
      const result = row.result === "loss" ? "loss" : row.result === "win" ? "win" : "";
      const statusText = result === "loss" ? "KAYBETTİ" : result === "win" ? "KAZANDI" : "";
      const statusColor = result === "loss" ? "#ef4444" : "#22c55e";
      return `<rect x="42" y="${y - 28}" width="816" height="38" rx="12" fill="#0f172a" stroke="#334155"/><text x="64" y="${y - 3}" fill="#f8fafc" font-size="19" font-family="Arial" font-weight="800">${safe(row.note || 'Maç')}</text>${statusText ? `<text x="720" y="${y - 3}" text-anchor="end" fill="${statusColor}" font-size="17" font-family="Arial" font-weight="900">${statusText}</text>` : ""}<text x="830" y="${y - 3}" text-anchor="end" fill="#fbbf24" font-size="19" font-family="Arial" font-weight="900">${row.odds ? Number(row.odds).toFixed(2) : '-'}</text>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}"><rect width="900" height="${height}" fill="#020617"/><rect x="22" y="22" width="856" height="${height-44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/><text x="42" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">BAHİS ${_ACTIVE_EXCEL_DAYS} GÜNLÜK ROLLING</text><text x="42" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">GÜN ${day} · KUTU ${slot + 1}</text>${rowHtml}<rect x="42" y="${footerY}" width="816" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Toplam Oran:</text><text x="836" y="${footerY + 34}" text-anchor="end" fill="#fbbf24" font-size="20" font-family="Arial" font-weight="900">${totalOddsLabel}</text><text x="64" y="${footerY + 70}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text><text x="836" y="${footerY + 70}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${v768Money(data.stake)}</text><text x="64" y="${footerY + 106}" fill="${resultColor}" font-size="19" font-family="Arial" font-weight="900">${resultLabel}</text><text x="836" y="${footerY + 106}" text-anchor="end" fill="${resultColor}" font-size="20" font-family="Arial" font-weight="900">${possibleLabel}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function v777DownloadPhotoPng(svgUri, filename) {
    const img = new Image();
    img.onload = function() {
      try {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 900) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 420) * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const save = blob => {
          if (!blob) {
            const fallback = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = fallback;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1200);
        };
        if (canvas.toBlob) canvas.toBlob(save, "image/png", 0.95);
        else save(null);
      } catch (err) {
        console.error("PNG oluşturulamadı", err);
        alert("PNG oluşturulamadı. Tarayıcı engellediyse tekrar deneyin.");
      }
    };
    img.onerror = function() {
      alert("Resim hazırlanamadı. Maç/oran/tutar bilgisini kontrol et.");
    };
    img.src = svgUri;
  }

  window.omega_RollingSlotPhoto = function(day, slot) {
    v774SavePendingSlot(day, slot);
    const uri = v776BuildSlotPhotoSvg(day, slot);
    if (!uri) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Önce maç ve oran yaz.");
      else alert("Önce maç ve oran yaz.");
      return false;
    }
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v776-photo-overlay" data-v776-photo-close><section class="v776-photo-modal"><div class="v776-photo-head"><div><b>Kupon Fotoğrafı</b><span>Gün ${day} · Kutu ${slot + 1}</span></div><button type="button" data-v776-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v776-photo-show>Resmi Göster</button><button type="button" data-v777-photo-download>Resmi İndir</button></div><img src="${uri}" alt="Kupon fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v776-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v776-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v776-photo-show]")?.addEventListener("click", () => {
      const w = window.open("", "_blank");
      if (w) w.document.write(`<img src="${uri}" style="max-width:100%;height:auto;background:#020617;display:block;margin:0 auto;">`);
    });
    host.querySelector("[data-v777-photo-download]")?.addEventListener("click", () => {
      v777DownloadPhotoPng(uri, `bahis-rolling-${_ACTIVE_EXCEL_DAYS}-gun-${day}-kutu-${slot + 1}.png`);
    });
    return false;
  };

  window.omega_RollingResultPhoto = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const uri = v776BuildSlotPhotoSvg(day, slot);
    if (!uri) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Sonuç fotoğrafı hazırlanamadı.");
      else alert("Sonuç fotoğrafı hazırlanamadı.");
      return false;
    }
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v776-photo-overlay v850-result-photo-overlay" data-v776-photo-close>
      <section class="v776-photo-modal v850-result-photo-modal">
        <div class="v776-photo-head v850-result-photo-head">
          <div><b>7 GÜNLÜK ROLLING</b><span>GÜN ${day} · BAHİS ${slot + 1}</span></div>
          <button type="button" data-v776-photo-close>×</button>
        </div>
        <div class="v776-photo-actions v850-result-photo-actions">
          <button type="button" data-v777-photo-download><i class="fa-solid fa-download"></i> Resmi İndir</button>
        </div>
        <img src="${uri}" alt="7 Günlük Rolling bahis sonucu">
      </section>
    </div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v776-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v776-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v777-photo-download]")?.addEventListener("click", () => {
      v777DownloadPhotoPng(uri, `7-gunluk-rolling-gun-${day}-bahis-${slot + 1}.png`);
    });
    return false;
  };

  function v763DayToolButtons(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const activeLabel = m === "crypto" ? "Aktif Kripto İşlemleri" : "Aktif Bahisler / Kuponlar";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls v770-excel-feature-controls v771-excel-feature-controls" data-v771-feature-controls="${m}">
      <button type="button" class="v758-row-tool v759-row-tool active" data-v768-feature-open="${m}:active">${activeLabel}</button>
      <button type="button" class="v758-row-tool v759-row-tool history" data-v768-feature-open="${m}:history">Geçmiş</button>
    </div>`;
  }

  window.omega_ExcelRollingOpenMainPanel = function(event, mode = "bet", kind = "active") {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    const stamp = `${m}:${k}`;
    const now = Date.now();
    if (window.__omegaV770ExcelPanelStamp === stamp && (now - Number(window.__omegaV770ExcelPanelTime || 0)) < 180) return false;
    window.__omegaV770ExcelPanelStamp = stamp;
    window.__omegaV770ExcelPanelTime = now;
    try { document.getElementById("omega-rolling-feature-host")?.remove(); } catch(e) {}
    v768OpenFeaturePanel(m, k);
    return false;
  };

  window.omega_RollingExcelOpenFeature = function(event, mode = "bet", kind = "active") {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    v768OpenFeaturePanel(m, k);
    return false;
  };

  if (!window.__omegaV768ExcelFeatureDelegationBound) {
    window.__omegaV768ExcelFeatureDelegationBound = true;
    document.addEventListener("click", function(event) {
      const v770Btn = event.target.closest && event.target.closest("[data-v770-excel-open]");
      if (v770Btn) {
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [modeRaw, kindRaw] = String(v770Btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
        return;
      }
      const featureBtn = event.target.closest && event.target.closest("[data-v768-feature-open]");
      if (featureBtn) {
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [modeRaw, kindRaw] = String(featureBtn.dataset.v768FeatureOpen || "bet:active").split(":");
        window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
        return;
      }
      const legResultBtn = event.target.closest && event.target.closest("[data-v847-leg-result]");
      if (legResultBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [dayRaw, slotRaw, indexRaw, statusRaw] = String(legResultBtn.dataset.v847LegResult || "0:0:0:win").split(":");
        v847SetBetLegResult(Number(dayRaw), Number(slotRaw), Number(indexRaw), statusRaw === "loss" ? "loss" : "win");
        return;
      }
      const comboBtn = event.target.closest && event.target.closest("[data-v768-combo]");
      if (comboBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [dayRaw, slotRaw, dirRaw] = String(comboBtn.dataset.v768Combo || "0:0:plus").split(":");
        window.omega_RollingToggleComboRow(Number(dayRaw), Number(slotRaw), dirRaw === "minus" ? "minus" : "plus");
        return;
      }
      const closeBtn = event.target.closest && event.target.closest("[data-v768-feature-close]");
      if (closeBtn) {
        event.preventDefault();
        document.getElementById("omega-rolling-feature-host")?.remove();
        return;
      }
      if (event.target && event.target.matches && event.target.matches(".v768-feature-overlay")) {
        document.getElementById("omega-rolling-feature-host")?.remove();
        return;
      }
      const reportBtn = event.target.closest && event.target.closest("[data-v768-report-download]");
      if (reportBtn) {
        event.preventDefault();
        v768DownloadReport(reportBtn.dataset.v768ReportDownload === "crypto" ? "crypto" : "bet");
        return;
      }
      if (event.target?.closest && document.getElementById("rolling-excel-overlay")?.contains(event.target)) {
        if (!event.target.closest("[data-v765-kapsul]") && !event.target.closest("[data-v768-feature-open]")) v774FlushAllPendingFromDom();
      }
    }, true);
    document.addEventListener("input", function(event) {
      const kapsul = event.target && event.target.closest && event.target.closest("[data-v765-kapsul]");
      if (!kapsul) return;
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      v768UpdateBetCalc(day, slot);
      v774SavePendingSlot(day, slot);
    }, true);
    document.addEventListener("focusout", function(event) {
      const kapsul = event.target && event.target.closest && event.target.closest("[data-v765-kapsul]");
      if (!kapsul) return;
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      v774SavePendingSlot(day, slot);
    }, true);
  }

  function v765BindExcelFeatureControls(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-v770-excel-open]").forEach(btn => {
      if (btn.dataset.v770Bound === "1") return;
      btn.dataset.v770Bound = "1";
      btn.addEventListener("pointerdown", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
      }, { passive: false });
      btn.addEventListener("click", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
      });
    });
    scope.querySelectorAll("[data-v768-feature-open]").forEach(btn => {
      if (btn.dataset.v768Bound === "1") return;
      btn.dataset.v768Bound = "1";
      btn.addEventListener("click", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v768FeatureOpen || "bet:active").split(":");
        window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
      });
    });
    v768BindBetCalc(scope);
    scope.querySelectorAll("[data-v768-calc]").forEach(box => {
      const [day, slot] = String(box.dataset.v768Calc || "0:0").split(":").map(Number);
      v768UpdateBetCalc(day, slot);
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
      v780EnsureDaySlots(currentPlan, day);
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
          if (!isCryptoV491) {
            cards.push(v847RenderBetResultCard(day, slot, op, amt, baseOdds, comboRows, totalOdds, effect));
          } else {
            const title = op.note || "İşlem";
            const detail = `$${amt} · Net $${Number(baseOdds || 0).toFixed(2)}`;
            cards.push(`
              <div class="kapsul v32 ${op.res}">
                <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
                <div class="k-result">
                  <div class="k-note-show">${v763EscapeHtml(title)}</div>
                  <b>${detail}</b>
                  <span>${effect >= 0 ? '+' : '-'}$${Math.abs(effect).toFixed(2)}</span>
                </div>
              </div>
            `);
          }
        } else {
          const pendingV774 = !isCryptoV491 ? v774GetPendingSlot(day, slot) : null;
          const pNoteV774 = v763EscapeHtml(pendingV774?.note || "");
          const pOddsV774 = pendingV774?.odds === "" || pendingV774?.odds == null ? "" : v763EscapeHtml(pendingV774.odds);
          const pStakeV774 = pendingV774?.amt === "" || pendingV774?.amt == null ? "" : v763EscapeHtml(pendingV774.amt);
          const pComboV774 = Array.isArray(pendingV774?.combo) ? pendingV774.combo : [];
          const pComboHtmlV774 = pComboV774.map(row => `<div class="v765-extra-match-row v768-extra-match-row" data-v763-extra-row="${day}:${slot}"><input type="text" data-v763-extra-note placeholder="Maç" value="${v763EscapeHtml(row.note || "")}"><input type="number" data-v763-extra-odds placeholder="Oran" step="0.01" value="${row.odds === "" || row.odds == null ? "" : v763EscapeHtml(row.odds)}"></div>`).join("");
          cards.push(`
            <div class="kapsul v32 ${isCryptoV491 ? "" : "v765-bet-kapsul"}" data-v765-kapsul="${day}:${slot}">
              ${isCryptoV491 ? `
                <input type="text" id="e-n-${day}-${slot}" placeholder="İşlem">
                <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
                <input type="number" id="e-o-${day}-${slot}" placeholder="Net K/Z $">
              ` : `
                <div class="v765-bet-entry">
                  <div class="v765-match-line">
                    <div class="v777-slot-tools">
                      <div class="v765-inline-combo-controls">
                        <button type="button" data-v768-combo="${day}:${slot}:plus" onclick="return omega_RollingToggleComboRow(${day}, ${slot}, 'plus')" title="Maç + oran ekle">+</button>
                        <button type="button" data-v768-combo="${day}:${slot}:minus" onclick="return omega_RollingToggleComboRow(${day}, ${slot}, 'minus')" title="Son ek maçı sil">−</button>
                      </div>
                      <button type="button" class="v778-slot-clear" onclick="return omega_RollingClearSlot(${day}, ${slot})" title="Kutuyu boşalt">×</button>
                      <button type="button" class="v776-slot-camera" onclick="return omega_RollingSlotPhoto(${day}, ${slot})" title="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button>
                    </div>
                    <input type="text" id="e-n-${day}-${slot}" placeholder="Maç" value="${pNoteV774}">
                  </div>
                  <input type="number" id="e-o-${day}-${slot}" placeholder="Oran" step="0.01" value="${pOddsV774}">
                  <div class="v765-extra-match-list">${pComboHtmlV774}</div>
                  <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar" step="0.01" value="${pStakeV774}">
                  <div class="v768-bet-calc" data-v768-calc="${day}:${slot}"><span>Toplam Oran: <b>-</b></span><span>Tahmini Kazanç: <b>-</b></span></div>
                  <div class="v847-bet-leg-result-panel" data-v847-leg-panel="${day}:${slot}"></div>
                </div>
              `}
              <div class="k-actions v32" data-v847-main-actions="${day}:${slot}">
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

  window.omega_CloseExcelOp = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

    const currentPlan = ensureRollingPlan();
    if (currentPlan.ops?.[day]) currentPlan.ops[day][slot] = null;
    if (currentPlan.pending?.[day]) currentPlan.pending[day][slot] = null;

    omega_SaveRollingDB();
    omega_RenderExcelTable();
    return false;
  };

  window.omega_ReturnExcelOp = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

    const currentPlan = ensureRollingPlan();
    const op = currentPlan.ops?.[day]?.[slot];
    if (!op) return false;

    const combo = Array.isArray(op.combo)
      ? op.combo.map(row => ({ note: String(row?.note || "").trim(), odds: row?.odds === "" || row?.odds == null ? "" : Number(row.odds || 0) }))
      : [];
    const comboResults = Array.isArray(op.comboResults)
      ? op.comboResults.map(v => v === "loss" ? "loss" : v === "win" ? "win" : "").slice(0, combo.length + 1)
      : [];

    const pendingEntry = v774NormalizePendingEntry({
      note: op.note || "",
      amt: op.amt === "" || op.amt == null ? "" : Number(op.amt || 0),
      odds: op.odds === "" || op.odds == null ? "" : Number(op.odds || 0),
      combo,
      comboResults,
      status: "pending",
      updatedAt: Date.now()
    });

    if (!currentPlan.pending) currentPlan.pending = {};
    if (pendingEntry && pendingEntry.note) {
      if (!currentPlan.pending[day]) currentPlan.pending[day] = {};
      currentPlan.pending[day][slot] = pendingEntry;
    }

    if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
    currentPlan.ops[day][slot] = null;

    omega_SaveRollingDB();
    omega_RenderExcelTable();
    return false;
  };

  window.omega_ResolveExcelOp = function(day, slot, result, meta = {}) {
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const isCrypto = localStorage.getItem("finance_rolling_mode") === "crypto";
    const amt = parseFloat(document.getElementById(`e-a-${day}-${slot}`)?.value);
    const odds = parseFloat(document.getElementById(`e-o-${day}-${slot}`)?.value);
    const comboRows = isCrypto ? [] : v763ComboRows(day, slot);
    const pendingBeforeResolve = !isCrypto ? v774GetPendingSlot(day, slot) : null;
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
    const comboResults = !isCrypto
      ? (Array.isArray(meta.comboResults) ? meta.comboResults : Array.isArray(pendingBeforeResolve?.comboResults) ? pendingBeforeResolve.comboResults : [])
          .map(v => v === "loss" ? "loss" : v === "win" ? "win" : "")
          .slice(0, comboRows.length + 1)
      : [];
    currentPlan.ops[day][slot] = { note, amt, odds, combo: comboRows, comboResults, res: result, netMode: isCrypto ? "amount" : "odds" };
    if (currentPlan.pending?.[day]) {
      delete currentPlan.pending[day][slot];
      if (Object.keys(currentPlan.pending[day]).length === 0) delete currentPlan.pending[day];
    }
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

  const oldCloseRollingV778 = window.omega_CloseRollingExcel;
  window.omega_CloseRollingExcel = function(force = false) {
    const hash = String(location.hash || "");
    const closeTarget = hash.startsWith("#rolling/rolling/") ? "#rolling" : hash.startsWith("#finance/rolling/") ? "#finance" : "";
    const overlay = document.getElementById("rolling-excel-overlay");
    if (overlay) {
      overlay.classList.remove("show-modal");
      setTimeout(() => { overlay.style.display = "none"; }, 220);
    }
    document.body.classList.remove("rolling-active");
    document.documentElement.classList.remove("rolling-hash-boot");
    if (closeTarget) history.replaceState(null, "", closeTarget);
    else if (typeof oldCloseRollingV778 === "function") oldCloseRollingV778(force);
  };

  
  document.addEventListener("click", function(e) {
    const disabled = e.target.closest(".crypto-v28-tab-disabled");
    if(disabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);


  // V779: Kamera ikonunda CSS/katman çakışması olursa işlev yine çalışsın.
  document.addEventListener("click", function(event) {
    const btn = event.target && event.target.closest ? event.target.closest(".v776-slot-camera") : null;
    if (!btn || !btn.closest("#rolling-excel-overlay")) return;
    const kapsul = btn.closest("[data-v765-kapsul]");
    if (!kapsul) return;
    const parts = String(kapsul.dataset.v765Kapsul || "").split(":");
    const day = Number(parts[0] || 1);
    const slot = Number(parts[1] || 0);
    if (!Number.isFinite(day) || !Number.isFinite(slot)) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof window.omega_RollingSlotPhoto === "function") window.omega_RollingSlotPhoto(day, slot);
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
