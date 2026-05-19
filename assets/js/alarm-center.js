// ===============================
// V26 ALARM CENTER
// Kripto alarm listesi + fiyat kontrolü + ses tetikleme
// ===============================
(function () {
  const STORAGE_KEY = "v26_crypto_alarm_center_v1";
  const POLL_MS = 2500;
  let state = loadState();
  let timer = null;
  let initialized = false;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { alarms: Array.isArray(raw.alarms) ? raw.alarms : [] };
    } catch {
      return { alarms: [] };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function money(v) {
    const n = Number(v || 0);
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function normalizeCoin(v) {
    return String(v || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
  }

  function normalizeQuote(v) {
    const q = String(v || "USDT").trim().toUpperCase();
    return q === "USDC" ? "USDC" : "USDT";
  }

  function getSelectedExchange() {
    const el = document.querySelector("#v10-exchange, #crypto-exchange, select[id*='exchange'], select[name*='exchange']");
    const val = (el?.value || "").toLowerCase();
    return val.includes("okx") ? "okx" : "binance";
  }

  function getSelectedQuote() {
    const el = document.querySelector("#v10-quote, #crypto-quote, select[id*='quote'], select[name*='quote'], select[id*='parite']");
    return normalizeQuote(el?.value || "USDT");
  }

  function getSelectedCoin() {
    const el = document.querySelector("#v10-symbol, #crypto-symbol, #v10-coin, #crypto-coin, input[id*='coin'], select[id*='coin']");
    return normalizeCoin(el?.value || "BTC");
  }

  function currentSymbolKey() {
    return `${getSelectedExchange()}:${getSelectedCoin()}${getSelectedQuote()}`;
  }

  function parseKey(key) {
    const [exchangeRaw, symbolRaw] = String(key || "binance:BTCUSDT").split(":");
    const exchange = exchangeRaw === "okx" ? "okx" : "binance";
    const symbol = String(symbolRaw || "BTCUSDT").toUpperCase();
    const quote = symbol.endsWith("USDC") ? "USDC" : "USDT";
    const coin = symbol.replace(quote, "") || "BTC";
    return { exchange, coin, quote, symbol: `${coin}${quote}` };
  }

  function normalizeAlarmSymbol(input) {
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
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Binance fiyat alınamadı");
    const j = await r.json();
    return { price: Number(j.lastPrice), changePct: Number(j.priceChangePercent || 0) };
  }

  async function fetchOkx(symbol) {
    const instId = symbol.replace("USDT", "-USDT").replace("USDC", "-USDC");
    const url = `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("OKX fiyat alınamadı");
    const j = await r.json();
    const d = j?.data?.[0];
    const last = Number(d?.last || 0);
    const open24h = Number(d?.open24h || 0);
    return { price: last, changePct: open24h ? ((last - open24h) / open24h) * 100 : 0 };
  }

  async function fetchPriceByKey(key) {
    const p = parseKey(key);
    return p.exchange === "okx" ? fetchOkx(p.symbol) : fetchBinance(p.symbol);
  }

  function injectStyles() {
    if (document.getElementById("v26-alarm-center-style")) return;
    const style = document.createElement("style");
    style.id = "v26-alarm-center-style";
    style.textContent = `
      .v26-alarm-center{margin-top:14px;background:#080808;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden}
      .v26-alarm-center-head{padding:14px 15px;border-bottom:1px solid #242424;background:#111;display:flex;justify-content:space-between;align-items:center;gap:12px}
      .v26-alarm-center-head h3{margin:0;color:#fff;font-size:.86em;letter-spacing:.6px;font-weight:950;text-transform:uppercase}
      .v26-alarm-center-head span{color:#888;font-size:.68em;font-weight:800}
      .v26-alarm-center-body{padding:13px;display:grid;gap:10px}
      .v26-alarm-form{display:grid;grid-template-columns:1fr .8fr .8fr 1fr auto;gap:8px;align-items:end}
      .v26-alarm-field{display:grid;gap:5px}
      .v26-alarm-field label{color:#aaa;font-size:.58em;font-weight:950;text-transform:uppercase;letter-spacing:.7px}
      .v26-alarm-field input,.v26-alarm-field select{background:#070707;border:1px solid #333;color:#fff;border-radius:10px;padding:10px 9px;font-family:'JetBrains Mono',monospace;font-size:.78em;width:100%}
      .v26-alarm-btn{border:1px solid #333;background:#171717;color:#eee;border-radius:10px;padding:10px 12px;font-size:.72em;font-weight:950;cursor:pointer;min-height:39px}
      .v26-alarm-btn.gold{background:#fbbf24;color:#171000;border-color:#fbbf24}
      .v26-alarm-btn.red{background:rgba(239,68,68,.14);color:#ff9a9a;border-color:rgba(239,68,68,.35)}
      .v26-alarm-btn.green{background:rgba(16,185,129,.14);color:#10b981;border-color:rgba(16,185,129,.35)}
      .v26-alarm-list{display:grid;gap:7px;max-height:260px;overflow:auto}
      .v26-alarm-row{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;background:#101010;border:1px solid #252525;border-radius:12px;padding:10px}
      .v26-alarm-row.hit{border-color:rgba(16,185,129,.55);background:rgba(16,185,129,.06)}
      .v26-alarm-main b{display:block;color:#fbbf24;font-family:'JetBrains Mono',monospace;font-size:.86em;margin-bottom:3px}
      .v26-alarm-main span{display:block;color:#aaa;font-size:.68em;font-weight:800;line-height:1.35}
      .v26-alarm-price{font-family:'JetBrains Mono',monospace;color:#fff;font-size:.82em;font-weight:950}
      .v26-alarm-status{border:1px solid #333;background:#171717;color:#aaa;border-radius:999px;padding:6px 8px;font-size:.62em;font-weight:950;text-transform:uppercase}
      .v26-alarm-status.hit{color:#00170d;background:#10b981;border-color:#10b981}
      .v26-alarm-empty{border:1px dashed #333;border-radius:12px;padding:18px;color:#777;font-size:.78em;font-weight:800;text-align:center}
      @media(max-width:900px){.v26-alarm-form,.v26-alarm-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function findMountPoint() {
    return document.querySelector(".crypto-v10-control-panel") ||
      document.querySelector(".crypto-v12-alarm-box") ||
      document.querySelector("#omega-crypto-block .crypto-v10-layout") ||
      document.querySelector("#omega-crypto-block") ||
      document.querySelector("#crypto-terminal") ||
      document.body;
  }

  function createUI() {
    injectStyles();
    if (document.getElementById("v26-alarm-center")) return;

    const mount = findMountPoint();
    const box = document.createElement("div");
    box.id = "v26-alarm-center";
    box.className = "v26-alarm-center";
    box.innerHTML = `
      <div class="v26-alarm-center-head">
        <div><h3>Fiyat Alarm Merkezi</h3><span>Sınırsız alarm. Fiyat seviyeye gelince ses sistemi tetiklenir.</span></div>
        <button class="v26-alarm-btn" id="v26-alarm-refresh">YENİLE</button>
      </div>
      <div class="v26-alarm-center-body">
        <div class="v26-alarm-form">
          <div class="v26-alarm-field"><label>Sembol</label><input id="v26-alarm-symbol" placeholder="binance:BTCUSDT"></div>
          <div class="v26-alarm-field"><label>Yön</label><select id="v26-alarm-dir"><option value="above">Üstüne çıkarsa</option><option value="below">Altına düşerse</option></select></div>
          <div class="v26-alarm-field"><label>Fiyat</label><input id="v26-alarm-price" type="number" step="0.00000001" placeholder="77000"></div>
          <div class="v26-alarm-field"><label>Not</label><input id="v26-alarm-note" placeholder="BTC long bölgesi"></div>
          <button class="v26-alarm-btn gold" id="v26-alarm-add">ALARM EKLE</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="v26-alarm-btn green" id="v26-alarm-fill-current">SEÇİLİ COINİ YAZ</button>
          <button class="v26-alarm-btn" id="v26-alarm-use-price">CANLI FİYATI YAZ</button>
          <button class="v26-alarm-btn red" id="v26-alarm-clear-hit">TETİKLENENLERİ TEMİZLE</button>
        </div>
        <div class="v26-alarm-list" id="v26-alarm-list"></div>
      </div>`;
    mount.appendChild(box);
    bindUI();
    fillCurrentSymbol();
    renderList();
  }

  function bindUI() {
    document.getElementById("v26-alarm-add")?.addEventListener("click", addAlarmFromForm);
    document.getElementById("v26-alarm-refresh")?.addEventListener("click", () => { fillCurrentSymbol(); checkAllAlarms(true); });
    document.getElementById("v26-alarm-fill-current")?.addEventListener("click", fillCurrentSymbol);
    document.getElementById("v26-alarm-use-price")?.addEventListener("click", fillCurrentPrice);
    document.getElementById("v26-alarm-clear-hit")?.addEventListener("click", () => {
      state.alarms = state.alarms.filter(a => !a.hit);
      saveState();
      renderList();
    });
  }

  function fillCurrentSymbol() {
    const p = parseKey(currentSymbolKey());
    const el = document.getElementById("v26-alarm-symbol");
    if (el) el.value = `${p.exchange}:${p.symbol}`;
  }

  async function fillCurrentPrice() {
    const sym = document.getElementById("v26-alarm-symbol")?.value || currentSymbolKey();
    const priceEl = document.getElementById("v26-alarm-price");
    try {
      const data = await fetchPriceByKey(normalizeAlarmSymbol(sym));
      if (priceEl && data.price) priceEl.value = data.price;
    } catch {
      alert("Canlı fiyat alınamadı.");
    }
  }

  function addAlarmFromForm() {
    const key = normalizeAlarmSymbol(document.getElementById("v26-alarm-symbol")?.value || currentSymbolKey());
    const dir = document.getElementById("v26-alarm-dir")?.value || "above";
    const price = Number(document.getElementById("v26-alarm-price")?.value || 0);
    const note = document.getElementById("v26-alarm-note")?.value || "";

    if (!price || price <= 0) {
      alert("Geçerli alarm fiyatı gir.");
      return;
    }

    state.alarms.push({
      id: uid(), key, dir, price, note,
      active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null
    });
    saveState();
    renderList();
    checkAllAlarms(true);
    const noteEl = document.getElementById("v26-alarm-note");
    if (noteEl) noteEl.value = "";
  }

  function renderList() {
    const list = document.getElementById("v26-alarm-list");
    if (!list) return;

    if (!state.alarms.length) {
      list.innerHTML = `<div class="v26-alarm-empty">Henüz alarm yok. Sembol + yön + fiyat girip alarm ekle.</div>`;
      return;
    }

    list.innerHTML = state.alarms.map(a => {
      const p = parseKey(a.key);
      const dirText = a.dir === "above" ? "üstüne çıkarsa" : "altına düşerse";
      const last = a.lastPrice ? money(a.lastPrice) : "-";
      const status = a.hit ? "Tetiklendi" : a.active ? "Aktif" : "Pasif";
      return `
        <div class="v26-alarm-row ${a.hit ? "hit" : ""}">
          <div class="v26-alarm-main"><b>${p.exchange.toUpperCase()} ${p.symbol} ${dirText} ${money(a.price)}</b><span>${escapeHtml(a.note || "")}${a.note ? " · " : ""}Son fiyat: ${last}</span></div>
          <div class="v26-alarm-price">${money(a.price)}</div>
          <div class="v26-alarm-status ${a.hit ? "hit" : ""}">${status}</div>
          <div style="display:flex;gap:6px;"><button class="v26-alarm-btn" data-toggle="${a.id}">${a.active ? "PASİF" : "AKTİF"}</button><button class="v26-alarm-btn red" data-delete="${a.id}">SİL</button></div>
        </div>`;
    }).join("");

    list.querySelectorAll("[data-toggle]").forEach(btn => btn.onclick = () => {
      const a = state.alarms.find(x => x.id === btn.dataset.toggle);
      if (!a) return;
      a.active = !a.active;
      if (a.active) a.hit = false;
      saveState();
      renderList();
    });

    list.querySelectorAll("[data-delete]").forEach(btn => btn.onclick = () => {
      state.alarms = state.alarms.filter(a => a.id !== btn.dataset.delete);
      saveState();
      renderList();
    });
  }

  async function checkAllAlarms(force = false) {
    const keys = [...new Set(state.alarms.filter(a => a.active && !a.hit).map(a => a.key))];

    for (const key of keys) {
      try {
        const data = await fetchPriceByKey(key);

        state.alarms.forEach(a => {
          if (a.key !== key) return;
          a.lastPrice = data.price;

          if (!a.active || a.hit) return;

          const hit = a.dir === "above" ? data.price >= Number(a.price) : data.price <= Number(a.price);
          if (!hit) return;

          a.hit = true;
          a.active = false;
          a.hitAt = Date.now();

          const p = parseKey(a.key);
          const msg = `${p.symbol} alarmı tetiklendi: ${money(data.price)}`;

          window.dispatchEvent(new CustomEvent("v26-alarm-fired", { detail: { message: msg, alarm: a, price: data.price } }));
          if (window.V26AlarmAudio?.play) window.V26AlarmAudio.play(msg);
        });
      } catch (err) {
        if (force) console.warn("Alarm fiyat kontrol hatası:", key, err);
      }
    }

    saveState();
    renderList();
  }

  function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function shouldBoot() {
    return location.hash === "#crypto" || document.querySelector("#omega-crypto-block, #crypto-terminal, .crypto-v10-layout");
  }

  function boot() {
    if (initialized) return;
    initialized = true;
    createUI();
    clearInterval(timer);
    timer = setInterval(checkAllAlarms, POLL_MS);
    setTimeout(() => checkAllAlarms(true), 800);
  }

  window.addEventListener("hashchange", () => setTimeout(() => { if (shouldBoot()) boot(); }, 600));
  document.addEventListener("DOMContentLoaded", () => setTimeout(() => { if (shouldBoot()) boot(); }, 900));

  window.V26AlarmCenter = {
    add(key, dir, price, note = "") {
      state.alarms.push({ id: uid(), key: normalizeAlarmSymbol(key), dir, price: Number(price), note, active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null });
      saveState();
      renderList();
      checkAllAlarms(true);
    },
    list() { return [...state.alarms]; },
    clear() { state.alarms = []; saveState(); renderList(); },
    check: checkAllAlarms
  };
})();
