// ===============================
// V34 CRYPTO TV CHART HOTFIX
// Grafik canvas görünürlüğü, hızlı kontrol yükleme ve Binance/OKX mum grafiği.
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
  let activeTf = localStorage.getItem("v34_crypto_tf") || localStorage.getItem("v32_crypto_tf") || "5m";
  let chart = null;
  let candleSeries = null;
  let priceLines = [];
  let resizeObserver = null;
  let busy = false;

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
    const sym = normalizeSymbol(qs("#v32-symbol-input")?.value || "BTC");
    const ex = (qs("#v32-exchange-select")?.value || "binance").toLowerCase();
    const quote = qs("#v32-quote-select")?.value || "USDT";

    if (qs("#v10-symbol")) qs("#v10-symbol").value = sym;
    if (qs("#v10-exchange")) qs("#v10-exchange").value = ex;
    if (qs("#v10-quote")) qs("#v10-quote").value = quote;
  }

  function buildControls() {
    ensureDatalist();

    let host = qs("#v32-chart-controls");
    if (host) return host;

    const mini = qs(".crypto-v28-mini-panel");
    const chartHead = qs(".crypto-v10-chart-head") || qs(".terminal-v10-chart-head") || qs(".crypto-v12-chart-wrap")?.parentElement;
    if (!mini && !chartHead) return null;

    const symbol = normalizeSymbol(getNativeValue("v10-symbol", "BTC"));
    const exchange = (getNativeValue("v10-exchange", "binance") || "binance").toLowerCase();
    const quote = getNativeValue("v10-quote", "USDT") || "USDT";

    const html = `
      <div class="v32-chart-controls" id="v32-chart-controls">
        <div class="v32-field">
          <label>Coin Ara / Seç</label>
          <input id="v32-symbol-input" list="crypto-symbol-list" value="${symbol}" placeholder="BTC, ETH, SOL...">
        </div>
        <div class="v32-field">
          <label>Borsa</label>
          <select id="v32-exchange-select">
            <option value="binance">Binance</option>
            <option value="okx">OKX</option>
          </select>
        </div>
        <div class="v32-field">
          <label>Parite</label>
          <select id="v32-quote-select">
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <div class="v32-field">
          <label>Zaman Aralığı</label>
          <div class="v32-tf-row">${Object.keys(TF_OPTIONS).map(tf => `<button type="button" class="v32-tf-btn ${tf === activeTf ? "active" : ""}" data-tf="${tf}">${TF_OPTIONS[tf].label}</button>`).join("")}</div>
        </div>
        <button type="button" class="v32-refresh-btn" id="v32-refresh-chart">GRAFİĞİ YENİLE</button>
      </div>
    `;

    if (mini) mini.outerHTML = html;
    else chartHead.insertAdjacentHTML("afterend", html);

    qs("#v32-exchange-select").value = exchange === "okx" ? "okx" : "binance";
    qs("#v32-quote-select").value = quote === "USDC" ? "USDC" : "USDT";

    qs("#v32-symbol-input")?.addEventListener("change", () => { syncNativeFromControls(); refresh(true); });
    qs("#v32-symbol-input")?.addEventListener("keydown", e => { if (e.key === "Enter") { syncNativeFromControls(); refresh(true); }});
    qs("#v32-exchange-select")?.addEventListener("change", () => { syncNativeFromControls(); refresh(true); });
    qs("#v32-quote-select")?.addEventListener("change", () => { syncNativeFromControls(); refresh(true); });
    qs("#v32-refresh-chart")?.addEventListener("click", () => { syncNativeFromControls(); refresh(true); });

    document.querySelectorAll(".v32-tf-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTf = btn.dataset.tf || "5m";
        localStorage.setItem("v34_crypto_tf", activeTf);
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
      symbol: normalizeSymbol(qs("#v32-symbol-input")?.value || getNativeValue("v10-symbol", plan.symbol || "BTC")),
      quote: qs("#v32-quote-select")?.value || getNativeValue("v10-quote", plan.quote || "USDT"),
      exchange: (qs("#v32-exchange-select")?.value || getNativeValue("v10-exchange", plan.exchange || "binance")).toLowerCase()
    };
  }

  function inst(plan) {
    const symbol = normalizeSymbol(plan.symbol);
    const quote = String(plan.quote || "USDT").replace(/[^A-Z0-9]/g, "").toUpperCase();
    return plan.exchange === "okx" ? `${symbol}-${quote}` : `${symbol}${quote}`;
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

    if (c.addSeries && window.LightweightCharts?.CandlestickSeries) {
      return c.addSeries(window.LightweightCharts.CandlestickSeries, options);
    }
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

    box.addEventListener("dblclick", () => {
      try { chart.timeScale().fitContent(); } catch (e) {}
    });

    return { chart, candleSeries };
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

  function renderLevels(plan, lastPrice) {
    clearPriceLines();
    addLine(lastPrice, "#3b82f6", "CANLI");
    addLine(plan.entry, "#fbbf24", "GİRİŞ");
    addLine(plan.stop, "#ef4444", "STOP");
    addLine(plan.liq, "#f97316", "LİQ");
    (Array.isArray(plan.tps) ? plan.tps : []).forEach((tp, i) => addLine(tp.price, "#10b981", "TP" + (i + 1)));
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

    if (cap) cap.textContent = "TradingView Lightweight Charts · mouse wheel zoom · sağ fiyat ekseni ölçekleme · çift tıkla sıfırla";
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
    if (isCryptoVisible()) {
      const plan = getPlan();
      const priceText = (qs("#crypto-v10-price")?.textContent || "").replace(/[^\d.-]/g, "");
      renderLevels(plan, Number(priceText));
    }
  };

  window.omega_TVRefreshCryptoChart = refresh;

  function boot() {
    if (!isCryptoVisible()) return;
    buildControls();
    ensureContainer();
    refresh(true);
  }

  // Script body sonunda yüklendiği için bekletmeden başlat.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("hashchange", () => { if (location.hash === "#crypto") setTimeout(boot, 80); });

  document.addEventListener("change", (e) => {
    if (!isCryptoVisible()) return;
    if (e.target && ["v10-symbol", "v10-quote", "v10-exchange"].includes(e.target.id)) {
      setTimeout(() => { buildControls(); refresh(true); }, 50);
    }
  });
})();
