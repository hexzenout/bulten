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

  let v499PreviewAudio = null;
  let v499PreviewUrl = "";
  let v499PreviewTimer = null;

  function v499FormatTime(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v499StopPreview() {
    if (v499PreviewTimer) {
      clearTimeout(v499PreviewTimer);
      v499PreviewTimer = null;
    }
    if (v499PreviewAudio) {
      try {
        v499PreviewAudio.pause();
      } catch {}
    }
    if (v499PreviewUrl) {
      try { URL.revokeObjectURL(v499PreviewUrl); } catch {}
    }
    v499PreviewAudio = null;
    v499PreviewUrl = "";
    qs("#v499-inline-toggle")?.classList.remove("playing");
    const testBtn = qs("#v32-sound-test");
    if (testBtn) {
      testBtn.classList.remove("testing");
      testBtn.textContent = "OYNAT";
    }
  }

  async function v499GetSelectedAudioRow() {
    const id = qs("#v47-custom-select")?.value || (window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "");
    if (!id || !window.V26AlarmAudio?.listCustomFiles) return null;
    const rows = await window.V26AlarmAudio.listCustomFiles();
    return rows.find(row => row.id === id) || null;
  }

  function v499SetTimes(current = 0, total = 0) {
    const cur = qs("#v499-time-current");
    const dur = qs("#v499-time-total");
    const progress = qs("#v499-preview-progress");
    if (cur) cur.textContent = v499FormatTime(current);
    if (dur) dur.textContent = v499FormatTime(total);
    if (progress) {
      progress.max = Math.max(1, Math.floor(total || 1));
      progress.value = Math.min(Number(progress.max), Math.floor(current || 0));
    }
  }

  function v499GetSegment() {
    const startInput = qs("#v499-seg-start");
    const endInput = qs("#v499-seg-end");
    const max = Math.max(1, Number(startInput?.max || endInput?.max || 1));
    let start = Math.max(0, Math.min(max, Number(startInput?.value || 0)));
    let end = Math.max(0, Math.min(max, Number(endInput?.value || max)));
    if (end <= start) {
      end = Math.min(max, start + 1);
      if (end <= start) start = Math.max(0, end - 1);
    }
    if (startInput) startInput.value = Math.floor(start);
    if (endInput) endInput.value = Math.floor(end);
    return { start, end, max };
  }

  function v499UpdateSegmentUI() {
    const { start, end, max } = v499GetSegment();
    const label = qs("#v499-selection-label");
    if (label) label.textContent = `${v499FormatTime(start)} - ${v499FormatTime(end)}`;
    const fill = qs("#v499-selection-fill");
    if (fill) {
      fill.style.left = `${(start / max) * 100}%`;
      fill.style.width = `${Math.max(0, ((end - start) / max) * 100)}%`;
    }
  }

  async function v499LoadMeta() {
    const row = await v499GetSelectedAudioRow();
    const settings = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    if (!row || !row.blob) {
      v499SetTimes(0, 0);
      v499UpdateSegmentUI();
      return;
    }

    const url = URL.createObjectURL(row.blob);
    const audio = new Audio(url);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(audio.duration || 1));
      const start = Math.max(0, Math.min(total - 1, Number(settings.customStart || 0)));
      const rawEnd = Number(settings.customEnd || 0);
      const end = rawEnd > start ? Math.min(total, rawEnd) : total;

      ["#v499-preview-progress", "#v499-seg-start", "#v499-seg-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = total;
      });

      const startInput = qs("#v499-seg-start");
      const endInput = qs("#v499-seg-end");
      if (startInput) startInput.value = Math.floor(start);
      if (endInput) endInput.value = Math.floor(end);

      v499SetTimes(start, total);
      v499UpdateSegmentUI();
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => URL.revokeObjectURL(url);
  }

  async function v499PlayPreview() {
    const row = await v499GetSelectedAudioRow();
    if (!row || !row.blob) {
      alert("Önce özel ses seç.");
      return;
    }

    v499StopPreview();

    const { start, end } = v499GetSegment();
    v499PreviewUrl = URL.createObjectURL(row.blob);
    v499PreviewAudio = new Audio(v499PreviewUrl);
    v499PreviewAudio.volume = 1;

    v499PreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v499PreviewAudio.duration || 1));
      const safeStart = Math.min(start, total - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : total, total);

      v499PreviewAudio.currentTime = safeStart;
      v499SetTimes(safeStart, total);

      v499PreviewAudio.ontimeupdate = () => {
        if (!v499PreviewAudio) return;
        v499SetTimes(v499PreviewAudio.currentTime, total);
        if (v499PreviewAudio.currentTime >= safeEnd) v499StopPreview();
      };

      v499PreviewAudio.onended = v499StopPreview;
      v499PreviewAudio.onerror = v499StopPreview;

      qs("#v499-inline-toggle")?.classList.add("playing");
      const testBtn = qs("#v32-sound-test");
      if (testBtn) {
        testBtn.classList.add("testing");
        testBtn.textContent = "ÇALIYOR...";
      }

      try {
        await v499PreviewAudio.play();
        v499PreviewTimer = setTimeout(v499StopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v499StopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
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

    // Ses seviyesi artık sitede maksimum ve butonsuz.
    setSoundSettings({ volume: 1, sound: s.sound || "custom" });

    mount.dataset.ready = "v499";
    mount.innerHTML = `
      <div class="v32-sound-card v49-sound-card v497-sound-card v499-sound-card">
        <div class="v32-sound-head v497-sound-head">
          <div><b>Alarm Ses Merkezi</b></div>
        </div>

        <div class="v32-sound-actions v49-sound-actions v497-sound-actions v499-sound-actions">
          <button id="v32-sound-test">OYNAT</button>
          <button id="v32-sound-stop" class="danger">DURDUR</button>
        </div>

        <div class="v32-sound-grid v497-sound-grid v499-sound-grid">
          <div class="v32-sound-field">
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
        </div>

        <div class="v47-custom-sound-panel v49-custom-sound-panel v497-custom-sound-panel v499-custom-sound-panel ${isCustom ? "show" : ""}" id="v47-custom-sound-panel">
          <div class="v47-custom-head v497-custom-head">
            <div><b><i class="fa-solid fa-music"></i> Özel Ses Kütüphanesi</b></div>
          </div>

          <div class="v47-custom-select-row v49-custom-select-row v497-custom-select-row v499-custom-select-row">
            <button type="button" id="v499-inline-toggle" class="v497-inline-toggle v499-inline-toggle" title="Seçili özel sesi oynat / durdur">
              <i class="fa-solid fa-play"></i><i class="fa-solid fa-pause"></i>
            </button>
            <select id="v47-custom-select" class="v497-song-select v499-song-select" title="Özel ses seç"><option value="">Özel ses seç...</option></select>
            <button type="button" id="v47-custom-remove" class="danger" title="Seçili özel sesi kaldır">KALDIR</button>
          </div>

          <div class="v499-player-box">
            <div class="v499-player-time">
              <span id="v499-time-current">0:00</span>
              <b>Alarm Aralığı: <strong id="v499-selection-label">0:00 - 0:00</strong></b>
              <span id="v499-time-total">0:00</span>
            </div>

            <div class="v499-timeline">
              <div class="v499-selection-fill" id="v499-selection-fill"></div>
              <input id="v499-preview-progress" class="v499-progress" type="range" min="0" max="1" step="1" value="0" title="Dinleme konumu">
              <input id="v499-seg-start" class="v499-seg-range start" type="range" min="0" max="1" step="1" value="0" title="Başlangıç noktası">
              <input id="v499-seg-end" class="v499-seg-range end" type="range" min="0" max="1" step="1" value="1" title="Bitiş noktası">
            </div>

            <button type="button" id="v499-apply-segment">AKTİF ET</button>
          </div>

          <div class="v32-file-row v47-file-row v49-file-row v497-file-row v499-file-row">
            <button type="button" class="v32-file-btn" id="v32-file-pick">DOSYA SEÇ</button>
            <span class="v497-upload-note" id="v497-upload-note">Dosya seçilmedi</span>
            <input id="v32-file-input" type="file" accept="audio/*" hidden>
          </div>
        </div>
      </div>
    `;

    qs("#v32-sound-type").value = s.sound || "custom";

    const applySettings = next => setSoundSettings({ ...next, volume: 1 });

    const stopSound = () => {
      v499StopPreview();
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
    };

    qs("#v32-sound-stop").onclick = stopSound;
    qs("#v32-sound-test").onclick = async () => v499PlayPreview();

    qs("#v32-sound-type").onchange = e => {
      applySettings({ sound: e.target.value });
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
        if (row?.id && window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        applySettings({ sound: "custom", selectedCustomId: row?.id || (window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "") });
        if (note) note.textContent = file.name;
        await renderSoundLibrary();
        await v499LoadMeta();
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
      stopSound();
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      applySettings({ sound: "custom", selectedCustomId: id });
      await renderSoundLibrary();
      await v499LoadMeta();
    };

    qs("#v499-inline-toggle").onclick = async e => {
      e.preventDefault();
      e.stopPropagation();
      const btn = qs("#v499-inline-toggle");
      if (btn.classList.contains("playing")) {
        stopSound();
        return;
      }
      await v499PlayPreview();
    };

    qs("#v47-custom-remove").onclick = async () => {
      const id = qs("#v47-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      stopSound();
      await window.V26AlarmAudio.removeCustomFile(id);
      renderSoundPanel(true);
    };

    qs("#v499-preview-progress").addEventListener("input", e => {
      if (v499PreviewAudio) {
        v499PreviewAudio.currentTime = Number(e.target.value || 0);
        v499SetTimes(v499PreviewAudio.currentTime, v499PreviewAudio.duration || Number(e.target.max || 1));
      }
    });

    ["#v499-seg-start", "#v499-seg-end"].forEach(sel => {
      qs(sel)?.addEventListener("input", () => v499UpdateSegmentUI());
    });

    qs("#v499-apply-segment").onclick = () => {
      const { start, end } = v499GetSegment();
      applySettings({ sound: "custom", customStart: start, customEnd: end, volume: 1 });
      alert(`Alarm aralığı aktif edildi: ${v499FormatTime(start)} - ${v499FormatTime(end)}`);
    };

    renderSoundLibrary().then(v499LoadMeta);
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
