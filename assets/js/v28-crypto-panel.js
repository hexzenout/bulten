// ===============================
// V28 CRYPTO PRO PANEL CONTROLLER
// Sol iç sekmeler, timeframe sağlamlaştırma, başlık ve küçük UI temizlikleri.
// ===============================

(function () {
  const PANEL_TITLES = {
    graph: ["Grafik Kontrolü", "Borsa, parite, coin ve zaman aralığı"],
    plan: ["İşlem Planı", "TP / SL / LIQ ve risk hesabı"],
    alarm: ["Alarm Merkezi", "Aktif alarmlar ve geçmiş"],
    sound: ["Ses Ayarları", "Özel ses, süre ve test"],
    draw: ["Çizimler", "Alarm çizgisi, fiyat çizgisi ve trend"],
    settings: ["Ayarlar", "Terminal verileri ve görünüm"]
  };

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function activatePanel(name) {
    qsa(".crypto-v28-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.cryptoPanel === name));
    qsa(".crypto-v28-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.cryptoPane === name));

    const title = qs("#crypto-v28-panel-title");
    const sub = qs("#crypto-v28-panel-subtitle");
    const t = PANEL_TITLES[name] || PANEL_TITLES.graph;

    if (title) title.textContent = t[0];
    if (sub) sub.textContent = t[1];

    localStorage.setItem("v28_crypto_panel", name);
  }

  function bindTabs() {
    qsa(".crypto-v28-tab").forEach(btn => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => activatePanel(btn.dataset.cryptoPanel || "graph"));
    });

    const saved = localStorage.getItem("v28_crypto_panel") || "graph";
    activatePanel(saved);
  }

  function formatPrice(v) {
    const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n) || !n) return "$-";
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function syncHeaderClones() {
    const price = qs("#crypto-v10-price")?.textContent || "$-";
    const change = qs("#crypto-v10-change")?.textContent || "0.00%";
    const live = qs("#v28-live-price");
    const ch = qs("#v28-change");

    if (live) live.textContent = price || "$-";
    if (ch) {
      ch.textContent = change || "0.00%";
      ch.classList.toggle("good", !String(change).includes("-"));
      ch.classList.toggle("bad", String(change).includes("-"));
    }
  }

  function robustTimeframeBinding() {
    qsa("#crypto-v10-timeframes [data-tf], .tf-v10[data-tf]").forEach(btn => {
      if (btn.dataset.v28Bound === "1") return;
      btn.dataset.v28Bound = "1";
      btn.addEventListener("click", () => {
        qsa("#crypto-v10-timeframes [data-tf], .tf-v10[data-tf]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        setTimeout(() => {
          if (typeof window.omega_V10RefreshCrypto === "function") {
            window.omega_V10RefreshCrypto(true);
          }
        }, 60);
      }, true);
    });
  }

  function bindSettings() {
    const reset = qs("#v28-reset-crypto-settings");
    if (reset && reset.dataset.bound !== "1") {
      reset.dataset.bound = "1";
      reset.addEventListener("click", () => {
        if (!confirm("Kripto terminal ayarları ve çizimler sıfırlansın mı?")) return;

        Object.keys(localStorage).forEach(k => {
          if (
            k.startsWith("v26_lwc_") ||
            k.startsWith("v28_crypto_") ||
            k.startsWith("v28_alarm_") ||
            k.startsWith("v26_crypto_alarm_")
          ) {
            localStorage.removeItem(k);
          }
        });

        location.reload();
      });
    }
  }

  function hardCleanup() {
    // Eski floating ses paneli veya eski alarm merkezi DOM'a sonradan düşerse kaldır/gizle.
    qsa("#v26-alarm-audio-panel, .v26-audio-pill, #v26-alarm-center, .v26-alarm-center").forEach(el => {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
    });

    qsa(".crypto-v12-alarm-box, .crypto-v13-alarm-box").forEach(el => {
      el.style.display = "none";
    });

    const moduleName = qs("#active-module-name");
    if (moduleName && location.hash === "#crypto") {
      moduleName.innerHTML = '<span style="color:var(--gold)">/ KRİPTO PRO PANEL</span>';
    }
  }

  function patchHashBoot() {
    window.addEventListener("hashchange", () => {
      setTimeout(() => {
        bindTabs();
        robustTimeframeBinding();
        hardCleanup();
      }, 400);
    });
  }

  function boot() {
    bindTabs();
    bindSettings();
    robustTimeframeBinding();
    syncHeaderClones();
    hardCleanup();
    patchHashBoot();

    setInterval(() => {
      bindTabs();
      bindSettings();
      robustTimeframeBinding();
      syncHeaderClones();
      hardCleanup();
    }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
