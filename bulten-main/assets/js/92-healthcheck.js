// ===============================
// BULTEN SITE HEALTHCHECK — V750
// Genel site guard: modül, asset, route izolasyonu ve katalog sağlık denetimi.
// UI'yi değiştirmez; console, body dataset ve window.BULTEN_HEALTH üzerinden rapor verir.
// ===============================

(function () {
  "use strict";

  const VERSION = "v750";
  const CHECK_DELAYS = [500, 1800, 4500];

  const REQUIRED_FUNCTION_GROUPS = [
    {
      key: "core",
      label: "Ana çekirdek",
      required: ["omega_SwitchMainTab", "omega_InitializeEngine", "omega_ExecuteRadarFilter"]
    },
    {
      key: "stream",
      label: "Canlı Yayın",
      required: ["omega_BuildStreamMatrix", "omega_BootStreamV49"]
    },
    {
      key: "odds",
      label: "Oran Terminali",
      required: ["omega_RenderOddsTerminal", "omega_ShowOddsTerminal"]
    },
    {
      key: "crypto",
      label: "Kripto Terminal",
      required: ["omega_V10RefreshCrypto", "omega_V10DrawChart"]
    },
    {
      key: "rolling",
      label: "Rolling",
      required: ["omega_RenderRollingModule", "omega_OpenRollingExcel"]
    },
    {
      key: "finance",
      label: "Kasa Yönetimi",
      required: ["omega_RefreshFinanceDashboard"]
    },
    {
      key: "live",
      label: "Canlı Takip",
      required: ["omega_LoadLiveScores", "omega_RefreshLiveCenter"]
    }
  ];

  const REQUIRED_ASSET_PATTERNS = [
    { type: "css", label: "base css", pattern: "assets/css/00-base.css" },
    { type: "css", label: "odds css", pattern: "assets/css/55-odds-terminal.css" },
    { type: "css", label: "odds live gate css", pattern: "assets/css/55-odds-terminal-live-gate.css" },
    { type: "css", label: "odds final ui css", pattern: "assets/css/55-odds-terminal-final-ui.css" },
    { type: "css", label: "final fixes css", pattern: "assets/css/90-final-fixes.css" },
    { type: "js", label: "core js", pattern: "assets/js/00-omega-core.js" },
    { type: "js", label: "stream js", pattern: "assets/js/20-stream-core.js" },
    { type: "js", label: "odds js", pattern: "assets/js/55-odds-terminal.js" },
    { type: "js", label: "crypto js", pattern: "assets/js/60-crypto-core.js" },
    { type: "js", label: "rolling js", pattern: "assets/js/70-rolling-core.js" },
    { type: "js", label: "runtime js", pattern: "assets/js/91-runtime-core.js" },
    { type: "js", label: "healthcheck js", pattern: "assets/js/92-healthcheck.js" }
  ];

  const ROUTE_BLOCKS = [
    { key: "radar", label: "Radar", id: "omega-radar-block" },
    { key: "favs", label: "Favoriler", id: "omega-favs-block" },
    { key: "stream", label: "Canlı Yayın", id: "omega-stream-block" },
    { key: "live", label: "Canlı Takip", id: "omega-live-block" },
    { key: "crypto", label: "Kripto", id: "omega-crypto-block" },
    { key: "odds", label: "Oran Terminali", id: "omega-odds-block" },
    { key: "rolling", label: "Rolling", id: "omega-rolling-block" },
    { key: "finance", label: "Kasa", id: "v19-finance-block" }
  ];

  const ROUTE_EXPECTATIONS = {
    futbol: { expected: ["radar"], bodyClass: "omega-tab-futbol", nav: "nav-futbol" },
    basketbol: { expected: ["radar"], bodyClass: "omega-tab-basketbol", nav: "nav-basketbol" },
    home: { expected: ["radar"], bodyClass: "omega-tab-futbol", nav: "nav-home" },
    favs: { expected: ["favs"], bodyClass: "omega-tab-favs", nav: "nav-favs" },
    stream: { expected: ["stream"], bodyClass: "omega-tab-stream", nav: "nav-stream" },
    live: { expected: ["live"], bodyClass: "omega-tab-live", nav: "nav-live" },
    crypto: { expected: ["crypto"], bodyClass: "omega-tab-crypto", nav: "nav-crypto" },
    odds: { expected: ["odds"], bodyClass: "omega-tab-odds", nav: "nav-odds" },
    rolling: { expected: ["rolling"], bodyClass: "omega-tab-rolling", nav: "nav-rolling" },
    finance: { expected: ["finance"], bodyClass: "omega-tab-finance", nav: "nav-finance" }
  };

  const ROUTE_ALIASES = {
    "": "futbol",
    ana: "futbol",
    home: "futbol",
    soccer: "futbol",
    football: "futbol",
    basket: "basketbol",
    canli: "stream",
    "canli-yayin": "stream",
    yayin: "stream",
    oran: "odds",
    odds_terminal: "odds",
    polymarket: "odds",
    poly: "odds",
    kasa: "finance"
  };

  function normalizeAssetUrl(value) {
    try {
      const url = new URL(value, location.href);
      return url.pathname.replace(/^\/bulten\//, "").replace(/^\//, "");
    } catch (err) {
      return String(value || "").split("?")[0].replace(/^\/bulten\//, "").replace(/^\//, "");
    }
  }

  function visible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rects = typeof el.getClientRects === "function" ? el.getClientRects().length : 1;
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0 && rects > 0;
  }

  function getRouteKey(hashValue) {
    const raw = String(hashValue || location.hash || "#futbol").replace(/^#\/?/, "").split("/")[0].toLowerCase();
    return ROUTE_ALIASES[raw] || raw || "futbol";
  }

  function getExpectedRoute(hashValue) {
    const key = getRouteKey(hashValue);
    return ROUTE_EXPECTATIONS[key] ? key : "futbol";
  }

  function collectAssets() {
    const scripts = Array.from(document.querySelectorAll("script[src]")).map(el => ({
      type: "js",
      raw: el.getAttribute("src") || "",
      path: normalizeAssetUrl(el.getAttribute("src") || "")
    }));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map(el => ({
      type: "css",
      raw: el.getAttribute("href") || "",
      path: normalizeAssetUrl(el.getAttribute("href") || "")
    }));
    return { scripts, styles, all: scripts.concat(styles) };
  }

  function findDuplicateAssets(assets) {
    const seen = new Map();
    assets.all.forEach(row => {
      const key = `${row.type}:${row.path}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(row.raw);
    });
    return Array.from(seen.entries())
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ key, count: rows.length, rows }));
  }

  function checkRequiredAssets(assets) {
    return REQUIRED_ASSET_PATTERNS.map(req => {
      const pool = req.type === "js" ? assets.scripts : assets.styles;
      const found = pool.some(row => row.path === req.pattern || row.path.endsWith(req.pattern));
      return { ...req, found };
    });
  }

  function checkFunctions() {
    return REQUIRED_FUNCTION_GROUPS.map(group => {
      const missing = group.required.filter(name => typeof window[name] !== "function");
      return {
        key: group.key,
        label: group.label,
        ok: missing.length === 0,
        missing,
        total: group.required.length
      };
    });
  }

  function collectRouteRows() {
    return ROUTE_BLOCKS.map(row => {
      const el = document.getElementById(row.id);
      const isVisible = visible(el);
      return {
        ...row,
        exists: Boolean(el),
        visible: isVisible,
        display: el ? getComputedStyle(el).display : "missing",
        classes: el ? Array.from(el.classList || []) : []
      };
    });
  }

  function checkRoutes() {
    const rows = collectRouteRows();
    const activeHash = String(location.hash || "#futbol");
    const activeRoute = getExpectedRoute(activeHash);
    const expectation = ROUTE_EXPECTATIONS[activeRoute] || ROUTE_EXPECTATIONS.futbol;
    const expectedKeys = new Set(expectation.expected || []);
    const visibleRows = rows.filter(row => row.visible);
    const unexpectedVisible = visibleRows.filter(row => !expectedKeys.has(row.key));
    const expectedMissing = Array.from(expectedKeys)
      .map(key => rows.find(row => row.key === key))
      .filter(row => !row || !row.exists || !row.visible)
      .map(row => row ? row.key : "missing");

    const bodyClasses = document.body ? Array.from(document.body.classList || []) : [];
    const omegaTabClasses = bodyClasses.filter(name => /^omega-tab-/.test(name));
    const navActive = Array.from(document.querySelectorAll("#main-dropdown-nav .nav-link.active"))
      .map(el => el.id || el.getAttribute("href") || el.textContent.trim());
    const expectedBodyClass = expectation.bodyClass;
    const expectedNav = expectation.nav;

    const bodyMismatch = Boolean(expectedBodyClass && document.body && !document.body.classList.contains(expectedBodyClass));
    const multipleTabClasses = omegaTabClasses.length > 1;
    const navMismatch = Boolean(expectedNav && navActive.length && !navActive.includes(expectedNav));
    const suspicious = unexpectedVisible.length > 0 || expectedMissing.length > 0 || multipleTabClasses || navMismatch;

    return {
      rows,
      visibleRows,
      activeHash,
      activeRoute,
      expectedKeys: Array.from(expectedKeys),
      unexpectedVisible,
      expectedMissing,
      omegaTabClasses,
      multipleTabClasses,
      bodyMismatch,
      navActive,
      navMismatch,
      suspicious
    };
  }

  function checkModuleIsolation() {
    const routes = checkRoutes();
    const issues = [];
    if (routes.unexpectedVisible.length) {
      issues.push(`Beklenmeyen görünür modül: ${routes.unexpectedVisible.map(row => row.label).join(", ")}`);
    }
    if (routes.expectedMissing.length) {
      issues.push(`Beklenen modül gizli/eksik: ${routes.expectedMissing.join(", ")}`);
    }
    if (routes.multipleTabClasses) {
      issues.push(`Birden fazla omega-tab body class var: ${routes.omegaTabClasses.join(", ")}`);
    }
    if (routes.navMismatch) {
      issues.push(`Aktif menü hash ile uyumsuz: ${routes.navActive.join(", ") || "yok"}`);
    }
    return {
      ok: issues.length === 0,
      activeRoute: routes.activeRoute,
      activeHash: routes.activeHash,
      issues,
      routes
    };
  }

  function checkOddsCatalog() {
    const api = window.__oddsTerminalV554 || window.__oddsTerminalV577;
    if (!api || typeof api.marketCatalogAudit !== "function") {
      return { available: false, ok: null, note: "Oran Terminali audit API henüz hazır değil." };
    }
    try {
      const audit = api.marketCatalogAudit();
      return {
        available: true,
        ok: Boolean(audit && audit.ok),
        footballCount: Number(audit?.footballCount || 0),
        basketballCount: Number(audit?.basketballCount || 0),
        issues: Array.isArray(audit?.issues) ? audit.issues : [],
        notes: Array.isArray(audit?.notes) ? audit.notes : [],
        raw: audit
      };
    } catch (err) {
      return { available: true, ok: false, issues: [err.message || String(err)] };
    }
  }

  function checkExternalLibraries() {
    return [
      { key: "apexcharts", label: "ApexCharts", ok: typeof window.ApexCharts !== "undefined" },
      { key: "lightweightCharts", label: "LightweightCharts", ok: typeof window.LightweightCharts !== "undefined" }
    ];
  }

  function createReport() {
    const assets = collectAssets();
    const requiredAssets = checkRequiredAssets(assets);
    const duplicateAssets = findDuplicateAssets(assets);
    const functions = checkFunctions();
    const routes = checkRoutes();
    const moduleIsolation = checkModuleIsolation();
    const oddsCatalog = checkOddsCatalog();
    const libraries = checkExternalLibraries();

    const hardIssues = [];
    const softIssues = [];

    requiredAssets.filter(row => !row.found).forEach(row => hardIssues.push(`Eksik asset: ${row.label}`));
    duplicateAssets.forEach(row => softIssues.push(`Tekrarlı asset: ${row.key} x${row.count}`));
    functions.filter(row => !row.ok).forEach(row => hardIssues.push(`${row.label} eksik fonksiyon: ${row.missing.join(", ")}`));
    libraries.filter(row => !row.ok).forEach(row => softIssues.push(`${row.label} henüz hazır değil`));
    if (routes.suspicious) softIssues.push(`Route izolasyon şüphesi: ${moduleIsolation.issues.join(" | ")}`);
    if (oddsCatalog.available && oddsCatalog.ok === false) hardIssues.push(`Market katalog audit uyarısı: ${(oddsCatalog.issues || []).join(" | ") || "kontrol gerekli"}`);

    const ok = hardIssues.length === 0;
    return {
      version: VERSION,
      ok,
      status: ok ? (softIssues.length ? "warning" : "ok") : "error",
      checkedAt: new Date().toISOString(),
      activeHash: routes.activeHash,
      activeRoute: routes.activeRoute,
      counts: {
        scripts: assets.scripts.length,
        styles: assets.styles.length,
        requiredAssets: requiredAssets.length,
        duplicateAssets: duplicateAssets.length,
        functionGroups: functions.length,
        visibleRoutes: routes.visibleRows.length,
        unexpectedVisibleRoutes: routes.unexpectedVisible.length
      },
      hardIssues,
      softIssues,
      assets: { required: requiredAssets, duplicates: duplicateAssets },
      functions,
      routes,
      moduleIsolation,
      oddsCatalog,
      libraries
    };
  }

  function writeBodyState(report) {
    if (!document.body) return;
    document.body.dataset.bultenHealth = report.status;
    document.body.dataset.bultenHealthVersion = VERSION;
    document.body.dataset.bultenActiveRoute = report.activeRoute;
    document.body.dataset.bultenRouteGuard = report.moduleIsolation.ok ? "ok" : "warning";
    document.body.dataset.v30Modules = report.ok ? "ok" : "missing";
    if (report.ok) document.body.classList.add("v30-modular-ready", "bulten-health-ready");
    else document.body.classList.add("bulten-health-warning");
    if (report.moduleIsolation.ok) document.body.classList.add("bulten-route-guard-ready");
    else document.body.classList.add("bulten-route-guard-warning");
  }

  function logReport(report) {
    const title = report.ok ? `[BULTEN ${VERSION}] Site sağlık kontrolü hazır` : `[BULTEN ${VERSION}] Site sağlık kontrolü uyarı verdi`;
    const log = report.ok ? console.info : console.warn;
    log(title, {
      status: report.status,
      activeRoute: report.activeRoute,
      hardIssues: report.hardIssues,
      softIssues: report.softIssues,
      routeGuard: report.moduleIsolation.ok ? "ok" : report.moduleIsolation.issues,
      oddsCatalog: report.oddsCatalog?.available ? {
        football: report.oddsCatalog.footballCount,
        basketball: report.oddsCatalog.basketballCount,
        ok: report.oddsCatalog.ok
      } : "pending",
      counts: report.counts
    });
  }

  let lastReport = null;
  function runHealthcheck({ silent = false } = {}) {
    lastReport = createReport();
    writeBodyState(lastReport);
    if (!silent) logReport(lastReport);
    return lastReport;
  }

  function routeAudit() {
    const report = runHealthcheck({ silent: true });
    return report.moduleIsolation;
  }

  window.BULTEN_ROUTE_GUARD = {
    version: VERSION,
    audit: routeAudit,
    report: routeAudit,
    expectedRoute: () => getExpectedRoute(location.hash),
    visibleRoutes: () => collectRouteRows().filter(row => row.visible)
  };

  window.BULTEN_HEALTH = {
    version: VERSION,
    run: runHealthcheck,
    report: () => lastReport || runHealthcheck({ silent: true }),
    status: () => (lastReport || runHealthcheck({ silent: true })).status,
    route: routeAudit
  };

  window.addEventListener("DOMContentLoaded", function () {
    CHECK_DELAYS.forEach((ms, index) => setTimeout(() => runHealthcheck({ silent: index === 0 }), ms));
  });

  window.addEventListener("hashchange", function () {
    setTimeout(() => runHealthcheck({ silent: true }), 250);
    setTimeout(() => runHealthcheck({ silent: true }), 900);
  });
})();
