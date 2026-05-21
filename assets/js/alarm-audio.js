// ===============================
// V46B ALARM AUDIO LIBRARY
// IndexedDB özel ses kütüphanesi + test/durdur/kaldır.
// ===============================

(function () {
  const SETTINGS_KEY = "v28_alarm_audio_settings";
  const DB_NAME = "omega_alarm_audio_library_v46b";
  const STORE = "tracks";

  const DEFAULTS = {
    enabled: false,
    sound: "digital",
    volume: 0.75,
    durationSec: 60,
    customStart: 0,
    customEnd: 0,
    selectedCustomId: ""
  };

  let settings = loadSettings();
  let audioCtx = null;
  let unlocked = false;
  let isRinging = false;
  let ringAudio = null;
  let ringTimers = [];
  let objectUrls = new Map();

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("v46b-audio-settings-updated", { detail: { settings: { ...settings } } }));
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

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGetAll() {
    const db = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async function dbGet(id) {
    if (!id) return null;
    const db = await openDb();
    const row = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row;
  }

  async function dbPut(row) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(row);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function dbDelete(id) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    if (objectUrls.has(id)) {
      URL.revokeObjectURL(objectUrls.get(id));
      objectUrls.delete(id);
    }
  }

  async function addCustomFile(file) {
    if (!file || !file.type.startsWith("audio/")) throw new Error("Ses dosyası seç.");
    const id = "aud_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const row = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: Date.now(),
      blob: file
    };
    await dbPut(row);
    settings.sound = "custom";
    settings.enabled = true;
    settings.selectedCustomId = id;
    saveSettings();
    notify("Özel ses yüklendi: " + file.name);
    return row;
  }

  async function getObjectUrl(id) {
    if (!id) return "";
    if (objectUrls.has(id)) return objectUrls.get(id);
    const row = await dbGet(id);
    if (!row || !row.blob) return "";
    const url = URL.createObjectURL(row.blob);
    objectUrls.set(id, url);
    return url;
  }

  function ensureAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    unlocked = true;
  }

  function beep(freq, duration, type = "sine", volume = 0.05, delay = 0) {
    try {
      ensureAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = Math.max(0, Math.min(1, Number(settings.volume || 0.75))) * volume;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const start = audioCtx.currentTime + delay;
      osc.start(start);
      osc.stop(start + duration);
    } catch {}
  }

  function playBuiltinOnce(soundName) {
    if (soundName === "silent") return;
    if (soundName === "bip") { beep(980, .22, "sine", .07); return; }
    if (soundName === "chime") { beep(660, .14, "sine", .05); beep(990, .22, "sine", .05, .16); return; }
    if (soundName === "siren") {
      for (let i=0;i<5;i++) beep(i % 2 ? 760 : 430, .14, "square", .055, i*.16);
      return;
    }
    beep(1180, .08, "square", .045, 0);
    beep(870, .08, "square", .045, .11);
    beep(1180, .08, "square", .045, .22);
    beep(870, .16, "square", .045, .33);
  }

  function clearTimers() {
    ringTimers.forEach(t => clearTimeout(t));
    ringTimers = [];
  }

  function stopAlarm() {
    clearTimers();
    if (ringAudio) {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      } catch {}
    }
    ringAudio = null;
    isRinging = false;
    document.body.classList.remove("v28-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v46b-audio-ringing", { detail: { ringing: false } }));
    notify("Alarm durduruldu.");
  }

  async function playCustomLoop(durationMs) {
    const src = await getObjectUrl(settings.selectedCustomId);
    if (!src) {
      notify("Seçili özel ses bulunamadı.");
      playBuiltinLoop(durationMs);
      return;
    }

    const start = Math.max(0, Number(settings.customStart || 0));
    const end = Math.max(0, Number(settings.customEnd || 0));

    ringAudio = new Audio(src);
    ringAudio.volume = Math.max(0, Math.min(1, Number(settings.volume || 0.75)));
    ringAudio.currentTime = start;

    ringAudio.ontimeupdate = () => {
      if (!isRinging) return;
      if (end > start && ringAudio.currentTime >= end) {
        ringAudio.currentTime = start;
        ringAudio.play().catch(() => {});
      }
    };

    ringAudio.onended = () => {
      if (!isRinging) return;
      ringAudio.currentTime = start;
      ringAudio.play().catch(() => {});
    };

    try {
      await ringAudio.play();
    } catch (err) {
      notify("Özel ses çalamadı. Dosyayı tekrar seçip Test Et'e bas.");
      playBuiltinLoop(durationMs);
      return;
    }

    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  function playBuiltinLoop(durationMs) {
    const every = settings.sound === "siren" ? 900 : 1200;
    const count = Math.ceil(durationMs / every);
    for (let i=0;i<count;i++) {
      ringTimers.push(setTimeout(() => { if (isRinging) playBuiltinOnce(settings.sound); }, i*every));
    }
    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  async function playAlarm(message = "Fiyat alarmı tetiklendi.") {
    if (!settings.enabled || !unlocked) {
      notify("Alarm tetiklendi ama ses kapalı. Ses sekmesinden SES AÇ yap.");
      return;
    }

    stopAlarm();
    isRinging = true;
    document.body.classList.add("v28-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v46b-audio-ringing", { detail: { ringing: true } }));

    const durationMs = Math.max(60, Number(settings.durationSec || 60)) * 1000;
    notify(message + " Alarm çalıyor.");

    if (settings.sound === "custom") {
      await playCustomLoop(durationMs);
    } else {
      playBuiltinLoop(durationMs);
    }
  }

  function boot() {
    window.addEventListener("v26-alarm-fired", e => {
      playAlarm(e.detail?.message || "Fiyat alarmı tetiklendi.");
    });
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    testSelected: async () => {
      ensureAudioContext();
      settings.enabled = true;
      saveSettings();
      await playAlarm("Alarm sesi test edildi.");
    },
    stop: stopAlarm,
    unlock: () => {
      ensureAudioContext();
      settings.enabled = true;
      saveSettings();
    },
    getSettings: () => ({ ...settings }),
    setSettings: next => {
      settings = { ...settings, ...next };
      settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
      saveSettings();
    },
    addCustomFile,
    listCustomFiles: dbGetAll,
    removeCustomFile: async id => {
      await dbDelete(id);
      if (settings.selectedCustomId === id) {
        settings.selectedCustomId = "";
        settings.sound = "digital";
        saveSettings();
      }
      notify("Özel ses kaldırıldı.");
    },
    selectCustomFile: async id => {
      const row = await dbGet(id);
      if (!row) throw new Error("Ses bulunamadı");
      settings.selectedCustomId = id;
      settings.sound = "custom";
      settings.enabled = true;
      saveSettings();
      notify("Aktif özel ses: " + row.name);
      return row;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
