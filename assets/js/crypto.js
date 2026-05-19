// ===============================
// V26 CRYPTO TERMINAL - TRADINGVIEW LIGHTWEIGHT CHARTS ENGINE
// Bu dosya eski canvas grafiği devre dışı bırakır ve profesyonel Lightweight Charts grafiği kurar.
// ===============================

(function () {
  const LWC_URL = "https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js";
  const LS_PREFIX = "v26_lwc_";

  const TF = [
    { label: "1 dk", key: "1m", binance: "1m", okx: "1m", limit: 1000 },
    { label: "3 dk", key: "3m", binance: "3m", okx: "3m", limit: 1000 },
    { label: "5 dk", key: "5m", binance: "5m", okx: "5m", limit: 1000 },
    { label: "15 dk", key: "15m", binance: "15m", okx: "15m", limit: 1000 },
    { label: "30 dk", key: "30m", binance: "30m", okx: "30m", limit: 1000 },
    { label: "1 saat", key: "1h", binance: "1h", okx: "1H", limit: 1000 },
    { label: "2 saat", key: "2h", binance: "2h", okx: "2H", limit: 1000 },
    { label: "4 saat", key: "4h", binance: "4h", okx: "4H", limit: 1000 },
    { label: "8 saat", key: "8h", binance: "8h", okx: "6H", limit: 1000 },
    { label: "12 saat", key: "12h", binance: "12h", okx: "12H", limit: 1000 },
    { label: "1 gün", key: "1d", binance: "1d", okx: "1D", limit: 1000 },
    { label: "3 gün", key: "3d", binance: "3d", okx: "3D", limit: 800 },
    { label: "1 hafta", key: "1w", binance: "1w", okx: "1W", limit: 700 },
    { label: "1 ay", key: "1M", binance: "1M", okx: "1M", limit: 500 }
  ];

  const state = {
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    chartEl: null,
    candles: [],
    currentTf: localStorage.getItem(LS_PREFIX + "tf") || "1h",
    price: 0,
    tickerChange24h: 0,
    priceLines: [],
    extraSeries: [],
    tool: null,
    trendStart: null,
    selectedObject: null,
    refreshTimer: null,
    resizeObserver: null,
    drawings: loadJSON("drawings", []),
    alarms: loadJSON("alarms", [])
  };

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key) || ""); }
    catch (_) { return fallback; }
  }

  function saveJSON(key, value) {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  }

  function $(id) { return document.getElementById(id); }

  function cssEscape(v) {
    return String(v || "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  }

  function number(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function plan() {
    const exchange = ($("v10-exchange")?.value || "binance").toLowerCase();
    const quote = ($("v10-quote")?.value || "USDT").toUpperCase();
    const symbol = ($("v10-symbol")?.value || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    const side = ($("v10-side")?.value || "long").toLowerCase();
    const stake = number($("v10-stake")?.value, 0);
    const lev = Math.max(1, number($("v10-lev")?.value, 1));
    const entry = number($("v10-entry")?.value, 0) || state.price || 0;
    const liq = number($("v10-liq")?.value, 0);
    const stop = number($("v10-stop")?.value, 0);
    const tps = [...document.querySelectorAll(".tp-v10-row")].map((row, i) => ({
      idx: i + 1,
      price: number(row.querySelector(".tp-price")?.value, 0),
      pct: number(row.querySelector(".tp-pct")?.value, 0),
      out: row.querySelector(".tp-out")
    })).filter(t => t.price > 0);

    return { exchange, quote, symbol, pair: symbol + quote, side, stake, lev, entry, liq, stop, tps };
  }

  function symbolKey(p = plan()) {
    return `${p.exchange}:${p.pair}:${state.currentTf}`;
  }

  function fmtPrice(v) {
    const n = Number(v || 0);
    if (!n) return "$-";
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function fmtMoney(v) {
    return "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showToast(msg) {
    if (typeof window.omega_ShowFinanceToast === "function") return window.omega_ShowFinanceToast(msg);
    if (typeof window.omega_FinanceToast === "function") return window.omega_FinanceToast(msg);
    console.log(msg);
  }

  function loadLWC() {
    if (window.LightweightCharts) return Promise.resolve();
    if (window.__v26LwcLoading) return window.__v26LwcLoading;
    window.__v26LwcLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = LWC_URL;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.__v26LwcLoading;
  }

  function injectStyles() {
    if ($("v26-lwc-style")) return;
    const style = document.createElement("style");
    style.id = "v26-lwc-style";
    style.textContent = `
      .crypto-v10-chart-panel { overflow: visible !important; }
      .crypto-v10-chart-panel .crypto-v12-toolbar { display: none !important; }
      #crypto-v10-chart { display: none !important; }
      .v26-tv-chart-shell { width: 100%; height: 560px; position: relative; background: #030303; border: 1px solid #242424; border-radius: 16px; overflow: hidden; }
      .v26-tv-chart { width: 100%; height: 100%; }
      .v26-tv-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: #070707; border: 1px solid #252525; border-radius: 14px; padding: 10px; margin: 12px 0; }
      .v26-tv-btn { border: 1px solid #333; background: #151515; color: #d6d6d6; border-radius: 10px; padding: 9px 11px; font-size: .72em; font-weight: 950; cursor: pointer; font-family: 'JetBrains Mono', monospace; transition: .15s; }
      .v26-tv-btn:hover { border-color: #555; background: #202020; }
      .v26-tv-btn.active { background: var(--gold); border-color: var(--gold); color: #171000; }
      .v26-tv-btn.green { color: var(--green); border-color: rgba(16,185,129,.35); background: rgba(16,185,129,.10); }
      .v26-tv-btn.red { color: #ff9a9a; border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.10); }
      .v26-tv-hint { position: absolute; left: 14px; top: 14px; z-index: 5; display: none; background: rgba(0,0,0,.76); border: 1px solid #333; color: #ddd; border-radius: 10px; padding: 8px 10px; font-size: .72em; font-weight: 850; pointer-events: none; }
      .v26-tv-hint.show { display: block; }
      .v26-tv-trash { position: absolute; z-index: 8; right: 16px; top: 16px; display: none; align-items: center; gap: 8px; background: rgba(130,20,20,.96); color: #fff; border: 1px solid rgba(255,130,130,.45); border-radius: 12px; padding: 9px 12px; font-size: .76em; font-weight: 950; cursor: pointer; box-shadow: 0 16px 35px rgba(0,0,0,.45); }
      .v26-tv-trash.show { display: inline-flex; }
      .v26-tv-caption { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; border: 1px solid #252525; background: #0b0b0b; border-radius: 12px; padding: 10px 12px; margin-top: 10px; color: #aaa; font-size: .74em; font-weight: 800; }
      .crypto-v10-timeframes { gap: 6px !important; }
      .tf-v10 { padding: 8px 10px !important; }
      .tf-v10.active { background: var(--gold) !important; color: #171000 !important; border-color: var(--gold) !important; }
      .crypto-v10-price b { color: var(--gold) !important; font-size: 1.28em !important; }
      .crypto-v10-price span.up { color: var(--green) !important; }
      .crypto-v10-price span.down { color: var(--red) !important; }
      .crypto-v10-chart-caption { display: none !important; }
      .alarm-v13-help { display: none !important; }
      .crypto-v12-alarm-head span { color: #999 !important; }
      .v26-alarm-row { display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center; background:#101010; border:1px solid #252525; border-radius:11px; padding:9px; }
      .v26-alarm-row b { color: var(--gold); font-family:'JetBrains Mono', monospace; font-size:.84em; }
      .v26-alarm-row span { color:#aaa; font-size:.68em; font-weight:850; }
      .v26-alarm-row.hit { border-color: rgba(16,185,129,.45); background: rgba(16,185,129,.06); }
      .v26-alarm-row.hit b { color: var(--green); }
      .v26-alarm-row button { border:none; background:#2a1515; color:#ffb4b4; border-radius:8px; padding:8px 10px; font-weight:950; cursor:pointer; }
      .v26-alarm-row button:hover { background: var(--red); color:#fff; }
      @media(max-width: 760px) { .v26-tv-chart-shell { height: 430px; } .v26-tv-btn { flex: 1 1 130px; } }
    `;
    document.head.appendChild(style);
  }

  function createShell() {
    const wrap = document.querySelector(".crypto-v12-chart-wrap");
    const canvas = $("crypto-v10-chart");
    if (!wrap || !canvas) return null;

    let shell = $("v26-tv-chart-shell");
    if (shell) return shell;

    shell = document.createElement("div");
    shell.id = "v26-tv-chart-shell";
    shell.className = "v26-tv-chart-shell";
    shell.innerHTML = `
      <div id="v26-tv-chart" class="v26-tv-chart"></div>
      <div id="v26-tv-hint" class="v26-tv-hint"></div>
      <button id="v26-tv-trash" class="v26-tv-trash"><i class="fa-solid fa-trash"></i> Seçili çizimi sil</button>
    `;
    wrap.insertBefore(shell, canvas);
    canvas.style.display = "none";
    return shell;
  }

  function installToolbar() {
    const old = document.querySelector(".crypto-v12-toolbar");
    if (!old) return;
    let bar = $("v26-tv-toolbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "v26-tv-toolbar";
      bar.className = "v26-tv-toolbar";
      old.parentNode.insertBefore(bar, old);
    }
    bar.innerHTML = `
      <button class="v26-tv-btn" data-tool="fit"><i class="fa-solid fa-compress"></i> Grafiği Sığdır</button>
      <button class="v26-tv-btn green" data-tool="alarm"><i class="fa-solid fa-bell"></i> Grafikten Alarm</button>
      <button class="v26-tv-btn" data-tool="hline"><i class="fa-solid fa-grip-lines"></i> Fiyat Çizgisi</button>
      <button class="v26-tv-btn green" data-tool="trend-green"><i class="fa-solid fa-slash"></i> Yeşil Trend</button>
      <button class="v26-tv-btn red" data-tool="trend-red"><i class="fa-solid fa-slash"></i> Kırmızı Trend</button>
      <button class="v26-tv-btn red" data-tool="clear"><i class="fa-solid fa-trash-can"></i> Çizimleri Sil</button>
    `;

    bar.querySelectorAll("[data-tool]").forEach(btn => {
      btn.onclick = () => {
        const tool = btn.dataset.tool;
        if (tool === "fit") return fitChart();
        if (tool === "clear") return clearDrawingsForSymbol();
        setTool(tool);
      };
    });
  }

  function installTimeframes() {
    const box = $("crypto-v10-timeframes");
    if (!box) return;
    box.innerHTML = TF.map(t => `<button class="tf-v10 ${t.key === state.currentTf ? "active" : ""}" data-tf="${t.key}">${t.label}</button>`).join("");
    box.querySelectorAll("[data-tf]").forEach(btn => {
      btn.onclick = () => {
        state.currentTf = btn.dataset.tf;
        localStorage.setItem(LS_PREFIX + "tf", state.currentTf);
        installTimeframes();
        refresh(true);
      };
    });
  }

  function createChart() {
    const el = $("v26-tv-chart");
    if (!el || !window.LightweightCharts) return;

    if (state.chart) return;

    const { createChart, CandlestickSeries, HistogramSeries, LineSeries } = window.LightweightCharts;
    state._LineSeries = LineSeries;
    state.chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "#030303" },
        textColor: "#b6b6b6",
        attributionLogo: false,
        fontFamily: "Inter, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)" },
        horzLines: { color: "rgba(255,255,255,0.055)" }
      },
      rightPriceScale: {
        borderColor: "#2a2a2a",
        autoScale: true,
        scaleMargins: { top: 0.12, bottom: 0.16 },
        ticksVisible: true
      },
      timeScale: {
        borderColor: "#2a2a2a",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        shiftVisibleRangeOnNewBar: false,
        allowShiftVisibleRangeOnWhitespaceReplacement: true
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(255,255,255,.35)", width: 1, style: 2, labelBackgroundColor: "#222" },
        horzLine: { color: "rgba(255,255,255,.35)", width: 1, style: 2, labelBackgroundColor: "#222" }
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      localization: {
        priceFormatter: price => fmtPrice(price)
      }
    });

    state.candleSeries = state.chart.addSeries(CandlestickSeries, {
      upColor: "#00c879",
      downColor: "#f04444",
      borderUpColor: "#00e48a",
      borderDownColor: "#ff5555",
      wickUpColor: "#00e48a",
      wickDownColor: "#ff5555",
      priceLineVisible: true,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 8, minMove: 0.00000001 }
    });

    state.volumeSeries = state.chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false
    });

    state.chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });

    bindChartInteractions();
  }

  function bindChartInteractions() {
    const shell = $("v26-tv-chart-shell");
    const chartBox = $("v26-tv-chart");
    if (!shell || !chartBox || shell.dataset.bound === "1") return;
    shell.dataset.bound = "1";

    let dragging = false;

    chartBox.addEventListener("mousedown", ev => {
      if (!state.tool) return;
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = timeAt(pos.x);
      if (!p || !t) return;

      if (state.tool === "alarm") {
        addAlarmFromPrice(p);
        setTool(null);
        return;
      }
      if (state.tool === "hline") {
        addHLine(p);
        setTool(null);
        return;
      }
      if (state.tool === "trend-green" || state.tool === "trend-red") {
        dragging = true;
        state.trendStart = { time: t, price: p, color: state.tool === "trend-green" ? "green" : "red" };
        updateHint("Sürükle ve bırak: trendin ikinci ucunu seç.");
      }
    });

    chartBox.addEventListener("mousemove", ev => {
      if (!dragging || !state.trendStart) return;
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = timeAt(pos.x);
      if (!p || !t) return;
      drawPreviewTrend(state.trendStart, { time: t, price: p });
    });

    window.addEventListener("mouseup", ev => {
      if (!dragging || !state.trendStart) return;
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = timeAt(pos.x);
      if (p && t) addTrend(state.trendStart, { time: t, price: p });
      dragging = false;
      state.trendStart = null;
      setTool(null);
      renderDrawings();
    });

    chartBox.addEventListener("dblclick", ev => {
      const rect = chartBox.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      if (x > rect.width - 95) {
        resetPriceScale();
      } else {
        fitChart();
      }
    });

    $("v26-tv-trash")?.addEventListener("click", () => deleteSelectedObject());
  }

  function pointerToPoint(ev) {
    const box = $("v26-tv-chart");
    const rect = box.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function priceAt(y) {
    try { return state.candleSeries.coordinateToPrice(y); } catch (_) { return null; }
  }

  function timeAt(x) {
    try { return state.chart.timeScale().coordinateToTime(x); } catch (_) { return null; }
  }

  function setTool(tool) {
    state.tool = tool;
    document.querySelectorAll(".v26-tv-btn[data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === tool));
    const hint = $("v26-tv-hint");
    if (!hint) return;
    if (!tool) {
      hint.classList.remove("show");
      hint.textContent = "";
      return;
    }
    const labels = {
      alarm: "Grafikte alarm kurmak istediğin fiyat seviyesine tıkla.",
      hline: "Yatay fiyat çizgisi için grafikte bir seviyeye tıkla.",
      "trend-green": "Yeşil trend için basılı tutup sürükle.",
      "trend-red": "Kırmızı trend için basılı tutup sürükle."
    };
    updateHint(labels[tool] || "Grafikte işlem yap.");
  }

  function updateHint(text) {
    const hint = $("v26-tv-hint");
    if (!hint) return;
    hint.textContent = text;
    hint.classList.add("show");
  }

  function resetPriceScale() {
    if (!state.chart) return;
    state.chart.priceScale("right").applyOptions({ autoScale: true });
    try { state.chart.timeScale().fitContent(); } catch (_) {}
  }

  function fitChart() {
    if (!state.chart) return;
    resetPriceScale();
    try { state.chart.timeScale().fitContent(); } catch (_) {}
  }

  function drawPreviewTrend(a, b) {
    if (!a || !b) return;
    clearPreview();
    const color = a.color === "red" ? "#ef4444" : "#10b981";
    const series = state.chart.addSeries(state._LineSeries, {
      color,
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false
    });
    series.setData([{ time: a.time, value: a.price }, { time: b.time, value: b.price }]);
    series.__preview = true;
    state.extraSeries.push(series);
  }

  function clearPreview() {
    state.extraSeries = state.extraSeries.filter(s => {
      if (s.__preview) {
        try { state.chart.removeSeries(s); } catch (_) {}
        return false;
      }
      return true;
    });
  }

  async function fetchCandles(p, tfObj) {
    if (p.exchange === "okx") {
      const instId = `${p.symbol}-${p.quote}`;
      const url = `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=${encodeURIComponent(tfObj.okx)}&limit=${tfObj.limit}`;
      const json = await fetch(url, { cache: "no-store" }).then(r => r.json());
      if (!json || json.code !== "0") throw new Error("OKX veri hatası");
      return json.data.map(k => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]),
        volume: Number(k[5] || 0)
      })).reverse();
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(p.pair)}&interval=${encodeURIComponent(tfObj.binance)}&limit=${tfObj.limit}`;
    const arr = await fetch(url, { cache: "no-store" }).then(r => r.json());
    if (!Array.isArray(arr)) throw new Error("Binance veri hatası");
    return arr.map(k => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]),
      volume: Number(k[5] || 0)
    }));
  }

  async function fetchTicker(p) {
    try {
      if (p.exchange === "okx") {
        const instId = `${p.symbol}-${p.quote}`;
        const json = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`, { cache: "no-store" }).then(r => r.json());
        const t = json?.data?.[0];
        if (!t) return null;
        const last = Number(t.last || 0);
        const open24h = Number(t.open24h || 0);
        return { price: last, changePct: open24h ? ((last - open24h) / open24h) * 100 : 0 };
      }
      const json = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(p.pair)}`, { cache: "no-store" }).then(r => r.json());
      return { price: Number(json.lastPrice || 0), changePct: Number(json.priceChangePercent || 0) };
    } catch (_) {
      return null;
    }
  }

  function status(text, cls = "") {
    const el = $("crypto-v10-status");
    if (!el) return;
    el.textContent = text;
    el.className = `terminal-v10-live-dot ${cls}`;
  }

  function updateHeader(p, ticker) {
    const title = $("crypto-v10-title");
    const sub = $("crypto-v10-subtitle");
    const priceEl = $("crypto-v10-price");
    const chEl = $("crypto-v10-change");
    const tf = TF.find(x => x.key === state.currentTf) || TF[0];
    if (title) title.textContent = p.pair;
    if (sub) sub.textContent = `${p.exchange === "okx" ? "OKX" : "Binance"} · ${tf.label} · ${state.candles.length} mum`;
    if (ticker?.price) state.price = ticker.price;
    if (!state.price && state.candles.length) state.price = state.candles[state.candles.length - 1].close;
    if (priceEl) priceEl.textContent = fmtPrice(state.price);
    if (chEl) {
      const ch = number(ticker?.changePct, 0);
      chEl.textContent = `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`;
      chEl.className = ch >= 0 ? "up" : "down";
    }
  }

  async function refresh(force = false) {
    try {
      await loadLWC();
      injectStyles();
      createShell();
      installToolbar();
      installTimeframes();
      createChart();

      const p = plan();
      const tf = TF.find(x => x.key === state.currentTf) || TF[0];
      status("YÜKLENİYOR", "");
      const [candles, ticker] = await Promise.all([fetchCandles(p, tf), fetchTicker(p)]);
      state.candles = candles.filter(c => c.time && c.open && c.high && c.low && c.close);

      if (!state.candles.length) throw new Error("Mum verisi boş");

      const volume = state.candles.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(0,200,121,.28)" : "rgba(240,68,68,.28)"
      }));

      state.candleSeries.setData(state.candles);
      state.volumeSeries.setData(volume);
      updateHeader(p, ticker);
      renderPriceLines();
      renderDrawings();
      updateTpOutputs();
      renderAlarms();
      status("CANLI", "ok");
      setCaption(`TradingView Lightweight Charts · sürükle: sağ/sol · mouse tekerleği: zoom · sağ fiyat ekseninde sürükle: fiyat ölçeği · çift tık: sıfırla · ${new Date().toLocaleTimeString("tr-TR")}`);

      if (force) fitChart();
      checkAlarms();
    } catch (err) {
      console.error("V26 crypto refresh error", err);
      status("VERİ HATASI", "err");
      setCaption("Grafik verisi alınamadı. Sembol/pariteyi kontrol et veya biraz sonra tekrar dene.");
    }
  }

  function setCaption(text) {
    let cap = $("v26-tv-caption");
    const old = $("crypto-v10-caption");
    if (!cap && old) {
      cap = document.createElement("div");
      cap.id = "v26-tv-caption";
      cap.className = "v26-tv-caption";
      old.parentNode.insertBefore(cap, old.nextSibling);
    }
    if (cap) cap.innerHTML = `<span>${cssEscape(text)}</span><span>${cssEscape(plan().pair)}</span>`;
  }

  function clearPriceLines() {
    state.priceLines.forEach(l => { try { state.candleSeries.removePriceLine(l); } catch (_) {} });
    state.priceLines = [];
  }

  function renderPriceLines() {
    if (!state.candleSeries) return;
    clearPriceLines();
    const p = plan();
    const add = (price, title, color, style = 2) => {
      if (!price || price <= 0) return;
      const line = state.candleSeries.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: style,
        axisLabelVisible: true,
        title
      });
      state.priceLines.push(line);
    };

    add(p.entry, "GİRİŞ", "#fbbf24", 0);
    add(p.stop, "STOP", "#ef4444", 0);
    add(p.liq, "LIQ", "#f97316", 2);
    p.tps.forEach(t => add(t.price, `TP${t.idx} %${t.pct || 0}`, "#10b981", 0));
    state.alarms.filter(a => a.key === alarmKey()).forEach(a => add(a.price, a.dir === "above" ? "ALARM ÜST" : "ALARM ALT", a.hit ? "#10b981" : "#3b82f6", 1));
    state.drawings.filter(d => d.key === symbolKey() && d.type === "hline").forEach(d => add(d.price, d.label || "ÇİZGİ", "#d4d4d4", 0));
  }

  function renderDrawings() {
    if (!state.chart || !state._LineSeries) return;
    clearPreview();
    state.extraSeries.forEach(s => { try { state.chart.removeSeries(s); } catch (_) {} });
    state.extraSeries = [];
    const key = symbolKey();

    state.drawings.filter(d => d.key === key && d.type === "trend").forEach(d => {
      const color = d.color === "red" ? "#ef4444" : "#10b981";
      const series = state.chart.addSeries(state._LineSeries, {
        color,
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      series.setData([{ time: d.a.time, value: d.a.price }, { time: d.b.time, value: d.b.price }]);
      series.__drawingId = d.id;
      state.extraSeries.push(series);
    });

    renderDrawingPanel();
    renderPriceLines();
  }

  function renderDrawingPanel() {
    const box = $("drawing-v14-panel");
    if (!box) return;
    const key = symbolKey();
    const list = state.drawings.filter(d => d.key === key);
    if (!list.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = list.map(d => {
      const cls = d.type === "trend" ? d.color : "hline";
      const title = d.type === "trend" ? `${d.color === "red" ? "Kırmızı" : "Yeşil"} trend` : `Fiyat çizgisi ${fmtPrice(d.price)}`;
      return `<div class="drawing-v14-row ${cls}"><div><b>${title}</b><br><span>${cssEscape(plan().pair)}</span></div><button onclick="window.v26CryptoDeleteDrawing(${d.id})"><i class="fa-solid fa-trash"></i></button></div>`;
    }).join("");
  }

  function addHLine(price) {
    const d = { id: Date.now(), type: "hline", key: symbolKey(), price, label: "ÇİZGİ" };
    state.drawings.push(d);
    saveJSON("drawings", state.drawings);
    renderDrawings();
    showToast("Fiyat çizgisi eklendi.");
  }

  function addTrend(a, b) {
    const d = { id: Date.now(), type: "trend", key: symbolKey(), color: a.color, a: { time: a.time, price: a.price }, b: { time: b.time, price: b.price } };
    state.drawings.push(d);
    saveJSON("drawings", state.drawings);
    renderDrawings();
    showToast("Trend çizgisi eklendi.");
  }

  function clearDrawingsForSymbol() {
    if (!confirm("Bu semboldeki tüm çizimler silinsin mi?")) return;
    const key = symbolKey();
    state.drawings = state.drawings.filter(d => d.key !== key);
    saveJSON("drawings", state.drawings);
    renderDrawings();
  }

  function deleteDrawing(id) {
    state.drawings = state.drawings.filter(d => d.id !== id);
    saveJSON("drawings", state.drawings);
    renderDrawings();
  }

  function deleteSelectedObject() {
    const o = state.selectedObject;
    if (!o) return;
    if (o.type === "alarm") deleteAlarm(o.id);
    if (o.type === "drawing") deleteDrawing(o.id);
    state.selectedObject = null;
    $("v26-tv-trash")?.classList.remove("show");
  }

  function alarmKey(p = plan()) {
    return `${p.exchange}:${p.pair}`;
  }

  function addAlarmFromPrice(price) {
    const p = plan();
    const dir = price >= state.price ? "above" : "below";
    state.alarms.push({ id: Date.now(), key: alarmKey(p), symbol: p.pair, exchange: p.exchange, price, dir, note: "Grafikten alarm", hit: false, created: new Date().toISOString() });
    saveJSON("alarms", state.alarms);
    renderAlarms();
    renderPriceLines();
    showToast("Grafikten alarm eklendi.");
  }

  function addManualAlarm() {
    const price = number($("v12-alarm-price")?.value, 0);
    const dir = $("v12-alarm-dir")?.value || "above";
    const note = ($("v12-alarm-note")?.value || "").trim();
    if (!price) return showToast("Alarm için geçerli fiyat gir.");
    const p = plan();
    state.alarms.push({ id: Date.now(), key: alarmKey(p), symbol: p.pair, exchange: p.exchange, price, dir, note, hit: false, created: new Date().toISOString() });
    saveJSON("alarms", state.alarms);
    if ($("v12-alarm-price")) $("v12-alarm-price").value = "";
    renderAlarms();
    renderPriceLines();
    showToast("Alarm eklendi.");
  }

  function deleteAlarm(id) {
    state.alarms = state.alarms.filter(a => a.id !== id);
    saveJSON("alarms", state.alarms);
    renderAlarms();
    renderPriceLines();
  }

  function clearHitAlarms() {
    state.alarms = state.alarms.filter(a => !a.hit);
    saveJSON("alarms", state.alarms);
    renderAlarms();
    renderPriceLines();
  }

  function renderAlarms() {
    const box = $("v12-alarm-list");
    if (!box) return;
    const list = state.alarms.filter(a => a.key === alarmKey());
    if (!list.length) {
      box.innerHTML = `<div class="v26-alarm-row"><div><span>Bu sembol için alarm yok. Grafikten Alarm butonuna basıp seviyeye tıklayabilirsin.</span></div><span></span></div>`;
      return;
    }
    box.innerHTML = list.map(a => `
      <div class="v26-alarm-row ${a.hit ? "hit" : ""}">
        <div><b>${a.dir === "above" ? "ÜST" : "ALT"} ${fmtPrice(a.price)}</b><br><span>${cssEscape(a.note || a.symbol)} · ${a.hit ? "ÇALDI" : "aktif"}</span></div>
        <button onclick="window.v26CryptoDeleteAlarm(${a.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join("");
  }

  function checkAlarms() {
    let changed = false;
    state.alarms.forEach(a => {
      if (a.key !== alarmKey() || a.hit || !state.price) return;
      const hit = a.dir === "above" ? state.price >= a.price : state.price <= a.price;
      if (hit) {
        a.hit = true;
        a.hitAt = new Date().toISOString();
        changed = true;
        showToast(`ALARM: ${a.symbol} ${fmtPrice(a.price)}`);
        try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=").play(); } catch (_) {}
      }
    });
    if (changed) {
      saveJSON("alarms", state.alarms);
      renderAlarms();
      renderPriceLines();
    }
  }

  function updateTpOutputs() {
    const p = plan();
    const entry = p.entry || state.price || 0;
    const stake = p.stake;
    const lev = p.lev;
    let tpTotal = 0;
    p.tps.forEach(t => {
      const rawPct = p.side === "long" ? ((t.price - entry) / entry) : ((entry - t.price) / entry);
      const part = stake * lev * rawPct * ((t.pct || 0) / 100);
      tpTotal += part;
      if (t.out) t.out.textContent = fmtMoney(part);
    });

    const liveRaw = entry && state.price ? (p.side === "long" ? ((state.price - entry) / entry) : ((entry - state.price) / entry)) : 0;
    const livePnl = stake * lev * liveRaw;
    const stopRaw = entry && p.stop ? (p.side === "long" ? ((p.stop - entry) / entry) : ((entry - p.stop) / entry)) : 0;
    const stopPnl = stake * lev * stopRaw;

    const liveEl = $("v10-live-pnl");
    const stopEl = $("v10-stop-pnl");
    const tpEl = $("v10-tp-total");
    const rrEl = $("v10-rr");
    if (liveEl) { liveEl.textContent = fmtMoney(livePnl); liveEl.className = livePnl >= 0 ? "good" : "bad"; }
    if (stopEl) { stopEl.textContent = fmtMoney(stopPnl); stopEl.className = stopPnl >= 0 ? "good" : "bad"; }
    if (tpEl) { tpEl.textContent = fmtMoney(tpTotal); tpEl.className = tpTotal >= 0 ? "good" : "bad"; }
    if (rrEl) rrEl.textContent = stopPnl < 0 ? `1:${Math.abs(tpTotal / stopPnl).toFixed(2)}` : "-";
  }

  function installInputListeners() {
    ["v10-exchange","v10-quote","v10-symbol"].forEach(id => {
      const el = $(id);
      if (el && el.dataset.v26bound !== "1") {
        el.dataset.v26bound = "1";
        el.addEventListener("change", () => refresh(true));
        el.addEventListener("blur", () => refresh(true));
      }
    });
    ["v10-side","v10-stake","v10-lev","v10-entry","v10-liq","v10-stop"].forEach(id => {
      const el = $(id);
      if (el && el.dataset.v26bound !== "1") {
        el.dataset.v26bound = "1";
        el.addEventListener("input", () => { renderPriceLines(); updateTpOutputs(); });
      }
    });
  }

  function requestNotify() {
    if (!("Notification" in window)) return showToast("Tarayıcı bildirim desteklemiyor.");
    Notification.requestPermission().then(p => showToast(p === "granted" ? "Bildirim izni verildi." : "Bildirim izni verilmedi."));
  }

  function useLiveAsEntry() {
    const el = $("v10-entry");
    if (!el || !state.price) return;
    el.value = state.price;
    renderPriceLines();
    updateTpOutputs();
    showToast("Canlı fiyat giriş olarak yazıldı.");
  }

  function addTpRow(price = "", pct = 25) {
    const box = $("tp-v10-rows");
    if (!box) return;
    const idx = box.children.length + 1;
    const div = document.createElement("div");
    div.className = "tp-v10-row";
    div.innerHTML = `<span>TP${idx}</span><input class="tp-price" type="number" value="${price}" placeholder="Fiyat" step="0.00000001"><input class="tp-pct" type="number" value="${pct}" placeholder="%" step="1"><b class="tp-out">$0.00</b><button type="button">×</button>`;
    box.appendChild(div);
    div.querySelectorAll("input").forEach(i => i.addEventListener("input", () => { renderPriceLines(); updateTpOutputs(); }));
    div.querySelector("button").onclick = () => { div.remove(); renderPriceLines(); updateTpOutputs(); };
  }

  function ensureTpRows() {
    const box = $("tp-v10-rows");
    if (!box) return;
    if (!box.children.length) {
      addTpRow("", 25);
      addTpRow("", 25);
      addTpRow("", 25);
    } else {
      [...box.querySelectorAll("input")].forEach(i => i.addEventListener("input", () => { renderPriceLines(); updateTpOutputs(); }));
    }
  }

  function boot() {
    injectStyles();
    createShell();
    installToolbar();
    installTimeframes();
    ensureTpRows();
    installInputListeners();
    refresh(true);

    clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(() => refresh(false), 15000);
  }

  function installGlobals() {
    window.omega_V10RefreshCrypto = refresh;
    window.omega_V10UseLiveAsEntry = useLiveAsEntry;
    window.omega_V10AddTpRow = addTpRow;
    window.omega_V10UpdateTpOutputs = updateTpOutputs;
    window.omega_V12AddAlarm = addManualAlarm;
    window.omega_V13SetAlarmAtLive = function () { if (!state.price) return; addAlarmFromPrice(state.price); };
    window.omega_V12ClearHitAlarms = clearHitAlarms;
    window.omega_V12RequestNotify = requestNotify;
    window.omega_V12SetDrawMode = setTool;
    window.omega_V14SetTrendTool = color => setTool(color === "red" ? "trend-red" : "trend-green");
    window.omega_V12ResetView = fitChart;
    window.omega_V12Zoom = function () { fitChart(); };
    window.omega_V12ToggleMA = function () { showToast("MA çizgisi bu yeni grafikte kapalı tutuluyor."); };
    window.omega_V12UndoDrawing = function () {
      const key = symbolKey();
      const idx = [...state.drawings].map((d, i) => ({ d, i })).reverse().find(x => x.d.key === key)?.i;
      if (idx !== undefined) { state.drawings.splice(idx, 1); saveJSON("drawings", state.drawings); renderDrawings(); }
    };
    window.omega_V14ClearDrawingsForSymbol = clearDrawingsForSymbol;
    window.v26CryptoDeleteDrawing = deleteDrawing;
    window.v26CryptoDeleteAlarm = deleteAlarm;
  }

  function startWhenReady() {
    installGlobals();
    const wait = setInterval(() => {
      if ($("crypto-v10-chart") && $("crypto-v10-timeframes")) {
        clearInterval(wait);
        boot();
      }
    }, 150);
    setTimeout(() => clearInterval(wait), 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWhenReady);
  } else {
    startWhenReady();
  }
})();
