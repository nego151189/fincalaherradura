/* /js/arboles.js — Gestión de árboles
   Reglas:
   - Sin imports ESM; firebase compat via globals (db, auth, storage).
   - Carga perezosa: render 800 chips; al tocar un árbol, consulta/crea doc ARB###
   - Estados: sano | hlb | pulgon | fumagina
   - Guardado offline: cambios de estado y notas se encolan si no hay internet (cola 'tree')
   - Foto: requiere conexión (sube a /tree_photos/{id}/{ts}.jpg y guarda URL en doc)
*/
(function () {
  const $ = (id)=>document.getElementById(id);

  const treeGrid      = $('treeGrid');
  const treeSearch    = $('treeSearch');
  const stateFilter   = $('stateFilter');

  // Resumen
  const countAll      = $('countAll');
  const countSano     = $('countSano');
  const countHLB      = $('countHLB');
  const countPulgon   = $('countPulgon');
  const countFumagina = $('countFumagina');
  const lastInspection= $('lastInspection');

  // Panel
  const panelId       = $('panelId');
  const panelState    = $('panelState');
  const panelProd     = $('panelProd');
  const panelInspect  = $('panelInspect');
  const treeNote      = $('treeNote');
  const saveTreeBtn   = $('saveTreeBtn');
  const uploadPhotoBtn= $('uploadPhotoBtn');
  const treePhoto     = $('treePhoto');
  const lastPhoto     = $('lastPhoto');

  const STATUS = ['sano','hlb','pulgon','fumagina'];
  const statusOf = Object.create(null);   // id -> estado
  const lastInspectOf = Object.create(null); // id -> fecha
  let currentId = null;
  let currentDoc = null;

  document.addEventListener('DOMContentLoaded', async ()=>{
    window.offline?.register('tree', syncQueuedTree);

    renderGrid();               // chips ARB001..ARB800
    bindUI();

    await ensureAuth();
    await preloadSomeStatuses(); // lectura única (si hay)
    summarize();
  });

  function bindUI(){
    treeGrid.addEventListener('click', onTreeClick);
    treeSearch.addEventListener('input', debounce(applyFilters, 120));
    stateFilter.addEventListener('change', applyFilters);

    document.querySelectorAll('.state-btn').forEach(b=>{
      b.addEventListener('click', ()=> changePanelState(b.dataset.state));
    });

    saveTreeBtn.addEventListener('click', saveTreeData);
    uploadPhotoBtn.addEventListener('click', uploadPhotoNow);
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ------ Grid ------
  function renderGrid(){
    const frag = document.createDocumentFragment();
    for (let i=1;i<=800;i++){
      const id = `ARB${String(i).padStart(3, '0')}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tree-chip'; // color se aplica luego
      btn.dataset.id = id;
      btn.setAttribute('aria-label', id);
      btn.textContent = id.slice(3); // sólo número para densidad
      frag.appendChild(btn);
    }
    treeGrid.innerHTML = '';
    treeGrid.appendChild(frag);
  }

  function applyFilters(){
    const q = (treeSearch.value||'').trim().toUpperCase();
    const st = stateFilter.value; // '' | 'sano' | 'hlb' | ...

    const chips = treeGrid.querySelectorAll('.tree-chip');
    for (var i=0;i<chips.length;i++){
      const el = chips[i];
      const id = el.dataset.id;
      const okText = !q || id.includes(q);
      const okState = !st || statusOf[id] === st;
      if (okText && okState) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  }

  function onTreeClick(e){
    const btn = e.target.closest('button.tree-chip');
    if (!btn) return;
    openTree(btn.dataset.id);
  }

  // ------ Datos / Firestore ------
  async function preloadSomeStatuses(){
    try{
      // Intento leer hasta 800 docs (si existen). Si no existen, el grid muestra neutro.
      const snap = await db.collection('arboles').limit(800).get();
      let lastIns = null;
      snap.forEach(d=>{
        const id = d.id;
        const x = d.data();
        const st = sanitizeState(x.estado_salud);
        statusOf[id] = st;
        if (x.ultima_inspeccion){
          const dt = x.ultima_inspeccion?.toDate ? x.ultima_inspeccion.toDate() : new Date(x.ultima_inspeccion);
          lastInspectOf[id] = dt;
          if (!lastIns || dt > lastIns) lastIns = dt;
        }
      });
      if (lastIns) lastInspection.textContent = fmtDate(lastIns);
      repaintGrid();
    }catch(err){
      // offline o colección vacía
    }
  }

  async function openTree(id){
    currentId = id;
    // Intentar leer doc; si no existe, crearlo con ID fijo = ARB###
    try{
      const ref = db.collection('arboles').doc(id);
      const snap = await ref.get();
      if (!snap.exists){
        const init = {
          finca_id: 'finca_la_herradura',
          estado_salud: 'sano',
          productividad_promedio: 0,
          ultima_inspeccion: new Date(),
          trabajador_asignado: (numFromId(id)%2===0) ? 'trabajador1' : 'trabajador2'
        };
        await ref.set(init, { merge: true });
        currentDoc = { id, ...init };
      }else{
        currentDoc = { id, ...snap.data() };
      }
    }catch(err){
      // Offline: construir un doc mínimo en memoria
      currentDoc = {
        id,
        estado_salud: statusOf[id] || 'sano',
        productividad_promedio: 0,
        ultima_inspeccion: new Date()
      };
    }

    // Poblar panel
    panelId.textContent = id;
    const st = sanitizeState(currentDoc.estado_salud);
    panelState.textContent = labelState(st);
    panelState.className = 'pill ' + classForState(st);
    panelProd.textContent = `${Number(currentDoc.productividad_promedio||0)} uds/mes`;
    panelInspect.textContent = fmtDate(currentDoc.ultima_inspeccion);
    treeNote.value = currentDoc.observaciones || '';
    lastPhoto.textContent = currentDoc.last_photo_url ? '📎 ' + currentDoc.last_photo_url : '—';

    // Mapea a chip
    statusOf[id] = st;
    repaintChip(id, st);
  }

  function changePanelState(st){
    if (!currentId) return;
    st = sanitizeState(st);
    statusOf[currentId] = st;
    panelState.textContent = labelState(st);
    panelState.className = 'pill ' + classForState(st);
    panelInspect.textContent = fmtDate(new Date());
    repaintChip(currentId, st);
  }

  async function saveTreeData(){
    if (!currentId) return alert('Primero selecciona un árbol.');
    const payload = {
      estado_salud: statusOf[currentId] || 'sano',
      observaciones: (treeNote.value||'').trim(),
      ultima_inspeccion: new Date()
    };

    saveTreeBtn.disabled = true;
    saveTreeBtn.textContent = '⏳ Guardando…';

    if (navigator.onLine){
      try{
        await db.collection('arboles').doc(currentId).set(payload, { merge: true });
        flashOK(saveTreeBtn, '✅ Guardado');
        summarize();
      }catch(err){
        console.warn('saveTreeData falló online, encolando:', err);
        window.offline?.add('tree', { id: currentId, payload });
        flashQueued(saveTreeBtn, '⏳ En cola');
      }
    }else{
      window.offline?.add('tree', { id: currentId, payload });
      flashQueued(saveTreeBtn, '⏳ En cola');
    }
  }

  async function syncQueuedTree(job){
    // job: { id, payload }
    await db.collection('arboles').doc(job.id).set(job.payload, { merge: true });
  }

  async function uploadPhotoNow(){
    if (!currentId) return alert('Selecciona un árbol.');
    if (!navigator.onLine) return alert('Para subir la foto necesitas conexión.');
    const file = treePhoto.files && treePhoto.files[0];
    if (!file) return alert('Elige una imagen.');

    uploadPhotoBtn.disabled = true;
    uploadPhotoBtn.textContent = '⏳ Subiendo…';

    try{
      const path = `tree_photos/${currentId}/${Date.now()}.jpg`;
      const ref = storage.ref().child(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();

      await db.collection('arboles').doc(currentId).set({
        last_photo_path: path,
        last_photo_url: url,
        ultima_inspeccion: new Date()
      }, { merge: true });

      lastPhoto.textContent = '📎 ' + url;
      panelInspect.textContent = fmtDate(new Date());
      flashOK(uploadPhotoBtn, '✅ Subido');
    }catch(err){
      console.warn('uploadPhoto error:', err);
      flashQueued(uploadPhotoBtn, '⚠️ Error');
    }
  }

  // ------ UI helpers ------
  function repaintGrid(){
    const chips = treeGrid.querySelectorAll('.tree-chip');
    for (var i=0;i<chips.length;i++){
      const id = chips[i].dataset.id;
      repaintChip(id, statusOf[id] || null, chips[i]);
    }
    applyFilters();
  }

  function repaintChip(id, st, el){
    const chip = el || treeGrid.querySelector('.tree-chip[data-id="'+id+'"]');
    if (!chip) return;
    chip.classList.remove('sano','hlb','pulgon','fumagina');
    if (st) chip.classList.add(st);
  }

  function summarize(){
    let cAll=800, cS=0, cH=0, cP=0, cF=0;
    for (let i=1;i<=800;i++){
      const id = `ARB${String(i).padStart(3,'0')}`;
      const st = statusOf[id] || 'sano';
      if (st==='sano') cS++;
      else if (st==='hlb') cH++;
      else if (st==='pulgon') cP++;
      else if (st==='fumagina') cF++;
    }
    countAll.textContent = cAll;
    countSano.textContent = cS;
    countHLB.textContent = cH;
    countPulgon.textContent = cP;
    countFumagina.textContent = cF;
  }

  // ------ Utils ------
  function sanitizeState(x){
    x = String(x||'').toLowerCase();
    if (STATUS.indexOf(x) >= 0) return x;
    return 'sano';
  }
  function classForState(x){
    if (x==='sano') return 'pill-ok';
    if (x==='hlb') return 'pill-warn';
    if (x==='pulgon') return 'pill-orange';
    if (x==='fumagina') return 'pill-danger';
    return '';
  }
  function labelState(x){
    if (x==='sano') return 'Sano';
    if (x==='hlb') return 'HLB';
    if (x==='pulgon') return 'Pulgón';
    if (x==='fumagina') return 'Fumagina';
    return '—';
  }
  function fmtDate(ts){
    try{
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('es-GT',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    }catch{ return '—'; }
  }
  function debounce(fn, ms){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>fn.apply(this, arguments), ms); }; }
  function numFromId(id){ return Number(String(id||'').replace(/[^\d]/g,''))||0; }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent=btn.id==='uploadPhotoBtn'?'📸 Subir foto':'💾 Guardar'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent=btn.id==='uploadPhotoBtn'?'📸 Subir foto':'💾 Guardar'; btn.disabled=false; }, 900); }
})();
