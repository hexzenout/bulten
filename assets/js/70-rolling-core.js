// ===============================
// V48 ROLLING MAIN MODULE
// Bahis Rolling + Kombine Kupon Maçları / Kripto Rolling + Aktif Kripto İşlemleri
// ===============================

(function () {
  const STORAGE_KEY = "v26_finance_clean_state_v1"; // V972: legacy ortak kayıt; sadece migration/fallback için okunur.
  const STORAGE_KEY_BET = "v972_rolling_bet_state_v1";
  const STORAGE_KEY_CRYPTO = "v972_rolling_crypto_state_v1";
  const STORAGE_KEY_UI = "v972_rolling_ui_state_v1";
  const ROLLING_KEY = "v19_rolling";
  const PAGE_MODE_KEY = "v48_rolling_page_mode";
  const RAIL_KEY = "v48_rolling_rail_collapsed";
  const HISTORY_KEY = "v512_rolling_history_v1"; // legacy ortak history; yeni kayıtlar mode bazlı tutulur.
  const HISTORY_KEY_BET = "v972_rolling_history_bet_v1";
  const HISTORY_KEY_CRYPTO = "v972_rolling_history_crypto_v1";
  const TARGET_LOG_KEY = "v755_rolling_target_log_v1"; // legacy ortak hedef logu.
  const TARGET_LOG_KEY_BET = "v972_rolling_target_log_bet_v1";
  const TARGET_LOG_KEY_CRYPTO = "v972_rolling_target_log_crypto_v1";
  const SNAPSHOT_KEY = "v756_rolling_report_cards_v1"; // legacy ortak rapor kartları.
  const SNAPSHOT_KEY_BET = "v972_rolling_report_cards_bet_v1";
  const SNAPSHOT_KEY_CRYPTO = "v972_rolling_report_cards_crypto_v1";
  const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const TARGET_CARD_OPEN_KEY = "v798_rolling_target_card_open";
  const TARGET_LOG_OPEN_KEY = "v802_rolling_target_log_open";
  const TARGET_ITEMS_KEY = "v810_rolling_target_items_v1"; // legacy ortak aktif hedef listesi.
  const TARGET_ITEMS_KEY_BET = "v972_rolling_target_items_bet_v1";
  const TARGET_ITEMS_KEY_CRYPTO = "v972_rolling_target_items_crypto_v1";
  const TARGET_CLOSED_PNL_KEY = "v829_rolling_target_closed_pnl_v1"; // legacy ortak kapalı P/L.
  const TARGET_CLOSED_PNL_KEY_BET = "v972_rolling_target_closed_pnl_bet_v1";
  const TARGET_CLOSED_PNL_KEY_CRYPTO = "v972_rolling_target_closed_pnl_crypto_v1";
  const GROWTH_PLAN_KEY = "v1040_rolling_growth_plan_v1";
  const GROWTH_PANEL_OPEN_KEY = "v1041_rolling_growth_panel_open_v1";
  const GROWTH_PANEL_VIEW_KEY = "v1053_rolling_growth_panel_view_v1";
  const ROLLING_RESTORE_KEY = "v1046_restore_rolling_excel_v1";
  const DAILY_LEDGER_EDIT_KEY = "v1057_rolling_daily_ledger_edits_v1";
  const LEDGER_TEST_MODE_KEY = "v1103_rolling_daily_ledger_test_mode_v1";
  const LEDGER_TEST_PAGE_KEY = "v1111_rolling_daily_ledger_test_page_v1";
  let HISTORY_OPEN_MODE = null;
  let LOG_CENTER_OPEN_MODE = null;
  let REPORT_CENTER_OPEN_MODE = null;
  let PENDING_BOARD_OPEN_MODE = null;
  let TARGET_HISTORY_OPEN_MODE = null;
  let HISTORY_FILTER = "today";
  let CONFIRM_DIALOG = null;
  let CONFIRM_RETURN_PANEL_MODE = null;
  let ACTIVE_COMBO_DETAIL_SLOT = null;
  let LEDGER_LAST_DELETE = null;
  let LEDGER_CLOCK_TIMER = null;
  const LEDGER_SCREEN_SESSION_KEY = "bulten-ledger-screen-open";
  let LEDGER_SCREEN_RESTORE_DONE = false;

  function v1102InstallDailyLedgerOpenGuard() {
    if (window.__omegaV1102DailyLedgerOpenGuard) return;
    window.__omegaV1102DailyLedgerOpenGuard = true;
    const handled = (event, btn) => {
      if (!btn) return;
      const mode = btn.dataset.v1056LedgerOpen === "crypto" ? "crypto" : "bet";
      const now = Date.now();
      const key = `daily-ledger:${mode}`;
      if (window.__omegaV1102DailyLedgerLastKey === key && now - Number(window.__omegaV1102DailyLedgerLastTs || 0) < 420) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        return;
      }
      window.__omegaV1102DailyLedgerLastKey = key;
      window.__omegaV1102DailyLedgerLastTs = now;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      v1056OpenDailyLedgerScreen(mode);
    };
    const findButton = event => event.target && event.target.closest ? event.target.closest("[data-v1056-ledger-open]") : null;
    document.addEventListener("pointerdown", event => {
      const btn = findButton(event);
      if (!btn) return;
      handled(event, btn);
    }, true);
    document.addEventListener("click", event => {
      const btn = findButton(event);
      if (!btn) return;
      handled(event, btn);
    }, true);
    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const btn = findButton(event);
      if (!btn) return;
      handled(event, btn);
    }, true);
  }
  v1102InstallDailyLedgerOpenGuard();

  function v1103LedgerTestModeEnabled() {
    let enabled = false;
    try {
      const href = String(window.location?.href || "");
      if (/(?:[?&#]|^)ledgerTest=1(?:&|#|$)/.test(href)) localStorage.setItem(LEDGER_TEST_MODE_KEY, "1");
      if (/(?:[?&#]|^)ledgerTest=0(?:&|#|$)/.test(href)) localStorage.removeItem(LEDGER_TEST_MODE_KEY);
      enabled = localStorage.getItem(LEDGER_TEST_MODE_KEY) === "1";
    } catch {}
    return enabled;
  }
  function v1103IsLedgerTestRow(row) {
    const id = String(row?.id || "");
    return !!row?.testOnly || row?.source === "test" || id.startsWith("test_") || id.startsWith("ledger_test_");
  }
  function v1103EnsureLedgerTestStyles() {
    let style = document.getElementById("v1103-ledger-test-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "v1103-ledger-test-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-title-row,
      .v1112-ledger-title-row{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;flex:1 1 auto!important;overflow:hidden!important;position:relative!important;z-index:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-title-row > b,
      .v1112-ledger-title-row > b{white-space:nowrap!important;flex:0 0 auto!important;position:relative!important;z-index:2!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar,
      .v1103-ledger-test-toolbar{display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:nowrap!important;margin:0 0 0 6px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#e5e7eb!important;font-size:10px!important;font-weight:850!important;line-height:1!important;flex:1 1 auto!important;min-width:0!important;max-width:min(980px, calc(100vw - 560px))!important;height:25px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;white-space:nowrap!important;position:relative!important;z-index:3!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar::-webkit-scrollbar,
      .v1103-ledger-test-toolbar::-webkit-scrollbar{display:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-title-row > .v1103-ledger-test-toolbar,
      .v1112-ledger-title-row > .v1103-ledger-test-toolbar{align-self:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar strong,
      .v1103-ledger-test-toolbar strong{color:#fbbf24!important;font-size:10px!important;font-weight:950!important;margin:0 3px 0 0!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto!important;letter-spacing:.01em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar button,
      .v1103-ledger-test-toolbar button{appearance:none!important;-webkit-appearance:none!important;box-sizing:border-box!important;height:22px!important;min-height:22px!important;max-height:22px!important;min-width:auto!important;width:auto!important;border-radius:7px!important;border:1px solid rgba(148,163,184,.38)!important;background:#111827!important;color:#f8fafc!important;font-size:9.8px!important;font-weight:900!important;padding:0 6px!important;margin:0!important;cursor:pointer!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-transform:none!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;transform:none!important;opacity:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar button:hover,
      .v1103-ledger-test-toolbar button:hover{border-color:rgba(251,191,36,.62)!important;background:#1f2937!important;color:#fff!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar button.danger,
      .v1103-ledger-test-toolbar button.danger{border-color:rgba(248,113,113,.42)!important;background:#3f1118!important;color:#fecaca!important;font-size:9.8px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1103-ledger-test-toolbar span,
      .v1103-ledger-test-toolbar span{display:none!important;}
      .v1110-ledger-header-pager{position:static!important;transform:none!important;display:grid!important;grid-auto-flow:column!important;align-items:center!important;gap:5px!important;height:26px!important;margin:0 0 0 8px!important;padding:0 7px!important;border:1px solid rgba(251,191,36,.45)!important;border-radius:10px!important;background:rgba(15,23,42,.96)!important;color:#e5e7eb!important;font-size:11px!important;font-weight:900!important;white-space:nowrap!important;box-shadow:none!important;filter:none!important;opacity:1!important;flex:0 0 auto!important;}
      .v1110-ledger-header-pager button{height:19px!important;min-width:19px!important;border-radius:6px!important;border:1px solid rgba(148,163,184,.38)!important;background:#111827!important;color:#f8fafc!important;font-size:13px!important;font-weight:950!important;padding:0 5px!important;cursor:pointer!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      .v1110-ledger-header-pager button:disabled{opacity:.35!important;cursor:not-allowed!important;}
      .v1110-ledger-header-pager b{color:#fbbf24!important;font-size:11px!important;font-weight:950!important;line-height:1!important;letter-spacing:.01em!important;}
      .v1110-ledger-header-pager span{display:none!important;}
      .v1110-ledger-pager{display:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal{width:min(1760px, calc(100vw - 12px))!important;max-width:calc(100vw - 12px)!important;height:calc(100vh - 34px)!important;max-height:calc(100vh - 34px)!important;margin:17px auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="1"]{width:min(780px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="2"]{width:min(1480px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"]{width:min(1760px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1065-ledger-screen-head{min-height:40px!important;height:40px!important;padding-top:0!important;padding-bottom:0!important;flex:0 0 40px!important;display:flex!important;align-items:center!important;gap:8px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1063-ledger-head-actions{flex:0 0 auto!important;position:relative!important;z-index:5!important;margin-left:auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-screen-body{flex:1 1 auto!important;min-height:0!important;max-height:none!important;height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 6px 0!important;display:flex!important;flex-direction:column!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger{height:auto!important;min-height:100%!important;overflow:visible!important;display:flex!important;flex-direction:column!important;margin:0!important;padding:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-sheet-grid{display:grid!important;grid-template-columns:repeat(var(--v1110-ledger-cols,1), minmax(0,1fr))!important;gap:8px!important;align-items:start!important;overflow:visible!important;width:100%!important;height:auto!important;min-height:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-sheet{width:auto!important;max-width:none!important;min-width:0!important;flex:0 0 auto!important;overflow:visible!important;height:auto!important;display:flex!important;flex-direction:column!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-summary-inline{height:40px!important;min-height:40px!important;max-height:40px!important;margin:0!important;flex:0 0 40px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border:1px solid #0f172a!important;border-bottom:0!important;border-radius:8px 8px 0 0!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-summary-inline > div{min-height:40px!important;height:40px!important;padding:2px 6px!important;border-right:1px solid #0f172a!important;color:#07120b!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank > div:nth-child(1){background:#9fd27c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank > div:nth-child(2){background:#82bd5f!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank > div:nth-child(3){background:#63a64a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary span{font-size:10px!important;line-height:1.02!important;font-weight:950!important;color:#0f172a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary b{font-size:14px!important;line-height:1.0!important;font-weight:1000!important;color:#04110a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank span,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank b{visibility:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-summary-spacer,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-summary-spacer{display:grid!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;flex:1 1 auto!important;height:auto!important;min-height:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table thead,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table thead{height:21px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table th{height:21px!important;min-height:21px!important;font-size:10px!important;line-height:1!important;padding:0 2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table td{height:var(--v1110-row-h,32px)!important;min-height:var(--v1110-row-h,32px)!important;max-height:var(--v1110-row-h,32px)!important;font-size:11px!important;line-height:1!important;padding:0 2px!important;overflow:hidden!important;vertical-align:middle!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table tr{height:var(--v1110-row-h,32px)!important;max-height:var(--v1110-row-h,32px)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table td:nth-child(3){vertical-align:middle!important;padding:0 2px!important 0 4px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(1){width:5.8%!important;min-width:30px!important;font-size:10.5px!important;padding-left:1px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(2){width:17.2%!important;white-space:nowrap!important;font-size:10.5px!important;padding-left:1px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(3){width:35.2%!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(4){width:12.2%!important;white-space:nowrap!important;font-size:9.6px!important;padding-left:1px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(5){width:11.1%!important;white-space:nowrap!important;font-size:10px!important;padding-left:1px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(6){width:5.8%!important;white-space:nowrap!important;padding-left:1px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(7){width:12.7%!important;white-space:nowrap!important;font-size:10px!important;padding-left:1px!important;padding-right:1px!important;}
      /* V1177: Kripto işlem defteri 25'li test düzeni + coin/diğer hücre renkleri */
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(1),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(2),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(5),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(6),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(1),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(2),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(5),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(6),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(1),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(2),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(5),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(6),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(1),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(2),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(5),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(6){background:#dbeafe!important;color:#071827!important;}
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3){background:linear-gradient(180deg,#172554 0%,#0f172a 100%)!important;color:#e0f2fe!important;}
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3) .v1063-ledger-value,
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3) .v1063-ledger-value,
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3) .v1063-ledger-value,
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3) .v1063-ledger-value{color:#f0f9ff!important;text-shadow:0 1px 0 rgba(0,0,0,.35)!important;}
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4),
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4),
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4){overflow:visible!important;}
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4) .v1063-ledger-value,
      #v1056-ledger-screen-host .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4) .v1063-ledger-value,
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(4) .v1063-ledger-value,
      .v1162-ledger-output-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(4) .v1063-ledger-value{line-height:1.22!important;padding-bottom:2px!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1063-ledger-value{height:auto!important;min-height:0!important;font-size:11px!important;line-height:1.04!important;padding:0 2px!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1063-ledger-value.v1069-ledger-item-lines{height:100%!important;min-height:0!important;padding:0!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:0!important;background:transparent!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1063-ledger-value.v1069-ledger-item-lines.v1110-ledger-item-single{justify-content:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line{display:inline-flex!important;align-items:flex-start!important;column-gap:2px!important;min-height:0!important;width:auto!important;max-width:100%!important;margin:0!important;padding:0!important;line-height:1!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-item-multi .v1069-ledger-match-line{align-items:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-status-mark{width:11px!important;min-width:11px!important;height:11px!important;font-size:12px!important;line-height:11px!important;margin:0!important;text-align:center!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-family:Arial,Helvetica,sans-serif!important;font-weight:1000!important;transform:translateY(0)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1078-ledger-match-text{display:inline-block!important;min-width:0!important;max-width:100%!important;font-size:10px!important;line-height:1!important;font-weight:900!important;white-space:normal!important;overflow:visible!important;overflow-wrap:normal!important;word-break:normal!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-name{display:inline!important;font-size:10px!important;line-height:1.03!important;opacity:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1076-ledger-match-odd{display:inline!important;margin-left:2px!important;font-size:10px!important;line-height:1.03!important;opacity:1!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-soft-break{display:block!important;content:""!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-item-single .v1078-ledger-match-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-item-single .v1069-ledger-match-name,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-item-single .v1076-ledger-match-odd{font-size:10.5px!important;line-height:1.04!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1078-ledger-match-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1069-ledger-match-name,
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1076-ledger-match-odd{font-size:9px!important;line-height:0.98!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1069-ledger-status-mark{width:10px!important;min-width:10px!important;font-size:11px!important;line-height:10px!important;height:10px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.win .v1069-ledger-status-mark{color:#10d977!important;transform:translateY(-0.2px)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.loss .v1069-ledger-status-mark{color:#ef4444!important;transform:translateY(-0.2px)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.open .v1069-ledger-status-mark{color:#475569!important;font-size:0!important;line-height:11px!important;transform:translateY(0)!important;}

      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-pnl-cell .v1063-ledger-value{color:#fff!important;font-weight:1000!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-single,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-single td{height:23px!important;min-height:23px!important;max-height:23px!important;padding-top:0!important;padding-bottom:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-combo,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-combo td{height:32px!important;min-height:32px!important;max-height:32px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-longcombo,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-longcombo td{height:37px!important;min-height:37px!important;max-height:37px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1063-ledger-value{padding-top:0!important;padding-bottom:0!important;line-height:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1063-ledger-value.v1069-ledger-item-lines{justify-content:center!important;gap:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1063-ledger-value.v1069-ledger-item-lines{justify-content:center!important;gap:3px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1063-ledger-value.v1069-ledger-item-lines{justify-content:center!important;gap:3px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1069-ledger-match-line + .v1069-ledger-match-line,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1069-ledger-match-line + .v1069-ledger-match-line{margin-top:3px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line{align-items:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1069-ledger-match-line,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1069-ledger-match-line{align-items:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-status-mark{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 10px!important;width:10px!important;min-width:10px!important;height:11px!important;margin:0!important;text-align:center!important;font-family:Arial,Helvetica,sans-serif!important;font-weight:1000!important;line-height:11px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.win .v1069-ledger-status-mark{color:#10b981!important;font-size:11px!important;transform:none!important;background:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.loss .v1069-ledger-status-mark{color:#dc2626!important;font-size:11px!important;transform:none!important;background:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.open .v1069-ledger-status-mark{position:relative!important;color:transparent!important;font-size:0!important;line-height:1!important;transform:none!important;background:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-match-line.open .v1069-ledger-status-mark::before{content:""!important;display:block!important;width:8.5px!important;height:2.4px!important;border-radius:999px!important;background:#64748b!important;position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1069-ledger-status-mark.v1123-ledger-status-empty::before{display:none!important;content:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1119-ledger-dash{display:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1078-ledger-match-text{line-height:1.02!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1078-ledger-match-text{line-height:1.0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table td:nth-child(3){padding-left:3px!important;padding-right:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1119-ledger-row-filler,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1119-ledger-row-filler td{height:var(--v1119-filler-h,0px)!important;min-height:var(--v1119-filler-h,0px)!important;max-height:var(--v1119-filler-h,0px)!important;padding:0!important;line-height:0!important;color:transparent!important;background:#eef2f7!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1119-ledger-row-filler td:nth-child(3){background:#0f172a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(1){width:5.8%!important;min-width:30px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1054-daily-ledger.bet .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal[data-v1110-ledger-cols="3"] .v1054-daily-ledger.bet .v1057-ledger-excel-table td:nth-child(6){width:5.8%!important;}

      /* V1133: sadece tekli satır ikon hizası - tablo/test/kombine mantığına dokunmaz */
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line{display:inline-flex!important;align-items:center!important;column-gap:3px!important;line-height:1!important;min-height:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-status-mark{position:relative!important;top:-0.4px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 11px!important;width:11px!important;min-width:11px!important;height:12px!important;line-height:12px!important;margin:0!important;font-family:Arial,Helvetica,sans-serif!important;font-size:11px!important;font-weight:1000!important;text-align:center!important;transform:none!important;background:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.win .v1069-ledger-status-mark{color:#10b981!important;transform:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.loss .v1069-ledger-status-mark{color:#dc2626!important;transform:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.open .v1069-ledger-status-mark{color:transparent!important;font-size:0!important;line-height:12px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-line.open .v1069-ledger-status-mark::before{content:""!important;display:block!important;width:8px!important;height:2px!important;border-radius:999px!important;background:#64748b!important;position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;}
      
      /* V1134: test ledger tabloyu zorla esnetme; tekli satır gerçek yüksekliğinde kalsın. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-sheet-grid{align-items:start!important;height:auto!important;min-height:0!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-sheet{height:auto!important;min-height:0!important;flex:0 0 auto!important;align-self:start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-excel-table{height:auto!important;min-height:0!important;flex:0 0 auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-single,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-excel-table tr.v1118-ledger-row-single td{height:21px!important;min-height:21px!important;max-height:21px!important;padding-top:0!important;padding-bottom:0!important;line-height:1!important;vertical-align:middle!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1060-ledger-cell-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1063-ledger-value{height:21px!important;min-height:21px!important;max-height:21px!important;padding-top:0!important;padding-bottom:0!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1063-ledger-value.v1069-ledger-item-lines{height:21px!important;min-height:21px!important;max-height:21px!important;justify-content:center!important;align-items:flex-start!important;gap:0!important;padding:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1078-ledger-match-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1069-ledger-match-name,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-single .v1076-ledger-match-odd{line-height:1!important;}

      /* V1136: kombineyi yukarı/aşağı taşımadan kendi satırında ortala; alta yapışmayı engelle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1063-ledger-value.v1069-ledger-item-lines,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1063-ledger-value.v1069-ledger-item-lines{transform:none!important;justify-content:center!important;padding-top:1px!important;padding-bottom:1px!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1069-ledger-match-line + .v1069-ledger-match-line,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1069-ledger-match-line + .v1069-ledger-match-line{margin-top:1px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1078-ledger-match-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1078-ledger-match-text{line-height:1.03!important;}

      /* V1137: test bar başlıkta kalsın, tablo alanı gerçek ekrana yakın dolsun; kombine içerik transform'suz ortalansın. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-title-row{height:40px!important;min-height:40px!important;align-items:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1112-ledger-title-row > b{font-size:16.5px!important;line-height:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1063-ledger-value.v1069-ledger-item-lines,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1063-ledger-value.v1069-ledger-item-lines{height:100%!important;min-height:0!important;max-height:100%!important;padding:2px 0!important;gap:1px!important;justify-content:center!important;align-items:flex-start!important;transform:none!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1069-ledger-match-line,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1069-ledger-match-line{line-height:1.04!important;align-items:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-combo .v1069-ledger-match-line + .v1069-ledger-match-line,
      #v1056-ledger-screen-host .v1110-ledger-test-modal tr.v1118-ledger-row-longcombo .v1069-ledger-match-line + .v1069-ledger-match-line{margin-top:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-sheet-grid{align-content:start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank{opacity:1!important;}
      .v1095-ledger-photo-modal,
      .v1098-ledger-photo-modal{max-width:calc(100vw - 28px)!important;max-height:calc(100vh - 28px)!important;overflow:hidden!important;}
      .v1098-ledger-photo-clone-stage{max-width:calc(100vw - 42px)!important;max-height:calc(100vh - 96px)!important;overflow:auto!important;background:#020617!important;border-radius:12px!important;}
      .v1098-ledger-photo-clone-stage img.v1143-ledger-photo-img{display:block!important;max-width:none!important;width:auto!important;height:auto!important;min-width:100%!important;background:#020617!important;cursor:context-menu!important;}
      .v1160-ledger-inline-photo-modal{width:auto!important;max-width:calc(100vw - 28px)!important;max-height:calc(100vh - 28px)!important;}
      .v1160-ledger-inline-photo-stage{max-width:calc(100vw - 42px)!important;max-height:calc(100vh - 76px)!important;overflow:auto!important;padding:0!important;margin:0!important;background:#020617!important;}
      .v1160-ledger-inline-export{background:#0b1220!important;border-radius:14px!important;box-shadow:none!important;margin:0!important;width:max-content!important;max-width:none!important;}
      .v1160-ledger-inline-export .v1056-ledger-screen-body,.v1160-ledger-inline-export .v1057-ledger-screen-body{overflow:visible!important;max-height:none!important;height:auto!important;min-height:0!important;padding-bottom:0!important;margin-bottom:0!important;}
      .v1161-ledger-capture-modal{width:auto!important;max-width:calc(100vw - 24px)!important;max-height:calc(100vh - 24px)!important;overflow:hidden!important;}
      .v1161-ledger-capture-stage{max-width:calc(100vw - 40px)!important;max-height:calc(100vh - 92px)!important;overflow:auto!important;background:#020617!important;border-radius:12px!important;}
      .v1161-ledger-capture-stage img{display:block!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;background:#020617!important;}
      .v1161-ledger-capture-help{color:#94a3b8!important;font-size:11px!important;font-weight:800!important;padding:0 8px!important;white-space:nowrap!important;}
      .v1162-ledger-output-shell{width:auto!important;max-width:calc(100vw - 24px)!important;max-height:calc(100vh - 24px)!important;overflow:hidden!important;border-radius:16px!important;background:#020617!important;}
      .v1162-ledger-output-toolbar{display:flex!important;align-items:center!important;gap:8px!important;padding:8px 10px!important;background:#020617!important;border-bottom:1px solid rgba(148,163,184,.18)!important;}
      .v1162-ledger-output-toolbar button{appearance:none!important;-webkit-appearance:none!important;border-radius:10px!important;border:1px solid rgba(251,191,36,.55)!important;background:#111827!important;color:#fde68a!important;font-size:12px!important;font-weight:950!important;line-height:1!important;padding:8px 11px!important;cursor:pointer!important;white-space:nowrap!important;}
      .v1162-ledger-output-toolbar button:hover{background:#1f2937!important;color:#fff!important;}
      .v1162-ledger-output-toolbar .v1162-output-close{margin-left:auto!important;border-color:rgba(148,163,184,.32)!important;color:#e5e7eb!important;min-width:34px!important;padding-left:0!important;padding-right:0!important;font-size:18px!important;}
      .v1162-ledger-output-note{color:#94a3b8!important;font-size:11px!important;font-weight:800!important;white-space:nowrap!important;}
      .v1162-ledger-output-stage{max-width:calc(100vw - 40px)!important;max-height:calc(100vh - 86px)!important;overflow:auto!important;padding:0!important;margin:0!important;background:#020617!important;}
      .v1162-ledger-output-modal{position:relative!important;display:block!important;width:max-content!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#020617!important;box-shadow:none!important;transform:none!important;overflow:visible!important;}
      .v1162-ledger-output-modal .v1056-ledger-screen-body,.v1162-ledger-output-modal .v1057-ledger-screen-body{display:block!important;width:max-content!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;margin:0!important;padding:0!important;background:#020617!important;}
      .v1162-ledger-output-modal .v1040-growth-plan{margin:0!important;border-radius:0!important;box-shadow:none!important;}
      .v1162-ledger-output-modal .v1057-ledger-sheet-grid,.v1162-ledger-output-modal .v1061-ledger-sheet-grid{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;align-items:start!important;align-content:start!important;margin-bottom:0!important;padding-bottom:0!important;}
      .v1162-ledger-output-modal .v1057-ledger-sheet,.v1162-ledger-output-modal .v1061-ledger-sheet{height:auto!important;min-height:0!important;max-height:none!important;align-self:start!important;margin-bottom:0!important;}
      .v1162-ledger-output-modal .v1057-ledger-excel-table,.v1162-ledger-output-modal .v1061-ledger-excel-table{height:auto!important;min-height:0!important;max-height:none!important;margin-bottom:0!important;}
      .v1162-ledger-output-modal .v1119-ledger-row-filler,.v1162-ledger-output-modal .v1119-ledger-row-filler td{height:0!important;min-height:0!important;max-height:0!important;padding:0!important;border:0!important;line-height:0!important;overflow:hidden!important;}
      .v1162-ledger-context-menu{position:fixed!important;z-index:2147483647!important;display:none!important;min-width:178px!important;padding:6px!important;border:1px solid rgba(251,191,36,.38)!important;border-radius:12px!important;background:#020617!important;box-shadow:0 18px 48px rgba(0,0,0,.48)!important;}
      .v1162-ledger-context-menu button{display:block!important;width:100%!important;border:0!important;background:transparent!important;color:#e5e7eb!important;text-align:left!important;border-radius:8px!important;padding:9px 10px!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;}
      .v1162-ledger-context-menu button:hover{background:rgba(251,191,36,.12)!important;color:#fde68a!important;}
      /* V1170: pending/open/push çizgisi artık pseudo değil, gerçek '-' karakteridir. */
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark{color:#64748b!important;font-size:11px!important;line-height:11px!important;font-family:Arial,Helvetica,sans-serif!important;font-weight:1000!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;position:static!important;width:11px!important;min-width:11px!important;height:11px!important;flex:0 0 11px!important;background:none!important;transform:none!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::before{content:none!important;display:none!important;}
      /* V1171: gerçek minus işareti eski gizleme kurallarını kesin ezer; kalın ve aynı hizada kalır. */
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark{color:#64748b!important;font-size:12px!important;line-height:11px!important;font-family:Arial,Helvetica,sans-serif!important;font-weight:1000!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;position:static!important;top:auto!important;width:11px!important;min-width:11px!important;height:11px!important;flex:0 0 11px!important;background:none!important;transform:none!important;visibility:visible!important;opacity:1!important;overflow:visible!important;white-space:nowrap!important;text-align:center!important;margin:0!important;padding:0!important;}
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::before,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::before,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::after,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::after,
      #v1056-ledger-screen-host .v1056-ledger-screen-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::after,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::after,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::after,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::after,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.pending .v1069-ledger-status-mark::after,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.push .v1069-ledger-status-mark::after,
      .v1162-ledger-output-modal.bet .v1054-daily-ledger.bet .v1069-ledger-match-line.open .v1069-ledger-status-mark::after{content:none!important;display:none!important;}
      /* V1172: Dash ekranda kesin görünsün diye glyph içi ayrıca zorlanır. */
      #v1056-ledger-screen-host .v1069-ledger-status-mark .v1172-ledger-dash-glyph,
      .v1162-ledger-output-modal .v1069-ledger-status-mark .v1172-ledger-dash-glyph{display:inline-block!important;color:#94a3b8!important;font-family:Arial,Helvetica,sans-serif!important;font-size:15px!important;font-weight:1000!important;line-height:8px!important;width:9px!important;min-width:9px!important;height:8px!important;text-align:center!important;vertical-align:middle!important;visibility:visible!important;opacity:1!important;overflow:visible!important;transform:translateY(-1px) scaleX(1.45)!important;transform-origin:center!important;text-shadow:0 0 0 #94a3b8!important;background:none!important;}

      /* V1180: Kripto işlem defteri 35'li sisteme geçsin; yazılar okunaklı ve hizalı kalsın. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-summary-inline{height:34px!important;min-height:34px!important;max-height:34px!important;flex:0 0 34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-summary-inline > div{height:34px!important;min-height:34px!important;max-height:34px!important;padding:2px 6px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1059-ledger-summary span,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1060-ledger-summary-inline span,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-summary-inline span{font-size:9.5px!important;line-height:1.05!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1059-ledger-summary b,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1060-ledger-summary-inline b,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-summary-inline b{font-size:14px!important;line-height:1.04!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1057-ledger-excel-table thead,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-excel-table thead{height:18px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-excel-table th{height:18px!important;min-height:18px!important;max-height:18px!important;font-size:9.6px!important;line-height:1.08!important;padding:0 2px!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1057-ledger-excel-table tr,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-excel-table tr,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{height:21.5px!important;min-height:21.5px!important;max-height:21.5px!important;padding:0 2px!important;line-height:1.12!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1060-ledger-cell-text,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto .v1063-ledger-value{height:21.5px!important;min-height:21.5px!important;max-height:21.5px!important;padding:0 2px!important;font-size:10.9px!important;line-height:1.16!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:11px!important;font-weight:950!important;letter-spacing:.005em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto td:nth-child(4) .v1063-ledger-value{overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1054-daily-ledger.crypto td:nth-child(4) .v1063-ledger-value{line-height:1.24!important;padding-bottom:2px!important;font-size:10.8px!important;}
      /* V1181: Kripto 35'li tabloda alt boşluğu kapat + Coin kolonunu yaklaşık %40 daralt. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(520px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(1010px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1500px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{align-items:center!important;overflow-x:hidden!important;padding-left:6px!important;padding-right:6px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:100%!important;align-self:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), 468px)!important;width:max-content!important;max-width:100%!important;justify-content:center!important;gap:8px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table{width:468px!important;min-width:468px!important;max-width:468px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:32px!important;min-width:32px!important;max-width:32px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:74px!important;min-width:74px!important;max-width:74px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:108px!important;min-width:108px!important;max-width:108px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:48px!important;min-width:48px!important;max-width:48px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:80px!important;min-width:80px!important;max-width:80px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:10.7px!important;letter-spacing:0!important;}
      /* V1182: Kripto test butonları dar pencerede kaybolmasın; TEST MODU açılır panel olsun. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{overflow:visible!important;position:relative!important;z-index:60!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1112-ledger-title-row{overflow:visible!important;flex:0 1 auto!important;gap:6px!important;z-index:70!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1112-ledger-title-row > b{font-size:16px!important;line-height:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar{flex:0 0 auto!important;width:auto!important;max-width:none!important;height:26px!important;min-height:26px!important;margin:0 0 0 4px!important;padding:0!important;overflow:visible!important;position:relative!important;z-index:80!important;display:inline-flex!important;align-items:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar .v1182-crypto-test-toggle{height:24px!important;min-height:24px!important;max-height:24px!important;padding:0 8px!important;border-radius:8px!important;border:1px solid rgba(251,191,36,.48)!important;background:#111827!important;color:#fbbf24!important;font-size:10px!important;font-weight:1000!important;letter-spacing:.01em!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar .v1182-crypto-test-panel{display:none!important;position:absolute!important;top:29px!important;left:0!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;width:260px!important;max-width:calc(100vw - 24px)!important;padding:8px!important;border:1px solid rgba(251,191,36,.45)!important;border-radius:12px!important;background:rgba(15,23,42,.98)!important;box-shadow:0 14px 34px rgba(0,0,0,.38)!important;z-index:120!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar:hover .v1182-crypto-test-panel,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar:focus-within .v1182-crypto-test-panel{display:grid!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1182-crypto-test-panel strong{display:block!important;grid-column:1/-1!important;margin:0 0 2px!important;color:#fbbf24!important;font-size:10.5px!important;font-weight:1000!important;line-height:1!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1182-crypto-test-panel button{width:100%!important;height:26px!important;min-height:26px!important;max-height:26px!important;padding:0 7px!important;border-radius:8px!important;font-size:10px!important;justify-content:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions{z-index:65!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(500px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-screen-body{padding-left:4px!important;padding-right:4px!important;}
      /* V1183: Kripto tek tabloyu daralt; başlık yazısını kaldır; Coin kolonunu kısalt ve kar-zarar taşmasını engelle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1112-ledger-title-row > b{display:none!important;visibility:hidden!important;width:0!important;min-width:0!important;max-width:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1112-ledger-title-row{flex:0 0 auto!important;min-width:0!important;width:auto!important;gap:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1103-ledger-test-toolbar.v1182-crypto-test-toolbar{margin-left:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(462px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(902px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1342px, calc(100vw - 4px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{align-items:center!important;padding-left:3px!important;padding-right:3px!important;overflow-x:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:100%!important;align-self:center!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), 440px)!important;width:max-content!important;max-width:100%!important;justify-content:center!important;gap:8px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table{width:440px!important;min-width:440px!important;max-width:440px!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:32px!important;min-width:32px!important;max-width:32px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:74px!important;min-width:74px!important;max-width:74px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:78px!important;min-width:78px!important;max-width:78px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:48px!important;min-width:48px!important;max-width:48px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:82px!important;min-width:82px!important;max-width:82px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}

      /* V1184: Kripto tek tabloyu sola yasla; V1183 fazla dar Coin sorununu toparla; kapat butonunu Güncel Kasa kutusu üzerine al. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{position:relative!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(540px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(1010px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1480px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{align-items:flex-start!important;padding-left:0!important;padding-right:0!important;overflow-x:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{align-self:flex-start!important;margin-left:0!important;width:max-content!important;min-width:0!important;max-width:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), 460px)!important;width:max-content!important;max-width:none!important;justify-content:start!important;gap:8px!important;margin-left:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table{width:460px!important;min-width:460px!important;max-width:460px!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:32px!important;min-width:32px!important;max-width:32px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:74px!important;min-width:74px!important;max-width:74px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:96px!important;min-width:96px!important;max-width:96px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:48px!important;min-width:48px!important;max-width:48px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:84px!important;min-width:84px!important;max-width:84px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.95px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;letter-spacing:0!important;}
      /* V1187: Kripto tek tabloda sağ boşluğu sıfıra yaklaştır; Coin alanından ROI alanına pay aktar. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(509px, calc(100vw - 10px))!important;min-width:min(509px, calc(100vw - 10px))!important;max-width:min(509px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1065-ledger-screen-head{width:492px!important;min-width:492px!important;max-width:492px!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;margin-left:0!important;margin-right:0!important;align-self:flex-start!important;justify-content:space-between!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-screen-body{width:509px!important;min-width:509px!important;max-width:509px!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto{margin-left:0!important;margin-right:0!important;align-self:flex-start!important;width:max-content!important;max-width:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1061-ledger-sheet-grid{grid-template-columns:492px!important;width:492px!important;min-width:492px!important;max-width:492px!important;margin-left:0!important;margin-right:0!important;justify-content:start!important;gap:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1061-ledger-excel-table{width:492px!important;min-width:492px!important;max-width:492px!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:32px!important;min-width:32px!important;max-width:32px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:76px!important;min-width:76px!important;max-width:76px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:96px!important;min-width:96px!important;max-width:96px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:60px!important;min-width:60px!important;max-width:60px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{white-space:nowrap!important;overflow:visible!important;font-size:10.7px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:96px!important;min-width:96px!important;max-width:96px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.95px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;letter-spacing:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1063-ledger-head-actions{position:static!important;margin-left:auto!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex:0 0 auto!important;z-index:240!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1063-ledger-head-actions > *{position:static!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;margin:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1063-ledger-head-actions > button[data-v1056-ledger-close]{position:static!important;top:auto!important;left:auto!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;margin:0!important;z-index:240!important;}
      /* V1189: Kripto 35'li layout net kilit; Coin ETHEREUM LONG, ROI 1000%+ ve Kar-zarar/özet aynı bitiş. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(607px, calc(100vw - 10px))!important;min-width:min(607px, calc(100vw - 10px))!important;max-width:min(607px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(1205px, calc(100vw - 10px))!important;min-width:min(1205px, calc(100vw - 10px))!important;max-width:min(1205px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1803px, calc(100vw - 10px))!important;min-width:min(1803px, calc(100vw - 10px))!important;max-width:min(1803px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;margin-left:0!important;margin-right:0!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1065-ledger-screen-head{width:590px!important;min-width:590px!important;max-width:590px!important;align-self:flex-start!important;justify-content:space-between!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1065-ledger-screen-head{width:1188px!important;min-width:1188px!important;max-width:1188px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1065-ledger-screen-head{width:1786px!important;min-width:1786px!important;max-width:1786px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"] .v1057-ledger-screen-body{width:607px!important;min-width:607px!important;max-width:607px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"] .v1057-ledger-screen-body{width:1205px!important;min-width:1205px!important;max-width:1205px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"] .v1057-ledger-screen-body{width:1803px!important;min-width:1803px!important;max-width:1803px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{margin-left:0!important;margin-right:0!important;align-self:flex-start!important;width:max-content!important;min-width:0!important;max-width:none!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), 590px)!important;width:max-content!important;min-width:0!important;max-width:none!important;justify-content:start!important;align-items:start!important;gap:8px!important;margin-left:0!important;margin-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-excel-table{width:590px!important;min-width:590px!important;max-width:590px!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline{border-right:1px solid #0f172a!important;background:transparent!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1059-ledger-summary > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-summary-inline > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-summary-inline > div:last-child{border-right:0!important;background:#63a64a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:82px!important;min-width:82px!important;max-width:82px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:150px!important;min-width:150px!important;max-width:150px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:72px!important;min-width:72px!important;max-width:72px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:112px!important;min-width:112px!important;max-width:112px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.01em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;font-size:10.55px!important;letter-spacing:-.02em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;font-size:10.75px!important;}

      /* V1190: Kripto tek/çoklu tablo genişliğini aynı sheet profiline kilitle; 35/70/105 aynı görünsün. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{--v1190-crypto-sheet:570px;--v1190-crypto-gap:8px;--v1190-crypto-scroll:17px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(587px, calc(100vw - 10px))!important;min-width:min(587px, calc(100vw - 10px))!important;max-width:min(587px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(1165px, calc(100vw - 10px))!important;min-width:min(1165px, calc(100vw - 10px))!important;max-width:min(1165px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1743px, calc(100vw - 10px))!important;min-width:min(1743px, calc(100vw - 10px))!important;max-width:min(1743px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;margin-left:0!important;margin-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:none!important;margin-left:0!important;margin-right:0!important;align-self:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1190-crypto-sheet))!important;width:max-content!important;min-width:0!important;max-width:none!important;justify-content:start!important;align-items:start!important;gap:var(--v1190-crypto-gap)!important;margin-left:0!important;margin-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{width:var(--v1190-crypto-sheet)!important;min-width:var(--v1190-crypto-sheet)!important;max-width:var(--v1190-crypto-sheet)!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:0!important;overflow:hidden!important;border-right:0!important;background:transparent!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{width:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;border-right:1px solid #0f172a!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(1){background:#9ccc7c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(2){background:#7fbd5d!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){background:#63a64a!important;border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:80px!important;min-width:80px!important;max-width:80px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:142px!important;min-width:142px!important;max-width:142px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:70px!important;min-width:70px!important;max-width:70px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:104px!important;min-width:104px!important;max-width:104px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.01em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.02em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1191: Kripto 35/70/105 ortak sheet kilidi; header X/kamera görünür, Coin/Kar-zarar hafif kısa. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{--v1191-crypto-sheet:548px;--v1191-crypto-gap:8px;--v1191-crypto-scroll:17px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{width:min(565px, calc(100vw - 10px))!important;min-width:min(565px, calc(100vw - 10px))!important;max-width:min(565px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{width:min(1121px, calc(100vw - 10px))!important;min-width:min(1121px, calc(100vw - 10px))!important;max-width:min(1121px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{width:min(1677px, calc(100vw - 10px))!important;min-width:min(1677px, calc(100vw - 10px))!important;max-width:min(1677px, calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:6px!important;margin-left:0!important;margin-right:0!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions{position:static!important;margin-left:auto!important;margin-right:0!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex:0 0 auto!important;z-index:240!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > *{position:static!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;margin:0!important;flex:0 0 auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > button[data-v1056-ledger-close]{position:static!important;top:auto!important;left:auto!important;right:auto!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;margin:0!important;z-index:240!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:none!important;margin-left:0!important;margin-right:0!important;align-self:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1191-crypto-sheet))!important;width:max-content!important;min-width:0!important;max-width:none!important;justify-content:start!important;align-items:start!important;gap:var(--v1191-crypto-gap)!important;margin-left:0!important;margin-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{width:var(--v1191-crypto-sheet)!important;min-width:var(--v1191-crypto-sheet)!important;max-width:var(--v1191-crypto-sheet)!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:0!important;overflow:hidden!important;border-right:0!important;background:transparent!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{width:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;border-right:1px solid #0f172a!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(1){background:#9ccc7c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(2){background:#7fbd5d!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){background:#63a64a!important;border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:80px!important;min-width:80px!important;max-width:80px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:132px!important;min-width:132px!important;max-width:132px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:70px!important;min-width:70px!important;max-width:70px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:92px!important;min-width:92px!important;max-width:92px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.012em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.02em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1192: Bahis + kripto üst kasa kutularındaki sol/sağ köşe izini temizle; layout genişliğine dokunma. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank{border-radius:0!important;outline:0!important;box-shadow:none!important;clip-path:inset(0)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1061-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal .v1110-ledger-summary-blank > div{border-radius:0!important;outline:0!important;box-shadow:none!important;}


      /* V1193: Bahis üst yeşil kasa kutusu ile Kar-zarar sağ bitiş çizgisini eşitle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1110-ledger-summary-blank{width:100%!important;max-width:100%!important;box-sizing:border-box!important;border-left:1px solid #0f172a!important;border-right:1px solid #0f172a!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1059-ledger-summary > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1060-ledger-summary-inline > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1061-ledger-summary-inline > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1110-ledger-summary-blank > div:last-child{border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1057-ledger-excel-table{width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;border-spacing:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1057-ledger-excel-table th:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.bet .v1054-daily-ledger.bet .v1057-ledger-excel-table td:last-child{border-right:1px solid #0f172a!important;}


      /* V1194: Kripto header/takım sheet final kilidi; bahis tarafına dokunma. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1194-crypto-sheet:532px;
        --v1194-crypto-gap:8px;
        --v1194-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1194-crypto-content:532px;--v1194-crypto-modal:549px;width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1194-crypto-content:1072px;--v1194-crypto-modal:1089px;width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1194-crypto-content:1612px;--v1194-crypto-modal:1629px;width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1194-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:var(--v1194-crypto-scroll)!important;margin:0!important;overflow:visible!important;display:flex!important;align-items:center!important;justify-content:space-between!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions{position:static!important;margin-left:auto!important;margin-right:0!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex:0 0 auto!important;z-index:260!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > *{position:static!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;margin:0!important;flex:0 0 auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > button[data-v1056-ledger-close]{position:static!important;top:auto!important;right:auto!important;left:auto!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;margin:0!important;z-index:260!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:none!important;margin:0!important;align-self:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1194-crypto-sheet))!important;width:max-content!important;min-width:0!important;max-width:none!important;justify-content:start!important;align-items:start!important;gap:var(--v1194-crypto-gap)!important;margin:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{width:var(--v1194-crypto-sheet)!important;min-width:var(--v1194-crypto-sheet)!important;max-width:var(--v1194-crypto-sheet)!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:0!important;border-left:1px solid #0f172a!important;border-right:1px solid #0f172a!important;border-bottom:0!important;background:transparent!important;overflow:hidden!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{width:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;border-right:1px solid #0f172a!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(1){background:#9ccc7c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(2){background:#7fbd5d!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){background:#63a64a!important;border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;border-right:1px solid #0f172a!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:80px!important;min-width:80px!important;max-width:80px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:128px!important;min-width:128px!important;max-width:128px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:70px!important;min-width:70px!important;max-width:70px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:80px!important;min-width:80px!important;max-width:80px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.012em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.02em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1195: Kriptoyu bahis mantığına yaklaştır - header sağ grup yeşil/table sağ çizgisine, sheet tek referans. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1195-crypto-sheet:512px;
        --v1195-crypto-gap:8px;
        --v1195-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1195-crypto-content:512px;--v1195-crypto-modal:529px;width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1195-crypto-content:1032px;--v1195-crypto-modal:1049px;width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1195-crypto-content:1552px;--v1195-crypto-modal:1569px;width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;min-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;max-width:min(var(--v1195-crypto-modal), calc(100vw - 10px))!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1065-ledger-screen-head{width:var(--v1195-crypto-content)!important;min-width:var(--v1195-crypto-content)!important;max-width:var(--v1195-crypto-content)!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;margin:0!important;overflow:visible!important;display:flex!important;align-items:center!important;justify-content:space-between!important;align-self:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions{position:static!important;margin-left:auto!important;margin-right:0!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex:0 0 auto!important;z-index:280!important;overflow:visible!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > *{position:static!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;margin:0!important;flex:0 0 auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1063-ledger-head-actions > button[data-v1056-ledger-close]{position:static!important;top:auto!important;right:auto!important;left:auto!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;margin:0!important;z-index:280!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-screen-body{width:var(--v1195-crypto-modal)!important;min-width:var(--v1195-crypto-modal)!important;max-width:var(--v1195-crypto-modal)!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important;align-items:flex-start!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1054-daily-ledger.crypto{width:max-content!important;min-width:0!important;max-width:none!important;margin:0!important;align-self:flex-start!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1195-crypto-sheet))!important;width:var(--v1195-crypto-content)!important;min-width:var(--v1195-crypto-content)!important;max-width:var(--v1195-crypto-content)!important;justify-content:start!important;align-items:start!important;gap:var(--v1195-crypto-gap)!important;margin:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{width:var(--v1195-crypto-sheet)!important;min-width:var(--v1195-crypto-sheet)!important;max-width:var(--v1195-crypto-sheet)!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:0!important;border-left:1px solid #0f172a!important;border-right:1px solid #0f172a!important;border-bottom:0!important;background:transparent!important;overflow:hidden!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{width:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;border-right:1px solid #0f172a!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(1){background:#9ccc7c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(2){background:#7fbd5d!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){background:#63a64a!important;border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table{table-layout:fixed!important;border-collapse:collapse!important;border-right:1px solid #0f172a!important;box-sizing:border-box!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(2){width:78px!important;min-width:78px!important;max-width:78px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(3){width:124px!important;min-width:124px!important;max-width:124px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table td:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table td:nth-child(7){width:68px!important;min-width:68px!important;max-width:68px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.012em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;letter-spacing:-.02em!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}



      /* V1196: Kripto header aksiyonlarını modal sağına değil tablo/yeşil kutu sağ çizgisine kilitle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1196-crypto-sheet:512px;
        --v1196-crypto-gap:8px;
        --v1196-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1196-crypto-content:512px;--v1196-crypto-modal:529px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1196-crypto-content:1032px;--v1196-crypto-modal:1049px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1196-crypto-content:1552px;--v1196-crypto-modal:1569px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(var(--v1196-crypto-modal), calc(100vw - 10px))!important;
        min-width:min(var(--v1196-crypto-modal), calc(100vw - 10px))!important;
        max-width:min(var(--v1196-crypto-modal), calc(100vw - 10px))!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head{
        width:var(--v1196-crypto-content)!important;
        min-width:var(--v1196-crypto-content)!important;
        max-width:var(--v1196-crypto-content)!important;
        box-sizing:border-box!important;
        padding-left:0!important;
        padding-right:0!important;
        margin-left:0!important;
        margin-right:0!important;
        align-self:flex-start!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions{
        position:static!important;
        margin-left:auto!important;
        margin-right:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        flex:0 0 auto!important;
        z-index:320!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > *{
        position:static!important;
        top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;
        margin:0!important;
        flex:0 0 auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button[data-v1056-ledger-close]{
        position:static!important;
        width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;
        margin:0!important;
        z-index:320!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:var(--v1196-crypto-modal)!important;
        min-width:var(--v1196-crypto-modal)!important;
        max-width:var(--v1196-crypto-modal)!important;
        box-sizing:border-box!important;
        padding-left:0!important;
        padding-right:0!important;
        align-items:flex-start!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        scrollbar-gutter:stable!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1196-crypto-sheet))!important;
        width:var(--v1196-crypto-content)!important;
        min-width:var(--v1196-crypto-content)!important;
        max-width:var(--v1196-crypto-content)!important;
        gap:var(--v1196-crypto-gap)!important;
        justify-content:start!important;
        margin:0!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1196-crypto-sheet)!important;
        min-width:var(--v1196-crypto-sheet)!important;
        max-width:var(--v1196-crypto-sheet)!important;
        box-sizing:border-box!important;
      }

      /* V1197: Kriptoyu bahis tarafındaki header/sheet mantığına kilitle; yeşil kutu ve Kar-zarar sağ çizgisini eşitle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1197-crypto-sheet:500px;
        --v1197-crypto-gap:8px;
        --v1197-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1197-crypto-content:500px;--v1197-crypto-modal:517px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1197-crypto-content:1008px;--v1197-crypto-modal:1025px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1197-crypto-content:1516px;--v1197-crypto-modal:1533px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(var(--v1197-crypto-modal), calc(100vw - 10px))!important;
        min-width:min(var(--v1197-crypto-modal), calc(100vw - 10px))!important;
        max-width:min(var(--v1197-crypto-modal), calc(100vw - 10px))!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head{
        width:var(--v1197-crypto-content)!important;
        min-width:var(--v1197-crypto-content)!important;
        max-width:var(--v1197-crypto-content)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-self:flex-start!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions{
        position:static!important;
        margin-left:auto!important;
        margin-right:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        flex:0 0 auto!important;
        overflow:visible!important;
        z-index:340!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > *{
        position:static!important;
        inset:auto!important;
        margin:0!important;
        flex:0 0 auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button{
        position:static!important;
        margin:0!important;
        flex:0 0 auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button[data-v1056-ledger-close]{
        width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:var(--v1197-crypto-modal)!important;
        min-width:var(--v1197-crypto-modal)!important;
        max-width:var(--v1197-crypto-modal)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-items:flex-start!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        scrollbar-gutter:stable!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto{
        width:var(--v1197-crypto-content)!important;
        min-width:var(--v1197-crypto-content)!important;
        max-width:var(--v1197-crypto-content)!important;
        align-self:flex-start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1197-crypto-sheet))!important;
        width:var(--v1197-crypto-content)!important;
        min-width:var(--v1197-crypto-content)!important;
        max-width:var(--v1197-crypto-content)!important;
        gap:var(--v1197-crypto-gap)!important;
        justify-content:start!important;
        align-items:start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1197-crypto-sheet)!important;
        min-width:var(--v1197-crypto-sheet)!important;
        max-width:var(--v1197-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{
        display:grid!important;
        grid-template-columns:repeat(3,1fr)!important;
        gap:0!important;
        border-left:1px solid #0f172a!important;
        border-right:1px solid #0f172a!important;
        border-bottom:0!important;
        background:transparent!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:last-child{border-right:0!important;background:#63a64a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        table-layout:fixed!important;
        border-collapse:collapse!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(2){width:78px!important;min-width:78px!important;max-width:78px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:116px!important;min-width:116px!important;max-width:116px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(4){width:58px!important;min-width:58px!important;max-width:58px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(5){width:68px!important;min-width:68px!important;max-width:68px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6){width:82px!important;min-width:82px!important;max-width:82px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7){width:64px!important;min-width:64px!important;max-width:64px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.65px!important;letter-spacing:-.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;letter-spacing:-.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.65px!important;letter-spacing:-.01em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1198: Kripto yeşil summary ile Kar-zarar bitişini kilitle; Coin'den pay alıp Kar-zarar'ı 6-7 hane için genişlet. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1198-crypto-sheet:500px;
        --v1198-crypto-gap:8px;
        --v1198-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1198-crypto-content:500px;--v1198-crypto-modal:517px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1198-crypto-content:1008px;--v1198-crypto-modal:1025px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1198-crypto-content:1516px;--v1198-crypto-modal:1533px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(var(--v1198-crypto-modal), calc(100vw - 10px))!important;
        min-width:min(var(--v1198-crypto-modal), calc(100vw - 10px))!important;
        max-width:min(var(--v1198-crypto-modal), calc(100vw - 10px))!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head{
        width:var(--v1198-crypto-content)!important;
        min-width:var(--v1198-crypto-content)!important;
        max-width:var(--v1198-crypto-content)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-self:flex-start!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions{
        position:static!important;
        margin-left:auto!important;
        margin-right:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        flex:0 0 auto!important;
        overflow:visible!important;
        z-index:360!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > *{
        position:static!important;
        inset:auto!important;
        margin:0!important;
        flex:0 0 auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button{position:static!important;margin:0!important;flex:0 0 auto!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button[data-v1056-ledger-close]{width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:var(--v1198-crypto-modal)!important;
        min-width:var(--v1198-crypto-modal)!important;
        max-width:var(--v1198-crypto-modal)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-items:flex-start!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        scrollbar-gutter:stable!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto{
        width:var(--v1198-crypto-content)!important;
        min-width:var(--v1198-crypto-content)!important;
        max-width:var(--v1198-crypto-content)!important;
        align-self:flex-start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1198-crypto-sheet))!important;
        width:var(--v1198-crypto-content)!important;
        min-width:var(--v1198-crypto-content)!important;
        max-width:var(--v1198-crypto-content)!important;
        gap:var(--v1198-crypto-gap)!important;
        justify-content:start!important;
        align-items:start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1198-crypto-sheet)!important;
        min-width:var(--v1198-crypto-sheet)!important;
        max-width:var(--v1198-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{
        display:grid!important;
        grid-template-columns:repeat(3,1fr)!important;
        gap:0!important;
        border-left:1px solid #0f172a!important;
        border-right:1px solid #0f172a!important;
        border-bottom:0!important;
        background:transparent!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:last-child,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:last-child{border-right:0!important;background:#63a64a!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        table-layout:fixed!important;
        border-collapse:collapse!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(2){width:78px!important;min-width:78px!important;max-width:78px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:94px!important;min-width:94px!important;max-width:94px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(4){width:56px!important;min-width:56px!important;max-width:56px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(5){width:64px!important;min-width:64px!important;max-width:64px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6){width:80px!important;min-width:80px!important;max-width:80px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7){width:94px!important;min-width:94px!important;max-width:94px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.35px!important;letter-spacing:-.045em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;letter-spacing:-.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.65px!important;letter-spacing:-.018em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1199: Kripto modalı kolon kısmadan büyüt; yeşil summary ile Kar-zarar bitişini tek genişlik referansına kilitle. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1199-crypto-sheet:560px;
        --v1199-crypto-gap:8px;
        --v1199-crypto-scroll:17px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1199-crypto-content:560px;--v1199-crypto-modal:577px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1199-crypto-content:1128px;--v1199-crypto-modal:1145px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1199-crypto-content:1696px;--v1199-crypto-modal:1713px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(var(--v1199-crypto-modal), calc(100vw - 10px))!important;
        min-width:min(var(--v1199-crypto-modal), calc(100vw - 10px))!important;
        max-width:min(var(--v1199-crypto-modal), calc(100vw - 10px))!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head{
        width:var(--v1199-crypto-content)!important;
        min-width:var(--v1199-crypto-content)!important;
        max-width:var(--v1199-crypto-content)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-self:flex-start!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions{
        position:static!important;
        margin-left:auto!important;
        margin-right:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        flex:0 0 auto!important;
        overflow:visible!important;
        z-index:380!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > *,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > *{
        position:static!important;
        inset:auto!important;
        margin:0!important;
        flex:0 0 auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-head-actions > button[data-v1056-ledger-close],
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1063-ledger-head-actions > button[data-v1056-ledger-close]{
        width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:var(--v1199-crypto-modal)!important;
        min-width:var(--v1199-crypto-modal)!important;
        max-width:var(--v1199-crypto-modal)!important;
        box-sizing:border-box!important;
        padding:0!important;
        margin:0!important;
        align-items:flex-start!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        scrollbar-gutter:stable!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto{
        width:var(--v1199-crypto-content)!important;
        min-width:var(--v1199-crypto-content)!important;
        max-width:var(--v1199-crypto-content)!important;
        align-self:flex-start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1199-crypto-sheet))!important;
        width:var(--v1199-crypto-content)!important;
        min-width:var(--v1199-crypto-content)!important;
        max-width:var(--v1199-crypto-content)!important;
        gap:var(--v1199-crypto-gap)!important;
        justify-content:start!important;
        align-items:start!important;
        margin:0!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1199-crypto-sheet)!important;
        min-width:var(--v1199-crypto-sheet)!important;
        max-width:var(--v1199-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{
        display:grid!important;
        grid-template-columns:repeat(3,1fr)!important;
        gap:0!important;
        border-left:1px solid #0f172a!important;
        border-right:1px solid #0f172a!important;
        border-bottom:0!important;
        background:transparent!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div{
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(1){background:#9ccc7c!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(2){background:#7fbd5d!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){background:#63a64a!important;border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        table-layout:fixed!important;
        border-collapse:collapse!important;
        border-right:1px solid #0f172a!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table td,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table th,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table td{box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(1),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(1){width:34px!important;min-width:34px!important;max-width:34px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(2),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(2){width:78px!important;min-width:78px!important;max-width:78px!important;white-space:nowrap!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:126px!important;min-width:126px!important;max-width:126px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(4),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(4){width:56px!important;min-width:56px!important;max-width:56px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(5),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(5){width:70px!important;min-width:70px!important;max-width:70px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(6),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6){width:84px!important;min-width:84px!important;max-width:84px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7){width:112px!important;min-width:112px!important;max-width:112px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.8px!important;letter-spacing:-.018em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(6) .v1063-ledger-value{font-size:10.55px!important;letter-spacing:-.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.75px!important;letter-spacing:-.012em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}


      /* V1200: Kripto 35 satırda gereksiz dikey scrollbar çıkmasın; tablo genişliklerine dokunma. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        height:calc(100vh - 10px)!important;
        max-height:calc(100vh - 10px)!important;
        margin:5px auto!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        overflow-y:hidden!important;
        min-height:0!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto{
        min-height:0!important;
        height:auto!important;
      }
      @media (max-height:860px){
        #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
        #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{overflow-y:auto!important;}
      }


      /* V1201: Kripto çoklu/tekli sheet'i bahis gibi içeriğe kapat; sağ-sol/alt boşluğu azalt, Coin ve Kar-zarar kolonlarını kontrollü kısalt. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1201-crypto-sheet:542px;
        --v1201-crypto-gap:8px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1201-crypto-content:542px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1201-crypto-content:1092px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1201-crypto-content:1642px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(var(--v1201-crypto-content), calc(100vw - 10px))!important;
        min-width:min(var(--v1201-crypto-content), calc(100vw - 10px))!important;
        max-width:min(var(--v1201-crypto-content), calc(100vw - 10px))!important;
        height:auto!important;
        min-height:0!important;
        max-height:calc(100vh - 10px)!important;
        margin:5px auto!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        width:var(--v1201-crypto-content)!important;
        min-width:var(--v1201-crypto-content)!important;
        max-width:var(--v1201-crypto-content)!important;
        box-sizing:border-box!important;
        margin-left:0!important;
        margin-right:0!important;
        padding-left:0!important;
        padding-right:0!important;
        align-self:flex-start!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        overflow-x:hidden!important;
        overflow-y:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        display:grid!important;
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1201-crypto-sheet))!important;
        gap:var(--v1201-crypto-gap)!important;
        justify-content:start!important;
        align-items:start!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1201-crypto-sheet)!important;
        min-width:var(--v1201-crypto-sheet)!important;
        max-width:var(--v1201-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline{
        display:grid!important;
        grid-template-columns:repeat(3,1fr)!important;
        border-left:1px solid #0f172a!important;
        border-right:1px solid #0f172a!important;
        border-bottom:0!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline > div:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline > div:nth-child(3){border-right:0!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:116px!important;min-width:116px!important;max-width:116px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7){width:104px!important;min-width:104px!important;max-width:104px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{font-size:10.7px!important;letter-spacing:-.025em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7) .v1063-ledger-value{font-size:10.7px!important;letter-spacing:-.014em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}
      @media (max-height:860px){
        #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
        #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{overflow-y:auto!important;}
      }




      /* V1202: Kripto tabloyu yapışık göstermeden sıkı oturt; Coin 2 harf kadar kısalır, sağ/sol/alt hafif nefes payı kalır; Coin rengi mavi değil koyu grafit-bronz. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1202-crypto-sheet:526px;
        --v1202-crypto-gap:8px;
        --v1202-crypto-pad-x:8px;
        --v1202-crypto-pad-bottom:7px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1202-crypto-content:526px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1202-crypto-content:1060px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1202-crypto-content:1594px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2)), calc(100vw - 10px))!important;
        min-width:min(calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2)), calc(100vw - 10px))!important;
        max-width:min(calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2)), calc(100vw - 10px))!important;
        height:auto!important;
        min-height:0!important;
        max-height:calc(100vh - 10px)!important;
        margin:5px auto!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2))!important;
        min-width:calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2))!important;
        max-width:calc(var(--v1202-crypto-content) + (var(--v1202-crypto-pad-x) * 2))!important;
        box-sizing:border-box!important;
        margin-left:0!important;
        margin-right:0!important;
        padding-left:var(--v1202-crypto-pad-x)!important;
        padding-right:var(--v1202-crypto-pad-x)!important;
        align-self:flex-start!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        padding-bottom:var(--v1202-crypto-pad-bottom)!important;
        overflow-x:hidden!important;
        overflow-y:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        width:var(--v1202-crypto-content)!important;
        min-width:var(--v1202-crypto-content)!important;
        max-width:var(--v1202-crypto-content)!important;
        box-sizing:border-box!important;
        margin-left:0!important;
        margin-right:0!important;
        padding-left:0!important;
        padding-right:0!important;
        align-self:flex-start!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        display:grid!important;
        grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1202-crypto-sheet))!important;
        gap:var(--v1202-crypto-gap)!important;
        justify-content:start!important;
        align-items:start!important;
        overflow:visible!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1202-crypto-sheet)!important;
        min-width:var(--v1202-crypto-sheet)!important;
        max-width:var(--v1202-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:100px!important;min-width:100px!important;max-width:100px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(7),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(7){width:104px!important;min-width:104px!important;max-width:104px!important;overflow:hidden!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3){background:linear-gradient(180deg,#342719 0%,#1c1917 100%)!important;color:#fff7ed!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{color:#fff7ed!important;text-shadow:0 1px 0 rgba(0,0,0,.38)!important;font-size:10.65px!important;letter-spacing:-.028em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}



      /* V1205: Kripto Coin kutusu rengi Kömür Slate. */
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto{
        --v1203-crypto-sheet:518px;
        --v1203-crypto-gap:8px;
        --v1203-crypto-pad-left:5px;
        --v1203-crypto-pad-right:8px;
        --v1203-crypto-pad-bottom:8px;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="1"]{--v1203-crypto-content:518px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="2"]{--v1203-crypto-content:1044px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols="3"]{--v1203-crypto-content:1570px;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols]{
        width:min(calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right)), calc(100vw - 10px))!important;
        min-width:min(calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right)), calc(100vw - 10px))!important;
        max-width:min(calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right)), calc(100vw - 10px))!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1065-ledger-screen-head,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{
        width:calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right))!important;
        min-width:calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right))!important;
        max-width:calc(var(--v1203-crypto-content) + var(--v1203-crypto-pad-left) + var(--v1203-crypto-pad-right))!important;
        padding-left:var(--v1203-crypto-pad-left)!important;
        padding-right:var(--v1203-crypto-pad-right)!important;
        box-sizing:border-box!important;
        align-self:flex-start!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1056-ledger-screen-body,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-screen-body{padding-bottom:var(--v1203-crypto-pad-bottom)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{
        width:var(--v1203-crypto-content)!important;
        min-width:var(--v1203-crypto-content)!important;
        max-width:var(--v1203-crypto-content)!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet-grid,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet-grid{grid-template-columns:repeat(var(--v1110-ledger-cols,1), var(--v1203-crypto-sheet))!important;gap:var(--v1203-crypto-gap)!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-sheet,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1059-ledger-summary,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1060-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-summary-inline,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1057-ledger-excel-table,
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1061-ledger-excel-table{
        width:var(--v1203-crypto-sheet)!important;
        min-width:var(--v1203-crypto-sheet)!important;
        max-width:var(--v1203-crypto-sheet)!important;
        box-sizing:border-box!important;
      }
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto th:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3){width:92px!important;min-width:92px!important;max-width:92px!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1057-ledger-excel-table tbody td:nth-child(3),
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto .v1061-ledger-excel-table tbody td:nth-child(3){background:linear-gradient(180deg,#182230 0%,#101827 100%)!important;color:#e5edf8!important;}
      #v1056-ledger-screen-host .v1110-ledger-test-modal.crypto[data-v1110-ledger-cols] .v1054-daily-ledger.crypto td:nth-child(3) .v1063-ledger-value{color:#e5edf8!important;text-shadow:0 1px 0 rgba(0,0,0,.42)!important;font-size:10.6px!important;letter-spacing:-.032em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}

            .v1098-ledger-photo-toolbar button[data-v781-photo-open]{border-color:rgba(251,191,36,.45)!important;background:#111827!important;color:#fde68a!important;}
      @media (max-width:980px){.v1110-ledger-header-pager{display:none!important;}#v1056-ledger-screen-host .v1110-ledger-test-modal{width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;height:calc(100vh - 24px)!important;margin:12px auto!important;}}
    `;
  }
  function v1103ClearLedgerTestRows(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const edits = v1057LoadLedgerEdits();
    if (!edits[m] || typeof edits[m] !== "object") return;
    edits[m].manual = (edits[m].manual || []).filter(row => !v1103IsLedgerTestRow(row));
    v1057SaveLedgerEdits(edits);
  }
  function v1103BuildLedgerTestRow(mode, index, ts) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const n = index + 1;
    const dayOffset = Math.floor(index / 4);
    const dateObj = new Date(ts + dayOffset * 24 * 60 * 60 * 1000);
    const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const id = `ledger_test_${m}_${ts}_${String(n).padStart(3, "0")}`;
    if (m === "crypto") {
      const side = index % 2 === 0 ? "Long" : "Short";
      const pnl = index % 5 === 0 ? -18 : 24;
      return { id, ts: ts + index * 1000, source: "test", testOnly: 1, force: 1, date, time: v1056TimeLabelFromTs(ts + index * 1000), item: `TEST${n}USDT`, kind: side, stake: "$100.00", roi: pnl > 0 ? "24%" : "-18%", pnl: v1069LedgerPnlText(pnl), pnlRaw: pnl, status: pnl > 0 ? "win" : "loss" };
    }
    const pattern = index % 4;
    const stake = pattern === 2 ? 100 : pattern === 1 ? 50 : 25;
    if (pattern === 1) {
      return { id, ts: ts + index * 1000, source: "test", testOnly: 1, force: 1, date, time: v1056TimeLabelFromTs(ts + index * 1000), item: `Test Gs ${n} + Test Bjk ${n}`, itemLines: [
        { name: `Test Gs ${n}`, odds: 2, status: "pending" },
        { name: `Test Bjk ${n}`, odds: 2, status: "pending" }
      ], kind: "Kombine", stake: money(stake), roi: "4", pnl: v1069LedgerPnlText(150), pnlRaw: 150, status: "pending" };
    }
    if (pattern === 2) {
      return { id, ts: ts + index * 1000, source: "test", testOnly: 1, force: 1, date, time: v1056TimeLabelFromTs(ts + index * 1000), item: `Test Fenerbahçe kazanır ve 5 gol atar ${n} + Test Galatasaray çifte şans ${n}`, itemLines: [
        { name: `Test Fenerbahçe kazanır ve 5 gol atar ${n}`, odds: 2, status: "win" },
        { name: `Test Galatasaray çifte şans ${n}`, odds: 1.84, status: "loss" }
      ], kind: "Kombine", stake: money(stake), roi: "3,68", pnl: v1069LedgerPnlText(268), pnlRaw: 268, status: "win" };
    }
    const won = pattern !== 3;
    return { id, ts: ts + index * 1000, source: "test", testOnly: 1, force: 1, date, time: v1056TimeLabelFromTs(ts + index * 1000), item: `Test Tekli Maç ${n}`, itemLines: [{ name: `Test Tekli Maç ${n}`, odds: 2, status: won ? "win" : "loss" }], kind: "Tek", stake: money(stake), roi: "2", pnl: v1069LedgerPnlText(won ? stake : -stake), pnlRaw: won ? stake : -stake, status: won ? "win" : "loss" };
  }
  function v1103FillLedgerTestRows(mode, targetCount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    v1103ClearLedgerTestRows(m);
    const realCount = v1057LedgerRows(m).filter(row => !v1103IsLedgerTestRow(row)).length;
    const total = Math.max(0, Number(targetCount || 0));
    const addCount = Math.max(0, total - realCount);
    const edits = v1057LoadLedgerEdits();
    const ts = Date.now() + 1000;
    for (let i = 0; i < addCount; i += 1) edits[m].manual.push(v1103BuildLedgerTestRow(m, i, ts));
    v1057SaveLedgerEdits(edits);
  }
  function v1139BuildLedgerLongComboTestRow(mode, index, ts) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m !== "bet") return v1103BuildLedgerTestRow(m, index, ts);
    const n = index + 1;
    const comboSize = 4 + (index % 3);
    const dayOffset = Math.floor(index / 3);
    const dateObj = new Date(ts + dayOffset * 24 * 60 * 60 * 1000);
    const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const names = ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Adana Demirspor"];
    const statuses = ["pending", "win", "loss", "pending", "win", "loss"];
    const itemLines = names.slice(0, comboSize).map((team, lineIndex) => ({
      name: `Test ${team} ${lineIndex + 1}. maç ${n}`,
      odds: lineIndex % 2 === 0 ? 2 : 1.84,
      status: statuses[(index + lineIndex) % statuses.length]
    }));
    const roi = comboSize === 4 ? "16" : comboSize === 5 ? "32" : "64";
    const pnlRaw = index % 2 === 0 ? 268 : -100;
    return {
      id: `ledger_test_long_combo_${m}_${ts}_${String(n).padStart(3, "0")}`,
      ts: ts + index * 1000,
      source: "test",
      testOnly: 1,
      force: 1,
      date,
      time: v1056TimeLabelFromTs(ts + index * 1000),
      item: itemLines.map(line => line.name).join(" + "),
      itemLines,
      kind: "Kombine",
      stake: money(100),
      roi,
      pnl: v1069LedgerPnlText(pnlRaw),
      pnlRaw,
      status: pnlRaw >= 0 ? "win" : "loss"
    };
  }
  function v1139FillLedgerLongComboTestRows(mode, tableCount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m !== "bet") return v1103FillLedgerTestRowsByTable(m, tableCount);
    v1103ClearLedgerTestRows(m);
    const realRows = v1057LedgerRows(m).filter(row => !v1103IsLedgerTestRow(row));
    const safeTables = Math.max(1, Math.min(3, Number(tableCount || 3)));
    let lastGoodRows = realRows.slice();
    const ts = Date.now() + 1000;
    for (let addCount = 0; addCount <= 90; addCount += 1) {
      const candidateRows = realRows.slice();
      for (let j = 0; j < addCount; j += 1) candidateRows.push(v1139BuildLedgerLongComboTestRow(m, j, ts));
      const chunks = v1135LedgerFlatChunks(v1119LedgerBuildPages(candidateRows, m));
      if (chunks.length > safeTables) break;
      if (chunks.length === safeTables) lastGoodRows = candidateRows;
    }
    const edits = v1057LoadLedgerEdits();
    edits[m].manual = (edits[m].manual || []).filter(row => !v1103IsLedgerTestRow(row));
    edits[m].manual.push(...lastGoodRows.filter(row => v1103IsLedgerTestRow(row)));
    v1057SaveLedgerEdits(edits);
  }
  function v1140BuildLedgerFullMixedTestRow(mode, index, ts) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m !== "bet") return v1103BuildLedgerTestRow(m, index, ts);
    const n = index + 1;
    const pattern = index % 10;
    const comboSize = pattern === 0 || pattern === 5 ? 1 : pattern === 1 || pattern === 2 || pattern === 7 ? 2 : pattern === 3 ? 3 : pattern === 4 ? 4 : pattern === 6 ? 5 : pattern === 8 ? 6 : 3;
    const dayOffset = Math.floor(index / 4);
    const dateObj = new Date(ts + dayOffset * 24 * 60 * 60 * 1000);
    const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const id = `ledger_test_full_mix_${m}_${ts}_${String(n).padStart(3, "0")}`;
    const baseTs = ts + index * 1000;
    if (comboSize <= 1) {
      const status = pattern === 5 ? "loss" : pattern === 9 ? "pending" : "win";
      const stake = pattern === 5 ? 25 : 50;
      const pnlRaw = status === "loss" ? -stake : status === "pending" ? 0 : stake;
      return {
        id,
        ts: baseTs,
        source: "test",
        testOnly: 1,
        force: 1,
        date,
        time: v1056TimeLabelFromTs(baseTs),
        item: `Tam Karışık Tekli Maç ${n}`,
        itemLines: [{ name: `Tam Karışık Tekli Maç ${n}`, odds: 2, status }],
        kind: "Tek",
        stake: money(stake),
        roi: "2",
        pnl: v1069LedgerPnlText(pnlRaw),
        pnlRaw,
        status
      };
    }
    const teams = ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Adana Demirspor"];
    const statusSets = [
      ["pending", "pending", "pending", "pending", "pending", "pending"],
      ["win", "loss", "pending", "win", "loss", "pending"],
      ["win", "win", "loss", "pending", "win", "loss"],
      ["loss", "win", "pending", "win", "pending", "loss"]
    ];
    const statuses = statusSets[index % statusSets.length];
    const itemLines = teams.slice(0, comboSize).map((team, lineIndex) => ({
      name: `Tam Karışık ${team} ${lineIndex + 1}. maç ${n}`,
      odds: lineIndex % 3 === 0 ? 2 : lineIndex % 3 === 1 ? 1.84 : 1.72,
      status: statuses[lineIndex] || "pending"
    }));
    const roiMap = { 2: "4", 3: "8", 4: "16", 5: "32", 6: "64" };
    const pnlCycle = [150, 268, -50, -100, 0];
    const pnlRaw = pnlCycle[index % pnlCycle.length];
    return {
      id,
      ts: baseTs,
      source: "test",
      testOnly: 1,
      force: 1,
      date,
      time: v1056TimeLabelFromTs(baseTs),
      item: itemLines.map(line => line.name).join(" + "),
      itemLines,
      kind: "Kombine",
      stake: money(comboSize >= 3 ? 100 : 50),
      roi: roiMap[comboSize] || "4",
      pnl: v1069LedgerPnlText(pnlRaw),
      pnlRaw,
      status: pnlRaw < 0 ? "loss" : pnlRaw > 0 ? "win" : "pending"
    };
  }
  function v1140FillLedgerFullMixedTestRows(mode, tableCount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m !== "bet") return v1103FillLedgerTestRowsByTable(m, tableCount);
    v1103ClearLedgerTestRows(m);
    const realRows = v1057LedgerRows(m).filter(row => !v1103IsLedgerTestRow(row));
    const safeTables = Math.max(1, Math.min(6, Number(tableCount || 3)));
    let lastGoodRows = realRows.slice();
    const ts = Date.now() + 1000;
    for (let addCount = 0; addCount <= 220; addCount += 1) {
      const candidateRows = realRows.slice();
      for (let j = 0; j < addCount; j += 1) candidateRows.push(v1140BuildLedgerFullMixedTestRow(m, j, ts));
      const chunks = v1135LedgerFlatChunks(v1119LedgerBuildPages(candidateRows, m));
      if (chunks.length > safeTables) break;
      if (chunks.length === safeTables) lastGoodRows = candidateRows;
    }
    const edits = v1057LoadLedgerEdits();
    edits[m].manual = (edits[m].manual || []).filter(row => !v1103IsLedgerTestRow(row));
    edits[m].manual.push(...lastGoodRows.filter(row => v1103IsLedgerTestRow(row)));
    v1057SaveLedgerEdits(edits);
  }
  function v1110LedgerSummarySpacerHtml() {
    return `<div class="v1059-ledger-summary v1060-ledger-summary-inline v1061-ledger-summary-inline v1110-ledger-summary-blank" aria-hidden="true"><div><span>&nbsp;</span><b>&nbsp;</b></div><div><span>&nbsp;</span><b>&nbsp;</b></div><div><span>&nbsp;</span><b>&nbsp;</b></div></div>`;
  }
  function v1110LedgerTestPageKey(mode) {
    return `${LEDGER_TEST_PAGE_KEY}_${mode === "crypto" ? "crypto" : "bet"}`;
  }
  function v1110GetLedgerTestPage(mode) {
    try { return Math.max(0, Number(localStorage.getItem(v1110LedgerTestPageKey(mode)) || 0)); } catch { return 0; }
  }
  function v1110SetLedgerTestPage(mode, page) {
    try { localStorage.setItem(v1110LedgerTestPageKey(mode), String(Math.max(0, Number(page || 0)))); } catch {}
  }
  function v1119LedgerRowWeight(row, mode) {
    if (mode !== "bet" || !v1103LedgerTestModeEnabled()) return 1;
    const info = v1118LedgerBetLineInfo(row);
    if (info.count <= 1) return 0.82;
    return info.isLong ? 1.22 : 1.0;
  }
  function v1135LedgerRowPx(row, mode) {
    if (mode !== "bet" || !v1103LedgerTestModeEnabled()) return 32;
    const info = v1118LedgerBetLineInfo(row);
    const count = Math.max(1, Number(info.count || 1));
    if (count <= 1) return 21;
    if (count === 2) return info.isLong ? 39 : 34;
    return Math.min(122, 23 + count * 15 + (info.isLong ? 5 : 0));
  }
  function v1135LedgerTableBodyPx() {
    const body = document.querySelector('#v1056-ledger-screen-host .v1056-ledger-screen-body, #v1056-ledger-screen-host .v1057-ledger-screen-body');
    let bodyH = 0;
    try { bodyH = Math.floor(body?.getBoundingClientRect?.().height || 0); } catch {}
    if (!bodyH) {
      const viewportH = Math.max(720, Math.floor(window.innerHeight || document.documentElement?.clientHeight || 900));
      bodyH = Math.max(480, viewportH - 4 - 40 - 4);
    }
    const summaryH = 40;
    const headH = 21;
    // Test bar başlık satırında ve artık ayrı dikey alan yemiyor. Güvenlik payı sadece son satır kesilmesin diye bırakılır.
    const safety = 8;
    return Math.max(340, bodyH - summaryH - headH - safety);
  }
  function v1135LedgerFlatChunks(pages) {
    return (Array.isArray(pages) ? pages : []).flatMap(page => Array.isArray(page?.chunks) ? page.chunks : []).filter(chunk => Array.isArray(chunk) && chunk.length);
  }
  function v1135LedgerChunkPx(chunk, mode) {
    return (Array.isArray(chunk) ? chunk : []).reduce((sum, row) => sum + v1135LedgerRowPx(row, mode), 0);
  }
  function v1146LedgerScrollOverflowAllowancePx(row, mode) {
    if (mode !== "bet" || !v1103LedgerTestModeEnabled()) return 0;
    const info = v1118LedgerBetLineInfo(row);
    const count = Math.max(1, Number(info.count || 1));
    if (count >= 5) return 118;
    if (count >= 3) return 104;
    return 72;
  }
  function v1135LedgerTargetTotalForTables(mode, tableCount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const safeTables = Math.max(1, Math.min(6, Number(tableCount || 1)));
    const realRows = v1057LedgerRows(m).filter(row => !v1103IsLedgerTestRow(row));
    if (m !== "bet") return safeTables * 35;
    let lastGoodTotal = realRows.length;
    const ts = Date.now() + 1000;
    for (let addCount = 0; addCount <= 500; addCount += 1) {
      const candidateRows = realRows.slice();
      for (let j = 0; j < addCount; j += 1) candidateRows.push(v1103BuildLedgerTestRow(m, j, ts));
      const chunks = v1135LedgerFlatChunks(v1119LedgerBuildPages(candidateRows, m));
      if (chunks.length > safeTables) return Math.max(realRows.length, lastGoodTotal);
      if (chunks.length === safeTables) lastGoodTotal = candidateRows.length;
    }
    return Math.max(realRows.length, lastGoodTotal);
  }
  function v1103FillLedgerTestRowsByTable(mode, tableCount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const total = v1135LedgerTargetTotalForTables(m, tableCount);
    v1103FillLedgerTestRows(m, total);
  }
  function v1119LedgerBuildPages(rows, mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (!v1103LedgerTestModeEnabled()) {
      return [{ chunks: v1057LedgerChunks(rows, 25), start: 0, end: Array.isArray(rows) ? rows.length : 0 }];
    }
    const source = Array.isArray(rows) ? rows : [];
    if (m !== "bet") {
      const capacity = 35;
      const pages = [];
      let page = { chunks: [[]], weights: [0], start: 0, end: 0 };
      const commitPage = () => {
        page.chunks = page.chunks.filter(chunk => chunk.length);
        if (!page.chunks.length) page.chunks = [[]];
        const maxWeight = Math.max(...(page.weights || [0]));
        page.chunks = page.chunks.map((chunk, i) => {
          const used = Number(page.weights?.[i] || 0);
          const missing = Math.max(0, maxWeight - used);
          if (page.chunks.length > 1 && missing > 0.08) {
            return chunk.concat([{ _v1119Filler: true, _v1119FillerPx: Math.round(missing * 31) }]);
          }
          return chunk;
        });
        pages.push(page);
      };
      source.forEach((row, idx) => {
        const weightedRow = { ...row, _ledgerNo: idx + 1 };
        const weight = v1119LedgerRowWeight(weightedRow, m);
        let col = page.chunks.length - 1;
        if (page.chunks[col].length && page.weights[col] + weight > capacity) {
          if (page.chunks.length >= 3) {
            page.end = idx;
            commitPage();
            page = { chunks: [[]], weights: [0], start: idx, end: idx };
            col = 0;
          } else {
            page.chunks.push([]);
            page.weights.push(0);
            col += 1;
          }
        }
        page.chunks[col].push(weightedRow);
        page.weights[col] += weight;
        page.end = idx + 1;
      });
      if (!source.length) page = { chunks: [[]], weights: [0], start: 0, end: 0 };
      commitPage();
      return pages;
    }
    const capacityPx = v1135LedgerTableBodyPx();
    const pages = [];
    let page = { chunks: [[]], weights: [0], start: 0, end: 0 };
    const commitPage = () => {
      page.chunks = page.chunks.filter(chunk => chunk.length);
      page.weights = (page.weights || []).slice(0, page.chunks.length);
      if (!page.chunks.length) {
        page.chunks = [[]];
        page.weights = [0];
      }
      pages.push(page);
    };
    source.forEach((row, idx) => {
      const weightedRow = { ...row, _ledgerNo: idx + 1 };
      const rowPx = v1135LedgerRowPx(weightedRow, m);
      let col = page.chunks.length - 1;
      const usedPx = Number(page.weights[col] || 0);
      const wouldOverflow = page.chunks[col].length && usedPx + rowPx > capacityPx;
      const prevChunkCount = col > 0 ? Number(page.chunks[col - 1]?.length || 0) : 0;
      const currentChunkCount = Number(page.chunks[col]?.length || 0);
      const allowScrollOverflow = wouldOverflow && col > 0 && prevChunkCount > 0 && currentChunkCount < prevChunkCount && usedPx + rowPx <= capacityPx + v1146LedgerScrollOverflowAllowancePx(weightedRow, m);
      if (wouldOverflow && !allowScrollOverflow) {
        if (page.chunks.length >= 3) {
          page.end = idx;
          commitPage();
          page = { chunks: [[]], weights: [0], start: idx, end: idx };
          col = 0;
        } else {
          page.chunks.push([]);
          page.weights.push(0);
          col += 1;
        }
      }
      page.chunks[col].push(weightedRow);
      page.weights[col] += rowPx;
      page.end = idx + 1;
    });
    if (!source.length) page = { chunks: [[]], weights: [0], start: 0, end: 0 };
    commitPage();
    return pages;
  }
  function v1110LedgerPageInfo(rows, mode) {
    const total = Array.isArray(rows) ? rows.length : 0;
    const pages = v1119LedgerBuildPages(rows, mode);
    const totalPages = Math.max(1, pages.length || 1);
    let page = v1110GetLedgerTestPage(mode);
    if (page >= totalPages) {
      page = totalPages - 1;
      v1110SetLedgerTestPage(mode, page);
    }
    const current = pages[page] || pages[0] || { chunks: [[]], start: 0, end: 0 };
    const pageRows = (current.chunks || []).flat().filter(row => !row?._v1119Filler);
    return { total, page, totalPages, start: current.start || 0, end: current.end || 0, pageRows, chunks: current.chunks || [[]] };
  }
  function v1110LedgerChunks(rows, mode) {
    if (!v1103LedgerTestModeEnabled()) return v1057LedgerChunks(rows, 25);
    return v1110LedgerPageInfo(rows, mode).chunks;
  }
  function v1110LedgerPagerHtml(rows, mode) {
    return "";
  }
  function v1110LedgerHeaderPagerHtml(mode) {
    if (!v1103LedgerTestModeEnabled()) return "";
    const m = mode === "crypto" ? "crypto" : "bet";
    const rows = v1057LedgerRows(m);
    const info = v1110LedgerPageInfo(rows, m);
    if (info.totalPages <= 1) return "";
    return `<div class="v1110-ledger-header-pager" data-v1110-ledger-pager="${m}"><button type="button" title="Önceki" aria-label="Önceki" data-v1110-ledger-page="${m}:prev" ${info.page <= 0 ? "disabled" : ""}>‹</button><b>Sayfa ${info.page + 1}/${info.totalPages}</b><button type="button" title="Sonraki" aria-label="Sonraki" data-v1110-ledger-page="${m}:next" ${info.page >= info.totalPages - 1 ? "disabled" : ""}>›</button></div>`;
  }
  function v1110ApplyLedgerTestLayout(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    const modal = root.querySelector('.v1056-ledger-screen-modal');
    const grid = root.querySelector('.v1057-ledger-sheet-grid, .v1061-ledger-sheet-grid');
    if (!modal || !grid) return;
    modal.classList.remove('v1110-ledger-test-modal');
    modal.removeAttribute('data-v1110-ledger-cols');
    modal.style.removeProperty('--v1110-ledger-cols');
    if (!v1103LedgerTestModeEnabled()) return;
    const cols = Math.max(1, Math.min(3, grid.querySelectorAll('.v1057-ledger-sheet, .v1061-ledger-sheet').length || 1));
    modal.classList.add('v1110-ledger-test-modal');
    modal.setAttribute('data-v1110-ledger-cols', String(cols));
    modal.style.setProperty('--v1110-ledger-cols', String(cols));
  }
  function v1110SyncLedgerRowHeights(scope) {
    v1110FitLedgerTestRows(scope);
  }
  function v1110FitLedgerTestRows(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    const modal = root.querySelector('.v1056-ledger-screen-modal');
    const body = root.querySelector('.v1056-ledger-screen-body, .v1057-ledger-screen-body');
    const grid = root.querySelector('.v1057-ledger-sheet-grid, .v1061-ledger-sheet-grid');
    if (!modal || !body || !grid) return;
    if (!v1103LedgerTestModeEnabled()) {
      grid.style.removeProperty('--v1110-row-h');
      return;
    }
    const sections = Array.from(grid.querySelectorAll('.v1057-ledger-sheet, .v1061-ledger-sheet'));
    const isBetTest = modal.classList.contains('bet');
    if (isBetTest) {
      grid.style.removeProperty('--v1110-row-h');
      sections.forEach(section => {
        const table = section.querySelector('table');
        if (table) table.style.removeProperty('--v1110-row-h');
        section.querySelectorAll('tbody tr').forEach(row => {
          row.style.removeProperty('height');
          row.style.removeProperty('max-height');
          row.querySelectorAll('td').forEach(td => {
            td.style.removeProperty('height');
            td.style.removeProperty('max-height');
          });
        });
      });
      return;
    }
    const rowCount = Math.max(1, ...sections.map(section => section.querySelectorAll('tbody tr').length || 0));
    const first = sections[0];
    if (!first) return;
    const summary = first.querySelector('.v1059-ledger-summary, .v1060-ledger-summary-inline, .v1061-ledger-summary-inline');
    const thead = first.querySelector('thead');
    const bodyHeight = Math.floor(body.clientHeight || body.getBoundingClientRect().height || 0);
    const summaryHeight = Math.ceil(summary?.getBoundingClientRect?.().height || 42);
    const headHeight = Math.ceil(thead?.getBoundingClientRect?.().height || 22);
    const safety = 0;
    const available = Math.max(0, bodyHeight - summaryHeight - headHeight - safety);
    const rowH = Math.max(21.5, Math.min(34, Math.floor((available / rowCount) * 10) / 10));
    grid.style.setProperty('--v1110-row-h', `${rowH}px`);
    sections.forEach(section => {
      const table = section.querySelector('table');
      if (table) table.style.setProperty('--v1110-row-h', `${rowH}px`);
      section.querySelectorAll('tbody tr').forEach(row => {
        row.style.height = `${rowH}px`;
        row.style.maxHeight = `${rowH}px`;
        row.querySelectorAll('td').forEach(td => {
          td.style.height = `${rowH}px`;
          td.style.maxHeight = `${rowH}px`;
        });
      });
    });
  }
  function v1110FinalizeLedgerLayout(scope) {
    const run = () => {
      v1110ApplyLedgerTestLayout(scope);
      requestAnimationFrame(() => v1110FitLedgerTestRows(scope));
    };
    run();
    setTimeout(run, 0);
    setTimeout(run, 90);
    setTimeout(run, 220);
  }
  function v1103LedgerTestToolbar(mode) {
    if (!v1103LedgerTestModeEnabled()) return "";
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m === "crypto") {
      return `<div class="v1103-ledger-test-toolbar v1182-crypto-test-toolbar" data-v1103-ledger-test-toolbar><button type="button" class="v1182-crypto-test-toggle" aria-label="Kripto test paneli">TEST MODU ▾</button><div class="v1182-crypto-test-panel" data-v1182-crypto-test-panel><strong>TEST MODU</strong><button type="button" data-v1103-ledger-test-fill="${m}:35">35'e Tamamla</button><button type="button" data-v1103-ledger-test-fill="${m}:70">70'e Tamamla</button><button type="button" data-v1103-ledger-test-fill="${m}:105">105'e Tamamla</button><button type="button" data-v1103-ledger-test-fill="${m}:140">140'a Tamamla</button><button type="button" data-v1103-ledger-test-fill="${m}:175">175'e Tamamla</button><button type="button" data-v1103-ledger-test-fill="${m}:210">210'a Tamamla</button><button type="button" data-v1103-ledger-test-clear="${m}">Testi Temizle</button><button type="button" class="danger" data-v1103-ledger-test-disable="${m}">Test Modunu Kapat</button></div></div>`;
    }
    return `<div class="v1103-ledger-test-toolbar" data-v1103-ledger-test-toolbar><strong>TEST MODU</strong><button type="button" data-v1103-ledger-test-fill-table="${m}:1">1. Tabloyu Doldur</button><button type="button" data-v1103-ledger-test-fill-table="${m}:2">2. Tabloyu Doldur</button><button type="button" data-v1103-ledger-test-fill-table="${m}:3">3. Tabloyu Doldur</button><button type="button" data-v1103-ledger-test-fill-table="${m}:4">4. Tabloyu Doldur</button><button type="button" data-v1103-ledger-test-fill-table="${m}:5">5. Tabloyu Doldur</button><button type="button" data-v1103-ledger-test-fill-table="${m}:6">6. Tabloyu Doldur</button><button type="button" data-v1139-ledger-long-combo-test="${m}:3">4/5/6 Test</button><button type="button" data-v1140-ledger-full-mix-test="${m}:3">Tam Karışık</button><button type="button" data-v1103-ledger-test-clear="${m}">Testi Temizle</button><button type="button" class="danger" data-v1103-ledger-test-disable="${m}">Test Modunu Kapat</button></div>`;
  }

  function restoreActivePanelAfterConfirm(mode) {
    const panelMode = mode === "crypto" ? "crypto" : "bet";
    PENDING_BOARD_OPEN_MODE = panelMode;
    LOG_CENTER_OPEN_MODE = null;
    REPORT_CENTER_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    CONFIRM_RETURN_PANEL_MODE = panelMode;
    setTimeout(() => {
      PENDING_BOARD_OPEN_MODE = panelMode;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      CONFIRM_DIALOG = null;
      renderFloatingPanel();
    }, 0);
  }

  const DEFAULT_STATE = {
    bank: 1000,
    modeSlots: { bet: createSlots("bet", 20), crypto: createSlots("crypto", 20) },
    rowCounts: { bet: 20, crypto: 20 },
    quickTemplates: { bet: { stake: "", odds: "", name: "" }, crypto: { stake: "", odds: "", name: "" } }
  };

  function storageHas(key) {
    try { return localStorage.getItem(key) !== null; } catch { return false; }
  }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === "") return fallback;
      const parsed = JSON.parse(raw);
      return parsed === undefined || parsed === null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function modeStateKey(mode) { return mode === "crypto" ? STORAGE_KEY_CRYPTO : STORAGE_KEY_BET; }
  function modeHistoryKey(mode) { return mode === "crypto" ? HISTORY_KEY_CRYPTO : HISTORY_KEY_BET; }
  function modeTargetLogKey(mode) { return mode === "crypto" ? TARGET_LOG_KEY_CRYPTO : TARGET_LOG_KEY_BET; }
  function modeSnapshotKey(mode) { return mode === "crypto" ? SNAPSHOT_KEY_CRYPTO : SNAPSHOT_KEY_BET; }
  function modeTargetItemsKey(mode) { return mode === "crypto" ? TARGET_ITEMS_KEY_CRYPTO : TARGET_ITEMS_KEY_BET; }
  function modeTargetClosedPnlKey(mode) { return mode === "crypto" ? TARGET_CLOSED_PNL_KEY_CRYPTO : TARGET_CLOSED_PNL_KEY_BET; }
  function legacyCombinedState() {
    const raw = readJson(STORAGE_KEY, {});
    const state = { ...DEFAULT_STATE, ...(raw && typeof raw === "object" ? raw : {}) };
    try { ensureStateShape(state); } catch {}
    return state;
  }
  function normalizeModeStore(mode, raw, legacy) {
    const safeMode = mode === "crypto" ? "crypto" : "bet";
    const source = raw && typeof raw === "object" ? raw : {};
    const fallbackSlots = Array.isArray(legacy?.modeSlots?.[safeMode]) ? legacy.modeSlots[safeMode] : createSlots(safeMode, 20);
    const fallbackQuick = safeMode === "crypto"
      ? { stake: "", odds: "", name: "" }
      : { stake: "", odds: "", name: "" };
    const fallbackPlan = safeMode === "crypto"
      ? { start: legacy?.quickPlan?.start ?? 100, target: "", currentOverride: "" }
      : { ...(legacy?.quickPlan || {}), start: legacy?.quickPlan?.start ?? 100, target: legacy?.quickPlan?.target ?? 1000, currentOverride: legacy?.quickPlan?.currentOverride ?? "" };
    return {
      version: 984,
      mode: safeMode,
      slots: Array.isArray(source.slots) ? source.slots : fallbackSlots,
      rowCount: Math.max(1, Math.min(20, Number(source.rowCount ?? legacy?.rowCounts?.[safeMode] ?? 20))),
      quickTemplate: source.quickTemplate && typeof source.quickTemplate === "object"
        ? { ...fallbackQuick, ...source.quickTemplate }
        : { ...fallbackQuick, ...(legacy?.quickTemplates?.[safeMode] || {}) },
      quickPlan: source.quickPlan && typeof source.quickPlan === "object"
        ? { ...fallbackPlan, ...source.quickPlan }
        : { ...fallbackPlan, ...(legacy?.quickPlans?.[safeMode] || {}) }
    };
  }
  function buildModeStore(mode, state) {
    const safeMode = mode === "crypto" ? "crypto" : "bet";
    ensureQuickTemplates(state);
    ensureQuickPlans(state);
    return {
      version: 984,
      mode: safeMode,
      updatedAt: Date.now(),
      slots: Array.isArray(state.modeSlots?.[safeMode]) ? state.modeSlots[safeMode] : createSlots(safeMode, 20),
      rowCount: Math.max(1, Math.min(20, Number(state.rowCounts?.[safeMode] || 20))),
      quickTemplate: { ...(state.quickTemplates?.[safeMode] || {}) },
      quickPlan: { ...(state.quickPlans?.[safeMode] || {}) }
    };
  }
  function splitArrayByMode(rows) {
    const out = { bet: [], crypto: [] };
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const mode = row?.mode === "crypto" ? "crypto" : "bet";
      out[mode].push(row);
    });
    return out;
  }

  function qs(id) { return document.getElementById(id); }
  function money(v) {
    const n = Number(v || 0);
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function signedMoney(v) {
    const n = Number(v || 0);
    return (n >= 0 ? "+" : "-") + money(Math.abs(n));
  }
  function pctText(v) {
    const n = Number.isFinite(Number(v)) ? Number(v) : 0;
    return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
  }
  function growthPct(pnl, base) {
    const b = Math.abs(Number(base || 0));
    return b ? (Number(pnl || 0) / b) * 100 : 0;
  }
  function loadHistory() {
    const legacy = readJson(HISTORY_KEY, {});
    const hasBet = storageHas(HISTORY_KEY_BET);
    const hasCrypto = storageHas(HISTORY_KEY_CRYPTO);
    const bet = hasBet ? readJson(HISTORY_KEY_BET, []) : (Array.isArray(legacy.bet) ? legacy.bet : []);
    const crypto = hasCrypto ? readJson(HISTORY_KEY_CRYPTO, []) : (Array.isArray(legacy.crypto) ? legacy.crypto : []);
    const h = { bet: Array.isArray(bet) ? bet : [], crypto: Array.isArray(crypto) ? crypto : [] };
    if (!hasBet && h.bet.length) writeJson(HISTORY_KEY_BET, h.bet);
    if (!hasCrypto && h.crypto.length) writeJson(HISTORY_KEY_CRYPTO, h.crypto);
    return h;
  }
  function saveHistory(h) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    const bet = (h.bet || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    const crypto = (h.crypto || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 1200);
    writeJson(HISTORY_KEY_BET, bet);
    writeJson(HISTORY_KEY_CRYPTO, crypto);
  }
  function loadTargetLog() {
    const legacy = readJson(TARGET_LOG_KEY, []);
    const legacySplit = splitArrayByMode(legacy);
    const hasBet = storageHas(TARGET_LOG_KEY_BET);
    const hasCrypto = storageHas(TARGET_LOG_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_LOG_KEY_BET, []) : legacySplit.bet;
    const crypto = hasCrypto ? readJson(TARGET_LOG_KEY_CRYPTO, []) : legacySplit.crypto;
    if (!hasBet && bet.length) writeJson(TARGET_LOG_KEY_BET, bet);
    if (!hasCrypto && crypto.length) writeJson(TARGET_LOG_KEY_CRYPTO, crypto);
    return [...(Array.isArray(bet) ? bet : []), ...(Array.isArray(crypto) ? crypto : [])]
      .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
  }
  function saveTargetLog(rows) {
    const twoYearsAgo = Date.now() - 730 * 24 * 60 * 60 * 1000;
    const clean = (rows || []).filter(x => Number(x.ts || 0) >= twoYearsAgo).slice(0, 500);
    const split = splitArrayByMode(clean);
    writeJson(TARGET_LOG_KEY_BET, split.bet.slice(0, 500));
    writeJson(TARGET_LOG_KEY_CRYPTO, split.crypto.slice(0, 500));
  }

  function syncStateWithHistory(state) {
    const h = loadHistory();
    const ids = new Set([...(h.bet || []), ...(h.crypto || [])].map(r => String(r.id || "")).filter(Boolean));
    ["bet", "crypto"].forEach(mode => {
      const list = state.modeSlots?.[mode] || [];
      list.forEach(slot => {
        if (!slot) return;
        const finished = slot.status === "win" || slot.status === "loss";
        const historyId = String(slot.historyId || "");
        const orphanFinished = finished && (!historyId || !ids.has(historyId));
        if (!orphanFinished) return;
        slot.status = slotHasUserEntry(slot, mode) ? "pending" : "pending";
        slot.pnl = 0;
        slot.historyId = "";
        slot.historyStatus = "";
        if (mode === "bet") {
          slot.comboResults = [];
          if (!betCouponGroup(slot)) slot.betKind = "single";
        }
      });
    });
    return state;
  }

  function escapeXml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function loadReportCards() {
    const now = Date.now();
    const legacy = readJson(SNAPSHOT_KEY, []);
    const legacySplit = splitArrayByMode(legacy);
    const hasBet = storageHas(SNAPSHOT_KEY_BET);
    const hasCrypto = storageHas(SNAPSHOT_KEY_CRYPTO);
    const rawBet = hasBet ? readJson(SNAPSHOT_KEY_BET, []) : legacySplit.bet;
    const rawCrypto = hasCrypto ? readJson(SNAPSHOT_KEY_CRYPTO, []) : legacySplit.crypto;
    const bet = (Array.isArray(rawBet) ? rawBet : [])
      .filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    const crypto = (Array.isArray(rawCrypto) ? rawCrypto : [])
      .filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    if (!hasBet && bet.length) writeJson(SNAPSHOT_KEY_BET, bet);
    if (!hasCrypto && crypto.length) writeJson(SNAPSHOT_KEY_CRYPTO, crypto);
    return [...bet, ...crypto].sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
  }
  function saveReportCards(rows) {
    const now = Date.now();
    const clean = (rows || []).filter(x => x && Number(x.ts || 0) >= now - SNAPSHOT_TTL_MS).slice(0, 80);
    const split = splitArrayByMode(clean);
    writeJson(SNAPSHOT_KEY_BET, split.bet.slice(0, 80));
    writeJson(SNAPSHOT_KEY_CRYPTO, split.crypto.slice(0, 80));
  }
  function snapshotRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count).filter(s => {
      return slotHasUserEntry(s, mode) || s.status === "win" || s.status === "loss";
    });
  }
  function makeReportSvg(mode, state) {
    const isCrypto = mode === "crypto";
    const rows = snapshotRowsForMode(mode, state);
    const sum = slotSummary(mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet);
    const title = isCrypto ? "KRİPTO İŞLEM RAPORU" : "BAHİS / MAÇ RAPORU";
    const date = formatDateTime(Date.now());
    const safeRows = rows.slice(0, 20);
    const rowHeight = 34;
    const height = 230 + Math.max(1, safeRows.length) * rowHeight;
    const line = (txt, x, y, size = 17, fill = "#ffffff", weight = 800) => `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(txt)}</text>`;
    const rowSvg = (safeRows.length ? safeRows : [{ name: "Henüz rapora girecek satır yok", stake: "", odds: "", status: "pending", pnl: 0 }]).map((s, idx) => {
      const y = 196 + idx * rowHeight;
      const status = s.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : s.status === "loss" ? (isCrypto ? "KAYIP" : "KAYBETTİ") : "BEKLİYOR";
      const pnl = Number(s.pnl || 0);
      const color = pnl >= 0 ? "#22c55e" : "#ef4444";
      return `
        <rect x="42" y="${y - 22}" width="996" height="29" rx="9" fill="${idx % 2 ? '#111827' : '#0b1220'}" opacity=".92"/>
        ${line(String(idx + 1).padStart(2, '0'), 58, y, 13, "#94a3b8", 900)}
        ${line(String(s.name || (isCrypto ? "Kripto işlem" : "Bahis / maç")).slice(0, 44), 108, y, 14, "#f8fafc", 900)}
        ${line(money(s.stake || 0), 560, y, 14, "#e5e7eb", 900)}
        ${line(isCrypto ? money(s.odds || 0) : String(s.odds || "-"), 705, y, 14, "#e5e7eb", 900)}
        ${line(status, 825, y, 13, status === "BEKLİYOR" ? "#fbbf24" : color, 950)}
        ${line(signedMoney(pnl), 940, y, 14, color, 950)}`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="${isCrypto ? '#0f172a' : '#1f1300'}"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="${height}" rx="34" fill="url(#bg)"/>
        <rect x="28" y="28" width="1024" height="${height - 56}" rx="28" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="2"/>
        ${line("BULTEN · ROLLING", 48, 74, 18, "#fbbf24", 950)}
        ${line(title, 48, 112, 34, "#ffffff", 950)}
        ${line(date, 48, 143, 15, "#94a3b8", 850)}
        ${line("Kayıt: " + safeRows.length, 48, 174, 15, "#cbd5e1", 850)}
        ${line("W/L: " + sum.wins + " / " + sum.losses, 178, 174, 15, "#cbd5e1", 850)}
        ${line("Toplam K/Z: " + signedMoney(sum.pnl), 315, 174, 15, Number(sum.pnl) >= 0 ? "#22c55e" : "#ef4444", 950)}
        ${line("Not: Görsel rapor 7 gün saklanır.", 740, 174, 13, "#94a3b8", 750)}
        <rect x="42" y="184" width="996" height="1" fill="rgba(255,255,255,.16)"/>
        ${rowSvg}
      </svg>`;
  }
  function createReportCard(mode, state) {
    const svg = makeReportSvg(mode, state);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const rows = snapshotRowsForMode(mode, state);
    const sum = slotSummary(mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet);
    const card = {
      id: "rp_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      ts: Date.now(),
      mode,
      title: mode === "crypto" ? "Kripto işlem raporu" : "Bahis / maç raporu",
      count: rows.length,
      pnl: Number(sum.pnl || 0),
      dataUrl
    };
    const all = loadReportCards();
    all.unshift(card);
    saveReportCards(all);
    return card;
  }
  function renderReportGallery(mode) {
    const rows = loadReportCards().filter(x => x.mode === mode).slice(0, 6);
    if (!rows.length) {
      return `<div class="v756-report-gallery empty"><span>Henüz rapor resmi yok.</span><b>Kayıtlı rapor görseli oluştuğunda burada görünür.</b></div>`;
    }
    return `<div class="v756-report-gallery">${rows.map(r => `
      <article class="v756-report-card" data-report-id="${escapeHtml(r.id)}">
        <img src="${r.dataUrl}" alt="${escapeHtml(r.title)}">
        <div>
          <b>${escapeHtml(r.title)}</b>
          <span>${escapeHtml(formatDateTime(r.ts))} · ${r.count} satır · <em class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${signedMoney(r.pnl)}</em></span>
        </div>
        <button type="button" data-report-download="${escapeHtml(r.id)}"><i class="fa-solid fa-download"></i></button>
        <button type="button" data-report-delete="${escapeHtml(r.id)}"><i class="fa-solid fa-trash"></i></button>
      </article>`).join("")}</div>`;
  }
  function downloadReportCard(id) {
    const card = loadReportCards().find(x => x.id === id);
    if (!card) return;
    const fallback = () => {
      const a = document.createElement("a");
      a.href = card.dataUrl;
      a.download = `bulten-${card.mode}-rapor-${new Date(card.ts).toISOString().slice(0,10)}.svg`;
      document.body.appendChild(a); a.click(); a.remove();
    };
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1080;
        canvas.height = img.naturalHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (!blob) return fallback();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bulten-${card.mode}-rapor-${new Date(card.ts).toISOString().slice(0,10)}.png`;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }, "image/png");
      };
      img.onerror = fallback;
      img.src = card.dataUrl;
    } catch { fallback(); }
  }
  function ensureQuickPlans(state) {
    if (!state.quickPlans || typeof state.quickPlans !== "object") state.quickPlans = {};
    if (!state.quickPlans.bet) state.quickPlans.bet = { ...(state.quickPlan || {}), start: state.quickPlan?.start ?? 100, target: state.quickPlan?.target ?? "", currentOverride: state.quickPlan?.currentOverride ?? "" };
    if (!state.quickPlans.crypto) state.quickPlans.crypto = { start: state.quickPlan?.start ?? 100, target: "", currentOverride: "" };
    return state.quickPlans;
  }
  function getModeQuickPlan(state, mode) {
    const plans = ensureQuickPlans(state);
    const m = mode === "crypto" ? "crypto" : "bet";
    if (!plans[m] || typeof plans[m] !== "object") plans[m] = { start: 100, target: "", currentOverride: "" };
    return plans[m];
  }
  function getPlanNumbers(state, totalPnl, mode = "bet") {
    const plan = getModeQuickPlan(state, mode);
    const start = Number.isFinite(Number(plan.start)) ? Number(plan.start) : 100;
    const target = plan.target === "" || plan.target === null || plan.target === undefined ? 0 : Number(plan.target || 0);
    const targetSelfPnl = typeof v812TargetRealizedPnl === "function" ? v812TargetRealizedPnl(mode) : 0;
    const targetOwnPnl = Number(targetSelfPnl || 0);
    const autoCurrent = start + targetOwnPnl;
    const hasOverrideValue = plan.currentOverride !== "" && plan.currentOverride !== null && plan.currentOverride !== undefined && Number.isFinite(Number(plan.currentOverride));
    const manualCurrent = hasOverrideValue ? Number(plan.currentOverride) : autoCurrent;
    const hasManualCurrent = hasOverrideValue;
    const current = hasManualCurrent ? manualCurrent : autoCurrent;
    const pnl = current - start;
    const growth = growthPct(pnl, start);
    const pct = target > start ? Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100)) : progressPct(current, target || start);
    const done = target > 0 && current >= target;
    const remaining = target > 0 ? Math.max(0, target - current) : 0;
    const stateLabel = done ? "Hedefe Ulaşıldı" : target > 0 ? (pnl >= 0 ? "Devam Ediyor" : "Geride") : "Hedef Bekliyor";
    return { start, target, current, autoCurrent, pnl, growth, pct, done, hasManualCurrent, remaining, stateLabel, mode: mode === "crypto" ? "crypto" : "bet" };
  }
  function addTargetLogRecord(state, totalPnl, mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const plan = getPlanNumbers(state, totalPnl, m);
    if (!plan.target) return { ok: false, message: "Önce hedef tutarı gir." };
    if (!plan.done) return { ok: false, message: "Güncel bakiye hedefe ulaşmadan yeşil onay verilemez." };
    const rows = loadTargetLog();
    rows.unshift({
      id: "rt_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      mode: m,
      ts: Date.now(),
      kind: "targetComplete",
      label: "Hedef",
      start: plan.start,
      target: plan.target,
      current: plan.current,
      pnl: plan.pnl,
      growth: plan.growth
    });
    saveTargetLog(rows);
    const quick = getModeQuickPlan(state, m);
    quick.start = Number(plan.current.toFixed(2));
    quick.target = "";
    quick.currentOverride = "";
    return { ok: true, plan };
  }
  function upsertTargetItemLogRecord(mode, item, result) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (!item || !item.id) return "";
    const state = loadState();
    const pnl = Number(v810TargetItemProfit(item, m).value || 0);
    const plan = getPlanNumbers(state, 0, m);
    const id = cleanText(item.targetLogId || "") || `ti_${m}_${String(item.id || "")}`;
    const status = result === "stop" || result === "loss" ? "loss" : "win";
    const row = {
      id,
      mode: m,
      ts: Number(item.closedTs || Date.now()),
      kind: "targetItem",
      itemId: String(item.id || ""),
      label: cleanText(item.name || "") || (m === "crypto" ? "Kripto işlem" : "Bahis"),
      result: status,
      resultLabel: status === "loss" ? "ZARAR" : (m === "crypto" ? "KÂR" : "KAZANDI"),
      start: Number(plan.start || 0),
      target: Number(plan.target || 0),
      current: Number((Number(plan.start || 0) + pnl).toFixed(2)),
      pnl,
      growth: growthPct(pnl, Number(plan.start || 0))
    };
    const rows = loadTargetLog();
    const idx = rows.findIndex(r => String(r.id || "") === String(id));
    if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
    else rows.unshift(row);
    saveTargetLog(rows);
    item.targetLogId = id;
    item.closedTs = row.ts;
    return id;
  }
  function addHistoryRecord(mode, slot, index) {
    if (!slot || (slot.status !== "win" && slot.status !== "loss")) return;
    const h = loadHistory();
    const now = Date.now();
    const rec = {
      id: "rh_" + now + "_" + Math.random().toString(36).slice(2),
      mode,
      ts: now,
      row: index + 1,
      name: String(slot.name || "").trim() || (mode === "crypto" ? "Kripto işlem" : "Bahis / maç"),
      stake: Number(slot.stake || 0),
      odds: Number(slot.odds || 0),
      status: slot.status,
      pnl: Number(slot.pnl || 0),
      entryPrice: slot.entryPrice || "",
      liquidationPrice: slot.liquidationPrice || "",
      leverage: slot.leverage || 1,
      takeProfits: Array.isArray(slot.takeProfits) ? slot.takeProfits.map(tp => ({ ...tp })) : []
    };
    h[mode].unshift(rec);
    saveHistory(h);
    slot.historyId = rec.id;
    slot.historyStatus = slot.status;
  }
  function historyFilterLabel(filter) {
    return ({ today: "Bugün", yesterday: "Dün", week: "Bu Hafta", month: "Bu Ay", year: "Bu Yıl", twoYears: "Son 2 Yıl", all: "Tümü" })[filter] || "Bugün";
  }
  function filterHistoryRows(rows, filter) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    const tsStart = start.getTime();
    if (filter === "today") return rows.filter(r => r.ts >= tsStart);
    if (filter === "yesterday") {
      const y0 = tsStart - 86400000;
      return rows.filter(r => r.ts >= y0 && r.ts < tsStart);
    }
    if (filter === "week") {
      const d = new Date(start);
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "month") {
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "threeMonths") return rows.filter(r => r.ts >= Date.now() - 92 * 86400000);
    if (filter === "sixMonths") return rows.filter(r => r.ts >= Date.now() - 183 * 86400000);
    if (filter === "year") {
      const d = new Date(start.getFullYear(), 0, 1);
      return rows.filter(r => r.ts >= d.getTime());
    }
    if (filter === "twoYears") return rows.filter(r => r.ts >= Date.now() - 730 * 86400000);
    return rows;
  }
  function formatDateTime(ts) {
    try {
      return new Date(Number(ts || Date.now())).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
    } catch { return "–"; }
  }
  function renderHistoryModal() {
    if (!HISTORY_OPEN_MODE) return "";
    const mode = HISTORY_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const all = loadHistory()[mode] || [];
    const rows = filterHistoryRows(all, HISTORY_FILTER);
    const pnl = rows.reduce((s, r) => s + Number(r.pnl || 0), 0);
    const wins = rows.filter(r => r.status === "win").length;
    const losses = rows.filter(r => r.status === "loss").length;
    const filters = ["today","yesterday","week","month","year","twoYears","all"].map(f => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${historyFilterLabel(f)}</button>`).join("");
    const body = rows.length ? rows.map(r => `
      <tr>
        <td>${escapeHtml(formatDateTime(r.ts))}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${money(r.stake)}</td>
        <td>${isCrypto ? money(r.odds || 0) : escapeHtml(String(r.odds || 0))}</td>
        <td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td>
        <td><div class="v757-history-pnl-cell"><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</span><button type="button" class="v757-history-delete" data-history-delete="${mode}:${escapeHtml(r.id || "")}" title="Bu LOG kaydını sil"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="v512-history-empty">Bu filtrede geçmiş kaydı yok.</td></tr>`;
    return `
      <div class="v512-history-overlay">
        <div class="v512-history-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO İŞLEM GEÇMİŞİ" : "BAHİS GEÇMİŞİ"}</b>
              <span>${historyFilterLabel(HISTORY_FILTER)} · ${rows.length} kayıt · ${wins} kazanç / ${losses} kayıp · K/Z ${money(pnl)}</span>
            </div>
            <button type="button" data-history-close>×</button>
          </div>
          <div class="v512-history-filters">${filters}</div>
          <div class="v512-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z</th></tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }


  function renderTargetHistoryModal() {
    if (!TARGET_HISTORY_OPEN_MODE) return "";
    const mode = TARGET_HISTORY_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const all = loadTargetLog().filter(r => (r.mode || "bet") === mode);
    const rows = filterHistoryRows(all, HISTORY_FILTER);
    const pnl = rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const modeLabel = isCrypto ? "Kripto" : "Bahis";
    const targetFilters = [
      ["all", "Tümü"],
      ["today", "Bugün"],
      ["week", "1 Hafta"],
      ["month", "1 Ay"],
      ["threeMonths", "3 Ay"],
      ["sixMonths", "6 Ay"],
      ["year", "1 Yıl"]
    ];
    const filters = targetFilters.map(([f, label]) => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${label}</button>`).join("") + `<button type="button" class="v985-date-filter" disabled>Tarih Seç</button>`;
    const body = rows.length ? `
      <table class="v512-history-table v985-target-history-table v1037-target-history-table">
        <thead><tr><th>Tarih / Saat</th><th>Kayıt</th><th>Başlangıç</th><th>Hedef</th><th>Güncel</th><th>K/Z</th><th>Sil</th></tr></thead>
        <tbody>${rows.map(r => {
          const isItem = cleanText(r.kind || "") === "targetItem";
          const rowLabel = isItem ? (cleanText(r.label || "") || (isCrypto ? "Kripto işlem" : "Bahis")) : (cleanText(r.label || "") || "Hedef");
          const resultLabel = cleanText(r.resultLabel || "") || (Number(r.pnl || 0) < 0 ? "ZARAR" : (isCrypto ? "KÂR" : "KAZANDI"));
          return `
          <tr>
            <td>${escapeHtml(formatDateTime(r.ts))}</td>
            <td><span class="v1037-target-history-label ${isItem ? "item" : "target"}">${escapeHtml(rowLabel)}</span>${isItem ? `<em class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${escapeHtml(resultLabel)}</em>` : ""}</td>
            <td>${Number(r.start || 0) ? money(r.start) : "-"}</td>
            <td>${r.target ? money(r.target) : "-"}</td>
            <td>${money(r.current ?? (Number(r.start || 0) + Number(r.pnl || 0)))}</td>
            <td><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${signedMoney(r.pnl)}</span></td>
            <td><button type="button" class="v757-history-delete" data-target-history-delete="${escapeHtml(r.id || "")}" title="Bu kasa hedefi kaydını sil"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`;
        }).join("")}</tbody>
      </table>` : `<div class="v512-history-empty v985-target-history-empty">Seçilen tarih aralığında kasa hedefi geçmiş kaydı yok.</div>`;
    return `
      <div class="v512-history-overlay v985-target-history-overlay" data-target-history-overlay>
        <section class="v512-history-modal v985-target-history-modal ${mode}" onclick="event.stopPropagation()">
          <div class="v512-history-head v985-target-history-head">
            <div>
              <b>Geçmiş</b>
              <span>${modeLabel} kasa hedefi · ${historyFilterLabel(HISTORY_FILTER)} · ${rows.length} kayıt · K/Z ${signedMoney(pnl)}</span>
            </div>
            <button type="button" data-target-history-close>×</button>
          </div>
          <div class="v512-history-filters v985-target-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v985-target-history-body">${body}</div>
        </section>
      </div>`;
  }

  function renderConfirmDialog() {
    if (!CONFIRM_DIALOG) return "";
    const tone = CONFIRM_DIALOG.tone || "warn";
    return `
      <div class="v757-confirm-overlay">
        <section class="v757-confirm-modal ${tone}">
          <button type="button" class="v757-confirm-x" data-confirm-no>×</button>
          <div class="v757-confirm-icon"><i class="fa-solid ${tone === "danger" ? "fa-triangle-exclamation" : "fa-circle-check"}"></i></div>
          <div>
            <b>${escapeHtml(CONFIRM_DIALOG.title || "İşlem Onayı")}</b>
            <p>${escapeHtml(CONFIRM_DIALOG.message || "Bu işlemi onaylıyor musun?")}</p>
            ${CONFIRM_DIALOG.detail ? `<span>${escapeHtml(CONFIRM_DIALOG.detail)}</span>` : ""}
          </div>
          <div class="v757-confirm-actions">
            <button type="button" class="ghost" data-confirm-no>İptal</button>
            <button type="button" class="ok" data-confirm-yes>${escapeHtml(CONFIRM_DIALOG.confirmText || "Onayla")}</button>
          </div>
        </section>
      </div>`;
  }

  function ensureQuickTemplates(state) {
    if (!state.quickTemplates || typeof state.quickTemplates !== "object") state.quickTemplates = {};
    if (!state.quickTemplates.bet || typeof state.quickTemplates.bet !== "object") state.quickTemplates.bet = { stake: "", odds: "", name: "" };
    if (!state.quickTemplates.crypto || typeof state.quickTemplates.crypto !== "object") state.quickTemplates.crypto = { stake: "", odds: "", name: "" };
    if (state.quickTemplates.bet.odds === undefined || state.quickTemplates.bet.odds === null) state.quickTemplates.bet.odds = "";
    if (state.quickTemplates.crypto.odds === undefined || state.quickTemplates.crypto.odds === null) state.quickTemplates.crypto.odds = "";
  }
  function progressPct(current, target) {
    const t = Number(target || 0);
    if (!t) return 0;
    return Math.max(0, Math.min(100, (Number(current || 0) / t) * 100));
  }
  function cleanText(value) { return String(value || "").trim(); }
  function isFinishedStatus(status) { return status === "win" || status === "loss"; }
  function slotHasUserEntry(slot, mode) {
    if (!slot) return false;
    if (mode === "crypto") return !!cleanText(slot.name);
    if (cleanText(slot.name)) return true;
    return Array.isArray(slot.extraMatches) && slot.extraMatches.some(m => cleanText(m?.name));
  }
  function activeRowsForMode(mode, state) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    return list.slice(0, count)
      .map((slot, index) => ({ ...slot, index }))
      .filter(s => slotHasUserEntry(s, mode));
  }
  function pendingRowsForMode(mode, state) {
    return activeRowsForMode(mode, state).filter(s => !isFinishedStatus(s.status));
  }
  function modeStorageLabel(mode) {
    return mode === "crypto" ? "Kripto kayıt alanı" : "Bahis kayıt alanı";
  }
  function modeSeparationText(mode) {
    return "";
  }
  function modeUiCounts(mode, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const slots = m === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    const history = loadHistory()[m] || [];
    const today = filterHistoryRows(history, "today");
    const sum = slotSummary(slots);
    const roll = rollingSummary(m);
    return {
      active: pendingRowsForMode(m, state).length,
      entered: activeRowsForMode(m, state).length,
      closed: sum.settled,
      today: today.length,
      pnl: Number(sum.pnl || 0) + Number(roll.pnlTotal || 0)
    };
  }
  function canAutoAttachToCombo(row) {
    return !!row && !!cleanText(row.name) && !Number(row.stake || 0);
  }
  function betCouponGroup(slot) {
    const raw = cleanText(slot?.couponGroup || slot?.couponNo || "");
    const n = Number(raw || 0);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? String(n) : "";
  }
  function betKind(slot) {
    return betCouponGroup(slot) ? "combo" : "single";
  }
  function v1073NormalizeBetMatchResult(value) {
    const raw = cleanText(value || "").toLowerCase();
    if (raw === "loss" || raw === "lost" || raw === "lose" || raw === "kaybetti" || raw === "kayıp" || raw === "zarar") return "loss";
    if (raw === "win" || raw === "won" || raw === "kazandı" || raw === "kazanc" || raw === "kazanç" || raw === "kar" || raw === "kâr") return "win";
    return "";
  }
  function v1073RowMatchStatus(row, index = 0) {
    if (!row || typeof row !== "object") return "";
    const idx = Math.max(0, Number(index || 0));
    const combo = Array.isArray(row.comboResults) ? row.comboResults : [];
    return v1073NormalizeBetMatchResult(combo[idx])
      || v1073NormalizeBetMatchResult(row.matchResults?.[idx])
      || v1073NormalizeBetMatchResult(row.status)
      || v1073NormalizeBetMatchResult(row.result)
      || v1073NormalizeBetMatchResult(row.res);
  }
  function normalizeBetCouponGroups(slots) {
    const list = Array.isArray(slots) ? slots : [];
    list.forEach((slot, index) => {
      if (!slot || slot.type !== "bet") return;
      slot.id = index + 1;
      if (!slot.couponGroup && slot.betKind === "combo") slot.couponGroup = "1";
      const group = betCouponGroup(slot);
      slot.couponGroup = group;
      slot.betKind = group ? "combo" : "single";
      if (!group) slot.comboResults = [];
    });
    const groups = {};
    list.forEach((slot, index) => {
      const group = betCouponGroup(slot);
      if (!group) return;
      if (!groups[group]) groups[group] = [];
      groups[group].push(index);
    });
    Object.entries(groups).forEach(([group, indices]) => {
      if (!indices || indices.length < 2) return;
      const first = Math.min(...indices);
      const last = Math.max(...indices);
      for (let i = first; i <= last; i++) {
        if (!list[i]) list[i] = createSlot("bet", i);
        list[i].type = "bet";
        list[i].id = i + 1;
        list[i].couponGroup = group;
        list[i].betKind = "combo";
      }
    });
    return list;
  }
  const normalizeBetComboRanges = normalizeBetCouponGroups;
  function buildExplicitComboRow(rows = []) {
    const ordered = (Array.isArray(rows) ? rows : []).filter(Boolean).sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    const first = ordered[0] || {};
    const stakeRow = ordered.find(row => Number(row.stake || 0));
    const comboResults = Array.isArray(first.comboResults) ? first.comboResults.slice() : [];
    ordered.forEach((row, idx) => {
      const status = v1073NormalizeBetMatchResult(comboResults[idx]) || v1073NormalizeBetMatchResult(row?.comboResults?.[0]) || v1073RowMatchStatus(row, 0);
      if (status) comboResults[idx] = status;
    });
    const rest = ordered.slice(1).map((row, idx) => ({
      name: cleanText(row.name),
      odds: row.odds,
      sourceIndex: row.index,
      status: comboResults[idx + 1] || v1073RowMatchStatus(row, 0)
    }));
    return {
      ...first,
      stake: stakeRow ? stakeRow.stake : first.stake,
      autoCombo: false,
      manualCombo: true,
      autoComboRows: ordered.map(row => row.index),
      extraMatches: rest,
      comboResults
    };
  }
  function buildAutoComboRow(base, preRows = [], postRows = []) {
    const ordered = [...(preRows || []), base, ...(postRows || [])].filter(Boolean);
    const first = ordered[0] || base;
    const comboResults = Array.isArray(base?.comboResults) ? base.comboResults.slice() : [];
    ordered.forEach((row, idx) => {
      const status = v1073NormalizeBetMatchResult(comboResults[idx]) || v1073NormalizeBetMatchResult(row?.comboResults?.[0]) || v1073RowMatchStatus(row, 0);
      if (status) comboResults[idx] = status;
    });
    const rest = ordered.slice(1).map((row, idx) => ({
      name: cleanText(row.name),
      odds: row.odds,
      sourceIndex: row.index,
      status: comboResults[idx + 1] || v1073RowMatchStatus(row, 0)
    }));
    return {
      ...base,
      name: cleanText(first.name),
      odds: first.odds,
      autoCombo: true,
      autoComboRows: ordered.map(row => row.index),
      extraMatches: rest,
      comboResults
    };
  }
  function getSlotMatches(slot) {
    const matches = [];
    const comboResults = Array.isArray(slot?.comboResults) ? slot.comboResults : [];
    const baseStatus = v1073NormalizeBetMatchResult(comboResults[0]) || v1073RowMatchStatus(slot, 0);
    if (cleanText(slot?.name)) matches.push({ name: cleanText(slot.name), odds: slot.odds, index: 0, status: baseStatus });
    if (Array.isArray(slot?.extraMatches)) {
      slot.extraMatches.forEach((m, idx) => {
        if (!cleanText(m?.name)) return;
        const matchStatus = v1073NormalizeBetMatchResult(comboResults[idx + 1]) || v1073NormalizeBetMatchResult(m?.status || m?.result || m?.res);
        matches.push({ name: cleanText(m.name), odds: m.odds, index: idx + 1, sourceIndex: m.sourceIndex, status: matchStatus });
      });
    }
    return matches;
  }
  function getBetCouponGroups(state) {
    const source = Array.isArray(state?.modeSlots?.bet) ? state.modeSlots.bet : [];
    normalizeBetCouponGroups(source);
    const rows = pendingRowsForMode("bet", state).sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    const singles = [];
    const coupons = [];
    const consumed = new Set();

    const grouped = {};
    rows.forEach(row => {
      const group = betCouponGroup(row);
      if (!group) return;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(row);
    });

    Object.entries(grouped).forEach(([group, groupRows]) => {
      const ordered = groupRows
        .filter(Boolean)
        .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
      ordered.forEach(row => consumed.add(row.index));
      if (ordered.length >= 2) {
        const comboRow = buildExplicitComboRow(ordered);
        comboRow.couponGroup = group;
        coupons.push({
          id: Number(group),
          group,
          label: `Kupon ${group}`,
          slotIndex: Number(ordered[0].index || 0),
          row: comboRow,
          rows: ordered,
          matches: getSlotMatches(comboRow)
        });
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || consumed.has(row.index)) continue;

      const manualMatchCount = getSlotMatches(row).length;
      if (manualMatchCount > 1) {
        coupons.push({
          id: Number(row.index || 0) + 1,
          group: "manual-" + (Number(row.index || 0) + 1),
          label: "Kombine Kupon",
          slotIndex: Number(row.index || 0),
          row,
          rows: [row],
          matches: getSlotMatches(row)
        });
        consumed.add(row.index);
        continue;
      }

      singles.push(row);
      consumed.add(row.index);
    }

    coupons.sort((a, b) => Number(a.slotIndex || 0) - Number(b.slotIndex || 0));
    singles.sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    return { singles, coupons, rows };
  }
  function getBetCouponForSlot(state, slotIndex) {
    const idx = Number(slotIndex || 0);
    return getBetCouponGroups(state).coupons.find(coupon => {
      if (Number(coupon?.slotIndex ?? -1) === idx) return true;
      return Array.isArray(coupon?.rows) && coupon.rows.some(row => Number(row?.index ?? -1) === idx);
    }) || null;
  }
  function getBetCouponMatchIndex(coupon, slotIndex) {
    const idx = Number(slotIndex || 0);
    const rows = Array.isArray(coupon?.rows) ? coupon.rows : [];
    const rowIndex = rows.findIndex(row => Number(row?.index ?? -1) === idx);
    if (rowIndex >= 0) return rowIndex;
    if (Number(coupon?.slotIndex ?? -1) === idx) return 0;
    return 0;
  }
  function getBetComboStatusLookup(state) {
    const lookup = {};
    getBetCouponGroups(state).coupons.forEach(coupon => {
      const matches = Array.isArray(coupon.matches) ? coupon.matches : [];
      const rows = Array.isArray(coupon.rows) && coupon.rows.length ? coupon.rows : [coupon.row].filter(Boolean);
      rows.forEach((row, idx) => {
        const status = matches[idx]?.status || '';
        if (status === 'win' || status === 'loss') lookup[Number(row.index || 0)] = status;
      });
    });
    return lookup;
  }
  function rowBetTotals(row) {
    const matches = getSlotMatches(row);
    const stake = Number(row?.stake || 0);
    let completeOdds = true;
    const odds = matches.reduce((p, m) => {
      const o = Number(m.odds || 0);
      if (!o) completeOdds = false;
      return p * (o || 1);
    }, 1);
    const possibleWin = stake && completeOdds && matches.length ? stake * odds : 0;
    return { stake, odds: completeOdds && matches.length ? odds : 0, possibleWin, completeOdds, missing: !cleanText(row?.name) || !stake || !completeOdds };
  }
  function couponTotals(rows) {
    const row = Array.isArray(rows) ? rows[0] : rows;
    const t = rowBetTotals(row || {});
    return { stake: t.stake, odds: t.odds, possibleReturn: t.possibleWin, netProfit: t.possibleWin ? t.possibleWin - t.stake : 0 };
  }
  function v810ShortLabel(value, limit = 30) {
    const raw = cleanText(value);
    if (!raw) return "–";
    return raw.length > limit ? raw.slice(0, limit - 1) + "…" : raw;
  }
  function loadTargetItems() {
    const legacy = readJson(TARGET_ITEMS_KEY, {});
    const hasBet = storageHas(TARGET_ITEMS_KEY_BET);
    const hasCrypto = storageHas(TARGET_ITEMS_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_ITEMS_KEY_BET, []) : (Array.isArray(legacy.bet) ? legacy.bet : []);
    const crypto = hasCrypto ? readJson(TARGET_ITEMS_KEY_CRYPTO, []) : (Array.isArray(legacy.crypto) ? legacy.crypto : []);
    const clean = {
      bet: Array.isArray(bet) ? bet : [],
      crypto: Array.isArray(crypto) ? crypto : []
    };
    if (!hasBet && clean.bet.length) writeJson(TARGET_ITEMS_KEY_BET, clean.bet.slice(-80));
    if (!hasCrypto && clean.crypto.length) writeJson(TARGET_ITEMS_KEY_CRYPTO, clean.crypto.slice(-80));
    return clean;
  }
  function saveTargetItems(data) {
    const bet = Array.isArray(data?.bet) ? data.bet.slice(-80) : [];
    const crypto = Array.isArray(data?.crypto) ? data.crypto.slice(-80) : [];
    writeJson(TARGET_ITEMS_KEY_BET, bet);
    writeJson(TARGET_ITEMS_KEY_CRYPTO, crypto);
  }
  function loadTargetClosedPnl() {
    const legacy = readJson(TARGET_CLOSED_PNL_KEY, {});
    const hasBet = storageHas(TARGET_CLOSED_PNL_KEY_BET);
    const hasCrypto = storageHas(TARGET_CLOSED_PNL_KEY_CRYPTO);
    const bet = hasBet ? readJson(TARGET_CLOSED_PNL_KEY_BET, 0) : Number(legacy.bet || 0);
    const crypto = hasCrypto ? readJson(TARGET_CLOSED_PNL_KEY_CRYPTO, 0) : Number(legacy.crypto || 0);
    if (!hasBet && Number(bet || 0)) writeJson(TARGET_CLOSED_PNL_KEY_BET, Number(bet || 0));
    if (!hasCrypto && Number(crypto || 0)) writeJson(TARGET_CLOSED_PNL_KEY_CRYPTO, Number(crypto || 0));
    return { bet: Number(bet || 0), crypto: Number(crypto || 0) };
  }
  function saveTargetClosedPnl(data) {
    writeJson(TARGET_CLOSED_PNL_KEY_BET, Number(data?.bet || 0));
    writeJson(TARGET_CLOSED_PNL_KEY_CRYPTO, Number(data?.crypto || 0));
  }
  function addTargetClosedPnl(mode, amount) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const data = loadTargetClosedPnl();
    data[m] = Number(data[m] || 0) + Number(amount || 0);
    saveTargetClosedPnl(data);
  }
  function v810TargetItemId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function v810NumberOrBlank(value) {
    if (value === "" || value === undefined || value === null) return "";
    const n = Number(value);
    return Number.isFinite(n) ? n : "";
  }
  function v813NumberText(value, empty = "-") {
    const n = v810NumberOrBlank(value);
    return n === "" ? empty : String(n);
  }
  function v813MoneyOrDash(value, prefix = "") {
    const n = v810NumberOrBlank(value);
    if (n === "") return "–";
    return prefix + money(Math.abs(Number(n || 0)));
  }
  function v813CryptoTps(item) {
    const list = Array.isArray(item?.tps) ? item.tps : [];
    const cleaned = list.map((tp, idx) => ({
      target: cleanText(tp?.target || ""),
      profit: v810NumberOrBlank(tp?.profit),
      done: !!tp?.done,
      idx
    })).filter(tp => tp.target || tp.profit !== "" || tp.done);
    if (!cleaned.length && v810NumberOrBlank(item?.profit) !== "") {
      cleaned.push({ target: cleanText(item?.target || ""), profit: v810NumberOrBlank(item?.profit), done: cleanText(item?.result || "") === "tp", idx: 0 });
    }
    return cleaned;
  }
  function v811CryptoTps(item) { return v813CryptoTps(item); }
  function v813CryptoTpProfitTotal(item) {
    return v813CryptoTps(item).reduce((sum, tp) => tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
  }
  function v813CryptoTpDoneProfit(item) {
    return v813CryptoTps(item).reduce((sum, tp) => tp.done && tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
  }
  function v812BetLegs(item) {
    const list = Array.isArray(item?.legs) ? item.legs : [];
    const cleaned = list.map(leg => ({
      name: cleanText(leg?.name || ""),
      odds: v810NumberOrBlank(leg?.odds),
      result: cleanText(leg?.result || "")
    })).filter(leg => leg.name || leg.odds !== "" || leg.result);
    if (!cleaned.length && (cleanText(item?.name || "") || v810NumberOrBlank(item?.odds) !== "")) {
      cleaned.push({ name: cleanText(item?.name || ""), odds: v810NumberOrBlank(item?.odds), result: cleanText(item?.result || "") });
    }
    return cleaned.length ? cleaned : [{ name: "", odds: "", result: "" }];
  }
  function v812BetOddsProduct(item) {
    const legs = v812BetLegs(item).filter(leg => Number(leg.odds || 0) > 0);
    if (!legs.length) return 0;
    return legs.reduce((total, leg) => total * Number(leg.odds || 1), 1);
  }
  function v812BetPotential(item) {
    const stake = Number(item?.stake || 0);
    const odds = v812BetOddsProduct(item);
    if (!stake || !odds) return 0;
    return stake * odds;
  }
  function v812BetNet(item) {
    const stake = Number(item?.stake || 0);
    const result = cleanText(item?.result || "");
    if (result === "loss") return -Math.abs(stake || 0);
    if (result === "win") {
      const possible = v812BetPotential(item);
      return possible ? possible - stake : 0;
    }
    return 0;
  }
  function v811CryptoTpProfit(item) {
    const tps = v813CryptoTps(item);
    const values = tps.map(tp => v810NumberOrBlank(tp.profit)).filter(v => v !== "");
    if (!values.length) return { value: 0, source: "none", count: tps.length, profitCount: 0 };
    return { value: values.reduce((sum, v) => sum + Number(v || 0), 0), source: "manual", count: tps.length, profitCount: values.length };
  }
  function v812CryptoStopLoss(item) {
    const raw = v810NumberOrBlank(item?.stopLoss);
    return raw === "" ? 0 : Math.abs(Number(raw || 0));
  }
  function v812CryptoNet(item) {
    const result = cleanText(item?.result || "");
    if (result === "stop") return -v812CryptoStopLoss(item);
    if (result === "tp" || result === "win") return Number(v813CryptoTpProfitTotal(item) || 0);
    return Number(v813CryptoTpDoneProfit(item) || 0);
  }
  function v810TargetItemProfit(item, mode) {
    if (mode === "crypto") return { value: v812CryptoNet(item), source: item?.result || v813CryptoTpDoneProfit(item) ? "result" : "none" };
    return { value: v812BetNet(item), source: item?.result ? "result" : "none" };
  }
  function v812TargetRealizedPnl(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = loadTargetItems();
    const rows = (store[m] || []).filter(Boolean);
    const openPnl = rows.reduce((sum, item) => sum + Number(v810TargetItemProfit(item, m).value || 0), 0);
    const closed = loadTargetClosedPnl();
    return Number(closed[m] || 0) + openPnl;
  }
  function v812ResultBadge(item, mode) {
    const result = cleanText(item?.result || "");
    if (mode === "crypto") {
      if (result === "stop") return "STOP";
      if (result === "tp" || result === "win") return "Kâr";
      const tps = v813CryptoTps(item);
      const done = tps.filter(tp => tp.done).length;
      return done ? `TP ${done}/${tps.length || done}` : "Bekliyor";
    }
    if (!result) return "Bekliyor";
    return result === "loss" ? "Kaybetti" : "Kazandı";
  }
  function v812BetTitle(item) {
    const legs = v812BetLegs(item);
    if (legs.length <= 1) return "Tek";
    return `Kombine ${legs.length} maç`;
  }
  function v812BetInfo(item) {
    const legs = v812BetLegs(item);
    const odds = v812BetOddsProduct(item);
    const stake = Number(item?.stake || 0);
    const oddsText = odds ? odds.toFixed(2) : "-";
    const stakeText = stake ? money(stake) : "Tutar -";
    if (legs.length <= 1) return `${oddsText} · ${stakeText}`;
    return `${legs.length} maç · ${oddsText} · ${stakeText}`;
  }
  function v812BetLegText(item) {
    return v812BetLegs(item).map((leg, i) => {
      const name = cleanText(leg.name || "") || `Maç ${i + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds || 0).toFixed(2) : "-";
      return `${name} (${odds})`;
    }).join(" · ");
  }
  function v813BetLegRowsHtml(item) {
    return v812BetLegs(item).map((leg, i) => {
      const name = cleanText(leg.name || "") || `Maç ${i + 1}`;
      const odds = Number(leg.odds || 0) ? Number(leg.odds || 0).toFixed(2) : "-";
      const result = cleanText(leg.result || "");
      const id = escapeHtml(item?.id || "");
      return `<div class="v813-bet-match-line v819-bet-match-line v822-bet-match-line ${result ? "done " + result : ""}">
        <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <b>${escapeHtml(odds)}</b>
        <div class="v819-leg-actions">
          <button type="button" class="leg-win ${result === "win" ? "active" : ""}" data-target-bet-leg-result="bet:${id}:${i}:win" title="Maç kazandı"><i class="fa-solid fa-check"></i></button>
          <button type="button" class="leg-loss ${result === "loss" ? "active" : ""}" data-target-bet-leg-result="bet:${id}:${i}:loss" title="Maç kaybetti"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    }).join("");
  }
  function v813CryptoTpRowsHtml(item) {
    const tps = v813CryptoTps(item);
    if (!tps.length) return "";
    return tps.map((tp, i) => {
      const isDone = cleanText(item?.result || "") === "tp" || !!tp.done;
      const profit = tp.profit !== "" ? money(Number(tp.profit || 0)) : "$0.00";
      return `<div class="v813-crypto-detail-line v814-crypto-detail-line v815-crypto-detail-line v1032-crypto-detail-line tp ${isDone ? "done" : ""}">
        <div class="v1032-crypto-tp-summary">
          <span class="tp-target"><b>TP${i + 1}:</b> <em>${escapeHtml(tp.target || "-")}</em></span>
          <span class="tp-profit"><b>Kazanç:</b> <em>${escapeHtml(profit)}</em></span>
        </div>
        <button type="button" class="tp-check v815-result-btn ${isDone ? "active" : ""}" data-target-self-tp-done="crypto:${escapeHtml(item.id || "")}:${i}" title="Kazanç"><i class="fa-solid fa-check"></i></button>
      </div>`;
    }).join("");
  }
  function v813CryptoStopRowHtml(item) {
    const stopRaw = cleanText(item?.stop || "");
    const loss = v812CryptoStopLoss(item);
    if (!stopRaw && !loss) return "";
    const stop = stopRaw || "-";
    const active = cleanText(item?.result || "") === "stop";
    return `<div class="v813-crypto-detail-line v814-crypto-detail-line v815-crypto-detail-line v1033-crypto-detail-line stop ${active ? "done" : ""}">
      <div class="v1033-crypto-stop-summary">
        <span class="stop-target"><b>STOP:</b> <em>${escapeHtml(stop)}</em></span>
        <span class="stop-loss"><b>Zarar:</b> <em>${loss ? "-" + money(loss) : "-$0.00"}</em></span>
      </div>
      <button type="button" class="stop-x v815-result-btn ${active ? "active" : ""}" data-target-self-result="crypto:${escapeHtml(item.id || "")}:stop" title="Kaybetti"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }
  function v814EntryText(item) {
    const entry = cleanText(item?.entry || item?.entryPrice || "");
    return entry || "-";
  }
  function v810TargetSelfData(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = loadTargetItems();
    const rows = (store[m] || []).filter(Boolean);
    if (m === "crypto") {
      const details = rows.slice(-8).reverse().map(item => {
        const result = cleanText(item.result || "");
        return `<li class="v812-target-detail-row v813-target-detail-row v814-target-detail-row crypto ${result ? "done " + result : ""}" data-target-self-row="${escapeHtml(item.id || "")}">
          <div class="v814-crypto-detail-head v819-crypto-detail-head v1032-crypto-detail-head"><span title="${escapeHtml(cleanText(item.name || "") || "İşlem")}">${escapeHtml(cleanText(item.name || "") || "İşlem")}</span><button type="button" class="photo" data-target-self-photo="${m}:${escapeHtml(item.id || "")}" title="İşlem fotoğrafı"><i class="fa-solid fa-camera"></i></button><button type="button" class="v1032-crypto-delete" data-target-self-delete="${m}:${escapeHtml(item.id || "")}" title="Çıktıyı temizle"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="v814-crypto-meta-grid v1032-crypto-meta-grid"><span class="stake"><em>Tutar:</em> <b>${Number(item.stake || 0) ? money(item.stake) : "-"}</b></span><span class="entry"><em>Giriş:</em> <b>${escapeHtml(v814EntryText(item))}</b></span></div>
          <div class="v813-crypto-lines v814-crypto-lines v1032-crypto-lines">${v813CryptoTpRowsHtml(item)}${v813CryptoStopRowHtml(item)}</div>
        </li>`;
      }).join("");
      return { mode: m, hasRows: rows.length > 0, summary: "", sub: "", details };
    }
    const details = rows.slice(-8).reverse().map(item => {
      const result = cleanText(item.result || "");
      const legs = v812BetLegs(item);
      const odds = v812BetOddsProduct(item);
      const possibleReturn = v812BetPotential(item);
      const stake = Number(item?.stake || 0);
      const typeClass = legs.length > 1 ? "combo" : "single";
      const title = v812BetTitle(item);
      const oddsText = odds ? odds.toFixed(2) : "-";
      const stakeText = stake ? money(stake) : "-";
      const payoutTotal = possibleReturn && stake ? possibleReturn : 0;
      const payoutTotalText = payoutTotal ? money(payoutTotal) : "-";
      return `<li class="v812-target-detail-row v813-target-detail-row v814-target-detail-row v835-bet-detail-row v1026-bet-detail-row v1027-bet-detail-row v1028-bet-detail-row v1029-bet-detail-row bet ${typeClass} ${result ? "done " + result : ""}" data-target-self-row="${escapeHtml(item.id || "")}">
        <div class="v813-detail-head v814-bet-detail-head v821-bet-detail-head v835-bet-detail-head v1026-bet-detail-head"><span class="v1026-bet-type-label ${typeClass}" title="${escapeHtml(title)}">${escapeHtml(title)}</span><button type="button" class="photo" data-target-self-photo="${m}:${escapeHtml(item.id || "")}" title="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button></div>
        <div class="v813-bet-match-list v814-bet-match-list v822-bet-match-list v835-bet-match-list">${v813BetLegRowsHtml(item)}</div>
        <div class="v819-target-card-footer v821-target-card-footer v822-target-card-footer v1027-bet-detail-footer v1028-bet-detail-footer v1029-bet-detail-footer bet">
          <div class="v835-bet-detail-meta v1026-bet-detail-meta v1027-bet-detail-meta v1028-bet-detail-meta v1029-bet-detail-meta"><span>Tutar: <b>${escapeHtml(stakeText)}</b></span><span>Kazanç: <b>${escapeHtml(payoutTotalText)}</b></span></div>
          <button type="button" class="delete" data-target-self-delete="${m}:${escapeHtml(item.id || "")}" title="Sil"><i class="fa-solid fa-trash"></i></button>
        </div>
      </li>`;
    }).join("");
    return { mode: m, hasRows: rows.length > 0, summary: "", sub: "", details };
  }

  function v811CryptoTpRow() {
    return `<div class="v811-target-tp-row v813-target-tp-row v814-target-tp-row" data-target-self-tp="crypto">
      <input type="text" data-target-self-tp-field="target" placeholder="Hedef TP">
      <input type="number" step="0.01" inputmode="decimal" data-target-self-tp-field="profit" placeholder="Kâr">
    </div>`;
  }
  function v824CryptoEntryRow(index = 0) {
    const label = index > 0 ? `İşlem ${index + 1}` : "İşlem";
    return `<div class="v824-target-crypto-entry" data-target-crypto-entry="1">
      <div class="v824-target-crypto-entry-title"><span>${escapeHtml(label)}</span><button type="button" data-target-crypto-entry-remove title="Bu işlem kutusunu kapat"><i class="fa-solid fa-xmark"></i></button></div>
      <input type="text" data-target-self-field="crypto:name" placeholder="İşlem adı">
      <input type="number" step="0.01" inputmode="decimal" data-target-self-field="crypto:stake" placeholder="Tutar">
      <input type="text" data-target-self-field="crypto:entry" placeholder="Giriş fiyatı">
      <div class="v811-target-tp-box v812-target-tp-box v813-target-tp-box v814-target-tp-box">
        <div class="v814-target-tp-grid">
          <div class="v811-target-tp-list v813-target-tp-list v814-target-tp-list" data-target-tp-list="crypto">${v811CryptoTpRow()}</div>
          <div class="v814-target-tp-actions"><button type="button" data-target-tp-add="crypto">+ TP</button><button type="button" data-target-tp-remove-last="crypto" title="Son TP kaldır">−</button></div>
        </div>
      </div>
      <div class="v812-target-stop-row v813-target-stop-row v814-target-stop-row">
        <input type="text" data-target-self-field="crypto:stop" placeholder="Stop">
        <input type="number" step="0.01" inputmode="decimal" data-target-self-field="crypto:stopLoss" placeholder="Olası zarar">
      </div>
    </div>`;
  }
  function v812BetLegRow() {
    return `<div class="v812-target-bet-leg v813-target-bet-leg v814-target-bet-leg" data-target-bet-leg="bet">
      <input type="text" data-target-bet-leg-field="name" placeholder="Maç">
      <input type="number" step="0.01" inputmode="decimal" data-target-bet-leg-field="odds" placeholder="Oran">
      <button type="button" data-target-bet-leg-remove title="Maç sil">×</button>
    </div>`;
  }
  function renderTargetActiveBox(state, mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const data = v810TargetSelfData(m);
    if (m === "crypto") {
      return `<div class="v810-target-self v811-target-self v812-target-self v813-target-self v814-target-self crypto">
        <div class="v812-target-self-title v814-target-self-title"><b>İşlem</b></div>
        <div class="v810-target-self-form v811-target-self-form v812-target-self-form v813-target-self-form v814-target-self-form v815-target-self-form crypto" data-target-crypto-autosave="1">
          <div class="v824-target-crypto-entry-list" data-target-crypto-entry-list>${v824CryptoEntryRow(0)}</div>
          <button type="button" class="v811-target-main-add v814-target-main-add v824-target-add-entry" data-target-crypto-entry-add="${m}">+ İşlem</button>
        </div>
        ${data.hasRows ? `<details open class="v810-target-self-details v811-target-self-details v812-target-self-details v813-target-self-details v814-target-self-details"><summary>Detay</summary><ul>${data.details}</ul></details>` : ""}
      </div>`;
    }
    return `<div class="v810-target-self v811-target-self v812-target-self v813-target-self v814-target-self bet">
      <div class="v812-target-self-title v814-target-self-title"><b>Bahis</b></div>
      <div class="v810-target-self-form v811-target-self-form v812-target-self-form v813-target-self-form v814-target-self-form v815-target-self-form bet" data-target-bet-autosave="1">
        <div class="v812-target-bet-leg-list v813-target-bet-leg-list v814-target-bet-leg-list" data-target-bet-leg-list="${m}">${v812BetLegRow()}</div>
        <input type="number" step="0.01" inputmode="decimal" data-target-self-field="${m}:stake" placeholder="Tutar">
        <div class="v812-target-form-actions v814-target-form-actions"><button type="button" data-target-bet-leg-add="${m}">+ Maç</button></div>
      </div>
      ${data.hasRows ? `<details open class="v810-target-self-details v811-target-self-details v812-target-self-details v813-target-self-details v814-target-self-details v835-target-self-details"><summary>Detay</summary><ul>${data.details}</ul></details>` : ""}
    </div>`;
  }

  function renderCardShotButton(id) {
    return `<button type="button" class="v763-shot-btn" data-card-screenshot="${escapeHtml(id)}" title="Fotoğraf önizle" aria-label="Fotoğraf önizle"><i class="fa-solid fa-camera"></i></button>`;
  }

  function v781RowsForPhoto(mode, state) {
    if (mode === "bet") {
      const grouped = getBetCouponGroups(state);
      const singles = grouped.singles.map(row => {
        const totals = rowBetTotals(row);
        return {
          index: row.index + 1,
          type: "Bahis",
          name: cleanText(row.name),
          matchLines: [cleanText(row.name)],
          matchOdds: [Number(row.odds || 0)],
          matchResults: [cleanText(row.status || "")],
          stake: Number(row.stake || 0),
          odds: Number(totals.odds || 0),
          possible: Number(totals.possibleWin || 0)
        };
      });
      const coupons = grouped.coupons.map(coupon => {
        const totals = rowBetTotals(coupon.row);
        return {
          index: coupon.slotIndex + 1,
          type: "Kombine",
          name: coupon.matches.map(m => cleanText(m.name)).filter(Boolean).join(" + "),
          matchLines: coupon.matches.map(m => cleanText(m.name)).filter(Boolean),
          matchOdds: coupon.matches.map(m => Number(m.odds || 0)),
          stake: Number(coupon.row.stake || 0),
          odds: Number(totals.odds || 0),
          possible: Number(totals.possibleWin || 0)
        };
      });
      return [...singles, ...coupons].sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    }
    return activeRowsForMode(mode, state).map(row => ({
      index: row.index + 1,
      type: "Kripto",
      name: cleanText(row.name),
      matchLines: [cleanText(row.name)],
      matchOdds: [Number(row.odds || 0)],
      stake: Number(row.stake || 0),
      odds: Number(row.odds || 0),
      possible: Number(row.pnl || 0)
    }));
  }
  function v785WrapPhotoText(text, limit = 42) {
    const raw = String(text || "").trim();
    if (!raw) return [""];
    const words = raw.split(/\s+/);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= limit) current = candidate;
      else {
        if (current) lines.push(current);
        if (word.length > limit) {
          for (let i = 0; i < word.length; i += limit) lines.push(word.slice(i, i + limit));
          current = "";
        } else current = word;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [raw];
  }

  function v788PhotoEntryLines(entry) {
    const names = Array.isArray(entry.matchLines) && entry.matchLines.length ? entry.matchLines : [entry.name || "Maç"];
    const odds = Array.isArray(entry.matchOdds) && entry.matchOdds.length ? entry.matchOdds : [entry.odds || 0];
    const results = Array.isArray(entry.matchResults) ? entry.matchResults : [];
    const rows = [];
    names.forEach((name, idx) => {
      const prefix = names.length > 1 ? `${idx + 1}. ` : "";
      const wrapped = v785WrapPhotoText(prefix + String(name || "Maç").trim(), 44).slice(0, 4);
      wrapped.forEach((line, partIndex) => {
        rows.push({
          text: line,
          odds: partIndex === 0 ? Number(odds[idx] || 0) : 0,
          result: partIndex === 0 ? cleanText(results[idx] || "") : ""
        });
      });
    });
    return rows.length ? rows : [{ text: "Maç", odds: Number(entry.odds || 0), result: cleanText(entry.status || "") }];
  }

  function v788PhotoTitle(rows, titleText) {
    if (Array.isArray(rows) && rows.length === 1) {
      if (rows[0].type === "Kombine") return "KOMBİNE KUPON";
      if (rows[0].type === "Bahis") return "TEKLİ BAHİS";
    }
    return titleText || "AKTİF BAHİSLER / KUPONLAR";
  }

  function v785BuildBetPhotoSvg(rows, titleText) {
    const data = (rows || []).filter(Boolean);
    if (!data.length) return null;

    const width = 900;
    const padX = 42;
    const rowX = 42;
    const rowW = 816;
    const textX = 64;
    const oddsX = 830;
    const lineH = 25;
    const rowGap = 10;
    let cursorY = 150;
    const rowHtml = [];

    data.forEach((entry, entryIndex) => {
      const lineRows = v788PhotoEntryLines(entry);
      const isMultiEntry = data.length > 1;
      if (isMultiEntry) {
        const groupTitle = `${entryIndex + 1}. ${entry.type === "Kombine" ? "Kombine Kupon" : "Tekli Bahis"}`;
        rowHtml.push(`<text x="${textX}" y="${cursorY - 12}" fill="#c084fc" font-size="16" font-family="Arial" font-weight="900">${escapeHtml(groupTitle)}</text>`);
      }
      lineRows.forEach(line => {
        const wrapped = v785WrapPhotoText(line.text, 40).slice(0, 4);
        const hasResult = !!line.result;
        const rowH = Math.max(40, 16 + wrapped.length * lineH);
        const statusText = line.result === "loss" ? "KAYBETTİ" : "KAZANDI";
        const statusColor = line.result === "loss" ? "#ef4444" : "#22c55e";
        const statusX = oddsX - 76;
        rowHtml.push(`
          <rect x="${rowX}" y="${cursorY - 28}" width="${rowW}" height="${rowH}" rx="12" fill="#0f172a" stroke="#334155"/>
          ${wrapped.map((txt, idx) => `<text x="${textX}" y="${cursorY - 3 + idx * lineH}" fill="#f8fafc" font-size="19" font-family="Arial" font-weight="800">${escapeHtml(txt)}</text>`).join("")}
          ${hasResult ? `<text x="${statusX}" y="${cursorY - 3}" text-anchor="end" fill="${statusColor}" font-size="19" font-family="Arial" font-weight="900">${statusText}</text>` : ""}
          ${line.odds ? `<text x="${oddsX}" y="${cursorY - 3}" text-anchor="end" fill="#fbbf24" font-size="19" font-family="Arial" font-weight="900">${Number(line.odds).toFixed(2)}</text>` : ""}`);
        cursorY += rowH + rowGap;
      });
      if (isMultiEntry) cursorY += 8;
    });

    const totalStake = data.reduce((sum, row) => sum + Number(row.stake || 0), 0);
    const totalPossible = data.reduce((sum, row) => sum + Number(row.possible || 0), 0);
    const totalOdds = data.length === 1 ? Number(data[0].odds || 0) : 0;
    const title = v788PhotoTitle(data, titleText);
    const footerY = cursorY + 20;
    const footerH = 130;
    const height = Math.max(430, footerY + footerH + 46);
    const totalOddsLabel = totalOdds ? totalOdds.toFixed(2) : "-";
    const totalPossibleLabel = totalPossible ? money(totalPossible) : "-";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#020617"/>
      <rect x="22" y="22" width="856" height="${height - 44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/>
      <text x="${padX}" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">${escapeHtml(title)}</text>
      <text x="${padX}" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">${new Date().toLocaleString("tr-TR")}</text>
      ${rowHtml.join("")}
      <rect x="${rowX}" y="${footerY}" width="${rowW}" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/>
      <text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Toplam Oran:</text>
      <text x="836" y="${footerY + 34}" text-anchor="end" fill="#fbbf24" font-size="20" font-family="Arial" font-weight="900">${totalOddsLabel}</text>
      <text x="64" y="${footerY + 70}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text>
      <text x="836" y="${footerY + 70}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${money(totalStake)}</text>
      <text x="64" y="${footerY + 106}" fill="#22c55e" font-size="19" font-family="Arial" font-weight="900">Tahmini Kazanç:</text>
      <text x="836" y="${footerY + 106}" text-anchor="end" fill="#22c55e" font-size="20" font-family="Arial" font-weight="900">${totalPossibleLabel}</text>
    </svg>`;
  }
  function v816BuildCryptoPhotoSvg(item) {
    const tps = v813CryptoTps(item);
    const stopRaw = cleanText(item?.stop || "");
    const stopLoss = v812CryptoStopLoss(item);
    const width = 900;
    const padX = 42;
    const rowX = 42;
    const rowW = 816;
    const textX = 64;
    const valueX = 830;
    const rowGap = 10;
    let cursorY = 150;
    const rowHtml = [];
    const pushRow = (label, value, accent = '#fbbf24') => {
      rowHtml.push(`
        <rect x="${rowX}" y="${cursorY - 28}" width="${rowW}" height="40" rx="12" fill="#0f172a" stroke="#334155"/>
        <text x="${textX}" y="${cursorY - 3}" fill="#f8fafc" font-size="19" font-family="Arial" font-weight="800">${escapeHtml(label)}</text>
        <text x="${valueX}" y="${cursorY - 3}" text-anchor="end" fill="${accent}" font-size="19" font-family="Arial" font-weight="900">${escapeHtml(value)}</text>`);
      cursorY += 50;
    };
    pushRow('İşlem', cleanText(item?.name || '') || 'Kripto İşlem', '#e5e7eb');
    pushRow('Giriş', v814EntryText(item), '#fbbf24');
    tps.forEach((tp, idx) => {
      const target = cleanText(tp.target || '') || '-';
      const profit = tp.profit !== '' ? signedMoney(Number(tp.profit || 0)) : '+$0.00';
      const status = tp.done || cleanText(item?.result || '') === 'tp' ? ' · KÂR' : '';
      pushRow(`TP ${idx + 1} · ${target}`, `${profit}${status}`, '#22c55e');
    });
    if (stopRaw || stopLoss) {
      const status = cleanText(item?.result || '') === 'stop' ? ' · ZARAR' : '';
      pushRow(`STOP · ${stopRaw || '-'}`, `${stopLoss ? '-' + money(stopLoss) : '-$0.00'}${status}`, '#dc2626');
    }
    const footerY = cursorY + 20;
    const footerH = 88;
    const height = Math.max(420, footerY + footerH + 46);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#020617"/>
      <rect x="22" y="22" width="856" height="${height - 44}" rx="24" fill="#0b1120" stroke="#fbbf24" stroke-width="2"/>
      <text x="${padX}" y="76" fill="#fbbf24" font-size="28" font-family="Arial" font-weight="900">KRİPTO İŞLEM FOTOĞRAFI</text>
      <text x="${padX}" y="112" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="800">${new Date().toLocaleString('tr-TR')}</text>
      ${rowHtml.join('')}
      <rect x="${rowX}" y="${footerY}" width="${rowW}" height="${footerH}" rx="14" fill="#111827" stroke="#334155"/>
      <text x="64" y="${footerY + 34}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="800">Tutar:</text>
      <text x="836" y="${footerY + 34}" text-anchor="end" fill="#e5e7eb" font-size="20" font-family="Arial" font-weight="900">${Number(item?.stake || 0) ? money(item.stake) : '-'}</text>
      <text x="64" y="${footerY + 68}" fill="#22c55e" font-size="19" font-family="Arial" font-weight="900">Güncel Kâr:</text>
      <text x="836" y="${footerY + 68}" text-anchor="end" fill="${Number(v812CryptoNet(item) || 0) < 0 ? '#dc2626' : '#22c55e'}" font-size="20" font-family="Arial" font-weight="900">${signedMoney(Number(v812CryptoNet(item) || 0))}</text>
    </svg>`;
  }
  function v816BuildTargetItemPhotoData(mode, id) {
    const m = mode === 'crypto' ? 'crypto' : 'bet';
    const store = loadTargetItems();
    const row = (store[m] || []).find(item => String(item.id || '') === String(id || ''));
    if (!row) return null;
    if (m === 'bet') {
      const entry = {
        index: 1,
        type: v812BetLegs(row).length > 1 ? 'Kombine' : 'Bahis',
        matchLines: v812BetLegs(row).map(leg => cleanText(leg.name || '') || 'Maç'),
        matchOdds: v812BetLegs(row).map(leg => Number(leg.odds || 0)),
        matchResults: v812BetLegs(row).map(leg => cleanText(leg.result || row.result || '')),
        stake: Number(row.stake || 0),
        odds: Number(v812BetOddsProduct(row) || 0),
        possible: Number(v812BetPotential(row) || 0)
      };
      const svg = v785BuildBetPhotoSvg([entry], entry.type === 'Kombine' ? 'KOMBİNE KUPON' : 'BAHİS FOTOĞRAFI');
      if (!svg) return null;
      return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), label: 'Bahis Fotoğrafı', file: `bulten-bahis-${new Date().toISOString().slice(0,10)}.png` };
    }
    const svg = v816BuildCryptoPhotoSvg(row);
    if (!svg) return null;
    return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), label: 'Kripto Fotoğrafı', file: `bulten-kripto-${new Date().toISOString().slice(0,10)}.png` };
  }
  function openTargetResultConfirm(options, onConfirm, onCancel) {
    const opts = options || {};
    const tone = opts.tone === "loss" || opts.tone === "danger" || opts.tone === "stop" ? "danger" : "success";
    let host = document.getElementById("omega-target-confirm-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-target-confirm-host";
      document.body.appendChild(host);
    }
    const title = escapeHtml(opts.title || "Onay gerekiyor");
    const message = escapeHtml(opts.message || "Bu işlemi onaylıyor musun?");
    const okText = escapeHtml(opts.okText || "Onayla");
    const cancelText = escapeHtml(opts.cancelText || "Vazgeç");
    const icon = tone === "danger" ? "fa-xmark" : "fa-check";
    host.innerHTML = `<div class="v823-confirm-overlay" data-v823-confirm-cancel>
      <section class="v823-confirm-modal ${tone}" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="v823-confirm-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="v823-confirm-copy"><b>${title}</b><p>${message}</p></div>
        <div class="v823-confirm-actions">
          <button type="button" class="cancel" data-v823-confirm-cancel>${cancelText}</button>
          <button type="button" class="ok" data-v823-confirm-ok>${okText}</button>
        </div>
      </section>
    </div>`;
    host.style.display = "block";
    let settled = false;
    const close = (cancelled = false) => {
      if (settled) return;
      settled = true;
      host.innerHTML = "";
      host.style.display = "none";
      if (cancelled && typeof onCancel === "function") onCancel();
    };
    host.querySelectorAll("[data-v823-confirm-cancel]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !el.hasAttribute("data-v823-confirm-cancel")) return;
      close(true);
    }));
    host.querySelector("[data-v823-confirm-ok]")?.addEventListener("click", () => {
      close(false);
      if (typeof onConfirm === "function") onConfirm();
    });
  }
  function getRollingPhotoHost() {
    let host = document.getElementById("omega-rolling-photo-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-photo-host";
      document.body.appendChild(host);
    }
    return host;
  }
  function openRollingPhotoPreview(dataUrl, filename, title = "Fotoğraf", subtitle = "ROLLING") {
    if (!dataUrl) return;
    const host = getRollingPhotoHost();
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>${escapeHtml(title)}</b><span>${escapeHtml(subtitle)}</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${dataUrl}" alt="Rolling fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.setAttribute("aria-hidden", "false");
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
      host.setAttribute("aria-hidden", "true");
    }));
    host.querySelector("[data-v781-photo-download]")?.addEventListener("click", () => {
      v781DownloadPngFromSvg(dataUrl, filename);
    });
  }

  function v1155EscapeCssText(value) {
    return String(value || "").replace(/<\/style/gi, "<\\/style");
  }

  function v1155CollectCaptureCss() {
    const chunks = [];
    try {
      Array.from(document.styleSheets || []).forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          const css = rules.map(rule => rule.cssText || "").filter(Boolean).join("\n");
          if (css) chunks.push(css);
        } catch {}
      });
    } catch {}
    chunks.push(`
      html,body{margin:0;padding:0;background:#020617;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;}
      *{box-sizing:border-box;}
      .v1155-ledger-capture-root{display:block;background:#020617;margin:0;padding:0;overflow:visible;width:max-content;height:max-content;}
      .v1155-ledger-capture-root .v1056-ledger-screen-body,
      .v1155-ledger-capture-root .v1057-ledger-screen-body{overflow:visible!important;max-height:none!important;height:auto!important;padding:0!important;margin:0!important;background:transparent!important;}
      .v1155-ledger-capture-root .v1056-ledger-modal-table,
      .v1155-ledger-capture-root .v1054-daily-ledger,
      .v1155-ledger-capture-root .v1057-ledger-excel,
      .v1155-ledger-capture-root .v1063-ledger-pro,
      .v1155-ledger-capture-root .v1065-ledger-pro{overflow:visible!important;max-height:none!important;height:auto!important;margin:0!important;}
      .v1155-ledger-capture-root .v1110-ledger-pager,
      .v1155-ledger-capture-root .v1110-ledger-page-badge,
      .v1155-ledger-capture-root .v1110-ledger-page-prev,
      .v1155-ledger-capture-root .v1110-ledger-page-next,
      .v1155-ledger-capture-root .v1112-ledger-pager{display:none!important;}
    `);
    return chunks.join("\n");
  }

  function v1156StyleToText(style) {
    let out = "";
    if (!style) return out;
    for (let i = 0; i < style.length; i += 1) {
      const prop = style[i];
      if (!prop) continue;
      const value = style.getPropertyValue(prop);
      if (!value) continue;
      const priority = style.getPropertyPriority(prop);
      out += `${prop}:${value}${priority ? " !important" : ""};`;
    }
    return out;
  }

  function v1156CopyComputedTree(sourceRoot, cloneRoot) {
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll("*")];
    const count = Math.min(sourceNodes.length, cloneNodes.length);
    for (let i = 0; i < count; i += 1) {
      const src = sourceNodes[i];
      const dst = cloneNodes[i];
      if (!(src instanceof Element) || !(dst instanceof Element)) continue;
      const style = window.getComputedStyle(src);
      let cssText = v1156StyleToText(style);
      if (/^(HTML|BODY)$/i.test(dst.tagName)) cssText += "margin:0;";
      dst.setAttribute("style", cssText);
      if (src instanceof HTMLTextAreaElement && dst instanceof HTMLTextAreaElement) {
        dst.value = src.value;
        dst.textContent = src.value;
      } else if (src instanceof HTMLInputElement && dst instanceof HTMLInputElement) {
        dst.value = src.value;
        dst.setAttribute("value", src.value);
      } else if (src instanceof HTMLSelectElement && dst instanceof HTMLSelectElement) {
        dst.value = src.value;
      }
    }
  }

  function v1157PersistLedgerScreenState(mode) {
    try {
      sessionStorage.setItem(LEDGER_SCREEN_SESSION_KEY, JSON.stringify({ mode: mode === "crypto" ? "crypto" : "bet" }));
    } catch {}
  }

  function v1157ClearLedgerScreenState() {
    try { sessionStorage.removeItem(LEDGER_SCREEN_SESSION_KEY); } catch {}
    LEDGER_SCREEN_RESTORE_DONE = false;
  }

  function v1157RestoreLedgerScreenState() {
    if (LEDGER_SCREEN_RESTORE_DONE) return;
    let payload = null;
    try { payload = JSON.parse(sessionStorage.getItem(LEDGER_SCREEN_SESSION_KEY) || "null"); } catch {}
    if (!payload) return;
    const mount = document.getElementById("omega-rolling-render");
    if (!mount) return;
    if (document.querySelector("#v1056-ledger-screen-host .v1056-ledger-screen-modal")) {
      LEDGER_SCREEN_RESTORE_DONE = true;
      return;
    }
    LEDGER_SCREEN_RESTORE_DONE = true;
    const mode = payload.mode === "crypto" ? "crypto" : "bet";
    setTimeout(() => {
      if (!document.getElementById("omega-rolling-render")) {
        LEDGER_SCREEN_RESTORE_DONE = false;
        return;
      }
      if (document.querySelector("#v1056-ledger-screen-host .v1056-ledger-screen-modal")) return;
      v1056OpenDailyLedgerScreen(mode);
    }, 0);
  }

  function v1157PrepareLedgerCaptureNode(sourceRoot) {
    if (!sourceRoot) return null;
    sourceRoot.querySelectorAll("script").forEach(el => el.remove());
    sourceRoot.querySelectorAll(".v1056-ledger-screen-head, .v1057-ledger-screen-head, .v1060-ledger-screen-head, .v1065-ledger-screen-head").forEach(el => el.remove());
    sourceRoot.querySelectorAll('.v1069-ledger-match-line.pending .v1069-ledger-status-mark, .v1069-ledger-match-line.push .v1069-ledger-status-mark, .v1069-ledger-match-line.open .v1069-ledger-status-mark').forEach(mark => {
      if (!(mark instanceof Element)) return;
      mark.textContent = "−";
      mark.style.color = "#64748b";
      mark.style.fontSize = "11px";
      mark.style.lineHeight = "1";
      mark.style.fontWeight = "1000";
      mark.style.position = "static";
      mark.style.background = "none";
      mark.style.transform = "none";
      mark.style.display = "inline-flex";
      mark.style.alignItems = "center";
      mark.style.justifyContent = "center";
      mark.style.width = mark.style.width || "10px";
      mark.style.minWidth = mark.style.minWidth || "10px";
      mark.style.height = mark.style.height || "11px";
    });
    sourceRoot.querySelectorAll('.v1069-ledger-status-mark.v1123-ledger-status-empty').forEach(mark => {
      if (!(mark instanceof Element)) return;
      mark.classList.remove('v1123-ledger-status-empty');
      if (!String(mark.textContent || '').trim()) mark.textContent = '−';
      mark.style.color = "#64748b";
      mark.style.fontSize = "11px";
      mark.style.lineHeight = "1";
      mark.style.position = "static";
    });
    return sourceRoot;
  }

  function v1156SyncScrollTree(sourceRoot, cloneRoot) {
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll("*")];
    const count = Math.min(sourceNodes.length, cloneNodes.length);
    for (let i = 0; i < count; i += 1) {
      const src = sourceNodes[i];
      const dst = cloneNodes[i];
      if (!(src instanceof Element) || !(dst instanceof Element)) continue;
      if (src.scrollTop) dst.scrollTop = src.scrollTop;
      if (src.scrollLeft) dst.scrollLeft = src.scrollLeft;
    }
  }

  function v1155BuildLedgerScreenPhotoPng(sourceNode, mode) {
    return new Promise((resolve, reject) => {
      try {
        const modalNode = sourceNode?.closest?.(".v1056-ledger-screen-modal") || (sourceNode?.classList?.contains("v1056-ledger-screen-modal") ? sourceNode : null) || document.querySelector(".v1056-ledger-screen-modal");
        if (!modalNode || typeof modalNode.cloneNode !== "function") throw new Error("Kupon Defteri ekranı bulunamadı.");
        const sourceCaptureNode = modalNode.querySelector(".v1056-ledger-screen-body") || modalNode;
        const rect = sourceCaptureNode.getBoundingClientRect();
        const width = Math.max(320, Math.ceil(rect.width || sourceCaptureNode.offsetWidth || 0));
        const height = Math.max(160, Math.ceil(rect.height || sourceCaptureNode.offsetHeight || 0));
        const clone = sourceCaptureNode.cloneNode(true);
        [clone, ...clone.querySelectorAll("*")].forEach(el => {
          if (!(el instanceof Element)) return;
          el.removeAttribute("id");
          el.removeAttribute("data-v1060-ledger-photo");
        });
        v1156CopyComputedTree(sourceCaptureNode, clone);
        v1157PrepareLedgerCaptureNode(clone);
        clone.style.width = `${width}px`;
        clone.style.minWidth = `${width}px`;
        clone.style.maxWidth = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.minHeight = `${height}px`;
        clone.style.maxHeight = `${height}px`;
        clone.style.boxSizing = "border-box";
        clone.style.margin = "0";
        clone.style.transform = "none";
        clone.style.position = "relative";

        const tempHost = document.createElement("div");
        tempHost.style.position = "fixed";
        tempHost.style.left = "-100000px";
        tempHost.style.top = "0";
        tempHost.style.width = `${width}px`;
        tempHost.style.height = `${height}px`;
        tempHost.style.overflow = "hidden";
        tempHost.style.background = "#020617";
        tempHost.style.padding = "0";
        tempHost.style.margin = "0";
        tempHost.appendChild(clone);
        document.body.appendChild(tempHost);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              v1156SyncScrollTree(sourceCaptureNode, clone);
              v1157PrepareLedgerCaptureNode(clone);
              const serialized = new XMLSerializer().serializeToString(clone);
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${serialized}</foreignObject></svg>`;
              const img = new Image();
              img.onload = () => {
                try {
                  const scale = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1)));
                  const canvas = document.createElement("canvas");
                  canvas.width = Math.ceil(width * scale);
                  canvas.height = Math.ceil(height * scale);
                  const ctx = canvas.getContext("2d");
                  ctx.setTransform(scale, 0, 0, scale, 0, 0);
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = "high";
                  ctx.fillStyle = "#020617";
                  ctx.fillRect(0, 0, width, height);
                  ctx.drawImage(img, 0, 0, width, height);
                  const png = canvas.toDataURL("image/png");
                  tempHost.remove();
                  resolve(png);
                } catch (error) {
                  tempHost.remove();
                  reject(error);
                }
              };
              img.onerror = () => {
                tempHost.remove();
                reject(new Error("PNG üretilemedi."));
              };
              img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
            } catch (error) {
              tempHost.remove();
              reject(error);
            }
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }


  function v1162LocalDateStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function v1162LedgerFilename(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return `bulten-${m === "crypto" ? "kripto-islem-defteri" : "bahis-kupon-defteri"}-${v1162LocalDateStamp()}.png`;
  }

  function v1162HideContextMenu(menu) {
    if (!menu) return;
    menu.style.display = "none";
  }

  function v1162PrepareOutputNode(node) {
    if (!node || !(node instanceof Element)) return node;
    node.querySelectorAll("script").forEach(el => el.remove());
    node.querySelectorAll(".v1069-ledger-match-line").forEach(line => {
      const mark = line.querySelector(".v1069-ledger-status-mark");
      if (!mark) return;
      const pendingLike = line.classList.contains("pending") || line.classList.contains("push") || line.classList.contains("open");
      const emptyLike = !String(mark.textContent || "").trim() || mark.classList.contains("v1123-ledger-status-empty");
      if (pendingLike || emptyLike) {
        mark.classList.remove("v1123-ledger-status-empty");
        mark.innerHTML = v1172LedgerDashHtml();
        mark.style.setProperty("color", "#94a3b8", "important");
      }
      mark.style.setProperty("font-size", "11px", "important");
      mark.style.setProperty("line-height", "1", "important");
      mark.style.setProperty("font-weight", "1000", "important");
      mark.style.setProperty("font-family", "Arial, Helvetica, sans-serif", "important");
      mark.style.setProperty("display", "inline-flex", "important");
      mark.style.setProperty("align-items", "center", "important");
      mark.style.setProperty("justify-content", "center", "important");
      mark.style.setProperty("background", "none", "important");
      mark.style.setProperty("transform", "none", "important");
      mark.style.setProperty("width", "12px", "important");
      mark.style.setProperty("min-width", "12px", "important");
      mark.style.setProperty("height", "12px", "important");
      mark.style.setProperty("flex", "0 0 12px", "important");
      mark.style.setProperty("white-space", "nowrap", "important");
      mark.style.setProperty("overflow", "visible", "important");
      mark.style.setProperty("position", "static", "important");
    });
    node.querySelectorAll(".v1119-ledger-row-filler").forEach(row => row.remove());
    node.querySelectorAll(".v1056-ledger-screen-body, .v1057-ledger-screen-body, .v1057-ledger-sheet-grid, .v1061-ledger-sheet-grid, .v1057-ledger-sheet, .v1061-ledger-sheet").forEach(el => {
      el.style.overflow = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.style.minHeight = "0";
      el.style.marginBottom = "0";
      el.style.paddingBottom = "0";
    });
    return node;
  }

  async function v1162NodeToPngDataUrl(node) {
    if (!node || !(node instanceof Element)) throw new Error("Çıktı alanı bulunamadı.");
    try { await document.fonts?.ready; } catch {}
    const rect = node.getBoundingClientRect();
    const width = Math.max(320, Math.ceil(node.scrollWidth || rect.width || node.offsetWidth || 0));
    const height = Math.max(120, Math.ceil(node.scrollHeight || rect.height || node.offsetHeight || 0));
    const clone = node.cloneNode(true);
    v1156CopyComputedTree(node, clone);
    v1162PrepareOutputNode(clone);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    clone.style.width = `${width}px`;
    clone.style.minWidth = `${width}px`;
    clone.style.maxWidth = `${width}px`;
    clone.style.height = `${height}px`;
    clone.style.minHeight = `${height}px`;
    clone.style.maxHeight = `${height}px`;
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.transform = "none";
    clone.style.position = "relative";
    clone.style.overflow = "visible";
    clone.style.background = "#020617";

    const tempHost = document.createElement("div");
    tempHost.style.position = "fixed";
    tempHost.style.left = "-100000px";
    tempHost.style.top = "0";
    tempHost.style.width = `${width}px`;
    tempHost.style.height = `${height}px`;
    tempHost.style.overflow = "hidden";
    tempHost.style.background = "#020617";
    tempHost.style.margin = "0";
    tempHost.style.padding = "0";
    tempHost.appendChild(clone);
    document.body.appendChild(tempHost);

    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const serialized = new XMLSerializer().serializeToString(clone);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${serialized}</foreignObject></svg>`;
      const img = new Image();
      const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("PNG üretimi zaman aşımına uğradı.")), 14000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error("PNG üretilemedi.")); };
        img.src = svgUrl;
      });
      const scale = Math.max(1, Math.min(2, Math.round(window.devicePixelRatio || 1)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/png");
    } finally {
      tempHost.remove();
    }
  }

  function v1162DownloadDataUrl(dataUrl, filename) {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = cleanText(filename || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`).replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function v1162ExportOutputNode(node, filename, action, triggerButton = null) {
    if (!node) return;
    const oldText = triggerButton ? triggerButton.textContent : "";
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.textContent = "PNG hazırlanıyor...";
    }
    try {
      const dataUrl = await v1162NodeToPngDataUrl(node);
      if (action === "open") {
        const objectUrl = v1165DataUrlToObjectUrl(dataUrl, filename);
        const win = window.open(objectUrl, "_blank");
        if (!win) alert("Yeni sekme engellendi. Tarayıcı açılır pencere iznini kontrol et.");
        setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      } else {
        v1162DownloadDataUrl(dataUrl, filename);
      }
    } catch (error) {
      alert("PNG hazırlanamadı. Çıktı penceresi açıkken tekrar dene.");
    } finally {
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = oldText;
      }
    }
  }


  function v1165DataUrlToObjectUrl(dataUrl, filename) {
    const text = String(dataUrl || "");
    const parts = text.split(",");
    const meta = parts[0] || "";
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || "image/png";
    const raw = parts.slice(1).join(",");
    const binary = meta.includes(";base64") ? atob(raw) : decodeURIComponent(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const cleanName = cleanText(filename || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`).replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`;
    try {
      return URL.createObjectURL(new File([bytes], cleanName, { type: mime }));
    } catch {
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    }
  }

  function v1169WritePngViewerTab(tab, dataUrl, filename) {
    if (!tab) return;
    const safeName = cleanText(filename || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`).replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `bulten-kupon-defteri-${v1162LocalDateStamp()}.png`;
    try {
      tab.document.open();
      tab.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(safeName)}</title><style>html,body{margin:0;background:#020617;color:#e5e7eb;font-family:Arial,sans-serif;}body{min-height:100vh;} .bar{position:sticky;top:0;z-index:2;display:flex;gap:10px;align-items:center;padding:10px 12px;background:#020617;border-bottom:1px solid rgba(148,163,184,.25);} .bar a{appearance:none;border:1px solid rgba(251,191,36,.45);background:#111827;color:#fde68a;border-radius:10px;padding:8px 12px;font-weight:900;text-decoration:none;} .bar span{font-size:12px;color:#94a3b8;font-weight:800;} .wrap{padding:0;} img{display:block;max-width:none;height:auto;margin:0;}</style></head><body><div class="bar"><a id="download" href="${dataUrl}" download="${escapeHtml(safeName)}">PNG indir</a><span>Sağ tık: tarihli PNG indir</span></div><div class="wrap"><img src="${dataUrl}" alt="${escapeHtml(safeName)}"></div><script>document.addEventListener('contextmenu',function(e){e.preventDefault();var a=document.getElementById('download');if(a)a.click();});</script></body></html>`);
      tab.document.close();
    } catch {
      try { tab.location.href = dataUrl; } catch {}
    }
  }

  function v1165WriteTabMessage(tab, message) {
    if (!tab) return;
    try {
      tab.document.open();
      tab.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>BULTEN PNG</title><style>html,body{margin:0;background:#020617;color:#fde68a;font-family:Arial,sans-serif;font-weight:900;}body{display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box;}div{border:1px solid rgba(251,191,36,.32);border-radius:14px;padding:16px 18px;background:#0f172a;box-shadow:0 18px 48px rgba(0,0,0,.35);}</style></head><body><div>${escapeHtml(message)}</div></body></html>`);
      tab.document.close();
    } catch {}
  }

  async function v1165OpenLedgerDirectPngTab(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const filename = v1162LedgerFilename(m);
    const tab = window.open("", "_blank");
    if (!tab) {
      alert("Yeni sekme engellendi. Tarayıcı açılır pencere iznini kontrol et.");
      return;
    }
    v1165WriteTabMessage(tab, "PNG hazırlanıyor...");

    const tempHost = document.createElement("div");
    tempHost.style.position = "fixed";
    tempHost.style.left = "-100000px";
    tempHost.style.top = "0";
    tempHost.style.width = "max-content";
    tempHost.style.height = "auto";
    tempHost.style.overflow = "visible";
    tempHost.style.background = "#020617";
    tempHost.style.pointerEvents = "none";
    tempHost.setAttribute("aria-hidden", "true");
    tempHost.innerHTML = `<section class="v1056-ledger-screen-modal v1057-ledger-screen-modal v1061-ledger-screen-modal v1065-ledger-screen-modal v1162-ledger-output-modal ${m}" data-v1165-output-node><div class="v1056-ledger-screen-body v1057-ledger-screen-body">${v1054RenderDailyPlanPanel(m, { modal: true })}</div></section>`;
    document.body.appendChild(tempHost);

    try {
      v1103EnsureLedgerTestStyles();
      v1110FinalizeLedgerLayout(tempHost);
      const node = tempHost.querySelector("[data-v1165-output-node]");
      v1162PrepareOutputNode(node);
      setTimeout(() => v1162PrepareOutputNode(node), 80);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const dataUrl = await v1162NodeToPngDataUrl(node);
      v1169WritePngViewerTab(tab, dataUrl, filename);
    } catch (error) {
      v1165WriteTabMessage(tab, "PNG hazırlanamadı. Kupon Defteri ekranından tekrar dene.");
    } finally {
      tempHost.remove();
    }
  }


  function v1163LedgerOutputStorageKey() {
    return `bulten_ledger_output_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function v1163BuildLedgerOutputHtml(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const tempHost = document.createElement("div");
    tempHost.style.position = "fixed";
    tempHost.style.left = "-100000px";
    tempHost.style.top = "0";
    tempHost.style.width = "max-content";
    tempHost.style.height = "auto";
    tempHost.style.overflow = "visible";
    tempHost.style.background = "#020617";
    tempHost.style.pointerEvents = "none";
    tempHost.setAttribute("aria-hidden", "true");
    tempHost.innerHTML = `<section class="v1056-ledger-screen-modal v1057-ledger-screen-modal v1061-ledger-screen-modal v1065-ledger-screen-modal v1162-ledger-output-modal ${m}" data-v1163-output-node><div class="v1056-ledger-screen-body v1057-ledger-screen-body">${v1054RenderDailyPlanPanel(m, { modal: true })}</div></section>`;
    document.body.appendChild(tempHost);
    try {
      v1103EnsureLedgerTestStyles();
      v1110FinalizeLedgerLayout(tempHost);
      const node = tempHost.querySelector("[data-v1163-output-node]");
      v1162PrepareOutputNode(node);
      if (node) {
        node.querySelectorAll(".v1069-ledger-status-mark").forEach(mark => {
          const line = mark.closest(".v1069-ledger-match-line");
          if (line && (line.classList.contains("pending") || line.classList.contains("open") || line.classList.contains("push"))) {
            mark.classList.remove("v1123-ledger-status-empty");
            mark.innerHTML = v1172LedgerDashHtml();
            mark.style.setProperty("color", "#94a3b8", "important");
            mark.style.setProperty("font-size", "11px", "important");
            mark.style.setProperty("line-height", "1", "important");
            mark.style.setProperty("font-weight", "1000", "important");
            mark.style.setProperty("display", "inline-flex", "important");
            mark.style.setProperty("align-items", "center", "important");
            mark.style.setProperty("justify-content", "center", "important");
            mark.style.setProperty("background", "none", "important");
            mark.style.setProperty("transform", "none", "important");
          }
        });
      }
      return node ? node.outerHTML : "";
    } finally {
      tempHost.remove();
    }
  }

  function v1163OpenLedgerOutputTab(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const key = v1163LedgerOutputStorageKey();
    const title = m === "crypto" ? "Kripto İşlem Defteri" : "Bahis / Kupon Defteri";
    const filename = v1162LedgerFilename(m);
    const payload = { mode: m, title, filename, html: v1163BuildLedgerOutputHtml(m), ts: Date.now(), v: "1180" };
    if (!payload.html) {
      alert("Kupon Defteri çıktısı hazırlanamadı. Defteri kapatıp tekrar aç.");
      return;
    }
    try { localStorage.setItem(key, JSON.stringify(payload)); }
    catch (error) {
      alert("Çıktı belleğe yazılamadı. Tarayıcı depolama iznini kontrol et.");
      return;
    }
    const url = `ledger-output.html?v=v1188-crypto-wide-coin-roi-fit&key=${encodeURIComponent(key)}`;
    const win = window.open(url, "_blank");
    if (!win) alert("Yeni sekme engellendi. Tarayıcı açılır pencere iznini kontrol et.");
  }

  function v1162OpenLedgerOutputPreview(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const host = getRollingPhotoHost();
    const filename = v1162LedgerFilename(m);
    const title = m === "crypto" ? "Kripto İşlem Defteri" : "Bahis / Kupon Defteri";
    host.innerHTML = `<div class="v781-photo-overlay v1095-ledger-photo-overlay v1098-ledger-photo-overlay" data-v781-photo-close><section class="v1095-ledger-photo-modal v1098-ledger-photo-modal v1162-ledger-output-shell" onclick="event.stopPropagation()"><div class="v1162-ledger-output-toolbar"><button type="button" data-v1162-output-download>PNG indir</button><button type="button" data-v1162-output-open>PNG yeni sekmede aç</button><span class="v1162-ledger-output-note">Sağ tık: PNG indir / yeni sekmede aç</span><button type="button" class="v1162-output-close" data-v781-photo-close title="Kapat">×</button></div><div class="v1162-ledger-output-stage" data-v1162-output-stage><section class="v1056-ledger-screen-modal v1057-ledger-screen-modal v1061-ledger-screen-modal v1065-ledger-screen-modal v1162-ledger-output-modal ${m}" data-v1162-output-node><div class="v1056-ledger-screen-body v1057-ledger-screen-body">${v1054RenderDailyPlanPanel(m, { modal: true })}</div></section></div><div class="v1162-ledger-context-menu" data-v1162-context-menu><button type="button" data-v1162-context-download>PNG olarak indir</button><button type="button" data-v1162-context-open>PNG yeni sekmede aç</button></div></section></div>`;
    host.style.display = "block";
    host.setAttribute("aria-hidden", "false");
    v1103EnsureLedgerTestStyles();
    v1110FinalizeLedgerLayout(host);
    const outputNode = host.querySelector("[data-v1162-output-node]");
    const stage = host.querySelector("[data-v1162-output-stage]");
    const menu = host.querySelector("[data-v1162-context-menu]");
    v1162PrepareOutputNode(outputNode);
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
      host.setAttribute("aria-hidden", "true");
    }));
    host.querySelector("[data-v1162-output-download]")?.addEventListener("click", event => v1162ExportOutputNode(outputNode, filename, "download", event.currentTarget));
    host.querySelector("[data-v1162-output-open]")?.addEventListener("click", event => v1162ExportOutputNode(outputNode, filename, "open", event.currentTarget));
    stage?.addEventListener("contextmenu", event => {
      event.preventDefault();
      if (!menu) return;
      const x = Math.min(event.clientX, window.innerWidth - 192);
      const y = Math.min(event.clientY, window.innerHeight - 94);
      menu.style.left = `${Math.max(8, x)}px`;
      menu.style.top = `${Math.max(8, y)}px`;
      menu.style.display = "block";
    });
    document.addEventListener("click", () => v1162HideContextMenu(menu), { once: true, capture: true });
    menu?.querySelector("[data-v1162-context-download]")?.addEventListener("click", event => {
      event.stopPropagation();
      v1162HideContextMenu(menu);
      v1162ExportOutputNode(outputNode, filename, "download", event.currentTarget);
    });
    menu?.querySelector("[data-v1162-context-open]")?.addEventListener("click", event => {
      event.stopPropagation();
      v1162HideContextMenu(menu);
      v1162ExportOutputNode(outputNode, filename, "open", event.currentTarget);
    });
    setTimeout(() => v1162PrepareOutputNode(outputNode), 120);
    setTimeout(() => v1162PrepareOutputNode(outputNode), 300);
  }

  function openLedgerScreenPhotoPreview(dataUrl, filename, title = "Defter Fotoğrafı", sourceNode = null) {
    if (!dataUrl && !sourceNode) return;
    const host = getRollingPhotoHost();
    const downloadButton = dataUrl ? `<button type="button" data-v781-photo-download>Resmi İndir</button>` : "";
    host.innerHTML = `<div class="v781-photo-overlay v1095-ledger-photo-overlay v1098-ledger-photo-overlay" data-v781-photo-close><section class="v1095-ledger-photo-modal v1098-ledger-photo-modal v1160-ledger-inline-photo-modal" onclick="event.stopPropagation()"><div class="v1095-ledger-photo-toolbar v1098-ledger-photo-toolbar">${downloadButton}<button type="button" class="v1095-ledger-photo-close" data-v781-photo-close title="Kapat">×</button></div><div class="v1098-ledger-photo-clone-stage v1160-ledger-inline-photo-stage"></div></section></div>`;
    const stage = host.querySelector(".v1098-ledger-photo-clone-stage");
    if (stage && dataUrl) {
      stage.innerHTML = `<img class="v1143-ledger-photo-img" src="${dataUrl}" alt="${escapeHtml(title)}">`;
    } else if (stage && sourceNode && typeof sourceNode.cloneNode === "function") {
      const clone = sourceNode.cloneNode(true);
      clone.classList.add("v1098-ledger-photo-clone", "v1160-ledger-inline-export");
      clone.removeAttribute("id");
      clone.removeAttribute("role");
      clone.removeAttribute("aria-modal");
      clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      clone.querySelectorAll("script").forEach(el => el.remove());
      clone.querySelectorAll(".v1056-ledger-screen-head, .v1057-ledger-screen-head, .v1060-ledger-screen-head, .v1065-ledger-screen-head").forEach(el => el.remove());
      clone.querySelectorAll("[data-v1060-ledger-photo], [data-v1056-ledger-close], [data-v1063-ledger-clock], .v1060-ledger-head-actions, .v1063-ledger-head-actions").forEach(el => el.remove());
      clone.querySelectorAll(".v1069-ledger-match-line.pending .v1069-ledger-status-mark, .v1069-ledger-match-line.push .v1069-ledger-status-mark, .v1069-ledger-match-line.open .v1069-ledger-status-mark").forEach(mark => {
        mark.classList.remove("v1123-ledger-status-empty");
        mark.textContent = "−";
      });
      clone.style.position = "relative";
      clone.style.transform = "none";
      clone.style.margin = "0";
      clone.style.maxWidth = "none";
      clone.querySelectorAll(".v1056-ledger-screen-body, .v1057-ledger-screen-body").forEach(body => {
        body.style.overflow = "visible";
        body.style.maxHeight = "none";
        body.style.height = "auto";
        body.style.paddingBottom = "0";
      });
      stage.appendChild(clone);
    }
    host.style.display = "block";
    host.setAttribute("aria-hidden", "false");
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
      host.setAttribute("aria-hidden", "true");
    }));
    host.querySelector("[data-v781-photo-download]")?.addEventListener("click", () => {
      if (dataUrl) v781DownloadPngFromSvg(dataUrl, filename);
    });
  }


  function openTargetItemPhoto(mode, id) {
    const payload = v816BuildTargetItemPhotoData(mode, id);
    if (!payload) {
      alert(mode === 'crypto' ? 'Fotoğraf için önce işlem gir.' : 'Fotoğraf için önce maç bilgisi gir.');
      return;
    }
    const host = getRollingPhotoHost();
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>${payload.label}</b><span>Kasa Hedefi</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${payload.dataUrl}" alt="Kasa hedefi fotoğrafı"></section></div>`;
    host.style.display = 'block';
    host.setAttribute('aria-hidden', 'false');
    host.querySelectorAll('[data-v781-photo-close]').forEach(el => el.addEventListener('click', event => {
      if (event.target !== el && !event.target.hasAttribute('data-v781-photo-close')) return;
      host.innerHTML = '';
      host.style.display = 'none';
      host.setAttribute('aria-hidden', 'true');
    }));
    host.querySelector('[data-v781-photo-download]')?.addEventListener('click', () => {
      v781DownloadPngFromSvg(payload.dataUrl, payload.file);
    });
  }
  function v781BuildTablePhotoSvg(mode, state) {
    const rows = v781RowsForPhoto(mode, state);
    if (!rows.length) return null;
    const title = mode === "crypto" ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR";
    const svg = v785BuildBetPhotoSvg(rows, title);
    return svg ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) : null;
  }
  function v781DownloadPngFromSvg(svgUri, filename) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }, "image/png");
    };
    img.onerror = () => alert("Resim hazırlanamadı.");
    img.src = svgUri;
  }
  function openTablePhoto(mode, state) {
    const dataUrl = v781BuildTablePhotoSvg(mode, state);
    if (!dataUrl) {
      alert(mode === "crypto" ? "Fotoğraf için önce işlem yaz." : "Fotoğraf için önce maç yaz.");
      return;
    }
    let host = document.getElementById("omega-rolling-feature-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      document.body.appendChild(host);
    }
    host.innerHTML = `<div class="v781-photo-overlay" data-v781-photo-close><section class="v781-photo-modal" onclick="event.stopPropagation()"><div class="v776-photo-head"><div><b>Kupon Fotoğrafı</b><span>Ana ROLLING</span></div><button type="button" data-v781-photo-close>×</button></div><div class="v776-photo-actions"><button type="button" data-v781-photo-download>Resmi İndir</button></div><img src="${dataUrl}" alt="Rolling fotoğrafı"></section></div>`;
    host.style.display = "block";
    host.querySelectorAll("[data-v781-photo-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !event.target.hasAttribute("data-v781-photo-close")) return;
      host.innerHTML = "";
      host.style.display = "none";
    }));
    host.querySelector("[data-v781-photo-download]")?.addEventListener("click", () => {
      v781DownloadPngFromSvg(dataUrl, `bulten-${mode}-aktif-rolling-${new Date().toISOString().slice(0,10)}.png`);
    });
  }
  function renderBetInfoBar(row) {
    const t = rowBetTotals(row);
    const matches = getSlotMatches(row);
    const oddsLabel = matches.length > 1 ? "Toplam Oran" : "Oran";
    return `<div class="v763-card-info">
      <span>${oddsLabel} <b>${t.odds ? t.odds.toFixed(2) : "-"}</b></span>
      <span>Tutar <b>${t.stake ? money(t.stake) : "-"}</b></span>
      <span>Olası Kazanç <b>${t.possibleWin ? money(t.possibleWin) : "-"}</b></span>
      ${t.missing ? `<em>Eksik bilgi</em>` : ""}
    </div>`;
  }
  function renderBetSingleCard(row) {
    const cardId = `v763-bet-card-${row.index}`;
    return `<article class="v763-active-card bet single v801-bet-card" id="${cardId}">
      <div class="v763-card-top">
        <div><b>${escapeHtml(cleanText(row.name) || "Bahis")}</b><span>Tekli Bahis</span></div>
        ${renderCardShotButton(cardId)}
      </div>
      ${renderBetInfoBar(row)}
      <div class="v763-card-actions v801-bet-close-actions">
        <button type="button" class="win" data-mode="bet" data-slot="${row.index}" data-status="win">Kupon Kazandı</button>
        <button type="button" class="loss" data-mode="bet" data-slot="${row.index}" data-status="loss">Kupon Kaybetti</button>
      </div>
    </article>`;
  }
  function renderBetComboCard(coupon) {
    const row = coupon.row;
    const cardId = `v763-bet-card-${row.index}`;
    const matches = coupon.matches;
    const done = matches.filter(m => m.status === "win" || m.status === "loss").length;
    const keepOpen = ACTIVE_COMBO_DETAIL_SLOT === row.index || (done > 0 && done < matches.length);
    const matchRows = matches.map((m, idx) => `<li class="${m.status || "pending"}">
      <span>${idx + 1}. ${escapeHtml(m.name)}</span>
      <b>${Number(m.odds || 0) ? Number(m.odds).toFixed(2) : "Oran eksik"}</b>
      <div>
        <button type="button" class="win ${m.status === "win" ? "selected" : ""}" data-combo-match-status="${row.index}:${idx}:win">KAZANDI</button>
        <button type="button" class="loss ${m.status === "loss" ? "selected" : ""}" data-combo-match-status="${row.index}:${idx}:loss">KAYBETTİ</button>
      </div>
    </li>`).join("");
    return `<article class="v763-active-card bet combo v801-bet-card" id="${cardId}">
      <details ${keepOpen ? "open" : ""}>
        <summary>
          <div><b>${escapeHtml(coupon.label || "Kombine")}</b><span>${matches.length} maç · ${done}/${matches.length} sonuçlandı</span></div>
          ${renderCardShotButton(cardId)}
        </summary>
        ${renderBetInfoBar(row)}
        <ul class="v763-combo-match-list">${matchRows}</ul>
        <div class="v763-card-actions v801-bet-close-actions">
          <button type="button" class="win" data-mode="bet" data-slot="${row.index}" data-coupon-settle="${escapeHtml(coupon.id || coupon.group || row.index)}" data-status="win">Kupon Kazandı</button>
          <button type="button" class="loss" data-mode="bet" data-slot="${row.index}" data-coupon-settle="${escapeHtml(coupon.id || coupon.group || row.index)}" data-status="loss">Kupon Kaybetti</button>
        </div>
      </details>
    </article>`;
  }
  function cryptoTpProfit(row, tp) {
    const stake = Number(row?.stake || 0);
    const manualProfit = tp?.profitAmount !== "" && tp?.profitAmount !== undefined && tp?.profitAmount !== null && Number.isFinite(Number(tp.profitAmount));
    if (!manualProfit) return { pct: 0, usd: 0, ok: false };
    let usd = Number(tp.profitAmount || 0);
    if (tp?.result === "stop") usd = -Math.abs(usd || stake);
    const pct = stake ? (usd / stake) * 100 : 0;
    return { pct, usd, ok: true };
  }
  function cryptoTpPercentLabel(row, tp) {
    const p = cryptoTpProfit(row, tp);
    if (!p.ok) return "+0.0%";
    return `${p.pct >= 0 ? "+" : ""}${p.pct.toFixed(1)}%`;
  }
  function cryptoRealizedProfit(row) {
    const tps = Array.isArray(row?.takeProfits) ? row.takeProfits : [];
    const done = tps.filter(tp => tp && (tp.result === "tp" || tp.result === "stop"));
    const sum = done.reduce((acc, tp) => acc + cryptoTpProfit(row, tp).usd, 0);
    if (done.length && Number.isFinite(sum)) return sum;
    return Number(row?.odds || 0);
  }
  function cryptoFormatPrice(v) {
    const n = Number(v || 0);
    return n ? n.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "-";
  }

  function renderCryptoCard(row) {
    const cardId = `v763-crypto-card-${row.index}`;
    const missing = !cleanText(row.name) || !Number(row.stake || 0);
    const tps = Array.isArray(row.takeProfits) && row.takeProfits.length ? row.takeProfits : [{ price: "", profitAmount: "", note: "TP1", result: "" }];
    const realized = cryptoRealizedProfit(row);
    const tpRows = tps.map((tp, idx) => {
      const label = tp?.note || `TP${idx + 1}`;
      const result = tp?.result || (tp?.done ? "tp" : "");
      const p = cryptoTpProfit(row, tp);
      const finalText = result && p.ok ? `${cryptoTpPercentLabel(row, tp)} ${signedMoney(p.usd)}` : "";
      return `
      <div class="v800-crypto-tp-row v801-crypto-tp-row v802-crypto-tp-row v803-crypto-tp-row ${result ? "done " + result : ""}">
        <span class="tp-label">${escapeHtml(label)}</span>
        <input class="tp-price" type="number" step="0.01" data-crypto-tp="${row.index}:${idx}:price" value="${escapeHtml(tp?.price ?? "")}" placeholder="">
        <input class="tp-profit" type="number" step="0.01" data-crypto-tp="${row.index}:${idx}:profitAmount" value="${escapeHtml(tp?.profitAmount ?? "")}" placeholder="Kâr">
        <div class="tp-result-actions">
          <button type="button" class="tp ${result === "tp" ? "selected" : ""}" data-crypto-tp-result="${row.index}:${idx}:tp">${result === "tp" ? "Kar alındı" : "TP ✓"}</button>
          <button type="button" class="stop ${result === "stop" ? "selected" : ""}" data-crypto-tp-result="${row.index}:${idx}:stop">${result === "stop" ? "Zarar" : "STOP"}</button>
        </div>
        <span class="tp-final ${result === "stop" ? "neg" : result === "tp" ? "pos" : "muted"}">${escapeHtml(finalText)}</span>
      </div>`;
    }).join("");
    return `<article class="v763-active-card crypto v799-crypto-card v800-crypto-card v801-crypto-card v802-crypto-card v803-crypto-card" id="${cardId}">
      <div class="v763-card-top">
        <div><b>${escapeHtml(cleanText(row.name) || "Kripto işlem")}</b></div>
        ${renderCardShotButton(cardId)}
      </div>
      <div class="v763-card-info v799-crypto-info v800-crypto-info v802-crypto-info">
        <span>Tutar <b>${Number(row.stake || 0) ? money(row.stake) : "-"}</b></span>
        <span>Kaldıraç <b>${Number(row.leverage || 1)}x</b></span>
        <span>Giriş <b>${cryptoFormatPrice(row.entryPrice)}</b></span>
        <span>Liq <b>${cryptoFormatPrice(row.liquidationPrice)}</b></span>
        <span>TP Kar <b class="${realized >= 0 ? "pos" : "neg"}">${signedMoney(realized)}</b></span>
        ${missing ? `<em>Eksik bilgi</em>` : ""}
      </div>
      <div class="v799-crypto-detail-grid v800-crypto-detail-grid v801-crypto-detail-grid v802-crypto-detail-grid">
        <label><span>Tutar</span><input type="number" step="0.01" data-crypto-detail="${row.index}:stake" value="${escapeHtml(row.stake || "")}" placeholder="300"></label>
        <label><span>Kaldıraç</span><input type="number" step="1" data-crypto-detail="${row.index}:leverage" value="${escapeHtml(row.leverage || 1)}" placeholder="10"></label>
        <label><span>Giriş Fiyatı</span><input type="number" step="0.01" data-crypto-detail="${row.index}:entryPrice" value="${escapeHtml(row.entryPrice || "")}" placeholder="68000"></label>
        <label><span>Likidasyon</span><input type="number" step="0.01" data-crypto-detail="${row.index}:liquidationPrice" value="${escapeHtml(row.liquidationPrice || "")}" placeholder="62000"></label>
      </div>
      <div class="v799-crypto-tp-box v800-crypto-tp-box v801-crypto-tp-box v802-crypto-tp-box v803-crypto-tp-box">
        <div class="v799-crypto-tp-head v800-crypto-tp-head">
          <b>Kar Alma Noktaları</b>
          <div>
            <button type="button" class="tp-add" data-crypto-tp-op="${row.index}:0:plus">+ TP</button>
            <button type="button" class="tp-remove" data-crypto-tp-op="${row.index}:0:minus" ${tps.length <= 1 ? "disabled" : ""}>− TP</button>
          </div>
        </div>
        ${tpRows}
      </div>
      <div class="v800-crypto-close-row v801-crypto-close-row">
        <button type="button" class="close-trade" data-crypto-close="${row.index}">İşlem Kapandı</button>
      </div>
    </article>`;
  }

  function addCouponHistoryRecord(state, coupon, status) {
    const row = coupon.row || coupon.rows?.[0];
    if (!row) return;
    const totals = rowBetTotals(row);
    const h = loadHistory();
    const now = Date.now();
    const finalStatus = status === "loss" ? "loss" : "win";
    const normalizeMatchResult = v1073NormalizeBetMatchResult;
    const comboResultAt = (idx) => {
      const i = Math.max(0, Number(idx || 0));
      const sourceRows = Array.isArray(coupon?.rows) ? coupon.rows.filter(Boolean) : [];
      const baseIndex = Number(coupon?.slotIndex ?? row?.index ?? 0);
      const freshBase = state?.modeSlots?.bet?.[baseIndex];
      const pools = [
        freshBase?.comboResults,
        coupon?.row?.comboResults,
        row?.comboResults,
        sourceRows[0]?.comboResults
      ];
      for (const pool of pools) {
        if (!Array.isArray(pool)) continue;
        const value = normalizeMatchResult(pool[i]);
        if (value) return value;
      }
      const directRow = sourceRows[i];
      const directFresh = state?.modeSlots?.bet?.[Number(directRow?.index ?? -1)];
      const directStatus = normalizeMatchResult(directFresh?.comboResults?.[0])
        || normalizeMatchResult(directFresh?.comboResults?.[i])
        || normalizeMatchResult(directRow?.comboResults?.[0])
        || normalizeMatchResult(directRow?.comboResults?.[i])
        || normalizeMatchResult(directRow?.status || directRow?.result || directRow?.res);
      if (directStatus) return directStatus;
      const matchStatus = normalizeMatchResult(coupon?.matches?.[i]?.status || coupon?.matches?.[i]?.result || coupon?.matches?.[i]?.res);
      if (matchStatus) return matchStatus;
      return "";
    };
    const hasManualMatchResults = () => {
      const sourceRows = Array.isArray(coupon?.rows) ? coupon.rows.filter(Boolean) : [];
      const baseIndex = Number(coupon?.slotIndex ?? row?.index ?? 0);
      const pools = [state?.modeSlots?.bet?.[baseIndex]?.comboResults, coupon?.row?.comboResults, row?.comboResults, sourceRows[0]?.comboResults];
      if (pools.some(pool => Array.isArray(pool) && pool.some(item => !!normalizeMatchResult(item)))) return true;
      if (Array.isArray(coupon?.matches) && coupon.matches.some(match => !!normalizeMatchResult(match?.status || match?.result || match?.res))) return true;
      if (sourceRows.some((src, idx) => {
        const fresh = state?.modeSlots?.bet?.[Number(src?.index ?? -1)];
        return !!(normalizeMatchResult(src?.status || src?.result || src?.res || src?.comboResults?.[0] || src?.comboResults?.[idx])
          || normalizeMatchResult(fresh?.comboResults?.[0] || fresh?.comboResults?.[idx] || fresh?.status || fresh?.result || fresh?.res));
      })) return true;
      return false;
    };
    const manualResultsExist = hasManualMatchResults();
    const collectCouponMatches = () => {
      const collected = [];
      const addMatch = (match, fallbackIndex) => {
        const name = cleanText(match?.name || match?.match || match?.label || match?.note || "");
        if (!name) return;
        const idx = Number(match?.index ?? fallbackIndex ?? collected.length);
        const ownStatus = normalizeMatchResult(match?.status || match?.result || match?.res);
        const comboStatus = comboResultAt(idx);
        const lineStatus = ownStatus || comboStatus || "";
        collected.push({
          name,
          odds: Number(match?.odds || 0),
          index: idx,
          status: lineStatus
        });
      };
      const couponMatches = Array.isArray(coupon.matches) ? coupon.matches.filter(Boolean) : [];
      if (couponMatches.length >= 2) {
        couponMatches.forEach((match, idx) => addMatch(match, idx));
      }
      const sourceRows = Array.isArray(coupon.rows) && coupon.rows.length ? coupon.rows.filter(Boolean) : [];
      if (!collected.length && sourceRows.length >= 2) {
        sourceRows.forEach((srcRow, rowIdx) => {
          const rowMatches = getSlotMatches(srcRow);
          if (rowMatches.length) rowMatches.forEach(match => addMatch(match, rowIdx));
          else addMatch({
            name: srcRow?.name || srcRow?.match || srcRow?.label || srcRow?.note,
            odds: srcRow?.odds,
            status: srcRow?.comboResults?.[rowIdx] || srcRow?.status || srcRow?.result || srcRow?.res
          }, rowIdx);
        });
      }
      if (!collected.length && couponMatches.length) {
        couponMatches.forEach((match, idx) => addMatch(match, idx));
      }
      if (!collected.length) getSlotMatches(row).forEach((match, idx) => addMatch(match, idx));
      const seen = new Set();
      return collected.filter(match => {
        const key = `${match.name}::${match.odds || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(match => ({
        ...match,
        status: match.status || ""
      }));
    };
    const couponMatches = collectCouponMatches();
    const names = couponMatches.map(m => cleanText(m?.name || "")).filter(Boolean);
    const rec = {
      id: "rh_" + now + "_coupon_" + Math.random().toString(36).slice(2),
      mode: "bet",
      ts: now,
      row: row.index + 1,
      name: `Kombine: ${names.join(" + ") || "Bahis / maç"}`,
      matchLines: names,
      matchOdds: couponMatches.map(m => Number(m?.odds || 0)),
      matchResults: couponMatches.map(m => normalizeMatchResult(m?.status || "")),
      combo: couponMatches.map((m, idx) => ({
        name: cleanText(m?.name || "") || `Maç ${idx + 1}`,
        odds: Number(m?.odds || 0),
        status: normalizeMatchResult(m?.status || "")
      })),
      stake: totals.stake,
      odds: Number((totals.odds || 0).toFixed(4)),
      status: finalStatus,
      pnl: finalStatus === "win" ? Math.max(0, totals.possibleWin - totals.stake) : -totals.stake
    };
    h.bet.unshift(rec);
    saveHistory(h);
    const sourceRows = Array.isArray(coupon.rows) && coupon.rows.length ? coupon.rows : [row];
    sourceRows.forEach((src, idx) => {
      const slot = state.modeSlots.bet[Number(src.index || 0)];
      if (!slot) return;
      slot.status = finalStatus;
      slot.pnl = idx === 0 ? rec.pnl : 0;
      slot.historyId = rec.id;
      slot.historyStatus = finalStatus;
    });
  }
  function applyComboMatchStatus(fresh, requestedIndex, matchIndex, status) {
    const couponBefore = getBetCouponForSlot(fresh, requestedIndex);
    const baseIndex = Number(couponBefore?.slotIndex ?? requestedIndex);
    const slot = fresh?.modeSlots?.bet?.[baseIndex];
    if (!slot) return false;
    if (!Array.isArray(slot.comboResults)) slot.comboResults = [];
    if (status === "pending") slot.comboResults[Number(matchIndex || 0)] = "";
    else slot.comboResults[Number(matchIndex || 0)] = status === "loss" ? "loss" : "win";
    slot.comboResults = slot.comboResults.map(v => (v === "win" || v === "loss") ? v : "");
    const updatedCoupon = getBetCouponForSlot(fresh, baseIndex);
    const matches = updatedCoupon ? getSlotMatches(updatedCoupon.row) : getSlotMatches({ ...slot, index: baseIndex });
    const allDone = status !== "pending" && matches.length > 1 && matches.every(m => m.status === "win" || m.status === "loss");
    if (allDone) {
      const finalStatus = matches.every(m => m.status === "win") ? "win" : "loss";
      addCouponHistoryRecord(fresh, updatedCoupon || { row: { ...slot, index: baseIndex }, rows: [{ ...slot, index: baseIndex }], matches }, finalStatus);
    }
    return true;
  }

  function renderPendingBoard(mode, state) {
    const isCrypto = mode === "crypto";
    if (isCrypto) {
      const rows = pendingRowsForMode(mode, state);
      return `
        <div class="v757-pending-board v759-pending-board v763-pending-board crypto">
          <div class="v757-pending-head v763-pending-head">
            <div>
              <b>Aktif Kripto İşlemleri</b>
              <span>İşlem adı yazılan kutular burada görünür; sonuç verince aktiften düşüp Geçmiş'e gider.</span>
            </div>
            <div class="v757-pending-metrics"><span>${rows.length} aktif</span></div>
          </div>
          <div class="v763-active-list">
            ${rows.length ? rows.map(renderCryptoCard).join("") : `<div class="v759-empty-note">Aktif kripto işlemi yok.</div>`}
          </div>
        </div>`;
    }
    const grouped = getBetCouponGroups(state);
    const cards = [
      ...grouped.singles.map(renderBetSingleCard),
      ...grouped.coupons.map(renderBetComboCard)
    ];
    return `
      <div class="v757-pending-board v759-pending-board v763-pending-board bet">
        <div class="v757-pending-head v763-pending-head">
          <div>
            <b>Aktif Bahisler / Kuponlar</b>
            <span>Tek seçilen satır tekli gider; Kupon 1/2/3/4 seçilen satırlar kendi kupon grubunda birleşir.</span>
          </div>
          <div class="v757-pending-metrics"><span>${grouped.rows.length} aktif</span></div>
        </div>
        <div class="v763-active-list">
          ${cards.length ? cards.join("") : `<div class="v759-empty-note">Aktif bahis veya kupon yok.</div>`}
        </div>
      </div>`;
  }

  function renderModeCommand(mode, slots, state, summary, rollSummaryForMode) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const pending = visible.filter(s => (s.status === "pending" || s.status === "empty" || !s.status) && slotHasUserEntry(s, mode)).length;
    const settled = visible.filter(s => s.status === "win" || s.status === "loss").length;
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const todayPnl = today.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    return `
      <div class="v751-roll-command v753-roll-log-command v757-roll-compact-command ${mode}">
        <div class="v757-command-summary">
          <div>
            <b>${isCrypto ? "Kripto İşlem Paneli" : "Bahis Kupon Paneli"}</b>
            <span>${pending} aktif/bekleyen · ${settled} kapalı · Bugün ${today.length} geçmiş · ${summary.wins} W / ${summary.losses} L · ROI ${Number(summary.roi || 0).toFixed(1)}%</span>
          </div>
        </div>
        <div class="v757-command-micro">
          <span>Bugün <b class="${todayPnl >= 0 ? "pos" : "neg"}">${signedMoney(todayPnl)}</b></span>
          <span>Bu hafta <b>${week.length} kayıt</b></span>
          <span>Sonuç verirken profesyonel onay penceresi açılır; deneme tıklaması Geçmiş'e düşmez.</span>
        </div>
      </div>`;
  }

  function renderLogCenterModal(state) {
    if (!LOG_CENTER_OPEN_MODE) return "";
    const mode = LOG_CENTER_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const month = filterHistoryRows(history, "month");
    const rows = filterHistoryRows(history, HISTORY_FILTER);
    const pnl = rows => rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const filters = ["today","yesterday","week","month","year","twoYears","all"].map(f => `<button type="button" class="${HISTORY_FILTER === f ? "active" : ""}" data-history-filter="${f}">${historyFilterLabel(f)}</button>`).join("");
    const tableRows = rows.length ? rows.map(r => `
      <tr>
        <td>${escapeHtml(formatDateTime(r.ts))}</td>
        <td>${escapeHtml(r.name || (isCrypto ? "Kripto işlem" : "Bahis / maç"))}</td>
        <td>${money(r.stake)}</td>
        <td>${isCrypto ? money(r.odds || 0) : escapeHtml(String(r.odds || 0))}</td>
        <td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td>
        <td><div class="v757-history-pnl-cell v800-history-actions"><span class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</span><button type="button" class="v800-history-restore" data-history-restore="${mode}:${escapeHtml(r.id || "")}" title="Aktife geri al"><i class="fa-solid fa-rotate-left"></i></button><button type="button" class="v757-history-delete" data-history-delete="${mode}:${escapeHtml(r.id || "")}" title="Bu geçmiş kaydını sil"><i class="fa-solid fa-trash"></i></button></div></td>
      </tr>`).join("") : `<tr><td colspan="6" class="v512-history-empty">Bu filtrede geçmiş kaydı yok.</td></tr>`;
    return `
      <div class="v757-log-center-overlay v758-log-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO GEÇMİŞİ" : "BAHİS GEÇMİŞİ"}</b>
              <span>Sonuçlanan kayıtlar ve silme işlemleri.</span>
            </div>
            <button type="button" data-log-center-close>×</button>
          </div>
          <div class="v753-log-strip v757-log-strip-modal v758-log-strip-modal v763-history-strip">
            <div><span>Bugün</span><b>${today.length} kayıt</b><em class="${pnl(today) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(today))}</em></div>
            <div><span>Bu Hafta</span><b>${week.length} kayıt</b><em class="${pnl(week) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(week))}</em></div>
            <div><span>Bu Ay</span><b>${month.length} kayıt</b><em class="${pnl(month) >= 0 ? "pos" : "neg"}">${signedMoney(pnl(month))}</em></div>
          </div>
          <div class="v512-history-filters v758-history-filters">${filters}</div>
          <div class="v512-history-table-wrap v758-history-table-wrap">
            <table class="v512-history-table">
              <thead><tr><th>Tarih / Saat</th><th>${isCrypto ? "İşlem" : "Maç / Not"}</th><th>Tutar</th><th>${isCrypto ? "Net K/Z $" : "Oran"}</th><th>Sonuç</th><th>K/Z / İşlem</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function reportMetricBlock(label, rows) {
    const pnl = rows.reduce((sum, r) => sum + Number(r.pnl || 0), 0);
    const stake = rows.reduce((sum, r) => sum + Number(r.stake || 0), 0);
    const wins = rows.filter(r => r.status === "win").length;
    const losses = rows.filter(r => r.status === "loss").length;
    const roi = stake ? (pnl / stake) * 100 : 0;
    return `<div><span>${label}</span><b class="${pnl >= 0 ? "pos" : "neg"}">${signedMoney(pnl)}</b><em>${rows.length} kayıt · ${wins} W / ${losses} L · ROI ${roi.toFixed(1)}%</em></div>`;
  }
  function renderReportCenterModal(state) {
    if (!REPORT_CENTER_OPEN_MODE) return "";
    const mode = REPORT_CENTER_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    const history = loadHistory()[mode] || [];
    const today = filterHistoryRows(history, "today");
    const week = filterHistoryRows(history, "week");
    const month = filterHistoryRows(history, "month");
    const all = filterHistoryRows(history, "all");
    const recent = all.slice(0, 8).map(r => `<tr><td>${escapeHtml(formatDateTime(r.ts))}</td><td>${escapeHtml(r.name || "-")}</td><td>${money(r.stake)}</td><td><span class="v512-history-status ${r.status}">${r.status === "win" ? (isCrypto ? "KAZANÇ" : "KAZANDI") : (isCrypto ? "KAYIP" : "KAYBETTİ")}</span></td><td class="${Number(r.pnl || 0) >= 0 ? "pos" : "neg"}">${money(r.pnl)}</td></tr>`).join("") || `<tr><td colspan="5" class="v512-history-empty">Henüz rapora girecek kayıt yok.</td></tr>`;
    return `
      <div class="v757-log-center-overlay v758-log-center-overlay">
        <section class="v757-log-center-modal v758-log-center-modal v763-report-modal v799-report-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "KRİPTO RAPOR" : "BAHİS RAPOR"}</b>
              <span>Rapor, Geçmiş kayıtlarından otomatik hesaplanır. Geçmiş silinirse rapor da sıfırlanır.</span>
            </div>
            <button type="button" data-report-center-close>×</button>
          </div>
          <div class="v799-report-metrics">
            ${reportMetricBlock("Bugün", today)}
            ${reportMetricBlock("Bu Hafta", week)}
            ${reportMetricBlock("Bu Ay", month)}
            ${reportMetricBlock("Tümü", all)}
          </div>
          <div class="v512-history-table-wrap v799-report-table">
            <table class="v512-history-table">
              <thead><tr><th>Tarih</th><th>${isCrypto ? "İşlem" : "Maç / Kupon"}</th><th>Tutar</th><th>Sonuç</th><th>K/Z</th></tr></thead>
              <tbody>${recent}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function renderPendingModal(state) {
    if (!PENDING_BOARD_OPEN_MODE) return "";
    const mode = PENDING_BOARD_OPEN_MODE === "crypto" ? "crypto" : "bet";
    const isCrypto = mode === "crypto";
    return `
      <div class="v758-pending-overlay">
        <section class="v758-pending-modal ${mode}">
          <div class="v512-history-head">
            <div>
              <b>${isCrypto ? "AKTİF KRİPTO İŞLEMLERİ" : "AKTİF BAHİSLER / KUPONLAR"}</b>
            </div>
            <button type="button" data-pending-close>×</button>
          </div>
          ${renderPendingBoard(mode, state)}
        </section>
      </div>`;
  }

  function createSlot(type = "bet", i = 0) {
    const slot = { id: i + 1, type, name: "", stake: "", odds: "", cryptoPnlMode: type === "crypto" ? "amount" : "odds", status: "pending", pnl: 0 };
    if (type === "bet") { slot.betKind = "single"; slot.couponGroup = ""; }
    return slot;
  }
  function createSlots(type = "bet", count = 5) {
    return Array.from({ length: count }, (_, i) => createSlot(type, i));
  }
  function sanitizeEmptyPendingSlot(slot, type) {
    if (!slot || slot.status === "win" || slot.status === "loss") return;
    const hasMainName = !!cleanText(slot.name);
    const hasExtraName = Array.isArray(slot.extraMatches) && slot.extraMatches.some(m => cleanText(m?.name));
    if (hasMainName || hasExtraName) return;
    slot.name = "";
    slot.stake = "";
    slot.odds = "";
    slot.pnl = 0;
    slot.status = "pending";
    if (type === "bet") {
      slot.extraMatches = [];
      slot.comboResults = [];
      slot.couponGroup = "";
      slot.betKind = "single";
    }
  }
  function ensureStateShape(state) {
    if (!state.modeSlots || typeof state.modeSlots !== "object") {
      const old = Array.isArray(state.slots) ? state.slots : createSlots("bet", 5);
      state.modeSlots = { bet: old.map((s, i) => ({ ...createSlot("bet", i), ...s, type: "bet" })), crypto: createSlots("crypto", 5) };
    }
    if (!Array.isArray(state.modeSlots.bet)) state.modeSlots.bet = createSlots("bet", 5);
    if (!Array.isArray(state.modeSlots.crypto)) state.modeSlots.crypto = createSlots("crypto", 5);
    if (!state.rowCounts || typeof state.rowCounts !== "object") state.rowCounts = { bet: 20, crypto: 20 };
    if (!state.quickPlan || typeof state.quickPlan !== "object") state.quickPlan = { start: 100, target: 1000, currentOverride: "" };
    if (state.quickPlan.currentOverride === undefined || state.quickPlan.currentOverride === null) state.quickPlan.currentOverride = "";
    if (state.quickPlan.target === undefined || state.quickPlan.target === null) state.quickPlan.target = 1000;
    if (state.quickPlan.start === undefined || state.quickPlan.start === null || state.quickPlan.start === "") state.quickPlan.start = 100;
    ensureQuickTemplates(state);
    ensureQuickPlans(state);
    state.rowCounts.bet = Math.max(1, Math.min(20, Number(state.rowCounts.bet || 20)));
    state.rowCounts.crypto = Math.max(1, Math.min(20, Number(state.rowCounts.crypto || 20)));
    while (state.modeSlots.bet.length < state.rowCounts.bet) state.modeSlots.bet.push(createSlot("bet", state.modeSlots.bet.length));
    while (state.modeSlots.crypto.length < state.rowCounts.crypto) state.modeSlots.crypto.push(createSlot("crypto", state.modeSlots.crypto.length));
    state.modeSlots.bet.forEach((s, i) => { s.type = "bet"; s.id = i + 1; sanitizeEmptyPendingSlot(s, "bet"); });
    normalizeBetCouponGroups(state.modeSlots.bet);
    state.modeSlots.crypto.forEach((s, i) => {
      s.type = "crypto";
      s.id = i + 1;
      if (!s.cryptoPnlMode) s.cryptoPnlMode = "amount";
      if (s.entryPrice === undefined || s.entryPrice === null) s.entryPrice = "";
      if (s.liquidationPrice === undefined || s.liquidationPrice === null) s.liquidationPrice = "";
      if (s.leverage === undefined || s.leverage === null || s.leverage === "") s.leverage = 1;
      if (!Array.isArray(s.takeProfits)) s.takeProfits = [];
      if (!s.takeProfits.length) s.takeProfits = [{ price: "", profitAmount: "", note: "TP1", result: "" }];
      sanitizeEmptyPendingSlot(s, "crypto");
    });
  }
  function loadState() {
    try {
      const legacy = legacyCombinedState();
      const hasSplit = storageHas(STORAGE_KEY_BET) || storageHas(STORAGE_KEY_CRYPTO) || storageHas(STORAGE_KEY_UI);
      const ui = readJson(STORAGE_KEY_UI, {});
      const betStore = normalizeModeStore("bet", readJson(STORAGE_KEY_BET, null), legacy);
      const cryptoStore = normalizeModeStore("crypto", readJson(STORAGE_KEY_CRYPTO, null), legacy);
      const state = {
        ...DEFAULT_STATE,
        bank: Number(ui.bank ?? legacy.bank ?? DEFAULT_STATE.bank),
        modeSlots: { bet: betStore.slots, crypto: cryptoStore.slots },
        rowCounts: { bet: betStore.rowCount, crypto: cryptoStore.rowCount },
        quickTemplates: { bet: betStore.quickTemplate, crypto: cryptoStore.quickTemplate },
        quickPlans: { bet: betStore.quickPlan, crypto: cryptoStore.quickPlan },
        quickPlan: ui.quickPlan && typeof ui.quickPlan === "object" ? ui.quickPlan : (legacy.quickPlan || DEFAULT_STATE.quickPlan)
      };
      ensureStateShape(state);
      syncStateWithHistory(state);
      if (!hasSplit && storageHas(STORAGE_KEY)) saveState(state);
      return state;
    } catch {
      const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      ensureStateShape(state);
      return state;
    }
  }
  function saveState(state) {
    ensureStateShape(state);
    writeJson(STORAGE_KEY_UI, {
      version: 984,
      updatedAt: Date.now(),
      bank: Number(state.bank || DEFAULT_STATE.bank),
      quickPlan: state.quickPlan || { start: 100, target: 1000, currentOverride: "" }
    });
    writeJson(STORAGE_KEY_BET, buildModeStore("bet", state));
    writeJson(STORAGE_KEY_CRYPTO, buildModeStore("crypto", state));
  }
  function recalcSlot(slot) {
    const stake = Number(slot.stake || 0);
    const val = Number(slot.odds || 0);
    if (slot.status === "win") {
      slot.pnl = slot.type === "bet" ? stake * (val - 1) : Math.abs(val);
    } else if (slot.status === "loss") {
      slot.pnl = slot.type === "bet" ? -stake : -Math.abs(val);
    } else slot.pnl = 0;
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
    try { return JSON.parse(localStorage.getItem(ROLLING_KEY) || "{}"); } catch { return {}; }
  }
  function v1053BetOpTotalOdds(op) {
    const raw = Number(op?.odds || 0);
    const comboRows = Array.isArray(op?.combo) ? op.combo : [];
    const comboOdds = comboRows
      .map(row => Number(row?.odds || 0))
      .filter(n => Number.isFinite(n) && n > 0);
    if (comboOdds.length) {
      const product = comboOdds.reduce((p, n) => p * n, 1);
      return Number.isFinite(raw) && raw > 0 ? raw * product : product;
    }
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  function rollingSummary(modeFilter = "all") {
    const db = loadRollingDb();
    let startTotal = 0, currentTotal = 0, pnlTotal = 0;
    Object.entries(db).forEach(([key, plan]) => {
      if (!plan) return;
      const mode = plan.mode || (String(key).startsWith("crypto_") ? "crypto" : "bet");
      if (modeFilter !== "all" && mode !== modeFilter) return;
      let balance = Number(plan.startBal || 0);
      const start = balance;
      Object.values(plan.ops || {}).forEach(dayOps => (dayOps || []).forEach(op => {
        if (!op) return;
        const amt = Number(op.amt || 0);
        const val = Number(op.odds || 0);
        const totalOdds = v1053BetOpTotalOdds(op);
        const pnl = mode === "crypto"
          ? Math.abs(val)
          : (op.res === "win" ? (amt * totalOdds) - amt : amt);
        balance += op.res === "win" ? pnl : -pnl;
      }));
      startTotal += start; currentTotal += balance; pnlTotal += (balance - start);
    });
    return { startTotal, currentTotal, pnlTotal };
  }
  function routeMode() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("rolling/crypto") || raw.startsWith("finance/rolling/crypto")) return "crypto";
    if (raw.startsWith("rolling/bet") || raw.startsWith("rolling/bahis") || raw.startsWith("finance/rolling/bet")) return "bet";
    return "";
  }
  function activeMode() {
    const fromRoute = routeMode();
    if (fromRoute) {
      localStorage.setItem(PAGE_MODE_KEY, fromRoute);
      return fromRoute;
    }
    return localStorage.getItem(PAGE_MODE_KEY) === "crypto" ? "crypto" : "bet";
  }
  function setActiveMode(mode) {
    const next = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(PAGE_MODE_KEY, next);
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    if (raw.startsWith("rolling")) {
      try { history.replaceState({ tab: "rolling" }, "", "#rolling/" + next); } catch {}
    }
  }
  function targetCardOpen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return localStorage.getItem(TARGET_CARD_OPEN_KEY + "_" + m) === "1";
  }
  function setTargetCardOpen(mode, open) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(TARGET_CARD_OPEN_KEY + "_" + m, open ? "1" : "0");
  }
  function targetLogOpen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return localStorage.getItem(TARGET_LOG_OPEN_KEY + "_" + m) === "1";
  }
  function setTargetLogOpen(mode, open) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem(TARGET_LOG_OPEN_KEY + "_" + m, open ? "1" : "0");
  }
  function railCollapsed() { return localStorage.getItem(RAIL_KEY) === "1"; }
  function setRailCollapsed(v) { localStorage.setItem(RAIL_KEY, v ? "1" : "0"); }
  function openRolling(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    localStorage.setItem("finance_rolling_mode", m);
    v1046RememberRollingRoute(m, days);
    if (typeof window.omega_OpenRollingExcel === "function") {
      window.omega_OpenRollingExcel(days);
      const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
      if (raw.startsWith("rolling")) {
        try { history.replaceState({ tab: "rolling", mode: m, rollingDays: days }, "", `#rolling/rolling/${days}`); } catch {}
      }
    }
    else alert("Rolling modülü bulunamadı.");
  }
  function renderRollingButtons(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return [7, 15, 30, 60, 90].map(d => `<button type="button" data-roll="${m}:${d}"><span>${d} GÜNLÜK ROLLING</span></button>`).join("");
  }


  function v1041NormalizeGrowthDays(days) {
    const d = Number(days);
    if (d === 15) return 15;
    if (d === 30) return 30;
    if (d === 60) return 60;
    if (d === 90) return 90;
    return 7;
  }
  function v1041RouteRollingInfo() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    let match = raw.match(/(?:^|\/)rolling\/(bet|bahis|crypto)\/rolling\/(\d+)/);
    if (match) {
      const mode = match[1] === "crypto" ? "crypto" : "bet";
      const days = v1041NormalizeGrowthDays(Number(match[2] || 7));
      return { mode, days };
    }
    match = raw.match(/(?:^|\/)rolling\/rolling\/(\d+)/) || raw.match(/(?:^|\/)finance\/rolling\/(\d+)/);
    if (match) {
      const mode = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
      const days = v1041NormalizeGrowthDays(Number(match[1] || 7));
      return { mode, days };
    }
    return null;
  }
  function v1041GrowthPanelStore() {
    const raw = readJson(GROWTH_PANEL_OPEN_KEY, {});
    return raw && typeof raw === "object" ? raw : {};
  }
  function growthPanelOpen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return v1041GrowthPanelStore()[m] === "1";
  }
  function setGrowthPanelOpen(mode, open) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = v1041GrowthPanelStore();
    store[m] = open ? "1" : "0";
    writeJson(GROWTH_PANEL_OPEN_KEY, store);
  }
  function v1053GrowthPanelViewStore() {
    const raw = readJson(GROWTH_PANEL_VIEW_KEY, {});
    return raw && typeof raw === "object" ? raw : {};
  }
  function growthPanelView(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return v1053GrowthPanelViewStore()[m] === "daily" ? "daily" : "rolling";
  }
  function setGrowthPanelView(mode, view) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const store = v1053GrowthPanelViewStore();
    store[m] = view === "daily" ? "daily" : "rolling";
    writeJson(GROWTH_PANEL_VIEW_KEY, store);
  }
  function v1053TodayDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function v1053DailyLabel(plan, day) {
    const baseRaw = String(plan?.dailyStart || "").trim() || v1053TodayDateKey();
    const base = new Date(`${baseRaw}T12:00:00`);
    if (Number.isNaN(base.getTime())) return `${day}. Gün`;
    base.setDate(base.getDate() + Math.max(0, Number(day || 1) - 1));
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${months[base.getMonth()]} ${base.getDate()}`;
  }

  function v1040DefaultGrowthPlan(mode, days, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const quickStart = Number(getModeQuickPlan(state || {}, m)?.start || 1000);
    return { start: Number.isFinite(quickStart) && quickStart > 0 ? quickStart : 1000, growth: 30, days: d };
  }
  function v1040LoadGrowthPlans() {
    const raw = readJson(GROWTH_PLAN_KEY, {});
    const store = raw && typeof raw === "object" ? raw : {};
    if (!store.active || typeof store.active !== "object") store.active = {};
    if (!store.bet || typeof store.bet !== "object") store.bet = {};
    if (!store.crypto || typeof store.crypto !== "object") store.crypto = {};
    if (!store.daily || typeof store.daily !== "object") store.daily = {};
    if (!store.daily.bet || typeof store.daily.bet !== "object") store.daily.bet = {};
    if (!store.daily.crypto || typeof store.daily.crypto !== "object") store.daily.crypto = {};
    store.active.bet = v1041NormalizeGrowthDays(store.active.bet);
    store.active.crypto = v1041NormalizeGrowthDays(store.active.crypto);
    return store;
  }
  function v1040SaveGrowthPlans(store) {
    writeJson(GROWTH_PLAN_KEY, store && typeof store === "object" ? store : {});
  }

  function v1054GetDailyGrowthPlan(store, mode, days, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    if (!store.daily || typeof store.daily !== "object") store.daily = {};
    if (!store.daily[m] || typeof store.daily[m] !== "object") store.daily[m] = {};
    const fallback = v1040DefaultGrowthPlan(m, d, state);
    const current = store.daily[m] && typeof store.daily[m] === "object" ? store.daily[m] : {};
    const start = Number(current.start ?? fallback.start);
    const growth = v1045SmartGrowthPercent(current.growth ?? fallback.growth);
    const target = Number(current.target ?? v1049CalcTargetFromGrowth(Number.isFinite(start) && start > 0 ? start : fallback.start, growth, d));
    const plan = {
      start: Number.isFinite(start) && start >= 0 ? Number(start.toFixed(2)) : fallback.start,
      growth,
      target: Number.isFinite(target) && target > 0 ? Number(target.toFixed(2)) : Number(v1049CalcTargetFromGrowth(fallback.start, growth, d).toFixed(2)),
      days: d,
      dailyStart: String(current.dailyStart || fallback.dailyStart || v1053TodayDateKey()).slice(0, 10)
    };
    store.daily[m] = plan;
    return plan;
  }
  function v1054ActiveGrowthView(mode) {
    // V1055: Günlük plan ayrı sekme olmaktan çıkarıldı.
    // Günlük defter, Rolling Büyüme Planı içinde "Daha Fazla Göster" olarak açılır.
    return "rolling";
  }
  function v1054GetHeaderPlan(store, mode, days, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return v1040GetGrowthPlan(store, m, days, state);
  }
  function v1054SaveHeaderPlan(store, mode, days, plan) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    if (!store[m] || typeof store[m] !== "object") store[m] = {};
    plan.days = d;
    store.active[m] = d;
    store[m][String(d)] = plan;
  }
  function v1054DateLabelFromTs(ts) {
    const d = new Date(Number(ts || Date.now()));
    if (Number.isNaN(d.getTime())) return "–";
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  function v1054DateKeyFromTs(ts) {
    const d = new Date(Number(ts || Date.now()));
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function v1054CryptoDirectionFromRecord(r) {
    const raw = cleanText(r?.side || r?.direction || r?.position || "");
    if (raw) return raw;
    const name = cleanText(r?.name || r?.label || "");
    if (/\bshort\b/i.test(name)) return "Short";
    if (/\blong\b/i.test(name)) return "Long";
    return "–";
  }
  function v1054CryptoCoinFromRecord(r) {
    const name = cleanText(r?.name || r?.label || "");
    const first = name.split(/[\s\/\-]+/).filter(Boolean)[0] || "İşlem";
    return first.toUpperCase();
  }
  function v1054DailyHistoryRows(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const rows = (loadHistory()[m] || []).filter(r => r && (r.status === "win" || r.status === "loss"));
    return rows.slice().sort((a,b) => Number(a.ts || 0) - Number(b.ts || 0));
  }
  function v1054DailyRoi(mode, r) {
    const stake = Math.abs(Number(r?.stake || 0));
    const pnl = Number(r?.pnl || 0);
    if (mode === "crypto") {
      if (!stake) return "–";
      return `${Number(((pnl / stake) * 100).toFixed(2)).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
    }
    const odds = Number(r?.odds || 0);
    return odds > 0 ? Number(odds.toFixed(4)).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : "-";
  }
  function v1056TimeLabelFromTs(ts) {
    const d = new Date(Number(ts || Date.now()));
    if (Number.isNaN(d.getTime())) return "–";
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  function v1057LedgerBase() {
    return { bet: { overrides: {}, manual: [], deleted: {} }, crypto: { overrides: {}, manual: [], deleted: {} } };
  }
  function v1057LoadLedgerEdits() {
    const raw = readJson(DAILY_LEDGER_EDIT_KEY, v1057LedgerBase());
    const base = v1057LedgerBase();
    const out = raw && typeof raw === "object" ? raw : base;
    ["bet", "crypto"].forEach(m => {
      if (!out[m] || typeof out[m] !== "object") out[m] = { ...base[m] };
      if (!out[m].overrides || typeof out[m].overrides !== "object") out[m].overrides = {};
      if (!Array.isArray(out[m].manual)) out[m].manual = [];
      if (!out[m].deleted || typeof out[m].deleted !== "object") out[m].deleted = {};
    });
    return out;
  }
  function v1057SaveLedgerEdits(store) {
    writeJson(DAILY_LEDGER_EDIT_KEY, store && typeof store === "object" ? store : v1057LedgerBase());
  }
  function v1057SafeLedgerId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 110);
  }
  function v1057TodayDateInput(ts) {
    const d = new Date(Number(ts || Date.now()));
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function v1057DateInputToLabel(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return raw;
    const d = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    return v1054DateLabelFromTs(d.getTime());
  }
  function v1060LedgerDateLabel(row) {
    const raw = String(row?.date || "").trim();
    let d = null;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!d || Number.isNaN(d.getTime())) {
      d = new Date(Number(row?.ts || Date.now()));
    }
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${day} ${months[d.getMonth()] || ""}`.trim();
  }
  function v1061LedgerDateKey(row) {
    const raw = String(row?.date || "").trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(Number(row?.ts || Date.now()));
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function v1061LedgerHasContent(row) {
    return ["item", "kind", "stake", "roi", "pnl"].some(field => String(row?.[field] ?? "").trim());
  }
  function v1060LedgerCellText(text, extraClass = "") {
    return `<span class="v1060-ledger-cell-text ${extraClass}">${escapeHtml(String(text ?? ""))}</span>`;
  }
  function v1057OpName(mode, op) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m === "crypto") {
      const raw = cleanText(op?.coin || op?.symbol || op?.sym || op?.asset || op?.name || op?.label || op?.note || "");
      return raw ? raw.toUpperCase() : "İşlem";
    }
    const fromSlotMatches = getSlotMatches(op || {}).map(r => cleanText(r?.name || r?.match || r?.label || r?.note || "")).filter(Boolean);
    if (fromSlotMatches.length > 1) return fromSlotMatches.join(" + ");
    const comboRows = Array.isArray(op?.combo) ? op.combo : [];
    const comboNames = comboRows.map(r => cleanText(r?.name || r?.match || r?.label || r?.note || "")).filter(Boolean);
    const baseName = cleanText(op?.name || op?.match || op?.label || op?.note || op?.title || "");
    const extraRows = Array.isArray(op?.extraMatches) ? op.extraMatches : [];
    const allNames = [baseName]
      .concat(comboNames)
      .concat(extraRows.map(r => cleanText(r?.name || r?.match || r?.label || r?.note || "")))
      .filter(Boolean);
    if (allNames.length > 1) return allNames.join(" + ");
    return allNames[0] || comboNames[0] || fromSlotMatches[0] || "Bahis / maç";
  }
  function v1068BetMatchLines(source) {
    const rows = [];
    const normalizeStatus = (value) => {
      const raw = cleanText(value || "").toLowerCase();
      if (raw === "loss" || raw === "lost" || raw === "lose" || raw === "kaybetti" || raw === "kayıp" || raw === "zarar") return "loss";
      if (raw === "win" || raw === "won" || raw === "kazandı" || raw === "kazanc" || raw === "kazanç" || raw === "kar" || raw === "kâr") return "win";
      return "";
    };
    const add = (name, odds, status) => {
      const cleanName = cleanText(name || "");
      if (!cleanName) return;
      rows.push({
        name: cleanName,
        odds: Number(odds || 0),
        status: normalizeStatus(status)
      });
    };
    const dedupe = (list) => {
      const seen = new Set();
      return list.filter(row => {
        const key = `${row.name}::${row.odds || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    if (!source || typeof source !== "object") return rows;

    const comboResults = Array.isArray(source.comboResults) ? source.comboResults.map(normalizeStatus) : [];
    const matchResults = Array.isArray(source.matchResults) ? source.matchResults.map(normalizeStatus) : [];
    const comboRowsForStatus = Array.isArray(source.combo) ? source.combo : [];
    const sourceLooksMulti = (Array.isArray(source.matchLines) && source.matchLines.length > 1)
      || (Array.isArray(source.combo) && source.combo.length > 0)
      || (Array.isArray(source.matches) && source.matches.length > 1)
      || (Array.isArray(source.rows) && source.rows.length > 1)
      || (Array.isArray(source.extraMatches) && source.extraMatches.length > 0)
      || (Array.isArray(source.itemLines) && source.itemLines.length > 1);
    const finalStatus = normalizeStatus(source.status || source.result || source.res);
    const statusAt = (idx, fallback = "") => {
      const i = Math.max(0, Number(idx || 0));
      return comboResults[i]
        || matchResults[i]
        || normalizeStatus(fallback)
        || (sourceLooksMulti ? "" : finalStatus);
    };

    // Rolling GÜN kutusu op kaydı: ana maç source.note, ek maçlar source.combo içindedir.
    // Maç bazlı sonuçlar source.comboResults dizisinde tutulur; final kupon sonucu bu diziyi ezmemeli.
    if (Array.isArray(source.combo) && cleanText(source.note || "")) {
      add(source.note, source.odds, statusAt(0));
      source.combo.forEach((row, idx) => add(
        row?.name || row?.match || row?.label || row?.note,
        row?.odds,
        statusAt(idx + 1, row?.status || row?.result || row?.res)
      ));
      if (rows.length) return dedupe(rows);
    }

    if (Array.isArray(source.matchLines) && source.matchLines.length) {
      source.matchLines.forEach((name, idx) => add(
        name,
        Array.isArray(source.matchOdds) ? source.matchOdds[idx] : 0,
        statusAt(idx, comboRowsForStatus[idx]?.status || comboRowsForStatus[idx]?.result || comboRowsForStatus[idx]?.res)
      ));
    }
    if (Array.isArray(source.matches)) {
      source.matches.forEach((match, idx) => add(
        match?.name || match?.match || match?.label || match?.note,
        match?.odds,
        statusAt(idx, match?.status || match?.result || match?.res)
      ));
    }
    if (Array.isArray(source.rows)) {
      source.rows.forEach((row, idx) => add(
        row?.name || row?.match || row?.label || row?.note,
        row?.odds,
        statusAt(idx, row?.status || row?.result || row?.res || row?.comboResults?.[0])
      ));
    }
    if (Array.isArray(source.combo)) {
      source.combo.forEach((row, idx) => add(
        row?.name || row?.match || row?.label || row?.note,
        row?.odds,
        statusAt(idx, row?.status || row?.result || row?.res)
      ));
    }
    if (Array.isArray(source.extraMatches)) {
      source.extraMatches.forEach((row, idx) => add(
        row?.name || row?.match || row?.label || row?.note,
        row?.odds,
        statusAt(idx + 1, row?.status || row?.result || row?.res)
      ));
    }
    getSlotMatches(source).forEach((match, idx) => add(
      match?.name || match?.match || match?.label || match?.note,
      match?.odds,
      statusAt(idx, match?.status || match?.result || match?.res)
    ));
    if (rows.length && cleanText(source.note || source.name || source.match || source.label || "")) {
      const firstName = cleanText(source.note || source.name || source.match || source.label || "");
      const hasFirst = rows.some(row => row.name === firstName);
      if (!hasFirst && (Array.isArray(source.combo) || Array.isArray(source.extraMatches))) {
        rows.unshift({ name: firstName, odds: Number(source.odds || 0), status: statusAt(0) });
      }
    }
    if (!rows.length) {
      const cleaned = v1064CleanComboHistoryName(source.name || source.match || source.label || source.note || source.title || "");
      if (/\s\+\s/.test(cleaned)) cleaned.split(/\s\+\s/).forEach((name, idx) => add(name, 0, statusAt(idx)));
      else if (cleaned) add(cleaned, source.odds, statusAt(0));
    }
    return dedupe(rows);
  }
  function v1068LedgerBetItemLines(op, historyRow) {
    const histLines = v1068BetMatchLines(historyRow);
    if (histLines.length > 1) return histLines;
    const opLines = v1068BetMatchLines(op);
    if (opLines.length > 1) return opLines;
    return histLines.length ? histLines : opLines;
  }
  function v1064CleanComboHistoryName(name) {
    const raw = cleanText(name || "");
    return raw.replace(/^kombine\s*:?\s*/i, "").trim();
  }
  function v1064HistoryBetMap() {
    const h = loadHistory();
    const rows = Array.isArray(h?.bet) ? h.bet : [];
    const map = new Map();
    rows.forEach(r => {
      if (r && r.id) map.set(String(r.id), r);
    });
    return map;
  }
  function v1065FindComboHistoryForOp(op, historyRows, ts, pnl) {
    if (!op || !Array.isArray(historyRows) || !historyRows.length) return null;
    const kind = v1057OpKind("bet", op);
    if (kind !== "Kombine") return null;
    const stake = Math.abs(Number(op?.amt || op?.stake || 0));
    const odds = v1053BetOpTotalOdds(op);
    const status = op?.res === "loss" ? "loss" : op?.res === "win" ? "win" : "";
    const stamp = Number(ts || op?.resultTs || op?.closedTs || op?.ts || 0);
    const candidates = historyRows
      .filter(r => r && /^kombine/i.test(cleanText(r.name || "")))
      .filter(r => !status || String(r.status || "") === status)
      .map(r => {
        let score = 0;
        const hStake = Math.abs(Number(r.stake || 0));
        const hOdds = Number(r.odds || 0);
        const hPnl = Number(r.pnl || 0);
        const hTs = Number(r.ts || 0);
        if (stake && Math.abs(hStake - stake) < 0.01) score += 5;
        if (odds && Math.abs(hOdds - odds) < 0.01) score += 4;
        if (Number.isFinite(Number(pnl)) && Math.abs(hPnl - Number(pnl)) < 0.01) score += 3;
        if (stamp && hTs) {
          const diff = Math.abs(hTs - stamp);
          if (diff < 10 * 60 * 1000) score += 3;
          else if (diff < 24 * 60 * 60 * 1000) score += 1;
        }
        if (/\s\+\s/.test(cleanText(r.name || ""))) score += 2;
        return { r, score };
      })
      .filter(x => x.score >= 5)
      .sort((a,b) => b.score - a.score);
    return candidates[0]?.r || null;
  }
  function v1064LedgerOpItem(mode, op, historyRow) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m === "crypto") return v1057OpName(m, op);
    const lines = v1068LedgerBetItemLines(op, historyRow);
    if (lines.length > 1) return lines.map(line => cleanText(line?.name || "")).filter(Boolean).join(" + ");
    const histName = v1064CleanComboHistoryName(historyRow?.name || "");
    if (histName && /\s\+\s/.test(histName)) return histName;
    const direct = v1057OpName(m, op);
    if (direct && direct !== "Bahis / maç") return direct;
    return histName || direct || "Bahis / maç";
  }
  function v1057OpKind(mode, op) {
    const m = mode === "crypto" ? "crypto" : "bet";
    if (m === "crypto") return v1054CryptoDirectionFromRecord(op);
    const comboRows = Array.isArray(op?.combo) ? op.combo : [];
    if (comboRows.length) return "Kombine";
    if (betCouponGroup(op) || Array.isArray(op?.extraMatches) && op.extraMatches.length) return "Kombine";
    return "Tek";
  }
  function v1057OpRoi(mode, op, pnl) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const stake = Math.abs(Number(op?.amt || op?.stake || 0));
    if (m === "crypto") return stake ? `${Number(((Number(pnl || 0) / stake) * 100).toFixed(2)).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%` : "-";
    const odds = v1053BetOpTotalOdds(op);
    return odds > 0 ? Number(odds.toFixed(4)).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : "-";
  }
  function v1057PlanModeFromKey(key, plan) {
    const raw = String(plan?.mode || "").toLowerCase();
    if (raw === "crypto" || raw === "bet") return raw;
    const k = String(key || "").toLowerCase();
    return k.includes("crypto") ? "crypto" : "bet";
  }
  function v1057EnsureRollingResultTimestamps(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const db = v1045ReadRollingDb();
    let touched = false;
    Object.entries(db || {}).forEach(([key, plan]) => {
      if (!plan || v1057PlanModeFromKey(key, plan) !== m) return;
      const ops = plan.ops && typeof plan.ops === "object" ? plan.ops : {};
      Object.values(ops).forEach(dayOps => {
        if (!Array.isArray(dayOps)) return;
        dayOps.forEach(op => {
          if (!op || (op.res !== "win" && op.res !== "loss")) return;
          if (!op.resultTs && !op.ts && !op.closedTs) {
            op.resultTs = Date.now();
            touched = true;
          }
        });
      });
    });
    if (touched) v1045WriteRollingDb(db);
  }
  function v1057CollectRollingLedgerRows(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    v1057EnsureRollingResultTimestamps(m);
    const db = v1045ReadRollingDb();
    const historyMap = m === "bet" ? v1064HistoryBetMap() : new Map();
    const historyRowsForMatch = m === "bet" ? Array.from(historyMap.values()) : [];
    const rows = [];
    Object.entries(db || {}).forEach(([key, plan]) => {
      if (!plan || v1057PlanModeFromKey(key, plan) !== m) return;
      const ops = plan.ops && typeof plan.ops === "object" ? plan.ops : {};
      Object.entries(ops).forEach(([dayKey, dayOps]) => {
        if (!Array.isArray(dayOps)) return;
        dayOps.forEach((op, opIndex) => {
          if (!op || (op.res !== "win" && op.res !== "loss")) return;
          const day = Number(dayKey || 0);
          const pnl = v1048OpEffect(m, op);
          const ts = Number(op.resultTs || op.closedTs || op.ts || op.updatedAt || op.createdAt || Date.now());
          const planDays = v1041NormalizeGrowthDays(plan.days || (String(key).match(/(\d+)/)?.[1] || 7));
          const directHist = op?.historyId ? historyMap.get(String(op.historyId)) : null;
          const hist = directHist || v1065FindComboHistoryForOp(op, historyRowsForMatch, ts, pnl);
          rows.push({
            id: `auto_${m}_${v1057SafeLedgerId(key)}_${day}_${opIndex}`,
            source: "rolling",
            historyId: op?.historyId || "",
            planKey: key,
            days: planDays,
            day,
            opIndex,
            ts,
            no: rows.length + 1,
            date: v1057TodayDateInput(ts),
            time: v1056TimeLabelFromTs(ts),
            item: v1064LedgerOpItem(m, op, hist),
            itemLines: m === "bet" ? v1068LedgerBetItemLines(op, hist) : [],
            status: op?.res || hist?.status || "",
            kind: v1057OpKind(m, op),
            stake: money(Math.abs(Number(hist?.stake ?? op.amt ?? op.stake ?? 0))),
            roi: hist ? v1054DailyRoi(m, hist) : v1057OpRoi(m, op, pnl),
            pnl: v1069LedgerPnlText(pnl),
            pnlRaw: Number(pnl || 0)
          });
        });
      });
    });
    return rows;
  }
  function v1057CollectHistoryLedgerRows(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return v1054DailyHistoryRows(m).map((r, idx) => {
      const pnl = Number(r.pnl || 0);
      const ts = Number(r.ts || Date.now());
      return {
        id: `hist_${m}_${v1057SafeLedgerId(r.id || idx)}`,
        historyId: r.id || "",
        source: "history",
        ts,
        no: idx + 1,
        date: v1057TodayDateInput(ts),
        time: v1056TimeLabelFromTs(ts),
        item: m === "crypto" ? v1054CryptoCoinFromRecord(r) : (v1064CleanComboHistoryName(r.name || "") || cleanText(r.name || "Bahis / maç")),
        itemLines: m === "bet" ? v1068BetMatchLines(r) : [],
        status: r.status || r.result || r.res || "",
        kind: m === "crypto" ? v1054CryptoDirectionFromRecord(r) : (/^kombine/i.test(cleanText(r.name || "")) ? "Kombine" : "Tek"),
        stake: money(r.stake || 0),
        roi: v1054DailyRoi(m, r),
        pnl: v1069LedgerPnlText(pnl),
        pnlRaw: pnl
      };
    });
  }
  function v1057LedgerRows(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const edits = v1057LoadLedgerEdits();
    const modeEdits = edits[m] || { overrides: {}, manual: [], deleted: {} };
    const byId = new Map();
    const rollingRows = v1057CollectRollingLedgerRows(m);
    const rollingHistoryIds = new Set(rollingRows.map(r => String(r.historyId || "")).filter(Boolean));
    const historyRows = v1057CollectHistoryLedgerRows(m).filter(r => !(r.historyId && rollingHistoryIds.has(String(r.historyId))));
    [...rollingRows, ...historyRows]
      .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
      .forEach(row => {
        if (!row?.id || modeEdits.deleted?.[row.id]) return;
        if (byId.has(row.id)) return;
        const override = modeEdits.overrides?.[row.id] || {};
        const merged = { ...row, ...override, manual: false };
        if (!v1061LedgerHasContent(merged)) return;
        byId.set(row.id, merged);
      });
    (modeEdits.manual || []).forEach(row => {
      if (!row || !row.id || modeEdits.deleted?.[row.id]) return;
      if (v1103IsLedgerTestRow(row) && !v1103LedgerTestModeEnabled()) return;
      const merged = { ts: Number(row.ts || Date.now()), source: "manual", no: "", date: "", time: "", item: "", kind: "", stake: "", roi: "", pnl: "", pnlRaw: 0, ...row, manual: true };
      if (!merged.force && !v1061LedgerHasContent(merged)) return;
      byId.set(row.id, merged);
    });
    return Array.from(byId.values()).sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0)).map((row, idx) => ({ ...row, no: idx + 1 }));
  }
  function v1057DisplayValue(row, field) {
    if (field === "dateLabel") return v1057DateInputToLabel(row.date);
    return String(row?.[field] ?? "");
  }
  function v1057LedgerInput(row, field, extraClass = "") {
    const value = field === "date" ? String(row.date || "") : v1057DisplayValue(row, field);
    const type = field === "date" ? "date" : "text";
    return `<input type="${type}" class="v1057-ledger-input ${extraClass}" value="${escapeHtml(value)}" data-v1057-ledger-id="${escapeHtml(row.id)}" data-v1057-ledger-field="${field}">`;
  }
  function v1057LedgerChunks(rows, size = 25) {
    const chunks = [];
    for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
    if (!chunks.length) chunks.push([]);
    return chunks;
  }
  function v1059LedgerSummary(mode, rows) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const state = loadState();
    const store = v1040LoadGrowthPlans();
    const activeDays = v1041NormalizeGrowthDays(store.active?.[m] || 7);
    const plan = v1040GetGrowthPlan(store, m, activeDays, state);
    const start = Number(plan?.start || getModeQuickPlan(state, m)?.start || 0);
    const totalPnl = (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Number(row?.pnlRaw || 0), 0);
    const current = start + totalPnl;
    const growth = start ? (totalPnl / Math.abs(start)) * 100 : 0;
    return {
      start: Number.isFinite(start) ? start : 0,
      current: Number.isFinite(current) ? current : 0,
      growth: Number.isFinite(growth) ? growth : 0
    };
  }
  function v1059LedgerPctText(value) {
    const n = Number(value || 0);
    return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  function v1063LedgerLiveClockText() {
    try {
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }).format(new Date());
    } catch {
      const d = new Date();
      return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
    }
  }
  function v1063InstallLedgerClock(host) {
    if (LEDGER_CLOCK_TIMER) {
      try { clearInterval(LEDGER_CLOCK_TIMER); } catch {}
      LEDGER_CLOCK_TIMER = null;
    }
    const tick = () => {
      host.querySelectorAll("[data-v1063-ledger-clock]").forEach(el => { el.textContent = v1063LedgerLiveClockText(); });
    };
    tick();
    LEDGER_CLOCK_TIMER = setInterval(tick, 1000);
  }
  function v1063LedgerCell(row, field, extraClass = "") {
    let raw = field === "date" ? (row._displayDate || v1060LedgerDateLabel(row)) : String(row?.[field] ?? "");
    if (field === "stake") {
      const trimmed = raw.trim();
      if (/^\$-?\d[\d,]*\.00$/.test(trimmed)) raw = trimmed.replace(/\.00$/, "");
    }
    const cls = `v1063-ledger-value ${extraClass}`.trim();
    const title = String(raw || "");
    return `<span class="${cls}" title="${escapeHtml(title)}">${escapeHtml(title)}</span>`;
  }
  function v1069LedgerPnlText(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "";
    const abs = Math.abs(n);
    if (n < 0) return "-$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const opts = abs >= 1000 && Number.isInteger(abs)
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return "$" + abs.toLocaleString("en-US", opts);
  }
  function v1069LedgerLineStatus(row, line) {
    const normalize = (value) => {
      const raw = cleanText(value || "").toLowerCase();
      if (raw === "loss" || raw === "lost" || raw === "lose" || raw === "kaybetti" || raw === "kayıp" || raw === "zarar") return "loss";
      if (raw === "win" || raw === "won" || raw === "kazandı" || raw === "kazanc" || raw === "kazanç" || raw === "kar" || raw === "kâr") return "win";
      return "";
    };
    const explicit = normalize(line?.status || line?.result || line?.res || "");
    if (explicit) return explicit;
    const multiLineCombo = Array.isArray(row?.itemLines) && row.itemLines.length > 1;
    const hasLineLevelResults = multiLineCombo && row.itemLines.some(item => !!normalize(item?.status || item?.result || item?.res || ""));
    if (hasLineLevelResults || multiLineCombo) return "pending";
    const rowStatus = normalize(row?.status || row?.result || row?.res || "");
    if (rowStatus) return rowStatus;
    if (Number(row?.pnlRaw || 0) < 0) return "loss";
    if (Number(row?.pnlRaw || 0) > 0) return "win";
    return "pending";
  }
  function v1069LedgerStatusMark(status) {
    if (status === "loss") return "✕";
    if (status === "win") return "✓";
    return "−";
  }
  function v1171LedgerStatusMarkAttrs(status) {
    const s = String(status || "");
    if (s !== "pending" && s !== "push" && s !== "open") return "";
    return ' style="color:#94a3b8!important;font-size:15px!important;line-height:9px!important;font-family:Arial,Helvetica,sans-serif!important;font-weight:1000!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:12px!important;min-width:12px!important;height:12px!important;flex:0 0 12px!important;background:none!important;transform:none!important;position:static!important;visibility:visible!important;opacity:1!important;overflow:visible!important;white-space:nowrap!important;text-align:center!important;margin:0!important;padding:0!important;"';
  }
  function v1172LedgerDashHtml() {
    return '<span class="v1172-ledger-dash-glyph" style="display:inline-block!important;color:#94a3b8!important;font-family:Arial,Helvetica,sans-serif!important;font-size:15px!important;font-weight:1000!important;line-height:8px!important;width:9px!important;min-width:9px!important;height:8px!important;text-align:center!important;vertical-align:middle!important;visibility:visible!important;opacity:1!important;overflow:visible!important;transform:translateY(-1px) scaleX(1.45)!important;transform-origin:center!important;text-shadow:0 0 0 #94a3b8!important;background:none!important;">-</span>';
  }
  function v1119LedgerStatusMarkHtml(status) {
    const s = String(status || "");
    if (s === "pending" || s === "push" || s === "open") return v1172LedgerDashHtml();
    return escapeHtml(v1069LedgerStatusMark(status));
  }
  function v1076LedgerOddsText(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function v1112LedgerMatchNameHtml(name) {
    const safe = escapeHtml(cleanText(name || ""));
    if (!safe) return "";
    return safe
      .replace(/\s+ve\s+(\d+\s+gol\s+atar(?:\s+\d+)*)/giu, '<br class="v1112-ledger-soft-break">ve $1')
      .replace(/\s+ve\s+(\d+(?:[.,]\d+)?\s*(?:üst|alt)\b)/giu, '<br class="v1112-ledger-soft-break">ve $1')
      .replace(/\s+(?:veya|ya da)\s+/giu, '<br class="v1112-ledger-soft-break">$&');
  }
  function v1069LedgerSplitItemText(text) {
    return String(text || "").split(/\s+\+\s+/).map(part => part.replace(/\s*\|\s*\d+(?:[.,]\d+)?\s*$/g, "").trim()).filter(Boolean);
  }
  function v1068LedgerItemCell(row, mode, extraClass = "") {
    if (mode !== "bet") return v1063LedgerCell(row, "item", extraClass);
    const sourceLines = Array.isArray(row?.itemLines) ? row.itemLines : [];
    let lines = sourceLines
      .map(line => ({ ...line, name: cleanText(line?.name || "") }))
      .filter(line => line.name);
    if (!lines.length) {
      lines = v1069LedgerSplitItemText(row?.item || row?.name || "").map(name => ({ name, odds: 0, status: row?.status || row?.result || row?.res || "" }));
    }
    if (!lines.length) lines = [{ name: "Bahis / maç", odds: 0, status: row?.status || row?.result || row?.res || "" }];
    const singleLine = lines.length <= 1;
    const cls = `v1063-ledger-value ${extraClass} v1069-ledger-item-lines ${singleLine ? "v1110-ledger-item-single" : "v1110-ledger-item-multi"}`.trim();
    if (singleLine) {
      const status = v1069LedgerLineStatus(row, lines[0]);
      const mark = v1069LedgerStatusMark(status);
      const name = lines[0].name || cleanText(row?.item || "") || "Bahis / maç";
      const title = `${mark} ${name}`;
      const odds = v1076LedgerOddsText(lines[0]?.odds);
      const oddsHtml = odds ? `<span class="v1076-ledger-match-odd">${escapeHtml(odds)}</span>` : "";
      return `<span class="${cls}" title="${escapeHtml(title)}"><span class="v1069-ledger-match-line ${status}"><span class="v1069-ledger-status-mark"${v1171LedgerStatusMarkAttrs(status)}>${v1119LedgerStatusMarkHtml(status)}</span><span class="v1078-ledger-match-text"><span class="v1069-ledger-match-name">${v1112LedgerMatchNameHtml(name)}</span>${oddsHtml}</span></span></span>`;
    }
    const title = lines.map(line => `${v1069LedgerStatusMark(v1069LedgerLineStatus(row, line))} ${line.name}`).join("\n");
    const body = lines.map((line, lineIndex) => {
      const status = v1069LedgerLineStatus(row, line);
      const name = line.name || "Bahis / maç";
      const odds = v1076LedgerOddsText(line?.odds);
      const oddsHtml = odds ? `<span class="v1076-ledger-match-odd">${escapeHtml(odds)}</span>` : "";
      return `<span class="v1069-ledger-match-line ${status}"><span class="v1069-ledger-status-mark"${v1171LedgerStatusMarkAttrs(status)}>${v1119LedgerStatusMarkHtml(status)}</span><span class="v1078-ledger-match-text"><span class="v1069-ledger-match-name">${v1112LedgerMatchNameHtml(name)}</span>${oddsHtml}</span></span>`;
    }).join("");
    return `<span class="${cls}" title="${escapeHtml(title)}">${body}</span>`;
  }
  function v1063LedgerRowTargetAttrs(row, mode) {
    if (!row || row.source !== "rolling") return "";
    const m = mode === "crypto" ? "crypto" : "bet";
    const days = v1041NormalizeGrowthDays(row.days || 7);
    const day = Math.max(1, Number(row.day || 1));
    const opIndex = Math.max(0, Number(row.opIndex || 0));
    return ` data-v1063-ledger-goto="${m}:${days}:${day}:${opIndex}"`;
  }
  function v1118LedgerBetLineInfo(row) {
    const sourceLines = Array.isArray(row?.itemLines) ? row.itemLines : [];
    let lines = sourceLines.map(line => cleanText(line?.name || "")).filter(Boolean);
    if (!lines.length) lines = v1069LedgerSplitItemText(row?.item || row?.name || "");
    const count = Math.max(1, lines.length || 1);
    const isLong = lines.some(name => /\bve\b|\bveya\b|\bya da\b|gol atar|çifte şans/iu.test(name || ""));
    return { count, isLong };
  }
  function v1118LedgerRowClass(row, mode) {
    if (mode !== "bet" || !v1103LedgerTestModeEnabled()) return "";
    const info = v1118LedgerBetLineInfo(row);
    if (info.count <= 1) return "v1118-ledger-row-single";
    return info.isLong ? "v1118-ledger-row-longcombo" : "v1118-ledger-row-combo";
  }

  function v1063GotoLedgerRow(mode, days, day, opIndex) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days || 7);
    const targetDay = Math.max(1, Number(day || 1));
    const targetOp = Math.max(0, Number(opIndex || 0));
    const host = document.getElementById("v1056-ledger-screen-host");
    if (host) host.innerHTML = "";
    localStorage.setItem("finance_rolling_mode", m);
    localStorage.setItem(PAGE_MODE_KEY, m);
    v1046RememberRollingRoute(m, d);
    try { history.replaceState({ tab: "rolling", mode: m, rollingDays: d }, "", `#rolling/rolling/${d}`); } catch {}
    if (typeof window.omega_OpenRollingExcel === "function") {
      window.omega_OpenRollingExcel(d, true);
      setTimeout(v1043InjectExcelGrowthPlan, 20);
    }
    const focusTarget = (attempt = 0) => {
      const overlay = document.getElementById("rolling-excel-overlay");
      const body = overlay?.querySelector("#excel-body-content") || document.getElementById("excel-body-content");
      const dayRows = Array.from(body?.querySelectorAll(".day-row-capsule") || []);
      const dayRow = dayRows[targetDay - 1] || null;
      const capsulePool = Array.from(dayRow?.querySelectorAll(".capsule-container > .kapsul, .kapsul") || []);
      const capsules = capsulePool.filter(el => !el.closest(".day-row-capsule") || el.closest(".day-row-capsule") === dayRow);
      const target = capsules[targetOp] || null;
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
        target.classList.remove("v1063-ledger-focus-pulse");
        void target.offsetWidth;
        target.classList.add("v1063-ledger-focus-pulse");
        setTimeout(() => target.classList.remove("v1063-ledger-focus-pulse"), 1250);
        return;
      }
      if (attempt < 6) setTimeout(() => focusTarget(attempt + 1), 70 + attempt * 35);
    };
    setTimeout(() => focusTarget(0), 80);
  }
  function v1054RenderDailyPlanPanel(mode, opts = {}) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const rows = v1057LedgerRows(m);
    const decoratedRows = rows.map((row, idx, arr) => {
      const key = v1061LedgerDateKey(row);
      const prevKey = idx > 0 ? v1061LedgerDateKey(arr[idx - 1]) : "";
      return { ...row, _displayDate: key && key === prevKey ? "”" : v1060LedgerDateLabel(row) };
    });
    const chunks = v1110LedgerChunks(decoratedRows, m);
    const pageHtml = v1110LedgerPagerHtml(decoratedRows, m);
    const modal = !!opts.modal;
    const summary = v1059LedgerSummary(m, rows);
    const head = m === "crypto"
      ? `<tr><th>No.</th><th>Tarih</th><th>Coin</th><th>Yön</th><th>Tutar</th><th>ROI</th><th>Kar-zarar</th></tr>`
      : `<tr><th>No.</th><th>Tarih</th><th>Maç / Kupon</th><th>Tür</th><th>Tutar</th><th>Oran</th><th>Kar-zarar</th></tr>`;
    const summaryHtml = `<div class="v1059-ledger-summary v1060-ledger-summary-inline v1061-ledger-summary-inline">
        <div><span>Kasa Başlangıç</span><b>${money(summary.start)}</b></div>
        <div><span>Büyüme Oranı</span><b>${v1059LedgerPctText(summary.growth)}</b></div>
        <div><span>Güncel Kasa</span><b>${money(summary.current)}</b></div>
      </div>`;
    const undoHtml = LEDGER_LAST_DELETE && LEDGER_LAST_DELETE.mode === m
      ? `<div class="v1063-ledger-undo"><span>Satır silindi.</span><button type="button" data-v1063-ledger-undo="${m}">Geri Al</button></div>`
      : "";
    const blocks = chunks.map((chunk, blockIndex) => {
      const rowsHtml = chunk.map((row, localIndex) => {
        const pnlText = String(row.pnl || "");
        const isLoss = /^-/.test(pnlText) || Number(row.pnlRaw || 0) < 0;
        if (row?._v1119Filler) {
          const fillerH = Math.max(0, Number(row._v1119FillerPx || 0));
          return `<tr class="v1119-ledger-row-filler" style="--v1119-filler-h:${fillerH}px"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
        }
        const globalNo = Number(row._ledgerNo || row.no || (blockIndex * 25 + localIndex + 1));
        const itemClass = m === "crypto" ? "coin" : "item";
        const gotoAttrs = v1063LedgerRowTargetAttrs(row, m);
        const rowClass = v1118LedgerRowClass(row, m);
        return `<tr${rowClass ? ` class="${rowClass}"` : ""} data-v1057-ledger-row="${escapeHtml(row.id)}"${gotoAttrs}${gotoAttrs ? ` title="İlgili kutuya gitmek için satıra çift tıkla"` : ""}>
          <td>${v1060LedgerCellText(globalNo, "num")}</td>
          <td>${v1060LedgerCellText(row._displayDate || "", "date")}</td>
          <td>${v1068LedgerItemCell(row, m, itemClass)}</td>
          <td>${v1063LedgerCell(row, "kind")}</td>
          <td>${v1063LedgerCell(row, "stake", "money")}</td>
          <td>${v1063LedgerCell(row, "roi")}</td>
          <td class="v1069-ledger-pnl-cell ${isLoss ? "loss" : "win"}">${v1063LedgerCell(row, "pnl", "pnl-text")}</td>
        </tr>`;
      }).join("");
      return `<section class="v1057-ledger-sheet v1061-ledger-sheet">
        ${blockIndex === 0 ? summaryHtml : v1110LedgerSummarySpacerHtml()}
        <table class="v1057-ledger-excel-table v1061-ledger-excel-table"><thead>${head}</thead><tbody>${rowsHtml}</tbody></table>
      </section>`;
    }).join("");
    return `<section class="v1040-growth-plan ${m} v1044-growth-plan-compact v1046-growth-plan-slim v1048-growth-plan-clean v1053-growth-view-daily v1054-daily-ledger v1057-ledger-excel v1059-ledger-professional v1060-ledger-pro v1061-ledger-pro v1063-ledger-pro v1065-ledger-pro${modal ? " v1056-ledger-modal-table" : ""}" data-growth-plan="${m}" data-growth-view="daily">
      ${undoHtml}
      ${pageHtml}
      <div class="v1057-ledger-sheet-grid v1061-ledger-sheet-grid">${blocks}</div>
    </section>`;
  }
  function v1060BuildLedgerPhotoSvg(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const rawRows = v1057LedgerRows(m);
    const rows = rawRows.map((row, idx, arr) => {
      const key = v1061LedgerDateKey(row);
      const prevKey = idx > 0 ? v1061LedgerDateKey(arr[idx - 1]) : "";
      return { ...row, _displayDate: key && key === prevKey ? "”" : v1060LedgerDateLabel(row) };
    });
    const summary = v1059LedgerSummary(m, rows);
    const title = m === "crypto" ? "KRİPTO İŞLEM DEFTERİ" : "BAHİS / KUPON DEFTERİ";
    const cols = m === "crypto" ? ["No", "Tarih", "Coin", "Yön", "Tutar", "ROI", "Kar-zarar"] : ["No", "Tarih", "Maç / Kupon", "Tür", "Tutar", "Oran", "Kar-zarar"];
    const widths = m === "crypto" ? [34, 78, 108, 58, 68, 48, 80] : [52, 128, 300, 92, 118, 88, 130];
    const safe = (value) => escapeHtml(String(value ?? ""));
    const dataRows = rows.length ? rows : [{ no: "", date: "", _displayDate: "", item: "Kayıt yok", kind: "", stake: "", roi: "", pnl: "", pnlRaw: 0, itemLines: [] }];
    const photoStatusColor = (status) => status === "loss" ? "#991b1b" : status === "win" ? "#059669" : "#475569";
    const wrapText = (value, limit = 32, maxLines = 4) => {
      const raw = cleanText(value || "");
      if (!raw) return [""];
      const words = raw.split(/\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      words.forEach(word => {
        if (!line) {
          line = word;
          return;
        }
        if ((line + " " + word).length <= limit) line += " " + word;
        else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
      const expanded = [];
      lines.forEach(part => {
        if (part.length <= limit) {
          expanded.push(part);
          return;
        }
        for (let i = 0; i < part.length; i += limit) expanded.push(part.slice(i, i + limit));
      });
      if (expanded.length <= maxLines) return expanded;
      const clipped = expanded.slice(0, maxLines);
      clipped[maxLines - 1] = clipped[maxLines - 1].replace(/…?$/, "") + "…";
      return clipped;
    };
    const betPhotoLines = (row) => {
      if (m !== "bet") return [];
      const base = Array.isArray(row?.itemLines) ? row.itemLines : [];
      let lines = base.map(line => ({ ...line, name: cleanText(line?.name || "") })).filter(line => line.name);
      if (!lines.length) lines = v1069LedgerSplitItemText(row?.item || row?.name || "").map(name => ({ name, status: row?.status || row?.result || row?.res || "" }));
      if (!lines.length) lines = [{ name: cleanText(row?.item || "") || "Bahis / maç", status: row?.status || row?.result || row?.res || "" }];
      return lines.map(line => ({ ...line, status: v1069LedgerLineStatus(row, line), wrapped: wrapText(line.name, 34, 4) }));
    };
    const rowMeta = dataRows.map(row => {
      const lines = betPhotoLines(row);
      const textLineCount = m === "bet" ? Math.max(1, lines.reduce((sum, line) => sum + Math.max(1, (line.wrapped || []).length), 0)) : 1;
      const height = m === "bet" ? Math.max(38, 20 + textLineCount * 15 + Math.max(0, lines.length - 1) * 6) : 34;
      return { row, lines, height };
    });
    const tableW = widths.reduce((a,b)=>a+b,0);
    const width = tableW + 80;
    const bodyHeight = rowMeta.reduce((sum, meta) => sum + meta.height, 0);
    const titleY = 62;
    const summaryY = 82;
    const summaryH = 48;
    const headY = summaryY + summaryH;
    const headH = 30;
    const bodyStartY = headY + headH;
    const height = bodyStartY + bodyHeight + 42;
    let x = 40;
    const headerCells = cols.map((c, i) => { const cell = `<rect x="${x}" y="${headY}" width="${widths[i]}" height="${headH}" fill="#d5dbe4" stroke="#0f172a"/><text x="${x + widths[i]/2}" y="${headY + 20}" text-anchor="middle" fill="#0f172a" font-size="12" font-family="Arial" font-weight="950">${safe(c)}</text>`; x += widths[i]; return cell; }).join("");
    const summaryLabels = ["Kasa Başlangıç", "Büyüme Oranı", "Güncel Kasa"];
    const summaryValues = [money(summary.start), v1059LedgerPctText(summary.growth), money(summary.current)];
    const summaryColors = ["#9fd27c", "#82bd5f", "#63a64a"];
    const summaryCellW = tableW / 3;
    const summaryCells = summaryLabels.map((label, i) => {
      const sx = 40 + i * summaryCellW;
      const sw = i === 2 ? tableW - summaryCellW * 2 : summaryCellW;
      return `<rect x="${sx}" y="${summaryY}" width="${sw}" height="${summaryH}" fill="${summaryColors[i]}" stroke="#0f172a"/><text x="${sx + sw/2}" y="${summaryY + 19}" text-anchor="middle" fill="#0f172a" font-size="12" font-family="Arial" font-weight="900">${safe(label)}</text><text x="${sx + sw/2}" y="${summaryY + 39}" text-anchor="middle" fill="#04110a" font-size="20" font-family="Arial" font-weight="950">${safe(summaryValues[i])}</text>`;
    }).join("");
    let yCursor = bodyStartY;
    const body = rowMeta.map((meta, idx) => {
      const r = meta.row;
      const y = yCursor;
      yCursor += meta.height;
      const values = m === "crypto"
        ? [r.no || idx + 1, r._displayDate || v1060LedgerDateLabel(r), r.item || "", r.kind || "", r.stake || "", r.roi || "", r.pnl || ""]
        : [r.no || idx + 1, r._displayDate || v1060LedgerDateLabel(r), r.item || "", r.kind || "", r.stake || "", r.roi || "", r.pnl || ""];
      let xx = 40;
      return values.map((v, i) => {
        const isPnl = i === 6;
        const isBetItem = m === "bet" && i === 2;
        const neg = isPnl && (/^-/.test(String(v)) || Number(r.pnlRaw || 0) < 0);
        const fill = isPnl ? (neg ? "#7f1d1d" : "#064e3b") : (isBetItem ? "#0e1629" : "#f8fafc");
        const color = isPnl ? "#ffffff" : (isBetItem ? "#f8fafc" : "#111827");
        const cellStroke = isBetItem ? "#334155" : "#0f172a";
        let cell = `<rect x="${xx}" y="${y}" width="${widths[i]}" height="${meta.height}" fill="${fill}" stroke="${cellStroke}"/>`;
        if (isBetItem) {
          const lines = meta.lines.length ? meta.lines : [{ name: String(v || "Bahis / maç"), status: "pending", wrapped: wrapText(v || "Bahis / maç", 34, 4) }];
          let textOffset = 0;
          cell += lines.map((line, lineIndex) => {
            const status = line.status === "loss" ? "loss" : line.status === "win" ? "win" : "pending";
            const mark = v1069LedgerStatusMark(status);
            const oddsText = v1076LedgerOddsText(line?.odds);
            const wrapped = wrapText(line.name || "Bahis / maç", oddsText ? 30 : 34, 4);
            const firstY = y + 18 + textOffset;
            const markColor = photoStatusColor(status);
            const lineX = xx + 12 + (status === "pending" ? 1 : 0);
            const followX = xx + 31;
            const firstPart = wrapped[0] || "Bahis / maç";
            const separator = "";
            const markSize = status === "pending" ? 18 : 16;
            const markStroke = status === "win" ? "#047857" : status === "loss" ? "#7f1d1d" : markColor;
            const markSvg = status === "pending"
              ? `<line x1="${lineX - 1}" y1="${firstY - 4}" x2="${lineX + 9}" y2="${firstY - 4}" stroke="${markColor}" stroke-width="2.4" stroke-linecap="round"/>`
              : `<text x="${lineX}" y="${firstY}" fill="${markColor}" stroke="${markStroke}" stroke-width="0.7" paint-order="stroke fill" font-size="${markSize}" font-family="Arial, Helvetica, sans-serif" font-weight="1000">${safe(mark)}</text>`;
            const oneLineOdds = oddsText && wrapped.length <= 1 ? `<tspan dx="5" fill="#fbbf24" stroke="none" font-size="12" font-weight="950">${safe(oddsText)}</tspan>` : "";
            const firstText = `${separator}${markSvg}<text x="${followX}" y="${firstY}" fill="#f8fafc" stroke="none" font-size="12" font-family="Arial" font-weight="900">${safe(firstPart)}${oneLineOdds}</text>`;
            const restText = wrapped.slice(1).map((part, wrapIdx, rest) => {
              const isLast = wrapIdx === rest.length - 1;
              const oddTspan = oddsText && isLast ? `<tspan dx="5" fill="#fbbf24" stroke="none" font-size="12" font-weight="950">${safe(oddsText)}</tspan>` : "";
              return `<text x="${followX}" y="${firstY + (wrapIdx + 1) * 15}" fill="#f8fafc" font-size="12" font-family="Arial" font-weight="900">${safe(part)}${oddTspan}</text>`;
            }).join("");
            textOffset += Math.max(1, wrapped.length) * 15 + 4;
            return firstText + restText;
          }).join("");
        } else {
          const rawText = String(v ?? "");
          const limit = i === 2 ? 30 : i === 1 ? 14 : 16;
          const text = safe(rawText.length > limit ? rawText.slice(0, Math.max(0, limit - 1)) + "…" : rawText);
          cell += `<text x="${xx + widths[i]/2}" y="${y + Math.round(meta.height / 2) + 5}" text-anchor="middle" fill="${color}" font-size="12" font-family="Arial" font-weight="850">${text}</text>`;
        }
        xx += widths[i];
        return cell;
      }).join("");
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#020617"/><rect x="22" y="22" width="${width-44}" height="${height-44}" rx="18" fill="#0b1220" stroke="#334155"/><text x="40" y="${titleY}" fill="#f5d0fe" font-size="22" font-family="Arial" font-weight="950">${safe(title)}</text>${summaryCells}${headerCells}${body}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function v1143BuildLedgerScreenPhotoSvg(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const rawRows = v1057LedgerRows(m);
    const rows = rawRows.map((row, idx, arr) => {
      const key = v1061LedgerDateKey(row);
      const prevKey = idx > 0 ? v1061LedgerDateKey(arr[idx - 1]) : "";
      return { ...row, _displayDate: key && key === prevKey ? "”" : v1060LedgerDateLabel(row) };
    });
    const info = v1110LedgerPageInfo(rows, m);
    const chunks = (info.chunks || [[]]).map(chunk => (Array.isArray(chunk) ? chunk : []).filter(row => !row?._v1119Filler));
    const cols = m === "crypto" ? ["No.", "Tarih", "Coin", "Yön", "Tutar", "ROI", "Kar-zarar"] : ["No.", "Tarih", "Maç / Kupon", "Tür", "Tutar", "Oran", "Kar-zarar"];
    const widths = m === "crypto" ? [32, 74, 96, 58, 68, 48, 84] : [42, 92, 248, 72, 66, 44, 90];
    const tableW = widths.reduce((sum, width) => sum + width, 0);
    const gap = 14;
    const margin = 24;
    const titleH = 0;
    const summaryH = 42;
    const headH = 26;
    const padBottom = 28;
    const summary = v1059LedgerSummary(m, rawRows);
    const title = m === "crypto" ? "KRİPTO İŞLEM DEFTERİ" : "BAHİS / KUPON DEFTERİ";
    const safe = (value) => escapeHtml(String(value ?? ""));
    const markColor = status => status === "loss" ? "#ef4444" : status === "win" ? "#10b981" : "#64748b";
    const trimText = (value, limit = 34) => {
      const raw = cleanText(value || "");
      return raw.length > limit ? raw.slice(0, Math.max(0, limit - 1)) + "…" : raw;
    };
    const betLines = row => {
      if (m !== "bet") return [];
      const base = Array.isArray(row?.itemLines) ? row.itemLines : [];
      let lines = base.map(line => ({ ...line, name: cleanText(line?.name || "") })).filter(line => line.name);
      if (!lines.length) lines = v1069LedgerSplitItemText(row?.item || row?.name || "").map(name => ({ name, odds: 0, status: row?.status || row?.result || row?.res || "" }));
      if (!lines.length) lines = [{ name: cleanText(row?.item || "") || "Bahis / maç", odds: 0, status: row?.status || row?.result || row?.res || "" }];
      return lines.map(line => ({ ...line, status: v1069LedgerLineStatus(row, line) }));
    };
    const rowH = row => {
      if (m !== "bet") return 24;
      return Math.max(v1135LedgerRowPx(row, m), 22 + Math.max(1, betLines(row).length) * 15);
    };
    const chunkHeights = chunks.map(chunk => summaryH + headH + chunk.reduce((sum, row) => sum + rowH(row), 0));
    const width = margin * 2 + chunks.length * tableW + Math.max(0, chunks.length - 1) * gap;
    const height = margin + titleH + Math.max(...chunkHeights, summaryH + headH + 24) + padBottom;
    const renderSummary = (x, y, blank = false) => {
      const labels = ["Kasa Başlangıç", "Büyüme Oranı", "Güncel Kasa"];
      const values = [money(summary.start), v1059LedgerPctText(summary.growth), money(summary.current)];
      const colors = ["#9fd27c", "#82bd5f", "#63a64a"];
      const w = tableW / 3;
      return labels.map((label, i) => {
        const sx = x + i * w;
        const sw = i === 2 ? tableW - w * 2 : w;
        const text = blank ? "" : `<text x="${sx + sw / 2}" y="${y + 17}" text-anchor="middle" fill="#0f172a" font-size="10" font-family="Arial" font-weight="950">${safe(label)}</text><text x="${sx + sw / 2}" y="${y + 34}" text-anchor="middle" fill="#04110a" font-size="16" font-family="Arial" font-weight="1000">${safe(values[i])}</text>`;
        return `<rect x="${sx}" y="${y}" width="${sw}" height="${summaryH}" fill="${colors[i]}" stroke="#0f172a"/>${text}`;
      }).join("");
    };
    const renderHead = (x, y) => {
      let xx = x;
      return cols.map((label, i) => {
        const cell = `<rect x="${xx}" y="${y}" width="${widths[i]}" height="${headH}" fill="#d5dbe4" stroke="#0f172a"/><text x="${xx + widths[i] / 2}" y="${y + 17}" text-anchor="middle" fill="#0f172a" font-size="10" font-family="Arial" font-weight="950">${safe(label)}</text>`;
        xx += widths[i];
        return cell;
      }).join("");
    };
    const renderRow = (row, rowIndex, x, y, h) => {
      const pnlText = String(row.pnl || "");
      const isLoss = /^-/.test(pnlText) || Number(row.pnlRaw || 0) < 0;
      const values = m === "crypto"
        ? [row._ledgerNo || row.no || rowIndex + 1, row._displayDate || "", row.item || "", row.kind || "", row.stake || "", row.roi || "", row.pnl || ""]
        : [row._ledgerNo || row.no || rowIndex + 1, row._displayDate || "", row.item || "", row.kind || "", row.stake || "", row.roi || "", row.pnl || ""];
      let xx = x;
      return values.map((value, i) => {
        const isItem = m === "bet" && i === 2;
        const isPnl = i === 6;
        const fill = isPnl ? (isLoss ? "#8b1d1d" : "#065f46") : (isItem ? "#0f172a" : "#f8fafc");
        const stroke = isItem ? "#334155" : "#0f172a";
        let cell = `<rect x="${xx}" y="${y}" width="${widths[i]}" height="${h}" fill="${fill}" stroke="${stroke}"/>`;
        if (isItem) {
          const lines = betLines(row);
          const lineCount = Math.max(1, lines.length);
          const startY = y + Math.max(13, Math.round((h - lineCount * 14) / 2) + 10);
          cell += lines.map((line, lineIndex) => {
            const status = line.status === "loss" ? "loss" : line.status === "win" ? "win" : "pending";
            const color = markColor(status);
            const ty = startY + lineIndex * 14;
            const mx = xx + 10;
            const tx = xx + 27;
            const odds = v1076LedgerOddsText(line?.odds);
            const name = `${trimText(line.name || "Bahis / maç", odds ? 28 : 31)}`;
            const mark = status === "pending" ? `<line x1="${mx}" y1="${ty - 4}" x2="${mx + 8}" y2="${ty - 4}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>` : `<text x="${mx - 1}" y="${ty}" fill="${color}" font-size="13" font-family="Arial" font-weight="1000">${safe(v1069LedgerStatusMark(status))}</text>`;
            const odd = odds ? `<tspan dx="4" fill="#fbbf24" font-weight="1000">${safe(odds)}</tspan>` : "";
            return `${mark}<text x="${tx}" y="${ty}" fill="#f8fafc" font-size="10" font-family="Arial" font-weight="900">${safe(name)}${odd}</text>`;
          }).join("");
        } else {
          const color = isPnl ? "#ffffff" : "#111827";
          const limit = i === 1 ? 12 : i === 3 ? 10 : 16;
          cell += `<text x="${xx + widths[i] / 2}" y="${y + Math.round(h / 2) + 4}" text-anchor="middle" fill="${color}" font-size="10" font-family="Arial" font-weight="900">${safe(trimText(value, limit))}</text>`;
        }
        xx += widths[i];
        return cell;
      }).join("");
    };
    let content = `<rect width="${width}" height="${height}" fill="#020617"/><rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="16" fill="#0b1220" stroke="#334155"/>`;
    let x = margin;
    const topY = margin + titleH;
    chunks.forEach((chunk, chunkIndex) => {
      let y = topY;
      content += renderSummary(x, y, chunkIndex > 0);
      y += summaryH;
      content += renderHead(x, y);
      y += headH;
      chunk.forEach((row, localIndex) => {
        const h = rowH(row);
        content += renderRow(row, localIndex, x, y, h);
        y += h;
      });
      x += tableW + gap;
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`)}`;
  }

  function v1057BindLedgerScreen(host, mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    host.querySelectorAll("[data-v1103-ledger-test-fill-table]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (!v1103LedgerTestModeEnabled()) return;
      const [modeRaw, tableRaw] = String(btn.dataset.v1103LedgerTestFillTable || `${m}:1`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1103FillLedgerTestRowsByTable(safeMode, Number(tableRaw || 1));
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1103-ledger-test-fill]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (!v1103LedgerTestModeEnabled()) return;
      const [modeRaw, targetRaw] = String(btn.dataset.v1103LedgerTestFill || `${m}:60`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1103FillLedgerTestRows(safeMode, Number(targetRaw || 60));
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1139-ledger-long-combo-test]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (!v1103LedgerTestModeEnabled()) return;
      const [modeRaw, tableRaw] = String(btn.dataset.v1139LedgerLongComboTest || `${m}:3`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1139FillLedgerLongComboTestRows(safeMode, Number(tableRaw || 3));
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1140-ledger-full-mix-test]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (!v1103LedgerTestModeEnabled()) return;
      const [modeRaw, tableRaw] = String(btn.dataset.v1140LedgerFullMixTest || `${m}:3`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1140FillLedgerFullMixedTestRows(safeMode, Number(tableRaw || 3));
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1103-ledger-test-clear]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const safeMode = btn.dataset.v1103LedgerTestClear === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1103ClearLedgerTestRows(safeMode);
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1103-ledger-test-disable]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const safeMode = btn.dataset.v1103LedgerTestDisable === "crypto" ? "crypto" : "bet";
      v1110SetLedgerTestPage(safeMode, 0);
      v1103ClearLedgerTestRows(safeMode);
      try { localStorage.removeItem(LEDGER_TEST_MODE_KEY); } catch {}
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1110-ledger-page]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (btn.disabled) return;
      const [modeRaw, action] = String(btn.dataset.v1110LedgerPage || `${m}:next`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      const current = v1110GetLedgerTestPage(safeMode);
      v1110SetLedgerTestPage(safeMode, action === "prev" ? current - 1 : current + 1);
      v1056OpenDailyLedgerScreen(safeMode);
    }));
    host.querySelectorAll("[data-v1057-ledger-add]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const edits = v1057LoadLedgerEdits();
      const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const ts = Date.now();
      edits[m].manual.push({ id, ts, force: 1, no: "", date: v1057TodayDateInput(ts), time: v1056TimeLabelFromTs(ts), item: "", kind: "", stake: "", roi: "", pnl: "", pnlRaw: 0 });
      v1057SaveLedgerEdits(edits);
      v1056OpenDailyLedgerScreen(m);
    }));
    host.querySelectorAll("[data-v1057-ledger-field]").forEach(input => input.addEventListener("input", () => {
      const id = input.dataset.v1057LedgerId || "";
      const field = input.dataset.v1057LedgerField || "";
      if (!id || !field) return;
      const edits = v1057LoadLedgerEdits();
      if (id.startsWith("manual_")) {
        const row = (edits[m].manual || []).find(r => String(r.id) === id);
        if (row) row[field] = input.value;
      } else {
        if (!edits[m].overrides[id]) edits[m].overrides[id] = {};
        edits[m].overrides[id][field] = input.value;
      }
      v1057SaveLedgerEdits(edits);
    }));
    host.querySelectorAll("[data-v1057-ledger-delete]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const id = btn.dataset.v1057LedgerDelete || "";
      if (!id) return;
      const beforeRows = v1057LedgerRows(m);
      const deletedRow = beforeRows.find(r => String(r.id) === id) || null;
      const edits = v1057LoadLedgerEdits();
      if (id.startsWith("manual_")) edits[m].manual = (edits[m].manual || []).filter(r => String(r.id) !== id);
      else edits[m].deleted[id] = 1;
      LEDGER_LAST_DELETE = deletedRow ? { mode: m, row: deletedRow } : null;
      v1057SaveLedgerEdits(edits);
      v1056OpenDailyLedgerScreen(m);
    }));
    host.querySelectorAll("[data-v1063-ledger-undo]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const info = LEDGER_LAST_DELETE;
      if (!info || info.mode !== m || !info.row?.id) return;
      const edits = v1057LoadLedgerEdits();
      const id = String(info.row.id);
      if (id.startsWith("manual_")) {
        const exists = (edits[m].manual || []).some(r => String(r.id) === id);
        if (!exists) edits[m].manual.push({ ...info.row, manual: true });
      } else if (edits[m].deleted) {
        delete edits[m].deleted[id];
      }
      LEDGER_LAST_DELETE = null;
      v1057SaveLedgerEdits(edits);
      v1056OpenDailyLedgerScreen(m);
    }));
    host.querySelectorAll("button[data-v1063-ledger-goto]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const [modeRaw, daysRaw, dayRaw, opRaw] = String(btn.dataset.v1063LedgerGoto || "").split(":");
      v1063GotoLedgerRow(modeRaw || m, daysRaw || 7, dayRaw || 1, opRaw || 0);
    }));
    host.querySelectorAll("tr[data-v1063-ledger-goto]").forEach(row => row.addEventListener("dblclick", event => {
      event.preventDefault();
      event.stopPropagation();
      const [modeRaw, daysRaw, dayRaw, opRaw] = String(row.dataset.v1063LedgerGoto || "").split(":");
      v1063GotoLedgerRow(modeRaw || m, daysRaw || 7, dayRaw || 1, opRaw || 0);
    }));
  }
  function v1056OpenDailyLedgerScreen(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    v1057EnsureRollingResultTimestamps(m);
    let host = document.getElementById("v1056-ledger-screen-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "v1056-ledger-screen-host";
      document.body.appendChild(host);
    }
    const title = m === "crypto" ? "KRİPTO İŞLEM DEFTERİ" : "BAHİS / KUPON DEFTERİ";
    host.innerHTML = `<div class="v1056-ledger-screen-overlay v1057-ledger-screen-overlay" data-v1056-ledger-close>
      <section class="v1056-ledger-screen-modal v1057-ledger-screen-modal v1061-ledger-screen-modal v1065-ledger-screen-modal ${m}" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <header class="v1056-ledger-screen-head v1057-ledger-screen-head v1060-ledger-screen-head v1065-ledger-screen-head">
          <div class="v1112-ledger-title-row"><b>${title}</b>${v1103LedgerTestToolbar(m)}${v1110LedgerHeaderPagerHtml(m)}</div>
          <div class="v1060-ledger-head-actions v1063-ledger-head-actions">
            <span class="v1063-ledger-clock" data-v1063-ledger-clock></span>
            <button type="button" class="v1060-ledger-photo v1061-ledger-photo v1063-ledger-photo" data-v1060-ledger-photo="${m}" title="Defter fotoğrafı"><i class="fa-solid fa-camera"></i></button>
            <button type="button" data-v1056-ledger-close>×</button>
          </div>
        </header>
        <div class="v1056-ledger-screen-body v1057-ledger-screen-body">${v1054RenderDailyPlanPanel(m, { modal: true })}</div>
      </section>
    </div>`;
    v1103EnsureLedgerTestStyles();
    v1110FinalizeLedgerLayout(host);
    v1157PersistLedgerScreenState(m);
    v1063InstallLedgerClock(host);
    host.querySelectorAll("[data-v1056-ledger-close]").forEach(el => el.addEventListener("click", event => {
      if (event.target !== el && !el.hasAttribute("data-v1056-ledger-close")) return;
      if (LEDGER_CLOCK_TIMER) { try { clearInterval(LEDGER_CLOCK_TIMER); } catch {} LEDGER_CLOCK_TIMER = null; }
      v1157ClearLedgerScreenState();
      host.innerHTML = "";
    }));
    host.querySelectorAll("[data-v1060-ledger-photo]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const photoMode = btn.dataset.v1060LedgerPhoto === "crypto" ? "crypto" : "bet";
      v1163OpenLedgerOutputTab(photoMode);
    }));
    v1057BindLedgerScreen(host, m);
  }
  function v1040GetGrowthPlan(store, mode, days, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    if (!store[m] || typeof store[m] !== "object") store[m] = {};
    const fallback = v1040DefaultGrowthPlan(m, d, state);
    const current = store[m][String(d)] && typeof store[m][String(d)] === "object" ? store[m][String(d)] : {};
    const start = Number(current.start ?? fallback.start);
    const growth = v1045SmartGrowthPercent(current.growth ?? fallback.growth);
    const plan = {
      start: Number.isFinite(start) && start > 0 ? start : fallback.start,
      growth,
      days: d,
      dailyStart: String(current.dailyStart || fallback.dailyStart || v1053TodayDateKey()).slice(0, 10)
    };
    store[m][String(d)] = plan;
    return plan;
  }
  function v1040GrowthRows(plan) {
    const start = Math.max(0, Number(plan?.start || 0));
    const growth = v1045SmartGrowthPercent(plan?.growth);
    const days = v1041NormalizeGrowthDays(plan?.days);
    const rows = [];
    let kasa = start;
    for (let day = 1; day <= days; day += 1) {
      const before = kasa;
      const profit = before * (growth / 100);
      const after = before + profit;
      rows.push({ day, before, growth, profit, after });
      kasa = after;
    }
    return rows;
  }
  function v1040GrowthFinal(plan) {
    const rows = v1040GrowthRows(plan);
    return rows.length ? rows[rows.length - 1].after : Number(plan?.start || 0);
  }

  function v1048RollingPlanForMode(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const db = v1045ReadRollingDb();
    const directKey = `${m}_${d}`;
    const fallbackKey = v1045GetExcelPlanKey(m, d);
    const plan = db[directKey] || db[fallbackKey] || null;
    return plan && typeof plan === "object" ? plan : null;
  }
  function v1048OpEffect(mode, op) {
    if (!op || (op.res !== "win" && op.res !== "loss")) return 0;
    const m = mode === "crypto" ? "crypto" : "bet";
    const amt = Math.abs(Number(op.amt || 0));
    const raw = Number(op.odds || 0);
    if (m === "crypto") {
      const fee = Math.max(0, Number(op.fee || op.cost || 0));
      const pnl = op.netMode === "amount"
        ? (op.res === "win" ? Math.max(0, Math.abs(raw) - fee) : Math.abs(raw) + fee)
        : Math.abs(amt * (raw / 100));
      return op.res === "win" ? pnl : -pnl;
    }
    const totalOdds = v1053BetOpTotalOdds(op);
    if (op.res === "win") return (amt * totalOdds) - amt;
    return -amt;
  }
  function v1048GrowthActualRows(mode, days, plan) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days || plan?.days);
    const targets = v1040GrowthRows(plan);
    const rollingPlan = v1048RollingPlanForMode(m, d);
    let runningBalance = Number(rollingPlan?.startBal ?? plan?.start ?? 0);
    const rows = [];
    for (let day = 1; day <= d; day += 1) {
      const ops = Array.isArray(rollingPlan?.ops?.[day]) ? rollingPlan.ops[day].filter(Boolean) : [];
      const hasDayResult = ops.some(op => op && (op.res === "win" || op.res === "loss"));
      const dayEffect = hasDayResult ? ops.reduce((sum, op) => sum + v1048OpEffect(m, op), 0) : 0;
      let displayBalance = null;
      let displayEffect = null;
      if (hasDayResult) {
        runningBalance += dayEffect;
        displayBalance = runningBalance;
        displayEffect = dayEffect;
      } else if (day === 1) {
        displayBalance = runningBalance;
      }
      rows.push({
        day,
        balance: Number.isFinite(displayBalance) ? displayBalance : null,
        effect: Number.isFinite(displayEffect) ? displayEffect : null,
        target: targets[day - 1]?.after ?? null
      });
    }
    return rows;
  }
  function v1048ExcelOverlaySame(mode, days) {
    const overlay = document.getElementById("rolling-excel-overlay");
    const title = String(document.getElementById("excel-modal-title")?.textContent || "").toUpperCase();
    if (!overlay || overlay.style.display === "none") return false;
    const m = mode === "crypto" ? "KRİPTO" : "BAHİS";
    const d = String(v1041NormalizeGrowthDays(days));
    return title.includes(m) && title.includes(d) && title.includes("GÜNLÜK");
  }

  function v1045SmartGrowthPercent(value) {
    const raw = Number(value);
    if (!Number.isFinite(raw)) return 30;
    if (raw < 0) return 0;
    if (raw > 1000) return 1000;
    return raw;
  }
  function v1045GrowthColumnLabel(growth) {
    return "BÜYÜME";
  }
  function v1049RoundMoneyValue(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Number(n.toFixed(2));
  }
  function v1049InputNumberText(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    const fixed = Number(n.toFixed(2));
    return Number.isInteger(fixed) ? String(fixed) : fixed.toFixed(2);
  }
  function v1049CalcTargetFromGrowth(start, growth, days) {
    const s = Math.max(0, Number(start || 0));
    const g = v1045SmartGrowthPercent(growth);
    const d = v1041NormalizeGrowthDays(days);
    if (!Number.isFinite(s) || s <= 0) return 0;
    return v1049RoundMoneyValue(s * Math.pow(1 + (g / 100), d));
  }
  function v1049CalcGrowthFromTarget(start, target, days) {
    const s = Number(start || 0);
    const t = Number(target || 0);
    const d = v1041NormalizeGrowthDays(days);
    if (!Number.isFinite(s) || !Number.isFinite(t) || s <= 0 || t <= 0 || d <= 0) return 0;
    const growth = (Math.pow(t / s, 1 / d) - 1) * 100;
    return v1045SmartGrowthPercent(Number(growth.toFixed(4)));
  }
  function v1049UpdateGrowthStore(mode, days, updater) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const state = loadState();
    const store = v1040LoadGrowthPlans();
    const plan = v1054GetHeaderPlan(store, m, d, state);
    if (typeof updater === "function") updater(plan);
    plan.days = d;
    store.active[m] = d;
    store[m][String(d)] = plan;
    v1040SaveGrowthPlans(store);
    return plan;
  }
  function v1049SyncExcelTargetGrowth(source) {
    const overlay = document.getElementById("rolling-excel-overlay");
    if (!overlay || overlay.style.display === "none") return;
    const ctx = v1043ExcelGrowthContext();
    const mode = ctx.mode === "crypto" ? "crypto" : "bet";
    const days = v1041NormalizeGrowthDays(ctx.days);
    const startInput = document.getElementById("excel-start-bal");
    const targetInput = document.getElementById("excel-target-bal-input");
    const growthInput = document.getElementById("excel-growth-percent-input");
    if (!startInput || !targetInput || !growthInput) return;
    const start = Math.max(0, Number(startInput.value || 0));
    const currentTarget = Math.max(0, Number(targetInput.value || 0));
    const currentGrowth = v1045SmartGrowthPercent(growthInput.value);
    // V1052: HEDEF <-> BÜYÜME % sadece üst satırda taslak olarak senkronlanır.
    // Büyüme Planı tablosu / gün kutuları Planı Uygula basılmadan değiştirilmez.
    if (source === "target") {
      const computedGrowth = v1049CalcGrowthFromTarget(start, currentTarget, days);
      if (Number.isFinite(computedGrowth) && document.activeElement !== growthInput) {
        growthInput.value = v1049InputNumberText(computedGrowth);
      }
      overlay.dataset.v1052DraftGrowth = v1049InputNumberText(computedGrowth);
      overlay.dataset.v1052DraftTarget = v1049InputNumberText(currentTarget);
    } else {
      const computedTarget = v1049CalcTargetFromGrowth(start, currentGrowth, days);
      if (computedTarget > 0 && document.activeElement !== targetInput) {
        targetInput.value = v1049InputNumberText(computedTarget);
      }
      overlay.dataset.v1052DraftGrowth = v1049InputNumberText(currentGrowth);
      overlay.dataset.v1052DraftTarget = v1049InputNumberText(computedTarget);
    }
    overlay.dataset.v1052DraftMode = mode;
    overlay.dataset.v1052DraftDays = String(days);
    overlay.dataset.v1052DraftStart = v1049InputNumberText(start);
    try {
      const store = v1040LoadGrowthPlans();
      const plan = v1054GetHeaderPlan(store, mode, days, loadState());
      plan.start = Number.isFinite(start) ? Number(start.toFixed(2)) : plan.start;
      plan.growth = v1045SmartGrowthPercent(growthInput.value);
      plan.target = Number.isFinite(Number(targetInput.value || 0)) ? Number(Number(targetInput.value || 0).toFixed(2)) : plan.target;
      v1054SaveHeaderPlan(store, mode, days, plan);
      v1040SaveGrowthPlans(store);
    } catch {}
  }
  function v1046RememberRollingRoute(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    try { sessionStorage.setItem(ROLLING_RESTORE_KEY, JSON.stringify({ mode: m, days: d, ts: Date.now() })); } catch {}
  }
  function v1046ReadRememberedRollingRoute() {
    try {
      const raw = sessionStorage.getItem(ROLLING_RESTORE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== "object") return null;
      const age = Date.now() - Number(data.ts || 0);
      if (!Number.isFinite(age) || age > 10 * 60 * 1000) return null;
      const mode = data.mode === "crypto" ? "crypto" : "bet";
      const days = v1041NormalizeGrowthDays(data.days);
      return { mode, days };
    } catch { return null; }
  }
  function v1045GetExcelPlanKey(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    try {
      if (typeof window.omega_GetRollingPlanKeyV47 === "function") return window.omega_GetRollingPlanKeyV47(d);
    } catch {}
    return `${m}_${d}`;
  }
  function v1045ReadRollingDb() {
    try { return JSON.parse(localStorage.getItem(ROLLING_KEY) || "{}"); } catch { return {}; }
  }
  function v1045WriteRollingDb(db) {
    try { localStorage.setItem(ROLLING_KEY, JSON.stringify(db && typeof db === "object" ? db : {})); } catch {}
  }
  function v1045SetExcelConfigValues(mode, days, startValue, targetValue) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const start = Number(startValue);
    const target = Number(targetValue);
    const startInput = document.getElementById("excel-start-bal");
    const targetInput = document.getElementById("excel-target-bal-input");
    if (startInput && Number.isFinite(start)) startInput.value = String(Number(start.toFixed(2)));
    if (targetInput && Number.isFinite(target) && target > 0) targetInput.value = String(Number(target.toFixed(2)));
    const db = v1045ReadRollingDb();
    const key = v1045GetExcelPlanKey(m, d);
    const current = db[key] && typeof db[key] === "object" ? db[key] : { ops: {}, mode: m, days: d };
    current.mode = m;
    current.days = d;
    current.ops = current.ops && typeof current.ops === "object" ? current.ops : {};
    if (Number.isFinite(start)) current.startBal = Number(start.toFixed(2));
    if (Number.isFinite(target) && target > 0) current.targetBal = Number(target.toFixed(2));
    db[key] = current;
    v1045WriteRollingDb(db);
    try { window._ROLLING_DB = db; } catch {}
  }
  function v1045SyncOverlayStartToGrowthPlan(mode, days, startValue) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const start = Number(startValue);
    if (!Number.isFinite(start) || start < 0) return;
    const state = loadState();
    const store = v1040LoadGrowthPlans();
    const plan = v1040GetGrowthPlan(store, m, d, state);
    plan.start = Number(start.toFixed(2));
    plan.days = d;
    store.active[m] = d;
    store[m][String(d)] = plan;
    v1040SaveGrowthPlans(store);
  }
  function v1045SyncGrowthPlanStartToOverlay(mode, days, plan) {
    const startInput = document.getElementById("excel-start-bal");
    if (!startInput || !plan) return;
    const start = Number(plan.start || 0);
    if (Number.isFinite(start)) {
      startInput.value = String(Number(start.toFixed(2)));
      const targetInput = document.getElementById("excel-target-bal-input");
      const target = targetInput ? Number(targetInput.value || 0) : Number(v1040GrowthFinal(plan) || 0);
      v1045SetExcelConfigValues(mode, days, start, target);
    }
  }
  function v1045DecorateExcelDays(mode, days, state) {
    const overlay = document.getElementById("rolling-excel-overlay");
    if (!overlay || overlay.style.display === "none") return;
    // V1046: Gün 1 / Gün 2 kutularına eklenen Büyüme/Bakiye chipleri kaldırıldı.
    overlay.querySelectorAll(".v1045-growth-day-goal").forEach(el => el.remove());
  }
  function v1045BindExcelHeaderSync() {
    const startInput = document.getElementById("excel-start-bal");
    const targetInput = document.getElementById("excel-target-bal-input");
    if (startInput && startInput.dataset.v1045GrowthStartSync !== "1") {
      startInput.dataset.v1045GrowthStartSync = "1";
      const syncStart = () => {
        v1049SyncExcelTargetGrowth("growth");
      };
      startInput.addEventListener("input", syncStart);
      startInput.addEventListener("change", syncStart);
    }
    if (targetInput && targetInput.dataset.v1049GrowthTargetSync !== "1") {
      targetInput.dataset.v1049GrowthTargetSync = "1";
      const syncTarget = () => {
        v1049SyncExcelTargetGrowth("target");
      };
      targetInput.addEventListener("input", syncTarget);
      targetInput.addEventListener("change", syncTarget);
    }
  }
  function v1046EnsureExcelGrowthConfig(mode, days, state) {
    const overlay = document.getElementById("rolling-excel-overlay");
    const targetInput = document.getElementById("excel-target-bal-input");
    const currentNode = document.getElementById("excel-current-bal");
    if (!overlay || !targetInput || !currentNode) return null;
    let item = overlay.querySelector(".v1046-growth-config");
    if (!item) {
      item = document.createElement("div");
      item.className = "config-item v1046-growth-config";
      item.innerHTML = `<label>BÜYÜME %:</label><input type="number" step="0.1" id="excel-growth-percent-input" value="30"><button type="button" class="v1048-growth-apply-top" data-v1048-growth-apply="1">Planı Uygula</button>`;
      const currentItem = currentNode.closest(".config-item");
      if (currentItem && currentItem.parentElement) currentItem.parentElement.insertBefore(item, currentItem);
    }
    const input = item.querySelector("#excel-growth-percent-input") || item.querySelector("input");
    if (!input) return null;
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const store = v1040LoadGrowthPlans();
    const plan = v1054GetHeaderPlan(store, m, d, state || loadState());
    const startInput = document.getElementById("excel-start-bal");
    if (startInput && document.activeElement !== startInput && Number.isFinite(Number(plan.start))) {
      startInput.value = v1049InputNumberText(plan.start);
    }
    if (document.activeElement !== input) input.value = v1049InputNumberText(plan.growth || 0);
    if (document.activeElement !== targetInput) {
      const computedTarget = Number.isFinite(Number(plan.target)) && Number(plan.target) > 0
        ? Number(plan.target)
        : v1049CalcTargetFromGrowth(Number(startInput?.value || plan.start || 0), plan.growth, d);
      if (computedTarget > 0) targetInput.value = v1049InputNumberText(computedTarget);
    }
    input.dataset.growthInput = `${m}:${d}:growth`;
    let applyBtn = item.querySelector('[data-v1048-growth-apply]');
    if (!applyBtn) {
      applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "v1048-growth-apply-top";
      applyBtn.dataset.v1048GrowthApply = "1";
      applyBtn.textContent = "Planı Uygula";
      item.appendChild(applyBtn);
    }
    applyBtn.dataset.growthAction = `${m}:${d}:apply`;
    if (applyBtn.dataset.v1048GrowthBound !== "1") {
      applyBtn.dataset.v1048GrowthBound = "1";
      applyBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const ctx = v1043ExcelGrowthContext();
        const sm = ctx.mode === "crypto" ? "crypto" : "bet";
        const sd = v1041NormalizeGrowthDays(ctx.days);
        const { plan: currentPlan } = v1043SaveGrowthFromOverlay(sm, sd);
        v1043ApplyGrowthPlanToExcel(sm, sd, currentPlan);
      });
    }
    if (input.dataset.v1046GrowthBound !== "1") {
      input.dataset.v1046GrowthBound = "1";
      const sync = () => {
        v1049SyncExcelTargetGrowth("growth");
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    }
    return input;
  }
  function v1055RenderInlineDailyLedger(mode) {
    const m = mode === "crypto" ? "crypto" : "bet";
    return `<div class="v1055-daily-ledger-launch">
      <button type="button" class="v1055-daily-ledger-open" data-v1056-ledger-open="${m}">Daha Fazla Göster</button>
    </div>`;
  }


  function renderGrowthPlanPanel(mode, state) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const view = "rolling";
    const store = v1040LoadGrowthPlans();
    const routeInfo = v1041RouteRollingInfo();
    const ctx = v1043ExcelGrowthContext();
    const activeDays = routeInfo && routeInfo.mode === m ? routeInfo.days : ctx.mode === m ? ctx.days : v1041NormalizeGrowthDays(store.active?.[m]);
    store.active[m] = activeDays;
    v1040SaveGrowthPlans(store);
    const plan = v1040GetGrowthPlan(store, m, activeDays, state);
    const targetRows = v1040GrowthRows(plan);
    const actualRows = v1048GrowthActualRows(m, activeDays, plan);
    const growthLabel = v1045GrowthColumnLabel(plan.growth);
    const blank = `<span class="v1048-growth-empty">—</span>`;
    return `<section class="v1040-growth-plan ${m} v1044-growth-plan-compact v1046-growth-plan-slim v1048-growth-plan-clean v1053-growth-view-${view} v1055-growth-rolling-only" data-growth-plan="${m}" data-growth-view="${view}">
      <div class="v1040-growth-table-wrap v1046-growth-table-wrap">
        <table class="v1040-growth-table v1046-growth-table v1048-growth-table v1056-growth-table-tight">
          <thead><tr><th>Gün</th><th>BAKİYE</th><th>HEDEF</th><th>${growthLabel}</th><th>Güncel Kasa</th></tr></thead>
          <tbody>${targetRows.map((row, idx) => {
            const actual = actualRows[idx]?.balance;
            const effect = actualRows[idx]?.effect;
            const currentValue = Number.isFinite(actual) ? actual : (row.day === 1 ? Number(plan.start || 0) : null);
            const effectValue = Number.isFinite(effect) ? `<b class="v1050-growth-delta ${effect >= 0 ? "win" : "loss"}">${money(effect)}</b>` : blank;
            const baseStart = Number(plan.start || 0);
            const currentClass = Number.isFinite(currentValue) && currentValue < baseStart ? "v1051-current-balance down" : "v1051-current-balance";
            const dayText = `${row.day}. Gün`;
            return `<tr><td>${dayText}</td><td>${money(row.before)}</td><td><strong>${money(row.after)}</strong></td><td>${effectValue}</td><td>${Number.isFinite(currentValue) ? `<b class="${currentClass}">${money(currentValue)}</b>` : blank}</td></tr>`;
          }).join("")}</tbody>
        </table>
      </div>
      ${v1055RenderInlineDailyLedger(m)}
    </section>`;
  }
  function renderRollingGrowthEntry(mode, state) {
    // V1043: Büyüme Planı artık ana Rolling kartında değil;
    // sadece 7/15/30/60/90 Günlük Rolling tam ekranının içinde gösterilir.
    return "";
  }

  function v1043ExcelGrowthContext() {
    const titleText = String(document.getElementById("excel-modal-title")?.textContent || "").toUpperCase();
    const mode = titleText.includes("KRİPTO") || localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
    const titleDays = Number((titleText.match(/(\d+)\s*GÜNLÜK/) || [])[1] || 0);
    let activeDays = Number.isFinite(titleDays) && titleDays > 0 ? titleDays : 0;
    if (!activeDays) {
      try { activeDays = Number(window._ACTIVE_EXCEL_DAYS || 0); } catch { activeDays = 0; }
    }
    if (!activeDays) {
      const store = v1040LoadGrowthPlans();
      activeDays = Number(store.active?.[mode] || 7);
    }
    const days = v1041NormalizeGrowthDays(activeDays);
    return { mode, days };
  }

  function v1043SaveGrowthFromOverlay(mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const state = loadState();
    const store = v1040LoadGrowthPlans();
    const plan = v1054GetHeaderPlan(store, m, d, state);
    const overlay = document.getElementById("rolling-excel-overlay") || document;
    const startInput = document.getElementById("excel-start-bal") || overlay.querySelector(`[data-growth-input="${m}:${d}:start"]`);
    const growthInput = document.getElementById("excel-growth-percent-input") || overlay.querySelector(`[data-growth-input="${m}:${d}:growth"]`);
    const targetInput = document.getElementById("excel-target-bal-input");
    const start = Number(startInput?.value ?? plan.start);
    let growth = Number(growthInput?.value ?? plan.growth);
    if (targetInput && document.activeElement === targetInput) {
      growth = v1049CalcGrowthFromTarget(start, Number(targetInput.value || 0), d);
      if (growthInput) growthInput.value = v1049InputNumberText(growth);
    }
    plan.start = Number.isFinite(start) && start >= 0 ? Number(start.toFixed(2)) : plan.start;
    plan.growth = v1045SmartGrowthPercent(growth);
    if (targetInput) {
      const target = Number(targetInput.value || 0);
      if (Number.isFinite(target) && target > 0) plan.target = Number(target.toFixed(2));
    }
    plan.days = d;
    v1054SaveHeaderPlan(store, m, d, plan);
    v1040SaveGrowthPlans(store);
    return { state, store, plan };
  }

  function v1043ApplyGrowthPlanToExcel(mode, days, plan) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    const finalValue = Number(v1040GrowthFinal(plan).toFixed(2));
    const startValue = Number(Number(plan.start || 0).toFixed(2));
    v1045SetExcelConfigValues(m, d, startValue, finalValue);
    const state = loadState();
    const quick = getModeQuickPlan(state, m);
    quick.start = startValue;
    quick.target = finalValue;
    quick.currentOverride = "";
    saveState(state);
    const body = document.getElementById("excel-body-content");
    const scrollTop = body?.parentElement?.scrollTop || 0;
    const oldVisibility = body ? body.style.visibility : "";
    if (body) body.style.visibility = "hidden";
    try {
      if (typeof window.omega_UpdateExcelConfig === "function") window.omega_UpdateExcelConfig();
      else if (typeof window.omega_RenderExcelTable === "function") window.omega_RenderExcelTable();
      else v1043InjectExcelGrowthPlan();
      v1043InjectExcelGrowthPlan();
      if (body?.parentElement) body.parentElement.scrollTop = scrollTop;
    } finally {
      window.requestAnimationFrame(() => {
        const liveBody = document.getElementById("excel-body-content");
        if (liveBody) liveBody.style.visibility = oldVisibility;
      });
    }
  }

  function v1043InjectExcelGrowthPlan() {
    const overlay = document.getElementById("rolling-excel-overlay");
    if (!overlay || overlay.style.display === "none") return;
    const body = overlay.querySelector("#excel-body-content");
    if (!body) return;
    const { mode, days } = v1043ExcelGrowthContext();
    const state = loadState();
    const store = v1040LoadGrowthPlans();
    store.active[mode] = days;
    v1040GetGrowthPlan(store, mode, days, state);
    v1040SaveGrowthPlans(store);
    let host = overlay.querySelector("#v1043-excel-growth-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "v1043-excel-growth-host";
    }
    if (host.parentElement !== body) body.insertBefore(host, body.firstChild);
    else if (body.firstElementChild !== host) body.insertBefore(host, body.firstChild);
    v1046EnsureExcelGrowthConfig(mode, days, state);
    const baseLabel = mode === "crypto" ? "KRİPTO" : "BAHİS";
    setGrowthPanelView(mode, "rolling");
    const view = "rolling";
    const open = growthPanelOpen(mode);
    host.innerHTML = `<section class="v1043-excel-growth-shell ${mode}" data-v1043-excel-growth-shell="${mode}:${days}">
      <div class="v1043-excel-growth-bar v1053-growth-mode-bar v1055-growth-mode-bar-single">
        <button type="button" class="v758-row-tool v1041-growth-toggle v1053-growth-mode-btn${open ? " active" : ""}" data-v1053-excel-growth-view="${mode}:rolling"><i class="fa-solid fa-chart-line"></i> ${baseLabel} ROLLİNG BÜYÜME PLANI</button>
      </div>
      ${open ? renderGrowthPlanPanel(mode, state) : ""}
    </section>`;
    v1043BindExcelGrowthPlan(host, mode, days);
    v1045BindExcelHeaderSync();
    v1045DecorateExcelDays(mode, days, state);
  }

  function v1043BindExcelGrowthPlan(host, mode, days) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const d = v1041NormalizeGrowthDays(days);
    host.querySelectorAll("[data-v1053-excel-growth-view]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const [modeRaw, viewRaw] = String(btn.dataset.v1053ExcelGrowthView || `${m}:rolling`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      try { v1043SaveGrowthFromOverlay(safeMode, d); } catch {}
      const nextView = "rolling";
      const isSameOpen = growthPanelOpen(safeMode) && growthPanelView(safeMode) === nextView;
      setGrowthPanelView(safeMode, nextView);
      setGrowthPanelOpen(safeMode, !isSameOpen);
      v1043InjectExcelGrowthPlan();
    }));
    host.querySelectorAll("[data-v1056-ledger-open]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      v1056OpenDailyLedgerScreen(btn.dataset.v1056LedgerOpen === "crypto" ? "crypto" : "bet");
    }));
    host.querySelectorAll("[data-v1043-excel-growth-toggle]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      setGrowthPanelOpen(m, !growthPanelOpen(m));
      v1043InjectExcelGrowthPlan();
    }));
    host.querySelectorAll("[data-growth-input]").forEach(input => input.addEventListener("input", () => {
      const [modeRaw, daysRaw] = String(input.dataset.growthInput || `${m}:${d}:start`).split(":");
      v1043SaveGrowthFromOverlay(modeRaw, Number(daysRaw || d));
    }));
    host.querySelectorAll("[data-growth-action]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const [modeRaw, daysRaw, action] = String(btn.dataset.growthAction || `${m}:${d}:calc`).split(":");
      const safeMode = modeRaw === "crypto" ? "crypto" : "bet";
      const safeDays = v1041NormalizeGrowthDays(daysRaw || d);
      if (action === "reset") {
        const state = loadState();
        const store = v1040LoadGrowthPlans();
        const currentStart = Number(document.getElementById("excel-start-bal")?.value || 0);
        const fallback = v1040DefaultGrowthPlan(safeMode, safeDays, state);
        fallback.start = Number.isFinite(currentStart) && currentStart > 0 ? currentStart : fallback.start;
        store.active[safeMode] = safeDays;
        store[safeMode][String(safeDays)] = fallback;
        v1040SaveGrowthPlans(store);
        v1043InjectExcelGrowthPlan();
        return;
      }
      const { plan } = v1043SaveGrowthFromOverlay(safeMode, safeDays);
      if (action === "apply") v1043ApplyGrowthPlanToExcel(safeMode, safeDays, plan);
      else v1043InjectExcelGrowthPlan();
    }));
  }

  function v1043InstallExcelGrowthBridge() {
    const openFn = window.omega_OpenRollingExcel;
    if (typeof openFn === "function" && !openFn.__v1043GrowthWrapped) {
      const originalOpen = openFn;
      const wrappedOpen = function(...args) {
        const daysArg = v1041NormalizeGrowthDays(Number(args[0] || 7));
        const modeArg = localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet";
        v1046RememberRollingRoute(modeArg, daysArg);
        if (v1048ExcelOverlaySame(modeArg, daysArg)) {
          v1043InjectExcelGrowthPlan();
          return undefined;
        }
        const result = originalOpen.apply(this, args);
        v1043InjectExcelGrowthPlan();
        setTimeout(v1043InjectExcelGrowthPlan, 80);
        return result;
      };
      wrappedOpen.__v1043GrowthWrapped = true;
      window.omega_OpenRollingExcel = wrappedOpen;
    }
    const renderFn = window.omega_RenderExcelTable;
    if (typeof renderFn === "function" && !renderFn.__v1043GrowthWrapped) {
      const originalRender = renderFn;
      const wrappedRender = function(...args) {
        const result = originalRender.apply(this, args);
        v1043InjectExcelGrowthPlan();
        return result;
      };
      wrappedRender.__v1043GrowthWrapped = true;
      window.omega_RenderExcelTable = wrappedRender;
    }
  }


  function v1045RollingHashInfo() {
    const raw = String(location.hash || "").replace(/^#\/?/, "").toLowerCase();
    let match = raw.match(/^rolling\/(bet|bahis|crypto)\/rolling\/(\d+)/);
    if (!match) match = raw.match(/^rolling\/rolling\/(\d+)/);
    if (!match) match = raw.match(/^finance\/rolling\/(\d+)/);
    if (match) {
      const hasMode = match.length === 3;
      const mode = hasMode ? (match[1] === "crypto" ? "crypto" : "bet") : (localStorage.getItem("finance_rolling_mode") === "crypto" ? "crypto" : "bet");
      const days = v1041NormalizeGrowthDays(Number(hasMode ? match[2] : match[1]));
      v1046RememberRollingRoute(mode, days);
      return { mode, days };
    }
    if (document.documentElement.classList.contains("rolling-hash-boot")) return v1046ReadRememberedRollingRoute();
    return null;
  }
  function v1045OpenRollingFromHash() {
    const info = v1045RollingHashInfo();
    if (!info) return;
    localStorage.setItem("finance_rolling_mode", info.mode);
    localStorage.setItem(PAGE_MODE_KEY, info.mode);
    v1046RememberRollingRoute(info.mode, info.days);
    try { history.replaceState({ tab: "rolling", mode: info.mode, rollingDays: info.days }, "", `#rolling/rolling/${info.days}`); } catch {}
    try {
      if (typeof window.omega_SwitchMainTab === "function") {
        window.omega_SwitchMainTab("rolling", document.getElementById("nav-rolling"), false);
      }
    } catch {}
    const open = () => {
      const overlay = document.getElementById("rolling-excel-overlay");
      const title = document.getElementById("excel-modal-title");
      const alreadyOpen = overlay && overlay.style.display !== "none" && String(title?.textContent || "").includes(String(info.days));
      if (alreadyOpen || v1048ExcelOverlaySame(info.mode, info.days)) {
        v1043InjectExcelGrowthPlan();
        return;
      }
      const lockKey = `${info.mode}:${info.days}`;
      const lock = window.__v1048RollingOpenLock || {};
      if (lock.key === lockKey && Date.now() - Number(lock.ts || 0) < 900) {
        setTimeout(v1043InjectExcelGrowthPlan, 80);
        return;
      }
      window.__v1048RollingOpenLock = { key: lockKey, ts: Date.now() };
      if (typeof window.omega_OpenRollingExcel === "function") {
        window.omega_OpenRollingExcel(info.days, true);
        setTimeout(v1043InjectExcelGrowthPlan, 20);
      }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(open, 80), { once: true });
    else setTimeout(open, 80);
  }

  setTimeout(v1043InstallExcelGrowthBridge, 0);
  setTimeout(v1043InstallExcelGrowthBridge, 350);
  document.addEventListener("DOMContentLoaded", () => setTimeout(v1043InstallExcelGrowthBridge, 0));
  function v1046BootRollingRestore() {
    [120, 700, 1600].forEach(delay => setTimeout(v1045OpenRollingFromHash, delay));
  }
  window.addEventListener("hashchange", () => setTimeout(v1045OpenRollingFromHash, 120));
  document.addEventListener("DOMContentLoaded", v1046BootRollingRestore);
  v1046BootRollingRestore();

  function renderRowControls(mode, state) {
    const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const label = mode === "crypto" ? "Kripto" : "Bahis";
    const pendingLabel = mode === "crypto" ? "Aktif Kripto İşlemleri" : "Aktif Bahisler / Kuponlar";
    return `<div class="rolling-v48-row-controls v514-row-controls v751-row-controls v758-row-controls v759-row-controls"><span>${count}/20 ${label} Alanı</span><button type="button" data-row-op="${mode}:minus" title="Alan azalt">−</button><button type="button" data-row-op="${mode}:plus" title="Alan ekle">+</button><button type="button" data-row-preset="${mode}:5">5</button><button type="button" data-row-preset="${mode}:10">10</button><button type="button" data-row-preset="${mode}:20">20</button><button type="button" class="v758-row-tool v759-row-tool active" data-pending-open="${mode}"><i class="fa-solid fa-list-check"></i> ${pendingLabel}</button><button type="button" class="v758-row-tool history" data-log-center="${mode}"><i class="fa-solid fa-clock-rotate-left"></i> Geçmiş</button></div>`;
  }

  
  function v997BetMenuTypeLabel(slot) {
    const g = betCouponGroup(slot);
    return g ? `Kupon ${g}` : "Tekli Bahis";
  }
function escapeHtml(str) {
    return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderTable(mode, slots, state) {
    const isCrypto = mode === "crypto";
    const rowCount = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
    const visible = slots.slice(0, rowCount);
    const comboStatusLookup = isCrypto ? {} : getBetComboStatusLookup(state);
    if (isCrypto) {
      return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table v803-crypto-main-table"><thead><tr><th></th><th>#</th><th>Tür</th><th>AKTİF İŞLEM</th><th>Tutar</th></tr></thead><tbody>${visible.map((s, i) => {
        return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell v986-crypto-type-cell"><span class="rolling-v47-type ${mode}">Kripto</span></div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="İşlem"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td></tr>`;
      }).join("")}</tbody></table></div>`;
    }
    const noteHead = "MAÇ";
    const notePH = "Maç";
    const valHead = "ORAN";
    const winText = "KAZANDI";
    const lossText = "KAYBETTİ";
    const pnlHead = "K/Z";
    return `<div class="rolling-v47-table-wrap"><table class="rolling-v47-table"><thead><tr><th><button type="button" class="v781-table-photo-btn" data-main-table-photo="bet" title="Kupon fotoğrafı" aria-label="Kupon fotoğrafı"><i class="fa-solid fa-camera"></i></button></th><th>#</th><th>Tür</th><th>${noteHead}</th><th>${valHead}</th><th>Tutar</th><th>Durum</th><th>${pnlHead}</th><th>İşlem</th></tr></thead><tbody>${visible.map((s, i) => {
      const comboStatus = comboStatusLookup[i] || "";
      const rowStatus = comboStatus || s.status || "pending";
      const status = rowStatus === "win" ? winText : rowStatus === "loss" ? lossText : "BEKLİYOR";
      const pnlClass = Number(s.pnl || 0) >= 0 ? "pos" : "neg";
      const group = betCouponGroup(s);
      const kindClass = group ? "combo" : "single";
      const groupLabel = group ? `Kupon ${group}` : "Tek";
      const groupChoices = [`<button type="button" class="v995-bet-group-option single" data-bet-group-choice="${i}:">Tek</button>`].concat([1,2,3,4].map(n => `<button type="button" class="v995-bet-group-option combo" data-bet-group-choice="${i}:${n}">Kupon ${n}</button>`)).join("");
      const kindSelect = `<div class="v995-bet-group-menu ${kindClass}" data-bet-group-menu="${i}"><button type="button" class="v995-bet-group-toggle ${kindClass}" data-bet-group-toggle="${i}" title="Tekli / kupon grubu seç"><span>${groupLabel}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="v995-bet-group-list" role="menu">${groupChoices}</div></div>`;
      return `<tr><td><button type="button" class="rolling-v495-row-clear" data-clear-row="${mode}:${i}" title="Bu kutuyu temizle"><i class="fa-solid fa-xmark"></i></button></td><td>${i + 1}</td><td><div class="v515-type-history-cell v988-bet-type-cell"><span class="rolling-v47-type ${mode}">Bahis</span>${kindSelect}</div></td><td><input data-mode="${mode}" data-slot="${i}" data-key="name" value="${escapeHtml(s.name)}" placeholder="${notePH}"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="odds" type="number" step="0.01" value="${s.odds || ""}" placeholder="Oran"></td><td><input data-mode="${mode}" data-slot="${i}" data-key="stake" type="number" step="0.01" value="${s.stake || ""}" placeholder="Tutar"></td><td><span class="v757-status-pill ${rowStatus === "win" || rowStatus === "loss" ? rowStatus : "pending"}">${status}</span></td><td class="${pnlClass}">${money(s.pnl || 0)}</td><td><div class="rolling-v47-actions v757-actions"><button type="button" class="win" data-mode="${mode}" data-slot="${i}" data-status="win">${winText}</button><button type="button" class="loss" data-mode="${mode}" data-slot="${i}" data-status="loss">${lossText}</button></div></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function renderModeSplitNotice(mode) {
    return "";
  }

  function renderModePanel(mode, state) {
    const isCrypto = mode === "crypto";
    const slots = isCrypto ? state.modeSlots.crypto : state.modeSlots.bet;
    const sum = slotSummary(slots);
    const rollSum = rollingSummary(mode);
    const menuTitle = isCrypto ? "KRİPTO İŞLEM MENÜSÜ" : "TEKLİ MAÇ / KOMBİNE KUPONLAR MENÜSÜ";
    return `
      <section class="rolling-v47-card ${mode} v49-mode-card">
        <div class="rolling-v47-head">
          <div>
            <h3 class="${isCrypto ? "rolling-v493-title crypto" : "rolling-v493-title bet"}">${isCrypto ? '<span class="rolling-v518-crypto-icons"><i class="fa-brands fa-bitcoin rolling-v493-crypto-icon"></i><img class="rolling-v521-ethereum-svg rolling-v518-ethereum-icon" src="assets/icons/ethereum.svg" alt="Ethereum" loading="lazy"></span>' : '<span class="rolling-v491-bet-icons"><i class="fa-solid fa-futbol"></i><i class="fa-solid fa-basketball"></i></span>'} <span>${isCrypto ? "KRİPTO" : "BAHİS"}</span></h3>
          </div>
          <div class="rolling-v47-mini">
            <span>Rolling ${money(rollSum.pnlTotal)} · Menü ${money(sum.pnl)}</span>
            <b class="${sum.pnl >= 0 ? "pos" : "neg"}">${money(sum.pnl)}</b>
          </div>
        </div>

        ${renderModeSplitNotice(mode)}

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-crypto-roll-title" : "rolling-v493-fold-title bet rolling-v494-bet-roll-title"}"><i class="fa-solid fa-layer-group"></i> <span ${isCrypto ? 'style="color:#fbbf24 !important;text-shadow:0 0 10px rgba(251,191,36,.24);"' : ""}>${isCrypto ? "KRİPTO ROLLING" : "BAHİS ROLLING"}</span></summary>
          <div class="rolling-v47-roll-panel ${mode}">
            <div class="rolling-v47-roll-buttons">${renderRollingButtons(mode)}</div>
            ${renderRollingGrowthEntry(mode, state)}
          </div>
        </details>

        <details class="rolling-v49-fold ${mode}" open>
          <summary class="${isCrypto ? "rolling-v493-fold-title crypto rolling-v494-active-title" : "rolling-v493-fold-title bet rolling-v494-combine-title"}"><i class="fa-solid ${isCrypto ? "fa-chart-simple" : "fa-list-check"}" ${isCrypto ? "" : 'style="color:#22c55e !important;text-shadow:0 0 10px rgba(34,197,94,.35);"'}></i> <span>${menuTitle}</span></summary>
          <div class="rolling-v47-section-title">
            <div>${renderRowControls(mode, state)}</div>
            <button type="button" data-clear="${mode}">TÜMÜNÜ TEMİZLE</button>
          </div>
          ${renderTable(mode, slots, state)}
        </details>
      </section>`;
  }
  function renderPlanControl(state, mode = "bet", modePnl = 0) {
    const m = mode === "crypto" ? "crypto" : "bet";
    const plan = getPlanNumbers(state, modePnl, m);
    const modeLabel = m === "crypto" ? "Kripto" : "Bahis";
    return `
      <details class="v796-target-card v798-target-card v802-target-card v984-target-card ${m}" data-target-card="${m}" ${targetCardOpen(m) ? "open" : ""}>
        <summary class="v802-target-summary v984-target-summary v985-target-summary">
          <div class="v984-target-head v985-target-head">
            <button type="button" class="v758-row-tool history v984-target-history-btn" data-target-history-open="${m}">Geçmiş</button>
            <span class="v985-target-detail-toggle" aria-hidden="true"></span>
          </div>
          <b class="v984-target-title v985-target-title">${modeLabel} Kasa Hedefi</b>
          <div class="v802-target-mini-grid v984-target-mini-grid v985-target-mini-grid">
            <span>Başlangıç <b>${money(plan.start)}</b></span>
            <span>Hedef <b>${plan.target ? money(plan.target) : "Hedef gir"}</b></span>
            <span>Güncel <b>${money(plan.current)}</b></span>
            <span>Kalan <b>${plan.target ? money(plan.remaining) : "-"}</b></span>
          </div>
        </summary>

        <div class="v796-target-bar v798-target-bar"><u style="width:${plan.pct.toFixed(1)}%"></u></div>

        <div class="v796-target-metrics v798-target-metrics">
          <span>Kasa Hedefi K/Z <b class="${plan.pnl >= 0 ? "pos" : "neg"}">${signedMoney(plan.pnl)}</b></span>
          <span>Büyüme <b class="${plan.growth >= 0 ? "pos" : "neg"}">${pctText(plan.growth)}</b></span>
          <span>Kalan <b>${plan.target ? money(plan.remaining) : "-"}</b></span>
        </div>

        <div class="v798-target-detail v802-target-detail">
          <div class="v796-target-values">
            <label><span>Başlangıç</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="start" value="${plan.start}"></label>
            <label><span>Güncel</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="currentOverride" value="${plan.hasManualCurrent ? plan.current : ""}" placeholder="${money(plan.autoCurrent)}"></label>
            <label><span>Hedef</span><input type="number" step="1" data-rolling-target-mode="${m}" data-rolling-quick="target" value="${plan.target || ""}" placeholder="Hedef gir"></label>
          </div>

          ${renderTargetActiveBox(state, m)}

          <div class="v796-target-actions">
            <button type="button" data-target-reset data-rolling-target-mode="${m}">Yeni Hedef</button>
            <button type="button" class="complete" data-target-complete data-rolling-target-mode="${m}" ${plan.done ? "" : "disabled"}>Hedefi Bitir</button>
          </div>
        </div>
      </details>`;
  }


  function renderModule() {
    const mount = qs("omega-rolling-render");
    if (!mount) return;
    const state = loadState();
    const betSum = slotSummary(state.modeSlots.bet);
    const cryptoSum = slotSummary(state.modeSlots.crypto);
    const betRollSum = rollingSummary("bet");
    const cryptoRollSum = rollingSummary("crypto");
    const mode = activeMode();
    const isCrypto = mode === "crypto";
    const modeSum = isCrypto ? cryptoSum : betSum;
    const modeRollSum = isCrypto ? cryptoRollSum : betRollSum;
    const modeLabel = isCrypto ? "KRİPTO" : "BAHİS";
    const modeIcon = isCrypto ? "fa-brands fa-bitcoin" : "fa-solid fa-layer-group";
    const modePlanPnl = v812TargetRealizedPnl(mode);
    const modePlanStart = getModeQuickPlan(state, mode).start || 100;
    const modePlanGrowth = growthPct(modePlanPnl, modePlanStart);
    const menuKpiLabel = isCrypto ? "Kripto İşlem Menüsü K/Z" : "Kombine Kuponlar Menüsü K/Z";
    mount.innerHTML = `
      <div class="rolling-v47-page v48-rolling-page v49-rolling-page" data-rolling-screen="${mode}">
        <div class="rolling-v47-hero v48-rolling-hero">
          <div><h2><i class="${modeIcon}"></i> <span ${isCrypto ? 'style="color:#fbbf24 !important;text-shadow:0 0 10px rgba(251,191,36,.24);"' : ""}>${modeLabel} ROLLING</span></h2><span class="v798-hero-note">${modeLabel} Genel Performans Özeti</span></div>
          <div class="rolling-v47-hero-kpis v753-rolling-kpis v756-rolling-kpis">
            <div><span>Kasa Hedefi K/Z</span><b class="${modePlanPnl >= 0 ? "pos" : "neg"}">${signedMoney(modePlanPnl)}</b><em>${pctText(modePlanGrowth)} hedef alanı</em></div>
            <div><span>${isCrypto ? "Kripto" : "Bahis"} Rolling K/Z</span><b class="${modeRollSum.pnlTotal >= 0 ? "pos" : "neg"}">${signedMoney(modeRollSum.pnlTotal)}</b><em>Başlangıç ${money(modeRollSum.startTotal || 0)}</em></div>
            <div><span>${menuKpiLabel}</span><b class="${modeSum.pnl >= 0 ? "pos" : "neg"}">${signedMoney(modeSum.pnl)}</b><em>${modeSum.settled} kapalı · Açık ${money(modeSum.open)}</em></div>
          </div>
        </div>

        <div class="rolling-v48-layout v49-rolling-layout">
          <aside class="rolling-v48-rail v49-rolling-rail" data-rolling-owned-menu="${mode}">
            ${renderPlanControl(state, mode, 0)}
          </aside>
          <main class="rolling-v48-main">${renderModePanel(mode, state)}</main>
        </div>
        ${renderPendingModal(state)}
        ${renderLogCenterModal(state)}
        ${renderHistoryModal()}
        ${renderConfirmDialog()}
      </div>`;
    bindEvents(mount, state);
    v1157RestoreLedgerScreenState();
  }
  function applySlotResult(state, mode, i, nextStatus) {
    const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
    if (!list[i]) list[i] = createSlot(mode, i);
    const prevStatus = list[i].status;
    list[i].type = mode;
    if (nextStatus === "pending") {
      list[i].status = "pending";
      list[i].pnl = 0;
      list[i].historyStatus = "";
      list[i].historyId = "";
      return;
    }
    list[i].status = nextStatus;
    recalcSlot(list[i]);
    if ((list[i].status === "win" || list[i].status === "loss") && (prevStatus !== list[i].status || list[i].historyStatus !== list[i].status)) {
      addHistoryRecord(mode, list[i], i);
    }
  }
  function downloadActiveCardScreenshot(cardId) {
    const match = String(cardId || "").match(/v763-bet-card-(\d+)/);
    const slotIndex = match ? Number(match[1]) : -1;
    const state = loadState();
    const grouped = getBetCouponGroups(state);
    const coupon = grouped.coupons.find(c => Number(c.slotIndex) === slotIndex);
    const single = grouped.singles.find(r => Number(r.index) === slotIndex);
    let rows = [];
    if (coupon) {
      const totals = rowBetTotals(coupon.row);
      rows = [{
        index: coupon.slotIndex + 1,
        type: "Kombine",
        name: coupon.matches.map(m => cleanText(m.name)).filter(Boolean).join(" + "),
        matchLines: coupon.matches.map(m => cleanText(m.name)).filter(Boolean),
        matchOdds: coupon.matches.map(m => Number(m.odds || 0)),
        matchResults: coupon.matches.map(m => v1073NormalizeBetMatchResult(m.status || m.result || m.res)),
        stake: Number(coupon.row.stake || 0),
        odds: Number(totals.odds || 0),
        possible: Number(totals.possibleWin || 0)
      }];
    } else if (single) {
      const totals = rowBetTotals(single);
      rows = [{
        index: single.index + 1,
        type: "Bahis",
        name: cleanText(single.name),
        matchLines: [cleanText(single.name)],
        matchOdds: [Number(single.odds || 0)],
        stake: Number(single.stake || 0),
        odds: Number(totals.odds || 0),
        possible: Number(totals.possibleWin || 0)
      }];
    }
    if (!rows.length) return;
    const svg = v785BuildBetPhotoSvg(rows, 'BAHİS FOTOĞRAFI');
    if (!svg) return;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    openRollingPhotoPreview(dataUrl, `bulten-bahis-fotografi-${new Date().toISOString().slice(0,10)}.png`, 'Bahis Fotoğrafı', 'Aktif Bahisler / Kuponlar');
  }

  function buildCryptoCardPhotoSvg(row) {
    const safe = escapeHtml;
    const tps = Array.isArray(row.takeProfits) && row.takeProfits.length ? row.takeProfits : [];
    const tpLines = tps.slice(0, 8).map((tp, idx) => {
      const y = 255 + idx * 42;
      const p = cryptoTpProfit(row, tp);
      const profit = p.ok ? `${p.usd >= 0 ? "+" : ""}${p.usd.toFixed(2)} $ · ${p.pct >= 0 ? "+" : ""}${p.pct.toFixed(1)}%` : "-";
      const status = tp?.result === "stop" ? "ZARAR" : (tp?.result === "tp" || tp?.done) ? "ALINDI" : "BEKLİYOR";
      return `<rect x="42" y="${y - 27}" width="816" height="34" rx="10" fill="#0f172a" stroke="#334155"/><text x="64" y="${y - 4}" fill="#f8fafc" font-size="18" font-family="Arial" font-weight="850">TP${idx + 1}</text><text x="160" y="${y - 4}" fill="#fbbf24" font-size="18" font-family="Arial" font-weight="900">${tp?.price ? safe(tp.price) : "-"}</text><text x="430" y="${y - 4}" fill="#22c55e" font-size="18" font-family="Arial" font-weight="950">${safe(profit)}</text><text x="830" y="${y - 4}" text-anchor="end" fill="${tp?.result === "stop" ? "#ef4444" : (tp?.result === "tp" || tp?.done) ? "#22c55e" : "#94a3b8"}" font-size="16" font-family="Arial" font-weight="950">${status}</text>`;
    }).join("");
    const footerY = 280 + Math.max(1, tps.length) * 42;
    const height = footerY + 130;
    const title = safe(cleanText(row.name) || "Kripto İşlem");
    const realized = cryptoRealizedProfit(row);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}"><rect width="900" height="${height}" fill="#020617"/><rect x="22" y="22" width="856" height="${height-44}" rx="24" fill="#0b1120" stroke="#38bdf8" stroke-width="2"/><text x="42" y="72" fill="#38bdf8" font-size="28" font-family="Arial" font-weight="900">AKTİF KRİPTO İŞLEMİ</text><text x="42" y="108" fill="#f8fafc" font-size="22" font-family="Arial" font-weight="900">${title}</text><text x="42" y="145" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="800">${new Date().toLocaleString("tr-TR")}</text><rect x="42" y="170" width="816" height="50" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="202" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="850">Giriş: ${row.entryPrice || "-"}</text><text x="330" y="202" fill="#e5e7eb" font-size="18" font-family="Arial" font-weight="850">Likidasyon: ${row.liquidationPrice || "-"}</text><text x="830" y="202" text-anchor="end" fill="${realized >= 0 ? "#22c55e" : "#ef4444"}" font-size="18" font-family="Arial" font-weight="950">TP Kar: ${signedMoney(realized)}</text><text x="42" y="246" fill="#94a3b8" font-size="15" font-family="Arial" font-weight="900">KAR ALMA NOKTALARI</text>${tpLines || `<text x="64" y="268" fill="#94a3b8" font-size="18" font-family="Arial" font-weight="800">TP noktası yok</text>`}<rect x="42" y="${footerY}" width="816" height="58" rx="14" fill="#111827" stroke="#334155"/><text x="64" y="${footerY + 36}" fill="#e5e7eb" font-size="19" font-family="Arial" font-weight="900">Tutar: ${money(row.stake || 0)}</text><text x="830" y="${footerY + 36}" text-anchor="end" fill="${Number(row.pnl || 0) >= 0 ? "#22c55e" : "#ef4444"}" font-size="20" font-family="Arial" font-weight="950">PNL: ${money(row.pnl || 0)}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function downloadCryptoCardScreenshot(slotIndex) {
    const state = loadState();
    const row = { ...(state.modeSlots.crypto[Number(slotIndex || 0)] || {}), index: Number(slotIndex || 0) };
    if (!slotHasUserEntry(row, "crypto")) return;
    const dataUrl = buildCryptoCardPhotoSvg(row);
    openRollingPhotoPreview(dataUrl, `bulten-kripto-islem-${new Date().toISOString().slice(0,10)}.png`, 'Kripto İşlem Fotoğrafı', 'Aktif Kripto İşlemleri');
  }

  function deleteHistoryRecord(mode, id) {
    const h = loadHistory();
    h[mode] = (h[mode] || []).filter(r => r.id !== id);
    saveHistory(h);
    const state = loadState();
    ["bet", "crypto"].forEach(m => (state.modeSlots[m] || []).forEach(slot => {
      if (slot && slot.historyId === id) {
        slot.historyId = "";
        slot.historyStatus = "";
        slot.status = slotHasUserEntry(slot, m) ? "pending" : "pending";
        slot.pnl = 0;
        if (m === "bet") { slot.comboResults = []; slot.couponGroup = ""; slot.betKind = "single"; }
      }
    }));
    syncStateWithHistory(state);
    saveState(state);
  }

  function restoreHistoryRecord(mode, id) {
    const h = loadHistory();
    const m = mode === "crypto" ? "crypto" : "bet";
    const rec = (h[m] || []).find(r => r.id === id);
    if (!rec) return;
    const state = loadState();
    const list = state.modeSlots[m] || [];
    let index = list.findIndex(s => s && s.historyId === id);
    if (index < 0) index = list.findIndex(s => !slotHasUserEntry(s, m));
    if (index < 0) {
      index = list.length;
      list.push(createSlot(m, index));
    }
    const slot = { ...createSlot(m, index), ...(list[index] || {}) };
    slot.type = m;
    slot.id = index + 1;
    slot.name = rec.name || "";
    slot.stake = rec.stake || "";
    slot.odds = rec.odds || "";
    slot.status = "pending";
    slot.pnl = 0;
    slot.historyId = "";
    slot.historyStatus = "";
    if (m === "crypto") {
      slot.entryPrice = rec.entryPrice || slot.entryPrice || "";
      slot.liquidationPrice = rec.liquidationPrice || slot.liquidationPrice || "";
      slot.leverage = rec.leverage || slot.leverage || 1;
      slot.takeProfits = Array.isArray(rec.takeProfits) && rec.takeProfits.length
        ? rec.takeProfits.map((tp, i) => ({ price: tp.price || "", profitAmount: tp.profitAmount || "", note: tp.note || `TP${i + 1}`, result: tp.result || (tp.done ? "tp" : ""), done: !!tp.done }))
        : [{ price: "", profitAmount: "", note: "TP1", result: "" }];
    }
    list[index] = slot;
    state.modeSlots[m] = list;
    h[m] = (h[m] || []).filter(r => r.id !== id);
    saveHistory(h);
    saveState(state);
  }

  function renderFloatingPanel() {
    let host = document.getElementById("omega-rolling-feature-host");
    const hasOpen = Boolean(PENDING_BOARD_OPEN_MODE || LOG_CENTER_OPEN_MODE || REPORT_CENTER_OPEN_MODE || TARGET_HISTORY_OPEN_MODE || CONFIRM_DIALOG);
    if (!hasOpen) {
      if (host) host.remove();
      return;
    }
    if (!host) {
      host = document.createElement("div");
      host.id = "omega-rolling-feature-host";
      host.dataset.rollingFloating = "1";
      document.body.appendChild(host);
    }
    const state = loadState();
    host.dataset.rollingFloating = "1";
    host.style.display = "block";
    host.innerHTML = `${renderPendingModal(state)}${renderLogCenterModal(state)}${renderTargetHistoryModal()}${renderConfirmDialog()}`;
    bindEvents(host, state);
  }

  function refreshForMount(mount) {
    if (mount && mount.dataset && mount.dataset.rollingFloating === "1") renderFloatingPanel();
    else renderModule();
  }

  function bindEvents(mount, state) {
    const refresh = () => refreshForMount(mount);
    mount.querySelectorAll("[data-roll]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, daysRaw] = String(btn.dataset.roll || "bet:7").split(":");
      const m = mode === "crypto" ? "crypto" : "bet";
      const days = Number(daysRaw || 7);
      if ([7, 15, 30, 60, 90].includes(days)) {
        const store = v1040LoadGrowthPlans();
        store.active[m] = v1041NormalizeGrowthDays(days);
        v1040GetGrowthPlan(store, m, days, state);
        v1040SaveGrowthPlans(store);
      }
      openRolling(m, days);
    }));

    const v1040SaveGrowthFromDom = (mode, days) => {
      const m = mode === "crypto" ? "crypto" : "bet";
      const d = v1041NormalizeGrowthDays(days);
      const store = v1040LoadGrowthPlans();
      const plan = v1040GetGrowthPlan(store, m, d, state);
      const startInput = mount.querySelector(`[data-growth-input="${m}:${d}:start"]`);
      const growthInput = mount.querySelector(`[data-growth-input="${m}:${d}:growth"]`);
      const start = Number(startInput?.value ?? plan.start);
      const growth = Number(growthInput?.value ?? plan.growth);
      plan.start = Number.isFinite(start) && start >= 0 ? Number(start.toFixed(2)) : plan.start;
      plan.growth = v1045SmartGrowthPercent(growth);
      store.active[m] = d;
      store[m][String(d)] = plan;
      v1040SaveGrowthPlans(store);
      return { store, plan };
    };
    mount.querySelectorAll("[data-growth-days]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, daysRaw] = String(btn.dataset.growthDays || "bet:7").split(":");
      const m = mode === "crypto" ? "crypto" : "bet";
      const days = v1041NormalizeGrowthDays(daysRaw);
      const store = v1040LoadGrowthPlans();
      store.active[m] = days;
      v1040GetGrowthPlan(store, m, days, state);
      v1040SaveGrowthPlans(store);
      refresh();
    }));
    mount.querySelectorAll("[data-growth-input]").forEach(input => input.addEventListener("input", () => {
      const [mode, daysRaw] = String(input.dataset.growthInput || "bet:7:start").split(":");
      v1040SaveGrowthFromDom(mode, Number(daysRaw || 7));
    }));
    mount.querySelectorAll("[data-growth-action]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, daysRaw, action] = String(btn.dataset.growthAction || "bet:7:calc").split(":");
      const m = mode === "crypto" ? "crypto" : "bet";
      const days = v1041NormalizeGrowthDays(daysRaw);
      if (action === "reset") {
        const store = v1040LoadGrowthPlans();
        store.active[m] = days;
        store[m][String(days)] = v1040DefaultGrowthPlan(m, days, state);
        v1040SaveGrowthPlans(store);
        refresh();
        return;
      }
      const { plan } = v1040SaveGrowthFromDom(m, days);
      if (action === "apply") {
        const quick = getModeQuickPlan(state, m);
        quick.start = Number(Number(plan.start || 0).toFixed(2));
        quick.target = Number(v1040GrowthFinal(plan).toFixed(2));
        quick.currentOverride = "";
        saveState(state);
      }
      refresh();
    }));
    mount.querySelectorAll("[data-growth-panel-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const m = btn.dataset.growthPanelToggle === "crypto" ? "crypto" : "bet";
      setGrowthPanelOpen(m, !growthPanelOpen(m));
      refresh();
    }));
    mount.querySelectorAll("[data-row-op]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, op] = String(btn.dataset.rowOp || "bet:plus").split(":");
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      const current = Math.max(1, Math.min(20, Number(state.rowCounts[mode] || 20)));
      if (op === "plus") {
        state.rowCounts[mode] = Math.min(20, current + 1);
        while (state.modeSlots[mode].length < state.rowCounts[mode]) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      } else state.rowCounts[mode] = Math.max(1, current - 1);
      saveState(state); refresh();
    }));
    mount.querySelectorAll("[data-row-preset]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, raw] = String(btn.dataset.rowPreset || "bet:20").split(":");
      const count = Math.max(1, Math.min(20, Number(raw || 20)));
      state.rowCounts = state.rowCounts || { bet: 20, crypto: 20 };
      state.rowCounts[mode] = count;
      while (state.modeSlots[mode].length < count) state.modeSlots[mode].push(createSlot(mode, state.modeSlots[mode].length));
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-quick-template]").forEach(input => input.addEventListener("input", () => {
      const [mode, key] = String(input.dataset.quickTemplate || "bet:stake").split(":");
      ensureQuickTemplates(state);
      state.quickTemplates[mode][key] = input.value;
      saveState(state);
    }));
    mount.querySelectorAll("[data-quick-apply]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.quickApply === "crypto" ? "crypto" : "bet";
      ensureQuickTemplates(state);
      const tpl = state.quickTemplates[mode];
      const count = Math.max(1, Math.min(20, Number(state.rowCounts?.[mode] || 20)));
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      let applied = 0;
      while (list.length < count) list.push(createSlot(mode, list.length));
      list.slice(0, count).forEach(slot => {
        if (slot.status === "win" || slot.status === "loss") return;
        slot.type = mode;
        if (tpl.stake !== "") slot.stake = tpl.stake;
        if (tpl.odds !== "") slot.odds = tpl.odds;
        if (mode === "crypto") slot.cryptoPnlMode = "amount";
        if (tpl.name && !String(slot.name || "").trim()) slot.name = tpl.name;
        slot.status = "pending";
        recalcSlot(slot);
        applied++;
      });
      saveState(state);
      refresh();
    }));
    const flashComboStakeTarget = (target) => {
      if (!target) return;
      target.classList.remove("v1018-combo-stake-target", "v1019-combo-stake-target", "v1020-combo-stake-target");
      void target.offsetWidth;
      target.classList.add("v1020-combo-stake-target");
      window.clearTimeout(target.__bultenV1020StakeFlashTimer);
      target.__bultenV1020StakeFlashTimer = window.setTimeout(() => {
        target.classList.remove("v1020-combo-stake-target");
      }, 750);
    };
    const captureScrollPositions = () => {
      const points = [{ el: window, x: window.scrollX || 0, y: window.scrollY || 0 }];
      document.querySelectorAll("*").forEach(el => {
        if (el && (el.scrollTop || el.scrollLeft)) points.push({ el, x: el.scrollLeft || 0, y: el.scrollTop || 0 });
      });
      return points;
    };
    const restoreScrollPositions = (points) => {
      (points || []).forEach(point => {
        try {
          if (point.el === window) window.scrollTo(point.x || 0, point.y || 0);
          else {
            point.el.scrollLeft = point.x || 0;
            point.el.scrollTop = point.y || 0;
          }
        } catch {}
      });
    };
    const focusStakeWithoutScroll = (target) => {
      if (!target) return;
      const points = captureScrollPositions();
      try { target.focus({ preventScroll: true }); }
      catch { try { target.focus(); } catch {} }
      restoreScrollPositions(points);
      window.requestAnimationFrame(() => restoreScrollPositions(points));
      window.setTimeout(() => restoreScrollPositions(points), 40);
    };
    const redirectComboStakeInput = (input, event) => {
      if (!input || input.dataset.mode !== "bet" || input.dataset.key !== "stake") return false;
      const slotIndex = Number(input.dataset.slot || 0);
      const list = state.modeSlots.bet || [];
      const group = betCouponGroup(list[slotIndex]);
      if (!group) return false;
      const firstIndex = list.findIndex(row => betCouponGroup(row) === group);
      if (!Number.isFinite(firstIndex) || firstIndex < 0 || firstIndex === slotIndex) return false;
      const target = mount.querySelector(`input[data-mode="bet"][data-slot="${firstIndex}"][data-key="stake"]`);
      if (!target) return false;
      if (event) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
      window.requestAnimationFrame(() => {
        focusStakeWithoutScroll(target);
        flashComboStakeTarget(target);
      });
      return true;
    };
    mount.querySelectorAll("input[data-mode]").forEach(input => {
      const saveInput = () => {
        const mode = input.dataset.mode, i = Number(input.dataset.slot), key = input.dataset.key;
        const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
        if (!list[i]) list[i] = createSlot(mode, i);
        list[i][key] = input.value;
        list[i].type = mode;
        if (mode === "bet") {
          if (!betCouponGroup(list[i])) list[i].betKind = "single";
          normalizeBetCouponGroups(list);
        }
        if (slotHasUserEntry(list[i], mode)) {
          if (list[i].status !== "win" && list[i].status !== "loss") list[i].status = "pending";
        }
        if (mode === "crypto" && key === "odds") list[i].cryptoPnlMode = "amount";
        recalcSlot(list[i]);
        saveState(state);
      };
      if (input.dataset.mode === "bet" && input.dataset.key === "stake") {
        input.addEventListener("pointerdown", event => redirectComboStakeInput(input, event), true);
        input.addEventListener("focus", event => redirectComboStakeInput(input, event), true);
      }
      input.addEventListener("input", saveInput);
      input.addEventListener("change", saveInput);
    });
    const removeLegacyBetGroupPortals = () => {
      [
        "v1019-bet-group-portal","v1018-bet-group-portal","v1017-bet-group-portal","v1016-bet-group-portal","v1015-bet-group-portal",
        "v1014-bet-group-portal","v1013-bet-group-portal","v1012-bet-group-portal","v1011-bet-group-portal","v1010-bet-group-portal",
        "v1009-bet-group-portal","v1008-bet-group-portal","v1007-bet-group-portal"
      ].forEach(id => document.getElementById(id)?.remove());
      ["v1019-bet-group-layer","v1018-bet-group-layer","v1017-bet-group-layer"].forEach(id => document.getElementById(id)?.remove());
    };
    const closeBetGroupMenu = () => {
      removeLegacyBetGroupPortals();
      window.__bultenV1020BetGroupActiveSlot = null;
      document.querySelectorAll("[data-bet-group-menu].is-open").forEach(menu => {
        menu.classList.remove("is-open");
        menu.closest("tr")?.classList.remove("v995-group-row-open");
      });
    };
    const applyBetGroupChoice = (slotRaw, groupRaw) => {
      const slotIndex = Number(slotRaw || 0);
      if (!Number.isFinite(slotIndex) || slotIndex < 0) return;
      const group = betCouponGroup({ couponGroup: groupRaw || "" });
      if (!state.modeSlots.bet[slotIndex]) state.modeSlots.bet[slotIndex] = createSlot("bet", slotIndex);
      const slot = state.modeSlots.bet[slotIndex];
      slot.type = "bet";
      slot.id = slotIndex + 1;
      slot.couponGroup = group;
      slot.betKind = group ? "combo" : "single";
      if (!group) slot.comboResults = [];
      normalizeBetCouponGroups(state.modeSlots.bet);
      saveState(state);
      closeBetGroupMenu();
      refresh();
    };
    const toggleBetGroupMenu = (btn) => {
      if (!btn) return;
      const menu = btn.closest("[data-bet-group-menu]");
      if (!menu) return;
      const slotIndex = Number(btn.dataset.betGroupToggle || menu.dataset.betGroupMenu || 0);
      const wasOpen = menu.classList.contains("is-open") && Number(window.__bultenV1020BetGroupActiveSlot) === slotIndex;
      closeBetGroupMenu();
      if (wasOpen) return;
      window.__bultenV1020BetGroupActiveSlot = slotIndex;
      menu.classList.add("is-open");
      menu.closest("tr")?.classList.add("v995-group-row-open");
    };
    window.__bultenV1020CloseBetGroupMenu = closeBetGroupMenu;
    window.__bultenV1020BetGroupApply = applyBetGroupChoice;
    window.__bultenV1020ToggleBetGroupMenu = toggleBetGroupMenu;
    if (!window.__bultenV1020BetGroupPointerHandler) {
      window.__bultenV1020BetGroupPointerHandler = true;
      document.addEventListener("pointerdown", event => {
        const choice = event.target?.closest?.("[data-bet-group-choice]");
        if (choice) {
          event.preventDefault();
          event.stopPropagation();
          const [slotRaw, groupRaw] = String(choice.dataset.betGroupChoice || "0:").split(":");
          window.__bultenV1020BetGroupApply?.(slotRaw, groupRaw || "");
          return;
        }
        const toggle = event.target?.closest?.("[data-bet-group-toggle]");
        if (toggle) {
          event.preventDefault();
          event.stopPropagation();
          window.__bultenV1020ToggleBetGroupMenu?.(toggle);
          return;
        }
        if (event.target?.closest?.("[data-bet-group-menu]")) return;
        window.__bultenV1020CloseBetGroupMenu?.();
      }, true);
      window.addEventListener("resize", () => window.__bultenV1020CloseBetGroupMenu?.(), true);
    }
    const syncV1016TargetRail = () => {
      const rails = document.querySelectorAll(".rolling-v48-rail, .v49-rolling-rail");
      rails.forEach(rail => {
        const card = rail.querySelector(":scope > .v984-target-card, :scope > .v985-target-card, :scope > .v796-target-card");
        if (!card) return;

        /*
          V1024: Kasa Hedefi'nde fixed/sticky JS sistemi tamamen kapatıldı.
          V1022 fixed overlay, V1023 sticky + internal scroll davranışı;
          kartın altını kesiyor, mouse üstündeyken ana sayfa scroll'unu kilitliyor
          ve refresh/scroll sırasında performans hissini düşürüyordu.
          Kart artık sol rail içinde normal akışta kalır; CSS de position/overflow
          değerlerini statik ve sade tutar.
        */
        rail.style.removeProperty("--v1016-target-placeholder-height");
        rail.style.removeProperty("--v1016-target-left");
        rail.style.removeProperty("--v1016-target-width");
        rail.style.removeProperty("--v1016-target-top");
        rail.style.minHeight = "";
        delete rail.dataset.v1016NaturalTop;
        delete rail.dataset.v1016TargetHeight;
        delete rail.dataset.v1022TargetHeight;
        card.classList.remove("v1016-target-fixed", "v1023-target-sticky-card");
      });
    };
    window.__bultenV1016SyncTargetRail = syncV1016TargetRail;
    requestAnimationFrame(syncV1016TargetRail);
    setTimeout(syncV1016TargetRail, 60);
    setTimeout(syncV1016TargetRail, 180);
    if (!window.__bultenV1016TargetRailHandlers) {
      window.__bultenV1016TargetRailHandlers = true;
      const syncRail = () => window.__bultenV1016SyncTargetRail?.();
      window.addEventListener("resize", syncRail, true);
      window.addEventListener("orientationchange", syncRail, true);
    }

    mount.querySelectorAll("details.rolling-v49-fold").forEach(details => {
      details.open = true;
      const summary = details.querySelector(":scope > summary");
      if (summary && !summary.dataset.v1015StaticFold) {
        summary.dataset.v1015StaticFold = "1";
        summary.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          details.open = true;
        });
      }
      if (!details.dataset.v1015StaticFold) {
        details.dataset.v1015StaticFold = "1";
        details.addEventListener("toggle", () => {
          if (!details.open) details.open = true;
        });
      }
    });
    mount.querySelectorAll("[data-clear-row]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, slotRaw] = String(btn.dataset.clearRow || "bet:0").split(":");
      const i = Number(slotRaw || 0);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      list[i] = createSlot(mode, i);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-main-table-photo]").forEach(btn => btn.addEventListener("click", () => {
      openTablePhoto(btn.dataset.mainTablePhoto === "crypto" ? "crypto" : "bet", state);
    }));
    mount.querySelectorAll("[data-crypto-detail]").forEach(input => {
      const saveCryptoDetail = () => {
        const [slotRaw, key] = String(input.dataset.cryptoDetail || "0:entryPrice").split(":");
        const i = Number(slotRaw || 0);
        if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
        state.modeSlots.crypto[i][key] = input.value;
        state.modeSlots.crypto[i].status = state.modeSlots.crypto[i].status === "win" || state.modeSlots.crypto[i].status === "loss" ? state.modeSlots.crypto[i].status : "pending";
        if (key === "stake" || key === "odds") recalcSlot(state.modeSlots.crypto[i]);
        saveState(state);
      };
      input.addEventListener("input", saveCryptoDetail);
      input.addEventListener("change", () => { saveCryptoDetail(); refresh(); });
      input.addEventListener("blur", () => { saveCryptoDetail(); refresh(); });
    });
    mount.querySelectorAll("[data-crypto-tp]").forEach(input => {
      const saveTp = () => {
        const [slotRaw, tpRaw, key] = String(input.dataset.cryptoTp || "0:0:price").split(":");
        const i = Number(slotRaw || 0);
        const ti = Number(tpRaw || 0);
        if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
        const slot = state.modeSlots.crypto[i];
        if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
        while (slot.takeProfits.length <= ti) slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
        slot.takeProfits[ti][key] = input.value;
        if (!slot.takeProfits[ti].note) slot.takeProfits[ti].note = `TP${ti + 1}`;
        slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
        recalcSlot(slot);
        saveState(state);
      };
      input.addEventListener("input", saveTp);
      input.addEventListener("change", saveTp);
      input.addEventListener("blur", saveTp);
    });
    mount.querySelectorAll("[data-crypto-tp-op]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, tpRaw, op] = String(btn.dataset.cryptoTpOp || "0:0:plus").split(":");
      const i = Number(slotRaw || 0);
      if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
      const slot = state.modeSlots.crypto[i];
      if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
      if (op === "plus") slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
      else slot.takeProfits.pop();
      if (!slot.takeProfits.length) slot.takeProfits.push({ price: "", profitAmount: "", note: "TP1", result: "" });
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-crypto-tp-result]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, tpRaw, resultRaw] = String(btn.dataset.cryptoTpResult || "0:0:tp").split(":");
      const i = Number(slotRaw || 0);
      const ti = Number(tpRaw || 0);
      const result = resultRaw === "stop" ? "stop" : "tp";
      if (!state.modeSlots.crypto[i]) state.modeSlots.crypto[i] = createSlot("crypto", i);
      const slot = state.modeSlots.crypto[i];
      if (!Array.isArray(slot.takeProfits)) slot.takeProfits = [];
      while (slot.takeProfits.length <= ti) slot.takeProfits.push({ price: "", profitAmount: "", note: `TP${slot.takeProfits.length + 1}`, result: "" });
      slot.takeProfits[ti].result = slot.takeProfits[ti].result === result ? "" : result;
      slot.takeProfits[ti].done = slot.takeProfits[ti].result === "tp";
      slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
      recalcSlot(slot);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-crypto-close]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.cryptoClose || 0);
      const slot = state.modeSlots.crypto[i];
      if (!slot) return;
      slot.odds = Number(cryptoRealizedProfit(slot).toFixed(2));
      recalcSlot(slot);
      saveState(state);
      CONFIRM_DIALOG = {
        type: "settle",
        mode: "crypto",
        slot: i,
        status: Number(slot.odds || 0) >= 0 ? "win" : "loss",
        keepActivePanel: "crypto",
        tone: Number(slot.odds || 0) >= 0 ? "success" : "danger",
        title: "Kripto işlemi kapatılsın mı?",
        message: `${cleanText(slot.name) || "Kripto işlem"} geçmişe alınacak.`,
        detail: "Hatalıysa Geçmişten aktife geri alabilirsin.",
        confirmText: "İşlem kapandı"
      };
      refresh();
    }));


    mount.querySelectorAll("[data-rolling-quick]").forEach(input => {
      input.addEventListener("input", () => {
        const mode = input.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
        const quick = getModeQuickPlan(state, mode);
        const key = input.dataset.rollingQuick;
        quick[key] = input.value === "" ? "" : Number(input.value || 0);
        saveState(state);
      });
      input.addEventListener("change", () => refresh());
    });
    mount.querySelectorAll("[data-target-complete]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
      const modeSum = slotSummary(state.modeSlots[mode]);
      const rollSum = rollingSummary(mode);
      const modePnl = Number(modeSum.pnl || 0) + Number(rollSum.pnlTotal || 0);
      const result = addTargetLogRecord(state, modePnl, mode);
      if (!result.ok) { alert(result.message); return; }
      const targetItems = loadTargetItems();
      targetItems[mode] = [];
      saveTargetItems(targetItems);
      const closedPnl = loadTargetClosedPnl();
      closedPnl[mode] = 0;
      saveTargetClosedPnl(closedPnl);
      saveState(state);
      refresh();
    }));
    const removeLastTargetTp = mode => {
      const m = mode === "crypto" ? "crypto" : "bet";
      const list = mount.querySelector(`[data-target-tp-list="${m}"]`);
      if (!list) return;
      const rows = Array.from(list.querySelectorAll("[data-target-self-tp]"));
      const last = rows[rows.length - 1];
      if (!last) return;
      if (rows.length <= 1) {
        last.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      last.remove();
    };
    const bindTargetBetLegRemove = btn => btn.addEventListener("click", () => {
      const row = btn.closest("[data-target-bet-leg]");
      const list = row?.parentElement;
      if (!row || !list) return;
      if (list.querySelectorAll("[data-target-bet-leg]").length <= 1) {
        row.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      row.remove();
    });
    const handleCryptoEntryRemove = btn => {
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.parentElement;
      if (!entry || !list) return;
      if (list.querySelectorAll('[data-target-crypto-entry="1"]').length <= 1) {
        entry.querySelectorAll('input').forEach(input => { input.value = ''; });
        entry.querySelectorAll('[data-target-self-tp="crypto"]').forEach((row, idx) => {
          if (idx === 0) row.querySelectorAll('input').forEach(input => { input.value = ''; });
          else row.remove();
        });
        return;
      }
      entry.remove();
    };
    mount.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const remove = target.closest('[data-target-crypto-entry-remove]');
      if (!remove || !mount.contains(remove)) return;
      event.preventDefault();
      event.stopPropagation();
      handleCryptoEntryRemove(remove);
    }, true);
    mount.querySelectorAll("[data-target-bet-leg-remove]").forEach(bindTargetBetLegRemove);
    mount.querySelectorAll('[data-target-crypto-entry-add],[data-target-crypto-entry-remove],[data-target-tp-add],[data-target-tp-remove-last],[data-target-bet-leg-add],[data-target-bet-leg-remove]').forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (form) form.dataset.skipAutosaveOnce = '1';
      });
    });
    mount.querySelectorAll("[data-target-tp-remove-last]").forEach(btn => btn.addEventListener("click", () => {
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.querySelector('[data-target-tp-list="crypto"]');
      if (!list) return removeLastTargetTp(btn.dataset.targetTpRemoveLast);
      const rows = Array.from(list.querySelectorAll("[data-target-self-tp]"));
      const last = rows[rows.length - 1];
      if (!last) return;
      if (rows.length <= 1) {
        last.querySelectorAll("input").forEach(input => { input.value = ""; });
        return;
      }
      last.remove();
    }));
    mount.querySelectorAll("[data-target-tp-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetTpAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto") return;
      const entry = btn.closest('[data-target-crypto-entry="1"]');
      const list = entry?.querySelector('[data-target-tp-list="crypto"]') || mount.querySelector(`[data-target-tp-list="${mode}"]`);
      if (!list) return;
      if (list.querySelectorAll("[data-target-self-tp]").length >= 6) return;
      list.insertAdjacentHTML("beforeend", v811CryptoTpRow());
    }));
    mount.querySelectorAll("[data-target-crypto-entry-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetCryptoEntryAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto") return;
      const list = btn.closest('[data-target-crypto-autosave="1"]')?.querySelector("[data-target-crypto-entry-list]");
      if (!list) return;
      const count = list.querySelectorAll('[data-target-crypto-entry="1"]').length;
      if (count >= 8) return;
      list.insertAdjacentHTML("beforeend", v824CryptoEntryRow(count));
    }));
    mount.querySelectorAll("[data-target-bet-leg-add]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.targetBetLegAdd === "crypto" ? "crypto" : "bet";
      if (mode !== "bet") return;
      const list = mount.querySelector(`[data-target-bet-leg-list="${mode}"]`);
      if (!list) return;
      if (list.querySelectorAll("[data-target-bet-leg]").length >= 8) return;
      list.insertAdjacentHTML("beforeend", v812BetLegRow());
      const last = list.lastElementChild;
      const removeBtn = last?.querySelector("[data-target-bet-leg-remove]");
      if (removeBtn) bindTargetBetLegRemove(removeBtn);
    }));
    const saveTargetSelfFromForm = modeRaw => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const pick = key => mount.querySelector(`[data-target-self-field="${mode}:${key}"]`);
      const name = cleanText(pick("name")?.value || "");
      const stake = v810NumberOrBlank(pick("stake")?.value || "");
      const store = loadTargetItems();
      store[mode] = Array.isArray(store[mode]) ? store[mode] : [];
      if (mode === "crypto") {
        const entries = Array.from(mount.querySelectorAll('[data-target-crypto-entry="1"]'));
        let added = false;
        entries.forEach(entryBox => {
          const entryPick = key => entryBox.querySelector(`[data-target-self-field="crypto:${key}"]`);
          const rowName = cleanText(entryPick("name")?.value || "");
          const rowStake = v810NumberOrBlank(entryPick("stake")?.value || "");
          const rowEntry = cleanText(entryPick("entry")?.value || "");
          const tps = Array.from(entryBox.querySelectorAll('[data-target-self-tp="crypto"]')).map(row => ({
            target: cleanText(row.querySelector('[data-target-self-tp-field="target"]')?.value || ""),
            profit: v810NumberOrBlank(row.querySelector('[data-target-self-tp-field="profit"]')?.value || "")
          })).filter(tp => tp.target || tp.profit !== "");
          const stop = cleanText(entryPick("stop")?.value || "");
          const stopLoss = v810NumberOrBlank(entryPick("stopLoss")?.value || "");
          const profit = tps.reduce((sum, tp) => tp.profit !== "" ? sum + Number(tp.profit || 0) : sum, 0);
          if (!rowName && rowStake === "" && !rowEntry && !tps.length && !stop && stopLoss === "") return;
          store[mode].push({ id: v810TargetItemId(), ts: Date.now(), mode, kind: "crypto", name: rowName, stake: rowStake, entry: rowEntry, entryPrice: rowEntry, stop, stopLoss, tps, profit, result: "" });
          added = true;
        });
        if (!added) return false;
      } else {
        const legs = Array.from(mount.querySelectorAll(`[data-target-bet-leg="${mode}"]`)).map(row => ({
          name: cleanText(row.querySelector('[data-target-bet-leg-field="name"]')?.value || ""),
          odds: v810NumberOrBlank(row.querySelector('[data-target-bet-leg-field="odds"]')?.value || "")
        })).filter(leg => leg.name || leg.odds !== "");
        if (!legs.length && stake === "") return false;
        const cleanLegs = legs.length ? legs : [{ name: "", odds: "" }];
        store[mode].push({ id: v810TargetItemId(), ts: Date.now(), mode, kind: cleanLegs.length > 1 ? "combo" : "match", legs: cleanLegs, name: cleanLegs[0]?.name || "", odds: cleanLegs[0]?.odds || "", stake, result: "" });
      }
      saveTargetItems(store);
      return true;
    };
    mount.querySelectorAll("[data-target-self-add]").forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (form) form.dataset.skipAutosaveOnce = '1';
      });
      btn.addEventListener("click", () => {
        const mode = btn.dataset.targetSelfAdd === "crypto" ? "crypto" : "bet";
        const form = btn.closest('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]');
        if (saveTargetSelfFromForm(mode)) refresh();
        if (form) delete form.dataset.skipAutosaveOnce;
      });
    });
    mount.querySelectorAll('[data-target-bet-autosave="1"], [data-target-crypto-autosave="1"]').forEach(form => {
      const autosaveMode = form.matches('[data-target-crypto-autosave="1"]') ? "crypto" : "bet";
      form.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const saved = saveTargetSelfFromForm(autosaveMode);
        if (saved) refresh();
      });
      form.addEventListener('focusout', event => {
        window.setTimeout(() => {
          if (!mount.isConnected || !form.isConnected) return;
          if (form.dataset.skipAutosaveOnce === '1') {
            delete form.dataset.skipAutosaveOnce;
            return;
          }
          const active = document.activeElement;
          if (active && form.contains(active)) return;
          const related = event.relatedTarget;
          if (related instanceof Node && form.contains(related)) return;
          const saved = saveTargetSelfFromForm(autosaveMode);
          if (saved) refresh();
        }, 0);
      });
    });
    const removeTargetItemAfterResult = (modeRaw, id, rowSnapshot) => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const latest = loadTargetItems();
      latest[mode] = Array.isArray(latest[mode]) ? latest[mode] : [];
      const row = rowSnapshot || latest[mode].find(item => String(item.id || "") === String(id));
      if (row) addTargetClosedPnl(mode, Number(v810TargetItemProfit(row, mode).value || 0));
      latest[mode] = latest[mode].filter(item => String(item.id || "") !== String(id));
      saveTargetItems(latest);
      refresh();
    };
    const finalizeCryptoTargetItem = (id, result, options = {}) => {
      const latest = loadTargetItems();
      latest.crypto = Array.isArray(latest.crypto) ? latest.crypto : [];
      const row = latest.crypto.find(item => String(item.id || "") === String(id));
      if (!row) return;
      row.tps = Array.isArray(row.tps) ? row.tps : [];
      row.result = result === "stop" ? "stop" : "tp";
      row.closedTs = row.closedTs || Date.now();
      if (row.result === "stop") row.tps = row.tps.map(tp => ({ ...tp, done: false }));
      if (row.result === "tp") row.tps = row.tps.map(tp => ({ ...tp, done: true }));
      upsertTargetItemLogRecord("crypto", row, row.result);
      const rowSnapshot = { ...row, tps: row.tps.map(tp => ({ ...tp })) };
      saveTargetItems(latest);
      if (options && options.askCleanup) {
        askTargetCleanup("crypto", id, rowSnapshot, options.tone || (row.result === "stop" ? "danger" : "success"), { refreshOnCancel: true });
      } else {
        refresh();
      }
    };
    const askTargetCleanup = (modeRaw, id, rowSnapshot, tone = "success", options = {}) => {
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      const label = mode === "crypto" ? "işlemi" : "bahisi";
      openTargetResultConfirm({
        title: "Detay temizlensin mi?",
        message: mode === "crypto" ? "Sonuç işlendi. Bu işlemi detaydan temizlemek istiyor musun?" : `Sonuç işlendi. Bu ${label} detaydan kaldırılsın mı?`,
        okText: "Evet, temizle",
        cancelText: "Hayır, kalsın",
        tone
      }, () => removeTargetItemAfterResult(mode, id, rowSnapshot), () => {
        if (options && options.refreshOnCancel) refresh();
      });
    };
    mount.querySelectorAll("[data-target-self-tp-done]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, indexRaw] = String(btn.dataset.targetSelfTpDone || "crypto::0").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (mode !== "crypto" || !id) return;
      const index = Math.max(0, Number(indexRaw || 0));
      const store = loadTargetItems();
      store.crypto = Array.isArray(store.crypto) ? store.crypto : [];
      const row = store.crypto.find(item => String(item.id || "") === String(id));
      if (!row) return;
      row.tps = Array.isArray(row.tps) ? row.tps : [];
      if (!row.tps[index]) return;
      const nextDone = !row.tps[index].done;
      const allDoneAfter = row.tps.length > 0 && row.tps.every((tp, idx) => idx === index ? nextDone : !!tp.done);
      const applyPartial = () => {
        row.tps[index].done = nextDone;
        if (row.tps[index].done && row.result === "stop") row.result = "";
        const allDone = row.tps.length > 0 && row.tps.every(tp => !!tp.done);
        row.result = allDone ? "tp" : (row.result === "tp" ? "" : row.result || "");
        saveTargetItems(store);
        refresh();
      };
      if (!nextDone) { applyPartial(); return; }
      if (!allDoneAfter) { applyPartial(); return; }
      openTargetResultConfirm({
        title: "İşlemi kâr olarak kapat",
        message: "TP'ler alındı. Bu işlemi kâr olarak kapatmak istediğinden emin misin?",
        okText: "Onayla",
        cancelText: "Vazgeç",
        tone: "success"
      }, () => finalizeCryptoTargetItem(id, "tp", { askCleanup: true, tone: "success" }));
    }));
    mount.querySelectorAll("[data-target-bet-leg-result]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, indexRaw, resultRaw] = String(btn.dataset.targetBetLegResult || "bet:::").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (mode !== "bet" || !id) return;
      const index = Math.max(0, Number(indexRaw || 0));
      const result = resultRaw === "loss" ? "loss" : "win";
      const store = loadTargetItems();
      store.bet = Array.isArray(store.bet) ? store.bet : [];
      const row = store.bet.find(item => String(item.id || "") === String(id));
      if (!row) return;
      row.legs = Array.isArray(row.legs) ? row.legs : [];
      if (!row.legs[index]) return;
      const previous = cleanText(row.legs[index].result || "");
      const next = previous === result ? "" : result;
      const apply = () => {
        row.legs[index].result = next;
        row.result = "";
        const legs = v812BetLegs(row);
        const filled = legs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
        const anyLoss = filled.some(leg => cleanText(leg.result || "") === "loss");
        const allWin = filled.length > 0 && filled.every(leg => cleanText(leg.result || "") === "win");
        if (anyLoss) row.result = "loss";
        else if (allWin) row.result = "win";
        saveTargetItems(store);
        refresh();
        if (row.result) askTargetCleanup("bet", id, row, row.result === "loss" ? "danger" : "success");
      };
      if (!next) { apply(); return; }

      const currentLegs = v812BetLegs(row);
      const isComboTicket = currentLegs.length > 1;
      const currentFilled = currentLegs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
      const currentAnyLoss = currentFilled.some(leg => cleanText(leg.result || "") === "loss");
      const currentAllWin = currentFilled.length > 0 && currentFilled.every(leg => cleanText(leg.result || "") === "win");
      const currentFinalResult = currentAnyLoss ? "loss" : (currentAllWin ? "win" : "");
      const tmpLegs = row.legs.map((leg, idx) => idx === index ? { ...leg, result: next } : { ...leg });
      const filled = tmpLegs.filter(leg => cleanText(leg.name || "") || v810NumberOrBlank(leg.odds) !== "");
      const anyLoss = filled.some(leg => cleanText(leg.result || "") === "loss");
      const allWin = filled.length > 0 && filled.every(leg => cleanText(leg.result || "") === "win");
      const finalResult = anyLoss ? "loss" : (allWin ? "win" : "");

      if (isComboTicket) {
        const shouldConfirmComboLoss = result === "loss" && finalResult === "loss" && currentFinalResult !== "loss";
        const shouldConfirmComboWin = result === "win" && finalResult === "win" && currentFinalResult !== "win";
        if (!shouldConfirmComboLoss && !shouldConfirmComboWin) {
          apply();
          return;
        }
        openTargetResultConfirm({
          title: shouldConfirmComboLoss ? "Kombine kaybetti onayı" : "Kombine kazandı onayı",
          message: shouldConfirmComboLoss
            ? "Bu kırmızı seçimle kombine kupon kaybedecek. Onaylıyor musun?"
            : "Tüm maçlar yeşil oldu. Kombine kuponu kazandı olarak işaretlemek istiyor musun?",
          okText: "Onayla",
          tone: shouldConfirmComboLoss ? "danger" : "success"
        }, apply);
        return;
      }

      const label = result === "win" ? "Kazandı" : "Kaybetti";
      const title = result === "win" ? "Maç kazandı onayı" : "Maç kaybetti onayı";
      const msg = finalResult
        ? `Bu bahisi "${label}" olarak onaylıyor musun?`
        : `Bu maçı "${label}" olarak işlemek istiyor musun?`;
      openTargetResultConfirm({
        title,
        message: msg,
        okText: "Onayla",
        tone: result === "loss" ? "danger" : "success"
      }, apply);
    }));
    mount.querySelectorAll("[data-target-self-result]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id, resultRaw] = String(btn.dataset.targetSelfResult || "bet::").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      const store = loadTargetItems();
      store[mode] = Array.isArray(store[mode]) ? store[mode] : [];
      const row = store[mode].find(item => String(item.id || "") === String(id));
      if (!row) return;
      const result = mode === "crypto" ? (resultRaw === "stop" ? "stop" : "tp") : (resultRaw === "loss" ? "loss" : "win");
      const apply = () => {
        row.result = row.result === result ? "" : result;
        if (mode === "crypto" && row.result === "stop" && Array.isArray(row.tps)) row.tps = row.tps.map(tp => ({ ...tp, done: false }));
        if (mode === "crypto" && row.result === "tp" && Array.isArray(row.tps)) row.tps = row.tps.map(tp => ({ ...tp, done: true }));
        saveTargetItems(store);
        refresh();
        if (mode === "bet" && row.result) askTargetCleanup("bet", id, row, row.result === "loss" ? "danger" : "success");
      };
      const willActivate = row.result !== result;
      if (!willActivate) { apply(); return; }
      if (mode === "crypto") {
        openTargetResultConfirm({
          title: result === "stop" ? "Zarar olarak kapat" : "İşlemi kâr olarak kapat",
          message: result === "stop"
            ? "Bu işlemi zarar olarak kapatmak istediğinden emin misin?"
            : "TP'ler alındı. Bu işlemi kâr olarak kapatmak istediğinden emin misin?",
          okText: "Onayla",
          cancelText: "Vazgeç",
          tone: result === "stop" ? "danger" : "success"
        }, () => finalizeCryptoTargetItem(id, result, { askCleanup: true, tone: result === "stop" ? "danger" : "success" }));
        return;
      }
      let message = 'Sonucu onaylıyor musun?';
      let title = 'Sonuç onayı';
      let tone = result === 'loss' || result === 'stop' ? 'danger' : 'success';
      if (mode === 'bet') {
        const combo = v812BetLegs(row).length > 1;
        title = result === 'loss' ? 'Bahis kaybetti onayı' : 'Bahis kazandı onayı';
        message = combo
          ? `Bu kombine kuponu "${result === 'loss' ? 'Kaybetti' : 'Kazandı'}" olarak işaretlemek istiyor musun?`
          : `Bu bahisi "${result === 'loss' ? 'Kaybetti' : 'Kazandı'}" olarak işaretlemek istiyor musun?`;
      } else {
        title = result === 'stop' ? 'Zarar onayı' : 'Kazanç onayı';
        message = result === 'stop' ? 'Bu işlemi zarar olarak işlemek istiyor musun?' : 'Bu işlemi kazanç olarak işlemek istiyor musun?';
      }
      openTargetResultConfirm({ title, message, okText: 'Onayla', tone }, apply);
    }));
    mount.querySelectorAll("[data-target-self-photo]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id] = String(btn.dataset.targetSelfPhoto || "bet:").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      openTargetItemPhoto(mode, id);
    }));
    mount.querySelectorAll("[data-target-self-delete]").forEach(btn => btn.addEventListener("click", () => {
      const [modeRaw, id] = String(btn.dataset.targetSelfDelete || "bet:").split(":");
      const mode = modeRaw === "crypto" ? "crypto" : "bet";
      if (!id) return;
      const store = loadTargetItems();
      store[mode] = Array.isArray(store[mode]) ? store[mode] : [];
      const row = store[mode].find(item => String(item.id || "") === String(id));
      if (mode === "crypto" && row && cleanText(row.result || "")) {
        if (!row.closedPnlAdded) addTargetClosedPnl(mode, Number(v810TargetItemProfit(row, mode).value || 0));
        row.closedPnlAdded = true;
        upsertTargetItemLogRecord(mode, row, row.result);
      }
      store[mode] = store[mode].filter(item => String(item.id || "") !== String(id));
      saveTargetItems(store);
      refresh();
    }));
    mount.querySelectorAll("[data-target-reset]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.rollingTargetMode === "crypto" ? "crypto" : "bet";
      const plan = getPlanNumbers(state, 0, mode);
      const quick = getModeQuickPlan(state, mode);
      quick.start = Number(plan.current.toFixed(2));
      quick.target = "";
      quick.currentOverride = "";
      const targetItems = loadTargetItems();
      targetItems[mode] = [];
      saveTargetItems(targetItems);
      const closedPnl = loadTargetClosedPnl();
      closedPnl[mode] = 0;
      saveTargetClosedPnl(closedPnl);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-target-card]").forEach(card => {
      card.addEventListener("toggle", () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        setTargetCardOpen(card.dataset.targetCard === "crypto" ? "crypto" : "bet", card.open);
        requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "auto" }));
      });
    });
    mount.querySelectorAll("[data-target-log-toggle]").forEach(btn => btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const mode = btn.dataset.targetLogToggle === "crypto" ? "crypto" : "bet";
      const wrap = btn.closest(".v802-target-log-wrap");
      const next = !(wrap && wrap.classList.contains("open"));
      mount.querySelectorAll(".v802-target-log-wrap.open").forEach(item => {
        if (item !== wrap) item.classList.remove("open");
      });
      setTargetLogOpen(mode, next);
      if (wrap) wrap.classList.toggle("open", next);
      const keep = () => window.scrollTo({ top: y, left: 0, behavior: "auto" });
      requestAnimationFrame(keep);
      setTimeout(keep, 0);
      setTimeout(keep, 80);
    }));
    mount.addEventListener("click", (event) => {
      if (event.target && event.target.closest && event.target.closest(".v802-target-log-wrap")) return;
      let changed = false;
      mount.querySelectorAll(".v802-target-log-wrap.open").forEach(wrap => {
        wrap.classList.remove("open");
        changed = true;
      });
      if (changed) {
        setTargetLogOpen("bet", false);
        setTargetLogOpen("crypto", false);
      }
    });
    if (!window.__omegaV803TargetLogOutsideBound) {
      window.__omegaV803TargetLogOutsideBound = true;
      document.addEventListener("click", (event) => {
        if (event.target && event.target.closest && event.target.closest(".v802-target-log-wrap")) return;
        const mainMount = qs("omega-rolling-render");
        if (!mainMount) return;
        let changed = false;
        mainMount.querySelectorAll(".v802-target-log-wrap.open").forEach(wrap => {
          wrap.classList.remove("open");
          changed = true;
        });
        if (changed) {
          setTargetLogOpen("bet", false);
          setTargetLogOpen("crypto", false);
        }
      });
    }
    mount.querySelectorAll("[data-target-history-open]").forEach(btn => btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      TARGET_HISTORY_OPEN_MODE = btn.dataset.targetHistoryOpen === "crypto" ? "crypto" : "bet";
      HISTORY_OPEN_MODE = null;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_FILTER = "all";
      renderFloatingPanel();
    }));
    mount.querySelectorAll("[data-target-history-close]").forEach(btn => btn.addEventListener("click", () => {
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-target-history-overlay]").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-open]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = btn.dataset.historyOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      refresh();
    }));
    mount.querySelectorAll("[data-history-close]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-log-center]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = btn.dataset.logCenter === "crypto" ? "crypto" : "bet";
      REPORT_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      HISTORY_FILTER = "today";
      refresh();
    }));
    mount.querySelectorAll("[data-pending-open]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = btn.dataset.pendingOpen === "crypto" ? "crypto" : "bet";
      CONFIRM_RETURN_PANEL_MODE = PENDING_BOARD_OPEN_MODE;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-report-open]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = btn.dataset.reportOpen === "crypto" ? "crypto" : "bet";
      LOG_CENTER_OPEN_MODE = null;
      PENDING_BOARD_OPEN_MODE = null;
      HISTORY_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-report-center-close]").forEach(btn => btn.addEventListener("click", () => {
      REPORT_CENTER_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-pending-close]").forEach(btn => btn.addEventListener("click", () => {
      PENDING_BOARD_OPEN_MODE = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      ACTIVE_COMBO_DETAIL_SLOT = null;
      refresh();
    }));
    mount.querySelectorAll(".v758-pending-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      PENDING_BOARD_OPEN_MODE = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      ACTIVE_COMBO_DETAIL_SLOT = null;
      refresh();
    }));
    mount.querySelectorAll("[data-log-center-close]").forEach(btn => btn.addEventListener("click", () => {
      LOG_CENTER_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll(".v757-log-center-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      LOG_CENTER_OPEN_MODE = null;
      REPORT_CENTER_OPEN_MODE = null;
      TARGET_HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-delete]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, id] = String(btn.dataset.historyDelete || "bet:").split(":");
      if (!id) return;
      CONFIRM_DIALOG = {
        type: "deleteHistory",
        mode: mode === "crypto" ? "crypto" : "bet",
        id,
        tone: "danger",
        title: "LOG kaydı silinsin mi?",
        message: "Bu işlem geçmişini tamamen silmek istediğinden emin misin?",
        detail: "Bu sadece LOG geçmişi kaydını siler; aktif kutudaki yazıları ayrıca istersen temizleyebilirsin.",
        confirmText: "Kalıcı olarak sil"
      };
      refresh();
    }));
    mount.querySelectorAll("[data-history-restore]").forEach(btn => btn.addEventListener("click", () => {
      const [mode, id] = String(btn.dataset.historyRestore || "crypto:").split(":");
      if (!id) return;
      CONFIRM_DIALOG = {
        type: "restoreHistory",
        mode: mode === "crypto" ? "crypto" : "bet",
        id,
        keepActivePanel: mode === "crypto" ? "crypto" : "bet",
        tone: "success",
        title: "Kayıt tekrar aktife alınsın mı?",
        message: "Bu geçmiş kaydı aktif ekrana geri alınacak ve geçmişten kaldırılacak.",
        detail: "Hatalı kapanan işlemler için kullan.",
        confirmText: "Aktife geri al"
      };
      refresh();
    }));
    mount.querySelectorAll("[data-confirm-no]").forEach(btn => btn.addEventListener("click", () => {
      const keepPanel = CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_DIALOG = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) restoreActivePanelAfterConfirm(keepPanel);
      refresh();
    }));
    mount.querySelectorAll(".v757-confirm-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      const keepPanel = CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_DIALOG = null;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) restoreActivePanelAfterConfirm(keepPanel);
      refresh();
    }));
    mount.querySelectorAll("[data-confirm-yes]").forEach(btn => btn.addEventListener("click", () => {
      const action = CONFIRM_DIALOG;
      CONFIRM_DIALOG = null;
      if (!action) return refresh();
      if (action.type === "settle") {
        const fresh = loadState();
        const settleSlotIndex = Number(action.slot || 0);
        if (action.mode === "bet") {
          const coupon = getBetCouponForSlot(fresh, settleSlotIndex);
          const slot = fresh?.modeSlots?.bet?.[settleSlotIndex];
          if (coupon && Array.isArray(coupon.matches) && coupon.matches.length > 1) {
            const matchIndex = getBetCouponMatchIndex(coupon, settleSlotIndex);
            applyComboMatchStatus(fresh, settleSlotIndex, matchIndex, action.status === "loss" ? "loss" : action.status === "pending" ? "pending" : "win");
            saveState(fresh);
          } else if (betKind(slot) === "combo") {
            saveState(fresh);
          } else {
            applySlotResult(fresh, action.mode, settleSlotIndex, action.status);
            saveState(fresh);
          }
        } else {
          applySlotResult(fresh, action.mode, settleSlotIndex, action.status);
          saveState(fresh);
        }
      } else if (action.type === "settleCoupon") {
        const fresh = loadState();
        const coupon = getBetCouponGroups(fresh).coupons.find(c => c.id === Number(action.couponId || 1) || Number(c.slotIndex) === Number(action.couponSlot ?? -1));
        if (coupon) {
          addCouponHistoryRecord(fresh, coupon, action.status === "loss" ? "loss" : "win");
          saveState(fresh);
        }
      } else if (action.type === "comboMatch") {
        const fresh = loadState();
        const requestedIndex = Number(action.slot || 0);
        const beforeCoupon = getBetCouponForSlot(fresh, requestedIndex);
        const baseIndex = Number(beforeCoupon?.slotIndex ?? requestedIndex);
        ACTIVE_COMBO_DETAIL_SLOT = baseIndex;
        if (applyComboMatchStatus(fresh, requestedIndex, Number(action.match || 0), action.status === "loss" ? "loss" : action.status === "pending" ? "pending" : "win")) {
          saveState(fresh);
        }
      } else if (action.type === "deleteHistory") {
        deleteHistoryRecord(action.mode, action.id);
      } else if (action.type === "restoreHistory") {
        restoreHistoryRecord(action.mode, action.id);
      }
      const keepPanel = action.keepActivePanel || CONFIRM_RETURN_PANEL_MODE || PENDING_BOARD_OPEN_MODE;
      CONFIRM_RETURN_PANEL_MODE = null;
      if (keepPanel) {
        restoreActivePanelAfterConfirm(keepPanel);
        return;
      }
      refresh();
    }));
    mount.querySelectorAll(".v512-history-overlay").forEach(overlay => overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      HISTORY_OPEN_MODE = null;
      refresh();
    }));
    mount.querySelectorAll("[data-history-filter]").forEach(btn => btn.addEventListener("click", () => {
      HISTORY_FILTER = btn.dataset.historyFilter || "today";
      refresh();
    }));
    mount.querySelectorAll("[data-target-history-delete]").forEach(btn => btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const id = btn.dataset.targetHistoryDelete || "";
      if (!id) return;
      saveTargetLog(loadTargetLog().filter(r => String(r.id || "") !== String(id)));
      refresh();
    }));
    mount.querySelectorAll("[data-combo-match-status]").forEach(btn => btn.addEventListener("click", () => {
      const [slotRaw, matchRaw, statusRaw] = String(btn.dataset.comboMatchStatus || "0:0:win").split(":");
      const i = Number(slotRaw || 0);
      const mi = Number(matchRaw || 0);
      const status = statusRaw === "loss" ? "loss" : "win";
      const list = state.modeSlots.bet;
      if (!list[i]) return;
      const groupedCoupon = getBetCouponForSlot(state, i);
      const matches = groupedCoupon ? groupedCoupon.matches : getSlotMatches(list[i]);
      const currentStatus = matches[mi]?.status || "";
      const nextStatus = currentStatus === status ? "pending" : status;
      ACTIVE_COMBO_DETAIL_SLOT = i;
      const matchName = matches[mi]?.name || `Maç ${mi + 1}`;
      const keepPanel = btn.closest(".v758-pending-modal") ? (PENDING_BOARD_OPEN_MODE || "bet") : (PENDING_BOARD_OPEN_MODE || null);
      if (keepPanel) CONFIRM_RETURN_PANEL_MODE = keepPanel;
      CONFIRM_DIALOG = {
        type: "comboMatch",
        slot: i,
        match: mi,
        status: nextStatus,
        keepActivePanel: keepPanel,
        tone: nextStatus === "loss" ? "danger" : "success",
        title: nextStatus === "pending" ? "Maçı bekliyor durumuna al" : "Kombine maç sonucunu onayla",
        message: nextStatus === "pending"
          ? `${matchName} tekrar BEKLİYOR durumuna alınacak.`
          : `${matchName} için ${nextStatus === "loss" ? "KAYBETTİ" : "KAZANDI"} sonucu kaydedilecek.`,
        detail: nextStatus === "pending" ? "Yanlış işaretleme yaptıysan bu maç aktif kupon içinde yeniden bekliyor olur." : "Kombine tüm maçlar sonuçlanana kadar aktif listede kalır.",
        confirmText: nextStatus === "pending" ? "BEKLİYOR olarak işaretle" : (nextStatus === "loss" ? "KAYBETTİ olarak işaretle" : "KAZANDI olarak işaretle")
      };
      refresh();
    }));
    mount.querySelectorAll("[data-card-screenshot]").forEach(btn => btn.addEventListener("click", () => {
      const cardId = btn.dataset.cardScreenshot || "";
      if (String(cardId).includes("crypto-card")) {
        const m = String(cardId).match(/v763-crypto-card-(\d+)/);
        downloadCryptoCardScreenshot(m ? Number(m[1]) : 0);
      } else {
        downloadActiveCardScreenshot(cardId);
      }
    }));
    mount.querySelectorAll("[data-report-create]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.reportCreate === "crypto" ? "crypto" : "bet";
      createReportCard(mode, state);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("[data-report-delete]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.reportDelete;
      saveReportCards(loadReportCards().filter(x => x.id !== id));
      refresh();
    }));
    mount.querySelectorAll("[data-report-download]").forEach(btn => btn.addEventListener("click", () => {
      downloadReportCard(btn.dataset.reportDownload);
    }));
    mount.querySelectorAll("button[data-status]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.mode, i = Number(btn.dataset.slot);
      const list = mode === "crypto" ? state.modeSlots.crypto : state.modeSlots.bet;
      if (!list[i]) list[i] = createSlot(mode, i);
      const nextStatus = btn.dataset.status;
      if (!slotHasUserEntry(list[i], mode)) {
        alert(mode === "crypto" ? "Önce işlem adını yaz." : "Önce maç adını yaz.");
        return;
      }
      if (nextStatus === "win" || nextStatus === "loss") {
        const currentStatus = list[i]?.status || "";
        const finalStatus = currentStatus === nextStatus ? "pending" : nextStatus;
        const keepPanel = btn.closest(".v758-pending-modal") ? (PENDING_BOARD_OPEN_MODE || mode) : (PENDING_BOARD_OPEN_MODE || null);
        if (keepPanel) CONFIRM_RETURN_PANEL_MODE = keepPanel;
        if (mode === "bet" && finalStatus !== "pending") {
          const coupon = getBetCouponForSlot(state, i);
          const settleWholeCoupon = btn.hasAttribute("data-coupon-settle");
          if (settleWholeCoupon && coupon && Array.isArray(coupon.matches) && coupon.matches.length > 1) {
            ACTIVE_COMBO_DETAIL_SLOT = Number(coupon.slotIndex || i || 0);
            CONFIRM_DIALOG = {
              type: "settleCoupon",
              couponId: coupon.id,
              couponSlot: coupon.slotIndex,
              status: finalStatus,
              keepActivePanel: keepPanel,
              tone: finalStatus === "loss" ? "danger" : "success",
              title: "Kombine kupon sonucunu onayla",
              message: `Bu kombine kuponu ${finalStatus === "loss" ? "KAYBETTİ" : "KAZANDI"} olarak kapatılacak.`,
              detail: "Kupondaki tüm maçlar tek geçmiş kaydına yazılır ve Bahis / Kupon Defteri içinde çok satırlı görünür.",
              confirmText: finalStatus === "loss" ? "Kupon Kaybetti" : "Kupon Kazandı"
            };
            refresh();
            return;
          }
          if (coupon && Array.isArray(coupon.matches) && coupon.matches.length > 1) {
            const matchIndex = getBetCouponMatchIndex(coupon, i);
            const matchName = coupon.matches[matchIndex]?.name || `Maç ${matchIndex + 1}`;
            const currentMatchStatus = coupon.matches[matchIndex]?.status || "";
            const nextMatchStatus = currentMatchStatus === finalStatus ? "pending" : finalStatus;
            const resultLabel = nextMatchStatus === "win" ? "KAZANDI" : nextMatchStatus === "loss" ? "KAYBETTİ" : "BEKLİYOR";
            ACTIVE_COMBO_DETAIL_SLOT = Number(coupon.slotIndex || 0);
            CONFIRM_DIALOG = {
              type: "comboMatch",
              slot: i,
              match: matchIndex,
              status: nextMatchStatus,
              keepActivePanel: keepPanel,
              tone: nextMatchStatus === "loss" ? "danger" : "success",
              title: nextMatchStatus === "pending" ? "Maçı bekliyor durumuna al" : "Kombine maç sonucunu onayla",
              message: nextMatchStatus === "pending"
                ? `${matchName} tekrar BEKLİYOR durumuna alınacak.`
                : `${matchName} için ${resultLabel} sonucu kaydedilecek.`,
              detail: nextMatchStatus === "pending" ? "Yanlış işaretleme yaptıysan bu maç aktif kupon içinde yeniden bekliyor olur." : "Kombine tüm maçlar sonuçlanana kadar aktif listede kalır. Tek maç sonucu Geçmiş'e tek başına düşmez.",
              confirmText: nextMatchStatus === "pending" ? "BEKLİYOR olarak işaretle" : `${resultLabel} olarak işaretle`
            };
            refresh();
            return;
          }
          if (betKind(list[i]) === "combo") {
            alert("Kombine için en az iki satırı Kombine olarak seç. Tek satır Kombine geçmişe gönderilmez.");
            return;
          }
        }
        const label = mode === "crypto" ? "kripto işlem" : "bahis / maç";
        const resultLabel = finalStatus === "pending"
          ? "BEKLİYOR"
          : (finalStatus === "win" ? (mode === "crypto" ? "KAZANÇ" : "KAZANDI") : (mode === "crypto" ? "KAYIP" : "KAYBETTİ"));
        const name = String(list[i].name || "").trim() || `${label} #${i + 1}`;
        CONFIRM_DIALOG = {
          type: "settle",
          mode,
          slot: i,
          status: finalStatus,
          keepActivePanel: keepPanel,
          tone: finalStatus === "loss" ? "danger" : "success",
          title: finalStatus === "pending" ? "Tekrar bekliyor durumuna al" : "Sonucu kaydetmeden önce onayla",
          message: finalStatus === "pending" ? `${name} tekrar BEKLİYOR durumuna alınacak.` : `${name} için sonuç: ${resultLabel}.`,
          detail: finalStatus === "pending" ? "Yanlış işaretleme yaptıysan bu kayıt yeniden bekliyor olur." : "Bu kayıt Geçmiş/Rapor merkezine işlenecek. Deneme tıklamasıysa iptal et.",
          confirmText: finalStatus === "pending" ? "BEKLİYOR olarak kaydet" : `${resultLabel} olarak kaydet`
        };
        refresh();
        return;
      }
      applySlotResult(state, mode, i, nextStatus);
      saveState(state);
      refresh();
    }));
    mount.querySelectorAll("button[data-clear]").forEach(btn => btn.addEventListener("click", () => {
      const mode = btn.dataset.clear;
      if (!confirm(mode === "crypto" ? "Kripto işlem alanları temizlensin mi?" : "Bahis kupon alanları temizlensin mi?")) return;
      state.modeSlots[mode] = createSlots(mode, 20); saveState(state); refresh();
    }));
  }
  window.omega_RollingOpenFloatingPanel = function(kind = "active", mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const k = kind === "history" ? "history" : kind === "report" ? "report" : "active";
    PENDING_BOARD_OPEN_MODE = k === "active" ? m : null;
    CONFIRM_RETURN_PANEL_MODE = k === "active" ? m : null;
    LOG_CENTER_OPEN_MODE = k === "history" ? m : null;
    REPORT_CENTER_OPEN_MODE = k === "report" ? m : null;
    HISTORY_OPEN_MODE = null;
    if (k === "history") HISTORY_FILTER = "today";
    renderFloatingPanel();
  };

  if (!window.__omegaV772ExcelRollingBridgeBound) {
    window.__omegaV772ExcelRollingBridgeBound = true;
    const openFromExcelButton = function(event) {
      const target = event.target;
      const overlay = target && target.closest ? target.closest("#rolling-excel-overlay") : null;
      if (!overlay) return;
      const pendingBtn = target.closest("[data-pending-open]");
      const historyBtn = target.closest("[data-log-center]");
      const reportBtn = target.closest("[data-report-open]");
      const btn = pendingBtn || historyBtn || reportBtn;
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      const rawMode = pendingBtn ? pendingBtn.dataset.pendingOpen : historyBtn ? historyBtn.dataset.logCenter : reportBtn.dataset.reportOpen;
      const mode = rawMode === "crypto" ? "crypto" : "bet";
      const kind = pendingBtn ? "active" : historyBtn ? "history" : "report";
      const stamp = `${mode}:${kind}`;
      window.__omegaV772ExcelOpenStamp = stamp;
      // Panel pointerdown aşamasında açılırsa aynı tıklama overlay'e denk gelip anında kapatabiliyor.
      // Bu yüzden sadece click bittikten sonra, bir sonraki macrotask içinde açıyoruz.
      setTimeout(() => {
        if (window.__omegaV772ExcelOpenStamp !== stamp) return;
        window.omega_RollingOpenFloatingPanel(kind, mode);
      }, 0);
      return false;
    };
    document.addEventListener("click", openFromExcelButton, true);
  }

  window.omega_RenderRollingModule = renderModule;
  window.omega_RollingOpenLogCenter = function(mode = "bet") {
    LOG_CENTER_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    REPORT_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    HISTORY_FILTER = "today";
    renderModule();
  };
  window.omega_RollingOpenPendingBoard = function(mode = "bet") {
    PENDING_BOARD_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    LOG_CENTER_OPEN_MODE = null;
    REPORT_CENTER_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  window.omega_RollingOpenReportCenter = function(mode = "bet") {
    REPORT_CENTER_OPEN_MODE = mode === "crypto" ? "crypto" : "bet";
    LOG_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  window.omega_RollingCreateReport = function(mode = "bet") {
    const m = mode === "crypto" ? "crypto" : "bet";
    const fresh = loadState();
    createReportCard(m, fresh);
    saveState(fresh);
    REPORT_CENTER_OPEN_MODE = m;
    LOG_CENTER_OPEN_MODE = null;
    PENDING_BOARD_OPEN_MODE = null;
    HISTORY_OPEN_MODE = null;
    renderModule();
  };
  if (!window.__omegaV767RollingFeatureCoreDelegationBound) {
    window.__omegaV767RollingFeatureCoreDelegationBound = true;
    document.addEventListener("click", event => {
      const btn = event.target.closest && event.target.closest("[data-v767-feature-open]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      const [modeRaw, kindRaw] = String(btn.dataset.v767FeatureOpen || "bet:active").split(":");
      window.omega_RollingOpenFloatingPanel(kindRaw, modeRaw);
    }, true);
  }

  window.omega_RollingV47 = { loadState, saveState, slotSummary, rollingSummary, money };
  window.addEventListener("storage", e => {
    const watched = [STORAGE_KEY, STORAGE_KEY_BET, STORAGE_KEY_CRYPTO, STORAGE_KEY_UI, ROLLING_KEY, HISTORY_KEY_BET, HISTORY_KEY_CRYPTO, TARGET_ITEMS_KEY_BET, TARGET_ITEMS_KEY_CRYPTO];
    if (watched.includes(e.key) && location.hash.startsWith("#rolling")) renderModule();
  });
})();
