
// ===============================
// V35 CRYPTO TIMEFRAME ENGINE
// Grafik üstündeki süre butonlarını gerçek Binance/OKX mum verisine bağlar.
// Eski işlevsiz süre butonlarını temizler, tek çalışan sistem bırakır.
// ===============================

(function () {
  const STORE_KEY = "v35_crypto_tf";
  const ORANGE = "#f97316";

  const TIMEFRAMES = [
    { id: "1m", label: "1 dk", binance: "1m", okx: "1m", limit: 1000 },
    { id: "3m", label: "3 dk", binance: "3m", okx: "3m", limit: 1000 },
    { id: "5m", label: "5 dk", binance: "5m", okx: "5m", limit: 1000 },
    { id: "15m", label: "15 dk", binance: "15m", okx: "15m", limit: 1000 },
    { id: "30m", label: "30 dk", binance: "30m", okx: "30m", limit: 1000 },
    { id: "1h", label: "1 saat", binance: "1h", okx: "1H", limit: 1000 },
    { id: "2h", label: "2 saat", binance: "2h", okx: "2H", limit: 1000 },
    { id: "4h", label: "4 saat", binance: "4h", okx: "4H", limit: 1000 },
    { id: "8h", label: "8 saat", binance: "8h", okx: "6H", limit: 1000 },
    { id: "12h", label: "12 saat", binance: "12h", okx: "12H", limit: 1000 },
    { id: "1d", label: "1 gün", binance: "1d", okx: "1D", limit: 1000 },
    { id: "3d", label: "3 gün", binance: "3d", okx: "3D", limit: 700 },
    { id: "1w", label: "1 hafta", binance: "1w", okx: "1W", limit: 520 },
    { id: "1M", label: "1 ay", binance: "1M", okx: "1M", limit: 360 }
  ];

  let activeTf = localStorage.getItem(STORE_KEY) || localStorage.getItem("v10_crypto_tf") || "1m";
  let busy = false;

  function qs(sel) {
    return document.querySelector(sel);
  }

  function isCryptoPage() {
    return location.hash === "#crypto" || !!qs("#omega-crypto-block");
  }

  function getPlan() {
    const symbol = (qs("#v10-symbol")?.value || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const quote = qs("#v10-quote")?.value || "USDT";
    const exchange = (qs("#v10-exchange")?.value || "binance").toLowerCase();
    return { symbol, quote, exchange };
  }

  function inst(plan) {
    if (plan.exchange === "okx") return `${plan.symbol}-${plan.quote}`;
    return `${plan.symbol}${plan.quote}`;
  }

  async function fetchBinance(plan, tf) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(inst(plan))}&interval=${tf.binance}&limit=${tf.limit}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Binance mum verisi alınamadı");
    const rows = await r.json();
    return rows.map(k => ({
      time: Number(k[0]),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5])
    }));
  }

  async function fetchOkx(plan, tf) {
    const url = `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(inst(plan))}&bar=${tf.okx}&limit=${Math.min(tf.limit, 300)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("OKX mum verisi alınamadı");
    const j = await r.json();
    const rows = Array.isArray(j.data) ? j.data : [];
    return rows.reverse().map(k => ({
      time: Number(k[0]),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5] || 0)
    }));
  }

  function formatPrice(v) {
    const n = Number(v || 0);
    if (window.omega_V10FormatPrice) return window.omega_V10FormatPrice(n);
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function renderButtons() {
    const box = qs("#crypto-v10-timeframes");
    if (!box) return;

    box.innerHTML = TIMEFRAMES.map(tf => `
      <button type="button" class="tf-v10 v35-tf ${tf.id === activeTf ? "active" : ""}" data-v35-tf="${tf.id}">
        ${tf.label}
      </button>
    `).join("");

    box.querySelectorAll("[data-v35-tf]").forEach(btn => {
      btn.onclick = () => setTimeframe(btn.dataset.v35Tf);
    });
  }

  async function setTimeframe(tfId) {
    if (busy) return;

    const tf = TIMEFRAMES.find(x => x.id === tfId) || TIMEFRAMES[0];
    activeTf = tf.id;
    localStorage.setItem(STORE_KEY, activeTf);
    localStorage.setItem("v10_crypto_tf", activeTf);

    renderButtons();
    await refreshChart(true);
  }

  function updateText(plan, tf, rows) {
    const title = qs("#crypto-v10-title");
    const sub = qs("#crypto-v10-subtitle");
    const priceEl = qs("#crypto-v10-price");
    const chEl = qs("#crypto-v10-change");
    const cap = qs("#crypto-v10-caption");
    const last = rows[rows.length - 1];

    if (title) {
      title.textContent = inst(plan).replace("-", "");
      title.style.setProperty("color", ORANGE, "important");
    }

    if (sub) sub.textContent = `${plan.exchange.toUpperCase()} · ${tf.label} · ${rows.length} mum`;
    if (priceEl && last) priceEl.textContent = formatPrice(last.close);

    if (chEl && rows.length > 1) {
      const first = rows[0].close || last.close;
      const pct = first ? ((last.close - first) / first) * 100 : 0;
      chEl.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
      chEl.className = pct >= 0 ? "up" : "down";
    }

    if (cap) cap.textContent = `${tf.label} mum grafiği · ${new Date().toLocaleTimeString("tr-TR")}`;
  }

  function drawCanvas(rows) {
    if (window._V10_CANDLES !== undefined) window._V10_CANDLES = rows;
    if (window._V10_PRICE !== undefined) window._V10_PRICE = rows[rows.length - 1]?.close || null;

    // Eski V10 çizim motorunu kullan. Böylece TP/SL/LIQ çizgileri korunur.
    if (typeof window.omega_V10DrawChart === "function") {
      window.omega_V10DrawChart();
    }
    if (typeof window.omega_V10UpdateTpOutputs === "function") {
      window.omega_V10UpdateTpOutputs();
    }
  }

  async function refreshChart(force = false) {
    if (!isCryptoPage() || busy) return;

    const status = qs("#crypto-v10-status");
    const tf = TIMEFRAMES.find(x => x.id === activeTf) || TIMEFRAMES[0];
    const plan = getPlan();

    try {
      busy = true;
      if (status) {
        status.textContent = "YÜKLENİYOR";
        status.className = "terminal-v10-live-dot";
      }

      const rows = plan.exchange === "okx"
        ? await fetchOkx(plan, tf)
        : await fetchBinance(plan, tf);

      if (!rows.length) throw new Error("Mum verisi boş döndü");

      window._V10_CANDLES = rows;
      window._V10_PRICE = rows[rows.length - 1].close;

      updateText(plan, tf, rows);
      drawCanvas(rows);

      if (status) {
        status.textContent = "CANLI";
        status.className = "terminal-v10-live-dot ok";
      }
    } catch (err) {
      if (status) {
        status.textContent = "VERİ HATASI";
        status.className = "terminal-v10-live-dot err";
      }
      const cap = qs("#crypto-v10-caption");
      if (cap) cap.textContent = err.message || "Grafik verisi alınamadı.";
    } finally {
      busy = false;
    }
  }

  function boot() {
    if (!isCryptoPage()) return;
    activeTf = localStorage.getItem(STORE_KEY) || localStorage.getItem("v10_crypto_tf") || activeTf;
    renderButtons();
    setTimeout(() => refreshChart(true), 250);
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 900));
  window.addEventListener("hashchange", () => setTimeout(boot, 500));

  // Eski fonksiyonları da bu çalışan sisteme yönlendir.
  window.omega_V10SetTf = setTimeframe;
  window.omega_InitV10Timeframes = renderButtons;

  const oldRefresh = window.omega_V10RefreshCrypto;
  window.omega_V10RefreshCrypto = function(force = false) {
    return refreshChart(force).catch(() => {
      if (typeof oldRefresh === "function") return oldRefresh(force);
    });
  };
})();
