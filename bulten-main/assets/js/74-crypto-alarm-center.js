// ===============================
// V28 ALARM CENTER
// Kripto Pro Panel > Alarm sekmesi içinde çalışır.
// ===============================

(function () {
  const STORAGE_KEY = "v28_crypto_alarm_center";
  const HISTORY_KEY = "v28_crypto_alarm_history";
  const POLL_MS = 2500;

  let state = loadState();
  let history = loadHistory();
  let timer = null;

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
    const open24h = Number(d?.open24h || 0);
    return { price: last, changePct: open24h ? ((last - open24h) / open24h) * 100 : 0 };
  }

  async function fetchPriceByKey(key) {
    const p = parseKey(key);
    return p.exchange === "okx" ? fetchOkx(p.symbol) : fetchBinance(p.symbol);
  }

  function renderUI() {
    const mount = document.getElementById("v28-alarm-mount");
    if (!mount || mount.dataset.ready === "1") return;
    mount.dataset.ready = "1";

    mount.innerHTML = `
      <div class="v28-alarm-card">
        <div class="v28-card-title">
          <b>Alarm Merkezi</b>
          <span>Fiyat seviyeye gelince ses çalar ve geçmişe kaydeder.</span>
        </div>

        <div class="v28-tabs-mini">
          <button class="active" data-v28-alarm-tab="active">Aktif</button>
          <button data-v28-alarm-tab="history">Geçmiş</button>
        </div>

        <div id="v28-alarm-active">
          <div class="v28-form-grid">
            <label class="full">Sembol<input id="v28-alarm-symbol" placeholder="binance:BTCUSDT"></label>
            <label>Yön<select id="v28-alarm-dir"><option value="above">Üstüne çıkarsa</option><option value="below">Altına düşerse</option></select></label>
            <label>Fiyat<input id="v28-alarm-price" type="number" step="0.00000001" placeholder="77000"></label>
            <label class="full">Not<input id="v28-alarm-note" placeholder="BTC long bölgesi"></label>
          </div>

          <div class="v28-action-grid">
            <button class="terminal-v10-btn green" id="v28-alarm-fill-current">SEÇİLİ COİN</button>
            <button class="terminal-v10-btn" id="v28-alarm-use-price">CANLI FİYAT</button>
            <button class="terminal-v10-btn gold" id="v28-alarm-add">ALARM EKLE</button>
            <button class="terminal-v10-btn red" id="v28-alarm-clear-hit">TETİKLENENLERİ SİL</button>
          </div>

          <div class="v28-list" id="v28-alarm-list"></div>
        </div>

        <div id="v28-alarm-history" style="display:none;">
          <div class="v28-action-grid">
            <button class="terminal-v10-btn red" id="v28-history-clear">GEÇMİŞİ TEMİZLE</button>
            <button class="terminal-v10-btn" id="v28-history-export">GEÇMİŞİ İNDİR</button>
          </div>
          <div class="v28-list" id="v28-alarm-history-list"></div>
        </div>
      </div>
    `;

    bindUI();
    fillCurrentSymbol();
    renderAll();
  }

  function bindUI() {
    document.querySelectorAll("[data-v28-alarm-tab]").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("[data-v28-alarm-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.v28AlarmTab;
        document.getElementById("v28-alarm-active").style.display = tab === "active" ? "" : "none";
        document.getElementById("v28-alarm-history").style.display = tab === "history" ? "" : "none";
      };
    });

    document.getElementById("v28-alarm-add")?.addEventListener("click", addAlarmFromForm);
    document.getElementById("v28-alarm-fill-current")?.addEventListener("click", fillCurrentSymbol);
    document.getElementById("v28-alarm-use-price")?.addEventListener("click", fillCurrentPrice);
    document.getElementById("v28-alarm-clear-hit")?.addEventListener("click", () => {
      state.alarms = state.alarms.filter(a => !a.hit);
      saveState();
      renderAll();
    });
    document.getElementById("v28-history-clear")?.addEventListener("click", () => {
      if (!confirm("Alarm geçmişi temizlensin mi?")) return;
      history = [];
      saveHistory();
      renderHistory();
    });
    document.getElementById("v28-history-export")?.addEventListener("click", exportHistory);
  }

  function fillCurrentSymbol() {
    const p = parseKey(currentSymbolKey());
    const el = document.getElementById("v28-alarm-symbol");
    if (el) el.value = `${p.exchange}:${p.symbol}`;
  }

  async function fillCurrentPrice() {
    const sym = document.getElementById("v28-alarm-symbol")?.value || currentSymbolKey();
    const priceEl = document.getElementById("v28-alarm-price");

    try {
      const data = await fetchPriceByKey(normalizeAlarmSymbol(sym));
      if (priceEl && data.price) priceEl.value = data.price;
    } catch {
      alert("Canlı fiyat alınamadı.");
    }
  }

  function addAlarmFromForm() {
    const key = normalizeAlarmSymbol(document.getElementById("v28-alarm-symbol")?.value || currentSymbolKey());
    const dir = document.getElementById("v28-alarm-dir")?.value || "above";
    const price = Number(document.getElementById("v28-alarm-price")?.value || 0);
    const note = document.getElementById("v28-alarm-note")?.value || "";

    if (!price || price <= 0) {
      alert("Geçerli alarm fiyatı gir.");
      return;
    }

    state.alarms.push({
      id: uid(),
      key,
      dir,
      price,
      note,
      active: true,
      hit: false,
      createdAt: Date.now(),
      hitAt: null,
      lastPrice: null
    });

    saveState();
    renderAll();
    checkAllAlarms(true);

    const noteEl = document.getElementById("v28-alarm-note");
    if (noteEl) noteEl.value = "";
  }

  function renderAll() {
    renderList();
    renderHistory();
  }

  function renderList() {
    const list = document.getElementById("v28-alarm-list");
    if (!list) return;

    if (!state.alarms.length) {
      list.innerHTML = `<div class="v28-empty">Henüz alarm yok.</div>`;
      return;
    }

    list.innerHTML = state.alarms.map(a => {
      const p = parseKey(a.key);
      const dirText = a.dir === "above" ? "üstüne çıkarsa" : "altına düşerse";
      const last = a.lastPrice ? money(a.lastPrice) : "-";
      const status = a.hit ? "Tetiklendi" : a.active ? "Aktif" : "Pasif";

      return `
        <div class="v28-row ${a.hit ? "hit" : ""}">
          <div>
            <b>${p.exchange.toUpperCase()} ${p.symbol}</b>
            <span>${dirText} ${money(a.price)} · Son: ${last}</span>
            ${a.note ? `<small>${escapeHtml(a.note)}</small>` : ""}
          </div>
          <div class="v28-row-actions">
            <em>${status}</em>
            <button data-toggle="${a.id}">${a.active ? "Pasif" : "Aktif"}</button>
            <button data-delete="${a.id}">Sil</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-toggle]").forEach(btn => {
      btn.onclick = () => {
        const a = state.alarms.find(x => x.id === btn.dataset.toggle);
        if (!a) return;
        a.active = !a.active;
        if (a.active) a.hit = false;
        saveState();
        renderAll();
      };
    });

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.onclick = () => {
        state.alarms = state.alarms.filter(a => a.id !== btn.dataset.delete);
        saveState();
        renderAll();
      };
    });
  }

  function renderHistory() {
    const list = document.getElementById("v28-alarm-history-list");
    if (!list) return;

    if (!history.length) {
      list.innerHTML = `<div class="v28-empty">Henüz çalan alarm geçmişi yok.</div>`;
      return;
    }

    list.innerHTML = history.slice(0, 100).map(h => `
      <div class="v28-row hit">
        <div>
          <b>${escapeHtml(h.symbol)} · ${money(h.price)}</b>
          <span>${new Date(h.time).toLocaleString("tr-TR")}</span>
          ${h.note ? `<small>${escapeHtml(h.note)}</small>` : ""}
        </div>
      </div>
    `).join("");
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

          history.unshift({
            id: uid(),
            symbol: `${p.exchange.toUpperCase()} ${p.symbol}`,
            target: a.price,
            price: data.price,
            note: a.note || "",
            message: msg,
            time: Date.now()
          });

          saveHistory();

          window.dispatchEvent(new CustomEvent("v26-alarm-fired", {
            detail: { message: msg, alarm: a, price: data.price }
          }));

          if (window.V26AlarmAudio?.play) window.V26AlarmAudio.play(msg);
        });
      } catch (err) {
        if (force) console.warn("Alarm fiyat kontrol hatası:", key, err);
      }
    }

    saveState();
    renderAll();
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "v28-alarm-gecmisi.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boot() {
    renderUI();
    clearInterval(timer);
    timer = setInterval(checkAllAlarms, POLL_MS);
    setTimeout(() => checkAllAlarms(true), 800);
  }

  window.V26AlarmCenter = {
    add(key, dir, price, note = "") {
      state.alarms.push({
        id: uid(),
        key: normalizeAlarmSymbol(key),
        dir,
        price: Number(price),
        note,
        active: true,
        hit: false,
        createdAt: Date.now(),
        hitAt: null,
        lastPrice: null
      });
      saveState();
      renderAll();
      checkAllAlarms(true);
    },
    list() { return [...state.alarms]; },
    history() { return [...history]; },
    clear() { state.alarms = []; saveState(); renderAll(); },
    check: checkAllAlarms
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
