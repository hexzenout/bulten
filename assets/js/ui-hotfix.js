// ===============================
// V26 UI CLEANUP FINAL
// Auth flash, alarm panel visibility, old alarm cleanup, form readability
// Load this LAST, after firebase.js.
// ===============================

(function () {
  const CRYPTO_HASH = "#crypto";

  function isCryptoPage() {
    return location.hash === CRYPTO_HASH ||
      document.body.classList.contains("crypto-active") ||
      !!document.querySelector("#omega-crypto-block:not([style*='display: none']), .crypto-v10-layout");
  }

  function syncPageClasses() {
    const crypto = isCryptoPage();
    document.body.classList.toggle("v26-is-crypto", crypto);
    document.body.classList.toggle("v26-not-crypto", !crypto);
  }

  function injectFinalCss() {
    if (document.getElementById("v26-ui-cleanup-final-style")) return;

    const style = document.createElement("style");
    style.id = "v26-ui-cleanup-final-style";
    style.textContent = `
      /* AUTH FLASH FIX */
      body:not(.v26-auth-ready) #v26-auth-shell,
      body:not(.v26-auth-ready) .v26-auth-shell {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body.v26-auth-ready #v26-auth-shell,
      body.v26-auth-ready .v26-auth-shell {
        opacity: 1 !important;
        visibility: visible !important;
      }

      /* CLOUD BUTTONS HIDDEN FROM TOP BAR */
      #v26-cloud-save-btn,
      #v26-cloud-load-btn {
        display: none !important;
      }

      /* AUDIO PANEL ONLY ON CRYPTO */
      body:not(.v26-is-crypto) #v26-alarm-audio-panel,
      body:not(.v26-is-crypto) .v26-audio-pill {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body.v26-is-crypto #v26-alarm-audio-panel,
      body.v26-is-crypto .v26-audio-pill {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      /* OLD ALARM BOX CLEANUP */
      .crypto-v12-alarm-box,
      .crypto-v13-alarm-box,
      .alarm-v12-grid,
      .alarm-v13-grid,
      .alarm-v13-help,
      #v12-alarm-list,
      #v12-alarm-price,
      #v12-alarm-dir,
      #v12-alarm-note,
      button[onclick*="omega_V12AddAlarm"],
      button[onclick*="omega_AddAlarm"],
      button[onclick*="omega_SetAlarm"] {
        display: none !important;
      }

      /* CLEAN AUDIO PANEL */
      .v26-audio-pill {
        right: 18px !important;
        top: 74px !important;
        left: auto !important;
        bottom: auto !important;
        max-width: calc(100vw - 36px) !important;
        border-radius: 14px !important;
        padding: 8px !important;
        gap: 7px !important;
        background: rgba(10,10,10,.96) !important;
        border: 1px solid #2f2f2f !important;
        box-shadow: 0 14px 45px rgba(0,0,0,.45) !important;
      }

      .v26-audio-pill button,
      .v26-audio-pill select {
        min-height: 34px !important;
        border-radius: 10px !important;
        font-size: 11px !important;
        padding: 7px 9px !important;
      }

      .v26-audio-pill select {
        max-width: 120px !important;
      }

      .v26-audio-settings {
        color: #fff !important;
      }

      /* ALARM CENTER LAYOUT FIX */
      #v26-alarm-center,
      .v26-alarm-center {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        margin-top: 14px !important;
        background: #090909 !important;
        border: 1px solid #292929 !important;
        border-radius: 16px !important;
      }

      .v26-alarm-center-head {
        padding: 12px 13px !important;
        min-width: 0 !important;
      }

      .v26-alarm-center-head h3 {
        font-size: .82em !important;
        color: #fbbf24 !important;
      }

      .v26-alarm-center-head span {
        display: block !important;
        max-width: 260px !important;
        font-size: .62em !important;
        line-height: 1.35 !important;
      }

      .v26-alarm-center-body {
        padding: 12px !important;
        display: grid !important;
        gap: 10px !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }

      .v26-alarm-tabs {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 7px !important;
        width: 100% !important;
      }

      .v26-alarm-form {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 9px !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      .v26-alarm-field,
      .v26-alarm-field.full {
        grid-column: auto !important;
        width: 100% !important;
        min-width: 0 !important;
      }

      .v26-alarm-field label {
        display: block !important;
        color: #d0d0d0 !important;
        font-size: .62em !important;
        font-weight: 950 !important;
        margin-bottom: 5px !important;
      }

      .v26-alarm-field input,
      .v26-alarm-field select {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        height: 40px !important;
        background: #060606 !important;
        border: 1px solid #3a3a3a !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        border-radius: 10px !important;
        padding: 10px 11px !important;
        font-size: .82em !important;
        font-weight: 850 !important;
        font-family: 'JetBrains Mono', monospace !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
      }

      .v26-alarm-field input::placeholder {
        color: #777 !important;
        -webkit-text-fill-color: #777 !important;
      }

      .v26-alarm-field input:focus,
      .v26-alarm-field select:focus {
        border-color: #fbbf24 !important;
        box-shadow: 0 0 0 2px rgba(251,191,36,.10) !important;
      }

      .v26-alarm-actions {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 8px !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }

      .v26-alarm-btn {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        text-align: center !important;
        min-height: 39px !important;
        border-radius: 10px !important;
        font-size: .68em !important;
        line-height: 1.2 !important;
        padding: 9px 8px !important;
        box-sizing: border-box !important;
      }

      #v26-alarm-add {
        grid-column: auto !important;
      }

      .v26-alarm-list {
        max-height: 250px !important;
        overflow: auto !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      .v26-alarm-row {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 9px !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      .v26-alarm-main {
        min-width: 0 !important;
      }

      .v26-alarm-main b,
      .v26-alarm-main span {
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }

      .v26-alarm-row-actions {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 7px !important;
        width: 100% !important;
      }

      .v26-alarm-status {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 35px !important;
        white-space: nowrap !important;
      }

      /* FORCE ALL CONTROL PANEL CHILDREN TO NOT OVERFLOW */
      .crypto-v10-control-panel,
      .crypto-v10-control-panel * {
        box-sizing: border-box !important;
      }

      .crypto-v10-control-panel {
        overflow: hidden !important;
      }

      .crypto-v10-control-panel input,
      .crypto-v10-control-panel select,
      .crypto-v10-control-panel button {
        max-width: 100% !important;
      }

      /* MOBILE */
      @media(max-width: 900px) {
        .v26-audio-pill {
          left: 10px !important;
          right: 10px !important;
          top: auto !important;
          bottom: 12px !important;
          justify-content: center !important;
          flex-wrap: wrap !important;
        }

        .v26-alarm-actions,
        .v26-alarm-row-actions {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function hideOldAudioDuplicates() {
    const panels = Array.from(document.querySelectorAll("#v26-alarm-audio-panel, .v26-audio-pill"));
    if (panels.length <= 1) return;
    panels.forEach((p, i) => {
      if (i > 0) p.remove();
    });
  }

  function markAuthReadyOnFirebaseEvent() {
    window.addEventListener("v26-auth-ready", () => {
      document.body.classList.add("v26-auth-ready");
    });

    // Fallback: if firebase event is missed, reveal after short delay.
    setTimeout(() => document.body.classList.add("v26-auth-ready"), 2200);
  }

  function syncLoop() {
    syncPageClasses();
    hideOldAudioDuplicates();

    const shell = document.getElementById("v26-auth-shell");
    if (shell && window.V26_FIREBASE?.ready) {
      document.body.classList.add("v26-auth-ready");
    }

    // Eğer eski alarm formu görünürse temizle.
    document.querySelectorAll(".crypto-v12-alarm-box, .crypto-v13-alarm-box").forEach(el => {
      el.style.display = "none";
    });
  }

  function boot() {
    injectFinalCss();
    markAuthReadyOnFirebaseEvent();
    syncPageClasses();
    syncLoop();

    window.addEventListener("hashchange", () => {
      setTimeout(syncLoop, 50);
      setTimeout(syncLoop, 400);
      setTimeout(syncLoop, 1000);
    });

    setInterval(syncLoop, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
