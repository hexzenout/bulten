// ===============================
// V30 STREAM FIX
// Canlı Yayın 4/6 ekran butonlarının çoklu tıklama/çift tetiklenme sorununu azaltır.
// ===============================

(function () {
  let lastClickAt = 0;
  let lastKey = "";

  function isStreamPage() {
    return location.hash === "#stream" || !!document.querySelector("#omega-stream-block");
  }

  function getLayoutButton(target) {
    return target.closest(
      ".stream-layout-btn, .btn-stream-layout, [data-layout], [data-stream-layout], button"
    );
  }

  function getButtonKey(btn) {
    if (!btn) return "";

    const text = (btn.innerText || btn.textContent || "").trim().replace(/\s+/g, " ");
    const data =
      btn.dataset?.layout ||
      btn.dataset?.streamLayout ||
      btn.getAttribute("data-layout") ||
      btn.getAttribute("data-stream-layout") ||
      "";
    const onclick = btn.getAttribute("onclick") || "";

    const looksLikeLayout =
      data ||
      onclick.toLowerCase().includes("stream") ||
      text === "1 EKRAN" ||
      text === "2 EKRAN" ||
      text === "4 EKRAN" ||
      text === "6 EKRAN" ||
      text === "1" ||
      text === "2" ||
      text === "4" ||
      text === "6";

    return looksLikeLayout ? `${text}|${data}|${onclick}` : "";
  }

  document.addEventListener(
    "click",
    function (e) {
      if (!isStreamPage()) return;

      const btn = getLayoutButton(e.target);
      const key = getButtonKey(btn);
      if (!key) return;

      const now = Date.now();

      // Aynı butondan çok kısa sürede gelen ikinci/üçüncü tetikleri kes.
      if (key === lastKey && now - lastClickAt < 600) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }

      lastKey = key;
      lastClickAt = now;
    },
    true
  );

  function markButtons() {
    if (!isStreamPage()) return;

    document.querySelectorAll("button, [data-layout], [data-stream-layout]").forEach((btn) => {
      const key = getButtonKey(btn);
      if (!key) return;

      btn.dataset.v30StreamFixed = "1";
      btn.style.userSelect = "none";
      btn.style.webkitUserSelect = "none";
      btn.style.touchAction = "manipulation";
    });
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(markButtons, 250));
  window.addEventListener("hashchange", () => setTimeout(markButtons, 250));
  setInterval(markButtons, 1500);
})();
