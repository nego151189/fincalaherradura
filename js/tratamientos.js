/* /js/tratamientos.js — Tratamientos fitosanitarios
   - Sin imports ESM; firebase compat global (db, auth)
   - Colección: /tratamientos_fitosanitarios
     { fecha, problema, arboles_tratados: [ids], producto_utilizado, dosis,
       costo_tratamiento, efectividad, observaciones }
   - Cola offline: 'treatments'
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiTreatments   = $('kpiTreatments');
  const kpiTreesTreated = $('kpiTreesTreated');
  const kpiCostTotal    = $('kpiCostTotal');
  const kpiTopProblem   = $('kpiTopProblem');

  // Árboles
  const treeGrid     = $('treeGrid');
  const treeSearch   = $('treeSearch');
  const selectedCount= $('selectedCount');
  const quickSelect  = $('quickSelect');
  const applyQuickBtn= $('applyQuickBtn');
  const selectAllBtn = $('selectAllBtn');
  const clearSelBtn  = $('clearSelBtn');

  // Detalle
  const problem  = $('problem');
  const effect   = $('effect');
  const product  = $('product');
  const dose     = $('dose');
  const cost     = $('cost');
  const dateInput= $('dateInput');
  const timeInput= $('timeInput');
  const notes    = $('notes');

  const saveTreatmentBtn = $('saveTreatmentBtn');
  const syncBtn          = $('syncBtn');
  const clearFormBtn     = $('clearFormBtn');

  // Lista
  const treatList = $('treatList');

  const selected = new Set();

  document.addEventListener('DOMContentLoaded', async ()=>{
    window.offline?.register('treatments', syncQueuedTreatment);

    // defaults de fecha/hora
    const now = new Date();
    dateInput.value = now.toISOString().slice(0,10);
    timeInput.value = pad2(now.getHours()) + ':' + pad2(now.getMinutes());

    renderGrid();
    bindUI();

    await ensureAuth();

    await Promise.all([refreshKPIs(), loadTodayTreatments()]);
  });

  function bindUI(){
    treeGrid.addEventListener('click', onTreeClick);
    treeSearch.addEventListener('input', debounce(filterTreeGrid, 120));
    applyQuickBtn.addEventListener('click', applyQuickSelection);
    selectAllBtn.addEventListener('click', selectAllTrees);
    clearSelBtn.addEventListener('click', clearSelection);

    // Incrementos rápidos del costo
    document.querySelectorAll('.btn-bar .button.mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tgt = document.querySelector(btn.getAttribute('data-add'));
        const val = Number(btn.getAttribute('data-val'));
        if (!tgt) return;
        const next = Math.max(0, Number(tgt.value||0) + val);
        tgt.value = next.toFixed(2);
      });
    });

    saveTreatmentBtn.addEventListener('click', saveTreatment);
    clearFormBtn.addEventListener('click', clearForm);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadTodayTreatments()])).catch(()=>{}));
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ======= Árboles =======
  function renderGrid(){
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
    updateSelectedCount();
  }

  function onTreeClick(e){
    const btn = e.target.closest('button.tree-chip');
    if (!btn) return;
    const id = btn.dataset.id;
    if (selected.has(id)) { selected.delete(id); btn.classList.remove('selected'); }
    else { selected.add(id); btn.classList.add('selected'); }
    updateSelectedCount();
  }

  function updateSelectedCount(){
    selectedCount.textContent = selected.size;
  }

  function filterTreeGrid(){
    const q = (treeSearch.value||'').trim().toUpperCase();
    const chips = treeGrid.querySelectorAll('.tree-chip');
    if (!q) { chips.forEach(c=>c.classList.remove('hidden')); return; }
    chips.forEach(c => c.dataset.id.includes(q) || c.textContent.padStart(3,'0').includes(q.replace('ARB',''))
      ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }

  function selectAllTrees(){
    const chips = treeGrid.querySelectorAll('.tree-chip:not(.hidden)');
    chips.forEach(c=>{ selected.add(c.dataset.id); c.classList.add('selected'); });
    updateSelectedCount();
  }

  function clearSelection(){
    selected.clear();
    treeGrid.querySelectorAll('.tree-chip.selected').forEach(c=>c.classList.remove('selected'));
    updateSelectedCount();
  }

  function applyQuickSelection(){
    const txt = (quickSelect.value||'').trim();
    if (!txt) return;
    const parts = txt.split(',').map(s=>s.trim()).filter(Boolean);
    parts.forEach(seg=>{
      // Rango?
      if (seg.includes('-')){
        const [a,b] = seg.split('-').map(s=>s.trim());
        const start = parseTreeIdToNum(a);
        const end   = parseTreeIdToNum(b);
        if (start && end && end>=start){
          for (let n=start; n<=end; n++){
            const id = numToTreeId(n);
            selected.add(id);
          }
        }
      } else {
        const n = parseTreeIdToNum(seg);
        if (n){ selected.add(numToTreeId(n)); }
      }
    });
    // pintar
    treeGrid.querySelectorAll('.tree-chip').forEach(c=>{
      if (selected.has(c.dataset.id)) c.classList.add('selected'); else c.classList.remove('selected');
    });
    updateSelectedCount();
  }

  function parseTreeIdToNum(s){
    s = String(s||'').toUpperCase().replace(/\s+/g,'');
    if (s.startsWith('ARB')) s = s.slice(3);
    const n = Number(s.replace(/[^\d]/g,''));
    if (!Number.isFinite(n) || n<1 || n>800) return null;
    return n;
  }
  function numToTreeId(n){ return `ARB${String(n).padStart(3,'0')}`; }

  // ======= Guardar tratamiento =======
  async function saveTreatment(){
    if (selected.size === 0) return alert('Selecciona al menos un árbol.');
    const prob = problem.value || 'hlb';
    const eff  = effect.value || 'pendiente';
    const prod = (product.value||'').trim();
    const dos  = (dose.value||'').trim();
    const cst  = round2(Number(cost.value||0));
    const dt   = mergeLocalDateTime(dateInput.value, timeInput.value);
    const obs  = (notes.value||'').trim();

    if (!prod) return alert('Ingresa el producto utilizado.');
    if (!dos)  return alert('Ingresa la dosis.');
    if (!dt)   return alert('Selecciona fecha y hora.');

    saveTreatmentBtn.disabled = true;
    saveTreatmentBtn.textContent = '⏳ Guardando…';

    const payload = {
      fecha: dt,
      problema: prob,
      arboles_tratados: Array.from(selected),
      producto_utilizado: prod,
      dosis: dos,
      costo_tratamiento: cst,
      efectividad: eff,
      observaciones: obs
    };

    if (navigator.onLine){
      try{
        await db.collection('tratamientos_fitosanitarios').add(payload);
        flashOK(saveTreatmentBtn, '✅ Guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodayTreatments()]);
      }catch(err){
        console.warn('saveTreatment online falló, encolando:', err);
        window.offline?.add('treatments', payload);
        flashQueued(saveTreatmentBtn, '⏳ En cola');
        clearFormValues();
      }
    } else {
      window.offline?.add('treatments', payload);
      flashQueued(saveTreatmentBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  async function syncQueuedTreatment(payload){
    await db.collection('tratamientos_fitosanitarios').add(payload);
  }

  // ======= KPIs (día) =======
  async function refreshKPIs(){
    const { start, end } = dayRange();
    let count=0, costSum=0, problems=Object.create(null);
    const trees = new Set();

    try{
      const snap = await db.collection('tratamientos_fitosanitarios')
        .where('fecha','>=',start).where('fecha','<=',end)
        .orderBy('fecha','desc').get();

      snap.forEach(doc=>{
        const x = doc.data();
        count++;
        costSum += Number(x.costo_tratamiento||0);
        const arr = Array.isArray(x.arboles_tratados) ? x.arboles_tratados : [];
        arr.forEach(id=>trees.add(String(id)));
        const p = String(x.problema||'');
        problems[p] = (problems[p]||0)+1;
      });
    }catch(e){}

    kpiTreatments.textContent   = count;
    kpiTreesTreated.textContent = trees.size;
    kpiCostTotal.textContent    = 'Q' + round2(costSum).toFixed(2);
    kpiTopProblem.textContent   = topKey(problems) || '—';
  }

  // ======= Lista de hoy =======
  async function loadTodayTreatments(){
    treatList.innerHTML = '';
    const { start, end } = dayRange();
    try{
      const snap = await db.collection('tratamientos_fitosanitarios')
        .where('fecha','>=',start).where('fecha','<=',end)
        .orderBy('fecha','desc').limit(100).get();

      snap.forEach(doc=>{
        const x = doc.data();
        const row = document.createElement('div');
        row.className = 'list-row';
        const arr = Array.isArray(x.arboles_tratados) ? x.arboles_tratados : [];
        row.innerHTML = `
          <div class="list-cell">${fmtTime(x.fecha)}</div>
          <div class="list-cell">${labelProblem(x.problema)}</div>
          <div class="list-cell">${escapeHTML(x.producto_utilizado||'—')}</div>
          <div class="list-cell">${arr.length}</div>
          <div class="list-cell right">Q${Number(x.costo_tratamiento||0).toFixed(2)}</div>
          <div class="list-cell">${labelEffect(x.efectividad||'pendiente')}</div>
        `;
        treatList.appendChild(row);
      });
    }catch(e){}
  }

  // ======= Utils =======
  function round2(n){ return Math.round((isFinite(n)?n:0)*100)/100; }
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function debounce(fn, ms){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>fn.apply(this, arguments), ms); }; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function mergeLocalDateTime(yyyy_mm_dd, hhmm){
    if (!yyyy_mm_dd) return null;
    const [y,m,d] = yyyy_mm_dd.split('-').map(Number);
    const date = new Date(); date.setFullYear(y||1970, (m||1)-1, d||1);
    let h=0, mi=0;
    if (hhmm && hhmm.includes(':')) { const p=hhmm.split(':'); h=Number(p[0]||0); mi=Number(p[1]||0); }
    date.setHours(h, mi, 0, 0);
    return date;
  }
  function labelProblem(p){
    p = String(p||'').toLowerCase();
    if (p==='hlb') return 'HLB';
    if (p==='pulgon') return 'Pulgón';
    if (p==='fumagina') return 'Fumagina';
    return '—';
  }
  function labelEffect(e){
    e = String(e||'').toLowerCase();
    if (e==='pendiente') return 'Pend.';
    if (e==='baja') return 'Baja';
    if (e==='media') return 'Media';
    if (e==='alta') return 'Alta';
    return '—';
  }
  function topKey(map){
    let k=null, max=-1; for (var key in map){ if (map[key]>max){ max=map[key]; k=key; } }
    return labelProblem(k);
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function clearFormValues(){
    problem.value='hlb'; effect.value='pendiente'; product.value=''; dose.value=''; cost.value='0.00';
    const now = new Date(); dateInput.value = now.toISOString().slice(0,10); timeInput.value = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    notes.value='';
    clearSelection();
  }
  function clearForm(){ clearFormValues(); }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar tratamiento'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar tratamiento'; btn.disabled=false; }, 900); }
})();
