// ===============================
// V533 ORAN TERMİNALİ
// İstihbarat Terminali + kompakt oran geçmişi + akıllı market arama
// ===============================

(function () {
  const DATA_SOURCES = "assets/data/odds-sources.json";
  const DATA_SNAPSHOT = "assets/data/odds-snapshot.json";
  const STORE_KEY = "v533_odds_terminal_state";

  const state = {
    tab: "opportunities",
    sport: "all",
    search: "",
    marketCategory: "all",
    marketId: "all",
    marketSearch: "",
    selectedCompareKey: "",
    minDropPct: 8,
    minValuePct: 5,
    minLineGap: 1.5,
    alarmEnabled: true,
    alarmSensitivity: 0.4,
    sources: null,
    snapshot: null,
    lastLoadedAt: null
  };

  const FALLBACK_SOURCES = { sites: [], groups: [], marketCategories: [] };
  const FALLBACK_SNAPSHOT = { mode: "empty", records: [] };

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function money(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toFixed(2) : "-";
  }

  function signedPct(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? (x >= 0 ? "+" : "") + x.toFixed(1) + "%" : "-";
  }

  function plainPct(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toFixed(1) + "%" : "-";
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replaceAll("ı", "i").replaceAll("İ", "i")
      .replaceAll("ğ", "g").replaceAll("Ğ", "g")
      .replaceAll("ü", "u").replaceAll("Ü", "u")
      .replaceAll("ş", "s").replaceAll("Ş", "s")
      .replaceAll("ö", "o").replaceAll("Ö", "o")
      .replaceAll("ç", "c").replaceAll("Ç", "c")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]+/g, " ")
      .trim();
  }

  function readLocalState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      Object.assign(state, saved || {});
    } catch {}
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        tab: state.tab,
        sport: state.sport,
        search: state.search,
        marketCategory: state.marketCategory,
        marketId: state.marketId,
        marketSearch: state.marketSearch,
        selectedCompareKey: state.selectedCompareKey,
        minDropPct: state.minDropPct,
        minValuePct: state.minValuePct,
        minLineGap: state.minLineGap,
        alarmEnabled: state.alarmEnabled,
        alarmSensitivity: state.alarmSensitivity
      }));
    } catch {}
  }

  async function loadJson(url, fallback) {
    try {
      const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      console.warn("Oran Terminali JSON yüklenemedi:", url, err);
      return fallback;
    }
  }

  function marketCategories() {
    return state.sources?.marketCategories || [];
  }

  function marketMap() {
    const map = {};
    marketCategories().forEach(cat => (cat.markets || []).forEach(m => map[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name }));
    return map;
  }

  function selectedMarketLabel() {
    if (state.marketId !== "all") {
      const meta = marketMap()[state.marketId];
      return meta ? meta.name : "Seçili market";
    }
    if (state.marketCategory !== "all") {
      const cat = marketCategories().find(c => c.id === state.marketCategory);
      return cat ? cat.name : "Seçili bahis türü";
    }
    return "Tüm bahis türleri ve marketler";
  }

  function records(raw = false) {
    const list = state.snapshot?.records || [];
    if (raw) return list;
    const search = normalizeText(state.search || "");
    return list.filter(r => {
      const sportOk = state.sport === "all" || r.sport === state.sport;
      const category = marketMap()[r.market]?.categoryId || "";
      const categoryOk = state.marketCategory === "all" || category === state.marketCategory;
      const marketOk = state.marketId === "all" || r.market === state.marketId;
      const haystack = normalizeText([r.match, r.league, r.bookmaker, r.marketLabel, r.outcome, r.info, r.line].join(" "));
      const searchOk = !search || search.split(/\s+/).every(token => haystack.includes(token));
      return sportOk && categoryOk && marketOk && searchOk;
    });
  }

  function sitesMap() {
    const map = {};
    (state.sources?.sites || []).forEach(s => map[s.id] = s);
    return map;
  }

  function groupName(id) {
    const site = sitesMap()[id];
    const group = (state.sources?.groups || []).find(g => g.id === site?.group);
    return group?.name || site?.group || "-";
  }

  function historyParts(r) {
    const history = Array.isArray(r.history) ? r.history.slice(-4) : [];
    const parts = [{ label: "İlk Oran", value: money(r.opening), raw: Number(r.opening || 0) }];
    history.forEach((h, idx) => parts.push({ label: `${idx + 1}. Değişim`, value: money(h), raw: Number(h || 0) }));
    parts.push({ label: "Güncel Oran", value: money(r.current), raw: Number(r.current || 0) });
    return parts;
  }

  function historyText(r) {
    return historyParts(r).map(p => `${p.label} ${p.value}`).join(" → ");
  }

  function historyCompactHtml(r) {
    const parts = historyParts(r);
    const opening = Number(r.opening || 0);
    const current = Number(r.current || 0);
    const diff = current - opening;
    const direction = diff > 0.001 ? "up" : diff < -0.001 ? "down" : "same";
    const icon = direction === "up" ? "fa-arrow-up" : direction === "down" ? "fa-arrow-down" : "fa-minus";
    const label = direction === "up" ? "Oran yükseldi" : direction === "down" ? "Oran düştü" : "Oran aynı";
    return `<button type="button" class="v533-history-compact ${direction}" data-history-pop="1" aria-label="${escapeAttr(label)}">
      <span class="v533-history-main"><em>${escapeHtml(money(opening))}</em><i class="fa-solid ${icon}"></i><b>${escapeHtml(money(current))}</b></span>
      <small>${parts.length - 2} ara değişim</small>
      <span class="v533-history-pop">${parts.map(p => `<span><em>${escapeHtml(p.label)}</em><b>${escapeHtml(p.value)}</b></span>`).join("")}</span>
    </button>`;
  }

  function oddDirectionHtml(r) {
    const opening = Number(r.opening || 0);
    const current = Number(r.current || 0);
    const diff = current - opening;
    if (diff > 0.001) return `<span class="v533-odd-arrow up"><i class="fa-solid fa-arrow-up"></i></span>`;
    if (diff < -0.001) return `<span class="v533-odd-arrow down"><i class="fa-solid fa-arrow-down"></i></span>`;
    return `<span class="v533-odd-arrow same"><i class="fa-solid fa-minus"></i></span>`;
  }

  function getDropAlerts(list = records()) {
    return list
      .map(r => {
        const opening = Number(r.opening || 0);
        const current = Number(r.current || 0);
        const change = opening ? ((current - opening) / opening) * 100 : 0;
        return { ...r, changePct: change };
      })
      .filter(r => r.changePct <= -Number(state.minDropPct || 8))
      .sort((a, b) => a.changePct - b.changePct);
  }

  function getValueAlerts(list = records()) {
    return list
      .map(r => {
        const p = Number(r.referenceProb || 0);
        const odd = Number(r.current || 0);
        const ev = p && odd ? (p * odd - 1) * 100 : 0;
        const implied = odd ? (1 / odd) * 100 : 0;
        return { ...r, evPct: ev, impliedPct: implied, refPct: p * 100 };
      })
      .filter(r => r.evPct >= Number(state.minValuePct || 5))
      .sort((a, b) => b.evPct - a.evPct);
  }

  function getLineGaps(list = records()) {
    const buckets = {};
    list.forEach(r => {
      if (r.line == null) return;
      const key = [r.matchId, r.market, r.outcome].join("|");
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(r);
    });

    const out = [];
    Object.values(buckets).forEach(arr => {
      if (arr.length < 2) return;
      const sorted = arr.slice().sort((a, b) => Number(a.line) - Number(b.line));
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const gap = Number(high.line) - Number(low.line);
      if (gap >= Number(state.minLineGap || 1.5)) {
        out.push({ low, high, gap, marketLabel: low.marketLabel, match: low.match, sport: low.sport });
      }
    });
    return out.sort((a, b) => b.gap - a.gap);
  }

  function getArbs(list = records()) {
    const buckets = {};
    list.forEach(r => {
      if (r.market !== "match_winner") return;
      const key = [r.matchId, r.market].join("|");
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(r);
    });

    const out = [];
    Object.values(buckets).forEach(arr => {
      const outcomes = ["1", "X", "2"];
      const best = {};
      outcomes.forEach(o => {
        const candidates = arr.filter(r => r.outcome === o).sort((a, b) => Number(b.current) - Number(a.current));
        if (candidates[0]) best[o] = candidates[0];
      });
      if (!best["1"] || !best["X"] || !best["2"]) return;
      const inv = outcomes.reduce((sum, o) => sum + 1 / Number(best[o].current || 1), 0);
      if (inv < 1) {
        out.push({
          match: best["1"].match,
          league: best["1"].league,
          profitPct: (1 / inv - 1) * 100,
          inv,
          best
        });
      }
    });
    return out.sort((a, b) => b.profitPct - a.profitPct);
  }

  function bestByMarket(list = records()) {
    const map = {};
    list.forEach(r => {
      const key = [r.match, r.marketLabel, r.line ?? "", r.outcome].join("|");
      if (!map[key] || Number(r.current) > Number(map[key].current)) map[key] = r;
    });
    return Object.values(map).sort((a, b) => a.match.localeCompare(b.match));
  }

  function compareGroups() {
    const buckets = {};
    records().forEach(r => {
      const key = [r.matchId, r.market, r.line ?? "", r.outcome].join("|");
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(r);
    });
    return Object.entries(buckets)
      .map(([key, arr]) => ({ key, rows: arr.sort((a, b) => Number(b.current) - Number(a.current)) }))
      .filter(g => g.rows.length >= 2)
      .sort((a, b) => b.rows.length - a.rows.length);
  }

  function criticalInsights() {
    const values = getValueAlerts(records(true));
    const drops = getDropAlerts(records(true));
    const lines = getLineGaps(records(true));
    const candidates = [
      ...values.map(x => ({ type: "Değerli Oran", score: 70 + Math.min(25, x.evPct), row: x, reason: `Değer farkı ${signedPct(x.evPct)}` })),
      ...drops.map(x => ({ type: "Oran Düşüşü", score: 72 + Math.min(20, Math.abs(x.changePct)), row: x, reason: `İlk orana göre ${signedPct(x.changePct)}` })),
      ...lines.map(x => ({ type: "Barem Farkı", score: 70 + Math.min(20, x.gap * 3), row: x.low, lineGap: x, reason: `${x.gap.toFixed(1)} barem farkı` }))
    ];
    return candidates
      .map(c => ({ ...c, score: Math.max(Number(c.row?.confidence || 0), c.score || 0) }))
      .filter(c => c.score >= 78)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  function summary() {
    const list = records();
    const sourceCount = state.sources?.sites?.length || 0;
    const matchCount = new Set(list.map(r => r.matchId)).size;
    return {
      records: list.length,
      sources: sourceCount,
      matches: matchCount,
      drops: getDropAlerts(list).length,
      values: getValueAlerts(list).length,
      lineGaps: getLineGaps(list).length,
      arbs: getArbs(list).length,
      markets: marketCategories().reduce((sum, c) => sum + (c.markets?.length || 0), 0),
      critical: criticalInsights().length
    };
  }

  function pressureSvg(row) {
    const data = Array.isArray(row?.pressure) && row.pressure.length > 1
      ? row.pressure
      : [10, 14, 12, 17, 22, 19, 24, 28, 26, 31, 34, 33, 38, 42, 39, 45];

    const w = 520, h = 112, pad = 16;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
      return [x, y];
    });
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${d} L${w-pad} ${h-pad} L${pad} ${h-pad} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" class="v533-pressure-chart" role="img" aria-label="Takım baskı grafiği">
      <path d="${area}" class="area"></path>
      <path d="${d}" class="line"></path>
      ${pts.map((p, i) => i % 4 === 0 ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2"></circle>` : "").join("")}
    </svg>`;
  }

  function renderIntelligenceTerminal() {
    const items = criticalInsights();
    const top = items[0]?.row || records(true)[0] || {};
    const score = Math.round(items[0]?.score || 0);
    const isHot = score >= 88;
    return `<section class="v533-intel ${isHot ? "hot" : ""}">
      <div class="v533-intel-head">
        <div>
          <span>İSTİHBARAT TERMİNALİ v1.0</span>
          <h3>Ciddi Avantajlı Bahis Takibi</h3>
          <p>Bu alan yalnızca değer farkı, barem farkı veya sert oran hareketi güçlü olduğunda öne çıkar. Çok ciddi sinyalde alarm sistemi buraya bağlanacak.</p>
        </div>
        <div class="v533-intel-score">
          <small>Güven Skoru</small>
          <b>${score || "-"}</b>
        </div>
      </div>
      <div class="v533-intel-body">
        <div class="v533-intel-chart">
          <b>Takım Baskı Grafiği / Piyasa Hareketi</b>
          ${pressureSvg(top)}
          <div class="v533-chart-axis"><span>0'</span><span>15'</span><span>30'</span><span>45'</span><span>60'</span><span>75'</span><span>90'</span></div>
        </div>
        <div class="v533-intel-list">
          ${items.length ? items.map(x => `<article>
            <strong>${escapeHtml(x.type)}</strong>
            <b>${escapeHtml(x.row?.match || x.lineGap?.match || "-")}</b>
            <span>${escapeHtml(x.row?.marketLabel || x.lineGap?.marketLabel || "")} · ${escapeHtml(x.row?.outcome || "")}</span>
            <em>${escapeHtml(x.reason)}</em>
          </article>`).join("") : `<div class="v533-intel-empty">Şu an ciddi avantaj seviyesinde sinyal yok.</div>`}
        </div>
      </div>
      <div class="v533-intel-controls">
        <label>Market Filtresi <input type="text" value="${escapeAttr(selectedMarketLabel())}" readonly></label>
        <label>Alarm Hassasiyeti <input id="v533-alarm-sensitivity" type="range" min="0" max="1" step="0.05" value="${Number(state.alarmSensitivity || 0.4)}"></label>
        <button type="button" data-odds-action="toggle-alarm" class="${state.alarmEnabled ? "active" : ""}">${state.alarmEnabled ? "Avantaj Alarmı Açık" : "Avantaj Alarmı Kapalı"}</button>
      </div>
    </section>`;
  }

  function shell() {
    const s = summary();
    const mode = state.snapshot?.mode === "demo" ? "Demo veri" : "Veri";
    return `
      <div class="odds-v528-shell">
        <div class="odds-v528-hero">
          <div>
            <div class="odds-v528-kicker"><i class="fa-solid fa-chart-line"></i> ORAN TERMİNALİ</div>
            <h2>Değerli Oran · Oran Düşüş Uyarısı · Barem Farkı · Garantili Kazanç Adayı</h2>
            <p>${mode}. Futbol ve basketbol için tüm sitelerde oran kıyaslama, barem farkı, değerli oran ve garantili kazanç adayları tek ekranda toplanır.</p>
          </div>
          <button type="button" class="odds-v528-refresh" data-odds-action="refresh"><i class="fa-solid fa-rotate"></i> VERİYİ YENİLE</button>
        </div>

        <div class="odds-v528-kpis">
          <div><span>Kaynak Site</span><b>${s.sources}</b></div>
          <div><span>Maç</span><b>${s.matches}</b></div>
          <div><span>Karşılaştırılan Oran</span><b>${s.records}</b></div>
          <div><span>Market Türü</span><b>${s.markets}</b></div>
          <div class="${s.arbs ? "hot" : ""}"><span>Garantili Kazanç Adayı</span><b>${s.arbs}</b></div>
          <div class="${s.values ? "hot" : ""}"><span>Değerli Oran</span><b>${s.values}</b></div>
          <div class="${s.lineGaps ? "hot" : ""}"><span>Barem Farkı</span><b>${s.lineGaps}</b></div>
          <div class="${s.critical ? "hot critical" : ""}"><span>Ciddi Sinyal</span><b>${s.critical}</b></div>
        </div>

        <div class="odds-v528-toolbar">
          <div class="odds-v528-tabs">
            ${tabButton("opportunities", "Canlı Fırsatlar")}
            ${tabButton("all-sites", "Tüm Sitelerde Karşılaştır")}
            ${tabButton("compare", "En İyi Oranlar")}
            ${tabButton("markets", "Bahis Türleri")}
            ${tabButton("arbitrage", "Garantili Kazanç")}
            ${tabButton("value", "Değerli Oran")}
            ${tabButton("lines", "Barem Farkı")}
            ${tabButton("drops", "Oran Düşüş Uyarısı")}
            ${tabButton("sources", "Kaynak Siteler")}
          </div>
          <div class="odds-v528-filters v530-filters v531-filters v533-filters">
            <div class="v531-sport-switch" role="group" aria-label="Spor seçimi">
              <button type="button" class="${state.sport === "all" ? "active all" : "all"}" data-odds-sport-btn="all">TÜMÜ</button>
              <button type="button" class="${state.sport === "football" ? "active football" : "football"}" data-odds-sport-btn="football"><i class="fa-solid fa-futbol"></i> FUTBOL</button>
              <button type="button" class="${state.sport === "basketball" ? "active basketball" : "basketball"}" data-odds-sport-btn="basketball"><i class="fa-solid fa-basketball"></i> BASKETBOL</button>
            </div>
            <div class="v533-market-picker">
              <label>Bahis türü / market ara</label>
              <input id="odds-v533-market-search" type="search" placeholder="Örn: 2.5, korner, şut, kart, 60 dakika..." value="${escapeAttr(state.marketSearch || "")}">
              <div class="v533-selected-market">
                <span>${escapeHtml(selectedMarketLabel())}</span>
                ${(state.marketCategory !== "all" || state.marketId !== "all") ? `<button type="button" data-market-reset="1">Sıfırla</button>` : ""}
              </div>
              <div class="v533-market-results">${marketResultsHtml()}</div>
            </div>
            <input id="odds-v528-search" type="search" placeholder="Maç, site, market ara..." value="${escapeHtml(state.search || "")}">
          </div>
        </div>

        <div class="odds-v528-content">${content()}</div>
      </div>`;
  }

  function tabButton(key, label) {
    return `<button type="button" class="${state.tab === key ? "active" : ""}" data-odds-tab="${key}">${label}</button>`;
  }

  function marketSearchItems() {
    const query = normalizeText(state.marketSearch || "");
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    const items = [];
    marketCategories().forEach(cat => {
      items.push({ type: "cat", id: cat.id, label: cat.name, desc: cat.desc || "", search: normalizeText([cat.name, cat.desc, cat.id].join(" ")) });
      (cat.markets || []).forEach(m => {
        items.push({ type: "market", id: m.id, categoryId: cat.id, categoryName: cat.name, label: m.name, desc: cat.name, search: normalizeText([m.name, m.id, cat.name, cat.desc].join(" ")) });
      });
    });
    if (!tokens.length) return items.slice(0, 18);
    return items
      .map(item => ({ ...item, score: tokens.reduce((sum, t) => sum + (item.search.includes(t) ? 1 : 0), 0) }))
      .filter(item => item.score === tokens.length)
      .slice(0, 24);
  }

  function marketResultsHtml() {
    const items = marketSearchItems();
    if (!items.length) return `<div class="v533-market-empty">Aradığın market bulunamadı.</div>`;
    return items.map(item => {
      if (item.type === "cat") {
        return `<button type="button" class="cat" data-category-pick="${escapeAttr(item.id)}"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.desc)}</small></button>`;
      }
      return `<button type="button" class="market" data-market-pick="${escapeAttr(item.id)}" data-category-pick="${escapeAttr(item.categoryId)}"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.categoryName)}</small></button>`;
    }).join("");
  }

  function content() {
    if (state.tab === "all-sites") return renderAllSitesCompare();
    if (state.tab === "compare") return renderCompare();
    if (state.tab === "markets") return renderMarkets();
    if (state.tab === "arbitrage") return renderArbs();
    if (state.tab === "value") return renderValue();
    if (state.tab === "lines") return renderLines();
    if (state.tab === "drops") return renderDrops();
    if (state.tab === "sources") return renderSources();
    return renderOpportunities();
  }

  function renderOpportunities() {
    const values = getValueAlerts().slice(0, 5);
    const arbs = getArbs().slice(0, 3);
    const lines = getLineGaps().slice(0, 5);
    const drops = getDropAlerts().slice(0, 5);

    return `
      ${renderIntelligenceTerminal()}
      <div class="odds-v528-grid">
        ${panel("Değerli Oran Sinyalleri", renderValueList(values), "purple")}
        ${panel("Garantili Kazanç Adayı", renderArbList(arbs), "green")}
        ${panel("Barem Farkı Dedektörü", renderLineList(lines), "blue")}
        ${panel("Oran Düşüş Uyarısı", renderDropList(drops), "red")}
      </div>`;
  }

  function panel(title, html, tone = "") {
    return `<section class="odds-v528-panel ${tone}">
      <div class="odds-v528-panel-head"><h3>${title}</h3></div>
      ${html || empty("Şimdilik fırsat yok.")}
    </section>`;
  }

  function renderAllSitesCompare() {
    const groups = compareGroups();
    if (!groups.length) return empty("Aynı market için en az iki sitede oran gelince burada tüm siteler yan yana görünecek.");
    return `<div class="v530-compare-list">${groups.map(g => {
      const first = g.rows[0];
      const best = first;
      return `<section class="v530-compare-card">
        <div class="v530-compare-head">
          <div><b>${escapeHtml(first.match)}</b><small>${escapeHtml(first.marketLabel)} · ${first.line ?? "-"} · ${escapeHtml(first.outcome)}</small></div>
          <span>En iyi: ${bookTag(best.bookmaker)} ${money(best.current)} ${oddDirectionHtml(best)}</span>
        </div>
        <div class="v530-site-odds-grid">
          ${g.rows.map(r => `<div class="v530-site-odd ${r === best ? "best" : ""}">
            ${bookTag(r.bookmaker)}
            <b>${money(r.current)} ${oddDirectionHtml(r)}</b>
            <small>${historyCompactHtml(r)}</small>
            ${r.info ? `<em>${escapeHtml(r.info)}</em>` : ""}
          </div>`).join("")}
        </div>
      </section>`;
    }).join("")}</div>`;
  }

  function renderMarkets() {
    const cats = marketCategories();
    return `<div class="v530-market-catalog">
      ${cats.map(cat => `<section class="v530-market-cat">
        <div class="v530-market-cat-head">
          <h3>${escapeHtml(cat.name)}</h3>
          <span>${(cat.markets || []).length} market</span>
        </div>
        <p>${escapeHtml(cat.desc || "")}</p>
        <div class="v530-market-tags">
          ${(cat.markets || []).map(m => `<button type="button" data-market-pick="${escapeAttr(m.id)}" data-category-pick="${escapeAttr(cat.id)}">${escapeHtml(m.name)}</button>`).join("")}
        </div>
      </section>`).join("")}
    </div>`;
  }

  function renderCompare() {
    const rows = bestByMarket();
    if (!rows.length) return empty("Veri bulunamadı.");
    return `<div class="odds-v528-table-wrap"><table class="odds-v528-table">
      <thead><tr><th>Maç</th><th>Market</th><th>Barem</th><th>Seçim</th><th>En İyi Site</th><th>Güncel Oran</th><th>Oran Akışı</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.league || "")}</small></td>
        <td>${escapeHtml(r.marketLabel)}</td>
        <td>${r.line ?? "-"}</td>
        <td>${escapeHtml(r.outcome)}</td>
        <td>${bookTag(r.bookmaker)}</td>
        <td class="odd">${money(r.current)} ${oddDirectionHtml(r)}</td>
        <td class="flow">${historyCompactHtml(r)}${r.info ? `<small>${escapeHtml(r.info)}</small>` : ""}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function renderArbs() { return renderArbList(getArbs(), true); }

  function renderArbList(list) {
    if (!list.length) return empty("Garantili kazanç adayı yakalanmadı.");
    return `<div class="odds-v528-cards">${list.map(a => `
      <article class="odds-v528-card arb">
        <div><b>${escapeHtml(a.match)}</b><small>${escapeHtml(a.league || "")}</small></div>
        <div class="odds-v528-big">${signedPct(a.profitPct)}</div>
        <div class="odds-v528-mini">
          <span>1: ${bookTag(a.best["1"].bookmaker)} ${money(a.best["1"].current)} ${oddDirectionHtml(a.best["1"])}</span>
          <span>X: ${bookTag(a.best["X"].bookmaker)} ${money(a.best["X"].current)} ${oddDirectionHtml(a.best["X"])}</span>
          <span>2: ${bookTag(a.best["2"].bookmaker)} ${money(a.best["2"].current)} ${oddDirectionHtml(a.best["2"])}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderValue() { return renderValueList(getValueAlerts(), true); }

  function renderValueList(list) {
    if (!list.length) return empty("Değerli oran eşiğini geçen fırsat yok.");
    return `<div class="odds-v528-cards">${list.map(r => `
      <article class="odds-v528-card value">
        <div><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.marketLabel)} · ${escapeHtml(r.outcome)}</small></div>
        <div class="odds-v528-big">${signedPct(r.evPct)}</div>
        <div class="odds-v528-mini">
          <span>${bookTag(r.bookmaker)} ${money(r.current)} ${oddDirectionHtml(r)}</span>
          <span>Referans Olasılık: ${plainPct(r.refPct)}</span>
          <span>Sitenin Verdiği Olasılık: ${plainPct(r.impliedPct)}</span>
        </div>
        ${r.info ? `<p class="v530-info">${escapeHtml(r.info)}</p>` : ""}
      </article>`).join("")}</div>`;
  }

  function renderLines() { return renderLineList(getLineGaps(), true); }

  function renderLineList(list) {
    if (!list.length) return empty("Barem farkı yok.");
    return `<div class="odds-v528-cards">${list.map(x => `
      <article class="odds-v528-card linegap">
        <div><b>${escapeHtml(x.match)}</b><small>${escapeHtml(x.marketLabel)} · ${escapeHtml(x.low.outcome)}</small></div>
        <div class="odds-v528-big">${x.gap.toFixed(1)} barem farkı</div>
        <div class="odds-v528-mini">
          <span>Düşük Barem: ${bookTag(x.low.bookmaker)} ${x.low.line} · ${money(x.low.current)} ${oddDirectionHtml(x.low)}</span>
          <span>Yüksek Barem: ${bookTag(x.high.bookmaker)} ${x.high.line} · ${money(x.high.current)} ${oddDirectionHtml(x.high)}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderDrops() { return renderDropList(getDropAlerts(), true); }

  function renderDropList(list) {
    if (!list.length) return empty("Oran düşüş eşiğini geçen uyarı yok.");
    return `<div class="odds-v528-cards">${list.map(r => `
      <article class="odds-v528-card drop">
        <div><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.marketLabel)} · ${escapeHtml(r.outcome)}</small></div>
        <div class="odds-v528-big">${signedPct(r.changePct)}</div>
        <div class="odds-v528-mini">
          <span>${bookTag(r.bookmaker)}</span>
          <span>İlk Oran: ${money(r.opening)}</span>
          <span>Güncel Oran: ${money(r.current)} ${oddDirectionHtml(r)}</span>
        </div>
        ${historyCompactHtml(r)}
        ${r.info ? `<p class="v530-info">${escapeHtml(r.info)}</p>` : ""}
      </article>`).join("")}</div>`;
  }

  function renderSources() {
    const sites = state.sources?.sites || [];
    if (!sites.length) return empty("Kaynak listesi boş.");
    return `<div class="odds-v528-table-wrap"><table class="odds-v528-table sources">
      <thead><tr><th>Site</th><th>Tip</th><th>Altyapı</th><th>Durum</th><th>Link</th></tr></thead>
      <tbody>${sites.map(s => `<tr>
        <td><b>${escapeHtml(s.name)}</b><small>${escapeHtml(s.id)}</small></td>
        <td>${s.reference ? "Referans Kaynak" : "Bahis Sitesi"}</td>
        <td>${escapeHtml(groupName(s.id))}</td>
        <td><span class="odds-v528-status ${s.enabled ? "on" : "off"}">${s.enabled ? "Aktif" : "Kapalı"}</span></td>
        <td>${s.url ? `<a class="odds-v528-open" href="${escapeAttr(s.url)}" target="_blank" rel="noopener noreferrer">AÇ</a>` : `<span class="muted">Backend/API bekliyor</span>`}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function empty(text) { return `<div class="odds-v528-empty">${escapeHtml(text)}</div>`; }

  function bookTag(id) {
    const s = sitesMap()[id];
    const ref = s?.reference ? " ref" : "";
    return `<span class="odds-v528-book${ref}">${escapeHtml(s?.name || id)}</span>`;
  }

  function bind() {
    qsa("[data-odds-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.oddsTab || "opportunities";
        saveLocalState();
        render();
      });
    });

    qsa("[data-market-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.marketCategory = btn.dataset.categoryPick || "all";
        state.marketId = btn.dataset.marketPick || "all";
        state.marketSearch = "";
        state.tab = "all-sites";
        saveLocalState();
        render();
      });
    });

    qsa("[data-category-pick]").forEach(btn => {
      if (btn.dataset.marketPick) return;
      btn.addEventListener("click", () => {
        state.marketCategory = btn.dataset.categoryPick || "all";
        state.marketId = "all";
        state.marketSearch = "";
        saveLocalState();
        render();
      });
    });

    qs("[data-market-reset]")?.addEventListener("click", () => {
      state.marketCategory = "all";
      state.marketId = "all";
      state.marketSearch = "";
      saveLocalState();
      render();
    });

    qsa("[data-odds-sport-btn]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.sport = btn.dataset.oddsSportBtn || "all";
        saveLocalState();
        render();
      });
    });

    const marketSearch = qs("#odds-v533-market-search");
    if (marketSearch) {
      marketSearch.addEventListener("input", () => {
        state.marketSearch = marketSearch.value || "";
        saveLocalState();
        render();
      });
    }

    const search = qs("#odds-v528-search");
    if (search) {
      search.addEventListener("input", () => {
        state.search = search.value || "";
        saveLocalState();
        render();
      });
    }

    qs('[data-odds-action="refresh"]')?.addEventListener("click", async () => {
      await load();
      render();
    });

    qs('[data-odds-action="toggle-alarm"]')?.addEventListener("click", () => {
      state.alarmEnabled = !state.alarmEnabled;
      saveLocalState();
      render();
    });

    const sens = qs("#v533-alarm-sensitivity");
    if (sens) {
      sens.addEventListener("input", () => {
        state.alarmSensitivity = Number(sens.value || 0.4);
        saveLocalState();
      });
    }
  }

  async function load() {
    state.sources = await loadJson(DATA_SOURCES, FALLBACK_SOURCES);
    state.snapshot = await loadJson(DATA_SNAPSHOT, FALLBACK_SNAPSHOT);
    state.lastLoadedAt = new Date().toISOString();
  }

  function render() {
    const mount = qs("#omega-odds-render");
    if (!mount) return;
    mount.innerHTML = shell();
    bind();
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[s]));
  }

  function escapeAttr(str) { return escapeHtml(str).replace(/`/g, "&#96;"); }

  window.omega_RenderOddsTerminal = async function () {
    readLocalState();
    const mount = qs("#omega-odds-render");
    if (!mount) return;
    if (!state.sources || !state.snapshot) {
      mount.innerHTML = `<div class="odds-v528-loading"><i class="fa-solid fa-spinner fa-spin"></i> Oran Terminali yükleniyor...</div>`;
      await load();
    }
    render();
  };

  function ensureOddsDom() {
    const navContainer = document.querySelector("#main-dropdown-nav .nav-container") || document.getElementById("main-dropdown-nav");
    if (navContainer && !document.getElementById("nav-odds")) {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.id = "nav-odds";
      a.href = "#odds";
      a.innerHTML = '<i class="fa-solid fa-chart-line"></i> ORAN TERMİNALİ';
      const favs = document.getElementById("nav-favs");
      const stream = document.getElementById("nav-stream");
      if (favs && favs.parentNode === navContainer) navContainer.insertBefore(a, favs);
      else if (stream && stream.parentNode === navContainer && stream.nextSibling) navContainer.insertBefore(a, stream.nextSibling);
      else navContainer.appendChild(a);
    }

    const wrapper = document.querySelector(".center-wrapper");
    if (wrapper && !document.getElementById("omega-odds-block")) {
      const block = document.createElement("div");
      block.id = "omega-odds-block";
      block.className = "omega-odds-terminal";
      block.style.display = "none";
      block.innerHTML = '<div id="omega-odds-render"></div>';
      const rolling = document.getElementById("omega-rolling-block");
      if (rolling && rolling.parentNode === wrapper) wrapper.insertBefore(block, rolling);
      else wrapper.appendChild(block);
    }
  }

  async function showOddsTerminal(updateHash = false) {
    ensureOddsDom();

    if (updateHash && String(location.hash || "") !== "#odds") {
      history.pushState({ tab: "odds" }, "", "#odds");
    }

    const hideIds = ["omega-radar-block","omega-favs-block","omega-stream-block","omega-live-block","omega-live-center-block","omega-crypto-block","omega-rolling-block"];
    hideIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
        if (id === "omega-rolling-block") {
          el.removeAttribute("data-visible");
          el.setAttribute("aria-hidden", "true");
        }
      }
    });

    const fin = document.getElementById("v19-finance-block");
    if (fin) fin.classList.remove("active");

    document.body.classList.remove("omega-tab-futbol","omega-tab-basketbol","omega-tab-rolling","omega-tab-stream","omega-tab-favs","omega-tab-live","omega-tab-crypto","omega-tab-finance");
    document.body.classList.add("omega-tab-odds");
    document.body.classList.remove("rolling-active");
    document.documentElement.classList.remove("rolling-hash-boot");

    document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
    document.getElementById("nav-odds")?.classList.add("active");

    const title = document.getElementById("active-module-name");
    if (title) title.innerHTML = '<span class="v531-module-title">/ ORAN TERMİNALİ</span>';

    const center = document.querySelector(".center-wrapper");
    if (center) center.style.maxWidth = "1850px";

    const oddsBlock = document.getElementById("omega-odds-block");
    if (oddsBlock) oddsBlock.style.display = "block";

    await window.omega_RenderOddsTerminal?.();

    const menu = document.getElementById("main-dropdown-nav");
    if (menu) menu.classList.remove("active-menu");
  }

  window.omega_ShowOddsTerminal = showOddsTerminal;

  document.addEventListener("click", e => {
    const link = e.target.closest("#nav-odds, a[href='#odds']");
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    showOddsTerminal(true);
  }, true);

  window.addEventListener("hashchange", () => {
    const key = String(location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (key === "odds") setTimeout(() => showOddsTerminal(false), 0);
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureOddsDom();
    const key = String(location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (key === "odds") setTimeout(() => showOddsTerminal(false), 0);
  });
})();
