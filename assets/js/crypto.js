// ===============================
// V26 CRYPTO TERMINAL PRO FIX
// Grafik UI, mum çizimi, zoom/pan, fiyat ekseni ve alarm paneli düzeltmeleri
// ===============================

(function () {
  const STATE = {
    bound: false,
    draggingAxis: null,
    draggingPan: null,
    selected: null,
    lastMouse: null,
    resizeTimer: null
  };



  // Güvenli global başlangıçlar: eski inline kod bu değişkenleri her zaman tanımlamıyor.
  window._V15_Y_SCALE = Number(localStorage.getItem("v15_y_scale") || window._V15_Y_SCALE || 1);
  window._V12_SHOW_MA = false;
  localStorage.setItem("v12_show_ma", "0");

  function $(id) { return document.getElementById(id); }

  function toast(msg) {
    if (typeof window.omega_ShowFinanceToast === "function") window.omega_ShowFinanceToast(msg);
    else if (typeof window.omega_FinanceToast === "function") window.omega_FinanceToast(msg);
    else console.log(msg);
  }

  function safePlan() {
    if (typeof omega_V10GetPlan === "function") return omega_V10GetPlan();
    return { symbol: "BTC", quote: "USDT", exchange: "binance", side: "long", stake: 0, lev: 1, entry: 0, liq: 0, stop: 0, tps: [] };
  }

  function priceFmt(v) {
    if (typeof omega_V10FormatPrice === "function") return omega_V10FormatPrice(v);
    v = Number(v);
    if (!isFinite(v)) return "-";
    if (v >= 1000) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (v >= 1) return "$" + v.toFixed(4);
    return "$" + v.toPrecision(6);
  }

  function symbolKey(plan = safePlan()) {
    if (typeof omega_V12SymbolKey === "function") return omega_V12SymbolKey(plan);
    return `${plan.exchange}:${plan.symbol}${plan.quote}`.toUpperCase();
  }

  function css() {
    if ($("v26-crypto-pro-style")) return;
    const s = document.createElement("style");
    s.id = "v26-crypto-pro-style";
    s.textContent = `
      .crypto-v10-chart-panel { border-color: rgba(251,191,36,.20) !important; }
      .crypto-v10-chart-head { align-items:center !important; }
      .crypto-v10-price b { font-size: 1.55em !important; color: #fbbf24 !important; }
      .crypto-v10-price span { font-size: .82em !important; }
      .crypto-v10-timeframes { gap: 6px !important; padding: 8px; background:#080808; border:1px solid #222; border-radius:14px; }
      .tf-v10 { padding: 9px 11px !important; border-radius: 9px !important; background:#101010 !important; }
      .tf-v10.active { background:#fbbf24 !important; color:#171000 !important; border-color:#fbbf24 !important; }
      .crypto-v12-toolbar { gap: 8px !important; padding: 10px !important; background:#090909 !important; border-color:#292929 !important; align-items:center!important; }
      #tool-ma { display:none !important; }
      .crypto-v10-canvas.axis-hover { cursor: ns-resize !important; }
      .chart-tool-btn { border-radius: 10px !important; padding: 9px 11px !important; background:#141414 !important; color:#ddd !important; border:1px solid #303030 !important; }
      .chart-tool-btn:hover { border-color:#fbbf24 !important; color:#fbbf24 !important; }
      .chart-tool-btn.active { background:#fbbf24 !important; color:#171000 !important; border-color:#fbbf24 !important; }
      .chart-tool-btn.green { color:#10b981 !important; border-color:rgba(16,185,129,.35) !important; background:rgba(16,185,129,.07) !important; }
      .chart-tool-btn.green.active { background:#10b981 !important; color:#00170d !important; }
      .chart-tool-btn.red { color:#ff8a8a !important; border-color:rgba(239,68,68,.38) !important; background:rgba(239,68,68,.07) !important; }
      .chart-tool-btn.red.active { background:#ef4444 !important; color:#fff !important; }
      .crypto-v12-chart-wrap { position:relative; background:#020202; border:1px solid #222; border-radius:18px; padding:10px; }
      .crypto-v10-canvas { height: 560px !important; background:#020202 !important; border:none !important; border-radius:14px !important; cursor: crosshair !important; }
      .v26-chart-tip { margin-top:10px; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .v26-chart-tip div { background:#090909; border:1px solid #252525; border-radius:12px; padding:9px 10px; color:#9ca3af; font-size:.72em; font-weight:850; line-height:1.45; }
      .v26-chart-tip b { color:#fbbf24; }
      .crypto-v10-chart-caption { background:#080808 !important; border:1px solid #252525 !important; border-radius:12px !important; padding:10px 12px !important; color:#aaa !important; }
      .crypto-v12-alarm-box { border-color:#292929 !important; background:#090909 !important; }
      .crypto-v12-alarm-head span, .alarm-v13-help { color:#9ca3af !important; }
      .alarm-v13-help { display:none !important; }
      .alarm-v13-grid { grid-template-columns:1fr 1fr 1fr !important; }
      .alarm-v13-actions { grid-template-columns:1fr 1fr 1fr !important; }
      .alarm-v12-row { border-color:#292929 !important; background:#101010 !important; }
      .alarm-v12-row button { background:#2a1515 !important; color:#ffb4b4 !important; }
      .v26-floating-trash { position:absolute; z-index:20; display:none; width:34px; height:34px; border-radius:11px; border:1px solid rgba(239,68,68,.5); background:#2a0f0f; color:#fff; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,.45); }
      .v26-floating-trash.show { display:flex; }
      .v26-selected-line { filter: drop-shadow(0 0 7px rgba(251,191,36,.6)); }
      #crypto-v10-status { display:none !important; }
      @media(max-width:900px){ .v26-chart-tip{grid-template-columns:1fr;} .crypto-v10-canvas{height:420px!important;} .alarm-v13-grid,.alarm-v13-actions{grid-template-columns:1fr!important;} }
    `;
    document.head.appendChild(s);
  }

  function installUi() {
    css();
    const toolbar = document.querySelector(".crypto-v12-toolbar");
    if (toolbar && !toolbar.dataset.v26Pro) {
      toolbar.dataset.v26Pro = "1";
      toolbar.innerHTML = `
        <button class="chart-tool-btn green" id="tool-alarm" onclick="omega_V12SetDrawMode('alarm')"><i class="fa-solid fa-bell"></i> Alarm</button>
        <button class="chart-tool-btn" id="tool-hline" onclick="omega_V12SetDrawMode('hline')"><i class="fa-solid fa-grip-lines"></i> Fiyat Çizgisi</button>
        <button class="chart-tool-btn green" id="tool-trend-green" onclick="omega_V14SetTrendTool('green')"><i class="fa-solid fa-arrow-trend-up"></i> Yeşil Trend</button>
        <button class="chart-tool-btn red" id="tool-trend-red" onclick="omega_V14SetTrendTool('red')"><i class="fa-solid fa-arrow-trend-down"></i> Kırmızı Trend</button>
        <button class="chart-tool-btn red" onclick="v26CryptoDeleteSelected()"><i class="fa-solid fa-trash"></i> Seçileni Sil</button>
        <button class="chart-tool-btn red" onclick="omega_V14ClearDrawingsForSymbol()"><i class="fa-solid fa-trash-can"></i> Tümünü Sil</button>
      `;
    }

    const wrap = document.querySelector(".crypto-v12-chart-wrap");
    if (wrap && !$("v26-floating-trash")) {
      const btn = document.createElement("button");
      btn.id = "v26-floating-trash";
      btn.className = "v26-floating-trash";
      btn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
      btn.onclick = window.v26CryptoDeleteSelected;
      wrap.appendChild(btn);
    }

    const canvas = $("crypto-v10-chart");
    if (canvas && !document.querySelector(".v26-chart-tip")) {
      canvas.insertAdjacentHTML("afterend", `
        <div class="v26-chart-tip">
          <div><b>Zoom:</b> Mouse tekerleği grafiği yakınlaştırır / uzaklaştırır.</div>
          <div><b>Fiyat ölçeği:</b> Sağdaki fiyat alanında basılı tutup yukarı/aşağı sürükle.</div>
          <div><b>Çizim:</b> Trend aracını seç, grafikte basılı tutup sürükle.</div>
        </div>
      `);
    }

    const alarmHead = document.querySelector(".crypto-v12-alarm-head span");
    if (alarmHead) alarmHead.textContent = "Alarm eklemek için fiyat yaz veya Grafikten Alarm butonuna basıp grafikte istediğin seviyeye tıkla. Yön otomatik seçilir.";

    const title = document.querySelector(".crypto-v12-alarm-head b");
    if (title) title.innerHTML = `<i class="fa-solid fa-bell"></i> Fiyat Alarmları`;
  }

  function visibleCandles() {
    const arr = Array.isArray(_V10_CANDLES) ? _V10_CANDLES : [];
    const n = arr.length;
    if (!n) return [];
    let s = Math.floor((_V12_VIEW_START ?? 0) * (n - 1));
    let e = Math.ceil((_V12_VIEW_END ?? 1) * n);
    s = Math.max(0, Math.min(n - 1, s));
    e = Math.max(s + 12, Math.min(n, e));
    return arr.slice(s, e).map((c, i) => ({ ...c, _globalIndex: s + i }));
  }

  function makeConverter(canvas) {
    const w = canvas.width, h = canvas.height;
    const left = 64, right = 108, top = 24, bottom = 58;
    const plotW = w - left - right, plotH = h - top - bottom;
    const candles = visibleCandles();
    const plan = safePlan();
    const key = symbolKey(plan);
    const levels = [];

    if (plan.entry) levels.push(plan.entry);
    if (plan.stop) levels.push(plan.stop);
    if (plan.liq) levels.push(plan.liq);
    if (_V10_PRICE) levels.push(_V10_PRICE);
    (plan.tps || []).forEach(t => t.price && levels.push(t.price));
    if (Array.isArray(_V12_ALARMS)) _V12_ALARMS.filter(a => a.key === key && !a.hit).forEach(a => levels.push(a.price));
    if (Array.isArray(_V12_DRAWINGS)) _V12_DRAWINGS.filter(d => d.key === key).forEach(d => {
      if (d.price) levels.push(d.price);
      if (d.y1) levels.push(d.y1);
      if (d.y2) levels.push(d.y2);
    });

    const values = candles.flatMap(c => [c.high, c.low]).concat(levels).filter(v => isFinite(Number(v)) && Number(v) > 0).map(Number);
    if (values.length < 2) return null;
    let lo = Math.min(...values), hi = Math.max(...values);
    const mid = (hi + lo) / 2;
    let half = Math.max((hi - lo) / 2, hi * 0.002);
    const scale = Math.max(0.12, Math.min(30, Number(window._V15_Y_SCALE || 1)));
    half *= scale;
    hi = mid + half * 1.08;
    lo = mid - half * 1.08;

    const yFor = price => top + (hi - price) / (hi - lo) * plotH;
    const priceForY = y => hi - ((y - top) / plotH) * (hi - lo);
    const xForIndex = idx => {
      const first = candles[0]?._globalIndex || 0;
      const last = candles[candles.length - 1]?._globalIndex || first + 1;
      const denom = Math.max(1, last - first);
      return left + ((idx - first) / denom) * plotW;
    };
    const indexForX = x => {
      const first = candles[0]?._globalIndex || 0;
      const last = candles[candles.length - 1]?._globalIndex || first + 1;
      const pct = Math.max(0, Math.min(1, (x - left) / plotW));
      return Math.round(first + pct * (last - first));
    };
    const candleAtIndex = idx => _V10_CANDLES[Math.max(0, Math.min(_V10_CANDLES.length - 1, Math.round(idx)))] || null;

    return { w, h, left, right, top, bottom, plotW, plotH, candles, lo, hi, yFor, priceForY, xForIndex, indexForX, candleAtIndex };
  }

  window.omega_V12ChartConverters = function () {
    const canvas = $("crypto-v10-chart");
    return canvas ? makeConverter(canvas) : null;
  };

  function drawText(ctx, text, x, y, color = "#aaa", size = 12, align = "left", weight = "700") {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px JetBrains Mono, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function line(ctx, x1, y1, x2, y2, color, width = 1, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function timeLabel(ts, short = false) {
    const d = new Date(ts);
    if (short) return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function drawAxes(ctx, conv) {
    const { left, top, plotW, plotH, w, h, candles } = conv;
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,.055)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = top + (plotH / 5) * i;
      line(ctx, left, y, left + plotW, y, "rgba(255,255,255,.055)");
      const p = conv.hi - ((conv.hi - conv.lo) / 5) * i;
      drawText(ctx, priceFmt(p), left + plotW + 10, y, "#8f8f8f", 12, "left", "800");
    }

    const ticks = Math.min(7, Math.max(2, Math.floor(candles.length / 40) + 2));
    for (let i = 0; i < ticks; i++) {
      const idx = Math.round((candles.length - 1) * (i / Math.max(1, ticks - 1)));
      const c = candles[idx];
      if (!c) continue;
      const x = conv.xForIndex(c._globalIndex);
      line(ctx, x, top, x, top + plotH, "rgba(255,255,255,.035)");
      drawText(ctx, timeLabel(c.time, true), x, h - 20, "#8f8f8f", 12, "center", "800");
    }

    line(ctx, left, top, left, top + plotH, "rgba(255,255,255,.10)");
    line(ctx, left + plotW, top, left + plotW, top + plotH, "rgba(255,255,255,.10)");
    line(ctx, left, top + plotH, left + plotW, top + plotH, "rgba(255,255,255,.10)");
  }

  function drawCandles(ctx, conv) {
    const { candles, yFor, xForIndex } = conv;
    if (!candles.length) return;
    const firstX = xForIndex(candles[0]._globalIndex);
    const secondX = candles[1] ? xForIndex(candles[1]._globalIndex) : firstX + 8;
    const spacing = Math.abs(secondX - firstX) || 8;
    const bodyW = Math.max(2.5, Math.min(13, spacing * 0.68));

    candles.forEach(c => {
      const x = xForIndex(c._globalIndex);
      const up = c.close >= c.open;
      const color = up ? "#00e093" : "#ff4d4d";
      const wickColor = up ? "rgba(0,224,147,.95)" : "rgba(255,77,77,.95)";
      const yH = yFor(c.high), yL = yFor(c.low), yO = yFor(c.open), yC = yFor(c.close);
      line(ctx, x, yH, x, yL, wickColor, 2);
      const y = Math.min(yO, yC);
      const height = Math.max(2, Math.abs(yC - yO));
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyW / 2, y, bodyW, height);
      ctx.strokeStyle = up ? "#21ffc0" : "#ff7070";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - bodyW / 2, y, bodyW, height);
    });
  }

  function drawLevel(ctx, conv, price, label, color, opts = {}) {
    if (!price) return;
    const y = conv.yFor(price);
    if (y < conv.top - 30 || y > conv.top + conv.plotH + 30) return;
    line(ctx, conv.left, y, conv.left + conv.plotW, y, color, opts.width || 1.5, opts.dash || []);
    const tagW = Math.max(78, ctx.measureText(priceFmt(price)).width + 18);
    roundRect(ctx, conv.left + conv.plotW + 8, y - 13, tagW, 26, 7, opts.tagBg || "rgba(0,0,0,.86)");
    drawText(ctx, priceFmt(price), conv.left + conv.plotW + 16, y, opts.tagColor || "#fff", 12, "left", "900");
    if (label) drawText(ctx, label, conv.left + 10, y - 12, color, 12, "left", "900");
  }


  function drawCurrentPriceTag(ctx, conv) {
    if (!_V10_PRICE) return;
    const y = conv.yFor(_V10_PRICE);
    if (y < conv.top - 30 || y > conv.top + conv.plotH + 30) return;
    const tagText = priceFmt(_V10_PRICE);
    const tagW = Math.max(82, ctx.measureText(tagText).width + 18);
    roundRect(ctx, conv.left + conv.plotW + 8, y - 13, tagW, 26, 7, "rgba(20,45,92,.92)");
    drawText(ctx, tagText, conv.left + conv.plotW + 16, y, "#93c5fd", 12, "left", "900");
  }

  function drawTradeLevels(ctx, conv) {
    const p = safePlan();
    if (p.entry) drawLevel(ctx, conv, p.entry, "GİRİŞ", "rgba(251,191,36,.92)", { width: 1.6, tagBg: "rgba(89,63,0,.95)", tagColor: "#fbbf24" });
    if (p.stop) drawLevel(ctx, conv, p.stop, "STOP", "rgba(239,68,68,.94)", { width: 1.8, tagBg: "rgba(80,16,16,.95)", tagColor: "#ff9a9a" });
    if (p.liq) drawLevel(ctx, conv, p.liq, "LİQ", "rgba(249,115,22,.92)", { width: 1.5, tagBg: "rgba(80,42,10,.95)", tagColor: "#fdba74" });
    (p.tps || []).forEach(tp => drawLevel(ctx, conv, tp.price, `TP${tp.index}`, "rgba(16,185,129,.92)", { width: 1.5, tagBg: "rgba(4,67,45,.95)", tagColor: "#86efac" }));
    drawCurrentPriceTag(ctx, conv);
  }

  function drawMA(ctx, conv) {
    return;
    const arr = conv.candles;
    if (arr.length < 22) return;
    ctx.save();
    ctx.strokeStyle = "rgba(251,191,36,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    arr.forEach((c, i) => {
      if (i < 19) return;
      const avg = arr.slice(i - 19, i + 1).reduce((s, x) => s + x.close, 0) / 20;
      const x = conv.xForIndex(c._globalIndex), y = conv.yFor(avg);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawObjects(ctx, conv) {
    const plan = safePlan();
    const key = symbolKey(plan);
    const drawings = Array.isArray(_V12_DRAWINGS) ? _V12_DRAWINGS.filter(d => d.key === key) : [];

    drawings.forEach(d => {
      if (d.type === "hline") {
        const selected = STATE.selected && STATE.selected.type === "drawing" && STATE.selected.id === d.id;
        drawLevel(ctx, conv, d.price, d.label || "ÇİZGİ", selected ? "#fbbf24" : "rgba(229,229,229,.78)", { width: selected ? 3 : 2 });
      }
      if (d.type === "trend") {
        const selected = STATE.selected && STATE.selected.type === "drawing" && STATE.selected.id === d.id;
        const color = d.color === "red" ? "#ff4d4d" : "#00e093";
        const x1 = conv.xForIndex(d.x1), y1 = conv.yFor(d.y1), x2 = conv.xForIndex(d.x2), y2 = conv.yFor(d.y2);
        line(ctx, x1, y1, x2, y2, selected ? "#fbbf24" : color, selected ? 4 : 3.2);
        ctx.fillStyle = selected ? "#fbbf24" : color;
        ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill();
      }
    });

    if (typeof _V12_PENDING_TREND !== "undefined" && _V12_PENDING_TREND && STATE.lastMouse) {
      const color = (typeof _V14_TREND_COLOR !== "undefined" && _V14_TREND_COLOR === "red") ? "#ff4d4d" : "#00e093";
      line(ctx, conv.xForIndex(_V12_PENDING_TREND.x1), conv.yFor(_V12_PENDING_TREND.y1), STATE.lastMouse.x, STATE.lastMouse.y, color, 3.2);
    }

    const alarms = Array.isArray(_V12_ALARMS) ? _V12_ALARMS.filter(a => a.key === key && !a.hit) : [];
    alarms.forEach(a => {
      const selected = STATE.selected && STATE.selected.type === "alarm" && STATE.selected.id === a.id;
      drawLevel(ctx, conv, a.price, a.dir === "above" ? "ALARM ÜST" : "ALARM ALT", selected ? "#fbbf24" : "rgba(168,85,247,.9)", { width: selected ? 3 : 1.8, dash: selected ? [] : [8, 6], tagBg: "rgba(55,20,85,.95)", tagColor: "#d8b4fe" });
    });
  }

  function drawCrosshair(ctx, conv) {
    if (!STATE.lastMouse) return;
    const x = Math.max(conv.left, Math.min(conv.left + conv.plotW, STATE.lastMouse.x));
    const y = Math.max(conv.top, Math.min(conv.top + conv.plotH, STATE.lastMouse.y));
    line(ctx, conv.left, y, conv.left + conv.plotW, y, "rgba(255,255,255,.20)", 1, [4, 5]);
    line(ctx, x, conv.top, x, conv.top + conv.plotH, "rgba(255,255,255,.20)", 1, [4, 5]);
    const price = conv.priceForY(y);
    const c = conv.candleAtIndex(conv.indexForX(x));
    const label = `${priceFmt(price)} · ${c ? timeLabel(c.time) : ""}`;
    roundRect(ctx, conv.left + 10, conv.top + 10, Math.min(360, ctx.measureText(label).width + 24), 28, 8, "rgba(0,0,0,.88)");
    drawText(ctx, label, conv.left + 22, conv.top + 24, "#e5e7eb", 12, "left", "900");
  }

  window.omega_V10DrawChart = function () {
    const canvas = $("crypto-v10-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const conv = makeConverter(canvas);
    if (!conv) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#030303";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText(ctx, "Grafik verisi bekleniyor", canvas.width / 2, canvas.height / 2, "#777", 14, "center", "900");
      return;
    }

    drawAxes(ctx, conv);
    drawCandles(ctx, conv);
    drawMA(ctx, conv);
    drawTradeLevels(ctx, conv);
    drawObjects(ctx, conv);
    drawCrosshair(ctx, conv);
    updateCaption(conv);
    positionTrash(conv);
  };

  function updateCaption(conv) {
    const cap = $("crypto-v10-caption");
    if (!cap) return;
    const first = conv.candles[0], last = conv.candles[conv.candles.length - 1];
    cap.innerHTML = `
      <span><b>${conv.candles.length}</b> mum gösteriliyor · ${first ? timeLabel(first.time, true) : "-"} → ${last ? timeLabel(last.time, true) : "-"}</span>
      <span>Wheel zoom · Sağ eksen fiyat ölçeği · Sürükle pan</span>
    `;
  }

  function hitTest(conv, x, y) {
    const plan = safePlan();
    const key = symbolKey(plan);
    const nearY = price => Math.abs(conv.yFor(price) - y) < 10;

    const alarms = Array.isArray(_V12_ALARMS) ? _V12_ALARMS.filter(a => a.key === key && !a.hit) : [];
    for (const a of alarms) if (nearY(a.price)) return { type: "alarm", id: a.id, x: conv.left + conv.plotW - 20, y: conv.yFor(a.price) };

    const drawings = Array.isArray(_V12_DRAWINGS) ? _V12_DRAWINGS.filter(d => d.key === key) : [];
    for (const d of drawings) {
      if (d.type === "hline" && nearY(d.price)) return { type: "drawing", id: d.id, x: conv.left + conv.plotW - 20, y: conv.yFor(d.price) };
      if (d.type === "trend") {
        const x1 = conv.xForIndex(d.x1), y1 = conv.yFor(d.y1), x2 = conv.xForIndex(d.x2), y2 = conv.yFor(d.y2);
        const dist = pointLineDistance(x, y, x1, y1, x2, y2);
        if (dist < 9) return { type: "drawing", id: d.id, x, y };
      }
    }
    return null;
  }

  function pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const len = C * C + D * D;
    let t = len ? dot / len : -1;
    t = Math.max(0, Math.min(1, t));
    const x = x1 + t * C, y = y1 + t * D;
    return Math.hypot(px - x, py - y);
  }

  function positionTrash(conv) {
    const btn = $("v26-floating-trash");
    if (!btn) return;
    if (!STATE.selected) { btn.classList.remove("show"); return; }
    const wrap = document.querySelector(".crypto-v12-chart-wrap");
    const canvas = $("crypto-v10-chart");
    if (!wrap || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const wrect = wrap.getBoundingClientRect();
    const sx = rect.width / canvas.width, sy = rect.height / canvas.height;
    const x = (STATE.selected.x || conv.left + conv.plotW - 30) * sx + (rect.left - wrect.left);
    const y = (STATE.selected.y || conv.top + 20) * sy + (rect.top - wrect.top);
    btn.style.left = `${Math.max(8, Math.min(wrect.width - 42, x + 8))}px`;
    btn.style.top = `${Math.max(8, Math.min(wrect.height - 42, y - 17))}px`;
    btn.classList.add("show");
  }

  window.v26CryptoDeleteSelected = function () {
    const sel = STATE.selected;
    if (!sel) { toast("Silmek için önce çizgi veya alarm seç."); return; }
    if (sel.type === "drawing" && Array.isArray(_V12_DRAWINGS)) {
      _V12_DRAWINGS = _V12_DRAWINGS.filter(d => d.id !== sel.id);
      if (typeof omega_V12SaveDrawings === "function") omega_V12SaveDrawings();
    }
    if (sel.type === "alarm" && Array.isArray(_V12_ALARMS)) {
      _V12_ALARMS = _V12_ALARMS.filter(a => a.id !== sel.id);
      if (typeof omega_V12SaveAlarms === "function") omega_V12SaveAlarms();
      if (typeof omega_V12RenderAlarms === "function") omega_V12RenderAlarms();
    }
    STATE.selected = null;
    omega_V10DrawChart();
  };

  function zoomAt(x, factor) {
    const canvas = $("crypto-v10-chart");
    const conv = canvas ? makeConverter(canvas) : null;
    if (!conv) return;
    const plotFrac = Math.max(0, Math.min(1, (x - conv.left) / conv.plotW));
    const width = _V12_VIEW_END - _V12_VIEW_START;
    const anchor = _V12_VIEW_START + plotFrac * width;
    const newWidth = Math.max(0.006, Math.min(1, width * factor));
    let ns = anchor - plotFrac * newWidth;
    let ne = ns + newWidth;
    if (ns < 0) { ne -= ns; ns = 0; }
    if (ne > 1) { ns -= ne - 1; ne = 1; }
    _V12_VIEW_START = Math.max(0, ns);
    _V12_VIEW_END = Math.min(1, ne);
    _V12_AUTO_FIT = false;
    omega_V10DrawChart();
  }

  function bindCanvas() {
    const old = $("crypto-v10-chart");
    if (!old || old.dataset.v26ProBound) return;
    const canvas = old.cloneNode(true);
    old.parentNode.replaceChild(canvas, old);
    canvas.dataset.v26ProBound = "1";

    canvas.addEventListener("mousedown", ev => {
      const conv = makeConverter(canvas); if (!conv) return;
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      STATE.lastMouse = { x, y };

      if (x > conv.left + conv.plotW) {
        STATE.draggingAxis = { startY: y, startScale: Number(window._V15_Y_SCALE || 1) };
        return;
      }

      if (typeof _V12_DRAW_MODE !== "undefined" && _V12_DRAW_MODE === "trend") {
        const key = symbolKey();
        _V12_PENDING_TREND = { x1: conv.indexForX(x), y1: conv.priceForY(y), key };
        omega_V10DrawChart();
        return;
      }

      if (typeof _V12_DRAW_MODE === "undefined" || !_V12_DRAW_MODE) {
        const hit = hitTest(conv, x, y);
        if (hit) {
          STATE.selected = hit;
          omega_V10DrawChart();
        } else {
          STATE.selected = null;
          STATE.draggingPan = { startX: x, startStart: _V12_VIEW_START, startEnd: _V12_VIEW_END };
        }
      }
    });

    canvas.addEventListener("mousemove", ev => {
      const conv = makeConverter(canvas); if (!conv) return;
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      STATE.lastMouse = { x, y };
      canvas.classList.toggle('axis-hover', x > conv.left + conv.plotW);

      if (STATE.draggingAxis) {
        const dy = y - STATE.draggingAxis.startY;
        window._V15_Y_SCALE = Math.max(0.12, Math.min(30, STATE.draggingAxis.startScale * Math.exp(dy / 170)));
        localStorage.setItem("v15_y_scale", String(window._V15_Y_SCALE));
        omega_V10DrawChart();
        return;
      }

      if (STATE.draggingPan) {
        const dx = x - STATE.draggingPan.startX;
        const width = STATE.draggingPan.startEnd - STATE.draggingPan.startStart;
        const shift = -(dx / conv.plotW) * width;
        let ns = STATE.draggingPan.startStart + shift;
        let ne = STATE.draggingPan.startEnd + shift;
        if (ns < 0) { ne -= ns; ns = 0; }
        if (ne > 1) { ns -= ne - 1; ne = 1; }
        _V12_VIEW_START = Math.max(0, ns);
        _V12_VIEW_END = Math.min(1, ne);
        _V12_AUTO_FIT = false;
        omega_V10DrawChart();
        return;
      }

      omega_V10DrawChart();
    });

    canvas.addEventListener("mouseup", ev => {
      const conv = makeConverter(canvas); if (!conv) return;
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);

      if (STATE.draggingAxis) { STATE.draggingAxis = null; return; }
      if (STATE.draggingPan) { STATE.draggingPan = null; return; }

      if (typeof _V12_DRAW_MODE !== "undefined" && _V12_DRAW_MODE === "trend" && _V12_PENDING_TREND) {
        const key = symbolKey();
        const color = (typeof _V14_TREND_COLOR !== "undefined" && _V14_TREND_COLOR) || "green";
        const x2 = conv.indexForX(x), y2 = conv.priceForY(y);
        if (Math.abs(x2 - _V12_PENDING_TREND.x1) > 0 || Math.abs(y2 - _V12_PENDING_TREND.y1) > 0) {
          _V12_DRAWINGS.push({ id: Date.now(), type: "trend", key, color, x1: _V12_PENDING_TREND.x1, y1: _V12_PENDING_TREND.y1, x2, y2 });
          if (typeof omega_V12SaveDrawings === "function") omega_V12SaveDrawings();
        }
        _V12_PENDING_TREND = null;
        if (typeof omega_V12SetDrawMode === "function") omega_V12SetDrawMode(null);
        omega_V10DrawChart();
      }
    });

    canvas.addEventListener("click", ev => {
      const conv = makeConverter(canvas); if (!conv) return;
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      const plan = safePlan();
      const key = symbolKey(plan);

      if (typeof _V12_DRAW_MODE !== "undefined" && _V12_DRAW_MODE === "alarm") {
        const price = conv.priceForY(y);
        const dir = (_V10_PRICE && price > _V10_PRICE) ? "above" : "below";
        _V12_ALARMS.push({ id: Date.now(), key, symbol: `${plan.symbol}${plan.quote}`, exchange: plan.exchange, dir, price, note: "Grafikten alarm", sound: (window._V15_SOUND_SETTINGS && _V15_SOUND_SETTINGS.sound) || "beep", hit: false, created: new Date().toISOString() });
        if (typeof omega_V12SaveAlarms === "function") omega_V12SaveAlarms();
        if (typeof omega_V12RenderAlarms === "function") omega_V12RenderAlarms();
        if (typeof omega_V12SetDrawMode === "function") omega_V12SetDrawMode(null);
        toast("Grafikten alarm eklendi.");
        omega_V10DrawChart();
        return;
      }

      if (typeof _V12_DRAW_MODE !== "undefined" && _V12_DRAW_MODE === "hline") {
        _V12_DRAWINGS.push({ id: Date.now(), type: "hline", key, price: conv.priceForY(y), label: "Fiyat" });
        if (typeof omega_V12SaveDrawings === "function") omega_V12SaveDrawings();
        if (typeof omega_V12SetDrawMode === "function") omega_V12SetDrawMode(null);
        omega_V10DrawChart();
        return;
      }

      const hit = hitTest(conv, x, y);
      STATE.selected = hit;
      omega_V10DrawChart();
    });

    canvas.addEventListener("mouseleave", () => {
      STATE.lastMouse = null;
      canvas.classList.remove('axis-hover');
      if (!STATE.draggingAxis && !STATE.draggingPan) omega_V10DrawChart();
    });

    canvas.addEventListener("wheel", ev => {
      ev.preventDefault();
      const conv = makeConverter(canvas); if (!conv) return;
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const factor = ev.deltaY < 0 ? 0.78 : 1.28;
      if (x > conv.left + conv.plotW || ev.ctrlKey) {
        window._V15_Y_SCALE = Math.max(0.12, Math.min(30, Number(window._V15_Y_SCALE || 1) * (ev.deltaY < 0 ? 0.82 : 1.22)));
        localStorage.setItem("v15_y_scale", String(window._V15_Y_SCALE));
        omega_V10DrawChart();
      } else {
        zoomAt(x, factor);
      }
    }, { passive: false });

    omega_V10DrawChart();
  }

  function patchAlarmRender() {
    if (window.__v26CryptoAlarmPatched || typeof omega_V12RenderAlarms !== "function") return;
    window.__v26CryptoAlarmPatched = true;
    window.omega_V12RenderAlarms = function () {
      const box = $("v12-alarm-list"); if (!box) return;
      const plan = safePlan(); const key = symbolKey(plan);
      const list = Array.isArray(_V12_ALARMS) ? _V12_ALARMS.filter(a => a.key === key) : [];
      if (!list.length) {
        box.innerHTML = `<div class="alarm-v12-row"><span>Bu sembol için alarm yok. Grafikten Alarm'a basıp seviye seçebilirsin.</span><span></span><span></span></div>`;
        return;
      }
      box.innerHTML = list.map(a => `
        <div class="alarm-v12-row ${a.hit ? "hit" : ""}">
          <div><b>${a.dir === "above" ? "ÜST" : "ALT"} ${priceFmt(a.price)}</b><br><span>${a.note || a.symbol} · ${a.hit ? "ÇALDI" : "AKTİF"}</span></div>
          <span class="alarm-status">${a.hit ? "ÇALDI" : "AKTİF"}</span>
          <button onclick="omega_V12DeleteAlarm(${a.id})"><i class="fa-solid fa-trash"></i></button>
        </div>`).join("");
    };
  }

  function boot() {
    window._V12_SHOW_MA = false;
    localStorage.setItem('v12_show_ma','0');
    installUi();
    patchAlarmRender();
    bindCanvas();
    if (typeof omega_V12RenderAlarms === "function") omega_V12RenderAlarms();
    if (typeof omega_V10DrawChart === "function") omega_V10DrawChart();
  }

  window.omega_V12ToggleMA = function(){ window._V12_SHOW_MA = false; localStorage.setItem('v12_show_ma','0'); if (typeof omega_V10DrawChart==='function') omega_V10DrawChart(); };

  const timer = setInterval(() => {
    const ok = $("crypto-v10-chart") && typeof omega_V10GetPlan === "function";
    if (ok) boot();
  }, 400);

  setTimeout(() => { clearInterval(timer); boot(); }, 6000);
  window.addEventListener("hashchange", () => setTimeout(boot, 400));
  window.addEventListener("resize", () => {
    clearTimeout(STATE.resizeTimer);
    STATE.resizeTimer = setTimeout(() => { installUi(); bindCanvas(); omega_V10DrawChart(); }, 250);
  });
})();
