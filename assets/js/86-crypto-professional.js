// ===============================
// V32 PROFESSIONAL UPGRADE
// Ses paneli, Rolling + işlem sayısı, kasa boş durumları ve küçük UI temizlikleri.
// ===============================

(function () {
  const SOUND_KEY = "v28_alarm_audio_settings";
  const POPULAR = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","TON","TRX","DOT","MATIC","NEAR","ATOM","APT","ARB","OP","INJ","SUI","PEPE","WIF","FET","RNDR","LTC","BCH","ETC","UNI","AAVE","FIL"];

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }


  // V896: Eski bahis çıktı/kart ekranı için izole stil. Sadece Rolling bahis kutularını hedefler.
  (function v896EnsureBetResultCardCss(){
    if (document.getElementById("v896-bet-result-card-css")) return;
    const style = document.createElement("style");
    style.id = "v896-bet-result-card-css";
    style.textContent = `
      #rolling-excel-overlay .kapsul.v32.v847-shot-result {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        padding: 14px !important;
        border-radius: 18px !important;
        border: 1px solid rgba(16,185,129,.62) !important;
        background: linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.96)) !important;
        box-shadow: 0 0 0 1px rgba(15,23,42,.75), 0 12px 28px rgba(0,0,0,.28) !important;
        min-height: auto !important;
      }
      #rolling-excel-overlay .kapsul.v32.v847-shot-result.loss {
        border-color: rgba(248,113,113,.58) !important;
      }
      #rolling-excel-overlay .v850-shot-toolbar {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
      }
      #rolling-excel-overlay .v850-shot-toolbar button {
        appearance: none !important;
        border: 1px solid rgba(148,163,184,.30) !important;
        background: rgba(15,23,42,.88) !important;
        color: #fff !important;
        border-radius: 999px !important;
        min-height: 30px !important;
        padding: 0 10px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        font-size: .72rem !important;
        font-weight: 950 !important;
        cursor: pointer !important;
      }
      #rolling-excel-overlay .v850-shot-toolbar .v850-shot-close {
        width: 30px !important;
        min-width: 30px !important;
        padding: 0 !important;
        border-radius: 10px !important;
        background: rgba(127,29,29,.70) !important;
        border-color: rgba(248,113,113,.50) !important;
      }
      #rolling-excel-overlay .v847-shot-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
      }
      #rolling-excel-overlay .v847-shot-head > b {
        color: #fbbf24 !important;
        font-size: .95rem !important;
        font-weight: 1000 !important;
        letter-spacing: .02em !important;
      }
      #rolling-excel-overlay .v847-shot-head-tools {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay .v847-shot-head-tools > span {
        border-radius: 999px !important;
        padding: 7px 10px !important;
        font-size: .68rem !important;
        font-weight: 1000 !important;
        color: #fff !important;
        border: 1px solid rgba(148,163,184,.25) !important;
      }
      #rolling-excel-overlay .v847-shot-head-tools > span.win {
        background: rgba(6,78,59,.85) !important;
        border-color: rgba(52,211,153,.55) !important;
      }
      #rolling-excel-overlay .v847-shot-head-tools > span.loss {
        background: rgba(127,29,29,.85) !important;
        border-color: rgba(248,113,113,.55) !important;
      }
      #rolling-excel-overlay .v847-shot-camera {
        appearance: none !important;
        width: 34px !important;
        height: 34px !important;
        min-width: 34px !important;
        border-radius: 11px !important;
        border: 1px solid rgba(251,191,36,.58) !important;
        background: rgba(120,53,15,.70) !important;
        color: #fbbf24 !important;
        display: inline-grid !important;
        place-items: center !important;
        cursor: pointer !important;
      }
      #rolling-excel-overlay .v847-shot-lines {
        list-style: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: grid !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay .v847-shot-lines li {
        display: grid !important;
        gap: 7px !important;
        border-radius: 14px !important;
        padding: 10px !important;
        background: rgba(15,23,42,.86) !important;
        border: 1px solid rgba(51,65,85,.85) !important;
      }
      #rolling-excel-overlay .v847-shot-lines li.win { border-color: rgba(51,65,85,.85) !important; background: rgba(15,23,42,.86) !important; }
      #rolling-excel-overlay .v847-shot-lines li.loss { border-color: rgba(51,65,85,.85) !important; background: rgba(15,23,42,.86) !important; }
      #rolling-excel-overlay .v847-shot-lines li.pending { border-color: rgba(51,65,85,.85) !important; background: rgba(15,23,42,.86) !important; }
      #rolling-excel-overlay .v847-shot-lines span {
        color: #f8fafc !important;
        font-size: .82rem !important;
        line-height: 1.25 !important;
        font-weight: 950 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      #rolling-excel-overlay .v847-shot-lines .v851-shot-line-meta {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
      }
      #rolling-excel-overlay .v847-shot-lines .v851-shot-line-meta b {
        color: #fbbf24 !important;
        font-size: .72rem !important;
        font-weight: 1000 !important;
      }
      #rolling-excel-overlay .v847-shot-lines .v851-shot-line-meta em {
        width: 74px !important;
        min-width: 74px !important;
        max-width: 74px !important;
        height: 24px !important;
        box-sizing: border-box !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 8px !important;
        border-radius: 999px !important;
        color: #cbd5e1 !important;
        background: rgba(51,65,85,.48) !important;
        border: 1px solid rgba(148,163,184,.30) !important;
        font-style: normal !important;
        font-size: .64rem !important;
        line-height: 1 !important;
        font-weight: 1000 !important;
        text-align: center !important;
      }
      #rolling-excel-overlay .v847-shot-lines li.win .v851-shot-line-meta em { color: #bbf7d0 !important; background: rgba(22,101,52,.42) !important; border-color: rgba(34,197,94,.36) !important; }
      #rolling-excel-overlay .v847-shot-lines li.loss .v851-shot-line-meta em { color: #fecaca !important; background: rgba(127,29,29,.46) !important; border-color: rgba(239,68,68,.38) !important; }
      #rolling-excel-overlay .v847-shot-lines li.pending .v851-shot-line-meta em { color: #cbd5e1 !important; background: rgba(51,65,85,.48) !important; border-color: rgba(148,163,184,.30) !important; }
      #rolling-excel-overlay .v847-shot-footer {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 7px !important;
      }
      #rolling-excel-overlay .v847-shot-footer span {
        border-radius: 12px !important;
        background: rgba(15,23,42,.84) !important;
        border: 1px solid rgba(51,65,85,.70) !important;
        padding: 8px 10px !important;
        color: #e5e7eb !important;
        font-size: .70rem !important;
        font-weight: 950 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay .v847-shot-footer .v851-result-total {
        grid-column: 1 / -1 !important;
      }
      #rolling-excel-overlay .v847-shot-footer b { color: #f8fafc !important; }
      #rolling-excel-overlay .v847-shot-footer b.pos { color: #22c55e !important; }
      #rolling-excel-overlay .v847-shot-footer b.neg { color: #ef4444 !important; }
      #rolling-excel-overlay .v847-bet-leg-result-panel:empty { display: none !important; }
      #rolling-excel-overlay .v847-leg-panel-inner {
        margin-top: 10px !important;
        padding: 11px !important;
        border-radius: 14px !important;
        border: 1px solid rgba(251,191,36,.50) !important;
        background: rgba(15,23,42,.84) !important;
        display: grid !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay .v847-leg-panel-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
      }
      #rolling-excel-overlay .v847-leg-panel-head b {
        color: #fbbf24 !important;
        font-size: .78rem !important;
        font-weight: 1000 !important;
      }
      #rolling-excel-overlay .v847-leg-panel-head span {
        color: #bfdbfe !important;
        font-size: .72rem !important;
        font-weight: 950 !important;
      }
      #rolling-excel-overlay .v847-leg-result-row {
        border-radius: 12px !important;
        padding: 10px !important;
        background: rgba(15,23,42,.92) !important;
        border: 1px solid rgba(51,65,85,.92) !important;
        display: grid !important;
        gap: 9px !important;
      }
      #rolling-excel-overlay .v847-leg-result-row.win { border-color: rgba(16,185,129,.70) !important; background: rgba(6,78,59,.40) !important; }
      #rolling-excel-overlay .v847-leg-result-row.loss { border-color: rgba(248,113,113,.70) !important; background: rgba(127,29,29,.34) !important; }
      #rolling-excel-overlay .v847-leg-result-row > span {
        color: #f8fafc !important;
        font-size: .76rem !important;
        font-weight: 950 !important;
        line-height: 1.25 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      #rolling-excel-overlay .v854-leg-result-meta {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        width: 100% !important;
      }
      #rolling-excel-overlay .v854-leg-result-meta b {
        color: #fbbf24 !important;
        font-size: .72rem !important;
        font-weight: 950 !important;
        text-align: left !important;
        min-width: max-content !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 5px !important;
        flex: 0 0 auto !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions button {
        appearance: none !important;
        width: 27px !important;
        height: 27px !important;
        min-width: 27px !important;
        border-radius: 8px !important;
        padding: 0 !important;
        display: inline-grid !important;
        place-items: center !important;
        font-size: 14px !important;
        font-weight: 950 !important;
        cursor: pointer !important;
        border: 1px solid transparent !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions button.win {
        background: rgba(6,78,59,.72) !important;
        border-color: rgba(52,211,153,.46) !important;
        color: #bbf7d0 !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions button.loss {
        background: rgba(127,29,29,.72) !important;
        border-color: rgba(248,113,113,.46) !important;
        color: #fecaca !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions button.win.selected {
        background: linear-gradient(145deg, #16a34a, #047857) !important;
        border-color: rgba(220,252,231,.82) !important;
        color: #fff !important;
        box-shadow: 0 0 0 1px rgba(34,197,94,.38), 0 0 13px rgba(34,197,94,.20) !important;
      }
      #rolling-excel-overlay .v854-leg-result-actions button.loss.selected {
        background: linear-gradient(145deg, #dc2626, #991b1b) !important;
        border-color: rgba(254,226,226,.82) !important;
        color: #fff !important;
        box-shadow: 0 0 0 1px rgba(239,68,68,.38), 0 0 13px rgba(239,68,68,.20) !important;
      }
    `;
    document.head.appendChild(style);
  })();



  // V912: Özet/fotoğraf renkleri, geçmiş kamera ve kupon fotoğraf aksiyonları.
  (function v910EnsureSummaryAndShotCss(){
    if (document.getElementById("v912-summary-shot-css")) return;
    const style = document.createElement("style");
    style.id = "v912-summary-shot-css";
    style.textContent = `
      #omega-rolling-feature-host .v768-feature-modal.bet.active .v903-bet-summary b.v908-odds,
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v908-odds {
        color: #fbbf24 !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.active .v903-bet-summary b.v908-kind-single,
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v908-kind-single {
        color: #38bdf8 !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.active .v903-bet-summary b.v908-kind-combo,
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v908-kind-combo {
        color: #c084fc !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v908-gain-win {
        color: #4ade80 !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.active .v903-bet-summary b.pending {
        color: #fb923c !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.pending {
        color: #e5e7eb !important;
      }
      #omega-rolling-feature-host .v903-bet-summary b.v910-odds {
        color: #fbbf24 !important;
      }
      #omega-rolling-feature-host .v903-bet-summary b.v910-kind-single {
        color: #38bdf8 !important;
      }
      #omega-rolling-feature-host .v903-bet-summary b.v910-kind-combo {
        color: #c084fc !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v910-gain-win {
        color: #4ade80 !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.active .v903-bet-summary b.v910-status-pending {
        color: #fb923c !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v910-status-win {
        color: #4ade80 !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.history .v903-bet-summary b.v910-status-loss {
        color: #f87171 !important;
      }
      #omega-rolling-feature-host .v903-bet-summary .v911-summary-bet-ref {
        color: #fbbf24 !important;
      }
      #rolling-excel-overlay .v847-shot-lines li,
      #rolling-excel-overlay .v847-shot-lines span {
        min-width: 0 !important;
      }
      #rolling-excel-overlay .v847-shot-lines span {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        overflow-wrap: anywhere !important;
        word-break: normal !important;
      }
      #rolling-excel-overlay .v847-shot-lines .v851-shot-line-meta {
        flex: 0 0 auto !important;
      }
      #omega-rolling-feature-host .v926-history-filters {
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
        margin:0 0 14px;
        padding:10px;
        border:1px solid rgba(251,191,36,.22);
        border-radius:18px;
        background:linear-gradient(180deg, rgba(15,23,42,.82), rgba(2,6,23,.78));
        box-shadow: inset 0 0 0 1px rgba(15,23,42,.65);
      }
      #omega-rolling-feature-host .v926-history-filters button,
      #omega-rolling-feature-host .v926-history-date {
        border:1px solid rgba(148,163,184,.28);
        border-radius:999px;
        background:rgba(2,6,23,.72);
        color:#cbd5e1;
        min-height:34px;
        padding:0 12px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        font:900 12px/1 'Inter',system-ui,sans-serif;
        cursor:pointer;
        transition: border-color .16s ease, color .16s ease, box-shadow .16s ease, transform .16s ease;
      }
      #omega-rolling-feature-host .v926-history-filters button:hover,
      #omega-rolling-feature-host .v926-history-date:hover {
        transform: translateY(-1px);
        border-color:rgba(251,191,36,.45);
      }
      #omega-rolling-feature-host .v926-history-filters button.active,
      #omega-rolling-feature-host .v926-history-date.active {
        color:#fbbf24;
        border-color:rgba(251,191,36,.72);
        box-shadow:0 0 14px rgba(251,191,36,.16);
      }
      #omega-rolling-feature-host .v926-history-date,
      #omega-rolling-feature-host .v929-history-date-open {
        padding:0 14px;
        min-width:132px;
      }
      #omega-rolling-feature-host .v929-history-date-break {
        flex:0 0 100%;
        width:100%;
        height:0;
        margin:0;
        padding:0;
      }
      #omega-rolling-feature-host .v929-history-date-wrap {
        position:relative;
        flex: 0 0 auto;
        display:inline-flex;
        align-items:center;
        justify-content:flex-start;
        min-width:0;
        width:auto;
      }
      #omega-rolling-feature-host .v929-history-date-open {
        width:auto;
        min-width:104px;
        max-width:min(190px, 78vw);
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        border-color:rgba(251,191,36,.34);
        color:#f8fafc;
        background:linear-gradient(180deg, rgba(15,23,42,.94), rgba(2,6,23,.86));
      }
      #omega-rolling-feature-host .v929-history-date-open.active {
        color:#fbbf24;
        border-color:rgba(251,191,36,.74);
        box-shadow:0 0 14px rgba(251,191,36,.18);
      }
      #omega-rolling-feature-host .v929-history-date-open::before {
        display:none !important;
        content:none !important;
      }
      #omega-rolling-feature-host .v929-history-date-panel {
        position:absolute;
        left:0;
        top:calc(100% + 10px);
        z-index:30;
        width:min(390px, 88vw);
        padding:14px;
        border-radius:18px;
        border:1px solid rgba(251,191,36,.34);
        background:linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.98));
        box-shadow:0 24px 70px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.06);
      }
      #omega-rolling-feature-host .v929-history-date-panel[hidden] { display:none !important; }
      #omega-rolling-feature-host .v929-history-date-panel-head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:12px;
      }
      #omega-rolling-feature-host .v929-history-date-panel-head b {
        color:#fbbf24;
        font:950 13px/1 'Inter',system-ui,sans-serif;
      }
      #omega-rolling-feature-host .v929-history-date-panel-head span {
        color:#94a3b8;
        font:800 11px/1.2 'Inter',system-ui,sans-serif;
      }
      #omega-rolling-feature-host .v929-date-grid {
        display:grid;
        grid-template-columns:1fr 1.2fr 1fr;
        gap:10px;
      }
      #omega-rolling-feature-host .v929-date-field small {
        display:block;
        margin:0 0 6px;
        color:#93c5fd;
        font:900 11px/1 'Inter',system-ui,sans-serif;
      }
      #omega-rolling-feature-host .v929-date-field select {
        width:100%;
        min-height:38px;
        border-radius:12px;
        border:1px solid rgba(148,163,184,.28);
        background:rgba(2,6,23,.84);
        color:#f8fafc;
        padding:0 10px;
        outline:0;
        font:900 12px/1 'Inter',system-ui,sans-serif;
      }
      #omega-rolling-feature-host .v929-date-actions {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-top:13px;
      }
      #omega-rolling-feature-host .v929-date-actions button {
        min-height:36px;
        border-radius:12px;
        padding:0 13px;
      }
      #omega-rolling-feature-host .v929-date-actions [data-v929-date-apply] {
        color:#020617;
        background:#fbbf24;
        border-color:#fbbf24;
      }
      #omega-rolling-feature-host .v768-feature-modal.crypto.active,
      #omega-rolling-feature-host .v768-feature-modal.crypto.history {
        width:min(528px, 96vw) !important;
        max-width:528px !important;
        max-height:86vh !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.crypto.active .v768-feature-body,
      #omega-rolling-feature-host .v768-feature-modal.crypto.history .v768-feature-body {
        gap:10px !important;
        padding:14px 16px 18px !important;
      }
      #omega-rolling-feature-host .v768-feature-modal.bet.active,
      #omega-rolling-feature-host .v768-feature-modal.bet.history,
      #omega-rolling-feature-host .v768-feature-modal.crypto.active,
      #omega-rolling-feature-host .v768-feature-modal.crypto.history {
        scrollbar-gutter: stable;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      #omega-rolling-feature-host .v768-feature-body {
        transform: translateZ(0);
      }
      #omega-rolling-feature-host .v768-feature-card,
      #omega-rolling-feature-host .v903-bet-accordion-card {
        content-visibility: auto;
        contain-intrinsic-size: 150px;
        contain: layout paint style;
      }
    `;
    document.head.appendChild(style);
  })();



  // V927/V928/V932: KRİPTO Rolling kutu çıktısı, kapalı-açılır kripto giriş alanı, P/L ve dinamik TP alanları.
  (function v927EnsureCryptoRollingOutputCss(){
    if (document.getElementById("v927-crypto-rolling-output-css")) return;
    const style = document.createElement("style");
    style.id = "v927-crypto-rolling-output-css";
    style.textContent = `
      #rolling-excel-overlay[data-roll-mode="crypto"] .kapsul.v32 {
        overflow: hidden !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-entry {
        display: grid !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul {
        cursor: pointer !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-empty-head {
        width:100% !important;
        appearance:none !important;
        border:1px solid rgba(251,191,36,.30) !important;
        border-radius:14px !important;
        background:rgba(15,23,42,.76) !important;
        color:#e5e7eb !important;
        min-height:42px !important;
        padding:0 12px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:10px !important;
        font:950 12px/1 'Inter',system-ui,sans-serif !important;
        cursor:pointer !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-empty-head span {
        color:#94a3b8 !important;
        font-weight:950 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-empty-head b {
        color:#fbbf24 !important;
        font-weight:1000 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul:not(.is-open) .v927-crypto-entry,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul:not(.is-open) .k-actions.v32 {
        display:none !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul.is-open .v927-crypto-entry {
        display:grid !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul.is-open .k-actions.v32 {
        display:flex !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul.is-open .v928-crypto-empty-head {
        margin-bottom:8px !important;
        border-color:rgba(251,191,36,.58) !important;
        box-shadow:0 0 18px rgba(251,191,36,.10) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-main-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr) !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-field-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-entry-line {
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-entry-line input {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-tp-controls {
        flex: 0 0 auto !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-tp-controls button {
        width: 28px !important;
        height: 28px !important;
        border-radius: 9px !important;
        border: 1px solid rgba(251,191,36,.36) !important;
        background: rgba(15,23,42,.92) !important;
        color: #fbbf24 !important;
        font: 1000 15px/1 Inter,system-ui,sans-serif !important;
        cursor: pointer !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-tp-list {
        grid-column: 1 / -1 !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-field-grid input,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-field-grid select,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-main-grid input,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-main-grid select {
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-result {
        position: relative !important;
        display: grid !important;
        gap: 12px !important;
        padding: 14px !important;
        border-radius: 18px !important;
        min-height: auto !important;
        border: 1px solid rgba(34,197,94,.58) !important;
        background: linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.96)) !important;
        box-shadow: 0 14px 30px rgba(0,0,0,.28) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-result.loss {
        border-color: rgba(248,113,113,.58) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-result .k-undo.v32 {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        width: 30px !important;
        height: 30px !important;
        border-radius: 10px !important;
        z-index: 2 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-result-head {
        padding-right: 38px !important;
        display: grid !important;
        gap: 5px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-title-row {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-title-row b {
        color: #fbbf24 !important;
        font-size: .98rem !important;
        font-weight: 1000 !important;
        min-width: 0 !important;
        overflow-wrap: anywhere !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-status {
        flex: 0 0 auto !important;
        border-radius: 999px !important;
        padding: 7px 10px !important;
        font-size: .68rem !important;
        font-weight: 1000 !important;
        border: 1px solid rgba(148,163,184,.28) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-status.win {
        color: #bbf7d0 !important;
        background: rgba(22,101,52,.42) !important;
        border-color: rgba(34,197,94,.45) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-status.loss {
        color: #fecaca !important;
        background: rgba(127,29,29,.45) !important;
        border-color: rgba(248,113,113,.45) !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-subline {
        color: #94a3b8 !important;
        font-size: .74rem !important;
        font-weight: 900 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-side-long { color: #38bdf8 !important; }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-side-short { color: #fb7185 !important; }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-coin { color: #fbbf24 !important; }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metrics {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric {
        border-radius: 13px !important;
        background: rgba(15,23,42,.84) !important;
        border: 1px solid rgba(51,65,85,.74) !important;
        padding: 8px 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        min-width: 0 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric small {
        color: #94a3b8 !important;
        font-size: .66rem !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric b {
        color: #f8fafc !important;
        font-size: .72rem !important;
        font-weight: 1000 !important;
        min-width: 0 !important;
        text-align: right !important;
        overflow-wrap: anywhere !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric.pnl {
        grid-column: 1 / -1 !important;
      }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric.pnl b .pos,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric.pnl b.pos { color: #22c55e !important; }
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric.pnl b .neg,
      #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metric.pnl b.neg { color: #ef4444 !important; }
      @media (max-width: 700px) {
        #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-main-grid,
        #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-field-grid,
        #rolling-excel-overlay[data-roll-mode="crypto"] .v932-crypto-tp-list,
        #rolling-excel-overlay[data-roll-mode="crypto"] .v927-crypto-metrics {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  })();

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
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next };
    merged.volume = 1;
    merged.durationSec = Math.max(60, Number(merged.durationSec || 60));
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  let v499fPreviewAudio = null;
  let v499fPreviewUrl = "";
  let v499fPreviewTimer = null;
  let v499fDuration = 1;

  function v499fFormat(sec) {
    sec = Math.max(0, Number(sec || 0));
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function v499fSettings(next) {
    const current = getSoundSettings();
    const live = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : {};
    const merged = { ...current, ...live, ...next, enabled: true, volume: 1 };
    localStorage.setItem(SOUND_KEY, JSON.stringify(merged));
    if (window.V26AlarmAudio?.setSettings) window.V26AlarmAudio.setSettings(merged);
    return merged;
  }

  function v499fStopPreview() {
    if (v499fPreviewTimer) {
      clearTimeout(v499fPreviewTimer);
      v499fPreviewTimer = null;
    }
    if (v499fPreviewAudio) {
      try { v499fPreviewAudio.pause(); } catch {}
    }
    if (v499fPreviewUrl) {
      try { URL.revokeObjectURL(v499fPreviewUrl); } catch {}
    }
    v499fPreviewAudio = null;
    v499fPreviewUrl = "";
    qs("#v499f-play-custom")?.classList.remove("playing");
    qs("#v32-sound-test")?.classList.remove("testing");
    const top = qs("#v32-sound-test");
    if (top) top.textContent = "OYNAT";
  }

  async function v499fRows() {
    if (!window.V26AlarmAudio?.listCustomFiles) return [];
    try { return await window.V26AlarmAudio.listCustomFiles(); } catch { return []; }
  }

  async function v499fSelectedRow() {
    const id = qs("#v47-custom-select")?.value || (window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings().selectedCustomId : "");
    if (!id) return null;
    const rows = await v499fRows();
    return rows.find(r => r.id === id) || null;
  }

  function v499fGetSegment() {
    const max = Math.max(1, Number(qs("#v499f-start")?.max || qs("#v499f-end")?.max || v499fDuration || 1));
    let start = Math.max(0, Math.min(max - 1, Number(qs("#v499f-start")?.value || 0)));
    let end = Math.max(1, Math.min(max, Number(qs("#v499f-end")?.value || max)));
    if (end <= start) end = Math.min(max, start + 1);
    const s = qs("#v499f-start");
    const e = qs("#v499f-end");
    if (s) s.value = Math.floor(start);
    if (e) e.value = Math.floor(end);
    return { start, end, max };
  }

  function v499fUpdateUI(current = null) {
    const { start, end, max } = v499fGetSegment();
    const label = qs("#v499f-range-label");
    const cur = qs("#v499f-current");
    const total = qs("#v499f-total");
    const fill = qs("#v499f-fill");
    const progress = qs("#v499f-progress");
    const startHandle = qs("#v499f-start-handle");
    const endHandle = qs("#v499f-end-handle");

    if (label) label.textContent = `${v499fFormat(start)} - ${v499fFormat(end)}`;
    if (cur) cur.textContent = v499fFormat(current == null ? Number(progress?.value || start) : current);
    if (total) total.textContent = v499fFormat(max);

    const left = (start / max) * 100;
    const right = (end / max) * 100;
    const width = Math.max(0, right - left);

    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.width = `${width}%`;
    }
    if (startHandle) {
      startHandle.style.left = `${left}%`;
      startHandle.textContent = "[";
    }
    if (endHandle) {
      endHandle.style.left = `${right}%`;
      endHandle.textContent = "]";
    }
    if (progress) {
      progress.max = max;
      if (current != null) progress.value = Math.min(max, Math.max(0, Math.floor(current)));
    }
  }

  async function v499fLoadMeta() {
    const row = await v499fSelectedRow();
    if (!row?.blob) {
      v499fDuration = 1;
      ["#v499f-progress", "#v499f-start", "#v499f-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = 1;
      });
      v499fUpdateUI(0);
      return;
    }

    const url = URL.createObjectURL(row.blob);
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const total = Math.max(1, Math.floor(a.duration || 1));
      v499fDuration = total;
      const st = window.V26AlarmAudio?.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
      const start = Math.max(0, Math.min(total - 1, Number(st.customStart || 0)));
      const rawEnd = Number(st.customEnd || 0);
      const end = rawEnd > start ? Math.min(total, rawEnd) : total;

      ["#v499f-progress", "#v499f-start", "#v499f-end"].forEach(sel => {
        const el = qs(sel);
        if (el) el.max = total;
      });
      const s = qs("#v499f-start");
      const e = qs("#v499f-end");
      if (s) s.value = Math.floor(start);
      if (e) e.value = Math.floor(end);
      v499fUpdateUI(start);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
  }

  async function v499fPlayCustomPreview() {
    const row = await v499fSelectedRow();
    if (!row?.blob) {
      alert("Önce özel ses seç veya dosya yükle.");
      return;
    }
    v499fStopPreview();

    const { start, end } = v499fGetSegment();
    v499fPreviewUrl = URL.createObjectURL(row.blob);
    v499fPreviewAudio = new Audio(v499fPreviewUrl);
    v499fPreviewAudio.volume = 1;

    v499fPreviewAudio.onloadedmetadata = async () => {
      const total = Math.max(1, Number(v499fPreviewAudio.duration || 1));
      const safeStart = Math.min(start, total - 0.1);
      const safeEnd = Math.min(end > safeStart ? end : total, total);
      v499fPreviewAudio.currentTime = safeStart;
      v499fUpdateUI(safeStart);

      v499fPreviewAudio.ontimeupdate = () => {
        if (!v499fPreviewAudio) return;
        v499fUpdateUI(v499fPreviewAudio.currentTime);
        if (v499fPreviewAudio.currentTime >= safeEnd) v499fStopPreview();
      };
      v499fPreviewAudio.onended = v499fStopPreview;
      v499fPreviewAudio.onerror = v499fStopPreview;

      qs("#v499f-play-custom")?.classList.add("playing");
      const top = qs("#v32-sound-test");
      if (top) {
        top.classList.add("testing");
        top.textContent = "ÇALIYOR...";
      }

      try {
        await v499fPreviewAudio.play();
        v499fPreviewTimer = setTimeout(v499fStopPreview, Math.max(500, (safeEnd - safeStart) * 1000 + 250));
      } catch {
        v499fStopPreview();
        alert("Ses çalınamadı. Dosyayı tekrar seçip deneyin.");
      }
    };
  }

  async function v499fPlaySelectedSound() {
    const type = qs("#v32-sound-type")?.value || "digital";
    if (type === "custom") return v499fPlayCustomPreview();

    v499fStopPreview();
    if (window.V26AlarmAudio?.unlock) window.V26AlarmAudio.unlock();
    v499fSettings({ sound: type, volume: 1, enabled: true });
    const top = qs("#v32-sound-test");
    if (top) {
      top.classList.add("testing");
      top.textContent = "ÇALIYOR...";
    }
    if (window.V26AlarmAudio?.testSelected) await window.V26AlarmAudio.testSelected();
    setTimeout(() => {
      if (top) {
        top.classList.remove("testing");
        top.textContent = "OYNAT";
      }
    }, 1200);
  }

  function v499fBindTimeline() {
    const track = qs("#v499f-track");
    const startInput = qs("#v499f-start");
    const endInput = qs("#v499f-end");
    if (!track || !startInput || !endInput || track.dataset.bound === "v499f") return;
    track.dataset.bound = "v499f";

    const secFromEvent = ev => {
      const rect = track.getBoundingClientRect();
      const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const max = Math.max(1, Number(startInput.max || endInput.max || v499fDuration || 1));
      return Math.round(pct * max);
    };

    let mode = null;
    let offset = 0;

    const choose = (sec, target) => {
      const { start, end } = v499fGetSegment();
      if (target?.id === "v499f-start-handle") return "start";
      if (target?.id === "v499f-end-handle") return "end";
      if (target?.id === "v499f-fill" || (sec > start && sec < end)) {
        offset = sec - start;
        return "range";
      }
      return Math.abs(sec - start) <= Math.abs(sec - end) ? "start" : "end";
    };

    const apply = sec => {
      const { start, end, max } = v499fGetSegment();
      const len = Math.max(1, end - start);
      if (mode === "start") {
        startInput.value = Math.min(sec, end - 1);
      } else if (mode === "end") {
        endInput.value = Math.max(sec, start + 1);
      } else if (mode === "range") {
        const newStart = Math.max(0, Math.min(max - len, sec - offset));
        startInput.value = Math.floor(newStart);
        endInput.value = Math.floor(newStart + len);
      }
      v499fUpdateUI();
    };

    const down = ev => {
      ev.preventDefault();
      const sec = secFromEvent(ev);
      mode = choose(sec, ev.target);
      apply(sec);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    };
    const move = ev => {
      ev.preventDefault();
      if (mode) apply(secFromEvent(ev));
    };
    const up = () => {
      mode = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };

    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: false });
  }

  function renderSoundPanel(force = false) {
    if (typeof window.V512RenderSoundCenter === "function") {
      window.V512RenderSoundCenter(!!force);
    }
  }

  

  async function renderSoundLibrary() {
    const select = qs("#v47-custom-select");
    if (!select || !window.V26AlarmAudio?.listCustomFiles) return;

    const s = window.V26AlarmAudio.getSettings ? window.V26AlarmAudio.getSettings() : getSoundSettings();
    const files = await window.V26AlarmAudio.listCustomFiles();

    select.innerHTML = `<option value="">Özel ses seç...</option>` + files.map(file => {
      const active = file.id === s.selectedCustomId;
      const size = file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "";
      return `<option value="${file.id}" ${active ? "selected" : ""}>${active ? "✓ " : ""}${file.name}${size ? " · " + size : ""}</option>`;
    }).join("");

    const current = files.find(f => f.id === s.selectedCustomId);
    if (current) select.value = current.id;
    select.title = current ? current.name : "Özel ses seç";

    const note = qs("#v499f-file-note");
    if (note) {
      const text = current ? "Aktif: " + current.name : "Dosya seçilmedi";
      note.textContent = text;
      note.title = text;
    }
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
    const mode = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    const key = (typeof window.omega_GetRollingPlanKeyV47 === "function") ? window.omega_GetRollingPlanKeyV47(_ACTIVE_EXCEL_DAYS) : `${mode}_${_ACTIVE_EXCEL_DAYS}`;
    if (!_ROLLING_DB[key]) _ROLLING_DB[key] = { startBal: 100, targetBal: ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS], ops: {}, mode, days: _ACTIVE_EXCEL_DAYS };
    const plan = _ROLLING_DB[key];
    plan.mode = mode;
    plan.days = _ACTIVE_EXCEL_DAYS;
    if (!plan.targetBal) plan.targetBal = ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS];
    if (!plan.ops) plan.ops = {};
    if (!plan.pending) plan.pending = {};
    if (!plan.slotCounts) plan.slotCounts = {};
    return plan;
  }

  function v780DefaultSlotCount(day) {
    return Number(day) === 1 ? 4 : 1;
  }

  function v780HasPendingData(plan, day) {
    const rows = plan?.pending?.[day] || {};
    return Object.values(rows).some(row => {
      if (!row) return false;
      if (String(row.note || '').trim()) return true;
      if (String(row.amt || '').trim()) return true;
      if (String(row.odds || '').trim()) return true;
      return Array.isArray(row.combo) && row.combo.some(x => String(x?.note || '').trim() || Number(x?.odds || 0));
    });
  }

  function v780HasResolvedData(plan, day) {
    return (plan?.ops?.[day] || []).some(Boolean);
  }

  function v780DesiredSlotCount(plan, day) {
    const custom = Number(plan?.slotCounts?.[day] || 0);
    if (custom > 0) return Math.max(1, Math.min(20, custom));
    return v780DefaultSlotCount(day);
  }

  function v780EnsureDaySlots(plan, day) {
    if (!plan.ops[day]) plan.ops[day] = [];
    const desired = v780DesiredSlotCount(plan, day);
    const hasData = v780HasResolvedData(plan, day) || v780HasPendingData(plan, day);
    const hasCustom = Number(plan?.slotCounts?.[day] || 0) > 0;
    if (!hasCustom && !hasData && plan.ops[day].length !== desired) {
      plan.ops[day] = new Array(desired).fill(null);
      return;
    }
    if (plan.ops[day].length < desired) {
      while (plan.ops[day].length < desired) plan.ops[day].push(null);
    }
    if (!hasCustom && hasData && plan.ops[day].length < desired) {
      while (plan.ops[day].length < desired) plan.ops[day].push(null);
    }
    if (plan.ops[day].length < 1) plan.ops[day] = new Array(desired).fill(null);
  }

  function setDayCount(day, count) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    const nextLength = Math.max(count, plan.ops[day].filter(Boolean).length);
    plan.slotCounts[day] = Math.max(1, Math.min(20, nextLength));
    plan.ops[day].length = nextLength;
    if (plan.pending?.[day]) {
      Object.keys(plan.pending[day]).forEach(slot => {
        if (Number(slot) >= nextLength) delete plan.pending[day][slot];
      });
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  }

  window.omega_RollingAddSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    v780EnsureDaySlots(plan, day);
    plan.ops[day].push(null);
    plan.slotCounts[day] = Math.max(1, Math.min(20, plan.ops[day].length));
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingRemoveSlot = function(day) {
    const plan = ensureRollingPlan();
    if (!plan.ops[day]) plan.ops[day] = [];
    if (plan.ops[day].length > 1) {
      const removedSlot = plan.ops[day].length - 1;
      plan.ops[day].pop();
      if (plan.pending?.[day]) delete plan.pending[day][removedSlot];
      plan.slotCounts[day] = Math.max(1, plan.ops[day].length);
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingSetDaySlots = setDayCount;

  window.omega_RollingSetAllSlots = function(count) {
    const plan = ensureRollingPlan();
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      if (!plan.ops[day]) plan.ops[day] = [];
      const nextLength = Math.max(count, plan.ops[day].filter(Boolean).length);
      plan.slotCounts[day] = Math.max(1, Math.min(20, nextLength));
      plan.ops[day].length = nextLength;
      if (plan.pending?.[day]) {
        Object.keys(plan.pending[day]).forEach(slot => {
          if (Number(slot) >= nextLength) delete plan.pending[day][slot];
        });
      }
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  window.omega_RollingClearDay = function(day) {
    const plan = ensureRollingPlan();
    plan.ops[day] = new Array(v780DefaultSlotCount(day)).fill(null);
    if (plan.pending) delete plan.pending[day];
    if (plan.slotCounts) delete plan.slotCounts[day];
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  function v763EscapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function v763ComboRows(day, slot) {
    return Array.from(document.querySelectorAll(`[data-v763-extra-row="${day}:${slot}"]`)).map(row => ({
      note: (row.querySelector(`[data-v763-extra-note]`)?.value || "").trim(),
      odds: Number(row.querySelector(`[data-v763-extra-odds]`)?.value || 0)
    })).filter(x => x.note || x.odds);
  }

  window.omega_RollingToggleComboRow = function(day, slot, dir) {
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return false;
    const list = kapsul.querySelector(".v765-extra-match-list");
    if (!list) return false;
    if (dir === "minus") {
      const rows = list.querySelectorAll(".v765-extra-match-row");
      rows[rows.length - 1]?.remove();
      v768UpdateBetCalc(day, slot);
      v774SavePendingSlot(day, slot);
      return false;
    }
    const row = document.createElement("div");
    row.className = "v765-extra-match-row v768-extra-match-row";
    row.setAttribute("data-v763-extra-row", `${day}:${slot}`);
    row.innerHTML = `<input type="text" data-v763-extra-note placeholder="Maç"><input type="number" data-v763-extra-odds placeholder="Oran" step="0.01">`;
    list.appendChild(row);
    v768BindBetCalc(kapsul);
    v768UpdateBetCalc(day, slot);
    v774SavePendingSlot(day, slot);
    row.querySelector("input")?.focus();
    return false;
  };

  function v763BetTotalOdds(primary, comboRows) {
    let total = Number(primary || 0);
    if (!total) return 0;
    comboRows.forEach(row => {
      const o = Number(row.odds || 0);
      if (o) total *= o;
    });
    return total;
  }

  function v926OpStake(op) {
    const candidates = [op?.amt, op?.stake, op?.amount, op?.tutar];
    for (const value of candidates) {
      const n = Number(value || 0);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  }

  function v926OpBaseOdds(op) {
    const candidates = [op?.odds, op?.baseOdds, op?.oran];
    for (const value of candidates) {
      const n = Number(value || 0);
      if (Number.isFinite(n) && n) return n;
    }
    return 0;
  }

  function v926OpTotalOdds(op, isCrypto) {
    if (isCrypto) return v926OpBaseOdds(op);
    const savedTotal = Number(op?.totalOdds || op?.toplamOran || 0);
    if (Number.isFinite(savedTotal) && savedTotal > 0) return savedTotal;
    return v763BetTotalOdds(v926OpBaseOdds(op), Array.isArray(op?.combo) ? op.combo : []);
  }

  function v926OpEffect(op, isCrypto) {
    if (!op) return 0;
    if (isCrypto) {
      const n = Number(op?.pnl ?? op?.net ?? op?.odds ?? 0);
      if (!Number.isFinite(n)) return 0;
      return op?.res === "loss" && n > 0 ? -n : n;
    }
    const stake = v926OpStake(op);
    const totalOdds = v926OpTotalOdds(op, false);
    if (op?.res === "win") return stake && totalOdds ? (stake * totalOdds) - stake : 0;
    if (op?.res === "loss") return -stake;
    return 0;
  }

  function v768Money(value) {
    const n = Number(value || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }


  function v932CryptoTpInputs(day, slot) {
    return Array.from(document.querySelectorAll(`[data-v927-crypto-tp="${day}:${slot}"]`))
      .sort((a, b) => Number(a.dataset.v927TpIndex || 0) - Number(b.dataset.v927TpIndex || 0));
  }

  window.omega_CryptoToggleTpRow = function(day, slot, action) {
    const list = document.querySelector(`[data-v932-crypto-tp-list="${day}:${slot}"]`);
    if (!list) return false;
    const inputs = v932CryptoTpInputs(day, slot);
    if (action === "plus") {
      const next = Math.min(inputs.length + 1, 8);
      if (next > inputs.length) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `TP${next}`;
        input.dataset.v927CryptoTp = `${day}:${slot}`;
        input.dataset.v927TpIndex = String(next);
        list.appendChild(input);
        try { input.focus(); } catch(e) {}
      }
    } else if (action === "minus") {
      if (inputs.length > 1) inputs[inputs.length - 1].remove();
    }
    return false;
  };

  function v927FieldValue(day, slot, key) {
    const el = document.querySelector(`[data-v927-crypto-${key}="${day}:${slot}"]`);
    return (el?.value || "").trim();
  }

  function v927CryptoMetaFromDom(day, slot) {
    const sideRaw = v927FieldValue(day, slot, "side");
    const side = sideRaw === "short" ? "short" : "long";
    const tpValues = v932CryptoTpInputs(day, slot).map(input => (input.value || "").trim());
    if (!tpValues.length) tpValues.push(v927FieldValue(day, slot, "tp1"));
    return {
      side,
      coin: v927FieldValue(day, slot, "coin") || (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim(),
      entry: v927FieldValue(day, slot, "entry"),
      leverage: v927FieldValue(day, slot, "leverage"),
      liq: v927FieldValue(day, slot, "liq"),
      stop: v927FieldValue(day, slot, "stop"),
      tps: tpValues,
      tp1: tpValues[0] || ""
    };
  }

  function v927CryptoMetaFromOp(op) {
    const src = op?.cryptoMeta && typeof op.cryptoMeta === "object" ? op.cryptoMeta : op || {};
    const side = String(src.side || src.direction || src.type || "long").toLowerCase() === "short" ? "short" : "long";
    const savedTps = Array.isArray(src.tps) ? src.tps : [];
    const legacyTps = [src.tp1, src.tp2, src.tp3, src.tp4, src.tp5, src.tp6, src.tp7, src.tp8]
      .map(v => String(v || "").trim())
      .filter((v, idx) => v || idx === 0);
    const tps = (savedTps.length ? savedTps : legacyTps.length ? legacyTps : [""]).map(v => String(v || "").trim());
    return {
      side,
      coin: String(src.coin || op?.note || "İşlem").trim(),
      entry: String(src.entry || src.giris || "").trim(),
      leverage: String(src.leverage || src.kaldirac || "").trim(),
      liq: String(src.liq || src.liquidation || src.likidasyon || "").trim(),
      stop: String(src.stop || src.stopLoss || src.sl || "").trim(),
      tps,
      tp1: tps[0] || ""
    };
  }

  function v927DisplayValue(value, fallback = "-") {
    const text = String(value ?? "").trim();
    return text ? v763EscapeHtml(text) : fallback;
  }

  function v927LeverageLabel(value) {
    const text = String(value || "").trim();
    if (!text) return "-";
    return /x$/i.test(text) ? v763EscapeHtml(text) : `${v763EscapeHtml(text)}x`;
  }

  function v927RenderCryptoMetric(label, value, cls = "") {
    return `<span class="v927-crypto-metric ${cls}"><small>${label}</small><b>${value}</b></span>`;
  }

  function v927RenderCryptoResultCard(day, slot, op, amt, effect) {
    const meta = v927CryptoMetaFromOp(op);
    const finalStatus = op?.res === "loss" ? "loss" : "win";
    const isWin = finalStatus === "win";
    const statusLabel = isWin ? "KÂR" : "ZARAR";
    const sideLabel = meta.side === "short" ? "Short" : "Long";
    const sideClass = meta.side === "short" ? "v927-side-short" : "v927-side-long";
    const pnlText = `${effect >= 0 ? "+" : "-"}$${Math.abs(Number(effect || 0)).toFixed(2)}`;
    const pnlClass = effect >= 0 ? "pos" : "neg";
    const coinLabel = v927DisplayValue(meta.coin || op?.note || "İşlem");
    return `<div class="kapsul v32 ${finalStatus} v927-crypto-result ${finalStatus}">
      <button class="k-undo v32" onclick="omega_UndoExcelOp(${day}, ${slot})" title="Geri Al">×</button>
      <div class="v927-crypto-result-head">
        <div class="v927-crypto-title-row"><b><span class="v927-coin">${coinLabel}</span></b><span class="v927-crypto-status ${finalStatus}">${statusLabel}</span></div>
        <div class="v927-crypto-subline">Gün ${day} · İşlem ${slot + 1} · <span class="${sideClass}">${sideLabel}</span></div>
      </div>
      <div class="v927-crypto-metrics">
        ${v927RenderCryptoMetric("İşlem", `<span class="v927-coin">${coinLabel}</span>`)}
        ${v927RenderCryptoMetric("Yön", `<span class="${sideClass}">${sideLabel}</span>`)}
        ${v927RenderCryptoMetric("Giriş", v927DisplayValue(meta.entry))}
        ${v927RenderCryptoMetric("Kaldıraç", v927LeverageLabel(meta.leverage))}
        ${v927RenderCryptoMetric("Tutar", v768Money(amt))}
        ${v927RenderCryptoMetric("Likidasyon", v927DisplayValue(meta.liq))}
        ${v927RenderCryptoMetric("Stop", v927DisplayValue(meta.stop))}
        ${(Array.isArray(meta.tps) && meta.tps.length ? meta.tps : [meta.tp1 || ""]).map((tp, idx) => v927RenderCryptoMetric(`TP${idx + 1}`, v927DisplayValue(tp))).join("")}
        ${v927RenderCryptoMetric("Durum", statusLabel, finalStatus)}
        ${v927RenderCryptoMetric("P/L", `<span class="${pnlClass}">${pnlText}</span>`, "pnl")}
      </div>
    </div>`;
  }

  function v903FormatRollingDate(value) {
    const ts = Number(value || 0) || Date.now();
    const d = new Date(ts);
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const pad = n => String(n).padStart(2, "0");
    return `${d.getDate()} ${months[d.getMonth()] || ""} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const V928_HISTORY_MIN_DATE = "2026-05-01";

  function v928HistoryMinTime() {
    return new Date(2026, 4, 1).getTime();
  }

  function v928ClampHistoryDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw < V928_HISTORY_MIN_DATE ? V928_HISTORY_MIN_DATE : raw;
  }

  function v926HistoryFilterStorageKey(mode) {
    return `bulten_v926_history_filter_${mode === "crypto" ? "crypto" : "bet"}_${_ACTIVE_EXCEL_DAYS}`;
  }

  function v926HistoryDateStorageKey(mode) {
    return `bulten_v926_history_date_${mode === "crypto" ? "crypto" : "bet"}_${_ACTIVE_EXCEL_DAYS}`;
  }

  function v926GetHistoryFilter(mode) {
    const value = localStorage.getItem(v926HistoryFilterStorageKey(mode)) || "all";
    return ["all", "day", "week", "month", "quarter", "half", "year", "manual"].includes(value) ? value : "all";
  }

  function v926GetHistoryManualDate(mode) {
    const key = v926HistoryDateStorageKey(mode);
    const clamped = v928ClampHistoryDate(localStorage.getItem(key) || "");
    if (clamped) localStorage.setItem(key, clamped);
    return clamped;
  }

  function v926StartOfLocalDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function v926EndOfLocalDay(date) {
    const d = v926StartOfLocalDay(date);
    d.setDate(d.getDate() + 1);
    return d;
  }

  function v926FilterRange(mode) {
    const filter = v926GetHistoryFilter(mode);
    const now = new Date();
    if (filter === "all") return null;
    if (filter === "day") return [v926StartOfLocalDay(now).getTime(), v926EndOfLocalDay(now).getTime()];
    if (filter === "week") {
      const start = v926StartOfLocalDay(now);
      start.setDate(start.getDate() - 6);
      return [start.getTime(), v926EndOfLocalDay(now).getTime()];
    }
    if (filter === "month") {
      const start = v926StartOfLocalDay(now);
      start.setMonth(start.getMonth() - 1);
      return [start.getTime(), v926EndOfLocalDay(now).getTime()];
    }
    if (filter === "quarter") {
      const start = v926StartOfLocalDay(now);
      start.setMonth(start.getMonth() - 3);
      return [start.getTime(), v926EndOfLocalDay(now).getTime()];
    }
    if (filter === "half") {
      const start = v926StartOfLocalDay(now);
      start.setMonth(start.getMonth() - 6);
      return [start.getTime(), v926EndOfLocalDay(now).getTime()];
    }
    if (filter === "year") {
      const start = v926StartOfLocalDay(now);
      start.setFullYear(start.getFullYear() - 1);
      return [start.getTime(), v926EndOfLocalDay(now).getTime()];
    }
    const manual = v926GetHistoryManualDate(mode);
    if (manual) {
      const parts = manual.split("-").map(Number);
      if (parts.length === 3 && parts.every(Boolean)) {
        const start = new Date(parts[0], parts[1] - 1, parts[2]);
        const end = new Date(parts[0], parts[1] - 1, parts[2] + 1);
        return [start.getTime(), end.getTime()];
      }
    }
    return null;
  }

  function v926HistoryRowTime(row) {
    return Number(row?.settledAt || row?.createdAt || row?.updatedAt || 0) || Date.now();
  }

  function v926FilterHistoryRows(rows, mode) {
    const minTime = v928HistoryMinTime();
    const baseRows = rows.filter(row => v926HistoryRowTime(row) >= minTime);
    const range = v926FilterRange(mode);
    if (!range) return baseRows;
    const [startRaw, end] = range;
    const start = Math.max(Number(startRaw || 0), minTime);
    return baseRows.filter(row => {
      const ts = v926HistoryRowTime(row);
      return ts >= start && ts < end;
    });
  }

  function v929FormatHistoryDateLabel(value) {
    const raw = String(value || "").trim();
    const parts = raw.split("-").map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isFinite(n) || !n)) return "Tarih Seç";
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("tr-TR", { day:"2-digit", month:"long", year:"numeric" });
  }

  function v929TodayYmdParts() {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }

  function v929DaysInMonth(year, month) {
    return new Date(Number(year), Number(month), 0).getDate();
  }

  function v929MonthName(month) {
    return new Date(2026, Number(month) - 1, 1).toLocaleDateString("tr-TR", { month:"long" });
  }

  function v929BuildDatePanelHtml(mode, manual) {
    const today = v929TodayYmdParts();
    const todayValue = `${String(today.y).padStart(4,"0")}-${String(today.m).padStart(2,"0")}-${String(today.d).padStart(2,"0")}`;
    const safeManual = v928ClampHistoryDate(manual || todayValue) || V928_HISTORY_MIN_DATE;
    const parts = safeManual.split("-").map(Number);
    let year = parts[0] || Math.max(2026, today.y);
    let month = parts[1] || today.m || 5;
    let day = parts[2] || today.d || 1;
    year = Math.min(Math.max(2026, year), Math.max(2026, today.y));
    month = Math.min(Math.max(year === 2026 ? 5 : 1, month), year === today.y ? today.m : 12);
    day = Math.min(Math.max(year === 2026 && month === 5 ? 1 : 1, day), year === today.y && month === today.m ? today.d : v929DaysInMonth(year, month));
    const yearMax = Math.max(2026, today.y);
    const years = [];
    for (let y = yearMax; y >= 2026; y--) years.push(y);
    const monthMin = year === 2026 ? 5 : 1;
    const monthMax = year === today.y ? today.m : 12;
    const months = [];
    for (let m = monthMin; m <= monthMax; m++) months.push(m);
    const dayMin = year === 2026 && month === 5 ? 1 : 1;
    const dayMax = year === today.y && month === today.m ? today.d : v929DaysInMonth(year, month);
    const days = [];
    for (let d = dayMin; d <= dayMax; d++) days.push(d);
    return `<div class="v929-history-date-panel" data-v929-date-panel="${mode}" hidden>
      <div class="v929-history-date-panel-head"><b>Tarih Seç</b></div>
      <div class="v929-date-grid">
        <label class="v929-date-field"><small>Yıl</small><select data-v929-date-year="${mode}">${years.map(y => `<option value="${y}" ${y === year ? "selected" : ""}>${y}</option>`).join("")}</select></label>
        <label class="v929-date-field"><small>Ay</small><select data-v929-date-month="${mode}">${months.map(m => `<option value="${m}" ${m === month ? "selected" : ""}>${v763EscapeHtml(v929MonthName(m))}</option>`).join("")}</select></label>
        <label class="v929-date-field"><small>Gün</small><select data-v929-date-day="${mode}">${days.map(d => `<option value="${d}" ${d === day ? "selected" : ""}>${String(d).padStart(2, "0")}</option>`).join("")}</select></label>
      </div>
      <div class="v929-date-actions"><button type="button" data-v929-date-clear="${mode}">Temizle</button><button type="button" data-v929-date-apply="${mode}">Uygula</button></div>
    </div>`;
  }

  function v926HistoryFiltersHtml(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const active = v926GetHistoryFilter(m);
    const manual = v926GetHistoryManualDate(m);
    const items = [["all", "Tümü"], ["day", "Bugün"], ["week", "1 Hafta"], ["month", "1 Ay"], ["quarter", "3 Ay"], ["half", "6 Ay"], ["year", "1 Yıl"]];
    const dateLabel = active === "manual" && manual ? v929FormatHistoryDateLabel(manual) : "Tarih Seç";
    return `<div class="v926-history-filters v928-history-filters" data-v926-history-filters="${m}">
      ${items.map(([key, label]) => `<button type="button" class="${active === key ? "active" : ""}" data-v926-history-filter="${m}:${key}">${label}</button>`).join("")}
      <span class="v929-history-date-break" aria-hidden="true"></span>
      <div class="v929-history-date-wrap" data-v929-date-wrap="${m}"><button type="button" class="v929-history-date-open ${active === "manual" ? "active" : ""}" data-v929-date-open="${m}">${v763EscapeHtml(dateLabel)}</button>${v929BuildDatePanelHtml(m, manual)}</div>
    </div>`;
  }

  function v903BetKindLabel(row) {
    const comboCount = Array.isArray(row?.combo) ? row.combo.length : 0;
    return comboCount >= 1 ? "Kombine" : "Tek";
  }

  function v903BetSummaryHtml(row, kind) {
    const isHistory = kind === "history";
    const isLoss = isHistory && row.res === "loss";
    const isWin = isHistory && row.res === "win";
    const statusLabel = isHistory ? (isLoss ? "Kaybetti" : "Kazandı") : "Bekliyor";
    const statusClass = isLoss ? "loss" : isWin ? "win" : "pending";
    const stamp = v903FormatRollingDate(row.createdAt || row.settledAt || row.updatedAt || Date.now());
    const oddsLabel = Number(row.totalOdds || 0) ? Number(row.totalOdds).toFixed(2) : "-";
    const stakeLabel = v768Money(row.stake);
    const winLabel = Number(row.possible || 0) ? v768Money(row.possible) : "-";
    const kindLabel = v903BetKindLabel(row);
    const kindClass = kindLabel === "Kombine" ? "v908-kind-combo v910-kind-combo" : "v908-kind-single v910-kind-single";
    const kindColor = kindLabel === "Kombine" ? "#c084fc" : "#38bdf8";
    const gainClass = isHistory && isWin ? "v908-gain-win v910-gain-win" : "v908-gain v910-gain";
    const gainStyle = isHistory && isWin ? "color:#4ade80 !important;" : "color:#f8fafc !important;";
    const statusColor = statusClass === "win" ? "#4ade80" : statusClass === "loss" ? "#f87171" : "#fb923c";
    const gainLine = isLoss ? "" : `<span><small>Kazanç:</small><b class="${gainClass}" style="${gainStyle}">${winLabel}</b></span>`;
    const titleInner = `<span class="v911-summary-date">${stamp} - </span><span class="v911-summary-bet-ref" style="color:#fbbf24 !important;">Gün ${row.day} · Bahis ${row.slot + 1}</span>`;
    const isActive = kind === "active";
    const titleCamera = isHistory
      ? `<span class="v921-summary-camera" data-v921-history-photo="${row.day}:${row.slot}" title="Geçmiş kupon fotoğrafı" aria-label="Geçmiş kupon fotoğrafı"><i class="fa-solid fa-camera"></i></span>`
      : isActive
        ? `<span class="v921-summary-camera v922-active-summary-camera" data-v922-active-photo="${row.day}:${row.slot}" title="Aktif kupon fotoğrafı" aria-label="Aktif kupon fotoğrafı"><i class="fa-solid fa-camera"></i></span>`
        : "";
    const summaryClass = isHistory ? "v903-bet-summary v921-history-summary" : isActive ? "v903-bet-summary v922-active-summary" : "v903-bet-summary";
    const titleClass = (isHistory || isActive) ? "v921-summary-title-row" : "";
    const titleHtml = (isHistory || isActive)
      ? `<span class="v921-summary-title-text">${titleInner}</span>${titleCamera}`
      : titleInner;
    return `<button type="button" class="${summaryClass}" data-v903-accordion-toggle aria-expanded="false">
      <strong class="${titleClass}">${titleHtml}</strong>
      <span><small>Tip:</small><b class="${kindClass}" style="color:${kindColor} !important;">${kindLabel}</b></span>
      <span><small>Oran:</small><b class="v908-odds v910-odds" style="color:#fbbf24 !important;">${oddsLabel}</b></span>
      <span><small>Bahis Tutarı:</small><b>${stakeLabel}</b></span>
      ${gainLine}
      <span><small>Durum:</small><b class="${statusClass} v910-status-${statusClass}" style="color:${statusColor} !important;">${statusLabel}</b></span>
    </button>`;
  }


  function v904BetMatchStatus(row, kind, idx, count) {
    const raw = Array.isArray(row?.comboResults) ? row.comboResults : [];
    const saved = raw[idx] === "loss" ? "loss" : raw[idx] === "win" ? "win" : "";
    if (saved) return saved;
    if (kind === "history" && Number(count || 0) <= 1) {
      return row?.res === "loss" ? "loss" : row?.res === "win" ? "win" : "pending";
    }
    return "pending";
  }

  function v904BetMatchStatusLabel(status) {
    return status === "win" ? "Kazandı" : status === "loss" ? "Kaybetti" : "────────";
  }

  function v908CompactText(value, maxLen) {
    const text = String(value || "").trim();
    const limit = Number(maxLen || 0) || 48;
    return text.length > limit ? text.slice(0, Math.max(1, limit - 1)) + "…" : text;
  }

  function v904BetMatchListHtml(row, kind, matchItems) {
    const items = Array.isArray(matchItems) ? matchItems : [];
    if (!items.length) return "";
    return `<ul class="v904-bet-match-list">${items.map((x, idx) => {
      const status = v904BetMatchStatus(row, kind, idx, items.length);
      const safeName = v763EscapeHtml(x.note || `Maç ${idx + 1}`);
      const odds = Number(x.odds || 0) ? Number(x.odds).toFixed(2) : "-";
      return `<li class="${status}"><span>${idx + 1}. ${safeName}</span><b>${odds}</b><em>${v904BetMatchStatusLabel(status)}</em></li>`;
    }).join("")}</ul>`;
  }


  function v847BetLegStatusLabel(status) {
    return status === "loss" ? "KAYBETTİ" : status === "win" ? "KAZANDI" : "────────";
  }

  function v847BetLegStatusClass(status) {
    return status === "loss" ? "loss" : status === "win" ? "win" : "pending";
  }

  function v847BetLegsFromDom(day, slot) {
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const odds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
    return [{ note, odds }, ...v763ComboRows(day, slot)].filter(row => row.note || Number(row.odds || 0));
  }

  function v847RenderBetLegResultPanel(day, slot) {
    const rows = v847BetLegsFromDom(day, slot);
    if (!rows.length) return "";
    const pending = v774GetPendingSlot(day, slot);
    const results = Array.isArray(pending?.comboResults) ? pending.comboResults : [];
    const done = rows.filter((_, idx) => results[idx] === "win" || results[idx] === "loss").length;
    return `<div class="v847-leg-panel-inner">
      <div class="v847-leg-panel-head"><b>Maç Sonuçları</b><span>${done}/${rows.length} sonuçlandı</span></div>
      ${rows.map((row, idx) => {
        const status = results[idx] === "loss" ? "loss" : results[idx] === "win" ? "win" : "";
        const name = row.note || `Maç ${idx + 1}`;
        const odds = Number(row.odds || 0) ? Number(row.odds).toFixed(2) : "-";
        const safeName = v763EscapeHtml(name);
        return `<div class="v847-leg-result-row ${status || "pending"}">
          <span>${idx + 1}. ${safeName}</span>
          <div class="v854-leg-result-meta">
            <b>Oran: ${odds}</b>
            <div class="v854-leg-result-actions">
              <button type="button" class="win ${status === "win" ? "selected" : ""}" data-v847-leg-result="${day}:${slot}:${idx}:win" onclick="return omega_SetBetLegResult(event, ${day}, ${slot}, ${idx}, 'win')" title="Bu maç kazandı">✓</button>
              <button type="button" class="loss ${status === "loss" ? "selected" : ""}" data-v847-leg-result="${day}:${slot}:${idx}:loss" onclick="return omega_SetBetLegResult(event, ${day}, ${slot}, ${idx}, 'loss')" title="Bu maç kaybetti">×</button>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function v847RenderBetResultCard(day, slot, op, amt, baseOdds, comboRows, totalOdds, effect) {
    const legs = [{ note: op.note || "Maç", odds: baseOdds }, ...comboRows.map(row => ({ note: row.note || "Maç", odds: Number(row.odds || 0) }))];
    const rawResults = Array.isArray(op.comboResults) ? op.comboResults : [];
    const isCombo = legs.length > 1;
    const finalStatus = op.res === "loss" ? "loss" : "win";
    const finalLabel = finalStatus === "loss" ? "KAYBETTİ" : "KAZANDI";
    const totalLabel = finalStatus === "loss" ? "Kayıp" : "Kazanç";
    const title = isCombo ? `KOMBİNE ${legs.length} MAÇ` : "TEKLİ BAHİS";
    const displayValue = finalStatus === "win"
      ? (Number(amt || 0) && Number(totalOdds || 0) ? Number(amt || 0) * Number(totalOdds || 0) : Math.max(0, Number(effect || 0)))
      : -Math.abs(Number(amt || 0));
    const netText = `${displayValue >= 0 ? "" : "-"}$${Math.abs(displayValue).toFixed(2)}`;
    const rowsHtml = legs.map((leg, idx) => {
      let status = rawResults[idx] === "loss" ? "loss" : rawResults[idx] === "win" ? "win" : "";
      if (!status && !isCombo) status = finalStatus;
      const name = leg.note || `Maç ${idx + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds).toFixed(2) : "-";
      const safeName = v763EscapeHtml(name);
      return `<li class="${v847BetLegStatusClass(status)}">
        <span>${idx + 1}. ${safeName}</span>
        <div class="v851-shot-line-meta">
          <b>Oran: ${odds}</b>
          <em>${v847BetLegStatusLabel(status)}</em>
        </div>
      </li>`;
    }).join("");
    return `<div class="kapsul v32 v847-shot-result ${finalStatus}">
      <div class="v850-shot-toolbar">
        <button type="button" class="v847-shot-back v850-shot-return" onclick="return omega_ReturnExcelOp(event, ${day}, ${slot})" title="Geri Dön"><i class="fa-solid fa-arrow-left"></i><span>Geri Dön</span></button>
        <button type="button" class="v850-shot-close" onclick="return omega_CloseExcelOp(event, ${day}, ${slot})" title="Kapat"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="v847-shot-head">
        <b>${title}</b>
        <div class="v847-shot-head-tools">
          <span class="${finalStatus}">${finalLabel}</span>
          <button type="button" class="v847-shot-camera" onclick="return omega_RollingResultPhoto(event, ${day}, ${slot})" title="Sonuç fotoğrafını göster"><i class="fa-solid fa-camera"></i></button>
        </div>
      </div>
      <ul class="v847-shot-lines">${rowsHtml}</ul>
      <div class="v847-shot-footer v851-shot-footer">
        <span>Toplam Oran <b>${Number(totalOdds || 0) ? Number(totalOdds).toFixed(2) : "-"}</b></span>
        <span>Tutar <b>${v768Money(amt)}</b></span>
        <span class="v851-result-total ${finalStatus}">${totalLabel} <b class="${displayValue >= 0 ? "pos" : "neg"}">${netText}</b></span>
      </div>
    </div>`;
  }

  function v847SetBetLegResult(day, slot, index, status) {
    if (!Number.isFinite(day) || !Number.isFinite(slot) || !Number.isFinite(index)) return false;
    const domEntry = v774PendingFromDom(day, slot);
    const savedEntry = v774GetPendingSlot(day, slot);
    const pending = domEntry || savedEntry;
    if (!pending || !pending.note) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Önce maç ve oran alanlarını doldur.");
      return false;
    }
    const legs = [{ note: pending.note, odds: pending.odds }, ...(Array.isArray(pending.combo) ? pending.combo : [])].filter(row => row.note || Number(row.odds || 0));
    if (!legs.length) return false;
    const results = Array.from({ length: legs.length }, (_, i) => {
      const v = Array.isArray(pending.comboResults) ? pending.comboResults[i] : "";
      return v === "loss" ? "loss" : v === "win" ? "win" : "";
    });
    const next = status === "loss" ? "loss" : "win";
    results[index] = results[index] === next ? "" : next;
    v774SetPendingSlot(day, slot, { ...pending, comboResults: results, updatedAt: Date.now() });
    omega_RenderExcelTable();
    return false;
  }

  function v768SlotOdds(day, slot) {
    const mainOdds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
    const extras = v763ComboRows(day, slot);
    return v763BetTotalOdds(mainOdds, extras);
  }

  function v768UpdateBetCalc(day, slot) {
    const box = document.querySelector(`[data-v768-calc="${day}:${slot}"]`);
    if (!box) return;
    const totalOdds = v768SlotOdds(day, slot);
    const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || 0);
    const possible = totalOdds && stake ? stake * totalOdds : 0;
    box.innerHTML = `<span>Toplam Oran: <b>${totalOdds ? totalOdds.toFixed(2) : "-"}</b></span><span>Tahmini Kazanç: <b>${possible ? v768Money(possible) : "-"}</b></span>`;
    const legPanel = document.querySelector(`[data-v847-leg-panel="${day}:${slot}"]`);
    if (legPanel) legPanel.innerHTML = v847RenderBetLegResultPanel(day, slot);
    const actions = document.querySelector(`[data-v847-main-actions="${day}:${slot}"]`);
    if (actions) actions.classList.remove("v847-hide-main-actions");
  }

  function v898WarnStakeInput(stakeInput) {
    const message = "Bir tutar gir";
    if (!stakeInput) return;
    try {
      const originalPlaceholder = stakeInput.dataset.v901OriginalPlaceholder || stakeInput.getAttribute("placeholder") || "Tutar";
      stakeInput.dataset.v901OriginalPlaceholder = originalPlaceholder;
      try { stakeInput.setCustomValidity(""); } catch(e) {}
      stakeInput.classList.add("v856-stake-warning");
      stakeInput.placeholder = message;
      if (stakeInput._v901StakeWarnClear) {
        stakeInput.removeEventListener("input", stakeInput._v901StakeWarnClear);
        stakeInput.removeEventListener("change", stakeInput._v901StakeWarnClear);
      }
      const clear = () => {
        stakeInput.placeholder = stakeInput.dataset.v901OriginalPlaceholder || "Tutar";
        stakeInput.classList.remove("v856-stake-warning");
        try { stakeInput.setCustomValidity(""); } catch(e) {}
        stakeInput.removeEventListener("input", clear);
        stakeInput.removeEventListener("change", clear);
        stakeInput._v901StakeWarnClear = null;
      };
      stakeInput._v901StakeWarnClear = clear;
      stakeInput.addEventListener("input", clear);
      stakeInput.addEventListener("change", clear);
    } catch(e) {}
    try { stakeInput.focus(); } catch(e) {}
  }

  function v768BindBetCalc(root) {
    const scope = root || document;
    scope.querySelectorAll('[id^="e-o-"], [id^="e-a-"], [data-v763-extra-odds]').forEach(input => {
      if (input.dataset.v768CalcBound === "1") return;
      input.dataset.v768CalcBound = "1";
      input.addEventListener("input", () => {
        const kapsul = input.closest("[data-v765-kapsul]");
        if (!kapsul) return;
        const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
        v768UpdateBetCalc(day, slot);
      });
    });
  }

  function v774SmartMemoryEnabled() {
    const mode = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    return mode === "bet" && (_ACTIVE_EXCEL_DAYS === 7 || _ACTIVE_EXCEL_DAYS === 15);
  }

  function v774EnsurePending(plan) {
    if (!plan.pending) plan.pending = {};
    return plan.pending;
  }

  function v774NormalizePendingEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const note = String(entry.note || "").trim();
    const stake = entry.amt === "" || entry.amt == null ? "" : Number(entry.amt || 0);
    const odds = entry.odds === "" || entry.odds == null ? "" : Number(entry.odds || 0);
    const combo = Array.isArray(entry.combo) ? entry.combo.map(row => ({
      note: String(row?.note || "").trim(),
      odds: row?.odds === "" || row?.odds == null ? "" : Number(row.odds || 0)
    })).filter(row => row.note || Number(row.odds || 0)) : [];
    if (!note && stake === "" && odds === "" && !combo.length) return null;
    const comboResults = Array.isArray(entry.comboResults) ? entry.comboResults.map(v => v === "loss" ? "loss" : v === "win" ? "win" : "").slice(0, combo.length + 1) : [];
    const now = Date.now();
    const createdAt = Number(entry.createdAt || entry.playedAt || entry.insertedAt || entry.updatedAt || now);
    const updatedAt = Number(entry.updatedAt || now);
    return { note, amt: stake, odds, combo, comboResults, status: "pending", createdAt, updatedAt };
  }

  function v774PendingFromDom(day, slot) {
    if (!v774SmartMemoryEnabled()) return null;
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return null;
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const stakeText = document.getElementById(`e-a-${day}-${slot}`)?.value || "";
    const oddsText = document.getElementById(`e-o-${day}-${slot}`)?.value || "";
    const stake = stakeText === "" ? "" : Number(stakeText || 0);
    const odds = oddsText === "" ? "" : Number(oddsText || 0);
    const combo = v763ComboRows(day, slot).map(row => ({ note: row.note, odds: row.odds || "" }));
    const previous = v774GetPendingSlot(day, slot);
    const comboResults = Array.isArray(previous?.comboResults) ? previous.comboResults : [];
    const createdAt = Number(previous?.createdAt || previous?.updatedAt || Date.now());
    const hasAny = Boolean(note || stakeText !== "" || oddsText !== "" || combo.length);
    if (!hasAny) return null;
    return { note, amt: stake, odds, combo, comboResults, status: "pending", createdAt, updatedAt: Date.now() };
  }

  function v774SetPendingSlot(day, slot, entry) {
    if (!v774SmartMemoryEnabled()) return;
    const plan = ensureRollingPlan();
    const pending = v774EnsurePending(plan);
    if (!pending[day]) pending[day] = {};
    const normalized = v774NormalizePendingEntry(entry);
    // Maç adı olmayan satırları aktif/bekliyor sayma; eski tutar/oran kalıntısını temizle.
    if (!normalized || !normalized.note) {
      delete pending[day][slot];
      if (Object.keys(pending[day]).length === 0) delete pending[day];
      omega_SaveRollingDB();
      return;
    }
    pending[day][slot] = normalized;
    omega_SaveRollingDB();
  }

  function v774GetPendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    return v774NormalizePendingEntry(plan.pending?.[day]?.[slot]);
  }

  function v774ClearPendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    if (plan.pending?.[day]) {
      delete plan.pending[day][slot];
      if (Object.keys(plan.pending[day]).length === 0) delete plan.pending[day];
      omega_SaveRollingDB();
    }
  }

  window.omega_RollingClearSlot = function(day, slot) {
    const kapsul = document.querySelector(`[data-v765-kapsul="${day}:${slot}"]`);
    if (!kapsul) return false;
    const plan = ensureRollingPlan();
    if (plan.ops?.[day]?.[slot]) return false;
    const note = document.getElementById(`e-n-${day}-${slot}`);
    const stake = document.getElementById(`e-a-${day}-${slot}`);
    const odds = document.getElementById(`e-o-${day}-${slot}`);
    const fee = document.getElementById(`e-f-${day}-${slot}`);
    if (note) note.value = "";
    if (stake) stake.value = "";
    if (odds) odds.value = "";
    if (fee) fee.value = "";
    kapsul.querySelectorAll(".v765-extra-match-row, .v768-extra-match-row").forEach(row => row.remove());
    v774ClearPendingSlot(day, slot);
    v768UpdateBetCalc(day, slot);
    omega_SaveRollingDB();
    return false;
  };

  function v774SavePendingSlot(day, slot) {
    const plan = ensureRollingPlan();
    if (plan.ops?.[day]?.[slot]) {
      v774ClearPendingSlot(day, slot);
      return;
    }
    v774SetPendingSlot(day, slot, v774PendingFromDom(day, slot));
  }

  function v774FlushAllPendingFromDom() {
    if (!v774SmartMemoryEnabled()) return;
    document.querySelectorAll('#rolling-excel-overlay [data-v765-kapsul]').forEach(kapsul => {
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      if (day && Number.isInteger(slot)) v774SavePendingSlot(day, slot);
    });
  }

  function v768LiveRows(mode) {
    const plan = ensureRollingPlan();
    const isCrypto = mode === "crypto";
    const smartBet = !isCrypto && v774SmartMemoryEnabled();
    const rows = [];
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      const dayOps = plan.ops?.[day] || [];
      const dayPending = smartBet ? (plan.pending?.[day] || {}) : {};
      const domSlots = Array.from(document.querySelectorAll(`#rolling-excel-overlay [data-v765-kapsul^="${day}:"]`)).map(el => Number(String(el.dataset.v765Kapsul || "0:0").split(":")[1] || 0));
      const maxSlots = Math.max(dayOps.length || 0, ...Object.keys(dayPending).map(Number).map(n => n + 1), ...domSlots.map(n => n + 1), 0);
      for (let slot = 0; slot < maxSlots; slot++) {
        const saved = dayOps[slot];
        if (saved) continue;
        if (!smartBet) {
          const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
          const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || 0);
          const odds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || 0);
          const combo = isCrypto ? [] : v763ComboRows(day, slot);
          if (!note && !stake && !odds && !combo.length) continue;
          const totalOdds = isCrypto ? odds : v763BetTotalOdds(odds, combo);
          rows.push({ day, slot, note, stake, odds, combo, comboResults: [], totalOdds, possible: (!isCrypto && stake && totalOdds) ? stake * totalOdds : 0, createdAt: Date.now(), updatedAt: Date.now() });
          continue;
        }
        const pending = v774GetPendingSlot(day, slot);
        const hasDom = Boolean(document.getElementById(`e-n-${day}-${slot}`));
        const domPending = hasDom ? v774PendingFromDom(day, slot) : null;
        const src = v774NormalizePendingEntry(domPending) || pending;
        if (!src || !src.note) continue;
        const stake = Number(src.amt || 0);
        const odds = Number(src.odds || 0);
        const combo = Array.isArray(src.combo) ? src.combo : [];
        const totalOdds = v763BetTotalOdds(odds, combo);
        rows.push({ day, slot, note: src.note, stake, odds, combo, comboResults: Array.isArray(src.comboResults) ? src.comboResults : [], totalOdds, possible: (stake && totalOdds) ? stake * totalOdds : 0, pending: true, createdAt: src.createdAt || src.updatedAt || Date.now(), updatedAt: src.updatedAt || Date.now() });
      }
    }
    return rows;
  }

  function v768HistoryRows(mode) {
    const plan = ensureRollingPlan();
    const isCrypto = mode === "crypto";
    const rows = [];
    let stampDirty = false;
    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      const dayOps = plan.ops?.[day] || [];
      dayOps.forEach((op, slot) => {
        if (!op) return;
        const combo = Array.isArray(op.combo) ? op.combo : [];
        const totalOdds = v926OpTotalOdds(op, isCrypto);
        const stake = v926OpStake(op);
        const pnl = v926OpEffect(op, isCrypto);
        const stamp = Number(op.createdAt || op.playedAt || op.settledAt || op.updatedAt || 0) || Date.now();
        if (!op.createdAt) {
          op.createdAt = stamp;
          stampDirty = true;
        }
        rows.push({ day, slot, note: op.note || (isCrypto ? "İşlem" : "Maç"), stake, odds: op.odds, combo, comboResults: Array.isArray(op.comboResults) ? op.comboResults : [], totalOdds, possible: (!isCrypto && stake && totalOdds) ? stake * totalOdds : 0, res: op.res, pnl, createdAt: stamp, settledAt: Number(op.settledAt || op.updatedAt || stamp) });
      });
    }
    if (stampDirty) omega_SaveRollingDB();
    return rows;
  }

  function v768FeatureRowsHtml(mode, kind) {
    const isCrypto = mode === "crypto";
    const allRows = kind === "active" ? v768LiveRows(mode) : v768HistoryRows(mode);
    const rows = kind === "history" ? v926FilterHistoryRows(allRows, mode) : allRows;
    if (!rows.length) return `<div class="v768-feature-empty">${kind === "active" ? "Aktif bahis yok. Maç/işlem yazınca burada görünür." : "Seçilen tarih aralığında geçmiş kayıt yok."}</div>`;
    return rows.map(row => {
      const comboRows = Array.isArray(row.combo) ? row.combo : [];
      const isBet = !isCrypto;
      const isActiveBet = isBet && kind === "active";
      const isHistoryBet = isBet && kind === "history";
      const matchItems = isBet
        ? [{ note: row.note || "Maç", odds: Number(row.odds || 0) }, ...comboRows.map(x => ({ note: x.note || "Maç", odds: Number(x.odds || 0) }))]
        : [];
      const matchHtml = isBet && matchItems.length
        ? `<ul class="v892-active-match-list">${matchItems.map((x, idx) => `<li><span>${idx + 1}. ${v763EscapeHtml(x.note || "Maç")}</span><b>${Number(x.odds || 0) ? Number(x.odds || 0).toFixed(2) : "-"}</b></li>`).join("")}</ul>`
        : "";
      const title = isCrypto ? (row.note || "İşlem") : (comboRows.length ? "Kombine" : "Tekli Bahis");
      const status = kind === "history" ? `<em class="${row.res === "win" ? "pos" : "neg"}">${row.res === "win" ? (isCrypto ? "KÂR" : "KAZANDI") : (isCrypto ? "ZARAR" : "KAYBETTİ")}</em>` : `<em>Bekliyor</em>`;
      const metric = isCrypto ? `Tutar: ${v768Money(row.stake)} · Net P/L: ${v768Money(row.odds)}` : `Tutar: ${v768Money(row.stake)} · Toplam Oran: ${row.totalOdds ? row.totalOdds.toFixed(2) : "-"} · Kazanç: ${row.possible ? v768Money(row.possible) : "-"}`;
      const summaryHtml = isActiveBet || isHistoryBet
        ? `<div class="v893-active-summary"><span><small>Tutar</small><b>${v768Money(row.stake)}</b></span><span><small>Toplam Oran</small><b>${row.totalOdds ? row.totalOdds.toFixed(2) : "-"}</b></span><span><small>Kazanç</small><b>${row.possible ? v768Money(row.possible) : "-"}</b></span></div>`
        : `<p>${metric}</p>`;
      const cardClass = isActiveBet || isHistoryBet ? "v768-feature-card v892-bet-active-card" : "v768-feature-card";
      const oldDetail = `<div><b>${v763EscapeHtml(title)}</b>${status}</div><span>Gün ${row.day} · Bahis ${row.slot + 1}</span>${summaryHtml}${matchHtml}`;
      if (isActiveBet || isHistoryBet) {
        const detailHtml = v904BetMatchListHtml(row, kind, matchItems);
        return `<article class="${cardClass} v903-bet-accordion-card" data-v903-accordion-card>
          ${v903BetSummaryHtml(row, kind)}
          <div class="v903-bet-detail" data-v903-accordion-detail hidden></div>
          <template data-v905-accordion-template>${detailHtml}</template>
        </article>`;
      }
      return `<article class="${cardClass}">${oldDetail}</article>`;
    }).join("");
  }

  function v891ActiveBetPhotoSvg() {
    v774FlushAllPendingFromDom();
    const rows = v768LiveRows("bet");
    if (!rows.length) return null;
    const safe = v763EscapeHtml;
    const moneyLabel = v768Money;
    const lineRows = [];
    rows.forEach(row => {
      const combo = Array.isArray(row.combo) ? row.combo : [];
      const matchRows = [{ note: row.note || "Maç", odds: Number(row.odds || 0) }, ...combo.map(x => ({ note: x.note || "Maç", odds: Number(x.odds || 0) }))];
      lineRows.push({ kind: "head", day: row.day, slot: row.slot, stake: Number(row.stake || 0), totalOdds: Number(row.totalOdds || 0), possible: Number(row.possible || 0), count: matchRows.length });
      matchRows.forEach((m, idx) => lineRows.push({ kind: "match", idx, note: m.note || "Maç", odds: Number(m.odds || 0) }));
      lineRows.push({ kind: "summary", stake: Number(row.stake || 0), totalOdds: Number(row.totalOdds || 0), possible: Number(row.possible || 0) });
      lineRows.push({ kind: "gap" });
    });
    const height = Math.max(520, 140 + lineRows.length * 38 + 80);
    let y = 126;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}">`,
      `<rect width="900" height="${height}" fill="#020617"/>`,
      `<rect x="22" y="22" width="856" height="${height - 44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/>`,
      `<text x="42" y="72" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">AKTİF BAHİSLER / KUPONLAR</text>`,
      `<text x="42" y="104" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="800">BAHİS ${_ACTIVE_EXCEL_DAYS} GÜNLÜK ROLLING</text>`];
    lineRows.forEach(row => {
      if (row.kind === "head") {
        parts.push(`<rect x="42" y="${y}" width="816" height="38" rx="13" fill="#1e293b" stroke="#475569"/>`);
        const kindText = row.count > 1 ? `KOMBİNE ${row.count} MAÇ` : "TEKLİ BAHİS";
        const kindFill = row.count > 1 ? "#c084fc" : "#38bdf8";
        parts.push(`<text x="64" y="${y + 25}" fill="#fbbf24" font-size="20" font-family="Arial" font-weight="900">GÜN ${row.day} BAHİS ${row.slot + 1}</text>`);
        parts.push(`<text x="836" y="${y + 25}" text-anchor="end" fill="${kindFill}" font-size="17" font-family="Arial" font-weight="900">${kindText}</text>`);
        y += 48;
      } else if (row.kind === "match") {
        const note = String(row.note || "Maç");
        const noteLines = v909SvgTextLines(`${row.idx + 1}. ${note}`, 46);
        const lineHeight = 20;
        const rowHeight = Math.max(34, 18 + noteLines.length * lineHeight);
        const centerY = y + (rowHeight / 2);
        const textStartY = centerY - (((noteLines.length - 1) * lineHeight) / 2) + 6;
        const rightTextY = centerY + 6;
        const textBody = noteLines.map((line, lineIdx) => `<tspan x="66" dy="${lineIdx === 0 ? 0 : lineHeight}">${safe(line)}</tspan>`).join("");
        parts.push(`<text x="66" y="${textStartY}" fill="#e5e7eb" font-size="17" font-family="Arial" font-weight="800">${textBody}</text>`);
        parts.push(`<text x="836" y="${rightTextY}" text-anchor="end" fill="#fbbf24" font-size="17" font-family="Arial" font-weight="900">${row.odds ? row.odds.toFixed(2) : "-"}</text>`);
        y += rowHeight;
      } else if (row.kind === "summary") {
        parts.push(`<rect x="56" y="${y}" width="788" height="76" rx="14" fill="#111827" stroke="#334155"/>`);
        parts.push(`<text x="76" y="${y + 25}" fill="#cbd5e1" font-size="16" font-family="Arial" font-weight="800">Toplam Oran:</text><text x="826" y="${y + 25}" text-anchor="end" fill="#fbbf24" font-size="17" font-family="Arial" font-weight="900">${row.totalOdds ? row.totalOdds.toFixed(2) : "-"}</text>`);
        parts.push(`<text x="76" y="${y + 48}" fill="#cbd5e1" font-size="16" font-family="Arial" font-weight="800">Bahis Tutarı:</text><text x="826" y="${y + 48}" text-anchor="end" fill="#e5e7eb" font-size="17" font-family="Arial" font-weight="900">${moneyLabel(row.stake)}</text>`);
        parts.push(`<text x="76" y="${y + 70}" fill="#22c55e" font-size="16" font-family="Arial" font-weight="900">Kazanç:</text><text x="826" y="${y + 70}" text-anchor="end" fill="#22c55e" font-size="17" font-family="Arial" font-weight="900">${row.possible ? moneyLabel(row.possible) : "-"}</text>`);
        y += 88;
      } else {
        y += 10;
      }
    });
    parts.push(`</svg>`);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(parts.join(""));
  }

  function v891OpenActiveBetPhotoPreview() {
    const uri = v891ActiveBetPhotoSvg();
    if (!uri) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Aktif bahis bulunamadı.");
      else alert("Aktif bahis bulunamadı.");
      return false;
    }
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v776-photo-overlay" data-v891-active-photo-close><section class="v776-photo-modal"><div class="v776-photo-head"><div><b>Aktif Bahisler Fotoğrafı</b><span>BAHİS ${_ACTIVE_EXCEL_DAYS} GÜNLÜK ROLLING</span></div><button type="button" data-v891-active-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v891-active-photo-download>Resmi İndir</button></div><img src="${uri}" alt="Aktif bahisler fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v891-active-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v891-active-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v891-active-photo-download]")?.addEventListener("click", () => {
      v777DownloadPhotoPng(uri, `bahis-rolling-${_ACTIVE_EXCEL_DAYS}-aktif-bahisler-${new Date().toISOString().slice(0,10)}.png`);
    });
    return false;
  }

  function v768OpenFeaturePanel(mode = "bet", kind = "active") {
    v774FlushAllPendingFromDom();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    const title = k === "active" ? (m === "crypto" ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR") : k === "history" ? "Geçmiş" : "Rapor";
    const reportRows = v768HistoryRows(m);
    const reportHtml = k === "report" ? `<div class="v768-feature-report"><div><span>Kayıt</span><b>${reportRows.length}</b></div><div><span>${m === "crypto" ? "Toplam P/L" : "Toplam K/Z"}</span><b>${v768Money(reportRows.reduce((a,r)=>a+Number(r.pnl||0),0))}</b></div><button type="button" data-v768-report-download="${m}">Rapor Özeti İndir</button></div>` : v768FeatureRowsHtml(m, k);
    const activePhotoBtn = "";
    const historyFilters = k === "history" ? v926HistoryFiltersHtml(m) : "";
    host.innerHTML = `<div class="v768-feature-overlay" data-v768-feature-panel><section class="v768-feature-modal ${m} ${k}"><div class="v768-feature-head"><div><b>${title}</b><span>${m === "crypto" ? "Kripto rolling" : "Bahis rolling"} · ${_ACTIVE_EXCEL_DAYS} günlük model</span></div><div class="v891-feature-head-actions">${activePhotoBtn}<button type="button" data-v768-feature-close>×</button></div></div><div class="v768-feature-body">${historyFilters}${reportHtml}</div></section></div>`;
    host.style.display = "block";
  }

  function v768DownloadReport(mode) {
    const rows = v768HistoryRows(mode);
    const pnl = rows.reduce((a,r)=>a+Number(r.pnl||0),0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" viewBox="0 0 900 420"><rect width="900" height="420" rx="28" fill="#020617"/><rect x="26" y="26" width="848" height="368" rx="22" fill="none" stroke="#fbbf24" stroke-width="2"/><text x="52" y="80" fill="#fbbf24" font-size="26" font-family="Arial" font-weight="900">BULTEN · ${mode === "crypto" ? "KRİPTO" : "BAHİS"} ROLLING RAPOR</text><text x="52" y="140" fill="#fff" font-size="22" font-family="Arial" font-weight="800">Kayıt: ${rows.length}</text><text x="52" y="180" fill="#fff" font-size="22" font-family="Arial" font-weight="800">${mode === "crypto" ? "Toplam P/L" : "Toplam K/Z"}: ${v768Money(pnl)}</text><text x="52" y="230" fill="#94a3b8" font-size="16" font-family="Arial">${new Date().toLocaleString("tr-TR")}</text></svg>`;
    const a = document.createElement("a");
    a.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    a.download = `bulten-${mode}-rolling-rapor.svg`;
    document.body.appendChild(a); a.click(); a.remove();
  }


  function v776SlotPhotoRows(day, slot) {
    const plan = ensureRollingPlan();
    const savedOp = plan.ops?.[day]?.[slot] || null;
    const pending = v774GetPendingSlot(day, slot);
    const baseNote = (document.getElementById(`e-n-${day}-${slot}`)?.value || pending?.note || savedOp?.note || "").trim();
    const baseOdds = Number(document.getElementById(`e-o-${day}-${slot}`)?.value || pending?.odds || savedOp?.odds || 0);
    const stake = Number(document.getElementById(`e-a-${day}-${slot}`)?.value || pending?.amt || savedOp?.amt || 0);
    const combo = v763ComboRows(day, slot);
    const savedCombo = Array.isArray(pending?.combo) ? pending.combo : Array.isArray(savedOp?.combo) ? savedOp.combo : [];
    const rawResults = Array.isArray(savedOp?.comboResults)
      ? savedOp.comboResults
      : Array.isArray(pending?.comboResults)
        ? pending.comboResults
        : [];
    const rows = [];
    if (baseNote || baseOdds) rows.push({ note: baseNote || "Maç", odds: baseOdds });
    const comboSource = combo.length ? combo : savedCombo;
    comboSource.forEach(row => {
      const note = String(row.note || "").trim();
      const odds = Number(row.odds || 0);
      if (note || odds) rows.push({ note: note || "Maç", odds });
    });
    rows.forEach((row, idx) => {
      let status = rawResults[idx] === "loss" ? "loss" : rawResults[idx] === "win" ? "win" : "";
      if (!status && savedOp && rows.length <= 1) status = savedOp.res === "loss" ? "loss" : savedOp.res === "win" ? "win" : "";
      row.status = status || "pending";
    });
    const oddsList = rows.map(r => Number(r.odds || 0)).filter(v => v > 0);
    const totalOdds = oddsList.length ? oddsList.reduce((acc, val) => acc * val, 1) : 0;
    const possible = stake && totalOdds ? stake * totalOdds : 0;
    return { rows, stake, totalOdds, possible, result: savedOp?.res || "pending" };
  }

  function v909SvgTextLines(value, maxChars) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const limit = Math.max(18, Number(maxChars || 0) || 44);
    if (!text) return [""];
    const words = text.split(" ");
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > limit && current) {
        lines.push(current);
        current = word;
      } else if (word.length > limit) {
        if (current) lines.push(current);
        for (let i = 0; i < word.length; i += limit) lines.push(word.slice(i, i + limit));
        current = "";
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines.slice(0, 4);
  }

  function v776BuildSlotPhotoSvg(day, slot) {
    const data = v776SlotPhotoRows(day, slot);
    if (!data.rows.length) return null;
    const safe = v763EscapeHtml;
    const totalOddsLabel = data.totalOdds ? data.totalOdds.toFixed(2) : "-";
    const possibleLabel = data.possible ? v768Money(data.possible) : "-";
    let y = 150;
    const rowParts = [];
    data.rows.forEach((row, idx) => {
      const status = row.status === "loss" ? "loss" : row.status === "win" ? "win" : "pending";
      const statusText = v904BetMatchStatusLabel(status);
      const statusFill = status === "win" ? "#bbf7d0" : status === "loss" ? "#fecaca" : "#cbd5e1";
      const statusStroke = status === "win" ? "#22c55e" : status === "loss" ? "#ef4444" : "#64748b";
      const statusBg = status === "win" ? "#14532d" : status === "loss" ? "#7f1d1d" : "#334155";
      const lines = v909SvgTextLines(`${idx + 1}. ${row.note || "Maç"}`, 42);
      const lineHeight = 22;
      const rectH = Math.max(42, 18 + (lines.length * lineHeight));
      const rectY = y - 28;
      const centerY = rectY + (rectH / 2);
      const textY = centerY - (((lines.length - 1) * lineHeight) / 2) + 6;
      const rightTextY = centerY + 6;
      const statusRectY = centerY - 15;
      const noteText = `<text x="64" y="${textY}" fill="#f8fafc" font-size="18" font-family="Arial" font-weight="800">${lines.map((line, lineIdx) => `<tspan x="64" dy="${lineIdx === 0 ? 0 : lineHeight}">${safe(line)}</tspan>`).join("")}</text>`;
      rowParts.push(`<rect x="42" y="${rectY}" width="816" height="${rectH}" rx="12" fill="#0f172a" stroke="#334155"/>${noteText}<text x="682" y="${rightTextY}" text-anchor="end" fill="#fbbf24" font-size="18" font-family="Arial" font-weight="900">${row.odds ? Number(row.odds).toFixed(2) : '-'}</text><rect x="710" y="${statusRectY}" width="128" height="30" rx="15" fill="${statusBg}" stroke="${statusStroke}"/><text x="774" y="${rightTextY}" text-anchor="middle" fill="${statusFill}" font-size="14" font-family="Arial" font-weight="900">${safe(statusText)}</text>`);
      y += rectH + 10;
    });
    const rowHtml = rowParts.join('');
    const footerY = y + 22;
    const footerH = 130;
    const compactMinHeight = data.rows.length <= 1 ? 400 : 520;
    const height = Math.max(compactMinHeight, footerY + footerH + 46);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}"><rect width="900" height="${height}" fill="#020617"/><rect x="22" y="22" width="856" height="${height-44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/><text x="42" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">BAHİS ${_ACTIVE_EXCEL_DAYS} GÜNLÜK ROLLING</text><text x="42" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">GÜN ${day} · BAHİS ${slot + 1}</text>${rowHtml}<rect x="42" y="${footerY}" width="816" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Toplam Oran:</text><text x="836" y="${footerY + 34}" text-anchor="end" fill="#fbbf24" font-size="20" font-family="Arial" font-weight="900">${totalOddsLabel}</text><text x="64" y="${footerY + 70}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text><text x="836" y="${footerY + 70}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${v768Money(data.stake)}</text><text x="64" y="${footerY + 106}" fill="#22c55e" font-size="19" font-family="Arial" font-weight="900">Tahmini Kazanç:</text><text x="836" y="${footerY + 106}" text-anchor="end" fill="#22c55e" font-size="20" font-family="Arial" font-weight="900">${possibleLabel}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function v777DownloadPhotoPng(svgUri, filename) {
    const img = new Image();
    img.onload = function() {
      try {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 900) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 420) * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const save = blob => {
          if (!blob) {
            const fallback = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = fallback;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1200);
        };
        if (canvas.toBlob) canvas.toBlob(save, "image/png", 0.95);
        else save(null);
      } catch (err) {
        console.error("PNG oluşturulamadı", err);
        alert("PNG oluşturulamadı. Tarayıcı engellediyse tekrar deneyin.");
      }
    };
    img.onerror = function() {
      alert("Resim hazırlanamadı. Maç/oran/tutar bilgisini kontrol et.");
    };
    img.src = svgUri;
  }

  function v923GetRollingPhotoHost() {
    let host = document.getElementById("omega-rolling-photo-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-photo-host";
      document.body.appendChild(host);
    }
    // V924: Fotoğraf ön izlemesi Aktif Bahisleri Görüntüle / Geçmiş panelinin arkasında kalmasın.
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = "1003000";
    host.style.pointerEvents = "none";
    return host;
  }

  window.omega_RollingSlotPhoto = function(day, slot) {
    v774SavePendingSlot(day, slot);
    const uri = v776BuildSlotPhotoSvg(day, slot);
    if (!uri) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Önce maç ve oran yaz.");
      else alert("Önce maç ve oran yaz.");
      return false;
    }
    const host = v923GetRollingPhotoHost();
    host.innerHTML = `<div class="v776-photo-overlay" data-v776-photo-close><section class="v776-photo-modal"><div class="v776-photo-head"><div><b>Kupon Fotoğrafı</b><span>Gün ${day} · Bahis ${slot + 1}</span></div><button type="button" data-v776-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v777-photo-download>Resmi İndir</button></div><img src="${uri}" alt="Kupon fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v776-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v776-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v776-photo-show]")?.addEventListener("click", () => {
      const w = window.open("", "_blank");
      if (w) w.document.write(`<img src="${uri}" style="max-width:100%;height:auto;background:#020617;display:block;margin:0 auto;">`);
    });
    host.querySelector("[data-v777-photo-download]")?.addEventListener("click", () => {
      v777DownloadPhotoPng(uri, `bahis-rolling-${_ACTIVE_EXCEL_DAYS}-gun-${day}-bahis-${slot + 1}.png`);
    });
    return false;
  };

  function v763DayToolButtons(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const activeLabel = m === "crypto" ? "Aktif Kripto İşlemleri" : "Aktif Bahisleri Görüntüle";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls v770-excel-feature-controls v771-excel-feature-controls" data-v771-feature-controls="${m}">
      <button type="button" class="v758-row-tool v759-row-tool active" data-v768-feature-open="${m}:active">${activeLabel}</button>
      <button type="button" class="v758-row-tool v759-row-tool history" data-v768-feature-open="${m}:history">Geçmiş</button>
    </div>`;
  }

  window.omega_ExcelRollingOpenMainPanel = function(event, mode = "bet", kind = "active") {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    const stamp = `${m}:${k}`;
    const now = Date.now();
    if (window.__omegaV770ExcelPanelStamp === stamp && (now - Number(window.__omegaV770ExcelPanelTime || 0)) < 180) return false;
    window.__omegaV770ExcelPanelStamp = stamp;
    window.__omegaV770ExcelPanelTime = now;
    try { document.getElementById("omega-rolling-feature-host")?.remove(); } catch(e) {}
    v768OpenFeaturePanel(m, k);
    return false;
  };

  window.omega_RollingExcelOpenFeature = function(event, mode = "bet", kind = "active") {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    v768OpenFeaturePanel(m, k);
    return false;
  };

  if (!window.__omegaV768ExcelFeatureDelegationBound) {
    window.__omegaV768ExcelFeatureDelegationBound = true;
    document.addEventListener("click", function(event) {
      const v770Btn = event.target.closest && event.target.closest("[data-v770-excel-open]");
      if (v770Btn) {
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [modeRaw, kindRaw] = String(v770Btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
        return;
      }
      const featureBtn = event.target.closest && event.target.closest("[data-v768-feature-open]");
      if (featureBtn) {
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [modeRaw, kindRaw] = String(featureBtn.dataset.v768FeatureOpen || "bet:active").split(":");
        window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
        return;
      }
      const comboBtn = event.target.closest && event.target.closest("[data-v768-combo]");
      if (comboBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [dayRaw, slotRaw, dirRaw] = String(comboBtn.dataset.v768Combo || "0:0:plus").split(":");
        window.omega_RollingToggleComboRow(Number(dayRaw), Number(slotRaw), dirRaw === "minus" ? "minus" : "plus");
        return;
      }
      const cryptoToggleBtn = event.target.closest && event.target.closest("[data-v928-crypto-toggle]");
      if (cryptoToggleBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const kapsul = cryptoToggleBtn.closest("[data-v765-kapsul]");
        if (kapsul) {
          document.querySelectorAll('#rolling-excel-overlay[data-roll-mode="crypto"] .v928-crypto-kapsul.is-open').forEach(openCard => {
            if (openCard !== kapsul) openCard.classList.remove("is-open");
          });
          kapsul.classList.add("is-open");
          cryptoToggleBtn.setAttribute("aria-expanded", "true");
          setTimeout(() => kapsul.querySelector('input[id^="e-n-"]')?.focus(), 30);
        }
        return;
      }
      const activePhotoBtn = event.target.closest && event.target.closest("[data-v891-active-photo]");
      if (activePhotoBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        v891OpenActiveBetPhotoPreview();
        return;
      }
      const historyFilterBtn = event.target.closest && event.target.closest("[data-v926-history-filter]");
      if (historyFilterBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [modeRaw, filterRaw] = String(historyFilterBtn.dataset.v926HistoryFilter || "bet:all").split(":");
        const mode = modeRaw === "crypto" ? "crypto" : "bet";
        const filter = ["all", "day", "week", "month", "quarter", "half", "year", "manual"].includes(filterRaw) ? filterRaw : "all";
        localStorage.setItem(v926HistoryFilterStorageKey(mode), filter);
        v768OpenFeaturePanel(mode, "history");
        return;
      }
      const closeBtn = event.target.closest && event.target.closest("[data-v768-feature-close]");
      if (closeBtn) {
        event.preventDefault();
        document.getElementById("omega-rolling-feature-host")?.remove();
        return;
      }
      if (event.target && event.target.matches && event.target.matches(".v768-feature-overlay")) {
        document.getElementById("omega-rolling-feature-host")?.remove();
        return;
      }
      const reportBtn = event.target.closest && event.target.closest("[data-v768-report-download]");
      if (reportBtn) {
        event.preventDefault();
        v768DownloadReport(reportBtn.dataset.v768ReportDownload === "crypto" ? "crypto" : "bet");
        return;
      }
      const historyPhotoBtn = event.target.closest && event.target.closest("[data-v921-history-photo]");
      if (historyPhotoBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [dayRaw, slotRaw] = String(historyPhotoBtn.dataset.v921HistoryPhoto || "0:0").split(":");
        window.omega_RollingResultPhoto(event, Number(dayRaw), Number(slotRaw));
        return;
      }
      const activeCardPhotoBtn = event.target.closest && event.target.closest("[data-v922-active-photo]");
      if (activeCardPhotoBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const [dayRaw, slotRaw] = String(activeCardPhotoBtn.dataset.v922ActivePhoto || "0:0").split(":");
        window.omega_RollingSlotPhoto(Number(dayRaw), Number(slotRaw));
        return;
      }
      const accordionToggle = event.target.closest && event.target.closest("[data-v903-accordion-toggle]");
      if (accordionToggle) {
        event.preventDefault();
        event.stopPropagation();
        const card = accordionToggle.closest("[data-v903-accordion-card]");
        if (!card) return;
        const body = card.closest(".v768-feature-body") || card.parentElement;
        const isOpen = card.classList.contains("is-open");
        body?.querySelectorAll("[data-v903-accordion-card].is-open").forEach(openCard => {
          if (openCard === card) return;
          openCard.classList.remove("is-open");
          const detail = openCard.querySelector("[data-v903-accordion-detail]");
          const toggle = openCard.querySelector("[data-v903-accordion-toggle]");
          if (detail) {
            detail.hidden = true;
            detail.innerHTML = "";
          }
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
        if (isOpen) {
          card.classList.remove("is-open");
          const detail = card.querySelector("[data-v903-accordion-detail]");
          if (detail) {
            detail.hidden = true;
            detail.innerHTML = "";
          }
          accordionToggle.setAttribute("aria-expanded", "false");
        } else {
          card.classList.add("is-open");
          const detail = card.querySelector("[data-v903-accordion-detail]");
          const template = card.querySelector("template[data-v905-accordion-template]");
          if (detail) {
            detail.innerHTML = template ? template.innerHTML : detail.innerHTML;
            detail.hidden = false;
          }
          accordionToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }
      if (event.target?.closest && document.getElementById("rolling-excel-overlay")?.contains(event.target)) {
        if (!event.target.closest("[data-v765-kapsul]") && !event.target.closest("[data-v768-feature-open]")) v774FlushAllPendingFromDom();
      }
    }, true);
    document.addEventListener("click", function(event) {
      const dateOpen = event.target.closest && event.target.closest("[data-v929-date-open]");
      if (dateOpen) {
        event.preventDefault();
        event.stopPropagation();
        const mode = dateOpen.dataset.v929DateOpen === "crypto" ? "crypto" : "bet";
        const wrap = dateOpen.closest(`[data-v929-date-wrap="${mode}"]`);
        const panel = wrap?.querySelector(`[data-v929-date-panel="${mode}"]`);
        const willOpen = panel ? panel.hidden : false;
        document.querySelectorAll("[data-v929-date-panel]").forEach(other => {
          if (other !== panel) other.hidden = true;
        });
        if (panel) panel.hidden = !willOpen;
        return;
      }
      const apply = event.target.closest && event.target.closest("[data-v929-date-apply]");
      if (apply) {
        event.preventDefault();
        event.stopPropagation();
        const mode = apply.dataset.v929DateApply === "crypto" ? "crypto" : "bet";
        const wrap = apply.closest(`[data-v929-date-wrap="${mode}"]`);
        const y = Number(wrap?.querySelector(`[data-v929-date-year="${mode}"]`)?.value || 2026);
        const m = Number(wrap?.querySelector(`[data-v929-date-month="${mode}"]`)?.value || 6);
        const d = Number(wrap?.querySelector(`[data-v929-date-day="${mode}"]`)?.value || 1);
        const clampedDate = v928ClampHistoryDate(`${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
        localStorage.setItem(v926HistoryDateStorageKey(mode), clampedDate);
        localStorage.setItem(v926HistoryFilterStorageKey(mode), "manual");
        v768OpenFeaturePanel(mode, "history");
        return;
      }
      const clear = event.target.closest && event.target.closest("[data-v929-date-clear]");
      if (clear) {
        event.preventDefault();
        event.stopPropagation();
        const mode = clear.dataset.v929DateClear === "crypto" ? "crypto" : "bet";
        localStorage.removeItem(v926HistoryDateStorageKey(mode));
        localStorage.setItem(v926HistoryFilterStorageKey(mode), "all");
        v768OpenFeaturePanel(mode, "history");
        return;
      }
      const insideDatePicker = event.target.closest && (event.target.closest("[data-v929-date-panel]") || event.target.closest("[data-v929-date-open]"));
      if (!insideDatePicker) {
        document.querySelectorAll("[data-v929-date-panel]").forEach(panel => { panel.hidden = true; });
      }
    }, true);
    document.addEventListener("pointerdown", function(event) {
      const openPanel = document.querySelector("[data-v929-date-panel]:not([hidden])");
      if (!openPanel) return;
      const insideDatePicker = event.target.closest && (event.target.closest("[data-v929-date-panel]") || event.target.closest("[data-v929-date-open]"));
      if (!insideDatePicker) openPanel.hidden = true;
    }, true);
    document.addEventListener("change", function(event) {
      const yearSelect = event.target && event.target.closest && event.target.closest("[data-v929-date-year]");
      const monthSelect = event.target && event.target.closest && event.target.closest("[data-v929-date-month]");
      if (!yearSelect && !monthSelect) return;
      const mode = (yearSelect?.dataset.v929DateYear || monthSelect?.dataset.v929DateMonth) === "crypto" ? "crypto" : "bet";
      const wrap = (yearSelect || monthSelect).closest(`[data-v929-date-wrap="${mode}"]`);
      if (!wrap) return;
      const today = v929TodayYmdParts();
      const ySel = wrap.querySelector(`[data-v929-date-year="${mode}"]`);
      const mSel = wrap.querySelector(`[data-v929-date-month="${mode}"]`);
      const dSel = wrap.querySelector(`[data-v929-date-day="${mode}"]`);
      let y = Number(ySel?.value || 2026);
      let m = Number(mSel?.value || 6);
      let d = Number(dSel?.value || 1);
      const monthMin = y === 2026 ? 5 : 1;
      const monthMax = y === today.y ? today.m : 12;
      if (m < monthMin) m = monthMin;
      if (m > monthMax) m = monthMax;
      if (mSel) {
        mSel.innerHTML = Array.from({ length: monthMax - monthMin + 1 }, (_, i) => monthMin + i).map(mm => `<option value="${mm}" ${mm === m ? "selected" : ""}>${v929MonthName(mm)}</option>`).join("");
      }
      const dayMin = y === 2026 && m === 5 ? 1 : 1;
      const dayMax = y === today.y && m === today.m ? today.d : v929DaysInMonth(y, m);
      if (d < dayMin) d = dayMin;
      if (d > dayMax) d = dayMax;
      if (dSel) dSel.innerHTML = Array.from({ length: dayMax - dayMin + 1 }, (_, i) => dayMin + i).map(dd => `<option value="${dd}" ${dd === d ? "selected" : ""}>${String(dd).padStart(2, "0")}</option>`).join("");
    }, true);
    document.addEventListener("input", function(event) {
      const kapsul = event.target && event.target.closest && event.target.closest("[data-v765-kapsul]");
      if (!kapsul) return;
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      v768UpdateBetCalc(day, slot);
      v774SavePendingSlot(day, slot);
    }, true);
    document.addEventListener("focusout", function(event) {
      const kapsul = event.target && event.target.closest && event.target.closest("[data-v765-kapsul]");
      if (!kapsul) return;
      const [day, slot] = String(kapsul.dataset.v765Kapsul || "0:0").split(":").map(Number);
      v774SavePendingSlot(day, slot);
    }, true);
  }

  function v765BindExcelFeatureControls(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-v770-excel-open]").forEach(btn => {
      if (btn.dataset.v770Bound === "1") return;
      btn.dataset.v770Bound = "1";
      btn.addEventListener("pointerdown", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
      }, { passive: false });
      btn.addEventListener("click", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v770ExcelOpen || "bet:active").split(":");
        window.omega_ExcelRollingOpenMainPanel(event, modeRaw, kindRaw);
      });
    });
    scope.querySelectorAll("[data-v768-feature-open]").forEach(btn => {
      if (btn.dataset.v768Bound === "1") return;
      btn.dataset.v768Bound = "1";
      btn.addEventListener("click", event => {
        const [modeRaw, kindRaw] = String(btn.dataset.v768FeatureOpen || "bet:active").split(":");
        window.omega_RollingExcelOpenFeature(event, modeRaw, kindRaw);
      });
    });
    v768BindBetCalc(scope);
    scope.querySelectorAll("[data-v768-calc]").forEach(box => {
      const [day, slot] = String(box.dataset.v768Calc || "0:0").split(":").map(Number);
      v768UpdateBetCalc(day, slot);
    });
  }

  window.omega_RenderExcelTable = function() {
    const wrapper = qs("#excel-body-content");
    if (!wrapper) return;
    const currentPlan = ensureRollingPlan();
    const rollModeV491 = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    const isCryptoV491 = rollModeV491 === "crypto";
    const overlayV493 = qs("#rolling-excel-overlay");
    if (overlayV493) overlayV493.setAttribute("data-roll-mode", rollModeV491);
    let runningBalance = Number(currentPlan.startBal || 100);
    let totalProfit = 0;
    let htmlBuffer = "";

    for (let day = 1; day <= _ACTIVE_EXCEL_DAYS; day++) {
      v780EnsureDaySlots(currentPlan, day);
      const dayOps = currentPlan.ops[day];
      const dayStart = runningBalance;
      let dayProfit = 0;

      const cards = [];
      for (let slot = 0; slot < dayOps.length; slot++) {
        const op = dayOps[slot];
        if (op) {
          const amt = v926OpStake(op);
          const baseOdds = v926OpBaseOdds(op);
          const comboRows = Array.isArray(op.combo) ? op.combo : [];
          const totalOdds = v926OpTotalOdds(op, isCryptoV491);
          const effect = v926OpEffect(op, isCryptoV491);
          const pnl = Math.abs(effect);
          runningBalance += effect; totalProfit += effect; dayProfit += effect;
          if (!isCryptoV491) {
            cards.push(v847RenderBetResultCard(day, slot, op, amt, baseOdds, comboRows, totalOdds, effect));
          } else {
            cards.push(v927RenderCryptoResultCard(day, slot, op, amt, effect));
          }
        } else {
          const pendingV774 = !isCryptoV491 ? v774GetPendingSlot(day, slot) : null;
          const pNoteV774 = v763EscapeHtml(pendingV774?.note || "");
          const pOddsV774 = pendingV774?.odds === "" || pendingV774?.odds == null ? "" : v763EscapeHtml(pendingV774.odds);
          const pStakeV774 = pendingV774?.amt === "" || pendingV774?.amt == null ? "" : v763EscapeHtml(pendingV774.amt);
          const pComboV774 = Array.isArray(pendingV774?.combo) ? pendingV774.combo : [];
          const pComboHtmlV774 = pComboV774.map(row => `<div class="v765-extra-match-row v768-extra-match-row" data-v763-extra-row="${day}:${slot}"><input type="text" data-v763-extra-note placeholder="Maç" value="${v763EscapeHtml(row.note || "")}"><input type="number" data-v763-extra-odds placeholder="Oran" step="0.01" value="${row.odds === "" || row.odds == null ? "" : v763EscapeHtml(row.odds)}"></div>`).join("");
          cards.push(`
            <div class="kapsul v32 ${isCryptoV491 ? "v928-crypto-kapsul" : "v765-bet-kapsul"}" data-v765-kapsul="${day}:${slot}">
              ${isCryptoV491 ? `
                <button type="button" class="v928-crypto-empty-head" data-v928-crypto-toggle="${day}:${slot}" aria-expanded="false"><span>Gün ${day} · İşlem ${slot + 1}</span><b>İşlem ekle</b></button>
                <div class="v927-crypto-entry">
                  <div class="v927-crypto-main-grid">
                    <div class="v932-crypto-entry-line"><div class="v932-crypto-tp-controls"><button type="button" onclick="return omega_CryptoToggleTpRow(${day}, ${slot}, 'plus')" title="TP ekle">+</button><button type="button" onclick="return omega_CryptoToggleTpRow(${day}, ${slot}, 'minus')" title="Son TP sil">−</button></div><input type="text" id="e-n-${day}-${slot}" placeholder="İşlem"></div>
                    <select data-v927-crypto-side="${day}:${slot}" aria-label="İşlem tipi">
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </div>
                  <div class="v927-crypto-field-grid">
                    <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar" step="0.01">
                    <input type="number" id="e-o-${day}-${slot}" placeholder="P/L $" step="0.01">
                    <input type="text" data-v927-crypto-entry="${day}:${slot}" placeholder="Giriş">
                    <input type="text" data-v927-crypto-leverage="${day}:${slot}" placeholder="Kaldıraç">
                    <input type="text" data-v927-crypto-liq="${day}:${slot}" placeholder="Likidasyon">
                    <input type="text" data-v927-crypto-stop="${day}:${slot}" placeholder="Stop">
                    <div class="v932-crypto-tp-list" data-v932-crypto-tp-list="${day}:${slot}"><input type="text" data-v927-crypto-tp="${day}:${slot}" data-v927-tp-index="1" placeholder="TP1"></div>
                  </div>
                </div>
              ` : `
                <div class="v765-bet-entry">
                  <div class="v765-match-line">
                    <div class="v777-slot-tools">
                      <div class="v765-inline-combo-controls">
                        <button type="button" data-v768-combo="${day}:${slot}:plus" onclick="return omega_RollingToggleComboRow(${day}, ${slot}, 'plus')" title="Maç + oran ekle">+</button>
                        <button type="button" data-v768-combo="${day}:${slot}:minus" onclick="return omega_RollingToggleComboRow(${day}, ${slot}, 'minus')" title="Son ek maçı sil">−</button>
                      </div>
                      <button type="button" class="v778-slot-clear" onclick="return omega_RollingClearSlot(${day}, ${slot})" title="Kutuyu boşalt">×</button>
                      <button type="button" class="v776-slot-camera" onclick="return omega_RollingSlotPhoto(${day}, ${slot})" title="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button>
                    </div>
                    <input type="text" id="e-n-${day}-${slot}" placeholder="Maç" value="${pNoteV774}">
                  </div>
                  <input type="number" id="e-o-${day}-${slot}" placeholder="Oran" step="0.01" value="${pOddsV774}">
                  <div class="v765-extra-match-list">${pComboHtmlV774}</div>
                  <input type="number" id="e-a-${day}-${slot}" placeholder="Tutar" step="0.01" value="${pStakeV774}">
                  <div class="v768-bet-calc" data-v768-calc="${day}:${slot}"><span>Toplam Oran: <b>-</b></span><span>Tahmini Kazanç: <b>-</b></span></div>
                  <div class="v847-bet-leg-result-panel" data-v847-leg-panel="${day}:${slot}"></div>
                </div>
              `}
              <div class="k-actions v32" data-v847-main-actions="${day}:${slot}">
                <button class="w" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'win')">${isCryptoV491 ? "KÂR" : "KAZANDI"}</button>
                <button class="l" onclick="omega_ResolveExcelOp(${day}, ${slot}, 'loss')">${isCryptoV491 ? "ZARAR" : "KAYBETTİ"}</button>
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
            <span>${isCryptoV491 ? "Gün P/L" : "Gün K/Z"}: ${(dayProfit >= 0 ? "+" : "")}$${dayProfit.toFixed(2)}</span>
            <div class="day-tools-v32">
              <button class="gold" onclick="omega_RollingAddSlot(${day})">+ İŞLEM</button>
              <button onclick="omega_RollingRemoveSlot(${day})">- SİL</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 10)">10</button>
              <button onclick="omega_RollingSetDaySlots(${day}, 20)">20</button>
              <button onclick="omega_RollingClearDay(${day})">TEMİZLE</button>
            </div>
            ${day === 1 ? v763DayToolButtons(rollModeV491) : ""}
          </div>
          <div class="capsule-container v32">${cards.join("")}</div>
          <div class="day-result v32"><small>Gün Sonu</small>$${runningBalance.toFixed(2)}</div>
        </div>
      `;
    }

    wrapper.innerHTML = htmlBuffer;
    v765BindExcelFeatureControls(wrapper);

    const current = qs("#excel-current-bal");
    if (current) current.innerText = `$${runningBalance.toFixed(2)}`;

    const pnlElement = qs("#excel-pnl");
    if (pnlElement) {
      pnlElement.innerText = (totalProfit >= 0 ? "+" : "") + "$" + totalProfit.toFixed(2);
      pnlElement.style.color = totalProfit >= 0 ? "var(--green)" : "var(--red)";
      const pnlLabel = pnlElement.closest(".config-item")?.querySelector("label");
      if (pnlLabel) pnlLabel.textContent = isCryptoV491 ? "P/L:" : "K/Z:";
    }

    const targetBal = Number(currentPlan.targetBal || ROLLING_TARGETS[_ACTIVE_EXCEL_DAYS] || 0);
    const progressPercentage = targetBal > 0 ? Math.max(0, Math.min((runningBalance / targetBal) * 100, 100)) : 0;
    const progressBar = qs("#excel-progress-bar");
    if (progressBar) progressBar.style.width = progressPercentage + "%";

    omega_SaveRollingDB();
  };

  window.omega_SetBetLegResult = function(event, day, slot, index, status) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    return v847SetBetLegResult(Number(day), Number(slot), Number(index), status === "loss" ? "loss" : "win");
  };

  window.omega_CloseExcelOp = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const currentPlan = ensureRollingPlan();
    if (currentPlan.ops?.[day]) currentPlan.ops[day][slot] = null;
    if (currentPlan.pending?.[day]) currentPlan.pending[day][slot] = null;
    omega_SaveRollingDB();
    omega_RenderExcelTable();
    return false;
  };

  window.omega_ReturnExcelOp = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const currentPlan = ensureRollingPlan();
    const op = currentPlan.ops?.[day]?.[slot];
    if (!op) return false;
    const combo = Array.isArray(op.combo)
      ? op.combo.map(row => ({ note: String(row?.note || "").trim(), odds: row?.odds === "" || row?.odds == null ? "" : Number(row.odds || 0) }))
      : [];
    const comboResults = Array.isArray(op.comboResults)
      ? op.comboResults.map(v => v === "loss" ? "loss" : v === "win" ? "win" : "").slice(0, combo.length + 1)
      : [];
    const pendingEntry = v774NormalizePendingEntry({
      note: op.note || "",
      amt: op.amt === "" || op.amt == null ? "" : Number(op.amt || 0),
      odds: op.odds === "" || op.odds == null ? "" : Number(op.odds || 0),
      combo,
      comboResults,
      status: "pending",
      createdAt: Number(op.createdAt || op.playedAt || Date.now()),
      updatedAt: Date.now()
    });
    if (!currentPlan.pending) currentPlan.pending = {};
    if (pendingEntry && pendingEntry.note) {
      if (!currentPlan.pending[day]) currentPlan.pending[day] = {};
      currentPlan.pending[day][slot] = pendingEntry;
    }
    if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
    currentPlan.ops[day][slot] = null;
    omega_SaveRollingDB();
    omega_RenderExcelTable();
    return false;
  };

  window.omega_RollingResultPhoto = function(event, day, slot) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    if (event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const uri = v776BuildSlotPhotoSvg(day, slot);
    if (!uri) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast("Sonuç fotoğrafı hazırlanamadı.");
      else alert("Sonuç fotoğrafı hazırlanamadı.");
      return false;
    }
    const host = v923GetRollingPhotoHost();
    host.innerHTML = `<div class="v776-photo-overlay v850-result-photo-overlay" data-v776-photo-close>
      <section class="v776-photo-modal v850-result-photo-modal">
        <div class="v776-photo-head v850-result-photo-head">
          <div><b>${_ACTIVE_EXCEL_DAYS} GÜNLÜK ROLLING</b><span>GÜN ${day} · BAHİS ${slot + 1}</span></div>
          <button type="button" data-v776-photo-close>×</button>
        </div>
        <div class="v776-photo-actions v850-result-photo-actions">
          <button type="button" data-v777-photo-download><i class="fa-solid fa-download"></i> Resmi İndir</button>
        </div>
        <img src="${uri}" alt="${_ACTIVE_EXCEL_DAYS} Günlük Rolling bahis sonucu">
      </section>
    </div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v776-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v776-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v777-photo-download]")?.addEventListener("click", () => {
      v777DownloadPhotoPng(uri, `${_ACTIVE_EXCEL_DAYS}-gunluk-rolling-gun-${day}-bahis-${slot + 1}.png`);
    });
    return false;
  };

  window.omega_ResolveExcelOp = function(day, slot, result, meta = {}) {
    const note = (document.getElementById(`e-n-${day}-${slot}`)?.value || "").trim();
    const isCrypto = localStorage.getItem("finance_rolling_mode") === "crypto";
    const stakeInput = document.getElementById(`e-a-${day}-${slot}`);
    const oddsInput = document.getElementById(`e-o-${day}-${slot}`);
    const stakeRaw = String(stakeInput?.value || "").trim();
    const oddsRaw = String(oddsInput?.value || "").trim();
    const amt = parseFloat(stakeRaw);
    const odds = parseFloat(oddsRaw);
    const comboRows = isCrypto ? [] : v763ComboRows(day, slot);
    const cryptoMeta = isCrypto ? v927CryptoMetaFromDom(day, slot) : null;
    const pendingBeforeResolve = !isCrypto ? v774GetPendingSlot(day, slot) : null;
    const hasComboGap = comboRows.some(row => !row.note || !Number(row.odds || 0));
    if (!stakeRaw || isNaN(amt)) {
      v898WarnStakeInput(stakeInput);
      return;
    }
    if (!oddsRaw || isNaN(odds) || (!isCrypto && hasComboGap)) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast(isCrypto ? "P/L $ alanını doldur." : "Maç, oran ve ek maç oranlarını doldur.");
      return;
    }
    if (!note) {
      if (typeof omega_ShowFinanceToast === "function") omega_ShowFinanceToast(isCrypto ? "İşlem adını yaz." : "Maç adını yaz.");
      return;
    }
    const currentPlan = ensureRollingPlan();
    if (!currentPlan.ops[day]) currentPlan.ops[day] = [];
    const comboResults = !isCrypto
      ? (Array.isArray(meta.comboResults) ? meta.comboResults : Array.isArray(pendingBeforeResolve?.comboResults) ? pendingBeforeResolve.comboResults : [])
          .map(v => v === "loss" ? "loss" : v === "win" ? "win" : "")
          .slice(0, comboRows.length + 1)
      : [];
    const opCreatedAt = Number(pendingBeforeResolve?.createdAt || pendingBeforeResolve?.updatedAt || Date.now());
    currentPlan.ops[day][slot] = { note, amt, odds, combo: comboRows, comboResults, res: result, netMode: isCrypto ? "amount" : "odds", cryptoMeta, createdAt: opCreatedAt, settledAt: Date.now() };
    if (currentPlan.pending?.[day]) {
      delete currentPlan.pending[day][slot];
      if (Object.keys(currentPlan.pending[day]).length === 0) delete currentPlan.pending[day];
    }
    omega_SaveRollingDB();
    omega_RenderExcelTable();
  };

  const oldOpenRolling = window.omega_OpenRollingExcel;
  window.omega_OpenRollingExcel = function(days, skipHash = false) {
    const result = typeof oldOpenRolling === "function" ? oldOpenRolling(days, skipHash) : undefined;
    document.documentElement.classList.remove("rolling-hash-boot");
    document.body.classList.add("rolling-active");
    if(!skipHash) {
      const baseHash = (document.getElementById("omega-rolling-block") && getComputedStyle(document.getElementById("omega-rolling-block")).display !== "none") ? "rolling" : "finance";
      history.replaceState(null, "", `#${baseHash}/rolling/${days}`);
    }
    return result;
  };

  const oldCloseRollingV778 = window.omega_CloseRollingExcel;
  window.omega_CloseRollingExcel = function(force = false) {
    const hash = String(location.hash || "");
    const closeTarget = hash.startsWith("#rolling/rolling/") ? "#rolling" : hash.startsWith("#finance/rolling/") ? "#finance" : "";
    const overlay = document.getElementById("rolling-excel-overlay");
    if (overlay) {
      overlay.classList.remove("show-modal");
      setTimeout(() => { overlay.style.display = "none"; }, 220);
    }
    document.body.classList.remove("rolling-active");
    document.documentElement.classList.remove("rolling-hash-boot");
    if (closeTarget) history.replaceState(null, "", closeTarget);
    else if (typeof oldCloseRollingV778 === "function") oldCloseRollingV778(force);
  };

  
  document.addEventListener("click", function(e) {
    const disabled = e.target.closest(".crypto-v28-tab-disabled");
    if(disabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);


  // V779: Kamera ikonunda CSS/katman çakışması olursa işlev yine çalışsın.
  document.addEventListener("click", function(event) {
    const btn = event.target && event.target.closest ? event.target.closest(".v776-slot-camera") : null;
    if (!btn || !btn.closest("#rolling-excel-overlay")) return;
    const kapsul = btn.closest("[data-v765-kapsul]");
    if (!kapsul) return;
    const parts = String(kapsul.dataset.v765Kapsul || "").split(":");
    const day = Number(parts[0] || 1);
    const slot = Number(parts[1] || 0);
    if (!Number.isFinite(day) || !Number.isFinite(slot)) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof window.omega_RollingSlotPhoto === "function") window.omega_RollingSlotPhoto(day, slot);
  }, true);

  function reviveRollingFromHashV39() {
    const m = String(location.hash || "").match(/^#(?:finance|rolling)\/rolling\/(\d+)/);
    if (!m) return;
    const days = Number(m[1]);
    if ([7,15,30,60,90].includes(days) && typeof window.omega_OpenRollingExcel === "function") {
      setTimeout(() => window.omega_OpenRollingExcel(days, true), 60);
    }
  }

  
  function omega_RemoveOldRollingLaunchCardV46A2() {
    document.querySelectorAll(".finance-rolling-launch-card, .finance-rolling-selector, .finance-rolling-options").forEach(el => {
      const card = el.closest(".finance-card") || el;
      if (card && card.parentNode) card.remove();
    });
  }

function boot() {
    omega_RemoveOldRollingLaunchCardV46A2();
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
