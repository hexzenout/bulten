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


  let ROLLING_SUBPANEL = null;

  function getRollingModeV86() {
    return localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
  }

  function getRollingPlanKeyV86() {
    return `${getRollingModeV86()}_${_ACTIVE_EXCEL_DAYS}`;
  }

  function ensurePlanMeta(plan) {
    if (!plan.ops || typeof plan.ops !== 'object') plan.ops = {};
    if (!plan.drafts || typeof plan.drafts !== 'object') plan.drafts = {};
    if (!Array.isArray(plan.history)) plan.history = [];
    if (!plan.mode) plan.mode = getRollingModeV86();
    if (!plan.days) plan.days = _ACTIVE_EXCEL_DAYS;
    return plan;
  }

  function ensureRollingPlan() {
    const key = getRollingPlanKeyV86();
    if (!_ROLLING_DB[key]) _ROLLING_DB[key] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {}, drafts: {}, history: [], mode: getRollingModeV86(), days: _ACTIVE_EXCEL_DAYS };
    const plan = _ROLLING_DB[key];
    ensurePlanMeta(plan);
    return plan;
  }

  function moneyV86(val) {
    return `$${Number(val || 0).toFixed(2)}`;
  }

  function escapeHtmlV86(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeDraftV86(raw = {}) {
    return {
      note: String(raw.note || raw.name || '').trim(),
      amt: raw.amt === 0 ? '0' : String(raw.amt || '').trim(),
      odds: raw.odds === 0 ? '0' : String(raw.odds || '').trim(),
      fee: raw.fee === 0 ? '0' : String(raw.fee || '').trim()
    };
  }

  function draftHasDataV86(draft) {
    const row = normalizeDraftV86(draft);
    return [row.note, row.amt, row.odds, row.fee].some(v => String(v || '').trim() !== '');
  }

  function getDraftListV86(plan, day) {
    ensurePlanMeta(plan);
    if (!Array.isArray(plan.drafts[day])) plan.drafts[day] = [];
    return plan.drafts[day];
  }

  function readDraftV86(plan, day, slot) {
    return normalizeDraftV86(getDraftListV86(plan, day)[slot] || {});
  }

  function writeDraftV86(plan, day, slot, draft) {
    const list = getDraftListV86(plan, day);
    const normalized = normalizeDraftV86(draft);
    list[slot] = draftHasDataV86(normalized)
      ? { ...normalized, status: 'pending', updatedAt: Date.now() }
      : null;
  }

  function collectPendingV86(plan) {
    ensurePlanMeta(plan);
    const items = [];
    Object.keys(plan.drafts || {}).sort((a, b) => Number(a) - Number(b)).forEach(dayKey => {
      const day = Number(dayKey || 0);
      getDraftListV86(plan, day).forEach((draft, slot) => {
        if (!draftHasDataV86(draft)) return;
        if (plan.ops?.[day]?.[slot]) return;
        items.push({
          day,
          slot,
          note: draft.note || 'Maç',
          amt: Number(draft.amt || 0),
          odds: Number(draft.odds || 0),
          fee: Number(draft.fee || 0),
          updatedAt: Number(draft.updatedAt || Date.now())
        });
      });
    });
    return items;
  }

  function collectHistoryV86(plan) {
    ensurePlanMeta(plan);
    return [...plan.history].sort((a, b) => Number(b.resolvedAt || 0) - Number(a.resolvedAt || 0));
  }

  function captureAllVisibleDraftsV86() {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      const max = Math.max(
        (plan.ops?.[day] || []).length,
        getDraftListV86(plan, day).length,
        1
      );
      for (let slot = 0; slot < max; slot++) {
        if (
          document.getElementById(`e-n-${day}-${slot}`) ||
          document.getElementById(`e-a-${day}-${slot}`) ||
          document.getElementById(`e-o-${day}-${slot}`) ||
          document.getElementById(`e-f-${day}-${slot}`)
        ) {
          window.omega_CaptureRollingDraft(day, slot);
        }
      }
    }
  }

  window.omega_CaptureRollingDraft = function(day, slot) {
    const plan = ensureRollingPlan();
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || '').trim();
    const amt = (document.getElementById(`e-a-${day}-${slot}`)?.value || '').trim();
    const odds = (document.getElementById(`e-o-${day}-${slot}`)?.value || '').trim();
    const fee = (document.getElementById(`e-f-${day}-${slot}`)?.value || '').trim();
    writeDraftV86(plan, day, slot, { note, amt, odds, fee });
    omega_SaveRollingDB();
    renderRollingSubpanelV86();
    return readDraftV86(plan, day, slot);
  };

  function buildPendingPanelHtmlV86(plan) {
    const items = collectPendingV86(plan);
    const title = `${plan.mode === 'crypto' ? 'KRİPTO' : 'BAHİS'} ${plan.days} GÜNLÜK ROLLING`;
    const listHtml = items.length
      ? items.map(item => `
        <div class="v774-panel-card pending">
          <div><b>GÜN ${item.day} · ALAN ${item.slot + 1}</b><span>${escapeHtmlV86(item.note || 'Maç')}</span></div>
          <div class="v774-panel-metrics">
            <small>Tutar: ${moneyV86(item.amt)}</small>
            <small>${plan.mode === 'crypto' ? 'Net K/Z $' : 'Oran'}: ${item.odds ? item.odds : '-'}</small>
            <small>Durum: BEKLİYOR</small>
          </div>
        </div>
      `).join('')
      : `<div class="v774-empty-state">Bu alan için bekleyen kayıt yok.</div>`;
    return `
      <div class="v774-inline-overlay" data-rolling-subpanel-close>
        <div class="v774-inline-panel" onclick="event.stopPropagation()">
          <div class="v774-inline-head">
            <div><h3>Aktif Bahisler / Kuponlar</h3><span>${title} · sadece bu alanın verileri</span></div>
            <button type="button" onclick="omega_CloseRollingSubpanel()">×</button>
          </div>
          <div class="v774-inline-body">${listHtml}</div>
        </div>
      </div>`;
  }

  function buildHistoryPanelHtmlV86(plan) {
    const items = collectHistoryV86(plan);
    const title = `${plan.mode === 'crypto' ? 'KRİPTO' : 'BAHİS'} ${plan.days} GÜNLÜK ROLLING`;
    const listHtml = items.length
      ? items.map(item => `
        <div class="v774-panel-card ${item.res === 'loss' ? 'loss' : 'win'}">
          <div><b>GÜN ${item.day} · ALAN ${item.slot + 1}</b><span>${escapeHtmlV86(item.note || 'Maç')}</span></div>
          <div class="v774-panel-metrics">
            <small>Tutar: ${moneyV86(item.amt)}</small>
            <small>${plan.mode === 'crypto' ? 'Net K/Z $' : 'Oran'}: ${item.odds ? item.odds : '-'}</small>
            <small>Sonuç: ${item.res === 'loss' ? 'KAYBETTİ' : 'KAZANDI'}</small>
          </div>
        </div>
      `).join('')
      : `<div class="v774-empty-state">Bu alan için geçmiş kayıt yok.</div>`;
    return `
      <div class="v774-inline-overlay" data-rolling-subpanel-close>
        <div class="v774-inline-panel" onclick="event.stopPropagation()">
          <div class="v774-inline-head">
            <div><h3>Geçmiş</h3><span>${title} · sadece bu alanın verileri</span></div>
            <button type="button" onclick="omega_CloseRollingSubpanel()">×</button>
          </div>
          <div class="v774-inline-body">${listHtml}</div>
        </div>
      </div>`;
  }

  function collectSnapshotItemsV86(plan, day) {
    const items = [];
    const drafts = getDraftListV86(plan, day);
    drafts.forEach((draft, slot) => {
      if (!draftHasDataV86(draft)) return;
      items.push({
        slot,
        note: draft.note || `Maç ${slot + 1}`,
        odds: Number(draft.odds || 0),
        amt: Number(draft.amt || 0)
      });
    });
    if (!items.length && Array.isArray(plan.ops?.[day])) {
      plan.ops[day].forEach((op, slot) => {
        if (!op) return;
        items.push({ slot, note: op.note || `Maç ${slot + 1}`, odds: Number(op.odds || 0), amt: Number(op.amt || 0) });
      });
    }
    return items;
  }

  function buildSnapshotDataUriV86(plan, day) {
    const items = collectSnapshotItemsV86(plan, day);
    if (!items.length) return null;
    const oddsList = items.map(item => Number(item.odds || 0)).filter(v => v > 0);
    const stakeList = items.map(item => Number(item.amt || 0)).filter(v => v > 0);
    const totalStake = stakeList.length === 1 ? stakeList[0] : stakeList.reduce((sum, v) => sum + v, 0);
    const totalOdds = oddsList.length ? oddsList.reduce((acc, v) => acc * v, 1) : 0;
    const possible = totalStake && totalOdds ? totalStake * totalOdds : 0;
    const lineHeight = 44;
    const baseY = 180;
    const height = baseY + (items.length * lineHeight) + 140;
    const rowSvg = items.map((item, index) => {
      const y = baseY + (index * lineHeight);
      return `
        <rect x="60" y="${y - 26}" width="960" height="34" rx="12" fill="#0f172a" stroke="#334155"/>
        <text x="84" y="${y - 4}" font-size="20" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" font-weight="700">${escapeHtmlV86(item.note)}</text>
        <text x="950" y="${y - 4}" text-anchor="end" font-size="20" font-family="Arial, Helvetica, sans-serif" fill="#fbbf24" font-weight="800">Oran: ${item.odds ? item.odds.toFixed(2) : '-'}</text>`;
    }).join('');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
        <rect width="1080" height="${height}" fill="#020617"/>
        <rect x="28" y="28" width="1024" height="${height - 56}" rx="26" fill="#0b1120" stroke="#334155" stroke-width="2"/>
        <text x="60" y="88" font-size="34" font-family="Arial, Helvetica, sans-serif" fill="#fbbf24" font-weight="900">BAHİS ${plan.days} GÜNLÜK ROLLING</text>
        <text x="60" y="128" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#e5e7eb" font-weight="700">GÜN ${day} · Kupon Özeti</text>
        ${rowSvg}
        <rect x="60" y="${height - 118}" width="960" height="70" rx="16" fill="#111827" stroke="#374151"/>
        <text x="84" y="${height - 78}" font-size="22" font-family="Arial, Helvetica, sans-serif" fill="#e5e7eb" font-weight="700">Toplam Oran: ${totalOdds ? totalOdds.toFixed(2) : '-'}</text>
        <text x="430" y="${height - 78}" font-size="22" font-family="Arial, Helvetica, sans-serif" fill="#e5e7eb" font-weight="700">Tutar: ${moneyV86(totalStake)}</text>
        <text x="996" y="${height - 78}" text-anchor="end" font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#22c55e" font-weight="900">Tahmini Kazanç: ${possible ? moneyV86(possible) : '-'}</text>
      </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function buildSnapshotPanelHtmlV86(plan, day) {
    const dataUri = buildSnapshotDataUriV86(plan, day);
    return `
      <div class="v774-inline-overlay" data-rolling-subpanel-close>
        <div class="v774-inline-panel photo" onclick="event.stopPropagation()">
          <div class="v774-inline-head">
            <div><h3>Kupon Fotoğrafı</h3><span>GÜN ${day} · sadece bu alanın verileri</span></div>
            <button type="button" onclick="omega_CloseRollingSubpanel()">×</button>
          </div>
          <div class="v774-inline-actions">
            <button type="button" onclick="omega_ShowRollingSnapshot(${day})">Resmi Göster</button>
            <button type="button" onclick="omega_DownloadRollingSnapshot(${day})">Resmi İndir</button>
          </div>
          <div class="v774-inline-body">
            ${dataUri ? `<img class="v774-photo-preview" src="${dataUri}" alt="Kupon fotoğrafı">` : `<div class="v774-empty-state">Önce maç, oran ve tutar gir.</div>`}
          </div>
        </div>
      </div>`;
  }

  function ensureSubpanelHostV86() {
    const overlay = qs('#rolling-excel-overlay');
    if (!overlay) return null;
    let host = qs('#v774-rolling-subpanel-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'v774-rolling-subpanel-host';
      overlay.appendChild(host);
    }
    return host;
  }

  function renderRollingSubpanelV86() {
    const host = ensureSubpanelHostV86();
    if (!host) return;
    if (!ROLLING_SUBPANEL) {
      host.innerHTML = '';
      host.style.display = 'none';
      return;
    }
    const plan = ensureRollingPlan();
    let html = '';
    if (ROLLING_SUBPANEL.type === 'pending') html = buildPendingPanelHtmlV86(plan);
    else if (ROLLING_SUBPANEL.type === 'history') html = buildHistoryPanelHtmlV86(plan);
    else if (ROLLING_SUBPANEL.type === 'snapshot') html = buildSnapshotPanelHtmlV86(plan, Number(ROLLING_SUBPANEL.day || 1));
    host.style.display = 'block';
    host.innerHTML = html;
    host.querySelectorAll('[data-rolling-subpanel-close]').forEach(el => el.addEventListener('click', event => {
      if (event.target !== el) return;
      window.omega_CloseRollingSubpanel();
    }));
  }

  window.omega_CloseRollingSubpanel = function() {
    ROLLING_SUBPANEL = null;
    renderRollingSubpanelV86();
  };

  window.omega_OpenRollingPendingBoard = function() {
    captureAllVisibleDraftsV86();
    ROLLING_SUBPANEL = { type: 'pending' };
    renderRollingSubpanelV86();
  };

  window.omega_OpenRollingHistoryBoard = function() {
    captureAllVisibleDraftsV86();
    ROLLING_SUBPANEL = { type: 'history' };
    renderRollingSubpanelV86();
  };

  window.omega_ShowRollingSnapshot = function(day) {
    captureAllVisibleDraftsV86();
    ROLLING_SUBPANEL = { type: 'snapshot', day: Number(day || 1) };
    renderRollingSubpanelV86();
  };

  window.omega_DownloadRollingSnapshot = function(day) {
    captureAllVisibleDraftsV86();
    const plan = ensureRollingPlan();
    const uri = buildSnapshotDataUriV86(plan, Number(day || 1));
    if (!uri) {
      alert('Önce maç, oran ve tutar gir.');
      return;
    }
    const link = document.createElement('a');
    link.href = uri;
    link.download = `bahis-rolling-${plan.days}-gun-${Number(day || 1)}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  function setDayCount(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    const drafts = getDraftListV86(plan, day);
    plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
    drafts.length = Math.max(count, drafts.filter(draftHasDataV86).length);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    plan.ops[day].push(null);
    getDraftListV86(plan, day).push(null);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    const drafts = getDraftListV86(plan, day);
    if (plan.ops[day].length > 1) plan.ops[day].pop();
    if (drafts.length > 1) drafts.pop();
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = setDayCount;

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      const drafts = getDraftListV86(plan, day);
      plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
      drafts.length = Math.max(count, drafts.filter(draftHasDataV86).length);
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = [];
    plan.drafts[day] = [];
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RenderExcelTable = function() {
    const wrapper = qs("#excel-body-content");
    if (!wrapper) return;
    const currentPlan = ensureRollingPlan();
    const rollModeV491 = getRollingModeV86();
    const isCryptoV491 = rollModeV491 === "crypto";
    const overlayV493 = qs("#rolling-excel-overlay");
    if (overlayV493) overlayV493.setAttribute("data-roll-mode", rollModeV491);
    let runningBalance = Number(currentPlan.startBal || 100);
    let totalProfit = 0;
    let htmlBuffer = "";

    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!currentPlan.ops[day]) currentPlan.ops[day] = new Array(10).fill(null);
      if (currentPlan.ops[day].length < 1) currentPlan.ops[day] = new Array(1).fill(null);
      const draftList = getDraftListV86(currentPlan, day);
      if (draftList.length < currentPlan.ops[day].length) draftList.length = currentPlan.ops[day].length;
      const dayOps = currentPlan.ops[day];
      const dayStart = runningBalance;
      let dayProfit = 0;

      const cards = [];
      for (let slot = 0; slot < dayOps.length; slot++) {
        const op = dayOps[slot];
        if (op) {
          const amt = Number(op.amt || 0);
          const odds = Number(op.odds || 0);
          const fee = Math.max(0, Number(op.fee || op.cost || 0));
          const pnl = isCryptoV491 ? (op.netMode === 'amount' ? (op.res === "win" ? Math.abs(odds) - fee : Math.abs(odds) + fee) : Math.abs(amt * (odds / 100))) : (op.res === "win" ? (amt * odds) - amt : amt);
          const effect = op.res === "win" ? pnl : -pnl;
          runningBalance += effect; totalProfit += effect; dayProfit += effect;

          cards.push(`
            <div class="kapsul v32 ${op.res}">
              <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
              <div class="k-result">
                <div class="k-note-show">${escapeHtmlV86(op.note || (isCryptoV491 ? "İşlem" : "Maç"))}</div>
                <b>${isCryptoV491 ? `$${amt} · Net $${Number(odds || 0).toFixed(2)}${Number(op.fee || 0) ? ' · Fee $' + Number(op.fee || 0).toFixed(2) : ''}` : `$${amt} x ${odds}`}</b>
                <span>${effect >= 0 ? '+' : '-'}$${Math.abs(effect).toFixed(2)}</span>
              </div>
            </div>
          `);
        } else {
          const draft = readDraftV86(currentPlan, day, slot);
          cards.push(`
            <div class="kapsul v32">
              <input type="text" id="e-n-${day}-${slot}" placeholder="${isCryptoV491 ? 'İşlem' : 'Maç'}" value="${escapeHtmlV86(draft.note)}" onblur="omega_CaptureRollingDraft(${day}, ${slot})">
              <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar" value="${escapeHtmlV86(draft.amt)}" onblur="omega_CaptureRollingDraft(${day}, ${slot})">
              <input type="number" id="e-o-${day}-${slot}" placeholder="${isCryptoV491 ? 'Net K/Z $' : 'Oran'}" value="${escapeHtmlV86(draft.odds)}" onblur="omega_CaptureRollingDraft(${day}, ${slot})">
              ${isCryptoV491 ? `<input type="number" id="e-f-${day}-${slot}" placeholder="Fee/Funding $" step="0.01" value="${escapeHtmlV86(draft.fee)}" onblur="omega_CaptureRollingDraft(${day}, ${slot})">` : ''}
              <div class="k-actions v32">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">${isCryptoV491 ? "KAZANÇ" : "KAZANDI"}</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">${isCryptoV491 ? "KAYIP" : "KAYBETTİ"}</button>
              </div>
            </div>
          `);
        }
      }

      const betFeatureTools = !isCryptoV491 && day === 1 ? `
        <div class="v774-day-feature-tools">
          <button type="button" class="v774-side-tool active" onclick="omega_OpenRollingPendingBoard()">Aktif Bahisler / Kuponlar</button>
          <button type="button" class="v774-side-tool history" onclick="omega_OpenRollingHistoryBoard()">Geçmiş</button>
        </div>` : '';
      const cameraTool = !isCryptoV491 && day === 1 ? `<button class="gold v774-camera-btn" type="button" onclick="omega_ShowRollingSnapshot(${day})"><i class="fa-solid fa-camera"></i> FOTOĞRAF</button>` : '';

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
              ${cameraTool}
            </div>
            ${betFeatureTools}
          </div>
          <div class="capsule-container v32">${cards.join("")}</div>
          <div class="day-result v32"><small>Gün Sonu</small>$${runningBalance.toFixed(2)}</div>
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

    const targetBal = currentPlan.targetBal || ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
    const progressPercentage = Math.min((runningBalance / targetBal) * 100, 100);
    const progressBar = qs("#excel-progress-bar");
    if (progressBar) progressBar.style.width = progressPercentage + "%";

    omega_SaveRollingDB();
    renderRollingSubpanelV86();
  };

  window.omega_ResolveExcelOp = function(day, slot, result) {
    const draft = window.omega_CaptureRollingDraft(day, slot);
    const note = String(draft.note || '').trim();
    const isCrypto = getRollingModeV86() === 'crypto';
    const amt = parseFloat(draft.amt);
    const odds = parseFloat(draft.odds);
    const fee = Math.max(0, parseFloat(draft.fee) || 0);
    if (isNaN(amt) || isNaN(odds)) {
      if (typeof omega_ShowFinanceToast === 'function') omega_ShowFinanceToast('Tutar ve ilgili oran / net K/Z alanını doldur.');
      else alert('Tutar ve ilgili oran / net K/Z alanını doldur.');
      return;
    }
    const currentPlan = ensureRollingPlan();
    if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
    const historyId = `rh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry = { note, amt, odds, fee, res: result, netMode: isCrypto ? 'amount' : 'odds', resolvedAt: Date.now(), day, slot, historyId };
    currentPlan.ops[day][slot] = entry;
    currentPlan.history.unshift({ ...entry, mode: getRollingModeV86(), days: _ACTIVE_EXCEL_DAYS });
    writeDraftV86(currentPlan, day, slot, {});
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_UndoExcelOp = function(day, slot) {
    const currentPlan = ensureRollingPlan();
    if (currentPlan.ops[day] && currentPlan.ops[day][slot]) {
      const historyId = currentPlan.ops[day][slot].historyId;
      currentPlan.ops[day][slot] = null;
      if (historyId) currentPlan.history = collectHistoryV86(currentPlan).filter(item => item.historyId !== historyId);
      omega_SaveRollingDB();
      omega_RenderExcelTable();
    }
  };
  const oldOpenRolling = window.omega_OpenRollingExcel;
  window.omega_OpenRollingExcel = function(days, skipHash = false) {
    const result = typeof oldOpenRolling === "function" ? oldOpenRolling(days, skipHash) : undefined;
    document.documentElement.classList.remove("rolling-hash-boot");
    document.body.classList.add("rolling-active");
    if(!skipHash) history.replaceState(null, "", `#finance/rolling/${days}`);
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
    const m = String(location.hash || "").match(/^#finance\/rolling\/(\d+)/);
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
