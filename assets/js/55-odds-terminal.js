// ===============================
// V528 ORAN TERMİNALİ
// Frontend odds terminal scaffold: kaynaklar, karşılaştırma, barem farkı,
// drop alarmı, arbitraj ve value hesaplama.
// Canlı veri çekme backend/veri motoru sonraki aşamada bağlanacak.
// ===============================

(function () {
  const DATA_SOURCES = "assets/data/odds-sources.json";
  const DATA_SNAPSHOT = "assets/data/odds-snapshot.json";
  const STORE_KEY = "v528_odds_terminal_state";

  const state = {
    tab: "opportunities",
    sport: "all",
    search: "",
    minDropPct: 8,
    minValuePct: 5,
    minLineGap: 1.5,
    sources: null,
    snapshot: null,
    lastLoadedAt: null
  };

  const FALLBACK_SOURCES = {
    sites: [],
    groups: [],
    marketGroups: []
  };

  const FALLBACK_SNAPSHOT = {
    mode: "empty",
    records: []
  };

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function money(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toFixed(2) : "-";
  }

  function pct(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? (x >= 0 ? "+" : "") + x.toFixed(1) + "%" : "-";
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
        minDropPct: state.minDropPct,
        minValuePct: state.minValuePct,
        minLineGap: state.minLineGap
      }));
    } catch {}
  }

  async function loadJson(url, fallback) {
    try {
      const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      console.warn("Odds terminal JSON yüklenemedi:", url, err);
      return fallback;
    }
  }

  function records() {
    const list = state.snapshot?.records || [];
    const search = String(state.search || "").toLowerCase().trim();
    return list.filter(r => {
      const sportOk = state.sport === "all" || r.sport === state.sport;
      const searchOk = !search || [r.match, r.league, r.bookmaker, r.marketLabel, r.outcome]
        .join(" ").toLowerCase().includes(search);
      return sportOk && searchOk;
    });
  }

  function sitesMap() {
    const map = {};
    (state.sources?.sites || []).forEach(s => map[s.id] = s);
    return map;
  }

  function siteName(id) {
    return sitesMap()[id]?.name || id;
  }

  function groupName(id) {
    const site = sitesMap()[id];
    const group = (state.sources?.groups || []).find(g => g.id === site?.group);
    return group?.name || site?.group || "-";
  }

  function historyText(r) {
    const history = Array.isArray(r.history) ? r.history.slice(-4) : [];
    const parts = [`İlk ${money(r.opening)}`];
    history.forEach((h, idx) => parts.push(`${idx + 1}. ${money(h)}`));
    parts.push(`Güncel ${money(r.current)}`);
    return parts.join(" → ");
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
      arbs: getArbs(list).length
    };
  }

  function shell() {
    const s = summary();
    const mode = state.snapshot?.mode === "demo" ? "Demo veri" : "Veri";
    return `
      <div class="odds-v528-shell">
        <div class="odds-v528-hero">
          <div>
            <div class="odds-v528-kicker"><i class="fa-solid fa-chart-line"></i> ORAN TERMİNALİ</div>
            <h2>Arbitraj · Value · Barem Farkı · Drop Alarmı</h2>
            <p>${mode}. Gerçek zamanlı veri motoru sonraki aşamada bu JSON şemasına bağlanacak.</p>
          </div>
          <button type="button" class="odds-v528-refresh" data-odds-action="refresh"><i class="fa-solid fa-rotate"></i> VERİYİ YENİLE</button>
        </div>

        <div class="odds-v528-kpis">
          <div><span>Kaynak</span><b>${s.sources}</b></div>
          <div><span>Maç</span><b>${s.matches}</b></div>
          <div><span>Oran Satırı</span><b>${s.records}</b></div>
          <div class="${s.arbs ? "hot" : ""}"><span>Arbitraj</span><b>${s.arbs}</b></div>
          <div class="${s.values ? "hot" : ""}"><span>Value</span><b>${s.values}</b></div>
          <div class="${s.lineGaps ? "hot" : ""}"><span>Barem Farkı</span><b>${s.lineGaps}</b></div>
          <div class="${s.drops ? "hot" : ""}"><span>Drop</span><b>${s.drops}</b></div>
        </div>

        <div class="odds-v528-toolbar">
          <div class="odds-v528-tabs">
            ${tabButton("opportunities", "Canlı Fırsatlar")}
            ${tabButton("compare", "Oran Karşılaştırma")}
            ${tabButton("arbitrage", "Arbitraj")}
            ${tabButton("value", "Value Avcısı")}
            ${tabButton("lines", "Barem Farkı")}
            ${tabButton("drops", "Drop Alarmı")}
            ${tabButton("sources", "Kaynaklar")}
          </div>
          <div class="odds-v528-filters">
            <select id="odds-v528-sport">
              <option value="all">Tüm Sporlar</option>
              <option value="football">Futbol</option>
              <option value="basketball">Basketbol</option>
            </select>
            <input id="odds-v528-search" type="search" placeholder="Maç, site, market ara..." value="${escapeHtml(state.search || "")}">
          </div>
        </div>

        <div class="odds-v528-content">${content()}</div>
      </div>`;
  }

  function tabButton(key, label) {
    return `<button type="button" class="${state.tab === key ? "active" : ""}" data-odds-tab="${key}">${label}</button>`;
  }

  function content() {
    if (state.tab === "compare") return renderCompare();
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
      <div class="odds-v528-grid">
        ${panel("Value Sinyalleri", renderValueList(values), "purple")}
        ${panel("Teorik Arbitraj", renderArbList(arbs), "green")}
        ${panel("Barem Farkı Dedektörü", renderLineList(lines), "blue")}
        ${panel("Drop Alarmı", renderDropList(drops), "red")}
      </div>`;
  }

  function panel(title, html, tone = "") {
    return `<section class="odds-v528-panel ${tone}">
      <div class="odds-v528-panel-head"><h3>${title}</h3></div>
      ${html || empty("Şimdilik fırsat yok.")}
    </section>`;
  }

  function renderCompare() {
    const rows = bestByMarket();
    if (!rows.length) return empty("Veri bulunamadı.");
    return `<div class="odds-v528-table-wrap"><table class="odds-v528-table">
      <thead><tr><th>Maç</th><th>Market</th><th>Barem</th><th>Seçim</th><th>En iyi site</th><th>Güncel</th><th>Oran akışı</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.league || "")}</small></td>
        <td>${escapeHtml(r.marketLabel)}</td>
        <td>${r.line ?? "-"}</td>
        <td>${escapeHtml(r.outcome)}</td>
        <td>${bookTag(r.bookmaker)}</td>
        <td class="odd">${money(r.current)}</td>
        <td class="flow">${escapeHtml(historyText(r))}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function renderArbs() {
    return renderArbList(getArbs(), true);
  }

  function renderArbList(list, full = false) {
    if (!list.length) return empty("Teorik arbitraj yakalanmadı.");
    return `<div class="odds-v528-cards">${list.map(a => `
      <article class="odds-v528-card arb">
        <div><b>${escapeHtml(a.match)}</b><small>${escapeHtml(a.league || "")}</small></div>
        <div class="odds-v528-big">${pct(a.profitPct)}</div>
        <div class="odds-v528-mini">
          <span>1: ${bookTag(a.best["1"].bookmaker)} ${money(a.best["1"].current)}</span>
          <span>X: ${bookTag(a.best["X"].bookmaker)} ${money(a.best["X"].current)}</span>
          <span>2: ${bookTag(a.best["2"].bookmaker)} ${money(a.best["2"].current)}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderValue() {
    return renderValueList(getValueAlerts(), true);
  }

  function renderValueList(list) {
    if (!list.length) return empty("Value eşiğini geçen oran yok.");
    return `<div class="odds-v528-cards">${list.map(r => `
      <article class="odds-v528-card value">
        <div><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.marketLabel)} · ${escapeHtml(r.outcome)}</small></div>
        <div class="odds-v528-big">${pct(r.evPct)}</div>
        <div class="odds-v528-mini">
          <span>${bookTag(r.bookmaker)} ${money(r.current)}</span>
          <span>Ref: ${pct(r.refPct).replace("+","")}</span>
          <span>Implied: ${pct(r.impliedPct).replace("+","")}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderLines() {
    return renderLineList(getLineGaps(), true);
  }

  function renderLineList(list) {
    if (!list.length) return empty("Barem farkı yok.");
    return `<div class="odds-v528-cards">${list.map(x => `
      <article class="odds-v528-card linegap">
        <div><b>${escapeHtml(x.match)}</b><small>${escapeHtml(x.marketLabel)} · ${escapeHtml(x.low.outcome)}</small></div>
        <div class="odds-v528-big">${x.gap.toFixed(1)} fark</div>
        <div class="odds-v528-mini">
          <span>Düşük: ${bookTag(x.low.bookmaker)} ${x.low.line} · ${money(x.low.current)}</span>
          <span>Yüksek: ${bookTag(x.high.bookmaker)} ${x.high.line} · ${money(x.high.current)}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderDrops() {
    return renderDropList(getDropAlerts(), true);
  }

  function renderDropList(list) {
    if (!list.length) return empty("Drop eşiğini geçen düşüş yok.");
    return `<div class="odds-v528-cards">${list.map(r => `
      <article class="odds-v528-card drop">
        <div><b>${escapeHtml(r.match)}</b><small>${escapeHtml(r.marketLabel)} · ${escapeHtml(r.outcome)}</small></div>
        <div class="odds-v528-big">${pct(r.changePct)}</div>
        <div class="odds-v528-mini">
          <span>${bookTag(r.bookmaker)}</span>
          <span>İlk: ${money(r.opening)}</span>
          <span>Güncel: ${money(r.current)}</span>
          <span>${escapeHtml(historyText(r))}</span>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderSources() {
    const sites = state.sources?.sites || [];
    if (!sites.length) return empty("Kaynak listesi boş.");
    return `<div class="odds-v528-table-wrap"><table class="odds-v528-table sources">
      <thead><tr><th>Site</th><th>Tip</th><th>Altyapı</th><th>Durum</th><th>Link</th></tr></thead>
      <tbody>${sites.map(s => `<tr>
        <td><b>${escapeHtml(s.name)}</b><small>${escapeHtml(s.id)}</small></td>
        <td>${escapeHtml(s.type || "-")}</td>
        <td>${escapeHtml(groupName(s.id))}</td>
        <td><span class="odds-v528-status ${s.enabled ? "on" : "off"}">${s.enabled ? "Aktif" : "Kapalı"}</span></td>
        <td>${s.url ? `<a class="odds-v528-open" href="${escapeAttr(s.url)}" target="_blank" rel="noopener noreferrer">AÇ</a>` : `<span class="muted">Backend/API bekliyor</span>`}</td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function empty(text) {
    return `<div class="odds-v528-empty">${escapeHtml(text)}</div>`;
  }

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

    const sport = qs("#odds-v528-sport");
    if (sport) {
      sport.value = state.sport || "all";
      sport.addEventListener("change", () => {
        state.sport = sport.value || "all";
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

  function escapeAttr(str) {
    return escapeHtml(str).replace(/`/g, "&#96;");
  }

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

  window.addEventListener("hashchange", () => {
    const key = String(location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (key === "odds") setTimeout(() => window.omega_RenderOddsTerminal?.(), 20);
  });

  // V529 HARD ROUTE FIX:
  // Eski router bazı dosyalarda #odds dalını tanımadığı için Oran Terminali görünmeyebiliyordu.
  // Bu bölüm nav + block'u garanti eder ve #odds rotasını kendi başına açar.
  function ensureOddsDom() {
    const navContainer = document.querySelector("#main-dropdown-nav .nav-container") || document.getElementById("main-dropdown-nav");
    if (navContainer && !document.getElementById("nav-odds")) {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.id = "nav-odds";
      a.href = "#odds";
      a.innerHTML = '<i class="fa-solid fa-chart-line"></i> ORAN TERMİNALİ';
      const crypto = document.getElementById("nav-crypto");
      if (crypto && crypto.parentNode === navContainer) navContainer.insertBefore(a, crypto);
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

    const hideIds = [
      "omega-radar-block",
      "omega-favs-block",
      "omega-stream-block",
      "omega-live-block",
      "omega-live-center-block",
      "omega-crypto-block",
      "omega-rolling-block"
    ];
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

    document.body.classList.remove(
      "omega-tab-futbol",
      "omega-tab-basketbol",
      "omega-tab-rolling",
      "omega-tab-stream",
      "omega-tab-favs",
      "omega-tab-live",
      "omega-tab-crypto",
      "omega-tab-finance"
    );
    document.body.classList.add("omega-tab-odds");
    document.body.classList.remove("rolling-active");
    document.documentElement.classList.remove("rolling-hash-boot");

    document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
    document.getElementById("nav-odds")?.classList.add("active");

    const title = document.getElementById("active-module-name");
    if (title) title.innerHTML = '<span style="color:#a855f7">/ ORAN TERMİNALİ</span>';

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
