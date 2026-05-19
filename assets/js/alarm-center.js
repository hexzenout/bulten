// ===============================
// V27 CLEAN ALARM CENTER
// Kompakt alarm formu + ses ayarları + geçmiş. Sağ üst floating yok.
// ===============================

(function () {
  const STORAGE_KEY = "v27_crypto_alarms";
  const HISTORY_KEY = "v27_crypto_alarm_history";
  const POLL_MS = 2500;

  let state = loadState();
  let history = loadHistory();
  let timer = null;
  let initialized = false;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { alarms: Array.isArray(raw.alarms) ? raw.alarms : [] };
    } catch { return { alarms: [] }; }
  }

  function loadHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function saveHistory() { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500))); }
  function uid() { return "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }

  function money(v) {
    const n = Number(v || 0);
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function normalizeCoin(v) { return String(v || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC"; }
  function normalizeQuote(v) { return String(v || "USDT").trim().toUpperCase() === "USDC" ? "USDC" : "USDT"; }

  function getSelectedExchange() {
    const val = (document.getElementById("v10-exchange")?.value || "binance").toLowerCase();
    return val.includes("okx") ? "okx" : "binance";
  }

  function getSelectedQuote() {
    return normalizeQuote(document.getElementById("v10-quote")?.value || "USDT");
  }

  function getSelectedCoin() {
    return normalizeCoin(document.getElementById("v10-symbol")?.value || "BTC");
  }

  function currentKey() {
    return `${getSelectedExchange()}:${getSelectedCoin()}${getSelectedQuote()}`;
  }

  function parseKey(key) {
    const [exRaw, symRaw] = String(key || "binance:BTCUSDT").split(":");
    const exchange = exRaw === "okx" ? "okx" : "binance";
    const symbol = String(symRaw || "BTCUSDT").toUpperCase();
    const quote = symbol.endsWith("USDC") ? "USDC" : "USDT";
    const coin = symbol.replace(quote, "") || "BTC";
    return { exchange, symbol: `${coin}${quote}`, coin, quote };
  }

  function normalizeKey(input) {
    const raw = String(input || "").trim().toUpperCase();
    if (raw.includes(":")) {
      const [ex, sym] = raw.split(":");
      const exchange = ex.toLowerCase().includes("OKX") ? "okx" : "binance";
      const quote = sym.endsWith("USDC") ? "USDC" : "USDT";
      const coin = normalizeCoin(sym.replace(quote, ""));
      return `${exchange}:${coin}${quote}`;
    }
    const quote = raw.endsWith("USDC") ? "USDC" : "USDT";
    const coin = normalizeCoin(raw.replace(quote, ""));
    return `${getSelectedExchange()}:${coin}${quote}`;
  }

  async function fetchBinance(symbol) {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    if (!r.ok) throw new Error("Binance fiyat alınamadı");
    const j = await r.json();
    return { price: Number(j.lastPrice), changePct: Number(j.priceChangePercent || 0) };
  }

  async function fetchOkx(symbol) {
    const instId = symbol.replace("USDT", "-USDT").replace("USDC", "-USDC");
    const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`, { cache: "no-store" });
    if (!r.ok) throw new Error("OKX fiyat alınamadı");
    const j = await r.json();
    const d = j?.data?.[0];
    const last = Number(d?.last || 0);
    const open = Number(d?.open24h || 0);
    return { price: last, changePct: open ? ((last - open) / open) * 100 : 0 };
  }

  async function fetchPrice(key) {
    const p = parseKey(key);
    return p.exchange === "okx" ? fetchOkx(p.symbol) : fetchBinance(p.symbol);
  }

  function removeLegacy() {
    document.querySelectorAll("#v26-alarm-center, .crypto-v12-alarm-box, .crypto-v13-alarm-box").forEach(el => el.remove());
  }

  function mountPoint() {
    return document.querySelector(".crypto-v10-control-panel") ||
      document.querySelector("#omega-crypto-block .crypto-v10-layout") ||
      document.querySelector("#omega-crypto-block") ||
      document.body;
  }

  function injectStyles() {
    if (document.getElementById("v27-alarm-center-style")) return;
    const style = document.createElement("style");
    style.id = "v27-alarm-center-style";
    style.textContent = `
      #v27-alarm-center{margin-top:14px;background:#090909;border:1px solid #292929;border-radius:16px;overflow:hidden;width:100%;box-sizing:border-box}
      .v27-alarm-head{padding:13px 14px;border-bottom:1px solid #242424;background:#111;display:flex;justify-content:space-between;align-items:center;gap:10px}
      .v27-alarm-head h3{margin:0;color:#fbbf24;font-size:.84em;font-weight:950;text-transform:uppercase;letter-spacing:.55px}
      .v27-alarm-head span{display:block;color:#888;font-size:.64em;font-weight:800;margin-top:3px;line-height:1.35}
      .v27-alarm-body{padding:12px;display:grid;gap:10px}
      .v27-tab-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;background:#0b0b0b;border:1px solid #242424;border-radius:12px;padding:7px}
      .v27-tab{border:1px solid transparent;background:transparent;color:#aaa;border-radius:9px;padding:9px 7px;font-size:.66em;font-weight:950;cursor:pointer}
      .v27-tab.active{background:#fbbf24;color:#171000}
      .v27-panel{display:none}
      .v27-panel.active{display:grid;gap:9px}
      .v27-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .v27-field{display:grid;gap:5px;min-width:0}
      .v27-field.full{grid-column:1/-1}
      .v27-field label{display:block;color:#d0d0d0;font-size:.60em;font-weight:950;text-transform:uppercase;letter-spacing:.6px}
      .v27-field input,.v27-field select{width:100%;max-width:100%;height:40px;background:#060606!important;border:1px solid #3a3a3a!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-radius:10px;padding:10px 11px;font-size:.80em;font-weight:850;font-family:'JetBrains Mono',monospace;box-sizing:border-box;opacity:1!important}
      .v27-field input::placeholder{color:#777!important;-webkit-text-fill-color:#777!important}
      .v27-field input[type="range"]{padding:0;height:26px}
      .v27-btn-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
      .v27-btn{width:100%;min-width:0;min-height:38px;border:1px solid #333;background:#171717;color:#eee;border-radius:10px;padding:9px 8px;font-size:.68em;font-weight:950;cursor:pointer;white-space:normal;line-height:1.2;text-align:center;box-sizing:border-box}
      .v27-btn.gold{background:#fbbf24;border-color:#fbbf24;color:#171000}
      .v27-btn.green{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.35);color:#10b981}
      .v27-btn.red{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.35);color:#ff9a9a}
      .v27-list{display:grid;gap:7px;max-height:245px;overflow:auto}
      .v27-empty{border:1px dashed #333;border-radius:12px;padding:16px;color:#777;font-size:.74em;font-weight:800;text-align:center}
      .v27-row{display:grid;grid-template-columns:1fr;gap:8px;background:#101010;border:1px solid #252525;border-radius:12px;padding:10px;box-sizing:border-box}
      .v27-row.hit{border-color:rgba(16,185,129,.55);background:rgba(16,185,129,.06)}
      .v27-row b{display:block;color:#fbbf24;font-family:'JetBrains Mono',monospace;font-size:.78em;margin-bottom:4px;white-space:normal;overflow-wrap:anywhere}
      .v27-row span{display:block;color:#aaa;font-size:.64em;font-weight:800;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
      .v27-row-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}
      .v27-status{display:flex;align-items:center;justify-content:center;min-height:35px;border:1px solid #333;background:#171717;color:#aaa;border-radius:999px;padding:6px 8px;font-size:.58em;font-weight:950;text-transform:uppercase;text-align:center}
      .v27-status.hit{color:#00170d;background:#10b981;border-color:#10b981}
      .v27-audio-state{border:1px solid #333;background:#0b0b0b;border-radius:12px;padding:10px;color:#aaa;font-size:.72em;font-weight:800;line-height:1.45}
      .v27-audio-state b{color:#fbbf24}
      .v27-file-label{background:#151515;border:1px dashed #444;border-radius:12px;padding:12px;color:#ddd;text-align:center;cursor:pointer}
      .v27-file-label input{display:none}
      @media(max-width:900px){.v27-grid,.v27-btn-grid,.v27-row-actions{grid-template-columns:1fr}.v27-tab-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    injectStyles();
    removeLegacy();

    const box = document.createElement("div");
    box.id = "v27-alarm-center";
    box.innerHTML = `
      <div class="v27-alarm-head">
        <div>
          <h3>Alarm Merkezi</h3>
          <span>Sesli fiyat alarmı, özel ses ve geçmiş.</span>
        </div>
        <button class="v27-btn" id="v27-alarm-refresh">YENİLE</button>
      </div>
      <div class="v27-alarm-body">
        <div class="v27-tab-row">
          <button class="v27-tab active" data-tab="alarms">ALARMLAR</button>
          <button class="v27-tab" data-tab="audio">SES</button>
          <button class="v27-tab" data-tab="history">GEÇMİŞ</button>
        </div>

        <div class="v27-panel active" id="v27-panel-alarms">
          <div class="v27-grid">
            <div class="v27-field full"><label>Sembol</label><input id="v27-alarm-symbol" placeholder="binance:BTCUSDT"></div>
            <div class="v27-field"><label>Yön</label><select id="v27-alarm-dir"><option value="above">Üstüne çıkarsa</option><option value="below">Altına düşerse</option></select></div>
            <div class="v27-field"><label>Fiyat</label><input id="v27-alarm-price" type="number" step="0.00000001" placeholder="77000"></div>
            <div class="v27-field full"><label>Not</label><input id="v27-alarm-note" placeholder="BTC long bölgesi"></div>
          </div>
          <div class="v27-btn-grid">
            <button class="v27-btn green" id="v27-fill-symbol">SEÇİLİ COİN</button>
            <button class="v27-btn" id="v27-fill-price">CANLI FİYAT</button>
            <button class="v27-btn gold" id="v27-add-alarm">ALARM EKLE</button>
            <button class="v27-btn red" id="v27-clear-hit">TETİKLENENLERİ SİL</button>
          </div>
          <div class="v27-list" id="v27-alarm-list"></div>
        </div>

        <div class="v27-panel" id="v27-panel-audio">
          <div class="v27-audio-state" id="v27-audio-state">Ses durumu kontrol ediliyor.</div>
          <div class="v27-btn-grid">
            <button class="v27-btn green" id="v27-audio-unlock">SES AKTİF</button>
            <button class="v27-btn gold" id="v27-audio-test">TEST</button>
            <button class="v27-btn red" id="v27-audio-stop">DURDUR</button>
          </div>
          <div class="v27-grid">
            <div class="v27-field"><label>Ses türü</label><select id="v27-audio-sound"><option value="digital">Dijital</option><option value="bip">Bip</option><option value="chime">Chime</option><option value="siren">Siren</option><option value="silent">Sessiz</option><option value="custom">Özel ses</option></select></div>
            <div class="v27-field"><label>Çalma süresi sn</label><input id="v27-audio-duration" type="number" min="60" step="10"></div>
            <div class="v27-field full"><label>Ses yüksekliği</label><input id="v27-audio-volume" type="range" min="0" max="1" step="0.05"></div>
            <div class="v27-field"><label>Başlangıç sn</label><input id="v27-audio-start" type="number" min="0" step="1"></div>
            <div class="v27-field"><label>Bitiş sn</label><input id="v27-audio-end" type="number" min="0" step="1"></div>
            <div class="v27-field full"><label class="v27-file-label">Özel ses yükle<input id="v27-audio-file" type="file" accept="audio/*"></label></div>
          </div>
        </div>

        <div class="v27-panel" id="v27-panel-history">
          <div class="v27-btn-grid">
            <button class="v27-btn red" id="v27-history-clear">GEÇMİŞİ TEMİZLE</button>
            <button class="v27-btn" id="v27-history-export">GEÇMİŞİ İNDİR</button>
          </div>
          <div class="v27-list" id="v27-history-list"></div>
        </div>
      </div>
    `;
    mountPoint().appendChild(box);
    bindUI();
    fillSymbol();
    syncAudioUI();
    renderAll();
  }

  function bindUI() {
    document.querySelectorAll("#v27-alarm-center [data-tab]").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("#v27-alarm-center [data-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        ["alarms","audio","history"].forEach(t => {
          document.getElementById("v27-panel-" + t).classList.toggle("active", t === tab);
        });
        syncAudioUI();
      };
    });

    document.getElementById("v27-alarm-refresh").onclick = () => { fillSymbol(); checkAll(true); };
    document.getElementById("v27-fill-symbol").onclick = fillSymbol;
    document.getElementById("v27-fill-price").onclick = fillPrice;
    document.getElementById("v27-add-alarm").onclick = addAlarm;
    document.getElementById("v27-clear-hit").onclick = () => { state.alarms = state.alarms.filter(a => !a.hit); saveState(); renderAll(); };

    document.getElementById("v27-audio-unlock").onclick = () => { window.V26AlarmAudio?.unlock(); syncAudioUI(); };
    document.getElementById("v27-audio-test").onclick = () => { window.V26AlarmAudio?.test(); syncAudioUI(); };
    document.getElementById("v27-audio-stop").onclick = () => { window.V26AlarmAudio?.stop(); syncAudioUI(); };

    ["sound","duration","volume","start","end"].forEach(key => {
      const el = document.getElementById("v27-audio-" + key);
      if (!el) return;
      el.oninput = () => {
        const map = { sound:"sound", duration:"durationSec", volume:"volume", start:"customStart", end:"customEnd" };
        const value = key === "sound" ? el.value : Number(el.value || 0);
        window.V26AlarmAudio?.setSettings({ [map[key]]: value });
        syncAudioUI();
      };
    });

    document.getElementById("v27-audio-file").onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await window.V26AlarmAudio?.setCustomFile(file);
      syncAudioUI();
    };

    document.getElementById("v27-history-clear").onclick = () => {
      if (!confirm("Alarm geçmişi temizlensin mi?")) return;
      history = [];
      saveHistory();
      renderHistory();
    };
    document.getElementById("v27-history-export").onclick = exportHistory;

    window.addEventListener("v27-alarm-audio-change", syncAudioUI);
    window.addEventListener("v27-alarm-audio-start", syncAudioUI);
    window.addEventListener("v27-alarm-audio-stop", syncAudioUI);
  }

  function syncAudioUI() {
    const s = window.V26AlarmAudio?.getSettings?.() || {};
    const stateEl = document.getElementById("v27-audio-state");
    if (stateEl) {
      stateEl.innerHTML = `<b>${s.unlocked && s.enabled ? "Ses açık" : "Ses kapalı"}</b> · ${s.sound || "digital"} · ${Math.max(60, Number(s.durationSec || 60))} sn${s.customName ? " · " + escapeHtml(s.customName) : ""}${s.isRinging ? " · ÇALIYOR" : ""}`;
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = val; };
    set("v27-audio-sound", s.sound || "digital");
    set("v27-audio-duration", Math.max(60, Number(s.durationSec || 60)));
    set("v27-audio-volume", Number(s.volume || 0.75));
    set("v27-audio-start", Number(s.customStart || 0));
    set("v27-audio-end", Number(s.customEnd || 0));
  }

  function fillSymbol() {
    const p = parseKey(currentKey());
    const el = document.getElementById("v27-alarm-symbol");
    if (el) el.value = `${p.exchange}:${p.symbol}`;
  }

  async function fillPrice() {
    const sym = document.getElementById("v27-alarm-symbol")?.value || currentKey();
    const priceEl = document.getElementById("v27-alarm-price");
    try {
      const data = await fetchPrice(normalizeKey(sym));
      if (priceEl && data.price) priceEl.value = data.price;
    } catch { alert("Canlı fiyat alınamadı."); }
  }

  function addAlarm() {
    const key = normalizeKey(document.getElementById("v27-alarm-symbol")?.value || currentKey());
    const dir = document.getElementById("v27-alarm-dir")?.value || "above";
    const price = Number(document.getElementById("v27-alarm-price")?.value || 0);
    const note = document.getElementById("v27-alarm-note")?.value || "";
    if (!price || price <= 0) return alert("Geçerli alarm fiyatı gir.");
    state.alarms.push({ id: uid(), key, dir, price, note, active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null });
    saveState(); renderAll(); checkAll(true);
    document.getElementById("v27-alarm-note").value = "";
  }

  function renderAll() { renderAlarms(); renderHistory(); }

  function renderAlarms() {
    const list = document.getElementById("v27-alarm-list");
    if (!list) return;
    if (!state.alarms.length) {
      list.innerHTML = `<div class="v27-empty">Henüz alarm yok. Sembol + yön + fiyat girip alarm ekle.</div>`;
      return;
    }
    list.innerHTML = state.alarms.map(a => {
      const p = parseKey(a.key);
      const dirText = a.dir === "above" ? "üstüne çıkarsa" : "altına düşerse";
      return `<div class="v27-row ${a.hit ? "hit" : ""}">
        <div><b>${p.exchange.toUpperCase()} ${p.symbol} ${dirText} ${money(a.price)}</b><span>${escapeHtml(a.note || "")}${a.note ? " · " : ""}Son fiyat: ${a.lastPrice ? money(a.lastPrice) : "-"}</span></div>
        <div class="v27-row-actions"><div class="v27-status ${a.hit ? "hit" : ""}">${a.hit ? "Tetiklendi" : a.active ? "Aktif" : "Pasif"}</div><button class="v27-btn" data-toggle="${a.id}">${a.active ? "PASİF" : "AKTİF"}</button><button class="v27-btn red" data-delete="${a.id}">SİL</button></div>
      </div>`;
    }).join("");

    list.querySelectorAll("[data-toggle]").forEach(btn => btn.onclick = () => {
      const a = state.alarms.find(x => x.id === btn.dataset.toggle);
      if (!a) return;
      a.active = !a.active;
      if (a.active) a.hit = false;
      saveState(); renderAll();
    });
    list.querySelectorAll("[data-delete]").forEach(btn => btn.onclick = () => {
      state.alarms = state.alarms.filter(a => a.id !== btn.dataset.delete);
      saveState(); renderAll();
    });
  }

  function renderHistory() {
    const list = document.getElementById("v27-history-list");
    if (!list) return;
    if (!history.length) {
      list.innerHTML = `<div class="v27-empty">Henüz çalan alarm geçmişi yok.</div>`;
      return;
    }
    list.innerHTML = history.slice(0,100).map(h => `<div class="v27-row hit"><div><b>${escapeHtml(h.symbol)} · ${money(h.price)}</b><span>${escapeHtml(h.note || "")}</span><span>${new Date(h.time).toLocaleString("tr-TR")} · ${escapeHtml(h.message || "")}</span></div></div>`).join("");
  }

  async function checkAll(force = false) {
    const keys = [...new Set(state.alarms.filter(a => a.active && !a.hit).map(a => a.key))];
    for (const key of keys) {
      try {
        const data = await fetchPrice(key);
        state.alarms.forEach(a => {
          if (a.key !== key) return;
          a.lastPrice = data.price;
          if (!a.active || a.hit) return;
          const hit = a.dir === "above" ? data.price >= Number(a.price) : data.price <= Number(a.price);
          if (!hit) return;

          a.hit = true; a.active = false; a.hitAt = Date.now();
          const p = parseKey(a.key);
          const msg = `${p.symbol} alarmı tetiklendi: ${money(data.price)}`;
          history.unshift({ id: uid(), symbol: `${p.exchange.toUpperCase()} ${p.symbol}`, target: a.price, price: data.price, note: a.note || "", message: msg, time: Date.now() });
          saveHistory();
          window.dispatchEvent(new CustomEvent("v26-alarm-fired", { detail: { message: msg, alarm: a, price: data.price } }));
        });
      } catch (err) { if (force) console.warn("Alarm fiyat kontrol hatası:", key, err); }
    }
    saveState(); renderAll();
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "v27-alarm-gecmisi.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(str) {
    return String(str || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function shouldBoot() { return location.hash === "#crypto" || document.querySelector("#omega-crypto-block, .crypto-v10-layout"); }

  function boot() {
    if (!shouldBoot()) return;
    if (initialized) return;
    initialized = true;
    createUI();
    clearInterval(timer);
    timer = setInterval(checkAll, POLL_MS);
    setTimeout(() => checkAll(true), 800);
  }

  window.addEventListener("hashchange", () => {
    if (location.hash !== "#crypto") {
      removeLegacy();
      document.getElementById("v27-alarm-center")?.remove();
      initialized = false;
      return;
    }
    setTimeout(boot, 600);
  });
  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 900));

  window.V26AlarmCenter = {
    add(key, dir, price, note = "") {
      state.alarms.push({ id: uid(), key: normalizeKey(key), dir, price: Number(price), note, active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null });
      saveState(); renderAll(); checkAll(true);
    },
    list: () => [...state.alarms],
    history: () => [...history],
    clear() { state.alarms = []; saveState(); renderAll(); },
    check: checkAll
  };
})();
