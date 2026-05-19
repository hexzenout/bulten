// ===============================
// V26 PWA REGISTER
// Telefonda uygulama gibi kullanmak için
// ===============================

(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function (err) {
        console.warn("Service worker kayıt hatası:", err);
      });
    });
  }
})();
