// ===============================
// V27 CLEANUP LAYER
// Son yüklenir. Eski UI kalıntılarını kapatır, auth flash ve PWA cache sorunlarını azaltır.
// ===============================

(function () {
  function isCryptoPage() {
    return location.hash === "#crypto";
  }

  function injectCss() {
    if (document.getElementById("v27-cleanup-style")) return;
    const style = document.createElement("style");
    style.id = "v27-cleanup-style";
    style.textContent = `
      /* Auth hazır olana kadar giriş/kayıt flash görünmesin */
      body:not(.v27-auth-ready) #v26-auth-shell {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body.v27-auth-ready #v26-auth-shell {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      #v26-cloud-save-btn,
      #v26-cloud-load-btn {
        display: none !important;
      }

      /* Eski/floating ses panelleri tamamen kapalı. Ses artık Alarm Merkezi kartında. */
      #v26-alarm-audio-panel,
      .v26-audio-pill {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* Eski alarm kutuları / eski karmaşık alarm formu */
      .crypto-v12-alarm-box,
      .crypto-v13-alarm-box,
      .alarm-v12-grid,
      .alarm-v13-grid,
      .alarm-v13-help,
      #v12-alarm-list,
      #v12-alarm-price,
      #v12-alarm-dir,
      #v12-alarm-note {
        display: none !important;
      }

      /* Eski toolbar gizli, sadece V27/TV toolbar görünsün */
      .crypto-v12-toolbar.crypto-v13-toolbar {
        display: none !important;
      }

      #v26-tv-toolbar {
        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        gap: 8px !important;
        width: 100% !important;
        margin: 10px 0 12px !important;
        padding: 10px !important;
        background: #080808 !important;
        border: 1px solid #252525 !important;
        border-radius: 14px !important;
      }

      #v26-tv-toolbar .v26-tv-btn {
        width: 100% !important;
        min-width: 0 !important;
        white-space: normal !important;
        line-height: 1.2 !important;
        text-align: center !important;
      }

      /* Kripto panelinin dışına taşmayı engelle */
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

      /* Terminal sadeleşsin */
      .crypto-v10-chart-caption {
        font-size: .72em !important;
        line-height: 1.45 !important;
      }

      .crypto-v10-timeframes {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 7px !important;
      }

      .tf-v10 {
        min-width: 48px !important;
        text-align: center !important;
        cursor: pointer !important;
      }

      @media(max-width: 900px) {
        #v26-tv-toolbar {
          grid-template-columns: 1fr 1fr !important;
        }

        .crypto-v10-layout {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeOldAudioPanels() {
    document.querySelectorAll("#v26-alarm-audio-panel, .v26-audio-pill").forEach(el => el.remove());
  }

  function removeOldAlarmCenters() {
    document.querySelectorAll("#v26-alarm-center").forEach(el => el.remove());
    document.querySelectorAll(".crypto-v12-alarm-box, .crypto-v13-alarm-box").forEach(el => {
      el.style.display = "none";
    });
  }

  function markAuthReady() {
    if (window.V26_FIREBASE?.ready) {
      document.body.classList.add("v27-auth-ready");
    }
  }

  function patchAudioSettingsClose() {
    document.addEventListener("pointerdown", (e) => {
      const panel = document.querySelector(".v26-audio-pill.open");
      if (panel && !panel.contains(e.target)) panel.classList.remove("open");
    }, true);
  }

  function sync() {
    injectCss();
    markAuthReady();
    removeOldAudioPanels();
    removeOldAlarmCenters();
  }

  function boot() {
    injectCss();
    patchAudioSettingsClose();

    window.addEventListener("v26-auth-ready", () => document.body.classList.add("v27-auth-ready"));

    sync();
    setTimeout(sync, 300);
    setTimeout(sync, 1000);
    setTimeout(sync, 2500);
    setInterval(sync, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
