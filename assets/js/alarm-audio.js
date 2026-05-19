// ===============================
// V26 ALARM AUDIO SYSTEM
// Ses izni, sınırsız alarm sesi, alarm yakalama
// ===============================

(function () {
  const STORE_KEY = "v26_alarm_audio_settings";
  const DEFAULT_SETTINGS = {
    enabled: false,
    sound: "digital",
    volume: 0.75,
    customUrl: "",
    repeat: 3,
    cooldownMs: 15000
  };

  let audioCtx = null;
  let unlocked = false;
  let lastPlayedMap = new Map();

  function loadSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  }

  let settings = loadSettings();

  function ensureAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
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

  function playBuiltin(soundName) {
    if (soundName === "silent") return;

    if (soundName === "bip") {
      beep(920, 0.18, "sine", 0.09, 0);
      beep(920, 0.18, "sine", 0.09, 0.26);
      return;
    }

    if (soundName === "chime") {
      beep(660, 0.18, "sine", 0.07, 0);
      beep(880, 0.22, "sine", 0.07, 0.18);
      beep(1320, 0.28, "sine", 0.06, 0.40);
      return;
    }

    if (soundName === "siren") {
      for (let i = 0; i < 7; i++) {
        beep(i % 2 ? 720 : 440, 0.16, "square", 0.055, i * 0.18);
      }
      return;
    }

    // digital default
    beep(1200, 0.09, "square", 0.045, 0);
    beep(900, 0.09, "square", 0.045, 0.12);
    beep(1200, 0.09, "square", 0.045, 0.24);
    beep(900, 0.18, "square", 0.045, 0.36);
  }

  async function playCustomUrl(url) {
    return new Promise((resolve) => {
      if (!url) return resolve(false);
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, settings.volume));
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().then(() => resolve(true)).catch(() => resolve(false));
    });
  }

  async function playAlarm(reason = "Alarm") {
    if (!settings.enabled || !unlocked) {
      showMiniNotice("Alarm tetiklendi ama ses kapalı. Önce Ses Aktif butonuna bas.");
      return;
    }

    if (settings.sound === "custom" && settings.customUrl) {
      const ok = await playCustomUrl(settings.customUrl);
      if (ok) return;
    }

    const repeat = Math.max(1, Math.min(20, Number(settings.repeat || 1)));
    for (let i = 0; i < repeat; i++) {
      setTimeout(() => playBuiltin(settings.sound), i * 850);
    }

    showMiniNotice(reason);
  }

  function showMiniNotice(text) {
    let el = document.getElementById("v26-alarm-mini-notice");
    if (!el) {
      el = document.createElement("div");
      el.id = "v26-alarm-mini-notice";
      el.style.cssText = `
        position:fixed;right:18px;bottom:18px;z-index:60000;
        background:#101010;border:1px solid #fbbf24;color:#fff;
        border-radius:12px;padding:12px 14px;font-size:13px;font-weight:800;
        box-shadow:0 18px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(8px);
        transition:.2s;max-width:320px;line-height:1.35;
      `;
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    clearTimeout(window.__v26AlarmNoticeTimer);
    window.__v26AlarmNoticeTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
    }, 3500);
  }

  function injectPanelStyles() {
    if (document.getElementById("v26-alarm-audio-style")) return;
    const style = document.createElement("style");
    style.id = "v26-alarm-audio-style";
    style.textContent = `
      .v26-audio-pill {
        position: fixed;
        right: 18px;
        top: 74px;
        z-index: 25000;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(15,15,15,.96);
        border: 1px solid #333;
        border-radius: 999px;
        padding: 8px 10px;
        box-shadow: 0 12px 35px rgba(0,0,0,.35);
        font-family: Inter, sans-serif;
      }
      .v26-audio-pill button {
        border: 1px solid #333;
        background: #171717;
        color: #eee;
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
      }
      .v26-audio-pill button.active {
        background: #10b981;
        border-color: #10b981;
        color: #00170d;
      }
      .v26-audio-pill select,
      .v26-audio-pill input {
        background:#070707;border:1px solid #333;color:#fff;
        border-radius:999px;padding:7px 9px;font-size:12px;
        max-width:150px;
      }
      @media(max-width:760px){
        .v26-audio-pill{left:10px;right:10px;top:auto;bottom:12px;justify-content:center;flex-wrap:wrap;border-radius:16px}
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    injectPanelStyles();
    if (document.getElementById("v26-alarm-audio-panel")) return;

    const panel = document.createElement("div");
    panel.id = "v26-alarm-audio-panel";
    panel.className = "v26-audio-pill";
    panel.innerHTML = `
      <button id="v26-audio-unlock-btn">SES AKTİF</button>
      <select id="v26-audio-sound">
        <option value="digital">Dijital</option>
        <option value="bip">Bip</option>
        <option value="chime">Chime</option>
        <option value="siren">Siren</option>
        <option value="silent">Sessiz</option>
        <option value="custom">Özel URL</option>
      </select>
      <button id="v26-audio-test-btn">TEST</button>
    `;
    document.body.appendChild(panel);

    const unlockBtn = document.getElementById("v26-audio-unlock-btn");
    const soundSel = document.getElementById("v26-audio-sound");
    const testBtn = document.getElementById("v26-audio-test-btn");

    soundSel.value = settings.sound || "digital";

    function updateUnlockButton() {
      unlockBtn.classList.toggle("active", unlocked && settings.enabled);
      unlockBtn.textContent = unlocked && settings.enabled ? "SES AÇIK" : "SES AKTİF";
    }

    unlockBtn.onclick = async () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings(settings);
      updateUnlockButton();
      playBuiltin(settings.sound);
      showMiniNotice("Alarm sesi aktif.");
    };

    soundSel.onchange = () => {
      settings.sound = soundSel.value;
      if (settings.sound === "custom") {
        const url = prompt("Özel alarm sesi URL'si gir. MP3/WAV bağlantısı olmalı:", settings.customUrl || "");
        if (url !== null) settings.customUrl = url.trim();
      }
      saveSettings(settings);
      if (unlocked) playBuiltin(settings.sound);
    };

    testBtn.onclick = () => {
      if (!unlocked) {
        ensureAudioContext();
        unlocked = true;
        settings.enabled = true;
        saveSettings(settings);
        updateUnlockButton();
      }
      playAlarm("Alarm sesi test edildi.");
    };

    updateUnlockButton();
  }

  function alarmKeyFromElement(el) {
    const txt = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
    return txt.slice(0, 180) || el.id || el.className || "alarm";
  }

  function scanDomForHitAlarms() {
    const candidates = document.querySelectorAll(
      ".alarm-v12-row.hit, .alarm-v13-row.hit, .v26-alarm-hit, [data-alarm-hit='true'], [data-alarm-status='hit']"
    );

    candidates.forEach((el) => {
      const key = alarmKeyFromElement(el);
      const now = Date.now();
      const last = lastPlayedMap.get(key) || 0;
      if (now - last < settings.cooldownMs) return;

      lastPlayedMap.set(key, now);
      playAlarm("Fiyat alarmı tetiklendi.");
    });
  }

  function boot() {
    createPanel();

    // Existing crypto modules may dispatch this event.
    window.addEventListener("v26-alarm-fired", (e) => {
      const reason = e.detail?.message || e.detail?.reason || "Fiyat alarmı tetiklendi.";
      playAlarm(reason);
    });

    setInterval(scanDomForHitAlarms, 1200);
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    unlock: () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings(settings);
    },
    getSettings: () => ({ ...settings }),
    setSettings: (next) => {
      settings = { ...settings, ...next };
      saveSettings(settings);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
