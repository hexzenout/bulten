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

  let v502PreviewAudio = null;
  let v502PreviewUrl = "";
  let v502PreviewTimer = null;
  let v502Duration = 1;
  let v502Drag = null;
  let v502RangeOffset = 0;

  function v502Time(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v502StopPreview() {
    if (v502PreviewTimer) {
      clearTimeout(v502PreviewTimer);
      v502PreviewTimer = null;
    }
    if (v502PreviewAudio) {
      try { v502PreviewAudio.pause(); } catch {}
    }
    if (v502PreviewUrl) {
      try { URL.revokeObjectURL(v502PreviewUrl); } catch {}
    }
    v502PreviewAudio = null;
    v502PreviewUrl = "";
    qs("#v502-inline-play")?.classList.remove("playing");
    const btn = qs("#v32-sound-test");
    if (btn) {
      btn.classList.remove("testing");
      btn.textContent = "OYNAT";
    }
  }

  function v502ApplySettings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next, volume: 1 };
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  async function v502Rows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v502SelectedRow() {
    const selectId = qs("#v47-custom-select")?.value;
    const liveId = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "";
    const id = selectId || liveId;
    if (!id) return null;
    const rows = await v502Rows();
    return rows.find(row => row.id === id) || null;
  }

  function v502ParseTime(text, fallback = 0) {
    const raw = String(text || "").trim();
    if (!raw) return fallback;
    if (raw.includes(":")) {
      const parts = raw.split(":").map(v => Number(v || 0));
      if (parts.length >= 2 && parts.every(Number.isFinite)) return Math.max(0, Math.floor(parts[0] * 60 + parts[1]));
    }
    const n = Number(raw.replace(",", "."));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
  }

  function v502Segment() {
    const s = qs("#v502-start");
    const e = qs("#v502-end");
    const max = Math.max(1, v502Duration || Number(s?.max || e?.max || 1));
    let start = Math.max(0, Math.min(max - 1, Number(s?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(e?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    if (s) s.value = Math.floor(start);
    if (e) e.value = Math.floor(end);
    return { start, end, max };
  }

  function v502SetSegment(start, end) {
    const max = Math.max(1, v502Duration || 1);
    start = Math.max(0, Math.min(max - 1, Number(start || 0)));
    end = Math.max(1, Math.min(max, Number(end || max)));
    if (end <= start) end = Math.min(max, start + 1);
    const s = qs("#v502-start");
    const e = qs("#v502-end");
    if (s) s.value = Math.floor(start);
    if (e) e.value = Math.floor(end);
    v502RenderRange();
  }

  function v502SetProgress(current = 0) {
    const p = qs("#v502-progress-fill");
    const t = qs("#v502-current-time");
    const pct = Math.max(0, Math.min(100, (Number(current || 0) / Math.max(1, v502Duration)) * 100));
    if (p) p.style.width = `${pct}%`;
    if (t) t.textContent = v502Time(current);
  }

  function v502RenderRange() {
    const { start, end, max } = v502Segment();
    const left = (start / max) * 100;
    const right = (end / max) * 100;
    const width = Math.max(0, right - left);
    const fill = qs("#v502-range-fill");
    const leftHandle = qs("#v502-left-handle");
    const rightHandle = qs("#v502-right-handle");
    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.width = `${width}%`;
    }
    if (leftHandle) leftHandle.style.left = `${left}%`;
    if (rightHandle) rightHandle.style.left = `${right}%`;
    const label = qs("#v502-range-label");
    if (label) label.textContent = `${v502Time(start)} - ${v502Time(end)}`;
    const startBox = qs("#v502-start-box");
    const endBox = qs("#v502-end-box");
    if (startBox) startBox.value = v502Time(start);
    if (endBox) endBox.value = v502Time(end);
  }

  function v502TrackSeconds(ev) {
    const track = qs("#v502-track");
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * Math.max(1, v502Duration));
  }

  function v502BindTrack() {
    const track = qs("#v502-track");
    if (!track || track.dataset.bound === "v502") return;
    track.dataset.bound = "v502";

    const modeFor = (sec, target) => {
      const { start, end } = v502Segment();
      if (target?.id === "v502-left-handle") return "left";
      if (target?.id === "v502-right-handle") return "right";
      if (target?.id === "v502-range-fill" || (sec > start && sec < end)) {
        v502RangeOffset = sec - start;
        return "range";
      }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "left" : "right";
    };

    const apply = (sec) => {
      const { start, end, max } = v502Segment();
      const len = Math.max(1, end - start);
      if (v502Drag === "left") v502SetSegment(Math.min(sec, end - 1), end);
      else if (v502Drag === "right") v502SetSegment(start, Math.max(sec, start + 1));
      else if (v502Drag === "range") {
        const ns = Math.max(0, Math.min(max - len, sec - v502RangeOffset));
        v502SetSegment(ns, ns + len);
      }
    };

    const down = (ev) => {
      ev.preventDefault();
      const sec = v502TrackSeconds(ev);
      v502Drag = modeFor(sec, ev.target);
      apply(sec);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };
    const move = (ev) => {
      ev.preventDefault();
      if (!v502Drag) return;
      apply(v502TrackSeconds(ev));
    };
    const up = () => {
      v502Drag = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };

    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });
  }

  async function v502LoadMeta() {
    const row = await v502SelectedRow();
    if (!row?.blob) {
      v502Duration = 1;
      v502SetProgress(0);
      v502SetSegment(0, 1);
      return;
    }
    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      v502Duration = Math.max(1, Math.floor(a.duration || 1));
      const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
      const start = Math.max(0, Math.min(v502Duration - 1, Number(live.customStart || 0)));
      const rawEnd = Number(live.customEnd || 0);
      const end = rawEnd > start ? Math.min(v502Duration, rawEnd) : v502Duration;
      const total = qs("#v502-total-time");
      if (total) total.textContent = v502Time(v502Duration);
      const startInp = qs("#v502-start");
      const endInp = qs("#v502-end");
      if (startInp) startInp.max = v502Duration;
      if (endInp) endInp.max = v502Duration;
      v502SetSegment(start, end);
      v502SetProgress(start);
      v502BindTrack();
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  async function v502PlayCustom() {
    const row = await v502SelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }
    v502StopPreview();
    const { start, end } = v502Segment();
    v502PreviewUrl = URL.createObjectURL(row.blob);
    v502PreviewAudio = new Audio(v502PreviewUrl);
    v502PreviewAudio.volume = 1;
    v502PreviewAudio.onloadedmetadata = async () => {
      const dur = Math.max(1, Number(v502PreviewAudio.duration || 1));
      const safeStart = Math.min(start, dur - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : dur, dur);
      v502PreviewAudio.currentTime = safeStart;
      v502SetProgress(safeStart);
      qs("#v502-inline-play")?.classList.add("playing");
      const top = qs("#v32-sound-test");
      if (top) {
        top.classList.add("testing");
        top.textContent = "ÇALIYOR...";
      }
      v502PreviewAudio.ontimeupdate = () => {
        if (!v502PreviewAudio) return;
        v502SetProgress(v502PreviewAudio.currentTime);
        if (v502PreviewAudio.currentTime >= safeEnd) v502StopPreview();
      };
      v502PreviewAudio.onended = v502StopPreview;
      v502PreviewAudio.onerror = v502StopPreview;
      try {
        await v502PreviewAudio.play();
        v502PreviewTimer = setTimeout(v502StopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v502StopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v502PlaySelected() {
    const type = qs("#v32-sound-type")?.value || "custom";
    if (type === "custom") return v502PlayCustom();

    v502StopPreview();
    if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v502ApplySettings({ enabled: true, sound: type, volume: 1 });
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
    }, 1800);
  }

  function renderSoundPanel(force = false) {
    const mount = qs("#v28-sound-mount");
    if (!mount) return;
    const pane = mount.closest(".crypto-v28-panel");
    if (pane) Array.from(pane.children).forEach(child => { if (child !== mount) child.remove(); });

    const s = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    const isCustom = (s.sound || "custom") === "custom";
    v502ApplySettings({ sound: s.sound || "custom", volume: 1 });

    mount.dataset.ready = "v502";
    mount.innerHTML = `
      <div class="v502-sound-card">
        <div class="v502-head"><b>Alarm Ses Merkezi</b></div>

        <div class="v502-main-actions">
          <button id="v32-sound-test">OYNAT</button>
          <button id="v32-sound-stop" class="danger">DURDUR</button>
        </div>

        <div class="v502-type-row">
          <label>Ses Tipi</label>
          <select id="v32-sound-type">
            <option value="custom">Özel Ses</option>
            <option value="digital">Dijital Uyarı</option>
            <option value="bip">Standart Bip</option>
            <option value="chime">Yumuşak Chime</option>
            <option value="siren">Siren</option>
            <option value="silent">Sessiz</option>
          </select>
        </div>

        <div class="v502-custom ${isCustom ? "show" : ""}" id="v47-custom-sound-panel">
          <div class="v502-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>

          <div class="v502-select-row">
            <button type="button" id="v502-inline-play" class="v502-inline-play">OYNAT</button>
            <select id="v47-custom-select" class="v502-song-select"><option value="">Özel ses seç...</option></select>
            <button type="button" id="v47-custom-remove" class="danger">KALDIR</button>
          </div>

          <div class="v502-trim">
            <div class="v502-time-row">
              <span id="v502-current-time">0:00</span>
              <b>Alarm Aralığı: <strong id="v502-range-label">0:00 - 0:00</strong></b>
              <span id="v502-total-time">0:00</span>
            </div>

            <div class="v502-track" id="v502-track">
              <div class="v502-progress-base"></div>
              <div class="v502-progress-fill" id="v502-progress-fill"></div>
              <div class="v502-range-fill" id="v502-range-fill"></div>
              <button type="button" class="v502-handle left" id="v502-left-handle" aria-label="Başlangıç">[</button>
              <button type="button" class="v502-handle right" id="v502-right-handle" aria-label="Bitiş">]</button>
            </div>

            <input id="v502-start" type="hidden" value="0" max="1">
            <input id="v502-end" type="hidden" value="1" max="1">

            <div class="v502-manual">
              <label>Başlangıç <input id="v502-start-box" value="0:00"></label>
              <label>Bitiş <input id="v502-end-box" value="0:00"></label>
              <button type="button" id="v502-apply">BU ARALIĞI ALARM YAP</button>
            </div>
          </div>

          <div class="v502-file-row">
            <button type="button" id="v32-file-pick">DOSYA SEÇ</button>
            <span id="v497-upload-note">Dosya seçilmedi</span>
            <input id="v32-file-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" hidden>
          </div>
        </div>
      </div>
    `;

    qs("#v32-sound-type").value = s.sound || "custom";

    const stopAll = () => {
      v502StopPreview();
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
    };

    qs("#v32-sound-stop").onclick = stopAll;
    qs("#v32-sound-test").onclick = v502PlaySelected;

    qs("#v32-sound-type").onchange = e => {
      v502ApplySettings({ sound: e.target.value, volume: 1 });
      renderSoundPanel(true);
    };

    qs("#v32-file-pick").onclick = () => qs("#v32-file-input")?.click();
    qs("#v32-file-input").onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const note = qs("#v497-upload-note");
      if (note) note.textContent = "Yükleniyor: " + file.name;
      try {
        let row = null;
        if (window.V26AlarmAudio?.addCustomFile) row = await window.V26AlarmAudio.addCustomFile(file);
        if (!row?.id) throw new Error("Dosya kaydedilemedi.");
        if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        v502ApplySettings({ sound: "custom", selectedCustomId: row.id, volume: 1 });
        await renderSoundLibrary();
        const sel = qs("#v47-custom-select");
        if (sel) sel.value = row.id;
        await v502LoadMeta();
        if (note) {
          note.textContent = "Aktif: " + file.name;
          note.title = file.name;
        }
      } catch (err) {
        console.error("Özel ses yükleme hatası:", err);
        if (note) note.textContent = "Dosya yüklenemedi.";
        alert("Ses dosyası yüklenemedi. MP3/WAV gibi geçerli bir ses dosyası seç.");
      } finally {
        e.target.value = "";
      }
    };

    qs("#v47-custom-select").onchange = async e => {
      const id = e.target.value;
      if (!id) return;
      stopAll();
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      v502ApplySettings({ sound: "custom", selectedCustomId: id, volume: 1 });
      await renderSoundLibrary();
      await v502LoadMeta();
    };

    qs("#v502-inline-play").onclick = async e => {
      e.preventDefault();
      if (qs("#v502-inline-play")?.classList.contains("playing")) stopAll();
      else await v502PlayCustom();
    };

    qs("#v47-custom-remove").onclick = async () => {
      const id = qs("#v47-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      stopAll();
      await window.V26AlarmAudio.removeCustomFile(id);
      await renderSoundLibrary();
      await v502LoadMeta();
    };

    qs("#v502-start-box")?.addEventListener("change", e => {
      const { end } = v502Segment();
      v502SetSegment(v502ParseTime(e.target.value, 0), end);
    });
    qs("#v502-end-box")?.addEventListener("change", e => {
      const { start } = v502Segment();
      v502SetSegment(start, v502ParseTime(e.target.value, v502Duration));
    });

    qs("#v502-apply").onclick = () => {
      const { start, end } = v502Segment();
      v502ApplySettings({ sound: "custom", customStart: start, customEnd: end, volume: 1 });
      const btn = qs("#v502-apply");
      if (btn) {
        btn.textContent = `AKTİF: ${v502Time(start)} - ${v502Time(end)}`;
        setTimeout(() => btn.textContent = "BU ARALIĞI ALARM YAP", 1600);
      }
    };

    renderSoundLibrary().then(v502LoadMeta).then(v502BindTrack);
  }

  function setV493NowPlaying(text) {
    const note = qs("#v497-upload-note");
    if (note) {
      note.textContent = text || "Dosya seçilmedi";
      note.title = text || "Dosya seçilmedi";
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
      const label = `${active ? "✓ " : ""}${file.name}${size ? " · " + size : ""}`;
      return `<option value="${file.id}" ${active ? "selected" : ""}>${label}</option>`;
    }).join("");

    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";

    const note = qs("#v497-upload-note");
    if (note) {
      const text = current ? `Aktif: ${current.name}` : "Dosya seçilmedi";
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
    if (!_ROLLING_DB[_ACTIVE_EXCEL_DAYS]) _ROLLING_DB[_ACTIVE_EXCEL_DAYS] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {} };
    const plan = _ROLLING_DB[_ACTIVE_EXCEL_DAYS];
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
          const odds = Number(op.odds || 0);
          const pnl = isCryptoV491 ? Math.abs(amt * (odds / 100)) : (op.res === "win" ? (amt * odds) - amt : amt);
          if (op.res === "win") { runningBalance += pnl; totalProfit += pnl; dayProfit += pnl; }
          else { runningBalance -= pnl; totalProfit -= pnl; dayProfit -= pnl; }

          cards.push(`
            <div class="kapsul v32 ${op.res}">
              <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
              <div class="k-result">
                <div class="k-note-show">${op.note || (isCryptoV491 ? "İşlem" : "Maç")}</div>
                <b>$${amt} x ${odds}</b>
                <span>${op.res === "win" ? "+" : "-"}$${pnl.toFixed(2)}</span>
              </div>
            </div>
          `);
        } else {
          cards.push(`
            <div class="kapsul v32">
              <input type="text" id="e-n-${day}-${slot}" placeholder="${isCryptoV491 ? 'İşlem' : 'Maç'}">
              <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
              <input type="number" id="e-o-${day}-${slot}" placeholder="${isCryptoV491 ? 'Kâr %' : 'Oran'}">
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
