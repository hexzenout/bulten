// ===============================
// V27 ALARM AUDIO CORE
// Görünür panel oluşturmaz. Kontroller Alarm Merkezi içinden yönetilir.
// Özel ses, başlangıç/bitiş aralığı, minimum 60 saniye çalma destekler.
// ===============================

(function () {
  const STORE_KEY = "v27_alarm_audio_settings";
  const DEFAULTS = {
    enabled: false,
    unlocked: false,
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
  let ringTimers = [];
  let ringAudio = null;
  let isRinging = false;

  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; }
    catch { return { ...DEFAULTS }; }
  }

  function saveSettings() {
    settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("v27-alarm-audio-change", { detail: getSettings() }));
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
    gain.gain.exponentialRampToValueAtTime(gainValue * Number(settings.volume || 0.75), ctx.currentTime + delay + 0.02);
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
      beep(880, 0.20, "sine", 0.07, 0.18);
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

  function clearTimers() {
    ringTimers.forEach(t => clearTimeout(t));
    ringTimers = [];
  }

  function stopAlarm() {
    clearTimers();
    if (ringAudio) {
      try { ringAudio.pause(); ringAudio.currentTime = 0; } catch {}
    }
    isRinging = false;
    document.body.classList.remove("v27-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v27-alarm-audio-stop", { detail: getSettings() }));
  }

  function playCustom(durationMs) {
    if (!settings.customDataUrl) return false;
    const start = Math.max(0, Number(settings.customStart || 0));
    const end = Math.max(0, Number(settings.customEnd || 0));
    ringAudio = new Audio(settings.customDataUrl);
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
    ringAudio.play().catch(() => notify("Özel ses çalamadı. Önce Ses Aktif/Test kullan."));
    ringTimers.push(setTimeout(stopAlarm, durationMs));
    return true;
  }

  function notify(text) {
    let el = document.getElementById("v27-mini-notice");
    if (!el) {
      el = document.createElement("div");
      el.id = "v27-mini-notice";
      el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:60000;background:#101010;border:1px solid #fbbf24;color:#fff;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:800;box-shadow:0 18px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(8px);transition:.2s;max-width:360px;line-height:1.35;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    clearTimeout(window.__v27MiniNoticeTimer);
    window.__v27MiniNoticeTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
    }, 4500);
  }

  function playAlarm(message = "Fiyat alarmı tetiklendi.") {
    if (!settings.enabled || !settings.unlocked) {
      notify("Alarm tetiklendi ama ses kapalı. Alarm Merkezi > Ses Aktif butonuna bas.");
      return;
    }

    stopAlarm();
    isRinging = true;
    document.body.classList.add("v27-alarm-ringing");
    window.dispatchEvent(new CustomEvent("v27-alarm-audio-start", { detail: { message, settings: getSettings() } }));

    const durationSec = Math.max(60, Number(settings.durationSec || 60));
    const durationMs = durationSec * 1000;
    notify(message + " Alarm çalıyor.");

    if (settings.sound === "custom" && settings.customDataUrl) {
      if (playCustom(durationMs)) return;
    }

    const every = settings.sound === "siren" ? 900 : 1200;
    const count = Math.ceil(durationMs / every);
    for (let i = 0; i < count; i++) {
      ringTimers.push(setTimeout(() => { if (isRinging) playBuiltinOnce(settings.sound); }, i * every));
    }
    ringTimers.push(setTimeout(stopAlarm, durationMs));
  }

  function unlock() {
    ensureAudioContext();
    settings.enabled = true;
    settings.unlocked = true;
    saveSettings();
    playBuiltinOnce(settings.sound);
    notify("Alarm sesi aktif.");
  }

  function test() {
    unlock();
    playAlarm("Alarm sesi test edildi.");
  }

  function getSettings() {
    return { ...settings, isRinging };
  }

  function setSettings(next = {}) {
    settings = { ...settings, ...next };
    settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
    saveSettings();
  }

  function setCustomFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(false);
      const reader = new FileReader();
      reader.onload = () => {
        settings.customDataUrl = String(reader.result || "");
        settings.customName = file.name;
        settings.sound = "custom";
        saveSettings();
        resolve(true);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    stop: stopAlarm,
    unlock,
    test,
    getSettings,
    setSettings,
    setCustomFile,
    notify
  };

  window.addEventListener("v26-alarm-fired", (e) => {
    const msg = e.detail?.message || "Fiyat alarmı tetiklendi.";
    playAlarm(msg);
  });
})();
