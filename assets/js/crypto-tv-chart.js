// ===============================
// V36 CRYPTO TV CHART
// Hızlı yükleme, USDT-only güvenli mod, sağ tık alarm/çizgi menüsü ve grafiğe uygula.
// ===============================

(function () {
  const TF_OPTIONS = {
    "1m":  { label: "1m",  binance: "1m",  okx: "1m",  limit: 700 },
    "5m":  { label: "5m",  binance: "5m",  okx: "5m",  limit: 700 },
    "15m": { label: "15m", binance: "15m", okx: "15m", limit: 700 },
    "1h":  { label: "1h",  binance: "1h",  okx: "1H",  limit: 700 },
    "4h":  { label: "4h",  binance: "4h",  okx: "4H",  limit: 500 },
    "1d":  { label: "1d",  binance: "1d",  okx: "1D",  limit: 365 }
  };

  const POPULAR = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","TON","TRX","DOT","MATIC","NEAR","ATOM","APT","ARB","OP","INJ","SUI","PEPE","WIF","FET","RNDR","LTC","BCH","ETC","UNI","AAVE","FIL"];
  let activeTf = localStorage.getItem("v36_crypto_tf") || localStorage.getItem("v34_crypto_tf") || localStorage.getItem("v32_crypto_tf") || "5m";
  let chart = null;
  let candleSeries = null;
  let priceLines = [];
  let resizeObserver = null;
  let busy = false;
  let lastRightClickPrice = null;

  function qs(sel) { return document.querySelector(sel); }

  function isCryptoVisible() {
    const block = qs("#omega-crypto-block");
    return location.hash === "#crypto" || (block && getComputedStyle(block).display !== "none");
  }

  function normalizeSymbol(v) {
    return String(v || "BTC").trim().toUpperCase().replace(/USDT$|USDC$/,"").replace(/[^A-Z0-9]/g, "") || "BTC";
  }

  function ensureDatalist() {
    let list = qs("#crypto-symbol-list");
    if (!list) {
      list = document.createElement("datalist");
      list.id = "crypto-symbol-list";
      document.body.appendChild(list);
    }
    list.innerHTML = POPULAR.map(s => `<option value="${s}">${s}USDT</option>`).join("");
  }

  function getNativeValue(id, fallback) {
    const el = qs("#" + id);
    return el ? el.value : fallback;
  }

  function syncNativeFromControls() {
    const sym = normalizeSymbol(qs("#v36-symbol-input")?.value || qs("#v32-symbol-input")?.value || "BTC");
    const ex = (qs("#v36-exchange-select")?.value || qs("#v32-exchange-select")?.value || "binance").toLowerCase();
    if (qs("#v10-symbol")) qs("#v10-symbol").value = sym;
    if (qs("#v10-exchange")) qs("#v10-exchange").value = ex;
    if (qs("#v10-quote")) qs("#v10-quote").value = "USDT";
  }

  function buildControls() {
    ensureDatalist();

    let host = qs("#v32-chart-controls") || qs("#v36-chart-controls");
    if (host) return host;

    const mini = qs(".crypto-v28-mini-panel");
    const chartHead = qs(".crypto-v10-chart-head") || qs(".crypto-v12-chart-wrap")?.parentElement;
    if (!mini && !chartHead) return null;

    const symbol = normalizeSymbol(getNativeValue("v10-symbol", "BTC"));
    const exchange = (localStorage.getItem("v36_default_exchange") || getNativeValue("v10-exchange", "binance") || "binance").toLowerCase();
    const savedTf = localStorage.getItem("v36_default_tf");
    if(savedTf && TF_OPTIONS[savedTf]) activeTf = savedTf;

    const html = `
      <div class="v32-chart-controls v36-chart-controls" id="v32-chart-controls">
        <div class="v32-field">
          <label>Coin Ara / Seç</label>
          <input id="v36-symbol-input" list="crypto-symbol-list" value="${symbol}" placeholder="BTC, ETH, SOL...">
        </div>
        <div class="v32-field">
          <label>Borsa</label>
          <select id="v36-exchange-select">
            <option value="binance">Binance</option>
            <option value="okx">OKX</option>
          </select>
        </div>
        <div class="v32-field v36-quote-locked">
          <label>Parite</label>
          <select id="v36-quote-select">
            <option value="USDT">USDT</option>
          </select>
        </div>
        <div class="v32-field">
          <label>Zaman Aralığı</label>
          <div class="v32-tf-row">${Object.keys(TF_OPTIONS).map(tf => `<button type="button" class="v32-tf-btn ${tf === activeTf ? "active" : ""}" data-tf="${tf}">${TF_OPTIONS[tf].label}</button>`).join("")}</div>
        </div>
        <button type="button" class="v32-refresh-btn" id="v36-refresh-chart">GRAFİĞİ YENİLE</button>
      </div>
    `;

    if (mini) mini.outerHTML = html;
    else chartHead.insertAdjacentHTML("afterend", html);

    qs("#v36-exchange-select").value = exchange === "okx" ? "okx" : "binance";
    if (qs("#v10-quote")) qs("#v10-quote").value = "USDT";

    qs("#v36-symbol-input")?.addEventListener("change", () => { syncNativeFromControls(); refresh(true); });
    qs("#v36-symbol-input")?.addEventListener("keydown", e => { if (e.key === "Enter") { syncNativeFromControls(); refresh(true); }});
    qs("#v36-exchange-select")?.addEventListener("change", () => { syncNativeFromControls(); refresh(true); });
    qs("#v36-refresh-chart")?.addEventListener("click", () => { syncNativeFromControls(); refresh(true); });

    document.querySelectorAll(".v32-tf-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTf = btn.dataset.tf || "5m";
        localStorage.setItem("v36_crypto_tf", activeTf);
        document.querySelectorAll(".v32-tf-btn").forEach(x => x.classList.toggle("active", x === btn));
        refresh(true);
      });
    });

    return qs("#v32-chart-controls");
  }

  function ensureContainer() {
    const wrap = qs(".crypto-v12-chart-wrap");
    if (!wrap) return null;
    const oldCanvas = qs("#crypto-v10-chart");
    if (oldCanvas) oldCanvas.style.display = "none";

    let box = qs("#crypto-tv-chart");
    if (!box) {
      box = document.createElement("div");
      box.id = "crypto-tv-chart";
      wrap.appendChild(box);
    }
    box.style.display = "block";
    box.style.visibility = "visible";
    box.style.height = "520px";
    return box;
  }

  function getPlan() {
    let plan = {};
    if (typeof window.omega_V10GetPlan === "function") {
      try { plan = window.omega_V10GetPlan() || {}; } catch (e) {}
    }
    return {
      ...plan,
      symbol: normalizeSymbol(qs("#v36-symbol-input")?.value || getNativeValue("v10-symbol", plan.symbol || "BTC")),
      quote: "USDT",
      exchange: (qs("#v36-exchange-select")?.value || getNativeValue("v10-exchange", plan.exchange || "binance")).toLowerCase()
    };
  }

  function inst(plan) {
    const symbol = normalizeSymbol(plan.symbol);
    return plan.exchange === "okx" ? `${symbol}-USDT` : `${symbol}USDT`;
  }

  async function fetchCandles(plan) {
    const tf = TF_OPTIONS[activeTf] || TF_OPTIONS["5m"];

    if (plan.exchange === "okx") {
      const url = `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(inst(plan))}&bar=${tf.okx}&limit=${Math.min(tf.limit, 300)}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("OKX mum verisi alınamadı");
      const j = await r.json();
      const rows = Array.isArray(j.data) ? j.data : [];
      return rows.reverse().map(k => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4])
      })).filter(x => Number.isFinite(x.close));
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(inst(plan))}&interval=${tf.binance}&limit=${tf.limit}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`${inst(plan)} Binance mum verisi alınamadı`);
    const rows = await r.json();
    return rows.map(k => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4])
    })).filter(x => Number.isFinite(x.close));
  }

  function createSeries(c) {
    const options = {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      priceLineVisible: true
    };
    if (c.addSeries && window.LightweightCharts?.CandlestickSeries) return c.addSeries(window.LightweightCharts.CandlestickSeries, options);
    if (c.addCandlestickSeries) return c.addCandlestickSeries(options);
    throw new Error("Lightweight Charts candlestick API bulunamadı");
  }

  function ensureChart() {
    const box = ensureContainer();
    if (!box) return null;
    if (!window.LightweightCharts) {
      box.innerHTML = '<div style="padding:32px;color:#f97316;font-weight:900">Grafik kütüphanesi yüklenemedi.</div>';
      return null;
    }
    if (chart && candleSeries) {
      setTimeout(() => chart.applyOptions({ width: box.clientWidth || 1200, height: box.clientHeight || 520 }), 0);
      return { chart, candleSeries };
    }

    box.innerHTML = "";
    chart = window.LightweightCharts.createChart(box, {
      width: box.clientWidth || 1200,
      height: box.clientHeight || 520,
      layout: { background: { color: "#050505" }, textColor: "#b8b8b8" },
      grid: { vertLines: { color: "rgba(255,255,255,.04)" }, horzLines: { color: "rgba(255,255,255,.06)" } },
      rightPriceScale: { borderColor: "#272727", scaleMargins: { top: 0.08, bottom: 0.12 } },
      timeScale: { borderColor: "#272727", timeVisible: true, secondsVisible: false, rightOffset: 8, barSpacing: 8 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
    });
    candleSeries = createSeries(chart);

    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (!chart || !box) return;
      chart.applyOptions({ width: box.clientWidth || 1200, height: box.clientHeight || 520 });
    });
    resizeObserver.observe(box);

    box.addEventListener("dblclick", () => { try { chart.timeScale().fitContent(); } catch (e) {} });
    box.addEventListener("contextmenu", e => {
      e.preventDefault();
      const price = estimatePriceFromMouse(e, box);
      lastRightClickPrice = price;
      showContextMenu(e.clientX, e.clientY, price);
    });
    document.addEventListener("click", hideContextMenu);
    return { chart, candleSeries };
  }

  function estimatePriceFromMouse(e, box) {
    if (!window._V10_CANDLES || !window._V10_CANDLES.length) return Number(window._V10_PRICE || 0);
    const rows = window._V10_CANDLES;
    const highs = rows.map(x=>Number(x.high)).filter(Number.isFinite);
    const lows = rows.map(x=>Number(x.low)).filter(Number.isFinite);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const rect = box.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return max - (y / rect.height) * (max - min);
  }

  function showContextMenu(x, y, price) {
    hideContextMenu();
    const menu = document.createElement("div");
    menu.id = "crypto-chart-context-menu";
    menu.className = "crypto-chart-context-menu";
    menu.innerHTML = `
      <b>${priceFormat(price)}</b>
      <button data-act="alarm">Bu fiyata alarm kur</button>
      <button data-act="entry">Giriş çizgisi yap</button>
      <button data-act="stop">Stop çizgisi yap</button>
      <button data-act="tp">TP çizgisi yap</button>
    `;
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "alarm") addLine(price, "#f97316", "ALARM");
      if (act === "entry") { if(qs("#v10-entry")) qs("#v10-entry").value = price.toFixed(8); addLine(price, "#fbbf24", "GİRİŞ"); }
      if (act === "stop") { if(qs("#v10-stop")) qs("#v10-stop").value = price.toFixed(8); addLine(price, "#ef4444", "STOP"); }
      if (act === "tp") addLine(price, "#10b981", "TP");
      hideContextMenu();
    });
    document.body.appendChild(menu);
  }

  function hideContextMenu() {
    const old = qs("#crypto-chart-context-menu");
    if (old) old.remove();
  }

  function priceFormat(v) {
    if (typeof window.omega_V10FormatPrice === "function") return window.omega_V10FormatPrice(v);
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: n >= 1 ? 2 : 8 });
  }

  function clearPriceLines() {
    if (!candleSeries) return;
    priceLines.forEach(line => { try { candleSeries.removePriceLine(line); } catch (e) {} });
    priceLines = [];
  }

  function addLine(price, color, title) {
    const p = Number(price);
    if (!candleSeries || !Number.isFinite(p) || p <= 0) return;
    try {
      priceLines.push(candleSeries.createPriceLine({
        price: p,
        color,
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title
      }));
    } catch (e) {}
  }

  window.omega_V36ClearChartLines = function () {
    clearPriceLines();
  };

  window.omega_V36AutoCalcPlan = function () {
    const entryEl = qs("#v10-entry");
    const levEl = qs("#v10-lev");
    const sideEl = qs("#v10-side");
    const liqEl = qs("#v10-liq");
    const x2El = qs("#v10-2x");
    const entry = Number(entryEl?.value || window._V10_PRICE || 0);
    const lev = Math.max(1, Number(levEl?.value || 1));
    const side = sideEl?.value || "long";
    if (!entry || !lev) return alert("Giriş fiyatı ve kaldıraç gerekli.");
    const diff = entry / lev;
    const approxLiq = side === "short" ? entry + diff : entry - diff;
    const x2 = side === "short" ? entry - diff : entry + diff;
    if (liqEl && !liqEl.value) liqEl.value = approxLiq.toFixed(8);
    if (x2El && !x2El.value) x2El.value = x2.toFixed(8);
    updateMetricsOnly();
  };

  window.omega_V36ApplyPlanToChart = function () {
    const plan = getPlan();
    const entry = Number(qs("#v10-entry")?.value || window._V10_PRICE || 0);
    const stop = Number(qs("#v10-stop")?.value || 0);
    const liq = Number(qs("#v10-liq")?.value || 0);
    const x2 = Number(qs("#v10-2x")?.value || 0);
    clearPriceLines();
    addLine(window._V10_PRICE, "#3b82f6", "CANLI");
    addLine(entry, "#fbbf24", "GİRİŞ");
    addLine(stop, "#ef4444", "STOP");
    addLine(liq, "#f97316", "LİQ");
    addLine(x2, "#10b981", "2X");
  };

  window.omega_V36SaveCryptoSettings = function () {
    const ex = qs("#v36-default-exchange")?.value || "binance";
    const tf = qs("#v36-default-tf")?.value || "5m";
    localStorage.setItem("v36_default_exchange", ex);
    localStorage.setItem("v36_default_tf", tf);
    localStorage.setItem("v36_crypto_tf", tf);
    if (qs("#v36-exchange-select")) qs("#v36-exchange-select").value = ex;
    activeTf = tf;
    refresh(true);
  };

  function updateMetricsOnly() {
    const stake = Number(qs("#v10-stake")?.value || 0);
    const entry = Number(qs("#v10-entry")?.value || window._V10_PRICE || 0);
    const stop = Number(qs("#v10-stop")?.value || 0);
    const x2 = Number(qs("#v10-2x")?.value || 0);
    const side = qs("#v10-side")?.value || "long";
    const stopLoss = stop && entry ? Math.abs((entry - stop) / entry) * stake * Number(qs("#v10-lev")?.value || 1) : 0;
    const x2Profit = x2 && entry ? stake : 0;
    if(qs("#v10-live-pnl")) qs("#v10-live-pnl").textContent = "$0.00";
    if(qs("#v10-stop-pnl")) qs("#v10-stop-pnl").textContent = stopLoss ? "-$" + stopLoss.toFixed(2) : "$0.00";
    if(qs("#v10-tp-total")) qs("#v10-tp-total").textContent = x2Profit ? "$" + x2Profit.toFixed(2) : "$0.00";
    if(qs("#v10-rr")) qs("#v10-rr").textContent = stopLoss ? (x2Profit / stopLoss).toFixed(2) : "-";
  }

  function renderLevels(plan, lastPrice) {
    // V36: işlem planı artık otomatik grafiğe basılmaz. Sadece canlı çizgi kalır.
    clearPriceLines();
    addLine(lastPrice, "#3b82f6", "CANLI");
  }

  function updateHeader(plan, rows) {
    const last = rows[rows.length - 1];
    const first = rows[0];
    const tf = TF_OPTIONS[activeTf] || TF_OPTIONS["5m"];

    const title = qs("#crypto-v10-title");
    const sub = qs("#crypto-v10-subtitle");
    const price = qs("#crypto-v10-price");
    const change = qs("#crypto-v10-change");
    const cap = qs("#crypto-v10-caption");
    const status = qs("#crypto-v10-status");

    if (title) title.textContent = inst(plan).replace("-", "");
    if (sub) sub.textContent = `${String(plan.exchange || "binance").toUpperCase()} · ${tf.label} · ${rows.length} mum`;
    if (price) price.textContent = priceFormat(last.close);

    if (change && first?.close) {
      const pct = ((last.close - first.close) / first.close) * 100;
      change.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
      change.className = pct >= 0 ? "up" : "down";
    }

    if (cap) cap.textContent = "";
    if (status) {
      status.textContent = "CANLI";
      status.className = "terminal-v10-live-dot ok";
    }
  }

  async function refresh(force = false) {
    if (!isCryptoVisible() || busy) return;
    const status = qs("#crypto-v10-status");

    try {
      busy = true;
      buildControls();
      if (status) {
        status.textContent = "YÜKLENİYOR";
        status.className = "terminal-v10-live-dot";
      }

      const plan = getPlan();
      const rows = await fetchCandles(plan);
      if (!rows.length) throw new Error("Mum verisi boş döndü");

      const ready = ensureChart();
      if (!ready) return;

      ready.candleSeries.setData(rows);
      renderLevels(plan, rows[rows.length - 1].close);
      updateHeader(plan, rows);

      try { ready.chart.timeScale().fitContent(); } catch (e) {}

      window._V10_CANDLES = rows.map(r => ({ time: r.time * 1000, open: r.open, high: r.high, low: r.low, close: r.close }));
      window._V10_PRICE = rows[rows.length - 1].close;
      updateMetricsOnly();
    } catch (e) {
      const cap = qs("#crypto-v10-caption");
      const box = ensureContainer();
      if (cap) cap.textContent = e.message || "Grafik verisi alınamadı.";
      if (box && !candleSeries) box.innerHTML = `<div style="padding:32px;color:#f97316;font-weight:900">${e.message || "Grafik verisi alınamadı."}</div>`;
      if (status) {
        status.textContent = "VERİ HATASI";
        status.className = "terminal-v10-live-dot err";
      }
    } finally {
      busy = false;
    }
  }

  const oldRefresh = window.omega_V10RefreshCrypto;
  window.omega_V10RefreshCrypto = function (force = false) {
    if (isCryptoVisible()) return refresh(force);
    if (typeof oldRefresh === "function") return oldRefresh(force);
  };

  window.omega_V10DrawChart = function () {
    if (isCryptoVisible()) updateMetricsOnly();
  };

  window.omega_TVRefreshCryptoChart = refresh;

  function boot() {
    if (!isCryptoVisible()) return;
    buildControls();
    ensureContainer();
    if(qs("#v36-default-exchange")) qs("#v36-default-exchange").value = localStorage.getItem("v36_default_exchange") || "binance";
    if(qs("#v36-default-tf")) qs("#v36-default-tf").value = localStorage.getItem("v36_default_tf") || activeTf;
    refresh(true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.addEventListener("hashchange", () => { if (location.hash === "#crypto") setTimeout(boot, 80); });

  document.addEventListener("change", (e) => {
    if (!isCryptoVisible()) return;
    if (e.target && ["v10-symbol", "v10-quote", "v10-exchange"].includes(e.target.id)) {
      setTimeout(() => { buildControls(); refresh(true); }, 50);
    }
  });

  document.addEventListener("input", (e) => {
    if (!isCryptoVisible()) return;
    if (e.target && ["v10-stake","v10-lev","v10-entry","v10-stop","v10-liq","v10-2x"].includes(e.target.id)) {
      updateMetricsOnly();
    }
  });
})();
