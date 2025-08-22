// /js/firebase-config.js — Inicializa Firebase (compat) y expone servicios globales
// 🔧 Modificado: no toca tu HTML ni tus IDs/clases.
(function () {
  if (!window.firebase || !firebase.initializeApp) {
    console.error("Firebase CDN no cargado. Asegúrate de incluir los 5 scripts compat antes de /js/firebase-config.js");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyDm_DenNbuG-zLS-8tupO8BZEpfo5z3MY8",
    authDomain: "fincalaherradura-c5229.firebaseapp.com",
    projectId: "fincalaherradura-c5229",
    storageBucket: "fincalaherradura-c5229.firebasestorage.app",
    messagingSenderId: "453253173599",
    appId: "1:453253173599:web:f5f31e55fc1a93e7f5a6ea"
  };

  // Inicialización
  firebase.initializeApp(firebaseConfig);

// después de initializeApp(...)
window.auth = firebase.auth();
window.db   = firebase.firestore();

// Evita crashear si el SDK de storage no está cargado
try {
  window.storage = firebase.storage ? firebase.storage() : null;
  if (!window.storage) console.warn('[config] Storage SDK no cargado; omitiendo storage.');
} catch (e) {
  console.warn('[config] Storage init:', e && e.message);
}


  // Sesión anónima para empezar a usar la app sin fricción
  auth.onAuthStateChanged((user) => {
    if (!user) {
      auth.signInAnonymously().catch((e) => console.error("Auth error:", e));
    } else {
      console.log("✅ Auth lista. UID:", user.uid);
    }
  });
})();
