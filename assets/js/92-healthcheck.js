// ===============================
// V30 STABLE HEALTHCHECK
// Modüler dosyaların doğru yüklendiğini sessizce kontrol eder.
// UI değiştirmez, sadece eksik kritik fonksiyon varsa console.warn verir.
// ===============================

(function () {
  const REQUIRED = [
    "omega_SwitchMainTab",
    "omega_InitializeEngine",
    "omega_ExecuteRadarFilter",
    "omega_BuildStreamMatrix",
    "omega_OpenChannelManager",
    "omega_RefreshFinanceDashboard",
    "omega_RenderDailyTradeGrid",
    "omega_LoadLiveScores",
    "omega_RefreshLiveCenter",
    "omega_V10RefreshCrypto",
    "omega_V10DrawChart"
  ];

  function check() {
    const missing = REQUIRED.filter(name => typeof window[name] !== "function");
    if (missing.length) {
      console.warn("[V30] Eksik modül fonksiyonları:", missing);
      document.body.dataset.v30Modules = "missing";
    } else {
      document.body.dataset.v30Modules = "ok";
      document.body.classList.add("v30-modular-ready");
      console.info("[V30] Modüler yapı hazır.");
    }
  }

  window.addEventListener("DOMContentLoaded", function () {
    setTimeout(check, 500);
    setTimeout(check, 1800);
  });
})();
