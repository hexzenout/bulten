// ===============================
// V508 HEADER MENU + SOUND FINAL SYNC
// Header ikon temizliği, stream mavi, rolling ikonsuz, genel mor şerit state.
// ===============================

(function () {
  const MAP = {
    futbol: { id: "nav-futbol", label: "FUTBOL", color: "#10b981", cls: "v508-title-futbol" },
    basketbol: { id: "nav-basketbol", label: "BASKETBOL", color: "#f97316", cls: "v508-title-basketbol" },
    rolling: { id: "nav-rolling", label: "ROLLING", color: "#7E22CE", cls: "v508-title-rolling" },
    stream: { id: "nav-stream", label: "CANLI YAYIN", color: "#3b82f6", cls: "v508-title-stream" },
    favs: { id: "nav-favs", label: "FAVORİLERİM", color: "#ef4444", cls: "v508-title-favs" },
    live: { id: "nav-live", label: "CANLI TAKİP", color: "#3b82f6", cls: "v508-title-live" },
    crypto: { id: "nav-crypto", label: "KRİPTO TERMİNAL", color: "#f97316", cls: "v508-title-crypto" },
    finance: { id: "nav-finance", label: "KASA YÖNETİMİ", color: "#10b981", cls: "v508-title-finance" },
    home: { id: "nav-home", label: "", color: "#fbbf24", cls: "v508-title-home" }
  };

  let lock = false;

  function keyFromHash() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("finance/rolling") || raw.startsWith("rolling")) return "rolling";
    if (raw.startsWith("stream") || raw.startsWith("canli-yayin")) return "stream";
    if (raw.startsWith("basketbol")) return "basketbol";
    if (raw.startsWith("futbol")) return "futbol";
    if (raw.startsWith("favs") || raw.startsWith("favori")) return "favs";
    if (raw.startsWith("live")) return "live";
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
    const streamIcon = document.querySelector("#nav-stream > i");
    if (streamIcon) streamIcon.style.setProperty("color", "#3b82f6", "important");
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

  function patchSwitch() {
    if (typeof window.omega_SwitchMainTab !== "function" || window.omega_SwitchMainTab.__v508) return;
    const original = window.omega_SwitchMainTab;
    window.omega_SwitchMainTab = function (targetModule, clickedElement, updateHistory) {
      const result = original.apply(this, arguments);
      let k = targetModule;
      if (k === "canli" || k === "canli-yayin") k = "stream";
      setTimeout(() => apply(k), 0);
      setTimeout(() => apply(k), 80);
      setTimeout(() => apply(k), 250);
      return result;
    };
    window.omega_SwitchMainTab.__v508 = true;
  }

  function forceSoundIfNeeded() {
    const panel = document.querySelector('.crypto-v28-panel[data-crypto-pane="sound"].active');
    const mount = document.getElementById("v28-sound-mount");
    if (!panel || !mount) return;

    // v28 root renderer varsa çağır; yoksa v32 fallback'i tetikler.
    if (!mount.querySelector(".v507-sound-card, .v499f-sound-card, .v32-sound-card")) {
      try {
        if (typeof window.renderSoundRootV507 === "function") window.renderSoundRootV507();
      } catch {}
    }

    const card = mount.querySelector(".v507-sound-card, .v499f-sound-card, .v32-sound-card");
    if (card) card.classList.add("v32-sound-card");
  }

  function boot() {
    patchSwitch();
    apply();
    forceSoundIfNeeded();

    document.addEventListener("click", e => {
      const link = e.target.closest("#main-dropdown-nav .nav-link");
      if (link?.id) {
        const k = link.id.replace(/^nav-/, "");
        if (MAP[k]) {
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
      setTimeout(() => { patchSwitch(); apply(); forceSoundIfNeeded(); }, 0);
      setTimeout(() => { apply(); forceSoundIfNeeded(); }, 250);
    });

    setTimeout(() => { patchSwitch(); apply(); forceSoundIfNeeded(); }, 300);
    setTimeout(() => { apply(); forceSoundIfNeeded(); }, 900);
    setTimeout(() => { apply(); forceSoundIfNeeded(); }, 1800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
