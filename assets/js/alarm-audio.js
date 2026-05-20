// v43_alarm_audio_blob
// ===============================
// V28 ALARM AUDIO MODULE
// Floating panel yok. Ses ayarları Kripto Pro Panel > Ses sekmesine basılır.
// ===============================

(function () {
  const STORE_KEY = "v28_alarm_audio_settings";
  const DEFAULTS = {
    enabled: false,
    sound: "digital",
    volume: 0.75,
    durationSec: 60,
    customDataUrl: "",
    customName: "",
    customStart: 0,
    customEnd: 0
  };

  let settings = loadSettings();
  let audioCtx = null;
  let unlocked = false;
  let ringTimers = [];
  let ringAudio = null;
  let isRinging = false;
  let customObjectUrl = "";

  const DB_NAME = "omega_alarm_audio_db";
  const DB_STORE = "files";
  const DB_KEY = "custom-audio";

  function openAudioDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveCustomFileToDb(file) {
    if (customObjectUrl) URL.revokeObjectURL(customObjectUrl);
    customObjectUrl = URL.createObjectURL(file);

    settings.customDataUrl = "";
    settings.customName = file.name;
    settings.sound = "custom";
    settings.enabled = true;
    saveSettings();

    try {
      const db = await openAudioDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(file, DB_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (err) {
      notify("Özel ses bu oturumda yüklendi; tarayıcı kalıcı kayda izin vermedi.");
    }

    return { ...settings };
  }

  async function loadCustomObjectUrlFromDb() {
    if (customObjectUrl) return customObjectUrl;
    if (!settings.customName) return "";
    try {
      const db = await openAudioDb();
      const file = await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const req = tx.objectStore(DB_STORE).get(DB_KEY);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      if (!file) return "";
      customObjectUrl = URL.createObjectURL(file);
      return customObjectUrl;
    } catch {
      return "";
    }
  }

  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; }
    catch { return { ...DEFAULTS }; }
  }

  function saveSettings() {
    settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  }

  function ensureAudioContext() {
    const Cls = window.AudioContext || window.webkitAudioContext;
    if (!Cls) return null;
    if (!audioCtx) audioCtx = new Cls();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, duration, type = "sine", gainValue = 0.08, delay = 0) {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(gainValue * settings.volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.03);
  }

  function playBuiltinOnce(soundName) {
    if (soundName === "silent") return;

    if (soundName === "bip") {
      beep(920, 0.16, "sine", 0.09, 0);
      beep(920, 0.16, "sine", 0.09, 0.24);
      return;
    }

    if (soundName === "chime") {
      beep(660, 0.18, "sine", 0.07, 0);
      beep(880, 0.2, "sine", 0.07, 0.18);
      beep(1320, 0.22, "sine", 0.06, 0.38);
      return;
    }

    if (soundName === "siren") {
      for (let i = 0; i < 5; i++) beep(i % 2 ? 760 : 430, 0.14, "square", 0.055, i * 0.16);
      return;
    }

    beep(1180, 0.08, "square", 0.045, 0);
    beep(870, 0.08, "square", 0.045, 0.11);
    beep(1180, 0.08, "square", 0.045, 0.22);
    beep(870, 0.16, "square", 0.045, 0.33);
  }

  function clearRingTimers() {
    ringTimers.forEach(t => clearTimeout(t));
    ringTimers = [];
  }

  function stopAlarm() {
    clearRingTimers();

    if (ringAudio) {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      } catch {}
    }

    isRinging = false;
    document.body.classList.remove("v28-alarm-ringing");
    updateUI();
    notify("Alarm durduruldu.");
  }

  function playCustomLoop(durationMs) {
    const start = Math.max(0, Number(settings.customStart || 0));
    const end = Math.max(0, Number(settings.customEnd || 0));

    const playFromSrc = (src) => {
      if (!src) return false;

      ringAudio = new Audio(src);
      ringAudio.volume = Math.max(0, Math.min(1, Number(settings.volume || 0.75)));
      ringAudio.currentTime = start;

      ringAudio.ontimeupdate = () => {
        if (end > start && ringAudio.currentTime >= end) {
          ringAudio.currentTime = start;
          ringAudio.play().catch(() => {});
        }
      };

      ringAudio.onended = () => {
        if (isRinging) {
          ringAudio.currentTime = start;
          ringAudio.play().catch(() => {});
        }
      };

      ringAudio.play().catch(() => notify("Özel ses çalamadı. Önce Ses Aç / Test butonunu kullan."));
      ringTimers.push(setTimeout(stopAlarm, durationMs));
      return true;
    };

    const immediateSrc = customObjectUrl || settings.customDataUrl;
    if (immediateSrc) return playFromSrc(immediateSrc);

    if (settings.customName) {
      loadCustomObjectUrlFromDb().then(src => {
        if (isRinging && src) playFromSrc(src);
        else if (isRinging) {
          playBuiltinOnce("digital");
          notify("Özel ses bulunamadı. Varsayılan ses çalıyor.");
        }
      });
      ringTimers.push(setTimeout(stopAlarm, durationMs));
      return true;
    }

    return false;
  }

  function playAlarm(message = "Fiyat alarmı tetiklendi.") {
    if (!settings.enabled || !unlocked) {
      notify("Alarm tetiklendi ama ses kapalı. Ses sekmesinden SES AKTİF yap.");
      return;
    }

    stopAlarm();
    isRinging = true;
    document.body.classList.add("v28-alarm-ringing");
    updateUI();

    const durationMs = Math.max(60, Number(settings.durationSec || 60)) * 1000;
    notify(message + " Alarm çalıyor.");

    if (settings.sound === "custom" && settings.customDataUrl) {
      playCustomLoop(durationMs);
      return;
    }

    const every = settings.sound === "siren" ? 900 : 1200;
    const count = Math.ceil(durationMs / every);

    for (let i = 0; i < count; i++) {
      ringTimers.push(setTimeout(() => {
        if (isRinging) playBuiltinOnce(settings.sound);
      }, i * every));
    }

    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  function notify(text) {
    let el = document.getElementById("v28-alarm-notice");
    if (!el) {
      el = document.createElement("div");
      el.id = "v28-alarm-notice";
      el.className = "v28-alarm-notice";
      document.body.appendChild(el);
    }

    el.textContent = text;
    el.classList.add("show");

    clearTimeout(window.__v28AlarmNoticeTimer);
    window.__v28AlarmNoticeTimer = setTimeout(() => el.classList.remove("show"), 4500);
  }

  function renderUI() {
    const mount = document.getElementById("v28-sound-mount");
    if (!mount || mount.dataset.ready === "1" || mount.dataset.ready === "v32") return;
    mount.dataset.ready = "1";

    mount.innerHTML = `
      <div class="v28-sound-card">
        <div class="v28-card-title">
          <b>Alarm Sesi</b>
          <span>Ses izni, özel şarkı ve çalma süresi.</span>
        </div>

        <div class="v28-sound-actions">
          <button class="terminal-v10-btn green" id="v28-audio-unlock-btn">SES AKTİF</button>
          <button class="terminal-v10-btn" id="v28-audio-test-btn">TEST</button>
          <button class="terminal-v10-btn red" id="v28-audio-stop-btn">DURDUR</button>
        </div>

        <div class="v28-form-grid">
          <label>Ses Tipi<select id="v28-audio-sound">
            <option value="digital">Dijital</option>
            <option value="bip">Bip</option>
            <option value="chime">Chime</option>
            <option value="siren">Siren</option>
            <option value="silent">Sessiz</option>
            <option value="custom">Özel Ses</option>
          </select></label>

          <label>Çalma Süresi<input id="v28-audio-duration" type="number" min="60" step="10"></label>
          <label>Ses Seviyesi<input id="v28-audio-volume" type="range" min="0" max="1" step="0.05"></label>
          <label>Özel Ses<input id="v28-audio-file" type="file" accept="audio/*"></label>
          <label>Başlangıç Sn<input id="v28-audio-start" type="number" min="0" step="1"></label>
          <label>Bitiş Sn<input id="v28-audio-end" type="number" min="0" step="1"></label>
        </div>

        <div class="v28-help-text">Özel ses tarayıcı hafızasına kaydedilir. Başlangıç/bitiş girersen şarkının sadece o aralığı döngüye alınır. Minimum alarm süresi 60 saniyedir.</div>
      </div>
    `;

    bindUI();
    updateUI();
  }

  function bindUI() {
    const unlockBtn = document.getElementById("v28-audio-unlock-btn");
    const testBtn = document.getElementById("v28-audio-test-btn");
    const stopBtn = document.getElementById("v28-audio-stop-btn");
    const soundSel = document.getElementById("v28-audio-sound");
    const durationInput = document.getElementById("v28-audio-duration");
    const volumeInput = document.getElementById("v28-audio-volume");
    const fileInput = document.getElementById("v28-audio-file");
    const startInput = document.getElementById("v28-audio-start");
    const endInput = document.getElementById("v28-audio-end");

    if (!unlockBtn) return;

    soundSel.value = settings.sound;
    durationInput.value = Math.max(60, settings.durationSec || 60);
    volumeInput.value = settings.volume;
    startInput.value = settings.customStart || 0;
    endInput.value = settings.customEnd || 0;

    unlockBtn.onclick = () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      updateUI();
      playBuiltinOnce(settings.sound);
      notify("Alarm sesi aktif.");
    };

    testBtn.onclick = () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      updateUI();
      playAlarm("Alarm sesi test edildi.");
    };

    stopBtn.onclick = stopAlarm;

    soundSel.onchange = () => {
      settings.sound = soundSel.value;
      saveSettings();
      if (unlocked) playBuiltinOnce(settings.sound);
    };

    durationInput.oninput = () => {
      settings.durationSec = Math.max(60, Number(durationInput.value || 60));
      durationInput.value = settings.durationSec;
      saveSettings();
    };

    volumeInput.oninput = () => {
      settings.volume = Number(volumeInput.value || 0.75);
      saveSettings();
    };

    startInput.oninput = () => {
      settings.customStart = Math.max(0, Number(startInput.value || 0));
      saveSettings();
    };

    endInput.oninput = () => {
      settings.customEnd = Math.max(0, Number(endInput.value || 0));
      saveSettings();
    };

    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        settings.customDataUrl = String(reader.result || "");
        settings.customName = file.name;
        settings.sound = "custom";
        saveSettings();
        soundSel.value = "custom";
        notify("Özel alarm sesi kaydedildi: " + file.name);
      };
      reader.readAsDataURL(file);
    };
  }

  function updateUI() {
    const btn = document.getElementById("v28-audio-unlock-btn");
    const stopBtn = document.getElementById("v28-audio-stop-btn");
    const sound = document.getElementById("v28-audio-sound");
    if (sound) sound.value = settings.sound || "digital";

    if (btn) {
      btn.classList.toggle("active", unlocked && settings.enabled);
      btn.textContent = unlocked && settings.enabled ? "SES AÇIK" : "SES AKTİF";
    }

    if (stopBtn) stopBtn.style.display = isRinging ? "" : "none";
  }

  function boot() {
    loadCustomObjectUrlFromDb();
    // V37: Görsel ses paneli artık sadece v32-professional.js tarafından çizilir.
    // Bu dosya yalnızca ses çalma, durdurma ve ayar saklama motoru olarak kalır.
    window.addEventListener("v26-alarm-fired", (e) => {
      const msg = e.detail?.message || "Fiyat alarmı tetiklendi.";
      playAlarm(msg);
    });
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    testSelected: () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      playAlarm("Alarm sesi test edildi.");
    },
    stop: stopAlarm,
    unlock: () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      updateUI();
    },
    getSettings: () => ({ ...settings }),
    setCustomFile: async (file) => {
      const next = await saveCustomFileToDb(file);
      updateUI();
      notify("Özel alarm sesi yüklendi: " + file.name);
      return next;
    },
    setSettings: (next) => {
      settings = { ...settings, ...next };
      settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
      saveSettings();
      updateUI();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
