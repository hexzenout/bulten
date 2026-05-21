// ===============================
// V46B CACHE RESET
// Eski service worker/cache kaynaklı “güncelleme görünmüyor” sorununu bitirir.
// ===============================

(function () {
  async function resetOldCaches() {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      localStorage.setItem("omega_cache_reset_v46b", String(Date.now()));
    } catch (err) {
      console.warn("Cache temizliği yapılamadı:", err);
    }
  }

  window.addEventListener("load", () => {
    if (localStorage.getItem("omega_cache_reset_done_v46b") !== "1") {
      localStorage.setItem("omega_cache_reset_done_v46b", "1");
      resetOldCaches().then(() => {
        if (!location.search.includes("v=v46b")) {
          const url = new URL(location.href);
          url.searchParams.set("v", "v46b");
          location.replace(url.toString());
        }
      });
    }
  });
})();
