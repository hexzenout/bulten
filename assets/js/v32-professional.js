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

  let v503PreviewAudio = null;
  let v503PreviewUrl = "";
  let v503PreviewTimer = null;
  let v503Duration = 1;

  function v503Format(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v503IsAudioFile(file) {
    if (!file) return false;
    const typeOk = String(file.type || "").startsWith("audio/");
    const extOk = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name || "");
    return typeOk || extOk;
  }

  function v503Stop() {
    if (v503PreviewTimer) {
      clearTimeout(v503PreviewTimer);
      v503PreviewTimer = null;
    }
    if (v503PreviewAudio) {
      try {
        v503PreviewAudio.pause();
        v503PreviewAudio.currentTime = 0;
      } catch {}
    }
    if (v503PreviewUrl) {
      try { URL.revokeObjectURL(v503PreviewUrl); } catch {}
    }
    v503PreviewAudio = null;
    v503PreviewUrl = "";
    qs("#v503-play-selected")?.classList.remove("playing");
    qs("#v503-play-range")?.classList.remove("playing");
    const top = qs("#v32-sound-test");
    if (top) {
      top.classList.remove("testing");
      top.textContent = "OYNAT";
    }
  }

  function v503Settings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next, volume: 1 };
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  async function v503Rows() {
    try {
      return window.V26AlarmAudio?.listCustomFiles ? await window.V26AlarmAudio.listCustomFiles() : [];
    } catch {
      return [];
    }
  }

  async function v503SelectedRow() {
    const id = qs("#v47-custom-select")?.value || (window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "");
    if (!id) return null;
    const rows = await v503Rows();
    return rows.find(row => row.id === id) || null;
  }

  function v503Segment() {
    const sEl = qs("#v503-start");
    const eEl = qs("#v503-end");
    const max = Math.max(1, Number(sEl?.max || eEl?.max || v503Duration || 1));
    let start = Math.max(0, Math.min(max - 1, Number(sEl?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(eEl?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    if (sEl) sEl.value = Math.floor(start);
    if (eEl) eEl.value = Math.floor(end);
    return { start, end, max };
  }

  function v503UpdateUI(current = null) {
    const { start, end, max } = v503Segment();
    const fill = qs("#v503-fill");
    const leftHandle = qs("#v503-left-handle");
    const rightHandle = qs("#v503-right-handle");
    const label = qs("#v503-range-label");
    const currentLabel = qs("#v503-current");
    const totalLabel = qs("#v503-total");
    const playhead = qs("#v503-playhead");
    const progress = qs("#v503-progress");

    const left = (start / max) * 100;
    const right = (end / max) * 100;
    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.width = `${Math.max(0, right - left)}%`;
    }
    if (leftHandle) {
      leftHandle.style.left = `${left}%`;
      leftHandle.querySelector("span") && (leftHandle.querySelector("span").textContent = v503Format(start));
    }
    if (rightHandle) {
      rightHandle.style.left = `${right}%`;
      rightHandle.querySelector("span") && (rightHandle.querySelector("span").textContent = v503Format(end));
    }
    if (label) label.textContent = `${v503Format(start)} - ${v503Format(end)}`;
    if (currentLabel) currentLabel.textContent = v503Format(current ?? start);
    if (totalLabel) totalLabel.textContent = v503Format(max);
    if (progress) {
      progress.max = Math.floor(max);
      progress.value = Math.floor(current ?? start);
    }
    if (playhead) {
      const pct = Math.max(0, Math.min(100, ((current ?? start) / max) * 100));
      playhead.style.left = `${pct}%`;
    }
  }

  async function v503LoadMeta() {
    const row = await v503SelectedRow();
    if (!row?.blob) {
      v503Duration = 1;
      v503UpdateUI(0);
      return;
    }
    const url = URL.createObjectURL(row.blob);
    const audio = new Audio(url);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Math.max(1, Math.floor(audio.duration || 1));
      v503Duration = duration;
      const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
      const start = Math.max(0, Math.min(duration - 1, Number(live.customStart || 0)));
      const rawEnd = Number(live.customEnd || 0);
      const end = rawEnd > start ? Math.min(duration, rawEnd) : duration;
      ["#v503-progress", "#v503-start", "#v503-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = duration;
      });
      if (qs("#v503-start")) qs("#v503-start").value = Math.floor(start);
      if (qs("#v503-end")) qs("#v503-end").value = Math.floor(end);
      v503UpdateUI(start);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => URL.revokeObjectURL(url);
  }

  async function v503PlayCustomRange() {
    const row = await v503SelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }
    v503Stop();
    const { start, end } = v503Segment();
    v503PreviewUrl = URL.createObjectURL(row.blob);
    v503PreviewAudio = new Audio(v503PreviewUrl);
    v503PreviewAudio.volume = 1;

    v503PreviewAudio.onloadedmetadata = async () => {
      const duration = Math.max(1, Number(v503PreviewAudio.duration || 1));
      const safeStart = Math.min(start, duration - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : duration, duration);
      v503PreviewAudio.currentTime = safeStart;
      v503UpdateUI(safeStart);

      v503PreviewAudio.ontimeupdate = () => {
        if (!v503PreviewAudio) return;
        v503UpdateUI(v503PreviewAudio.currentTime);
        if (v503PreviewAudio.currentTime >= safeEnd) v503Stop();
      };
      v503PreviewAudio.onended = v503Stop;
      v503PreviewAudio.onerror = v503Stop;

      qs("#v503-play-selected")?.classList.add("playing");
      qs("#v503-play-range")?.classList.add("playing");
      const top = qs("#v32-sound-test");
      if (top) {
        top.classList.add("testing");
        top.textContent = "ÇALIYOR...";
      }

      try {
        await v503PreviewAudio.play();
        v503PreviewTimer = setTimeout(v503Stop, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v503Stop();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v503PlaySelectedSound() {
    const type = qs("#v32-sound-type")?.value || "custom";
    if (type === "custom") return v503PlayCustomRange();
    v503Stop();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v503Settings({ enabled: true, sound: type, volume: 1 });
    const top = qs("#v32-sound-test");
    if (top) {
      top.classList.add("testing");
      top.textContent = "ÇALIYOR...";
    }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
    setTimeout(() => {
      const top = qs("#v32-sound-test");
      if (top) {
        top.classList.remove("testing");
        top.textContent = "OYNAT";
      }
    }, 1800);
  }

  function v503BindRange() {
    const track = qs("#v503-track");
    const sEl = qs("#v503-start");
    const eEl = qs("#v503-end");
    if (!track || !sEl || !eEl || track.dataset.bound === "1") return;
    track.dataset.bound = "1";

    const secFromEvent = ev => {
      const rect = track.getBoundingClientRect();
      const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(pct * Math.max(1, Number(sEl.max || v503Duration || 1)));
    };

    let drag = null;
    let rangeOffset = 0;

    const setRange = (start, end) => {
      const max = Math.max(1, Number(sEl.max || eEl.max || v503Duration || 1));
      start = Math.max(0, Math.min(max - 1, Number(start)));
      end = Math.max(1, Math.min(max, Number(end)));
      if (end <= start) end = Math.min(max, start + 1);
      sEl.value = Math.floor(start);
      eEl.value = Math.floor(end);
      v503UpdateUI();
    };

    const chooseDrag = (sec, target) => {
      const { start, end } = v503Segment();
      if (target?.id === "v503-left-handle" || target?.closest?.("#v503-left-handle")) return "start";
      if (target?.id === "v503-right-handle" || target?.closest?.("#v503-right-handle")) return "end";
      if (target?.id === "v503-fill" || (sec > start && sec < end)) {
        rangeOffset = sec - start;
        return "range";
      }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "start" : "end";
    };

    const apply = sec => {
      const { start, end, max } = v503Segment();
      const len = Math.max(1, end - start);
      if (drag === "start") setRange(Math.min(sec, end - 1), end);
      else if (drag === "end") setRange(start, Math.max(sec, start + 1));
      else if (drag === "range") {
        let nextStart = Math.max(0, Math.min(max - len, sec - rangeOffset));
        setRange(nextStart, nextStart + len);
      }
    };

    const down = ev => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      drag = chooseDrag(sec, ev.target);
      apply(sec);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };
    const move = ev => {
      if (!drag) return;
      ev.preventDefault();
      apply(secFromEvent(ev));
    };
    const up = () => {
      drag = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };

    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });

    [sEl, eEl].forEach(el => el.addEventListener("input", () => v503UpdateUI()));
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
    v503Settings({ sound: s.sound || "custom", volume: 1 });

    mount.dataset.ready = "v503";
    mount.innerHTML = `
      <div class="v503-sound-card">
        <div class="v503-head"><b>Alarm Ses Merkezi</b></div>

        <div class="v503-main-actions">
          <button id="v32-sound-test">OYNAT</button>
          <button id="v32-sound-stop" class="danger">DURDUR</button>
        </div>

        <div class="v503-type-row">
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

        <div class="v503-custom ${isCustom ? "show" : ""}" id="v47-custom-sound-panel">
          <div class="v503-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>

          <div class="v503-select-row">
            <select id="v47-custom-select" title="Özel ses seç"><option value="">Özel ses seç...</option></select>
            <button type="button" id="v503-play-selected">OYNAT</button>
            <button type="button" id="v47-custom-remove" class="danger">KALDIR</button>
          </div>

          <div class="v503-trim-box">
            <div class="v503-time-row">
              <span id="v503-current">0:00</span>
              <b>Seçili aralık: <strong id="v503-range-label">0:00 - 0:00</strong></b>
              <span id="v503-total">0:00</span>
            </div>

            <div id="v503-track" class="v503-track">
              <div class="v503-track-bg"></div>
              <div id="v503-fill" class="v503-fill"></div>
              <div id="v503-playhead" class="v503-playhead"></div>
              <button type="button" id="v503-left-handle" class="v503-handle left"><span>0:00</span>[</button>
              <button type="button" id="v503-right-handle" class="v503-handle right"><span>0:00</span>]</button>
              <input id="v503-progress" type="range" min="0" max="1" step="1" value="0" hidden>
              <input id="v503-start" type="range" min="0" max="1" step="1" value="0" hidden>
              <input id="v503-end" type="range" min="0" max="1" step="1" value="1" hidden>
            </div>

            <div class="v503-range-actions">
              <button type="button" id="v503-play-range">ARALIĞI DİNLE</button>
              <button type="button" id="v503-apply-range">BU ARALIĞI ALARM YAP</button>
            </div>
          </div>

          <div class="v503-file-row">
            <button type="button" id="v32-file-pick">DOSYA SEÇ</button>
            <span id="v503-file-note">Dosya seçilmedi</span>
            <input id="v32-file-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" hidden>
          </div>
        </div>
      </div>
    `;

    qs("#v32-sound-type").value = s.sound || "custom";

    const stopAll = () => {
      v503Stop();
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
    };

    qs("#v32-sound-stop").onclick = stopAll;
    qs("#v32-sound-test").onclick = v503PlaySelectedSound;

    qs("#v32-sound-type").onchange = e => {
      const type = e.target.value;
      v503Settings({ sound: type, volume: 1 });
      renderSoundPanel(true);
    };

    qs("#v503-play-selected").onclick = v503PlayCustomRange;
    qs("#v503-play-range").onclick = v503PlayCustomRange;

    qs("#v503-apply-range").onclick = () => {
      const { start, end } = v503Segment();
      v503Settings({ sound: "custom", customStart: start, customEnd: end, volume: 1 });
      const btn = qs("#v503-apply-range");
      if (btn) {
        btn.textContent = `AKTİF: ${v503Format(start)} - ${v503Format(end)}`;
        setTimeout(() => btn.textContent = "BU ARALIĞI ALARM YAP", 1800);
      }
    };

    qs("#v32-file-pick").onclick = () => qs("#v32-file-input")?.click();

    qs("#v32-file-input").onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const note = qs("#v503-file-note");
      if (note) note.textContent = "Yükleniyor: " + file.name;

      try {
        if (!v503IsAudioFile(file)) throw new Error("Ses dosyası seç.");
        let row = null;
        if (window.V26AlarmAudio?.addCustomFile) row = await window.V26AlarmAudio.addCustomFile(file);
        if (!row?.id) throw new Error("Dosya kaydedilemedi.");
        if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        v503Settings({ sound: "custom", selectedCustomId: row.id, volume: 1 });
        await renderSoundLibrary();
        const select = qs("#v47-custom-select");
        if (select) select.value = row.id;
        if (note) {
          note.textContent = "Aktif: " + row.name;
          note.title = row.name;
        }
        await v503LoadMeta();
      } catch (err) {
        if (note) note.textContent = "Dosya yüklenemedi.";
        alert("Ses dosyası yüklenemedi. MP3/WAV/OGG/M4A/AAC/FLAC/WEBM gibi geçerli bir ses dosyası seç.");
      } finally {
        e.target.value = "";
      }
    };

    qs("#v47-custom-select").onchange = async e => {
      const id = e.target.value;
      if (!id) return;
      stopAll();
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      v503Settings({ sound: "custom", selectedCustomId: id, volume: 1 });
      await renderSoundLibrary();
      await v503LoadMeta();
    };

    qs("#v47-custom-remove").onclick = async () => {
      const id = qs("#v47-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      stopAll();
      await window.V26AlarmAudio.removeCustomFile(id);
      renderSoundPanel(true);
    };

    renderSoundLibrary().then(() => v503LoadMeta().then(v503BindRange));
  }

  function setV493NowPlaying(text) {
    const note = qs("#v503-file-note");
    if (note) {
      note.textContent = text || "Dosya seçilmedi";
      note.title = text || "";
    }
  }

  async function renderSoundLibrary() {
    const select = qs("#v47-custom-select");
    if (!select || !window.V26AlarmAudio?.listCustomFiles) return;
    const s = window.V26AlarmAudio.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    const files = await window.V26AlarmAudio.listCustomFiles();

    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const label = `${active ? "✓ " : ""}${file.name}`;
      return `<option value="${file.id}" ${active ? "selected" : ""}>${label}</option>`;
    }).join("");

    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";

    const note = qs("#v503-file-note");
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
