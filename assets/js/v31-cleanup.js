// ===============================
// V31 CLEANUP
// Kasa sekme aktifliği ve kripto terminalde işlevsiz panel kalıntılarını toparlar.
// ===============================

(function () {
  function fixFinanceTabs(mode) {
    mode = mode || "bet";

    document.querySelectorAll(".finance-tab").forEach(tab => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });

    document.querySelectorAll(".finance-tab-panel").forEach(panel => {
      panel.classList.remove("active");
      panel.style.display = "none";
    });

    const tab = document.getElementById("finance-tab-" + mode);
    const panel = document.getElementById("finance-panel-" + mode);

    if (tab) {
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
    }

    if (panel) {
      panel.classList.add("active");
      panel.style.display = "block";
    }
  }

  const oldSetFinanceMode = window.omega_SetFinanceMode;
  window.omega_SetFinanceMode = function (mode, refresh) {
    const result = typeof oldSetFinanceMode === "function"
      ? oldSetFinanceMode.call(this, mode, refresh)
      : undefined;

    fixFinanceTabs(mode);
    setTimeout(() => fixFinanceTabs(mode), 30);
    return result;
  };

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".finance-tab");
    if (!btn) return;
    const mode = btn.id === "finance-tab-crypto" ? "crypto" : "bet";
    setTimeout(() => fixFinanceTabs(mode), 0);
  }, true);

  function cleanupCryptoUi() {
    document.querySelectorAll('.crypto-v28-tab[data-crypto-panel="draw"]').forEach(el => el.remove());

    const saved = localStorage.getItem("v28_crypto_panel");
    if (saved === "draw") localStorage.setItem("v28_crypto_panel", "graph");

    const timeframes = document.getElementById("crypto-v10-timeframes");
    if (timeframes) timeframes.innerHTML = "";

    const mini = document.querySelector(".crypto-v28-mini-panel");
    if (mini) {
      const b = mini.querySelector("b");
      const s = mini.querySelector("span");
      if (b) b.textContent = "Gerçek Grafik";
      if (s) s.textContent = "TradingView Lightweight Charts motoru kullanılır.";
    }

    const btn = document.querySelector('.terminal-v10-btn.gold[onclick*="omega_V10RefreshCrypto"]');
    if (btn) btn.textContent = "GRAFİĞİ YENİLE";
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => fixFinanceTabs("bet"), 500);
    setTimeout(cleanupCryptoUi, 700);
    setTimeout(cleanupCryptoUi, 1800);
  });

  window.addEventListener("hashchange", function () {
    setTimeout(cleanupCryptoUi, 300);
  });
})();
