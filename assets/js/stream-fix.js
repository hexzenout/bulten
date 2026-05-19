// ===============================
// V30 STREAM FIX
// Canlı Yayın 4/6 ekran çoklu tıklama sorununu azaltır.
// Eski eventler üst üste bindiyse tek merkezi tıklama kontrolü uygular.
// ===============================

(function () {
  let lastClickAt = 0;
  let lastTargetKey = "";

  function isStreamPage() {
    return location.hash === "#stream" || !!document.querySelector("#omega-stream-block");
  }

  function getTargetKey(target) {
    const btn = target.closest(
      ".btn-stream-layout, [data-layout], [onclick*='omega_SetStreamLayout'], button"
    );

    if (!btn) return "";

    const text = (btn.innerText || btn.textContent || "").trim();
    const data = btn.dataset?.layout || btn.getAttribute("data-layout") || "";
    const onclick = btn.getAttribute("onclick") || "";

    if (
      text === "1" ||
      text === "2" ||
      text === "4" ||
      text === "6" ||
      data ||
      onclick.includes("Stream")
    ) {
      return `${text}|${data}|${onclick}`;
    }

    return "";
  }

  document.addEventListener(
    "click",
    function (e) {
      if (!isStreamPage()) return;

      const key = getTargetKey(e.target);
      if (!key) return;

      const now = Date.now();

      if (key === lastTargetKey && now - lastClickAt < 450) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }

      lastTargetKey = key;
      lastClickAt = now;
    },
    true
  );

  function markStreamButtons() {
    document.querySelectorAll(".btn-stream-layout, [data-layout]").forEach((btn) => {
      if (btn.dataset.v30StreamFixed === "1") return;
      btn.dataset.v30StreamFixed = "1";
      btn.style.userSelect = "none";
      btn.style.webkitUserSelect = "none";
      btn.style.touchAction = "manipulation";
    });
  }

  document.addEventListener("DOMContentLoaded", markStreamButtons);
  window.addEventListener("hashchange", () => setTimeout(markStreamButtons, 300));
  setInterval(markStreamButtons, 1500);
})();
