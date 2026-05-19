// ===============================
// V26 APP FIXES
// Açılışta gereksiz yazı/toast engeller.
// Footer/layout davranışını bozmaz; sadece ilk yükleme flaşını gizler.
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

      return originalToast.apply(this, arguments);
    };

    window.__v26FinanceToastPatched = true;
    return true;
  }

  function activeContentLooksReady() {
    const hash = (location.hash || "#futbol").replace("#", "");

    // Stream/finance/crypto/live gibi veri beklemeyen ekranlarda kısa gecikme yeterli.
    if (!["", "futbol", "basketbol", "favs"].includes(hash)) return true;

    const radar = document.getElementById("radar-render-output");
    const favs = document.getElementById("favs-render-output");

    if (hash === "favs") return !!(favs && favs.children.length > 0);

    // Futbol/basketbol ana ekranda gerçek maç blokları geldiyse footer görünür.
    return !!(radar && radar.children.length > 0 && !/KAYIT BULUNAMADI|VERİ YÜKLENİYOR/i.test(radar.innerText || ""));
  }

  function revealFooterWhenStable() {
    const started = Date.now();

    function check() {
      hideBadStartupTexts();

      const waited = Date.now() - started;
      const ready = activeContentLooksReady();

      // İçerik geldiyse göster. En geç 4 saniyede göster ki footer tamamen kaybolmasın.
      if (ready || waited > 4000) {
        document.body.classList.add("v26-footer-ready");
        return;
      }

      requestAnimationFrame(check);
    }

    // İlk birkaç frame boyunca footer gizli kalsın; layout oturduktan sonra kontrol başlasın.
    setTimeout(check, 250);
  }


  function loadCryptoProFix() {
    if (document.querySelector('script[data-v26-crypto-pro="1"]')) return;
    const script = document.createElement("script");
    script.src = "assets/js/crypto.js?v=26pro2";
    script.dataset.v26CryptoPro = "1";
    document.body.appendChild(script);
  }

  function bootFixes() {
    document.body.classList.remove("v26-footer-ready");
    hideBadStartupTexts();
    revealFooterWhenStable();
    loadCryptoProFix();

    const timer = setInterval(function () {
      hideBadStartupTexts();
      const ok = patchFinanceToast();
      if (ok) clearInterval(timer);
    }, 150);

    setTimeout(function () {
      clearInterval(timer);
      hideBadStartupTexts();
      document.body.classList.add("v26-footer-ready");
    }, 5000);
  }

  window.addEventListener("hashchange", function () {
    // Sekme geçişinde footer'ı yeniden saklamıyoruz; sadece ilk F5 flaşını engelliyoruz.
    hideBadStartupTexts();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFixes);
  } else {
    bootFixes();
  }
})();
