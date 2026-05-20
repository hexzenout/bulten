// ===============================
// V32 PROFESSIONAL UPGRADE
// Ses paneli, Rolling + işlem sayısı, kasa boş durumları ve küçük UI temizlikleri.
// ===============================

(function () {
  const SOUND_KEY = "v28_alarm_audio_settings";
  const POPULAR = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","TON","TRX","DOT","MATIC","NEAR","ATOM","APT","ARB","OP","INJ","SUI","PEPE","WIF","FET","RNDR","LTC","BCH","ETC","UNI","AAVE","FIL"];

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function getSoundSettings() {
    try {
      return {
        enabled: false,
        sound: "digital",
        volume: 0.75,
        durationSec: 60,
        customDataUrl: "",
        customName: "",
        customStart: 0,
        customEnd: 0,
        ...JSON.parse(localStorage.getItem(SOUND_KEY) || "{}")
      };
    } catch {
      return { enabled: false, sound: "digital", volume: 0.75, durationSec: 60, customDataUrl: "", customName: "", customStart: 0, customEnd: 0 };
    }
  }

  function setSoundSettings(next) {
    const current = getSoundSettings();
    const merged = { ...current, ...next };
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function renderSoundPanel(force = false) {
    const mount = qs("#v28-sound-mount");
    if (!mount) return;
    if (mount.dataset.ready === "v32" && !force) return;
    const pane = mount.closest(".crypto-v28-panel");
    if (pane) {
      Array.from(pane.children).forEach(child => { if (child !== mount) child.remove(); });
    }

    const s = getSoundSettings();
    mount.dataset.ready = "v32";
    mount.innerHTML = `
      <div class="v32-sound-card">
        <div class="v32-sound-head">
          <div>
            <b>Alarm Ses Merkezi</b>
            <span>Ses, özel şarkı, çalma süresi ve seçili aralık.</span>
          </div>
          <span class="terminal-v10-live-dot ${s.enabled ? "ok" : ""}">${s.enabled ? "SES AÇIK" : "SES KAPALI"}</span>
        </div>

        <div class="v32-sound-actions">
          <button id="v32-sound-toggle" class="${s.enabled ? "active" : ""}">${s.enabled ? "SES AÇIK" : "SESİ AÇ"}</button>
          <button id="v32-sound-test">SEÇİLİ SESİ TEST ET</button>
          <button id="v32-sound-stop" class="danger">SESİ DURDUR</button>
        </div>

        <div class="v32-sound-grid">
          <div class="v32-sound-field">
            <label>Ses Tipi</label>
            <select id="v32-sound-type">
              <option value="digital">Dijital Uyarı</option>
              <option value="bip">Standart Bip</option>
              <option value="chime">Yumuşak Chime</option>
              <option value="siren">Siren</option>
              <option value="custom">Özel Ses</option>
              <option value="silent">Sessiz</option>
            </select>
          </div>

          <div class="v32-sound-field">
            <label>Alarm Çalma Süresi <span class="v32-slider-value" id="v32-duration-label">${s.durationSec}s</span></label>
            <input id="v32-duration" type="range" min="60" max="180" step="10" value="${Math.max(60, Number(s.durationSec || 60))}">
          </div>

          <div class="v32-sound-field">
            <label>Ses Seviyesi <span class="v32-slider-value" id="v32-volume-label">${Math.round(Number(s.volume || .75) * 100)}%</span></label>
            <input id="v32-volume" type="range" min="0" max="1" step="0.05" value="${Number(s.volume || .75)}">
          </div>

          <div class="v32-sound-field v32-custom-file-field">
            <label>Özel Ses Dosyası</label>
            <div class="v32-file-row">
              <button type="button" class="v32-file-btn" id="v32-file-pick">DOSYA SEÇ</button>
              <div class="v32-file-name" id="v32-file-name" title="${s.customName || "Henüz özel ses seçilmedi"}">${s.customName || "Henüz özel ses seçilmedi"}</div>
              <input id="v32-file-input" type="file" accept="audio/*" hidden>
            </div>
          </div>

          <div class="v32-sound-field">
            <label>Başlangıç Saniyesi <span class="v32-slider-value" id="v32-start-label">${Number(s.customStart || 0)}s</span></label>
            <input id="v32-start" type="range" min="0" max="180" step="1" value="${Number(s.customStart || 0)}">
          </div>

          <div class="v32-sound-field">
            <label>Bitiş Saniyesi <span class="v32-slider-value" id="v32-end-label">${Number(s.customEnd || 0)}s</span></label>
            <input id="v32-end" type="range" min="0" max="180" step="1" value="${Number(s.customEnd || 0)}">
          </div>
        </div>
      </div>
    `;

    qs("#v32-sound-type").value = s.sound || "digital";

    qs("#v32-sound-toggle").onclick = () => {
      const next = setSoundSettings({ enabled: true });
      if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
      renderSoundPanel(true);
    };

    qs("#v32-sound-stop").onclick = () => {
      if (window.V26AlarmAudio?.stop) window.V26AlarmAudio.stop();
      const btn = qs("#v32-sound-test");
      if (btn) {
        btn.classList.remove("testing");
        btn.textContent = "SEÇİLİ SESİ TEST ET";
      }
    };

    qs("#v32-sound-test").onclick = () => {
      const btn = qs("#v32-sound-test");
      btn.classList.add("testing");
      btn.textContent = "ÇALIYOR...";
      setSoundSettings({ enabled: true });
      if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
      if (window.V26AlarmAudio?.testSelected) window.V26AlarmAudio.testSelected();
      else if (window.V26AlarmAudio?.play) window.V26AlarmAudio.play("Test alarmı");
      setTimeout(() => {
        btn.classList.remove("testing");
        btn.textContent = "SEÇİLİ SESİ TEST ET";
      }, 1600);
    };

    qs("#v32-sound-type").onchange = e => setSoundSettings({ sound: e.target.value });
    qs("#v32-duration").oninput = e => {
      qs("#v32-duration-label").textContent = e.target.value + "s";
      setSoundSettings({ durationSec: Number(e.target.value) });
    };
    qs("#v32-volume").oninput = e => {
      qs("#v32-volume-label").textContent = Math.round(Number(e.target.value) * 100) + "%";
      setSoundSettings({ volume: Number(e.target.value) });
    };
    qs("#v32-start").oninput = e => {
      qs("#v32-start-label").textContent = e.target.value + "s";
      setSoundSettings({ customStart: Number(e.target.value) });
    };
    qs("#v32-end").oninput = e => {
      qs("#v32-end-label").textContent = e.target.value + "s";
      setSoundSettings({ customEnd: Number(e.target.value) });
    };
    qs("#v32-file-pick").onclick = () => qs("#v32-file-input")?.click();
    qs("#v32-file-input").onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const nameEl = qs("#v32-file-name");
      if (nameEl) {
        nameEl.textContent = "Yükleniyor: " + file.name;
        nameEl.title = file.name;
      }

      try {
        let next;
        if (window.V26AlarmAudio?.setCustomFile) {
          next = await window.V26AlarmAudio.setCustomFile(file);
        } else {
          const reader = new FileReader();
          next = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(setSoundSettings({ customDataUrl: String(reader.result || ""), customName: file.name, sound: "custom" }));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        localStorage.setItem(SOUND_KEY, JSON.stringify({ ...getSoundSettings(), customName: file.name, sound: "custom", customDataUrl: "", enabled: true }));
        if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
        if (nameEl) {
          nameEl.textContent = file.name;
          nameEl.title = file.name;
        }
        renderSoundPanel(true);
      } catch (err) {
        if (nameEl) {
          nameEl.textContent = "Dosya yüklenemedi";
          nameEl.title = "Dosya yüklenemedi";
        }
        alert("Ses dosyası yüklenemedi. Daha küçük bir MP3/WAV dosyası dene.");
      }
    };
  }

  function prepareCryptoForm() {
    let list = qs("#crypto-symbol-list");
    if (!list) {
      list = document.createElement("datalist");
      list.id = "crypto-symbol-list";
      document.body.appendChild(list);
    }
    list.innerHTML = POPULAR.map(s => `<option value="${s}">${s}USDT</option>`).join("");

    qsa(".crypto-v28-tab").forEach(btn => {
      const panel = btn.dataset.cryptoPanel;
      if (panel === "graph") btn.querySelector("span") && (btn.querySelector("span").textContent = "Grafik");
      if (panel === "plan") btn.querySelector("span") && (btn.querySelector("span").textContent = "İşlem");
      if (panel === "alarm") btn.querySelector("span") && (btn.querySelector("span").textContent = "Alarm");
      if (panel === "sound") btn.querySelector("span") && (btn.querySelector("span").textContent = "Ses");
      if (panel === "settings") btn.querySelector("span") && (btn.querySelector("span").textContent = "Ayar");
    });
  }

  function fixFinanceEmptyState() {
    const chart = qs("#omega-apex-chart-main");
    if (!chart) return;
    const values = (() => {
      try { return JSON.parse(localStorage.getItem("v19_h") || "[]"); } catch { return []; }
    })();

    if (!values || values.length <= 1) {
      chart.innerHTML = `<div class="v32-empty-chart"><div><b>Henüz bakiye geçmişi yok</b><span>İlk işlem veya kasa güncellemesi sonrası grafik oluşacak.</span></div></div>`;
    }
  }

  function ensureRollingPlan() {
    if (!_ROLLING_DB[_ACTIVE_EXCEL_DAYS]) _ROLLING_DB[_ACTIVE_EXCEL_DAYS] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {} };
    const plan = _ROLLING_DB[_ACTIVE_EXCEL_DAYS];
    if (!plan.ops) plan.ops = {};
    return plan;
  }

  function setDayCount(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    plan.ops[day].push(null);
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    if (plan.ops[day].length > 1) plan.ops[day].pop();
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = setDayCount;

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      plan.ops[day].length = Math.max(count, plan.ops[day].filter(Boolean).length);
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = [];
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RenderExcelTable = function() {
    const wrapper = qs("#excel-body-content");
    if (!wrapper) return;
    const currentPlan = ensureRollingPlan();
    let runningBalance = Number(currentPlan.startBal || 100);
    let totalProfit = 0;
    let htmlBuffer = "";

    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!currentPlan.ops[day]) currentPlan.ops[day] = new Array(10).fill(null);
      if (currentPlan.ops[day].length < 1) currentPlan.ops[day] = new Array(1).fill(null);
      const dayOps = currentPlan.ops[day];
      const dayStart = runningBalance;
      let dayProfit = 0;

      const cards = [];
      for (let slot = 0; slot < dayOps.length; slot++) {
        const op = dayOps[slot];
        if (op) {
          const amt = Number(op.amt || 0);
          const odds = Number(op.odds || 0);
          const pnl = op.res === "win" ? (amt * odds) - amt : amt;
          if (op.res === "win") { runningBalance += pnl; totalProfit += pnl; dayProfit += pnl; }
          else { runningBalance -= pnl; totalProfit -= pnl; dayProfit -= pnl; }

          cards.push(`
            <div class="kapsul v32 ${op.res}">
              <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
              <div class="k-result">
                <div class="k-note-show">${op.note || "İşlem notu yok"}</div>
                <b>$${amt} x ${odds}</b>
                <span>${op.res === "win" ? "+" : "-"}$${pnl.toFixed(2)}</span>
              </div>
            </div>
          `);
        } else {
          cards.push(`
            <div class="kapsul v32">
              <input type="text" id="e-n-${day}-${slot}" placeholder="Maç / coin / işlem">
              <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar">
              <input type="number" id="e-o-${day}-${slot}" placeholder="Oran / RR">
              <div class="k-actions v32">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">KAZANDI</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">KAYBETTİ</button>
              </div>
            </div>
          `);
        }
      }

      htmlBuffer += `
        <div class="day-row-capsule v32">
          <div class="day-info-v32">
            <h3>GÜN ${day}</h3>
            <span>Başlangıç: $${dayStart.toFixed(2)}</span>
            <span>Gün P/L: ${(dayProfit >= 0 ? "+" : "")}$${dayProfit.toFixed(2)}</span>
            <div class="day-tools-v32">
              <button class="gold" onclick="omega_RollingAddSlot(${day})">+ İŞLEM</button>
              <button onclick="omega_RollingRemoveSlot(${day})">- SİL</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 10)">10</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 20)">20</button>
              <button onclick="omega_RollingClearDay(${day})">TEMİZLE</button>
            </div>
          </div>
          <div class="capsule-container v32">${cards.join("")}</div>
          <div class="day-result v32"><small>Gün Sonu</small>$${runningBalance.toFixed(2)}</div>
        </div>
      `;
    }

    wrapper.innerHTML = htmlBuffer;

    const current = qs("#excel-current-bal");
    if (current) current.innerText = `$${runningBalance.toFixed(2)}`;

    const pnlElement = qs("#excel-pnl");
    if (pnlElement) {
      pnlElement.innerText = (totalProfit >= 0 ? "+" : "") + "$" + totalProfit.toFixed(2);
      pnlElement.style.color = totalProfit >= 0 ? "var(--green)" : "var(--red)";
    }

    const targetBal = currentPlan.targetBal || ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
    const progressPercentage = Math.min((runningBalance / targetBal) * 100, 100);
    const progressBar = qs("#excel-progress-bar");
    if (progressBar) progressBar.style.width = progressPercentage + "%";

    omega_SaveRollingDB();
  };

  const oldOpenRolling = window.omega_OpenRollingExcel;
  window.omega_OpenRollingExcel = function(days, skipHash = false) {
    const result = typeof oldOpenRolling === "function" ? oldOpenRolling(days, skipHash) : undefined;
    document.documentElement.classList.remove("rolling-hash-boot");
    document.body.classList.add("rolling-active");
    if(!skipHash) history.replaceState(null, "", `#finance/rolling/${days}`);
    return result;
  };

  
  document.addEventListener("click", function(e) {
    const disabled = e.target.closest(".crypto-v28-tab-disabled");
    if(disabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  function reviveRollingFromHashV39() {
    const m = String(location.hash || "").match(/^#finance\/rolling\/(\d+)/);
    if (!m) return;
    const days = Number(m[1]);
    if ([7,15,30,60,90].includes(days) && typeof window.omega_OpenRollingExcel === "function") {
      setTimeout(() => window.omega_OpenRollingExcel(days, true), 60);
    }
  }

  function boot() {
    prepareCryptoForm();
    renderSoundPanel();
    fixFinanceEmptyState();
    reviveRollingFromHashV39();
    setTimeout(() => {
      if (location.hash === "#crypto") prepareCryptoForm();
      if (location.hash.startsWith("#finance")) fixFinanceEmptyState();
    }, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 120));
  else setTimeout(boot, 120);

  window.addEventListener("hashchange", () => setTimeout(boot, 120));
})();
