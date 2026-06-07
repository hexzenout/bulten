// ===============================
// ORAN TERMİNALİ — güvenli JS toparlama / V579 adapter sözleşmesi ve dry-run laboratuvarı
// Gerçek veri bağlantısı, fetch/scraping ve otomatik bahis kapalıdır.
// ===============================

(function () {
  // -------------------------------
  // Constants / State
  // -------------------------------
  const DATA_SOURCES = "assets/data/odds-sources.json";
  const DATA_SNAPSHOT = "assets/data/odds-snapshot.json";
  const STORE_KEY = "v546_odds_terminal_state";
  const DEFAULT_TAB = "opportunities";
  const CATEGORY_CLICK_TAB = "markets";
  const SEARCH_RENDER_DELAY = 160;


  const state = {
    tab: "opportunities",
    sport: "all",
    polyFilter: "all",
    search: "",
    marketCategory: "all",
    marketId: "all",
    marketSearch: "",
    marketGroupFilter: "all",
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
    lastLoadedAt: null,
    sourceConfigFilter: "all",
    sourceConfig: {},
    dryRunInput: "",
    dryRunResult: null
  };

  let curatedMarketCategoryCache = null;
  let marketCategoryCacheBySport = {};
  let marketMapCache = null;
  let marketSearchRenderTimer = null;
  let normalizedMockOddsCache = null;
  let mockComparisonCache = null;
  let mockOddsValidationDone = false;
  let sourceHealthValidationWarningDone = false;
  let sourceConfigCacheKey = "";
  let effectiveSourceRegistryCache = null;
  let adapterResultsCache = null;
  let sourceRegistryHealthCache = null;
  let sourceConfigSaveTimer = null;
  let polymarketAdapterRecordsCache = null;
  let defaultComparisonEngineCache = null;
  let staticRepoDataCache = null;
  const loadJsonWarningKeys = new Set();



  const FALLBACK_SOURCES = { sites: [], groups: [], marketCategories: [] };
  const FALLBACK_SNAPSHOT = { mode: "empty", records: [] };
  const SOURCE_HEALTH_STATUSES = ["ok", "loading", "empty", "stale", "error", "disabled", "mock", "static_snapshot", "dry_run", "planned", "live_ready", "fallback"];
  const DATA_MODES = ["mock", "static_snapshot", "dry_run", "planned", "live_ready", "disabled", "empty", "error", "fallback"];
  const SOURCE_HEALTH_MAX_AGE_MINUTES = 2880;
  const LIVE_API_CONNECTION_ENABLED = false;
  const FETCH_SCRAPING_ENABLED = false;
  const AUTO_BETTING_ENABLED = false;



  // -------------------------------
  // Mock Odds / Adapter Helpers
  // -------------------------------
  const MOCK_SOURCE_RAW_RECORDS = [
    {
      id: "raw_fb_a_001", source: "mock_book_a", sourceName: "Mock Book A", sport: "football",
      homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League", startsAt: "2026-06-05T19:00:00Z",
      sourceMarketName: "Total Goals Over/Under 2.5", selection: "over", line: 2.5, odds: 1.87,
      period: "full_time", updatedAt: "2026-06-05T18:30:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_a_002", source: "mock_book_a", sourceName: "Mock Book A", sport: "football",
      homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League", startsAt: "2026-06-05T19:00:00Z",
      sourceMarketName: "Home Team Goals O/U 1.5", selection: "over", line: 1.5, odds: 2.14,
      period: "full_time", updatedAt: "2026-06-05T18:32:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_a_003", source: "mock_book_a", sourceName: "Mock Book A", sport: "football",
      homeTeam: "Real Madrid", awayTeam: "Barcelona", league: "La Liga", startsAt: "2026-06-05T20:00:00Z",
      sourceMarketName: "Corners O/U 9.5", selection: "over", line: 9.5, odds: 1.96,
      period: "full_time", updatedAt: "2026-06-05T18:37:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_a_004", source: "mock_book_a", sourceName: "Mock Book A", sport: "football",
      homeTeam: "Galatasaray", awayTeam: "Fenerbahçe", league: "Süper Lig", startsAt: "2026-06-05T18:45:00Z",
      sourceMarketName: "First Half Team 1 Fouls O/U", selection: "over", line: 5.5, odds: 1.81,
      period: "first_half", updatedAt: "2026-06-05T18:10:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_b_001", source: "mock_book_b", sourceName: "Mock Book B", sport: "football",
      homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League", startsAt: "2026-06-05T19:00:00Z",
      sourceMarketName: "Match Goals 2.5 O/U", selection: "over", line: 3.5, odds: 2.22,
      period: "full_time", updatedAt: "2026-06-05T18:34:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_b_002", source: "mock_book_b", sourceName: "Mock Book B", sport: "football",
      homeTeam: "Real Madrid", awayTeam: "Barcelona", league: "La Liga", startsAt: "2026-06-05T20:00:00Z",
      sourceMarketName: "Away Team Goals O/U 1.5", selection: "under", line: 1.5, odds: 1.69,
      period: "full_time", updatedAt: "2026-06-05T18:35:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_b_003", source: "mock_book_b", sourceName: "Mock Book B", sport: "football",
      homeTeam: "Galatasaray", awayTeam: "Fenerbahçe", league: "Süper Lig", startsAt: "2026-06-05T18:45:00Z",
      sourceMarketName: "First Half Home Team Fouls Over 5.5", selection: "over", line: 5.5, odds: 1.84,
      period: "first_half", updatedAt: "2026-06-05T18:12:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_fb_b_004", source: "mock_book_b", sourceName: "Mock Book B", sport: "football",
      homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League", startsAt: "2026-06-05T19:00:00Z",
      sourceMarketName: "Experimental Pressing Index O/U", selection: "over", line: 72.5, odds: 1.77,
      period: "full_time", updatedAt: "2026-06-05T18:38:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_a_001", source: "mock_book_a", sourceName: "Mock Book A", sport: "basketball",
      homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
      sourceMarketName: "Both Teams To Score Over 68.5 Points Including OT", selection: "over", line: 68.5, odds: 1.74,
      period: "full_time_ot_included", updatedAt: "2026-06-05T17:45:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_a_002", source: "mock_book_a", sourceName: "Mock Book A", sport: "basketball",
      homeTeam: "Beşiktaş", awayTeam: "Karşıyaka", league: "BSL", startsAt: "2026-06-05T19:30:00Z",
      sourceMarketName: "Team 1 Points O/U", selection: "over", line: 80.5, odds: 1.82,
      period: "full_time", updatedAt: "2026-06-05T17:50:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_a_003", source: "mock_book_a", sourceName: "Mock Book A", sport: "basketball",
      homeTeam: "Beşiktaş", awayTeam: "Karşıyaka", league: "BSL", startsAt: "2026-06-05T19:30:00Z",
      sourceMarketName: "Player Points O/U", selection: "over", line: 21.5, odds: 1.79,
      period: "full_time", updatedAt: "2026-06-05T17:52:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_a_004", source: "mock_book_a", sourceName: "Mock Book A", sport: "basketball",
      homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
      sourceMarketName: "Total Points O/U", selection: "under", line: 164.5, odds: 1.91,
      period: "full_time", updatedAt: "2026-06-05T17:46:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_c_001", source: "mock_book_c", sourceName: "Mock Book C", sport: "basketball",
      homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
      sourceMarketName: "Game Total Points Under 164.5", selection: "under", line: 164.5, odds: 1.88,
      period: "full_time", updatedAt: "2026-06-05T17:48:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_c_002", source: "mock_book_c", sourceName: "Mock Book C", sport: "basketball",
      homeTeam: "Beşiktaş", awayTeam: "Karşıyaka", league: "BSL", startsAt: "2026-06-05T19:30:00Z",
      sourceMarketName: "Player Points Over 21.5", selection: "over", line: 21.5, odds: 1.76,
      period: "full_time", updatedAt: "2026-06-05T17:55:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_c_003", source: "mock_book_c", sourceName: "Mock Book C", sport: "basketball",
      homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
      sourceMarketName: "Both Clubs Over 66.5 Points Including OT", selection: "over", line: 66.5, odds: 1.93,
      period: "full_time_ot_included", updatedAt: "2026-06-05T17:57:00Z", dataMode: "mock_source"
    },
    {
      id: "raw_bk_c_004", source: "mock_book_c", sourceName: "Mock Book C", sport: "basketball",
      homeTeam: "Beşiktaş", awayTeam: "Karşıyaka", league: "BSL", startsAt: "2026-06-05T19:30:00Z",
      sourceMarketName: "Bench Celebration Count O/U", selection: "over", line: 12.5, odds: 1.66,
      period: "full_time", updatedAt: "2026-06-05T17:58:00Z", dataMode: "mock_source"
    }
  ];

  const SOURCE_MARKET_MAPPINGS = [
    { source: "mock_book_a", sport: "football", sourceMarketName: "Total Goals Over/Under 2.5", marketId: "football.goals.total_2_5_ou", confidence: 0.95 },
    { source: "mock_book_b", sport: "football", sourceMarketName: "Match Goals 2.5 O/U", marketId: "football.goals.total_2_5_ou", confidence: 0.9 },
    { source: "mock_book_a", sport: "football", sourceMarketName: "Home Team Goals O/U 1.5", marketId: "football.home_goals_1_5_ou", confidence: 0.92 },
    { source: "mock_book_b", sport: "football", sourceMarketName: "Away Team Goals O/U 1.5", marketId: "football.away_goals_1_5_ou", confidence: 0.91 },
    { source: "mock_book_a", sport: "football", sourceMarketName: "Corners O/U 9.5", marketId: "football.corner.total_9_5_ou", confidence: 0.89 },
    { source: "mock_book_a", sport: "basketball", sourceMarketName: "Both Teams To Score Over 68.5 Points Including OT", marketId: "basket.both_teams_points_line_ou_ot", confidence: 0.88 },
    { source: "mock_book_a", sport: "basketball", sourceMarketName: "Total Points O/U", marketId: "basket.total_points_ou", confidence: 0.91 },
    { source: "mock_book_c", sport: "basketball", sourceMarketName: "Game Total Points Under 164.5", marketId: "basket.total_points_ou", confidence: 0.87 },
    { source: "mock_book_a", sport: "basketball", sourceMarketName: "Team 1 Points O/U", marketId: "basket.team1_points_ou", confidence: 0.86 },
    { source: "mock_book_c", sport: "basketball", sourceMarketName: "Both Clubs Over 66.5 Points Including OT", marketId: "basket.both_teams_points_line_ou_ot", confidence: 0.84 }
  ];

  const MOCK_SOURCE_IDS = [...new Set(MOCK_SOURCE_RAW_RECORDS.map(row => row.source))];

  const POLYMARKET_MOCK_RECORDS = [
    {
      id: "poly_mock_001", source: "polymarket_mock", category: "crypto",
      title: "Bitcoin bu hafta 70.000$ üzerinde kapanır mı?", yesPrice: 0.52, noPrice: 0.48,
      liquidity: 260000, volume24h: 88000, closesInHours: 5.4,
      tags: ["kripto", "bitcoin", "kısa vade"], dataMode: "mock"
    }
  ];


  const MOCK_SOURCE_SLOT_MAP = {
    mock_book_a: "source_book_02",
    mock_book_b: "source_book_03",
    mock_book_c: "source_book_04"
  };

  const SOURCE_TYPE_SEQUENCE = [
    "bookmaker", "bookmaker", "bookmaker", "bookmaker", "bookmaker",
    "bookmaker", "bookmaker", "bookmaker", "bookmaker", "bookmaker",
    "bookmaker", "bookmaker", "exchange", "api", "bookmaker"
  ];

  const BOOKMAKER_SOURCE_REGISTRY = Array.from({ length: 15 }, (_, index) => {
    const slot = String(index + 1).padStart(2, "0");
    const displaySlot = String(index + 1);
    const sourceId = `source_book_${slot}`;
    const isFootballFirst = index % 2 === 0;
    const sports = index % 3 === 0 ? ["football", "basketball"] : isFootballFirst ? ["football"] : ["basketball"];
    const marketFamilies = sports.flatMap(sport => sport === "football"
      ? ["football.result", "football.goals", "football.handicap", "football.corners", "football.team_goals"]
      : ["basket.match", "basket.totals", "basket.handicap", "basket.team_points", "basket.player_props"]);
    const rawSourceId = Object.entries(MOCK_SOURCE_SLOT_MAP).find(([, mappedSourceId]) => mappedSourceId === sourceId)?.[0] || "";
    const isMockSlot = Boolean(rawSourceId);
    const isFirstLiveSlot = index === 0;
    const mode = isMockSlot ? "mock" : isFirstLiveSlot ? "live_ready" : "planned";
    const adapterStatus = isMockSlot ? "mock" : isFirstLiveSlot ? "planned" : "missing";
    return {
      sourceId,
      displayName: `Planlanan Kaynak ${displaySlot}`,
      sourceName: `Planlanan Kaynak ${displaySlot}`,
      technicalName: sourceId,
      rawSourceId,
      type: SOURCE_TYPE_SEQUENCE[index] || "bookmaker",
      mode,
      enabled: index < 12,
      sports,
      supportedMarketFamilies: [...new Set(marketFamilies)],
      requiresKey: !isMockSlot,
      authType: isMockSlot ? "none" : index % 5 === 0 ? "session" : index % 4 === 0 ? "manual" : "api_key",
      adapterStatus,
      rateLimitNote: isMockSlot
        ? "Demo adapter kuru çalıştırılır; gerçek fetch/API/scraping yok."
        : "Gerçek bağlantı öncesi limit bilgisi bekleniyor; fetch/scraping yok.",
      legalNote: "Kaynak bağlantısı açılmadan önce kullanım şartları, lisans ve bölgesel uygunluk manuel kontrol edilecek.",
      lastStatus: isMockSlot ? "mock" : isFirstLiveSlot ? "live_ready" : "planned",
      priority: index + 1,
      notes: isMockSlot
        ? "Dry-run ve karşılaştırma önizlemesi için mock adapter slotu; canlı bağlantı kapalı."
        : isFirstLiveSlot
          ? "İlk canlı kaynak slotu için hazırlık alanı; API anahtarı, fetch ve scraping kapalı."
          : "Güvenli planlanan kaynak; gerçek kaynak adı ve API modeli daha sonra eklenecek."
    };
  });

  const POLYMARKET_SOURCE_REGISTRY = {
    sourceId: "polymarket_mock",
    displayName: "POLYMARKET Demo",
    sourceName: "POLYMARKET Demo",
    technicalName: "polymarket_mock",
    type: "prediction_market",
    mode: "mock",
    enabled: true,
    sports: ["polymarket", "football", "basketball", "crypto", "macro", "news"],
    supportedMarketFamilies: ["polymarket.yes_no", "polymarket.liquidity", "polymarket.volume", "polymarket.close_time"],
    requiresKey: false,
    authType: "none",
    adapterStatus: "mock",
    rateLimitNote: "Demo adapter; gerçek Polymarket bağlantısı yok.",
    legalNote: "Prediction market verisi bookmaker odds modelinden ayrı değerlendirilir; gerçek bağlantı kapalı.",
    lastStatus: "mock",
    priority: 90,
    notes: "YES/NO, likidite, hacim ve kapanış zamanı bookmaker odds modelinden ayrı tutulur."
  };

  const SOURCE_REGISTRY = [...BOOKMAKER_SOURCE_REGISTRY, POLYMARKET_SOURCE_REGISTRY];
  const SOURCE_CONFIG_FILTERS = [
    { id: "all", label: "Tümü" },
    { id: "active", label: "Aktif" },
    { id: "inactive", label: "Pasif" },
    { id: "football", label: "Futbol" },
    { id: "basketball", label: "Basketbol" },
    { id: "polymarket", label: "Polymarket" },
    { id: "mock", label: "Demo" },
    { id: "planned", label: "Planlandı" }
  ];

  const MOCK_FIXTURE_SOURCE_A = [
    { id: "source_a_arsenal_chelsea", source: "Kaynak A", sport: "football", league: "Premier League", homeTeam: "Arsenal", awayTeam: "Chelsea", startsAt: "2026-06-05T19:00:00Z" },
    { id: "source_a_fenerbahce_efes", source: "Kaynak A", sport: "basketball", league: "BSL", homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", startsAt: "2026-06-05T18:00:00Z" }
  ];

  const MOCK_FIXTURE_SOURCE_B = [
    { id: "source_b_arsenal_chelsea", source: "Kaynak B", sport: "football", league: "Premier League", homeTeam: "Arsenal FC", awayTeam: "Chelsea FC", startsAt: "2026-06-05T19:06:00Z" },
    { id: "source_b_fenerbahce_efes", source: "Kaynak B", sport: "basketball", league: "Basketbol Süper Ligi", homeTeam: "Fenerbahce Beko", awayTeam: "Anadolu Efes SK", startsAt: "2026-06-05T18:09:00Z" },
    { id: "source_b_wrong_time", source: "Kaynak B", sport: "basketball", league: "BSL", homeTeam: "Fenerbahce", awayTeam: "Anadolu Efes", startsAt: "2026-06-05T18:45:00Z" }
  ];

  // -------------------------------
  // Render Utilities / Shared Helpers
  // -------------------------------
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

  const TEAM_NAME_ALIASES = {
    "man utd": "manchester united",
    "manchester utd": "manchester united",
    "man united": "manchester united",
    "fenerbahce": "fenerbahce",
    "efes": "anadolu efes",
    "anadolu efes sk": "anadolu efes",
    "arsenal fc": "arsenal",
    "chelsea fc": "chelsea"
  };

  const LEAGUE_NAME_ALIASES = {
    "ing basketbol super ligi": "bsl",
    "basketbol super ligi": "bsl",
    "turkiye basketbol super ligi": "bsl",
    "super lig": "super-lig",
    "premier league": "premier-league",
    "la liga": "la-liga"
  };

  // -------------------------------
  // Search / Alias Helpers
  // -------------------------------
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
      .replace(/[’'`´]/g, "")
      .replace(/[()\[\]{}]/g, " ")
      .replace(/[\\/_–—-]+/g, " ")
      .replace(/[^a-z0-9.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // -------------------------------
  // Fixture Matching
  // -------------------------------
  function normalizeTeamName(value) {
    const base = normalizeText(value).replace(/[.]+/g, " ").replace(/\s+/g, " ").trim();
    if (!base) return "";
    const directAlias = TEAM_NAME_ALIASES[base];
    if (directAlias) return directAlias;
    const suffixes = new Set(["fc", "sk", "bc", "bk", "club"]);
    const words = base.split(/\s+/).filter(Boolean);
    const compact = words.filter((word, index) => {
      if (!suffixes.has(word)) return true;
      return !(index === 0 || index === words.length - 1 || words.length > 2);
    }).join(" ");
    return TEAM_NAME_ALIASES[compact] || compact || base;
  }

  function normalizeLeagueName(value) {
    const base = normalizeText(value).replace(/[.]+/g, " ").replace(/\s+/g, " ").trim();
    if (!base) return "league";
    return LEAGUE_NAME_ALIASES[base] || base.replace(/\s+/g, "-");
  }

  function normalizeFixtureSide(value) {
    return normalizeTeamName(value || "");
  }

  function normalizeSportName(value) {
    const sport = normalizeText(value || "sport").replace(/[.]+/g, " ").trim();
    if (sport === "basket" || sport === "basketbol") return "basketball";
    if (sport === "futbol") return "football";
    return sport.replace(/\s+/g, "-") || "sport";
  }

  function fixtureTimeMs(startsAt) {
    if (!startsAt) return NaN;
    const parsed = Date.parse(startsAt);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function fixtureTimeBucket(startsAt) {
    const parsed = fixtureTimeMs(startsAt);
    if (!Number.isFinite(parsed)) return "time-unknown";
    const date = new Date(parsed);
    const pad = n => String(n).padStart(2, "0");
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate()), pad(date.getUTCHours()), pad(date.getUTCMinutes())].join("-");
  }

  function fixtureKeyPart(value) {
    return String(value || "unknown").replace(/\s+/g, "-").replace(/_+/g, "-").replace(/\|+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function buildFixtureKey({ sport, homeTeam, awayTeam, league, startsAt } = {}) {
    return [
      normalizeSportName(sport || "sport"),
      normalizeLeagueName(league || "league"),
      normalizeFixtureSide(homeTeam || "home"),
      normalizeFixtureSide(awayTeam || "away"),
      fixtureTimeBucket(startsAt)
    ].map(fixtureKeyPart).filter(Boolean).join("|");
  }

  function levenshteinRatio(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    if (!left && !right) return 1;
    if (!left || !right) return 0;
    if (left === right) return 1;
    const prev = Array.from({ length: right.length + 1 }, (_, i) => i);
    const curr = Array(right.length + 1).fill(0);
    for (let i = 1; i <= left.length; i += 1) {
      curr[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= right.length; j += 1) prev[j] = curr[j];
    }
    return Math.max(0, 1 - (prev[right.length] / Math.max(left.length, right.length)));
  }

  function tokenSimilarity(a, b) {
    const left = normalizeText(a).replace(/[.]+/g, " ").split(/\s+/).filter(Boolean);
    const right = normalizeText(b).replace(/[.]+/g, " ").split(/\s+/).filter(Boolean);
    if (!left.length && !right.length) return 1;
    if (!left.length || !right.length) return 0;
    const leftSet = new Set(left);
    const rightSet = new Set(right);
    const intersection = left.filter(token => rightSet.has(token)).length;
    const union = new Set([...left, ...right]).size || 1;
    const containment = Math.max(intersection / leftSet.size, intersection / rightSet.size);
    return Math.max(intersection / union, containment * 0.92);
  }

  function teamSimilarity(a, b) {
    const left = normalizeTeamName(a);
    const right = normalizeTeamName(b);
    if (!left && !right) return 1;
    if (!left || !right) return 0;
    if (left === right) return 1;
    return Math.max(tokenSimilarity(left, right), levenshteinRatio(left, right));
  }

  function leagueSimilarity(a, b) {
    const left = normalizeLeagueName(a);
    const right = normalizeLeagueName(b);
    if (!left || !right || left === "league" || right === "league") return 0.72;
    if (left === right) return 1;
    return Math.max(tokenSimilarity(left, right), levenshteinRatio(left, right));
  }

  function fixtureTimeScore(a, b) {
    const left = fixtureTimeMs(a?.startsAt || a?.kickoff);
    const right = fixtureTimeMs(b?.startsAt || b?.kickoff);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return 0.55;
    const diffMinutes = Math.abs(left - right) / 60000;
    if (diffMinutes <= 10) return 1;
    if (diffMinutes <= 30) return 0.7;
    if (diffMinutes <= 60) return 0.2;
    return 0.08;
  }

  function scoreFixtureMatch(a = {}, b = {}) {
    const sportA = normalizeSportName(a.sport || "");
    const sportB = normalizeSportName(b.sport || "");
    if (sportA && sportB && sportA !== sportB) return 0;
    const homeHome = teamSimilarity(a.homeTeam, b.homeTeam);
    const awayAway = teamSimilarity(a.awayTeam, b.awayTeam);
    const directTeamScore = (homeHome + awayAway) / 2;
    const homeAway = teamSimilarity(a.homeTeam, b.awayTeam);
    const awayHome = teamSimilarity(a.awayTeam, b.homeTeam);
    const reversedTeamScore = (homeAway + awayHome) / 2;
    const reversed = reversedTeamScore > directTeamScore && reversedTeamScore >= 0.72;
    const teamScore = reversed ? reversedTeamScore * 0.65 : directTeamScore;
    const leagueScore = leagueSimilarity(a.league, b.league);
    const timeScore = fixtureTimeScore(a, b);
    const score = (teamScore * 0.62) + (timeScore * 0.24) + (leagueScore * 0.14);
    return Math.max(0, Math.min(1, Number(score.toFixed(3))));
  }

  function fixtureMatchReason(a, b, score) {
    const directTeamScore = (teamSimilarity(a?.homeTeam, b?.homeTeam) + teamSimilarity(a?.awayTeam, b?.awayTeam)) / 2;
    const reversedTeamScore = (teamSimilarity(a?.homeTeam, b?.awayTeam) + teamSimilarity(a?.awayTeam, b?.homeTeam)) / 2;
    const timeScore = fixtureTimeScore(a, b);
    if (reversedTeamScore > directTeamScore && reversedTeamScore >= 0.72) return "Ev/deplasman ters görünüyor";
    if (score >= 0.82 && timeScore >= 0.7) return "Takım adları ve saat güçlü eşleşti";
    if (directTeamScore >= 0.75 && timeScore < 0.7) return "Takım adları benzer ama saat farkı yüksek";
    if (score >= 0.65) return "Takım adları kısmen benzer, manuel kontrol önerilir";
    return "Eşleşme için takım, lig veya saat benzerliği zayıf";
  }

  function matchFixtureAcrossSources(baseFixture, candidateFixtures = []) {
    const candidates = Array.isArray(candidateFixtures) ? candidateFixtures : [];
    let best = { bestMatch: null, score: 0, reason: "Aday maç bulunamadı", isLikelyMatch: false, status: "none" };
    candidates.forEach(candidate => {
      const score = scoreFixtureMatch(baseFixture, candidate);
      if (!best.bestMatch || score > best.score) {
        best = {
          bestMatch: candidate,
          score,
          reason: fixtureMatchReason(baseFixture, candidate, score),
          isLikelyMatch: score >= 0.82,
          status: score >= 0.82 ? "strong" : score >= 0.65 ? "review" : "none"
        };
      }
    });
    return best;
  }

  function buildPolymarketEventKey({ category, title, closesAt } = {}) {
    return [
      "polymarket",
      normalizeText(category || "event").replace(/\s+/g, "-"),
      normalizeText(title || "title").replace(/[.]+/g, "").replace(/\s+/g, "-").slice(0, 80),
      fixtureTimeBucket(closesAt)
    ].filter(Boolean).join("|");
  }

  function textMatchesTokens(haystack, tokens) {
    if (!tokens.length) return true;
    const words = haystack.split(/\s+/).filter(Boolean);
    return tokens.every(token => {
      if (/^\d+(?:\.\d+)?$/.test(token)) return words.includes(token);
      return haystack.includes(token);
    });
  }

  function normalizeSavedState(saved) {
    if (!saved || typeof saved !== "object") return {};
    const safe = { ...saved };
    if (!SOURCE_CONFIG_FILTERS.some(filter => filter.id === safe.sourceConfigFilter)) safe.sourceConfigFilter = "all";
    if (!safe.sourceConfig || typeof safe.sourceConfig !== "object" || Array.isArray(safe.sourceConfig)) safe.sourceConfig = {};
    safe.sourceConfig = Object.fromEntries(Object.entries(safe.sourceConfig).map(([sourceId, config]) => {
      const base = SOURCE_REGISTRY.find(source => source.sourceId === sourceId);
      const enabled = config && typeof config === "object" && config.enabled !== undefined ? config.enabled !== false : base?.enabled !== false;
      const displayName = sanitizeSourceDisplayName(config?.displayName || base?.displayName || base?.sourceName || "");
      const notes = sanitizeSourceNote(config?.notes || "");
      const priority = sanitizeSourcePriority(config?.priority ?? base?.priority ?? 15);
      return [sourceId, { enabled, mode: normalizeDataMode(config?.mode || base?.mode || "planned"), displayName, notes, priority }];
    }));
    if (!["all", "football", "basketball", "polymarket"].includes(safe.sport)) safe.sport = "all";
    if (!["all", "sports", "crypto", "economy", "news", "short", "liquid", "value"].includes(safe.polyFilter)) safe.polyFilter = "all";
    const tabMap = {
      intelligence: "opportunities",
      compare: "opportunities",
      arbitrage: "opportunities",
      value: "opportunities",
      lines: "all-sites"
    };
    safe.tab = tabMap[safe.tab] || safe.tab || DEFAULT_TAB;
    if (!["opportunities", "markets", "all-sites", "drops", "sources"].includes(safe.tab)) safe.tab = DEFAULT_TAB;
    if (safe.sport === "polymarket") {
      safe.marketCategory = "all";
      safe.marketId = "all";
      safe.marketSearch = "";
      safe.marketGroupFilter = "all";
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
        marketGroupFilter: state.marketGroupFilter,
        selectedCompareKey: state.selectedCompareKey,
        minDropPct: state.minDropPct,
        minValuePct: state.minValuePct,
        minLineGap: state.minLineGap,
        alarmEnabled: state.alarmEnabled,
        alarmSensitivity: state.alarmSensitivity,
        pinnedMarketCats: Array.isArray(state.pinnedMarketCats) ? state.pinnedMarketCats : [],
        openMarketCats: Array.isArray(state.openMarketCats) ? state.openMarketCats : null,
        sourceConfigFilter: state.sourceConfigFilter,
        sourceConfig: state.sourceConfig && typeof state.sourceConfig === "object" ? state.sourceConfig : {}
      }));
    } catch {}
  }

  function isRepoStaticDataPath(url) {
    return [DATA_SNAPSHOT, DATA_SOURCES].includes(String(url || ""));
  }

  async function loadJson(url, fallback) {
    if (!isRepoStaticDataPath(url)) return fallback;
    try {
      const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      if (!loadJsonWarningKeys.has(url)) {
        loadJsonWarningKeys.add(url);
        console.warn("Oran Terminali yerel JSON yüklenemedi; güvenli fallback kullanılacak:", url, err?.message || err);
      }
      return fallback;
    }
  }

  async function loadStaticOddsSnapshot(force = false) {
    if (!force && staticRepoDataCache?.snapshot) return staticRepoDataCache.snapshot;
    const payload = await loadJson(DATA_SNAPSHOT, null);
    const ok = Boolean(payload && typeof payload === "object" && Array.isArray(payload.records));
    return {
      ok,
      status: ok ? "loaded" : "missing",
      file: DATA_SNAPSHOT,
      data: ok ? payload : FALLBACK_SNAPSHOT,
      message: ok ? "Snapshot yüklendi." : "Snapshot bulunamadı; demo/yedek veri korunuyor.",
      loadedAt: new Date().toISOString()
    };
  }

  async function loadStaticOddsSources(force = false) {
    if (!force && staticRepoDataCache?.sources) return staticRepoDataCache.sources;
    const payload = await loadJson(DATA_SOURCES, null);
    const ok = Boolean(payload && typeof payload === "object" && (Array.isArray(payload.sites) || Array.isArray(payload.groups)));
    return {
      ok,
      status: ok ? "loaded" : "missing",
      file: DATA_SOURCES,
      data: ok ? payload : FALLBACK_SOURCES,
      message: ok ? "Kaynak listesi yüklendi." : "Kaynak listesi bulunamadı; dahili kaynak kayıtları korunuyor.",
      loadedAt: new Date().toISOString()
    };
  }

  async function loadRepoStaticOddsData({ force = false } = {}) {
    if (!force && staticRepoDataCache) return staticRepoDataCache;
    const [sources, snapshot] = await Promise.all([loadStaticOddsSources(force), loadStaticOddsSnapshot(force)]);
    staticRepoDataCache = { sources, snapshot, loadedAt: new Date().toISOString() };
    return staticRepoDataCache;
  }

  // -------------------------------
  // Market Catalog / Taxonomy
  // -------------------------------
  function allMarketCategories() {
    return state.sources?.marketCategories || [];
  }

  function categorySport(cat) {
    if (cat?.sport) return cat.sport;
    const id = String(cat?.id || "").toLowerCase();
    if (id.includes("basket")) return "basketball";
    return "football";
  }

  const marketItem = (name, extra = {}) => ({
    id: extra.id || null,
    name,
    label: extra.label || name,
    desc: extra.desc || "",
    tags: extra.tags || [],
    aliases: extra.aliases || [],
    period: extra.period || null,
    marketType: extra.marketType || null,
    line: extra.line ?? null,
    side: extra.side || null,
    dataMode: extra.dataMode || "catalog_static"
  });

  function marketId(name) {
    return normalizeText(name).replace(/\s+/g, "_").replace(/\./g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  }

  function stableIdPart(value) {
    return marketId(value || "market") || "market";
  }

  function categoryIdPart(cat) {
    return stableIdPart(String(cat?.id || cat?.name || "market").replace(/^v\d+_(football|basket)_?/, ""));
  }

  function sourceSportName(sport) {
    return sport === "basketball" ? "basket" : sport || "market";
  }

  function marketItems(names, tags = []) {
    return names.map(name => marketItem(name, { tags }));
  }

  function teamGoalLineMarkets(side, alias) {
    const sideKey = side === "Ev Sahibi" ? "home" : "away";
    const sideEn = sideKey === "home" ? "Home Team" : "Away Team";
    return ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5"].map(line => marketItem(`${side} ${line} Gol Alt / Üst`, {
      id: `football.${sideKey}_goals_${line.replace(".", "_")}_ou`,
      tags: ["gol", "takım gol", side, line, alias, "alt üst"],
      aliases: [`${alias} ${line} Gol Alt / Üst`, `${alias} ${line}`, `${sideEn} Goals Over Under ${line}`, `${sideEn} Goals ${line}`],
      period: "full_time",
      marketType: "over_under",
      line: Number(line),
      side: sideKey
    }));
  }

  function resultTotalCombos() {
    const outcomes = ["1", "2", "1-X", "1-2", "X-2"];
    const lines = ["0.5", "1.5", "2.5", "3.5", "4.5", "5.5"];
    const sidesForLine = line => {
      if (line === "0.5") return ["Üst"];
      if (line === "5.5") return ["Alt"];
      return ["Alt", "Üst"];
    };
    return outcomes.flatMap(outcome => lines.flatMap(line => sidesForLine(line).map(side => marketItem(`${outcome} ve ${line} Gol ${side}`, {
      tags: ["maç sonucu toplam gol", outcome, line, side]
    }))));
  }

  function minuteGoalMarkets() {
    const minutes = [15, 30, 45, 60, 75];
    const lines = ["0.5", "1", "1.5", "2", "2.5"];
    const families = [
      minute => `Ev Sahibi ${minute}. Dakikaya Kadar`,
      minute => `Deplasman ${minute}. Dakikaya Kadar`,
      minute => `Maçta ${minute}. Dakikaya Kadar`
    ];
    return families.flatMap(makePrefix => minutes.flatMap(minute => lines.map(line => marketItem(`${makePrefix(minute)} ${line} Gol Alt / Üst`, {
      tags: ["dakikaya kadar gol", `${minute}`, line]
    }))));
  }

  // Market catalog remains visible for manual review.
  // Future live odds adapters should map source markets to stable market ids.
  const V546_FOOTBALL_CATEGORIES = [
    {
      id: "v546_football_result",
      name: "Ana Sonuç",
      desc: "Maç sonucu, çifte şans, yarı sonucu ve temel sonuç kombinasyonları",
      sport: "football",
      markets: marketItems([
        "Maç Sonucu", "Çifte Şans", "Beraberlikte İade", "Ev Sahibi Kazanır", "Beraberlik", "Deplasman Kazanır",
        "İlk Yarı Sonucu", "İkinci Yarı Sonucu", "İlk Yarı / Maç Sonucu", "Maç Sonucu ve KG Var",
        "Maç Sonucu ve Toplam Gol", "Ev Sahibi İlk Yarıyı Kazanır", "Deplasman İlk Yarıyı Kazanır",
        "Ev Sahibi İkinci Yarıyı Kazanır", "Deplasman İkinci Yarıyı Kazanır", "Ev Sahibi Herhangi Bir Yarıyı Kazanır",
        "Deplasman Herhangi Bir Yarıyı Kazanır", "Ev Sahibi Her İki Yarıyı Kazanır", "Deplasman Her İki Yarıyı Kazanır"
      ], ["futbol ana sonuç"])
    },
    {
      id: "v546_football_result_total_combos",
      name: "Maç Sonucu Kombinasyonları",
      desc: "1/X/2 ve çifte şans sonuçlarının toplam gol alt/üst çizgileriyle kombinasyonu",
      sport: "football",
      markets: resultTotalCombos()
    },
    {
      id: "v546_football_goals",
      name: "Gol Alt / Üst",
      desc: "Toplam gol çizgileri, gol aralığı, gol zamanı ve yarı gol kıyasları",
      sport: "football",
      markets: marketItems([
        "0.5 Gol Alt / Üst", "1.5 Gol Alt / Üst", "2.5 Gol Alt / Üst", "3.5 Gol Alt / Üst", "4.5 Gol Alt / Üst", "5.5 Gol Alt / Üst", "6.5 Gol Alt / Üst",
        "Toplam 1 Gol Alt / Üst", "Toplam 2 Gol Alt / Üst", "Toplam 3 Gol Alt / Üst", "Toplam 4 Gol Alt / Üst",
        "Toplam Gol Aralığı 0-1", "Toplam Gol Aralığı 2-3", "Toplam Gol Aralığı 4-5", "Toplam Gol Aralığı 6+",
        "İlk Gol Zamanı", "En Çok Gol Olan Yarı", "İlk Yarı Daha Çok Gol", "İkinci Yarı Daha Çok Gol", "Her İki Yarıda da Gol Olur"
      ], ["gol alt üst", "2.5"])
    },
    {
      id: "v546_football_team_goals",
      name: "Takım Gol Marketleri",
      desc: "KG, takım golü, takım alt/üst ve gol yememe marketleri",
      sport: "football",
      markets: [
        ...marketItems(["KG Var / Yok", "Karşılıklı Gol Var", "Ev Sahibi Gol Atar", "Deplasman Gol Atar", "Her İki Takım da 1.5 Üst Gol Atar"], ["takım gol"]),
        ...teamGoalLineMarkets("Ev Sahibi", "Takım 1"),
        ...teamGoalLineMarkets("Deplasman", "Takım 2"),
        ...marketItems([
          "Ev Sahibi İlk Yarı Gol Atar", "Deplasman İlk Yarı Gol Atar", "Ev Sahibi İkinci Yarı Gol Atar", "Deplasman İkinci Yarı Gol Atar",
          "Ev Sahibi Her İki Yarıda Gol Atar", "Deplasman Her İki Yarıda Gol Atar", "Ev Sahibi Kazanır ve Gol Yemez", "Deplasman Kazanır ve Gol Yemez",
          "Ev Sahibi Gol Yemez", "Deplasman Gol Yemez"
        ], ["takım gol"])
      ]
    },
    {
      id: "v546_football_goal_time",
      name: "İlk Gol / Gol Zamanı",
      desc: "İlk gol tarafı, erken gol ve dakikaya kadar gol alt/üst aileleri",
      sport: "football",
      markets: [
        ...marketItems(["İlk Golü Ev Sahibi Atar", "İlk Golü Deplasman Atar", "İlk Gol Dakika Aralığı 1-15 Olur / Olmaz"], ["ilk gol", "gol zamanı"]),
        ...minuteGoalMarkets()
      ]
    },
    {
      id: "v546_football_halves",
      name: "Yarı Marketleri",
      desc: "İlk yarı, ikinci yarı, takım yarı golleri, yarı handikap ve çifte şans",
      sport: "football",
      markets: marketItems([
        "İlk Yarı 0.5 Gol Alt / Üst", "İlk Yarı 1 Gol Alt / Üst", "İlk Yarı 1.5 Gol Alt / Üst", "İlk Yarı 2 Gol Alt / Üst", "İlk Yarı 2.5 Gol Alt / Üst",
        "İkinci Yarı 0.5 Gol Alt / Üst", "İkinci Yarı 1 Gol Alt / Üst", "İkinci Yarı 1.5 Gol Alt / Üst", "İkinci Yarı 2 Gol Alt / Üst", "İkinci Yarı 2.5 Gol Alt / Üst",
        "İlk Yarı KG Var / Yok", "İkinci Yarı KG Var / Yok",
        "İlk Yarı Ev Sahibi 0.5 Gol Alt / Üst", "İlk Yarı Ev Sahibi 1 Gol Alt / Üst", "İlk Yarı Ev Sahibi 1.5 Gol Alt / Üst", "İlk Yarı Ev Sahibi 2 Gol Alt / Üst", "İlk Yarı Ev Sahibi 2.5 Gol Alt / Üst",
        "İlk Yarı Deplasman 0.5 Gol Alt / Üst", "İlk Yarı Deplasman 1 Gol Alt / Üst", "İlk Yarı Deplasman 1.5 Gol Alt / Üst", "İlk Yarı Deplasman 2 Gol Alt / Üst", "İlk Yarı Deplasman 2.5 Gol Alt / Üst",
        "İkinci Yarı Ev Sahibi 0.5 Gol Alt / Üst", "İkinci Yarı Ev Sahibi 1 Gol Alt / Üst", "İkinci Yarı Ev Sahibi 1.5 Gol Alt / Üst", "İkinci Yarı Ev Sahibi 2 Gol Alt / Üst", "İkinci Yarı Ev Sahibi 2.5 Gol Alt / Üst",
        "İkinci Yarı Deplasman 0.5 Gol Alt / Üst", "İkinci Yarı Deplasman 1 Gol Alt / Üst", "İkinci Yarı Deplasman 1.5 Gol Alt / Üst", "İkinci Yarı Deplasman 2 Gol Alt / Üst", "İkinci Yarı Deplasman 2.5 Gol Alt / Üst",
        "İlk Yarı Ev Sahibi Handikap 0.5", "İlk Yarı Ev Sahibi Handikap 1.5", "İlk Yarı Deplasman Handikap 0.5", "İlk Yarı Deplasman Handikap 1.5",
        "İkinci Yarı Ev Sahibi Handikap 0.5", "İkinci Yarı Ev Sahibi Handikap 1.5", "İkinci Yarı Deplasman Handikap 0.5", "İkinci Yarı Deplasman Handikap 1.5",
        "İlk Yarı Çifte Şans", "İkinci Yarı Çifte Şans"
      ], ["yarı marketleri"])
    },
    {
      id: "v546_football_corners",
      name: "Korner",
      desc: "Toplam, yarı, takım, zaman, art arda korner ve korner yarış marketleri",
      sport: "football",
      markets: marketItems([
        "Toplam Korner Alt / Üst", "Toplam Korner 7 Üst", "Toplam Korner 8 Üst", "Toplam Korner 9 Üst", "Toplam Korner 10 Üst",
        "6.5 Korner Alt / Üst", "7.5 Korner Alt / Üst", "8.5 Korner Alt / Üst", "9.5 Korner Alt / Üst", "10.5 Korner Alt / Üst", "11.5 Korner Alt / Üst", "12.5 Korner Alt / Üst",
        "İlk Yarı Korner Alt / Üst", "İlk Yarı Korner 2 Üst", "İlk Yarı Korner 3 Üst", "İlk Yarı Korner 4 Üst", "İlk Yarı Korner 5 Üst",
        "İlk Yarı 2.5 Korner Alt / Üst", "İlk Yarı 3.5 Korner Alt / Üst", "İlk Yarı 4.5 Korner Alt / Üst", "İlk Yarı 5.5 Korner Alt / Üst",
        "İkinci Yarı Korner Alt / Üst", "İkinci Yarı Korner 2 Üst", "İkinci Yarı Korner 3 Üst", "İkinci Yarı Korner 4 Üst", "İkinci Yarı Korner 5 Üst",
        "İkinci Yarı 2.5 Korner Alt / Üst", "İkinci Yarı 3.5 Korner Alt / Üst", "İkinci Yarı 4.5 Korner Alt / Üst", "İkinci Yarı 5.5 Korner Alt / Üst",
        "Ev Sahibi Korner Alt / Üst", "Deplasman Korner Alt / Üst",
        "Ev Sahibi İlk Yarı Korner 0.5 Alt / Üst", "Ev Sahibi İlk Yarı Korner 1 Alt / Üst", "Ev Sahibi İlk Yarı Korner 1.5 Alt / Üst", "Ev Sahibi İlk Yarı Korner 2 Alt / Üst", "Ev Sahibi İlk Yarı Korner 2.5 Alt / Üst",
        "Deplasman İlk Yarı Korner 0.5 Alt / Üst", "Deplasman İlk Yarı Korner 1 Alt / Üst", "Deplasman İlk Yarı Korner 1.5 Alt / Üst", "Deplasman İlk Yarı Korner 2 Alt / Üst", "Deplasman İlk Yarı Korner 2.5 Alt / Üst",
        "Ev Sahibi İkinci Yarı Korner 0.5 Alt / Üst", "Ev Sahibi İkinci Yarı Korner 1 Alt / Üst", "Ev Sahibi İkinci Yarı Korner 1.5 Alt / Üst", "Ev Sahibi İkinci Yarı Korner 2 Alt / Üst", "Ev Sahibi İkinci Yarı Korner 2.5 Alt / Üst",
        "Deplasman İkinci Yarı Korner 0.5 Alt / Üst", "Deplasman İkinci Yarı Korner 1 Alt / Üst", "Deplasman İkinci Yarı Korner 1.5 Alt / Üst", "Deplasman İkinci Yarı Korner 2 Alt / Üst", "Deplasman İkinci Yarı Korner 2.5 Alt / Üst",
        "Korner Handikap", "En Çok Korner Kullanan Takım", "İlk Yarı En Çok Korner", "İkinci Yarı En Çok Korner",
        "İlk 5 Dakika Korner Olur / Olmaz", "İlk 10 Dakika Korner Olur / Olmaz", "İlk 15 Dakika Korner Olur / Olmaz",
        "Ev Sahibi Art Arda 2 Korner Kullanır", "Deplasman Art Arda 2 Korner Kullanır", "Herhangi Bir Takım Art Arda 2 Korner Kullanır",
        "İlk 3 Kornere Ulaşan Takım", "İlk 5 Kornere Ulaşan Takım", "İlk 7 Kornere Ulaşan Takım"
      ], ["korner", "ilk 5 dakika korner"])
    },
    {
      id: "v546_football_cards",
      name: "Kart",
      desc: "Toplam kart, takım kartı, kırmızı kart, ilk kart ve oyuncu kart marketleri",
      sport: "football",
      markets: marketItems([
        "Toplam Kart Alt / Üst", "2.5 Kart Alt / Üst", "3.5 Kart Alt / Üst", "4.5 Kart Alt / Üst", "5.5 Kart Alt / Üst",
        "Ev Sahibi Kart Alt / Üst", "Deplasman Kart Alt / Üst", "İlk Yarı Kart Alt / Üst", "İkinci Yarı Kart Alt / Üst",
        "Kırmızı Kart Olur / Olmaz", "Ev Sahibi Kırmızı Kart Görür", "Deplasman Kırmızı Kart Görür", "İlk Kartı Ev Sahibi Görür", "İlk Kartı Deplasman Görür", "En Çok Kart Gören Takım",
        "Kart Handikap", "Oyuncu Kart Görür", "Oyuncu Sarı Kart Görür", "Oyuncu Kırmızı Kart Görür", "İlk 15 Dakika Kart Olur", "İlk Yarı Kart Olur", "İkinci Yarı Kart Olur",
        "Her İki Takım da Kart Görür", "Ev Sahibi Daha Fazla Kart Görür", "Deplasman Daha Fazla Kart Görür"
      ], ["kart"])
    },
    {
      id: "v546_football_handicap",
      name: "Handikap",
      desc: "Maç, takım, ev sahibi/deplasman ve yarı handikap seçenekleri",
      sport: "football",
      markets: marketItems([
        "Maç Handikapı", "Ev Sahibi Handikap", "Deplasman Handikap",
        "Ev Sahibi -0.5 Handikap", "Ev Sahibi -1 Handikap", "Ev Sahibi -1.5 Handikap", "Ev Sahibi -2 Handikap", "Ev Sahibi -2.5 Handikap", "Ev Sahibi -3 Handikap", "Ev Sahibi -3.5 Handikap",
        "Ev Sahibi +0.5 Handikap", "Ev Sahibi +1 Handikap", "Ev Sahibi +1.5 Handikap", "Ev Sahibi +2 Handikap", "Ev Sahibi +2.5 Handikap",
        "Deplasman -0.5 Handikap", "Deplasman -1 Handikap", "Deplasman -1.5 Handikap", "Deplasman -2 Handikap", "Deplasman -2.5 Handikap", "Deplasman -3 Handikap", "Deplasman -3.5 Handikap",
        "Deplasman +0.5 Handikap", "Deplasman +1 Handikap", "Deplasman +1.5 Handikap", "Deplasman +2 Handikap", "Deplasman +2.5 Handikap", "İlk Yarı Handikap", "İkinci Yarı Handikap"
      ], ["handikap"])
    },
    {
      id: "v546_football_players",
      name: "Oyuncu Marketleri",
      desc: "Gol, asist, şut, isabetli şut, faul, kart, ofsayt ve kaleci kurtarışları",
      sport: "football",
      markets: marketItems([
        "Oyuncu Gol Atar", "Oyuncu İlk Golü Atar", "Oyuncu Son Golü Atar", "Oyuncu 2+ Gol Atar", "Oyuncu 3+ Gol Atar", "Oyuncu Asist Yapar", "Oyuncu Gol veya Asist Yapar",
        "Oyuncu Şut Alt / Üst", "Oyuncu Şut 1+", "Oyuncu Şut 2+", "Oyuncu Şut 3+", "Oyuncu İsabetli Şut Alt / Üst", "Oyuncu İsabetli Şut 1+", "Oyuncu İsabetli Şut 2+", "Oyuncu İsabetli Şut 3+",
        "Oyuncu Faul Alt / Üst", "Oyuncu Kart Görür", "Oyuncu Ofsayt Alt / Üst", "Kaleci Kurtarış Alt / Üst"
      ], ["oyuncu", "oyuncu faul", "isabetli şut"])
    },
    {
      id: "v546_football_stats",
      name: "İstatistik Marketleri",
      desc: "Şut, isabetli şut, faul, ofsayt ve taç alt/üst marketleri",
      sport: "football",
      markets: marketItems([
        "Toplam Şut Alt / Üst", "Toplam İsabetli Şut Alt / Üst", "Ev Sahibi Şut Alt / Üst", "Deplasman Şut Alt / Üst", "Ev Sahibi İsabetli Şut Alt / Üst", "Deplasman İsabetli Şut Alt / Üst",
        "Ev Sahibi Şut Alt / Üst", "Deplasman Şut Alt / Üst", "Ev Sahibi İsabetli Şut Alt / Üst", "Deplasman İsabetli Şut Alt / Üst", "Toplam Faul Alt / Üst", "Ev Sahibi Faul Alt / Üst", "Deplasman Faul Alt / Üst",
        "Ev Sahibi Faul Alt / Üst", "Deplasman Faul Alt / Üst", "Toplam Ofsayt Alt / Üst", "Ev Sahibi Ofsayt Alt / Üst", "Deplasman Ofsayt Alt / Üst", "Ev Sahibi Ofsayt Alt / Üst", "Deplasman Ofsayt Alt / Üst",
        "Toplam Taç Alt / Üst", "Ev Sahibi Taç Alt / Üst", "Deplasman Taç Alt / Üst", "Ev Sahibi Taç Alt / Üst", "Deplasman Taç Alt / Üst",
        "İlk Yarı Toplam Faul Alt / Üst", "İlk Yarı Ev Sahibi Faul Alt / Üst", "İlk Yarı Deplasman Faul Alt / Üst",
        "İkinci Yarı Toplam Faul Alt / Üst", "İkinci Yarı Ev Sahibi Faul Alt / Üst", "İkinci Yarı Deplasman Faul Alt / Üst",
        "İlk Yarı Toplam Şut Alt / Üst", "İlk Yarı Ev Sahibi Şut Alt / Üst", "İlk Yarı Deplasman Şut Alt / Üst",
        "İkinci Yarı Toplam Şut Alt / Üst", "İkinci Yarı Ev Sahibi Şut Alt / Üst", "İkinci Yarı Deplasman Şut Alt / Üst",
        "İlk Yarı Toplam İsabetli Şut Alt / Üst", "İlk Yarı Ev Sahibi İsabetli Şut Alt / Üst", "İlk Yarı Deplasman İsabetli Şut Alt / Üst",
        "İkinci Yarı Toplam İsabetli Şut Alt / Üst", "İkinci Yarı Ev Sahibi İsabetli Şut Alt / Üst", "İkinci Yarı Deplasman İsabetli Şut Alt / Üst",
        "İlk Yarı Toplam Ofsayt Alt / Üst", "İlk Yarı Ev Sahibi Ofsayt Alt / Üst", "İlk Yarı Deplasman Ofsayt Alt / Üst",
        "İkinci Yarı Toplam Ofsayt Alt / Üst", "İkinci Yarı Ev Sahibi Ofsayt Alt / Üst", "İkinci Yarı Deplasman Ofsayt Alt / Üst",
        "İlk Yarı Toplam Taç Alt / Üst", "İlk Yarı Ev Sahibi Taç Alt / Üst", "İlk Yarı Deplasman Taç Alt / Üst",
        "İkinci Yarı Toplam Taç Alt / Üst", "İkinci Yarı Ev Sahibi Taç Alt / Üst", "İkinci Yarı Deplasman Taç Alt / Üst"
      ], ["istatistik", "isabetli şut", "faul"])
    },
    {
      id: "v546_football_streak_goals",
      name: "Art Arda Gol / Seri Gol",
      desc: "Evet / Hayır sonucuyla art arda gol serisi marketleri",
      sport: "football",
      markets: marketItems([
        "Ev Sahibi Art Arda 2 Gol Atar", "Ev Sahibi Art Arda 3 Gol Atar", "Ev Sahibi Art Arda 4 Gol Atar", "Deplasman Art Arda 2 Gol Atar", "Deplasman Art Arda 3 Gol Atar", "Deplasman Art Arda 4 Gol Atar",
        "Herhangi Bir Takım Art Arda 2 Gol Atar", "Herhangi Bir Takım Art Arda 3 Gol Atar", "Herhangi Bir Takım Art Arda 4 Gol Atar"
      ], ["art arda gol", "seri gol"])
    },
    {
      id: "v546_football_win_margin",
      name: "Galibiyet Farkı",
      desc: "Takım ve herhangi bir takım için galibiyet farkı seçenekleri",
      sport: "football",
      markets: marketItems(["Ev Sahibi Tam 1 Farkla Kazanır", "Ev Sahibi Tam 2 Farkla Kazanır", "Ev Sahibi 3+ Farkla Kazanır", "Deplasman Tam 1 Farkla Kazanır", "Deplasman Tam 2 Farkla Kazanır", "Deplasman 3+ Farkla Kazanır", "Herhangi Bir Takım 1 Farkla Kazanır", "Herhangi Bir Takım 2 Farkla Kazanır", "Herhangi Bir Takım 3+ Farkla Kazanır"], ["galibiyet farkı"])
    },
    {
      id: "v546_football_penalties",
      name: "Özel Bahisler",
      desc: "Penaltı olur/olmaz özel futbol marketi",
      sport: "football",
      markets: marketItems(["Penaltı Olur / Olmaz"], ["penaltı", "özel bahis"])
    }
  ];

  const V546_BASKETBALL_CATEGORIES = [
    {
      id: "v546_basket_main",
      name: "Ana Marketler",
      desc: "Maç, toplam sayı, yarı ve uzatma ana basketbol marketleri",
      sport: "basketball",
      markets: [
        ...marketItems([
          "Maç Sonucu", "Maç Handikapı", "Toplam Sayı Alt / Üst", "Takım 1 Toplam Sayı Alt / Üst", "Takım 2 Toplam Sayı Alt / Üst", "Kazanan ve Toplam Sayı",
          "İlk Yarı Sonucu", "İlk Yarı Handikap", "İlk Yarı Toplam Sayı", "İkinci Yarı Sonucu", "İkinci Yarı Handikap", "İkinci Yarı Toplam Sayı",
          "Uzatma Olur / Olmaz", "Normal Süre Sonucu", "Uzatmalar Dahil Maç Sonucu", "En Çok Sayı Olan Yarı"
        ], ["basketbol ana market"]),
        marketItem("Her İki Takım da ____ Alt / Üst Sayı Atar (Uz. dahil)", {
          id: "basket.both_teams_points_line_ou_ot",
          desc: "Gerçek oran verisi gelince 64.5, 66.5, 68.5 gibi çizgiler maç bazlı otomatik listelenecek.",
          aliases: ["Her iki takım 64.5 üst sayı atar", "Her iki takım 66.5 üst sayı atar", "Her iki takım 68.5 üst sayı atar", "Both teams team total over", "Both teams points over"],
          tags: ["basketbol", "basketbol ana market", "takım sayı", "64.5", "66.5", "68.5", "her iki takım", "alt üst sayı", "uzatma dahil"],
          period: "full_time_ot_included",
          marketType: "dynamic_line_over_under",
          line: null,
          side: "both_teams",
          dataMode: "catalog_dynamic_placeholder"
        })
      ]
    },
    {
      id: "v546_basket_quarters",
      name: "Çeyrek Marketleri",
      desc: "Çeyrek sonuç, handikap, toplam sayı ve en çok/en az sayı çeyreği",
      sport: "basketball",
      markets: marketItems(["İlk Çeyrek Sonucu", "İlk Çeyrek Handikap", "İlk Çeyrek Toplam Sayı", "İkinci Çeyrek Sonucu", "İkinci Çeyrek Handikap", "İkinci Çeyrek Toplam Sayı", "Üçüncü Çeyrek Sonucu", "Üçüncü Çeyrek Handikap", "Üçüncü Çeyrek Toplam Sayı", "Dördüncü Çeyrek Sonucu", "Dördüncü Çeyrek Handikap", "Dördüncü Çeyrek Toplam Sayı", "En Çok Sayı Atılan Çeyrek", "En Az Sayı Atılan Çeyrek"], ["çeyrek"])
    },
    {
      id: "v546_basket_team_points",
      name: "Takım Sayı Marketleri",
      desc: "Takım toplam, yarı ve çeyrek sayı alt/üst marketleri",
      sport: "basketball",
      markets: marketItems(["Takım 1 Toplam Sayı Alt / Üst", "Takım 2 Toplam Sayı Alt / Üst", "Takım 1 İlk Yarı Sayı Alt / Üst", "Takım 2 İlk Yarı Sayı Alt / Üst", "Takım 1 İkinci Yarı Sayı Alt / Üst", "Takım 2 İkinci Yarı Sayı Alt / Üst", "Takım 1 İlk Çeyrek Sayı Alt / Üst", "Takım 2 İlk Çeyrek Sayı Alt / Üst", "Takım 1 İkinci Çeyrek Sayı Alt / Üst", "Takım 2 İkinci Çeyrek Sayı Alt / Üst", "Takım 1 Üçüncü Çeyrek Sayı Alt / Üst", "Takım 2 Üçüncü Çeyrek Sayı Alt / Üst", "Takım 1 Dördüncü Çeyrek Sayı Alt / Üst", "Takım 2 Dördüncü Çeyrek Sayı Alt / Üst"], ["takım sayı"])
    },
    {
      id: "v546_basket_team_handicap",
      name: "Takım Handikap Marketleri",
      desc: "Takım, yarı ve çeyrek bazlı handikap marketleri",
      sport: "basketball",
      markets: marketItems(["Takım 1 Handikap", "Takım 2 Handikap", "İlk Yarı Takım 1 Handikap", "İlk Yarı Takım 2 Handikap", "İkinci Yarı Takım 1 Handikap", "İkinci Yarı Takım 2 Handikap", "İlk Çeyrek Takım 1 Handikap", "İlk Çeyrek Takım 2 Handikap", "İkinci Çeyrek Takım 1 Handikap", "İkinci Çeyrek Takım 2 Handikap", "Üçüncü Çeyrek Takım 1 Handikap", "Üçüncü Çeyrek Takım 2 Handikap", "Dördüncü Çeyrek Takım 1 Handikap", "Dördüncü Çeyrek Takım 2 Handikap"], ["takım handikap"])
    },
    {
      id: "v546_basket_race",
      name: "İlk Olan / Yarış Marketleri",
      desc: "İlk sayı tipi ve ilk X sayıya ulaşan takım marketleri",
      sport: "basketball",
      markets: [
        marketItem("Maçta İlk Sayı Nasıl Olur", { desc: "Faul atışı / 2’lik / 3’lük", tags: ["ilk sayı"] }),
        marketItem("İlk X Sayıya Ulaşan Takım", { desc: "Gerçek veri gelince 5, 10, 15, 20, 25, 30, 40, 50, 75, 100 çizgileri maça göre çoğalır.", tags: ["ilk x sayıya ulaşan"] }),
        ...marketItems(["İlk 5 Sayıya Ulaşan Takım", "İlk 10 Sayıya Ulaşan Takım", "İlk 15 Sayıya Ulaşan Takım", "İlk 20 Sayıya Ulaşan Takım", "İlk 25 Sayıya Ulaşan Takım", "İlk 30 Sayıya Ulaşan Takım", "İlk 40 Sayıya Ulaşan Takım", "İlk 50 Sayıya Ulaşan Takım", "İlk 75 Sayıya Ulaşan Takım", "İlk 100 Sayıya Ulaşan Takım", "İlk Çeyrekte İlk X Sayıya Ulaşan Takım", "İkinci Çeyrekte İlk X Sayıya Ulaşan Takım", "Üçüncü Çeyrekte İlk X Sayıya Ulaşan Takım", "Dördüncü Çeyrekte İlk X Sayıya Ulaşan Takım"], ["ilk x sayıya ulaşan", "yarış"])
      ]
    },
    {
      id: "v546_basket_player_points",
      name: "Oyuncu Sayı Marketleri",
      desc: "Oyuncu sayı, üçlük, serbest atış, iki sayılık ve sayı barajları",
      sport: "basketball",
      markets: marketItems(["Oyuncu Sayı Alt / Üst", "Oyuncu İlk Yarı Sayı Alt / Üst", "Oyuncu İlk Çeyrek Sayı Alt / Üst", "Oyuncu Üçlük Alt / Üst", "Oyuncu Serbest Atış Alt / Üst", "Oyuncu İki Sayılık Alt / Üst", "Oyuncu En Çok Sayı Atar", "Oyuncu 10+ Sayı Atar", "Oyuncu 15+ Sayı Atar", "Oyuncu 20+ Sayı Atar", "Oyuncu 25+ Sayı Atar", "Oyuncu 30+ Sayı Atar", "Oyuncu 35+ Sayı Atar", "Oyuncu 40+ Sayı Atar"], ["oyuncu sayı"])
    },
    {
      id: "v546_basket_player_reb_ast",
      name: "Oyuncu Ribaund / Asist",
      desc: "Ribaund, asist ve kombine oyuncu üretim marketleri",
      sport: "basketball",
      markets: marketItems(["Oyuncu Ribaund Alt / Üst", "Oyuncu Asist Alt / Üst", "Oyuncu Hücum Ribaund Alt / Üst", "Oyuncu Savunma Ribaund Alt / Üst", "Oyuncu 5+ Ribaund", "Oyuncu 7+ Ribaund", "Oyuncu 10+ Ribaund", "Oyuncu 5+ Asist", "Oyuncu 7+ Asist", "Oyuncu 10+ Asist", "Oyuncu Sayı + Ribaund + Asist", "Oyuncu Sayı + Ribaund", "Oyuncu Sayı + Asist", "Oyuncu Ribaund + Asist"], ["oyuncu ribaund asist"])
    },
    {
      id: "v546_basket_player_defense_foul",
      name: "Oyuncu Savunma / Faul",
      desc: "Top çalma, blok, top kaybı, faul ve double/triple double marketleri",
      sport: "basketball",
      markets: marketItems(["Oyuncu Top Çalma Alt / Üst", "Oyuncu Blok Alt / Üst", "Oyuncu Top Kaybı Alt / Üst", "Oyuncu Faul Alt / Üst", "Oyuncu Kişisel Faul Alt / Üst", "Oyuncu Teknik Faul Alır", "Oyuncu Double Double Yapar", "Oyuncu Triple Double Yapar"], ["oyuncu faul", "savunma"])
    },
    {
      id: "v546_basket_team_stats",
      name: "Takım İstatistik Marketleri",
      desc: "Üçlük, serbest atış, ribaund, asist, top kaybı, faul, blok ve top çalma",
      sport: "basketball",
      markets: marketItems(["Takım 1 Üçlük Alt / Üst", "Takım 2 Üçlük Alt / Üst", "Takım 1 Üçlük İsabet Alt / Üst", "Takım 2 Üçlük İsabet Alt / Üst", "Takım 1 Serbest Atış Alt / Üst", "Takım 2 Serbest Atış Alt / Üst", "Takım 1 İki Sayılık Alt / Üst", "Takım 2 İki Sayılık Alt / Üst", "Takım 1 Ribaund Alt / Üst", "Takım 2 Ribaund Alt / Üst", "Takım 1 Hücum Ribaund Alt / Üst", "Takım 2 Hücum Ribaund Alt / Üst", "Takım 1 Savunma Ribaund Alt / Üst", "Takım 2 Savunma Ribaund Alt / Üst", "Takım 1 Asist Alt / Üst", "Takım 2 Asist Alt / Üst", "Takım 1 Top Kaybı Alt / Üst", "Takım 2 Top Kaybı Alt / Üst", "Takım 1 Faul Alt / Üst", "Takım 2 Faul Alt / Üst", "Takım 1 Blok Alt / Üst", "Takım 2 Blok Alt / Üst", "Takım 1 Top Çalma Alt / Üst", "Takım 2 Top Çalma Alt / Üst"], ["takım istatistik"])
    },
    {
      id: "v546_basket_specials",
      name: "Özel Basketbol Marketleri",
      desc: "Son çeyrek, yarı/çeyrek kazanıp maç kazanma ve özel takım barajları",
      sport: "basketball",
      markets: marketItems(["Son Çeyrekte En Çok Sayı Atan Takım", "İlk Yarıyı Kazanan Maçı Kazanır", "İlk Çeyreği Kazanan Maçı Kazanır", "Her İki Takım da İlk Yarı 40.5 Alt / Üst", "Her İki Takım da İlk Yarı 45.5 Alt / Üst", "Her İki Takım da İlk Çeyrek 20.5 Alt / Üst", "Her İki Takım da İlk Çeyrek 25.5 Alt / Üst", "Takım 1 Her Çeyrek 20+ Sayı Atar", "Takım 2 Her Çeyrek 20+ Sayı Atar", "Takım 1 Her Çeyrek 25+ Sayı Atar", "Takım 2 Her Çeyrek 25+ Sayı Atar"], ["özel basketbol"])
    },
    {
      id: "v546_basket_quarter_wins",
      name: "Çeyrek Kazanma Kombinasyonları",
      desc: "Evet / Hayır sonucuyla çeyrek kazanma kombinasyonları",
      sport: "basketball",
      markets: marketItems(["Takım 1 En Az 1 Çeyrek Kazanır", "Takım 1 En Az 2 Çeyrek Kazanır", "Takım 1 En Az 3 Çeyrek Kazanır", "Takım 1 Tüm Çeyrekleri Kazanır", "Takım 2 En Az 1 Çeyrek Kazanır", "Takım 2 En Az 2 Çeyrek Kazanır", "Takım 2 En Az 3 Çeyrek Kazanır", "Takım 2 Tüm Çeyrekleri Kazanır"], ["çeyrek kazanma", "evet hayır"])
    },
    {
      id: "v546_basket_player_alt_lines",
      name: "Oyuncu Alternatif Barajları",
      desc: "Oyuncu üçlük, sayı, ribaund, asist, blok, top çalma ve kombine barajlar",
      sport: "basketball",
      markets: marketItems(["Oyuncu 1+ Üçlük", "Oyuncu 2+ Üçlük", "Oyuncu 3+ Üçlük", "Oyuncu 4+ Üçlük", "Oyuncu 5+ Üçlük", "Oyuncu 5+ Sayı", "Oyuncu 7+ Ribaund", "Oyuncu 7+ Asist", "Oyuncu 1+ Blok", "Oyuncu 2+ Blok", "Oyuncu 1+ Top Çalma", "Oyuncu 2+ Top Çalma", "Oyuncu Blok + Top Çalma", "Oyuncu Sayı + Üçlük", "Oyuncu Sayı + Top Çalma", "Oyuncu Sayı + Blok", "Oyuncu Ribaund + Blok", "Oyuncu Asist + Top Kaybı"], ["oyuncu alternatif baraj"])
    }
  ];

  const V544_POLY_FILTERS = [
    ["all", "Hepsi"], ["sports", "Spor"], ["crypto", "Kripto"], ["economy", "Ekonomi"],
    ["news", "Haber"], ["short", "Kısa Vade"], ["liquid", "Yüksek Likidite"], ["value", "Fırsat Adayı"]
  ];

  function isPolymarketMode() { return state.sport === "polymarket"; }

  function marketSideMeta(label) {
    const norm = normalizeText(label);
    if (norm.includes("ev sahibi")) return { side: "home", aliases: [label.replace(/Ev Sahibi/g, "Takım 1"), label.replace(/Ev Sahibi/g, "Home Team")] };
    if (norm.includes("deplasman")) return { side: "away", aliases: [label.replace(/Deplasman/g, "Takım 2"), label.replace(/Deplasman/g, "Away Team")] };
    if (norm.includes("takim 1")) return { side: "home", aliases: [label.replace(/Takım 1/g, "Ev Sahibi"), label.replace(/Takım 1/g, "Home Team")] };
    if (norm.includes("takim 2")) return { side: "away", aliases: [label.replace(/Takım 2/g, "Deplasman"), label.replace(/Takım 2/g, "Away Team")] };
    if (norm.includes("her iki takim")) return { side: "both_teams", aliases: [label.replace(/Her İki Takım/g, "Both Teams")] };
    return { side: null, aliases: [] };
  }

  function inferPeriod(label) {
    const norm = normalizeText(label);
    if (norm.includes("uzatma") || norm.includes("uz ")) return "full_time_ot_included";
    if (norm.includes("ilk yari")) return "first_half";
    if (norm.includes("ikinci yari")) return "second_half";
    if (norm.includes("ilk ceyrek") || norm.includes("1 ceyrek")) return "q1";
    if (norm.includes("ikinci ceyrek") || norm.includes("2 ceyrek")) return "q2";
    if (norm.includes("ucuncu ceyrek") || norm.includes("3 ceyrek")) return "q3";
    if (norm.includes("dorduncu ceyrek") || norm.includes("4 ceyrek") || norm.includes("son ceyrek")) return "q4";
    return "full_time";
  }

  function inferMarketType(label) {
    const norm = normalizeText(label);
    if (norm.includes("alt ust")) return norm.includes("____") || norm.includes(" x ") ? "dynamic_line_over_under" : "over_under";
    if (norm.includes("handikap")) return "handicap";
    if (norm.includes("mac sonucu") || norm.includes("sonucu") || norm.includes("kazanir")) return "result";
    if (norm.includes("cifte sans")) return "double_chance";
    if (norm.includes("var yok") || norm.includes("olur olmaz") || norm.includes("atar mi")) return "yes_no";
    if (norm.includes("baraj") || norm.includes("+")) return "threshold";
    return "catalog_market";
  }

  function inferLine(label) {
    const match = String(label || "").match(/\b\d+(?:\.\d+)?\b/);
    return match ? Number(match[0]) : null;
  }

  function stableMarketId(cat, market, index) {
    if (market.id) return market.id;
    const sport = sourceSportName(categorySport(cat));
    const label = market.label || market.name || `market_${index}`;
    const norm = normalizeText(label);
    const line = inferLine(label);
    const side = marketSideMeta(label).side;
    if (sport === "football" && norm.includes("mac sonucu")) return "football.result.full_time_1x2";
    if (sport === "football" && norm.includes("ilk yari") && norm.includes("ev sahibi") && norm.includes("faul") && norm.includes("alt ust")) return "football.stats.first_half_team1_fouls_ou";
    if (sport === "football" && norm.includes("gol") && norm.includes("alt ust") && line != null && !side) return `football.goals.total_${String(line).replace(".", "_")}_ou`;
    if (sport === "football" && norm.includes("korner") && norm.includes("alt ust") && line != null) return `football.corner.total_${String(line).replace(".", "_")}_ou`;
    if (sport === "basket" && norm === "mac sonucu") return "basket.match_winner";
    if (sport === "basket" && norm.includes("takim 1") && norm.includes("toplam sayi") && norm.includes("alt ust")) return "basket.team1_points_ou";
    if (sport === "basket" && norm.includes("takim 2") && norm.includes("toplam sayi") && norm.includes("alt ust")) return "basket.team2_points_ou";
    if (sport === "basket" && norm.includes("toplam sayi") && norm.includes("alt ust") && !side) return "basket.total_points_ou";
    if (sport === "basket" && norm.includes("oyuncu sayi") && norm.includes("alt ust")) return "basket.player_points_ou";
    return `${sport}.${categoryIdPart(cat)}.${stableIdPart(label)}`;
  }

  function searchTextForMarket(cat, market) {
    return normalizeText([
      market.name,
      market.label,
      market.desc,
      cat.name,
      cat.desc,
      categorySport(cat),
      market.period,
      market.marketType,
      market.side,
      market.line,
      ...(Array.isArray(market.tags) ? market.tags : []),
      ...(Array.isArray(market.aliases) ? market.aliases : [])
    ].join(" "));
  }

  function enrichMarket(cat, market, index) {
    const label = market.label || market.name || "Market";
    const sideMeta = marketSideMeta(label);
    const tags = [...new Set([categorySport(cat), cat.name, ...(Array.isArray(market.tags) ? market.tags : [])].filter(Boolean))];
    const aliases = [...new Set([...(Array.isArray(market.aliases) ? market.aliases : []), ...sideMeta.aliases].filter(Boolean))];
    const enriched = {
      ...market,
      id: stableMarketId(cat, market, index),
      sport: categorySport(cat),
      group: cat.name,
      label,
      name: label,
      aliases,
      tags,
      period: market.period || inferPeriod(label),
      marketType: market.marketType || inferMarketType(label),
      line: market.line ?? inferLine(label),
      side: market.side || sideMeta.side,
      dataMode: market.dataMode || "catalog_static"
    };
    enriched._searchText = searchTextForMarket(cat, enriched);
    return enriched;
  }

  function assertUniqueMarketIds(categories) {
    const seen = new Set();
    categories.forEach(cat => (cat.markets || []).forEach(m => {
      let id = m.id;
      let suffix = 2;
      while (seen.has(id)) {
        id = `${m.id}_${suffix}`;
        suffix += 1;
      }
      m.id = id;
      seen.add(id);
    }));
  }

  function curatedMarketCategories() {
    if (!curatedMarketCategoryCache) {
      curatedMarketCategoryCache = [...V546_FOOTBALL_CATEGORIES, ...V546_BASKETBALL_CATEGORIES].map(cat => ({
        ...cat,
        markets: (cat.markets || []).map((m, index) => enrichMarket(cat, m, index))
      }));
      assertUniqueMarketIds(curatedMarketCategoryCache);
    }
    return curatedMarketCategoryCache;
  }

  function marketCategories(sport = state.sport) {
    if (sport === "polymarket") return [];
    if (!marketCategoryCacheBySport[sport]) {
      const all = curatedMarketCategories();
      marketCategoryCacheBySport[sport] = sport === "football"
        ? all.filter(cat => categorySport(cat) === "football")
        : sport === "basketball"
          ? all.filter(cat => categorySport(cat) === "basketball")
          : all;
    }
    return marketCategoryCacheBySport[sport];
  }

  function marketMap() {
    if (marketMapCache) return marketMapCache;
    const map = {};
    curatedMarketCategories().forEach(cat => (cat.markets || []).forEach(m => map[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name, sport: categorySport(cat) }));
    allMarketCategories().forEach(cat => (cat.markets || []).forEach(m => {
      if (!map[m.id]) map[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name, sport: categorySport(cat) };
    }));
    marketMapCache = map;
    return map;
  }

  function findCatalogMarketById(marketIdValue) {
    const id = String(marketIdValue || "").trim();
    return id ? marketMap()[id] || null : null;
  }

  function findCatalogMarketByAlias(sourceMarketName, sport) {
    const query = normalizeText(sourceMarketName);
    if (!query) return null;
    const queryTokens = query.split(/\s+/).filter(Boolean);
    const noise = new Set(["to", "score", "including", "included", "ot", "game", "market", "total", "over", "under", "and", "the", "ou", "o", "u"]);
    const importantTokens = queryTokens.filter(t => !noise.has(t));
    const catalog = curatedMarketCategories()
      .filter(cat => !sport || categorySport(cat) === sport)
      .flatMap(cat => (cat.markets || []).map(market => ({ cat, market })));

    let best = null;
    catalog.forEach(({ cat, market }) => {
      const haystack = market._searchText || searchTextForMarket(cat, market);
      if (textMatchesTokens(haystack, queryTokens)) {
        if (!best || best.score < 999) best = { market, score: 999 };
        return;
      }
      const score = importantTokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
      const lineScore = market.line != null && queryTokens.includes(String(market.line)) ? 2 : 0;
      const ratioScore = Math.round(levenshteinRatio(query, haystack.slice(0, Math.max(query.length, 12))) * 3);
      const totalScore = score + lineScore + ratioScore;
      if (totalScore >= Math.min(3, Math.max(2, importantTokens.length)) && (!best || totalScore > best.score)) {
        best = { market, score: totalScore };
      }
    });
    return best?.market || null;
  }

  function normalizeSourceMarketName(value) {
    return normalizeText(value)
      .replace(/\bo\s*u\b/g, "over under")
      .replace(/\bou\b/g, "over under")
      .replace(/\bover\s*under\b/g, "over under")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findSourceMarketMapping({ source, sport, sourceMarketName } = {}) {
    const sourceId = String(source || "").trim();
    const sportId = normalizeSportName(sport || "");
    const marketName = normalizeSourceMarketName(sourceMarketName);
    if (!sourceId || !sportId || !marketName) return null;
    return SOURCE_MARKET_MAPPINGS.find(mapping => (
      mapping.source === sourceId
      && normalizeSportName(mapping.sport) === sportId
      && normalizeSourceMarketName(mapping.sourceMarketName) === marketName
    )) || null;
  }

  function aliasFallbackScore(sourceMarketName, catalogMarket) {
    if (!catalogMarket) return 0;
    const query = normalizeSourceMarketName(sourceMarketName);
    const haystack = normalizeText([
      catalogMarket.label,
      catalogMarket.name,
      catalogMarket.group,
      catalogMarket.categoryName,
      catalogMarket.period,
      catalogMarket.marketType,
      catalogMarket.side,
      catalogMarket.line,
      ...(Array.isArray(catalogMarket.tags) ? catalogMarket.tags : []),
      ...(Array.isArray(catalogMarket.aliases) ? catalogMarket.aliases : [])
    ].join(" "));
    if (!query || !haystack) return 0;
    const tokens = query.split(/\s+/).filter(Boolean);
    const noise = new Set(["to", "score", "including", "included", "ot", "game", "market", "total", "over", "under", "and", "the", "points", "goals"]);
    const important = tokens.filter(token => !noise.has(token));
    const tokenHits = important.filter(token => haystack.includes(token)).length;
    const tokenScore = important.length ? tokenHits / important.length : 0;
    const lineToken = tokens.find(token => /^\d+(?:\.\d+)?$/.test(token));
    const lineScore = lineToken && catalogMarket.line != null && String(catalogMarket.line) === lineToken ? 0.16 : 0;
    const exactAlias = (catalogMarket.aliases || []).some(alias => normalizeSourceMarketName(alias) === query) ? 0.18 : 0;
    return Math.max(0, Math.min(0.86, (tokenScore * 0.68) + lineScore + exactAlias));
  }


  function sourceMarketAliasCandidates(value) {
    const raw = String(value || "");
    const norm = normalizeSourceMarketName(raw);
    const candidates = [raw, norm];
    const rules = [
      [/player points(?: over under| o u| ou| over| under)?/i, "Oyuncu Sayı Alt / Üst"],
      [/team 1 points(?: over under| o u| ou| over| under)?/i, "Takım 1 Toplam Sayı Alt / Üst"],
      [/team 2 points(?: over under| o u| ou| over| under)?/i, "Takım 2 Toplam Sayı Alt / Üst"],
      [/(?:game )?total points(?: over under| o u| ou| over| under)?/i, "Toplam Sayı Alt / Üst"],
      [/first half (?:team 1|home team) fouls(?: over under| o u| ou| over| under)?/i, "İlk Yarı Ev Sahibi Faul Alt / Üst"],
      [/away team goals(?: over under| o u| ou| over| under)?\s*1\.5/i, "Deplasman 1.5 Gol Alt / Üst"],
      [/home team goals(?: over under| o u| ou| over| under)?\s*1\.5/i, "Ev Sahibi 1.5 Gol Alt / Üst"],
      [/(?:corners|total corners)(?: over under| o u| ou| over| under)?\s*9\.5/i, "9.5 Korner Alt / Üst"]
    ];
    rules.forEach(([pattern, replacement]) => {
      if (pattern.test(raw) || pattern.test(norm)) candidates.push(replacement);
    });
    return [...new Set(candidates.filter(Boolean))];
  }

  function inferMarketIdFromCatalogAliases({ sport, sourceMarketName } = {}) {
    const sportId = normalizeSportName(sport || "");
    let best = null;
    sourceMarketAliasCandidates(sourceMarketName).forEach(candidate => {
      const catalog = findCatalogMarketByAlias(candidate, sportId);
      if (!catalog) return;
      const confidence = aliasFallbackScore(candidate, catalog) || aliasFallbackScore(sourceMarketName, catalog) || 0.62;
      if (!best || confidence > best.confidence) {
        best = { marketId: catalog.id, confidence, matchedCatalogMarket: catalog, matchedBy: "catalog_alias" };
      }
    });
    if (!best) return { marketId: null, confidence: 0, matchedCatalogMarket: null, matchedBy: "unmatched" };
    if (best.confidence < 0.45) return { marketId: null, confidence: best.confidence, matchedCatalogMarket: null, matchedBy: "unmatched" };
    return best;
  }

  function mapSourceMarketToCatalogId(rawRecord = {}) {
    const source = rawRecord.source || rawRecord.bookmaker || rawRecord.sourceId;
    const sport = normalizeSportName(rawRecord.sport || "football");
    const sourceMarketName = rawRecord.sourceMarketName || rawRecord.marketName || rawRecord.marketLabel || rawRecord.market;
    const explicit = findSourceMarketMapping({ source, sport, sourceMarketName });
    if (explicit) {
      const catalog = findCatalogMarketById(explicit.marketId);
      return {
        marketId: catalog?.id || explicit.marketId || null,
        confidence: Math.max(0, Math.min(1, Number(explicit.confidence || 0.9))),
        matchedCatalogMarket: catalog || null,
        matchedBy: catalog ? "source_mapping" : "source_mapping_missing_catalog",
        sourceMapping: explicit,
        matched: Boolean(catalog)
      };
    }
    const fallback = inferMarketIdFromCatalogAliases({ sport, sourceMarketName });
    return {
      ...fallback,
      sourceMapping: null,
      matched: Boolean(fallback.matchedCatalogMarket && fallback.marketId)
    };
  }

  function createMappingConfidenceScore(rawRecord = {}, matchedCatalogMarket = null) {
    const mapped = mapSourceMarketToCatalogId(rawRecord);
    if (!matchedCatalogMarket && !mapped.matchedCatalogMarket) return 0;
    const base = Number(mapped.confidence || 0);
    const hasLine = rawRecord.line != null && rawRecord.line !== "";
    const lineMatches = hasLine && matchedCatalogMarket?.line != null && Number(rawRecord.line) === Number(matchedCatalogMarket.line);
    const lineBoost = lineMatches ? 0.04 : hasLine ? 0.01 : 0;
    return Math.max(0, Math.min(1, base + lineBoost));
  }

  function normalizeSourceFixture(rawRecord = {}) {
    const sport = normalizeSportName(rawRecord.sport || "football");
    const homeTeam = rawRecord.homeTeam || rawRecord.home || "Ev Sahibi";
    const awayTeam = rawRecord.awayTeam || rawRecord.away || "Deplasman";
    const league = rawRecord.league || "Demo Lig";
    const startsAt = rawRecord.startsAt || rawRecord.kickoff || rawRecord.startTime || "";
    return {
      sport: ["football", "basketball"].includes(sport) ? sport : "football",
      homeTeam,
      awayTeam,
      league,
      startsAt: startsAt || null,
      fixtureKey: buildFixtureKey({ sport, homeTeam, awayTeam, league, startsAt }),
      normalizedHomeTeam: normalizeTeamName(homeTeam),
      normalizedAwayTeam: normalizeTeamName(awayTeam),
      normalizedLeague: normalizeLeagueName(league)
    };
  }

  function standardOddsRecordFromSource(rawRecord = {}) {
    const fixture = normalizeSourceFixture(rawRecord);
    const mapping = mapSourceMarketToCatalogId({ ...rawRecord, sport: fixture.sport });
    const catalog = mapping.matchedCatalogMarket || findCatalogMarketById(mapping.marketId);
    const lineValue = rawRecord.line === "" || rawRecord.line == null ? catalog?.line ?? null : Number(rawRecord.line);
    const oddsValue = Number(rawRecord.odds ?? rawRecord.current ?? 0);
    const sourceMarketName = rawRecord.sourceMarketName || rawRecord.marketName || rawRecord.marketLabel || "";
    const confidence = mapping.matched ? createMappingConfidenceScore(rawRecord, catalog) : Math.max(0, Math.min(1, Number(mapping.confidence || 0)));
    const idParts = [rawRecord.id || "source", rawRecord.source || rawRecord.bookmaker || "mock", fixture.fixtureKey, mapping.marketId || "unmapped", rawRecord.selection || rawRecord.outcome || "selection", lineValue ?? "line"];
    return {
      id: idParts.map(fixtureKeyPart).join("_"),
      source: String(rawRecord.source || rawRecord.bookmaker || rawRecord.sourceId || "mock_source"),
      sport: fixture.sport,
      fixtureId: String(rawRecord.fixtureId || fixture.fixtureKey),
      fixtureKey: fixture.fixtureKey,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      league: fixture.league,
      startsAt: fixture.startsAt,
      marketId: mapping.marketId || null,
      marketLabel: catalog?.label || catalog?.name || rawRecord.marketLabel || sourceMarketName || "Kaynak marketi",
      selection: normalizeText(rawRecord.selection || rawRecord.outcome || "unknown") || "unknown",
      line: Number.isFinite(lineValue) ? lineValue : null,
      odds: Number.isFinite(oddsValue) ? oddsValue : 0,
      period: rawRecord.period || catalog?.period || "full_time",
      updatedAt: rawRecord.updatedAt || new Date().toISOString(),
      sourceMarketName,
      confidence,
      dataMode: rawRecord.dataMode || "mock_source",
      matched: Boolean(mapping.matched),
      matchedMarketId: mapping.matched ? mapping.marketId : "",
      matchedMarketLabel: mapping.matched ? (catalog?.label || catalog?.name || "") : "",
      matchedCategoryName: mapping.matched ? (catalog?.categoryName || catalog?.group || "") : "",
      matchedBy: mapping.matchedBy || "unmatched",
      sourceMapping: mapping.sourceMapping || null,
      catalog: catalog || null
    };
  }

  const SOURCE_ODDS_ADAPTERS = MOCK_SOURCE_IDS.reduce((acc, sourceId) => {
    const first = MOCK_SOURCE_RAW_RECORDS.find(row => row.source === sourceId) || {};
    acc[sourceId] = {
      sourceId,
      sourceName: first.sourceName || sourceId,
      sport: first.sport || "multi",
      status: "mock",
      normalize(rawRecord) { return normalizeSourceFixture(rawRecord); },
      mapMarket(rawRecord) { return mapSourceMarketToCatalogId(rawRecord); },
      toStandardOdds(rawRecord) { return standardOddsRecordFromSource(rawRecord); }
    };
    return acc;
  }, {});

  function adaptSourceOddsRecord(rawRecord = {}) {
    const sourceId = rawRecord.source || rawRecord.bookmaker || rawRecord.sourceId || "mock_source";
    const adapter = SOURCE_ODDS_ADAPTERS[sourceId] || {
      sourceId,
      sourceName: sourceId,
      sport: rawRecord.sport || "unknown",
      status: "mock",
      normalize(raw) { return normalizeSourceFixture(raw); },
      mapMarket(raw) { return mapSourceMarketToCatalogId(raw); },
      toStandardOdds(raw) { return standardOddsRecordFromSource(raw); }
    };
    return adapter.toStandardOdds(rawRecord);
  }

  function normalizeOddsRecord(rawRecord = {}) {
    if (rawRecord.sourceMarketName && !rawRecord.marketId) return adaptSourceOddsRecord(rawRecord);
    const sport = normalizeText(rawRecord.sport) === "basket" ? "basketball" : normalizeText(rawRecord.sport || "football");
    const catalogById = findCatalogMarketById(rawRecord.marketId);
    const catalogByAlias = catalogById ? null : findCatalogMarketByAlias(rawRecord.sourceMarketName || rawRecord.marketLabel, sport);
    const catalog = catalogById || catalogByAlias;
    const line = rawRecord.line === "" || rawRecord.line == null ? catalog?.line ?? null : Number(rawRecord.line);
    const odds = Number(rawRecord.odds ?? rawRecord.current ?? 0);
    const homeTeam = rawRecord.homeTeam || "Ev Sahibi";
    const awayTeam = rawRecord.awayTeam || "Deplasman";
    const league = rawRecord.league || "Demo Lig";
    const startsAt = rawRecord.startsAt || rawRecord.kickoff || "";
    const fixtureKey = buildFixtureKey({ sport, homeTeam, awayTeam, league, startsAt });
    return {
      id: String(rawRecord.id || fixtureKey + "_" + (catalog?.id || "market")),
      source: String(rawRecord.source || rawRecord.bookmaker || "mock_source"),
      sport: ["football", "basketball"].includes(sport) ? sport : "football",
      fixtureId: String(rawRecord.fixtureId || fixtureKey),
      fixtureKey,
      homeTeam,
      awayTeam,
      league,
      startsAt: startsAt || null,
      marketId: String(rawRecord.marketId || catalog?.id || "") || null,
      marketLabel: rawRecord.marketLabel || catalog?.label || catalog?.name || rawRecord.sourceMarketName || "Market",
      selection: normalizeText(rawRecord.selection || rawRecord.outcome || "unknown") || "unknown",
      line: Number.isFinite(line) ? line : null,
      odds: Number.isFinite(odds) ? odds : 0,
      period: rawRecord.period || catalog?.period || "full_time",
      updatedAt: rawRecord.updatedAt || new Date().toISOString(),
      sourceMarketName: rawRecord.sourceMarketName || rawRecord.marketLabel || catalog?.label || "",
      confidence: Math.max(0, Math.min(1, Number(rawRecord.confidence ?? 0.75))),
      dataMode: rawRecord.dataMode || "mock",
      matched: Boolean(catalog),
      matchedMarketId: catalog?.id || "",
      matchedBy: catalogById ? "marketId" : catalogByAlias ? "alias" : "unmatched"
    };
  }

  function mapOddsRecordToCatalog(record) {
    const normalized = record?.marketId ? record : normalizeOddsRecord(record);
    const catalog = findCatalogMarketById(normalized.marketId) || findCatalogMarketByAlias(normalized.sourceMarketName, normalized.sport);
    return {
      ...normalized,
      matchedMarketId: catalog?.id || normalized.matchedMarketId || "",
      matchedMarketLabel: catalog?.label || catalog?.name || "",
      matchedCategoryName: catalog?.categoryName || catalog?.group || "",
      matchedBy: catalog?.id === normalized.marketId ? "marketId" : catalog ? "alias" : normalized.matchedBy || "unmatched",
      catalog
    };
  }

  function splitSnapshotMatchName(value = "") {
    const raw = String(value || "").trim();
    const parts = raw.split(/\s+(?:-|–|—|vs\.?|v\.?|@)\s+/i).map(part => part.trim()).filter(Boolean);
    return { homeTeam: parts[0] || raw || "Ev Sahibi", awayTeam: parts[1] || "Deplasman" };
  }

  function staticSourceMeta(sourceId) {
    const sourceKey = String(sourceId || "").trim();
    const site = (state.sources?.sites || []).find(row => String(row.id || "") === sourceKey) || null;
    return {
      sourceId: sourceKey || "static_snapshot_source",
      sourceName: site?.name || sourceKey || "Statik Snapshot Kaynağı",
      type: site?.type || "bookmaker",
      group: site?.group || "static_snapshot",
      reference: Boolean(site?.reference)
    };
  }

  function snapshotMarketAlias(record = {}) {
    const market = String(record.market || record.marketId || "").toLowerCase();
    const label = record.marketLabel || record.sourceMarketName || record.marketName || "";
    const line = record.line === "" || record.line == null ? null : Number(record.line);
    if (market === "match_winner") return "Maç Sonucu";
    if (market.startsWith("total_goals") || /gol/i.test(label)) return line ? `${line} Gol Alt / Üst` : label || "Gol Alt / Üst";
    if (market.startsWith("corners") || /korner|corner/i.test(label)) return line ? `${line} Korner Alt / Üst` : label || "Korner Alt / Üst";
    if (/yellow_cards|kart/i.test(market + " " + label)) return "Sarı Kart Alt / Üst";
    if (/shots_on_target|isabetli/i.test(market + " " + label)) return "İsabetli Şut Alt / Üst";
    return label || market || "Snapshot marketi";
  }

  function normalizeStaticSnapshotRawRecord(record = {}, index = 0) {
    const sourceId = String(record.source || record.bookmaker || record.sourceId || "static_snapshot_source").trim();
    const source = staticSourceMeta(sourceId);
    const teams = splitSnapshotMatchName(record.match || record.fixture || record.eventName || "");
    const current = Number(record.odds ?? record.current ?? record.price ?? 0);
    const opening = Number(record.opening ?? record.open ?? current);
    const marketName = snapshotMarketAlias(record);
    const sport = normalizeSportName(record.sport || "football");
    return {
      ...record,
      id: String(record.id || record.recordId || `${source.sourceId}_${record.matchId || index}_${record.market || "market"}_${record.outcome || record.selection || "selection"}`),
      source: source.sourceId,
      sourceName: source.sourceName,
      bookmaker: source.sourceId,
      sourceType: source.type,
      sport: ["football", "basketball"].includes(sport) ? sport : "football",
      homeTeam: record.homeTeam || record.home || teams.homeTeam,
      awayTeam: record.awayTeam || record.away || teams.awayTeam,
      league: record.league || "Statik Snapshot Ligi",
      startsAt: record.startsAt || record.kickoff || record.startTime || null,
      fixtureId: record.fixtureId || record.matchId || "",
      sourceMarketName: marketName,
      marketName,
      marketLabel: record.marketLabel || marketName,
      selection: record.selection || record.outcome || "unknown",
      line: record.line === "" || record.line == null ? null : Number(record.line),
      odds: Number.isFinite(current) ? current : 0,
      current: Number.isFinite(current) ? current : 0,
      opening: Number.isFinite(opening) ? opening : Number.isFinite(current) ? current : 0,
      updatedAt: record.updatedAt || record.lastUpdatedAt || state.snapshot?.generatedAt || new Date().toISOString(),
      dataMode: "static_snapshot"
    };
  }

  function standardRecordToSnapshotDisplay(record = {}, raw = {}) {
    const marketIdValue = record.matchedMarketId || record.marketId || raw.market || "unmatched";
    return {
      ...raw,
      ...record,
      id: raw.id || record.id,
      matchId: raw.matchId || record.fixtureId || record.fixtureKey,
      match: raw.match || comparisonFixtureLabel(record),
      bookmaker: record.source || raw.bookmaker || raw.source,
      market: marketIdValue,
      rawMarket: raw.market || raw.marketId || "",
      marketLabel: record.matchedMarketLabel || record.marketLabel || raw.marketLabel || "Eşleşmeyen",
      outcome: raw.outcome || record.selection || "-",
      current: Number(record.odds || raw.current || 0),
      opening: Number(raw.opening ?? raw.open ?? record.odds ?? 0),
      referenceProb: Number(raw.referenceProb || 0),
      dataMode: "static_snapshot",
      matchedMarketId: record.matchedMarketId || "",
      matched: Boolean(record.matchedMarketId),
      adapterRecord: record
    };
  }

  function buildStaticSnapshotAdapterOutput() {
    const snapshot = state.snapshot && typeof state.snapshot === "object" ? state.snapshot : FALLBACK_SNAPSHOT;
    const rawSnapshotRows = Array.isArray(snapshot.records) ? snapshot.records : [];
    const bookmakerRows = rawSnapshotRows.filter(row => !isPolymarketRecord(row));
    const rawRecords = bookmakerRows.map(normalizeStaticSnapshotRawRecord);
    const records = rawRecords.map(row => mapOddsRecordToCatalog(adaptSourceOddsRecord(row))).filter(Boolean);
    const sourceHealthRows = buildSourceHealthSummary(records, SOURCE_MARKET_MAPPINGS, rawRecords).map(row => ({
      ...row,
      sourceName: staticSourceMeta(row.source).sourceName || row.sourceName,
      type: staticSourceMeta(row.source).type || row.type || "bookmaker",
      status: row.adaptedRecordCount ? "static_snapshot" : "empty",
      mode: row.adaptedRecordCount ? "static_snapshot" : "empty",
      message: row.adaptedRecordCount ? "Statik snapshot kaynağı yüklendi; dış API kapalı." : "Snapshot içinde bu kaynak için kayıt yok."
    }));
    validateSourceHealthList(sourceHealthRows);
    return {
      rawRecords,
      records,
      displayRecords: records.map((record, index) => standardRecordToSnapshotDisplay(record, rawRecords[index] || {})),
      sourceHealth: sourceHealthRows,
      summary: summarizeSourceHealth(sourceHealthRows),
      snapshotStatus: state.snapshotMeta?.status || (rawRecords.length ? "loaded" : "missing"),
      message: state.snapshotMeta?.message || "Statik snapshot durumu bilinmiyor."
    };
  }

  function hasActiveDryRunPayload() {
    return Boolean(state.dryRunResult && !state.dryRunResult.errorCount && !state.dryRunResult.isPolymarket && Array.isArray(state.dryRunResult.records) && state.dryRunResult.records.length);
  }

  function mockOddsRecords() {
    if (!normalizedMockOddsCache) {
      normalizedMockOddsCache = MOCK_SOURCE_RAW_RECORDS.map(raw => mapOddsRecordToCatalog(adaptSourceOddsRecord(raw)));
    }
    return normalizedMockOddsCache;
  }



  // -------------------------------
  // Source Registry / Source Health
  // -------------------------------
  function normalizeDataMode(mode) {
    const key = String(mode || "").toLowerCase().replace(/\s+/g, "_");
    return DATA_MODES.includes(key) ? key : "planned";
  }

  const UI_MODE_LABELS = {
    mock: "Demo",
    mock_source: "Demo Kaynak",
    static_snapshot: "Statik Snapshot",
    dry_run: "Dry-run",
    planned: "Planlandı",
    live_ready: "Canlıya Hazır",
    disabled: "Pasif",
    empty: "Veri Yok",
    error: "Hata",
    fallback: "Yedek",
    loading: "Yükleniyor"
  };

  const UI_SOURCE_TYPE_LABELS = {
    bookmaker: "Bahis Kaynağı",
    exchange: "Borsa",
    prediction_market: "Tahmin Marketi",
    api: "API"
  };

  const UI_STATUS_LABELS = {
    ok: "Hazır",
    loading: "Yükleniyor",
    empty: "Veri Yok",
    stale: "Eski Veri",
    error: "Hata",
    disabled: "Pasif",
    mock: "Demo",
    static_snapshot: "Statik Snapshot",
    dry_run: "Dry-run",
    planned: "Planlandı",
    live_ready: "Canlıya Hazır",
    fallback: "Yedek",
    mock_ready: "Demo Hazır",
    missing: "Adapter Yok",
    ready: "Canlı Adapter Hazır",
    live_not_ready: "Canlı Adapter Hazır Değil",
    beklemede: "Beklemede",
    "bağlantı bekliyor": "Bağlantı Bekliyor",
    planlandı: "Planlandı",
    active: "Aktif",
    inactive: "Pasif",
    enabled: "Aktif",
    pasif: "Pasif",
    hazır: "Hazır"
  };

  const UI_MAPPING_LABELS = {
    matched: "Eşleşen",
    unmatched: "Eşleşmeyen",
    alias: "Alias",
    marketid: "Market ID",
    market_id: "Market ID",
    source_mapping: "Kaynak Haritası",
    source_mapping_missing_catalog: "Harita Var / Katalog Eksik",
    catalog_alias: "Katalog Alias"
  };

  function labelFromDictionary(value, dictionary, fallback = "-") {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const key = raw.toLowerCase().replace(/\s+/g, "_");
    return dictionary[key] || dictionary[raw.toLowerCase()] || raw;
  }

  function displayModeLabel(mode) { return labelFromDictionary(mode, UI_MODE_LABELS); }
  function displaySourceTypeLabel(type) { return labelFromDictionary(type, UI_SOURCE_TYPE_LABELS); }
  function displayStatusLabel(status) { return labelFromDictionary(status, UI_STATUS_LABELS); }
  function displayMappingLabel(value) { return labelFromDictionary(value, UI_MAPPING_LABELS); }

  function sanitizeSourceDisplayName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 48);
  }

  function sanitizeSourceNote(value) {
    return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function sanitizeSourcePriority(value) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return 15;
    return Math.min(15, Math.max(1, number));
  }

  function displaySourceName(source = {}) {
    const name = String(source.displayName || source.sourceName || source.source || source.sourceId || "");
    if (/^Placeholder Bookmaker\s+(\d+)/i.test(name)) return name.replace(/^Placeholder Bookmaker/i, "Planlanan Kaynak");
    if (/^Mock Book\s+(.+)/i.test(name)) return name.replace(/^Mock Book/i, "Demo Kaynak");
    if (/^Live Ready Placeholder$/i.test(name)) return "Canlıya Hazır Kaynak";
    if (/^Polymarket Mock$/i.test(name)) return "Polymarket Demo";
    return name || "Kaynak";
  }

  function getAdapterSlot(sourceId) {
    const source = findEffectiveSource(sourceId) || SOURCE_REGISTRY.find(row => String(row.sourceId || "") === String(sourceId || ""));
    if (!source) return { sourceId, status: "missing", label: getAdapterStatusLabel("missing"), canRun: false, message: "Kaynak kaydı bulunamadı." };
    const mode = normalizeDataMode(source.mode || "planned");
    const rawStatus = String(source.adapterStatus || "missing").toLowerCase();
    let status = rawStatus;
    if (!isSourceActiveForUi(source)) status = "disabled";
    else if (mode === "mock" || rawStatus === "mock_ready") status = "mock";
    else if (mode === "live_ready" && rawStatus === "ready" && LIVE_API_CONNECTION_ENABLED) status = "live_ready";
    else if (mode === "live_ready") status = "live_not_ready";
    else if (rawStatus === "planned" || mode === "planned") status = "planned";
    else if (!["missing", "ready", "mock", "disabled"].includes(status)) status = "missing";
    return {
      sourceId: source.sourceId,
      technicalName: source.technicalName || source.sourceId,
      status,
      label: getAdapterStatusLabel(status),
      canRun: canSourceRunInCurrentMode(source),
      message: status === "mock"
        ? "Mock adapter hazır; dry-run verisiyle çalışır."
        : status === "live_ready"
          ? "Canlı adapter hazır; gerçek bağlantı yine kapalı tutulur."
          : status === "live_not_ready"
            ? "Canlı adapter hazır değil; bağlantı bekliyor."
            : status === "planned"
              ? "Adapter planlandı; gerçek fetch/scraping yok."
              : status === "disabled" ? "Kaynak pasif; karşılaştırmaya dahil edilmez." : "Adapter yok."
    };
  }

  function getAdapterStatusLabel(status) {
    const labels = {
      missing: "Adapter yok",
      planned: "Adapter planlandı",
      mock: "Mock adapter hazır",
      mock_ready: "Mock adapter hazır",
      live_not_ready: "Canlı adapter hazır değil",
      live_ready: "Canlı adapter hazır",
      ready: "Canlı adapter hazır",
      disabled: "Adapter pasif"
    };
    return labels[String(status || "").toLowerCase()] || displayStatusLabel(status);
  }

  function getLiveReadySources() {
    return effectiveSourceRegistry().filter(source => source.mode === "live_ready" && isSourceActiveForUi(source));
  }

  function getMockSources() {
    return effectiveSourceRegistry().filter(source => source.mode === "mock" && isSourceActiveForUi(source));
  }

  function getDisabledSources() {
    return effectiveSourceRegistry().filter(source => !isSourceActiveForUi(source));
  }

  function canSourceRunInCurrentMode(source = {}) {
    if (!isSourceActiveForUi(source)) return false;
    const mode = normalizeDataMode(source.mode || "planned");
    if (source.type === "prediction_market") return mode === "mock";
    if (mode === "mock") return true;
    if (mode === "live_ready") return false;
    return false;
  }


  function createAdapterRun(source = {}, rawRecords = [], status = "empty", message = "") {
    const rawRows = (Array.isArray(rawRecords) ? rawRecords.filter(Boolean) : []).map(row => ({
      ...row,
      source: source.sourceId,
      sourceName: displaySourceName(source),
      originalSource: row.source
    }));
    const run = {
      sourceId: source.sourceId,
      sourceName: displaySourceName(source),
      type: source.type || "bookmaker",
      mode: normalizeDataMode(source.mode || "planned"),
      enabled: isSourceActiveForUi(source),
      sports: [...(source.sports || [])],
      adapterStatus: getAdapterSlot(source.sourceId).status,
      status,
      message,
      rawRecords: rawRows,
      records: [],
      error: null
    };
    try {
      run.records = rawRows.map(row => mapOddsRecordToCatalog(adaptSourceOddsRecord(row))).filter(Boolean);
      if (run.records.length) run.status = run.mode === "mock" ? "mock" : status;
    } catch (error) {
      run.status = "error";
      run.error = error;
      run.message = "Adapter hata verdi; UI güvenli yedek modda.";
      console.warn("Oran Terminali adapter runner:", source.sourceId, error);
    }
    return run;
  }

  function runMockAdapters(sources = effectiveSourceRegistry()) {
    return (Array.isArray(sources) ? sources : [])
      .filter(source => source.type === "bookmaker" && normalizeDataMode(source.mode) === "mock" && isSourceActiveForUi(source))
      .map(source => createAdapterRun(
        source,
        MOCK_SOURCE_RAW_RECORDS.filter(row => String(row.source || row.sourceId || row.bookmaker || "") === String(source.rawSourceId || source.sourceId || "")),
        "mock",
        "Demo adapter çalıştı; karşılaştırma için hazır."
      ));
  }

  function runLiveReadyAdapters(sources = effectiveSourceRegistry()) {
    return (Array.isArray(sources) ? sources : [])
      .filter(source => source.type === "bookmaker" && ["live_ready", "planned"].includes(normalizeDataMode(source.mode)) && isSourceActiveForUi(source))
      .map(source => createAdapterRun(
        source,
        [],
        normalizeDataMode(source.mode),
        normalizeDataMode(source.mode) === "live_ready"
          ? "Canlı bağlantı kapalı; adapter kapısı bağlantı bekliyor."
          : "Kaynak planlandı; gerçek API/fetch/scraping yok."
      ));
  }

  function runEnabledSourceAdapters() {
    const enabledBookmakers = effectiveSourceRegistry().filter(source => source.type === "bookmaker" && isSourceActiveForUi(source));
    return [...runMockAdapters(enabledBookmakers), ...runLiveReadyAdapters(enabledBookmakers)];
  }

  function mergeAdapterResultsWithSourceHealth(adapterResults = [], sourceHealthList = null) {
    const runs = Array.isArray(adapterResults) ? adapterResults : [];
    const rawRows = runs.flatMap(run => run.rawRecords || []);
    const recordsList = runs.flatMap(run => run.records || []);
    const base = Array.isArray(sourceHealthList) ? sourceHealthList.slice() : buildSourceHealthSummary(recordsList, SOURCE_MARKET_MAPPINGS, rawRows);
    const bySource = new Map(base.map(row => [String(row.source || row.sourceId || ""), { ...row }]));
    runs.forEach(run => {
      const key = String(run.sourceId || "");
      const existing = bySource.get(key) || {};
      const mapped = (run.records || []).filter(row => row.matched || row.matchedMarketId).length;
      const status = run.status === "error" ? "error" : run.records?.length ? (run.mode === "mock" ? "mock" : run.mode) : run.status;
      bySource.set(key, {
        ...existing,
        source: key,
        sourceName: run.sourceName || existing.sourceName || key,
        type: run.type || existing.type || "bookmaker",
        sport: run.sports?.length === 1 ? run.sports[0] : existing.sport || "multi",
        sports: run.sports || existing.sports || [],
        mode: normalizeDataMode(run.mode || existing.mode || "planned"),
        status,
        adapterStatus: run.adapterStatus || existing.adapterStatus || status,
        rawRecordCount: Number(existing.rawRecordCount || 0) || (run.rawRecords || []).length,
        adaptedRecordCount: Number(existing.adaptedRecordCount || 0) || (run.records || []).length,
        mappedRecordCount: Number(existing.mappedRecordCount || 0) || mapped,
        unmappedRecordCount: Number(existing.unmappedRecordCount || 0) || Math.max(0, (run.records || []).length - mapped),
        errorCount: run.status === "error" ? 1 : Number(existing.errorCount || 0),
        warningCount: Number(existing.warningCount || 0),
        lastUpdatedAt: existing.lastUpdatedAt || safeIso((run.records || []).map(row => row.updatedAt).sort().slice(-1)[0]),
        stale: existing.stale || false,
        message: run.message || existing.message || "Adapter çalıştırıcı hazır"
      });
    });
    const rows = [...bySource.values()];
    validateSourceHealthList(rows);
    return rows;
  }

  function currentSourceConfigCacheKey() {
    return `${state.lastLoadedAt || "not-loaded"}|${JSON.stringify(state.sourceConfig || {})}`;
  }

  function updateSourceConfig(sourceId, patch = {}) {
    const base = SOURCE_REGISTRY.find(source => String(source.sourceId || "") === String(sourceId || ""));
    if (!base) return null;
    state.sourceConfig = state.sourceConfig && typeof state.sourceConfig === "object" ? state.sourceConfig : {};
    const current = state.sourceConfig[sourceId] && typeof state.sourceConfig[sourceId] === "object" ? state.sourceConfig[sourceId] : {};
    const enabled = patch.enabled !== undefined ? patch.enabled !== false : current.enabled !== undefined ? current.enabled !== false : base.enabled !== false;
    const mode = normalizeDataMode(patch.mode || current.mode || base.mode || "planned");
    const displayName = sanitizeSourceDisplayName(patch.displayName !== undefined ? patch.displayName : current.displayName || base.displayName || base.sourceName || "");
    const notes = sanitizeSourceNote(patch.notes !== undefined ? patch.notes : current.notes || "");
    const priority = sanitizeSourcePriority(patch.priority !== undefined ? patch.priority : current.priority ?? base.priority ?? 15);
    state.sourceConfig[sourceId] = { enabled, mode, displayName, notes, priority };
    clearSourceDerivedCaches();
    return state.sourceConfig[sourceId];
  }

  function saveSourceConfigSoon() {
    clearTimeout(sourceConfigSaveTimer);
    sourceConfigSaveTimer = setTimeout(saveLocalState, 180);
  }

  function clearSourceDerivedCaches() {
    sourceConfigCacheKey = "";
    effectiveSourceRegistryCache = null;
    adapterResultsCache = null;
    sourceRegistryHealthCache = null;
    defaultComparisonEngineCache = null;
  }

  function ensureSourceCacheKey() {
    const key = currentSourceConfigCacheKey();
    if (sourceConfigCacheKey !== key) {
      sourceConfigCacheKey = key;
      effectiveSourceRegistryCache = null;
      adapterResultsCache = null;
      sourceRegistryHealthCache = null;
      defaultComparisonEngineCache = null;
    }
    return key;
  }

  function collectAdapterResults() {
    ensureSourceCacheKey();
    if (adapterResultsCache) return adapterResultsCache;

    if (hasActiveDryRunPayload()) {
      const records = filterComparisonRecordsBySource(state.dryRunResult.records);
      const sourceHealthRows = getSafeSourceHealth(records).map(row => ({
        ...row,
        status: row.adaptedRecordCount ? "dry_run" : "empty",
        mode: row.adaptedRecordCount ? "dry_run" : "empty",
        message: row.adaptedRecordCount ? "Dry-run payload adapter hattında test edildi; gerçek bağlantı kapalı." : "Dry-run kaynağında kayıt yok."
      }));
      const healthSummary = summarizeSourceHealth(sourceHealthRows);
      adapterResultsCache = {
        adapterRuns: [],
        rawRecords: records,
        records,
        sourceHealth: sourceHealthRows,
        healthSummary,
        dataMode: "dry_run",
        dataModePriority: "aktif dry-run payload → statik snapshot → mock/fallback → empty"
      };
      return adapterResultsCache;
    }

    const staticOutput = buildStaticSnapshotAdapterOutput();
    if (staticOutput.records.length) {
      adapterResultsCache = {
        adapterRuns: [],
        rawRecords: staticOutput.rawRecords,
        records: staticOutput.records,
        displayRecords: staticOutput.displayRecords,
        sourceHealth: staticOutput.sourceHealth,
        healthSummary: staticOutput.summary,
        dataMode: "static_snapshot",
        dataModePriority: "aktif dry-run payload → statik snapshot → mock/fallback → empty"
      };
      return adapterResultsCache;
    }

    const adapterRuns = runEnabledSourceAdapters();
    const rawRecords = adapterRuns.flatMap(run => run.rawRecords || []);
    const records = adapterRuns.flatMap(run => run.records || []);
    const sourceHealthRows = mergeAdapterResultsWithSourceHealth(adapterRuns);
    const healthSummary = summarizeSourceHealth(sourceHealthRows);
    adapterResultsCache = {
      adapterRuns,
      rawRecords,
      records,
      sourceHealth: sourceHealthRows,
      healthSummary,
      dataMode: records.length ? healthSummary.dataMode : "fallback",
      dataModePriority: "aktif dry-run payload → statik snapshot → mock/fallback → empty"
    };
    return adapterResultsCache;
  }

  // -------------------------------
  // Comparison Engine
  // -------------------------------
  function oddsFixtureKey(record = {}) {
    return String(record.fixtureId || record.fixtureKey || buildFixtureKey(record) || "fixture-unknown");
  }

  function oddsComparisonKeyPart(value) {
    return fixtureKeyPart(value == null || value === "" ? "none" : value);
  }

  function oddsGroupKey(record = {}, parts = []) {
    return parts.map(part => oddsComparisonKeyPart(typeof part === "function" ? part(record) : record[part])).join("|");
  }

  function groupOddsByFixture(list = mockOddsRecords()) {
    return list.reduce((acc, record) => {
      if (isPolymarketRecord(record)) return acc;
      const key = oddsGroupKey(record, ["sport", oddsFixtureKey]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});
  }

  function groupOddsByFixtureAndMarket(list = mockOddsRecords()) {
    return list.reduce((acc, record) => {
      if (isPolymarketRecord(record)) return acc;
      const key = oddsGroupKey(record, ["sport", oddsFixtureKey, "marketId", "line", "selection", "period"]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});
  }

  function groupOddsByFixtureMarketLine(list = mockOddsRecords()) {
    return list.reduce((acc, record) => {
      if (isPolymarketRecord(record)) return acc;
      const key = oddsGroupKey(record, ["sport", oddsFixtureKey, "marketId", "line", "period"]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});
  }

  function groupOddsBySource(list = mockOddsRecords()) {
    return list.reduce((acc, record) => {
      const key = String(record.source || record.bookmaker || "bilinmeyen_kaynak");
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {});
  }

  function findBestOddsForGroup(groupRecords = []) {
    const valid = groupRecords
      .filter(record => Number.isFinite(Number(record.odds)) && Number(record.odds) > 1)
      .sort((a, b) => Number(b.odds) - Number(a.odds));
    const bestRecord = valid[0] || null;
    const secondBestRecord = valid[1] || null;
    const sourceNames = [...new Set(valid.map(record => record.source || record.bookmaker || "bilinmeyen_kaynak"))];
    const averageOdds = valid.length ? valid.reduce((sum, record) => sum + Number(record.odds), 0) / valid.length : 0;
    const bestDiffPercent = bestRecord && secondBestRecord
      ? ((Number(bestRecord.odds) - Number(secondBestRecord.odds)) / Number(secondBestRecord.odds)) * 100
      : 0;
    const avgConfidence = valid.length ? valid.reduce((sum, record) => sum + Number(record.confidence || 0), 0) / valid.length : 0;
    return {
      bestRecord,
      secondBestRecord,
      averageOdds: Number(averageOdds.toFixed(3)),
      bestDiffPercent: Number(bestDiffPercent.toFixed(2)),
      sourceCount: sourceNames.length,
      comparedSources: sourceNames,
      confidence: sourceNames.length < 2 ? "insufficient" : avgConfidence >= 0.82 ? "high" : avgConfidence >= 0.68 ? "medium" : "low",
      confidenceScore: Number(avgConfidence.toFixed(3)),
      status: sourceNames.length < 2 ? "karşılaştırma yetersiz" : "demo karşılaştırma"
    };
  }

  function baseMarketFamily(marketId = "", record = {}) {
    const id = String(marketId || record.marketId || record.matchedMarketId || "unmapped");
    const explicitFamilies = {
      "football.goals.total_2_5_ou": "football.goals.total_ou",
      "football.home_goals_1_5_ou": "football.home_goals_ou",
      "football.away_goals_1_5_ou": "football.away_goals_ou",
      "football.corner.total_9_5_ou": "football.corner.total_ou",
      "basket.total_points_ou": "basket.total_points_ou",
      "basket.team1_points_ou": "basket.team1_points_ou",
      "basket.both_teams_points_line_ou_ot": "basket.both_teams_points_line_ou_ot"
    };
    if (explicitFamilies[id]) return explicitFamilies[id];
    return id
      .replace(/_(\d+)_5(_ou)$/i, "$2")
      .replace(/_(\d+)_0(_ou)$/i, "$2")
      .replace(/_(\d+)_(\d+)(_ou)$/i, "$3")
      .replace(/\.total_\d+_\d+_ou$/i, ".total_ou")
      .replace(/_line_ou_ot$/i, "_line_ou_ot") || "unmapped";
  }

  function lineDifferenceSeverity(spread, sport) {
    const value = Number(spread || 0);
    if (sport === "basketball") {
      if (value >= 4) return "high";
      if (value >= 2) return "medium";
      return "low";
    }
    if (value >= 1.5) return "high";
    if (value >= 1) return "medium";
    return "low";
  }

  function detectLineDifferences(list = mockOddsRecords()) {
    const buckets = {};
    list.forEach(record => {
      if (isPolymarketRecord(record) || record.line == null || !record.marketId) return;
      const line = Number(record.line);
      if (!Number.isFinite(line)) return;
      const family = baseMarketFamily(record.marketId, record);
      const key = oddsGroupKey(record, ["sport", oddsFixtureKey, () => family, "period"]);
      if (!buckets[key]) buckets[key] = { sport: record.sport, fixtureKey: oddsFixtureKey(record), baseMarketFamily: family, records: [] };
      buckets[key].records.push(record);
    });
    return Object.values(buckets).map(bucket => {
      const lines = [...new Set(bucket.records.map(record => Number(record.line)).filter(Number.isFinite))].sort((a, b) => a - b);
      const sources = [...new Set(bucket.records.map(record => record.source || record.bookmaker || "bilinmeyen_kaynak"))];
      const lineSpread = lines.length > 1 ? Math.max(...lines) - Math.min(...lines) : 0;
      return {
        fixtureKey: bucket.fixtureKey,
        sport: bucket.sport,
        baseMarketFamily: bucket.baseMarketFamily,
        lines,
        sourceCount: sources.length,
        lineSpread: Number(lineSpread.toFixed(2)),
        records: bucket.records,
        severity: lineDifferenceSeverity(lineSpread, bucket.sport)
      };
    }).filter(row => row.lines.length > 1 && row.lineSpread > 0)
      .sort((a, b) => b.lineSpread - a.lineSpread || b.sourceCount - a.sourceCount);
  }

  function latestUpdatedAt(recordsList = []) {
    const times = recordsList.map(record => Date.parse(record.updatedAt || record.lastUpdatedAt || "")).filter(Number.isFinite);
    return times.length ? Math.max(...times) : 0;
  }

  function safeIso(value) {
    const ts = Date.parse(value || "");
    if (!Number.isFinite(ts)) return null;
    try { return new Date(ts).toISOString(); } catch { return null; }
  }

  function formatSourceUpdatedAt(value) {
    const iso = safeIso(value);
    if (!iso) return "bilinmiyor";
    try {
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      }).format(new Date(iso));
    } catch {
      return "bilinmiyor";
    }
  }

  function isSourceStale(lastUpdatedAt, maxAgeMinutes = SOURCE_HEALTH_MAX_AGE_MINUTES) {
    const ts = Date.parse(lastUpdatedAt || "");
    if (!Number.isFinite(ts)) return false;
    return Math.max(0, Date.now() - ts) / 6e4 > Number(maxAgeMinutes || SOURCE_HEALTH_MAX_AGE_MINUTES);
  }

  function sourceStaleMinutes(lastUpdatedAt) {
    const ts = Date.parse(lastUpdatedAt || "");
    if (!Number.isFinite(ts)) return 0;
    return Math.max(0, Math.round((Date.now() - ts) / 6e4));
  }

  function getSourceStatus(sourceHealth = {}) {
    const explicit = String(sourceHealth.status || "").toLowerCase().replace(/\s+/g, "_");
    const mode = normalizeDataMode(sourceHealth.mode || "");
    if (explicit === "loading" || sourceHealth.loading) return "loading";
    if (explicit === "disabled" || mode === "disabled" || sourceHealth.disabled) return "disabled";
    if (explicit === "error" || Number(sourceHealth.errorCount || 0) > 0 || sourceHealth.error) return "error";
    if (explicit === "fallback" || mode === "fallback") return "fallback";
    if (explicit === "stale" || sourceHealth.stale || isSourceStale(sourceHealth.lastUpdatedAt, sourceHealth.maxAgeMinutes)) return "stale";
    if (mode === "mock" || explicit === "mock") return Number(sourceHealth.adaptedRecordCount || sourceHealth.rawRecordCount || 0) > 0 ? "mock" : "empty";
    if (mode === "static_snapshot" || explicit === "static_snapshot") return Number(sourceHealth.adaptedRecordCount || sourceHealth.rawRecordCount || 0) > 0 ? "static_snapshot" : "empty";
    if (mode === "dry_run" || explicit === "dry_run") return Number(sourceHealth.adaptedRecordCount || sourceHealth.rawRecordCount || 0) > 0 ? "dry_run" : "empty";
    if (mode === "live_ready" || explicit === "live_ready") return "live_ready";
    if (mode === "planned" || explicit === "planned") return "planned";
    if (explicit === "empty" || Number(sourceHealth.rawRecordCount || 0) <= 0 && Number(sourceHealth.adaptedRecordCount || 0) <= 0) return "empty";
    return SOURCE_HEALTH_STATUSES.includes(explicit) ? explicit : "ok";
  }

  function getSourceHealthBadge(sourceHealth = {}) {
    const status = getSourceStatus(sourceHealth);
    const labels = {
      ok: "Hazır", loading: "Yükleniyor", empty: "Veri Yok", stale: "Eski Veri", error: "Hata", disabled: "Pasif", mock: "Demo", static_snapshot: "Statik Snapshot", dry_run: "Dry-run", planned: "Planlandı", live_ready: "Canlıya Hazır", fallback: "Yedek"
    };
    return { status, label: labels[status] || status, className: `source-${String(status).replace(/_/g, "-")}` };
  }

  function buildSourceHealthSummary(recordsList = [], sourceMappings = SOURCE_MARKET_MAPPINGS, rawList = MOCK_SOURCE_RAW_RECORDS) {
    const adaptedRows = Array.isArray(recordsList) ? recordsList.filter(Boolean) : [];
    const rawRowsAll = Array.isArray(rawList) ? rawList.filter(Boolean) : [];
    const sourceNames = {};
    rawRowsAll.forEach(row => {
      const source = String(row.source || row.bookmaker || row.sourceId || "mock_source");
      if (!sourceNames[source]) sourceNames[source] = row.sourceName || SOURCE_ODDS_ADAPTERS[source]?.sourceName || source;
    });
    adaptedRows.forEach(row => {
      const source = String(row.source || row.bookmaker || row.sourceId || "mock_source");
      if (!sourceNames[source]) sourceNames[source] = row.sourceName || SOURCE_ODDS_ADAPTERS[source]?.sourceName || source;
    });
    const sources = [...new Set([...rawRowsAll.map(row => String(row.source || row.bookmaker || row.sourceId || "mock_source")), ...adaptedRows.map(row => String(row.source || row.bookmaker || row.sourceId || "mock_source"))])];

    const health = sources.map(source => {
      const rawRows = rawRowsAll.filter(row => String(row.source || row.bookmaker || row.sourceId || "mock_source") === source);
      const rows = adaptedRows.filter(row => String(row.source || row.bookmaker || row.sourceId || "mock_source") === source);
      const mappedRecordCount = rows.filter(row => row.matched || row.matchedMarketId).length;
      const sports = [...new Set([...rawRows, ...rows].map(row => normalizeSportName(row.sport || "")).filter(Boolean))];
      const lastUpdatedAt = safeIso(rows.map(row => row.updatedAt || row.lastUpdatedAt).sort().slice(-1)[0] || rawRows.map(row => row.updatedAt || row.lastUpdatedAt).sort().slice(-1)[0]);
      const mappingWarnings = rawRows.filter(row => !sourceMappings.some(mapping => mapping.source === source && normalizeSourceMarketName(mapping.sourceMarketName) === normalizeSourceMarketName(row.sourceMarketName || row.marketName || row.marketLabel || row.market))).length;
      const stale = isSourceStale(lastUpdatedAt, SOURCE_HEALTH_MAX_AGE_MINUTES);
      const row = {
        source,
        sourceName: sourceNames[source] || source,
        type: "bookmaker",
        sport: sports.length === 1 ? sports[0] : "multi",
        status: rows.length ? "mock" : "empty",
        mode: "mock",
        lastUpdatedAt,
        nextRefreshAt: null,
        rawRecordCount: rawRows.length,
        adaptedRecordCount: rows.length,
        mappedRecordCount,
        unmappedRecordCount: Math.max(0, rows.length - mappedRecordCount),
        errorCount: 0,
        warningCount: mappingWarnings,
        stale,
        staleMinutes: stale ? sourceStaleMinutes(lastUpdatedAt) : 0,
        message: rows.length ? (stale ? "Demo veri eski olabilir" : "Demo kaynak hazır") : "Bu filtre için eşleşen kaynak verisi yok"
      };
      row.status = getSourceStatus(row);
      return row;
    });
    validateSourceHealthList(health);
    return health;
  }

  function summarizeSourceHealth(sourceHealthList = []) {
    const list = Array.isArray(sourceHealthList) ? sourceHealthList : [];
    const totals = list.reduce((acc, row) => {
      acc.sources += 1;
      acc.raw += Number(row.rawRecordCount || 0);
      acc.adapted += Number(row.adaptedRecordCount || 0);
      acc.mapped += Number(row.mappedRecordCount || 0);
      acc.unmapped += Number(row.unmappedRecordCount || 0);
      acc.errors += Number(row.errorCount || 0);
      acc.warnings += Number(row.warningCount || 0);
      if (getSourceStatus(row) === "stale") acc.stale += 1;
      return acc;
    }, { sources: 0, raw: 0, adapted: 0, mapped: 0, unmapped: 0, errors: 0, warnings: 0, stale: 0 });
    totals.lastUpdatedAt = list.map(row => row.lastUpdatedAt).filter(Boolean).sort().slice(-1)[0] || null;
    totals.status = list.some(row => getSourceStatus(row) === "error") ? "error" : list.some(row => getSourceStatus(row) === "loading") ? "loading" : list.some(row => getSourceStatus(row) === "stale") ? "stale" : list.length ? "mock" : "empty";
    totals.dataMode = getGlobalDataMode(list);
    return totals;
  }

  function getGlobalDataMode(sourceHealthList = []) {
    const list = Array.isArray(sourceHealthList) ? sourceHealthList : [];
    if (!list.length) return "empty";
    if (list.some(row => getSourceStatus(row) === "error")) return "error";
    if (list.some(row => normalizeDataMode(row.mode) === "fallback")) return "fallback";
    if (list.some(row => normalizeDataMode(row.mode) === "dry_run" && Number(row.adaptedRecordCount || 0) > 0)) return "dry_run";
    if (list.some(row => normalizeDataMode(row.mode) === "static_snapshot" && Number(row.adaptedRecordCount || 0) > 0)) return "static_snapshot";
    if (list.some(row => normalizeDataMode(row.mode) === "mock" && Number(row.adaptedRecordCount || 0) > 0)) return "mock";
    if (list.some(row => normalizeDataMode(row.mode) === "live_ready")) return "live_ready";
    if (list.some(row => normalizeDataMode(row.mode) === "planned")) return "planned";
    if (list.every(row => getSourceStatus(row) === "disabled")) return "disabled";
    if (list.every(row => getSourceStatus(row) === "empty")) return "empty";
    return "empty";
  }

  function validateSourceHealthList(sourceHealthList = []) {
    const list = Array.isArray(sourceHealthList) ? sourceHealthList : [];
    const seen = new Set();
    const issues = [];
    list.forEach(row => {
      if (!row?.source) issues.push("source boş");
      if (seen.has(row.source)) issues.push(`duplicate source: ${row.source}`);
      seen.add(row.source);
      if (!SOURCE_HEALTH_STATUSES.includes(getSourceStatus(row))) issues.push(`${row.source}: geçersiz status`);
      ["rawRecordCount", "adaptedRecordCount", "mappedRecordCount", "unmappedRecordCount", "errorCount", "warningCount"].forEach(key => {
        if (!Number.isFinite(Number(row[key] || 0))) issues.push(`${row.source}: ${key} number değil`);
      });
      if (Number(row.mappedRecordCount || 0) + Number(row.unmappedRecordCount || 0) > Number(row.adaptedRecordCount || 0)) issues.push(`${row.source}: mapped+unmapped adapted sayısını aşıyor`);
      if (row.lastUpdatedAt && !safeIso(row.lastUpdatedAt)) issues.push(`${row.source}: lastUpdatedAt geçersiz`);
    });
    if (issues.length && !sourceHealthValidationWarningDone) {
      sourceHealthValidationWarningDone = true;
      console.warn("Oran Terminali source health validation:", issues.slice(0, 6));
    }
    return { valid: !issues.length, issues };
  }

  function getSafeOddsRecords(inputList) {
    const base = Array.isArray(inputList) ? inputList : mockOddsRecords();
    return base.filter(Boolean).filter(row => !isPolymarketRecord(row));
  }

  function getSafeSourceHealth(inputList) {
    if (!Array.isArray(inputList)) return collectAdapterResults().sourceHealth;
    return buildSourceHealthSummary(
      filterComparisonRecordsBySource(getSafeOddsRecords(inputList)),
      SOURCE_MARKET_MAPPINGS,
      filterRawSourceRecordsByConfig(MOCK_SOURCE_RAW_RECORDS)
    );
  }

  function hasUsableComparisonData(inputList = mockOddsRecords(), sourceHealthList = getSafeSourceHealth(inputList)) {
    const list = getSafeOddsRecords(inputList);
    const summary = summarizeSourceHealth(sourceHealthList);
    return list.length > 0 && summary.sources >= 2 && summary.mapped > 0 && !sourceHealthList.every(row => ["empty", "error", "disabled"].includes(getSourceStatus(row)));
  }

  function getFallbackComparisonState(inputList = []) {
    const sourceHealthList = getSafeSourceHealth(inputList);
    return {
      dataMode: getGlobalDataMode(sourceHealthList),
      sourceHealth: sourceHealthList,
      usable: hasUsableComparisonData(inputList, sourceHealthList),
      message: hasUsableComparisonData(inputList, sourceHealthList)
        ? "Demo karşılaştırma altyapısı hazır"
        : "Karşılaştırma için yeterli kaynak yok"
    };
  }

  function buildPolymarketSourceHealth(recordsList = polymarketMockAdapterRecords()) {
    const rows = Array.isArray(recordsList) ? recordsList.filter(Boolean) : [];
    const lastUpdatedAt = state.lastLoadedAt || new Date().toISOString();
    return {
      source: "polymarket_mock",
      sourceName: "Polymarket Demo",
      type: "prediction_market",
      status: rows.length ? "mock" : "empty",
      mode: "mock",
      marketCount: rows.length,
      lastUpdatedAt,
      liquidityTotal: rows.reduce((sum, row) => sum + Number(row.liquidity || 0), 0),
      volume24hTotal: rows.reduce((sum, row) => sum + Number(row.volume24h || 0), 0),
      message: rows.length ? "YES/NO fiyatları ayrı izlenir; decimal odds motoruna karışmaz" : "Polymarket demo kaydı yok"
    };
  }

  function sourceRegistryHealthRows() {
    ensureSourceCacheKey();
    if (sourceRegistryHealthCache) return sourceRegistryHealthCache;
    const adapter = collectAdapterResults();
    sourceRegistryHealthCache = [...adapter.sourceHealth, buildPolymarketSourceHealth(polymarketMockAdapterRecords())];
    return sourceRegistryHealthCache;
  }

  function findSourceRegistryHealth(sourceId, sourceHealthList = sourceRegistryHealthRows()) {
    return (Array.isArray(sourceHealthList) ? sourceHealthList : []).find(row => String(row.source || row.sourceId || "") === String(sourceId || "")) || null;
  }

  function getSourceConfigOverride(sourceId) {
    const config = state.sourceConfig && typeof state.sourceConfig === "object" ? state.sourceConfig : {};
    return config[String(sourceId || "")] || null;
  }

  function applySourceConfig(source = {}) {
    const override = getSourceConfigOverride(source.sourceId);
    if (!override) return { ...source };
    const enabled = override.enabled !== false;
    return {
      ...source,
      enabled,
      displayName: sanitizeSourceDisplayName(override.displayName || source.displayName || source.sourceName || ""),
      sourceName: sanitizeSourceDisplayName(override.displayName || source.sourceName || source.displayName || ""),
      notes: sanitizeSourceNote(override.notes || source.notes || ""),
      priority: sanitizeSourcePriority(override.priority ?? source.priority ?? 15),
      mode: enabled ? normalizeDataMode(override.mode || source.mode || "planned") : "disabled",
      configMode: normalizeDataMode(override.mode || source.mode || "planned")
    };
  }

  function effectiveSourceRegistry() {
    ensureSourceCacheKey();
    if (!effectiveSourceRegistryCache) effectiveSourceRegistryCache = SOURCE_REGISTRY.map(applySourceConfig);
    return effectiveSourceRegistryCache;
  }

  function findEffectiveSource(sourceId) {
    return effectiveSourceRegistry().find(source => String(source.sourceId || "") === String(sourceId || "")) || null;
  }

  function isSourceActiveForUi(source = {}) {
    return Boolean(source.enabled) && String(source.mode || "").toLowerCase() !== "disabled";
  }

  function canonicalSourceId(sourceId) {
    return MOCK_SOURCE_SLOT_MAP[String(sourceId || "")] || String(sourceId || "");
  }

  function isSourceEnabledForComparison(sourceId) {
    const source = findEffectiveSource(canonicalSourceId(sourceId));
    if (!source) return true;
    if (source.type === "prediction_market") return false;
    return isSourceActiveForUi(source);
  }

  function filterComparisonRecordsBySource(list = []) {
    return (Array.isArray(list) ? list : []).filter(record => {
      if (isPolymarketRecord(record)) return false;
      const sourceId = record.source || record.bookmaker || record.sourceId || "";
      return isSourceEnabledForComparison(sourceId);
    });
  }

  function filterRawSourceRecordsByConfig(list = []) {
    return (Array.isArray(list) ? list : []).filter(record => {
      const sourceId = record.source || record.bookmaker || record.sourceId || "";
      return isSourceEnabledForComparison(sourceId);
    });
  }


  const DRY_RUN_SAMPLE_PAYLOAD = [
    {
      source: "source_book_01", sport: "football", homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League",
      startsAt: "2026-06-05T19:00:00Z", sourceMarketName: "Total Goals Over/Under 2.5", selection: "over", line: 2.5, odds: 1.87
    },
    {
      source: "source_book_03", sport: "football", homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League",
      startsAt: "2026-06-05T19:00:00Z", sourceMarketName: "Match Goals 2.5 O/U", selection: "over", line: 2.5, odds: 1.94
    }
  ];

  const DRY_RUN_SAMPLE_PAYLOADS = {
    flat: {
      label: "Bookmaker düz dizi",
      note: "En basit format; her kayıt kendi source/sport bilgisini taşır.",
      payload: DRY_RUN_SAMPLE_PAYLOAD
    },
    nested: {
      label: "Bookmaker nested",
      note: "Gerçek adapter çıktısına daha yakın nested records formatı.",
      payload: {
        source: "mock_book_a",
        sport: "basketball",
        payload: {
          records: [
            {
              homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
              sourceMarketName: "Both Teams To Score Over 68.5 Points Including OT", selection: "over", line: 68.5, odds: 1.74
            },
            {
              homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL", startsAt: "2026-06-05T18:00:00Z",
              sourceMarketName: "Total Points O/U", selection: "under", line: 164.5, odds: 1.91
            }
          ]
        }
      }
    },
    marketId: {
      label: "Market ID direkt",
      note: "Kaynak market adı yoksa stable marketId ile doğrudan katalog bağlantısı.",
      payload: [
        {
          source: "source_book_01", sport: "football", homeTeam: "Real Madrid", awayTeam: "Barcelona", league: "La Liga",
          startsAt: "2026-06-05T20:00:00Z", marketId: "football.corner.total_9_5_ou", selection: "over", line: 9.5, odds: 1.96
        },
        {
          source: "source_book_04", sport: "basketball", homeTeam: "Fenerbahçe", awayTeam: "Anadolu Efes", league: "BSL",
          startsAt: "2026-06-05T18:00:00Z", marketId: "basket.total_points_ou", selection: "under", line: 164.5, odds: 1.88
        }
      ]
    },
    polymarket: {
      label: "POLYMARKET ayrı",
      note: "YES/NO fiyatı; bookmaker odds karşılaştırmasına dahil olmaz.",
      payload: [
        {
          source: "polymarket_mock", category: "crypto", title: "Bitcoin bu hafta 70.000$ üzerinde kapanır mı?",
          yesPrice: 0.52, noPrice: 0.48, liquidity: 260000, volume24h: 88000, closesInHours: 5.4, tags: ["kripto", "bitcoin", "kısa vade"]
        }
      ]
    },
    mixedError: {
      label: "Hatalı karışık örnek",
      note: "Bookmaker + Polymarket karışırsa bilerek reddedilir.",
      payload: [
        {
          source: "mock_book_a", sport: "football", homeTeam: "Arsenal", awayTeam: "Chelsea", startsAt: "2026-06-05T19:00:00Z",
          sourceMarketName: "Total Goals Over/Under 2.5", selection: "over", line: 2.5, odds: 1.87
        },
        {
          source: "polymarket_mock", category: "crypto", title: "ETH bugün 4000$ üstü kapanır mı?", yesPrice: 0.43, noPrice: 0.57
        }
      ]
    }
  };

  const DRY_RUN_CONTRACT_ROWS = [
    ["Giriş", "JSON Array veya records içeren object"],
    ["Kayıt", "Bookmaker kayıtları fixture + market + odds taşır"],
    ["Fixture", "homeTeam + awayTeam + startsAt ile stable fixtureKey üretilir"],
    ["Market", "marketId önce, sonra sourceMarketName / alias eşleşmesi kullanılır"],
    ["Çıkış", "standard odds record + matchedMarketId + confidence"],
    ["Güvenlik", "fetch/API/scraping ve otomatik oynama kapalıdır"],
    ["POLYMARKET", "YES/NO akışı ayrı kalır; decimal bookmaker motoruna karışmaz"]
  ];

  const POLYMARKET_DRY_RUN_FIELDS = ["category", "title", "yesPrice", "noPrice", "liquidity", "volume24h", "closesInHours", "tags"];
  const DRY_RUN_BOOKMAKER_REQUIRED_FIELDS = ["source", "sport", "homeTeam", "awayTeam", "startsAt", "sourceMarketName veya marketId", "selection/outcome", "odds"];
  const DRY_RUN_BOOKMAKER_OPTIONAL_FIELDS = ["league", "line", "period", "updatedAt", "fixtureId", "marketName", "marketLabel"];
  const DRY_RUN_PAYLOAD_FORMATS = ["Array", "{ source, records: [] }", "{ source, payload: { records: [] } }"];

  function parseDryRunJsonInput(input) {
    if (typeof input !== "string") return { ok: true, payload: input };
    const raw = input.trim();
    if (!raw) return { ok: false, errors: ["JSON alanı boş. Örnek kayıt dizisi yapıştırın."] };
    try {
      return { ok: true, payload: JSON.parse(raw) };
    } catch (error) {
      return { ok: false, errors: [`JSON geçerli değil: ${error?.message || "parse hatası"}`] };
    }
  }

  function normalizeDryRunPayloadMeta(payload = {}) {
    const meta = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    return {
      source: meta.source || meta.sourceId || meta.bookmaker || "",
      sourceId: meta.sourceId || meta.source || meta.bookmaker || "",
      sport: meta.sport || (Array.isArray(meta.sports) ? meta.sports[0] : meta.sports) || "",
      league: meta.league || "",
      dataMode: "dry_run"
    };
  }

  function extractIncomingRecords(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && Array.isArray(payload.records)) {
      const meta = normalizeDryRunPayloadMeta(payload);
      return payload.records.map(record => ({ ...meta, ...record, source: record?.source || record?.sourceId || meta.source }));
    }
    if (payload && typeof payload === "object" && payload.payload && typeof payload.payload === "object" && Array.isArray(payload.payload.records)) {
      const meta = { ...normalizeDryRunPayloadMeta(payload), ...normalizeDryRunPayloadMeta(payload.payload) };
      return payload.payload.records.map(record => ({ ...meta, ...record, source: record?.source || record?.sourceId || meta.source }));
    }
    return [];
  }

  function isSupportedDryRunPayloadShape(payload) {
    return Array.isArray(payload)
      || Boolean(payload && typeof payload === "object" && Array.isArray(payload.records))
      || Boolean(payload && typeof payload === "object" && payload.payload && typeof payload.payload === "object" && Array.isArray(payload.payload.records));
  }

  function isPolymarketDryRunRecord(record = {}) {
    const sourceId = canonicalSourceId(record.source || record.sourceId || "");
    return sourceId === "polymarket_mock" || POLYMARKET_DRY_RUN_FIELDS.some(field => record[field] !== undefined);
  }

  function validatePolymarketDryRunRecord(record = {}, index = 0) {
    const errors = [];
    const sourceId = canonicalSourceId(record.source || record.sourceId || "");
    if (sourceId !== "polymarket_mock") errors.push(`Kayıt ${index + 1}: Polymarket dry-run için source polymarket_mock olmalı.`);
    if (!record.title) errors.push(`Kayıt ${index + 1}: Polymarket title eksik.`);
    ["yesPrice", "noPrice"].forEach(field => {
      const value = Number(record[field]);
      if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`Kayıt ${index + 1}: ${field} 0-1 arası sayı olmalı.`);
    });
    return errors;
  }

  function validateBookmakerDryRunRecord(record = {}, index = 0) {
    const errors = [];
    const sourceId = canonicalSourceId(record.source || record.sourceId || "");
    const source = findEffectiveSource(sourceId);
    const sport = String(record.sport || "").toLowerCase();
    const odds = Number(record.odds);
    if (!sourceId) errors.push(`Kayıt ${index + 1}: source zorunlu.`);
    if (sourceId && !source) errors.push(`Kayıt ${index + 1}: source bilinen kaynak değil.`);
    if (source?.type === "prediction_market") errors.push(`Kayıt ${index + 1}: Polymarket kaydı bookmaker odds alanına karışamaz.`);
    if (source && !isSourceActiveForUi(source)) errors.push(`Kayıt ${index + 1}: kaynak pasif olduğu için karşılaştırmaya dahil edilmez.`);
    if (!["football", "basketball"].includes(sport)) errors.push(`Kayıt ${index + 1}: sport football veya basketball olmalı.`);
    if (source && sport && Array.isArray(source.sports) && !source.sports.includes(sport)) errors.push(`Kayıt ${index + 1}: kaynak bu sporu desteklemiyor.`);
    if (!record.homeTeam || !record.awayTeam || !record.startsAt) errors.push(`Kayıt ${index + 1}: fixture key için homeTeam, awayTeam ve startsAt zorunlu.`);
    if (!record.marketId && !record.sourceMarketName && !record.marketName) errors.push(`Kayıt ${index + 1}: market eşleşmesi için sourceMarketName veya marketId zorunlu.`);
    if (!Number.isFinite(odds) || odds <= 1) errors.push(`Kayıt ${index + 1}: odds number olmalı ve 1'den büyük olmalı.`);
    return errors;
  }

  // -------------------------------
  // Dry-run Helpers
  // -------------------------------
  function validateIncomingOddsPayload(payload) {
    const parsed = parseDryRunJsonInput(payload);
    if (!parsed.ok) return { valid: false, errors: parsed.errors, sourceId: "", recordCount: 0, records: [], polymarketCount: 0, bookmakerCount: 0 };
    const records = extractIncomingRecords(parsed.payload);
    const errors = [];
    if (!isSupportedDryRunPayloadShape(parsed.payload)) errors.push("Payload Array, { records: [] } veya { payload: { records: [] } } formatında olmalı.");
    if (!records.length) errors.push("Kayıt dizisi boş olamaz.");
    let polymarketCount = 0;
    let bookmakerCount = 0;
    records.forEach((record, index) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        errors.push(`Kayıt ${index + 1}: nesne olmalı.`);
        return;
      }
      if (isPolymarketDryRunRecord(record)) {
        polymarketCount += 1;
        errors.push(...validatePolymarketDryRunRecord(record, index));
      } else {
        bookmakerCount += 1;
        errors.push(...validateBookmakerDryRunRecord(record, index));
      }
    });
    if (polymarketCount && bookmakerCount) errors.push("Polymarket dry-run kayıtları normal bookmaker payload ile karışamaz.");
    return {
      valid: errors.length === 0,
      errors,
      sourceId: records[0]?.source || records[0]?.sourceId || parsed.payload?.source || parsed.payload?.sourceId || "",
      recordCount: records.length,
      records,
      polymarketCount,
      bookmakerCount
    };
  }

  function normalizeIncomingOddsPayload(payload) {
    const validation = validateIncomingOddsPayload(payload);
    const records = validation.records || [];
    const normalizedRecords = validation.polymarketCount ? [] : records.map(record => {
      const sourceId = canonicalSourceId(record.source || record.sourceId || "");
      const source = findEffectiveSource(sourceId) || {};
      try {
        return mapOddsRecordToCatalog(adaptSourceOddsRecord({
          ...record,
          source: sourceId,
          sourceName: displaySourceName(source) || sourceId,
          dataMode: "dry_run"
        }));
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    return {
      sourceId: validation.sourceId,
      mode: "dry-run",
      valid: validation.valid,
      errors: validation.errors,
      records: normalizedRecords,
      rawRecords: records,
      isPolymarket: Boolean(validation.polymarketCount),
      recordCount: validation.recordCount,
      polymarketCount: validation.polymarketCount,
      bookmakerCount: validation.bookmakerCount,
      schemaChecks: buildDryRunSchemaChecklist(records, validation)
    };
  }

  function buildDryRunSchemaChecklist(rawRecords = [], validation = {}) {
    const rows = Array.isArray(rawRecords) ? rawRecords : [];
    const bookmakerRows = rows.filter(row => !isPolymarketDryRunRecord(row));
    const validOdds = bookmakerRows.filter(row => Number(row.odds) > 1).length;
    const validFixture = bookmakerRows.filter(row => row.homeTeam && row.awayTeam && row.startsAt).length;
    const validMarketKey = bookmakerRows.filter(row => row.marketId || row.sourceMarketName || row.marketName).length;
    const validSource = bookmakerRows.filter(row => canonicalSourceId(row.source || row.sourceId || "")).length;
    return [
      { label: "Format", value: validation.valid || rows.length ? "okundu" : "bekliyor", ok: Boolean(rows.length) },
      { label: "Kaynak", value: `${validSource}/${bookmakerRows.length || 0}`, ok: !bookmakerRows.length || validSource === bookmakerRows.length },
      { label: "Fixture", value: `${validFixture}/${bookmakerRows.length || 0}`, ok: !bookmakerRows.length || validFixture === bookmakerRows.length },
      { label: "Market anahtarı", value: `${validMarketKey}/${bookmakerRows.length || 0}`, ok: !bookmakerRows.length || validMarketKey === bookmakerRows.length },
      { label: "Oran", value: `${validOdds}/${bookmakerRows.length || 0}`, ok: !bookmakerRows.length || validOdds === bookmakerRows.length },
      { label: "Polymarket ayrımı", value: validation.polymarketCount && validation.bookmakerCount ? "karışık" : "ayrı", ok: !(validation.polymarketCount && validation.bookmakerCount) }
    ];
  }

  function dryRunFixtureScore(record = {}, fixtureCandidates = mockOddsRecords()) {
    if (!record || isPolymarketRecord(record)) return { score: 0, label: "yok" };
    const fixtureKey = buildFixtureKey(record);
    if (!fixtureKey || fixtureKey.includes("unknown")) return { score: 0, label: "şüpheli" };
    const bestFixture = fixtureCandidates.reduce((best, candidate) => {
      const score = scoreFixtureMatch(record, candidate);
      return score > best.score ? { score, candidate } : best;
    }, { score: 0, candidate: null });
    return {
      score: bestFixture.score,
      label: bestFixture.score >= 0.82 ? "güçlü" : bestFixture.score >= 0.55 ? "kontrol" : "şüpheli",
      candidate: bestFixture.candidate || null
    };
  }

  function buildDryRunMappingRows(normalized = {}, limit = 20) {
    if (normalized.isPolymarket) return [];
    const rawRows = normalized.rawRecords || [];
    const normalizedRows = normalized.records || [];
    const fixtureCandidates = mockOddsRecords();
    return rawRows.slice(0, limit).map((raw, index) => {
      const row = normalizedRows[index] || null;
      const fixture = row ? dryRunFixtureScore(row, fixtureCandidates) : { score: 0, label: "hatalı" };
      const confidence = row ? Math.round(Number(row.confidence || 0) * 100) : 0;
      const fixtureScore = Math.round(Number(fixture.score || 0) * 100);
      const qualityScore = row ? Math.round((confidence * 0.65) + (fixtureScore * 0.25) + ((row.matchedMarketId || row.marketId) ? 10 : 0)) : 0;
      const duplicateKey = row ? [row.source, row.fixtureKey, row.marketId, row.selection, row.line].map(value => String(value ?? "")).join("|") : "";
      return {
        index: index + 1,
        source: raw.source || raw.sourceId || "-",
        fixture: row ? comparisonFixtureLabel(row) : `${raw.homeTeam || "?"} - ${raw.awayTeam || "?"}`,
        sourceMarketName: raw.sourceMarketName || raw.marketName || raw.marketLabel || raw.marketId || "-",
        selection: raw.selection || raw.outcome || "-",
        line: raw.line ?? "-",
        odds: raw.odds ?? row?.odds ?? "-",
        matchedMarketId: row?.matchedMarketId || row?.marketId || "",
        matchedMarketLabel: row?.matchedMarketLabel || row?.marketLabel || "Eşleşmedi",
        matchedBy: row?.matchedBy || "unmatched",
        confidence,
        fixtureStatus: fixture.label,
        fixtureScore,
        qualityScore: Math.max(0, Math.min(100, qualityScore)),
        qualityLabel: mappingQualityLabel(qualityScore),
        duplicateKey
      };
    });
  }

  function buildDryRunQualityRows(mappingRows = []) {
    const seen = new Map();
    return (Array.isArray(mappingRows) ? mappingRows : []).map(row => {
      const key = row.duplicateKey || `${row.source}|${row.fixture}|${row.matchedMarketId}|${row.selection}|${row.line}`;
      const nextCount = (seen.get(key) || 0) + 1;
      seen.set(key, nextCount);
      return {
        ...row,
        duplicate: Boolean(key && nextCount > 1),
        qualityClass: mappingQualityClass(row.qualityScore)
      };
    });
  }

  function summarizeDryRunQuality(qualityRows = []) {
    const rows = Array.isArray(qualityRows) ? qualityRows : [];
    const total = rows.length || 0;
    const summary = { score: 0, high: 0, mid: 0, low: 0, none: 0, duplicates: 0 };
    if (!total) return summary;
    const scoreTotal = rows.reduce((sum, row) => sum + Number(row.qualityScore || 0), 0);
    rows.forEach(row => {
      if (row.duplicate) summary.duplicates += 1;
      if (row.qualityScore >= 85) summary.high += 1;
      else if (row.qualityScore >= 65) summary.mid += 1;
      else if (row.qualityScore > 0) summary.low += 1;
      else summary.none += 1;
    });
    summary.score = Math.round(scoreTotal / total);
    return summary;
  }

  function previewIncomingOddsPayload(payload) {
    const normalized = normalizeIncomingOddsPayload(payload);
    const sourceNames = [...new Set((normalized.rawRecords || []).map(record => {
      const source = findEffectiveSource(canonicalSourceId(record.source || record.sourceId || ""));
      return source ? displaySourceName(source) : (record.source || record.sourceId || "Bilinmeyen kaynak");
    }))];
    const mappingRows = buildDryRunMappingRows(normalized);
    const qualityRows = buildDryRunQualityRows(mappingRows);
    const preview = {
      sourceId: normalized.sourceId,
      sourceName: sourceNames.join(", ") || "-",
      recordCount: normalized.recordCount,
      validRecordCount: normalized.valid ? normalized.recordCount : Math.max(0, normalized.recordCount - normalized.errors.length),
      invalidRecordCount: normalized.valid ? 0 : normalized.errors.length,
      marketIdMatched: 0,
      marketIdUnmatched: 0,
      fixtureMatched: 0,
      fixtureSuspicious: 0,
      errorCount: normalized.errors.length,
      errors: normalized.errors,
      records: normalized.records,
      rawRecords: normalized.rawRecords,
      isPolymarket: normalized.isPolymarket,
      polymarketCount: normalized.polymarketCount || 0,
      bookmakerCount: normalized.bookmakerCount || 0,
      schemaChecks: normalized.schemaChecks || [],
      mappingRows: qualityRows,
      qualityRows,
      qualitySummary: summarizeDryRunQuality(qualityRows),
      dataMode: "Dry-run"
    };
    if (normalized.isPolymarket) return preview;
    const fixtureCandidates = mockOddsRecords();
    normalized.records.forEach(record => {
      const hasMarket = Boolean(record.matchedMarketId || findCatalogMarketById(record.marketId));
      if (hasMarket) preview.marketIdMatched += 1;
      else preview.marketIdUnmatched += 1;
      const fixtureKey = buildFixtureKey(record);
      if (!fixtureKey || fixtureKey.includes("unknown")) {
        preview.fixtureSuspicious += 1;
        return;
      }
      const bestFixture = fixtureCandidates.reduce((best, candidate) => {
        const score = scoreFixtureMatch(record, candidate);
        return score > best.score ? { score, candidate } : best;
      }, { score: 0, candidate: null });
      if (bestFixture.score >= 0.82) preview.fixtureMatched += 1;
      else preview.fixtureSuspicious += 1;
    });
    return preview;
  }

  function rejectInvalidOddsPayload(payload) {
    const validation = validateIncomingOddsPayload(payload);
    return validation.valid ? null : {
      rejected: true,
      reason: "Dry-run payload doğrulaması başarısız.",
      errors: validation.errors,
      recordCount: validation.recordCount
    };
  }

  function getEnabledSources() {
    return effectiveSourceRegistry().filter(isSourceActiveForUi);
  }

  function getSourcesBySport(sport) {
    const key = normalizeSportName(sport || "");
    return effectiveSourceRegistry().filter(source => (source.sports || []).map(normalizeSportName).includes(key));
  }

  function getSourcesByType(type) {
    const key = String(type || "").toLowerCase();
    return effectiveSourceRegistry().filter(source => String(source.type || "").toLowerCase() === key);
  }

  function getSourceCapabilities(sourceId) {
    const source = findEffectiveSource(sourceId);
    if (!source) return null;
    return {
      sourceId: source.sourceId,
      displayName: displaySourceName(source),
      sourceName: displaySourceName(source),
      technicalName: source.technicalName || source.sourceId,
      type: source.type,
      mode: source.mode,
      enabled: isSourceActiveForUi(source),
      sports: [...(source.sports || [])],
      supportedMarketFamilies: [...(source.supportedMarketFamilies || [])],
      requiresKey: Boolean(source.requiresKey),
      authType: source.authType || "none",
      rateLimitNote: source.rateLimitNote || "",
      legalNote: source.legalNote || "",
      adapterStatus: source.adapterStatus || "missing",
      adapterSlot: getAdapterSlot(source.sourceId),
      lastStatus: source.lastStatus || source.mode || "planned"
    };
  }

  function isSourceReadyForLive(sourceId) {
    const source = findEffectiveSource(sourceId);
    if (!source) return false;
    return Boolean(source.enabled && source.mode === "live_ready" && source.adapterStatus === "live_ready" && !source.requiresKey);
  }

  function summarizeSourceRegistry(sourceHealthList = sourceRegistryHealthRows()) {
    return effectiveSourceRegistry().reduce((acc, source) => {
      const health = findSourceRegistryHealth(source.sourceId, sourceHealthList);
      acc.total += 1;
      acc.enabled += source.enabled ? 1 : 0;
      acc.requiresKey += source.requiresKey ? 1 : 0;
      acc.byType[source.type] = (acc.byType[source.type] || 0) + 1;
      acc.byMode[source.mode] = (acc.byMode[source.mode] || 0) + 1;
      if (health) acc.withHealth += 1;
      else acc.planned += 1;
      return acc;
    }, { total: 0, enabled: 0, requiresKey: 0, withHealth: 0, planned: 0, byType: {}, byMode: {} });
  }

  function scoreComparisonCandidate({ bestOddsResult = null, lineDifferenceResult = null, sourceHealth = [] } = {}) {
    const sourceCount = Math.max(Number(bestOddsResult?.sourceCount || 0), Number(lineDifferenceResult?.sourceCount || 0));
    const diff = Math.max(0, Number(bestOddsResult?.bestDiffPercent || 0));
    const spread = Math.max(0, Number(lineDifferenceResult?.lineSpread || 0));
    const confidenceScore = bestOddsResult?.confidence === "high" ? 18 : bestOddsResult?.confidence === "medium" ? 12 : bestOddsResult?.confidence === "low" ? 6 : 0;
    const healthRows = Array.isArray(sourceHealth) ? sourceHealth : [];
    const mapped = healthRows.reduce((sum, row) => sum + Number(row.mappedRecordCount || 0), 0);
    const adapted = healthRows.reduce((sum, row) => sum + Number(row.adaptedRecordCount || 0), 0);
    const healthScore = adapted ? Math.round((mapped / adapted) * 14) : 0;
    const freshnessSource = [
      ...(bestOddsResult?.bestRecord ? [bestOddsResult.bestRecord] : []),
      ...(bestOddsResult?.secondBestRecord ? [bestOddsResult.secondBestRecord] : []),
      ...(lineDifferenceResult?.records || [])
    ];
    const latest = latestUpdatedAt(freshnessSource);
    const ageHours = latest ? Math.max(0, (Date.now() - latest) / 36e5) : 999;
    const freshnessScore = ageHours <= 12 ? 10 : ageHours <= 48 ? 6 : 2;
    let score = Math.round(Math.min(100, Math.max(0,
      Math.min(30, diff * 5) + Math.min(18, Math.max(0, sourceCount - 1) * 9) + confidenceScore +
      Math.min(20, spread * (lineDifferenceResult?.sport === "basketball" ? 4 : 12)) + healthScore + freshnessScore
    )));
    let tag = "Karşılaştırma Adayı";
    if (sourceCount < 2) tag = "Tek Kaynak — yetersiz";
    else if (lineDifferenceResult?.lineSpread > 0) tag = "Barem Farkı";
    else if (diff >= 1.5) tag = "Kaynak Farkı";
    if (bestOddsResult?.confidence === "low" || (bestOddsResult?.bestRecord && !bestOddsResult.bestRecord.matchedMarketId)) tag = "Şüpheli Eşleşme";
    if (tag === "Tek Kaynak — yetersiz") score = Math.min(score, 45);
    return { score, tag, sourceCount, freshnessHours: Number.isFinite(ageHours) ? Number(ageHours.toFixed(1)) : null };
  }

  function calculateBestOdds(list = mockOddsRecords()) {
    return Object.values(groupOddsByFixtureAndMarket(list)).map(group => findBestOddsForGroup(group).bestRecord).filter(Boolean);
  }

  function sourceHealth(recordsList, rawList = MOCK_SOURCE_RAW_RECORDS) {
    if (!Array.isArray(recordsList)) return collectAdapterResults().sourceHealth;
    return buildSourceHealthSummary(
      filterComparisonRecordsBySource(recordsList),
      SOURCE_MARKET_MAPPINGS,
      filterRawSourceRecordsByConfig(rawList)
    );
  }

  function mockOddsSummary() {
    const list = collectAdapterResults().records;
    const matched = list.filter(r => r.matchedMarketId).length;
    const fixtures = new Set(list.map(r => r.fixtureId)).size;
    const health = sourceHealth(list);
    return { records: list.length, matched, fixtures, sources: health.length, mode: getGlobalDataMode(health), lastUpdatedAt: summarizeSourceHealth(health).lastUpdatedAt };
  }

  function comparisonFixtureLabel(record = {}) {
    return `${record.homeTeam || "Ev Sahibi"} - ${record.awayTeam || "Deplasman"}`;
  }

  function comparisonFamilyLabel(family = "") {
    const labels = {
      "football.goals.total_ou": "Toplam Gol",
      "football.home_goals_ou": "Ev Sahibi Gol",
      "football.away_goals_ou": "Deplasman Gol",
      "football.corner.total_ou": "Toplam Korner",
      "basket.total_points_ou": "Toplam Sayı",
      "basket.team1_points_ou": "Takım 1 Sayı",
      "basket.both_teams_points_line_ou_ot": "Her İki Takım Sayı"
    };
    return labels[family] || family || "Market ailesi";
  }

  function comparisonEngineResults(list) {
    if (!Array.isArray(list)) {
      ensureSourceCacheKey();
      if (defaultComparisonEngineCache) return defaultComparisonEngineCache;
    }
    const adapterOutput = Array.isArray(list) ? null : collectAdapterResults();
    const baseList = Array.isArray(list) ? list : adapterOutput.records;
    const safeList = filterComparisonRecordsBySource(getSafeOddsRecords(baseList));
    const health = adapterOutput ? adapterOutput.sourceHealth : getSafeSourceHealth(safeList);
    const healthSummary = summarizeSourceHealth(health);
    const fallbackState = getFallbackComparisonState(safeList);
    const bestRows = Object.values(groupOddsByFixtureAndMarket(safeList)).map(group => {
      const result = findBestOddsForGroup(group);
      const lineDifference = null;
      const score = scoreComparisonCandidate({ bestOddsResult: result, lineDifferenceResult: lineDifference, sourceHealth: health });
      return { group, bestOddsResult: result, lineDifferenceResult: lineDifference, score };
    }).filter(row => row.bestOddsResult.bestRecord)
      .sort((a, b) => b.score.score - a.score.score || Number(b.bestOddsResult.bestDiffPercent || 0) - Number(a.bestOddsResult.bestDiffPercent || 0));
    const lineDifferences = detectLineDifferences(safeList).map(lineDifference => {
      const matchingBest = bestRows.find(row => row.bestOddsResult.bestRecord && oddsFixtureKey(row.bestOddsResult.bestRecord) === lineDifference.fixtureKey && baseMarketFamily(row.bestOddsResult.bestRecord.marketId) === lineDifference.baseMarketFamily);
      const score = scoreComparisonCandidate({ bestOddsResult: matchingBest?.bestOddsResult || null, lineDifferenceResult: lineDifference, sourceHealth: health });
      return { ...lineDifference, score };
    }).sort((a, b) => b.score.score - a.score.score || b.lineSpread - a.lineSpread);
    const candidateRows = bestRows.map(row => {
      const best = row.bestOddsResult.bestRecord;
      const relatedLine = lineDifferences.find(diff => diff.fixtureKey === oddsFixtureKey(best) && diff.baseMarketFamily === baseMarketFamily(best.marketId));
      const score = scoreComparisonCandidate({ bestOddsResult: row.bestOddsResult, lineDifferenceResult: relatedLine || null, sourceHealth: health });
      return { ...row, lineDifferenceResult: relatedLine || null, score };
    }).sort((a, b) => b.score.score - a.score.score || Number(b.bestOddsResult.bestDiffPercent || 0) - Number(a.bestOddsResult.bestDiffPercent || 0));
    const unmatched = safeList.filter(record => !(record.matched || record.matchedMarketId)).length;
    const result = {
      records: safeList,
      groupsByFixture: groupOddsByFixture(safeList),
      groupsByFixtureAndMarket: groupOddsByFixtureAndMarket(safeList),
      groupsByFixtureMarketLine: groupOddsByFixtureMarketLine(safeList),
      groupsBySource: groupOddsBySource(safeList),
      bestRows,
      lineDifferences,
      candidateRows,
      sourceHealth: health,
      summary: {
        records: safeList.length,
        matchedMarkets: safeList.filter(record => record.matchedMarketId).length,
        sources: healthSummary.sources,
        bestOddsCandidates: candidateRows.filter(row => row.bestOddsResult.sourceCount >= 2).length,
        lineDifferenceCandidates: lineDifferences.length,
        unmatched,
        dataMode: healthSummary.dataMode,
        lastUpdatedAt: healthSummary.lastUpdatedAt,
        rawRecords: healthSummary.raw,
        staleSources: healthSummary.stale
      },
      healthSummary,
      fallbackState
    };
    if (!Array.isArray(list)) defaultComparisonEngineCache = result;
    return result;
  }

  const POLYMARKET_EVENT_ADAPTER = {
    sourceId: "polymarket_mock",
    sourceName: "Polymarket Demo",
    eventType: "prediction_market",
    normalizeEvent(rawEvent = {}) {
      return {
        id: rawEvent.id || buildPolymarketEventKey({ category: rawEvent.category, title: rawEvent.title, closesAt: rawEvent.closesAt }),
        source: rawEvent.source || "polymarket_mock",
        title: rawEvent.title || rawEvent.question || "Polymarket marketi",
        category: rawEvent.category || "prediction",
        yesPrice: Number(rawEvent.yesPrice || 0),
        noPrice: Number(rawEvent.noPrice || 0),
        liquidity: Number(rawEvent.liquidity || 0),
        volume24h: Number(rawEvent.volume24h || 0),
        closesInHours: Number(rawEvent.closesInHours || 0),
        tags: Array.isArray(rawEvent.tags) ? rawEvent.tags : [],
        dataMode: rawEvent.dataMode || "mock"
      };
    }
  };

  function polymarketMockAdapterRecords() {
    if (polymarketAdapterRecordsCache) return polymarketAdapterRecordsCache;
    polymarketAdapterRecordsCache = POLYMARKET_MOCK_RECORDS.map(row => {
      const event = POLYMARKET_EVENT_ADAPTER.normalizeEvent(row);
      return {
        ...event,
        bookmaker: event.source,
        sport: "prediction",
        eventType: event.category,
        question: event.title,
        match: event.title,
        marketLabel: "YES / NO",
        outcome: "YES",
        current: event.yesPrice ? 1 / Number(event.yesPrice) : 0,
        opening: event.yesPrice ? 1 / Number(event.yesPrice) : 0,
        referenceProb: event.yesPrice || 0,
        confidence: 76,
        expiresAt: new Date(Date.now() + Number(event.closesInHours || 0) * 36e5).toISOString(),
        info: "Polymarket mock modeli ayrı tutulur; futbol/basket odds adapter sözleşmesiyle karışmaz."
      };
    });
    return polymarketAdapterRecordsCache;
  }

  function validateMockOddsRecords() {
    if (mockOddsValidationDone) return;
    mockOddsValidationDone = true;
    const ids = new Set();
    const errors = [];
    mockOddsRecords().forEach(record => {
      if (!record.id) errors.push("Boş mock id");
      if (ids.has(record.id)) errors.push(`Duplicate mock id: ${record.id}`);
      ids.add(record.id);
      if (!Number.isFinite(Number(record.odds)) || Number(record.odds) <= 0) errors.push(`${record.id}: odds number değil`);
      if (!["football", "basketball"].includes(record.sport)) errors.push(`${record.id}: sport hatalı`);
    });
    if (errors.length) console.warn("Oran Terminali mock odds validation:", errors.slice(0, 8));
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


  function isPolymarketRecord(r) {
    const site = sitesMap()[r?.bookmaker];
    const bookmaker = String(r?.bookmaker || "").toLowerCase();
    const type = String(r?.type || r?.sourceType || site?.type || "").toLowerCase();
    return bookmaker === "polymarket" || type === "prediction_market";
  }

  function records(raw = false) {
    if (state.sport === "polymarket") return [];
    const adapter = collectAdapterResults();
    const list = (adapter.displayRecords || (state.snapshot?.records || [])).filter(r => !isPolymarketRecord(r));
    if (raw) return list;
    const search = normalizeText(state.search || "");
    return list.filter(r => {
      const sportOk = state.sport === "all" || r.sport === state.sport;
      const marketKey = r.market || r.marketId || r.matchedMarketId;
      const category = marketMap()[marketKey]?.categoryId || "";
      const categoryOk = state.marketCategory === "all" || category === state.marketCategory;
      const marketOk = state.marketId === "all" || marketKey === state.marketId || r.market === state.marketId;
      const haystack = normalizeText([r.match, r.league, r.bookmaker, r.source, r.marketLabel, r.outcome, r.info, r.line, r.matchedBy].join(" "));
      const searchOk = !search || textMatchesTokens(haystack, search.split(/\s+/).filter(Boolean));
      return sportOk && categoryOk && marketOk && searchOk;
    });
  }

  function polymarketRecords(raw = false) {
    const list = [...(state.snapshot?.records || []).filter(isPolymarketRecord), ...polymarketMockAdapterRecords()];
    if (raw) return list;
    const search = normalizeText(isPolymarketMode() ? state.marketSearch : state.search || "");
    const tokens = search ? search.split(/\s+/).filter(Boolean) : [];
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
      const haystack = normalizeText([r.question, r.title, r.match, r.category, r.league, r.marketLabel, r.description, r.outcome, r.info, r.eventType, r.timeframe, r.tags, r.yesPrice != null ? "yes" : "", r.noPrice != null ? "no" : "", r.liquidity ? "likidite" : "", r.volume24h ? "24 saat" : ""].join(" "));
      const searchOk = textMatchesTokens(haystack, tokens);
      return filterOk && sportOk && searchOk;
    });
  }

  function sitesMap() {
    const map = {};
    (state.sources?.sites || []).forEach(s => map[s.id] = s);
    return map;
  }


  function historyParts(r) {
    const history = Array.isArray(r.history) ? r.history.slice(-4) : [];
    const parts = [{ label: "İlk Oran", value: money(r.opening), raw: Number(r.opening || 0) }];
    history.forEach((h, idx) => parts.push({ label: `${idx + 1}. Değişim`, value: money(h), raw: Number(h || 0) }));
    parts.push({ label: "Güncel Oran", value: money(r.current), raw: Number(r.current || 0) });
    return parts;
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
      const isMatchWinner = r.rawMarket === "match_winner" || r.market === "match_winner" || baseMarketFamily(r.market || r.marketId || "") === "football.result.full_time_1x2";
      if (!isMatchWinner) return;
      const key = [r.matchId, r.rawMarket || r.market].join("|");
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

  // -------------------------------
  // Polymarket Helpers
  // -------------------------------
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

  function rankPolymarketMockEvents(events = []) {
    return events.map(event => {
      const yes = Number(event.yesPrice || 0);
      const no = Number(event.noPrice || 0);
      const priceSpread = yes && no ? Math.abs(yes - no) : 0;
      const liquidityScore = Math.min(28, Math.log10(Math.max(10, Number(event.liquidity || 0))) * 4);
      const volumeScore = Math.min(24, Math.log10(Math.max(10, Number(event.volume24h || 0))) * 3.8);
      const closeScore = Math.max(0, 22 - Math.max(0, Number(event.closesInHours || 72)) / 3);
      const spreadScore = Math.max(0, 16 - priceSpread * 40);
      const categoryScore = event.category === "sports" || event.category === "crypto" ? 8 : 4;
      return { ...event, priceSpread, score: Math.round(Math.min(100, liquidityScore + volumeScore + closeScore + spreadScore + categoryScore)) };
    }).sort((a, b) => b.score - a.score || Number(b.volume24h || 0) - Number(a.volume24h || 0));
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

  function snapshotStatusLabel(status) {
    const labels = { loaded: "Yüklendi", missing: "Bulunamadı", error: "Hata" };
    return labels[String(status || "").toLowerCase()] || "Bulunamadı";
  }

  function staticSnapshotSummary() {
    const adapter = collectAdapterResults();
    const display = adapter.displayRecords || [];
    const matched = display.filter(row => row.matchedMarketId).length;
    return {
      file: DATA_SNAPSHOT,
      status: state.snapshotMeta?.status || (display.length ? "loaded" : "missing"),
      records: display.length,
      matched,
      unmatched: Math.max(0, display.length - matched),
      sources: new Set(display.map(row => row.bookmaker || row.source).filter(Boolean)).size,
      dataMode: adapter.dataMode || "fallback",
      lastReadAt: state.snapshotMeta?.loadedAt || state.lastLoadedAt || adapter.healthSummary?.lastUpdatedAt || null,
      message: state.snapshotMeta?.message || "Snapshot durumu bilinmiyor."
    };
  }

  function snapshotReadinessSummary() {
    const adapter = collectAdapterResults();
    const display = adapter.displayRecords || [];
    const bookmakerRows = display.filter(row => !isPolymarketRecord(row));
    const matched = bookmakerRows.filter(row => row.matchedMarketId || row.marketId).length;
    const sources = new Set(bookmakerRows.map(row => row.bookmaker || row.source).filter(Boolean));
    const fixtures = new Set(bookmakerRows.map(row => row.matchId || row.fixtureId || row.match).filter(Boolean));
    const markets = new Set(bookmakerRows.map(row => row.matchedMarketId || row.marketId || row.market).filter(Boolean));
    const valueCandidates = getValueAlerts(bookmakerRows).length;
    const dropCandidates = getDropAlerts(bookmakerRows).length;
    const lineGapCandidates = getLineGaps(bookmakerRows).length;
    return {
      records: bookmakerRows.length,
      matched,
      unmatched: Math.max(0, bookmakerRows.length - matched),
      sources: sources.size,
      fixtures: fixtures.size,
      markets: markets.size,
      valueCandidates,
      dropCandidates,
      lineGapCandidates,
      dataMode: adapter.dataMode || "fallback",
      lastReadAt: state.snapshotMeta?.loadedAt || state.lastLoadedAt || null
    };
  }

  function dataFlowStatusSummary() {
    const adapter = collectAdapterResults();
    const readiness = snapshotReadinessSummary();
    const healthRows = Array.isArray(adapter.sourceHealth) ? adapter.sourceHealth : [];
    const activeRows = healthRows.filter(row => Number(row.adaptedRecordCount || row.mappedRecordCount || 0) > 0 || ["mock", "static_snapshot", "dry_run"].includes(String(row.status || row.mode || "").toLowerCase()));
    const activeSource = activeRows.length
      ? activeRows.slice(0, 3).map(row => displaySourceName(row)).filter(Boolean).join(", ")
      : adapter.dataMode === "dry_run" ? "Dry-run payload"
        : adapter.dataMode === "static_snapshot" ? "Statik snapshot"
          : adapter.dataMode === "fallback" ? "Mock/Fallback"
            : "Hazırlık modu";
    return {
      dataMode: adapter.dataMode || readiness.dataMode || "fallback",
      externalApi: LIVE_API_CONNECTION_ENABLED ? "Açık" : "Kapalı",
      autoBetting: AUTO_BETTING_ENABLED ? "Açık" : "Kapalı",
      activeSource: activeSource || "Hazırlık modu",
      matched: readiness.matched,
      unmatched: readiness.unmatched,
      lastReadAt: readiness.lastReadAt || adapter.healthSummary?.lastUpdatedAt || state.lastLoadedAt || null,
      priority: adapter.dataModePriority || "dry-run → statik snapshot → mock/fallback"
    };
  }

  function renderDataFlowStatusBand() {
    const flow = dataFlowStatusSummary();
    const cells = [
      ["Veri modu", displayModeLabel(flow.dataMode)],
      ["Dış API", flow.externalApi],
      ["Otomatik oynama", flow.autoBetting],
      ["Aktif kaynak", flow.activeSource],
      ["Eşleşen / eşleşmeyen", `${flow.matched} / ${flow.unmatched}`],
      ["Son okuma", formatSourceUpdatedAt(flow.lastReadAt)]
    ];
    return `<section class="v577-flow-band" aria-label="Veri Akışı Durumu">
      <div class="v577-flow-title">
        <span>Veri Akışı Durumu</span>
        <b>Canlı veri değildir</b>
      </div>
      <div class="v577-flow-cells">${cells.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value || "-"))}</b></article>`).join("")}</div>
      <p>${escapeHtml(flow.priority)} · Futbol/Basket bookmaker akışı ve POLYMARKET YES/NO akışı ayrı tutulur.</p>
    </section>`;
  }

  function renderSnapshotReadinessPanel() {
    const s = snapshotReadinessSummary();
    const rows = [
      ["Snapshot Kayıt", s.records],
      ["Kaynak", s.sources],
      ["Maç", s.fixtures],
      ["Market", s.markets],
      ["Eşleşen", s.matched],
      ["Eşleşmeyen", s.unmatched],
      ["Değerli Oran Adayı", s.valueCandidates],
      ["Oran Düşüşü", s.dropCandidates],
      ["Barem Farkı", s.lineGapCandidates],
      ["Veri Modu", displayModeLabel(s.dataMode)]
    ];
    return `<section class="v574-snapshot-readiness" aria-label="Statik Snapshot Hazırlık Özeti">
      <div class="v554-mock-preview-head compact">
        <div>
          <span>Statik Snapshot Hazırlık Özeti</span>
          <h3>Gerçek Veri Öncesi Kontrol</h3>
          <p>Repo içindeki snapshot verisi market eşleşmesi, kaynak sayısı ve aday üretimi için kontrol edilir. Canlı veri değildir.</p>
        </div>
        <em>Dış API kapalı · Otomatik oynama kapalı</em>
      </div>
      <div class="v574-readiness-grid">${rows.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(String(value))}</span></article>`).join("")}</div>
      <p class="v574-readiness-note">Bu özet sadece statik/dry-run hattını denetler. Futbol ve basket market katalogları veri gelmese bile görünür kalır.</p>
    </section>`;
  }

  function renderDataModeNotice() {
    const adapter = collectAdapterResults();
    const snap = staticSnapshotSummary();
    return `<section class="v568-data-mode" aria-label="Veri modu güvenlik bilgisi">
      <div><span>Veri modu</span><b>${escapeHtml(displayModeLabel(adapter.dataMode || snap.dataMode))}</b></div>
      <div><span>Dış API bağlantısı</span><b>Kapalı</b></div>
      <div><span>Otomatik oynama</span><b>Kapalı</b></div>
      <div><span>Öncelik</span><b>Dry-run → Statik Snapshot → Mock/Fallback</b></div>
      <p>Bu ekran statik snapshot/demo karşılaştırmasıdır. Canlı veri değildir; harici API, scraping ve otomatik bahis kapalıdır.</p>
    </section>`;
  }

  function renderStaticSnapshotStatusPanel() {
    const snap = staticSnapshotSummary();
    return `<section class="v568-static-snapshot" aria-label="Statik Snapshot Durumu">
      <div class="v554-mock-preview-head compact">
        <div><span>Statik Snapshot Durumu</span><h3>Statik Snapshot Durumu</h3><p>Repo içindeki statik JSON, adapter pipeline üstünden demo karşılaştırmaya bağlanır. Canlı veri değildir.</p></div>
        <em>Dış API: Kapalı</em>
      </div>
      <div class="v568-snapshot-grid">
        <article><b>Dosya</b><span>${escapeHtml(snap.file)}</span></article>
        <article><b>Durum</b><span>${escapeHtml(snapshotStatusLabel(snap.status))}</span></article>
        <article><b>Kayıt sayısı</b><span>${snap.records}</span></article>
        <article><b>Eşleşen market</b><span>${snap.matched}</span></article>
        <article><b>Eşleşmeyen market</b><span>${snap.unmatched}</span></article>
        <article><b>Son okuma</b><span>${escapeHtml(formatSourceUpdatedAt(snap.lastReadAt))}</span></article>
        <article><b>Dış API</b><span>Kapalı</span></article>
      </div>
      <p>${escapeHtml(snap.message)} Mock/fallback akışı ve Futbol/Basketbol market katalogları korunur.</p>
    </section>`;
  }

  function renderStaticSourcesPanel() {
    const sources = Array.isArray(state.sources?.sites) ? state.sources.sites : [];
    const groups = Array.isArray(state.sources?.groups) ? state.sources.groups : [];
    const categories = Array.isArray(state.sources?.marketCategories) ? state.sources.marketCategories : [];
    const groupNames = groups.map(group => group.name || group.id).filter(Boolean).slice(0, 8);
    const sourceNames = sources.map(site => site.name || site.id).filter(Boolean).slice(0, 12);
    return `<section class="v568-static-sources" aria-label="Statik Kaynak Listesi">
      <div class="v554-mock-preview-head compact">
        <div><span>Statik Kaynak Listesi</span><h3>odds-sources.json Özeti</h3><p>Bu panel yalnızca repo içi statik kaynak bilgisini gösterir; internal source_book_01 sistemiyle çakışmaz.</p></div>
        <em>${escapeHtml(snapshotStatusLabel(state.sourcesMeta?.status))}</em>
      </div>
      <div class="v568-snapshot-grid">
        <article><b>Kaynak sayısı</b><span>${sources.length}</span></article>
        <article><b>Kaynak grubu</b><span>${groups.length}</span></article>
        <article><b>Market kategori sayısı</b><span>${categories.length}</span></article>
        <article><b>Son okuma</b><span>${escapeHtml(formatSourceUpdatedAt(state.sourcesMeta?.loadedAt || state.lastLoadedAt))}</span></article>
      </div>
      <div class="v568-static-list"><b>Gruplar</b><span>${escapeHtml(groupNames.join(", ") || "Yok")}</span></div>
      <div class="v568-static-list"><b>Kaynaklar</b><span>${escapeHtml(sourceNames.join(", ") || "Yok")}</span></div>
    </section>`;
  }



  // -------------------------------
  // Render Helpers
  // -------------------------------
  function footballMenuIconHtml() {
    return `<i class="fa-solid fa-futbol"></i>`;
  }

  function basketballMenuIconHtml() {
    return `<i class="fa-solid fa-basketball"></i>`;
  }

  function polyMarkSvg() {
    return `<svg class="v544-poly-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path class="v544-poly-outline" d="M13 11 53 4c4-.7 7 2.2 7 6.2v43.6c0 4-3 6.9-7 6.2l-40-7c-3.5-.6-6-3.5-6-7V18c0-3.5 2.5-6.4 6-7Z"/>
      <path class="v544-poly-line" d="M16 18 48 30.5 16 44"/>
      <path class="v544-poly-line" d="M16 18v26"/>
      <path class="v544-poly-line" d="M30 23.5v14"/>
    </svg>`;
  }

  function categoryButton(key, label, icon = "") {
    const active = state.sport === key ? "active" : "";
    const iconHtml = icon ? `<span class="odds-cat-icon" aria-hidden="true">${icon}</span>` : "";
    return `<button type="button" class="odds-cat-button ${active} ${escapeAttr(key)}" data-odds-sport-btn="${escapeAttr(key)}">${iconHtml}<span class="odds-cat-label">${escapeHtml(label)}</span></button>`;
  }

  function marketSearchPlaceholder() {
    if (state.sport === "football") return "Futbol marketi ara: 2.5 gol, korner, isabetli şut, art arda gol...";
    if (state.sport === "basketball") return "Basketbol marketi ara: 68.5 üst, oyuncu faul, ilk 10 sayı, ribaund...";
    if (state.sport === "polymarket") return "Polymarket ara: spor, kripto, kısa vade, yüksek likidite...";
    return "Market ara: 2.5 gol, korner, oyuncu faul, 68.5 üst...";
  }

  function renderCategoryRow() {
    return `<div class="v544-category-row" data-odds-category-row="1" role="group" aria-label="Oran Terminali ana kategori seçimi">
      ${categoryButton("all", "TÜMÜ")}
      ${categoryButton("football", "FUTBOL", footballMenuIconHtml())}
      ${categoryButton("basketball", "BASKETBOL", basketballMenuIconHtml())}
      ${categoryButton("polymarket", "POLYMARKET", polyMarkSvg())}
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

        ${renderDataFlowStatusBand()}

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
            ${tabButton("markets", "Marketler")}
            ${tabButton("opportunities", "Fırsat Radarı")}
            ${tabButton("all-sites", "Oran Karşılaştırma")}
            ${tabButton("drops", "Oran Hareketleri")}
            ${tabButton("sources", "Kaynaklar")}
          </div>
        </div>

        <div class="odds-v528-content odds-tab-${escapeAttr(state.tab)}" data-odds-content data-odds-active-tab="${escapeAttr(state.tab)}">${content()}</div>
      </div>`;
  }

  function tabButton(key, label) {
    return `<button type="button" class="${state.tab === key ? "active" : ""}" data-odds-tab="${key}">${label}</button>`;
  }


  const MAIN_MARKET_CATEGORY_IDS = ["v546_football_result", "v546_football_goals", "v546_football_corners", "v546_basket_main", "v546_basket_race"];

  const MARKET_GROUP_FILTERS = {
    football: [
      ["all", "Tümünü Göster"], ["result", "Maç Sonucu"], ["goals", "Gol"], ["first_half", "İlk Yarı"],
      ["second_half", "İkinci Yarı"], ["corners", "Korner"], ["cards", "Kart"], ["handicap", "Handikap"],
      ["stats", "İstatistik"], ["players", "Oyuncu"], ["specials", "Özel Bahisler"]
    ],
    basketball: [
      ["all", "Tümünü Göster"], ["match", "Maç"], ["first_half", "İlk Yarı"], ["second_half", "İkinci Yarı"],
      ["q1", "1. Çeyrek"], ["q2", "2. Çeyrek"], ["q3", "3. Çeyrek"], ["q4", "4. Çeyrek"],
      ["team", "Takım"], ["players", "Oyuncu"], ["stats", "İstatistik"], ["specials", "Özel"]
    ]
  };

  const FOOTBALL_CATEGORY_FILTERS = {
    v546_football_result: ["result", "first_half", "second_half"],
    v546_football_result_total_combos: ["result", "goals"],
    v546_football_goals: ["goals", "first_half", "second_half"],
    v546_football_team_goals: ["goals", "first_half", "second_half"],
    v546_football_goal_time: ["goals", "specials"],
    v546_football_halves: ["first_half", "second_half", "handicap", "goals"],
    v546_football_corners: ["corners", "first_half", "second_half"],
    v546_football_cards: ["cards", "first_half", "second_half", "players"],
    v546_football_handicap: ["handicap"],
    v546_football_players: ["players"],
    v546_football_stats: ["stats", "first_half", "second_half"],
    v546_football_streak_goals: ["goals", "specials"],
    v546_football_win_margin: ["result", "specials"],
    v546_football_penalties: ["specials"]
  };

  const BASKETBALL_CATEGORY_FILTERS = {
    v546_basket_main: ["match", "first_half", "second_half"],
    v546_basket_quarters: ["q1", "q2", "q3", "q4"],
    v546_basket_team_points: ["team", "first_half", "second_half", "q1", "q2", "q3", "q4"],
    v546_basket_team_handicap: ["team", "first_half", "second_half", "q1", "q2", "q3", "q4"],
    v546_basket_race: ["specials", "q1", "q2", "q3", "q4"],
    v546_basket_player_points: ["players", "q1", "first_half"],
    v546_basket_player_reb_ast: ["players"],
    v546_basket_player_defense_foul: ["players"],
    v546_basket_team_stats: ["stats", "team"],
    v546_basket_specials: ["specials", "first_half", "q1", "q4"],
    v546_basket_quarter_wins: ["specials", "q1", "q2", "q3", "q4"],
    v546_basket_player_alt_lines: ["players", "specials"]
  };

  function marketGroupFiltersForSport() {
    return MARKET_GROUP_FILTERS[state.sport] || [];
  }

  function currentMarketGroupFilter() {
    const filters = marketGroupFiltersForSport();
    const selected = state.marketGroupFilter || "all";
    return filters.some(([key]) => key === selected) ? selected : "all";
  }

  function categoryMatchesMarketGroup(cat) {
    const selected = currentMarketGroupFilter();
    if (selected === "all" || state.sport === "all") return true;
    const source = state.sport === "football" ? FOOTBALL_CATEGORY_FILTERS : BASKETBALL_CATEGORY_FILTERS;
    return (source[cat.id] || []).includes(selected);
  }

  function renderMarketGroupFilters() {
    const filters = marketGroupFiltersForSport();
    if (!filters.length) return "";
    const selected = currentMarketGroupFilter();
    return `<div class="v552-market-group-filters" role="group" aria-label="Market iç filtreleri">
      ${filters.map(([key, label]) => `<button type="button" class="${selected === key ? "active" : ""}" data-market-group-filter="${escapeAttr(key)}">${escapeHtml(label)}</button>`).join("")}
    </div>`;
  }

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
    const order = new Map(marketCategories().map((c, index) => [c.id, index]));
    return [...cats].sort((a, b) => {
      const ap = pinned.has(a.id) ? 0 : 1;
      const bp = pinned.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const am = main.has(a.id) ? 0 : 1;
      const bm = main.has(b.id) ? 0 : 1;
      if (am !== bm) return am - bm;
      return (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999);
    });
  }

  function marketSearchItems() {
    const query = normalizeText(state.marketSearch || "");
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];

    const cats = marketCategories().filter(categoryMatchesMarketGroup).map(cat => {
      const catSearch = normalizeText([cat.name, cat.desc, cat.id, categorySport(cat)].join(" "));
      const catMatches = textMatchesTokens(catSearch, tokens);
      const markets = (cat.markets || []).filter(m => {
        const hay = m._searchText || searchTextForMarket(cat, m);
        return !tokens.length || catMatches || textMatchesTokens(hay, tokens);
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
    if (isPolymarketMode()) return state.tab === "markets" ? renderPolymarketMarkets() : renderPolymarket();
    if (state.tab === "all-sites") return renderAllSitesCompare();
    if (state.tab === "markets") return renderMarkets();
    if (state.tab === "drops") return renderDrops();
    if (state.tab === "sources") return renderSources();
    return renderOpportunities();
  }

  function renderPolymarketMarkets() {
    return `<div class="v546-market-search-panel">
      <label for="odds-v546-market-search">Marketler</label>
      <input id="odds-v546-market-search" type="search" placeholder="${escapeAttr(marketSearchPlaceholder())}" value="${escapeAttr(state.marketSearch || "")}">
      <div class="v546-market-meta"><span>POLYMARKET</span><span>Spor · kripto · kısa vade · yüksek likidite</span></div>
    </div>${renderPolymarket()}`;
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

      ${list.length ? `<div class="v541-poly-grid">${list.map(renderPolymarketCard).join("")}</div>` : empty(state.marketSearch ? "Bu aramayla eşleşen Polymarket demo marketi bulunamadı." : "Polymarket kaydı yok. odds-snapshot.json içine bookmaker: polymarket kayıtları gelince burada görünecek.")}
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
          <small>${escapeHtml(r.league || r.eventType || "Tahmin Marketi")} · ${escapeHtml(r.marketLabel || "Market")}</small>
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

  function renderOpportunityRadarStatus() {
    const comparison = comparisonEngineResults();
    const candidate = comparison.candidateRows.find(row => row.bestOddsResult?.sourceCount >= 2) || comparison.candidateRows[0];
    const best = candidate?.bestOddsResult?.bestRecord || null;
    const sourceDiff = comparison.candidateRows.find(row => Number(row.bestOddsResult?.bestDiffPercent || 0) > 0 && row.bestOddsResult?.sourceCount >= 2) || candidate;
    const lineDiff = comparison.lineDifferences[0] || candidate?.lineDifferenceResult || null;
    const cells = [
      ["Statik Snapshot Adayı", best ? `${comparisonFixtureLabel(best)} · ${money(best.odds)}` : "Aday yok", best ? (best.matchedMarketLabel || best.marketLabel || best.marketId || "Market") : "Market katalogları görünür kalır"],
      ["Kaynak Farkı Adayı", sourceDiff?.bestOddsResult?.bestRecord ? `${money(sourceDiff.bestOddsResult.bestRecord.odds)} · ${plainPct(sourceDiff.bestOddsResult.bestDiffPercent || 0)}` : "Aday yok", sourceDiff?.bestOddsResult?.sourceCount ? `${sourceDiff.bestOddsResult.sourceCount} kaynak karşılaştırıldı` : "En az iki kaynak beklenir"],
      ["Barem Farkı Adayı", lineDiff ? `${lineDiff.lineSpread} barem farkı` : "Aday yok", lineDiff ? comparisonFamilyLabel(lineDiff.baseMarketFamily) : "Barem farkı yok"],
      ["Canlı Veri Değildir", "Dış API kapalı", "Otomatik oynama kapalı · sadece ön kontrol"]
    ];
    return `<section class="v578-radar-status" aria-label="Fırsat Radarı gerçek veri öncesi durum">
      ${cells.map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value || "-"))}</b><small>${escapeHtml(String(note || ""))}</small></article>`).join("")}
    </section>`;
  }

  function renderOpportunities() {
    const values = getValueAlerts().slice(0, 5);
    const lines = getLineGaps().slice(0, 5);
    const drops = getDropAlerts().slice(0, 5);

    return `
      ${renderOpportunityRadarStatus()}
      <div class="odds-v528-grid">
        ${panel("Statik Snapshot Adayı", renderValueList(values), "purple")}
        ${panel("Kaynak Farkı Adayı", renderSourceDiffList(), "green")}
        ${panel("Barem Farkı Adayı", renderLineList(lines), "blue")}
        ${panel("Oran Hareketi Adayı", renderDropList(drops), "red")}
      </div>
      ${renderOpportunityComparisonDemoCard()}
      <p class="v568-live-disclaimer">Fırsat Radarı yalnızca statik snapshot adayı / kaynak farkı adayı / barem farkı adayı üretir. Canlı veri değildir.</p>
      ${renderPolymarketDock()}`;
  }

  function panel(title, html, tone = "") {
    return `<section class="odds-v528-panel ${tone}">
      <div class="odds-v528-panel-head"><h3>${title}</h3></div>
      ${html || empty("Şimdilik fırsat yok.")}
    </section>`;
  }

  function renderComparisonSummaryBoxes(data) {
    const summary = data.summary || {};
    return `<div class="v557-comparison-kpis" aria-label="Demo karşılaştırma özeti">
      <div><span>Kaynak</span><b>${summary.sources || 0}</b></div>
      <div><span>Eşleşen kayıt</span><b>${summary.matchedMarkets || 0}</b></div>
      <div><span>Eşleşmeyen</span><b>${summary.unmatched || 0}</b></div>
      <div><span>Veri modu</span><b>${escapeHtml(displayModeLabel(summary.dataMode || "mock"))}</b></div>
      <div><span>Son güncelleme</span><b>${escapeHtml(formatSourceUpdatedAt(summary.lastUpdatedAt))}</b></div>
      <div><span>Barem adayı</span><b>${summary.lineDifferenceCandidates || 0}</b></div>
    </div>`;
  }

  function renderSourceStateNotice(status, message) {
    const badge = getSourceHealthBadge({ status, mode: status === "mock" ? "mock" : "empty" });
    return `<div class="v558-state-note ${escapeAttr(badge.className)}" role="status">
      <b>${escapeHtml(displayStatusLabel(badge.label))}</b><span>${escapeHtml(message)}</span>
    </div>`;
  }

  function renderComparisonHealth(data) {
    const rows = data.sourceHealth || [];
    const summary = data.healthSummary || summarizeSourceHealth(rows);
    if (!rows.length) return renderSourceStateNotice("empty", "Bu filtre için eşleşen kaynak verisi yok.");
    return `<div class="v557-comparison-health" aria-label="Kaynak sağlığı özeti">
      <span><b>Kaynak: ${summary.sources}</b><em>Mod: ${escapeHtml(displayModeLabel(summary.dataMode))}</em></span>
      <span><b>Eşleşme: ${summary.mapped}/${summary.adapted}</b><em>Eşleşmeyen: ${summary.unmapped}</em></span>
      <span><b>Son güncelleme</b><em>${escapeHtml(formatSourceUpdatedAt(summary.lastUpdatedAt))}</em></span>
      ${rows.map(row => {
        const badge = getSourceHealthBadge(row);
        return `<span class="${escapeAttr(badge.className)}"><b>${escapeHtml(displaySourceName(row))}</b> ${row.mappedRecordCount}/${row.rawRecordCount} eşleşti <em>${escapeHtml(displayStatusLabel(badge.label))} · ${escapeHtml(row.message || "")}</em></span>`;
      }).join("")}
    </div>`;
  }

  function renderComparisonRows(data) {
    const rows = (data.candidateRows || []).slice(0, 8);
    if (!data.fallbackState?.usable) return empty("Karşılaştırma için yeterli kaynak yok. Katalog manuel kontrol için Marketler sekmesinde görünür kalır.");
    if (!rows.length) return empty("Bu filtre için eşleşen kaynak verisi yok.");
    return `<div class="v557-comparison-table" role="region" aria-label="En iyi oran demo karşılaştırma tablosu">
      <table>
        <thead><tr><th>Maç</th><th>Market</th><th>Seçim</th><th>Barem</th><th>En iyi kaynak</th><th>En iyi oran</th><th>İkinci en iyi</th><th>Fark %</th><th>Kaynak sayısı</th><th>Aday etiketi</th></tr></thead>
        <tbody>${rows.map(row => {
          const best = row.bestOddsResult.bestRecord;
          const second = row.bestOddsResult.secondBestRecord;
          return `<tr>
            <td><b>${escapeHtml(comparisonFixtureLabel(best))}</b><small>${escapeHtml(best.league || best.sport || "")}</small></td>
            <td>${escapeHtml(best.matchedMarketLabel || best.marketLabel || best.marketId || "-")}</td>
            <td>${escapeHtml(best.selection || "-")}</td>
            <td>${best.line ?? "-"}</td>
            <td>${escapeHtml(best.source || "-")}</td>
            <td class="odd">${money(best.odds)}</td>
            <td>${second ? `${escapeHtml(second.source || "-")} · ${money(second.odds)}` : "-"}</td>
            <td>${second ? plainPct(row.bestOddsResult.bestDiffPercent) : "-"}</td>
            <td>${row.bestOddsResult.sourceCount}</td>
            <td><span class="v557-candidate-tag">${escapeHtml(row.score.tag)}</span><small>Skor ${row.score.score}/100 · demo</small></td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderLineDifferencePreview(data) {
    const rows = data.lineDifferences.slice(0, 6);
    if (!rows.length) return "";
    return `<section class="v557-line-preview" aria-label="Barem farkı önizlemesi">
      <div class="v557-section-title"><span>BAREM FARKI ÖNİZLEMESİ</span><b>Analitik fark göstergesi — gerçek sinyal değildir.</b></div>
      <div class="v557-line-grid">${rows.map(row => {
        const sample = row.records[0] || {};
        const sources = [...new Set(row.records.map(record => record.source || record.bookmaker || "bilinmeyen_kaynak"))];
        const minLine = Math.min(...row.lines);
        const maxLine = Math.max(...row.lines);
        return `<article class="${escapeAttr(row.severity)}">
          <b>${escapeHtml(comparisonFixtureLabel(sample))}</b>
          <span>${escapeHtml(comparisonFamilyLabel(row.baseMarketFamily))} / ${minLine} ↔ ${maxLine} / fark ${row.lineSpread}</span>
          <small>${escapeHtml(sources.join(", "))} · ${escapeHtml(row.severity)} · skor ${row.score.score}/100</small>
        </article>`;
      }).join("")}</div>
    </section>`;
  }



  function readinessChecklistItems() {
    return [
      ["Market ID/alias hazır", true],
      ["Maç eşleştirme hazır", true],
      ["Kaynak kayıtları hazır", true],
      ["Kaynak durumu hazır", true],
      ["Adapter çalıştırıcı hazır", true],
      ["Gerçek API bağlantısı kapalı", !LIVE_API_CONNECTION_ENABLED]
    ];
  }

  function renderReadinessChecklist() {
    return `<div class="v562-readiness-checklist" aria-label="Canlı geçiş hazırlık listesi">
      ${readinessChecklistItems().map(([label, ok]) => `<span class="${ok ? "ready" : "blocked"}"><i class="fa-solid ${ok ? "fa-check" : "fa-xmark"}"></i>${escapeHtml(label)}</span>`).join("")}
    </div>`;
  }

  function renderComparisonReadableDigest(data) {
    const candidate = data.candidateRows.find(row => row.bestOddsResult?.sourceCount >= 2) || data.candidateRows[0];
    const best = candidate?.bestOddsResult?.bestRecord || null;
    const second = candidate?.bestOddsResult?.secondBestRecord || null;
    const lineDiff = candidate?.lineDifferenceResult || data.lineDifferences[0] || null;
    const matchStatus = `${data.summary.matchedMarkets || 0} eşleşen · ${data.summary.unmatched || 0} eşleşmeyen`;
    const cells = [
      ["En iyi oran adayı", best ? `${money(best.odds)} · ${best.source || "-"}` : "Aday yok", best ? `${comparisonFixtureLabel(best)} · ${best.matchedMarketLabel || best.marketLabel || best.marketId || "Market"}` : "Market kataloğu manuel kontrol için açık kalır"],
      ["Kaynak farkı", second ? `${plainPct(candidate.bestOddsResult.bestDiffPercent || 0)} fark` : "Yetersiz kaynak", second ? `${best?.source || "-"} ↔ ${second.source || "-"}` : "En az iki kaynak beklenir"],
      ["Barem farkı", lineDiff ? `${lineDiff.lineSpread} barem` : "Barem farkı yok", lineDiff ? `${comparisonFamilyLabel(lineDiff.baseMarketFamily)} · ${lineDiff.records?.length || 0} kayıt` : "Aynı market ailesinde farklı barem yok"],
      ["Eşleşme durumu", matchStatus, `Mod: ${displayModeLabel(data.summary.dataMode || "mock")}`],
      ["Canlı veri değildir", "Dış API kapalı", "Gerçek canlı oran / otomatik bahis sonucu değildir"]
    ];
    return `<section class="v578-comparison-digest" aria-label="Oran Karşılaştırma okunur özet">
      ${cells.map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value || "-"))}</b><small>${escapeHtml(String(note || ""))}</small></article>`).join("")}
    </section>`;
  }

  function renderComparisonEnginePanel() {
    const data = comparisonEngineResults();
    return `<section class="v557-comparison-engine" aria-label="Kaynaklar Arası Karşılaştırma Motoru">
      <div class="v554-mock-preview-head v557-comparison-head">
        <div>
          <span>Statik snapshot karşılaştırması</span>
          <h3>Oran Karşılaştırma</h3>
          <p>Statik snapshot/dry-run kayıtlarıyla en iyi oran adayı, kaynak farkı, barem farkı ve eşleşme durumu okunur şekilde kontrol edilir. Canlı veri değildir.</p>
        </div>
        <em>Gerçek API yok · otomatik bahis yok</em>
      </div>
      ${renderComparisonReadableDigest(data)}
      ${renderDataModeNotice()}
      ${renderStaticSnapshotStatusPanel()}
      ${renderComparisonSummaryBoxes(data)}
      ${renderReadinessChecklist()}
      ${renderComparisonHealth(data)}
      ${renderComparisonRows(data)}
      ${renderLineDifferencePreview(data)}
      ${renderDryRunComparisonPreview()}
    </section>`;
  }

  function renderOpportunityComparisonDemoCard() {
    const data = comparisonEngineResults();
    const candidate = data.candidateRows.find(row => row.bestOddsResult.sourceCount >= 2) || data.candidateRows[0];
    if (!data.fallbackState?.usable || !candidate?.bestOddsResult?.bestRecord) {
      return renderSourceStateNotice("empty", "Şu anda demo karşılaştırma adayı yok. Market kataloğu manuel kontrol için Marketler sekmesinde durur.");
    }
    const best = candidate.bestOddsResult.bestRecord;
    return `<section class="v557-opportunity-demo-card" aria-label="Demo karşılaştırma adayı">
      <div>
        <span>Statik snapshot adayı · Demo karşılaştırma adayı</span>
        <b>${escapeHtml(comparisonFixtureLabel(best))}</b>
        <small>${escapeHtml(best.matchedMarketLabel || best.marketLabel || best.marketId || "Market")} · ${escapeHtml(best.selection || "-")} · barem ${best.line ?? "-"}</small>
      </div>
      <div><b>${money(best.odds)}</b><small>${escapeHtml(best.source || "-")} · ${escapeHtml(candidate.score.tag)} · skor ${candidate.score.score}/100</small></div>
      <p>Bu kart canlı veri değildir; yalnızca statik snapshot adayı / demo karşılaştırma adayıdır ve otomatik bahis sonucu ifade etmez.</p>
    </section>`;
  }

  function renderAllSitesCompare() {
    const groups = compareGroups();
    const compareHtml = !groups.length ? empty("Aynı market için en az iki sitede oran gelince burada tüm siteler yan yana görünecek.") : `<div class="v530-compare-list">${groups.map(g => {
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
    return `${renderComparisonEnginePanel()}${compareHtml}${renderMockAdapterPreview()}${renderFixtureMatchPreview()}`;
  }

  function renderMockAdapterBadges() {
    const s = mockOddsSummary();
    return `<div class="v554-mock-adapter-badges" aria-label="Demo odds adapter özeti">
      <span>Demo eşleşme: <b>${s.matched}</b></span>
      <span>Kaynak: <b>demo</b></span>
      <span>Veri modu: <b>${escapeHtml(displayModeLabel(s.mode))}</b></span>
    </div>`;
  }

  function mockMatchCountForMarket(marketIdValue) {
    return mockOddsRecords().filter(record => record.matchedMarketId === marketIdValue || record.marketId === marketIdValue).length;
  }

  function renderMockMarketHint(marketIdValue) {
    const count = mockMatchCountForMarket(marketIdValue);
    return count ? `<span class="v554-mock-market-hint" aria-label="Demo eşleşme sayısı">demo: ${count}</span>` : "";
  }

  function mappingStatus(row) {
    if (row.matched || row.matchedMarketId) {
      return Number(row.confidence || 0) >= 0.75 ? "matched" : "review";
    }
    return "unmatched";
  }

  function mappingStatusLabel(status) {
    if (status === "matched") return "eşleşti";
    if (status === "review") return "şüpheli";
    return "eşleşmedi";
  }

  function renderSourceHealthPreview() {
    const rows = getSafeSourceHealth();
    if (!rows.length) return renderSourceStateNotice("empty", "Kaynaklar hazırlanıyor veya bu filtre için eşleşen kaynak verisi yok.");
    return `<div class="v556-source-health" aria-label="Kaynak durumları">
      <b>Kaynak durumları</b>
      <div>${rows.map(row => {
        const badge = getSourceHealthBadge(row);
        return `<span class="${escapeAttr(badge.className)}">
          <strong>${escapeHtml(displaySourceName(row))}</strong>
          <em>${escapeHtml(displayStatusLabel(badge.label))} · mod: ${escapeHtml(displayModeLabel(row.mode))}</em>
          <small>${row.mappedRecordCount}/${row.rawRecordCount} eşleşti · ${row.unmappedRecordCount} açık · ${escapeHtml(formatSourceUpdatedAt(row.lastUpdatedAt))}</small>
        </span>`;
      }).join("")}</div>
    </div>`;
  }

  function renderMockAdapterPreview() {
    const rows = mockOddsRecords().slice(0, 16);
    if (!rows.length) return "";
    return `<section class="v554-mock-preview v556-source-adapter-preview" aria-label="Kaynak adapter eşleşme önizlemesi">
      <div class="v554-mock-preview-head">
        <div>
          <span>Demo Kaynak Adapteri</span>
          <h3>Kaynak adapter eşleşme önizlemesi</h3>
          <p>Gerçek kaynak bağlanmadan önce ham kaynak market adları sabit BULTEN market ID’lerine eşlenir. Bu tablo demo hazırlık verisidir.</p>
        </div>
        <em>Gerçek API yok</em>
      </div>
      ${renderSourceHealthPreview()}
      <div class="v554-mock-preview-table">
        <table>
          <thead><tr><th>Kaynak</th><th>Maç</th><th>Kaynak marketi</th><th>Eşleşen market adı</th><th>Market ID</th><th>Barem</th><th>Oran</th><th>Güven</th><th>Durum</th></tr></thead>
          <tbody>${rows.map(row => {
            const status = mappingStatus(row);
            return `<tr class="${escapeAttr(status)}">
              <td>${escapeHtml(row.source)}</td>
              <td><b>${escapeHtml(row.homeTeam)} - ${escapeHtml(row.awayTeam)}</b><small>${escapeHtml(row.league || "")}</small></td>
              <td>${escapeHtml(row.sourceMarketName || "-")}</td>
              <td>${escapeHtml(row.matchedMarketLabel || row.marketLabel || row.sourceMarketName || "-")}</td>
              <td><code>${escapeHtml(row.matchedMarketId || row.marketId || "-")}</code><small>${escapeHtml(displayMappingLabel(row.matchedBy || "unmatched"))}</small></td>
              <td>${row.line ?? "-"}</td>
              <td class="odd">${money(row.odds)}</td>
              <td>${Math.round(Number(row.confidence || 0) * 100)}%</td>
              <td><span class="v556-map-status ${escapeAttr(status)}">${escapeHtml(mappingStatusLabel(status))}</span></td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>`;
  }

  function fixtureLabel(fixture) {
    if (!fixture) return "-";
    return `${fixture.homeTeam || "Ev Sahibi"} - ${fixture.awayTeam || "Deplasman"}`;
  }

  function matchStatusLabel(status) {
    if (status === "strong") return "güçlü";
    if (status === "review") return "şüpheli";
    return "eşleşmedi";
  }

  function mockFixtureMatchRows() {
    return MOCK_FIXTURE_SOURCE_A.map(base => {
      const result = matchFixtureAcrossSources(base, MOCK_FIXTURE_SOURCE_B);
      return {
        base,
        bestMatch: result.bestMatch,
        score: result.score,
        reason: result.reason,
        status: result.status,
        isLikelyMatch: result.isLikelyMatch,
        fixtureKey: buildFixtureKey(base),
        candidateKey: result.bestMatch ? buildFixtureKey(result.bestMatch) : ""
      };
    });
  }

  function renderFixtureMatchPreview() {
    const rows = mockFixtureMatchRows();
    if (!rows.length) return "";
    return `<section class="v555-fixture-preview" aria-label="Demo maç eşleştirme önizlemesi">
      <div class="v554-mock-preview-head">
        <div>
          <span>FIXTURE MATCH</span>
          <h3>Demo maç eşleştirme önizlemesi</h3>
          <p>Farklı kaynaklardan gelen aynı maçlar, kataloglar silinmeden arka planda normalize edilir.</p>
        </div>
        <em>Gerçek API yok</em>
      </div>
      <div class="v555-fixture-grid">
        ${rows.map(row => `<article class="v555-fixture-card ${escapeAttr(row.status)}">
          <div>
            <small>Kaynak A</small>
            <b>${escapeHtml(fixtureLabel(row.base))}</b>
            <code>${escapeHtml(row.fixtureKey)}</code>
          </div>
          <div>
            <small>Kaynak B aday</small>
            <b>${escapeHtml(fixtureLabel(row.bestMatch))}</b>
            <code>${escapeHtml(row.candidateKey || "-")}</code>
          </div>
          <footer>
            <span class="v555-score">${Math.round(row.score * 100)}%</span>
            <span class="v555-status">${escapeHtml(matchStatusLabel(row.status))}</span>
            <em>${escapeHtml(row.reason)}</em>
          </footer>
        </article>`).join("")}
      </div>
    </section>`;
  }

  function renderMarkets() {
    if (isPolymarketMode()) return renderPolymarket();
    const cats = marketSearchItems();
    const total = cats.reduce((sum, cat) => sum + ((cat._markets || cat.markets || []).length), 0);
    const sportLabel = state.sport === "football" ? "Futbol" : state.sport === "basketball" ? "Basketbol" : "Futbol + Basketbol";
    const placeholder = marketSearchPlaceholder();
    if (!cats.length) {
      return `<div class="v546-market-search-panel v549-sport-market-panel">
        <label for="odds-v546-market-search">Marketler</label>
        <input id="odds-v546-market-search" type="search" placeholder="${escapeAttr(placeholder)}" value="${escapeAttr(state.marketSearch || "")}">
        ${renderMarketGroupFilters()}
        <div class="v546-market-meta"><span>${escapeHtml(sportLabel)}</span><span>0 sonuç</span></div>
      </div>${empty("Aradığın market katalogda bulunamadı.")}`;
    }
    return `<div class="v546-market-search-panel v549-sport-market-panel">
      <label for="odds-v546-market-search">Marketler</label>
      <input id="odds-v546-market-search" type="search" placeholder="${escapeAttr(placeholder)}" value="${escapeAttr(state.marketSearch || "")}">
      ${renderMarketGroupFilters()}
      <div class="v546-market-meta"><span>${escapeHtml(sportLabel)}</span><span>${total} sonuç · ${cats.length} grup</span></div>
      ${renderMockAdapterBadges()}
    </div>
    <div class="v530-market-catalog v546-market-catalog v549-sport-market-catalog">
      ${cats.map(cat => {
        const markets = cat._markets || cat.markets || [];
        const open = isCategoryOpen(cat.id);
        return `<section class="v530-market-cat v546-market-cat ${escapeAttr(categorySport(cat))} ${open ? "open" : "closed"}">
          <button type="button" class="v546-market-cat-toggle" data-cat-toggle="${escapeAttr(cat.id)}" aria-expanded="${open ? "true" : "false"}">
            <span><b>${escapeHtml(cat.name)}</b><small>${escapeHtml(cat.desc || "")}</small></span>
            <em>${markets.length} market</em>
            <i class="fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}"></i>
          </button>
          ${open ? `<div class="v530-market-tags v546-market-tags">
            ${markets.map(m => `<button type="button" data-market-pick="${escapeAttr(m.id)}" data-category-pick="${escapeAttr(cat.id)}"><b>${escapeHtml(m.name)}</b>${m.desc ? `<small>${escapeHtml(m.desc)}</small>` : ""}${renderMockMarketHint(m.id)}</button>`).join("")}
          </div>` : ""}
        </section>`;
      }).join("")}
    </div>`;
  }


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

  function renderSourceDiffList() {
    const rows = comparisonEngineResults().candidateRows
      .filter(row => row.bestOddsResult?.sourceCount >= 2)
      .slice(0, 5);
    if (!rows.length) return empty("Kaynak farkı adayı için en az iki kaynakta aynı market beklenir.");
    return `<div class="odds-v528-cards">${rows.map(row => {
      const best = row.bestOddsResult.bestRecord || {};
      const second = row.bestOddsResult.secondBestRecord || null;
      return `<article class="odds-v528-card arb">
        <div><b>${escapeHtml(comparisonFixtureLabel(best))}</b><small>${escapeHtml(best.matchedMarketLabel || best.marketLabel || best.marketId || "Market")}</small></div>
        <div class="odds-v528-big">${plainPct(row.bestOddsResult.bestDiffPercent || 0)}</div>
        <div class="odds-v528-mini">
          <span>En iyi: ${escapeHtml(best.source || "-")} ${money(best.odds)}</span>
          <span>İkinci: ${second ? `${escapeHtml(second.source || "-")} ${money(second.odds)}` : "-"}</span>
          <span>${row.bestOddsResult.sourceCount || 0} kaynak · ${escapeHtml(row.score?.tag || "Aday")}</span>
        </div>
      </article>`;
    }).join("")}</div>`;
  }


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

  function renderSourceHealthCards() {
    const rows = getSafeSourceHealth();
    const summary = summarizeSourceHealth(rows);
    const poly = buildPolymarketSourceHealth(polymarketMockAdapterRecords());
    const registryRows = effectiveSourceRegistry();
    const activeRegistry = registryRows.filter(isSourceActiveForUi).length;
    const passiveRegistry = registryRows.length - activeRegistry;
    return `<section class="v558-source-panel" aria-label="Kaynak Durumu">
      <div class="v554-mock-preview-head">
        <div>
          <span>Demo Kaynak Durumu</span>
          <h3>Kaynak Durumu</h3>
          <p>Gerçek kaynak bağlantısından önce kaynak tipleri ve adapter durumları hazırlanır. Demo modunda çalışıyor. Gerçek API bağlantısı henüz kapalı.</p>
        </div>
        <em>Veri modu: ${escapeHtml(displayModeLabel(summary.dataMode))}</em>
      </div>
      <div class="v558-source-summary">
        <span>Kaynak: <b>${summary.sources}</b></span>
        <span>Ham kayıt: <b>${summary.raw}</b></span>
        <span>Eşleşme: <b>${summary.mapped}/${summary.adapted}</b></span>
        <span>Son güncelleme: <b>${escapeHtml(formatSourceUpdatedAt(summary.lastUpdatedAt))}</b></span>
        <span>Aktif config: <b>${activeRegistry}</b></span>
        <span>Pasif config: <b>${passiveRegistry}</b></span>
      </div>
      <div class="v558-source-cards">${rows.map(row => {
        const badge = getSourceHealthBadge(row);
        return `<article class="${escapeAttr(badge.className)}">
          <div><b>${escapeHtml(displaySourceName(row))}</b><span>${escapeHtml(displayStatusLabel(badge.label))}</span></div>
          <small>Mod: ${escapeHtml(displayModeLabel(row.mode))} · Spor: ${escapeHtml(row.sport)} · UI: ${isSourceEnabledForComparison(row.source) ? "Aktif" : "Pasif"}</small>
          <p>Ham ${row.rawRecordCount} · Eşleşen ${row.mappedRecordCount} · Eşleşmeyen ${row.unmappedRecordCount}</p>
          <em>Son güncelleme: ${escapeHtml(formatSourceUpdatedAt(row.lastUpdatedAt))}</em>
          <strong>${escapeHtml(row.message || "Demo kaynak hazır")}</strong>
        </article>`;
      }).join("")}</div>
      <div class="v558-poly-health">
        <b>${escapeHtml(displaySourceName(poly))}</b>
        <span>Mod: ${escapeHtml(displayModeLabel(poly.mode))} · Durum: ${escapeHtml(displayStatusLabel(poly.status))} · Market: ${poly.marketCount}</span>
        <small>Likidite $${Number(poly.liquidityTotal || 0).toLocaleString("en-US")} · 24s hacim $${Number(poly.volume24hTotal || 0).toLocaleString("en-US")} · YES/NO fiyatları bookmaker decimal odds ile karışmaz.</small>
      </div>
    </section>`;
  }

  function sourceRegistryStatusClass(source, health) {
    if (!isSourceActiveForUi(source)) return "source-disabled";
    if (health) return getSourceHealthBadge(health).className;
    if (source.mode === "mock") return "source-mock";
    if (source.mode === "live_ready") return "source-live-ready";
    return "source-planned";
  }

  function sourceRegistryStatusLabel(source, health) {
    if (!isSourceActiveForUi(source)) return "pasif";
    if (health) return getSourceHealthBadge(health).label;
    if (source.mode === "mock") return "Demo";
    if (source.mode === "live_ready") return "Canlıya Hazır";
    return "Planlandı";
  }

  function sourceConfigFilterMatches(source) {
    const filter = state.sourceConfigFilter || "all";
    if (filter === "all") return true;
    if (filter === "active") return isSourceActiveForUi(source);
    if (filter === "inactive") return !isSourceActiveForUi(source);
    if (filter === "football" || filter === "basketball") return (source.sports || []).map(normalizeSportName).includes(filter);
    if (filter === "polymarket") return source.sourceId === "polymarket_mock" || source.type === "prediction_market";
    if (filter === "mock" || filter === "planned") return String(source.mode || "").toLowerCase() === filter;
    return true;
  }

  function renderSourceConfigFilters() {
    return `<div class="v561-source-config-filters" role="tablist" aria-label="Kaynak ayarı filtreleri">${SOURCE_CONFIG_FILTERS.map(filter => `<button type="button" data-source-config-filter="${escapeAttr(filter.id)}" class="${state.sourceConfigFilter === filter.id ? "active" : ""}">${escapeHtml(filter.label)}</button>`).join("")}</div>`;
  }

  function currentSourceConfigFilterLabel() {
    return SOURCE_CONFIG_FILTERS.find(filter => filter.id === state.sourceConfigFilter)?.label || "Tümü";
  }

  function filteredEffectiveSourceRows() {
    return effectiveSourceRegistry()
      .filter(sourceConfigFilterMatches)
      .slice()
      .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99));
  }

  function sourcePriorityOptions(priority) {
    const current = sanitizeSourcePriority(priority);
    return Array.from({ length: 15 }, (_, index) => index + 1)
      .map(value => `<option value="${value}" ${value === current ? "selected" : ""}>${value}</option>`).join("");
  }

  function renderSourceSettingsCards(rows = filteredEffectiveSourceRows(), healthRows = sourceRegistryHealthRows()) {
    return rows.map(source => {
      const health = findSourceRegistryHealth(source.sourceId, healthRows);
      const statusClass = sourceRegistryStatusClass(source, health);
      const active = isSourceActiveForUi(source);
      const note = getSourceConfigOverride(source.sourceId)?.notes || source.notes || "";
      const techRows = [
        ["Teknik ID", source.sourceId],
        ["Teknik Ad", source.technicalName || source.sourceId],
        ["Kaynak Tipi", displaySourceTypeLabel(source.type)],
        ["Adapter Durumu", getAdapterStatusLabel(getAdapterSlot(source.sourceId).status)],
        ["Yasal Not", source.legalNote || "Canlı bağlantı öncesi manuel kontrol edilecek."],
        ["Market Aileleri", (source.supportedMarketFamilies || []).join(" · ") || "-"]
      ];
      return `<article class="${escapeAttr([source.type === "prediction_market" ? "prediction-market" : "bookmaker-source", active ? "is-active" : "is-passive"].join(" "))}" data-source-config-card="${escapeAttr(source.sourceId)}">
        <div class="v561-source-card-head">
          <div><b data-source-name-label="${escapeAttr(source.sourceId)}">${escapeHtml(displaySourceName(source))}</b><small>${escapeHtml((source.sports || []).join(", ") || "Spor bilgisi yok")} · ${escapeHtml(displayModeLabel(source.mode))}</small></div>
          <button type="button" class="v561-source-toggle ${active ? "on" : "off"}" data-source-config-toggle="${escapeAttr(source.sourceId)}" aria-pressed="${active ? "true" : "false"}"><span></span>${active ? "Aktif" : "Pasif"}</button>
        </div>
        <label class="v566-source-field"><span>Kaynak Adı</span><input type="text" data-source-display-name="${escapeAttr(source.sourceId)}" value="${escapeAttr(displaySourceName(source))}" autocomplete="off"></label>
        <dl class="v568-source-card-main">
          <div><dt>Durum</dt><dd data-source-active-label="${escapeAttr(source.sourceId)}">${active ? "Aktif" : "Pasif"}</dd></div>
          <div><dt>Sporlar</dt><dd>${escapeHtml((source.sports || []).join(", "))}</dd></div>
          <div><dt>Mod</dt><dd>${escapeHtml(displayModeLabel(source.mode))}</dd></div>
          <div><dt>Öncelik</dt><dd><select data-source-priority="${escapeAttr(source.sourceId)}" aria-label="Öncelik">${sourcePriorityOptions(source.priority)}</select></dd></div>
        </dl>
        <label class="v566-source-field"><span>Not</span><textarea data-source-note="${escapeAttr(source.sourceId)}" rows="3" placeholder="Futbol oranları için kullanılacak">${escapeHtml(note)}</textarea></label>
        <details class="v568-card-dev-details">
          <summary>Teknik Bilgi</summary>
          <dl>${techRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd><span class="${label === "Adapter Durumu" ? escapeAttr(statusClass) : ""}">${escapeHtml(String(value))}</span></dd></div>`).join("")}</dl>
        </details>
      </article>`;
    }).join("");
  }

  function renderSourceRegistryRows(rows = filteredEffectiveSourceRows(), healthRows = sourceRegistryHealthRows()) {
    return rows.map(source => {
      const health = findSourceRegistryHealth(source.sourceId, healthRows);
      const statusClass = sourceRegistryStatusClass(source, health);
      const statusLabel = sourceRegistryStatusLabel(source, health);
      const note = health?.message || source.notes || "Planlandı";
      const active = isSourceActiveForUi(source);
      return `<tr class="${escapeAttr(source.type === "prediction_market" ? "prediction-market" : "bookmaker-source")}">
        <td><b>${escapeHtml(displaySourceName(source))}</b><small>${escapeHtml(source.technicalName || source.sourceId)}</small></td>
        <td>${escapeHtml(displaySourceTypeLabel(source.type))}</td>
        <td>${escapeHtml(displayModeLabel(source.mode))}</td>
        <td>${escapeHtml((source.sports || []).join(", "))}</td>
        <td><span class="${escapeAttr(statusClass)}">${escapeHtml(getAdapterStatusLabel(getAdapterSlot(source.sourceId).status))}</span><small>${escapeHtml(displayStatusLabel(statusLabel))}</small></td>
        <td><button type="button" class="v561-source-toggle ${active ? "on" : "off"}" data-source-config-toggle="${escapeAttr(source.sourceId)}" aria-pressed="${active ? "true" : "false"}"><span></span>${active ? "Aktif" : "Pasif"}</button></td>
        <td><b>Öncelik ${Number(source.priority || 0)}</b><small>${escapeHtml(note)}</small><small>${escapeHtml((source.supportedMarketFamilies || []).slice(0, 4).join(" · "))}</small></td>
      </tr>`;
    }).join("");
  }

  function renderSourceEmptyState(rows) {
    return rows.length ? "" : empty("Bu kaynak filtresi için kayıt yok.");
  }

  function renderSourceSettingsPanel() {
    const healthRows = sourceRegistryHealthRows();
    const registrySummary = summarizeSourceRegistry(healthRows);
    const rows = filteredEffectiveSourceRows();
    return `<section class="v561-source-settings" aria-label="Kaynak Ayarları">
      <div class="v554-mock-preview-head">
        <div>
          <span>Kaynak Ayarları</span>
          <h3>Kaynak Ayarları</h3>
          <p>Aktif/Pasif kaynak seçimi ileride gerçek veri akışını kontrol edecek. Sürüm V561 hazırlığı yalnızca yardımcı not olarak tutulur.</p>
        </div>
        <em>Gerçek API yok · fetch yok · scraping yok</em>
      </div>
      <div class="v559-registry-summary">
        <span>Toplam: <b>${registrySummary.total}</b></span>
        <span>Aktif: <b>${registrySummary.enabled}</b></span>
        <span>Pasif: <b>${registrySummary.total - registrySummary.enabled}</b></span>
        <span>Bahis Kaynağı: <b>${registrySummary.byType.bookmaker || 0}</b></span>
        <span>Polymarket: <b>${registrySummary.byType.prediction_market || 0}</b></span>
        <span>Filtre: <b data-source-filter-label>${escapeHtml(currentSourceConfigFilterLabel())}</b></span>
      </div>
      ${renderSourceConfigFilters()}
      <div class="v561-source-config-grid" data-source-settings-list>${renderSourceSettingsCards(rows, healthRows)}</div>
      <div data-source-settings-empty>${renderSourceEmptyState(rows)}</div>
    </section>`;
  }

  function renderSourceRegistryPanel() {
    const healthRows = sourceRegistryHealthRows();
    const registrySummary = summarizeSourceRegistry(healthRows);
    const rows = filteredEffectiveSourceRows();
    return `<section class="v559-source-registry" aria-label="Kaynak Kayıtları">
      <div class="v554-mock-preview-head">
        <div>
          <span>Kaynak Kayıtları</span>
          <h3>Kaynak Kayıtları</h3>
          <p>Gerçek kaynak bağlantısından önce kaynak tipleri ve adapter durumları hazırlanır. Teknik sourceId ve adapterStatus bilgileri küçük yardımcı metin olarak korunur.</p>
        </div>
        <em>Gerçek API yok · fetch yok · scraping yok</em>
      </div>
      <div class="v559-registry-summary">
        <span>Toplam: <b>${registrySummary.total}</b></span>
        <span>Aktif kaynak: <b>${registrySummary.enabled}</b></span>
        <span>Bahis Kaynağı: <b>${registrySummary.byType.bookmaker || 0}</b></span>
        <span>Polymarket: <b>${registrySummary.byType.prediction_market || 0}</b></span>
        <span>Durum bağlı: <b>${registrySummary.withHealth}</b></span>
        <span>Filtre: <b data-source-filter-label>${escapeHtml(currentSourceConfigFilterLabel())}</b></span>
      </div>
      ${renderSourceConfigFilters()}
      <div class="v559-registry-table-wrap">
        <table class="v559-registry-table">
          <thead><tr><th>Kaynak</th><th>Tip</th><th>Mod</th><th>Sporlar</th><th>Adapter durumu</th><th>Aktif/Pasif</th><th>Öncelik / Not</th></tr></thead>
          <tbody data-source-registry-rows>${renderSourceRegistryRows(rows, healthRows)}</tbody>
        </table>
        <div data-source-registry-empty>${renderSourceEmptyState(rows)}</div>
      </div>
    </section>`;
  }




  function renderInitialLiveSourceSlot() {
    const firstLive = null;
    const rows = [
      ["İlk kaynak", firstLive ? displaySourceName(firstLive) : "seçilmedi"],
      ["Bağlantı tipi", "seçilmedi"],
      ["API anahtarı", "kapalı"],
      ["Fetch/Scraping", FETCH_SCRAPING_ENABLED ? "açık" : "kapalı"],
      ["Adapter", "bekliyor"],
      ["Test modu", "dry-run"],
      ["Otomatik oynama", AUTO_BETTING_ENABLED ? "açık" : "kapalı"]
    ];
    return `<section class="v565-live-slot" aria-label="İlk Canlı Kaynak Slotu">
      <div class="v554-mock-preview-head compact">
        <div><span>İlk Canlı Kaynak Slotu</span><h3>İlk Canlı Kaynak Slotu</h3></div>
        <em>Gerçek bağlantı kapalı</em>
      </div>
      <div class="v565-slot-grid">${rows.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></article>`).join("")}</div>
    </section>`;
  }

  function dryRunSamplePayloadToJson(sampleKey = "flat") {
    const sample = DRY_RUN_SAMPLE_PAYLOADS[sampleKey] || DRY_RUN_SAMPLE_PAYLOADS.flat;
    return JSON.stringify(sample.payload, null, 2);
  }

  function getDryRunInputValue() {
    return state.dryRunInput || dryRunSamplePayloadToJson("flat");
  }

  function renderDryRunSampleButtons() {
    return `<div class="v579-dry-samples" aria-label="Dry-run Örnek Payload Seçimi">
      ${Object.entries(DRY_RUN_SAMPLE_PAYLOADS).map(([key, sample]) => `<button type="button" data-dry-run-sample="${escapeHtml(key)}"><b>${escapeHtml(sample.label)}</b><span>${escapeHtml(sample.note)}</span></button>`).join("")}
    </div>`;
  }

  function renderDryRunContractPanel() {
    return `<div class="v579-adapter-contract" aria-label="Adapter Sözleşmesi">
      <div class="v579-adapter-contract-head">
        <b>Adapter Sözleşmesi</b>
        <span>Gerçek veri öncesi kabul/normalize/çıktı kuralları</span>
      </div>
      <div class="v579-contract-grid">
        ${DRY_RUN_CONTRACT_ROWS.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></article>`).join("")}
      </div>
    </div>`;
  }

  function mappingQualityLabel(score = 0) {
    const value = Number(score || 0);
    if (value >= 85) return "yüksek";
    if (value >= 65) return "orta";
    if (value > 0) return "düşük";
    return "eşleşmedi";
  }

  function mappingQualityClass(score = 0) {
    const value = Number(score || 0);
    if (value >= 85) return "quality-high";
    if (value >= 65) return "quality-mid";
    if (value > 0) return "quality-low";
    return "quality-none";
  }

  function renderDryRunQualityPanel(preview = {}) {
    if (preview.isPolymarket) {
      return `<div class="v579-quality-panel polymarket"><b>POLYMARKET Kalite Kontrolü</b><p>YES/NO fiyatı ayrı doğrulanır. Market ID / alias kalite puanı bookmaker motoru için hesaplanmaz.</p></div>`;
    }
    const rows = preview.qualityRows || [];
    const summary = preview.qualitySummary || {};
    if (!rows.length) return `<div class="v579-quality-panel"><b>Kalite Kontrolü</b><p>Dry-run testinden sonra eşleşme kalitesi burada görünecek.</p></div>`;
    const cards = [
      ["Kalite Skoru", `${summary.score || 0}%`],
      ["Yüksek", summary.high || 0],
      ["Orta", summary.mid || 0],
      ["Düşük", summary.low || 0],
      ["Eşleşmedi", summary.none || 0],
      ["Tekrarlı Kayıt", summary.duplicates || 0]
    ];
    return `<div class="v579-quality-panel" aria-label="Dry-run Eşleşme Kalitesi">
      <div class="v579-quality-head"><b>Eşleşme Kalitesi</b><span>Market + fixture + oran alanlarına göre dry-run kalite özeti</span></div>
      <div class="v579-quality-cards">${cards.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(String(value))}</span></article>`).join("")}</div>
    </div>`;
  }

  function renderDryRunSchemaGuide() {
    const fields = DRY_RUN_BOOKMAKER_REQUIRED_FIELDS.map(field => `<span>${escapeHtml(field)}</span>`).join("");
    const optional = DRY_RUN_BOOKMAKER_OPTIONAL_FIELDS.map(field => `<span>${escapeHtml(field)}</span>`).join("");
    const formats = DRY_RUN_PAYLOAD_FORMATS.map(item => `<code>${escapeHtml(item)}</code>`).join("");
    return `<div class="v578-dry-schema-guide" aria-label="Dry-run Şema Rehberi">
      <div><b>Kabul edilen format</b><p>${formats}</p></div>
      <div><b>Zorunlu alanlar</b><p>${fields}</p></div>
      <div><b>Opsiyonel alanlar</b><p>${optional}</p></div>
    </div>`;
  }

  function renderDryRunSchemaChecks(preview = {}) {
    const checks = Array.isArray(preview.schemaChecks) ? preview.schemaChecks : [];
    if (!checks.length) return "";
    return `<div class="v578-schema-checks" aria-label="Dry-run Şema Kontrolleri">
      ${checks.map(item => `<article class="${item.ok ? "ok" : "warn"}"><b>${escapeHtml(item.label)}</b><span>${escapeHtml(String(item.value))}</span></article>`).join("")}
    </div>`;
  }

  function renderDryRunMappingTable(preview = {}) {
    const rows = Array.isArray(preview.mappingRows) ? preview.mappingRows : [];
    if (preview.isPolymarket) return `<div class="v578-mapping-table compact"><b>Polymarket ayrı akış</b><p>YES/NO, likidite, hacim ve kapanış süresi bookmaker market ID sistemine bağlanmaz.</p></div>`;
    if (!rows.length) return `<div class="v578-mapping-table compact"><b>Alias sonucu yok</b><p>Dry-run testinden sonra ham market → katalog market eşleşmeleri burada görünür.</p></div>`;
    return `<div class="v578-mapping-table" aria-label="Dry-run Alias Eşleşme Tablosu">
      <div class="v578-mapping-head"><b>Ham market → katalog market</b><span>İlk ${rows.length} kayıt · gerçek veri değildir</span></div>
      <table>
        <thead><tr><th>#</th><th>Kaynak</th><th>Maç</th><th>Ham market</th><th>Katalog market</th><th>Market ID</th><th>Fixture</th><th>Kalite</th></tr></thead>
        <tbody>${rows.map(row => `<tr class="${row.matchedMarketId ? "matched" : "unmatched"} ${row.duplicate ? "duplicate" : ""}">
          <td>${row.index}</td>
          <td>${escapeHtml(row.source)}</td>
          <td>${escapeHtml(row.fixture)}</td>
          <td>${escapeHtml(row.sourceMarketName)}<small>${escapeHtml(row.selection)} · çizgi ${escapeHtml(String(row.line))} · oran ${escapeHtml(String(row.odds))}</small></td>
          <td>${escapeHtml(row.matchedMarketLabel)}<small>${escapeHtml(displayMappingLabel(row.matchedBy))}${row.duplicate ? " · tekrarlı" : ""}</small></td>
          <td><code>${escapeHtml(row.matchedMarketId || "-")}</code></td>
          <td>${escapeHtml(row.fixtureStatus)}<small>${row.fixtureScore}%</small></td>
          <td><span class="v579-quality-badge ${escapeHtml(row.qualityClass || mappingQualityClass(row.qualityScore))}">${escapeHtml(row.qualityLabel || mappingQualityLabel(row.qualityScore))} · ${row.qualityScore || 0}%</span><small>alias ${row.confidence}%</small></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderDryRunPayloadPanel() {
    const preview = state.dryRunResult || previewIncomingOddsPayload(DRY_RUN_SAMPLE_PAYLOAD);
    const rejected = preview.errorCount > 0;
    const rows = [
      ["Toplam Kayıt", preview.recordCount],
      ["Geçerli Kayıt", preview.validRecordCount],
      ["Hatalı Kayıt", preview.invalidRecordCount],
      ["Eşleşen Market", preview.marketIdMatched],
      ["Eşleşmeyen Market", preview.marketIdUnmatched],
      ["Fixture Eşleşen", preview.fixtureMatched],
      ["Fixture Şüpheli", preview.fixtureSuspicious],
      ["Kaynak Adı", preview.sourceName || "-"],
      ["Bookmaker / Poly", `${preview.bookmakerCount || 0} / ${preview.polymarketCount || 0}`],
      ["Veri Modu", "Dry-run"]
    ];
    return `<section class="v565-dry-run" aria-label="Dry-run Veri İçe Aktarma">
      <div class="v554-mock-preview-head compact">
        <div>
          <span>Dry-run Veri İçe Aktarma</span>
          <h3>Dry-run Veri Kontrolü</h3>
          <p>Gerçek bağlantı kapalıdır. Bu alan sadece örnek JSON verisinin market ve maç eşleşmesini test eder.</p>
        </div>
        <em>${rejected ? "Türkçe hata mesajı hazır" : "Gerçek bağlantı kapalı"}</em>
      </div>
      ${renderDryRunSampleButtons()}
      <textarea class="v566-dry-run-textarea" data-dry-run-input rows="10" spellcheck="false" placeholder="Örnek JSON kayıt dizisi yapıştırın">${escapeHtml(getDryRunInputValue())}</textarea>
      <div class="v566-dry-run-actions">
        <button type="button" data-dry-run-test>Dry-run Test Et</button>
        <button type="button" data-dry-run-clear>Temizle</button>
      </div>
      <div class="v565-dry-grid">${rows.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(String(value))}</span></article>`).join("")}</div>
      ${renderDryRunContractPanel()}
      ${renderDryRunSchemaGuide()}
      ${renderDryRunSchemaChecks(preview)}
      ${renderDryRunQualityPanel(preview)}
      ${renderDryRunMappingTable(preview)}
      ${preview.isPolymarket ? `<p class="v566-dry-run-info">Polymarket dry-run ayrı işlenir; YES/NO fiyatları decimal odds gibi işlenmez.</p>` : ""}
      ${preview.errors?.length ? `<div class="v566-dry-run-errors"><b>Hata Mesajları</b>${preview.errors.map(error => `<span>${escapeHtml(error)}</span>`).join("")}</div>` : ""}
    </section>`;
  }

  function renderDryRunComparisonPreview() {
    const preview = state.dryRunResult;
    if (!preview || preview.errorCount || preview.isPolymarket || !Array.isArray(preview.records) || !preview.records.length) return "";
    const activeRecords = filterComparisonRecordsBySource(preview.records);
    if (!activeRecords.length) return `<section class="v566-dry-run-preview"><b>Dry-run Önizleme</b><p>Geçerli kayıt var ancak aktif kaynak bulunmadığı için karşılaştırmaya dahil edilmedi.</p></section>`;
    const data = comparisonEngineResults(activeRecords);
    return `<section class="v566-dry-run-preview" aria-label="Dry-run Önizleme">
      <div><span>Dry-run Önizleme</span><h4>Dry-run Önizleme</h4><p>Bu bölüm gerçek fırsat/sinyal değildir; sadece yapıştırılan JSON için market ve fixture kontrolüdür.</p></div>
      <div class="v565-dry-grid">
        <article><b>Kayıt</b><span>${data.summary.records}</span></article>
        <article><b>Eşleşen Market</b><span>${data.summary.matchedMarkets}</span></article>
        <article><b>Eşleşmeyen</b><span>${data.summary.unmatched}</span></article>
        <article><b>Kaynak</b><span>${data.summary.sources}</span></article>
        <article><b>Veri Modu</b><span>Dry-run</span></article>
      </div>
      ${renderDryRunMappingTable(preview)}
    </section>`;
  }

  function renderLiveReadinessPanel() {
    const adapter = collectAdapterResults();
    const readiness = [
      ["adapter runner hazır", "hazır", true],
      ["market alias haritası hazır", "hazır", true],
      ["fixture matching hazır", "hazır", true],
      ["nested payload şeması hazır", "hazır", true],
      ["source health hazır", "hazır", true],
      ["dry-run payload kontrolü hazır", "hazır", true],
      ["adapter sözleşmesi görünür", "hazır", true],
      ["eşleşme kalite skoru hazır", "hazır", true],
      ["gerçek API bağlantısı kapalı", "kapalı", !LIVE_API_CONNECTION_ENABLED]
    ];
    return `<section class="v562-live-readiness" aria-label="Canlı Geçiş Hazırlığı">
      <div class="v554-mock-preview-head">
        <div>
          <span>Canlı Geçiş Hazırlığı</span>
          <h3>Canlı Geçiş Hazırlığı</h3>
          <p>Demo modundan canlıya geçiş için adapter kapısı hazırlandı; gerçek bağlantı, fetch, scraping ve otomatik bahis kapalıdır.</p>
        </div>
        <em>Adapter çalışma: ${adapter.adapterRuns.length} kaynak · Mod: ${escapeHtml(displayModeLabel(adapter.dataMode))}</em>
      </div>
      <div class="v562-live-grid">${readiness.map(([label, value, ok]) => `<article class="${ok ? "ready" : "blocked"}"><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></article>`).join("")}</div>
      ${renderInitialLiveSourceSlot()}
      ${renderReadinessChecklist()}
    </section>`;
  }

  function renderSourceOverviewPanel() {
    const healthRows = sourceRegistryHealthRows();
    const registrySummary = summarizeSourceRegistry(healthRows);
    const healthSummary = summarizeSourceHealth(getSafeSourceHealth());
    const adapter = collectAdapterResults();
    const ready = snapshotReadinessSummary();
    const rows = [
      ["Toplam Kaynak", registrySummary.total],
      ["Aktif Kaynak", registrySummary.enabled],
      ["Pasif Kaynak", registrySummary.total - registrySummary.enabled],
      ["Snapshot Kayıt", ready.records],
      ["Eşleşen / Eşleşmeyen", `${ready.matched} / ${ready.unmatched}`],
      ["Polymarket", registrySummary.byType.prediction_market || 0],
      ["Veri Modu", displayModeLabel(adapter.dataMode || healthSummary.dataMode)],
      ["Gerçek Bağlantı", LIVE_API_CONNECTION_ENABLED ? "Açık" : "Kapalı"]
    ];
    return `<section class="v568-source-overview" aria-label="Kaynak Özeti">
      <div class="v554-mock-preview-head v565-source-config-head">
        <div>
          <span>Kaynak Özeti</span>
          <h3>Kaynak Özeti</h3>
          <p>Kaynaklar sade görünümde yönetilir. Snapshot hazırlık özeti ana metriklerde gösterilir; teknik ID, adapter ve ham eşleşme detayları Geliştirici Detayları içinde saklanır.</p>
        </div>
        <em>Dış API kapalı · Otomatik oynama kapalı</em>
      </div>
      <div class="v568-overview-grid">${rows.map(([label, value]) => `<article><b>${escapeHtml(label)}</b><span>${escapeHtml(String(value))}</span></article>`).join("")}</div>
    </section>`;
  }

  function renderDeveloperDetailsPanel() {
    return `<details class="v568-developer-details">
      <summary>
        <span>Geliştirici Detayları</span>
        <small>Teknik ID, adapter, snapshot ve ham eşleşme detayları</small>
      </summary>
      <div class="v568-dev-details-body">
        ${renderSnapshotReadinessPanel()}
        ${renderStaticSnapshotStatusPanel()}
        ${renderStaticSourcesPanel()}
        ${renderSourceRegistryPanel()}
        ${renderSourceHealthCards()}
      </div>
    </details>`;
  }

  function renderSources() {
    return `<section class="v565-source-configuration" aria-label="Kaynak Yapılandırması">
      ${renderSourceOverviewPanel()}
      ${renderSourceSettingsPanel()}
      ${renderLiveReadinessPanel()}
      ${renderDryRunPayloadPanel()}
      ${renderDeveloperDetailsPanel()}
    </section>`;
  }

  function empty(text) { return `<div class="odds-v528-empty">${escapeHtml(text)}</div>`; }

  function bookTag(id) {
    const s = sitesMap()[id];
    const ref = s?.reference ? " ref" : "";
    return `<span class="odds-v528-book${ref}">${escapeHtml(s?.name || id)}</span>`;
  }


  // -------------------------------
  // Event Binding
  // -------------------------------
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

  function setActiveOddsTabButtons() {
    qsa("[data-odds-tab]").forEach(btn => {
      btn.classList.toggle("active", (btn.dataset.oddsTab || DEFAULT_TAB) === state.tab);
    });
  }

  function renderContentOnly({ preserveScroll = true } = {}) {
    const contentBox = qs("[data-odds-content]");
    if (!contentBox) {
      render();
      return;
    }
    const scrollY = window.scrollY;
    clearTimeout(marketSearchRenderTimer);
    contentBox.innerHTML = content();
    setActiveOddsTabButtons();
    if (preserveScroll) requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
  }

  function updateSourceFilterButtons() {
    qsa("[data-source-config-filter]").forEach(btn => {
      btn.classList.toggle("active", (btn.dataset.sourceConfigFilter || "all") === state.sourceConfigFilter);
    });
    qsa("[data-source-filter-label]").forEach(node => {
      node.textContent = currentSourceConfigFilterLabel();
    });
  }

  function renderDryRunPanelOnly() {
    const panel = qs(".v565-dry-run");
    if (!panel) {
      renderContentOnly();
      return;
    }
    panel.outerHTML = renderDryRunPayloadPanel();
  }

  function renderSourceFilterOnly() {
    const healthRows = sourceRegistryHealthRows();
    const rows = filteredEffectiveSourceRows();
    const registryRows = qs("[data-source-registry-rows]");
    const settingsList = qs("[data-source-settings-list]");
    const registryEmpty = qs("[data-source-registry-empty]");
    const settingsEmpty = qs("[data-source-settings-empty]");
    if (!registryRows || !settingsList) {
      renderContentOnly();
      return;
    }
    registryRows.innerHTML = renderSourceRegistryRows(rows, healthRows);
    settingsList.innerHTML = renderSourceSettingsCards(rows, healthRows);
    if (registryEmpty) registryEmpty.innerHTML = renderSourceEmptyState(rows);
    if (settingsEmpty) settingsEmpty.innerHTML = renderSourceEmptyState(rows);
    updateSourceFilterButtons();
  }


  function handleOddsClick(e) {
    const tabButtonEl = e.target.closest("[data-odds-tab]");
    if (tabButtonEl) {
      e.preventDefault();
      const nextTab = tabButtonEl.dataset.oddsTab || DEFAULT_TAB;
      if (nextTab === "polymarket") {
        if (state.sport === "polymarket") return;
        state.sport = "polymarket";
        state.tab = "opportunities";
        state.marketPickerOpen = false;
        state.marketSearch = "";
        saveLocalState();
        render();
        return;
      }
      if (state.tab === nextTab) return;
      state.tab = nextTab;
      state.marketPickerOpen = false;
      state.marketSearch = "";
      saveLocalState();
      renderContentOnly();
      return;
    }

    const catToggle = e.target.closest("[data-cat-toggle]");
    if (catToggle) {
      e.preventDefault();
      const id = catToggle.dataset.catToggle;
      if (!id) return;
      const open = new Set(openCategoryIds());
      if (open.has(id)) open.delete(id);
      else open.add(id);
      state.openMarketCats = [...open];
      saveLocalState();
      const box = qs(".v533-market-results");
      if (box) box.innerHTML = marketResultsHtml();
      else renderContentOnly();
      return;
    }

    const catPin = e.target.closest("[data-cat-pin]");
    if (catPin) {
      e.preventDefault();
      e.stopPropagation();
      const id = catPin.dataset.catPin;
      if (!id) return;
      const pinned = new Set(Array.isArray(state.pinnedMarketCats) ? state.pinnedMarketCats : []);
      if (pinned.has(id)) pinned.delete(id);
      else pinned.add(id);
      state.pinnedMarketCats = [...pinned];
      saveLocalState();
      const box = qs(".v533-market-results");
      if (box) box.innerHTML = marketResultsHtml();
      else renderContentOnly();
      return;
    }

    const marketPick = e.target.closest("[data-market-pick]");
    if (marketPick) {
      e.preventDefault();
      const nextCategory = marketPick.dataset.categoryPick || "all";
      const nextMarket = marketPick.dataset.marketPick || "all";
      const alreadySelected = state.marketCategory === nextCategory && state.marketId === nextMarket && state.tab === "all-sites" && !state.marketPickerOpen && !state.marketSearch;
      if (alreadySelected) return;
      state.marketCategory = nextCategory;
      state.marketId = nextMarket;
      state.marketSearch = "";
      state.marketPickerOpen = false;
      state.tab = "all-sites";
      saveLocalState();
      renderContentOnly();
      return;
    }

    if (e.target.closest("[data-market-reset]")) {
      e.preventDefault();
      const alreadyReset = state.marketCategory === "all" && state.marketId === "all" && !state.marketSearch && currentMarketGroupFilter() === "all" && !state.marketPickerOpen;
      if (alreadyReset) return;
      state.marketCategory = "all";
      state.marketId = "all";
      state.marketSearch = "";
      state.marketGroupFilter = "all";
      state.marketPickerOpen = false;
      saveLocalState();
      renderContentOnly();
      return;
    }

    const sportBtn = e.target.closest("[data-odds-sport-btn]");
    if (sportBtn) {
      e.preventDefault();
      e.stopPropagation();
      const nextSport = sportBtn.dataset.oddsSportBtn || "all";
      if (state.sport === nextSport) return;
      const scrollY = window.scrollY;
      state.sport = nextSport;
      state.tab = CATEGORY_CLICK_TAB;
      state.marketPickerOpen = false;
      state.marketSearch = "";
      state.marketGroupFilter = "all";
      state.openMarketCats = null;
      if (isPolymarketMode()) {
        state.marketCategory = "all";
        state.marketId = "all";
      }
      ensureMarketFitsSport();
      saveLocalState();
      render();
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
      return;
    }

    if (e.target.closest("[data-market-drawer-toggle]")) {
      e.preventDefault();
      e.stopPropagation();
      const scrollY = window.scrollY;
      state.marketPickerOpen = !state.marketPickerOpen;
      saveLocalState();
      render();
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
      return;
    }

    if (e.target.closest("[data-market-drawer-close]")) {
      e.preventDefault();
      if (!state.marketPickerOpen) return;
      state.marketPickerOpen = false;
      saveLocalState();
      render();
      return;
    }

    const groupFilter = e.target.closest("[data-market-group-filter]");
    if (groupFilter) {
      e.preventDefault();
      e.stopPropagation();
      const nextFilter = groupFilter.dataset.marketGroupFilter || "all";
      if (currentMarketGroupFilter() === nextFilter) return;
      state.marketGroupFilter = nextFilter;
      state.openMarketCats = null;
      saveLocalState();
      renderContentOnly();
      return;
    }

    const polyFilter = e.target.closest("[data-poly-filter]");
    if (polyFilter) {
      e.preventDefault();
      e.stopPropagation();
      const nextFilter = polyFilter.dataset.polyFilter || "all";
      if (state.polyFilter === nextFilter) return;
      state.polyFilter = nextFilter;
      saveLocalState();
      renderContentOnly({ preserveScroll: false });
      return;
    }

    const sourceFilter = e.target.closest("[data-source-config-filter]");
    if (sourceFilter) {
      e.preventDefault();
      const nextFilter = sourceFilter.dataset.sourceConfigFilter || "all";
      if (state.sourceConfigFilter === nextFilter) return;
      state.sourceConfigFilter = nextFilter;
      saveLocalState();
      renderSourceFilterOnly();
      return;
    }

    const sourceToggle = e.target.closest("[data-source-config-toggle]");
    if (sourceToggle) {
      e.preventDefault();
      const sourceId = sourceToggle.dataset.sourceConfigToggle;
      const baseSource = SOURCE_REGISTRY.find(source => source.sourceId === sourceId);
      if (!baseSource) return;
      const current = applySourceConfig(baseSource);
      const nextEnabled = !isSourceActiveForUi(current);
      state.sourceConfig = state.sourceConfig && typeof state.sourceConfig === "object" ? state.sourceConfig : {};
      updateSourceConfig(sourceId, { enabled: nextEnabled, mode: baseSource.mode || "planned" });
      mockComparisonCache = null;
      saveLocalState();
      if (state.tab === "sources") renderSourceFilterOnly();
      else renderContentOnly();
      return;
    }

    const dryRunSample = e.target.closest("[data-dry-run-sample]");
    if (dryRunSample) {
      e.preventDefault();
      const sampleKey = dryRunSample.dataset.dryRunSample || "flat";
      state.dryRunInput = dryRunSamplePayloadToJson(sampleKey);
      state.dryRunResult = previewIncomingOddsPayload(state.dryRunInput);
      clearSourceDerivedCaches();
      saveLocalState();
      renderDryRunPanelOnly();
      return;
    }

    if (e.target.closest("[data-dry-run-test]")) {
      e.preventDefault();
      const input = qs("[data-dry-run-input]");
      state.dryRunInput = input ? input.value : getDryRunInputValue();
      state.dryRunResult = previewIncomingOddsPayload(state.dryRunInput);
      clearSourceDerivedCaches();
      renderDryRunPanelOnly();
      return;
    }

    if (e.target.closest("[data-dry-run-clear]")) {
      e.preventDefault();
      state.dryRunInput = "";
      state.dryRunResult = null;
      clearSourceDerivedCaches();
      renderDryRunPanelOnly();
      return;
    }

    const refresh = e.target.closest('[data-odds-action="refresh"]');
    if (refresh) {
      e.preventDefault();
      load({ force: true }).then(render);
      return;
    }

    if (e.target.closest('[data-odds-action="toggle-alarm"]')) {
      e.preventDefault();
      state.alarmEnabled = !state.alarmEnabled;
      saveLocalState();
      renderContentOnly();
    }
  }

  function handleOddsInput(e) {
    if (e.target && e.target.id === "odds-v546-market-search") {
      state.marketSearch = e.target.value || "";
      saveLocalState();
      clearTimeout(marketSearchRenderTimer);
      marketSearchRenderTimer = setTimeout(() => {
        renderContentOnly();
        const input = qs("#odds-v546-market-search");
        if (input) {
          input.focus({ preventScroll: true });
          const len = input.value.length;
          try { input.setSelectionRange(len, len); } catch {}
        }
      }, SEARCH_RENDER_DELAY);
      return;
    }
    const sourceDisplayInput = e.target?.closest?.("[data-source-display-name]");
    if (sourceDisplayInput) {
      const sourceId = sourceDisplayInput.dataset.sourceDisplayName;
      updateSourceConfig(sourceId, { displayName: sourceDisplayInput.value });
      const label = qsa("[data-source-name-label]").find(node => node.dataset.sourceNameLabel === sourceId);
      if (label) label.textContent = sanitizeSourceDisplayName(sourceDisplayInput.value) || displaySourceName(SOURCE_REGISTRY.find(source => source.sourceId === sourceId) || {});
      saveSourceConfigSoon();
      return;
    }

    const sourceNoteInput = e.target?.closest?.("[data-source-note]");
    if (sourceNoteInput) {
      updateSourceConfig(sourceNoteInput.dataset.sourceNote, { notes: sourceNoteInput.value });
      saveSourceConfigSoon();
      return;
    }

    const sourcePriorityInput = e.target?.closest?.("[data-source-priority]");
    if (sourcePriorityInput) {
      updateSourceConfig(sourcePriorityInput.dataset.sourcePriority, { priority: sourcePriorityInput.value });
      saveSourceConfigSoon();
      return;
    }

    const dryRunInput = e.target?.closest?.("[data-dry-run-input]");
    if (dryRunInput) {
      state.dryRunInput = dryRunInput.value;
      return;
    }

    if (e.target && e.target.id === "v533-alarm-sensitivity") {
      state.alarmSensitivity = Number(e.target.value || 0.4);
      saveLocalState();
    }
  }

  function bind() {
    installMarketOutsideCloseGuard();
    const mount = qs("#omega-odds-render");
    if (!mount || mount.dataset.oddsDelegationBound === "true") return;
    mount.dataset.oddsDelegationBound = "true";
    mount.addEventListener("click", handleOddsClick);
    mount.addEventListener("input", handleOddsInput);
  }

  // -------------------------------
  // Init / Public API
  // -------------------------------
  async function load({ force = false } = {}) {
    const repoData = await loadRepoStaticOddsData({ force });
    state.sources = repoData.sources.ok ? repoData.sources.data : FALLBACK_SOURCES;
    state.snapshot = repoData.snapshot.ok ? repoData.snapshot.data : FALLBACK_SNAPSHOT;
    state.sourcesMeta = repoData.sources;
    state.snapshotMeta = repoData.snapshot;
    marketMapCache = null;
    normalizedMockOddsCache = null;
    mockComparisonCache = null;
    polymarketAdapterRecordsCache = null;
    clearSourceDerivedCaches();
    validateMockOddsRecords();
    state.lastLoadedAt = repoData.loadedAt || new Date().toISOString();
  }

  function render() {
    const mount = qs("#omega-odds-render");
    if (!mount) return;
    clearTimeout(marketSearchRenderTimer);
    mount.innerHTML = shell();
    bind();
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[s]));
  }

  function escapeAttr(str) { return escapeHtml(str).replace(/`/g, "&#96;"); }

  window.__oddsTerminalV554 = {
    normalizeText,
    normalizeTeamName,
    normalizeLeagueName,
    normalizeFixtureSide,
    buildFixtureKey,
    scoreFixtureMatch,
    matchFixtureAcrossSources,
    buildPolymarketEventKey,
    mockFixtureMatchRows,
    normalizeOddsRecord,
    loadStaticOddsSnapshot,
    loadStaticOddsSources,
    loadRepoStaticOddsData,
    buildStaticSnapshotAdapterOutput,
    staticSnapshotSummary,
    snapshotReadinessSummary,
    dataFlowStatusSummary,
    normalizeSourceMarketName,
    findSourceMarketMapping,
    inferMarketIdFromCatalogAliases,
    mapSourceMarketToCatalogId,
    createMappingConfidenceScore,
    adaptSourceOddsRecord,
    findCatalogMarketById,
    findCatalogMarketByAlias,
    mapOddsRecordToCatalog,
    SOURCE_MARKET_MAPPINGS,
    SOURCE_ODDS_ADAPTERS,
    SOURCE_REGISTRY,
    effectiveSourceRegistry,
    filterComparisonRecordsBySource,
    filterRawSourceRecordsByConfig,
    BOOKMAKER_SOURCE_REGISTRY,
    POLYMARKET_SOURCE_REGISTRY,
    POLYMARKET_EVENT_ADAPTER,
    mockOddsRecords,
    validateMockOddsRecords,
    calculateBestOdds,
    groupOddsByFixture,
    groupOddsByFixtureAndMarket,
    groupOddsByFixtureMarketLine,
    groupOddsBySource,
    findBestOddsForGroup,
    detectLineDifferences,
    scoreComparisonCandidate,
    comparisonEngineResults,
    rankPolymarketMockEvents,
    sourceHealth,
    buildSourceHealthSummary,
    getSourceStatus,
    isSourceStale,
    getSourceHealthBadge,
    summarizeSourceHealth,
    getGlobalDataMode,
    validateSourceHealthList,
    sourceRegistryHealthRows,
    findSourceRegistryHealth,
    getEnabledSources,
    getSourcesBySport,
    getSourcesByType,
    getSourceCapabilities,
    getAdapterSlot,
    getAdapterStatusLabel,
    getLiveReadySources,
    getMockSources,
    getDisabledSources,
    canSourceRunInCurrentMode,
    validateIncomingOddsPayload,
    normalizeIncomingOddsPayload,
    previewIncomingOddsPayload,
    rejectInvalidOddsPayload,
    isSourceReadyForLive,
    summarizeSourceRegistry,
    getSafeOddsRecords,
    getSafeSourceHealth,
    getFallbackComparisonState,
    hasUsableComparisonData,
    buildPolymarketSourceHealth,
    polymarketMockAdapterRecords
  };

  window.__oddsTerminalV555 = window.__oddsTerminalV554;
  window.__oddsTerminalV556 = window.__oddsTerminalV554;
  window.__oddsTerminalV557 = window.__oddsTerminalV554;
  window.__oddsTerminalV558 = window.__oddsTerminalV554;
  window.__oddsTerminalV559 = window.__oddsTerminalV554;
  window.__oddsTerminalV565 = window.__oddsTerminalV554;
  window.__oddsTerminalV577 = window.__oddsTerminalV554;

  window.omega_RenderOddsTerminal = async function () {
    readLocalState();
    const mount = qs("#omega-odds-render");
    if (!mount) return;
    if (!state.sources || !state.snapshot) {
      mount.innerHTML = `<div class="odds-v528-loading">Kaynaklar hazırlanıyor...</div>`;
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
