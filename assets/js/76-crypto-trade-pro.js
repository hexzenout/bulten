// ===============================
// V26 CRYPTO TRADE PRO: LONG/SHORT PILLS, LIVE ORDER BOOK, COLORFUL RISK & PER-USER API VAULT
// ===============================

(function () {
  function $(id) { return document.getElementById(id); }

  const LS_OB_OPEN = "v26_crypto_ob_open";
  const LS_SCALP_POS = "v26_fast_scalp_pos_v1";
  const LS_SCALP_HIST = "v26_fast_scalp_hist_v1";
  const LS_FUTURES_EX = "v26_active_futures_ex_v1";

  const FUTURES_EXCHANGES = {
    binance: {
      id: "binance",
      label: "Binance",
      restTickerUrl: (base, quote) => `https://fapi.binance.com/fapi/v1/ticker/bookTicker?symbol=${encodeURIComponent(base + quote)}`,
      parseRest: (j) => j?.bidPrice && j?.askPrice ? { bid: Number(j.bidPrice), ask: Number(j.askPrice), last: (Number(j.bidPrice) + Number(j.askPrice)) / 2 } : null,
      wsUrl: (base, quote) => `wss://fstream.binance.com/ws/${(base + quote).toLowerCase()}@bookTicker`,
      wsSubscribe: null,
      parseWs: (d) => d?.b && d?.a ? { bid: Number(d.b), ask: Number(d.a), last: (Number(d.b) + Number(d.a)) / 2 } : null
    },
    mexc: {
      id: "mexc",
      label: "MEXC",
      restTickerUrl: null,
      parseRest: null,
      wsUrl: () => "wss://contract.mexc.com/edge",
      wsSubscribe: (base, quote) => [
        { method: "sub.depth.full", param: { symbol: `${base}_${quote}`, limit: 5 } },
        { method: "sub.ticker", param: { symbol: `${base}_${quote}` } }
      ],
      parseWs: (d) => {
        if (d?.channel === "rs.error" || (d?.data && typeof d.data === "string" && d.data.toLowerCase().includes("not exist"))) {
          return { unsupported: true };
        }
        if (d?.channel === "push.depth.full" && Array.isArray(d?.data?.bids) && Array.isArray(d?.data?.asks)) {
          const bid = Number(d.data.bids[0]?.[0] || 0);
          const ask = Number(d.data.asks[0]?.[0] || 0);
          if (bid > 0 || ask > 0) return { bid, ask, last: 0 };
        }
        if (d?.channel === "push.ticker" && d?.data) {
          const bid = Number(d.data.bid1 || 0);
          const ask = Number(d.data.ask1 || 0);
          const last = Number(d.data.lastPrice || 0);
          if (bid > 0 || ask > 0 || last > 0) return { bid, ask, last };
        }
        return null;
      }
    },
    okx: {
      id: "okx",
      label: "OKX",
      restTickerUrl: null,
      parseRest: null,
      wsUrl: () => "wss://ws.okx.com:8443/ws/v5/public",
      wsSubscribe: (base, quote) => ({
        op: "subscribe",
        args: [
          { channel: "tickers", instId: `${base}-${quote}-SWAP` },
          { channel: "bbo-tbt", instId: `${base}-${quote}-SWAP` }
        ]
      }),
      parseWs: (d) => {
        if (d?.event === "error") return { unsupported: true };
        const item = d?.data?.[0];
        if (!item) return null;
        if (Array.isArray(item.bids) && Array.isArray(item.asks)) {
          const bid = Number(item.bids[0]?.[0] || 0);
          const ask = Number(item.asks[0]?.[0] || 0);
          if (bid > 0 && ask > 0) return { bid, ask, last: (bid + ask) / 2 };
        }
        if (item.bidPx || item.askPx) {
          const bid = Number(item.bidPx || 0);
          const ask = Number(item.askPx || 0);
          const last = Number(item.last || 0);
          if (bid > 0 || ask > 0) return { bid: bid || last, ask: ask || last, last: last || ((bid + ask) / 2) };
        }
        return null;
      }
    },
    bybit: {
      id: "bybit",
      label: "Bybit",
      restTickerUrl: null,
      parseRest: null,
      wsUrl: () => "wss://stream.bybit.com/v5/public/linear",
      wsSubscribe: (base, quote) => ({
        op: "subscribe",
        args: [`tickers.${base}${quote}`, `orderbook.1.${base}${quote}`]
      }),
      parseWs: (d) => {
        if (d?.success === false && String(d?.ret_msg || "").toLowerCase().includes("invalid")) {
          return { unsupported: true };
        }
        if (d?.topic?.startsWith("orderbook.") && d?.data) {
          const bid = Number(d.data.b?.[0]?.[0] || 0);
          const ask = Number(d.data.a?.[0]?.[0] || 0);
          if (bid > 0 || ask > 0) return { bid, ask, last: 0 };
        }
        if (d?.topic?.startsWith("tickers.") && d?.data) {
          const bid = Number(d.data.bid1Price || 0);
          const ask = Number(d.data.ask1Price || 0);
          const last = Number(d.data.lastPrice || 0);
          if (bid > 0 || ask > 0 || last > 0) return { bid, ask, last };
        }
        return null;
      }
    },
    bitget: {
      id: "bitget",
      label: "Bitget",
      restTickerUrl: (base, quote) => `https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=${encodeURIComponent(base + quote)}`,
      parseRest: (j) => {
        if (j?.code && j.code !== "00000") return { unsupported: true };
        const t = j?.data?.[0];
        return t ? { bid: Number(t.bidPr || t.lastPr || 0), ask: Number(t.askPr || t.lastPr || 0), last: Number(t.lastPr || 0) } : null;
      },
      wsUrl: () => "wss://ws.bitget.com/v2/ws/public",
      wsSubscribe: (base, quote) => ({ op: "subscribe", args: [{ instType: "USDT-FUTURES", channel: "ticker", instId: `${base}${quote}` }] }),
      parseWs: (d) => {
        if (d?.event === "error") return { unsupported: true };
        const t = d?.data?.[0];
        return t ? { bid: Number(t.bidPr || t.lastPr || 0), ask: Number(t.askPr || t.lastPr || 0), last: Number(t.lastPr || 0) } : null;
      }
    },
    gateio: {
      id: "gateio",
      label: "Gate.io",
      restTickerUrl: (base, quote) => `https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=${encodeURIComponent(base + "_" + quote)}`,
      parseRest: (j) => {
        const t = Array.isArray(j) ? j[0] : null;
        return t ? { bid: Number(t.highest_bid || t.last || 0), ask: Number(t.lowest_ask || t.last || 0), last: Number(t.last || 0) } : null;
      },
      wsUrl: () => "wss://fx-ws.gateio.ws/v4/ws/usdt",
      wsSubscribe: (base, quote) => ({ time: Math.floor(Date.now() / 1000), channel: "futures.book_ticker", event: "subscribe", payload: [`${base}_${quote}`] }),
      parseWs: (d) => {
        if (d?.error) return { unsupported: true };
        const r = d?.channel === "futures.book_ticker" ? d?.result : null;
        return r && (r.b || r.a) ? { bid: Number(r.b || 0), ask: Number(r.a || 0), last: (Number(r.b || 0) + Number(r.a || 0)) / 2 } : null;
      }
    },
    kcex: {
      id: "kcex",
      label: "KCEX",
      restTickerUrl: null,
      parseRest: null,
      wsUrl: null,
      wsSubscribe: null,
      parseWs: null
    }
  };

  function getConnectedVaultExchange() {
    try {
      const uid = window.V26_FIREBASE?.user?.uid;
      if (!uid) return "";
      const saved = JSON.parse(localStorage.getItem(`v26_api_vault_${uid}`) || "{}");
      if (saved?.apiKey && saved?.exchange && FUTURES_EXCHANGES[saved.exchange]) {
        return saved.exchange;
      }
    } catch (_) {}
    return "";
  }

  function getActiveFuturesExchangeId() {
    const vaultEx = getConnectedVaultExchange();
    if (vaultEx) return vaultEx;
    const saved = localStorage.getItem(LS_FUTURES_EX);
    return saved && FUTURES_EXCHANGES[saved] ? saved : "binance";
  }

  function getActiveAdapter() {
    return FUTURES_EXCHANGES[state.futuresExchange] || FUTURES_EXCHANGES.binance;
  }

  function loadJson(key, fb) {
    try { return JSON.parse(localStorage.getItem(key) || "") ?? fb; } catch (_) { return fb; }
  }

  const state = {
    mounted: false,
    orderType: "fastlimit", // "fastlimit" | "limit" | "market"
    volBufferMode: "0", // "0" | "auto"
    marginMode: "cross", // "cross" | "isolated"
    futuresExchange: getActiveFuturesExchangeId(),
    obOpen: localStorage.getItem(LS_OB_OPEN) !== "0",
    obWs: null,
    obKey: "",
    obReconnect: null,
    bids: [],
    asks: [],
    midPrice: 0,
    futWs: null,
    futKey: "",
    futReconnect: null,
    futPing: null,
    futBid: 0,
    futAsk: 0,
    futLast: 0,
    futStatus: "loading", // "loading" | "live" | "unsupported" | "needs_api"
    apiSubOpen: false,
    activeScalp: loadJson(LS_SCALP_POS, null),
    scalpHistory: loadJson(LS_SCALP_HIST, [])
  };

  function resolvePair() {
    const rawSym = ($("v10-symbol")?.value || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC";
    const quote = ($("v10-quote")?.value || "USDT").toUpperCase();
    if (typeof window.v26ResolveMarketSymbol === "function") {
      return window.v26ResolveMarketSymbol(rawSym, quote);
    }
    return { base: rawSym, apiPair: rawSym + quote, market: "spot", display: rawSym, sub: "/" + quote };
  }

  function fmtPrice(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n) || n <= 0) return "-";
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return n.toPrecision(5);
  }

  function fmtQty(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n) || n <= 0) return "0";
    if (n >= 1000) return (n / 1000).toFixed(2) + "K";
    if (n >= 1) return n.toFixed(3);
    return n.toFixed(4);
  }

  function getLivePrice() {
    const meta = typeof window.v26GetCryptoMarketMeta === "function" ? window.v26GetCryptoMarketMeta() : null;
    return Number(meta?.price || window._V10_PRICE || state.midPrice || 0);
  }

  function syncTradeSummaries() {
    const stake = Math.max(0, Number($("v10-stake")?.value || 0));
    const lev = Math.max(1, Number($("v10-lev")?.value || 1));
    const side = ($("v10-side")?.value || "long").toLowerCase();
    const notional = stake * lev;
    const feeRate = state.orderType === "market" ? 0.0005 : 0.0002;
    const feeLabel = state.orderType === "market" ? "Piyasa" : "Limit";
    const fee = notional * feeRate;

    const notionalEl = $("v26-tp-notional");
    const feeEl = $("v26-tp-fee");
    if (notionalEl) notionalEl.textContent = "$" + notional.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (feeEl) feeEl.textContent = `~$${fee.toFixed(2)} (${feeLabel})`;

    document.querySelectorAll("[data-v26-side-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.v26SideBtn === side);
    });
    document.querySelectorAll("[data-v26-stake-q]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.v26StakeQ) === stake);
    });
    syncFastLimitEngine();
  }

  function getMarketVolatilityInfo() {
    const topAsk = state.futAsk || 0;
    const topBid = state.futBid || 0;
    const hasFut = topBid > 0 && topAsk > 0;
    const mid = hasFut ? (topAsk + topBid) / 2 : (state.futLast || 0);
    const spreadPct = hasFut && topAsk > 0 ? ((topAsk - topBid) / topAsk) * 100 : 0.015;
    const meta = typeof window.v26GetCryptoMarketMeta === "function" ? window.v26GetCryptoMarketMeta() : null;
    const atrPct = Number(meta?.atrPct || 0);
    // %0.03 fast-fill floor integrated directly inside Oto Oynak (scales up to %0.15 only in extreme volatility)
    const volScore = Math.max(spreadPct * 2.5, atrPct * 0.06);
    const autoBufPct = Math.min(0.15, Math.max(0.03, volScore || 0.03));
    const bufPct = state.volBufferMode === "0" ? 0 : autoBufPct;

    let levelLabel = "Normal";
    let levelCls = "calm";
    if (atrPct >= 1.8 || spreadPct >= 0.06) {
      levelLabel = "Çok Oynak ⚡";
      levelCls = "hot";
    } else if (atrPct >= 0.7 || spreadPct >= 0.025) {
      levelLabel = "Hareketli";
      levelCls = "warm";
    }

    const askBase = topAsk || mid;
    const bidBase = topBid || mid;
    const refPx = mid || getLivePrice();
    const dec = refPx >= 1000 ? 2 : refPx >= 1 ? 4 : 6;
    const fastLongLimit = askBase > 0 ? Number((askBase * (1 + bufPct / 100)).toFixed(dec)) : 0;
    const fastShortLimit = bidBase > 0 ? Number((bidBase * (1 - bufPct / 100)).toFixed(dec)) : 0;

    return { topAsk, topBid, askBase, bidBase, mid, spreadPct, atrPct, bufPct, levelLabel, levelCls, fastLongLimit, fastShortLimit, dec };
  }

  function saveScalpState() {
    try {
      if (state.activeScalp) localStorage.setItem(LS_SCALP_POS, JSON.stringify(state.activeScalp));
      else localStorage.removeItem(LS_SCALP_POS);
      localStorage.setItem(LS_SCALP_HIST, JSON.stringify((state.scalpHistory || []).slice(0, 80)));
    } catch (_) {}
  }

  function openFastLimitPosition(side) {
    const p = resolvePair();
    const stake = Math.max(10, Number($("v10-stake")?.value || 100));
    const lev = Math.max(1, Number($("v10-lev")?.value || 10));
    const info = getMarketVolatilityInfo();
    // Fills at the actual best available book price first; bufPct only sets a protection ceiling
    const bookBest = side === "long" ? info.askBase : info.bidBase;
    const entryPrice = bookBest > 0 ? Number(bookBest.toFixed(info.dec)) : (side === "long" ? info.fastLongLimit : info.fastShortLimit);
    if (!entryPrice || entryPrice <= 0) {
      if (typeof window.omega_ShowFinanceToast === "function") {
        window.omega_ShowFinanceToast("Canlı fiyat bekleniyor, lütfen birkaç saniye sonra tekrar deneyin.");
      }
      return;
    }

    // Sync form controls & locked liquidation price
    const sideSel = $("v10-side");
    const entryEl = $("v10-entry");
    const liqEl = $("v10-liq");
    if (sideSel) {
      sideSel.value = side;
      sideSel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (entryEl) {
      entryEl.value = entryPrice;
      entryEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const liqDist = entryPrice * Math.max(0.004, (1 / lev) * 0.92);
    const liqPrice = Number((side === "short" ? entryPrice + liqDist : Math.max(0.000001, entryPrice - liqDist)).toFixed(info.dec));
    if (liqEl) {
      liqEl.value = liqPrice;
      liqEl.dispatchEvent(new Event("input", { bubbles: true }));
    }

    state.activeScalp = {
      id: "sc_" + Date.now().toString(36),
      pair: p.apiPair,
      base: p.base,
      side,
      stake,
      lev,
      entry: entryPrice,
      liq: liqPrice,
      bufPct: info.bufPct,
      openedAt: Date.now()
    };
    saveScalpState();

    if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
    if (typeof window.omega_V10UpdateTpOutputs === "function") window.omega_V10UpdateTpOutputs();
    syncFastLimitEngine();

    if (typeof window.omega_ShowFinanceToast === "function") {
      window.omega_ShowFinanceToast(`Hızlı Limit ${side.toUpperCase()} açıldı: ${p.apiPair} @ $${fmtPrice(entryPrice)} (Makas tamponu %${info.bufPct.toFixed(2)})`);
    }
  }

  function closeFastLimitPosition() {
    const pos = state.activeScalp;
    if (!pos) return;
    const info = getMarketVolatilityInfo();
    const isSamePair = resolvePair().apiPair === pos.pair;
    const rawClose = isSamePair
      ? (pos.side === "long" ? info.bidBase : info.askBase)
      : pos.entry;
    const closePrice = rawClose > 0 ? Number(rawClose.toFixed(info.dec)) : pos.entry;
    const rawPct = pos.side === "long"
      ? (closePrice - pos.entry) / pos.entry
      : (pos.entry - closePrice) / pos.entry;
    // Maker fee estimate (0.02% entry + 0.02% exit)
    const fee = pos.stake * pos.lev * 0.0004;
    const pnl = (pos.stake * pos.lev * rawPct) - fee;

    state.scalpHistory.unshift({
      id: pos.id,
      pair: pos.pair,
      side: pos.side,
      stake: pos.stake,
      lev: pos.lev,
      entry: pos.entry,
      exit: closePrice,
      pnl,
      openedAt: pos.openedAt,
      closedAt: Date.now()
    });
    state.scalpHistory = state.scalpHistory.slice(0, 80);
    state.activeScalp = null;

    // Clear auto liquidation lock value when position closes
    const liqEl = $("v10-liq");
    if (liqEl) {
      liqEl.value = "";
      liqEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    saveScalpState();
    if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
    syncFastLimitEngine();

    if (typeof window.omega_ShowFinanceToast === "function") {
      const sign = pnl >= 0 ? "+" : "";
      window.omega_ShowFinanceToast(`Limitten Hızlı Kapatıldı: ${pos.pair} (${sign}$${pnl.toFixed(2)})`);
    }
  }

  function syncFastLimitEngine() {
    const box = $("v26-fast-limit-engine");
    if (!box) return;
    const adapter = getActiveAdapter();
    const titleEl = $("v26-fl-engine-title");
    const exSel = $("v26-fl-ex-select");
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-bolt"></i> ${adapter.label} Vadeli İşlem Hızlı Limit Motoru`;
    }
    if (exSel && exSel.value !== state.futuresExchange) {
      exSel.value = state.futuresExchange;
    }

    const info = getMarketVolatilityInfo();
    const volBadge = $("v26-fl-vol-badge");
    const bboEl = $("v26-fl-bbo-readout");
    const longPx = $("v26-fl-long-px");
    const shortPx = $("v26-fl-short-px");

    if (volBadge) {
      volBadge.textContent = `${info.levelLabel} · Tampon %${info.bufPct.toFixed(2)}`;
      volBadge.className = `v26-fl-vol-badge ${info.levelCls}`;
    }
    if (bboEl) {
      if (info.topBid > 0 && info.topAsk > 0) {
        bboEl.innerHTML = `<span class="v26-bbo-bid">Vadeli Alış <b>$${fmtPrice(info.topBid)}</b></span><span class="v26-bbo-dot">·</span><span class="v26-bbo-ask">Vadeli Satış <b>$${fmtPrice(info.topAsk)}</b></span>`;
      } else if (state.futStatus === "unsupported") {
        bboEl.textContent = `${adapter.label} vadeli borsasında bu parite bulunamadı.`;
      } else if (state.futStatus === "needs_api") {
        bboEl.textContent = `${adapter.label} vadeli verisi için kişisel API bağlantısı gerekli.`;
      } else {
        bboEl.textContent = `${adapter.label} vadeli verisi bağlanıyor...`;
      }
    }
    if (longPx) longPx.textContent = info.fastLongLimit > 0 ? `$${fmtPrice(info.fastLongLimit)}` : "-";
    if (shortPx) shortPx.textContent = info.fastShortLimit > 0 ? `$${fmtPrice(info.fastShortLimit)}` : "-";

    box.querySelectorAll("[data-v26-vol-buf]").forEach(b => {
      b.classList.toggle("active", b.dataset.v26VolBuf === state.volBufferMode);
    });

    // Update active quick position card
    const posCard = $("v26-active-scalp-card");
    if (posCard) {
      const pos = state.activeScalp;
      if (!pos) {
        posCard.style.display = "none";
      } else {
        posCard.style.display = "grid";
        const curPair = resolvePair().apiPair;
        const mark = curPair === pos.pair
          ? (pos.side === "long" ? (info.topBid || info.mid || pos.entry) : (info.topAsk || info.mid || pos.entry))
          : pos.entry;
        const rawPct = pos.side === "long" ? (mark - pos.entry) / pos.entry : (pos.entry - mark) / pos.entry;
        const netPnl = (pos.stake * pos.lev * rawPct) - (pos.stake * pos.lev * 0.0004);
        const roiPct = pos.stake > 0 ? (netPnl / pos.stake) * 100 : 0;
        const up = netPnl >= 0;
        const secAgo = Math.max(0, Math.floor((Date.now() - pos.openedAt) / 1000));
        const dur = secAgo >= 60 ? `${Math.floor(secAgo / 60)}dk ${secAgo % 60}sn` : `${secAgo}sn`;
        posCard.innerHTML = `
          <div class="v26-sc-pos-top">
            <span class="v26-sc-pos-pair"><em class="${pos.side}">${pos.side.toUpperCase()}</em> <b>${pos.pair}</b> <small>${pos.lev}x · $${pos.stake}</small></span>
            <span class="v26-sc-pos-dur">${dur}</span>
          </div>
          <div class="v26-sc-pos-mid">
            <div><small>Giriş Limiti</small><b>$${fmtPrice(pos.entry)}</b></div>
            <div><small>Oto Likidasyon</small><b class="liq">$${fmtPrice(pos.liq)}</b></div>
            <div><small>Anlık K/Z</small><b class="${up ? "up" : "down"}">${up ? "+" : ""}$${netPnl.toFixed(2)} (${up ? "+" : ""}${roiPct.toFixed(1)}%)</b></div>
          </div>
          <button type="button" class="v26-fl-close-btn" id="v26-fl-close-now">
            <i class="fa-solid fa-bolt"></i> LİMİTTEN HIZLI KAPAT ($${fmtPrice(curPair === pos.pair ? (pos.side === "long" ? info.fastShortLimit : info.fastLongLimit) : pos.entry)})
          </button>
        `;
      }
    }

    // Update 1h rapid trade counter
    const hourAgo = Date.now() - 3600000;
    const recent1h = (state.scalpHistory || []).filter(x => x.closedAt >= hourAgo);
    const totalNet = recent1h.reduce((acc, x) => acc + Number(x.pnl || 0), 0);
    const statEl = $("v26-fl-1h-stat");
    if (statEl) {
      const sign = totalNet >= 0 ? "+" : "";
      statEl.innerHTML = `Son 1 Saat: <b>${recent1h.length}</b> İşlem · Net <em class="${totalNet >= 0 ? "up" : "down"}">${sign}$${totalNet.toFixed(2)}</em>`;
    }
  }

  function installOverrides() {
    window.omega_V36AutoCalcPlan = function () {
      const side = ($("v10-side")?.value || "long").toLowerCase();
      const lev = Math.max(1, Number($("v10-lev")?.value || 10));
      const entryEl = $("v10-entry");
      const liqEl = $("v10-liq");
      const stopEl = $("v10-stop");
      const live = getLivePrice();
      const entry = Number(entryEl?.value || live || 0);
      if (!entry) return;
      if (entryEl && !entryEl.value) entryEl.value = entry;

      const liqDist = entry * Math.max(0.004, (1 / lev) * 0.92);
      const slDist = entry * Math.min(0.03, Math.max(0.008, (0.35 / lev) * 1.4));
      const tp1Dist = slDist * 1.5;
      const tp2Dist = slDist * 3.0;

      const dec = entry >= 1000 ? 2 : entry >= 1 ? 4 : 6;
      if (liqEl) liqEl.value = (side === "short" ? entry + liqDist : entry - liqDist).toFixed(dec);
      if (stopEl) stopEl.value = (side === "short" ? entry + slDist : entry - slDist).toFixed(dec);

      const tpRows = [...document.querySelectorAll("#tp-v10-rows .tp-v10-row")];
      if (tpRows[0]) {
        const inp = tpRows[0].querySelector(".tp-price");
        if (inp) inp.value = (side === "short" ? entry - tp1Dist : entry + tp1Dist).toFixed(dec);
      }
      if (tpRows[1]) {
        const inp = tpRows[1].querySelector(".tp-price");
        if (inp) inp.value = (side === "short" ? entry - tp2Dist : entry + tp2Dist).toFixed(dec);
      }

      if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
      if (typeof window.omega_V10UpdateTpOutputs === "function") window.omega_V10UpdateTpOutputs();
      syncTradeSummaries();
    };

    window.omega_V36ApplyPlanToChart = function () {
      if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
      if (typeof window.omega_V10UpdateTpOutputs === "function") window.omega_V10UpdateTpOutputs();
      if (typeof window.omega_ShowFinanceToast === "function") {
        window.omega_ShowFinanceToast("İşlem seviyeleri grafiğe uygulandı.");
      }
    };
  }

  function syncOrderBookRows(containerEl, rowsData, sideCls, maxQty) {
    if (!rowsData.length) {
      if (!containerEl.querySelector(".v26-ob-empty")) {
        containerEl.innerHTML = '<div class="v26-ob-empty">Emir defteri bekleniyor...</div>';
      }
      return;
    }
    const existing = containerEl.children;
    const needsRebuild = existing.length !== rowsData.length || !existing[0]?.dataset?.v26ObPrice;
    if (needsRebuild) {
      containerEl.innerHTML = rowsData.map(([pr, qty]) => {
        const pct = Math.min(100, Math.round((qty / maxQty) * 100));
        return `<button type="button" class="v26-ob-row ${sideCls}" data-v26-ob-price="${pr}"><span class="v26-ob-bar" style="width:${pct}%"></span><b>${fmtPrice(pr)}</b><em>${fmtQty(qty)}</em></button>`;
      }).join("");
      return;
    }
    for (let i = 0; i < rowsData.length; i++) {
      const [pr, qty] = rowsData[i];
      const pct = Math.min(100, Math.round((qty / maxQty) * 100));
      const row = existing[i];
      row.dataset.v26ObPrice = String(pr);
      const bar = row.children[0];
      const pxEl = row.children[1];
      const qtyEl = row.children[2];
      if (bar) bar.style.width = `${pct}%`;
      if (pxEl) pxEl.textContent = fmtPrice(pr);
      if (qtyEl) qtyEl.textContent = fmtQty(qty);
    }
  }

  function renderOrderBook() {
    const asksEl = $("v26-ob-asks");
    const bidsEl = $("v26-ob-bids");
    const ratioBuyEl = $("v26-ob-ratio-buy");
    const ratioSellEl = $("v26-ob-ratio-sell");
    const ratioFill = $("v26-ob-ratio-fill");
    const titleEl = $("v26-ob-pair-lbl");
    if (!asksEl || !bidsEl) return;

    const p = resolvePair();
    if (titleEl) titleEl.textContent = p.apiPair;

    const asks = state.asks.slice(0, 9);
    const bids = state.bids.slice(0, 9);
    const maxAsk = Math.max(0.0001, ...asks.map((x) => x[1]));
    const maxBid = Math.max(0.0001, ...bids.map((x) => x[1]));

    // Reverse asks so lowest ask sits right above spread strip; update in-place so single clicks never drop
    syncOrderBookRows(asksEl, [...asks].reverse(), "ask", maxAsk);
    syncOrderBookRows(bidsEl, bids, "bid", maxBid);

    const topAsk = asks[0]?.[0] || 0;
    const topBid = bids[0]?.[0] || 0;
    const liveChartPx = getLivePrice();
    const mid = liveChartPx || (topAsk && topBid ? (topAsk + topBid) / 2 : 0);
    state.midPrice = mid;

    const sumBid = bids.reduce((a, b) => a + b[1], 0);
    const sumAsk = asks.reduce((a, b) => a + b[1], 0);
    const total = sumBid + sumAsk;
    if (total > 0) {
      const buyPct = Math.round((sumBid / total) * 100);
      const sellPct = 100 - buyPct;
      if (ratioBuyEl) ratioBuyEl.textContent = `Alış %${buyPct}`;
      if (ratioSellEl) ratioSellEl.textContent = `%${sellPct} Satış`;
      if (ratioFill) ratioFill.style.width = `${buyPct}%`;
    }
  }

  function closeOrderBook() {
    clearTimeout(state.obReconnect);
    if (state.obWs) {
      try { state.obWs.onclose = null; state.obWs.close(); } catch (_) {}
      state.obWs = null;
    }
    state.obKey = "";
  }

  function isCryptoVisible() {
    const block = $("omega-crypto-block");
    return Boolean(block && block.style.display !== "none");
  }

  function isObVisible() {
    return isCryptoVisible() && state.obOpen;
  }

  // Left Order Book: pure untouched Binance order book synced to the chart pair
  async function connectOrderBook(force = false) {
    if (!isObVisible()) return;
    const p = resolvePair();
    const key = `${p.market}:${p.apiPair}`;
    if (!force && state.obKey === key && state.obWs && state.obWs.readyState <= 1) return;

    closeOrderBook();
    state.obKey = key;

    try {
      const restUrl = p.market === "fapi"
        ? `https://fapi.binance.com/fapi/v1/depth?symbol=${encodeURIComponent(p.apiPair)}&limit=10`
        : `https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(p.apiPair)}&limit=10`;
      const snap = await fetch(restUrl, { cache: "no-store" }).then((r) => r.json());
      if (state.obKey !== key) return;
      if (Array.isArray(snap?.bids) && Array.isArray(snap?.asks)) {
        state.bids = snap.bids.map(([pr, q]) => [Number(pr), Number(q)]);
        state.asks = snap.asks.map(([pr, q]) => [Number(pr), Number(q)]);
        renderOrderBook();
      }
    } catch (_) {}

    try {
      const wsBase = p.market === "fapi" ? "wss://fstream.binance.com/ws" : "wss://stream.binance.com:9443/ws";
      const streamUrl = `${wsBase}/${p.apiPair.toLowerCase()}@depth10@100ms`;
      const ws = new WebSocket(streamUrl);
      state.obWs = ws;
      ws.onmessage = (ev) => {
        if (state.obWs !== ws) return;
        let d;
        try { d = JSON.parse(ev.data); } catch (_) { return; }
        const bids = d.bids || d.b;
        const asks = d.asks || d.a;
        if (Array.isArray(bids) && Array.isArray(asks)) {
          state.bids = bids.map(([pr, q]) => [Number(pr), Number(q)]).filter((x) => x[1] > 0);
          state.asks = asks.map(([pr, q]) => [Number(pr), Number(q)]).filter((x) => x[1] > 0);
          renderOrderBook();
        }
      };
      ws.onclose = () => {
        if (state.obWs !== ws) return;
        state.obWs = null;
        if (isObVisible()) {
          state.obReconnect = setTimeout(() => connectOrderBook(true), 2500);
        }
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    } catch (_) {}
  }

  function closeFuturesFeed() {
    clearTimeout(state.futReconnect);
    clearInterval(state.futPing);
    if (state.futWs) {
      try { state.futWs.onclose = null; state.futWs.close(); } catch (_) {}
      state.futWs = null;
    }
    state.futKey = "";
  }

  // Dedicated Multi-Exchange Futures Feed ONLY for Vadeli İşlem Hızlı Limit Motoru
  async function connectFuturesFeed(force = false) {
    if (!isCryptoVisible()) return;
    const p = resolvePair();
    const quote = ($("v10-quote")?.value || "USDT").toUpperCase();
    const base = p.apiPair.endsWith(quote) ? p.apiPair.slice(0, -quote.length) : p.base;
    const adapter = getActiveAdapter();
    const key = `${adapter.id}:${base}:${quote}`;
    if (!force && state.futKey === key && state.futWs && state.futWs.readyState <= 1) return;

    closeFuturesFeed();
    state.futKey = key;
    state.futBid = 0;
    state.futAsk = 0;
    state.futLast = 0;

    if (!adapter.wsUrl && !adapter.restTickerUrl) {
      state.futStatus = "needs_api";
      syncFastLimitEngine();
      return;
    }
    state.futStatus = "loading";
    syncFastLimitEngine();

    if (adapter.restTickerUrl && adapter.parseRest) {
      try {
        const res = await fetch(adapter.restTickerUrl(base, quote), { cache: "no-store" }).then((r) => r.json());
        if (state.futKey !== key) return;
        const parsed = adapter.parseRest(res);
        if (parsed?.unsupported) {
          state.futStatus = "unsupported";
          syncFastLimitEngine();
          return;
        }
        if (parsed && (parsed.bid > 0 || parsed.ask > 0)) {
          state.futBid = parsed.bid || parsed.last;
          state.futAsk = parsed.ask || parsed.last;
          state.futLast = parsed.last || ((state.futBid + state.futAsk) / 2);
          state.futStatus = "live";
          syncFastLimitEngine();
        }
      } catch (_) {}
    }

    if (!adapter.wsUrl) return;
    try {
      const ws = new WebSocket(adapter.wsUrl(base, quote));
      state.futWs = ws;
      ws.onopen = () => {
        if (state.futWs !== ws) return;
        if (adapter.wsSubscribe) {
          const msgs = adapter.wsSubscribe(base, quote);
          const list = Array.isArray(msgs) ? msgs : [msgs];
          list.forEach(m => { try { ws.send(JSON.stringify(m)); } catch (_) {} });
        }
        if (adapter.id === "mexc") {
          state.futPing = setInterval(() => {
            if (state.futWs === ws && ws.readyState === 1) {
              try { ws.send(JSON.stringify({ method: "ping" })); } catch (_) {}
            }
          }, 15000);
        } else if (adapter.id === "okx" || adapter.id === "bitget") {
          state.futPing = setInterval(() => {
            if (state.futWs === ws && ws.readyState === 1) {
              try { ws.send("ping"); } catch (_) {}
            }
          }, 20000);
        }
      };
      ws.onmessage = (ev) => {
        if (state.futWs !== ws) return;
        if (ev.data === "pong") return;
        let d;
        try { d = JSON.parse(ev.data); } catch (_) { return; }
        const parsed = adapter.parseWs(d);
        if (!parsed) return;
        if (parsed.unsupported) {
          state.futStatus = "unsupported";
          syncFastLimitEngine();
          return;
        }
        if (parsed.bid > 0) state.futBid = parsed.bid;
        if (parsed.ask > 0) state.futAsk = parsed.ask;
        if (parsed.last > 0) state.futLast = parsed.last;
        else if (state.futBid > 0 && state.futAsk > 0) state.futLast = (state.futBid + state.futAsk) / 2;
        if (state.futBid > 0 && state.futAsk > 0) {
          state.futStatus = "live";
          syncFastLimitEngine();
        }
      };
      ws.onclose = () => {
        clearInterval(state.futPing);
        if (state.futWs !== ws) return;
        state.futWs = null;
        if (isCryptoVisible() && state.futStatus !== "unsupported") {
          state.futReconnect = setTimeout(() => connectFuturesFeed(true), 2500);
        }
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    } catch (_) {}
  }

  function renderApiVault() {
    const box = $("v26-api-vault-body");
    if (!box) return;
    const user = window.V26_FIREBASE?.user || null;
    if (!user) {
      box.innerHTML = `
        <div class="v26-api-locked">
          <div>
            <b>Kişiye Özel Güvenli Bağlantı</b>
            <span>Borsa hesabınızı bağlamak için önce kendi hesabınızla giriş yapın. Anahtarlar sadece sizin oturumunuza özel tutulur, GitHub veya ortak kodlara yazılmaz.</span>
          </div>
          <button type="button" class="v26-api-login-btn" onclick="document.getElementById('v27-auth-trigger')?.click() || document.querySelector('.v27-auth-btn')?.click()">Giriş Yap</button>
        </div>
      `;
      return;
    }

    const storageKey = `v26_api_vault_${user.uid}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch (_) {}

    const hasKey = Boolean(saved.apiKey);
    box.innerHTML = `
      <div class="v26-api-user-row">
        <span class="v26-api-user-badge"><i class="fa-solid fa-user-shield"></i> ${user.email || "Oturum Açık"}</span>
        <span class="v26-api-status ${hasKey ? "ready" : ""}">${hasKey ? "Anahtar Hazır" : "Bağlı Değil"}</span>
      </div>
      <div class="v26-api-grid">
        <label>Borsa
          <select id="v26-api-ex">
            ${Object.values(FUTURES_EXCHANGES).map(ex => `<option value="${ex.id}" ${(saved.exchange || state.futuresExchange) === ex.id ? "selected" : ""}>${ex.label}</option>`).join("")}
          </select>
        </label>
        <label>Yetki
          <select id="v26-api-perm">
            <option value="readonly" ${saved.perm !== "futures" ? "selected" : ""}>Sadece Okuma (Güvenli)</option>
            <option value="futures" ${saved.perm === "futures" ? "selected" : ""}>Vadeli İşlem (Çekim Kapalı)</option>
          </select>
        </label>
        <label class="full">API Key<input id="v26-api-key" type="text" value="${saved.apiKey || ""}" placeholder="Borsa API Key..."></label>
        <label class="full">Secret Key<input id="v26-api-secret" type="password" value="${saved.secret || ""}" placeholder="Gizli Anahtar (Sadece cihazınızda tutulur)..."></label>
      </div>
      <div class="v26-api-actions">
        <button type="button" id="v26-api-save" class="v26-api-btn save"><i class="fa-solid fa-lock"></i> Kişisel Kasaya Kaydet</button>
        ${hasKey ? '<button type="button" id="v26-api-clear" class="v26-api-btn clear">Temizle</button>' : ""}
      </div>
      <div class="v26-api-note">Anahtarlarınız asla GitHub'a gönderilmez. Canlı para ile emir iletmek için borsada <b>Para Çekme yetkisini kapalı</b> tutup özel bir aracı sunucu bağlamanız yeterlidir.</div>
    `;

    $("v26-api-save")?.addEventListener("click", () => {
      const payload = {
        exchange: $("v26-api-ex")?.value || "binance",
        perm: $("v26-api-perm")?.value || "readonly",
        apiKey: ($("v26-api-key")?.value || "").trim(),
        secret: ($("v26-api-secret")?.value || "").trim(),
        updatedAt: Date.now()
      };
      if (!payload.apiKey) {
        if (typeof window.omega_ShowFinanceToast === "function") window.omega_ShowFinanceToast("Lütfen API Key girin.");
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setActiveFuturesExchange(payload.exchange);
      renderApiVault();
      if (typeof window.omega_ShowFinanceToast === "function") {
        window.omega_ShowFinanceToast(`${getActiveAdapter().label} API bilgileriniz sadece kişisel oturumunuza kaydedildi.`);
      }
    });

    $("v26-api-clear")?.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      renderApiVault();
      syncFastLimitEngine();
    });
  }

  function setActiveFuturesExchange(exId) {
    const next = FUTURES_EXCHANGES[exId] ? exId : "binance";
    state.futuresExchange = next;
    localStorage.setItem(LS_FUTURES_EX, next);
    state.futBid = 0;
    state.futAsk = 0;
    state.futLast = 0;
    state.futStatus = "loading";
    syncFastLimitEngine();
    connectFuturesFeed(true);
  }
  window.V26FuturesAdapter = {
    exchanges: FUTURES_EXCHANGES,
    getActive: () => getActiveAdapter(),
    setExchange: setActiveFuturesExchange
  };

  function mountUI() {
    if (state.mounted) return;
    const planPane = document.querySelector('#omega-crypto-block .crypto-v28-panel[data-crypto-pane="plan"]');
    if (!planPane) return;

    state.mounted = true;
    installOverrides();

    // Group label + input pairs cleanly into 2-column grid cards and hide duplicate Yön & unused 2x rows
    const formEl = planPane.querySelector(".crypto-v28-form");
    if (formEl && !formEl.dataset.v26Grouped) {
      formEl.dataset.v26Grouped = "1";
      const children = [...formEl.children];
      const pairs = [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].tagName === "LABEL" && children[i + 1]) {
          pairs.push([children[i], children[i + 1]]);
          i++;
        }
      }
      pairs.forEach(([lbl, ctrl]) => {
        if (ctrl.id === "v10-side" || ctrl.id === "v10-2x") {
          lbl.remove();
          ctrl.style.display = "none";
          return;
        }
        const wrap = document.createElement("div");
        wrap.className = "v26-plan-field";
        if (ctrl.id === "v10-entry") {
          wrap.classList.add("full");
          const headRow = document.createElement("div");
          headRow.className = "v26-field-head";
          const fillBtn = document.createElement("button");
          fillBtn.type = "button";
          fillBtn.className = "v26-fill-live-btn";
          fillBtn.textContent = "Canlı";
          fillBtn.onclick = () => {
            if (typeof window.omega_V10UseLiveAsEntry === "function") window.omega_V10UseLiveAsEntry();
          };
          headRow.appendChild(lbl);
          headRow.appendChild(fillBtn);
          wrap.appendChild(headRow);
        } else if (ctrl.id === "v10-liq") {
          wrap.classList.add("v26-liq-locked");
          wrap.dataset.tip = "Gerçek işlem aktif olunca likidasyon fiyatı otomatik belirir";
          wrap.title = "Gerçek işlem aktif olunca likidasyon fiyatı otomatik belirir";
          ctrl.readOnly = true;
          ctrl.placeholder = "";
          ctrl.title = "Gerçek işlem aktif olunca likidasyon fiyatı otomatik belirir";
          const headRow = document.createElement("div");
          headRow.className = "v26-field-head";
          const lockTag = document.createElement("span");
          lockTag.className = "v26-lock-tag";
          lockTag.innerHTML = '<i class="fa-solid fa-lock"></i> Kilitli';
          headRow.appendChild(lbl);
          headRow.appendChild(lockTag);
          wrap.appendChild(headRow);
        } else {
          if (ctrl.id === "v10-stop") ctrl.placeholder = "";
          wrap.appendChild(lbl);
        }
        wrap.appendChild(ctrl);
        formEl.appendChild(wrap);
      });
    }

    // Rename "CANLIYI GİRİŞ YAP" -> "CANLI FİYAT" & hide unused old dark wrapper gaps
    const topStrip = document.createElement("div");
    topStrip.className = "v26-trade-pro-top";
    topStrip.innerHTML = `
      <div class="v26-side-switch">
        <button type="button" class="v26-side-btn long active" data-v26-side-btn="long"><i class="fa-solid fa-arrow-trend-up"></i> LONG</button>
        <button type="button" class="v26-side-btn short" data-v26-side-btn="short"><i class="fa-solid fa-arrow-trend-down"></i> SHORT</button>
      </div>
      <div class="v26-trade-mode-row">
        <div class="v26-ord-tabs three">
          <button type="button" class="active" data-v26-ord="fastlimit">Hızlı Limit</button>
          <button type="button" data-v26-ord="limit">Limit</button>
          <button type="button" data-v26-ord="market">Piyasa</button>
        </div>
        <div class="v26-margin-tabs">
          <button type="button" class="active" data-v26-margin="cross">Çapraz</button>
          <button type="button" data-v26-margin="isolated">İzole</button>
        </div>
      </div>
      <div class="v26-stake-quick">
        <span>Hızlı Marjin:</span>
        ${[50, 100, 250, 500, 1000].map((v) => `<button type="button" data-v26-stake-q="${v}">$${v}</button>`).join("")}
      </div>
      <div class="v26-trade-notional-bar">
        <span>Pozisyon: <b id="v26-tp-notional">$1,000</b></span>
        <span>Tahmini Komisyon: <b id="v26-tp-fee">~$0.20 (Limit)</b></span>
      </div>
    `;
    planPane.insertBefore(topStrip, planPane.firstChild);

    // Fast Limit Scalping & Volatility Shield Engine
    const fastBox = document.createElement("div");
    fastBox.id = "v26-fast-limit-engine";
    fastBox.className = "v26-fast-limit-engine";
    fastBox.innerHTML = `
      <div class="v26-fl-head">
        <b id="v26-fl-engine-title"><i class="fa-solid fa-bolt"></i> ${getActiveAdapter().label} Vadeli İşlem Hızlı Limit Motoru</b>
        <div class="v26-fl-head-right">
          <select id="v26-fl-ex-select" class="v26-fl-ex-select" title="Vadeli borsa veri kaynağını seç">
            ${Object.values(FUTURES_EXCHANGES).map(ex => `<option value="${ex.id}" ${state.futuresExchange === ex.id ? "selected" : ""}>${ex.label}</option>`).join("")}
          </select>
          <span class="v26-fl-vol-badge calm" id="v26-fl-vol-badge">Normal · Tampon %0.03</span>
        </div>
      </div>
      <div class="v26-fl-bbo" id="v26-fl-bbo-readout">Emir defteri bekleniyor...</div>
      <div class="v26-fl-buf-row">
        <span>Oynaklık Kalkanı:</span>
        <div class="v26-fl-buf-pills two">
          <button type="button" class="active" data-v26-vol-buf="0" title="Emir defterindeki en iyi fiyattan sıfır kayma ile alır">BBO %0</button>
          <button type="button" data-v26-vol-buf="auto" title="En iyi defter fiyatından alır; piyasa çok oynaksa %0.03-%0.15 koruma sınırı uygular">Oto Oynak</button>
        </div>
      </div>
      <div class="v26-fl-actions">
        <button type="button" class="v26-fl-btn long" id="v26-fl-open-long">
          <span><i class="fa-solid fa-bolt"></i> HIZLI LONG</span>
          <small id="v26-fl-long-px">-</small>
        </button>
        <button type="button" class="v26-fl-btn short" id="v26-fl-open-short">
          <span><i class="fa-solid fa-bolt"></i> HIZLI SHORT</span>
          <small id="v26-fl-short-px">-</small>
        </button>
      </div>
      <div class="v26-active-scalp-card" id="v26-active-scalp-card" style="display:none;"></div>
      <div class="v26-fl-foot">
        <span id="v26-fl-1h-stat">Son 1 Saat: <b>0</b> İşlem · Net <em>$0.00</em></span>
        <button type="button" id="v26-fl-clear-hist" title="Son 1 saat sayacını sıfırla">Sıfırla</button>
      </div>
    `;
    planPane.insertBefore(fastBox, topStrip.nextSibling);

    // Per-User API Vault cleanly inside İşlem pane
    const extras = document.createElement("div");
    extras.className = "v26-trade-pro-extras";
    extras.innerHTML = `
      <div class="v26-api-card">
        <button type="button" class="v26-api-toggle" id="v26-api-toggle">
          <span><i class="fa-solid fa-key"></i> Borsa Hesabı Bağla (Kişiye Özel)</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="v26-api-vault-body" id="v26-api-vault-body" style="display:none;"></div>
      </div>
    `;
    planPane.appendChild(extras);

    function syncOrderBookVisibility() {
      const obEl = $("v26-left-ob");
      const tgl = $("v26-ob-dock-toggle");
      if (obEl) obEl.style.display = state.obOpen ? "flex" : "none";
      if (tgl) tgl.classList.toggle("active", state.obOpen);
      if (isCryptoVisible()) connectOrderBook(false);
      else closeOrderBook();
      setTimeout(() => window.dispatchEvent(new Event("resize")), 30);
    }

    function mountOrderBookDock() {
      const stage = $("v26-chart-stage");
      const wrap = document.querySelector("#omega-crypto-block .crypto-v12-chart-wrap");
      if (!stage || !wrap || $("v26-left-ob")) return;
      const obCard = document.createElement("div");
      obCard.id = "v26-left-ob";
      obCard.className = "v26-left-ob v26-ob-card";
      obCard.innerHTML = `
        <div class="v26-ob-head">
          <b><i class="fa-solid fa-layer-group"></i> Emir Defteri</b>
          <div style="display:inline-flex;align-items:center;gap:6px;">
            <span id="v26-ob-pair-lbl">BTCUSDT</span>
            <button type="button" id="v26-ob-close-btn" class="v26-ob-close" title="Gizle">×</button>
          </div>
        </div>
        <div class="v26-ob-col-head"><span>Fiyat ($)</span><span>Miktar</span></div>
        <div class="v26-ob-asks" id="v26-ob-asks" style="border-bottom:1px solid rgba(148,163,184,0.16);padding-bottom:4px;margin-bottom:4px;"></div>
        <div class="v26-ob-bids" id="v26-ob-bids"></div>
        <div class="v26-ob-ratio">
          <div class="v26-ob-ratio-labels"><span id="v26-ob-ratio-buy" class="up">Alış %50</span><span id="v26-ob-ratio-sell" class="down">%50 Satış</span></div>
          <div class="v26-ob-ratio-track"><div id="v26-ob-ratio-fill" style="width:50%"></div></div>
        </div>
      `;
      stage.insertBefore(obCard, wrap);

      let lastObPickMs = 0;
      const pickOrderBookRow = (e) => {
        if (e.target.closest("#v26-ob-close-btn")) return;
        const obRow = e.target.closest("[data-v26-ob-price]");
        if (!obRow) return;
        if (e.type === "mousedown") {
          if (e.button !== 0) return;
          e.preventDefault();
          lastObPickMs = Date.now();
        } else if (e.type === "click" && Date.now() - lastObPickMs < 400) {
          return;
        }
        const pr = obRow.dataset.v26ObPrice;
        const entryEl = $("v10-entry");
        if (entryEl && pr) {
          entryEl.value = pr;
          entryEl.dispatchEvent(new Event("input", { bubbles: true }));
          entryEl.dispatchEvent(new Event("change", { bubbles: true }));
          if (typeof window.v26CryptoUpdatePriceLines === "function") window.v26CryptoUpdatePriceLines();
          if (typeof window.omega_V10UpdateTpOutputs === "function") window.omega_V10UpdateTpOutputs();
          syncTradeSummaries();
          obRow.classList.add("picked");
          setTimeout(() => obRow.classList.remove("picked"), 240);
          if (typeof window.omega_ShowFinanceToast === "function") {
            window.omega_ShowFinanceToast(`Giriş fiyatı $${fmtPrice(pr)} olarak seçildi.`);
          }
        }
      };

      obCard.addEventListener("mousedown", pickOrderBookRow);
      obCard.addEventListener("click", (e) => {
        if (e.target.closest("#v26-ob-close-btn")) {
          state.obOpen = false;
          localStorage.setItem(LS_OB_OPEN, "0");
          syncOrderBookVisibility();
          return;
        }
        pickOrderBookRow(e);
      });

      const tgl = $("v26-ob-dock-toggle");
      if (tgl && !tgl.dataset.v26ObBound) {
        tgl.dataset.v26ObBound = "1";
        tgl.onclick = () => {
          state.obOpen = !state.obOpen;
          localStorage.setItem(LS_OB_OPEN, state.obOpen ? "1" : "0");
          syncOrderBookVisibility();
        };
      }

      syncOrderBookVisibility();
    }

    mountOrderBookDock();
    window.addEventListener("v26-crypto-candles-updated", mountOrderBookDock);
    setTimeout(mountOrderBookDock, 400);

    // Bind events
    topStrip.addEventListener("click", (e) => {
      const sideBtn = e.target.closest("[data-v26-side-btn]");
      if (sideBtn) {
        const sel = $("v10-side");
        if (sel) {
          sel.value = sideBtn.dataset.v26SideBtn;
          sel.dispatchEvent(new Event("input", { bubbles: true }));
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        syncTradeSummaries();
        return;
      }
      const ordBtn = e.target.closest("[data-v26-ord]");
      if (ordBtn) {
        state.orderType = ordBtn.dataset.v26Ord;
        topStrip.querySelectorAll("[data-v26-ord]").forEach((b) => b.classList.toggle("active", b === ordBtn));
        if (state.orderType === "market" || state.orderType === "fastlimit") {
          const info = getMarketVolatilityInfo();
          const side = ($("v10-side")?.value || "long").toLowerCase();
          const px = state.orderType === "fastlimit"
            ? (side === "long" ? info.fastLongLimit : info.fastShortLimit)
            : getLivePrice();
          const entryEl = $("v10-entry");
          if (entryEl && px) {
            entryEl.value = px;
            entryEl.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
        syncTradeSummaries();
        return;
      }
      const mBtn = e.target.closest("[data-v26-margin]");
      if (mBtn) {
        state.marginMode = mBtn.dataset.v26Margin;
        topStrip.querySelectorAll("[data-v26-margin]").forEach((b) => b.classList.toggle("active", b === mBtn));
        return;
      }
      const sBtn = e.target.closest("[data-v26-stake-q]");
      if (sBtn) {
        const stEl = $("v10-stake");
        if (stEl) {
          stEl.value = sBtn.dataset.v26StakeQ;
          stEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
        syncTradeSummaries();
      }
    });

    $("v26-fl-ex-select")?.addEventListener("change", (e) => {
      setActiveFuturesExchange(e.target.value);
    });

    fastBox.addEventListener("click", (e) => {
      const bufBtn = e.target.closest("[data-v26-vol-buf]");
      if (bufBtn) {
        state.volBufferMode = bufBtn.dataset.v26VolBuf;
        syncFastLimitEngine();
        return;
      }
      if (e.target.closest("#v26-fl-open-long")) {
        openFastLimitPosition("long");
        return;
      }
      if (e.target.closest("#v26-fl-open-short")) {
        openFastLimitPosition("short");
        return;
      }
      if (e.target.closest("#v26-fl-close-now")) {
        closeFastLimitPosition();
        return;
      }
      if (e.target.closest("#v26-fl-clear-hist")) {
        state.scalpHistory = [];
        saveScalpState();
        syncFastLimitEngine();
      }
    });

    setInterval(() => {
      if (state.activeScalp && isCryptoVisible()) syncFastLimitEngine();
    }, 1000);

    extras.addEventListener("click", (e) => {
      if (e.target.closest("#v26-api-toggle")) {
        state.apiSubOpen = !state.apiSubOpen;
        const body = $("v26-api-vault-body");
        if (body) body.style.display = state.apiSubOpen ? "grid" : "none";
        if (state.apiSubOpen) renderApiVault();
      }
    });

    ["v10-stake", "v10-lev", "v10-side"].forEach((id) => {
      $(id)?.addEventListener("input", syncTradeSummaries);
      $(id)?.addEventListener("change", syncTradeSummaries);
    });
    $("v10-symbol")?.addEventListener("change", () => setTimeout(() => { connectOrderBook(true); connectFuturesFeed(true); }, 80));

    window.addEventListener("v26-auth-ready", () => {
      const vaultEx = getConnectedVaultExchange();
      if (vaultEx && vaultEx !== state.futuresExchange) {
        setActiveFuturesExchange(vaultEx);
      }
      if (state.apiSubOpen) renderApiVault();
    });

    const obs = new MutationObserver(() => {
      if (isCryptoVisible()) {
        mountOrderBookDock();
        connectOrderBook(false);
        connectFuturesFeed(false);
      } else {
        closeOrderBook();
        closeFuturesFeed();
      }
    });
    const block = $("omega-crypto-block");
    if (block) obs.observe(block, { attributes: true, attributeFilter: ["style"] });

    window.v26OnLiveTradeTick = (pair, price) => {
      if (!price || resolvePair().apiPair !== pair) return;
      state.midPrice = price;
      const midEl = $("v26-ob-mid");
      if (midEl) midEl.textContent = "$" + fmtPrice(price);
    };

    syncTradeSummaries();
    if (isCryptoVisible()) {
      connectOrderBook(false);
      connectFuturesFeed(false);
    }
  }

  function init() {
    mountUI();
    if (!state.mounted) setTimeout(mountUI, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
