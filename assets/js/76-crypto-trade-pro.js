// ===============================
// V26 CRYPTO TRADE PRO: LONG/SHORT PILLS, LIVE ORDER BOOK, COLORFUL RISK & PER-USER API VAULT
// ===============================

(function () {
  function $(id) { return document.getElementById(id); }

  const LS_OB_OPEN = "v26_crypto_ob_open";
  const LS_SCALP_POS = "v26_fast_scalp_pos_v1";
  const LS_SCALP_HIST = "v26_fast_scalp_hist_v1";

  function loadJson(key, fb) {
    try { return JSON.parse(localStorage.getItem(key) || "") ?? fb; } catch (_) { return fb; }
  }

  const state = {
    mounted: false,
    orderType: "fastlimit", // "fastlimit" | "limit" | "market"
    volBufferMode: "auto", // "auto" | "0" | "0.03" | "0.08"
    marginMode: "cross", // "cross" | "isolated"
    obOpen: localStorage.getItem(LS_OB_OPEN) !== "0",
    obWs: null,
    obKey: "",
    obReconnect: null,
    bids: [],
    asks: [],
    midPrice: 0,
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
    const topAsk = state.asks[0]?.[0] || 0;
    const topBid = state.bids[0]?.[0] || 0;
    const live = getLivePrice();
    const mid = topAsk && topBid ? (topAsk + topBid) / 2 : live;
    const spreadPct = topAsk && topBid && topAsk > 0 ? ((topAsk - topBid) / topAsk) * 100 : 0.015;
    const meta = typeof window.v26GetCryptoMarketMeta === "function" ? window.v26GetCryptoMarketMeta() : null;
    const atrPct = Number(meta?.atrPct || 0);
    // Combine spread and ATR volatility for auto buffer calculation
    const volScore = Math.max(spreadPct * 2.5, atrPct * 0.06);
    const autoBufPct = Math.min(0.18, Math.max(0.02, volScore || 0.03));
    const bufPct = state.volBufferMode === "auto" ? autoBufPct : Number(state.volBufferMode || 0);

    let levelLabel = "Normal";
    let levelCls = "calm";
    if (atrPct >= 1.8 || spreadPct >= 0.06) {
      levelLabel = "Çok Oynak ⚡";
      levelCls = "hot";
    } else if (atrPct >= 0.7 || spreadPct >= 0.025) {
      levelLabel = "Hareketli";
      levelCls = "warm";
    }

    const askBase = topAsk || live || mid;
    const bidBase = topBid || live || mid;
    const dec = mid >= 1000 ? 2 : mid >= 1 ? 4 : 6;
    const fastLongLimit = askBase > 0 ? Number((askBase * (1 + bufPct / 100)).toFixed(dec)) : 0;
    const fastShortLimit = bidBase > 0 ? Number((bidBase * (1 - bufPct / 100)).toFixed(dec)) : 0;

    return { topAsk, topBid, mid, spreadPct, atrPct, bufPct, levelLabel, levelCls, fastLongLimit, fastShortLimit, dec };
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
    const entryPrice = side === "long" ? info.fastLongLimit : info.fastShortLimit;
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
      ? (pos.side === "long" ? info.fastShortLimit : info.fastLongLimit)
      : pos.entry;
    const closePrice = rawClose > 0 ? rawClose : pos.entry;
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
      bboEl.textContent = info.mid > 0
        ? `Alış $${fmtPrice(info.topBid || info.mid)} · Satış $${fmtPrice(info.topAsk || info.mid)}`
        : "Emir defteri bekleniyor...";
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

  function renderOrderBook() {
    const asksEl = $("v26-ob-asks");
    const bidsEl = $("v26-ob-bids");
    const spreadEl = $("v26-ob-spread");
    const midEl = $("v26-ob-mid");
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

    // Reverse asks so lowest ask sits right above spread strip
    asksEl.innerHTML = [...asks].reverse().map(([pr, qty]) => {
      const pct = Math.min(100, Math.round((qty / maxAsk) * 100));
      return `
        <button type="button" class="v26-ob-row ask" data-v26-ob-price="${pr}">
          <span class="v26-ob-bar" style="width:${pct}%"></span>
          <b>${fmtPrice(pr)}</b>
          <em>${fmtQty(qty)}</em>
        </button>
      `;
    }).join("") || '<div class="v26-ob-empty">Emir defteri bekleniyor...</div>';

    bidsEl.innerHTML = bids.map(([pr, qty]) => {
      const pct = Math.min(100, Math.round((qty / maxBid) * 100));
      return `
        <button type="button" class="v26-ob-row bid" data-v26-ob-price="${pr}">
          <span class="v26-ob-bar" style="width:${pct}%"></span>
          <b>${fmtPrice(pr)}</b>
          <em>${fmtQty(qty)}</em>
        </button>
      `;
    }).join("") || '<div class="v26-ob-empty">Emir defteri bekleniyor...</div>';

    const topAsk = asks[0]?.[0] || 0;
    const topBid = bids[0]?.[0] || 0;
    const mid = topAsk && topBid ? (topAsk + topBid) / 2 : getLivePrice();
    state.midPrice = mid;
    if (midEl) midEl.textContent = mid ? "$" + fmtPrice(mid) : "$-";
    if (spreadEl && topAsk && topBid) {
      const sp = ((topAsk - topBid) / topAsk) * 100;
      spreadEl.textContent = `Makas %${sp.toFixed(3)}`;
    }

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
    syncFastLimitEngine();
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
    return Boolean(block && block.style.display !== "none" && state.obOpen);
  }

  async function connectOrderBook(force = false) {
    if (!isCryptoVisible()) return;
    const p = resolvePair();
    const key = `${p.market}:${p.apiPair}`;
    if (!force && state.obKey === key && state.obWs && state.obWs.readyState <= 1) return;

    closeOrderBook();
    state.obKey = key;

    // Fetch REST snapshot immediately
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

    // Live WebSocket stream
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
        if (isCryptoVisible()) {
          state.obReconnect = setTimeout(() => connectOrderBook(true), 2500);
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
            <option value="binance" ${saved.exchange === "binance" ? "selected" : ""}>Binance</option>
            <option value="okx" ${saved.exchange === "okx" ? "selected" : ""}>OKX</option>
            <option value="bybit" ${saved.exchange === "bybit" ? "selected" : ""}>Bybit</option>
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
      renderApiVault();
      if (typeof window.omega_ShowFinanceToast === "function") {
        window.omega_ShowFinanceToast("API bilgileriniz sadece kişisel oturumunuza kaydedildi.");
      }
    });

    $("v26-api-clear")?.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      renderApiVault();
    });
  }

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
          ctrl.readOnly = true;
          ctrl.placeholder = "Gerçek işlemde otomatik gelir";
          ctrl.title = "Gerçek işlem veya Hızlı Limit açıldığında otomatik dolar";
          const headRow = document.createElement("div");
          headRow.className = "v26-field-head";
          const lockTag = document.createElement("span");
          lockTag.className = "v26-lock-tag";
          lockTag.innerHTML = '<i class="fa-solid fa-lock"></i> Kilitli';
          headRow.appendChild(lbl);
          headRow.appendChild(lockTag);
          wrap.appendChild(headRow);
        } else {
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
        <b><i class="fa-solid fa-bolt"></i> Hızlı Limit Motoru</b>
        <span class="v26-fl-vol-badge calm" id="v26-fl-vol-badge">Normal · Tampon %0.03</span>
      </div>
      <div class="v26-fl-bbo" id="v26-fl-bbo-readout">Emir defteri bekleniyor...</div>
      <div class="v26-fl-buf-row">
        <span>Oynaklık Kalkanı:</span>
        <div class="v26-fl-buf-pills">
          <button type="button" class="active" data-v26-vol-buf="auto" title="Oynaklığa göre otomatik kayma tamponu">Oto Oynak</button>
          <button type="button" data-v26-vol-buf="0" title="En iyi defter fiyatından sıfır kayma">BBO %0</button>
          <button type="button" data-v26-vol-buf="0.03">%0.03</button>
          <button type="button" data-v26-vol-buf="0.08">%0.08</button>
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
        <div class="v26-ob-asks" id="v26-ob-asks"></div>
        <div class="v26-ob-mid-strip">
          <b id="v26-ob-mid">$-</b>
          <span id="v26-ob-spread">Makas -</span>
        </div>
        <div class="v26-ob-bids" id="v26-ob-bids"></div>
        <div class="v26-ob-ratio">
          <div class="v26-ob-ratio-labels"><span id="v26-ob-ratio-buy" class="up">Alış %50</span><span id="v26-ob-ratio-sell" class="down">%50 Satış</span></div>
          <div class="v26-ob-ratio-track"><div id="v26-ob-ratio-fill" style="width:50%"></div></div>
        </div>
      `;
      stage.insertBefore(obCard, wrap);

      obCard.addEventListener("click", (e) => {
        if (e.target.closest("#v26-ob-close-btn")) {
          state.obOpen = false;
          localStorage.setItem(LS_OB_OPEN, "0");
          syncOrderBookVisibility();
          return;
        }
        const obRow = e.target.closest("[data-v26-ob-price]");
        if (obRow) {
          const pr = obRow.dataset.v26ObPrice;
          const entryEl = $("v10-entry");
          if (entryEl && pr) {
            entryEl.value = pr;
            entryEl.dispatchEvent(new Event("input", { bubbles: true }));
            if (typeof window.omega_ShowFinanceToast === "function") {
              window.omega_ShowFinanceToast(`Giriş fiyatı ${fmtPrice(pr)} olarak dolduruldu.`);
            }
          }
        }
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
    $("v10-symbol")?.addEventListener("change", () => setTimeout(() => connectOrderBook(true), 80));

    window.addEventListener("v26-auth-ready", () => {
      if (state.apiSubOpen) renderApiVault();
    });

    const obs = new MutationObserver(() => {
      if (isCryptoVisible()) {
        mountOrderBookDock();
        connectOrderBook(false);
      } else {
        closeOrderBook();
      }
    });
    const block = $("omega-crypto-block");
    if (block) obs.observe(block, { attributes: true, attributeFilter: ["style"] });

    syncTradeSummaries();
    if (isCryptoVisible()) connectOrderBook(false);
  }

  function init() {
    mountUI();
    if (!state.mounted) setTimeout(mountUI, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
