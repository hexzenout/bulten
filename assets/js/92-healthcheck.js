// ===============================
// BULTEN SITE HEALTHCHECK — V749
// Genel site guard: modül, asset, route ve katalog sağlık denetimi.
// UI'yi değiştirmez; console, body dataset ve window.BULTEN_HEALTH üzerinden rapor verir.
// ===============================

(function () {
  "use strict";

  const VERSION = "v749";
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
    { key: "stream", label: "Canlı Yayın", id: "omega-stream-block" },
    { key: "crypto", label: "Kripto", id: "omega-crypto-block" },
    { key: "odds", label: "Oran Terminali", id: "omega-odds-block" },
    { key: "rolling", label: "Rolling", id: "omega-rolling-block" },
    { key: "finance", label: "Kasa", id: "finance-dashboard" }
  ];

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
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0;
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

  function checkRoutes() {
    const rows = ROUTE_BLOCKS.map(row => {
      const el = document.getElementById(row.id);
      return { ...row, exists: Boolean(el), visible: visible(el) };
    });
    const visibleRows = rows.filter(row => row.visible);
    const activeHash = String(location.hash || "#futbol");
    const suspicious = visibleRows.length > 2;
    return { rows, visibleRows, activeHash, suspicious };
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
    const oddsCatalog = checkOddsCatalog();
    const libraries = checkExternalLibraries();

    const hardIssues = [];
    const softIssues = [];

    requiredAssets.filter(row => !row.found).forEach(row => hardIssues.push(`Eksik asset: ${row.label}`));
    duplicateAssets.forEach(row => softIssues.push(`Tekrarlı asset: ${row.key} x${row.count}`));
    functions.filter(row => !row.ok).forEach(row => hardIssues.push(`${row.label} eksik fonksiyon: ${row.missing.join(", ")}`));
    libraries.filter(row => !row.ok).forEach(row => softIssues.push(`${row.label} henüz hazır değil`));
    if (routes.suspicious) softIssues.push(`Route görünürlük şüphesi: ${routes.visibleRows.map(row => row.label).join(", ")}`);
    if (oddsCatalog.available && oddsCatalog.ok === false) hardIssues.push(`Market katalog audit uyarısı: ${(oddsCatalog.issues || []).join(" | ") || "kontrol gerekli"}`);

    const ok = hardIssues.length === 0;
    return {
      version: VERSION,
      ok,
      status: ok ? (softIssues.length ? "warning" : "ok") : "error",
      checkedAt: new Date().toISOString(),
      activeHash: routes.activeHash,
      counts: {
        scripts: assets.scripts.length,
        styles: assets.styles.length,
        requiredAssets: requiredAssets.length,
        duplicateAssets: duplicateAssets.length,
        functionGroups: functions.length,
        visibleRoutes: routes.visibleRows.length
      },
      hardIssues,
      softIssues,
      assets: { required: requiredAssets, duplicates: duplicateAssets },
      functions,
      routes,
      oddsCatalog,
      libraries
    };
  }

  function writeBodyState(report) {
    if (!document.body) return;
    document.body.dataset.bultenHealth = report.status;
    document.body.dataset.bultenHealthVersion = VERSION;
    document.body.dataset.v30Modules = report.ok ? "ok" : "missing";
    if (report.ok) document.body.classList.add("v30-modular-ready", "bulten-health-ready");
    else document.body.classList.add("bulten-health-warning");
  }

  function logReport(report) {
    const title = report.ok ? `[BULTEN ${VERSION}] Site sağlık kontrolü hazır` : `[BULTEN ${VERSION}] Site sağlık kontrolü uyarı verdi`;
    const log = report.ok ? console.info : console.warn;
    log(title, {
      status: report.status,
      hardIssues: report.hardIssues,
      softIssues: report.softIssues,
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

  window.BULTEN_HEALTH = {
    version: VERSION,
    run: runHealthcheck,
    report: () => lastReport || runHealthcheck({ silent: true }),
    status: () => (lastReport || runHealthcheck({ silent: true })).status
  };

  window.addEventListener("DOMContentLoaded", function () {
    CHECK_DELAYS.forEach((ms, index) => setTimeout(() => runHealthcheck({ silent: index === 0 }), ms));
  });

  window.addEventListener("hashchange", function () {
    setTimeout(() => runHealthcheck({ silent: true }), 250);
  });
})();
