// ===============================
// V31 CRYPTO TV CHART
// Eski canvas grafiğini devre dışı bırakır, Lightweight Charts ile gerçek mum grafiği kurar.
// ===============================

(function () {
  const DEFAULT_TF = "1h";
  const ORANGE = "#f97316";
  let chart = null;
  let candleSeries = null;
  let priceLines = [];
  let resizeObserver = null;
  let busy = false;

  const TF_MAP = {
    binance: DEFAULT_TF,
    okx: "1H",
    limit: 1000,
    label: "1 saat"
  };

  function qs(sel) {
    return document.querySelector(sel);
  }

  function isCryptoVisible() {
    const block = qs("#omega-crypto-block");
    return location.hash === "#crypto" || (block && getComputedStyle(block).display !== "none");
  }

  function ensureContainer() {
    const wrap = qs(".crypto-v12-chart-wrap");
    if (!wrap) return null;

    let box = qs("#crypto-tv-chart");
    if (!box) {
      box = document.createElement("div");
      box.id = "crypto-tv-chart";
      wrap.appendChild(box);
    }

    const canvas = qs("#crypto-v10-chart");
    if (canvas) canvas.style.display = "none";

    const hint = qs("#crypto-v12-hint");
    if (hint) hint.style.display = "none";

    return box;
  }

  function getPlan() {
    if (typeof window.omega_V10GetPlan === "function") {
      try {
        return window.omega_V10GetPlan();
      } catch (e) {}
    }

    const symbol = (qs("#v10-symbol")?.value || "BTC").trim().toUpperCase();
    const quote = qs("#v10-quote")?.value || "USDT";
    const exchange = (qs("#v10-exchange")?.value || "binance").toLowerCase();
    return { symbol, quote, exchange, entry: 0, stop: 0, liq: 0, tps: [] };
  }

  function inst(plan) {
    const symbol = String(plan.symbol || "BTC").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const quote = String(plan.quote || "USDT").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    return plan.exchange === "okx" ? `${symbol}-${quote}` : `${symbol}${quote}`;
  }

  async function fetchCandles(plan) {
    if ((plan.exchange || "binance").toLowerCase() === "okx") {
      const url = `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(inst(plan))}&bar=${TF_MAP.okx}&limit=300`;
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

    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(inst(plan))}&interval=${TF_MAP.binance}&limit=${TF_MAP.limit}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Binance mum verisi alınamadı");
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

    if (c.addCandlestickSeries) {
      return c.addCandlestickSeries(options);
    }

    throw new Error("Lightweight Charts candlestick API bulunamadı");
  }

  function ensureChart() {
    const box = ensureContainer();
    if (!box) return null;

    if (!window.LightweightCharts) {
      box.innerHTML = '<div style="padding:30px;color:#f97316;font-weight:900">Grafik kütüphanesi yüklenemedi.</div>';
      return null;
    }

    if (chart && candleSeries) return { chart, candleSeries };

    box.innerHTML = "";
    chart = window.LightweightCharts.createChart(box, {
      width: box.clientWidth || 1200,
      height: box.clientHeight || 520,
      layout: {
        background: { color: "#050505" },
        textColor: "#b8b8b8"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.06)" }
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#272727",
        scaleMargins: { top: 0.08, bottom: 0.12 }
      },
      timeScale: {
        borderColor: "#272727",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
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
    priceLines.forEach(line => {
      try { candleSeries.removePriceLine(line); } catch (e) {}
    });
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

    const tps = Array.isArray(plan.tps) ? plan.tps : [];
    tps.forEach((tp, i) => addLine(tp.price, "#10b981", "TP" + (i + 1)));
  }

  function updateHeader(plan, rows) {
    const last = rows[rows.length - 1];
    const first = rows[0];
    const title = qs("#crypto-v10-title");
    const sub = qs("#crypto-v10-subtitle");
    const price = qs("#crypto-v10-price");
    const change = qs("#crypto-v10-change");
    const cap = qs("#crypto-v10-caption");
    const status = qs("#crypto-v10-status");

    if (title) title.textContent = inst(plan).replace("-", "");
    if (sub) sub.textContent = `${String(plan.exchange || "binance").toUpperCase()} · gerçek mum grafik · ${TF_MAP.label}`;
    if (price) price.textContent = priceFormat(last.close);

    if (change && first?.close) {
      const pct = ((last.close - first.close) / first.close) * 100;
      change.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
      change.className = pct >= 0 ? "up" : "down";
    }

    if (cap) cap.textContent = `TradingView Lightweight Charts · mouse wheel zoom · sağ fiyat ekseni ölçekleme · çift tıkla sıfırla`;
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

      window._V10_CANDLES = rows.map(r => ({
        time: r.time * 1000,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close
      }));
      window._V10_PRICE = rows[rows.length - 1].close;
    } catch (e) {
      const cap = qs("#crypto-v10-caption");
      if (cap) cap.textContent = e.message || "Grafik verisi alınamadı.";
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

  document.addEventListener("DOMContentLoaded", () => setTimeout(() => refresh(true), 1200));
  window.addEventListener("hashchange", () => {
    if (location.hash === "#crypto") setTimeout(() => refresh(true), 450);
  });

  document.addEventListener("change", (e) => {
    if (!isCryptoVisible()) return;
    if (e.target && ["v10-symbol", "v10-quote", "v10-exchange"].includes(e.target.id)) {
      setTimeout(() => refresh(true), 100);
    }
  });
})();
