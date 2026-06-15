// ===============================
// V512 HEADER MENU + SOUND ROUTE SYNC
// Header ikon temizliği, stream mavi, rolling ikonsuz, genel mor şerit state,
// kripto alt sekme hash desteği ve ses paneli güvenli çağrı.
// ===============================

(function () {
  const MAP = {
    futbol: { id: "nav-futbol", label: "FUTBOL", color: "#10b981", cls: "v508-title-futbol" },
    basketbol: { id: "nav-basketbol", label: "BASKETBOL", color: "#f97316", cls: "v508-title-basketbol" },
    rolling: { id: "nav-rolling", label: "ROLLING", color: "#7E22CE", cls: "v508-title-rolling" },
    stream: { id: "nav-stream", label: "CANLI YAYIN", color: "#3b82f6", cls: "v508-title-stream" },
    favs: { id: "nav-favs", label: "FAVORİLERİM", color: "#ef4444", cls: "v508-title-favs" },
    live: { id: "nav-live", label: "CANLI TAKİP", color: "#3b82f6", cls: "v508-title-live" },
    odds: { id: "nav-odds", label: "ORAN TERMİNALİ", color: "#a855f7", cls: "v508-title-odds" },
    crypto: { id: "nav-crypto", label: "KRİPTO TERMİNAL", color: "#f97316", cls: "v508-title-crypto" },
    finance: { id: "nav-finance", label: "KASA YÖNETİMİ", color: "#10b981", cls: "v508-title-finance" },
    home: { id: "nav-home", label: "", color: "#fbbf24", cls: "v508-title-home" }
  };

  let lock = false;
  const ROLLING_PAGE_MODE_KEY = "v48_rolling_page_mode";

  function rollingRawHash() {
    return String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
  }

  function rollingModeFromHash() {
    const raw = rollingRawHash();
    if (raw.startsWith("rolling/crypto") || raw.startsWith("finance/rolling/crypto")) return "crypto";
    if (raw.startsWith("rolling/bet") || raw.startsWith("rolling/bahis") || raw.startsWith("finance/rolling/bet")) return "bet";
    try { return localStorage.getItem(ROLLING_PAGE_MODE_KEY) === "crypto" ? "crypto" : "bet"; } catch { return "bet"; }
  }

  function syncRollingBranch(forceOpen) {
    const branch = document.getElementById("nav-rolling-branch");
    if (!branch) return;
    const raw = rollingRawHash();
    const isRollingRoute = raw.startsWith("rolling") || raw.startsWith("finance/rolling");

    if (forceOpen === true) {
      branch.classList.remove("manual-closed");
      branch.classList.add("open");
    }
    if (!isRollingRoute) branch.classList.remove("manual-closed");
    branch.classList.toggle("route-open", isRollingRoute);

    const shouldOpen = branch.classList.contains("open") || (branch.classList.contains("route-open") && !branch.classList.contains("manual-closed"));
    const toggle = document.getElementById("nav-rolling");
    if (toggle) toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    const mode = rollingModeFromHash();
    const bet = document.getElementById("nav-rolling-bet");
    const crypto = document.getElementById("nav-rolling-crypto");
    if (bet) bet.classList.toggle("active", isRollingRoute && mode === "bet");
    if (crypto) crypto.classList.toggle("active", isRollingRoute && mode === "crypto");
  }

  function keyFromHash() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("finance/rolling") || raw.startsWith("rolling")) return "rolling";
    if (raw.startsWith("stream") || raw.startsWith("canli-yayin")) return "stream";
    if (raw.startsWith("basketbol")) return "basketbol";
    if (raw.startsWith("futbol")) return "futbol";
    if (raw.startsWith("favs") || raw.startsWith("favori")) return "favs";
    if (raw.startsWith("live")) return "live";
    if (raw.startsWith("odds")) return "odds";
    if (raw.startsWith("crypto")) return "crypto";
    if (raw.startsWith("finance")) return "finance";
    const active = document.querySelector("#main-dropdown-nav .nav-link.active");
    const id = active?.id ? active.id.replace(/^nav-/, "") : "";
    return MAP[id] ? id : "home";
  }

  function setHeader(key) {
    const title = document.getElementById("active-module-name");
    if (!title) return;
    const item = MAP[key] || MAP.home;
    if (!item.label) {
      title.innerHTML = "";
      return;
    }
    title.innerHTML = `<span class="${item.cls}" style="color:${item.color} !important;">/ ${item.label}</span>`;
  }

  function setMenu(key) {
    document.querySelectorAll("#main-dropdown-nav .nav-link").forEach(a => a.classList.remove("active"));
    const item = MAP[key];
    if (item?.id) document.getElementById(item.id)?.classList.add("active");
    syncRollingBranch(false);

    const streamIcon = document.querySelector("#nav-stream > i");
    if (streamIcon) streamIcon.style.setProperty("color", "#3b82f6", "important");

    const streamLink = document.getElementById("nav-stream");
    if (streamLink) {
      streamLink.style.setProperty("--v508-menu-strip", "#7E22CE");
    }
  }

  function cleanHeaderIcons() {
    const title = document.getElementById("active-module-name");
    if (!title) return;
    title.querySelectorAll("i,svg,.fa,.fa-solid,.fa-regular,.fa-brands,[class*='fa-'],[class*='icon'],[class*='Icon']").forEach(el => el.remove());
  }

  function apply(key) {
    if (lock) return;
    lock = true;
    const k = key || keyFromHash();
    setMenu(k);
    setHeader(k);
    cleanHeaderIcons();
    lock = false;
  }

  function forceSoundIfNeeded() {
    const isSoundHash = /^#crypto\/sound/i.test(String(location.hash || ""));
    const panel = document.querySelector('.crypto-v28-panel[data-crypto-pane="sound"].active');
    const mount = document.getElementById("v28-sound-mount");
    if ((!panel && !isSoundHash) || !mount) return;

    try {
      if (typeof window.V512RenderSoundCenter === "function") window.V512RenderSoundCenter(false);
    } catch {}

    const card = mount.querySelector(".v512-sound-card, .v507-sound-card, .v499f-sound-card, .v32-sound-card");
    if (card) card.classList.add("v32-sound-card");
  }


  function forceCryptoGraphIfBase() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw && raw !== "crypto") return;
    try { localStorage.setItem("v28_crypto_panel", "graph"); } catch {}

    const graphTab = document.querySelector('.crypto-v28-tab[data-crypto-panel="graph"]');
    const graphPanel = document.querySelector('.crypto-v28-panel[data-crypto-pane="graph"]');

    document.querySelectorAll(".crypto-v28-tab").forEach(btn => {
      btn.classList.toggle("active", btn === graphTab);
    });
    document.querySelectorAll(".crypto-v28-panel").forEach(panel => {
      panel.classList.toggle("active", panel === graphPanel);
    });

    const title = document.getElementById("crypto-v28-panel-title");
    const sub = document.getElementById("crypto-v28-panel-subtitle");
    if (title) title.textContent = "Grafik Kontrolü";
    if (sub) sub.textContent = "Borsa, parite, coin ve zaman aralığı";
  }

  function patchSwitch() {
    if (typeof window.omega_SwitchMainTab !== "function" || window.omega_SwitchMainTab.__v512) return;
    const original = window.omega_SwitchMainTab;
    window.omega_SwitchMainTab = function (targetModule, clickedElement, updateHistory) {
      const result = original.apply(this, arguments);
      let k = targetModule;
      if (k === "canli" || k === "canli-yayin") k = "stream";
      if (k === "stream") {
        setTimeout(() => { if (typeof window.omega_BootStreamV49 === "function") window.omega_BootStreamV49(false); }, 70);
      }
      if (k === "crypto") {
        forceCryptoGraphIfBase();
      }
      setTimeout(() => apply(k), 0);
      setTimeout(() => { apply(k); forceSoundIfNeeded(); }, 80);
      setTimeout(() => { apply(k); forceSoundIfNeeded(); }, 250);
      return result;
    };
    window.omega_SwitchMainTab.__v512 = true;
  }

  function boot() {
    patchSwitch();
    apply();
    forceSoundIfNeeded();
    forceCryptoGraphIfBase();

    document.addEventListener("click", e => {
      const rollingToggle = e.target.closest("#nav-rolling");
      if (rollingToggle && !e.target.closest(".nav-rolling-sub-link")) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        const branch = document.getElementById("nav-rolling-branch");
        if (branch) {
          const isVisible = branch.classList.contains("open") || (branch.classList.contains("route-open") && !branch.classList.contains("manual-closed"));
          if (isVisible) {
            branch.classList.remove("open");
            branch.classList.add("manual-closed");
          } else {
            branch.classList.remove("manual-closed");
            branch.classList.add("open");
          }
        }
        syncRollingBranch(false);
        return;
      }

      const rollingSub = e.target.closest("#nav-rolling-bet, #nav-rolling-crypto");
      if (rollingSub) {
        try { localStorage.setItem(ROLLING_PAGE_MODE_KEY, rollingSub.id === "nav-rolling-crypto" ? "crypto" : "bet"); } catch {}
        syncRollingBranch(true);
      }

      const link = e.target.closest("#main-dropdown-nav .nav-link");
      if (link?.id) {
        const k = link.id.replace(/^nav-/, "");
        if (MAP[k]) {
          if (k === "stream") {
            // V523: kullanıcı layout seçimi korunur; 1 ekrana sıfırlama yok.
          }
          if (k === "crypto") forceCryptoGraphIfBase();
          setTimeout(() => apply(k), 0);
          setTimeout(() => apply(k), 100);
        }
      }
      if (e.target.closest('.crypto-v28-tab[data-crypto-panel="sound"]')) {
        setTimeout(forceSoundIfNeeded, 0);
        setTimeout(forceSoundIfNeeded, 250);
        setTimeout(forceSoundIfNeeded, 900);
      }
    }, true);

    const title = document.getElementById("active-module-name");
    if (title) {
      new MutationObserver(() => {
        if (lock) return;
        setTimeout(() => apply(), 0);
      }).observe(title, { childList: true, subtree: true, characterData: true });
    }

    window.addEventListener("hashchange", () => {
      syncRollingBranch(false);
      setTimeout(() => { patchSwitch(); apply(); forceSoundIfNeeded(); }, 0);
      setTimeout(() => { apply(); forceSoundIfNeeded(); }, 250);
      const key = keyFromHash();
      if (key === "stream") setTimeout(() => { if (typeof window.omega_BootStreamV49 === "function") window.omega_BootStreamV49(true); }, 120);
    });

    syncRollingBranch(false);
    setTimeout(() => { patchSwitch(); apply(); forceSoundIfNeeded(); syncRollingBranch(false); }, 300);
    setTimeout(() => { apply(); forceSoundIfNeeded(); }, 900);
    setTimeout(() => { apply(); forceSoundIfNeeded(); }, 1800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
