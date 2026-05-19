// ===============================
// V26 APP FIXES
// Küçük genel düzeltmeler
// ===============================

(function () {
  window.__v26LastUserAction = 0;

  document.addEventListener(
    "pointerdown",
    function (e) {
      if (e.target.closest("button, .btn-finance, .nav-link, input, select")) {
        window.__v26LastUserAction = Date.now();
      }
    },
    true
  );

  function hideOldFinanceToast() {
    const toast = document.getElementById("finance-toast");
    if (!toast) return;

    toast.classList.remove("show");

    if ((toast.innerText || "").includes("Plan hesaplandı")) {
      toast.innerText = "";
    }
  }

  function patchFinanceToast() {
    if (typeof window.omega_FinanceToast !== "function") return false;
    if (window.__v26FinanceToastPatched) return true;

    const originalToast = window.omega_FinanceToast;

    window.omega_FinanceToast = function (msg) {
      const isUserAction = Date.now() - (window.__v26LastUserAction || 0) < 1200;
      const isPlanMessage = String(msg || "").includes("Plan hesaplandı");

      if (isPlanMessage && !isUserAction) {
        hideOldFinanceToast();
        return;
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

  document.addEventListener("DOMContentLoaded", function () {
    hideOldFinanceToast();
    stabilizeLayout();

    const patchTimer = setInterval(function () {
      const ok = patchFinanceToast();
      hideOldFinanceToast();
      stabilizeLayout();

      if (ok) clearInterval(patchTimer);
    }, 250);

    setTimeout(function () {
      clearInterval(patchTimer);
      hideOldFinanceToast();
      stabilizeLayout();
    }, 5000);
  });
})();
