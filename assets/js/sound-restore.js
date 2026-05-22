// ===============================
// V50.6 STANDALONE SOUND PANEL RESTORE
// Bu dosya v32 çalışmasa bile #v28-sound-mount içine ses panelini basar.
// ===============================

(function () {
  const SOUND_KEY = "v28_alarm_audio_settings";
  let renderLock = false;

  function qs(sel, root = document) { return root.querySelector(sel); }

  function getSettings() {
    try {
      const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
      return {
        enabled: true,
        sound: "digital",
        volume: 1,
        durationSec: 60,
        selectedCustomId: "",
        ...JSON.parse(localStorage.getItem(SOUND_KEY) || "{}"),
        ...live,
        volume: 1
      };
    } catch {
      return { enabled: true, sound: "digital", volume: 1, durationSec: 60, selectedCustomId: "" };
    }
  }

  function setSettings(next) {
    const merged = { ...getSettings(), ...next, enabled: true, volume: 1 };
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function injectStyle() {
    if (document.getElementById("v506-sound-style")) return;
    const style = document.createElement("style");
    style.id = "v506-sound-style";
    style.textContent = `
      #v28-sound-mount{display:block!important;visibility:visible!important;width:100%!important;min-height:1px!important}
      .crypto-v28-panel[data-crypto-pane="sound"] #v28-sound-mount{display:block!important;visibility:visible!important}
      .v506-sound-card{display:grid!important;gap:14px!important;max-width:100%!important;overflow:hidden!important;padding:16px!important;border:1px solid #262626!important;border-radius:18px!important;background:#090909!important}
      .v506-sound-head{display:flex!important;align-items:center!important;justify-content:space-between!important}
      .v506-sound-head b{color:#f97316!important;font-size:1.05rem!important;font-weight:950!important}
      .v506-sound-head span{color:#777!important;font-size:.72rem!important;font-weight:850!important}
      .v506-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
      .v506-actions button,.v506-file-row button,.v506-select-row button{min-height:44px!important;border-radius:12px!important;font-weight:950!important;cursor:pointer!important}
      .v506-field{display:grid!important;gap:8px!important}
      .v506-field label{color:#aaa!important;font-size:.68rem!important;font-weight:950!important;letter-spacing:.6px!important}
      .v506-field select,.v506-select-row select{width:100%!important;min-width:0!important;min-height:44px!important;border:1px solid #333!important;border-radius:12px!important;background:#050505!important;color:#fff!important;padding:0 12px!important;font-weight:950!important;box-sizing:border-box!important}
      .v506-custom-panel{display:none!important;gap:12px!important;padding:14px!important;border:1px solid #2b2b2b!important;border-radius:16px!important;background:#070707!important;max-width:100%!important;overflow:hidden!important}
      .v506-custom-panel.show{display:grid!important}
      .v506-library-title{display:flex!important;gap:8px!important;align-items:center!important;color:#f97316!important;font-weight:950!important}
      .v506-select-row{display:grid!important;grid-template-columns:minmax(0,1fr)92px!important;gap:10px!important;align-items:center!important}
      .v506-file-row{display:grid!important;grid-template-columns:126px minmax(0,1fr)!important;gap:10px!important;align-items:center!important}
      .v506-file-row span{min-width:0!important;color:#aaa!important;font-size:.78rem!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .v506-actions .testing{background:#10b981!important;border-color:#10b981!important;color:#04120d!important}
      .v506-debug{font-family:'JetBrains Mono',monospace!important;color:#16a34a!important;font-size:.66rem!important;font-weight:900!important;border-top:1px solid #1f1f1f!important;padding-top:8px!important}
      @media(max-width:900px){.v506-select-row,.v506-file-row,.v506-actions{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  async function renderLibrary() {
    const select = qs("#v506-custom-select");
    if (!select) return;

    if (!window.V26AlarmAudio?.listCustomFiles) {
      select.innerHTML = `<option value="">Ses motoru yüklenmedi</option>`;
      return;
    }

    const s = getSettings();
    const files = await window.V26AlarmAudio.listCustomFiles();

    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const size = file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "";
      return `<option value="${file.id}" ${active ? "selected" : ""}>${active ? "✓ " : ""}${file.name}${size ? " · " + size : ""}</option>`;
    }).join("");

    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";

    const note = qs("#v506-file-note");
    if (note) {
      const text = current ? "Aktif: " + current.name : "Dosya seçilmedi";
      note.textContent = text;
      note.title = text;
    }
  }

  function render(force = false) {
    if (renderLock) return;
    const mount = qs("#v28-sound-mount");
    if (!mount) return;

    if (!force && mount.querySelector(".v506-sound-card")) return;

    renderLock = true;
    injectStyle();

    const s = getSettings();
    const soundType = s.sound || "digital";
    const isCustom = soundType === "custom";

    mount.dataset.ready = "v506-standalone";
    mount.style.display = "block";
    mount.style.visibility = "visible";
    mount.innerHTML = `
      <div class="v506-sound-card">
        <div class="v506-sound-head">
          <b>Alarm Ses Merkezi</b>
          <span>V50.6 bağımsız panel</span>
        </div>

        <div class="v506-actions">
          <button type="button" id="v506-sound-test">OYNAT</button>
          <button type="button" id="v506-sound-stop" class="danger">DURDUR</button>
        </div>

        <div class="v506-field">
          <label>Ses Tipi</label>
          <select id="v506-sound-type">
            <option value="custom">Özel Ses</option>
            <option value="digital">Dijital Uyarı</option>
            <option value="bip">Standart Bip</option>
            <option value="chime">Yumuşak Chime</option>
            <option value="siren">Siren</option>
            <option value="silent">Sessiz</option>
          </select>
        </div>

        <div class="v506-custom-panel ${isCustom ? "show" : ""}" id="v506-custom-panel">
          <div class="v506-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>

          <div class="v506-select-row">
            <select id="v506-custom-select" title="Özel ses seç"><option value="">Özel ses seç...</option></select>
            <button type="button" id="v506-custom-remove" class="danger">KALDIR</button>
          </div>

          <div class="v506-file-row">
            <button type="button" id="v506-file-pick">DOSYA SEÇ</button>
            <span id="v506-file-note">Dosya seçilmedi</span>
            <input id="v506-file-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.opus" hidden>
          </div>
        </div>

        <div class="v506-debug">mount: bulundu · panel: aktif · audio: ${window.V26AlarmAudio ? "hazır" : "bekleniyor"}</div>
      </div>
    `;

    qs("#v506-sound-type").value = soundType;

    qs("#v506-sound-type").onchange = e => {
      setSettings({ sound: e.target.value });
      render(true);
    };

    qs("#v506-sound-stop").onclick = () => {
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
      const btn = qs("#v506-sound-test");
      btn.classList.remove("testing");
      btn.textContent = "OYNAT";
    };

    qs("#v506-sound-test").onclick = async () => {
      const type = qs("#v506-sound-type").value;
      setSettings({ sound: type, volume: 1, enabled: true });
      const btn = qs("#v506-sound-test");
      btn.classList.add("testing");
      btn.textContent = "ÇALIYOR...";
      if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
      if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
      setTimeout(() => {
        btn.classList.remove("testing");
        btn.textContent = "OYNAT";
      }, 1200);
    };

    qs("#v506-file-pick")?.addEventListener("click", () => qs("#v506-file-input")?.click());

    qs("#v506-file-input")?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const note = qs("#v506-file-note");
      if (note) {
        note.textContent = "Yükleniyor: " + file.name;
        note.title = file.name;
      }

      try {
        if (!window.V26AlarmAudio?.addCustomFile) throw new Error("Ses motoru hazır değil.");
        const row = await window.V26AlarmAudio.addCustomFile(file);
        if (row?.id && window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        setSettings({ sound: "custom", selectedCustomId: row?.id || "", volume: 1, enabled: true });
        await renderLibrary();
        const select = qs("#v506-custom-select");
        if (select && row?.id) select.value = row.id;
        if (note) {
          note.textContent = "Aktif: " + (row?.name || file.name);
          note.title = row?.name || file.name;
        }
      } catch (err) {
        if (note) note.textContent = "Dosya yüklenemedi.";
        alert("Ses dosyası yüklenemedi. MP3/WAV/OGG/M4A/AAC/FLAC/WEBM gibi geçerli bir ses dosyası seç.");
      } finally {
        e.target.value = "";
      }
    });

    qs("#v506-custom-select")?.addEventListener("change", async e => {
      const id = e.target.value;
      if (!id) return;
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      setSettings({ sound: "custom", selectedCustomId: id, volume: 1, enabled: true });
      await renderLibrary();
    });

    qs("#v506-custom-remove")?.addEventListener("click", async () => {
      const id = qs("#v506-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
      if (window.V26AlarmAudio?.removeCustomFile) await window.V26AlarmAudio.removeCustomFile(id);
      render(true);
    });

    renderLibrary();
    renderLock = false;
  }

  function boot() {
    injectStyle();
    render(true);
    setTimeout(() => render(true), 250);
    setTimeout(() => render(true), 900);
    setTimeout(() => render(true), 1800);

    const observer = new MutationObserver(() => {
      const mount = qs("#v28-sound-mount");
      if (mount && !mount.querySelector(".v506-sound-card")) render(true);
    });

    const startObserve = () => {
      const mount = qs("#v28-sound-mount");
      if (mount) observer.observe(mount, { childList: true, subtree: false });
    };
    startObserve();
    setTimeout(startObserve, 1000);

    window.addEventListener("hashchange", () => setTimeout(() => render(true), 200));
    document.addEventListener("click", e => {
      if (e.target.closest?.(".crypto-v28-tab")) setTimeout(() => render(true), 150);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
