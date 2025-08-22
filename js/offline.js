// /js/offline.js — Cola offline + indicador de conectividad (IDs existentes)
// Usa exactamente estos IDs de tu index.html: 
// #connectivityIndicator, #connectivityText, #pendingBadge
// 🔧 Modificado: no cambia tu diseño; solo actualiza texto/estados.

(function () {
  const KEY_PREFIX = "offline_queue_";
  const handlers = new Map();   // type -> async function(payload)

  // -------- UI helpers (usa tus propios IDs/clases) ----------
  const $i = document.getElementById("connectivityIndicator");
  const $t = document.getElementById("connectivityText");
  const $b = document.getElementById("pendingBadge");

  function getPendingCount() {
    let total = 0;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(KEY_PREFIX)) {
        try { total += (JSON.parse(localStorage.getItem(k)).length || 0); } catch (_) {}
      }
    });
    return total;
  }

  function setStatus(state, count = getPendingCount()) {
    if ($i) { $i.classList.remove("online", "offline", "syncing"); $i.classList.add(state); }
    if ($t) { 
      $t.textContent = state === "online" ? "Conectado" : state === "offline" ? "Sin Internet" : "Sincronizando…"; 
    }
    if ($b) {
      if (count > 0) { $b.classList.remove("hidden"); $b.textContent = String(count); }
      else { $b.classList.add("hidden"); }
    }
  }

  // -------- Cola offline ----------
  function add(type, payload) {
    const key = KEY_PREFIX + type;
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push({ payload, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(arr));
    setStatus(navigator.onLine ? "syncing" : "offline");
  }

  function register(type, fn) { handlers.set(type, fn); }

  async function drainType(type) {
    const key = KEY_PREFIX + type;
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    if (!arr.length) return 0;
    let done = 0;
    for (const item of arr) {
      // eslint-disable-next-line no-await-in-loop
      await handlers.get(type)(item.payload);
      done++;
    }
    localStorage.removeItem(key);
    return done;
  }

  async function sync() {
    if (!navigator.onLine) return 0;
    setStatus("syncing");
    let total = 0;
    for (const type of handlers.keys()) {
      // eslint-disable-next-line no-await-in-loop
      total += await drainType(type);
    }
    setStatus("online");
    return total;
  }

  // -------- Eventos globales ----------
  window.addEventListener("online", () => { sync().catch(console.error); setStatus("online"); });
  window.addEventListener("offline", () => setStatus("offline"));

  // Exponer API pública
  window.offline = { add, register, sync, setStatus, getPendingCount };

  // Estado inicial
  setStatus(navigator.onLine ? "online" : "offline", getPendingCount());

  // -------- Opcional: ejemplo de registro de handlers ----------
  // window.offline.register("cosecha", async (payload) => {
  //   // requiere window.db inicializado (firebase-config.js)
  //   await db.collection("cosechas_diarias").add({ ...payload, fecha: new Date() });
  // });
})();
