// ===============================
// V26 APP FIXES
// Genel küçük düzeltmeler
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
      if (e.target.closest("button, .btn-finance, .nav-link, input, select, .chart-tool-btn, .tf-v10")) {
        allowToastTemporarily();
      }
    },
    true
  );

  function hideOldFinanceToast() {
    const toast = document.getElementById("finance-toast");
    if (!toast) return;

    const text = toast.innerText || "";

    if (text.includes("Plan hesaplandı")) {
      toast.classList.remove("show");
      toast.innerText = "";
      toast.style.display = "none";

      setTimeout(function () {
        toast.style.display = "";
      }, 400);
    }
  }

  function patchFinanceToast() {
    if (typeof window.omega_FinanceToast !== "function") return false;
    if (window.__v26FinanceToastPatched) return true;

    const originalToast = window.omega_FinanceToast;

    window.omega_FinanceToast = function (msg) {
      const message = String(msg || "");
      const isUserAction = Date.now() - (window.__v26LastUserAction || 0) < 1400;
      const isPlanMessage = message.includes("Plan hesaplandı");

      if (isPlanMessage && !isUserAction) {
        hideOldFinanceToast();
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

  function stabilizeLayout() {
    const wrapper = document.querySelector(".center-wrapper");
    if (!wrapper) return;

    wrapper.style.transition = "none";
  }

  function bootFixes() {
    hideOldFinanceToast();
    stabilizeLayout();

    const patchTimer = setInterval(function () {
      const ok = patchFinanceToast();
      hideOldFinanceToast();
      stabilizeLayout();

      if (ok) clearInterval(patchTimer);
    }, 150);

    setTimeout(function () {
      clearInterval(patchTimer);
      hideOldFinanceToast();
      stabilizeLayout();
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFixes);
  } else {
    bootFixes();
  }
})();
// ===============================
// V26 RADAR LOADING FIX
// Açılışta geçici "KAYIT BULUNAMADI" görünmesini engeller
// ===============================

(function () {
  function showRadarLoading() {
    const radar = document.getElementById("radar-render-output");
    if (!radar) return;

    const text = (radar.innerText || "").trim();

    if (text.includes("KAYIT BULUNAMADI")) {
      radar.innerHTML = `
        <div style="padding:80px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:15px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2.6em; color:var(--gold);"></i>
          <span style="color:var(--muted); font-weight:800; letter-spacing:1px; font-size:1em;">VERİ YÜKLENİYOR...</span>
        </div>
      `;
    }
  }

  function patchRadarFilter() {
    if (typeof window.omega_ExecuteRadarFilter !== "function") return false;
    if (window.__v26RadarFilterPatched) return true;

    const original = window.omega_ExecuteRadarFilter;

    window.omega_ExecuteRadarFilter = function () {
      const result = original.apply(this, arguments);

      setTimeout(showRadarLoading, 0);
      setTimeout(showRadarLoading, 80);
      setTimeout(showRadarLoading, 180);

      return result;
    };

    window.__v26RadarFilterPatched = true;
    return true;
  }

  function bootRadarFix() {
    showRadarLoading();

    const t = setInterval(function () {
      const ok = patchRadarFilter();
      showRadarLoading();

      if (ok) clearInterval(t);
    }, 120);

    setTimeout(function () {
      clearInterval(t);
      showRadarLoading();
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRadarFix);
  } else {
    bootRadarFix();
  }
})();
