// V49 CACHE RESET
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
    } catch (err) {
      console.warn("Cache reset hata:", err);
    }
  }
  window.addEventListener("load", () => {
    const doneKey = "omega_cache_reset_done_v49";
    if (localStorage.getItem(doneKey) !== "1") {
      localStorage.setItem(doneKey, "1");
      resetOldCaches().then(() => {
        const url = new URL(location.href);
        url.searchParams.set("v", "v49");
        location.replace(url.toString());
      });
    }
  });
})();
