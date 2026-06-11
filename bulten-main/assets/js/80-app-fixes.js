// ===============================
// V26 APP FIXES
// Açılış/toast düzeltmeleri + crypto.js otomatik yükleme
// ===============================

(function () {
  window.__v26LastUserAction = 0;
  window.__v26ToastAllowTimer = null;

  function allowToastTemporarily() {
    window.__v26LastUserAction = Date.now();
    document.body.classList.add("v26-toast-allowed");

    clearTimeout(window.__v26ToastAllowTimer);
    window.__v26ToastAllowTimer = setTimeout(function () {
      document.body.classList.remove("v26-toast-allowed");
    }, 3500);
  }

  document.addEventListener(
    "pointerdown",
    function (e) {
      if (e.target.closest("button, .btn-finance, .nav-link, input, select, .chart-tool-btn, .tf-v10, .finance-clean-btn, .v26-tv-btn")) {
        allowToastTemporarily();
      }
    },
    true
  );

  function hideBadStartupTexts() {
    const radar = document.getElementById("radar-render-output");
    if (radar) {
      const text = (radar.innerText || "").trim();
      if (text.includes("KAYIT BULUNAMADI") || text.includes("VERİ YÜKLENİYOR") || text.includes("VERİ BEKLENİYOR")) {
        radar.innerHTML = "";
      }
    }

    const toast = document.getElementById("finance-toast");
    if (toast) {
      const text = toast.innerText || "";
      if (text.includes("Plan hesaplandı")) {
        toast.classList.remove("show");
        toast.innerText = "";
      }
    }
  }

  function patchFinanceToast() {
    if (typeof window.omega_FinanceToast !== "function") return false;
    if (window.__v26FinanceToastPatched) return true;

    const originalToast = window.omega_FinanceToast;
    window.omega_FinanceToast = function (msg) {
      const message = String(msg || "");
      const isUserAction = Date.now() - (window.__v26LastUserAction || 0) < 1400;
      if (message.includes("Plan hesaplandı") && !isUserAction) return;
      return originalToast.apply(this, arguments);
    };

    window.__v26FinanceToastPatched = true;
    return true;
  }

  function loadCryptoModule() {
    if (window.__v26CryptoModuleRequested) return;
    window.__v26CryptoModuleRequested = true;
    const s = document.createElement("script");
    s.src = "assets/js/crypto.js?v=tv-lwc-20260519-1";
    s.defer = true;
    document.body.appendChild(s);
  }

  function bootFixes() {
    hideBadStartupTexts();
    loadCryptoModule();

    const timer = setInterval(function () {
      hideBadStartupTexts();
      const ok = patchFinanceToast();
      if (ok) clearInterval(timer);
    }, 150);

    setTimeout(function () {
      clearInterval(timer);
      hideBadStartupTexts();
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFixes);
  } else {
    bootFixes();
  }
})();
