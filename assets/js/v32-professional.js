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

  let v50PreviewAudio = null;
  let v50PreviewUrl = "";
  let v50PreviewTimer = null;
  let v50ActiveDuration = 1;

  function v50FormatTime(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v50StopPreview() {
    if (v50PreviewTimer) {
      clearTimeout(v50PreviewTimer);
      v50PreviewTimer = null;
    }
    if (v50PreviewAudio) {
      try { v50PreviewAudio.pause(); } catch {}
    }
    if (v50PreviewUrl) {
      try { URL.revokeObjectURL(v50PreviewUrl); } catch {}
    }
    v50PreviewAudio = null;
    v50PreviewUrl = "";
    qs("#v50-inline-toggle")?.classList.remove("playing");
    const testBtn = qs("#v32-sound-test");
    if (testBtn) {
      testBtn.classList.remove("testing");
      testBtn.textContent = "OYNAT";
    }
  }

  function v50Settings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next, volume: 1 };
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  async function v50Rows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v50SelectedRow() {
    const selectId = qs("#v47-custom-select")?.value;
    const liveId = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "";
    const id = selectId || liveId;
    if (!id) return null;
    const rows = await v50Rows();
    return rows.find(row => row.id === id) || null;
  }

  function v50SetPlayerTime(current = 0, total = v50ActiveDuration) {
    const cur = qs("#v50-time-current");
    const dur = qs("#v50-time-total");
    const progress = qs("#v50-progress");
    const totalSafe = Math.max(1, Number(total || 1));
    if (cur) cur.textContent = v50FormatTime(current);
    if (dur) dur.textContent = v50FormatTime(totalSafe);
    if (progress) {
      progress.max = Math.floor(totalSafe);
      progress.value = Math.min(Number(progress.max), Math.floor(current || 0));
    }
  }

  function v50GetSegment() {
    const startInput = qs("#v50-seg-start");
    const endInput = qs("#v50-seg-end");
    const max = Math.max(1, Number(startInput?.max || endInput?.max || v50ActiveDuration || 1));
    let start = Math.max(0, Math.min(max, Number(startInput?.value || 0)));
    let end = Math.max(0, Math.min(max, Number(endInput?.value || max)));
    if (end <= start) {
      if (start >= max - 1) start = Math.max(0, max - 1);
      end = Math.min(max, start + 1);
    }
    if (startInput) startInput.value = Math.floor(start);
    if (endInput) endInput.value = Math.floor(end);
    return { start, end, max };
  }

  function v50UpdateSelection() {
    const { start, end, max } = v50GetSegment();
    const label = qs("#v50-selection-label");
    const fill = qs("#v50-selection-fill");
    const startBubble = qs("#v501-start-bubble");
    const endBubble = qs("#v501-end-bubble");
    const startBox = qs("#v501-start-box");
    const endBox = qs("#v501-end-box");

    const left = (start / max) * 100;
    const width = Math.max(0, ((end - start) / max) * 100);
    const right = (end / max) * 100;

    if (label) label.textContent = `${v50FormatTime(start)} - ${v50FormatTime(end)}`;
    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.width = `${width}%`;
    }
    const startHandle = qs("#v501-start-handle");
    const endHandle = qs("#v501-end-handle");
    if (startHandle) startHandle.style.left = `${left}%`;
    if (endHandle) endHandle.style.left = `${right}%`;
    if (startBubble) startBubble.textContent = v50FormatTime(start);
    if (endBubble) endBubble.textContent = v50FormatTime(end);
    if (startBox) startBox.value = v50FormatTime(start);
    if (endBox) endBox.value = v50FormatTime(end);
  }

  function v501ParseTime(text, fallback = 0) {
    const raw = String(text || "").trim();
    if (!raw) return fallback;
    if (raw.includes(":")) {
      const parts = raw.split(":").map(x => Number(x || 0));
      if (parts.length >= 2 && parts.every(n => Number.isFinite(n))) {
        return Math.max(0, Math.floor(parts[0] * 60 + parts[1]));
      }
    }
    const n = Number(raw.replace(",", "."));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
  }

  function v501SetSegment(start, end, render = true) {
    const startInput = qs("#v50-seg-start");
    const endInput = qs("#v50-seg-end");
    const max = Math.max(1, Number(startInput?.max || endInput?.max || v50ActiveDuration || 1));
    start = Math.max(0, Math.min(max - 1, Number(start || 0)));
    end = Math.max(1, Math.min(max, Number(end || max)));
    if (end <= start) end = Math.min(max, start + 1);
    if (startInput) startInput.value = Math.floor(start);
    if (endInput) endInput.value = Math.floor(end);
    if (render) v50UpdateSelection();
  }

  function v501BindTrimUI() {
    const track = qs("#v501-trim-track");
    const startInput = qs("#v50-seg-start");
    const endInput = qs("#v50-seg-end");
    if (!track || !startInput || !endInput || track.dataset.bound === "v501") return;
    track.dataset.bound = "v501";

    const secFromEvent = (ev) => {
      const rect = track.getBoundingClientRect();
      const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const max = Math.max(1, Number(startInput.max || endInput.max || v50ActiveDuration || 1));
      return Math.round(pct * max);
    };

    let dragMode = null;
    let dragOffset = 0;

    const chooseMode = (sec, target) => {
      const start = Number(startInput.value || 0);
      const end = Number(endInput.value || v50ActiveDuration || 1);
      if (target?.id === "v501-start-handle" || target?.id === "v501-start-bubble") return "start";
      if (target?.id === "v501-end-handle" || target?.id === "v501-end-bubble") return "end";
      if (target?.id === "v50-selection-fill" || (sec > start && sec < end)) {
        dragOffset = sec - start;
        return "range";
      }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "start" : "end";
    };

    const applyDrag = (sec) => {
      const start = Number(startInput.value || 0);
      const end = Number(endInput.value || v50ActiveDuration || 1);
      const max = Math.max(1, Number(startInput.max || endInput.max || v50ActiveDuration || 1));
      const length = Math.max(1, end - start);

      if (dragMode === "start") {
        v501SetSegment(Math.min(sec, end - 1), end);
      } else if (dragMode === "end") {
        v501SetSegment(start, Math.max(sec, start + 1));
      } else if (dragMode === "range") {
        let newStart = Math.max(0, Math.min(max - length, sec - dragOffset));
        v501SetSegment(newStart, newStart + length);
      }
    };

    const onDown = (ev) => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      dragMode = chooseMode(sec, ev.target);
      applyDrag(sec);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    };
    const onMove = (ev) => {
      ev.preventDefault();
      if (!dragMode) return;
      applyDrag(secFromEvent(ev));
    };
    const onUp = () => {
      dragMode = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    track.addEventListener("mousedown", onDown);
    track.addEventListener("touchstart", onDown, { passive: false });

    qs("#v501-start-box")?.addEventListener("change", e => {
      const end = Number(endInput.value || v50ActiveDuration || 1);
      v501SetSegment(v501ParseTime(e.target.value, Number(startInput.value || 0)), end);
    });
    qs("#v501-end-box")?.addEventListener("change", e => {
      const start = Number(startInput.value || 0);
      v501SetSegment(start, v501ParseTime(e.target.value, Number(endInput.value || v50ActiveDuration || 1)));
    });
  }

  async function v50LoadMeta() {
    const row = await v50SelectedRow();
    if (!row?.blob) {
      v50ActiveDuration = 1;
      v50SetPlayerTime(0, 0);
      v50UpdateSelection();
      return;
    }

    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(a.duration || 1));
      v50ActiveDuration = total;
      const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
      const start = Math.max(0, Math.min(total - 1, Number(live.customStart || 0)));
      const rawEnd = Number(live.customEnd || 0);
      const end = rawEnd > start ? Math.min(total, rawEnd) : total;

      ["#v50-progress", "#v50-seg-start", "#v50-seg-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = total;
      });

      const s = qs("#v50-seg-start");
      const e = qs("#v50-seg-end");
      if (s) s.value = Math.floor(start);
      if (e) e.value = Math.floor(end);

      v50SetPlayerTime(start, total);
      v50UpdateSelection();
      v501BindTrimUI();
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  async function v50PlayCustomPreview() {
    const row = await v50SelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }

    v50StopPreview();

    const { start, end } = v50GetSegment();
    v50PreviewUrl = URL.createObjectURL(row.blob);
    v50PreviewAudio = new Audio(v50PreviewUrl);
    v50PreviewAudio.volume = 1;

    v50PreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v50PreviewAudio.duration || 1));
      const safeStart = Math.min(start, total - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : total, total);
      v50PreviewAudio.currentTime = safeStart;
      v50SetPlayerTime(safeStart, total);

      v50PreviewAudio.ontimeupdate = () => {
        if (!v50PreviewAudio) return;
        v50SetPlayerTime(v50PreviewAudio.currentTime, total);
        if (v50PreviewAudio.currentTime >= safeEnd) v50StopPreview();
      };
      v50PreviewAudio.onended = v50StopPreview;
      v50PreviewAudio.onerror = v50StopPreview;

      qs("#v50-inline-toggle")?.classList.add("playing");
      const topBtn = qs("#v32-sound-test");
      if (topBtn) {
        topBtn.classList.add("testing");
        topBtn.textContent = "ÇALIYOR...";
      }

      try {
        await v50PreviewAudio.play();
        v50PreviewTimer = setTimeout(v50StopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v50StopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v50PlaySelectedSound() {
    const type = qs("#v32-sound-type")?.value || "custom";
    if (type === "custom") {
      await v50PlayCustomPreview();
      return;
    }

    v50StopPreview();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings({ enabled: true, sound: type, volume: 1 });
    setSoundSettings({ enabled: true, sound: type, volume: 1 });
    const topBtn = qs("#v32-sound-test");
    if (topBtn) {
      topBtn.classList.add("testing");
      topBtn.textContent = "ÇALIYOR...";
    }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
  }

  function renderSoundPanel(force = false) {
    const mount = qs("#v28-sound-mount");
    if (!mount) return;
    const pane = mount.closest(".crypto-v28-panel");
    if (pane) {
      Array.from(pane.children).forEach(child => { if (child !== mount) child.remove(); });
    }

    const s = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    const isCustom = (s.sound || "custom") === "custom";
    v50Settings({ sound: s.sound || "custom", volume: 1 });

    mount.dataset.ready = "v50";
    mount.innerHTML = `
      <div class="v32-sound-card v50-sound-card">
        <div class="v50-sound-head"><b>Alarm Ses Merkezi</b></div>

        <div class="v50-main-actions">
          <button id="v32-sound-test">OYNAT</button>
          <button id="v32-sound-stop" class="danger">DURDUR</button>
        </div>

        <div class="v50-type-row">
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

        <div class="v50-custom-panel ${isCustom ? "show" : ""}" id="v47-custom-sound-panel">
          <div class="v50-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>

          <div class="v50-select-row">
            <button type="button" id="v50-inline-toggle" class="v50-inline-toggle" title="Seçili özel sesi oynat / durdur">
              <i class="fa-solid fa-play"></i><i class="fa-solid fa-pause"></i>
            </button>
            <select id="v47-custom-select" class="v50-song-select" title="Özel ses seç"><option value="">Özel ses seç...</option></select>
            <button type="button" id="v47-custom-remove" class="danger" title="Seçili özel sesi kaldır">KALDIR</button>
          </div>

          <div class="v50-player-box v501-trim-box">
            <div class="v501-trim-title">
              <b>ÖZEL SES ARALIĞI</b>
              <span>Başlangıç ve bitiş tutamaçlarını sürükle. Mavi alan alarm aralığıdır.</span>
            </div>

            <div class="v501-time-row">
              <span id="v50-time-current">0:00</span>
              <b>Seçili aralık: <strong id="v50-selection-label">0:00 - 0:00</strong></b>
              <span id="v50-time-total">0:00</span>
            </div>

            <div class="v501-trim-track" id="v501-trim-track">
              <div class="v501-wave"></div>
              <div id="v50-selection-fill" class="v50-selection-fill v501-selection-fill"></div>
              <div id="v501-start-handle" class="v501-handle start"><span id="v501-start-bubble">0:00</span></div>
              <div id="v501-end-handle" class="v501-handle end"><span id="v501-end-bubble">0:00</span></div>
              <input id="v50-progress" class="v50-progress v501-progress" type="range" min="0" max="1" step="1" value="0" title="Dinleme konumu">
              <input id="v50-seg-start" class="v50-seg-range start v501-hidden-range" type="range" min="0" max="1" step="1" value="0" title="Alarm başlangıcı">
              <input id="v50-seg-end" class="v50-seg-range end v501-hidden-range" type="range" min="0" max="1" step="1" value="1" title="Alarm bitişi">
            </div>

            <div class="v501-manual-row">
              <label>Başlangıç <input id="v501-start-box" value="0:00" inputmode="numeric"></label>
              <label>Bitiş <input id="v501-end-box" value="0:00" inputmode="numeric"></label>
              <button type="button" id="v50-apply-segment">SEÇİLİ ARALIĞI ALARM YAP</button>
            </div>
          </div>

          <div class="v50-file-row">
            <button type="button" id="v32-file-pick">DOSYA SEÇ</button>
            <span id="v497-upload-note" class="v50-upload-note">Dosya seçilmedi</span>
            <input id="v32-file-input" type="file" accept="audio/*" hidden>
          </div>
        </div>
      </div>
    `;

    qs("#v32-sound-type").value = s.sound || "custom";

    const stopAll = () => {
      v50StopPreview();
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
    };

    qs("#v32-sound-stop").onclick = stopAll;
    qs("#v32-sound-test").onclick = v50PlaySelectedSound;

    qs("#v32-sound-type").onchange = e => {
      const type = e.target.value;
      v50Settings({ sound: type, volume: 1 });
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
        v50Settings({ sound: "custom", selectedCustomId: row.id, volume: 1 });
        await renderSoundLibrary();
        const select = qs("#v47-custom-select");
        if (select) select.value = row.id;
        await v50LoadMeta();
        if (note) {
          note.textContent = "Aktif: " + file.name;
          note.title = file.name;
        }
      } catch (err) {
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
      v50Settings({ sound: "custom", selectedCustomId: id, volume: 1 });
      await renderSoundLibrary();
      await v50LoadMeta();
    };

    qs("#v50-inline-toggle").onclick = async e => {
      e.preventDefault();
      e.stopPropagation();
      const btn = qs("#v50-inline-toggle");
      if (btn.classList.contains("playing")) {
        stopAll();
        return;
      }
      await v50PlayCustomPreview();
    };

    qs("#v47-custom-remove").onclick = async () => {
      const id = qs("#v47-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      stopAll();
      await window.V26AlarmAudio.removeCustomFile(id);
      await renderSoundLibrary();
      await v50LoadMeta();
    };

    qs("#v50-progress").addEventListener("input", e => {
      if (v50PreviewAudio) {
        v50PreviewAudio.currentTime = Number(e.target.value || 0);
        v50SetPlayerTime(v50PreviewAudio.currentTime, v50PreviewAudio.duration || Number(e.target.max || 1));
      } else {
        v50SetPlayerTime(Number(e.target.value || 0), Number(e.target.max || v50ActiveDuration));
      }
    });

    ["#v50-seg-start", "#v50-seg-end"].forEach(sel => {
      qs(sel)?.addEventListener("input", v50UpdateSelection);
    });

    qs("#v50-apply-segment").onclick = () => {
      const { start, end } = v50GetSegment();
      v50Settings({ sound: "custom", customStart: start, customEnd: end, volume: 1 });
      const btn = qs("#v50-apply-segment");
      if (btn) {
        btn.textContent = `AKTİF: ${v50FormatTime(start)} - ${v50FormatTime(end)}`;
        setTimeout(() => btn.textContent = "SEÇİLİ ARALIĞI ALARM YAP", 1800);
      }
    };

    renderSoundLibrary().then(() => v50LoadMeta().then(v501BindTrimUI));
  }

  function setV493NowPlaying(text) {
    const clean = text || "Dosya seçilmedi";
    const select = qs("#v47-custom-select");
    if (select) select.title = clean;
    const note = qs("#v497-upload-note");
    if (note) {
      note.textContent = clean;
      note.title = clean;
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

    const noteEl = qs("#v497-upload-note");
    if (noteEl) {
      const text = current ? `Aktif: ${current.name}` : "Dosya seçilmedi";
      noteEl.textContent = text;
      noteEl.title = text;
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
