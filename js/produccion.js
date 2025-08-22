/* /js/produccion.js — Registro de producción diaria
   - Sin imports ESM; usa firebase compat global (db, auth)
   - Guarda en /cosechas_diarias con esquema del PRD
   - Cola offline: 'production'
   - KPIs del día + lista de cosechas
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiUnits  = $('kpiProdUnits');
  const kpiTrees  = $('kpiProdTrees');
  const kpiValue  = $('kpiProdValue');
  const kpiPrice  = $('kpiUnitPrice');

  // Árbol
  const treeGrid      = $('treeGrid');
  const treeSearch    = $('treeSearch');
  const selectedTree  = $('selectedTree');

  // Inputs
  const uPrimera     = $('uPrimera');
  const uSegunda     = $('uSegunda');
  const uDescarte    = $('uDescarte');
  const workerSelect = $('workerSelect');
  const harvestTime  = $('harvestTime');
  const notes        = $('notes');

  // Botones
  const saveBtn      = $('saveBtn');
  const syncBtn      = $('syncBtn');
  const clearBtn     = $('clearBtn');

  // Lista
  const todayList    = $('todayList');

  let PRICE_UNIT = 0.40; // fallback
  let currentTreeId = null;

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Colas
    window.offline?.register('production', syncQueuedProduction);

    // Render chips
    renderTreeGrid();
    bindUI();

    // Auth
    await ensureAuth();

    // Cargar precio y KPIs
    await Promise.all([loadPrice(), refreshKPIs(), loadTodayList()]);
  });

  function bindUI(){
    treeGrid.addEventListener('click', onTreeClick);
    treeSearch.addEventListener('input', debounce(filterTreeGrid, 120));

    // Incrementos rápidos
    document.querySelectorAll('.btn-bar .button.mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tgt = document.querySelector(btn.getAttribute('data-add'));
        const val = Number(btn.getAttribute('data-val'));
        if (!tgt) return;
        const cur = clamp0(Number(tgt.value||0) + val);
        tgt.value = String(cur);
      });
    });

    saveBtn.addEventListener('click', saveProduction);
    clearBtn.addEventListener('click', clearForm);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadTodayList()])).catch(()=>{}));
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ---- Árboles ----
  function renderTreeGrid(){
    const frag = document.createDocumentFragment();
    for (let i=1;i<=800;i++){
      const id = `ARB${String(i).padStart(3,'0')}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-chip';
      btn.dataset.id = id;
      btn.textContent = id.slice(3);
      frag.appendChild(btn);
    }
    treeGrid.innerHTML = '';
    treeGrid.appendChild(frag);
  }
  function onTreeClick(e){
    const btn = e.target.closest('button.tree-chip');
    if (!btn) return;
    currentTreeId = btn.dataset.id;
    selectedTree.textContent = currentTreeId;
    // resaltar selección
    treeGrid.querySelectorAll('.tree-chip.selected').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
  }
  function filterTreeGrid(){
    const q = (treeSearch.value||'').trim().toUpperCase();
    const chips = treeGrid.querySelectorAll('.tree-chip');
    if (!q) { chips.forEach(c=>c.classList.remove('hidden')); return; }
    chips.forEach(c => c.dataset.id.includes(q) ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }

  // ---- Precio MAGA (unidad) ----
  async function loadPrice(){
    try{
      const snap = await db.collection('precios_maga').orderBy('fecha','desc').limit(1).get();
      if (!snap.empty){
        const p = snap.docs[0].data();
        PRICE_UNIT = Number(p.precio_por_unidad ?? (p.precio_millar_limon_persa ? p.precio_millar_limon_persa/1000 : 0)) || 0.40;
      }
    }catch(e){}
    kpiPrice.textContent = `Q${PRICE_UNIT.toFixed(2)}`;
  }

  // ---- Guardar cosecha ----
  async function saveProduction(){
    if (!currentTreeId) return alert('Selecciona un árbol.');
    const a = clamp0(Number(uPrimera.value||0));
    const b = clamp0(Number(uSegunda.value||0));
    const c = clamp0(Number(uDescarte.value||0));
    if ((a+b+c) <= 0) return alert('Ingresa unidades (> 0).');

    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Guardando…';

    const payload = {
      fecha: new Date(),
      arbol_id: currentTreeId,
      unidades_primera: a,
      unidades_segunda: b,
      unidades_descarte: c,
      trabajador_cosechador: workerSelect.value,
      hora_cosecha: toTodayTime(harvestTime.value),
      observaciones: (notes.value||'').trim()
    };

    if (navigator.onLine){
      try{
        await db.collection('cosechas_diarias').add(payload);
        flashOK(saveBtn, '✅ Guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodayList()]);
      }catch(err){
        console.warn('Fallo online, encolando producción:', err);
        window.offline?.add('production', payload);
        flashQueued(saveBtn, '⏳ En cola');
        clearFormValues();
      }
    } else {
      window.offline?.add('production', payload);
      flashQueued(saveBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  async function syncQueuedProduction(payload){
    await db.collection('cosechas_diarias').add(payload);
  }

  // ---- KPIs del día ----
  async function refreshKPIs(){
    const { start, end } = dayRange();
    let u1=0, u2=0, trees=new Set();

    try{
      const snap = await db.collection('cosechas_diarias')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc').get();

      snap.forEach(d=>{
        const x = d.data();
        u1 += Number(x.unidades_primera||0);
        u2 += Number(x.unidades_segunda||0);
        if (x.arbol_id) trees.add(String(x.arbol_id));
      });
    }catch(e){}

    const total = u1 + u2;
    kpiUnits.textContent = total;
    kpiTrees.textContent = trees.size;
    const value = u1*PRICE_UNIT + u2*(PRICE_UNIT*0.8);
    kpiValue.textContent = `Q${(Math.round(value*100)/100).toFixed(2)}`;
  }

  // ---- Lista de hoy ----
  async function loadTodayList(){
    todayList.innerHTML = '';
    const { start, end } = dayRange();
    try{
      const snap = await db.collection('cosechas_diarias')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc')
        .limit(50).get();

      snap.forEach(d=>{
        const x = d.data();
        const row = document.createElement('div');
        row.className = 'list-row';
        const tot = Number(x.unidades_primera||0) + Number(x.unidades_segunda||0) + Number(x.unidades_descarte||0);
        row.innerHTML = `
          <div class="list-cell">${fmtTime(x.fecha)}</div>
          <div class="list-cell">${x.arbol_id||'—'}</div>
          <div class="list-cell">${Number(x.unidades_primera||0)}/${Number(x.unidades_segunda||0)}/${Number(x.unidades_descarte||0)}</div>
          <div class="list-cell">${tot}</div>
        `;
        todayList.appendChild(row);
      });
    }catch(e){}
  }

  // ---- Utils ----
  function clamp0(n){ n = Math.round(isFinite(n)?n:0); return Math.max(0, n); }
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function debounce(fn, ms){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>fn.apply(this, arguments), ms); }; }
  function toTodayTime(hhmm){ if(!hhmm) return null; const d=new Date(); const [h,m]=(hhmm||'').split(':').map(Number); d.setHours(h||0,m||0,0,0); return d; }
  function clearFormValues(){ uPrimera.value='0'; uSegunda.value='0'; uDescarte.value='0'; harvestTime.value=''; notes.value=''; }
  function clearForm(){ clearFormValues(); currentTreeId=null; selectedTree.textContent='—'; treeGrid.querySelectorAll('.tree-chip.selected').forEach(b=>b.classList.remove('selected')); }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar cosecha'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar cosecha'; btn.disabled=false; }, 900); }
})();
