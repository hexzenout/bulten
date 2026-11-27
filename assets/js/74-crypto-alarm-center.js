// ===============================
// V28 ALARM CENTER
// Kripto Pro Panel > Alarm sekmesi içinde çalışır.
// ===============================

(function () {
  const STORAGE_KEY = "v28_crypto_alarm_center";
  const HISTORY_KEY = "v28_crypto_alarm_history";
  const POLL_MS = 2500;

  let state = loadState();
  let history = loadHistory();
  let timer = null;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { alarms: Array.isArray(raw.alarms) ? raw.alarms : [] };
    } catch { return { alarms: [] }; }
  }

  function loadHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function saveHistory() { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500))); }
  function uid() { return "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }

  function money(v) {
    const n = Number(v || 0);
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  }

  function normalizeCoin(v) { return String(v || "BTC").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "BTC"; }
  function normalizeQuote(v) { return String(v || "USDT").trim().toUpperCase() === "USDC" ? "USDC" : "USDT"; }

  function getSelectedExchange() {
    const el = document.querySelector("#v10-exchange, #crypto-exchange, select[id*='exchange'], select[name*='exchange']");
    const val = (el?.value || "").toLowerCase();
    return val.includes("okx") ? "okx" : "binance";
  }

  function getSelectedQuote() {
    const el = document.querySelector("#v10-quote, #crypto-quote, select[id*='quote'], select[name*='quote'], select[id*='parite']");
    return normalizeQuote(el?.value || "USDT");
  }

  function getSelectedCoin() {
    const el = document.querySelector("#v10-symbol, #crypto-symbol, #v10-coin, #crypto-coin, input[id*='coin'], select[id*='coin']");
    return normalizeCoin(el?.value || "BTC");
  }

  function currentSymbolKey() {
    return `${getSelectedExchange()}:${getSelectedCoin()}${getSelectedQuote()}`;
  }

  function parseKey(key) {
    const [exchangeRaw, symbolRaw] = String(key || "binance:BTCUSDT").split(":");
    const exchange = exchangeRaw === "okx" ? "okx" : "binance";
    const symbol = String(symbolRaw || "BTCUSDT").toUpperCase();
    const quote = symbol.endsWith("USDC") ? "USDC" : "USDT";
    const coin = symbol.replace(quote, "") || "BTC";
    return { exchange, coin, quote, symbol: `${coin}${quote}` };
  }

  function normalizeAlarmSymbol(input) {
    const raw = String(input || "").trim().toUpperCase();

    if (raw.includes(":")) {
      const [ex, sym] = raw.split(":");
      const exchange = ex.toLowerCase().includes("okx") ? "okx" : "binance";
      const res = typeof window.v26ResolveMarketSymbol === "function" ? window.v26ResolveMarketSymbol(sym) : null;
      if (res && exchange === "binance") return `${exchange}:${res.apiPair}`;
      const quote = sym.endsWith("USDC") ? "USDC" : "USDT";
      const coin = normalizeCoin(sym.replace(quote, ""));
      return `${exchange}:${coin}${quote}`;
    }

    const res = typeof window.v26ResolveMarketSymbol === "function" ? window.v26ResolveMarketSymbol(raw, getSelectedQuote()) : null;
    if (res && getSelectedExchange() === "binance") return `binance:${res.apiPair}`;
    const quote = raw.endsWith("USDC") ? "USDC" : "USDT";
    const coin = normalizeCoin(raw.replace(quote, ""));
    return `${getSelectedExchange()}:${coin}${quote}`;
  }

  async function fetchBinance(symbol) {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      if (j && j.lastPrice) return { price: Number(j.lastPrice), changePct: Number(j.priceChangePercent || 0) };
    }
    const rf = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    if (!rf.ok) throw new Error("Binance fiyat alınamadı");
    const jf = await rf.json();
    return { price: Number(jf.lastPrice), changePct: Number(jf.priceChangePercent || 0) };
  }

  async function fetchOkx(symbol) {
    const instId = symbol.replace("USDT", "-USDT").replace("USDC", "-USDC");
    const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`, { cache: "no-store" });
    if (!r.ok) throw new Error("OKX fiyat alınamadı");
    const j = await r.json();
    const d = j?.data?.[0];
    const last = Number(d?.last || 0);
    const open24h = Number(d?.open24h || 0);
    return { price: last, changePct: open24h ? ((last - open24h) / open24h) * 100 : 0 };
  }

  async function fetchPriceByKey(key) {
    const p = parseKey(key);
    return p.exchange === "okx" ? fetchOkx(p.symbol) : fetchBinance(p.symbol);
  }

  function getSoundLabel() {
    try {
      const s = JSON.parse(localStorage.getItem("v28_alarm_audio_settings") || "{}");
      return s.sound === "custom" ? "Özel Sesler" : "Standart Ses";
    } catch {
      return "Standart Ses";
    }
  }

  function updateSummaryBadges() {
    const activeCount = state.alarms.filter(a => a.active && !a.hit).length;
    const hitCount = state.alarms.filter(a => a.hit).length;
    const acEl = document.getElementById("v28-alarm-active-cnt");
    const hcEl = document.getElementById("v28-alarm-hist-cnt");
    const heroActive = document.getElementById("v28-alarm-hero-active");
    const heroSound = document.getElementById("v28-alarm-hero-sound");
    const clearBtn = document.getElementById("v28-alarm-clear-hit");
    if (acEl) acEl.textContent = String(state.alarms.length);
    if (hcEl) hcEl.textContent = String(history.length);
    if (heroActive) heroActive.textContent = `${activeCount} Aktif`;
    if (heroSound) heroSound.textContent = getSoundLabel();
    if (clearBtn) {
      clearBtn.disabled = hitCount === 0;
      clearBtn.style.opacity = hitCount > 0 ? "1" : "0.45";
    }
  }

  function jumpToPairChart(key) {
    const p = parseKey(key);
    if (typeof window.omega_SwitchTab === "function") {
      window.omega_SwitchTab("crypto");
    } else {
      location.hash = "#crypto";
    }
    const exEl = document.getElementById("v10-exchange");
    const qEl = document.getElementById("v10-quote");
    const symEl = document.getElementById("v10-symbol");
    if (exEl) exEl.value = p.exchange;
    if (qEl) qEl.value = p.quote;
    if (symEl) {
      symEl.value = p.coin;
      symEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (typeof window.v26ActivateCryptoPanel === "function") {
      window.v26ActivateCryptoPanel("graph", false);
    }
    if (typeof window.omega_V10RefreshCrypto === "function") {
      window.omega_V10RefreshCrypto(true);
    }
  }

  function showAlarmBalloon(detail) {
    const alarm = detail?.alarm || {};
    const key = alarm.key || `${alarm.exchange || "binance"}:${alarm.symbol || "BTCUSDT"}`;
    const p = parseKey(key);
    const target = Number(alarm.price || detail?.price || 0);
    const livePrice = Number(detail?.price || target || 0);
    const isAbove = alarm.dir !== "below";
    const dirLabel = isAbove ? "üstüne çıktı" : "altına düştü";
    const note = alarm.note || "";

    let wrap = document.getElementById("v26-alarm-balloon-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "v26-alarm-balloon-wrap";
      wrap.className = "v26-alarm-balloon-wrap";
      document.body.appendChild(wrap);
    }

    const card = document.createElement("div");
    card.className = `v26-alarm-balloon ${isAbove ? "up" : "down"}`;
    card.innerHTML = `
      <div class="v26-ab-top">
        <span class="v26-ab-badge"><i class="fa-solid fa-bell fa-shake"></i> FİYAT ALARMI ÇALDI</span>
        <button type="button" class="v26-ab-close" title="Bildirimi Kapat">×</button>
      </div>
      <div class="v26-ab-msg">
        <b>${escapeHtml(p.symbol)}</b> fiyatı <span class="v26-ab-target">$${money(target)}</span> seviyesinin
        <em class="${isAbove ? "up" : "down"}">${dirLabel}</em>
      </div>
      <div class="v26-ab-meta">
        <span>Anlık: <b>$${money(livePrice)}</b></span>
        ${note ? `<span class="v26-ab-note">· ${escapeHtml(note)}</span>` : ""}
      </div>
      <div class="v26-ab-actions">
        <button type="button" class="v26-ab-go"><i class="fa-solid fa-chart-candlestick"></i> ${escapeHtml(p.symbol)} Grafiğine Git</button>
        <button type="button" class="v26-ab-mute"><i class="fa-solid fa-volume-xmark"></i> Sesi Sustur</button>
      </div>
    `;

    card.addEventListener("click", e => {
      if (e.target.closest(".v26-ab-close")) {
        card.remove();
        return;
      }
      if (e.target.closest(".v26-ab-mute")) {
        if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
        card.remove();
        return;
      }
      // Clicking the balloon or "Grafiğe Git" jumps straight to that coin's chart!
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
      jumpToPairChart(key);
      card.remove();
    });

    wrap.prepend(card);
    while (wrap.children.length > 4) wrap.lastElementChild.remove();
  }

  function renderUI() {
    const mount = document.getElementById("v28-alarm-mount");
    if (!mount || mount.dataset.ready === "3") return;
    mount.dataset.ready = "3";

    mount.innerHTML = `
      <div class="v28-alarm-card v26-pro-alarm-card">
        <div class="v26-alarm-hero">
          <div class="v26-alarm-hero-left">
            <span class="v26-alarm-hero-pill active" id="v28-alarm-hero-active">0 Aktif</span>
            <span class="v26-alarm-hero-sub">Otomatik fiyat takibi</span>
          </div>
          <button type="button" class="v26-alarm-sound-chip" id="v28-alarm-sound-jump" title="Ses ayarlarına git">
            <i class="fa-solid fa-volume-high"></i>
            <span id="v28-alarm-hero-sound">${getSoundLabel()}</span>
          </button>
        </div>

        <div class="v28-tabs-mini v26-alarm-tabs">
          <button class="active" data-v28-alarm-tab="active">Aktif <em id="v28-alarm-active-cnt">0</em></button>
          <button data-v28-alarm-tab="history">Geçmiş <em id="v28-alarm-hist-cnt">0</em></button>
          <button data-v28-alarm-tab="sound"><i class="fa-solid fa-volume-high"></i> Ses</button>
        </div>

        <div id="v28-alarm-active">
          <div class="v26-alarm-composer">
            <div class="v26-ac-row">
              <label class="v26-ac-label">PARİTE</label>
              <div class="v26-ac-inline">
                <input id="v28-alarm-symbol" placeholder="ETHUSDT">
                <button type="button" class="v26-mini-pill-btn green" id="v28-alarm-use-price" title="Canlı fiyatı çek">Canlı Fiyat</button>
              </div>
            </div>

            <div class="v26-ac-row">
              <label class="v26-ac-label">HEDEF FİYAT</label>
              <input id="v28-alarm-price" type="number" step="0.00000001" placeholder="Hedef fiyat girin (yön otomatik algılanır)...">
              <div class="v26-pct-chips" id="v28-alarm-pct-chips">
                <button type="button" data-pct="-5">-%5</button>
                <button type="button" data-pct="-2">-%2</button>
                <button type="button" data-pct="2">+%2</button>
                <button type="button" data-pct="5">+%5</button>
              </div>
            </div>

            <div class="v26-ac-row">
              <label class="v26-ac-label">NOT (OPSİYONEL)</label>
              <input id="v28-alarm-note" placeholder="Örn: Destek kırılımı, TP1 bölgesi...">
            </div>

            <div class="v26-ac-cta">
              <button type="button" class="v26-alarm-create-btn" id="v28-alarm-add"><i class="fa-solid fa-bell"></i> ALARM OLUŞTUR</button>
              <button type="button" class="v26-alarm-clear-btn" id="v28-alarm-clear-hit" title="Tetiklenmiş alarmları temizle"><i class="fa-solid fa-broom"></i></button>
            </div>
          </div>

          <div class="v28-list v26-pro-alarm-list" id="v28-alarm-list"></div>
        </div>

        <div id="v28-alarm-history" style="display:none;">
          <div class="v26-hist-actions">
            <button type="button" class="v26-mini-pill-btn" id="v28-history-export"><i class="fa-solid fa-download"></i> Dışa Aktar</button>
            <button type="button" class="v26-mini-pill-btn red" id="v28-history-clear"><i class="fa-solid fa-trash"></i> Geçmişi Temizle</button>
          </div>
          <div class="v28-list v26-pro-alarm-list" id="v28-alarm-history-list"></div>
        </div>

        <div id="v28-alarm-sound-pane" style="display:none;">
          <div id="v28-sound-mount"></div>
        </div>
      </div>
    `;

    bindUI();
    fillCurrentSymbol();
    renderAll();
    if (window.V512RenderSoundCenter) window.V512RenderSoundCenter(true);
  }

  function switchAlarmTab(tab) {
    document.querySelectorAll("[data-v28-alarm-tab]").forEach(b => b.classList.toggle("active", b.dataset.v28AlarmTab === tab));
    const actEl = document.getElementById("v28-alarm-active");
    const histEl = document.getElementById("v28-alarm-history");
    const sndEl = document.getElementById("v28-alarm-sound-pane");
    if (actEl) actEl.style.display = tab === "active" ? "" : "none";
    if (histEl) histEl.style.display = tab === "history" ? "" : "none";
    if (sndEl) sndEl.style.display = tab === "sound" ? "" : "none";
    if (tab === "sound" && window.V512RenderSoundCenter) {
      window.V512RenderSoundCenter(false);
    }
  }

  function bindUI() {
    document.querySelectorAll("[data-v28-alarm-tab]").forEach(btn => {
      btn.onclick = () => switchAlarmTab(btn.dataset.v28AlarmTab);
    });
    document.getElementById("v28-alarm-sound-jump")?.addEventListener("click", () => switchAlarmTab("sound"));

    document.querySelectorAll("#v28-alarm-pct-chips [data-pct]").forEach(btn => {
      btn.onclick = async () => {
        const pct = Number(btn.dataset.pct || 0);
        if (!pct) return;
        const sym = document.getElementById("v28-alarm-symbol")?.value || currentSymbolKey();
        const priceEl = document.getElementById("v28-alarm-price");
        try {
          const data = await fetchPriceByKey(normalizeAlarmSymbol(sym));
          if (priceEl && data.price > 0) {
            const target = data.price * (1 + pct / 100);
            const dec = target >= 100 ? 2 : target >= 1 ? 4 : 7;
            priceEl.value = Number(target.toFixed(dec));
          }
        } catch {
          alert("Canlı fiyat alınamadı.");
        }
      };
    });

    document.getElementById("v28-alarm-add")?.addEventListener("click", addAlarmFromForm);
    document.getElementById("v28-alarm-price")?.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); addAlarmFromForm(); }
    });
    document.getElementById("v28-alarm-use-price")?.addEventListener("click", fillCurrentPrice);
    document.querySelector('.crypto-v28-tab[data-crypto-panel="alarm"]')?.addEventListener("click", fillCurrentSymbol);
    document.getElementById("v10-symbol")?.addEventListener("change", fillCurrentSymbol);
    document.getElementById("v10-symbol")?.addEventListener("input", fillCurrentSymbol);
    const titleEl = document.getElementById("crypto-v10-title");
    if (titleEl && typeof MutationObserver !== "undefined") {
      new MutationObserver(() => fillCurrentSymbol()).observe(titleEl, { childList: true, characterData: true, subtree: true });
    }
    document.getElementById("v28-alarm-clear-hit")?.addEventListener("click", () => {
      state.alarms = state.alarms.filter(a => !a.hit);
      saveState();
      renderAll();
    });
    document.getElementById("v28-history-clear")?.addEventListener("click", () => {
      if (!confirm("Alarm geçmişi temizlensin mi?")) return;
      history = [];
      saveHistory();
      renderHistory();
      updateSummaryBadges();
    });
    document.getElementById("v28-history-export")?.addEventListener("click", exportHistory);
    window.addEventListener("v26-sound-changed", updateSummaryBadges);
  }

  function fillCurrentSymbol() {
    const p = parseKey(currentSymbolKey());
    const el = document.getElementById("v28-alarm-symbol");
    if (el) el.value = p.symbol;
  }

  async function fillCurrentPrice() {
    const sym = document.getElementById("v28-alarm-symbol")?.value || currentSymbolKey();
    const priceEl = document.getElementById("v28-alarm-price");

    try {
      const data = await fetchPriceByKey(normalizeAlarmSymbol(sym));
      if (priceEl && data.price) priceEl.value = data.price;
    } catch {
      alert("Canlı fiyat alınamadı.");
    }
  }

  async function addAlarmFromForm() {
    const key = normalizeAlarmSymbol(document.getElementById("v28-alarm-symbol")?.value || currentSymbolKey());
    const price = Number(document.getElementById("v28-alarm-price")?.value || 0);
    const note = document.getElementById("v28-alarm-note")?.value || "";

    if (!price || price <= 0) {
      alert("Geçerli alarm fiyatı gir.");
      return;
    }

    let refPrice = null;
    try {
      const p = parseKey(key);
      if (key === currentSymbolKey() && window._V10_PRICE) {
        refPrice = Number(window._V10_PRICE);
      } else {
        const tick = await fetchPriceByKey(key);
        if (tick?.price) refPrice = Number(tick.price);
      }
      void p;
    } catch {}

    const autoDir = refPrice && refPrice > 0 ? (price >= refPrice ? "above" : "below") : "auto";

    state.alarms.push({
      id: uid(),
      key,
      dir: autoDir,
      price,
      note,
      active: true,
      hit: false,
      createdAt: Date.now(),
      hitAt: null,
      lastPrice: refPrice
    });

    saveState();
    renderAll();
    checkAllAlarms(true);

    const noteEl = document.getElementById("v28-alarm-note");
    if (noteEl) noteEl.value = "";
  }

  function renderAll() {
    renderList();
    renderHistory();
    updateSummaryBadges();
  }

  function renderList() {
    const list = document.getElementById("v28-alarm-list");
    if (!list) return;

    if (!state.alarms.length) {
      list.innerHTML = `<div class="v28-empty v26-alarm-empty"><i class="fa-regular fa-bell"></i><span>Henüz aktif alarm yok. Yukarıdan hedef fiyat ekleyebilirsin.</span></div>`;
      return;
    }

    list.innerHTML = state.alarms.map(a => {
      const p = parseKey(a.key);
      const isAuto = a.dir !== "above" && a.dir !== "below";
      const isAbove = a.dir === "above";
      const dirBadge = isAuto ? "OTOMATİK" : isAbove ? "▲ ÜSTÜNE ÇIKINCA" : "▼ ALTINA DÜŞÜNCE";
      const last = a.lastPrice ? `$${money(a.lastPrice)}` : "-";
      const diffPct = a.lastPrice && a.price ? (((Number(a.price) - Number(a.lastPrice)) / Number(a.lastPrice)) * 100) : null;
      const diffStr = diffPct != null ? `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(2)}%` : "";
      const status = a.hit ? "Tetiklendi" : a.active ? "Aktif" : "Pasif";
      const statusCls = a.hit ? "hit" : a.active ? "on" : "off";

      return `
        <div class="v28-row v26-alarm-item ${isAbove ? "above" : "below"} ${a.hit ? "hit" : ""} ${!a.active && !a.hit ? "paused" : ""}">
          <div class="v26-ai-top">
            <div class="v26-ai-pair">
              <button type="button" class="v26-ai-jump" data-jump="${escapeHtml(a.key)}" title="Grafiğe git"><b>${p.symbol}</b> <i class="fa-solid fa-arrow-up-right-from-square"></i></button>
              <span class="v26-ai-ex">${p.exchange.toUpperCase()}</span>
              <span class="v26-ai-dir ${isAbove ? "above" : "below"}">${dirBadge}</span>
            </div>
            <span class="v26-ai-status ${statusCls}">${status}</span>
          </div>
          <div class="v26-ai-prices">
            <div><small>Hedef</small><strong>$${money(a.price)}</strong></div>
            <div><small>Son</small><span>${last}</span></div>
            ${diffStr ? `<div><small>Fark</small><em class="${diffPct >= 0 ? "up" : "down"}">${diffStr}</em></div>` : ""}
          </div>
          ${a.note ? `<div class="v26-ai-note"><i class="fa-regular fa-note-sticky"></i> ${escapeHtml(a.note)}</div>` : ""}
          <div class="v26-ai-actions">
            <button type="button" class="v26-ai-btn toggle" data-toggle="${a.id}">${a.active ? '<i class="fa-solid fa-pause"></i> Duraklat' : '<i class="fa-solid fa-play"></i> Aktifleştir'}</button>
            <button type="button" class="v26-ai-btn del" data-delete="${a.id}"><i class="fa-solid fa-trash"></i> Sil</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-jump]").forEach(btn => {
      btn.onclick = () => jumpToPairChart(btn.dataset.jump);
    });

    list.querySelectorAll("[data-toggle]").forEach(btn => {
      btn.onclick = () => {
        const a = state.alarms.find(x => x.id === btn.dataset.toggle);
        if (!a) return;
        a.active = !a.active;
        if (a.active) a.hit = false;
        saveState();
        renderAll();
      };
    });

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.onclick = () => {
        state.alarms = state.alarms.filter(a => a.id !== btn.dataset.delete);
        saveState();
        renderAll();
      };
    });
  }

  function renderHistory() {
    const list = document.getElementById("v28-alarm-history-list");
    if (!list) return;

    if (!history.length) {
      list.innerHTML = `<div class="v28-empty">Henüz çalan alarm geçmişi yok.</div>`;
      return;
    }

    list.innerHTML = history.slice(0, 100).map(h => `
      <div class="v28-row v26-alarm-item hit">
        <div class="v26-ai-top">
          <div class="v26-ai-pair">
            <b>${escapeHtml(h.symbol)}</b>
            <span class="v26-ai-dir above">$${money(h.price)}</span>
          </div>
          <span class="v26-ai-status hit">${new Date(h.time).toLocaleString("tr-TR")}</span>
        </div>
        ${h.target ? `<div class="v26-ai-prices"><div><small>Hedef</small><strong>$${money(h.target)}</strong></div><div><small>Tetiklenen</small><span>$${money(h.price)}</span></div></div>` : ""}
        ${h.note ? `<div class="v26-ai-note"><i class="fa-regular fa-note-sticky"></i> ${escapeHtml(h.note)}</div>` : ""}
      </div>
    `).join("");
  }

  async function checkAllAlarms(force = false) {
    const keys = [...new Set(state.alarms.filter(a => a.active && !a.hit).map(a => a.key))];

    for (const key of keys) {
      try {
        const data = await fetchPriceByKey(key);

        state.alarms.forEach(a => {
          if (a.key !== key) return;
          const prevPrice = Number(a.lastPrice || 0);
          a.lastPrice = data.price;

          if (!a.active || a.hit) return;

          const target = Number(a.price);
          if (a.dir !== "above" && a.dir !== "below") {
            if (prevPrice > 0 && ((prevPrice < target && data.price >= target) || (prevPrice > target && data.price <= target))) {
              a.dir = data.price >= target ? "above" : "below";
            } else {
              a.dir = target >= data.price ? "above" : "below";
              return;
            }
          }

          const hit = a.dir === "above" ? data.price >= target : data.price <= target;
          if (!hit) return;

          a.hit = true;
          a.active = false;
          a.hitAt = Date.now();

          const p = parseKey(a.key);
          const dirText = a.dir === "above" ? "üstüne çıktı" : "altına düştü";
          const msg = `${p.symbol} fiyatı $${money(a.price)} seviyesinin ${dirText}!`;

          history.unshift({
            id: uid(),
            symbol: `${p.exchange.toUpperCase()} ${p.symbol}`,
            target: a.price,
            price: data.price,
            dir: a.dir,
            note: a.note || "",
            message: msg,
            time: Date.now()
          });

          saveHistory();

          window.dispatchEvent(new CustomEvent("v26-alarm-fired", {
            detail: { message: msg, alarm: a, price: data.price }
          }));

          if (window.V26AlarmAudio?.play) window.V26AlarmAudio.play(msg);
        });
      } catch (err) {
        if (force) console.warn("Alarm fiyat kontrol hatası:", key, err);
      }
    }

    saveState();
    renderAll();
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "v28-alarm-gecmisi.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const recentBalloons = new Map();

  function handleAlarmFiredEvent(e) {
    const detail = e?.detail || {};
    const alarm = detail.alarm || {};
    const sig = `${alarm.key || alarm.symbol || ""}:${alarm.price || detail.price || ""}`;
    const now = Date.now();
    if (recentBalloons.has(sig) && now - recentBalloons.get(sig) < 5000) return;
    recentBalloons.set(sig, now);
    showAlarmBalloon(detail);
  }

  function boot() {
    window.addEventListener("v26-alarm-fired", handleAlarmFiredEvent);
    renderUI();
    clearInterval(timer);
    timer = setInterval(checkAllAlarms, POLL_MS);
    setTimeout(() => checkAllAlarms(true), 800);
  }

  window.V26AlarmCenter = {
    add(key, dir, price, note = "") {
      state.alarms.push({
        id: uid(),
        key: normalizeAlarmSymbol(key),
        dir: dir === "above" || dir === "below" ? dir : "auto",
        price: Number(price),
        note,
        active: true,
        hit: false,
        createdAt: Date.now(),
        hitAt: null,
        lastPrice: null
      });
      saveState();
      renderAll();
      checkAllAlarms(true);
    },
    list() { return [...state.alarms]; },
    history() { return [...history]; },
    clear() { state.alarms = []; saveState(); renderAll(); },
    check: checkAllAlarms,
    jumpToPair: jumpToPairChart,
    showBalloon: showAlarmBalloon
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
