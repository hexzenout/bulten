// ===============================
// V26 ALARM CENTER FINAL COMPACT
// Taşmayan kompakt alarm merkezi + geçmiş
// ===============================

(function () {
  const STORAGE_KEY = "v26_crypto_alarm_center_final_v1";
  const HISTORY_KEY = "v26_crypto_alarm_history_final_v1";
  const POLL_MS = 2500;

  let state = loadState();
  let history = loadHistory();
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

  function loadHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
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

  function currentSymbolKey() { return `${getSelectedExchange()}:${getSelectedCoin()}${getSelectedQuote()}`; }

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

  function removeOldCenters() {
    document.querySelectorAll("#v26-alarm-center").forEach(el => el.remove());
  }

  function findMountPoint() {
    return document.querySelector(".crypto-v10-control-panel") ||
      document.querySelector("#omega-crypto-block .crypto-v10-layout") ||
      document.querySelector("#omega-crypto-block") ||
      document.querySelector("#crypto-terminal") ||
      document.body;
  }

  function createUI() {
    removeOldCenters();

    const box = document.createElement("div");
    box.id = "v26-alarm-center";
    box.className = "v26-alarm-center";
    box.innerHTML = `
      <div class="v26-alarm-center-head">
        <div>
          <h3>Alarm Merkezi</h3>
          <span>Sesli fiyat alarmı ve geçmiş.</span>
        </div>
        <button class="v26-alarm-btn" id="v26-alarm-refresh">YENİLE</button>
      </div>

      <div class="v26-alarm-center-body">
        <div class="v26-alarm-tabs">
          <button class="v26-alarm-tab active" data-v26-alarm-tab="active">AKTİF</button>
          <button class="v26-alarm-tab" data-v26-alarm-tab="history">GEÇMİŞ</button>
        </div>

        <div id="v26-alarm-active-panel">
          <div class="v26-alarm-form">
            <div class="v26-alarm-field full">
              <label>Sembol</label>
              <input id="v26-alarm-symbol" placeholder="binance:BTCUSDT">
            </div>

            <div class="v26-alarm-field">
              <label>Yön</label>
              <select id="v26-alarm-dir">
                <option value="above">Üstüne çıkarsa</option>
                <option value="below">Altına düşerse</option>
              </select>
            </div>

            <div class="v26-alarm-field">
              <label>Fiyat</label>
              <input id="v26-alarm-price" type="number" step="0.00000001" placeholder="77000">
            </div>

            <div class="v26-alarm-field full">
              <label>Not</label>
              <input id="v26-alarm-note" placeholder="BTC long bölgesi">
            </div>
          </div>

          <div class="v26-alarm-actions" style="margin-top:8px;">
            <button class="v26-alarm-btn green" id="v26-alarm-fill-current">SEÇİLİ COİN</button>
            <button class="v26-alarm-btn" id="v26-alarm-use-price">CANLI FİYAT</button>
            <button class="v26-alarm-btn gold" id="v26-alarm-add">ALARM EKLE</button>
            <button class="v26-alarm-btn red" id="v26-alarm-clear-hit">TETİKLENENLERİ SİL</button>
          </div>

          <div class="v26-alarm-list" id="v26-alarm-list" style="margin-top:10px;"></div>
        </div>

        <div id="v26-alarm-history-panel" style="display:none;">
          <div class="v26-alarm-actions" style="margin-bottom:10px;">
            <button class="v26-alarm-btn red" id="v26-history-clear">GEÇMİŞİ TEMİZLE</button>
            <button class="v26-alarm-btn" id="v26-history-export">GEÇMİŞİ İNDİR</button>
          </div>
          <div class="v26-alarm-list" id="v26-alarm-history-list"></div>
        </div>
      </div>
    `;

    findMountPoint().appendChild(box);
    bindUI();
    fillCurrentSymbol();
    renderAll();
  }

  function bindUI() {
    document.querySelectorAll("[data-v26-alarm-tab]").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("[data-v26-alarm-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.v26AlarmTab;
        document.getElementById("v26-alarm-active-panel").style.display = tab === "active" ? "" : "none";
        document.getElementById("v26-alarm-history-panel").style.display = tab === "history" ? "" : "none";
      };
    });

    document.getElementById("v26-alarm-add")?.addEventListener("click", addAlarmFromForm);
    document.getElementById("v26-alarm-refresh")?.addEventListener("click", () => { fillCurrentSymbol(); checkAllAlarms(true); });
    document.getElementById("v26-alarm-fill-current")?.addEventListener("click", fillCurrentSymbol);
    document.getElementById("v26-alarm-use-price")?.addEventListener("click", fillCurrentPrice);
    document.getElementById("v26-alarm-clear-hit")?.addEventListener("click", () => {
      state.alarms = state.alarms.filter(a => !a.hit);
      saveState();
      renderAll();
    });
    document.getElementById("v26-history-clear")?.addEventListener("click", () => {
      if (!confirm("Alarm geçmişi temizlensin mi?")) return;
      history = [];
      saveHistory();
      renderHistory();
    });
    document.getElementById("v26-history-export")?.addEventListener("click", exportHistory);
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
    } catch { alert("Canlı fiyat alınamadı."); }
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

    state.alarms.push({ id: uid(), key, dir, price, note, active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null });
    saveState();
    renderAll();
    checkAllAlarms(true);
    const noteEl = document.getElementById("v26-alarm-note");
    if (noteEl) noteEl.value = "";
  }

  function renderAll() {
    renderList();
    renderHistory();
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
          <div class="v26-alarm-main">
            <b>${p.exchange.toUpperCase()} ${p.symbol} ${dirText} ${money(a.price)}</b>
            <span>${escapeHtml(a.note || "")}${a.note ? " · " : ""}Son fiyat: ${last}</span>
          </div>
          <div class="v26-alarm-row-actions">
            <div class="v26-alarm-status ${a.hit ? "hit" : ""}">${status}</div>
            <button class="v26-alarm-btn" data-toggle="${a.id}">${a.active ? "PASİF" : "AKTİF"}</button>
            <button class="v26-alarm-btn red" data-delete="${a.id}">SİL</button>
          </div>
        </div>`;
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
    const list = document.getElementById("v26-alarm-history-list");
    if (!list) return;

    if (!history.length) {
      list.innerHTML = `<div class="v26-alarm-empty">Henüz çalan alarm geçmişi yok.</div>`;
      return;
    }

    list.innerHTML = history.slice(0, 100).map(h => `
      <div class="v26-history-row">
        <b>${escapeHtml(h.symbol)} · ${money(h.price)}</b>
        <span>${escapeHtml(h.note || "")}</span>
        <span>${new Date(h.time).toLocaleString("tr-TR")} · ${escapeHtml(h.message || "")}</span>
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

          history.unshift({ id: uid(), symbol: `${p.exchange.toUpperCase()} ${p.symbol}`, target: a.price, price: data.price, note: a.note || "", message: msg, time: Date.now() });
          saveHistory();

          window.dispatchEvent(new CustomEvent("v26-alarm-fired", { detail: { message: msg, alarm: a, price: data.price } }));
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
    a.download = "v26-alarm-gecmisi.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function shouldBoot() {
    return location.hash === "#crypto" || document.querySelector("#omega-crypto-block, #crypto-terminal, .crypto-v10-layout");
  }

  function boot() {
    if (!shouldBoot()) return;
    if (!initialized) {
      initialized = true;
      createUI();
      clearInterval(timer);
      timer = setInterval(checkAllAlarms, POLL_MS);
      setTimeout(() => checkAllAlarms(true), 800);
    }
  }

  window.addEventListener("hashchange", () => {
    if (location.hash !== "#crypto") {
      removeOldCenters();
      initialized = false;
      return;
    }
    setTimeout(boot, 600);
  });

  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 900));

  window.V26AlarmCenter = {
    add(key, dir, price, note = "") {
      state.alarms.push({ id: uid(), key: normalizeAlarmSymbol(key), dir, price: Number(price), note, active: true, hit: false, createdAt: Date.now(), hitAt: null, lastPrice: null });
      saveState();
      renderAll();
      checkAllAlarms(true);
    },
    list() { return [...state.alarms]; },
    history() { return [...history]; },
    clear() { state.alarms = []; saveState(); renderAll(); },
    check: checkAllAlarms
  };
})();
