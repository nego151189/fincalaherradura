/* /js/riegos.js — Riego (tanque + registro + programación)
   - Guarda riegos en /riegos con { arboles_regados[], litros_utilizados, trabajador, tanque_nivel_antes, tanque_nivel_despues }.
   - Evento de llenado "refill": mismo /riegos con type:'refill' y tanque_nivel_despues = X%.
   - Programa recordatorio en /recordatorios_asistente (tipo 'riego').
   - Offline-first: colas 'irrigation' y 'refill'.
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const tankLevelEl       = $('tankLevel');
  const irrigationsToday  = $('irrigationsToday');
  const litersToday       = $('litersToday');
  const lastRefill        = $('lastRefill');

  // Registro
  const treeGrid          = $('treeGrid');
  const treeSearch        = $('treeSearch');
  const selectedCount     = $('selectedCount');
  const litersInput       = $('litersInput');
  const startTime         = $('startTime');
  const endTime           = $('endTime');
  const workerSelect      = $('workerSelect');
  const notes             = $('notes');
  const saveIrrigationBtn = $('saveIrrigationBtn');
  const syncBtn           = $('syncBtn');

  // Refill
  const refillPercent     = $('refillPercent');
  const saveRefillBtn     = $('saveRefillBtn');

  // Schedule
  const scheduleDate      = $('scheduleDate');
  const scheduleTime      = $('scheduleTime');
  const scheduleNote      = $('scheduleNote');
  const saveScheduleBtn   = $('saveScheduleBtn');

  const CAPACITY_L = 25000;
  const selected = new Set();

  document.addEventListener('DOMContentLoaded', async ()=>{
    // grid árboles
    renderTreeGrid();
    bindUI();

    // colas
    window.offline?.register('irrigation', syncQueuedIrrigation);
    window.offline?.register('refill', syncQueuedRefill);

    await ensureAuth();

    // defaults
    const today = new Date().toISOString().slice(0,10);
    scheduleDate.value = today;

    await refreshKPIs();
    await loadToday();
  });

  function bindUI(){
    treeGrid.addEventListener('click', onTreeClick);
    treeSearch.addEventListener('input', debounce(filterTreeGrid, 120));

    saveIrrigationBtn.addEventListener('click', saveIrrigation);
    saveRefillBtn.addEventListener('click', saveRefill);
    saveScheduleBtn.addEventListener('click', saveSchedule);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadToday()])));
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
      btn.textContent = id;
      frag.appendChild(btn);
    }
    treeGrid.innerHTML = '';
    treeGrid.appendChild(frag);
    updateSelectedUI();
  }
  function onTreeClick(e){
    const btn = e.target.closest('button.tree-chip');
    if (!btn) return;
    const id = btn.dataset.id;
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    btn.classList.toggle('selected');
    updateSelectedUI();
  }
  function filterTreeGrid(){
    const q = (treeSearch.value||'').trim().toUpperCase();
    const chips = treeGrid.querySelectorAll('.tree-chip');
    if (!q) { chips.forEach(c=>c.classList.remove('hidden')); return; }
    chips.forEach(c => c.dataset.id.includes(q) ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }
  function updateSelectedUI(){ selectedCount.textContent = String(selected.size); }

  // ---- KPIs ----
  async function refreshKPIs(){
    // nivel tanque = último registro (riego o refill)
    tankLevelEl.textContent = `${await getLastTankPercent()}%`;
    const { start, end } = dayRange();

    let count=0, liters=0, lastRef='—';
    try{
      const snap = await db.collection('riegos')
        .where('fecha','>=', start)
        .where('fecha','<=', end)
        .orderBy('fecha','desc')
        .get();

      snap.forEach(d=>{
        const x = d.data();
        if (x.type === 'refill'){
          const ts = x.fecha?.toDate ? x.fecha.toDate() : new Date(x.fecha);
          if (!isNaN(ts)) lastRef = ts.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});
        } else {
          count++;
          liters += Number(x.litros_utilizados || 0);
        }
      });
    }catch(e){}

    irrigationsToday.textContent = count;
    litersToday.textContent = `${Math.round(liters)} L`;
    lastRefill.textContent = lastRef;
  }

  async function getLastTankPercent(){
    try{
      const snap = await db.collection('riegos').orderBy('fecha','desc').limit(1).get();
      if (!snap.empty){
        const x = snap.docs[0].data();
        const pct = Number(x.tanque_nivel_despues ?? 100);
        return clampPct(pct);
      }
    }catch(e){}
    return 100;
  }

  // ---- Guardar riego ----
  async function saveIrrigation(){
    const liters = clampLiters(Number(litersInput.value || 0));
    if (!(liters > 0)) return alert('Ingresa litros (> 0).');
    if (!selected.size) return alert('Selecciona al menos un árbol.');

    saveIrrigationBtn.disabled = true;
    saveIrrigationBtn.textContent = '⏳ Guardando…';

    // calcular % antes/después
    const beforePct = await getLastTankPercent();
    const usedPct = Math.min(100, (liters / CAPACITY_L) * 100);
    const afterPct = clampPct(Math.max(0, beforePct - usedPct));

    const payload = {
      fecha: new Date(),
      arboles_regados: Array.from(selected),
      litros_utilizados: Math.round(liters),
      trabajador: workerSelect.value,
      tiempo_inicio: toTodayTime(startTime.value),
      tiempo_fin: toTodayTime(endTime.value),
      observaciones: (notes.value||'').trim(),
      tanque_nivel_antes: beforePct,
      tanque_nivel_despues: afterPct
    };

    if (navigator.onLine){
      try{
        await writeIrrigation(payload);
        flashOK(saveIrrigationBtn, '✅ Guardado');
        clearIrrigationForm();
        await Promise.all([refreshKPIs(), loadToday()]);
      }catch(err){
        console.warn('Fallo online, encolando:', err);
        window.offline?.add('irrigation', payload);
        flashQueued(saveIrrigationBtn, '⏳ En cola');
        clearIrrigationForm();
      }
    } else {
      window.offline?.add('irrigation', payload);
      flashQueued(saveIrrigationBtn, '⏳ En cola');
      clearIrrigationForm();
    }
  }

  async function writeIrrigation(payload){
    // 1) crear doc de riego
    await db.collection('riegos').add(payload);
    // 2) actualizar último riego de cada árbol
    const ids = payload.arboles_regados || [];
    const chunk = 400;
    for (let i=0;i<ids.length;i+=chunk){
      const part = ids.slice(i, i+chunk);
      const batch = db.batch();
      part.forEach(id=>{
        const ref = db.collection('arboles').doc(id);
        batch.update(ref, { ultimo_riego: new Date() });
      });
      await batch.commit();
    }
  }

  async function syncQueuedIrrigation(payload){
    await writeIrrigation(payload);
  }

  // ---- Llenado ----
  async function saveRefill(){
    const pct = clampPct(Number(refillPercent.value || 100));
    saveRefillBtn.disabled = true;
    saveRefillBtn.textContent = '⏳ Guardando…';

    const payload = {
      fecha: new Date(),
      type: 'refill',
      tanque_nivel_despues: pct
    };

    if (navigator.onLine){
      try{
        await db.collection('riegos').add(payload);
        flashOK(saveRefillBtn, '✅ Guardado');
        await refreshKPIs();
      }catch(err){
        console.warn('refill encolado:', err);
        window.offline?.add('refill', payload);
        flashQueued(saveRefillBtn, '⏳ En cola');
      }
    } else {
      window.offline?.add('refill', payload);
      flashQueued(saveRefillBtn, '⏳ En cola');
    }
  }

  async function syncQueuedRefill(payload){
    await db.collection('riegos').add(payload);
  }

  // ---- Programación (recordatorio) ----
  async function saveSchedule(){
    const d = scheduleDate.value;
    const t = scheduleTime.value || '06:00';
    const note = (scheduleNote.value || '').trim();
    if (!d) return alert('Selecciona fecha.');
    const when = new Date(`${d}T${t}:00`);

    const payload = {
      tipo: 'riego',
      fecha_programada: when,
      arboles_objetivo: [], // simple por ahora
      mensaje: note || 'Riego programado',
      completado: false
    };

    try{
      await db.collection('recordatorios_asistente').add(payload);
      alert('✅ Recordatorio de riego guardado.');
    }catch(err){
      console.warn('schedule error:', err);
      alert('⚠️ No se pudo guardar el recordatorio.');
    }
  }

  // ---- Listado de hoy ----
  async function loadToday(){
    const { start, end } = dayRange();
    const list = $('irrigationsList');
    list.innerHTML = '';
    try{
      const snap = await db.collection('riegos')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc')
        .get();

      snap.forEach(d=>{
        const x = d.data();
        if (x.type === 'refill'){
          const row = document.createElement('div');
          row.className = 'list-row';
          row.innerHTML = `
            <div class="list-cell">${fmtTime(x.fecha)}</div>
            <div class="list-cell" colspan="1">—</div>
            <div class="list-cell">⛽ Llenado</div>
            <div class="list-cell">${Number(x.tanque_nivel_despues||100)}%</div>
          `;
          list.appendChild(row);
          return;
        }
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
          <div class="list-cell">${fmtTime(x.fecha)}</div>
          <div class="list-cell">${(x.arboles_regados||[]).length} árboles</div>
          <div class="list-cell">${Number(x.litros_utilizados||0)} L</div>
          <div class="list-cell">${Number(x.tanque_nivel_despues||0)}%</div>
        `;
        list.appendChild(row);
      });
    }catch(err){
      console.warn('loadToday riegos:', err);
    }
  }

  // ---- Utils ----
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function clampPct(n){ n = Math.round(isFinite(n)?n:0); return Math.max(0, Math.min(100, n)); }
  function clampLiters(n){ n = Math.round(isFinite(n)?n:0); return Math.max(0, n); }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), ms); }; }
  function toTodayTime(hhmm){
    if (!hhmm) return null;
    const d = new Date();
    const [h,m] = hhmm.split(':').map(Number);
    d.setHours(h||0, m||0, 0, 0);
    return d;
  }
  function clearIrrigationForm(){
    selected.clear();
    treeGrid.querySelectorAll('.tree-chip.selected').forEach(b=>b.classList.remove('selected'));
    updateSelectedUI();
    litersInput.value = '';
    startTime.value = '';
    endTime.value = '';
    notes.value = '';
    saveIrrigationBtn.disabled = false;
  }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar riego'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar riego'; btn.disabled=false; }, 900); }
})();
