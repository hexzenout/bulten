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

  const V512_SOUND_KEY = "v28_alarm_audio_settings";
  let v512PreviewAudio = null;
  let v512PreviewUrl = "";
  let v512PreviewTimer = null;
  let v512Duration = 1;

  function v512Settings() {
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
        ...JSON.parse(localStorage.getItem(V512_SOUND_KEY) || "{}"),
        ...live,
        volume: 1
      };
    } catch {
      return { enabled: true, sound: "digital", volume: 1, durationSec: 60, customStart: 0, customEnd: 0, selectedCustomId: "" };
    }
  }

  function v512SetSettings(next) {
    const merged = { ...v512Settings(), ...next, enabled: true, volume: 1 };
    localStorage.setItem(V512_SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function v512Time(sec) {
    sec = Math.max(0, Number(sec || 0));
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  }

  function v512StopPreview() {
    // V526: DURDUR sonrası tekrar oynatınca kaldığı saniyeden devam etsin.
    const keepSec = v512PreviewAudio ? Number(v512PreviewAudio.currentTime || 0) : Number(qs("#v512-progress")?.value || 0);

    if (v512PreviewTimer) {
      clearTimeout(v512PreviewTimer);
      v512PreviewTimer = null;
    }
    if (v512PreviewAudio) {
      try { v512PreviewAudio.pause(); } catch {}
    }
    if (v512PreviewUrl) {
      try { URL.revokeObjectURL(v512PreviewUrl); } catch {}
    }
    v512PreviewAudio = null;
    v512PreviewUrl = "";

    if (Number.isFinite(keepSec) && keepSec > 0) {
      const progress = qs("#v512-progress");
      if (progress) progress.value = Math.floor(keepSec);
      v512Update(keepSec);
    }

    qs("#v512-play-custom")?.classList.remove("playing");
    const test = qs("#v512-sound-test");
    if (test) {
      test.classList.remove("testing");
      test.textContent = "OYNAT";
    }
  }

  async function v512Rows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v512SelectedRow() {
    const id = qs("#v512-custom-select")?.value || v512Settings().selectedCustomId;
    if (!id) return null;
    const rows = await v512Rows();
    return rows.find(r => r.id === id) || null;
  }

  function v512Segment() {
    const max = Math.max(1, Number(qs("#v512-start")?.max || qs("#v512-end")?.max || v512Duration || 1));
    let start = Math.max(0, Math.min(max - 1, Number(qs("#v512-start")?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(qs("#v512-end")?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    if (qs("#v512-start")) qs("#v512-start").value = Math.floor(start);
    if (qs("#v512-end")) qs("#v512-end").value = Math.floor(end);
    return { start, end, max };
  }

  function v512Update(current = null) {
    const { start, end, max } = v512Segment();
    const left = (start / max) * 100;
    const right = (end / max) * 100;
    const fill = qs("#v512-fill");
    if (fill) {
      fill.style.left = left + "%";
      fill.style.width = Math.max(0, right - left) + "%";
    }
    const sh = qs("#v512-start-handle");
    const eh = qs("#v512-end-handle");
    if (sh) sh.style.left = left + "%";
    if (eh) eh.style.left = right + "%";
    if (qs("#v512-current")) qs("#v512-current").textContent = v512Time(current == null ? Number(qs("#v512-progress")?.value || start) : current);
    if (qs("#v512-total")) qs("#v512-total").textContent = v512Time(max);
    if (qs("#v512-range-label")) qs("#v512-range-label").textContent = `${v512Time(start)} - ${v512Time(end)}`;
    if (qs("#v512-progress")) {
      qs("#v512-progress").max = max;
      if (current != null) qs("#v512-progress").value = Math.min(max, Math.max(0, Math.floor(current)));
    }
  }

  async function v512LoadMeta() {
    const row = await v512SelectedRow();
    if (!row?.blob) {
      v512Duration = 1;
      ["#v512-progress","#v512-start","#v512-end"].forEach(sel => { const el = qs(sel); if (el) el.max = 1; });
      if (qs("#v512-start")) qs("#v512-start").value = 0;
      if (qs("#v512-end")) qs("#v512-end").value = 1;
      if (qs("#v512-progress")) qs("#v512-progress").value = 0;
      v512Update(0);
      return;
    }

    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(a.duration || 1));
      v512Duration = total;

      ["#v512-progress","#v512-start","#v512-end"].forEach(sel => { const el = qs(sel); if (el) el.max = total; });

      // V524: Sayfa açıldığında/F5 sonrası görsel tutamaçlar her zaman başta ve sonda dursun.
      // Kayıtlı alarm aralığı localStorage'da kalır; sadece düzenleme ekranı temiz başlar.
      if (qs("#v512-start")) qs("#v512-start").value = 0;
      if (qs("#v512-end")) qs("#v512-end").value = total;
      if (qs("#v512-progress")) qs("#v512-progress").value = 0;

      v512Update(0);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  function v523CleanAudioName(name) {
    return String(name || "Özel Ses")
      .replace(/\.(mp3|mpeg|wav|ogg|oga|m4a|aac|flac|webm|opus|mp4)$/i, "")
      .trim() || "Özel Ses";
  }

  function v526SetFileNote(text, marquee = true) {
    const note = qs("#v512-file-note");
    if (!note) return;
    const safe = String(text || "Dosya seçilmedi").replace(/^Aktif:\s*/i, "").trim() || "Dosya seçilmedi";
    note.title = safe;
    note.textContent = "";

    if (marquee && safe !== "Dosya seçilmedi") {
      const wrap = document.createElement("span");
      wrap.className = "v527-marquee-wrap";

      const one = document.createElement("span");
      one.className = "v527-marquee-item";
      one.textContent = safe;

      const two = document.createElement("span");
      two.className = "v527-marquee-item";
      two.textContent = safe;

      wrap.appendChild(one);
      wrap.appendChild(two);
      note.appendChild(wrap);
      return;
    }

    const span = document.createElement("span");
    span.className = "v526-static-note";
    span.textContent = safe;
    note.appendChild(span);
  }

  async function v512RenderLibrary() {
    const select = qs("#v512-custom-select");
    if (!select) return;
    const s = v512Settings();
    const files = await v512Rows();
    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const label = v523CleanAudioName(file.name);
      return `<option value="${file.id}" ${active ? "selected" : ""}>${active ? "✓ " : ""}${label}</option>`;
    }).join("");
    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";
    v526SetFileNote(current ? v523CleanAudioName(current.name) : "Dosya seçilmedi", !!current);
  }

  async function v512PlayCustom() {
    const row = await v512SelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }

    const { start, end } = v512Segment();
    const requestedProgress = Number(qs("#v512-progress")?.value || 0);

    v512StopPreview();

    v512PreviewUrl = URL.createObjectURL(row.blob);
    v512PreviewAudio = new Audio(v512PreviewUrl);
    v512PreviewAudio.volume = 1;
    v512PreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v512PreviewAudio.duration || 1));
      const safeEnd = Math.min(end > start ? end : total, total);

      // V525: Dolum çubuğu neredeyse oynatma oradan başlar.
      // Eğer progress bitiş aralığının dışındaysa güvenli şekilde başlangıca döner.
      let safeStart = Math.max(0, Math.min(requestedProgress, total - 0.1));
      if (safeEnd > start && safeStart >= safeEnd) safeStart = start;
      safeStart = Math.min(safeStart, total - 0.1);

      v512PreviewAudio.currentTime = safeStart;
      v512Update(safeStart);
      v512PreviewAudio.ontimeupdate = () => {
        if (!v512PreviewAudio) return;
        v512Update(v512PreviewAudio.currentTime);
        if (v512PreviewAudio.currentTime >= safeEnd) v512StopPreview();
      };
      v512PreviewAudio.onended = v512StopPreview;
      v512PreviewAudio.onerror = v512StopPreview;
      qs("#v512-play-custom")?.classList.add("playing");
      const top = qs("#v512-sound-test");
      if (top) { top.classList.add("testing"); top.textContent = "ÇALIYOR..."; }
      try {
        await v512PreviewAudio.play();
        v512PreviewTimer = setTimeout(v512StopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v512StopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v512PlaySelected() {
    const type = qs("#v512-sound-type")?.value || "digital";
    if (type === "custom") return v512PlayCustom();
    v512StopPreview();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v512SetSettings({ sound: type, volume: 1, enabled: true });
    const top = qs("#v512-sound-test");
    if (top) { top.classList.add("testing"); top.textContent = "ÇALIYOR..."; }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
    setTimeout(() => { if (top) { top.classList.remove("testing"); top.textContent = "OYNAT"; } }, 1200);
  }

  function v512Seek(sec) {
    sec = Math.max(0, Number(sec || 0));
    const progress = qs("#v512-progress");
    if (progress) progress.value = Math.floor(sec);
    if (v512PreviewAudio) {
      try { v512PreviewAudio.currentTime = sec; } catch {}
    }
    v512Update(sec);
  }

  function v512ResetHandlesToFull() {
    const max = Math.max(1, Number(qs("#v512-end")?.max || qs("#v512-start")?.max || v512Duration || 1));
    if (qs("#v512-start")) qs("#v512-start").value = 0;
    if (qs("#v512-end")) qs("#v512-end").value = max;
    v512Seek(0);
  }

  function v512BindTimeline() {
    const track = qs("#v512-track");
    const startInput = qs("#v512-start");
    const endInput = qs("#v512-end");
    const progress = qs("#v512-progress");
    if (!track || !startInput || !endInput || track.dataset.bound === "v526") return;
    track.dataset.bound = "v526";

    const clientXOf = ev => ev.touches?.[0]?.clientX ?? ev.clientX;
    const secFromEvent = ev => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientXOf(ev) - rect.left) / rect.width));
      return Math.round(pct * Math.max(1, Number(startInput.max || endInput.max || v512Duration || 1)));
    };

    let mode = null, offset = 0, startClientX = 0, handleDown = false, movedEnough = false;

    const choose = (sec, target) => {
      const { start, end } = v512Segment();

      if (target?.id === "v512-start-handle") return "start";
      if (target?.id === "v512-end-handle") return "end";

      if (target?.id === "v512-progress" || target === track || target?.id === "v512-wave") return "progress";

      if (target?.id === "v512-fill" || (sec > start && sec < end)) {
        offset = sec - start;
        return "range";
      }

      return "progress";
    };

    const apply = (sec) => {
      const { start, end, max } = v512Segment();
      const len = Math.max(1, end - start);

      if (mode === "start") {
        startInput.value = Math.min(sec, end - 1);
        v512Seek(Number(startInput.value || 0));
      } else if (mode === "end") {
        endInput.value = Math.max(sec, start + 1);
        v512Update();
      } else if (mode === "range") {
        const ns = Math.max(0, Math.min(max - len, sec - offset));
        startInput.value = Math.floor(ns);
        endInput.value = Math.floor(ns + len);
        v512Seek(ns);
      } else if (mode === "progress") {
        v512Seek(sec);
      }
    };

    const down = ev => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      mode = choose(sec, ev.target);
      startClientX = clientXOf(ev);
      handleDown = ev.target?.id === "v512-start-handle" || ev.target?.id === "v512-end-handle";
      movedEnough = false;

      // V526: Gri tutamaçların ortasına tek tıklayınca tutamaç kaymasın.
      // Sadece gerçekten sürükleme varsa hareket ettir.
      if (!handleDown) apply(sec);

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };

    const move = ev => {
      ev.preventDefault();
      if (!mode) return;
      if (handleDown && Math.abs(clientXOf(ev) - startClientX) < 4) return;
      movedEnough = true;
      apply(secFromEvent(ev));
    };

    const up = () => {
      // Başlangıç tutamağına sadece tıklanırsa: süreyi oraya al, müziği oradan başlat.
      if (handleDown && !movedEnough && mode === "start") {
        const start = Number(startInput.value || 0);
        v512Seek(start);
        if (!v512PreviewAudio) v512PlayCustom();
      }

      mode = null;
      handleDown = false;
      movedEnough = false;

      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };

    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });

    progress?.addEventListener("input", e => {
      v512Seek(Number(e.target.value || 0));
    });
  }

  function renderSoundRootV512(force = false) {
    const mount = qs("#v28-sound-mount");
    if (!mount) return;
    const s = v512Settings();
    const soundType = s.sound || "digital";
    const isCustom = soundType === "custom";
    if (!force && ["v512","v514","v515"].includes(mount.dataset.ready) && mount.querySelector(".v512-sound-card")) return;
    mount.dataset.ready = "v515";
    mount.innerHTML = `
      <div class="v512-sound-card v514-sound-card">
        <div class="v512-sound-head"><b>Alarm Ses Merkezi</b></div>
        <div class="v512-actions"><button id="v512-sound-test" type="button">OYNAT</button><button id="v512-sound-stop" type="button" class="danger">DURDUR</button></div>
        <div class="v512-field"><label>Ses Tipi</label><select id="v512-sound-type"><option value="custom">Özel Ses</option><option value="digital">Dijital Uyarı</option><option value="bip">Standart Bip</option><option value="chime">Yumuşak Chime</option><option value="siren">Siren</option><option value="silent">Sessiz</option></select></div>
        <div class="v512-custom ${isCustom ? "show" : ""}" id="v512-custom-panel">
          <div class="v512-library-title"><i class="fa-solid fa-music"></i><b>Özel Ses Kütüphanesi</b></div>
          <div class="v512-select-row"><button type="button" id="v512-play-custom" class="v512-play"><i class="fa-solid fa-play"></i><i class="fa-solid fa-pause"></i></button><select id="v512-custom-select"><option value="">Özel ses seç...</option></select><button type="button" id="v512-remove" class="danger">KALDIR</button></div>
          <div class="v512-player">
            <div class="v512-time"><span id="v512-current">0:00</span><b>Alarm Aralığı: <strong id="v512-range-label">0:00 - 0:00</strong></b><span id="v512-total">0:00</span></div>
            <div class="v512-track" id="v512-track"><div class="v512-wave"></div><div class="v512-fill" id="v512-fill"></div><button type="button" class="v512-handle start" id="v512-start-handle" aria-label="Başlangıç tutamağı"></button><button type="button" class="v512-handle end" id="v512-end-handle" aria-label="Bitiş tutamağı"></button><input id="v512-progress" type="range" min="0" max="1" step="1" value="0"><input id="v512-start" type="range" min="0" max="1" step="1" value="0" hidden><input id="v512-end" type="range" min="0" max="1" step="1" value="1" hidden></div>
            <button type="button" id="v512-apply">BU ARALIĞI ALARM YAP</button>
          </div>
          <div class="v512-file-row"><button type="button" id="v512-file-pick">DOSYA SEÇ</button><span id="v512-file-note">Dosya seçilmedi</span><input id="v512-file-input" type="file" accept="audio/*,.mp3,.mpeg,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,.opus,.mp4" hidden></div>
        </div>
      </div>
    `;
    qs("#v512-sound-type").value = soundType;
    qs("#v512-sound-stop").onclick = () => { v512StopPreview(); if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop(); };
    qs("#v512-sound-test").onclick = v512PlaySelected;
    qs("#v512-sound-type").onchange = e => { v512SetSettings({ sound: e.target.value, volume: 1, enabled: true }); renderSoundRootV512(true); };
    qs("#v512-play-custom").onclick = async e => { e.preventDefault(); if (qs("#v512-play-custom")?.classList.contains("playing")) v512StopPreview(); else await v512PlayCustom(); };
    qs("#v512-file-pick").onclick = () => qs("#v512-file-input")?.click();
    qs("#v512-file-input").onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      v526SetFileNote("Yükleniyor: " + v523CleanAudioName(file.name), false);
      try {
        if (!window.V26AlarmAudio?.addCustomFile) throw new Error("Ses motoru hazır değil.");
        const row = await window.V26AlarmAudio.addCustomFile(file);
        if (row?.id && window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(row.id);
        v512SetSettings({ sound: "custom", selectedCustomId: row?.id || "", customStart: 0, customEnd: 0, volume: 1, enabled: true });
        await v512RenderLibrary();
        if (qs("#v512-custom-select") && row?.id) qs("#v512-custom-select").value = row.id;
        await v512LoadMeta();
        v526SetFileNote(v523CleanAudioName(row?.name || file.name), true);
      } catch (err) {
        console.warn("V512 sound upload error", err);
        v526SetFileNote("Dosya yüklenemedi.", false);
        alert("Ses dosyası yüklenemedi. MP3/WAV/OGG/M4A/AAC/FLAC/WEBM gibi geçerli bir ses dosyası seç.");
      } finally { e.target.value = ""; }
    };
    qs("#v512-custom-select").onchange = async e => {
      const id = e.target.value;
      if (!id) return;
      v512StopPreview();
      if (window.V26AlarmAudio?.selectCustomFile) await window.V26AlarmAudio.selectCustomFile(id);
      v512SetSettings({ sound: "custom", selectedCustomId: id, volume: 1, enabled: true });
      await v512RenderLibrary();
      await v512LoadMeta();
    };
    qs("#v512-remove").onclick = async () => {
      const id = qs("#v512-custom-select")?.value;
      if (!id) return alert("Kaldırılacak özel sesi seç.");
      if (!confirm("Bu özel sesi kaldırayım mı?")) return;
      v512StopPreview();
      if (window.V26AlarmAudio?.removeCustomFile) await window.V26AlarmAudio.removeCustomFile(id);
      renderSoundRootV512(true);
    };
    qs("#v512-progress").addEventListener("input", e => {
      v512Seek(Number(e.target.value || 0));
    });
    qs("#v512-apply").onclick = () => {
      const { start, end } = v512Segment();
      v512SetSettings({ sound: "custom", customStart: start, customEnd: end, volume: 1, enabled: true });
      v512StopPreview();
      v512ResetHandlesToFull();
      const btn = qs("#v512-apply");
      btn.textContent = `ALARM KAYDEDİLDİ: ${v512Time(start)} - ${v512Time(end)}`;
      setTimeout(() => btn.textContent = "BU ARALIĞI ALARM YAP", 1800);
    };
    v512RenderLibrary().then(() => v512LoadMeta().then(v512BindTimeline));
  }

  window.V512RenderSoundCenter = renderSoundRootV512;

  function panelFromHash() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (!raw.startsWith("crypto")) return "";
    const part = raw.split("/")[1] || "graph";
    return PANEL_TITLES[part] ? part : "graph";
  }

  function activatePanel(name, writeHash = false) {
    name = PANEL_TITLES[name] ? name : "graph";
    qsa(".crypto-v28-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.cryptoPanel === name));
    qsa(".crypto-v28-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.cryptoPane === name));

    const title = qs("#crypto-v28-panel-title");
    const sub = qs("#crypto-v28-panel-subtitle");
    const t = PANEL_TITLES[name] || PANEL_TITLES.graph;

    if (title) title.textContent = t[0];
    if (sub) sub.textContent = t[1];

    localStorage.setItem("v28_crypto_panel", name);

    if (writeHash) {
      const nextHash = name === "graph" ? "#crypto" : `#crypto/${name}`;
      if (location.hash !== nextHash) history.pushState({ tab: "crypto", panel: name }, "", nextHash);
    }

    if (name === "sound") setTimeout(() => renderSoundRootV512(true), 0);
  }

  function bindTabs() {
    qsa(".crypto-v28-tab").forEach(btn => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => activatePanel(btn.dataset.cryptoPanel || "graph", true));
    });

    const fromHash = panelFromHash();
    const saved = fromHash || localStorage.getItem("v28_crypto_panel") || "graph";
    activatePanel(saved, false);
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
  const isCrypto = String(location.hash || "").startsWith("#crypto");

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
    streamName.innerHTML = '<span style="color:#3b82f6">/ CANLI YAYIN</span>';
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
    if ((panelFromHash() || localStorage.getItem("v28_crypto_panel") || "graph") === "sound") setTimeout(() => renderSoundRootV512(true), 0);
    patchHashBoot();

    setInterval(() => {
      // V514: bindTabs/renderSoundRoot'u her saniye çalıştırmak select/dropdown kapanmasına
      // ve timeline/süre yanıp sönmesine sebep oluyordu. Sadece eksikse yeniden bas.
      bindSettings();
      robustTimeframeBinding();
      syncHeaderClones();
      hardCleanup();

      const activePanel = panelFromHash() || localStorage.getItem("v28_crypto_panel") || "graph";
      if (activePanel === "sound") {
        const mount = qs("#v28-sound-mount");
        if (mount && !mount.querySelector(".v512-sound-card")) renderSoundRootV512(true);
      }
    }, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
