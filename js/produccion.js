/* /js/produccion.js — Registro de producción diaria
   - Soporte para registro individual por árbol Y por bloques de 100
   - Sin imports ESM; usa firebase compat global (db, auth)
   - Guarda en /cosechas_diarias y /cosechas_bloques
   - Cola offline: 'production' y 'production_blocks'
   - KPIs del día + listas separadas por tipo
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiUnits  = $('kpiProdUnits');
  const kpiTrees  = $('kpiProdTrees');
  const kpiBlocks = $('kpiProdBlocks');
  const kpiValue  = $('kpiProdValue');
  const kpiPrice  = $('kpiUnitPrice');

  // Modo de registro
  const modeTree  = $('modeTree');
  const modeBlock = $('modeBlock');
  const treeRegistration = $('treeRegistration');
  const blockRegistration = $('blockRegistration');

  // Árbol individual
  const treeGrid      = $('treeGrid');
  const treeSearch    = $('treeSearch');
  const selectedTree  = $('selectedTree');

  // Bloque
  const blockSelect   = $('blockSelect');
  const blockRange    = $('blockRange');
  const blockStats    = $('blockStats');
  const lastHarvest   = $('lastHarvest');
  const avgProduction = $('avgProduction');

  // Inputs compartidos
  const uPrimera     = $('uPrimera');
  const uSegunda     = $('uSegunda');
  const uDescarte    = $('uDescarte');
  const workerSelect = $('workerSelect');
  const harvestTime  = $('harvestTime');
  const notes        = $('notes');
  const notesCounter = $('notesCounter');

  // Totales del bloque
  const blockTotals   = $('blockTotals');
  const totalPrimera  = $('totalPrimera');
  const totalSegunda  = $('totalSegunda');
  const totalDescarte = $('totalDescarte');
  const grandTotal    = $('grandTotal');
  const avgPerTree    = $('avgPerTree');

  // Botones
  const saveBtn      = $('saveBtn');
  const saveBtnText  = $('saveBtnText');
  const syncBtn      = $('syncBtn');
  const clearBtn     = $('clearBtn');
  const setNowBtn    = $('setNowBtn');

  // Títulos dinámicos
  const unitsTitle   = $('unitsTitle');

  // Listas
  const viewTrees     = $('viewTrees');
  const viewBlocks    = $('viewBlocks');
  const treeView      = $('treeView');
  const blockView     = $('blockView');
  const todayTreeList = $('todayTreeList');
  const todayBlockList= $('todayBlockList');

  let PRICE_UNIT = 0.40; // fallback
  let currentTreeId = null;
  let currentBlockId = null;
  let currentMode = 'tree';

  // Mapeo de bloques
  const blockRanges = {
    'B1': { start: 1, end: 100, label: 'ARB001-ARB100' },
    'B2': { start: 101, end: 200, label: 'ARB101-ARB200' },
    'B3': { start: 201, end: 300, label: 'ARB201-ARB300' },
    'B4': { start: 301, end: 400, label: 'ARB301-ARB400' },
    'B5': { start: 401, end: 500, label: 'ARB401-ARB500' },
    'B6': { start: 501, end: 600, label: 'ARB501-ARB600' },
    'B7': { start: 601, end: 700, label: 'ARB601-ARB700' },
    'B8': { start: 701, end: 800, label: 'ARB701-ARB800' }
  };

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Colas offline
    window.offline?.register('production', syncQueuedProduction);
    window.offline?.register('production_blocks', syncQueuedBlockProduction);

    // Render chips y bind UI
    renderTreeGrid();
    bindUI();

    // Configurar hora actual
    setCurrentTime();

    // Auth
    await ensureAuth();

    // Cargar datos
    await Promise.all([loadPrice(), refreshKPIs(), loadTodayLists()]);
  });

  function bindUI(){
    // Modo de registro
    modeTree.addEventListener('change', () => { if (modeTree.checked) switchMode('tree'); });
    modeBlock.addEventListener('change', () => { if (modeBlock.checked) switchMode('block'); });

    // Árboles
    treeGrid.addEventListener('click', onTreeClick);
    treeSearch.addEventListener('input', debounce(filterTreeGrid, 120));

    // Bloques
    blockSelect.addEventListener('change', onBlockSelect);

    // Inputs numéricos
    [uPrimera, uSegunda, uDescarte].forEach(input => {
      input.addEventListener('input', updateBlockTotals);
    });

    // Contador de caracteres
    notes.addEventListener('input', updateNotesCounter);

    // Incrementos rápidos
    document.querySelectorAll('.btn-quick').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tgt = document.querySelector(btn.getAttribute('data-add'));
        const val = Number(btn.getAttribute('data-val'));
        if (!tgt) return;
        const cur = clamp0(Number(tgt.value||0) + val);
        tgt.value = String(cur);
        updateBlockTotals();
      });
    });

    // Steppers
    document.querySelectorAll('.btn-stepper').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const target = btn.getAttribute('data-target');
        const action = btn.getAttribute('data-action');
        const input = $(target);
        if (!input) return;
        
        const current = Number(input.value || 0);
        const newValue = action === 'increment' ? current + 1 : Math.max(0, current - 1);
        input.value = String(newValue);
        updateBlockTotals();
      });
    });

    // Botones de acción
    saveBtn.addEventListener('click', saveProduction);
    clearBtn.addEventListener('click', clearForm);
    setNowBtn.addEventListener('click', setCurrentTime);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadTodayLists()])).catch(()=>{}));

    // Vista de listas
    viewTrees.addEventListener('click', () => switchListView('trees'));
    viewBlocks.addEventListener('click', () => switchListView('blocks'));
  }

  function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'tree') {
      treeRegistration.classList.remove('hidden');
      blockRegistration.classList.add('hidden');
      blockTotals.classList.add('hidden');
      unitsTitle.textContent = '🧮 Unidades por árbol';
      saveBtnText.textContent = 'Guardar cosecha de árbol';
    } else {
      treeRegistration.classList.add('hidden');
      blockRegistration.classList.remove('hidden');
      blockTotals.classList.remove('hidden');
      unitsTitle.textContent = '🧮 Unidades promedio por árbol';
      saveBtnText.textContent = 'Guardar cosecha de bloque';
    }
    
    updateBlockTotals();
  }

  function switchListView(view) {
    if (view === 'trees') {
      viewTrees.classList.add('active');
      viewBlocks.classList.remove('active');
      treeView.classList.remove('hidden');
      blockView.classList.add('hidden');
    } else {
      viewTrees.classList.remove('active');
      viewBlocks.classList.add('active');
      treeView.classList.add('hidden');
      blockView.classList.remove('hidden');
    }
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
      btn.setAttribute('aria-label', `Seleccionar ${id}`);
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
    if (!q) { 
      chips.forEach(c=>c.classList.remove('hidden')); 
      return; 
    }
    chips.forEach(c => c.dataset.id.includes(q) ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }

  // ---- Bloques ----
  function onBlockSelect() {
    const blockId = blockSelect.value;
    currentBlockId = blockId;
    
    if (!blockId) {
      blockRange.textContent = 'Selecciona un bloque para ver el rango de árboles';
      blockStats.classList.add('hidden');
      return;
    }
    
    const range = blockRanges[blockId];
    if (range) {
      blockRange.textContent = `Árboles ${range.label} (100 árboles)`;
      blockStats.classList.remove('hidden');
      loadBlockStats(blockId);
    }
    
    updateBlockTotals();
  }

  async function loadBlockStats(blockId) {
    try {
      const range = blockRanges[blockId];
      if (!range) return;
      
      // Buscar última cosecha del bloque
      const snap = await db.collection('cosechas_bloques')
        .where('bloque_id', '==', blockId)
        .orderBy('fecha', 'desc')
        .limit(1)
        .get();
      
      if (!snap.empty) {
        const last = snap.docs[0].data();
        const fecha = last.fecha.toDate();
        lastHarvest.textContent = fecha.toLocaleDateString('es-GT');
        
        const total = (last.total_primera || 0) + (last.total_segunda || 0);
        avgProduction.textContent = `${(total / 100).toFixed(1)} u/árbol`;
      } else {
        lastHarvest.textContent = 'Primera vez';
        avgProduction.textContent = '—';
      }
    } catch(e) {
      console.error('Error cargando estadísticas del bloque:', e);
      lastHarvest.textContent = '—';
      avgProduction.textContent = '—';
    }
  }

  function updateBlockTotals() {
    if (currentMode !== 'block') return;
    
    const primera = clamp0(Number(uPrimera.value || 0));
    const segunda = clamp0(Number(uSegunda.value || 0));
    const descarte = clamp0(Number(uDescarte.value || 0));
    
    // Calcular totales para 100 árboles
    const totalP = primera * 100;
    const totalS = segunda * 100;
    const totalD = descarte * 100;
    const total = totalP + totalS + totalD;
    
    if (totalPrimera) totalPrimera.textContent = `${totalP} unidades`;
    if (totalSegunda) totalSegunda.textContent = `${totalS} unidades`;
    if (totalDescarte) totalDescarte.textContent = `${totalD} unidades`;
    if (grandTotal) grandTotal.textContent = `${total} unidades`;
    if (avgPerTree) avgPerTree.textContent = `${(total / 100).toFixed(1)} unidades`;
  }

  function updateNotesCounter() {
    if (!notesCounter) return;
    const count = (notes.value || '').length;
    notesCounter.textContent = count;
    notesCounter.parentElement.style.color = count > 180 ? '#f44336' : '#666';
  }

  function setCurrentTime() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    harvestTime.value = timeStr;
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
    const primera = clamp0(Number(uPrimera.value||0));
    const segunda = clamp0(Number(uSegunda.value||0));
    const descarte = clamp0(Number(uDescarte.value||0));
    
    if ((primera + segunda + descarte) <= 0) {
      return alert('Ingresa unidades (> 0).');
    }
    
    if (currentMode === 'tree' && !currentTreeId) {
      return alert('Selecciona un árbol.');
    }
    
    if (currentMode === 'block' && !currentBlockId) {
      return alert('Selecciona un bloque.');
    }

    saveBtn.disabled = true;
    saveBtnText.textContent = '⏳ Guardando…';

    if (currentMode === 'tree') {
      await saveTreeProduction(primera, segunda, descarte);
    } else {
      await saveBlockProduction(primera, segunda, descarte);
    }
  }

  async function saveTreeProduction(primera, segunda, descarte) {
    const payload = {
      fecha: new Date(),
      arbol_id: currentTreeId,
      unidades_primera: primera,
      unidades_segunda: segunda,
      unidades_descarte: descarte,
      trabajador_cosechador: workerSelect.value,
      hora_cosecha: toTodayTime(harvestTime.value),
      observaciones: (notes.value||'').trim(),
      tipo_registro: 'individual'
    };

    if (navigator.onLine){
      try{
        await db.collection('cosechas_diarias').add(payload);
        flashOK(saveBtn, '✅ Guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodayLists()]);
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

  async function saveBlockProduction(primera, segunda, descarte) {
    const range = blockRanges[currentBlockId];
    const payload = {
      fecha: new Date(),
      bloque_id: currentBlockId,
      arboles_inicio: range.start,
      arboles_fin: range.end,
      promedio_primera: primera,
      promedio_segunda: segunda,
      promedio_descarte: descarte,
      total_primera: primera * 100,
      total_segunda: segunda * 100,
      total_descarte: descarte * 100,
      trabajador_cosechador: workerSelect.value,
      hora_cosecha: toTodayTime(harvestTime.value),
      observaciones: (notes.value||'').trim(),
      tipo_registro: 'bloque'
    };

    if (navigator.onLine){
      try{
        await db.collection('cosechas_bloques').add(payload);
        flashOK(saveBtn, '✅ Bloque guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodayLists()]);
      }catch(err){
        console.warn('Fallo online, encolando bloque:', err);
        window.offline?.add('production_blocks', payload);
        flashQueued(saveBtn, '⏳ En cola');
        clearFormValues();
      }
    } else {
      window.offline?.add('production_blocks', payload);
      flashQueued(saveBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  async function syncQueuedProduction(payload){
    await db.collection('cosechas_diarias').add(payload);
  }

  async function syncQueuedBlockProduction(payload){
    await db.collection('cosechas_bloques').add(payload);
  }

  // ---- KPIs del día ----
  async function refreshKPIs(){
    const { start, end } = dayRange();
    let unitsFromTrees = 0, unitsFromBlocks = 0;
    let treesSet = new Set();
    let blocksSet = new Set();

    try{
      // Cosechas individuales
      const treeSnap = await db.collection('cosechas_diarias')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .get();

      treeSnap.forEach(d=>{
        const x = d.data();
        unitsFromTrees += Number(x.unidades_primera||0) + Number(x.unidades_segunda||0);
        if (x.arbol_id) treesSet.add(String(x.arbol_id));
      });

      // Cosechas por bloques
      const blockSnap = await db.collection('cosechas_bloques')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .get();

      blockSnap.forEach(d=>{
        const x = d.data();
        unitsFromBlocks += Number(x.total_primera||0) + Number(x.total_segunda||0);
        if (x.bloque_id) blocksSet.add(String(x.bloque_id));
      });

    }catch(e){
      console.error('Error refreshing KPIs:', e);
    }

    const totalUnits = unitsFromTrees + unitsFromBlocks;
    kpiUnits.textContent = totalUnits;
    kpiTrees.textContent = treesSet.size;
    kpiBlocks.textContent = blocksSet.size;
    
    const value = totalUnits * PRICE_UNIT * 0.9; // Asumiendo 90% primera calidad
    kpiValue.textContent = `Q${value.toFixed(2)}`;
  }

  // ---- Listas de hoy ----
  async function loadTodayLists(){
    await Promise.all([loadTodayTreeList(), loadTodayBlockList()]);
  }

  async function loadTodayTreeList(){
    if (!todayTreeList) return;
    todayTreeList.innerHTML = '';
    const { start, end } = dayRange();
    
    try{
      const snap = await db.collection('cosechas_diarias')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc')
        .limit(50).get();

      if (snap.empty) {
        todayTreeList.innerHTML = '<div class="empty-state"><div class="empty-icon">🌳</div><p class="empty-message">No hay cosechas individuales registradas hoy</p></div>';
        return;
      }

      snap.forEach(d=>{
        const x = d.data();
        const row = document.createElement('div');
        row.className = 'table-row';
        const total = Number(x.unidades_primera||0) + Number(x.unidades_segunda||0) + Number(x.unidades_descarte||0);
        row.innerHTML = `
          <div class="table-cell">${fmtTime(x.fecha)}</div>
          <div class="table-cell"><strong>${x.arbol_id||'—'}</strong></div>
          <div class="table-cell">${Number(x.unidades_primera||0)}/${Number(x.unidades_segunda||0)}/${Number(x.unidades_descarte||0)}</div>
          <div class="table-cell"><strong>${total}</strong></div>
          <div class="table-cell">${x.trabajador_cosechador||'—'}</div>
        `;
        todayTreeList.appendChild(row);
      });
    }catch(e){
      console.error('Error loading tree list:', e);
      todayTreeList.innerHTML = '<div class="error-state"><div class="error-icon">⚠️</div><p class="error-message">Error cargando datos</p></div>';
    }
  }

  async function loadTodayBlockList(){
    if (!todayBlockList) return;
    todayBlockList.innerHTML = '';
    const { start, end } = dayRange();
    
    try{
      const snap = await db.collection('cosechas_bloques')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc')
        .limit(20).get();

      if (snap.empty) {
        todayBlockList.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p class="empty-message">No hay cosechas por bloques registradas hoy</p></div>';
        return;
      }

      snap.forEach(d=>{
        const x = d.data();
        const row = document.createElement('div');
        row.className = 'table-row';
        const total = Number(x.total_primera||0) + Number(x.total_segunda||0) + Number(x.total_descarte||0);
        const avg = (total / 100).toFixed(1);
        const range = blockRanges[x.bloque_id];
        
        row.innerHTML = `
          <div class="table-cell">${fmtTime(x.fecha)}</div>
          <div class="table-cell"><strong>${x.bloque_id}</strong></div>
          <div class="table-cell">${range ? range.label : '100 árboles'}</div>
          <div class="table-cell">${Number(x.total_primera||0)}/${Number(x.total_segunda||0)}/${Number(x.total_descarte||0)}</div>
          <div class="table-cell"><strong>${total}</strong></div>
          <div class="table-cell">${avg} u/árbol</div>
        `;
        todayBlockList.appendChild(row);
      });
    }catch(e){
      console.error('Error loading block list:', e);
      todayBlockList.innerHTML = '<div class="error-state"><div class="error-icon">⚠️</div><p class="error-message">Error cargando datos</p></div>';
    }
  }

  // ---- Utils ----
  function clamp0(n){ 
    n = Math.round(isFinite(n) ? n : 0); 
    return Math.max(0, n); 
  }
  
  function dayRange(){ 
    const s = new Date(); s.setHours(0,0,0,0); 
    const e = new Date(); e.setHours(23,59,59,999); 
    return {start: s, end: e}; 
  }
  
  function fmtTime(ts){ 
    try{ 
      const d = ts?.toDate ? ts.toDate() : new Date(ts); 
      return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});
    } catch {
      return '—';
    } 
  }
  
  function debounce(fn, ms){ 
    let t; 
    return function(){ 
      clearTimeout(t); 
      t = setTimeout(() => fn.apply(this, arguments), ms); 
    }; 
  }
  
  function toTodayTime(hhmm){ 
    if(!hhmm) return null; 
    const d = new Date(); 
    const [h,m] = (hhmm||'').split(':').map(Number); 
    d.setHours(h||0, m||0, 0, 0); 
    return d; 
  }
  
  function clearFormValues(){ 
    uPrimera.value = '0'; 
    uSegunda.value = '0'; 
    uDescarte.value = '0'; 
    harvestTime.value = ''; 
    notes.value = ''; 
    if (notesCounter) notesCounter.textContent = '0';
    updateBlockTotals();
  }
  
  function clearForm(){ 
    clearFormValues(); 
    currentTreeId = null; 
    currentBlockId = null;
    selectedTree.textContent = '—'; 
    blockSelect.value = '';
    if (blockRange) blockRange.textContent = 'Selecciona un bloque para ver el rango de árboles';
    if (blockStats) blockStats.classList.add('hidden');
    treeGrid.querySelectorAll('.tree-chip.selected').forEach(b => b.classList.remove('selected')); 
  }
  
  function flashOK(btn, txt){ 
    btn.textContent = txt; 
    setTimeout(() => { 
      if (saveBtnText) saveBtnText.textContent = currentMode === 'tree' ? 'Guardar cosecha de árbol' : 'Guardar cosecha de bloque'; 
      btn.disabled = false; 
    }, 900); 
  }
  
  function flashQueued(btn, txt){ 
    btn.textContent = txt; 
    setTimeout(() => { 
      if (saveBtnText) saveBtnText.textContent = currentMode === 'tree' ? 'Guardar cosecha de árbol' : 'Guardar cosecha de bloque'; 
      btn.disabled = false; 
    }, 900); 
  }
})();

