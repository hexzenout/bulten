(function () {
  "use strict";

  const FRAME_ID = "kasa-challenge-frame";
  const BLOCK_ID = "omega-kasa-challenge-block";
  const FRAME_SRC = "assets/kasa-challenge/kasa-challenge.html?v=v1349";

  function getBlock() {
    return document.getElementById(BLOCK_ID);
  }

  function ensureFrame() {
    const block = getBlock();
    if (!block) return null;

    let frame = document.getElementById(FRAME_ID);
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = FRAME_ID;
      frame.className = "kasa-challenge-frame";
      frame.title = "Kasa Challenge";
      frame.setAttribute("loading", "eager");
      frame.src = FRAME_SRC;
      block.appendChild(frame);
    }
    return frame;
  }

  function activateKasaChallenge() {
    const block = getBlock();
    if (!block) return;
    block.style.display = "block";
    block.removeAttribute("aria-hidden");
    ensureFrame();
  }

  function deactivateKasaChallenge() {
    const block = getBlock();
    if (!block) return;
    block.style.display = "none";
    block.setAttribute("aria-hidden", "true");
  }

  function syncWithLocation() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").split("/")[0].toLowerCase();
    if (raw === "kasa-challenge") {
      activateKasaChallenge();
    } else {
      deactivateKasaChallenge();
      if (document.body) document.body.classList.remove("omega-tab-kasa-challenge");
    }
  }

  window.omega_ActivateKasaChallenge = activateKasaChallenge;
  window.omega_DeactivateKasaChallenge = deactivateKasaChallenge;

  window.addEventListener("blur", function () {
    setTimeout(function () {
      const frame = document.getElementById(FRAME_ID);
      if (frame && document.activeElement === frame) {
        const topMenu = document.getElementById("main-dropdown-nav");
        if (topMenu) topMenu.classList.remove("active-menu");
      }
    }, 0);
  });

  window.addEventListener("hashchange", syncWithLocation);
  window.addEventListener("popstate", syncWithLocation);
})();
