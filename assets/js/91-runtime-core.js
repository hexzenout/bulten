window.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      document.body.classList.add("omega-route-ready");
    }, 0);
  });

  window.addEventListener("hashchange", function () {
    document.body.classList.remove("omega-route-ready");
    setTimeout(function () {
      document.body.classList.add("omega-route-ready");
    }, 0);
  });

(function () {
  function fastClass(el) {
    if (!el) return;
    el.style.transitionDuration = "0.04s";
    el.style.animationDuration = "0.04s";
  }

  function markFastUi() {
    document.querySelectorAll(
      ".stream-master-grid, .matrix-unit, .league-container-pro, .match-card-pro, .sort-btn, .filter-panel, .controls-wrapper, .btn-stream-layout"
    ).forEach(fastClass);
  }

  const originalExecute = window.omega_ExecuteRadarFilter;
  if (typeof originalExecute === "function" && !window.__v36FastRadarWrapped) {
    window.__v36FastRadarWrapped = true;
    window.omega_ExecuteRadarFilter = function () {
      document.body.classList.add("v36-fast-mode");
      const result = originalExecute.apply(this, arguments);
      requestAnimationFrame(function () {
        markFastUi();
        document.body.classList.remove("v36-fast-mode");
      });
      return result;
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    markFastUi();
    setTimeout(markFastUi, 300);
  });

  window.addEventListener("hashchange", function () {
    setTimeout(markFastUi, 100);
  });
})();
