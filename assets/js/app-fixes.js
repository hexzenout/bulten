// ===============================
// V26 APP FIXES
// Açılış, footer, layout ve gereksiz bildirim düzeltmeleri
// ===============================

(function () {
  window.__v26LastUserAction = 0;
  window.__v26ToastAllowTimer = null;

  function markLayoutReady() {
    document.body.classList.add("v26-layout-ready");
  }

  function allowToastTemporarily() {
    window.__v26LastUserAction = Date.now();

    document.body.classList.add("v26-toast-allowed");

    clearTimeout(window.__v26ToastAllowTimer);
    window.__v26ToastAllowTimer = setTimeout(function () {
      document.body.classList.remove("v26-toast-allowed");
    }, 3500);
  }

  function bindUserActions() {
    document.addEventListener(
      "pointerdown",
      function (e) {
        if (
          e.target.closest(
            "button, .btn-finance, .nav-link, input, select, .chart-tool-btn, .tf-v10, .finance-clean-btn"
          )
        ) {
          allowToastTemporarily();
        }
      },
      true
    );
  }

  function hideBadStartupTexts() {
    const radar = document.getElementById("radar-render-output");
    if (radar) {
      const text = (radar.innerText || "").trim();

      if (
        text.includes("KAYIT BULUNAMADI") ||
        text.includes("VERİ YÜKLENİYOR") ||
        text.includes("VERİ BEKLENİYOR")
      ) {
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

      if (message.includes("Plan hesaplandı") && !isUserAction) {
        return;
      }

      if (isUserAction) {
        document.body.classList.add("v26-toast-allowed");

        clearTimeout(window.__v26ToastAllowTimer);
        window.__v26ToastAllowTimer = setTimeout(function () {
          document.body.classList.remove("v26-toast-allowed");
        }, 3500);
      }

      return originalToast.apply(this, arguments);
    };

    window.__v26FinanceToastPatched = true;
    return true;
  }

  function stabilizeWrapper() {
    const wrapper = document.querySelector(".center-wrapper");
    if (!wrapper) return;

    wrapper.style.transition = "none";
  }

  function bootFixes() {
    bindUserActions();
    stabilizeWrapper();
    hideBadStartupTexts();

    setTimeout(markLayoutReady, 700);

    const patchTimer = setInterval(function () {
      stabilizeWrapper();
      hideBadStartupTexts();
      const ok = patchFinanceToast();

      if (ok) clearInterval(patchTimer);
    }, 150);

    setTimeout(function () {
      clearInterval(patchTimer);
      stabilizeWrapper();
      hideBadStartupTexts();
      markLayoutReady();
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFixes);
  } else {
    bootFixes();
  }
})();
