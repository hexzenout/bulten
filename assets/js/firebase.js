// ===============================
// V26 FIREBASE AUTH + CLOUD CORE
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkFQxOie3jWQMftT4Lv59cGRvkXYoIFwU",
  authDomain: "bulten-terminal.firebaseapp.com",
  projectId: "bulten-terminal",
  storageBucket: "bulten-terminal.firebasestorage.app",
  messagingSenderId: "28873536369",
  appId: "1:28873536369:web:78f605040883bd0b387cd0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  "omega_stream_channels"
];
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
    }

    .v26-auth-btn {
      border: 1px solid #333;
      background: #151515;
      color: #f1f1f1;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.75em;
      font-weight: 900;
      cursor: pointer;
      transition: 0.18s;
      letter-spacing: .3px;
    }

    .v26-auth-btn:hover {
      border-color: #fbbf24;
      color: #fbbf24;
    }

    .v26-auth-btn.gold {
      background: #fbbf24;
      border-color: #fbbf24;
      color: #171000;
    }

    .v26-auth-user {
      color: #aaa;
      font-size: 0.74em;
      font-weight: 800;
      max-width: 230px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: 'JetBrains Mono', monospace;
    }

    .v26-auth-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.82);
      backdrop-filter: blur(8px);
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
      background: #101010;
      border: 1px solid #333;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(0,0,0,.65);
      overflow: hidden;
    }

    .v26-auth-card-head {
      padding: 18px 20px;
      border-bottom: 1px solid #262626;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .v26-auth-card-head h3 {
      margin: 0;
      color: #fbbf24;
      font-size: 1em;
      font-weight: 950;
      letter-spacing: .7px;
    }

    .v26-auth-close {
      background: #1d1d1d;
      color: #fff;
      border: 1px solid #333;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 950;
    }

    .v26-auth-card-body {
      padding: 18px 20px 20px;
      display: grid;
      gap: 10px;
    }

    .v26-auth-field {
      display: grid;
      gap: 6px;
    }

    .v26-auth-field label {
      color: #aaa;
      font-size: .66em;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    .v26-auth-field input {
      background: #070707;
      border: 1px solid #333;
      color: #fff;
      border-radius: 11px;
      padding: 12px;
      font-size: .9em;
      font-family: 'JetBrains Mono', monospace;
    }

    .v26-auth-field input:focus {
      border-color: #fbbf24;
      box-shadow: 0 0 0 2px rgba(251,191,36,.08);
    }

    .v26-auth-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-top: 6px;
    }

    .v26-auth-msg {
      min-height: 18px;
      color: #aaa;
      font-size: .78em;
      font-weight: 750;
      line-height: 1.45;
    }

    .v26-auth-msg.good { color: #10b981; }
    .v26-auth-msg.bad { color: #ef4444; }

    @media(max-width: 760px) {
      .v26-auth-shell {
        margin-left: 0;
        width: 100%;
        justify-content: flex-end;
      }

      .v26-auth-user {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function createAuthUI() {
  injectAuthStyles();

  const header = document.querySelector(".top-status-bar");
  if (!header || document.getElementById("v26-auth-shell")) return;

  const shell = document.createElement("div");
  shell.className = "v26-auth-shell";
  shell.id = "v26-auth-shell";
  shell.innerHTML = `
    <span class="v26-auth-user" id="v26-auth-user-label">Giriş yapılmadı</span>
    <button class="v26-auth-btn gold" id="v26-auth-open-btn">GİRİŞ / KAYIT</button>
    <!-- Cloud save/load arka planda hazır tutulur; kullanıcı ekranında gösterilmez. -->
    <button class="v26-auth-btn" id="v26-auth-logout-btn" style="display:none;">ÇIKIŞ</button>
  `;

  header.appendChild(shell);

  const modal = document.createElement("div");
  modal.className = "v26-auth-modal";
  modal.id = "v26-auth-modal";
  modal.innerHTML = `
    <div class="v26-auth-card">
      <div class="v26-auth-card-head">
        <h3>V26 HESAP GİRİŞİ</h3>
        <button class="v26-auth-close" id="v26-auth-close-btn">×</button>
      </div>
      <div class="v26-auth-card-body">
        <div class="v26-auth-field">
          <label>E-posta</label>
          <input id="v26-auth-email" type="email" placeholder="ornek@mail.com" autocomplete="email">
        </div>
        <div class="v26-auth-field">
          <label>Şifre</label>
          <input id="v26-auth-password" type="password" placeholder="En az 6 karakter" autocomplete="current-password">
        </div>
        <div class="v26-auth-msg" id="v26-auth-msg">
          Giriş yaparsan ayarlarını, alarm ve kasa verilerini buluta kaydedebiliriz.
        </div>
        <div class="v26-auth-actions">
          <button class="v26-auth-btn gold" id="v26-login-btn">GİRİŞ YAP</button>
          <button class="v26-auth-btn" id="v26-register-btn">KAYIT OL</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("v26-auth-open-btn").onclick = openAuthModal;
  document.getElementById("v26-auth-close-btn").onclick = closeAuthModal;
  document.getElementById("v26-login-btn").onclick = loginUser;
  document.getElementById("v26-register-btn").onclick = registerUser;
  document.getElementById("v26-auth-logout-btn").onclick = logoutUser;
  const cloudSaveBtn = document.getElementById("v26-cloud-save-btn");
  const cloudLoadBtn = document.getElementById("v26-cloud-load-btn");
  if (cloudSaveBtn) cloudSaveBtn.onclick = saveUserCloudData;
  if (cloudLoadBtn) cloudLoadBtn.onclick = loadUserCloudData;

  modal.addEventListener("click", (e) => {
    if (e.target.id === "v26-auth-modal") closeAuthModal();
  });
}

function openAuthModal() {
  const modal = document.getElementById("v26-auth-modal");
  if (modal) modal.classList.add("show");
}

function closeAuthModal() {
  const modal = document.getElementById("v26-auth-modal");
  if (modal) modal.classList.remove("show");
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

async function registerUser() {
  const inputs = getAuthInputs();
  if (!inputs) return;

  try {
    setAuthMessage("Kayıt oluşturuluyor...");
    await createUserWithEmailAndPassword(auth, inputs.email, inputs.password);
    setAuthMessage("Kayıt başarılı. Oturum açıldı.", "good");
    closeAuthModal();
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function loginUser() {
  const inputs = getAuthInputs();
  if (!inputs) return;

  try {
    setAuthMessage("Giriş yapılıyor...");
    await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
    setAuthMessage("Giriş başarılı.", "good");
    closeAuthModal();
  } catch (err) {
    setAuthMessage(firebaseErrorToTurkish(err), "bad");
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    alert(firebaseErrorToTurkish(err));
  }
}

function updateAuthUI(user) {
  const label = document.getElementById("v26-auth-user-label");
  const openBtn = document.getElementById("v26-auth-open-btn");
  const logoutBtn = document.getElementById("v26-auth-logout-btn");
  const saveBtn = document.getElementById("v26-cloud-save-btn");
  const loadBtn = document.getElementById("v26-cloud-load-btn");

  if (!label || !openBtn || !logoutBtn) return;

  if (user) {
    label.textContent = user.email || "Kullanıcı";
    openBtn.style.display = "none";
    logoutBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.style.display = "inline-flex";
    if (loadBtn) loadBtn.style.display = "inline-flex";
  } else {
    label.textContent = "Giriş yapılmadı";
    openBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "none";
    if (loadBtn) loadBtn.style.display = "none";
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

function restoreLocalData(data) {
  if (!data || typeof data !== "object") return;

  CLOUD_LOCAL_KEYS.forEach((key) => {
    if (typeof data[key] === "string") {
      localStorage.setItem(key, data[key]);
    }
  });
}

async function saveUserCloudData() {
  const user = window.V26_FIREBASE.user;

  if (!user) {
    alert("Önce giriş yapmalısın.");
    return;
  }

  try {
    const payload = {
      email: user.email || "",
      localData: collectLocalData(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    alert("Buluta kaydedildi.");
  } catch (err) {
    alert(firebaseErrorToTurkish(err));
  }
}

async function loadUserCloudData() {
  const user = window.V26_FIREBASE.user;

  if (!user) {
    alert("Önce giriş yapmalısın.");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("Bulutta kayıt bulunamadı.");
      return;
    }

    const data = snap.data();
    restoreLocalData(data.localData);

    alert("Buluttan yüklendi. Sayfa yenileniyor.");
    location.reload();
  } catch (err) {
    alert(firebaseErrorToTurkish(err));
  }
}

function firebaseErrorToTurkish(err) {
  const code = err?.code || "";

  const messages = {
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/invalid-email": "E-posta formatı geçersiz.",
    "auth/weak-password": "Şifre çok zayıf. En az 6 karakter kullan.",
    "auth/user-not-found": "Bu e-posta ile kullanıcı bulunamadı.",
    "auth/wrong-password": "Şifre hatalı.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/network-request-failed": "Ağ hatası. İnternet bağlantını kontrol et.",
    "permission-denied": "Firestore izni reddedildi. Güvenlik kurallarını kontrol et."
  };

  return messages[code] || `Firebase hata: ${code || err.message || "Bilinmeyen hata"}`;
}

onAuthStateChanged(auth, (user) => {
  window.V26_FIREBASE.user = user || null;
  window.V26_FIREBASE.ready = true;
  updateAuthUI(user);

  window.dispatchEvent(new CustomEvent("v26-auth-ready", {
    detail: { user }
  }));
});

document.addEventListener("DOMContentLoaded", createAuthUI);

window.v26SaveCloudData = saveUserCloudData;
window.v26LoadCloudData = loadUserCloudData;
