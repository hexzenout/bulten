// ===============================
// V30 LABEL COLOR FIX
// Sadece şu alanları düzeltir:
// 1) Sol menüde CANLI YAYIN ve KRİPTO TERMİNAL eski renklerine döner.
// 2) Üst bar / KRİPTO TERMİNAL kahverengi olur.
// 3) Üst bar / CANLI YAYIN mavi olur.
// 4) Kripto Terminal içindeki büyük başlık kahverengi olur.
// 5) Canlı Yayın içindeki büyük başlık koyu lila olur.
// Başka buton, kart, grafik, Futbol, Basketbol renklerine dokunmaz.
// ===============================

(function () {
  const CRYPTO_TOP_COLOR = "#8B5A2B";   // kahverengi
  const STREAM_TOP_COLOR = "#3B82F6";   // koyu lila / mor

  function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function setImportantColor(el, color) {
    if (!el) return;
    el.style.setProperty("color", color, "important");
  }

  function getHash() {
    return window.location.hash || "#home";
  }

  function restoreLeftMenuColors() {
    // Sol menü eski renk mantığı:
    // Canlı Yayın eski mavi, Kripto Terminal eski altın/kahverengi ikon tonuna yakın.
    // Sadece sol menüdeki nav item'lar hedeflenir.
    qsa("#nav-stream, #nav-stream i").forEach(el => {
      setImportantColor(el, "#3B82F6");
    });

    qsa("#nav-crypto, #nav-crypto i").forEach(el => {
      setImportantColor(el, "#B45309");
    });
  }

  function fixTopBreadcrumb() {
    const el = document.getElementById("active-module-name");
    if (!el) return;

    const hash = getHash();

    if (hash === "#crypto") {
      el.innerHTML = `<span style="color:${CRYPTO_TOP_COLOR} !important;">/ KRİPTO TERMİNAL</span>`;
      return;
    }

    if (hash === "#stream") {
      el.innerHTML = `<span style="color:${STREAM_TOP_COLOR} !important;">/ CANLI YAYIN</span>`;
      return;
    }
  }

  function fixModuleHeroTitles() {
    const hash = getHash();

    if (hash === "#crypto") {
      // Kripto terminal içindeki büyük başlık.
      qsa(
        ".terminal-v10-hero h2, .crypto-v10-hero h2, .crypto-terminal-title, " +
        "#omega-crypto-block h1, #omega-crypto-block h2, #omega-crypto-block .module-title"
      ).forEach(el => {
        const txt = (el.innerText || el.textContent || "").toUpperCase();
        if (txt.includes("KRİPTO")) setImportantColor(el, CRYPTO_TOP_COLOR);
      });
    }

    if (hash === "#stream") {
      // Canlı yayın içindeki büyük başlık.
      qsa(
        ".terminal-v10-hero h2, .stream-hero h2, .stream-title, " +
        "#omega-stream-block h1, #omega-stream-block h2, #omega-stream-block .module-title"
      ).forEach(el => {
        const txt = (el.innerText || el.textContent || "").toUpperCase();
        if (txt.includes("CANLI") || txt.includes("YAYIN")) setImportantColor(el, STREAM_TOP_COLOR);
      });
    }
  }

  function removeWrongInlineGoldOnTargetTitles() {
    // Bazı eski scriptler sürekli var(--gold) basıyor. Bu fonksiyon sadece hedef yazıları tekrar düzeltir.
    qsa("span, h1, h2, h3, b, strong").forEach(el => {
      const txt = (el.innerText || el.textContent || "").trim().toUpperCase();
      if (txt === "/ KRİPTO TERMİNAL" || txt === "KRİPTO TERMİNAL") {
        setImportantColor(el, CRYPTO_TOP_COLOR);
      }
      if (txt === "/ CANLI YAYIN" || txt === "CANLI YAYIN") {
        setImportantColor(el, STREAM_TOP_COLOR);
      }
    });
  }

  function applyFix() {
    restoreLeftMenuColors();
    fixTopBreadcrumb();
    fixModuleHeroTitles();
    removeWrongInlineGoldOnTargetTitles();
  }

  window.addEventListener("hashchange", function () {
    setTimeout(applyFix, 20);
    setTimeout(applyFix, 250);
    setTimeout(applyFix, 900);
  });

  document.addEventListener("DOMContentLoaded", function () {
    applyFix();
    setTimeout(applyFix, 250);
    setTimeout(applyFix, 900);
    setTimeout(applyFix, 1800);
  });

  // Eski v28 kodu bazı yazıları düzenli olarak altına tekrar basıyor.
  // Bu yüzden çok hafif aralıkla sadece hedef yazıları kontrol ediyoruz.
  setInterval(applyFix, 1200);
})();
