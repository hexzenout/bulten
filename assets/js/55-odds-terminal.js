// ===============================
// V544 ORAN TERMİNALİ
// Ana kategori + market UX temizliği + POLYMARKET izolasyonu
// V542 POLYMARKET dock davranışı korunarak main ile hizalandı
// ===============================

(function () {
  const DATA_SOURCES = "assets/data/odds-sources.json";
  const DATA_SNAPSHOT = "assets/data/odds-snapshot.json";
  const STORE_KEY = "v544_odds_terminal_state";

  const state = {
    tab: "opportunities",
    sport: "all",
    polyFilter: "all",
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
    marketPickerOpen: false,
    pinnedMarketCats: [],
    openMarketCats: null,
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

  function normalizeSavedState(saved) {
    if (!saved || typeof saved !== "object") return {};
    const safe = { ...saved };
    if (!["all", "football", "basketball", "polymarket"].includes(safe.sport)) safe.sport = "all";
    if (!["all", "sports", "crypto", "economy", "news", "short", "liquid", "value"].includes(safe.polyFilter)) safe.polyFilter = "all";
    const tabMap = {
      intelligence: "opportunities",
      compare: "opportunities",
      arbitrage: "opportunities",
      value: "opportunities",
      lines: "all-sites"
    };
    safe.tab = tabMap[safe.tab] || safe.tab || "opportunities";
    if (!["opportunities", "markets", "all-sites", "drops", "sources"].includes(safe.tab)) safe.tab = "opportunities";
    if (safe.sport === "polymarket") {
      safe.marketCategory = "all";
      safe.marketId = "all";
      safe.marketSearch = "";
      safe.marketPickerOpen = false;
    }
    return safe;
  }

  function readLocalState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      Object.assign(state, normalizeSavedState(saved));
      ensureMarketFitsSport();
    } catch {}
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        tab: state.tab,
        sport: state.sport,
        polyFilter: state.polyFilter,
        search: state.search,
        marketCategory: state.marketCategory,
        marketId: state.marketId,
        marketSearch: state.marketSearch,
        selectedCompareKey: state.selectedCompareKey,
        minDropPct: state.minDropPct,
        minValuePct: state.minValuePct,
        minLineGap: state.minLineGap,
        alarmEnabled: state.alarmEnabled,
        alarmSensitivity: state.alarmSensitivity,
        pinnedMarketCats: Array.isArray(state.pinnedMarketCats) ? state.pinnedMarketCats : [],
        openMarketCats: Array.isArray(state.openMarketCats) ? state.openMarketCats : null
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

  function allMarketCategories() {
    return state.sources?.marketCategories || [];
  }

  function categorySport(cat) {
    if (cat?.sport) return cat.sport;
    const id = String(cat?.id || "").toLowerCase();
    if (id.includes("basket")) return "basketball";
    return "football";
  }

  const V544_FOOTBALL_CATEGORIES = [
    {
      id: "v544_football_result",
      name: "Ana Sonuç",
      desc: "Maç sonucu, çifte şans ve KG seçenekleri",
      sport: "football",
      markets: [
        { id: "match_winner", name: "Maç Sonucu" },
        { id: "double_chance", name: "Çifte Şans" },
        { id: "draw_no_bet", name: "Beraberlikte İade" },
        { id: "both_teams_to_score", name: "KG Var / Yok" }
      ]
    },
    {
      id: "v544_football_goals",
      name: "Gol Marketleri",
      desc: "Yaygın alt/üst ve takım gol marketleri",
      sport: "football",
      markets: [
        { id: "total_goals_0_5", name: "0.5 Gol Alt / Üst" },
        { id: "total_goals_1_5", name: "1.5 Gol Alt / Üst" },
        { id: "total_goals_2_5", name: "2.5 Gol Alt / Üst" },
        { id: "total_goals_3_5", name: "3.5 Gol Alt / Üst" },
        { id: "goals_4_5", name: "4.5 Gol Alt / Üst" },
        { id: "total_goals_over_1_0", name: "Genel 1 Gol Üst" },
        { id: "total_goals_over_2_0", name: "Genel 2 Gol Üst" },
        { id: "total_goals_over_3_0", name: "Genel 3 Gol Üst" },
        { id: "team1_total_goals", name: "Ev Sahibi Gol Alt / Üst" },
        { id: "team2_total_goals", name: "Deplasman Gol Alt / Üst" },
        { id: "team1_goals_over_1_0", name: "Takım 1 Gol Üst" },
        { id: "team2_goals_over_1_0", name: "Takım 2 Gol Üst" }
      ]
    },
    {
      id: "v544_football_halves",
      name: "Yarı Marketleri",
      desc: "İlk yarı, ikinci yarı ve yarı/maç sonucu",
      sport: "football",
      markets: [
        { id: "first_half_result", name: "İlk Yarı Sonucu" },
        { id: "first_half_goals_0_5", name: "İlk Yarı 0.5 Gol Alt / Üst" },
        { id: "first_half_over_1_5", name: "İlk Yarı 1.5 Gol Alt / Üst" },
        { id: "second_half_result", name: "İkinci Yarı Sonucu" },
        { id: "second_half_goals_0_5", name: "İkinci Yarı 0.5 Gol Alt / Üst" },
        { id: "second_half_total_goals_over_1_0", name: "İkinci Yarı 1.5 Gol Alt / Üst" },
        { id: "half_time_full_time", name: "İlk Yarı / Maç Sonucu" }
      ]
    },
    {
      id: "v544_football_corners_cards",
      name: "Korner / Kart",
      desc: "Korner, kart ve kırmızı kart marketleri",
      sport: "football",
      markets: [
        { id: "total_corners", name: "Toplam Korner Alt / Üst" },
        { id: "corners_8_5", name: "8.5 Korner Alt / Üst" },
        { id: "corners_9_5", name: "9.5 Korner Alt / Üst" },
        { id: "corners_10_5", name: "10.5 Korner Alt / Üst" },
        { id: "first_half_corners", name: "İlk Yarı Korner" },
        { id: "team1_corners", name: "Takım Korner Alt / Üst" },
        { id: "total_cards", name: "Toplam Kart Alt / Üst" },
        { id: "team_cards", name: "Takım Kart Alt / Üst" },
        { id: "red_card", name: "Kırmızı Kart Olur / Olmaz" }
      ]
    },
    {
      id: "v544_football_handicap",
      name: "Handikap",
      desc: "Basit ve yaygın handikap seçenekleri",
      sport: "football",
      markets: [
        { id: "asian_handicap", name: "Maç Handikapı" },
        { id: "european_handicap", name: "Avrupa Handikap" },
        { id: "team1_minus_handicap", name: "Takım 1 Handikap" },
        { id: "team2_plus_handicap", name: "Takım 2 Handikap" }
      ]
    }
  ];

  const V544_BASKETBALL_CATEGORIES = [
    {
      id: "v544_basket_main",
      name: "Basketbol Ana Marketler",
      desc: "Maç, yarı ve çeyrek bazlı ana marketler",
      sport: "basketball",
      markets: [
        { id: "basket_match_winner", name: "Maç Sonucu" },
        { id: "basket_handicap", name: "Maç Handikapı" },
        { id: "basket_total_points", name: "Toplam Sayı Alt / Üst" },
        { id: "basket_first_half_winner", name: "İlk Yarı Sonucu" },
        { id: "basket_first_half_handicap", name: "İlk Yarı Handikap" },
        { id: "basket_first_half_total", name: "İlk Yarı Toplam Sayı" },
        { id: "basket_q1_winner", name: "İlk Çeyrek Sonucu" },
        { id: "basket_q1_handicap", name: "İlk Çeyrek Handikap" },
        { id: "basket_quarter_total", name: "İlk Çeyrek Toplam Sayı" },
        { id: "basket_q2_winner", name: "İkinci Çeyrek Sonucu" },
        { id: "basket_q2_handicap", name: "İkinci Çeyrek Handikap" },
        { id: "basket_q2_total", name: "İkinci Çeyrek Toplam Sayı" },
        { id: "basket_q3_winner", name: "Üçüncü Çeyrek Sonucu" },
        { id: "basket_q4_winner", name: "Dördüncü Çeyrek Sonucu" }
      ]
    },
    {
      id: "v544_basket_team",
      name: "Takım Marketleri",
      desc: "Takım toplam sayı, handikap ve eşik marketleri",
      sport: "basketball",
      markets: [
        { id: "basket_team1_total", name: "Takım 1 Toplam Sayı Alt / Üst" },
        { id: "basket_team2_total", name: "Takım 2 Toplam Sayı Alt / Üst" },
        { id: "basket_team1_handicap", name: "Takım 1 Handikap" },
        { id: "basket_team2_handicap", name: "Takım 2 Handikap" },
        { id: "basket_team1_first_half_total", name: "Takım 1 İlk Yarı Sayı Alt / Üst" },
        { id: "basket_team2_first_half_total", name: "Takım 2 İlk Yarı Sayı Alt / Üst" },
        { id: "basket_both_teams_60_5", name: "Her İki Takım da 60.5 Üst Sayı Atar" },
        { id: "basket_both_teams_65_5", name: "Her İki Takım da 65.5 Üst Sayı Atar" },
        { id: "basket_both_teams_68_5", name: "Her İki Takım da 68.5 Üst Sayı Atar" },
        { id: "basket_both_teams_70_5", name: "Her İki Takım da 70.5 Üst Sayı Atar" },
        { id: "basket_both_teams_75_5", name: "Her İki Takım da 75.5 Üst Sayı Atar" }
      ]
    },
    {
      id: "v544_basket_player",
      name: "Oyuncu Marketleri",
      desc: "Oyuncu sayı, ribaund, asist ve savunma istatistikleri",
      sport: "basketball",
      markets: [
        { id: "player_points", name: "Oyuncu Sayı Alt / Üst" },
        { id: "player_rebounds", name: "Oyuncu Ribaund Alt / Üst" },
        { id: "player_assists", name: "Oyuncu Asist Alt / Üst" },
        { id: "player_threes", name: "Oyuncu Üçlük Alt / Üst" },
        { id: "player_steals", name: "Oyuncu Top Çalma Alt / Üst" },
        { id: "player_blocks", name: "Oyuncu Blok Alt / Üst" },
        { id: "player_fouls", name: "Oyuncu Faul Alt / Üst" },
        { id: "player_pra", name: "Oyuncu Sayı + Ribaund + Asist" }
      ]
    }
  ];

  const V544_POLY_FILTERS = [
    ["all", "Hepsi"], ["sports", "Spor"], ["crypto", "Kripto"], ["economy", "Ekonomi"],
    ["news", "Haber"], ["short", "Kısa Vade"], ["liquid", "Yüksek Likidite"], ["value", "Fırsat Adayı"]
  ];

  function isPolymarketMode() { return state.sport === "polymarket"; }

  function curatedMarketCategories() {
    return [...V544_FOOTBALL_CATEGORIES, ...V544_BASKETBALL_CATEGORIES];
  }

  function marketCategories() {
    const all = curatedMarketCategories();
    if (state.sport === "polymarket") return [];
    if (state.sport === "football") return all.filter(cat => categorySport(cat) === "football");
    if (state.sport === "basketball") return all.filter(cat => categorySport(cat) === "basketball");
    return all;
  }

  function marketMap() {
    const map = {};
    curatedMarketCategories().forEach(cat => (cat.markets || []).forEach(m => map[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name, sport: categorySport(cat) }));
    allMarketCategories().forEach(cat => (cat.markets || []).forEach(m => {
      if (!map[m.id]) map[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name, sport: categorySport(cat) };
    }));
    return map;
  }

  function selectedMarketFitsSport() {
    if (state.sport === "polymarket") return true;
    if (state.marketCategory === "all" && state.marketId === "all") return true;
    const allowed = new Set(marketCategories().map(c => c.id));
    if (state.marketCategory !== "all") return allowed.has(state.marketCategory);
    if (state.marketId !== "all") {
      const meta = marketMap()[state.marketId];
      return !meta || state.sport === "all" || meta.sport === state.sport;
    }
    return true;
  }

  function ensureMarketFitsSport() {
    if (!selectedMarketFitsSport()) {
      state.marketCategory = "all";
      state.marketId = "all";
      state.marketSearch = "";
      state.openMarketCats = null;
    }
  }

  function selectedMarketLabel() {
    if (state.marketId !== "all") {
      const meta = marketMap()[state.marketId];
      return meta ? meta.name : "Seçili market";
    }
    if (state.marketCategory !== "all") {
      const cat = curatedMarketCategories().find(c => c.id === state.marketCategory) || allMarketCategories().find(c => c.id === state.marketCategory);
      return cat ? cat.name : "Seçili bahis türü";
    }
    return "Tüm bahis türleri ve marketler";
  }

  function isPolymarketRecord(r) {
    const site = sitesMap()[r?.bookmaker];
    const bookmaker = String(r?.bookmaker || "").toLowerCase();
    const type = String(r?.type || r?.sourceType || site?.type || "").toLowerCase();
    return bookmaker === "polymarket" || type === "prediction_market";
  }

  function records(raw = false) {
    if (state.sport === "polymarket") return [];
    const list = (state.snapshot?.records || []).filter(r => !isPolymarketRecord(r));
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

  function polymarketRecords(raw = false) {
    const list = (state.snapshot?.records || []).filter(isPolymarketRecord);
    if (raw) return list;
    const search = normalizeText(state.search || "");
    return list.filter(r => {
      const eventType = normalizeText(r.eventType || r.league || "");
      const hours = hoursUntil(r.expiresAt || r.kickoff);
      const filterOk = state.polyFilter === "all"
        || (state.polyFilter === "sports" && (r.sport === "football" || r.sport === "basketball" || eventType.includes("spor")))
        || (state.polyFilter === "crypto" && eventType.includes("kripto"))
        || (state.polyFilter === "economy" && (eventType.includes("ekonomi") || eventType.includes("makro")))
        || (state.polyFilter === "news" && eventType.includes("haber"))
        || (state.polyFilter === "short" && Number.isFinite(hours) && hours > 0 && hours <= 48)
        || (state.polyFilter === "liquid" && Number(r.liquidity || 0) >= 100000)
        || (state.polyFilter === "value" && polymarketEdge(r) >= Number(state.minValuePct || 5));
      const sportOk = state.sport === "polymarket" || state.sport === "all" || r.sport === state.sport || r.sport === "prediction";
      const haystack = normalizeText([r.question, r.match, r.league, r.marketLabel, r.outcome, r.info, r.eventType, r.timeframe].join(" "));
      const searchOk = !search || search.split(/\s+/).every(token => haystack.includes(token));
      return filterOk && sportOk && searchOk;
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
      <small>Diğer değişimler</small>
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

  function hoursUntil(value) {
    const ts = Date.parse(value || "");
    if (!Number.isFinite(ts)) return null;
    return (ts - Date.now()) / 36e5;
  }

  function formatDeadline(value) {
    const hours = hoursUntil(value);
    if (hours == null) return "Kapanış yok";
    if (hours <= 0) return "Kapanmış";
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} dk kaldı`;
    if (hours < 48) return `${hours.toFixed(1)} saat kaldı`;
    return `${Math.ceil(hours / 24)} gün kaldı`;
  }

  function polymarketEdge(row) {
    if (Number.isFinite(Number(row?.edgePct))) return Number(row.edgePct);
    const p = Number(row?.referenceProb || 0);
    const odd = Number(row?.current || 0);
    return p && odd ? (p * odd - 1) * 100 : 0;
  }

  function polymarketScore(row) {
    const edge = Math.max(0, polymarketEdge(row));
    const confidence = Number(row?.confidence || 0);
    const liquidity = Math.min(10, Math.log10(Math.max(10, Number(row?.liquidity || 0))));
    const shortBoost = Math.max(0, 12 - Math.max(0, Number(hoursUntil(row?.expiresAt) || 99)) / 4);
    return Math.round(Math.max(confidence, 58 + edge * 1.6 + liquidity * 2 + shortBoost));
  }

  function getPolymarketSignals(list = polymarketRecords()) {
    return list
      .map(r => ({ ...r, edgePct: polymarketEdge(r), score: polymarketScore(r), hoursLeft: hoursUntil(r.expiresAt) }))
      .sort((a, b) => b.score - a.score || b.edgePct - a.edgePct);
  }

  function polymarketSummary(list = polymarketRecords()) {
    const signals = getPolymarketSignals(list);
    const shortTerm = signals.filter(x => Number.isFinite(x.hoursLeft) && x.hoursLeft > 0 && x.hoursLeft <= 48).length;
    const value = signals.filter(x => x.edgePct >= Number(state.minValuePct || 5)).length;
    const avgScore = signals.length ? Math.round(signals.reduce((sum, x) => sum + Number(x.score || 0), 0) / signals.length) : 0;
    return { records: list.length, shortTerm, value, avgScore };
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
    const poly = polymarketSummary();
    return {
      records: list.length,
      sources: sourceCount,
      matches: matchCount,
      drops: getDropAlerts(list).length,
      values: getValueAlerts(list).length,
      lineGaps: getLineGaps(list).length,
      arbs: getArbs(list).length,
      markets: marketCategories().reduce((sum, c) => sum + (c.markets?.length || 0), 0),
      critical: criticalInsights().length,
      polymarket: poly.records,
      polymarketValue: poly.value
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

  function renderIntelligenceHub() {
    const items = criticalInsights();
    return `<section class="v536-intel-page">
      <div class="v536-intel-title">
        <div>
          <span>İSTİHBARAT</span>
          <h3>Ciddi Avantajlı Bahisler</h3>
          <p>Bu alan ayrı sekmedir. Sadece güçlü değer farkı, barem farkı veya sert oran hareketi olan sinyalleri kart olarak gösterir; grafik yok.</p>
        </div>
        <button type="button" data-odds-action="toggle-alarm" class="${state.alarmEnabled ? "active" : ""}">${state.alarmEnabled ? "Avantaj Alarmı Açık" : "Avantaj Alarmı Kapalı"}</button>
      </div>
      <div class="v536-intel-controls">
        <label>Alarm Hassasiyeti <input id="v533-alarm-sensitivity" type="range" min="0" max="1" step="0.05" value="${Number(state.alarmSensitivity || 0.4)}"></label>
      </div>
      <div class="v536-intel-grid">
        ${items.length ? items.map(x => `<article>
          <strong>${escapeHtml(x.type)}</strong>
          <b>${escapeHtml(x.row?.match || x.lineGap?.match || "-")}</b>
          <span>${escapeHtml(x.row?.marketLabel || x.lineGap?.marketLabel || "")} · ${escapeHtml(x.row?.outcome || "")}</span>
          <em>${escapeHtml(x.reason)}</em>
          <small>Güven skoru: ${Math.round(x.score || 0)}</small>
        </article>`).join("") : `<div class="odds-v528-empty">Şu an ciddi avantaj seviyesinde sinyal yok.</div>`}
      </div>
    </section>`;
  }

  function renderIntelligenceTerminal() {
    return renderIntelligenceHub();
  }

  function polyMarkSvg() {
    return `<svg class="v544-poly-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h8.2c3.6 0 5.8 2 5.8 5.1s-2.2 5.2-5.8 5.2H9.4V20H5V4Zm4.4 3.7v2.9h3.5c1 0 1.7-.5 1.7-1.5s-.7-1.4-1.7-1.4H9.4Z" fill="currentColor"/><path d="M15.2 15.8 19.4 20h-5.1l-3.5-4.2h4.4Z" fill="currentColor" opacity=".9"/></svg>`;
  }

  function categoryButton(key, label, icon = "") {
    const active = state.sport === key ? "active" : "";
    return `<button type="button" class="${active} ${escapeAttr(key)}" data-odds-sport-btn="${escapeAttr(key)}">${icon}<span>${escapeHtml(label)}</span></button>`;
  }

  function renderCategoryRow() {
    return `<div class="v544-category-row" data-odds-category-row="1" role="group" aria-label="Oran Terminali ana kategori seçimi">
      <div class="v544-category-left">
        ${categoryButton("all", "TÜMÜ")}
        ${categoryButton("football", "FUTBOL", '<i class="fa-solid fa-futbol"></i>')}
        ${categoryButton("basketball", "BASKETBOL", '<i class="fa-solid fa-basketball"></i>')}
      </div>
      <div class="v544-category-right">
        ${categoryButton("polymarket", "POLYMARKET", polyMarkSvg())}
      </div>
    </div>`;
  }

  function renderMarketControl() {
    if (isPolymarketMode()) {
      return `<div class="omega-market-picker v544-poly-info">
        <span>Bahis Türü / Market</span>
        <b>POLYMARKET panelinde izole</b>
        <small>Futbol/basket marketleri bu modda gizlenir.</small>
      </div>`;
    }
    return `<div class="v536-market-menu v540-market-menu omega-market-picker ${state.marketPickerOpen ? "open" : ""}">
      <button type="button" class="v536-market-toggle omega-market-toggle" data-market-drawer-toggle="1" aria-expanded="${state.marketPickerOpen ? "true" : "false"}">
        <span>Bahis Türü / Market</span>
        <b>${escapeHtml(selectedMarketLabel())}</b>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
      ${state.marketPickerOpen ? `<div class="v536-market-dropdown omega-market-dropdown">
        <input id="odds-v533-market-search" type="search" placeholder="2.5 gol, KG, korner, handikap, 68.5 üst, oyuncu faul..." value="${escapeAttr(state.marketSearch || "")}">
        <div class="v533-selected-market">
          <span>${escapeHtml(selectedMarketLabel())}</span>
          ${(state.marketCategory !== "all" || state.marketId !== "all") ? `<button type="button" data-market-reset="1">Sıfırla</button>` : ""}
        </div>
        <div class="v533-market-results">${marketResultsHtml()}</div>
      </div>` : ""}
    </div>`;
  }

  function shell() {
    const s = summary();
    const mode = state.snapshot?.mode === "demo" ? "Demo veri" : "Veri";
    return `
      <div class="odds-v528-shell">
        <div class="odds-v528-hero">
          <div>
            <div class="odds-v528-kicker"><i class="fa-solid fa-chart-line"></i> ORAN TERMİNALİ</div>
            <h2>Değerli Oran · Oran Düşüş Uyarısı · Barem Farkı · POLYMARKET</h2>
            <p>${mode}. Futbol ve basketbol için oran kıyaslama ayrı çalışır; POLYMARKET kısa vadeli tahmin marketleri Oran Terminali altında kendi panelinde izlenir.</p>
          </div>
          <button type="button" class="odds-v528-refresh" data-odds-action="refresh"><i class="fa-solid fa-rotate"></i> VERİYİ YENİLE</button>
        </div>

        <div class="odds-v528-kpis">
          <div><span>Kaynak Site</span><b>${s.sources}</b></div>
          <div><span>Maç</span><b>${s.matches}</b></div>
          <div><span>Karşılaştırılan Oran</span><b>${s.records}</b></div>
          <div><span>Market Türü</span><b>${s.markets}</b></div>
          <div class="${s.arbs ? "hot" : ""}"><span>Arbitraj Adayı</span><b>${s.arbs}</b></div>
          <div class="${s.values ? "hot" : ""}"><span>Değerli Oran</span><b>${s.values}</b></div>
          <div class="${s.lineGaps ? "hot" : ""}"><span>Barem Farkı</span><b>${s.lineGaps}</b></div>
          <div class="${s.critical ? "hot critical" : ""}"><span>Ciddi Sinyal</span><b>${s.critical}</b></div>
          <div class="${s.polymarketValue ? "hot polymarket" : "polymarket"}"><span>POLYMARKET</span><b>${s.polymarket}</b></div>
        </div>

        <div class="odds-v528-toolbar v544-odds-toolbar">
          ${renderCategoryRow()}
          <div class="odds-v528-tabs v544-tabs">
            ${tabButton("opportunities", "Fırsat Radarı")}
            ${tabButton("markets", "Marketler")}
            ${tabButton("all-sites", "Oran Karşılaştırma")}
            ${tabButton("drops", "Oran Hareketleri")}
            ${tabButton("sources", "Kaynaklar")}
          </div>
          <div class="odds-v528-filters v530-filters v531-filters v533-filters v534-filters v536-filters v544-filters">
            ${renderMarketControl()}
          </div>
        </div>

        <div class="odds-v528-content">${content()}</div>
      </div>`;
  }

  function tabButton(key, label) {
    return `<button type="button" class="${state.tab === key ? "active" : ""}" data-odds-tab="${key}">${label}</button>`;
  }


  const MAIN_MARKET_CATEGORY_IDS = ["v544_football_result", "v544_football_goals", "v544_basket_main", "v544_basket_team"];

  function defaultOpenCategoryIds() {
    const existing = new Set(marketCategories().map(c => c.id));
    return MAIN_MARKET_CATEGORY_IDS.filter(id => existing.has(id));
  }

  function openCategoryIds() {
    if (Array.isArray(state.openMarketCats)) return [...state.openMarketCats];
    return defaultOpenCategoryIds();
  }

  function isCategoryOpen(id) {
    const query = normalizeText(state.marketSearch || "");
    if (query) return true;
    return openCategoryIds().includes(id);
  }

  function isCategoryPinned(id) {
    return Array.isArray(state.pinnedMarketCats) && state.pinnedMarketCats.includes(id);
  }

  function sortCategoriesForMarketPicker(cats) {
    const pinned = new Set(Array.isArray(state.pinnedMarketCats) ? state.pinnedMarketCats : []);
    const main = new Set(MAIN_MARKET_CATEGORY_IDS);
    return [...cats].sort((a, b) => {
      const ap = pinned.has(a.id) ? 0 : 1;
      const bp = pinned.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const am = main.has(a.id) ? 0 : 1;
      const bm = main.has(b.id) ? 0 : 1;
      if (am !== bm) return am - bm;
      return marketCategories().findIndex(c => c.id === a.id) - marketCategories().findIndex(c => c.id === b.id);
    });
  }

  function marketSearchItems() {
    const query = normalizeText(state.marketSearch || "");
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];

    const cats = marketCategories().map(cat => {
      const catSearch = normalizeText([cat.name, cat.desc, cat.id].join(" "));
      const catMatches = !tokens.length || tokens.every(t => catSearch.includes(t));
      const markets = (cat.markets || []).filter(m => {
        const hay = normalizeText([m.name, m.id, cat.name, cat.desc].join(" "));
        return !tokens.length || catMatches || tokens.every(t => hay.includes(t));
      });
      return { ...cat, _catMatches: catMatches, _markets: markets };
    }).filter(cat => !tokens.length || cat._catMatches || cat._markets.length);

    return sortCategoriesForMarketPicker(cats);
  }

  function marketResultsHtml() {
    const cats = marketSearchItems();
    const query = normalizeText(state.marketSearch || "");
    if (!cats.length) return `<div class="v537-market-empty">Aradığın bahis türü / market bulunamadı.</div>`;

    return `<div class="v537-market-accordion">${cats.map(cat => {
      const pinned = isCategoryPinned(cat.id);
      const open = isCategoryOpen(cat.id);
      const arrow = open ? "fa-chevron-up" : "fa-chevron-down";
      const markets = cat._markets || cat.markets || [];
      return `<section class="v537-market-cat omega-market-card ${open ? "open" : "closed"} ${pinned ? "pinned" : ""}">
        <div class="v537-market-cat-head">
          <button type="button" class="v537-cat-toggle" data-cat-toggle="${escapeAttr(cat.id)}">
            <i class="fa-solid ${arrow}"></i>
            <span>
              <b class="omega-market-card-title">${escapeHtml(cat.name)}</b>
              <small class="omega-market-card-desc">${escapeHtml(cat.desc || "")}</small>
            </span>
          </button>
          <button type="button" class="v537-cat-pin ${pinned ? "active" : ""}" data-cat-pin="${escapeAttr(cat.id)}" title="${pinned ? "Baştan kaldır" : "Başa sabitle"}">
            <i class="fa-solid fa-thumbtack"></i>
          </button>
        </div>
        ${open ? `<div class="v537-market-list">
          ${markets.length ? markets.map(m => `<button type="button" class="v537-market-item omega-market-card" data-market-pick="${escapeAttr(m.id)}" data-category-pick="${escapeAttr(cat.id)}">
            <b class="omega-market-card-title">${escapeHtml(m.name)}</b>
            <small class="omega-market-card-desc">${escapeHtml(cat.name)}</small>
          </button>`).join("") : `<div class="v537-market-empty">Bu başlıkta aramaya uygun market yok.</div>`}
        </div>` : ""}
      </section>`;
    }).join("")}</div>`;
  }

  function content() {
    if (isPolymarketMode()) return renderPolymarket();
    if (state.tab === "all-sites") return renderAllSitesCompare();
    if (state.tab === "markets") return renderMarkets();
    if (state.tab === "drops") return renderDrops();
    if (state.tab === "sources") return renderSources();
    return renderOpportunities();
  }

  function renderPolymarket() {
    const polyBase = polymarketRecords();
    const list = getPolymarketSignals(polyBase);
    const s = polymarketSummary(polyBase);
    return `<section class="v541-polymarket-panel" aria-label="POLYMARKET ayrı alan">
      <div class="v541-poly-hero">
        <div>
          <span>ORAN TERMİNALİ ALT PANELİ</span>
          <h3>POLYMARKET Kısa Vadeli Market Radar</h3>
          <p>Bu alan normal bahis oranlarından ayrıdır. Polymarket kayıtları burada; futbol/basket oran kıyaslama tabloları içinde karışmaz.</p>
        </div>
        <div class="v541-poly-badge"><i class="fa-solid fa-shield-halved"></i> Route izole: #odds içinde</div>
      </div>

      <div class="v544-poly-filters" role="group" aria-label="Polymarket filtreleri">
        ${V544_POLY_FILTERS.map(([key, label]) => `<button type="button" class="${state.polyFilter === key ? "active" : ""}" data-poly-filter="${escapeAttr(key)}">${escapeHtml(label)}</button>`).join("")}
      </div>

      <div class="v541-poly-kpis">
        <div><span>Market</span><b>${s.records}</b></div>
        <div><span>Kısa Vade</span><b>${s.shortTerm}</b></div>
        <div><span>Avantaj Adayı</span><b>${s.value}</b></div>
        <div><span>Ortalama Güven</span><b>${s.avgScore}</b></div>
      </div>

      ${list.length ? `<div class="v541-poly-grid">${list.map(renderPolymarketCard).join("")}</div>` : empty("Polymarket kaydı yok. odds-snapshot.json içine bookmaker: polymarket kayıtları gelince burada görünecek.")}
    </section>`;
  }

  function renderPolymarketDock() {
    const signals = getPolymarketSignals(polymarketRecords(true));
    const s = polymarketSummary(signals);
    const top = signals.slice(0, 3);
    return `<section class="v542-poly-dock" aria-label="Oran Terminali altı POLYMARKET kısa özet">
      <div class="v542-poly-dock-head">
        <div>
          <span>AYRI POLYMARKET ALANI</span>
          <h3>Oran Terminali altında izole tahmin marketleri</h3>
          <p>Normal futbol/basket oran tablolarına karışmadan yalnızca Polymarket kayıtlarını gösterir.</p>
        </div>
        <button type="button" data-odds-tab="polymarket"><i class="fa-solid fa-arrow-up-right-from-square"></i> POLYMARKET panelini aç</button>
      </div>
      <div class="v542-poly-dock-stats">
        <div><span>Market</span><b>${s.records}</b></div>
        <div><span>Kısa Vade</span><b>${s.shortTerm}</b></div>
        <div><span>Avantaj</span><b>${s.value}</b></div>
      </div>
      ${top.length ? `<div class="v542-poly-dock-list">${top.map(r => `
        <article>
          <b>${escapeHtml(r.question || r.match || "Polymarket marketi")}</b>
          <span>${escapeHtml(r.eventType || r.league || "Prediction")} · ${signedPct(r.edgePct)} edge · ${escapeHtml(formatDeadline(r.expiresAt || r.kickoff))}</span>
        </article>`).join("")}</div>` : empty("Polymarket kaydı yok. Ayrı alan veri bekliyor.")}
    </section>`;
  }

  function renderPolymarketCard(r) {
    const score = Number(r.score || polymarketScore(r));
    const edge = polymarketEdge(r);
    const yes = r.yesPrice != null ? Number(r.yesPrice) : null;
    const no = r.noPrice != null ? Number(r.noPrice) : null;
    const title = r.question || r.match || "Polymarket marketi";
    const tone = edge >= Number(state.minValuePct || 5) ? "hot" : score >= 75 ? "watch" : "calm";
    return `<article class="v541-poly-card ${tone}">
      <div class="v541-poly-card-head">
        <div>
          <b>${escapeHtml(title)}</b>
          <small>${escapeHtml(r.league || r.eventType || "Prediction Market")} · ${escapeHtml(r.marketLabel || "Market")}</small>
        </div>
        <span>${Math.min(99, Math.max(0, Math.round(score)))} güven</span>
      </div>
      <div class="v541-poly-main">
        <div><span>Seçim</span><b>${escapeHtml(r.outcome || "YES")}</b></div>
        <div><span>Oran</span><b>${money(r.current)} ${oddDirectionHtml(r)}</b></div>
        <div><span>Edge</span><b>${signedPct(edge)}</b></div>
        <div><span>Kapanış</span><b>${escapeHtml(formatDeadline(r.expiresAt || r.kickoff))}</b></div>
      </div>
      <div class="v541-poly-meta">
        ${yes != null ? `<span>YES ${(yes * 100).toFixed(1)}¢</span>` : ""}
        ${no != null ? `<span>NO ${(no * 100).toFixed(1)}¢</span>` : ""}
        ${r.liquidity ? `<span>Likidite $${Number(r.liquidity).toLocaleString("en-US")}</span>` : ""}
        ${r.volume24h ? `<span>24s Hacim $${Number(r.volume24h).toLocaleString("en-US")}</span>` : ""}
      </div>
      ${r.info ? `<p>${escapeHtml(r.info)}</p>` : ""}
    </article>`;
  }

  function renderOpportunities() {
    const values = getValueAlerts().slice(0, 5);
    const arbs = getArbs().slice(0, 3);
    const lines = getLineGaps().slice(0, 5);
    const drops = getDropAlerts().slice(0, 5);

    return `
      <div class="odds-v528-grid">
        ${panel("Değerli Oran Sinyalleri", renderValueList(values), "purple")}
        ${panel("Arbitraj Adayları", renderArbList(arbs), "green")}
        ${panel("Barem Farkı Dedektörü", renderLineList(lines), "blue")}
        ${panel("Oran Düşüş Uyarısı", renderDropList(drops), "red")}
      </div>
      ${renderPolymarketDock()}`;
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
    if (!list.length) return empty("Arbitraj adayı yakalanmadı.");
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


  // V540_GLOBAL_MARKET_OUTSIDE_CLOSE
  function installMarketOutsideCloseGuard() {
    if (window.__v540OddsMarketOutsideClose) return;
    window.__v540OddsMarketOutsideClose = true;
    document.addEventListener("pointerdown", (ev) => {
      if (!document.body.classList.contains("omega-tab-odds")) return;
      if (!state.marketPickerOpen) return;
      if (ev.target.closest("[data-odds-category-row], [data-odds-sport-btn], .v536-market-menu, .v537-market-menu, .v535-market-menu, .v540-market-menu, .omega-market-picker, .omega-market-dropdown")) return;
      state.marketPickerOpen = false;
      state.marketSearch = "";
      saveLocalState();
      setTimeout(() => render(), 0);
    }, true);
  }

  function bind() {
    installMarketOutsideCloseGuard();
    qsa("[data-odds-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.oddsTab || "opportunities";
        state.marketPickerOpen = false;
        state.marketSearch = "";
        saveLocalState();
        render();
      });
    });

    function bindMarketButtons(root = document) {
      qsa("[data-cat-toggle]", root).forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.catToggle;
          if (!id) return;
          const open = new Set(openCategoryIds());
          if (open.has(id)) open.delete(id);
          else open.add(id);
          state.openMarketCats = [...open];
          saveLocalState();
          const box = qs(".v533-market-results");
          if (box) {
            box.innerHTML = marketResultsHtml();
            bindMarketButtons(box);
          } else {
            render();
          }
        });
      });

      qsa("[data-cat-pin]", root).forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = btn.dataset.catPin;
          if (!id) return;
          const pinned = new Set(Array.isArray(state.pinnedMarketCats) ? state.pinnedMarketCats : []);
          if (pinned.has(id)) pinned.delete(id);
          else pinned.add(id);
          state.pinnedMarketCats = [...pinned];
          saveLocalState();
          const box = qs(".v533-market-results");
          if (box) {
            box.innerHTML = marketResultsHtml();
            bindMarketButtons(box);
          } else {
            render();
          }
        });
      });

      qsa("[data-market-pick]", root).forEach(btn => {
        btn.addEventListener("click", () => {
          state.marketCategory = btn.dataset.categoryPick || "all";
          state.marketId = btn.dataset.marketPick || "all";
          state.marketSearch = "";
          state.marketPickerOpen = false;
          state.tab = "all-sites";
          saveLocalState();
          render();
        });
      });

      qs("[data-market-reset]", root)?.addEventListener("click", () => {
        state.marketCategory = "all";
        state.marketId = "all";
        state.marketSearch = "";
        state.marketPickerOpen = false;
        saveLocalState();
        render();
      });
    }

    bindMarketButtons(document);

    qsa("[data-odds-sport-btn]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const scrollY = window.scrollY;
        state.sport = btn.dataset.oddsSportBtn || "all";
        state.marketPickerOpen = false;
        state.marketSearch = "";
        if (isPolymarketMode()) {
          state.marketCategory = "all";
          state.marketId = "all";
          state.openMarketCats = null;
          state.tab = "opportunities";
        }
        ensureMarketFitsSport();
        saveLocalState();
        render();
        requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
      });
    });

    const openMarketDrawer = qs("[data-market-drawer-toggle]");
    if (openMarketDrawer) {
      openMarketDrawer.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const scrollY = window.scrollY;
        state.marketPickerOpen = !state.marketPickerOpen;
        saveLocalState();
        render();
        requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
      });
    }

    qs("[data-market-drawer-close]")?.addEventListener("click", () => {
      state.marketPickerOpen = false;
      saveLocalState();
      render();
    });

    if (state.marketPickerOpen && !window.__v539OddsOutsideCloseBound) {
      window.__v539OddsOutsideCloseBound = true;
      setTimeout(() => {
        const outsideClose = (ev) => {
          const menu = ev.target.closest("[data-odds-category-row], [data-odds-sport-btn], .v536-market-menu, .v537-market-menu, .v535-market-menu, .v540-market-menu, .omega-market-picker, .omega-market-dropdown");
          const oddsVisible = document.body.classList.contains("omega-tab-odds");
          if (!oddsVisible || !state.marketPickerOpen) {
            document.removeEventListener("pointerdown", outsideClose, true);
            window.__v539OddsOutsideCloseBound = false;
            return;
          }
          if (menu) return;
          state.marketPickerOpen = false;
          state.marketSearch = "";
          saveLocalState();
          document.removeEventListener("pointerdown", outsideClose, true);
          window.__v539OddsOutsideCloseBound = false;
          render();
        };
        document.addEventListener("pointerdown", outsideClose, true);
      }, 0);
    }

    const marketSearch = qs("#odds-v533-market-search");
    if (marketSearch) {
      marketSearch.addEventListener("input", () => {
        state.marketSearch = marketSearch.value || "";
        saveLocalState();
        const box = qs(".v533-market-results");
        if (box) {
          box.innerHTML = marketResultsHtml();
          bindMarketButtons(box);
        }
        const input = qs("#odds-v533-market-search");
        if (input) {
          input.focus({ preventScroll: true });
          const len = input.value.length;
          try { input.setSelectionRange(len, len); } catch {}
        }
      });
    }

    qsa("[data-poly-filter]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.polyFilter = btn.dataset.polyFilter || "all";
        saveLocalState();
        render();
      });
    });

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
      mount.innerHTML = `<div class="odds-v537-loading-silent" aria-hidden="true"></div>`;
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
