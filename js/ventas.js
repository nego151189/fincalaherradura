/* /js/ventas.js — Ventas directas
   - Sin imports ESM (firebase compat global)
   - Colección: /ventas_directas
     { fecha, cliente, unidades_vendidas, precio_por_unidad, total_venta,
       calidad, forma_pago, observaciones }
   - Precio MAGA por defecto (lee último /precios_maga)
   - Cola offline: 'sales'
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiSalesCount = $('kpiSalesCount');
  const kpiUnitsSold  = $('kpiUnitsSold');
  const kpiRevenue    = $('kpiRevenue');
  const kpiAvgPrice   = $('kpiAvgPrice');

  // Form
  const clientName = $('clientName');
  const quality    = $('quality');
  const units      = $('units');
  const unitPrice  = $('unitPrice');
  const payment    = $('payment');
  const notes      = $('notes');
  const totalBox   = $('totalBox');

  const btnMaga1   = $('btnMaga1');
  const btnMaga2   = $('btnMaga2');
  const saveSaleBtn= $('saveSaleBtn');
  const syncBtn    = $('syncBtn');
  const clearBtn   = $('clearBtn');

  // List
  const salesList  = $('salesList');

  let MAGA_UNIT = 0.40; // fallback

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Registrar cola offline
    window.offline?.register('sales', syncQueuedSale);

    bindUI();
    await ensureAuth();
    await loadMagaPrice();
    recalcTotal();
    await Promise.all([refreshKPIs(), loadTodaySales()]);
  });

  function bindUI(){
    // botones MAGA
    btnMaga1.addEventListener('click', ()=>{ unitPrice.value = MAGA_UNIT.toFixed(2); recalcTotal(); });
    btnMaga2.addEventListener('click', ()=>{ unitPrice.value = (MAGA_UNIT*0.8).toFixed(2); recalcTotal(); });

    // cambios que impactan total
    [units, unitPrice, quality].forEach(el => el.addEventListener('input', recalcTotal));

    // incrementos
    document.querySelectorAll('.btn-bar .button.mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tgt = document.querySelector(btn.getAttribute('data-add'));
        const val = Number(btn.getAttribute('data-val'));
        if (!tgt) return;
        const cur = clampMin(Number(tgt.value||0) + val, 0);
        tgt.value = String(cur);
        recalcTotal();
      });
    });

    saveSaleBtn.addEventListener('click', saveSale);
    clearBtn.addEventListener('click', clearForm);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadTodaySales()])).catch(()=>{}));
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ---- Precio MAGA ----
  async function loadMagaPrice(){
    try{
      const snap = await db.collection('precios_maga').orderBy('fecha','desc').limit(1).get();
      if (!snap.empty){
        const p = snap.docs[0].data();
        MAGA_UNIT = Number(p.precio_por_unidad ?? (p.precio_millar_limon_persa ? p.precio_millar_limon_persa/1000 : 0)) || 0.40;
      }
    }catch(e){}
    unitPrice.value = MAGA_UNIT.toFixed(2);
  }

  // ---- Guardar venta ----
  async function saveSale(){
    const cliente = (clientName.value||'').trim();
    const cal = quality.value || 'primera';
    const unid = clampMin(Number(units.value||0), 0);
    const pu = clampMin(Number(unitPrice.value||0), 0);
    const total = round2(unid * pu);
    const fp = payment.value || 'efectivo';
    const obs = (notes.value||'').trim();

    if (!cliente) return alert('Ingresa el nombre del cliente.');
    if (unid <= 0) return alert('Ingresa unidades (> 0).');
    if (pu < 0.01) return alert('Ingresa precio por unidad (>= 0.01).');

    saveSaleBtn.disabled = true;
    saveSaleBtn.textContent = '⏳ Guardando…';

    const payload = {
      fecha: new Date(),
      cliente: cliente,
      unidades_vendidas: unid,
      precio_por_unidad: pu,
      total_venta: total,
      calidad: cal,
      forma_pago: fp,
      observaciones: obs
    };

    if (navigator.onLine){
      try{
        await db.collection('ventas_directas').add(payload);
        flashOK(saveSaleBtn, '✅ Guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodaySales()]);
      }catch(err){
        console.warn('saveSale online falló, encolando:', err);
        window.offline?.add('sales', payload);
        flashQueued(saveSaleBtn, '⏳ En cola');
        clearFormValues();
      }
    }else{
      window.offline?.add('sales', payload);
      flashQueued(saveSaleBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  async function syncQueuedSale(payload){
    await db.collection('ventas_directas').add(payload);
  }

  // ---- KPIs del día ----
  async function refreshKPIs(){
    const { start, end } = dayRange();
    let count=0, unitsSum=0, revenue=0, priceWeighted=0;

    try{
      const snap = await db.collection('ventas_directas')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc').get();

      snap.forEach(d=>{
        const x = d.data();
        count++;
        const u = Number(x.unidades_vendidas||0);
        const pu = Number(x.precio_por_unidad||0);
        const tot = Number(x.total_venta|| (u*pu));
        unitsSum += u;
        revenue  += tot;
        priceWeighted += u * pu;
      });
    }catch(e){}

    const avg = unitsSum ? (priceWeighted/unitsSum) : 0;

    kpiSalesCount.textContent = count;
    kpiUnitsSold.textContent  = unitsSum;
    kpiRevenue.textContent    = 'Q' + round2(revenue).toFixed(2);
    kpiAvgPrice.textContent   = 'Q' + round2(avg).toFixed(2);
  }

  // ---- Lista de ventas de hoy ----
  async function loadTodaySales(){
    salesList.innerHTML = '';
    const { start, end } = dayRange();
    try{
      const snap = await db.collection('ventas_directas')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc')
        .limit(100).get();

      snap.forEach(d=>{
        const x = d.data();
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
          <div class="list-cell">${fmtTime(x.fecha)}</div>
          <div class="list-cell">${escapeHTML(x.cliente||'—')}</div>
          <div class="list-cell">${(x.calidad||'—')}</div>
          <div class="list-cell">${Number(x.unidades_vendidas||0)}</div>
          <div class="list-cell">Q${Number(x.precio_por_unidad||0).toFixed(2)}</div>
          <div class="list-cell">Q${Number(x.total_venta||0).toFixed(2)}</div>
        `;
        salesList.appendChild(row);
      });
    }catch(e){}
  }

  // ---- Cálculo de total ----
  function recalcTotal(){
    const unid = clampMin(Number(units.value||0), 0);
    const pu   = clampMin(Number(unitPrice.value||0), 0);
    const total= round2(unid * pu);
    totalBox.textContent = 'Q' + total.toFixed(2);
  }

  // ---- Utilidades ----
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function round2(n){ return Math.round((isFinite(n)?n:0)*100)/100; }
  function clampMin(n,min){ n=Number.isFinite(n)?n:0; return n<min?min:n; }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function clearFormValues(){
    clientName.value=''; quality.value='primera'; units.value='100';
    unitPrice.value=MAGA_UNIT.toFixed(2); payment.value='efectivo'; notes.value='';
    recalcTotal();
  }
  function clearForm(){ clearFormValues(); }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar venta'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar venta'; btn.disabled=false; }, 900); }
})();
