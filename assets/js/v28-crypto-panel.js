// ===============================
// V28 CRYPTO PRO PANEL CONTROLLER
// Sol iç sekmeler, timeframe sağlamlaştırma, başlık ve küçük UI temizlikleri.
// ===============================

(function () {
  const PANEL_TITLES = {
    graph: ["Grafik Kontrolü", "Borsa, parite, coin ve zaman aralığı"],
    plan: ["İşlem Planı", "TP / SL / LIQ ve risk hesabı"],
    alarm: ["Alarm Merkezi", "Aktif alarmlar ve geçmiş"],
    sound: ["Ses Ayarları", ""],
    draw: ["Çizimler", "Alarm çizgisi, fiyat çizgisi ve trend"],
    settings: ["Ayarlar", "Terminal verileri ve görünüm"]
  };

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  const V507_SOUND_KEY = "v28_alarm_audio_settings";
  let v507PreviewAudio = null;
  let v507PreviewUrl = "";
  let v507PreviewTimer = null;
  let v507Duration = 1;

  function v507Settings() {
    try {
      const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
      return {
        enabled: true,
        sound: "digital",
        volume: 1,
        durationSec: 60,
        customStart: 0,
        customEnd: 0,
        selectedCustomId: "",
        ...JSON.parse(localStorage.getItem(V507_SOUND_KEY) || "{}"),
        ...live,
        volume: 1
      };
    } catch {
      return { enabled: true, sound: "digital", volume: 1, durationSec: 60, customStart: 0, customEnd: 0, selectedCustomId: "" };
    }
  }

  function v507SetSettings(next) {
    const merged = { ...v507Settings(), ...next, enabled: true, volume: 1 };
    localStorage.setItem(V507_SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function v507Time(sec) {
    sec = Math.max(0, Number(sec || 0));
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  }

  function v507StopPreview() {
    if (v507PreviewTimer) {
      clearTimeout(v507PreviewTimer);
      v507PreviewTimer = null;
    }
    if (v507PreviewAudio) {
      try { v507PreviewAudio.pause(); } catch {}
    }
    if (v507PreviewUrl) {
      try { URL.revokeObjectURL(v507PreviewUrl); } catch {}
    }
    v507PreviewAudio = null;
    v507PreviewUrl = "";
    qs("#v507-play-custom")?.classList.remove("playing");
    const test = qs("#v507-sound-test");
    if (test) {
      test.classList.remove("testing");
      test.textContent = "OYNAT";
    }
  }

  function v507InjectStyle() {
    if (qs("#v507-sound-style")) return;
    const st = document.createElement("style");
    st.id = "v507-sound-style";
    st.textContent = `
      #v28-sound-mount{display:block!important;visibility:visible!important;width:100%!important;max-width:100%!important}
      .v507-sound-card{display:grid!important;gap:14px!important;width:100%!important;max-width:100%!important;overflow:hidden!important;padding:16px!important;border:1px solid #262626!important;border-radius:18px!important;background:#090909!important}
      .v507-sound-head b{color:#f97316!important;font-size:1.05rem!important;font-weight:950!important}
      .v507-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
      .v507-actions button,.v507-file-row button,.v507-select-row button{min-height:44px!important;border-radius:12px!important;font-weight:950!important;cursor:pointer!important}
      .v507-actions .testing{background:#10b981!important;border-color:#10b981!important;color:#04120d!important}
      .v507-field{display:grid!important;gap:8px!important}
      .v507-field label{color:#aaa!important;font-size:.68rem!important;font-weight:950!important;letter-spacing:.6px!important}
      .v507-field select,.v507-select-row select{width:100%!important;min-width:0!important;min-height:44px!important;border:1px solid #333!important;border-radius:12px!important;background:#050505!important;color:#fff!important;padding:0 12px!important;font-weight:950!important;box-sizing:border-box!important}
      .v507-custom{display:none!important;gap:14px!important;padding:14px!important;border:1px solid #2b2b2b!important;border-radius:16px!important;background:#070707!important;max-width:100%!important;overflow:hidden!important}
      .v507-custom.show{display:grid!important}
      .v507-library-title{display:flex!important;gap:8px!important;align-items:center!important;color:#f97316!important;font-weight:950!important}
      .v507-select-row{display:grid!important;grid-template-columns:46px minmax(0,1fr)92px!important;gap:10px!important;align-items:center!important}
      .v507-play{width:46px!important;min-width:46px!important;height:44px!important;border:1px solid rgba(249,115,22,.55)!important;border-radius:13px!important;background:rgba(249,115,22,.16)!important;color:#f97316!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
      .v507-play .fa-pause{display:none!important}.v507-play.playing .fa-play{display:none!important}.v507-play.playing .fa-pause{display:inline-block!important}.v507-play.playing{border-color:#10b981!important;color:#10b981!important;background:rgba(16,185,129,.18)!important}
      .v507-player{display:grid!important;gap:12px!important;width:100%!important;max-width:100%!important;padding:14px!important;border:1px solid rgba(249,115,22,.34)!important;border-radius:18px!important;background:linear-gradient(180deg,rgba(249,115,22,.08),rgba(0,0,0,.05)),#070707!important;box-sizing:border-box!important}
      .v507-time{display:grid!important;grid-template-columns:46px minmax(0,1fr)46px!important;align-items:center!important;gap:10px!important}
      .v507-time span,.v507-time strong{color:#fbbf24!important;font-family:'JetBrains Mono',monospace!important;font-size:.78rem!important;font-weight:950!important}
      .v507-time b{color:#bdbdbd!important;font-size:.72rem!important;font-weight:950!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .v507-track{position:relative!important;height:72px!important;border-radius:18px!important;background:#111!important;border:1px solid #2d2d2d!important;box-sizing:border-box!important;overflow:hidden!important;padding:0 12px!important;cursor:crosshair!important;touch-action:none!important;user-select:none!important}
      .v507-wave{position:absolute!important;inset:18px 14px 22px 14px!important;border-radius:12px!important;background:repeating-linear-gradient(90deg,rgba(255,255,255,.10) 0 2px,transparent 2px 10px),linear-gradient(180deg,transparent 0 15%,rgba(16,185,129,.35) 15% 45%,rgba(249,115,22,.45) 45% 72%,transparent 72% 100%)!important}
      .v507-fill{position:absolute!important;top:20px!important;height:28px!important;border-radius:999px!important;background:linear-gradient(90deg,rgba(16,185,129,.60),rgba(249,115,22,.70))!important;box-shadow:0 0 0 1px rgba(249,115,22,.28),0 0 18px rgba(249,115,22,.18)!important;pointer-events:auto!important;cursor:grab!important;z-index:2!important}
      .v507-handle{position:absolute!important;top:15px!important;width:24px!important;height:38px!important;transform:translateX(-50%)!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:10px!important;background:#f97316!important;color:#050505!important;font-weight:950!important;font-size:1.05rem!important;display:grid!important;place-items:center!important;z-index:4!important;cursor:ew-resize!important;padding:0!important}
      .v507-handle.start{background:#10b981!important}
      #v507-progress{position:absolute!important;left:12px!important;width:calc(100% - 24px)!important;bottom:8px!important;z-index:5!important;accent-color:#f97316!important}
      #v507-start,#v507-end{display:none!important}
      #v507-apply{min-height:42px!important;border:1px solid #10b981!important;border-radius:13px!important;background:#10b981!important;color:#04120d!important;font-weight:950!important;cursor:pointer!important}
      .v507-file-row{display:grid!important;grid-template-columns:126px minmax(0,1fr)!important;gap:10px!important;align-items:center!important}
      .v507-file-row span{min-width:0!important;color:#aaa!important;font-size:.78rem!important;font-weight:850!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      @media(max-width:900px){.v507-select-row,.v507-file-row,.v507-actions{grid-template-columns:1fr!important}.v507-play,#v507-remove{width:100%!important;min-width:0!important}}
    `;
    document.head.appendChild(st);
  }

  async function v507Rows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v507SelectedRow() {
    const id = qs("#v507-custom-select")?.value || v507Settings().selectedCustomId;
    if (!id) return null;
    const rows = await v507Rows();
    return rows.find(r => r.id === id) || null;
  }

  function v507Segment() {
    const max = Math.max(1, Number(qs("#v507-start")?.max || qs("#v507-end")?.max || v507Duration || 1));
    let start = Math.max(0, Math.min(max - 1, Number(qs("#v507-start")?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(qs("#v507-end")?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    if (qs("#v507-start")) qs("#v507-start").value = Math.floor(start);
    if (qs("#v507-end")) qs("#v507-end").value = Math.floor(end);
    return { start, end, max };
  }

  function v507Update(current = null) {
    const { start, end, max } = v507Segment();
    const left = (start / max) * 100;
    const right = (end / max) * 100;
    const fill = qs("#v507-fill");
    if (fill) {
      fill.style.left = left + "%";
      fill.style.width = Math.max(0, right - left) + "%";
    }
    const sh = qs("#v507-start-handle");
    const eh = qs("#v507-end-handle");
    if (sh) sh.style.left = left + "%";
    if (eh) eh.style.left = right + "%";
    if (qs("#v507-current")) qs("#v507-current").textContent = v507Time(current == null ? Number(qs("#v507-progress")?.value || start) : current);
    if (qs("#v507-total")) qs("#v507-total").textContent = v507Time(max);
    if (qs("#v507-range-label")) qs("#v507-range-label").textContent = `${v507Time(start)} - ${v507Time(end)}`;
    if (qs("#v507-progress")) {
      qs("#v507-progress").max = max;
      if (current != null) qs("#v507-progress").value = Math.min(max, Math.max(0, Math.floor(current)));
    }
  }

  async function v507LoadMeta() {
    const row = await v507SelectedRow();
    if (!row?.blob) {
      v507Duration = 1;
      ["#v507-progress","#v507-start","#v507-end"].forEach(sel => { const el = qs(sel); if (el) el.max = 1; });
      v507Update(0);
      return;
    }
    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(a.duration || 1));
      v507Duration = total;
      const st = v507Settings();
      const start = Math.max(0, Math.min(total - 1, Number(st.customStart || 0)));
      const rawEnd = Number(st.customEnd || 0);
      const end = rawEnd > start ? Math.min(total, rawEnd) : total;
      ["#v507-progress","#v507-start","#v507-end"].forEach(sel => { const el = qs(sel); if (el) el.max = total; });
      if (qs("#v507-start")) qs("#v507-start").value = Math.floor(start);
      if (qs("#v507-end")) qs("#v507-end").value = Math.floor(end);
      v507Update(start);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  async function v507RenderLibrary() {
    const select = qs("#v507-custom-select");
    if (!select) return;
    const s = v507Settings();
    const files = await v507Rows();
    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const size = file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "";
      return `<option value="${file.id}" ${active ? "selected" : ""}>${active ? "✓ " : ""}${file.name}${size ? " · " + size : ""}</option>`;
    }).join("");
    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";
    const note = qs("#v507-file-note");
    if (note) {
      const text = current ? "Aktif: " + current.name : "Dosya seçilmedi";
      note.textContent = text;
      note.title = text;
    }
  }

  async function v507PlayCustom() {
    const row = await v507SelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }
    v507StopPreview();
    const { start, end } = v507Segment();
    v507PreviewUrl = URL.createObjectURL(row.blob);
    v507PreviewAudio = new Audio(v507PreviewUrl);
    v507PreviewAudio.volume = 1;
    v507PreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v507PreviewAudio.duration || 1));
      const safeStart = Math.min(start, total - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : total, total);
      v507PreviewAudio.currentTime = safeStart;
      v507Update(safeStart);
      v507PreviewAudio.ontimeupdate = () => {
        if (!v507PreviewAudio) return;
        v507Update(v507PreviewAudio.currentTime);
        if (v507PreviewAudio.currentTime >= safeEnd) v507StopPreview();
      };
      v507PreviewAudio.onended = v507StopPreview;
      v507PreviewAudio.onerror = v507StopPreview;
      qs("#v507-play-custom")?.classList.add("playing");
      const top = qs("#v507-sound-test");
      if (top) { top.classList.add("testing"); top.textContent = "ÇALIYOR..."; }
      try {
        await v507PreviewAudio.play();
        v507PreviewTimer = setTimeout(v507StopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v507StopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v507PlaySelected() {
    const type = qs("#v507-sound-type")?.value || "digital";
    if (type === "custom") return v507PlayCustom();
    v507StopPreview();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v507SetSettings({ sound: type, volume: 1, enabled: true });
    const top = qs("#v507-sound-test");
    if (top) { top.classList.add("testing"); top.textContent = "ÇALIYOR..."; }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
    setTimeout(() => { if (top) { top.classList.remove("testing"); top.textContent = "OYNAT"; } }, 1200);
  }

  function v507BindTimeline() {
    const track = qs("#v507-track");
    const startInput = qs("#v507-start");
    const endInput = qs("#v507-end");
    if (!track || !startInput || !endInput || track.dataset.bound === "v507") return;
    track.dataset.bound = "v507";
    const secFromEvent = ev => {
      const rect = track.getBoundingClientRect();
      const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(pct * Math.max(1, Number(startInput.max || endInput.max || v507Duration || 1)));
    };
    let mode = null, offset = 0;
    const choose = (sec, target) => {
      const { start, end } = v507Segment();
      if (target?.id === "v507-start-handle") return "start";
      if (target?.id === "v507-end-handle") return "end";
      if (target?.id === "v507-fill" || (sec > start && sec < end)) { offset = sec - start; return "range"; }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "start" : "end";
    };
    const apply = sec => {
      const { start, end, max } = v507Segment();
      const len = Math.max(1, end - start);
      if (mode === "start") startInput.value = Math.min(sec, end - 1);
      else if (mode === "end") endInput.value = Math.max(sec, start + 1);
      else if (mode === "range") {
        const ns = Math.max(0, Math.min(max - len, sec - offset));
        startInput.value = Math.floor(ns);
        endInput.value = Math.floor(ns + len);
      }
      v507Update();
    };
    const down = ev => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      mode = choose(sec, ev.target);
      apply(sec);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };
    const move = ev => { ev.preventDefault(); if (mode) apply(secFromEvent(ev)); };
    const up = () => {
      mode = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };
    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });
  }

  function renderSoundRootV507() {
    const mount = qs("#v28-sound-mount");
    if (!mount) return;
    v507InjectStyle();
    const s = v507Settings();
    const soundType = s.sound || "digital";
    const isCustom = soundType === "custom";
    if (mount.dataset.ready === "v507" && mount.querySelector(".v507-sound-card")) return;
    mount.dataset.ready = "v507";
    mount.innerHTML = `
      <div class="v32-sound-card v507-sound-card">
        <div class="v507-sound-head"><b>Alarm Ses Merkezi</b></div>
        <div class="v507-actions"><button id="v507-sound-test" type="button">OYNAT</button><button id="v507-sound-stop" type="button" class="danger">DURDUR</button></div>
        <div class="v507-field"><label>Ses Tipi</label><select id="v507-sound-type"><option value="custom">Özel Ses</option><option value="digital">Dijital Uyarı</option><option value="bip">Standart Bip</option><option value="chime">Yumuşak Chime</option><option value="siren">Siren</option><option value="silent">Sessiz</option></select></div>
        <div class="v507-custom ${isCustom ? "show" : ""}" id="v507-custom-panel">
          <div class="v507-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>
          <div class="v507-select-row"><button type="button" id="v507-play-custom" class="v507-play"><i class="fa-solid fa-play"></i><i class="fa-solid fa-pause"></i></button><select id="v507-custom-select"><option value="">Özel ses seç...</option></select><button type="button" id="v507-remove" class="danger">KALDIR</button></div>
          <div class="v507-player">
            <div class="v507-time"><span id="v507-current">0:00</span><b>Alarm Aralığı: <strong id="v507-range-label">0:00 - 0:00</strong></b><span id="v507-total">0:00</span></div>
            <div class="v507-track" id="v507-track"><div class="v507-wave"></div><div class="v507-fill" id="v507-fill"></div><button type="button" class="v507-handle start" id="v507-start-handle">[</button><button type="button" class="v507-handle end" id="v507-end-handle">]</button><input id="v507-progress" type="range" min="0" max="1" step="1" value="0"><input id="v507-start" type="range" min="0" max="1" step="1" value="0" hidden><input id="v507-end" type="range" min="0" max="1" step="1" value="1" hidden></div>
            <button type="button" id="v507-apply">BU ARALIĞI ALARM YAP</button>
          </div>
          <div class="v507-file-row"><button type="button" id="v507-file-pick">DOSYA SEÇ</button><span id="v507-file-note">Dosya seçilmedi</span><input id="v507-file-input" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.opus" hidden></div>
        </div>
      </div>
    `;
    qs("#v507-sound-type").value = soundType;
    qs("#v507-sound-stop").onclick = () => { v507StopPreview(); if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop(); };
    qs("#v507-sound-test").onclick = v507PlaySelected;
    qs("#v507-sound-type").onchange = e => { v507SetSettings({ sound: e.target.value, volume: 1, enabled: true }); mount.dataset.ready = ""; renderSoundRootV507(); };
    qs("#v507-play-custom").onclick = async e => { e.preventDefault(); if (qs("#v507-play-custom")?.classList.contains("playing")) v507StopPreview(); else await v507PlayCustom(); };
    qs("#v507-file-pick").onclick = () => qs("#v507-file-input")?.click();
    qs("#v507-file-input").onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const note = qs("#v507-file-note");
      if (note) { note.textContent = "Yükleniyor: " + file.name; note.title = file.name; }
      try {
        if (!window.V26AlarmAudio?.addCustomFile) throw new Error("Ses motoru hazır değil.");
        const row = await window.V26AlarmAudio.addCustomFile(file);
        if (row?.id && window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        v507SetSettings({ sound: "custom", selectedCustomId: row?.id || "", customStart: 0, customEnd: 0, volume: 1, enabled: true });
        await v507RenderLibrary();
        if (qs("#v507-custom-select") && row?.id) qs("#v507-custom-select").value = row.id;
        await v507LoadMeta();
      } catch {
        if (note) note.textContent = "Dosya yüklenemedi.";
        alert("Ses dosyası yüklenemedi. MP3/WAV/OGG/M4A/AAC/FLAC/WEBM gibi geçerli bir ses dosyası seç.");
      } finally { e.target.value = ""; }
    };
    qs("#v507-custom-select").onchange = async e => {
      const id = e.target.value;
      if (!id) return;
      v507StopPreview();
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      v507SetSettings({ sound: "custom", selectedCustomId: id, volume: 1, enabled: true });
      await v507RenderLibrary();
      await v507LoadMeta();
    };
    qs("#v507-remove").onclick = async () => {
      const id = qs("#v507-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      v507StopPreview();
      if (window.V26AlarmAudio?.removeCustomFile) await window.V26AlarmAudio.removeCustomFile(id);
      mount.dataset.ready = "";
      renderSoundRootV507();
    };
    qs("#v507-progress").addEventListener("input", e => {
      const sec = Number(e.target.value || 0);
      if (v507PreviewAudio) v507PreviewAudio.currentTime = sec;
      v507Update(sec);
    });
    qs("#v507-apply").onclick = () => {
      const { start, end } = v507Segment();
      v507SetSettings({ sound: "custom", customStart: start, customEnd: end, volume: 1, enabled: true });
      const btn = qs("#v507-apply");
      btn.textContent = `AKTİF: ${v507Time(start)} - ${v507Time(end)}`;
      setTimeout(() => btn.textContent = "BU ARALIĞI ALARM YAP", 1600);
    };
    v507RenderLibrary().then(() => v507LoadMeta().then(v507BindTimeline));
  }



  function activatePanel(name) {
    qsa(".crypto-v28-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.cryptoPanel === name));
    qsa(".crypto-v28-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.cryptoPane === name));

    const title = qs("#crypto-v28-panel-title");
    const sub = qs("#crypto-v28-panel-subtitle");
    const t = PANEL_TITLES[name] || PANEL_TITLES.graph;

    if (title) title.textContent = t[0];
    if (sub) sub.textContent = t[1];

    localStorage.setItem("v28_crypto_panel", name);
    if (name === "sound") { setTimeout(renderSoundRootV507, 0); setTimeout(renderSoundRootV507, 250); setTimeout(renderSoundRootV507, 900); window.__v508SoundRetry = true; }
  }

  function bindTabs() {
    qsa(".crypto-v28-tab").forEach(btn => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => activatePanel(btn.dataset.cryptoPanel || "graph"));
    });

    const saved = localStorage.getItem("v28_crypto_panel") || "graph";
    activatePanel(saved);
  }

  function formatPrice(v) {
    const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n) || !n) return "$-";
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function syncHeaderClones() {
    const price = qs("#crypto-v10-price")?.textContent || "$-";
    const change = qs("#crypto-v10-change")?.textContent || "0.00%";
    const live = qs("#v28-live-price");
    const ch = qs("#v28-change");

    if (live) live.textContent = price || "$-";
    if (ch) {
      ch.textContent = change || "0.00%";
      ch.classList.toggle("good", !String(change).includes("-"));
      ch.classList.toggle("bad", String(change).includes("-"));
    }
  }

  function robustTimeframeBinding() {
    qsa("#crypto-v10-timeframes [data-tf], .tf-v10[data-tf]").forEach(btn => {
      if (btn.dataset.v28Bound === "1") return;
      btn.dataset.v28Bound = "1";
      btn.addEventListener("click", () => {
        qsa("#crypto-v10-timeframes [data-tf], .tf-v10[data-tf]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        setTimeout(() => {
          if (typeof window.omega_V10RefreshCrypto === "function") {
            window.omega_V10RefreshCrypto(true);
          }
        }, 60);
      }, true);
    });
  }

  function bindSettings() {
    const reset = qs("#v28-reset-crypto-settings");
    if (reset && reset.dataset.bound !== "1") {
      reset.dataset.bound = "1";
      reset.addEventListener("click", () => {
        if (!confirm("Kripto terminal ayarları ve çizimler sıfırlansın mı?")) return;

        Object.keys(localStorage).forEach(k => {
          if (
            k.startsWith("v26_lwc_") ||
            k.startsWith("v28_crypto_") ||
            k.startsWith("v28_alarm_") ||
            k.startsWith("v26_crypto_alarm_")
          ) {
            localStorage.removeItem(k);
          }
        });

        location.reload();
      });
    }
  }

  function hardCleanup() {
  const isCrypto = location.hash === "#crypto";

  // Eski alarm kutuları varsa gizle. Yeni alarm-center.js buna dahil değil.
  qsa(".crypto-v12-alarm-box, .crypto-v13-alarm-box, .alarm-v12-grid, .alarm-v13-grid, .alarm-v13-help").forEach(el => {
    el.style.display = "none";
  });

  // Ses paneli sadece Kripto Terminal içinde görünsün.
  qsa("#v26-alarm-audio-panel, .v26-audio-pill").forEach(el => {
    if (isCrypto) {
      el.style.display = "";
      el.style.visibility = "";
      el.style.pointerEvents = "";
    } else {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
    }
  });

  // Yeni alarm merkezi Kripto içinde kalsın; artık onu gizleme.
  qsa("#v26-alarm-center, .v26-alarm-center").forEach(el => {
    if (isCrypto) {
      el.style.display = "";
      el.style.visibility = "";
      el.style.pointerEvents = "";
    }
  });

  const moduleName = qs("#active-module-name");
  if (moduleName && isCrypto) {
    moduleName.innerHTML = '<span style="color:#f97316">/ KRİPTO TERMİNAL</span>';
  }

  const streamName = qs("#active-module-name");
  if (streamName && location.hash === "#stream") {
    streamName.innerHTML = '<span class="v508-title-stream" style="color:#3b82f6">/ CANLI YAYIN</span>';
  }
}
  function patchHashBoot() {
    window.addEventListener("hashchange", () => {
      setTimeout(() => {
        bindTabs();
        robustTimeframeBinding();
        hardCleanup();
      }, 400);
    });
  }

  function boot() {
    bindTabs();
    bindSettings();
    robustTimeframeBinding();
    syncHeaderClones();
    hardCleanup();
    if ((localStorage.getItem("v28_crypto_panel") || "graph") === "sound") { setTimeout(renderSoundRootV507, 0); setTimeout(renderSoundRootV507, 250); setTimeout(renderSoundRootV507, 900); }
    patchHashBoot();

    setInterval(() => {
      bindTabs();
      bindSettings();
      robustTimeframeBinding();
      syncHeaderClones();
      hardCleanup();
      if ((localStorage.getItem("v28_crypto_panel") || "graph") === "sound") renderSoundRootV507();
    }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
