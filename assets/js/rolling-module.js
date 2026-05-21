// ===============================
// V47 ROLLING MAIN MODULE
// Bahis Rolling + Kombine Kupon Maçları / Kripto Rolling + Aktif Kripto İşlemleri
// Kasa Yönetimi'nden ayrılmış ana ROLLING sayfası.
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1";
  const ROLLING_KEY = "v19_rolling";
  const TARGETS = { 7: 1000, 15: 5000, 30: 15000, 60: 40000, 90: 100000 };

  const DEFAULT_STATE = {
    bank: 1000,
    modeSlots: {
      bet: createSlots("bet"),
      crypto: createSlots("crypto")
    }
  };

  function qs(id) { return document.getElementById(id); }

  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(v) {
    const n = Number(v || 0);
    return "%" + n.toFixed(2);
  }

  function createSlots(type = "bet") {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type,
      name: "",
      stake: "",
      odds: type === "bet" ? "1.30" : "2",
      status: "pending",
      pnl: 0
    }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const state = { ...DEFAULT_STATE, ...parsed };

      if (!state.modeSlots || typeof state.modeSlots !== "object") {
        const old = Array.isArray(state.slots) ? state.slots : createSlots("bet");
        state.modeSlots = {
          bet: old.map((s, i) => ({ ...createSlots("bet")[i], ...s, type: "bet" })),
          crypto: createSlots("crypto")
        };
      }

      if (!Array.isArray(state.modeSlots.bet) || state.modeSlots.bet.length !== 20) state.modeSlots.bet = createSlots("bet");
      if (!Array.isArray(state.modeSlots.crypto) || state.modeSlots.crypto.length !== 20) state.modeSlots.crypto = createSlots("crypto");

      state.modeSlots.bet.forEach(s => s.type = "bet");
      state.modeSlots.crypto.forEach(s => s.type = "crypto");

      return state;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function recalcSlot(slot) {
    const stake = Number(slot.stake || 0);
    const val = Number(slot.odds || 0);

    if (slot.status === "win") {
      if (slot.type === "bet") slot.pnl = stake * (val - 1);
      else slot.pnl = stake * (val / 100);
    } else if (slot.status === "loss") {
      if (slot.type === "bet") slot.pnl = -stake;
      else slot.pnl = -Math.abs(stake * (val / 100));
    } else {
      slot.pnl = 0;
    }
  }

  function slotSummary(slots) {
    const settled = slots.filter(s => s.status === "win" || s.status === "loss");
    const pnl = settled.reduce((sum, s) => sum + Number(s.pnl || 0), 0);
    const open = slots.filter(s => s.status === "pending").reduce((sum, s) => sum + Number(s.stake || 0), 0);
    const wins = settled.filter(s => s.status === "win").length;
    const losses = settled.filter(s => s.status === "loss").length;
    const used = settled.reduce((sum, s) => sum + Number(s.stake || 0), 0);
    const roi = used ? (pnl / used) * 100 : 0;
    return { settled: settled.length, pnl, open, wins, losses, roi };
  }

  function loadRollingDb() {
    try {
      return JSON.parse(localStorage.getItem(ROLLING_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function rollingSummary(modeFilter = "all") {
    const db = loadRollingDb();
    let startTotal = 0;
    let currentTotal = 0;
    let pnlTotal = 0;

    Object.entries(db).forEach(([key, plan]) => {
      if (!plan) return;
      const mode = plan.mode || (String(key).startsWith("crypto_") ? "crypto" : String(key).startsWith("bet_") ? "bet" : "bet");
      if (modeFilter !== "all" && mode !== modeFilter) return;

      let balance = Number(plan.startBal || 0);
      const start = balance;
      Object.values(plan.ops || {}).forEach(dayOps => {
        (dayOps || []).forEach(op => {
          if (!op) return;
          const amt = Number(op.amt || 0);
          const val = Number(op.odds || 0);
          const pnl = mode === "crypto"
            ? Math.abs(amt * (val / 100))
            : (op.res === "win" ? (amt * val) - amt : amt);
          balance += op.res === "win" ? pnl : -pnl;
        });
      });

      startTotal += start;
      currentTotal += balance;
      pnlTotal += (balance - start);
    });

    return { startTotal, currentTotal, pnlTotal };
  }

  function openRolling(mode, days) {
    localStorage.setItem("finance_rolling_mode", mode === "crypto" ? "crypto" : "bet");
    if (typeof window.omega_OpenRollingExcel === "function") {
      window.omega_OpenRollingExcel(days);
    } else {
      alert("Rolling modülü bulunamadı.");
    }
  }

  function renderRollingButtons(mode) {
    return [7, 15, 30, 60, 90].map(d => `
      <button type="button" data-roll="${mode}:${d}">
        <b>${d}</b><span>GÜN ROLLING</span>
      </button>
    `).join("");
  }

  function renderTable(mode, slots) {
    const isCrypto = mode === "crypto";
    const noteHead = isCrypto ? "AKTİF İŞLEM" : "MAÇ";
    const notePH = isCrypto ? "BTC Long TP1 / ETH Short" : "Arsenal Üst 2.5 / Kupon notu";
    const valHead = isCrypto ? "KÂR %" : "ORAN";
    const winText = isCrypto ? "KAZANÇ" : "KAZANDI";
    const lossText = isCrypto ? "KAYIP" : "KAYBETTİ";
    const pnlHead = isCrypto ? "PNL" : "K/Z";

    return `
      <div class="rolling-v47-table-wrap">
        <table class="rolling-v47-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tür</th>
              <th>${noteHead}</th>
              <th>Tutar</th>
              <th>${valHead}</th>
              <th>Durum</th>
              <th>${pnlHead}</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${slots.map((s, i) => {
              const status = s.status === "win" ? winText : s.status === "loss" ? lossText : "BEKLİYOR";
              const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td><span class="rolling-v47-type ${mode}">${isCrypto ? "Kripto" : "Bahis"}</span></td>
                  <td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePH}"></td>
                  <td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td>
                  <td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds || ""}" placeholder="${isCrypto ? "Kâr %" : "Oran"}"></td>
                  <td>${status}</td>
                  <td class="${pnlClass}">${money(s.pnl || 0)}</td>
                  <td>
                    <div class="rolling-v47-actions">
                      <button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win">${winText}</button>
                      <button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss">${lossText}</button>
                      <button type="button" class="pending" data-mode="${mode}" data-slot="${i}" data-status="pending">BEKLİYOR</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderModule() {
    const mount = qs("omega-rolling-render");
    if (!mount) return;

    const state = loadState();
    const bet = state.modeSlots.bet;
    const crypto = state.modeSlots.crypto;
    const betSum = slotSummary(bet);
    const cryptoSum = slotSummary(crypto);
    const rollSum = rollingSummary();
    const betRollSum = rollingSummary('bet');
    const cryptoRollSum = rollingSummary('crypto');
    const totalPnl = betSum.pnl + cryptoSum.pnl + rollSum.pnlTotal;

    mount.innerHTML = `
      <div class="rolling-v47-page">
        <div class="rolling-v47-hero">
          <div>
            <h2><i class="fa-solid fa-layer-group"></i> ROLLING</h2>
            <p>Bahis rolling, kombine kupon maçları, kripto rolling ve aktif kripto işlemleri burada yönetilir. Kasa Yönetimi sadece genel kasa merkezi olarak kalır.</p>
          </div>
          <div class="rolling-v47-hero-kpis">
            <div><span>Bahis P/L</span><b class="${betSum.pnl >= 0 ? "pos" : "neg"}">${money(betSum.pnl)}</b></div>
            <div><span>Kripto P/L</span><b class="${cryptoSum.pnl >= 0 ? "pos" : "neg"}">${money(cryptoSum.pnl)}</b></div>
            <div><span>Rolling P/L</span><b class="${rollSum.pnlTotal >= 0 ? "pos" : "neg"}">${money(rollSum.pnlTotal)}</b></div>
            <div><span>Toplam</span><b class="${totalPnl >= 0 ? "pos" : "neg"}">${money(totalPnl)}</b></div>
          </div>
        </div>

        <div class="rolling-v47-grid">
          <section class="rolling-v47-card bet">
            <div class="rolling-v47-head">
              <div>
                <h3><i class="fa-solid fa-ticket"></i> BAHİS</h3>
                <span>Bahis rolling ve kombine kupon maçları</span>
              </div>
              <div class="rolling-v47-mini">
                <span>${betSum.settled} kapalı · Rolling ${money(betRollSum.pnlTotal)}</span>
                <b class="${(betSum.pnl + betRollSum.pnlTotal) >= 0 ? "pos" : "neg"}">${money(betSum.pnl + betRollSum.pnlTotal)}</b>
              </div>
            </div>

            <div class="rolling-v47-roll-panel bet">
              <h4><i class="fa-solid fa-layer-group"></i> BAHİS ROLLING</h4>
              <div class="rolling-v47-roll-buttons">${renderRollingButtons("bet")}</div>
            </div>

            <div class="rolling-v47-section-title">
              <h4><i class="fa-solid fa-list-check"></i> KOMBİNE KUPON MAÇLARI</h4>
              <button type="button" data-clear="bet">BAHİSİ TEMİZLE</button>
            </div>
            ${renderTable("bet", bet)}
          </section>

          <section class="rolling-v47-card crypto">
            <div class="rolling-v47-head">
              <div>
                <h3><i class="fa-brands fa-bitcoin"></i> KRİPTO</h3>
                <span>Kripto rolling ve aktif kripto işlemleri</span>
              </div>
              <div class="rolling-v47-mini">
                <span>${cryptoSum.settled} kapalı · Rolling ${money(cryptoRollSum.pnlTotal)}</span>
                <b class="${(cryptoSum.pnl + cryptoRollSum.pnlTotal) >= 0 ? "pos" : "neg"}">${money(cryptoSum.pnl + cryptoRollSum.pnlTotal)}</b>
              </div>
            </div>

            <div class="rolling-v47-roll-panel crypto">
              <h4><i class="fa-solid fa-layer-group"></i> KRİPTO ROLLING</h4>
              <div class="rolling-v47-roll-buttons">${renderRollingButtons("crypto")}</div>
            </div>

            <div class="rolling-v47-section-title">
              <h4><i class="fa-solid fa-chart-simple"></i> AKTİF KRİPTO İŞLEMLERİ</h4>
              <button type="button" data-clear="crypto">KRİPTOYU TEMİZLE</button>
            </div>
            ${renderTable("crypto", crypto)}
          </section>
        </div>
      </div>
    `;

    bindEvents(mount, state);
  }

  function bindEvents(mount, state) {
    mount.querySelectorAll("[data-roll]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [mode, days] = String(btn.dataset.roll || "bet:7").split(":");
        openRolling(mode, Number(days || 7));
      });
    });

    mount.querySelectorAll("input[data-mode]").forEach(input => {
      input.addEventListener("input", () => {
        const mode = input.dataset.mode;
        const i = Number(input.dataset.slot);
        const key = input.dataset.key;
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        list[i][key] = input.value;
        list[i].type = mode;
        recalcSlot(list[i]);
        saveState(state);
        // KPI/PNL yenilensin diye çok sık komple çizme; kısa gecikme.
        clearTimeout(window.__rollingV47Refresh);
        window.__rollingV47Refresh = setTimeout(renderModule, 350);
      });
    });

    mount.querySelectorAll("button[data-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        const i = Number(btn.dataset.slot);
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        list[i].type = mode;
        list[i].status = btn.dataset.status;
        recalcSlot(list[i]);
        saveState(state);
        renderModule();
      });
    });

    mount.querySelectorAll("button[data-clear]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.clear;
        if (!confirm(mode === "crypto" ? "Kripto işlem alanları temizlensin mi?" : "Bahis kupon alanları temizlensin mi?")) return;
        state.modeSlots[mode] = createSlots(mode);
        saveState(state);
        renderModule();
      });
    });
  }

  window.omega_RenderRollingModule = renderModule;
  window.omega_RollingV47 = { loadState, saveState, slotSummary, rollingSummary, money };

  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY || e.key === ROLLING_KEY) {
      if (location.hash.startsWith("#rolling")) renderModule();
    }
  });
})();
