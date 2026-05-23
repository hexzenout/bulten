// ===============================
// V512 CLEAN SOUND ENGINE
// Builtin sesler + özel ses yükleme/oynatma + seçili aralık.
// ===============================

(function () {
  const SETTINGS_KEY = "v28_alarm_audio_settings";
  const DB_NAME = "omega_alarm_audio_db";
  const STORE = "custom_sounds";

  const DEFAULTS = {
    enabled: true,
    sound: "digital",
    volume: 1,
    durationSec: 60,
    customStart: 0,
    customEnd: 0,
    selectedCustomId: ""
  };

  let settings = loadSettings();
  let audioCtx = null;
  let ringAudio = null;
  let ringTimers = [];
  let isRinging = false;
  let objectUrls = new Map();

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"), volume: 1 };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    settings.volume = 1;
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
    window.__v28AlarmNoticeTimer = setTimeout(() => el.classList.remove("show"), 3000);
  }

  function ensureAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function mimeFromName(name) {
    const n = String(name || "").toLowerCase();
    if (n.endsWith(".mp3")) return "audio/mpeg";
    if (n.endsWith(".wav")) return "audio/wav";
    if (n.endsWith(".ogg") || n.endsWith(".opus")) return "audio/ogg";
    if (n.endsWith(".m4a")) return "audio/mp4";
    if (n.endsWith(".aac")) return "audio/aac";
    if (n.endsWith(".flac")) return "audio/flac";
    if (n.endsWith(".webm")) return "audio/webm";
    return "audio/*";
  }

  function isAcceptedAudioFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("audio/")) return true;
    return /\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)$/i.test(file.name || "");
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
      req.onblocked = () => reject(new Error("IndexedDB blocked"));
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
    return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
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
    if (!isAcceptedAudioFile(file)) throw new Error("Geçerli ses dosyası seç.");
    const id = "aud_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const type = file.type && file.type.startsWith("audio/") ? file.type : mimeFromName(file.name);
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type });
    const row = {
      id,
      name: file.name || "Özel Ses",
      type,
      size: file.size || blob.size || 0,
      createdAt: Date.now(),
      blob
    };
    await dbPut(row);
    settings.sound = "custom";
    settings.enabled = true;
    settings.selectedCustomId = id;
    settings.customStart = 0;
    settings.customEnd = 0;
    settings.volume = 1;
    saveSettings();
    notify("Özel ses yüklendi: " + row.name);
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

  function clearTimers() {
    ringTimers.forEach(t => clearTimeout(t));
    ringTimers = [];
  }

  function stopAlarm() {
    clearTimers();
    isRinging = false;
    if (ringAudio) {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      } catch {}
    }
    ringAudio = null;
    document.body.classList.remove("v28-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v46b-audio-ringing", { detail: { ringing: false } }));
  }

  function beep(freq, duration, type = "sine", delay = 0) {
    try {
      ensureAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime + delay;
      osc.start(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      osc.stop(now + duration / 1000 + 0.03);
    } catch {}
  }

  function playBuiltinOnce(kind) {
    if (kind === "silent") return;
    if (kind === "bip") {
      beep(920, 180, "square", 0);
      beep(720, 160, "square", 0.22);
      return;
    }
    if (kind === "chime") {
      beep(660, 180, "sine", 0);
      beep(880, 220, "sine", 0.18);
      beep(1175, 260, "sine", 0.38);
      return;
    }
    if (kind === "siren") {
      beep(580, 260, "sawtooth", 0);
      beep(980, 260, "sawtooth", 0.27);
      return;
    }
    beep(740, 180, "triangle", 0);
    beep(1040, 180, "triangle", 0.2);
  }

  function playBuiltinLoop(durationMs) {
    const kind = settings.sound || "digital";
    playBuiltinOnce(kind);
    const every = kind === "siren" ? 700 : 1100;
    const count = Math.max(1, Math.ceil(durationMs / every));
    for (let i = 1; i < count; i++) {
      ringTimers.push(setTimeout(() => {
        if (isRinging) playBuiltinOnce(kind);
      }, i * every));
    }
    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  async function playCustom(durationMs) {
    const src = await getObjectUrl(settings.selectedCustomId);
    if (!src) {
      notify("Seçili özel ses bulunamadı.");
      playBuiltinLoop(durationMs);
      return;
    }

    const start = Math.max(0, Number(settings.customStart || 0));
    const end = Math.max(0, Number(settings.customEnd || 0));

    ringAudio = new Audio(src);
    ringAudio.volume = 1;

    ringAudio.onloadedmetadata = () => {
      try {
        const total = Math.max(0, Number(ringAudio.duration || 0));
        ringAudio.currentTime = total ? Math.min(start, Math.max(0, total - 0.1)) : start;
      } catch {}
    };

    const stopFromAudio = () => {
      if (isRinging) stopAlarm();
    };

    ringAudio.ontimeupdate = () => {
      if (!isRinging || !ringAudio) return;
      if (end > start && ringAudio.currentTime >= end) stopFromAudio();
    };
    ringAudio.onended = stopFromAudio;
    ringAudio.onerror = stopFromAudio;

    try {
      await ringAudio.play();
    } catch (err) {
      notify("Özel ses çalamadı. Dosyayı tekrar seçip OYNAT'a bas.");
      playBuiltinLoop(durationMs);
      return;
    }

    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  async function playAlarm(message = "Alarm sesi test edildi.") {
    ensureAudioContext();
    settings.enabled = true;
    settings.volume = 1;
    saveSettings();

    stopAlarm();
    isRinging = true;
    document.body.classList.add("v28-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v46b-audio-ringing", { detail: { ringing: true } }));

    const durationMs = Math.max(3, Number(settings.durationSec || 60)) * 1000;

    if (settings.sound === "custom") await playCustom(durationMs);
    else playBuiltinLoop(durationMs);
  }

  function boot() {
    window.addEventListener("v26-alarm-fired", e => {
      playAlarm(e.detail?.message || "Fiyat alarmı tetiklendi.");
    });
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    testSelected: async () => playAlarm("Alarm sesi test edildi."),
    stop: stopAlarm,
    unlock: () => {
      ensureAudioContext();
      settings.enabled = true;
      settings.volume = 1;
      saveSettings();
    },
    getSettings: () => ({ ...settings, volume: 1 }),
    setSettings: next => {
      settings = { ...settings, ...next, volume: 1 };
      settings.durationSec = Math.max(3, Number(settings.durationSec || 60));
      saveSettings();
    },
    addCustomFile,
    listCustomFiles: dbGetAll,
    getCustomFile: dbGet,
    getCustomUrl: getObjectUrl,
    removeCustomFile: async id => {
      await dbDelete(id);
      if (settings.selectedCustomId === id) {
        settings.selectedCustomId = "";
        settings.sound = "digital";
        settings.customStart = 0;
        settings.customEnd = 0;
        saveSettings();
      }
      notify("Özel ses kaldırıldı.");
    },
    selectCustomFile: async id => {
      const row = await dbGet(id);
      if (!row) throw new Error("Ses bulunamadı.");
      settings.selectedCustomId = id;
      settings.sound = "custom";
      settings.enabled = true;
      settings.volume = 1;
      saveSettings();
      notify("Aktif özel ses: " + row.name);
      return row;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
