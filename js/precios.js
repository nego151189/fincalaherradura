/* /js/precios.js — Cliente MAGA
   - Lee Firestore (últimos 7), sin proxy API
   - Cache local en localStorage FH_PRICE_CACHE
   - Señal "favorable" si >= 500 o subida ≥10% vs último valor
   - Precios actuales: CENMA: Q800, Terminal: Q800 (01/Sep/2025)
*/

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

  // Precios actuales MAGA (actualizar manualmente cuando cambien)
  const currentMagaPrices = {
    cenma: 800.00,
    terminal: 800.00,
    date: '2025-09-01',
    source: 'MAGA'
  };

  document.addEventListener('DOMContentLoaded', async ()=>{
    await ensureAuth();
    bindUI();
    await loadHistory();
    await refreshCurrentPrices();
  });

  function bindUI(){
    refreshBtn.addEventListener('click', ()=> refreshCurrentPrices());
    forceBtn.addEventListener('click', ()=> addCurrentPriceToFirestore());
    subBtn.addEventListener('click', ()=> {
      alert('Para recibir notificaciones:\n1) Habilita permisos de notificación en tu navegador.\n2) Precio actual: CENMA Q800, Terminal Q800\n3) Señal: ' + (getCurrentPrice() >= 500 ? 'FAVORABLE' : 'Normal') + '\n\n*Nota: Los precios se actualizan manualmente desde la página oficial de MAGA');
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
      
      if (snap.empty) {
        // Si no hay datos, mostrar mensaje
        historyList.innerHTML = '<div class="list-row"><div class="list-cell">No hay datos históricos</div><div class="list-cell">—</div><div class="list-cell">MAGA</div></div>';
        return;
      }
      
      snap.forEach(doc=>{
        const d = doc.data();
        lastHistory.push(d);
        const div = document.createElement('div');
        div.className = 'list-row';
        const when = d.fecha && d.fecha.toDate ? d.fecha.toDate() : new Date();
        const price = d.precio_millar_limon_persa || d.cenma || d.terminal || 0;
        div.innerHTML = `
          <div class="list-cell">${when.toLocaleDateString('es-GT', { day:'2-digit', month:'short' })}</div>
          <div class="list-cell"><b>Q${price.toFixed(2)}</b></div>
          <div class="list-cell">${(d.fuente||'MAGA')}</div>
        `;
        historyList.appendChild(div);
      });
    }catch(e){
      console.error('Error cargando historial:', e);
      // Sin conexión: intenta cache local
      const cache = readCache();
      if (cache){ 
        render(cache, true); 
      } else {
        historyList.innerHTML = '<div class="list-row"><div class="list-cell">Error de conexión</div><div class="list-cell">—</div><div class="list-cell">—</div></div>';
      }
    }
  }

  // ===== Obtener precio actual (promedio CENMA y Terminal)
  function getCurrentPrice() {
    return (currentMagaPrices.cenma + currentMagaPrices.terminal) / 2;
  }

  // ===== Actualizar precios actuales
  async function refreshCurrentPrices() {
    try {
      // Intentar obtener el precio más reciente de Firestore
      const snap = await db.collection('precios_maga').orderBy('fecha','desc').limit(1).get();
      
      let price = getCurrentPrice();
      let isFromCache = true;
      let updateTime = new Date();

      if (!snap.empty) {
        const latest = snap.docs[0].data();
        const latestDate = latest.fecha.toDate();
        const today = new Date();
        const diffHours = (today - latestDate) / (1000 * 60 * 60);
        
        // Si el último registro es de hoy, usar ese precio
        if (diffHours < 24) {
          price = latest.precio_millar_limon_persa || latest.cenma || latest.terminal || price;
          updateTime = latestDate;
          isFromCache = false;
        }
      }

      const payload = {
        price: price,
        updatedAt: updateTime
      };
      
      writeCache(payload);
      render(payload, isFromCache);
      
    } catch(e) {
      console.error('Error actualizando precios:', e);
      // Usar precios por defecto
      const payload = {
        price: getCurrentPrice(),
        updatedAt: new Date()
      };
      writeCache(payload);
      render(payload, true);
    }
  }

  // ===== Agregar precio actual a Firestore (solo si el usuario lo fuerza)
  async function addCurrentPriceToFirestore() {
    if (!confirm('¿Agregar el precio actual de MAGA a la base de datos?\nCENMA: Q' + currentMagaPrices.cenma + '\nTerminal: Q' + currentMagaPrices.terminal)) {
      return;
    }

    try {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Mediodía para evitar conflictos de zona horaria

      await db.collection('precios_maga').add({
        fecha: today,
        precio_millar_limon_persa: getCurrentPrice(),
        cenma: currentMagaPrices.cenma,
        terminal: currentMagaPrices.terminal,
        fuente: 'MAGA Manual',
        peso_millar_kg: 110,
        actualizado_por: auth.currentUser?.uid || 'anonimo'
      });

      alert('✅ Precio agregado exitosamente');
      await Promise.all([loadHistory(), refreshCurrentPrices()]);
      
    } catch(e) {
      console.error('Error guardando precio:', e);
      alert('❌ Error al guardar el precio: ' + e.message);
    }
  }

  // ===== Render UI y señal
  function render(payload, cached){
    const nowPrice = Number(payload.price||0);
    priceValue.textContent = 'Q' + nowPrice.toFixed(2);

    const prev = (lastHistory && lastHistory.length) ? Number(lastHistory[0].precio_millar_limon_persa||lastHistory[0].cenma||lastHistory[0].terminal||0) : 0;
    let changePct = 0;
    if (prev) changePct = ((nowPrice - prev) / prev) * 100;

    trendValue.textContent = prev ? (changePct>=0 ? '↗ ' : '↘ ') + Math.abs(changePct).toFixed(1) + '%' : '—';

    const fav = (nowPrice >= 500) || (changePct >= 10);
    kpiFav.textContent = fav ? 'Favorable' : 'Normal';
    kpiFav.style.color = fav ? '#2e7d32' : '#333';

    const when = payload.updatedAt ? new Date(payload.updatedAt) : new Date();
    const status = cached ? 'cache • ' : '';
    const priceDetail = `CENMA: Q${currentMagaPrices.cenma} | Terminal: Q${currentMagaPrices.terminal}`;
    lastUpdate.innerHTML = `${status}${when.toLocaleString('es-GT')}<br><small>${priceDetail}</small>`;
  }

  // ===== Cache local
  function writeCache(p){ 
    try{ 
      localStorage.setItem('FH_PRICE_CACHE', JSON.stringify({ 
        ...p, 
        ts: Date.now(),
        cenma: currentMagaPrices.cenma,
        terminal: currentMagaPrices.terminal
      })); 
    }catch(e){
      console.error('Error escribiendo cache:', e);
    } 
  }
  
  function readCache(){ 
    try{ 
      const x = JSON.parse(localStorage.getItem('FH_PRICE_CACHE')||'null'); 
      return x; 
    }catch(e){ 
      return null; 
    } 
  }

})();
