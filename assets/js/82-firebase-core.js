// ===============================
// V26 FIREBASE AUTH + CLOUD CORE (V1298 Pro Auth + Kasa Sync)
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "kutaysalda1@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyBmuh5uQMz_J1l_IBK7fSn3XvePcIcGVm8",
  authDomain: "bulten-app-27392.firebaseapp.com",
  projectId: "bulten-app-27392",
  storageBucket: "bulten-app-27392.firebasestorage.app",
  messagingSenderId: "44925253394",
  appId: "1:44925253394:web:c9f58cf42cb69e612225cb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const KASA_STORAGE_KEY = "bulten_kasa_challenge_v1:data";

window.V26_FIREBASE = {
  app,
  auth,
  db,
  user: null,
  ready: false
};

const CLOUD_LOCAL_KEYS = [
  "omega_favorites",
  "omega_finance_state",
  "omega_finance_slots",
  "v26_finance_clean_state_v1",
  "omega_crypto_drawings",
  "omega_crypto_alarms",
  "omega_crypto_settings",
  "omega_watch_list",
  "omega_stream_channels",
  KASA_STORAGE_KEY
];

let authMode = "login";
let kasaSyncTimer = null;
let lastSyncTimeText = "";

function injectAuthStyles() {
  if (document.getElementById("v26-auth-style")) return;

  const style = document.createElement("style");
  style.id = "v26-auth-style";
  style.innerHTML = `
    .v26-auth-shell {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    .v26-auth-btn {
      border: 1px solid #2d3748;
      background: #141820;
      color: #f1f5f9;
      border-radius: 10px;
      padding: 8px 13px;
      font-size: 0.75em;
      font-weight: 800;
      cursor: pointer;
      transition: 0.18s ease;
      letter-spacing: .3px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .v26-auth-btn:hover {
      border-color: #fbbf24;
      color: #fbbf24;
    }

    .v26-auth-btn.gold {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-color: #fbbf24;
      color: #171000;
    }

    .v26-auth-btn.gold:hover {
      filter: brightness(1.06);
      color: #171000;
    }

    .v26-auth-btn.danger:hover {
      border-color: #ef4444;
      color: #ef4444;
    }

    .v26-auth-user-pill {
      display: none;
      align-items: center;
      gap: 9px;
      background: #141820;
      border: 1px solid #2d3748;
      border-radius: 11px;
      padding: 5px 11px 5px 6px;
      cursor: pointer;
      transition: 0.18s ease;
      color: #f1f5f9;
    }

    .v26-auth-user-pill:hover {
      border-color: #fbbf24;
    }

    .v26-auth-avatar {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: #fff;
      font-size: 0.78em;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .v26-auth-user-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.15;
    }

    .v26-auth-user {
      color: #e2e8f0;
      font-size: 0.74em;
      font-weight: 800;
      max-width: 170px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: 'JetBrains Mono', monospace;
    }

    .v26-auth-sync-badge {
      font-size: 0.62em;
      font-weight: 800;
      color: #10b981;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .v26-auth-sync-badge.syncing { color: #fbbf24; }
    .v26-auth-sync-badge.error { color: #ef4444; }

    .v26-account-popover {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 290px;
      background: #111622;
      border: 1px solid #2d3748;
      border-radius: 14px;
      box-shadow: 0 22px 55px rgba(0,0,0,0.72);
      padding: 14px;
      display: none;
      flex-direction: column;
      gap: 10px;
      z-index: 31000;
    }

    .v26-account-popover.show {
      display: flex;
    }

    .v26-account-head {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-bottom: 10px;
      border-bottom: 1px solid #222a3a;
    }

    .v26-account-head strong {
      color: #fff;
      font-size: 0.82em;
      word-break: break-all;
    }

    .v26-account-head span {
      color: #94a3b8;
      font-size: 0.7em;
      font-weight: 700;
    }

    .v26-account-msg {
      font-size: 0.72em;
      font-weight: 700;
      color: #94a3b8;
      min-height: 16px;
    }

    .v26-account-msg.good { color: #10b981; }
    .v26-account-msg.bad { color: #ef4444; }

    .v26-account-actions {
      display: grid;
      gap: 7px;
    }

    .v26-account-actions .v26-auth-btn {
      width: 100%;
      justify-content: center;
    }

    .v26-auth-modal {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 15, 0.82);
      backdrop-filter: blur(10px);
      z-index: 30000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .v26-auth-modal.show {
      display: flex;
    }

    .v26-auth-card {
      width: 100%;
      max-width: 420px;
      background: linear-gradient(180deg, #131926 0%, #0d111a 100%);
      border: 1px solid #2b3548;
      border-radius: 20px;
      box-shadow: 0 28px 80px rgba(0,0,0,0.75);
      overflow: hidden;
    }

    .v26-auth-card-head {
      padding: 18px 20px 14px;
      border-bottom: 1px solid #202838;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .v26-auth-brand {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .v26-auth-card-head h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.02em;
      font-weight: 900;
      letter-spacing: .4px;
    }

    .v26-auth-subtitle {
      color: #94a3b8;
      font-size: 0.72em;
      font-weight: 600;
    }

    .v26-auth-close {
      background: #1b2232;
      color: #cbd5e1;
      border: 1px solid #2d3748;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 900;
      font-size: 1.1em;
    }

    .v26-auth-close:hover {
      color: #fff;
      border-color: #ef4444;
    }

    .v26-auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 14px 20px 0;
    }

    .v26-auth-tab {
      background: #0b0f17;
      border: 1px solid #222b3c;
      color: #94a3b8;
      border-radius: 10px;
      padding: 9px 10px;
      font-size: 0.78em;
      font-weight: 800;
      cursor: pointer;
      transition: 0.16s ease;
    }

    .v26-auth-tab.active {
      background: rgba(251, 191, 36, 0.14);
      border-color: #fbbf24;
      color: #fbbf24;
    }

    .v26-auth-card-body {
      padding: 16px 20px 20px;
      display: grid;
      gap: 12px;
    }

    .v26-auth-field {
      display: grid;
      gap: 6px;
    }

    .v26-auth-field label {
      color: #94a3b8;
      font-size: .68em;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .v26-auth-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .v26-auth-field input {
      width: 100%;
      background: #080b12;
      border: 1px solid #2a3447;
      color: #fff;
      border-radius: 11px;
      padding: 12px 40px 12px 12px;
      font-size: .88em;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .v26-auth-field input:focus {
      border-color: #fbbf24;
      box-shadow: 0 0 0 3px rgba(251, 191, 36, .12);
      outline: none;
    }

    .v26-pass-toggle {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      font-size: 0.85em;
    }

    .v26-pass-toggle:hover {
      color: #fff;
    }

    .v26-forgot-link {
      background: transparent;
      border: none;
      color: #60a5fa;
      font-size: 0.74em;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      text-align: right;
      justify-self: end;
    }

    .v26-forgot-link:hover {
      text-decoration: underline;
    }

    .v26-auth-submit {
      width: 100%;
      justify-content: center;
      padding: 12px 14px;
      font-size: 0.84em;
      border-radius: 11px;
    }

    .v26-auth-msg {
      min-height: 18px;
      color: #94a3b8;
      font-size: .76em;
      font-weight: 700;
      line-height: 1.45;
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 9px 11px;
    }

    .v26-auth-msg.good { color: #10b981; border-color: rgba(16, 185, 129, 0.35); }
    .v26-auth-msg.bad { color: #ef4444; border-color: rgba(239, 68, 68, 0.35); }

    body:not(.v27-auth-ready) #v26-auth-shell {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    body.v27-auth-ready #v26-auth-shell {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    #v26-cloud-save-btn,
    #v26-cloud-load-btn {
      display: none !important;
    }

    .v26-auth-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 0.72em;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .v26-auth-divider::before,
    .v26-auth-divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #1e293b;
    }

    .v26-google-btn {
      width: 100%;
      justify-content: center;
      padding: 11px 14px;
      border-radius: 11px;
      font-size: 0.84em;
      font-weight: 800;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.12s ease;
    }

    .v26-google-btn:hover {
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    .v26-resend-btn {
      display: none;
      width: 100%;
      justify-content: center;
      padding: 9px 12px;
      border-radius: 10px;
      border: 1px solid rgba(251, 191, 36, 0.35);
      background: rgba(251, 191, 36, 0.1);
      color: #fbbf24;
      font-size: 0.76em;
      font-weight: 800;
      cursor: pointer;
    }

    .v26-resend-btn.show {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .v26-admin-modal {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.84);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999995;
      padding: 16px;
    }

    .v26-admin-modal.show {
      display: flex;
    }

    .v26-admin-card {
      width: min(880px, 100%);
      max-height: min(86vh, 760px);
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      background: #0b101d;
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 18px;
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.78);
      overflow: hidden;
    }

    .v26-admin-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 15px 18px;
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(15, 23, 42, 0.55));
      border-bottom: 1px solid #1e293b;
    }

    .v26-admin-head h3 {
      margin: 0;
      color: #fbbf24;
      font-size: 1em;
      font-weight: 900;
      letter-spacing: 0.4px;
    }

    .v26-admin-head-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .v26-admin-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      padding: 12px 18px;
      border-bottom: 1px solid #1e293b;
      background: #080c17;
    }

    .v26-admin-stat {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 11px;
      padding: 9px 12px;
      display: grid;
      gap: 3px;
    }

    .v26-admin-stat span {
      color: #94a3b8;
      font-size: 0.7em;
      font-weight: 700;
    }

    .v26-admin-stat strong {
      color: #f8fafc;
      font-size: 1.05em;
      font-weight: 900;
    }

    .v26-admin-body {
      overflow: auto;
      padding: 14px 18px 18px;
    }

    .v26-admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78em;
    }

    .v26-admin-table th {
      text-align: left;
      color: #94a3b8;
      font-weight: 800;
      font-size: 0.85em;
      text-transform: uppercase;
      padding: 8px 10px;
      border-bottom: 1px solid #1e293b;
      white-space: nowrap;
    }

    .v26-admin-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(30, 41, 59, 0.7);
      color: #e2e8f0;
      vertical-align: middle;
    }

    .v26-admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 0.86em;
      font-weight: 800;
      white-space: nowrap;
    }

    .v26-admin-badge.google { background: rgba(59, 130, 246, 0.16); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.32); }
    .v26-admin-badge.password { background: rgba(251, 191, 36, 0.14); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
    .v26-admin-badge.ok { background: rgba(16, 185, 129, 0.16); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.32); }
    .v26-admin-badge.wait { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.32); }

    @media(max-width: 760px) {
      .v26-auth-shell {
        margin-left: auto;
        justify-content: flex-end;
      }

      .v26-auth-user-meta {
        display: none;
      }

      .v26-auth-user-pill {
        padding: 4px;
      }
    }
  `;
  document.head.appendChild(style);
}

function setSyncBadge(text, stateClass = "") {
  const badge = document.getElementById("v26-auth-sync-badge");
  if (badge) {
    badge.className = "v26-auth-sync-badge" + (stateClass ? " " + stateClass : "");
    badge.textContent = text;
  }
  const meta = document.getElementById("v26-account-sync-meta");
  if (meta && lastSyncTimeText) {
    meta.textContent = "Son eşitleme: " + lastSyncTimeText;
  }
}

function setAccountMessage(text, type = "") {
  const el = document.getElementById("v26-account-msg");
  if (!el) return;
  el.className = "v26-account-msg" + (type ? " " + type : "");
  el.textContent = text;
}

function createAuthUI() {
  injectAuthStyles();

  const header = document.querySelector(".top-status-bar");
  if (!header || document.getElementById("v26-auth-shell")) return;

  const shell = document.createElement("div");
  shell.className = "v26-auth-shell";
  shell.id = "v26-auth-shell";
  shell.innerHTML = `
    <button class="v26-auth-btn gold" id="v26-auth-open-btn" type="button">
      <i class="fa-solid fa-user-shield"></i><span>GİRİŞ / KAYIT</span>
    </button>
    <button class="v26-auth-user-pill" id="v26-auth-user-pill" type="button" aria-expanded="false">
      <span class="v26-auth-avatar" id="v26-auth-avatar">K</span>
      <span class="v26-auth-user-meta">
        <span class="v26-auth-user" id="v26-auth-user-label">Hesap</span>
        <span class="v26-auth-sync-badge" id="v26-auth-sync-badge">Hazır</span>
      </span>
      <i class="fa-solid fa-chevron-down" style="font-size:0.68em;color:#94a3b8;"></i>
    </button>
    <div class="v26-account-popover" id="v26-account-popover">
      <div class="v26-account-head">
        <strong id="v26-account-email">-</strong>
        <span id="v26-account-sync-meta">Bulut eşitlemesi aktif</span>
      </div>
      <div class="v26-account-msg" id="v26-account-msg">Kasa ve kayıtların hesabınla eşlenir.</div>
      <div class="v26-account-actions">
        <button class="v26-auth-btn gold" id="v26-admin-members-btn" type="button" style="display:none;"><i class="fa-solid fa-users"></i><span>ÜYELER (YÖNETİCİ)</span></button>
        <button class="v26-auth-btn gold" id="v26-sync-now-btn" type="button"><i class="fa-solid fa-cloud-arrow-up"></i><span>ŞİMDİ EŞİTLE</span></button>
        <button class="v26-auth-btn" id="v26-pull-now-btn" type="button"><i class="fa-solid fa-cloud-arrow-down"></i><span>HESAPTAN ÇEK</span></button>
        <button class="v26-auth-btn danger" id="v26-auth-logout-btn" type="button"><i class="fa-solid fa-right-from-bracket"></i><span>ÇIKIŞ YAP</span></button>
      </div>
    </div>
  `;

  header.appendChild(shell);

  const modal = document.createElement("div");
  modal.className = "v26-auth-modal";
  modal.id = "v26-auth-modal";
  modal.innerHTML = `
    <div class="v26-auth-card">
      <div class="v26-auth-card-head">
        <div class="v26-auth-brand">
          <h3>BULTEN HESAP MERKEZİ</h3>
          <span class="v26-auth-subtitle">Kasa ve ayarlarını tüm cihazlarda aynı tut</span>
        </div>
        <button class="v26-auth-close" id="v26-auth-close-btn" type="button">×</button>
      </div>
      <div class="v26-auth-tabs">
        <button class="v26-auth-tab active" id="v26-tab-login" type="button">GİRİŞ YAP</button>
        <button class="v26-auth-tab" id="v26-tab-register" type="button">KAYIT OL</button>
      </div>
      <div class="v26-auth-card-body">
        <button class="v26-google-btn" id="v26-google-login-btn" type="button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Google ile Devam Et</span>
        </button>
        <div class="v26-auth-divider">veya e-posta ile</div>
        <div class="v26-auth-field">
          <label for="v26-auth-email">E-posta</label>
          <div class="v26-auth-input-wrap">
            <input id="v26-auth-email" type="email" placeholder="ornek@mail.com" autocomplete="email">
          </div>
        </div>
        <div class="v26-auth-field">
          <label for="v26-auth-password">Şifre</label>
          <div class="v26-auth-input-wrap">
            <input id="v26-auth-password" type="password" placeholder="En az 6 karakter" autocomplete="current-password">
            <button class="v26-pass-toggle" id="v26-pass-toggle" type="button" title="Şifreyi Göster">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
        </div>
        <button class="v26-forgot-link" id="v26-forgot-btn" type="button">Şifremi unuttum</button>
        <div class="v26-auth-msg" id="v26-auth-msg">
          Giriş yaptığında kasa geçmişin ve ayarların hesabınla otomatik eşitlenir.
        </div>
        <button class="v26-resend-btn" id="v26-resend-verify-btn" type="button">
          <i class="fa-solid fa-paper-plane"></i>
          <span>Doğrulama Mailini Tekrar Gönder</span>
        </button>
        <button class="v26-auth-btn gold v26-auth-submit" id="v26-auth-submit-btn" type="button">GİRİŞ YAP</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const adminModal = document.createElement("div");
  adminModal.className = "v26-admin-modal";
  adminModal.id = "v26-admin-modal";
  adminModal.innerHTML = `
    <div class="v26-admin-card" onclick="event.stopPropagation()">
      <div class="v26-admin-head">
        <h3><i class="fa-solid fa-users"></i> BULTEN ÜYELER (YÖNETİCİ)</h3>
        <div class="v26-admin-head-actions">
          <button class="v26-auth-btn" id="v26-admin-refresh-btn" type="button"><i class="fa-solid fa-rotate"></i><span>Yenile</span></button>
          <button class="v26-auth-close" id="v26-admin-close-btn" type="button">×</button>
        </div>
      </div>
      <div class="v26-admin-stats" id="v26-admin-stats">
        <div class="v26-admin-stat"><span>Toplam Üye</span><strong>-</strong></div>
        <div class="v26-admin-stat"><span>Google İle</span><strong>-</strong></div>
        <div class="v26-admin-stat"><span>E-posta İle</span><strong>-</strong></div>
        <div class="v26-admin-stat"><span>Doğrulanan</span><strong>-</strong></div>
      </div>
      <div class="v26-admin-body" id="v26-admin-body">
        <div class="v26-auth-msg">Üyeler yükleniyor...</div>
      </div>
    </div>
  `;
  document.body.appendChild(adminModal);

  document.getElementById("v26-auth-open-btn").onclick = openAuthModal;
  document.getElementById("v26-auth-close-btn").onclick = closeAuthModal;
  document.getElementById("v26-tab-login").onclick = () => switchAuthMode("login");
  document.getElementById("v26-tab-register").onclick = () => switchAuthMode("register");
  document.getElementById("v26-google-login-btn").onclick = loginWithGoogle;
  document.getElementById("v26-auth-submit-btn").onclick = submitAuthForm;
  document.getElementById("v26-resend-verify-btn").onclick = resendVerificationEmail;
  document.getElementById("v26-forgot-btn").onclick = resetPassword;
  document.getElementById("v26-auth-logout-btn").onclick = logoutUser;
  document.getElementById("v26-sync-now-btn").onclick = () => saveUserCloudData(false);
  document.getElementById("v26-pull-now-btn").onclick = () => loadUserCloudData(false);
  document.getElementById("v26-admin-members-btn").onclick = openAdminMembersModal;
  document.getElementById("v26-admin-close-btn").onclick = closeAdminMembersModal;
  document.getElementById("v26-admin-refresh-btn").onclick = loadAdminMembers;
  adminModal.addEventListener("click", (e) => {
    if (e.target.id === "v26-admin-modal") closeAdminMembersModal();
  });

  const passToggle = document.getElementById("v26-pass-toggle");
  const passInput = document.getElementById("v26-auth-password");
  const emailInput = document.getElementById("v26-auth-email");

  passToggle.onclick = () => {
    const isPass = passInput.type === "password";
    passInput.type = isPass ? "text" : "password";
    passToggle.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  };

  [emailInput, passInput].forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitAuthForm();
      }
    });
  });

  const pill = document.getElementById("v26-auth-user-pill");
  const popover = document.getElementById("v26-account-popover");
  pill.onclick = (e) => {
    e.stopPropagation();
    const isOpen = popover.classList.toggle("show");
    pill.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  document.addEventListener("click", (e) => {
    if (!shell.contains(e.target)) {
      popover.classList.remove("show");
      pill.setAttribute("aria-expanded", "false");
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target.id === "v26-auth-modal") closeAuthModal();
  });

  updateAuthUI(window.V26_FIREBASE.user);
}

function setResendVisible(show) {
  const btn = document.getElementById("v26-resend-verify-btn");
  if (btn) btn.classList.toggle("show", Boolean(show));
}

function isAdminUser(user) {
  return Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL && user.emailVerified);
}

function isPasswordProviderOnly(user) {
  const providers = Array.isArray(user?.providerData) ? user.providerData.map((p) => p.providerId) : [];
  return providers.length > 0 && providers.every((id) => id === "password");
}

function isUserAllowedSession(user) {
  if (!user) return false;
  if (isPasswordProviderOnly(user) && !user.emailVerified) return false;
  return true;
}

function detectDeviceSummary() {
  const ua = navigator.userAgent || "";
  let os = "Bilinmiyor";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Tarayıcı";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  const formFactor = /Mobi|Android|iPhone/i.test(ua) ? "Mobil" : "Masaüstü";
  return `${formFactor} · ${os} (${browser})`;
}

async function upsertUserProfile(user, providerHint = "", isNew = false) {
  if (!user) return;
  try {
    const providerIds = Array.isArray(user.providerData) ? user.providerData.map((p) => p.providerId) : [];
    const provider = providerHint || (providerIds.includes("google.com") ? "google" : "password");
    const payload = {
      email: user.email || "",
      displayName: user.displayName || "",
      provider,
      emailVerified: Boolean(user.emailVerified),
      device: detectDeviceSummary(),
      lang: navigator.language || "tr",
      lastLoginAt: serverTimestamp()
    };
    if (isNew) payload.createdAt = serverTimestamp();
    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
  } catch (e) {}
}

function switchAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  document.getElementById("v26-tab-login")?.classList.toggle("active", authMode === "login");
  document.getElementById("v26-tab-register")?.classList.toggle("active", authMode === "register");
  const submitBtn = document.getElementById("v26-auth-submit-btn");
  const forgotBtn = document.getElementById("v26-forgot-btn");
  const passInput = document.getElementById("v26-auth-password");
  if (submitBtn) submitBtn.textContent = authMode === "login" ? "GİRİŞ YAP" : "HESAP OLUŞTUR";
  if (forgotBtn) forgotBtn.style.display = authMode === "login" ? "inline-block" : "none";
  if (passInput) passInput.autocomplete = authMode === "login" ? "current-password" : "new-password";
  setResendVisible(false);
  setAuthMessage(
    authMode === "login"
      ? "Giriş yaptığında kasa geçmişin ve ayarların hesabınla otomatik eşitlenir."
      : "Kayıt sonrası e-postana doğrulama bağlantısı gönderilir."
  );
}

function openAuthModal() {
  const modal = document.getElementById("v26-auth-modal");
  if (modal) modal.classList.add("show");
  setResendVisible(false);
  setTimeout(() => document.getElementById("v26-auth-email")?.focus(), 40);
}

function closeAuthModal() {
  const modal = document.getElementById("v26-auth-modal");
  if (modal) modal.classList.remove("show");
  setResendVisible(false);
}

function setAuthMessage(message, type = "") {
  const el = document.getElementById("v26-auth-msg");
  if (!el) return;
  el.className = "v26-auth-msg";
  if (type) el.classList.add(type);
  el.textContent = message;
}

function getAuthInputs() {
  const email = document.getElementById("v26-auth-email")?.value.trim();
  const password = document.getElementById("v26-auth-password")?.value.trim();

  if (!email || !password) {
    setAuthMessage("E-posta ve şifre boş olamaz.", "bad");
    return null;
  }

  if (password.length < 6) {
    setAuthMessage("Şifre en az 6 karakter olmalı.", "bad");
    return null;
  }

  return { email, password };
}

function submitAuthForm() {
  if (authMode === "register") return registerUser();
  return loginUser();
}

async function loginWithGoogle() {
  setResendVisible(false);
  try {
    setAuthMessage("Google ile bağlanılıyor...");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    await upsertUserProfile(cred.user, "google", Boolean(cred._tokenResponse?.isNewUser));
    setAuthMessage("Google ile giriş başarılı.", "good");
    closeAuthModal();
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function registerUser() {
  const inputs = getAuthInputs();
  if (!inputs) return;
  setResendVisible(false);

  try {
    setAuthMessage("Hesap oluşturuluyor...");
    const cred = await createUserWithEmailAndPassword(auth, inputs.email, inputs.password);
    await upsertUserProfile(cred.user, "password", true);
    await sendEmailVerification(cred.user);
    await signOut(auth);
    switchAuthMode("login");
    setResendVisible(true);
    setAuthMessage("Doğrulama bağlantısı e-postana gönderildi. Gelen kutunu (ve spam klasörünü) onayladıktan sonra giriş yapabilirsin.", "good");
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function loginUser() {
  const inputs = getAuthInputs();
  if (!inputs) return;
  setResendVisible(false);

  try {
    setAuthMessage("Giriş yapılıyor...");
    const cred = await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
    if (isPasswordProviderOnly(cred.user) && !cred.user.emailVerified) {
      await upsertUserProfile(cred.user, "password", false);
      await signOut(auth);
      setResendVisible(true);
      setAuthMessage("E-posta adresin henüz doğrulanmamış. Mailindeki bağlantıya tıklayıp onayladıktan sonra giriş yapabilirsin.", "bad");
      return;
    }
    await upsertUserProfile(cred.user, "", false);
    setAuthMessage("Giriş başarılı.", "good");
    closeAuthModal();
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function resendVerificationEmail() {
  const inputs = getAuthInputs();
  if (!inputs) return;
  try {
    setAuthMessage("Doğrulama maili gönderiliyor...");
    const cred = await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
    if (cred.user.emailVerified) {
      await upsertUserProfile(cred.user, "", false);
      setAuthMessage("E-postan zaten doğrulanmış, giriş yapıldı.", "good");
      closeAuthModal();
      return;
    }
    await sendEmailVerification(cred.user);
    await signOut(auth);
    setAuthMessage("Doğrulama maili tekrar gönderildi. Gelen kutunu ve spam klasörünü kontrol et.", "good");
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function resetPassword() {
  const email = document.getElementById("v26-auth-email")?.value.trim();
  if (!email) {
    setAuthMessage("Şifre sıfırlamak için önce e-posta adresini yaz.", "bad");
    return;
  }
  try {
    setAuthMessage("Sıfırlama bağlantısı gönderiliyor...");
    await sendPasswordResetEmail(auth, email);
    setAuthMessage("Şifre sıfırlama bağlantısı e-postana gönderildi.", "good");
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function logoutUser() {
  try {
    document.getElementById("v26-account-popover")?.classList.remove("show");
    await signOut(auth);
  } catch (err) {
    setAccountMessage(firebaseErrorToTurkish(err), "bad");
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAdminTime(ts) {
  if (!ts) return "-";
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "-";
  }
}

function openAdminMembersModal() {
  if (!isAdminUser(window.V26_FIREBASE.user)) return;
  document.getElementById("v26-account-popover")?.classList.remove("show");
  document.getElementById("v26-admin-modal")?.classList.add("show");
  loadAdminMembers();
}

function closeAdminMembersModal() {
  document.getElementById("v26-admin-modal")?.classList.remove("show");
}

async function loadAdminMembers() {
  const body = document.getElementById("v26-admin-body");
  const stats = document.getElementById("v26-admin-stats");
  if (!body || !isAdminUser(window.V26_FIREBASE.user)) return;

  body.innerHTML = '<div class="v26-auth-msg">Üyeler yükleniyor...</div>';
  try {
    const q = query(collection(db, "users"), orderBy("lastLoginAt", "desc"), limit(200));
    const snap = await getDocs(q);
    const rows = [];
    snap.forEach((docSnap) => rows.push({ id: docSnap.id, ...docSnap.data() }));

    const total = rows.length;
    const googleCount = rows.filter((r) => r.provider === "google").length;
    const passwordCount = rows.filter((r) => r.provider !== "google").length;
    const verifiedCount = rows.filter((r) => r.emailVerified || r.provider === "google").length;

    if (stats) {
      stats.innerHTML = `
        <div class="v26-admin-stat"><span>Toplam Üye</span><strong>${total}</strong></div>
        <div class="v26-admin-stat"><span>Google İle</span><strong>${googleCount}</strong></div>
        <div class="v26-admin-stat"><span>E-posta İle</span><strong>${passwordCount}</strong></div>
        <div class="v26-admin-stat"><span>Doğrulanan</span><strong>${verifiedCount}</strong></div>
      `;
    }

    if (!rows.length) {
      body.innerHTML = '<div class="v26-auth-msg">Henüz kayıtlı üye bulunmuyor.</div>';
      return;
    }

    body.innerHTML = `
      <table class="v26-admin-table">
        <thead>
          <tr>
            <th>Üye / E-posta</th>
            <th>Yöntem</th>
            <th>Doğrulama</th>
            <th>Cihaz</th>
            <th>Kayıt</th>
            <th>Son Giriş</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => {
            const isGoogle = r.provider === "google";
            const isVerified = Boolean(r.emailVerified || isGoogle);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(r.email || r.id)}</strong>
                  ${r.displayName ? `<div style="color:#94a3b8;font-size:0.86em;">${escapeHtml(r.displayName)}</div>` : ""}
                </td>
                <td><span class="v26-admin-badge ${isGoogle ? "google" : "password"}">${isGoogle ? "Google" : "E-posta"}</span></td>
                <td><span class="v26-admin-badge ${isVerified ? "ok" : "wait"}">${isVerified ? "Doğrulandı" : "Bekliyor"}</span></td>
                <td>${escapeHtml(r.device || "-")}</td>
                <td>${formatAdminTime(r.createdAt)}</td>
                <td>${formatAdminTime(r.lastLoginAt || r.updatedAt)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = `<div class="v26-auth-msg bad">${escapeHtml(firebaseErrorToTurkish(err))}</div>`;
  }
}

function updateAuthUI(user) {
  const openBtn = document.getElementById("v26-auth-open-btn");
  const pill = document.getElementById("v26-auth-user-pill");
  const label = document.getElementById("v26-auth-user-label");
  const avatar = document.getElementById("v26-auth-avatar");
  const emailEl = document.getElementById("v26-account-email");
  const popover = document.getElementById("v26-account-popover");
  const adminBtn = document.getElementById("v26-admin-members-btn");

  if (!openBtn || !pill || !label) return;

  const validUser = isUserAllowedSession(user) ? user : null;
  if (validUser) {
    const email = validUser.email || "Kullanıcı";
    openBtn.style.display = "none";
    pill.style.display = "inline-flex";
    label.textContent = validUser.displayName || email;
    if (avatar) avatar.textContent = (validUser.displayName || email).charAt(0).toUpperCase();
    if (emailEl) emailEl.textContent = email;
    if (adminBtn) adminBtn.style.display = isAdminUser(validUser) ? "inline-flex" : "none";
    setSyncBadge("Eşitlendi");
  } else {
    openBtn.style.display = "inline-flex";
    pill.style.display = "none";
    if (adminBtn) adminBtn.style.display = "none";
    if (popover) popover.classList.remove("show");
  }
}

function collectLocalData() {
  const data = {};

  CLOUD_LOCAL_KEYS.forEach((key) => {
    try {
      data[key] = localStorage.getItem(key);
    } catch (e) {
      data[key] = null;
    }
  });

  return data;
}

function notifyKasaChallengeFrame() {
  try {
    const frame = document.getElementById("kasa-challenge-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "bulten-kasa-sync" }, location.origin);
    }
  } catch (e) {}
}

function restoreLocalData(data) {
  if (!data || typeof data !== "object") return false;
  let kasaChanged = false;

  CLOUD_LOCAL_KEYS.forEach((key) => {
    if (typeof data[key] === "string") {
      const prev = localStorage.getItem(key);
      localStorage.setItem(key, data[key]);
      if (key === KASA_STORAGE_KEY && prev !== data[key]) {
        kasaChanged = true;
      }
    }
  });

  if (kasaChanged) notifyKasaChallengeFrame();
  return kasaChanged;
}

async function saveUserCloudData(silent = false) {
  const user = window.V26_FIREBASE.user;

  if (!user) {
    if (!silent) setAccountMessage("Önce giriş yapmalısın.", "bad");
    return;
  }

  try {
    setSyncBadge("Kaydediliyor...", "syncing");
    const payload = {
      email: user.email || "",
      localData: collectLocalData(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    lastSyncTimeText = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setSyncBadge("Eşitlendi");
    if (!silent) setAccountMessage("Tüm kayıtlar hesabına kaydedildi.", "good");
  } catch (err) {
    setSyncBadge("Bağlantı hatası", "error");
    if (!silent) setAccountMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function loadUserCloudData(silent = false) {
  const user = window.V26_FIREBASE.user;

  if (!user) {
    if (!silent) setAccountMessage("Önce giriş yapmalısın.", "bad");
    return;
  }

  try {
    setSyncBadge("Eşitleniyor...", "syncing");
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      setSyncBadge("Eşitlendi");
      if (!silent) setAccountMessage("Hesapta henüz kayıtlı veri yok.", "bad");
      return;
    }

    const data = snap.data();
    const onlyKasaChanged = restoreLocalData(data.localData);
    lastSyncTimeText = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setSyncBadge("Eşitlendi");

    if (!silent) {
      setAccountMessage("Veriler hesabından çekildi.", "good");
      if (!onlyKasaChanged) setTimeout(() => location.reload(), 500);
    }
  } catch (err) {
    setSyncBadge("Bağlantı hatası", "error");
    if (!silent) setAccountMessage(firebaseErrorToTurkish(err), "bad");
  }
}

function scheduleKasaCloudSync() {
  if (!window.V26_FIREBASE.user) return;
  setSyncBadge("Kaydediliyor...", "syncing");
  clearTimeout(kasaSyncTimer);
  kasaSyncTimer = setTimeout(() => {
    saveUserCloudData(true);
  }, 900);
}

async function syncKasaOnLogin(user) {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const remoteData = snap.data()?.localData || {};
      const remoteKasaStr = remoteData[KASA_STORAGE_KEY];
      const localKasaStr = localStorage.getItem(KASA_STORAGE_KEY);
      if (typeof remoteKasaStr === "string") {
        let useRemote = !localKasaStr;
        if (localKasaStr && remoteKasaStr !== localKasaStr) {
          try {
            const rObj = JSON.parse(remoteKasaStr);
            const lObj = JSON.parse(localKasaStr);
            const rTs = Number(rObj.updatedAt || 0);
            const lTs = Number(lObj.updatedAt || 0);
            if (rTs >= lTs) useRemote = true;
          } catch (e) {
            useRemote = true;
          }
        }
        if (useRemote) {
          localStorage.setItem(KASA_STORAGE_KEY, remoteKasaStr);
          notifyKasaChallengeFrame();
        } else if (localKasaStr) {
          await saveUserCloudData(true);
        }
      } else if (localKasaStr) {
        await saveUserCloudData(true);
      }
    } else if (localStorage.getItem(KASA_STORAGE_KEY)) {
      await saveUserCloudData(true);
    }
    lastSyncTimeText = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setSyncBadge("Eşitlendi");
  } catch (e) {}
}

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin) return;
  if (e.data && e.data.type === "bulten-kasa-updated") {
    scheduleKasaCloudSync();
  }
});

function firebaseErrorToTurkish(err) {
  const code = err?.code || "";

  const messages = {
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/invalid-email": "E-posta formatı geçersiz.",
    "auth/weak-password": "Şifre çok zayıf. En az 6 karakter kullan.",
    "auth/user-not-found": "Bu e-posta ile kullanıcı bulunamadı.",
    "auth/wrong-password": "Şifre hatalı.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
    "auth/network-request-failed": "Ağ hatası. İnternet bağlantını kontrol et.",
    "auth/popup-closed-by-user": "Google giriş penceresi kapatıldı.",
    "auth/cancelled-popup-request": "Google giriş isteği iptal edildi.",
    "auth/popup-blocked": "Tarayıcı açılır pencereyi engelledi. İzin verip tekrar dene.",
    "auth/operation-not-allowed": "Google ile giriş yöntemi henüz aktif değil.",
    "auth/unauthorized-domain": "Bu adres Google girişi için yetkili değil. Önizlemede localhost adresini kullanabilirsin.",
    "permission-denied": "Bulut izni reddedildi."
  };

  return messages[code] || `Hesap hatası: ${code || err.message || "Bilinmeyen hata"}`;
}

onAuthStateChanged(auth, (user) => {
  const validUser = isUserAllowedSession(user) ? user : null;
  window.V26_FIREBASE.user = validUser;
  window.V26_FIREBASE.ready = true;
  document.body.classList.add("v27-auth-ready");
  updateAuthUI(validUser);
  if (validUser) {
    upsertUserProfile(validUser);
    syncKasaOnLogin(validUser);
  }

  window.dispatchEvent(new CustomEvent("v26-auth-ready", {
    detail: { user: validUser }
  }));
});

document.addEventListener("DOMContentLoaded", createAuthUI);

window.v26SaveCloudData = saveUserCloudData;
window.v26LoadCloudData = loadUserCloudData;
window.v26SyncKasaChallenge = () => saveUserCloudData(true);
