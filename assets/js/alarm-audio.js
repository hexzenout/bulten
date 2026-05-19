// ===============================
// V26 ALARM AUDIO PRO
// Kripto sayfasında görünür. Özel ses, aralık seçimi, 1 dk çalma, durdurma.
// ===============================

(function () {
  const STORE_KEY = "v26_alarm_audio_settings_pro_v1";
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

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  }

  function isCryptoPage() {
    return location.hash === "#crypto" || !!document.querySelector("#omega-crypto-block, #crypto-terminal, .crypto-v10-layout");
  }

  function ensureCryptoClass() {
    document.body.classList.toggle("v26-crypto-page", isCryptoPage());
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
      for (let i = 0; i < 5; i++) {
        beep(i % 2 ? 760 : 430, 0.14, "square", 0.055, i * 0.16);
      }
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
    document.body.classList.remove("v26-alarm-ringing");
    updatePanel();
    notify("Alarm durduruldu.");
  }

  function playCustomLoop(durationMs) {
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

    ringAudio.play().catch(() => {
      notify("Özel ses çalamadı. Tarayıcı izni için SES AKTİF ve TEST kullan.");
    });

    ringTimers.push(setTimeout(stopAlarm, durationMs));
    return true;
  }

  function playAlarm(message = "Fiyat alarmı tetiklendi.") {
    if (!settings.enabled || !unlocked) {
      notify("Alarm tetiklendi ama ses kapalı. Önce SES AKTİF butonuna bas.");
      return;
    }

    stopAlarm();
    isRinging = true;
    document.body.classList.add("v26-alarm-ringing");
    updatePanel();

    const durationSec = Math.max(60, Number(settings.durationSec || 60));
    const durationMs = durationSec * 1000;

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
    let el = document.getElementById("v26-alarm-mini-notice");
    if (!el) {
      el = document.createElement("div");
      el.id = "v26-alarm-mini-notice";
      el.style.cssText = `
        position:fixed;right:18px;bottom:18px;z-index:60000;
        background:#101010;border:1px solid #fbbf24;color:#fff;
        border-radius:12px;padding:12px 14px;font-size:13px;font-weight:800;
        box-shadow:0 18px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(8px);
        transition:.2s;max-width:360px;line-height:1.35;
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
    }, 4500);
  }

  function injectStyles() {
    if (document.getElementById("v26-alarm-audio-pro-style")) return;

    const style = document.createElement("style");
    style.id = "v26-alarm-audio-pro-style";
    style.textContent = `
      .v26-audio-pill {
        position: fixed;
        right: 18px;
        top: 74px;
        z-index: 25000;
        display: none;
        align-items: center;
        gap: 8px;
        background: rgba(15,15,15,.96);
        border: 1px solid #333;
        border-radius: 999px;
        padding: 8px 10px;
        box-shadow: 0 12px 35px rgba(0,0,0,.35);
        font-family: Inter, sans-serif;
      }

      body.v26-crypto-page .v26-audio-pill {
        display: flex;
      }

      .v26-audio-pill button,
      .v26-audio-pill select {
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

      .v26-audio-pill button.stop {
        display: none;
        background: #ef4444;
        border-color: #ef4444;
        color: white;
      }

      body.v26-alarm-ringing .v26-audio-pill button.stop {
        display: inline-flex;
      }

      .v26-audio-pill .v26-audio-settings {
        display: none;
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        width: 320px;
        background: #101010;
        border: 1px solid #333;
        border-radius: 16px;
        padding: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,.55);
        gap: 9px;
      }

      .v26-audio-pill.open .v26-audio-settings {
        display: grid;
      }

      .v26-audio-settings label {
        display: grid;
        gap: 5px;
        color: #aaa;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .5px;
      }

      .v26-audio-settings input,
      .v26-audio-settings select {
        width: 100%;
        background: #070707;
        border: 1px solid #333;
        color: #fff;
        border-radius: 10px;
        padding: 9px;
        font-size: 12px;
        font-family: 'JetBrains Mono', monospace;
      }

      .v26-audio-settings small {
        color: #888;
        font-size: 11px;
        line-height: 1.45;
      }

      @media(max-width:760px){
        .v26-audio-pill{
          left:10px;
          right:10px;
          top:auto;
          bottom:12px;
          justify-content:center;
          flex-wrap:wrap;
          border-radius:16px;
        }

        .v26-audio-pill .v26-audio-settings {
          left: 0;
          right: 0;
          width: 100%;
          bottom: calc(100% + 8px);
          top: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    injectStyles();
    ensureCryptoClass();

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
        <option value="custom">Özel Ses</option>
      </select>
      <button id="v26-audio-test-btn">TEST</button>
      <button class="stop" id="v26-audio-stop-btn">DURDUR</button>
      <button id="v26-audio-settings-btn">AYAR</button>

      <div class="v26-audio-settings">
        <label>Alarm çalma süresi saniye
          <input id="v26-audio-duration" type="number" min="60" step="10">
        </label>
        <label>Ses yüksekliği
          <input id="v26-audio-volume" type="range" min="0" max="1" step="0.05">
        </label>
        <label>Özel ses yükle
          <input id="v26-audio-file" type="file" accept="audio/*">
        </label>
        <label>Başlangıç saniyesi
          <input id="v26-audio-start" type="number" min="0" step="1">
        </label>
        <label>Bitiş saniyesi
          <input id="v26-audio-end" type="number" min="0" step="1">
        </label>
        <small>Özel ses tarayıcı hafızasına kaydedilir. Başlangıç/bitiş girersen şarkının sadece o aralığı döngüye alınır.</small>
      </div>
    `;

    document.body.appendChild(panel);

    const unlockBtn = document.getElementById("v26-audio-unlock-btn");
    const soundSel = document.getElementById("v26-audio-sound");
    const testBtn = document.getElementById("v26-audio-test-btn");
    const stopBtn = document.getElementById("v26-audio-stop-btn");
    const settingsBtn = document.getElementById("v26-audio-settings-btn");
    const durationInput = document.getElementById("v26-audio-duration");
    const volumeInput = document.getElementById("v26-audio-volume");
    const fileInput = document.getElementById("v26-audio-file");
    const startInput = document.getElementById("v26-audio-start");
    const endInput = document.getElementById("v26-audio-end");

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
      updatePanel();
      playBuiltinOnce(settings.sound);
      notify("Alarm sesi aktif.");
    };

    soundSel.onchange = () => {
      settings.sound = soundSel.value;
      saveSettings();
      if (unlocked) playBuiltinOnce(settings.sound);
    };

    testBtn.onclick = () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      updatePanel();
      playAlarm("Alarm sesi test edildi.");
    };

    stopBtn.onclick = stopAlarm;

    settingsBtn.onclick = () => {
      panel.classList.toggle("open");
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
        soundSel.value = "custom";
        saveSettings();
        notify("Özel alarm sesi kaydedildi: " + file.name);
      };
      reader.readAsDataURL(file);
    };

    updatePanel();
  }

  function updatePanel() {
    const btn = document.getElementById("v26-audio-unlock-btn");
    const sound = document.getElementById("v26-audio-sound");
    if (!btn || !sound) return;

    sound.value = settings.sound || "digital";
    btn.classList.toggle("active", unlocked && settings.enabled);
    btn.textContent = unlocked && settings.enabled ? "SES AÇIK" : "SES AKTİF";
  }

  function boot() {
    createPanel();

    window.addEventListener("hashchange", () => {
      setTimeout(ensureCryptoClass, 50);
      setTimeout(ensureCryptoClass, 400);
    });

    setInterval(ensureCryptoClass, 1200);

    window.addEventListener("v26-alarm-fired", (e) => {
      const msg = e.detail?.message || "Fiyat alarmı tetiklendi.";
      playAlarm(msg);
    });
  }

  window.V26AlarmAudio = {
    play: playAlarm,
    stop: stopAlarm,
    unlock: () => {
      ensureAudioContext();
      unlocked = true;
      settings.enabled = true;
      saveSettings();
      updatePanel();
    },
    getSettings: () => ({ ...settings }),
    setSettings: (next) => {
      settings = { ...settings, ...next };
      settings.durationSec = Math.max(60, Number(settings.durationSec || 60));
      saveSettings();
      updatePanel();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
