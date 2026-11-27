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

  const TRADFI_ALIASES = {
    NDX: { apiPair: "QQQUSDT", market: "fapi", display: "NASDAQ", sub: "QQQ" },
    NASDAQ: { apiPair: "QQQUSDT", market: "fapi", display: "NASDAQ", sub: "QQQ" },
    NAS100: { apiPair: "QQQUSDT", market: "fapi", display: "NAS100", sub: "QQQ" },
    US100: { apiPair: "QQQUSDT", market: "fapi", display: "US100", sub: "QQQ" },
    NDX100: { apiPair: "QQQUSDT", market: "fapi", display: "NDX100", sub: "QQQ" },
    QQQ: { apiPair: "QQQUSDT", market: "fapi", display: "QQQ", sub: "NASDAQ" },
    SPX: { apiPair: "SPYUSDT", market: "fapi", display: "S&P500", sub: "SPY" },
    SPX500: { apiPair: "SPYUSDT", market: "fapi", display: "SPX500", sub: "SPY" },
    SP500: { apiPair: "SPYUSDT", market: "fapi", display: "SP500", sub: "SPY" },
    US500: { apiPair: "SPYUSDT", market: "fapi", display: "US500", sub: "SPY" },
    SPY: { apiPair: "SPYUSDT", market: "fapi", display: "SPY", sub: "S&P500" },
    XAU: { apiPair: "XAUUSDT", market: "fapi", display: "XAU", sub: "Altın" },
    XAUUSD: { apiPair: "XAUUSDT", market: "fapi", display: "XAU", sub: "Altın" },
    GOLD: { apiPair: "XAUUSDT", market: "fapi", display: "XAU", sub: "Altın" },
    ALTIN: { apiPair: "XAUUSDT", market: "fapi", display: "XAU", sub: "Altın" },
    XAG: { apiPair: "XAGUSDT", market: "fapi", display: "XAG", sub: "Gümüş" },
    XAGUSD: { apiPair: "XAGUSDT", market: "fapi", display: "XAG", sub: "Gümüş" },
    SILVER: { apiPair: "XAGUSDT", market: "fapi", display: "XAG", sub: "Gümüş" },
    GUMUS: { apiPair: "XAGUSDT", market: "fapi", display: "XAG", sub: "Gümüş" },
    WTI: { apiPair: "CLUSDT", market: "fapi", display: "WTI", sub: "Petrol" },
    USOIL: { apiPair: "CLUSDT", market: "fapi", display: "WTI", sub: "Petrol" },
    OIL: { apiPair: "CLUSDT", market: "fapi", display: "WTI", sub: "Petrol" },
    CL: { apiPair: "CLUSDT", market: "fapi", display: "WTI", sub: "Petrol" },
    PETROL: { apiPair: "CLUSDT", market: "fapi", display: "WTI", sub: "Petrol" },
    BRENT: { apiPair: "BZUSDT", market: "fapi", display: "BRENT", sub: "Petrol" },
    UKOIL: { apiPair: "BZUSDT", market: "fapi", display: "BRENT", sub: "Petrol" },
    BZ: { apiPair: "BZUSDT", market: "fapi", display: "BRENT", sub: "Petrol" },
    NATGAS: { apiPair: "NATGASUSDT", market: "fapi", display: "NATGAS", sub: "Gaz" },
    NG: { apiPair: "NATGASUSDT", market: "fapi", display: "NATGAS", sub: "Gaz" },
    COPPER: { apiPair: "COPPERUSDT", market: "fapi", display: "COPPER", sub: "Bakır" },
    BAKIR: { apiPair: "COPPERUSDT", market: "fapi", display: "COPPER", sub: "Bakır" },
    XPT: { apiPair: "XPTUSDT", market: "fapi", display: "XPT", sub: "Platin" },
    XPTUSD: { apiPair: "XPTUSDT", market: "fapi", display: "XPT", sub: "Platin" },
    XPD: { apiPair: "XPDUSDT", market: "fapi", display: "XPD", sub: "Paladyum" },
    XPDUSD: { apiPair: "XPDUSDT", market: "fapi", display: "XPD", sub: "Paladyum" },
    EURUSD: { apiPair: "EURUSDT", market: "spot", display: "EUR", sub: "Forex" },
    EUR: { apiPair: "EURUSDT", market: "spot", display: "EUR", sub: "Forex" }
  };

  function resolveMarketSymbol(rawSymbol, quote = "USDT") {
    let clean = String(rawSymbol || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    if (TRADFI_ALIASES[clean]) {
      const a = TRADFI_ALIASES[clean];
      return { base: clean, apiPair: a.apiPair, market: a.market, display: a.display, sub: a.sub };
    }
    if (clean.endsWith("USDT") && clean.length > 4) clean = clean.slice(0, -4);
    else if (clean.endsWith("USD") && clean.length > 3 && TRADFI_ALIASES[clean.slice(0, -3)]) {
      const a = TRADFI_ALIASES[clean.slice(0, -3)];
      return { base: clean, apiPair: a.apiPair, market: a.market, display: a.display, sub: a.sub };
    }
    if (TRADFI_ALIASES[clean]) {
      const a = TRADFI_ALIASES[clean];
      return { base: clean, apiPair: a.apiPair, market: a.market, display: a.display, sub: a.sub };
    }
    const q = String(quote || "USDT").toUpperCase();
    const apiPair = clean + q;
    const fapiSet = window.__v26FapiOnlySet;
    const isFapi = Boolean(fapiSet && fapiSet.has(apiPair));
    return { base: clean, apiPair, market: isFapi ? "fapi" : "spot", display: clean, sub: "/" + q };
  }
  window.v26ResolveMarketSymbol = resolveMarketSymbol;

  function plan() {
    const exchange = ($("v10-exchange")?.value || "binance").toLowerCase();
    const quote = ($("v10-quote")?.value || "USDT").toUpperCase();
    const rawSymbol = ($("v10-symbol")?.value || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    const resolved = resolveMarketSymbol(rawSymbol, quote);
    const symbol = resolved.base;
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

    return {
      exchange,
      quote,
      symbol,
      pair: resolved.apiPair,
      market: resolved.market,
      displayTitle: resolved.display === symbol ? resolved.apiPair : `${resolved.display} (${resolved.apiPair})`,
      side, stake, lev, entry, liq, stop, tps
    };
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

    let stage = $("v26-chart-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "v26-chart-stage";
      stage.className = "v26-chart-stage";
      wrap.parentNode.insertBefore(stage, wrap);
      stage.appendChild(wrap);
    }

    let shell = $("v26-tv-chart-shell");
    if (shell) return shell;

    shell = document.createElement("div");
    shell.id = "v26-tv-chart-shell";
    shell.className = "v26-tv-chart-shell";
    shell.innerHTML = `
      <div id="v26-tv-chart" class="v26-tv-chart"></div>
      <canvas id="v26-draw-overlay" class="v26-draw-overlay"></canvas>
      <div id="v26-tv-hint" class="v26-tv-hint"></div>
      <div id="v26-draw-actions" class="v26-draw-actions v26-binance-act-bar">
        <div class="v26-act-colors" id="v26-act-colors" title="Renk Değiştir">
          <button type="button" class="v26-c-dot" data-draw-color="green" style="background:#00E676" title="Yeşil (Destek)"></button>
          <button type="button" class="v26-c-dot" data-draw-color="red" style="background:#DC2626" title="Kırmızı (Direnç)"></button>
          <button type="button" class="v26-c-dot" data-draw-color="blue" style="background:#38BDF8" title="Mavi"></button>
          <button type="button" class="v26-c-dot" data-draw-color="gold" style="background:#F0B90B" title="Altın"></button>
          <button type="button" class="v26-c-dot" data-draw-color="purple" style="background:#C084FC" title="Mor"></button>
        </div>
        <button id="v26-act-width" class="v26-act-btn width" type="button" title="Çizgi Kalınlığı">2px</button>
        <button id="v26-act-style" class="v26-act-btn style" type="button" title="Düz / Kesikli Çizgi"><i class="fa-solid fa-minus"></i></button>
        <button id="v26-act-lock" class="v26-act-btn lock" type="button" title="Kilitle / Kilidi Aç"><i class="fa-solid fa-lock-open"></i></button>
        <button id="v26-tv-note-btn" class="v26-act-btn note" type="button" title="Not Ekle / Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button id="v26-tv-trash" class="v26-act-btn trash" type="button" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div id="v26-note-editor" class="v26-note-editor">
        <span id="v26-note-price-pill" class="v26-note-price-pill"></span>
        <input id="v26-note-input" type="text" placeholder="Not yaz (örn: Destek, FVG, TP)..." maxlength="60">
        <button id="v26-note-save" type="button" title="Kaydet"><i class="fa-solid fa-check"></i></button>
        <button id="v26-note-cancel" type="button" title="İptal"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="v26-ctx-menu" class="v26-ctx-menu"></div>
    `;
    wrap.insertBefore(shell, canvas);
    canvas.style.display = "none";
    return shell;
  }

  function installToolbar() {
    const stage = $("v26-chart-stage");
    const tfBox = $("crypto-v10-timeframes");
    if (!stage || !tfBox || $("v26-tv-toolbar")) return;

    // Wrap #crypto-v10-timeframes inside a flex host row so Çizim & Emir Defteri toggles sit cleanly on the right
    let tfHost = $("v26-tf-row-host");
    if (!tfHost) {
      tfHost = document.createElement("div");
      tfHost.id = "v26-tf-row-host";
      tfHost.className = "v26-tf-row-host";
      tfBox.parentNode.insertBefore(tfHost, tfBox);
      tfHost.appendChild(tfBox);

      const toolsGrp = document.createElement("div");
      toolsGrp.className = "v26-tf-tools-group";
      toolsGrp.innerHTML = `
        <button type="button" class="v26-top-pill active" id="v26-ob-dock-toggle" title="Emir Defterini Göster/Gizle">
          <i class="fa-solid fa-layer-group"></i><span>Emir Defteri</span>
        </button>
        <button type="button" class="v26-top-pill" id="v26-tv-tools-toggle" title="Çizim Araçlarını Aç/Kapat">
          <i class="fa-solid fa-pen-ruler"></i><span>Çizim</span>
        </button>
      `;
      tfHost.appendChild(toolsGrp);
    }

    const bar = document.createElement("div");
    bar.id = "v26-tv-toolbar";
    bar.className = "v26-tv-toolbar v26-tv-top-bar";
    stage.parentNode.insertBefore(bar, stage);

    const isCollapsed = localStorage.getItem(LS_PREFIX + "tools_collapsed") !== "0";
    bar.classList.toggle("collapsed", isCollapsed);
    const tglBtn = $("v26-tv-tools-toggle");
    if (tglBtn) tglBtn.classList.toggle("active", !isCollapsed);

    bar.innerHTML = `
      <div class="v26-tv-dock-items">
        <button class="v26-tv-btn active" data-tool="select" title="İmleç · Çizimleri Seç & Taşı"><i class="fa-solid fa-arrow-pointer"></i><span>İmleç</span></button>
        <button class="v26-tv-btn green" data-tool="trend-green" title="Yeşil Trend Çizgisi"><i class="fa-solid fa-chart-line"></i><span>Yeşil Trend</span></button>
        <button class="v26-tv-btn red" data-tool="trend-red" title="Kırmızı Trend Çizgisi"><i class="fa-solid fa-chart-line"></i><span>Kırmızı Trend</span></button>
        <button class="v26-tv-btn cyan" data-tool="hline" title="Yatay Fiyat Çizgisi"><i class="fa-solid fa-grip-lines"></i><span>Yatay Çizgi</span></button>
        <button class="v26-tv-btn gold" data-tool="zone" title="Bölge / Kutu Çiz (Destek-Direnç)"><i class="fa-regular fa-square"></i><span>Bölge Kutusu</span></button>
        <button class="v26-tv-btn violet" data-tool="note" title="Grafiğe Metin Notu Ekle"><i class="fa-solid fa-font"></i><span>Not Ekle</span></button>
        <button class="v26-tv-btn green" data-tool="alarm" title="Grafikten Alarm"><i class="fa-solid fa-bell"></i><span>Alarm</span></button>
        <button class="v26-tv-btn blue" data-tool="fit" title="Grafiği Sığdır"><i class="fa-solid fa-compress"></i><span>Sığdır</span></button>
        <button class="v26-tv-btn slate" data-tool="undo" title="Geri Al (Ctrl+Z)"><i class="fa-solid fa-rotate-left"></i><span>Geri Al</span></button>
        <button class="v26-tv-btn slate" data-tool="redo" title="İleri Al (Ctrl+Y)"><i class="fa-solid fa-rotate-right"></i><span>İleri Al</span></button>
        <button class="v26-tv-btn red" data-tool="clear" title="Çizimleri Sil"><i class="fa-solid fa-trash-can"></i><span>Temizle</span></button>
      </div>
    `;

    $("v26-tv-tools-toggle").onclick = () => {
      const nextCollapsed = !bar.classList.contains("collapsed");
      bar.classList.toggle("collapsed", nextCollapsed);
      localStorage.setItem(LS_PREFIX + "tools_collapsed", nextCollapsed ? "1" : "0");
      $("v26-tv-tools-toggle")?.classList.toggle("active", !nextCollapsed);
      setTimeout(() => requestOverlayDraw(), 30);
    };

    bar.querySelectorAll("[data-tool]").forEach(btn => {
      btn.onclick = () => {
        const tool = btn.dataset.tool;
        if (tool === "fit") return fitChart();
        if (tool === "undo") return undoDrawing();
        if (tool === "redo") return redoDrawing();
        if (tool === "clear") return clearDrawingsForSymbol();
        if (tool === "select") return setTool(null);
        setTool(state.tool === tool ? null : tool);
      };
    });
    updateHistoryButtons();
  }

  const PINNED_TF = ["1m", "3m", "15m", "1h", "4h", "1d", "1w"];

  function installTimeframes() {
    const box = $("crypto-v10-timeframes");
    if (!box) return;
    const pinned = TF.filter(t => PINNED_TF.includes(t.key));
    const extras = TF.filter(t => !PINNED_TF.includes(t.key));
    const activeExtra = extras.find(t => t.key === state.currentTf);
    const pinnedHtml = pinned.map(t => `<button class="tf-v10 ${t.key === state.currentTf ? "active" : ""}" data-tf="${t.key}">${t.label}</button>`).join("");
    const extraHtml = extras.map(t => `<button class="tf-v10 ${t.key === state.currentTf ? "active" : ""}" data-tf="${t.key}">${t.label}</button>`).join("");
    box.innerHTML = `
      ${pinnedHtml}
      <div class="v26-tf-more-wrap">
        <button type="button" class="tf-v10 v26-tf-more-btn ${activeExtra ? "active" : ""}" id="v26-tf-more-btn" title="Diğer süreler">
          ${activeExtra ? activeExtra.label + " " : ""}▾
        </button>
        <div class="v26-tf-more-menu" id="v26-tf-more-menu">${extraHtml}</div>
      </div>
    `;

    const moreBtn = $("v26-tf-more-btn");
    const moreMenu = $("v26-tf-more-menu");
    if (moreBtn && moreMenu) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        moreMenu.classList.toggle("show");
      };
      if (!window.__v26TfOutsideBound) {
        window.__v26TfOutsideBound = true;
        document.addEventListener("click", () => {
          $("v26-tf-more-menu")?.classList.remove("show");
        });
      }
    }

    box.querySelectorAll("[data-tf]").forEach(btn => {
      btn.onclick = () => {
        const nextTf = btn.dataset.tf;
        $("v26-tf-more-menu")?.classList.remove("show");
        if (nextTf === state.currentTf) return;
        state.currentTf = nextTf;
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
        background: { color: "#161A1E" },
        textColor: "#CBD5E1",
        attributionLogo: false,
        fontFamily: "Inter, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(43, 49, 57, 0.45)" },
        horzLines: { color: "rgba(43, 49, 57, 0.45)" }
      },
      rightPriceScale: {
        borderColor: "#2B3139",
        autoScale: true,
        scaleMargins: { top: 0.12, bottom: 0.18 },
        ticksVisible: true
      },
      timeScale: {
        borderColor: "#2B3139",
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
        vertLine: { color: "rgba(240, 185, 11, 0.45)", width: 1, style: 2, labelBackgroundColor: "#2B3139" },
        horzLine: { color: "rgba(240, 185, 11, 0.45)", width: 1, style: 2, labelBackgroundColor: "#2B3139" }
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
      upColor: "#00E676",
      downColor: "#D50000",
      borderUpColor: "#00E676",
      borderDownColor: "#D50000",
      wickUpColor: "#00E676",
      wickDownColor: "#D50000",
      priceLineVisible: true,
      lastValueVisible: true,
      priceFormat: { type: "price", precision: 8, minMove: 0.00000001 }
    });

    const maOpts = (color) => ({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    state.ma7Series = state.chart.addSeries(LineSeries, maOpts("#F0B90B"));
    state.ma25Series = state.chart.addSeries(LineSeries, maOpts("#C084FC"));
    state.ma99Series = state.chart.addSeries(LineSeries, maOpts("#38BDF8"));

    state.volumeSeries = state.chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false
    });

    state.chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }
    });

    state.chart.timeScale().subscribeVisibleLogicalRangeChange(() => requestOverlayDraw());
    try {
      new ResizeObserver(() => requestOverlayDraw()).observe(el);
    } catch (_) {}

    bindChartInteractions();
  }

  let overlayRaf = 0;
  function requestOverlayDraw() {
    if (overlayRaf) return;
    overlayRaf = requestAnimationFrame(() => {
      overlayRaf = 0;
      drawOverlay();
    });
  }

  function drawingPairKey(p = plan()) {
    return `${p.exchange}:${p.pair}`;
  }

  function isDrawingForCurrentPair(d, p = plan()) {
    const pk = drawingPairKey(p);
    return d.key === pk || String(d.key || "").startsWith(pk + ":");
  }

  function getBarStepSec() {
    const c = state.candles;
    if (!c || c.length < 2) return 3600;
    const mid = Math.min(c.length - 1, 10);
    const diffs = [];
    for (let i = 1; i <= mid; i++) diffs.push(c[i].time - c[i - 1].time);
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)] || 3600;
  }

  function timeToX(time) {
    if (!state.chart || !state.candles.length || !Number.isFinite(time)) return null;
    const c = state.candles;
    const step = getBarStepSec();
    let logical;
    if (time <= c[0].time) {
      logical = (time - c[0].time) / step;
    } else if (time >= c[c.length - 1].time) {
      logical = (c.length - 1) + (time - c[c.length - 1].time) / step;
    } else {
      let lo = 0, hi = c.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (c[mid].time <= time) lo = mid;
        else hi = mid;
      }
      const span = Math.max(1, c[hi].time - c[lo].time);
      logical = lo + (time - c[lo].time) / span;
    }
    return state.chart.timeScale().logicalToCoordinate(logical);
  }

  function xToTime(x) {
    if (!state.chart || !state.candles.length) return null;
    const c = state.candles;
    const step = getBarStepSec();
    let logical = state.chart.timeScale().coordinateToLogical(x);
    if (logical === null || logical === undefined || !Number.isFinite(logical)) return null;
    if (logical <= 0) return c[0].time + logical * step;
    if (logical >= c.length - 1) return c[c.length - 1].time + (logical - (c.length - 1)) * step;
    const lo = Math.floor(logical);
    const hi = Math.min(c.length - 1, lo + 1);
    const frac = logical - lo;
    return c[lo].time + frac * (c[hi].time - c[lo].time);
  }

  function priceToY(price) {
    if (!state.candleSeries || !Number.isFinite(price)) return null;
    try { return state.candleSeries.priceToCoordinate(price); } catch (_) { return null; }
  }

  function drawingCoords(d) {
    if (d.type === "hline") {
      const y = priceToY(d.price);
      if (y == null) return null;
      const x = Number.isFinite(d.anchorTime) ? timeToX(d.anchorTime) : null;
      return { y, x };
    }
    if (d.type === "note") {
      if (!d.a) return null;
      const x = timeToX(d.a.time);
      const y = priceToY(d.a.price);
      return (x == null || y == null) ? null : { x, y };
    }
    if (!d.a || !d.b) return null;
    const x1 = timeToX(d.a.time);
    const y1 = priceToY(d.a.price);
    const x2 = timeToX(d.b.time);
    const y2 = priceToY(d.b.price);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return null;
    return { x1, y1, x2, y2 };
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  const DRAW_COLORS = {
    green: { hex: "#00E676", fill: "rgba(0, 230, 118, 0.14)", text: "#86efac" },
    red: { hex: "#DC2626", fill: "rgba(220, 38, 38, 0.15)", text: "#fca5a5" },
    blue: { hex: "#38BDF8", fill: "rgba(56, 189, 248, 0.14)", text: "#bae6fd" },
    gold: { hex: "#F0B90B", fill: "rgba(240, 185, 11, 0.14)", text: "#fde68a" },
    purple: { hex: "#C084FC", fill: "rgba(192, 132, 252, 0.14)", text: "#e9d5ff" }
  };

  function getDrawingColorKey(d) {
    if (d?.color && DRAW_COLORS[d.color]) return d.color;
    if (d?.type === "hline") return "blue";
    if (d?.type === "zone") return "gold";
    if (d?.type === "note") return "purple";
    return "green";
  }

  function getDrawingColor(d) {
    return DRAW_COLORS[getDrawingColorKey(d)] || DRAW_COLORS.green;
  }

  let lastActionAnchor = null;
  function positionActionBar(d, anchorPos) {
    const box = $("v26-draw-actions");
    const chartBox = $("v26-tv-chart");
    if (!box || !chartBox) return;
    if (!d) {
      box.classList.remove("show");
      lastActionAnchor = null;
      return;
    }
    const coords = drawingCoords(d);
    const cw = chartBox.clientWidth || 600;
    const ch = chartBox.clientHeight || 400;
    let ax = Number.isFinite(anchorPos?.x) ? anchorPos.x : null;
    let ay = Number.isFinite(anchorPos?.y) ? anchorPos.y : null;
    if ((ax == null || ay == null) && coords) {
      if (d.type === "trend") { ax = (coords.x1 + coords.x2) / 2; ay = (coords.y1 + coords.y2) / 2; }
      else if (d.type === "zone") { ax = (coords.x1 + coords.x2) / 2; ay = Math.min(coords.y1, coords.y2); }
      else if (d.type === "hline") { ax = Number.isFinite(coords.x) ? coords.x : (cw - 72) * 0.5; ay = coords.y; }
      else if (d.type === "note") { ax = coords.x; ay = coords.y; }
    }
    if (!Number.isFinite(ax)) ax = (cw - 72) * 0.5;
    if (!Number.isFinite(ay)) ay = ch * 0.5;
    lastActionAnchor = { x: ax, y: ay };
    const isAlarm = Boolean(d._isAlarm);
    const barW = isAlarm ? 50 : 286;
    const x = Math.max(8, Math.min(cw - barW - 8, ax - barW * 0.5));
    const offsetY = d.note ? 70 : 46;
    const y = Math.max(8, ay - offsetY);
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    const noteBtn = $("v26-tv-note-btn");
    const colorsEl = $("v26-act-colors");
    const widthBtn = $("v26-act-width");
    const styleBtn = $("v26-act-style");
    const lockBtn = $("v26-act-lock");
    if (noteBtn) noteBtn.style.display = isAlarm ? "none" : "inline-flex";
    if (colorsEl) colorsEl.style.display = isAlarm ? "none" : "inline-flex";
    if (widthBtn) {
      widthBtn.style.display = isAlarm ? "none" : "inline-flex";
      widthBtn.textContent = `${Number(d.lineWidth) || (d.type === "zone" ? 2 : 2)}px`;
    }
    if (styleBtn) {
      styleBtn.style.display = isAlarm ? "none" : "inline-flex";
      const isDashed = d.type === "note" ? d.lineStyle !== "solid" : d.lineStyle === "dashed";
      styleBtn.innerHTML = isDashed ? '<i class="fa-solid fa-ellipsis"></i>' : '<i class="fa-solid fa-minus"></i>';
    }
    if (lockBtn) {
      lockBtn.style.display = isAlarm ? "none" : "inline-flex";
      lockBtn.classList.toggle("locked", Boolean(d.locked));
      lockBtn.innerHTML = d.locked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
    }
    const activeColor = getDrawingColorKey(d);
    box.querySelectorAll("[data-draw-color]").forEach(b => {
      b.classList.toggle("active", b.dataset.drawColor === activeColor);
    });
    box.classList.add("show");
  }

  let activeNoteTargetId = null;
  function openNoteEditor(drawingId, anchorPos) {
    const ed = $("v26-note-editor");
    const inp = $("v26-note-input");
    const chartBox = $("v26-tv-chart");
    const d = state.drawings.find(x => x.id === drawingId);
    if (!ed || !inp || !d || !chartBox) return;
    activeNoteTargetId = drawingId;
    const cw = chartBox.clientWidth || 600;
    const ch = chartBox.clientHeight || 400;
    const coords = drawingCoords(d);
    const pt = anchorPos || lastActionAnchor;
    let ax = Number.isFinite(pt?.x) ? pt.x : null;
    let ay = Number.isFinite(pt?.y) ? pt.y : null;
    if (ax == null || ay == null) {
      if (coords && Number.isFinite(coords.x1) && Number.isFinite(coords.x2)) {
        ax = (coords.x1 + coords.x2) / 2;
        ay = d.type === "zone" ? Math.min(coords.y1, coords.y2) : (coords.y1 + coords.y2) / 2;
      } else if (coords && Number.isFinite(coords.y)) {
        ax = Number.isFinite(coords.x) ? coords.x : (cw - 72) * 0.5;
        ay = coords.y;
      } else {
        ax = (cw - 72) * 0.5;
        ay = ch * 0.5;
      }
    }
    ed.style.left = `${Math.max(10, Math.min(cw - 340, ax - 150))}px`;
    ed.style.top = `${Math.max(10, Math.min(ch - 52, ay + 14))}px`;
    const pricePill = $("v26-note-price-pill");
    if (pricePill) {
      const np = d.type === "hline" ? d.price : (d.a?.price || d.price || 0);
      pricePill.textContent = np > 0 ? fmtPrice(np) : "";
      pricePill.style.display = np > 0 ? "inline-flex" : "none";
    }
    inp.value = d.note || "";
    ed.classList.add("show");
    setTimeout(() => { inp.focus(); inp.select(); }, 20);
  }

  function closeNoteEditor() {
    $("v26-note-editor")?.classList.remove("show");
    activeNoteTargetId = null;
  }

  function drawOverlay() {
    const canvas = $("v26-draw-overlay");
    const chartBox = $("v26-tv-chart");
    if (!canvas || !chartBox || !state.chart || !state.candleSeries) return;

    const w = chartBox.clientWidth;
    const h = chartBox.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Clip to plotting area (exclude right price scale ~75px)
    const plotW = Math.max(40, w - 72);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, plotW, h);
    ctx.clip();

    const p = plan();
    const list = state.drawings.filter(d => isDrawingForCurrentPair(d, p));
    const selId = state.selectedObject?.type === "drawing" ? state.selectedObject.id : null;
    const preview = state.previewDrawing;
    const toDraw = preview ? [...list, preview] : list;

    const drawHandle = (x, y, accent) => {
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = accent;
      ctx.stroke();
    };

    const drawNoteTag = (x, y, text, accent, selected) => {
      if (!text) return null;
      ctx.font = "600 11.5px Inter, sans-serif";
      const tw = ctx.measureText(text).width;
      const bw = tw + 16;
      const bh = 22;
      const bx = Math.max(8, Math.min(plotW - bw - 8, x - bw / 2));
      const by = Math.max(6, Math.min(h - bh - 6, y - bh - 8));
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 5);
      ctx.fillStyle = "rgba(11, 17, 32, 0.92)";
      ctx.fill();
      ctx.lineWidth = selected ? 1.4 : 1;
      ctx.strokeStyle = selected ? "#F0B90B" : "rgba(148, 163, 184, 0.30)";
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, bx + bw / 2, by + bh / 2);
      return { bx, by, bw, bh };
    };

    const drawPriceTag = (y, priceText, accent) => {
      ctx.font = "700 11px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(priceText).width;
      const pw = tw + 14;
      const ph = 20;
      const px = plotW - pw - 8;
      const py = Math.max(4, Math.min(h - ph - 4, y - ph - 5));
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 5);
      ctx.fillStyle = "rgba(9, 14, 26, 0.94)";
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(priceText, px + pw / 2, py + ph / 2);
    };

    toDraw.forEach((d) => {
      d.__noteRect = null;
      const coords = drawingCoords(d);
      if (!coords) return;
      const isSel = d.id === selId || d.id === state.hoveredId;
      const cInfo = getDrawingColor(d);
      const accent = cInfo.hex;
      const lw = Number(d.lineWidth) || (d.type === "trend" ? 2.5 : d.type === "hline" ? 1.85 : 1.5);
      const isDashed = d.type === "note" ? d.lineStyle !== "solid" : d.lineStyle === "dashed";

      if (d.type === "trend") {
        ctx.beginPath();
        ctx.moveTo(coords.x1, coords.y1);
        ctx.lineTo(coords.x2, coords.y2);
        ctx.lineWidth = isSel ? lw + 1 : lw;
        ctx.lineCap = "round";
        ctx.strokeStyle = accent;
        if (d.__preview || isDashed) ctx.setLineDash([6, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = "butt";
        const inView = Math.max(coords.x1, coords.x2) >= 0 && Math.min(coords.x1, coords.x2) <= plotW &&
          Math.max(coords.y1, coords.y2) >= 0 && Math.min(coords.y1, coords.y2) <= h;
        if (d.note && inView) {
          const nt = Number.isFinite(d.noteT) ? Math.max(0, Math.min(1, d.noteT)) : 0.5;
          const ndy = Number.isFinite(d.noteDy) ? d.noteDy : -4;
          const nx = coords.x1 + (coords.x2 - coords.x1) * nt;
          const ny = coords.y1 + (coords.y2 - coords.y1) * nt + ndy;
          d.__noteRect = drawNoteTag(nx, ny, d.note, accent, isSel);
        }
        if (d.id === selId && !d.locked) {
          drawHandle(coords.x1, coords.y1, accent);
          drawHandle(coords.x2, coords.y2, accent);
        }
      } else if (d.type === "hline") {
        const anchorX = Number.isFinite(coords.x) ? Math.max(24, Math.min(plotW - 24, coords.x)) : plotW * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, coords.y);
        ctx.lineTo(plotW, coords.y);
        ctx.lineWidth = isSel ? lw + 0.8 : lw;
        ctx.strokeStyle = accent;
        ctx.setLineDash(isDashed ? [6, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        if (d.note && coords.y >= -12 && coords.y <= h + 12) {
          d.__noteRect = drawNoteTag(anchorX, coords.y, d.note, accent, isSel);
        }
        if (isSel && coords.y >= 0 && coords.y <= h) {
          drawPriceTag(coords.y, fmtPrice(d.price), accent);
        }
        if (d.id === selId && !d.locked) {
          drawHandle(anchorX, coords.y, accent);
        }
      } else if (d.type === "zone") {
        const x = Math.min(coords.x1, coords.x2);
        const y = Math.min(coords.y1, coords.y2);
        const zw = Math.max(4, Math.abs(coords.x2 - coords.x1));
        const zh = Math.max(4, Math.abs(coords.y2 - coords.y1));
        ctx.fillStyle = cInfo.fill;
        ctx.fillRect(x, y, zw, zh);
        ctx.lineWidth = isSel ? lw + 0.8 : lw;
        ctx.strokeStyle = accent;
        ctx.setLineDash(isDashed ? [6, 4] : []);
        ctx.strokeRect(x, y, zw, zh);
        ctx.setLineDash([]);
        const inView = (x + zw) >= 0 && x <= plotW && (y + zh) >= 0 && y <= h;
        if (d.note && inView) {
          const rx = Number.isFinite(d.noteRx) ? Math.max(0.02, Math.min(0.85, d.noteRx)) : 0.04;
          const ry = Number.isFinite(d.noteRy) ? Math.max(0.04, Math.min(0.85, d.noteRy)) : 0.08;
          ctx.font = "600 11.5px Inter, sans-serif";
          const tw = ctx.measureText(d.note).width;
          const lx = Math.max(8, Math.min(x + zw - tw - 8, x + zw * rx));
          const ly = Math.max(6, Math.min(y + zh - 16, y + zh * ry));
          ctx.fillStyle = cInfo.text;
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          ctx.fillText(d.note, lx, ly);
          d.__noteRect = { bx: lx - 4, by: ly - 3, bw: tw + 8, bh: 20 };
        }
        if (d.id === selId && !d.locked) {
          drawHandle(coords.x1, coords.y1, accent);
          drawHandle(coords.x2, coords.y2, accent);
          drawHandle(coords.x1, coords.y2, accent);
          drawHandle(coords.x2, coords.y1, accent);
        }
      } else if (d.type === "note") {
        const text = d.note || "Not";
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x, coords.y - 12);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = accent;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, isSel ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
        if (isSel) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        }
        d.__noteRect = drawNoteTag(coords.x, coords.y - 4, text, isSel ? "#F0B90B" : accent, isSel);
      }
    });

    // Visible range Peak High & Bottom Low candle labels (TradingView style)
    if (state.candles && state.candles.length) {
      let fromIdx = 0;
      let toIdx = state.candles.length - 1;
      try {
        const lr = state.chart.timeScale().getVisibleLogicalRange();
        if (lr && Number.isFinite(lr.from) && Number.isFinite(lr.to)) {
          fromIdx = Math.max(0, Math.floor(lr.from) - 1);
          toIdx = Math.min(state.candles.length - 1, Math.ceil(lr.to) + 1);
        }
      } catch (_) {}

      let maxBar = null, minBar = null;
      for (let i = fromIdx; i <= toIdx; i++) {
        const bar = state.candles[i];
        if (!bar) continue;
        const bx = timeToX(bar.time);
        if (bx == null || bx < 2 || bx > plotW - 2) continue;
        if (!maxBar || bar.high > maxBar.high) maxBar = bar;
        if (!minBar || bar.low < minBar.low) minBar = bar;
      }

      const fmtExtreme = (val) => {
        const n = Number(val || 0);
        if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
      };

      const plotH = Math.max(40, h - 28);
      const drawExtremeCallout = (bar, val, isHigh) => {
        const x = timeToX(bar.time);
        const y = priceToY(val);
        if (x == null || y == null || y < 2 || y > h - 2) return;
        const label = fmtExtreme(val);
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(label).width;
        const placeRight = x < 96;
        const tickLen = 12;
        const tx = placeRight ? x + tickLen + 4 : x - tickLen - 4;
        const clampedY = Math.max(11, Math.min(plotH - 10, y));

        // Horizontal wick connector tick
        ctx.beginPath();
        ctx.moveTo(x, clampedY);
        ctx.lineTo(placeRight ? x + tickLen : x - tickLen, clampedY);
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = isHigh ? "rgba(226, 232, 240, 0.85)" : "rgba(226, 232, 240, 0.85)";
        ctx.stroke();

        // Subtle dark backdrop so numbers remain crisp over lines
        const boxW = tw + 8;
        const boxH = 16;
        const boxX = placeRight ? tx - 3 : tx - tw - 5;
        const boxY = clampedY - boxH / 2;
        ctx.fillStyle = "rgba(11, 14, 17, 0.72)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 3);
        ctx.fill();

        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = placeRight ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(label, tx, clampedY);
      };

      if (maxBar) drawExtremeCallout(maxBar, maxBar.high, true);
      if (minBar) drawExtremeCallout(minBar, minBar.low, false);
    }

    ctx.restore();
  }

  function findHitObject(pos) {
    if (!state.chart || !state.candleSeries) return null;
    const p = plan();
    const list = state.drawings.filter(d => isDrawingForCurrentPair(d, p));
    const selId = state.selectedObject?.type === "drawing" ? state.selectedObject.id : null;

    // 1. Check selected handles first (easy resize!)
    if (selId) {
      const selD = list.find(d => d.id === selId);
      if (selD) {
        const c = drawingCoords(selD);
        if (c && (selD.type === "trend" || selD.type === "zone")) {
          if (Math.hypot(pos.x - c.x1, pos.y - c.y1) <= 12) return { type: "drawing", id: selD.id, handle: "a", drawing: selD };
          if (Math.hypot(pos.x - c.x2, pos.y - c.y2) <= 12) return { type: "drawing", id: selD.id, handle: "b", drawing: selD };
          if (selD.type === "zone") {
            if (Math.hypot(pos.x - c.x1, pos.y - c.y2) <= 12) return { type: "drawing", id: selD.id, handle: "ab", drawing: selD };
            if (Math.hypot(pos.x - c.x2, pos.y - c.y1) <= 12) return { type: "drawing", id: selD.id, handle: "ba", drawing: selD };
          }
        }
      }
    }

    // 1b. Check clicking specifically on a note label of ANY drawing so ONLY the note moves horizontally!
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i];
      if (!d.__noteRect) continue;
      if (d.type === "note" || (d.note && (d.type === "trend" || d.type === "hline" || d.type === "zone"))) {
        const r = d.__noteRect;
        if (pos.x >= r.bx - 8 && pos.x <= r.bx + r.bw + 8 && pos.y >= r.by - 8 && pos.y <= r.by + r.bh + 6) {
          return { type: "drawing", id: d.id, handle: "note-move", drawing: d };
        }
      }
    }

    // 2. Check drawings body
    let best = null;
    let bestDist = 13;
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i];
      const c = drawingCoords(d);
      if (!c) continue;
      if (d.type === "trend") {
        const dist = distToSegment(pos.x, pos.y, c.x1, c.y1, c.x2, c.y2);
        if (dist < bestDist) {
          bestDist = dist;
          best = { type: "drawing", id: d.id, handle: "move", drawing: d };
        }
      } else if (d.type === "hline") {
        const dist = Math.abs(pos.y - c.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = { type: "drawing", id: d.id, handle: "move", drawing: d };
        }
      } else if (d.type === "note") {
        const hitPin = Math.hypot(pos.x - c.x, pos.y - c.y) <= 12;
        const hitLine = Math.abs(pos.y - c.y) <= 8;
        if (hitPin || hitLine) {
          return { type: "drawing", id: d.id, handle: "move", drawing: d };
        }
      } else if (d.type === "zone") {
        const minX = Math.min(c.x1, c.x2), maxX = Math.max(c.x1, c.x2);
        const minY = Math.min(c.y1, c.y2), maxY = Math.max(c.y1, c.y2);
        if (pos.x >= minX - 6 && pos.x <= maxX + 6 && pos.y >= minY - 6 && pos.y <= maxY + 6) {
          return { type: "drawing", id: d.id, handle: "move", drawing: d };
        }
      }
    }
    if (best) return best;

    // 3. Check alarms
    const aKey = alarmKey();
    for (const a of state.alarms.filter(x => x.key === aKey)) {
      const y = priceToY(a.price);
      if (y != null && Math.abs(pos.y - y) < 10) {
        return { type: "alarm", id: a.id, _isAlarm: true };
      }
    }
    return null;
  }

  function bindChartInteractions() {
    const shell = $("v26-tv-chart-shell");
    const chartBox = $("v26-tv-chart");
    if (!shell || !chartBox || shell.dataset.bound === "1") return;
    shell.dataset.bound = "1";

    let dragDrawStart = null; // when creating trend/zone
    let dragStartPx = null;
    let editDrag = null; // { id, handle, orig, startTime, startPrice }
    let didMoveDuringMouseDown = false;
    let lastDragEndMs = 0;

    const setPanEnabled = (on) => {
      if (!state.chart) return;
      state.chart.applyOptions({
        handleScroll: { mouseWheel: true, pressedMouseMove: on, horzTouchDrag: on, vertTouchDrag: on }
      });
    };

    // Prevent Lightweight Charts pointerdown from initiating pan when drawing or grabbing a drawing/handle
    chartBox.addEventListener("pointerdown", ev => {
      if (ev.button !== 0) return;
      const pos = pointerToPoint(ev);
      if (state.tool) {
        ev.stopPropagation();
        setPanEnabled(false);
        return;
      }
      const hit = findHitObject(pos);
      if (hit && hit.type === "drawing") {
        ev.stopPropagation();
        setPanEnabled(false);
      }
    }, true);

    chartBox.addEventListener("mousedown", ev => {
      if (ev.button !== 0) return;
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = xToTime(pos.x);

      // Creating a drawing tool
      if (state.tool) {
        if (!p || t == null) return;
        if (state.tool === "alarm") {
          addAlarmFromPrice(p);
          setTool(null);
          return;
        }
        if (state.tool === "hline") {
          addHLine(p, t);
          setTool(null);
          return;
        }
        if (state.tool === "note") {
          const d = addNote(t, p, "");
          setTool(null);
          state.selectedObject = { type: "drawing", id: d.id };
          openNoteEditor(d.id, pos);
          requestOverlayDraw();
          return;
        }
        if (state.tool === "trend-green" || state.tool === "trend-red" || state.tool === "zone" || state.tool === "zone-green" || state.tool === "zone-red") {
          ev.stopPropagation();
          if (!dragDrawStart) {
            // First click starts line/zone
            dragDrawStart = { time: t, price: p, tool: state.tool };
            dragStartPx = pos;
            didMoveDuringMouseDown = false;
            state.previewDrawing = {
              id: "__preview",
              __preview: true,
              type: state.tool.startsWith("zone") ? "zone" : "trend",
              color: (state.tool === "trend-red" || state.tool === "zone-red") ? "red" : state.tool === "zone" ? "gold" : "green",
              a: { time: t, price: p },
              b: { time: t, price: p }
            };
            updateHint("İkinci noktaya tıkla veya sürükleyip bırak (ESC: iptal).");
            requestOverlayDraw();
          } else {
            // Second click completes line/zone!
            finalizeTwoPointDrawing(dragDrawStart, { time: t, price: p });
            dragDrawStart = null;
            dragStartPx = null;
            state.previewDrawing = null;
            setTool(null);
          }
          return;
        }
      }

      // Not in drawing mode: check if user pressed on an existing drawing handle or body to move/resize!
      const hit = findHitObject(pos);
      if (hit && hit.type === "drawing" && hit.drawing && p && t != null) {
        ev.preventDefault();
        ev.stopPropagation();
        state.selectedObject = { type: "drawing", id: hit.id };
        positionActionBar(hit.drawing, pos);
        const d = hit.drawing;
        if (d.locked) {
          requestOverlayDraw();
          return;
        }
        setPanEnabled(false);
        editDrag = {
          id: d.id,
          handle: hit.handle,
          startTime: t,
          startPrice: p,
          origA: d.a ? { ...d.a } : null,
          origB: d.b ? { ...d.b } : null,
          origPrice: d.price
        };
        didMoveDuringMouseDown = false;
        requestOverlayDraw();
      }
    }, true);

    window.addEventListener("mousemove", ev => {
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = xToTime(pos.x);

      if (dragDrawStart && p && t != null) {
        if (dragStartPx && Math.hypot(pos.x - dragStartPx.x, pos.y - dragStartPx.y) > 8) {
          didMoveDuringMouseDown = true;
        }
        state.previewDrawing = {
          id: "__preview",
          __preview: true,
          type: dragDrawStart.tool.startsWith("zone") ? "zone" : "trend",
          color: (dragDrawStart.tool === "trend-red" || dragDrawStart.tool === "zone-red") ? "red" : dragDrawStart.tool === "zone" ? "gold" : "green",
          a: { time: dragDrawStart.time, price: dragDrawStart.price },
          b: { time: t, price: p }
        };
        requestOverlayDraw();
        return;
      }

      if (editDrag && p && t != null) {
        const d = state.drawings.find(x => x.id === editDrag.id);
        if (!d || d.locked) return;
        if (!editDrag.snapSaved) {
          pushHistory();
          editDrag.snapSaved = true;
        }
        didMoveDuringMouseDown = true;
        const dt = t - editDrag.startTime;
        const dp = p - editDrag.startPrice;
        if (editDrag.handle === "note-move") {
          if (d.type === "hline") {
            d.anchorTime = t;
          } else if (d.type === "note" && d.a) {
            d.a = { time: t, price: d.a.price };
          } else if (d.type === "trend") {
            const c = drawingCoords(d);
            if (c) {
              const dx = c.x2 - c.x1;
              const dy = c.y2 - c.y1;
              const len2 = dx * dx + dy * dy;
              const ratio = len2 > 4 ? ((pos.x - c.x1) * dx + (pos.y - c.y1) * dy) / len2 : 0.5;
              d.noteT = Math.max(0.05, Math.min(0.95, ratio));
            }
          } else if (d.type === "zone") {
            const c = drawingCoords(d);
            if (c) {
              const minX = Math.min(c.x1, c.x2), zw = Math.max(20, Math.abs(c.x2 - c.x1));
              d.noteRx = Math.max(0.03, Math.min(0.85, (pos.x - minX) / zw));
            }
          }
        } else if (editDrag.handle === "move") {
          if (d.type === "hline") {
            d.price = Math.max(0.00000001, editDrag.origPrice + dp);
            if (Number.isFinite(t)) d.anchorTime = t;
          } else if (d.type === "note" && editDrag.origA) {
            d.a = { time: editDrag.origA.time + dt, price: editDrag.origA.price + dp };
          } else if (d.a && d.b && editDrag.origA && editDrag.origB) {
            d.a = { time: editDrag.origA.time + dt, price: editDrag.origA.price + dp };
            d.b = { time: editDrag.origB.time + dt, price: editDrag.origB.price + dp };
          }
        } else if (editDrag.handle === "a" && d.a) {
          d.a = { time: t, price: p };
        } else if (editDrag.handle === "b" && d.b) {
          d.b = { time: t, price: p };
        } else if (editDrag.handle === "ab" && d.a && d.b) {
          d.a.time = t; d.b.price = p;
        } else if (editDrag.handle === "ba" && d.a && d.b) {
          d.b.time = t; d.a.price = p;
        }
        if (editDrag.handle !== "note-move") renderPriceLines();
        positionActionBar(d, pos);
        requestOverlayDraw();
        return;
      }

      if (ev.target && chartBox.contains(ev.target)) {
        if (!state.tool) {
          const hit = findHitObject(pos);
          const nextHover = hit && hit.type === "drawing" ? hit.id : null;
          if (nextHover !== state.hoveredId) {
            state.hoveredId = nextHover;
            requestOverlayDraw();
          }
          chartBox.style.cursor = hit
            ? (hit.drawing?.locked ? "not-allowed" : hit.handle === "note-move" ? "ew-resize" : (hit.handle === "move" ? "move" : "grab"))
            : "";
        } else {
          chartBox.style.cursor = "crosshair";
        }
      }
    }, true);

    window.addEventListener("mouseup", ev => {
      if (dragDrawStart && didMoveDuringMouseDown) {
        const pos = pointerToPoint(ev);
        const p = priceAt(pos.y);
        const t = xToTime(pos.x);
        if (p && t != null) finalizeTwoPointDrawing(dragDrawStart, { time: t, price: p });
        dragDrawStart = null;
        dragStartPx = null;
        state.previewDrawing = null;
        lastDragEndMs = Date.now();
        didMoveDuringMouseDown = false;
        setTool(null);
      }
      if (editDrag) {
        if (didMoveDuringMouseDown) {
          saveJSON("drawings", state.drawings);
          renderDrawingPanel();
          renderPriceLines();
          lastDragEndMs = Date.now();
        }
        didMoveDuringMouseDown = false;
        editDrag = null;
        setPanEnabled(!state.tool);
      }
    }, true);

    function closeCtxMenu() {
      $("v26-ctx-menu")?.classList.remove("show");
    }

    function openCtxMenu(ev) {
      const menu = $("v26-ctx-menu");
      if (!menu) return;
      const pos = pointerToPoint(ev);
      const p = priceAt(pos.y);
      const t = xToTime(pos.x);
      const hit = findHitObject(pos);
      if (hit && hit.type === "drawing") {
        state.selectedObject = { type: "drawing", id: hit.id };
        positionActionBar(hit.drawing, pos);
        renderPriceLines();
        requestOverlayDraw();
      }
      const priceStr = p > 0 ? fmtPrice(p) : "";
      const hasSel = state.selectedObject?.type === "drawing";
      menu.innerHTML = `
        <button type="button" data-ctx="select"><i class="fa-solid fa-arrow-pointer"></i><span>İmleç</span></button>
        <button type="button" data-ctx="trend-green" class="green"><i class="fa-solid fa-chart-line"></i><span>Yeşil Trend</span></button>
        <button type="button" data-ctx="trend-red" class="red"><i class="fa-solid fa-chart-line"></i><span>Kırmızı Trend</span></button>
        <button type="button" data-ctx="hline" class="cyan"><i class="fa-solid fa-grip-lines"></i><span>Yatay Çizgi</span></button>
        <button type="button" data-ctx="zone-green" class="green"><i class="fa-regular fa-square"></i><span>Destek Kutusu (Yeşil)</span></button>
        <button type="button" data-ctx="zone-red" class="red"><i class="fa-regular fa-square"></i><span>Direnç Kutusu (Kırmızı)</span></button>
        <button type="button" data-ctx="zone" class="gold"><i class="fa-regular fa-square"></i><span>Bölge Kutusu (Altın)</span></button>
        <button type="button" data-ctx="note" class="violet"><i class="fa-solid fa-font"></i><span>Not Ekle</span></button>
        <div class="v26-ctx-sep"></div>
        ${p > 0 ? `<button type="button" data-ctx="instant-note" class="violet"><i class="fa-solid fa-pen"></i><span>Buraya Not (${priceStr})</span></button>` : ""}
        ${p > 0 ? `<button type="button" data-ctx="instant-hline" class="cyan"><i class="fa-solid fa-minus"></i><span>Buraya Yatay (${priceStr})</span></button>` : ""}
        ${p > 0 ? `<button type="button" data-ctx="instant-alarm" class="green"><i class="fa-solid fa-bell"></i><span>Buraya Alarm (${priceStr})</span></button>` : ""}
        <div class="v26-ctx-sep"></div>
        <button type="button" data-ctx="undo" ${undoStack.length ? "" : "disabled"}><i class="fa-solid fa-rotate-left"></i><span>Geri Al (Ctrl+Z)</span></button>
        <button type="button" data-ctx="redo" ${redoStack.length ? "" : "disabled"}><i class="fa-solid fa-rotate-right"></i><span>İleri Al (Ctrl+Y)</span></button>
        <button type="button" data-ctx="fit" class="blue"><i class="fa-solid fa-compress"></i><span>Grafiği Sığdır</span></button>
        ${hasSel ? `<button type="button" data-ctx="del-sel" class="red"><i class="fa-solid fa-trash"></i><span>Seçili Çizimi Sil</span></button>` : ""}
        <button type="button" data-ctx="clear" class="red"><i class="fa-solid fa-trash-can"></i><span>Tümünü Temizle</span></button>
      `;
      const cw = chartBox.clientWidth || 600;
      const ch = chartBox.clientHeight || 400;
      menu.style.left = `${Math.max(8, Math.min(cw - 210, pos.x))}px`;
      menu.style.top = `${Math.max(8, Math.min(ch - 320, pos.y))}px`;
      menu.classList.add("show");
      menu.onclick = (mev) => {
        const btn = mev.target.closest("[data-ctx]");
        if (!btn) return;
        const act = btn.dataset.ctx;
        closeCtxMenu();
        if (act === "select") setTool(null);
        else if (act === "trend-green" || act === "trend-red" || act === "hline" || act === "zone" || act === "zone-green" || act === "zone-red" || act === "note") setTool(act);
        else if (act === "instant-note" && p > 0 && t != null) {
          const d = addNote(t, p, "");
          if (d) openNoteEditor(d.id, pos);
        } else if (act === "instant-hline" && p > 0) addHLine(p, t);
        else if (act === "instant-alarm" && p > 0) addAlarmFromPrice(p);
        else if (act === "undo") undoDrawing();
        else if (act === "redo") redoDrawing();
        else if (act === "fit") fitChart();
        else if (act === "del-sel") deleteSelectedObject();
        else if (act === "clear") clearDrawingsForSymbol();
      };
    }

    chartBox.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      openCtxMenu(ev);
    }, true);

    window.addEventListener("mousedown", ev => {
      const menu = $("v26-ctx-menu");
      if (menu && menu.classList.contains("show") && !menu.contains(ev.target)) closeCtxMenu();
    }, true);

    chartBox.addEventListener("click", ev => {
      closeCtxMenu();
      if (state.tool || (Date.now() - lastDragEndMs < 220)) {
        return;
      }
      const pos = pointerToPoint(ev);
      const hit = findHitObject(pos);
      if (hit) {
        if (hit.type === "drawing" && hit.drawing?.type === "hline" && hit.handle !== "note-move") {
          const tClick = xToTime(pos.x);
          if (Number.isFinite(tClick)) {
            hit.drawing.anchorTime = tClick;
            saveJSON("drawings", state.drawings);
          }
        }
        state.selectedObject = { type: hit.type, id: hit.id, _isAlarm: hit._isAlarm };
        positionActionBar(hit.drawing || hit, pos);
      } else {
        state.selectedObject = null;
        positionActionBar(null);
      }
      renderPriceLines();
      requestOverlayDraw();
    });

    chartBox.addEventListener("dblclick", ev => {
      const pos = pointerToPoint(ev);
      const hit = findHitObject(pos);
      if (hit && hit.type === "drawing") {
        state.selectedObject = { type: "drawing", id: hit.id };
        openNoteEditor(hit.id, pos);
        return;
      }
      const rect = chartBox.getBoundingClientRect();
      if (ev.clientX - rect.left > rect.width - 95) resetPriceScale();
      else fitChart();
    });

    window.addEventListener("keydown", ev => {
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (ev.key === "Escape") {
        dragDrawStart = null;
        state.previewDrawing = null;
        closeCtxMenu();
        closeNoteEditor();
        if (state.tool) setTool(null);
        requestOverlayDraw();
      } else if (!inInput && (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) redoDrawing();
        else undoDrawing();
      } else if (!inInput && (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        redoDrawing();
      } else if ((ev.key === "Delete" || ev.key === "Backspace") && state.selectedObject && !inInput) {
        deleteSelectedObject();
      }
    });

    $("v26-tv-trash")?.addEventListener("click", () => deleteSelectedObject());
    $("v26-tv-note-btn")?.addEventListener("click", () => {
      if (state.selectedObject?.type === "drawing") openNoteEditor(state.selectedObject.id);
    });
    const mutateSelectedDrawing = (fn) => {
      if (state.selectedObject?.type !== "drawing") return;
      const d = state.drawings.find(x => x.id === state.selectedObject.id);
      if (!d) return;
      pushHistory();
      fn(d);
      saveJSON("drawings", state.drawings);
      renderDrawings();
      positionActionBar(d);
    };
    $("v26-act-colors")?.querySelectorAll("[data-draw-color]").forEach(btn => {
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        const col = btn.dataset.drawColor;
        mutateSelectedDrawing(d => { d.color = col; });
      });
    });
    $("v26-act-width")?.addEventListener("click", ev => {
      ev.stopPropagation();
      mutateSelectedDrawing(d => {
        const cur = Number(d.lineWidth) || 2;
        d.lineWidth = cur >= 4 ? 1 : cur + 1;
      });
    });
    $("v26-act-style")?.addEventListener("click", ev => {
      ev.stopPropagation();
      mutateSelectedDrawing(d => {
        const curDashed = d.type === "note" ? d.lineStyle !== "solid" : d.lineStyle === "dashed";
        d.lineStyle = curDashed ? "solid" : "dashed";
      });
    });
    $("v26-act-lock")?.addEventListener("click", ev => {
      ev.stopPropagation();
      mutateSelectedDrawing(d => {
        d.locked = !d.locked;
        showToast(d.locked ? "Çizim kilitlendi." : "Çizim kilidi açıldı.");
      });
    });
    const saveNote = () => {
      if (!activeNoteTargetId) return closeNoteEditor();
      const d = state.drawings.find(x => x.id === activeNoteTargetId);
      const val = $("v26-note-input")?.value.trim() || "";
      if (d && d.note !== val) {
        pushHistory();
        d.note = val;
        saveJSON("drawings", state.drawings);
        renderDrawings();
        if (state.selectedObject?.type === "drawing" && state.selectedObject.id === d.id) {
          positionActionBar(d);
        }
      }
      closeNoteEditor();
    };
    $("v26-note-save")?.addEventListener("click", saveNote);
    $("v26-note-cancel")?.addEventListener("click", closeNoteEditor);
    $("v26-note-input")?.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); saveNote(); }
      else if (ev.key === "Escape") closeNoteEditor();
    });
  }

  function finalizeTwoPointDrawing(start, end) {
    if (!start || !end) return;
    if (start.tool === "zone" || start.tool === "zone-green" || start.tool === "zone-red") {
      const col = start.tool === "zone-green" ? "green" : start.tool === "zone-red" ? "red" : "gold";
      addZone(start, end, col);
    } else {
      addTrend({ ...start, color: start.tool === "trend-red" ? "red" : "green" }, end);
    }
  }

  function pointerToPoint(ev) {
    const box = $("v26-tv-chart");
    const rect = box.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function priceAt(y) {
    try { return state.candleSeries.coordinateToPrice(y); } catch (_) { return null; }
  }

  function setTool(tool) {
    state.tool = tool;
    if (tool) {
      state.selectedObject = null;
      positionActionBar(null);
      closeNoteEditor();
      renderPriceLines();
      requestOverlayDraw();
    }
    if (state.chart) {
      state.chart.applyOptions({
        handleScroll: { mouseWheel: true, pressedMouseMove: !tool, horzTouchDrag: !tool, vertTouchDrag: !tool }
      });
    }
    const activeKey = tool || "select";
    document.querySelectorAll(".v26-tv-btn[data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === activeKey));
    const hint = $("v26-tv-hint");
    if (!hint) return;
    if (!tool) {
      hint.classList.remove("show");
      hint.textContent = "";
      return;
    }
    const labels = {
      alarm: "Grafikte alarm kurmak istediğin seviyeye tıkla.",
      hline: "Yatay fiyat çizgisi için grafikte seviyeye tıkla.",
      "trend-green": "1. noktaya tıkla ve 2. noktaya taşı (veya sürükle).",
      "trend-red": "1. noktaya tıkla ve 2. noktaya taşı (veya sürükle).",
      zone: "Bölge kutusu için 1. köşeden 2. köşeye tıkla/sürükle.",
      note: "Grafikte not eklemek istediğin yere tıkla."
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
    requestOverlayDraw();
  }

  function fitChart() {
    if (!state.chart) return;
    state.chart.priceScale("right").applyOptions({ autoScale: true });
    try {
      const len = state.candles.length;
      if (len > 135) {
        state.chart.timeScale().setVisibleLogicalRange({ from: len - 135, to: len + 6 });
      } else {
        state.chart.timeScale().fitContent();
      }
    } catch (_) {}
    requestOverlayDraw();
  }

  function clearPreview() {
    state.previewDrawing = null;
    requestOverlayDraw();
  }

  const candleCache = new Map();
  const tickerCache = new Map();
  const inFlightCandles = new Map();
  let refreshSeq = 0;

  async function fetchCandles(p, tfObj, bypassCache = false) {
    const cacheKey = `${p.exchange}:${p.pair}:${tfObj.key}`;
    const hit = candleCache.get(cacheKey);
    if (!bypassCache && hit && Date.now() - hit.ts < 300000) return hit.data;
    if (inFlightCandles.has(cacheKey)) return inFlightCandles.get(cacheKey);

    const req = (async () => {
      if (p.exchange === "okx") {
        const instId = `${p.symbol}-${p.quote}`;
        const url = `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=${encodeURIComponent(tfObj.okx)}&limit=${tfObj.limit}`;
        const json = await fetch(url, { cache: "no-store" }).then(r => r.json());
        if (!json || json.code !== "0") throw new Error("OKX veri hatası");
        const data = json.data.map(k => ({
          time: Math.floor(Number(k[0]) / 1000),
          open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]),
          volume: Number(k[5] || 0)
        })).reverse();
        candleCache.set(cacheKey, { ts: Date.now(), data });
        return data;
      }

      const fetchFapi = async () => {
        const fUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(p.pair)}&interval=${encodeURIComponent(tfObj.binance)}&limit=${tfObj.limit}`;
        const fArr = await fetch(fUrl, { cache: "no-store" }).then(r => r.json());
        if (!Array.isArray(fArr) || !fArr.length) throw new Error("Binance veri hatası");
        if (!window.__v26FapiOnlySet) window.__v26FapiOnlySet = new Set();
        window.__v26FapiOnlySet.add(p.pair);
        p.market = "fapi";
        return fArr;
      };

      let arr;
      if (p.market === "fapi") {
        arr = await fetchFapi();
      } else {
        const sUrl = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(p.pair)}&interval=${encodeURIComponent(tfObj.binance)}&limit=${tfObj.limit}`;
        const sArr = await fetch(sUrl, { cache: "no-store" }).then(r => r.json()).catch(() => null);
        if (Array.isArray(sArr) && sArr.length) arr = sArr;
        else arr = await fetchFapi();
      }

      const data = arr.map(k => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]),
        volume: Number(k[5] || 0)
      }));
      candleCache.set(cacheKey, { ts: Date.now(), data });
      return data;
    })().finally(() => {
      inFlightCandles.delete(cacheKey);
    });

    inFlightCandles.set(cacheKey, req);
    return req;
  }

  function prefetchPinnedTimeframes(p) {
    const tfs = TF.filter(t => PINNED_TF.includes(t.key) && t.key !== state.currentTf);
    tfs.forEach((tfObj, idx) => {
      const key = `${p.exchange}:${p.pair}:${tfObj.key}`;
      const hit = candleCache.get(key);
      if (hit && Date.now() - hit.ts < 120000) return;
      setTimeout(() => {
        const cur = plan();
        if (cur.pair !== p.pair || cur.exchange !== p.exchange) return;
        fetchCandles(p, tfObj).catch(() => {});
      }, 250 + idx * 180);
    });
  }

  async function fetchTicker(p) {
    const tKey = `${p.exchange}:${p.pair}`;
    const hit = tickerCache.get(tKey);
    if (hit && Date.now() - hit.ts < 12000) return hit.data;
    try {
      let res = null;
      if (p.exchange === "okx") {
        const instId = `${p.symbol}-${p.quote}`;
        const json = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`, { cache: "no-store" }).then(r => r.json());
        const t = json?.data?.[0];
        if (t) {
          const last = Number(t.last || 0);
          const open24h = Number(t.open24h || 0);
          res = { price: last, changePct: open24h ? ((last - open24h) / open24h) * 100 : 0 };
        }
      } else {
        let json = null;
        if (p.market === "fapi") {
          json = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(p.pair)}`, { cache: "no-store" }).then(r => r.json());
        } else {
          json = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(p.pair)}`, { cache: "no-store" }).then(r => r.json()).catch(() => null);
          if (!json || !json.lastPrice) {
            json = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(p.pair)}`, { cache: "no-store" }).then(r => r.json()).catch(() => null);
          }
        }
        if (json && json.lastPrice) {
          res = { price: Number(json.lastPrice || 0), changePct: Number(json.priceChangePercent || 0) };
        }
      }
      if (res) tickerCache.set(tKey, { ts: Date.now(), data: res });
      return res;
    } catch (_) {
      return hit?.data || null;
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
    if (title) title.textContent = p.displayTitle || p.pair;
    if (sub) sub.textContent = `${p.exchange === "okx" ? "OKX" : (p.market === "fapi" ? "Binance TradFi / Futures" : "Binance")} · ${tf.label} · ${state.candles.length} mum`;
    if (ticker?.price) state.price = ticker.price;
    else if (state.candles.length) state.price = state.candles[state.candles.length - 1].close;
    if (priceEl) priceEl.textContent = fmtPrice(state.price);
    if (chEl) {
      const ch = number(ticker?.changePct, 0);
      chEl.textContent = `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`;
      chEl.className = ch >= 0 ? "up" : "down";
    }
  }

  function computeMA(candles, period) {
    const out = [];
    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      if (i >= period) sum -= candles[i - period].close;
      if (i >= period - 1) out.push({ time: candles[i].time, value: sum / period });
    }
    return out;
  }

  let klineWs = null;
  let klineWsKey = "";
  let wsPriceLineTimer = 0;

  function closeKlineWS() {
    if (klineWs) {
      try { klineWs.onclose = null; klineWs.close(); } catch (_) {}
      klineWs = null;
    }
    klineWsKey = "";
  }

  function connectKlineWS(p, tfObj) {
    if (p.exchange !== "binance") {
      closeKlineWS();
      return;
    }
    const wsHost = p.market === "fapi" ? "wss://fstream.binance.com/ws" : "wss://stream.binance.com:9443/ws";
    const nextKey = `${p.market || "spot"}:${p.pair}:${tfObj.binance}`;
    if (klineWsKey === nextKey && klineWs && klineWs.readyState <= 1) return;
    closeKlineWS();
    klineWsKey = nextKey;

    try {
      const ws = new WebSocket(`${wsHost}/${p.pair.toLowerCase()}@kline_${tfObj.binance}`);
      klineWs = ws;
      ws.onmessage = (ev) => {
        if (klineWs !== ws) return;
        let msg;
        try { msg = JSON.parse(ev.data); } catch (_) { return; }
        const k = msg?.k;
        if (!k || !state.candleSeries) return;

        const bar = {
          time: Math.floor(Number(k.t) / 1000),
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
          volume: Number(k.v || 0)
        };
        if (!bar.time || !bar.close) return;

        state.price = bar.close;
        const priceEl = $("crypto-v10-price");
        if (priceEl) priceEl.textContent = fmtPrice(bar.close);

        const last = state.candles[state.candles.length - 1];
        if (last && last.time === bar.time) {
          state.candles[state.candles.length - 1] = bar;
        } else if (!last || bar.time > last.time) {
          state.candles.push(bar);
          if (state.candles.length > 1050) state.candles.shift();
        }

        const cKey = `${p.exchange}:${p.pair}:${tfObj.key}`;
        const hit = candleCache.get(cKey);
        if (hit) hit.ts = Date.now();

        state.candleSeries.update(bar);
        state.volumeSeries.update({
          time: bar.time,
          value: bar.volume,
          color: bar.close >= bar.open ? "rgba(0,200,121,.28)" : "rgba(240,68,68,.28)"
        });

        const updMa = (series, period) => {
          if (!series || state.candles.length < period) return;
          let sum = 0;
          for (let i = state.candles.length - period; i < state.candles.length; i++) sum += state.candles[i].close;
          series.update({ time: bar.time, value: sum / period });
        };
        updMa(state.ma7Series, 7);
        updMa(state.ma25Series, 25);
        updMa(state.ma99Series, 99);

        if (!wsPriceLineTimer) {
          wsPriceLineTimer = setTimeout(() => {
            wsPriceLineTimer = 0;
            window.dispatchEvent(new CustomEvent("v26-crypto-candles-updated"));
            renderPriceLines();
            requestOverlayDraw();
            checkAlarms();
          }, 220);
        }
      };
      ws.onclose = () => {
        if (klineWs === ws) {
          klineWs = null;
          const savedKey = klineWsKey;
          klineWsKey = "";
          setTimeout(() => {
            const cur = plan();
            const curTf = TF.find(x => x.key === state.currentTf) || TF[0];
            if (`${cur.market || "spot"}:${cur.pair}:${curTf.binance}` === savedKey) connectKlineWS(cur, curTf);
          }, 3000);
        }
      };
    } catch (_) {}
  }

  function renderCandlesToChart(p, candles, ticker, force) {
    state.candles = candles.filter(c => c.time && c.open && c.high && c.low && c.close);
    if (!state.candles.length) return;

    const volume = state.candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(0,200,121,.28)" : "rgba(240,68,68,.28)"
    }));

    const applyScaledCandles = () => {
      if (!state.candles.length) return;
      state.candleSeries.setData(state.candles);
      if (state.ma7Series) state.ma7Series.setData(computeMA(state.candles, 7));
      if (state.ma25Series) state.ma25Series.setData(computeMA(state.candles, 25));
      if (state.ma99Series) state.ma99Series.setData(computeMA(state.candles, 99));
    };

    window.v26CryptoReplotCandles = () => {
      if (!state.candleSeries || !state.candles.length) return;
      applyScaledCandles();
      renderPriceLines();
      requestOverlayDraw();
    };

    window.v26CryptoUpdatePriceLines = () => {
      if (!state.candleSeries) return;
      renderPriceLines();
    };

    applyScaledCandles();
    state.volumeSeries.setData(volume);
    updateHeader(p, ticker);
    window.dispatchEvent(new CustomEvent("v26-crypto-candles-updated"));
    renderPriceLines();
    renderDrawings();
    updateTpOutputs();
    renderAlarms();
    status("CANLI", "ok");
    if (force) fitChart();
    checkAlarms();
    const tf = TF.find(x => x.key === state.currentTf) || TF[0];
    connectKlineWS(p, tf);
  }

  async function refresh(force = false) {
    const seq = ++refreshSeq;
    try {
      if (!state.chart) {
        await loadLWC();
        injectStyles();
        createShell();
        installToolbar();
        installTimeframes();
        createChart();
      } else {
        installToolbar();
        if (!$("v26-tf-more-btn")) installTimeframes();
      }

      const p = plan();
      const tf = TF.find(x => x.key === state.currentTf) || TF[0];
      const cacheKey = `${p.exchange}:${p.pair}:${tf.key}`;
      const cached = candleCache.get(cacheKey);
      const cachedTicker = tickerCache.get(`${p.exchange}:${p.pair}`)?.data || null;

      if (cached && cached.data && cached.data.length) {
        renderCandlesToChart(p, cached.data, cachedTicker, force);
        if (Date.now() - cached.ts > 15000) {
          Promise.all([fetchCandles(p, tf, true), fetchTicker(p)]).then(([freshCandles, freshTicker]) => {
            if (seq !== refreshSeq) return;
            renderCandlesToChart(p, freshCandles, freshTicker, false);
          }).catch(() => {});
        }
        prefetchPinnedTimeframes(p);
        return;
      }

      status("YÜKLENİYOR", "");
      const [candles, ticker] = await Promise.all([fetchCandles(p, tf), fetchTicker(p)]);
      if (seq !== refreshSeq) return;
      renderCandlesToChart(p, candles, ticker, force);
      prefetchPinnedTimeframes(p);
    } catch (err) {
      if (seq !== refreshSeq) return;
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

  function computeAtr14Pct(candles) {
    if (!Array.isArray(candles) || candles.length < 2) return 0;
    const len = candles.length;
    const start = Math.max(1, len - 14);
    let sum = 0;
    let count = 0;
    for (let i = start; i < len; i++) {
      const c = candles[i];
      const prevClose = candles[i - 1].close;
      const tr = Math.max(
        c.high - c.low,
        Math.abs(c.high - prevClose),
        Math.abs(c.low - prevClose)
      );
      sum += tr;
      count++;
    }
    const lastClose = candles[len - 1].close || state.price || 0;
    if (!count || lastClose <= 0) return 0;
    const atr = sum / count;
    return (atr / lastClose) * 100;
  }

  window.v26GetCryptoMarketMeta = () => ({
    price: state.price || (state.candles.length ? state.candles[state.candles.length - 1].close : 0),
    atrPct: computeAtr14Pct(state.candles)
  });

  function renderPriceLines() {
    if (!state.candleSeries) return;
    clearPriceLines();
    const p = plan();
    const add = (price, title, color, style = 2, lineVisible = true, lineWidth = 2) => {
      if (!price || price <= 0) return;
      const line = state.candleSeries.createPriceLine({
        price,
        color,
        lineWidth: Number(lineWidth) || 2,
        lineStyle: style,
        lineVisible,
        axisLabelVisible: true,
        title
      });
      state.priceLines.push(line);
    };

    add(p.stop, "STOP", "#ef4444", 0);
    add(p.liq, "LIQ", "#f97316", 2);
    p.tps.forEach(t => add(t.price, `TP${t.idx} %${t.pct || 0}`, "#10b981", 0));
    state.alarms.filter(a => a.key === alarmKey()).forEach(a => add(a.price, a.dir === "above" ? "ALARM ÜST" : "ALARM ALT", a.hit ? "#10b981" : "#3b82f6", 1));

    const sc = window.__v26ScalpLines;
    if (sc && sc.enabled) {
      if (sc.showLong !== false) {
        add(sc.longLiq, "LONG LİKİT", "#ef4444", 2);
        add(sc.longTp, "LONG TP", "#10b981", 1);
      }
      if (sc.showShort) {
        add(sc.shortLiq, "SHORT LİKİT", "#f97316", 2);
        add(sc.shortTp, "SHORT TP", "#14b8a6", 1);
      }
    }

    // Always keep Note & HLine price lines + right-axis price tags continuously visible!
    state.drawings.filter(d => isDrawingForCurrentPair(d, p)).forEach(d => {
      const cHex = getDrawingColor(d).hex;
      const lw = Number(d.lineWidth) || 2;
      const lStyle = (d.type === "note" ? d.lineStyle !== "solid" : d.lineStyle === "dashed") ? 2 : 0;
      if (d.type === "note" && d.a?.price) {
        add(d.a.price, d.note ? d.note.slice(0, 14) : "NOT", cHex, lStyle, true, lw);
      } else if (d.type === "hline" && d.price) {
        add(d.price, d.note ? d.note.slice(0, 14) : "YATAY", cHex, lStyle, false, lw);
      }
    });

    // Show temporary colored price tag on right Y-axis for selected Trend/Zone endpoints
    if (state.selectedObject?.type === "drawing") {
      const sel = state.drawings.find(x => x.id === state.selectedObject.id && isDrawingForCurrentPair(x, p));
      if (sel) {
        const cHex = getDrawingColor(sel).hex;
        if (sel.type === "trend" && sel.a && sel.b) {
          add(sel.b.price, "SON", cHex, 2, false);
          add(sel.a.price, "BAŞ", cHex, 2, false);
        } else if (sel.type === "zone" && sel.a && sel.b) {
          add(Math.max(sel.a.price, sel.b.price), "ÜST", cHex, 2, false);
          add(Math.min(sel.a.price, sel.b.price), "ALT", cHex, 2, false);
        }
      }
    }
  }

  function renderDrawings() {
    if (!state.chart) return;
    if (state.extraSeries.length) {
      state.extraSeries.forEach(s => { try { state.chart.removeSeries(s); } catch (_) {} });
      state.extraSeries = [];
    }
    requestOverlayDraw();
    renderDrawingPanel();
    renderPriceLines();
  }

  function renderDrawingPanel() {
    const box = $("drawing-v14-panel");
    if (!box) return;
    const p = plan();
    const list = state.drawings.filter(d => isDrawingForCurrentPair(d, p));
    if (!list.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = list.map(d => {
      const cls = d.type === "trend" ? d.color : (d.type === "zone" ? "zone" : (d.type === "note" ? "note" : "hline"));
      let title = `Fiyat çizgisi ${fmtPrice(d.price)}`;
      if (d.type === "trend") title = `${d.color === "red" ? "Kırmızı" : "Yeşil"} trend`;
      else if (d.type === "zone") title = `Bölge (${fmtPrice(d.a?.price)} - ${fmtPrice(d.b?.price)})`;
      else if (d.type === "note") title = `Not @ ${fmtPrice(d.a?.price || d.price)}`;
      const noteText = d.note ? ` · ${cssEscape(d.note)}` : "";
      return `<div class="drawing-v14-row ${cls}"><div><b>${title}${noteText}</b><br><span>${cssEscape(p.pair)}</span></div><button onclick="window.v26CryptoDeleteDrawing(${d.id})"><i class="fa-solid fa-trash"></i></button></div>`;
    }).join("");
  }

  const undoStack = [];
  const redoStack = [];

  function cloneDrawings() {
    return JSON.parse(JSON.stringify(state.drawings.map(({ __noteRect, ...rest }) => rest)));
  }

  function updateHistoryButtons() {
    const uBtn = document.querySelector('[data-tool="undo"]');
    const rBtn = document.querySelector('[data-tool="redo"]');
    if (uBtn) uBtn.classList.toggle("disabled", !undoStack.length);
    if (rBtn) rBtn.classList.toggle("disabled", !redoStack.length);
  }

  function pushHistory() {
    undoStack.push(cloneDrawings());
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function undoDrawing() {
    if (!undoStack.length) return showToast("Geri alınacak işlem yok.");
    redoStack.push(cloneDrawings());
    state.drawings = undoStack.pop();
    state.selectedObject = null;
    positionActionBar(null);
    closeNoteEditor();
    saveJSON("drawings", state.drawings);
    renderDrawings();
    updateHistoryButtons();
  }

  function redoDrawing() {
    if (!redoStack.length) return showToast("İleri alınacak işlem yok.");
    undoStack.push(cloneDrawings());
    state.drawings = redoStack.pop();
    state.selectedObject = null;
    positionActionBar(null);
    closeNoteEditor();
    saveJSON("drawings", state.drawings);
    renderDrawings();
    updateHistoryButtons();
  }

  function addHLine(price, anchorTime = null) {
    pushHistory();
    const d = { id: Date.now(), type: "hline", key: drawingPairKey(), price, anchorTime, note: "" };
    state.drawings.push(d);
    state.selectedObject = { type: "drawing", id: d.id };
    saveJSON("drawings", state.drawings);
    renderDrawings();
    positionActionBar(d);
    showToast("Yatay çizgi eklendi.");
    return d;
  }

  function addTrend(a, b) {
    if (!a || !b || (a.time === b.time && a.price === b.price)) return null;
    pushHistory();
    const [p1, p2] = a.time <= b.time ? [a, b] : [b, a];
    const d = {
      id: Date.now(),
      type: "trend",
      key: drawingPairKey(),
      color: a.color === "red" ? "red" : "green",
      a: { time: p1.time, price: p1.price },
      b: { time: p2.time, price: p2.price },
      note: ""
    };
    state.drawings.push(d);
    state.selectedObject = { type: "drawing", id: d.id };
    saveJSON("drawings", state.drawings);
    renderDrawings();
    positionActionBar(d);
    showToast("Trend çizgisi eklendi.");
    return d;
  }

  function addZone(a, b, color = "gold") {
    if (!a || !b) return null;
    pushHistory();
    const d = {
      id: Date.now(),
      type: "zone",
      key: drawingPairKey(),
      color: DRAW_COLORS[color] ? color : "gold",
      a: { time: a.time, price: a.price },
      b: { time: b.time, price: b.price },
      note: ""
    };
    state.drawings.push(d);
    state.selectedObject = { type: "drawing", id: d.id };
    saveJSON("drawings", state.drawings);
    renderDrawings();
    positionActionBar(d);
    showToast("Bölge eklendi.");
    return d;
  }

  function addNote(time, price, note = "") {
    if (!price) return null;
    pushHistory();
    const d = {
      id: Date.now(),
      type: "note",
      key: drawingPairKey(),
      a: { time, price },
      note
    };
    state.drawings.push(d);
    state.selectedObject = { type: "drawing", id: d.id };
    saveJSON("drawings", state.drawings);
    renderDrawings();
    positionActionBar(d);
    return d;
  }

  function clearDrawingsForSymbol() {
    const p = plan();
    if (!state.drawings.some(d => isDrawingForCurrentPair(d, p))) return;
    pushHistory();
    state.drawings = state.drawings.filter(d => !isDrawingForCurrentPair(d, p));
    state.selectedObject = null;
    positionActionBar(null);
    closeNoteEditor();
    saveJSON("drawings", state.drawings);
    renderDrawings();
    showToast("Çizimler silindi.");
  }

  function deleteDrawing(id) {
    if (!state.drawings.some(d => d.id === id)) return;
    pushHistory();
    state.drawings = state.drawings.filter(d => d.id !== id);
    if (state.selectedObject?.type === "drawing" && state.selectedObject.id === id) {
      state.selectedObject = null;
      positionActionBar(null);
      closeNoteEditor();
    }
    saveJSON("drawings", state.drawings);
    renderDrawings();
  }

  function deleteSelectedObject() {
    const o = state.selectedObject;
    if (!o) return;
    if (o.type === "alarm") deleteAlarm(o.id);
    if (o.type === "drawing") deleteDrawing(o.id);
    state.selectedObject = null;
    positionActionBar(null);
    closeNoteEditor();
  }

  function alarmKey(p = plan()) {
    return `${p.exchange}:${p.pair}`;
  }

  function addAlarmFromPrice(price) {
    const p = plan();
    const dir = price >= state.price ? "above" : "below";
    const item = { id: Date.now(), key: alarmKey(p), symbol: p.pair, exchange: p.exchange, price, dir, note: "Grafikten alarm", hit: false, created: new Date().toISOString() };
    state.alarms.push(item);
    saveJSON("alarms", state.alarms);
    renderAlarms();
    renderPriceLines();

    // V27 Alarm Merkezi ile senkronla
    try {
      if (window.V26AlarmCenter?.add) {
        window.V26AlarmCenter.add(`${p.exchange}:${p.pair}`, dir, price, "Grafikten alarm");
      }
    } catch (_) {}

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
        const msg = `ALARM: ${a.symbol} ${fmtPrice(a.price)}`;
        showToast(msg);
        try {
          window.dispatchEvent(new CustomEvent("v26-alarm-fired", { detail: { message: msg, alarm: a, price: state.price } }));
          if (window.V26AlarmAudio?.play) window.V26AlarmAudio.play(msg);
        } catch (_) {}
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
    if (rrEl) {
      if (stopPnl < 0) {
        const ratio = Math.abs(tpTotal / stopPnl).toFixed(2);
        rrEl.innerHTML = `<span class="v26-rr-risk">1</span><span class="v26-rr-sep">:</span><span class="v26-rr-reward">${ratio}</span>`;
      } else {
        rrEl.textContent = "-";
      }
    }
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
      addTpRow("", 50);
      addTpRow("", 50);
    } else {
      while (box.children.length > 2) {
        const last = box.lastElementChild;
        if (!last) break;
        const pVal = last.querySelector(".tp-price")?.value;
        if (pVal) break;
        last.remove();
      }
      [...box.querySelectorAll("input")].forEach(i => i.addEventListener("input", () => { renderPriceLines(); updateTpOutputs(); }));
    }
  }

  function installHeaderPairSearch() {
    const title = $("crypto-v10-title");
    if (!title || title.dataset.v26SearchBound === "1") return;
    title.dataset.v26SearchBound = "1";
    const headLeft = title.parentElement;
    if (!headLeft) return;
    headLeft.classList.add("v26-pair-head-trigger");
    headLeft.title = "Başka parite aramak için tıkla";

    // Subtle clickable search hint next to title without altering #crypto-v10-title.textContent
    if (!headLeft.querySelector(".v26-pair-search-badge")) {
      const badge = document.createElement("span");
      badge.className = "v26-pair-search-badge";
      badge.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i><span>Ara</span>';
      headLeft.appendChild(badge);
    }

    let pop = $("v26-header-pair-pop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "v26-header-pair-pop";
      pop.className = "v26-header-pair-pop";
      pop.innerHTML = `
        <div class="v26-hpp-search-row">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="v26-hpp-input" type="text" placeholder="Parite ara (BTC, ETH, XRP, NVDAB, NDX, XAU...)">
          <button type="button" id="v26-hpp-close" title="Kapat">×</button>
        </div>
        <div class="v26-hpp-list" id="v26-hpp-list"></div>
      `;
      const chartHead = headLeft.closest(".crypto-v10-chart-head");
      if (chartHead) {
        chartHead.style.position = "relative";
        chartHead.appendChild(pop);
      } else {
        document.body.appendChild(pop);
      }
    }

    const FALLBACK_COINS = [
      "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "SUI", "TRX",
      "LINK", "TON", "PEPE", "SHIB", "LTC", "ARB", "OP", "NEAR", "APT", "DOT",
      "NDX", "SPX", "XAU", "XAG", "WTI", "EURUSD"
    ];

    const renderPopList = (query = "") => {
      const listEl = $("v26-hpp-list");
      if (!listEl) return;
      const q = String(query || "").trim().toUpperCase();
      const liveList = Array.isArray(window.__v26BinanceList) ? window.__v26BinanceList : [];
      let rows = [];

      if (liveList.length) {
        rows = liveList
          .filter(r => !q || r.base.includes(q) || r.symbol.includes(q))
          .slice(0, 40)
          .map(r => ({
            base: r.base,
            pair: r.symbol,
            price: r.price,
            pct: r.pct
          }));
      }
      if (!rows.length) {
        rows = FALLBACK_COINS
          .filter(c => !q || c.includes(q))
          .slice(0, 30)
          .map(c => {
            const res = resolveMarketSymbol(c);
            return { base: c, pair: res.apiPair, price: 0, pct: 0 };
          });
      }
      if (q && !rows.some(r => r.base === q || r.pair === q)) {
        const cleanQ = q.replace(/[^A-Z0-9]/g, "");
        if (cleanQ) {
          const res = resolveMarketSymbol(cleanQ);
          rows.unshift({ base: res.base, pair: res.apiPair, price: 0, pct: 0, custom: true });
        }
      }

      listEl.innerHTML = rows.map(r => {
        const pctCls = Number(r.pct || 0) >= 0 ? "up" : "down";
        const prStr = r.price > 0 ? fmtPrice(r.price) : (r.custom ? "Doğrudan aç" : "");
        const pctStr = r.price > 0 ? `${r.pct >= 0 ? "+" : ""}${Number(r.pct || 0).toFixed(2)}%` : "";
        return `
          <button type="button" class="v26-hpp-row" data-hpp-pick="${cssEscape(r.base)}">
            <span class="v26-hpp-sym"><b>${cssEscape(r.base)}</b><em>${cssEscape(r.pair)}</em></span>
            <span class="v26-hpp-meta"><strong>${prStr}</strong>${pctStr ? `<em class="${pctCls}">${pctStr}</em>` : ""}</span>
          </button>
        `;
      }).join("");
    };

    const pickCoin = (base) => {
      if (!base) return;
      pop.classList.remove("show");
      if (typeof window.v26SelectMarketPair === "function") {
        window.v26SelectMarketPair(base);
      } else {
        const symEl = $("v10-symbol");
        if (symEl) {
          symEl.value = base;
          symEl.dispatchEvent(new Event("change", { bubbles: true }));
        }
        refresh(true);
      }
    };

    const openPop = () => {
      pop.classList.add("show");
      const inp = $("v26-hpp-input");
      if (inp) {
        inp.value = "";
        renderPopList("");
        setTimeout(() => { inp.focus(); inp.select(); }, 10);
      }
    };

    headLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pop.classList.contains("show")) pop.classList.remove("show");
      else openPop();
    });

    pop.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest("#v26-hpp-close")) {
        pop.classList.remove("show");
        return;
      }
      const row = e.target.closest("[data-hpp-pick]");
      if (row) pickCoin(row.dataset.hppPick);
    });

    const inp = $("v26-hpp-input");
    if (inp) {
      inp.addEventListener("input", () => renderPopList(inp.value));
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const first = pop.querySelector("[data-hpp-pick]");
          const raw = inp.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
          pickCoin(first ? first.dataset.hppPick : raw);
        } else if (e.key === "Escape") {
          pop.classList.remove("show");
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && !headLeft.contains(e.target)) {
        pop.classList.remove("show");
      }
    });
  }

  function boot() {
    injectStyles();
    createShell();
    installToolbar();
    installTimeframes();
    installHeaderPairSearch();
    ensureTpRows();
    installInputListeners();
    refresh(true);

    clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(() => refresh(false), 15000);
  }

  function installGlobals() {
    window.omega_V10RefreshCrypto = refresh;
    window.omega_TVRefreshCryptoChart = refresh;
    window.omega_InitV10Timeframes = installTimeframes;
    window.omega_V10SetTf = tf => {
      if (!tf) return;
      state.currentTf = tf;
      localStorage.setItem(LS_PREFIX + "tf", state.currentTf);
      installTimeframes();
      refresh(true);
    };
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
      const p = plan();
      const idx = [...state.drawings].map((d, i) => ({ d, i })).reverse().find(x => isDrawingForCurrentPair(x.d, p))?.i;
      if (idx !== undefined) {
        state.drawings.splice(idx, 1);
        state.selectedObject = null;
        positionActionBar(null);
        closeNoteEditor();
        saveJSON("drawings", state.drawings);
        renderDrawings();
      }
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
