// ===============================
// V26 CRYPTO PRO: TRADINGVIEW + 1x-100x LEVERAGE + BINANCE/CUSTOM WATCHLIST
// ===============================

(function () {
  const TV_SCRIPT_URL = "https://s3.tradingview.com/tv.js";
  const LS_MODE = "v26_crypto_chart_mode";
  const LS_LEV = "v26_crypto_view_lev";
  const LS_MY_LIST = "v26_crypto_my_pairs_v1";
  const LS_TP_MULT = "v26_crypto_scalp_tpmult";
  const LS_LONG = "v26_crypto_scalp_long";
  const LS_SHORT = "v26_crypto_scalp_short";

  const DEFAULT_MY_PAIRS = [
    "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "TRX", "LINK",
    "DOT", "SUI", "PEPE", "TON", "SHIB", "LTC", "UNI", "NEAR", "APT", "ARB"
  ];

  const TF_TO_TV = {
    "1m": "1", "3m": "3", "5m": "5", "15m": "15", "30m": "30",
    "1h": "60", "2h": "120", "4h": "240", "8h": "240", "12h": "720",
    "1d": "D", "3d": "D", "1w": "W", "1M": "M"
  };

  const state = {
    mode: localStorage.getItem(LS_MODE) || "tv", // "tv" | "lev"
    lev: Math.max(1, Math.min(100, Number(localStorage.getItem(LS_LEV) || 10))),
    maintMargin: 0.5,
    tpMult: Math.max(1.01, Number(localStorage.getItem(LS_TP_MULT) || 1.5)),
    showLong: localStorage.getItem(LS_LONG) !== "0",
    showShort: localStorage.getItem(LS_SHORT) !== "0",
    watchTab: "all", // "my" | "all" | "bstocks"
    sortBy: "vol", // "vol" | "pct" | "price" | "base"
    sortDir: "desc",
    volFirst: false, // toggle via ⇄ button
    search: "",
    myPairs: loadMyPairs(),
    binanceTickers: new Map(), // symbol (e.g. BTCUSDT) -> { symbol, base, price, pct, vol, market, isBStock }
    binanceList: [],
    bStocksSet: new Set(),
    assetLogos: new Map(),
    lastBinanceFetch: 0,
    tvLoaded: false,
    tvLoading: null,
    lastTvKey: "",
    mounted: false
  };

  window.__v26CryptoChartLev = state.lev;

  function loadMyPairs() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LS_MY_LIST) || "null");
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (_) {}
    return DEFAULT_MY_PAIRS.slice();
  }

  function saveMyPairs() {
    try {
      localStorage.setItem(LS_MY_LIST, JSON.stringify(state.myPairs));
    } catch (_) {}
  }

  function $(id) { return document.getElementById(id); }

  function currentPairInfo() {
    const exchange = ($("v10-exchange")?.value || "binance").toUpperCase();
    const quote = ($("v10-quote")?.value || "USDT").toUpperCase();
    const symbol = ($("v10-symbol")?.value || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    const tf = localStorage.getItem("v26_lwc_tf") || "1h";
    return { exchange, quote, symbol, pair: symbol + quote, tf };
  }

  function fmtPrice(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n) || n <= 0) return "$-";
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return "$" + n.toPrecision(4);
  }

  function fmtPct(pct, mult = 1) {
    const n = Number(pct || 0) * mult;
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  function fmtVol(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n) || n <= 0) return "-";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toFixed(0);
  }

  const LOGO_ALIAS_FALLBACK = {
    XAU: "PAXG", XAUUSD: "PAXG", GOLD: "PAXG", ALTIN: "PAXG",
    NDX: "QQQB", NASDAQ: "QQQB", NAS100: "QQQB", US100: "QQQB", NDX100: "QQQB", QQQ: "QQQB",
    SPX: "SPYB", SPX500: "SPYB", SP500: "SPYB", US500: "SPYB", SPY: "SPYB",
    AAPL: "AAPLB", TSLA: "TSLAB", NVDA: "NVDAB", MSFT: "MSFTB", AMZN: "AMZNB",
    META: "METAB", GOOGL: "GOOGLB", AMD: "AMDB", INTC: "INTCB", PLTR: "PLTRB",
    COIN: "COINB", MSTR: "MSTRB", HOOD: "HOODB", ORCL: "ORCLB", AVGO: "AVGOB",
    BABA: "BABAB", TSM: "TSMB", QCOM: "QCOMB", MU: "MUB"
  };

  function getAssetLogoUrl(base, apiPair) {
    const cleanBase = String(base || "").toUpperCase();
    const apiBase = String(apiPair || "").replace(/USDT$/, "").toUpperCase();
    return state.assetLogos.get(cleanBase)
      || state.assetLogos.get(apiBase)
      || state.assetLogos.get(LOGO_ALIAS_FALLBACK[cleanBase] || "")
      || state.assetLogos.get(cleanBase + "B")
      || "";
  }

  function logoBadgeHtml(base, apiPair, display) {
    const url = getAssetLogoUrl(base, apiPair);
    const letter = String(display || base || "?").slice(0, 2);
    if (url) {
      return `<span class="v26-coin-ico"><img src="${url}" alt="${display}" referrerpolicy="no-referrer" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';"><span class="v26-coin-fb" style="display:none;">${letter}</span></span>`;
    }
    return `<span class="v26-coin-ico"><span class="v26-coin-fb">${letter}</span></span>`;
  }

  const NON_BSTOCK_BUSDT = new Set(["BNBUSDT", "SHIBUSDT", "ARBUSDT", "CKBUSDT", "DGBUSDT", "TRBUSDT", "BBUSDT", "YBUSDT"]);
  function detectIsBStock(sym) {
    if (state.bStocksSet && state.bStocksSet.size) return state.bStocksSet.has(sym);
    return sym.endsWith("BUSDT") && sym.length > 5 && !NON_BSTOCK_BUSDT.has(sym);
  }

  function loadTradingViewScript() {
    if (window.TradingView && typeof window.TradingView.widget === "function") {
      state.tvLoaded = true;
      return Promise.resolve();
    }
    if (state.tvLoading) return state.tvLoading;
    state.tvLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TV_SCRIPT_URL;
      s.async = true;
      s.onload = () => {
        state.tvLoaded = true;
        resolve();
      };
      s.onerror = () => reject(new Error("TradingView script yüklenemedi"));
      document.head.appendChild(s);
    });
    return state.tvLoading;
  }

  async function renderTradingViewWidget(force = false) {
    const host = $("v26-tv-widget-host");
    if (!host || state.mode !== "tv") return;

    const p = currentPairInfo();
    const tvSymbol = `${p.exchange}:${p.pair}`;
    const tvInterval = TF_TO_TV[p.tf] || "60";
    const key = `${tvSymbol}:${tvInterval}`;
    if (!force && state.lastTvKey === key && host.children.length > 0) return;

    state.lastTvKey = key;
    host.innerHTML = '<div class="v26-tv-loading">TradingView grafiği yükleniyor...</div>';

    try {
      await loadTradingViewScript();
      if (state.mode !== "tv") return;
      host.innerHTML = '<div id="v26-tv-widget-inner" style="width:100%;height:580px;"></div>';
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: tvInterval,
        timezone: "Europe/Istanbul",
        theme: "dark",
        style: "1",
        locale: "tr",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        withdateranges: true,
        save_image: true,
        container_id: "v26-tv-widget-inner"
      });
    } catch (_) {
      host.innerHTML = '<div class="v26-tv-loading">TradingView yüklenemedi. Kaldıraçlı Grafik modunu kullanabilirsin.</div>';
    }
  }

  function applyChartMode() {
    state.mode = "binance";
    const tvHost = $("v26-tv-widget-host");
    const lwcWrap = document.querySelector("#omega-crypto-block .crypto-v12-chart-wrap");
    const lwcToolbar = document.querySelector("#omega-crypto-block .crypto-v12-toolbar");
    const tfBar = $("crypto-v10-timeframes");

    if (tvHost) tvHost.style.display = "none";
    if (lwcWrap) lwcWrap.style.display = "block";
    if (lwcToolbar) lwcToolbar.style.display = "";
    if (tfBar) tfBar.style.display = "flex";
    if (typeof window.v26CryptoReplotCandles === "function") {
      window.v26CryptoReplotCandles();
    }
  }

  function setLeverage(nextLev) {
    const n = Math.max(1, Math.min(100, Math.round(Number(nextLev) || 1)));
    state.lev = n;
    window.__v26CryptoChartLev = n;
    localStorage.setItem(LS_LEV, String(n));

    const inp = $("v26-lev-custom");
    if (inp && Number(inp.value) !== n) inp.value = String(n);

    document.querySelectorAll("[data-v26-lev]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.v26Lev) === n);
    });

    updateScalpPanel();
    if (typeof window.v26CryptoUpdatePriceLines === "function") {
      window.v26CryptoUpdatePriceLines();
    }
  }

  function updateHeaderLeverageBadge() {
    const badge = $("v26-header-lev-badge");
    if (badge) badge.style.display = "none";
  }

  function updateScalpPanel() {
    const panel = $("v26-scalp-panel");
    if (!panel) return;
    const p = currentPairInfo();
    const resolved = resolveSymbol(p.symbol);
    const meta = typeof window.v26GetCryptoMarketMeta === "function" ? window.v26GetCryptoMarketMeta() : { price: 0, atrPct: 0 };
    const tick = state.binanceTickers.get(resolved.apiPair);
    const price = Number(meta.price || tick?.price || 0);
    const atrPct = Number(meta.atrPct || 0);
    const lev = Math.max(1, Number(state.lev || 10));

    const liqPct = Math.max((100 / lev) - state.maintMargin, 0.15);
    const tpMovePct = ((state.tpMult - 1) * 100) / lev;
    const longLiq = price > 0 ? price * (1 - liqPct / 100) : 0;
    const shortLiq = price > 0 ? price * (1 + liqPct / 100) : 0;
    const longTp = price > 0 ? price * (1 + tpMovePct / 100) : 0;
    const shortTp = price > 0 ? price * (1 - tpMovePct / 100) : 0;

    const safeLev = atrPct > 0 ? Math.max(1, Math.floor(100 / (atrPct * 2.5))) : 100;
    const isRisky = lev > safeLev;

    window.__v26ScalpLines = {
      enabled: true,
      showLong: state.showLong,
      showShort: state.showShort,
      longLiq,
      shortLiq,
      longTp,
      shortTp
    };

    const setTxt = (id, txt) => {
      const el = $(id);
      if (el) el.textContent = txt;
    };

    setTxt("v26-sc-lev", `${lev}x`);
    setTxt("v26-sc-liq-pct", `%${liqPct.toFixed(2)}`);
    setTxt("v26-sc-tp-pct", `%${tpMovePct.toFixed(2)}`);
    setTxt("v26-sc-atr-pct", atrPct > 0 ? `%${atrPct.toFixed(2)}` : "-");
    setTxt("v26-sc-long-liq", fmtPrice(longLiq));
    setTxt("v26-sc-long-tp", fmtPrice(longTp));
    setTxt("v26-sc-short-liq", fmtPrice(shortLiq));
    setTxt("v26-sc-short-tp", fmtPrice(shortTp));

    const statusEl = $("v26-sc-risk");
    if (statusEl) {
      statusEl.textContent = atrPct > 0 ? (isRisky ? `RİSKLİ (Max ~${safeLev}x)` : "UYGUN") : "HESAPLANIYOR";
      statusEl.className = `v26-sc-badge ${atrPct > 0 ? (isRisky ? "risky" : "safe") : ""}`;
    }

    panel.querySelectorAll(".v26-sc-long-chip").forEach((el) => {
      el.style.display = state.showLong ? "grid" : "none";
    });
    panel.querySelectorAll(".v26-sc-short-chip").forEach((el) => {
      el.style.display = state.showShort ? "grid" : "none";
      if (el.classList.contains("short")) {
        el.style.borderLeft = state.showLong ? "" : "none";
        el.style.paddingLeft = state.showLong ? "" : "0";
      }
    });
  }

  function resolveSymbol(base) {
    if (typeof window.v26ResolveMarketSymbol === "function") {
      return window.v26ResolveMarketSymbol(base, currentPairInfo().quote);
    }
    const clean = String(base || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    return { base: clean, apiPair: clean + "USDT", market: "spot", display: clean, sub: "/USDT" };
  }

  const miniWsMap = new Map();

  function patchVisibleWatchlistRows(changedApiSyms) {
    const body = $("v26-watch-list-body");
    if (!body || !changedApiSyms || !changedApiSyms.size) return;
    const rows = body.querySelectorAll(".v26-watch-row[data-v26-api]");
    for (const row of rows) {
      const apiSym = row.dataset.v26Api;
      if (!changedApiSyms.has(apiSym)) continue;
      const tick = state.binanceTickers.get(apiSym);
      if (!tick) continue;
      const priceEl = row.querySelector(".v26-watch-price");
      const chgEl = row.querySelector(".v26-watch-chg .v26-pct-val");
      const volEl = row.querySelector(".v26-watch-chg .v26-vol-val");
      const nextPriceText = fmtPrice(tick.price);
      if (priceEl && priceEl.textContent !== nextPriceText) {
        const prev = Number(priceEl.dataset.rawPrice || 0);
        priceEl.dataset.rawPrice = String(tick.price);
        priceEl.textContent = nextPriceText;
        if (prev > 0 && prev !== tick.price) {
          priceEl.classList.remove("flash-up", "flash-down");
          void priceEl.offsetWidth;
          priceEl.classList.add(tick.price > prev ? "flash-up" : "flash-down");
        }
      }
      if (chgEl) {
        const cls = tick.pct >= 0 ? "up" : "down";
        chgEl.className = `v26-pct-val ${cls}`;
        chgEl.textContent = fmtPct(tick.pct, 1);
      }
      if (volEl && tick.vol > 0) {
        volEl.textContent = fmtVol(tick.vol);
      }
    }
  }

  function handleMiniTickerBatch(arr, isFapi) {
    if (!Array.isArray(arr) || !arr.length) return;
    const changedApiSyms = new Set();
    let addedNew = false;
    const fapiOnly = window.__v26FapiOnlySet;
    for (const t of arr) {
      const sym = String(t.s || "");
      if (!sym.endsWith("USDT")) continue;
      if (isFapi && fapiOnly && fapiOnly.size && !fapiOnly.has(sym) && state.binanceTickers.has(sym)) continue;
      const price = Number(t.c || 0);
      const open = Number(t.o || 0);
      const vol = Number(t.q || 0);
      if (!(price > 0)) continue;
      const base = sym.slice(0, -4);
      const pct = open > 0 ? ((price - open) / open) * 100 : (state.binanceTickers.get(sym)?.pct || 0);
      const existing = state.binanceTickers.get(sym);
      if (existing) {
        if (existing.price !== price || existing.pct !== pct || (vol > 0 && Math.abs(existing.vol - vol) > 1000)) {
          changedApiSyms.add(sym);
        }
        existing.price = price;
        existing.pct = pct;
        if (vol > 0) existing.vol = vol;
      } else if (!isFapi || (fapiOnly && fapiOnly.has(sym))) {
        const isBStock = !isFapi && detectIsBStock(sym);
        const row = { symbol: sym, base, price, pct, vol, market: isFapi ? "fapi" : "spot", isBStock };
        state.binanceTickers.set(sym, row);
        state.binanceList.push(row);
        if (isBStock) state.bStocksSet.add(sym);
        addedNew = true;
        changedApiSyms.add(sym);
      }
    }
    if (addedNew) {
      state.binanceList.sort((a, b) => b.vol - a.vol);
      updateWatchlistCounts();
      renderWatchlistRows();
    } else if (changedApiSyms.size) {
      patchVisibleWatchlistRows(changedApiSyms);
    }
  }

  function openMiniStream(key, url, isFapi) {
    const cur = miniWsMap.get(key);
    if (cur && cur.ws && (cur.ws.readyState === WebSocket.OPEN || cur.ws.readyState === WebSocket.CONNECTING)) return;
    if (typeof WebSocket === "undefined") return;
    clearTimeout(cur?.timer);
    try {
      const ws = new WebSocket(url);
      miniWsMap.set(key, { ws, timer: null });
      ws.onmessage = (ev) => {
        if (miniWsMap.get(key)?.ws !== ws) return;
        try { handleMiniTickerBatch(JSON.parse(ev.data), isFapi); } catch (_) {}
      };
      ws.onclose = () => {
        if (miniWsMap.get(key)?.ws !== ws) return;
        const block = $("omega-crypto-block");
        const timer = (block && block.style.display !== "none")
          ? setTimeout(() => openMiniStream(key, url, isFapi), 2500)
          : null;
        miniWsMap.set(key, { ws: null, timer });
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    } catch (_) {}
  }

  function connectWatchlistWS() {
    openMiniStream("spot", "wss://stream.binance.com:9443/ws/!miniTicker@arr", false);
    openMiniStream("fapi", "wss://fstream.binance.com/ws/!miniTicker@arr", true);
  }

  function closeWatchlistWS() {
    for (const [k, entry] of miniWsMap.entries()) {
      clearTimeout(entry.timer);
      if (entry.ws) {
        try { entry.ws.onclose = null; entry.ws.close(); } catch (_) {}
      }
      miniWsMap.set(k, { ws: null, timer: null });
    }
  }

  async function fetchBinanceTickers(force = false) {
    const now = Date.now();
    if (!force && now - state.lastBinanceFetch < 12000 && state.binanceList.length) return;
    try {
      const reqs = [
        fetch("https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-products?includeEtf=true", { cache: "no-store" }).then((r) => r.json()),
        fetch("https://api.binance.com/api/v3/ticker/24hr", { cache: "no-store" }).then((r) => r.json()),
        fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", { cache: "no-store" }).then((r) => r.json())
      ];
      if (!state.assetLogos.size) {
        reqs.push(fetch("https://www.binance.com/bapi/asset/v2/public/asset/asset/get-all-asset", { cache: "force-cache" }).then((r) => r.json()));
      }
      const [prodRes, spotRes, fapiRes, logoRes] = await Promise.allSettled(reqs);
      if (logoRes && logoRes.status === "fulfilled" && Array.isArray(logoRes.value?.data)) {
        const lMap = new Map();
        for (const a of logoRes.value.data) {
          const code = String(a.assetCode || "").toUpperCase();
          const url = a.logoUrl || a.fullLogoUrl || "";
          if (code && url) lMap.set(code, url);
        }
        if (lMap.size) state.assetLogos = lMap;
      }
      const prodArr = prodRes.status === "fulfilled" && Array.isArray(prodRes.value?.data) ? prodRes.value.data : [];
      const spotArr = spotRes.status === "fulfilled" && Array.isArray(spotRes.value) ? spotRes.value : [];
      const fapiArr = fapiRes.status === "fulfilled" && Array.isArray(fapiRes.value) ? fapiRes.value : [];
      if (!spotArr.length && !fapiArr.length && !prodArr.length) return;

      const nextBStocks = new Set();
      const prodMeta = new Map();
      for (const d of prodArr) {
        const sym = String(d.s || "");
        if (!sym.endsWith("USDT") || d.st !== "TRADING") continue;
        const tags = Array.isArray(d.tags) ? d.tags : [];
        const isBStock = tags.includes("bStocks");
        if (isBStock) nextBStocks.add(sym);
        const c = Number(d.c || 0);
        const o = Number(d.o || 0);
        prodMeta.set(sym, {
          isBStock,
          price: c,
          pct: o > 0 ? ((c - o) / o) * 100 : 0,
          vol: Number(d.qv || 0)
        });
      }
      if (nextBStocks.size) state.bStocksSet = nextBStocks;

      const map = new Map();
      const list = [];
      const fapiOnlySet = new Set();

      for (const item of spotArr) {
        const sym = String(item.symbol || "");
        if (!sym.endsWith("USDT")) continue;
        const meta = prodMeta.get(sym);
        const price = Number(item.lastPrice || meta?.price || 0);
        const vol = Number(item.quoteVolume || meta?.vol || 0);
        if (price <= 0) continue;
        if (vol <= 0 && !meta) continue;
        const base = sym.slice(0, -4);
        const pct = Number(item.priceChangePercent ?? meta?.pct ?? 0);
        const isBStock = meta ? meta.isBStock : detectIsBStock(sym);
        if (isBStock) state.bStocksSet.add(sym);
        const row = { symbol: sym, base, price, pct, vol, market: "spot", isBStock };
        map.set(sym, row);
        list.push(row);
      }

      // Add any newly listed TRADING USDT pairs present in Binance bapi even before 24hr stats populate
      for (const [sym, meta] of prodMeta.entries()) {
        if (map.has(sym) || !(meta.price > 0)) continue;
        const base = sym.slice(0, -4);
        const row = { symbol: sym, base, price: meta.price, pct: meta.pct, vol: meta.vol, market: "spot", isBStock: meta.isBStock };
        map.set(sym, row);
        list.push(row);
      }

      for (const item of fapiArr) {
        const sym = String(item.symbol || "");
        if (!sym.endsWith("USDT") || sym === "SPXUSDT") continue;
        const price = Number(item.lastPrice || 0);
        if (price <= 0) continue;
        if (!map.has(sym)) {
          fapiOnlySet.add(sym);
          const vol = Number(item.quoteVolume || 0);
          const base = sym.slice(0, -4);
          const pct = Number(item.priceChangePercent || 0);
          const row = { symbol: sym, base, price, pct, vol: vol || 1, market: "fapi", isBStock: false };
          map.set(sym, row);
          list.push(row);
        }
      }

      window.__v26FapiOnlySet = fapiOnlySet;
      list.sort((a, b) => b.vol - a.vol);
      state.binanceTickers = map;
      state.binanceList = list;
      state.lastBinanceFetch = Date.now();
      window.__v26BinanceList = list;
      window.__v26BinanceTickers = map;
      updateWatchlistCounts();
      renderWatchlistRows();
      updateHeaderLeverageBadge();
    } catch (_) {}
  }

  function updateWatchlistCounts() {
    const allBtn = document.querySelector('[data-v26-watch-tab="all"]');
    const bstBtn = document.querySelector('[data-v26-watch-tab="bstocks"]');
    const allCount = state.binanceList.filter((r) => r.market !== "fapi").length || state.binanceList.length;
    if (allBtn) allBtn.textContent = `All (${allCount || "..."})`;
    if (bstBtn) {
      const bCount = state.binanceList.filter((r) => r.isBStock).length;
      const cntEl = bstBtn.querySelector(".v26-bst-cnt");
      if (cntEl) cntEl.textContent = bCount ? ` (${bCount})` : "";
    }
  }

  function toggleMyPair(base) {
    const clean = String(base || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) return;
    const idx = state.myPairs.indexOf(clean);
    if (idx >= 0) state.myPairs.splice(idx, 1);
    else state.myPairs.unshift(clean);
    saveMyPairs();
    updateWatchlistCounts();
    renderWatchlistRows();
  }

  function addPairsFromInput() {
    const inp = $("v26-watch-add-input");
    if (!inp) return;
    const raw = inp.value.trim().toUpperCase();
    if (!raw) return;
    const tokens = raw.split(/[\s,;]+/).map((t) => {
      const cleaned = t.replace(/[^A-Z0-9]/g, "");
      if (cleaned.endsWith("USDT") && cleaned.length > 4) return cleaned.slice(0, -4);
      return cleaned;
    }).filter(Boolean);
    let added = 0;
    [...tokens].reverse().forEach((sym) => {
      if (!state.myPairs.includes(sym)) {
        state.myPairs.unshift(sym);
        added++;
      }
    });
    if (added > 0) {
      saveMyPairs();
      updateWatchlistCounts();
      renderWatchlistRows();
    }
    if (tokens.length === 1) {
      selectPair(tokens[0]);
    }
    inp.value = "";
  }

  function selectPair(base) {
    const symInput = $("v10-symbol");
    if (!symInput) return;
    symInput.value = base;
    symInput.dispatchEvent(new Event("change", { bubbles: true }));
    if (typeof window.omega_V10RefreshCrypto === "function") {
      window.omega_V10RefreshCrypto(true);
    }
    setTimeout(() => {
      renderTradingViewWidget(true);
      updateHeaderLeverageBadge();
      renderWatchlistRows();
    }, 60);
  }
  window.v26SelectMarketPair = selectPair;

  function sortItems(items) {
    if (state.watchTab === "my" && state.sortBy === "vol" && state.sortDir === "desc") {
      // Keep user's custom list order by default unless they clicked a sort column
      return items;
    }
    const dir = state.sortDir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      if (state.sortBy === "base") return a.display.localeCompare(b.display) * dir;
      if (state.sortBy === "price") return ((a.price || 0) - (b.price || 0)) * dir;
      if (state.sortBy === "pct") return ((a.pct || 0) - (b.pct || 0)) * dir;
      return ((a.vol || 0) - (b.vol || 0)) * dir;
    });
  }

  function renderWatchlistRows() {
    const body = $("v26-watch-list-body");
    if (!body) return;
    const p = currentPairInfo();
    const activeRes = resolveSymbol(p.symbol);
    const q = state.search.trim().toUpperCase();
    const mySet = new Set(state.myPairs);

    let items = [];
    if (state.watchTab === "my") {
      items = state.myPairs
        .map((base) => {
          const res = resolveSymbol(base);
          const tick = state.binanceTickers.get(res.apiPair);
          return {
            base,
            apiPair: res.apiPair,
            display: res.display,
            sub: res.sub,
            price: tick?.price || 0,
            pct: tick?.pct || 0,
            vol: tick?.vol || 0
          };
        })
        .filter((it) => !q || it.base.includes(q) || it.display.toUpperCase().includes(q) || it.apiPair.includes(q));
    } else {
      const qRes = q ? resolveSymbol(q) : null;
      const sourceList = state.watchTab === "bstocks"
        ? state.binanceList.filter((r) => r.isBStock)
        : state.binanceList.filter((r) => r.market !== "fapi" || r.isBStock);
      items = sourceList
        .filter((r) => !q || r.base.includes(q) || r.symbol.includes(q) || (qRes && r.symbol === qRes.apiPair))
        .map((r) => {
          const res = resolveSymbol(r.base);
          return {
            base: r.base,
            apiPair: r.symbol,
            display: r.isBStock ? r.base : res.display,
            sub: r.isBStock ? "/USDT" : res.sub,
            price: r.price,
            pct: r.pct,
            vol: r.vol || 0
          };
        });
    }

    items = sortItems(items);
    if (state.watchTab === "all" && !q) items = items.slice(0, 900);

    if (!items.length) {
      const waitMsg = !state.lastBinanceFetch && state.watchTab !== "my"
        ? "Binance pariteleri yükleniyor..."
        : "Eşleşen parite bulunamadı.";
      body.innerHTML = `<div class="v26-watch-empty">${waitMsg}</div>`;
      return;
    }

    body.innerHTML = items.map((item) => {
      const isFav = mySet.has(item.base);
      const isActive = item.base === p.symbol || item.apiPair === activeRes.apiPair;
      const pctCls = item.pct >= 0 ? "up" : "down";
      const rightHtml = state.volFirst
        ? `<b class="v26-vol-val primary">${fmtVol(item.vol)}</b><em class="v26-pct-val ${pctCls}">${fmtPct(item.pct, 1)}</em>`
        : `<b class="v26-pct-val ${pctCls}">${fmtPct(item.pct, 1)}</b><em class="v26-vol-val">${fmtVol(item.vol)}</em>`;
      return `
        <div class="v26-watch-row ${isActive ? "active" : ""}" data-v26-pick="${item.base}" data-v26-api="${item.apiPair}">
          <button type="button" class="v26-watch-star ${isFav ? "fav" : ""}" data-v26-star="${item.base}" title="${isFav ? "Favorilerden çıkar" : "Favorilere ekle"}"><i class="fa-solid fa-star"></i></button>
          <span class="v26-watch-sym">${logoBadgeHtml(item.base, item.apiPair, item.display)}<span class="v26-watch-sym-txt"><b>${item.display}</b><em>${item.sub}</em></span></span>
          <span class="v26-watch-price" data-raw-price="${item.price}">${fmtPrice(item.price)}</span>
          <span class="v26-watch-chg">${rightHtml}</span>
        </div>
      `;
    }).join("");
  }

  function mountUI() {
    if (state.mounted) return;
    const chartPanel = document.querySelector("#omega-crypto-block .crypto-v10-chart-panel");
    const chartWrap = document.querySelector("#omega-crypto-block .crypto-v12-chart-wrap");
    const graphPane = document.querySelector('#omega-crypto-block .crypto-v28-panel[data-crypto-pane="graph"]');
    if (!chartPanel || !chartWrap || !graphPane) return;

    state.mounted = true;

    // 1. Leverage (1x-100x) bar above chart
    const proBar = document.createElement("div");
    proBar.className = "v26-pro-chart-bar";
    proBar.innerHTML = `
      <div class="v26-lev-bar" style="width:100%;justify-content:space-between;">
        <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
          ${[1, 2, 3, 5, 10, 20, 50, 100].map((x) => `<button type="button" class="v26-lev-btn ${state.lev === x ? "active" : ""}" data-v26-lev="${x}">${x}x</button>`).join("")}
        </div>
        <input id="v26-lev-custom" class="v26-lev-input" type="number" min="1" max="100" step="1" value="${state.lev}" title="1x - 100x özel kaldıraç">
      </div>
    `;
    const tfAnchor = $("crypto-v10-timeframes") || chartWrap;
    tfAnchor.parentElement.insertBefore(proBar, tfAnchor);

    // 1b. Scalping Liquidation Ruler & ATR Risk Panel
    const scalpPanel = document.createElement("div");
    scalpPanel.id = "v26-scalp-panel";
    scalpPanel.className = "v26-scalp-panel";
    scalpPanel.innerHTML = `
      <div class="v26-sc-top">
        <div class="v26-sc-inputs">
          <label><span>Hedef Çarpan</span><input id="v26-scalp-mult" type="number" step="0.05" min="1.01" value="${state.tpMult.toFixed(2)}"></label>
          <label class="v26-sc-check long"><input id="v26-scalp-long" type="checkbox" ${state.showLong ? "checked" : ""}><span>Long</span></label>
          <label class="v26-sc-check short"><input id="v26-scalp-short" type="checkbox" ${state.showShort ? "checked" : ""}><span>Short</span></label>
        </div>
        <div class="v26-sc-metrics">
          <span>Kaldıraç: <b id="v26-sc-lev">${state.lev}x</b></span>
          <span>Likit: <b id="v26-sc-liq-pct">-</b></span>
          <span>TP: <b id="v26-sc-tp-pct">-</b></span>
          <span class="v26-sc-badge" id="v26-sc-risk">-</span>
        </div>
      </div>
      <div class="v26-sc-levels">
        <div class="v26-sc-col long v26-sc-long-chip">
          <span class="v26-sc-lvl long-liq">LONG LİKİT <b id="v26-sc-long-liq">$-</b></span>
          <span class="v26-sc-lvl long-tp">LONG TP <b id="v26-sc-long-tp">$-</b></span>
        </div>
        <div class="v26-sc-col short v26-sc-short-chip">
          <span class="v26-sc-lvl short-liq">SHORT LİKİT <b id="v26-sc-short-liq">$-</b></span>
          <span class="v26-sc-lvl short-tp">SHORT TP <b id="v26-sc-short-tp">$-</b></span>
        </div>
      </div>
    `;
    tfAnchor.parentElement.insertBefore(scalpPanel, tfAnchor);

    const multInp = $("v26-scalp-mult");
    const longChk = $("v26-scalp-long");
    const shortChk = $("v26-scalp-short");
    const onScalpChange = () => {
      state.tpMult = Math.max(1.01, Number(multInp?.value || 1.5));
      state.showLong = Boolean(longChk?.checked);
      state.showShort = Boolean(shortChk?.checked);
      localStorage.setItem(LS_TP_MULT, String(state.tpMult));
      localStorage.setItem(LS_LONG, state.showLong ? "1" : "0");
      localStorage.setItem(LS_SHORT, state.showShort ? "1" : "0");
      updateScalpPanel();
      if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
    };
    multInp?.addEventListener("input", onScalpChange);
    longChk?.addEventListener("change", onScalpChange);
    shortChk?.addEventListener("change", onScalpChange);
    window.addEventListener("v26-crypto-candles-updated", () => updateScalpPanel());
    updateScalpPanel();

    // 2. TradingView Widget Container
    const tvHost = document.createElement("div");
    tvHost.id = "v26-tv-widget-host";
    tvHost.className = "v26-tv-widget-host";
    chartWrap.parentElement.insertBefore(tvHost, chartWrap);

    // 3. Right-side Watchlist inside Grafik pane
    const watchBox = document.createElement("div");
    watchBox.className = "v26-watch-box";
    watchBox.innerHTML = `
      <div class="v26-watch-tabs three">
        <button type="button" class="v26-watch-tab fav-tab" data-v26-watch-tab="my" title="Favorilerim"><i class="fa-solid fa-star"></i></button>
        <button type="button" class="v26-watch-tab active" data-v26-watch-tab="all">All (...)</button>
        <button type="button" class="v26-watch-tab bstocks" data-v26-watch-tab="bstocks">bStocks<span class="v26-bst-cnt"></span></button>
      </div>
      <div class="v26-watch-controls">
        <input id="v26-watch-search" class="v26-watch-input" type="text" placeholder="Parite ara (BTC, NVDAB, SOXLB, NDX, XAU...)">
        <div class="v26-watch-add-row" id="v26-watch-add-row" style="display:none;">
          <input id="v26-watch-add-input" class="v26-watch-input" type="text" placeholder="Ekle: NDX, XAU, NVDAB, AAPL, EURUSD...">
          <button type="button" id="v26-watch-add-btn" class="v26-watch-add-btn">+ Ekle</button>
        </div>
      </div>
      <div class="v26-watch-list-head">
        <span></span>
        <button type="button" class="v26-sort-btn" data-v26-sort="base">Parite ↕</button>
        <button type="button" class="v26-sort-btn right" data-v26-sort="price">Fiyat ↕</button>
        <span class="v26-col-right">
          <button type="button" class="v26-sort-btn" data-v26-sort="pct">24s %</button>
          <em>/</em>
          <button type="button" class="v26-sort-btn active" data-v26-sort="vol">Vol ↕</button>
          <button type="button" id="v26-watch-vol-toggle" class="v26-vol-swap" title="Vol / 24s % sırasını değiştir">⇄</button>
        </span>
      </div>
      <div class="v26-watch-list-body" id="v26-watch-list-body">
        <div class="v26-watch-empty">Binance verileri yükleniyor...</div>
      </div>
    `;
    graphPane.appendChild(watchBox);

    // Bind events
    proBar.addEventListener("click", (e) => {
      const mBtn = e.target.closest("[data-v26-chart-mode]");
      if (mBtn) {
        state.mode = mBtn.dataset.v26ChartMode;
        localStorage.setItem(LS_MODE, state.mode);
        applyChartMode();
        return;
      }
      const lBtn = e.target.closest("[data-v26-lev]");
      if (lBtn) {
        setLeverage(lBtn.dataset.v26Lev);
      }
    });

    const customLev = $("v26-lev-custom");
    if (customLev) {
      customLev.addEventListener("change", () => setLeverage(customLev.value));
      customLev.addEventListener("input", () => {
        const val = Number(customLev.value);
        if (val >= 1 && val <= 100) setLeverage(val);
      });
    }

    watchBox.addEventListener("click", (e) => {
      const sortBtn = e.target.closest("[data-v26-sort]");
      if (sortBtn) {
        const key = sortBtn.dataset.v26Sort;
        if (state.sortBy === key) state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
        else { state.sortBy = key; state.sortDir = key === "base" ? "asc" : "desc"; }
        watchBox.querySelectorAll("[data-v26-sort]").forEach((b) => b.classList.toggle("active", b === sortBtn));
        renderWatchlistRows();
        return;
      }
      if (e.target.closest("#v26-watch-vol-toggle")) {
        state.volFirst = !state.volFirst;
        renderWatchlistRows();
        return;
      }
      const tabBtn = e.target.closest("[data-v26-watch-tab]");
      if (tabBtn) {
        state.watchTab = tabBtn.dataset.v26WatchTab;
        watchBox.querySelectorAll("[data-v26-watch-tab]").forEach((b) => b.classList.toggle("active", b === tabBtn));
        const addRow = $("v26-watch-add-row");
        if (addRow) addRow.style.display = state.watchTab === "my" ? "flex" : "none";
        if (state.watchTab === "all" || state.watchTab === "bstocks") fetchBinanceTickers(false);
        renderWatchlistRows();
        return;
      }
      const starBtn = e.target.closest("[data-v26-star]");
      if (starBtn) {
        e.stopPropagation();
        toggleMyPair(starBtn.dataset.v26Star);
        return;
      }
      const rowEl = e.target.closest("[data-v26-pick]");
      if (rowEl) {
        selectPair(rowEl.dataset.v26Pick);
      }
    });

    const searchEl = $("v26-watch-search");
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        state.search = searchEl.value;
        renderWatchlistRows();
      });
    }

    const addBtn = $("v26-watch-add-btn");
    const addInp = $("v26-watch-add-input");
    if (addBtn) addBtn.onclick = addPairsFromInput;
    if (addInp) {
      addInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); addPairsFromInput(); }
      });
    }

    // Listen for symbol / exchange / timeframe changes from existing UI
    ["v10-exchange", "v10-quote", "v10-symbol"].forEach((id) => {
      const el = $(id);
      if (el) {
        el.addEventListener("change", () => {
          setTimeout(() => {
            renderTradingViewWidget(true);
            updateHeaderLeverageBadge();
            renderWatchlistRows();
          }, 80);
        });
      }
    });

    const tfWrap = $("crypto-v10-timeframes");
    if (tfWrap) {
      tfWrap.addEventListener("click", () => {
        setTimeout(() => renderTradingViewWidget(true), 80);
      });
    }

    applyChartMode();
    fetchBinanceTickers(true);
    connectWatchlistWS();
    renderWatchlistRows();

    setInterval(() => {
      const block = $("omega-crypto-block");
      if (block && block.style.display !== "none") {
        fetchBinanceTickers(false);
        connectWatchlistWS();
        updateHeaderLeverageBadge();
      }
    }, 15000);
  }

  function init() {
    mountUI();
    const block = $("omega-crypto-block");
    if (block) {
      const obs = new MutationObserver(() => {
        if (block.style.display !== "none") {
          mountUI();
          applyChartMode();
          fetchBinanceTickers(false);
          connectWatchlistWS();
        } else {
          closeWatchlistWS();
        }
      });
      obs.observe(block, { attributes: true, attributeFilter: ["style"] });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
