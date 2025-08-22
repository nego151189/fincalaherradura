/* /js/index.js — Dashboard (KPIs + feed + recordatorios)
   Reglas:
   - Sin imports ESM; usa firebase compat global (window.db, window.auth).
   - Consultas mínimas y offline-first (si falla, muestra 0/últimos valores).
   - Respeta IDs y clases existentes.
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiUnits    = $('kpiUnits');
  const kpiTrees    = $('kpiTrees');
  const kpiTank     = $('kpiTank');
  const kpiMagaUnit = $('kpiMagaUnit');
  const kpiSales    = $('kpiSales');
  const kpiExpenses = $('kpiExpenses');
  const kpiEstimate = $('kpiEstimate');
  const kpiUpdated  = $('kpiUpdated');

  // UI
  const remindersList = $('remindersList');
  const todayFeed     = $('todayFeed');
  const syncNowBtn    = $('syncNowBtn');

  const TANK_CAPACITY_L = 25000;

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Botón de sync
    syncNowBtn.addEventListener('click', ()=> window.offline?.sync().then(loadAll).catch(()=>{}));

    await ensureAuth();
    await loadAll();

    // Auto refresh cada 5 min
    setInterval(loadAll, 5*60*1000);

    // Recalcular al volver online
    window.addEventListener('online', loadAll);
  });

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  async function loadAll(){
    kpiUpdated.textContent = new Date().toLocaleString('es-GT',{ hour:'2-digit', minute:'2-digit' });

    const [prod, tank, price, sales, expenses] = await Promise.allSettled([
      loadProductionToday(),
      loadTankLevel(),
      loadMagaPrice(),
      loadSalesToday(),
      loadExpensesToday()
    ]);

    // KPIs de producción
    if (prod.status === 'fulfilled'){
      kpiUnits.textContent = prod.value.totalUnits;
      kpiTrees.textContent = prod.value.treesCount;
    } else {
      kpiUnits.textContent = '0';
      kpiTrees.textContent = '0';
    }

    // Tanque
    if (tank.status === 'fulfilled'){
      kpiTank.textContent = `${clampPct(tank.value)}%`;
    } else {
      kpiTank.textContent = '100%';
    }

    // Precio MAGA
    let unitPrice = 0.40;
    if (price.status === 'fulfilled' && price.value > 0){
      unitPrice = price.value;
    }
    kpiMagaUnit.textContent = `Q${unitPrice.toFixed(2)}`;

    // Ventas
    if (sales.status === 'fulfilled'){
      kpiSales.textContent = `Q${sales.value.total.toFixed(2)}`;
    } else {
      kpiSales.textContent = 'Q0.00';
    }

    // Gastos
    if (expenses.status === 'fulfilled'){
      kpiExpenses.textContent = `Q${expenses.value.toFixed(2)}`;
    } else {
      kpiExpenses.textContent = 'Q0.00';
    }

    // Valor estimado de la cosecha de hoy (primera 100%, segunda 80%)
    const est = (prod.status==='fulfilled')
      ? prod.value.u1 * unitPrice + prod.value.u2 * (unitPrice * 0.8)
      : 0;
    kpiEstimate.textContent = `Q${(Math.round(est*100)/100).toFixed(2)}`;

    // Recordatorios
    renderReminders({
      tankPct: (tank.status==='fulfilled') ? tank.value : 100,
      hasProduction: (prod.status==='fulfilled') ? ((prod.value.u1 + prod.value.u2) > 0) : false,
      priceUnit: unitPrice
    });

    // Feed de hoy
    await renderTodayFeed();
  }

  // ---- Producción de hoy (/cosechas_diarias) ----
  async function loadProductionToday(){
    const { start, end } = dayRange();
    let u1 = 0, u2 = 0, uDesc = 0;
    const trees = new Set();

    const q = db.collection('cosechas_diarias')
      .where('fecha','>=',start)
      .where('fecha','<=',end)
      .orderBy('fecha','desc');

    const snap = await q.get();
    snap.forEach(d=>{
      const x = d.data();
      const a = Number(x.unidades_primera || 0);
      const b = Number(x.unidades_segunda || 0);
      const c = Number(x.unidades_descarte || 0);
      u1 += a; u2 += b; uDesc += c;
      if (x.arbol_id) trees.add(String(x.arbol_id));
    });

    return {
      u1, u2, uDesc,
      totalUnits: u1 + u2, // descartes no cuentan a valor
      treesCount: trees.size
    };
  }

  // ---- Último nivel del tanque (/riegos) ----
  async function loadTankLevel(){
    const lastQ = await db.collection('riegos').orderBy('fecha','desc').limit(1).get();
    if (!lastQ.empty){
      const last = lastQ.docs[0].data();
      const after = Number(last.tanque_nivel_despues ?? 100);
      return clampPct(after);
    }
    return 100;
  }

  // ---- Precio MAGA unitario (/precios_maga) ----
  async function loadMagaPrice(){
    const snap = await db.collection('precios_maga').orderBy('fecha','desc').limit(1).get();
    if (!snap.empty){
      const p = snap.docs[0].data();
      const unit = Number(p.precio_por_unidad ?? (p.precio_millar_limon_persa ? p.precio_millar_limon_persa/1000 : 0));
      return (isFinite(unit) && unit > 0) ? unit : 0.40;
    }
    return 0.40;
  }

  // ---- Ventas hoy (/ventas_directas) ----
  async function loadSalesToday(){
    const { start, end } = dayRange();
    let total = 0;

    const q = db.collection('ventas_directas')
      .where('fecha','>=',start)
      .where('fecha','<=',end)
      .orderBy('fecha','desc');

    const snap = await q.get();
    snap.forEach(d=>{
      const x = d.data();
      total += Number(x.total_venta || 0);
    });
    return { total: Math.round(total*100)/100 };
  }

  // ---- Gastos hoy (/gastos) ----
  async function loadExpensesToday(){
    const { start, end } = dayRange();
    let total = 0;

    const q = db.collection('gastos')
      .where('fecha','>=',start)
      .where('fecha','<=',end)
      .orderBy('fecha','desc');

    const snap = await q.get();
    snap.forEach(d=>{
      total += Number(d.data().monto || 0);
    });
    return Math.round(total*100)/100;
  }

  // ---- Recordatorios simples en cliente ----
  function renderReminders(ctx){
    remindersList.innerHTML = '';

    if (ctx.tankPct < 30) addReminder('warning', '💧 Tanque bajo', `Nivel ${ctx.tankPct}% — Revisa antes de regar.`);
    if (!ctx.hasProduction) addReminder('info', '🌿 Sin cosecha registrada', 'Registra producción en “Cosecha”.');
    if (ctx.priceUnit >= 0.50) addReminder('success', '💰 Precio favorable', `MAGA: Q${ctx.priceUnit.toFixed(2)} / unidad.`);

    if (!remindersList.children.length){
      addReminder('ok', 'Todo en orden', 'No hay recordatorios por ahora.');
    }
  }
  function addReminder(type, title, text){
    const row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = `
      <div class="list-cell"><span class="badge ${type==='warning'?'warn':type==='success'?'ok':type==='info'?'orange':'ok'}">${title}</span></div>
      <div class="list-cell" style="grid-column: span 3;">${text}</div>
    `;
    remindersList.appendChild(row);
  }

  // ---- Feed de hoy (cosecha / ventas / gastos / riegos recientes) ----
  async function renderTodayFeed(){
    const { start, end } = dayRange();
    todayFeed.innerHTML = '';

    const queries = [
      db.collection('cosechas_diarias').where('fecha','>=',start).where('fecha','<=',end).orderBy('fecha','desc').limit(10).get().then(s=>s.docs.map(d=>({type:'cosecha', data:d.data()}))),
      db.collection('ventas_directas').where('fecha','>=',start).where('fecha','<=',end).orderBy('fecha','desc').limit(10).get().then(s=>s.docs.map(d=>({type:'venta', data:d.data()}))),
      db.collection('gastos').where('fecha','>=',start).where('fecha','<=',end).orderBy('fecha','desc').limit(10).get().then(s=>s.docs.map(d=>({type:'gasto', data:d.data()}))),
      db.collection('riegos').where('fecha','>=',start).where('fecha','<=',end).orderBy('fecha','desc').limit(5).get().then(s=>s.docs.map(d=>({type:'riego', data:d.data()})))
    ];

    let items = [];
    try {
      const results = await Promise.all(queries);
      items = results.flat();
    } catch(e) {
      // si falla, deja el feed vacío
    }

    // Ordenar por hora descendente
    items.sort((a,b)=> (toMillis(b.data.fecha) - toMillis(a.data.fecha)));

    // Render
    items.slice(0, 12).forEach(item=>{
      const t = item.type;
      const x = item.data;
      const row = document.createElement('div');
      row.className = 'list-row';

      let col2 = '—', col3 = '—', col4 = '—';
      if (t === 'cosecha'){
        col2 = 'Cosecha';
        const u1 = Number(x.unidades_primera || 0), u2 = Number(x.unidades_segunda || 0);
        col3 = `${(x.arbol_id||'—')} · ${u1+u2} unidades`;
        col4 = `1a:${u1} · 2a:${u2}`;
      } else if (t === 'venta'){
        col2 = 'Venta';
        col3 = `${escapeHTML(x.cliente||'—')} · ${x.unidades_vendidas || 0} uds (${x.calidad||'—'})`;
        col4 = `Q${Number(x.total_venta||0).toFixed(2)}`;
      } else if (t === 'gasto'){
        col2 = 'Gasto';
        col3 = `${labelCat(x.categoria)} · ${escapeHTML(x.descripcion||'')}`;
        col4 = `Q${Number(x.monto||0).toFixed(2)}`;
      } else if (t === 'riego'){
        col2 = 'Riego';
        col3 = `${(x.arboles_regados||[]).length} árboles · ${x.litros_utilizados||0} L`;
        col4 = `${clampPct(x.tanque_nivel_despues ?? 100)}% tanque`;
      }

      row.innerHTML = `
        <div class="list-cell">${fmtTime(x.fecha)}</div>
        <div class="list-cell">${col2}</div>
        <div class="list-cell">${col3}</div>
        <div class="list-cell">${col4}</div>
      `;
      todayFeed.appendChild(row);
    });
  }

  // ---- Utils ----
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function toMillis(ts){ try{ return ts?.toDate ? ts.toDate().getTime() : new Date(ts).getTime(); }catch{ return 0; } }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function clampPct(n){ n = Math.round(isFinite(n)?n:0); return Math.max(0, Math.min(100, n)); }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function labelCat(c){
    if (c==='fertilizantes') return 'Fertilizantes';
    if (c==='pesticidas') return 'Pesticidas';
    if (c==='combustible') return 'Combustible';
    if (c==='salarios') return 'Salarios';
    if (c==='mantenimiento') return 'Mantenimiento';
    return 'Otros';
  }
})();
