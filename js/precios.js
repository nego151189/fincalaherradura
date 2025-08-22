/* /js/precios.js — Cliente MAGA
   - Intenta leer Firestore (últimos 7), luego proxy /api/maga-prices
   - Cache local en localStorage FH_PRICE_CACHE
   - Señal "favorable" si >= 500 o subida ≥10% vs último valor
*/
// 🔧 Modificado: nuevo archivo

(function(){
  const $ = id => document.getElementById(id);
  const priceValue = $('priceValue');
  const trendValue = $('trendValue');
  const kpiFav     = $('kpiFav');
  const lastUpdate = $('lastUpdate');
  const historyList= $('historyList');
  const refreshBtn = $('refreshBtn');
  const forceBtn   = $('forceBtn');
  const subBtn     = $('subBtn');

  let lastHistory = [];

  document.addEventListener('DOMContentLoaded', async ()=>{
    await ensureAuth();
    bindUI();
    await loadHistory();
    await fetchLive(false); // intenta proxy (usa doc de hoy si existe)
  });

  function bindUI(){
    refreshBtn.addEventListener('click', ()=> fetchLive(false));
    forceBtn.addEventListener('click', ()=> fetchLive(true));
    subBtn.addEventListener('click', ()=> {
      alert('Para recibir notificaciones:\n1) Habilita permisos de notificación en tu navegador.\n2) Tu app de Cloud Functions ya envía alertas al tópico "price-alerts" cuando el precio es alto (>=500) o sube ≥10%.\n*Nota:* Suscripciones a tópicos se hacen desde el servidor con FCM; si quieres, luego añadimos un endpoint para registrar tu token.');
    });
  }

  async function ensureAuth(){
    return new Promise(r => auth.onAuthStateChanged(u => r(u || null)));
  }

  // ===== Carga histórico (últimos 7)
  async function loadHistory(){
    try{
      const snap = await db.collection('precios_maga').orderBy('fecha','desc').limit(7).get();
      lastHistory = [];
      historyList.innerHTML = '';
      snap.forEach(doc=>{
        const d = doc.data();
        lastHistory.push(d);
        const div = document.createElement('div');
        div.className = 'list-row';
        const when = d.fecha && d.fecha.toDate ? d.fecha.toDate() : new Date();
        div.innerHTML = `
          <div class="list-cell">${when.toLocaleDateString('es-GT', { day:'2-digit', month:'short' })}</div>
          <div class="list-cell"><b>Q${d.precio_millar_limon_persa}</b></div>
          <div class="list-cell">${(d.fuente||'MAGA')}</div>
        `;
        historyList.appendChild(div);
      });
    }catch(e){
      // sin conexión: intenta cache local
      const cache = readCache();
      if (cache){ render(cache, true); }
    }
  }

  // ===== Llamar proxy HTTPS
  async function fetchLive(force){
    try{
      const url = force ? '/api/maga-prices?force=1' : '/api/maga-prices';
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.price){
        const payload = {
          price: data.price,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        };
        writeCache(payload);
        render(payload, !!data.cached);
        // Historia puede no incluir el doc de hoy aún; recarga suave
        loadHistory().catch(()=>{});
      } else if (data && data.lastKnown) {
        const payload = {
          price: data.lastKnown.price,
          updatedAt: data.lastKnown.fecha && data.lastKnown.fecha.toDate ? data.lastKnown.fecha.toDate() : new Date()
        };
        writeCache(payload);
        render(payload, true);
      } else {
        const cache = readCache();
        if (cache){ render(cache, true); }
        else { priceValue.textContent='—'; lastUpdate.textContent='—'; }
      }
    }catch(e){
      const cache = readCache();
      if (cache){ render(cache, true); }
    }
  }

  // ===== Render UI y señal
  function render(payload, cached){
    const nowPrice = Number(payload.price||0);
    priceValue.textContent = 'Q' + nowPrice;

    const prev = (lastHistory && lastHistory.length) ? Number(lastHistory[0].precio_millar_limon_persa||0) : 0;
    let changePct = 0;
    if (prev) changePct = ((nowPrice - prev) / prev) * 100;

    trendValue.textContent = prev ? (changePct>=0 ? '↑ ' : '↓ ') + Math.abs(changePct).toFixed(1) + '%' : '—';

    const fav = (nowPrice >= 500) || (changePct >= 10);
    kpiFav.textContent = fav ? 'Favorable' : 'Normal';
    kpiFav.style.color = fav ? '#2e7d32' : '#333';

    const when = payload.updatedAt ? new Date(payload.updatedAt) : new Date();
    lastUpdate.textContent = (cached ? 'cache • ' : '') + when.toLocaleString('es-GT');
  }

  // ===== Cache local
  function writeCache(p){ try{ localStorage.setItem('FH_PRICE_CACHE', JSON.stringify({ ...p, ts: Date.now() })); }catch(e){} }
  function readCache(){ try{ const x = JSON.parse(localStorage.getItem('FH_PRICE_CACHE')||'null'); return x; }catch(e){ return null; } }

})();

