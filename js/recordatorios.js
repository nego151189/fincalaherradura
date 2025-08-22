/* /js/recordatorios.js — Recordatorios del asistente
   - Colección: /recordatorios_asistente
     { tipo, fecha_programada, arboles_objetivo:[ids], mensaje, repeticion, rrule,
       completado:false, fecha_completado:null, creado_ts }
   - Operaciones offline: queue 'reminders' con {op:'add'|'complete'|'snooze', data}
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kOverdue = $('kpiOverdue');
  const kToday   = $('kpiToday');
  const kNext7   = $('kpiNext7');
  const kDoneTd  = $('kpiDoneToday');

  // Form
  const type      = $('type');
  const repeatSel = $('repeat');
  const dateInput = $('dateInput');
  const timeInput = $('timeInput');
  const quickTrees= $('quickTrees');
  const message   = $('message');
  const saveBtn   = $('saveReminderBtn');
  const syncBtn   = $('syncBtn');
  const clearBtn  = $('clearBtn');
  const suggestIrr= $('suggestIrrBtn');
  const tomorrow6 = $('tomorrow6Btn');

  // Lists
  const listOver  = $('listOverdue');
  const listToday = $('listToday');
  const listNext  = $('listNext');

  document.addEventListener('DOMContentLoaded', async ()=>{
    window.offline?.register('reminders', syncReminderOperation);

    // defaults fecha/hora
    const n = new Date();
    dateInput.value = n.toISOString().slice(0,10);
    timeInput.value = pad2(n.getHours()) + ':' + pad2(n.getMinutes());

    bindUI();
    await ensureAuth();
    await refreshAll();
  });

  function bindUI(){
    saveBtn.addEventListener('click', saveReminder);
    clearBtn.addEventListener('click', clearForm);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(refreshAll).catch(()=>{}));
    tomorrow6.addEventListener('click', setTomorrowSix);
    suggestIrr.addEventListener('click', suggestIrrigation);
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ===== Crear =====
  async function saveReminder(){
    const t = type.value || 'riego';
    const rep = repeatSel.value || 'none';
    const when = mergeLocalDateTime(dateInput.value, timeInput.value);
    if (!when) return alert('Selecciona fecha y hora.');
    const msg = (message.value||'').trim() || defaultMsgFor(t);
    const trees = parseTreeList(quickTrees.value||'');

    const docData = {
      tipo: t,
      fecha_programada: when,
      arboles_objetivo: trees.length ? trees : [],
      mensaje: msg,
      repeticion: rep,
      rrule: rruleFrom(rep, when), // string informativa
      completado: false,
      fecha_completado: null,
      creado_ts: new Date()
    };

    saveBtn.disabled = true; saveBtn.textContent = '⏳ Guardando…';

    if (navigator.onLine){
      try{
        await db.collection('recordatorios_asistente').add(docData);
        flashOK(saveBtn, '✅ Guardado');
        clearFormValues();
        await refreshAll();
      }catch(err){
        queueOp({op:'add', data:docData});
        flashQueued(saveBtn, '⏳ En cola');
        clearFormValues();
      }
    } else {
      queueOp({op:'add', data:docData});
      flashQueued(saveBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  // ===== Listar (overdue / today / next7) =====
  async function refreshAll(){
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);
    const seven = new Date(now.getTime()+7*24*60*60*1000);
    let overdue=0, today=0, next7=0, doneToday=0;

    listOver.innerHTML = '';
    listToday.innerHTML = '';
    listNext.innerHTML = '';

    // Atrasados (no completados, fecha < hoy 00:00)
    try{
      const snapO = await db.collection('recordatorios_asistente')
        .where('completado','==',false)
        .where('fecha_programada','<', start)
        .orderBy('fecha_programada','desc').limit(50).get();

      snapO.forEach(doc=>{
        overdue++;
        listOver.appendChild(renderItem(doc.id, doc.data()));
      });
    }catch(e){}

    // Hoy (no completados, dentro de hoy)
    try{
      const snapT = await db.collection('recordatorios_asistente')
        .where('completado','==',false)
        .where('fecha_programada','>=', start)
        .where('fecha_programada','<=', end)
        .orderBy('fecha_programada','asc').limit(100).get();

      snapT.forEach(doc=>{
        today++;
        listToday.appendChild(renderItem(doc.id, doc.data()));
      });
    }catch(e){}

    // Próximos 7 días
    try{
      const snapN = await db.collection('recordatorios_asistente')
        .where('completado','==',false)
        .where('fecha_programada','>', end)
        .where('fecha_programada','<=', seven)
        .orderBy('fecha_programada','asc').limit(100).get();

      snapN.forEach(doc=>{
        next7++;
        listNext.appendChild(renderItem(doc.id, doc.data()));
      });
    }catch(e){}

    // Completados hoy
    try{
      const done = await db.collection('recordatorios_asistente')
        .where('completado','==',true)
        .where('fecha_completado','>=', start)
        .where('fecha_completado','<=', end)
        .orderBy('fecha_completado','desc').get();

      doneToday = done.size || 0;
    }catch(e){}

    kOverdue.textContent = overdue;
    kToday.textContent   = today;
    kNext7.textContent   = next7;
    kDoneTd.textContent  = doneToday;
  }

  function renderItem(id, x){
    const row = document.createElement('div');
    row.className = 'list-row reminder-row';
    const badge = `<span class="badge badge-${x.tipo||'other'}">${labelType(x.tipo)}</span>`;
    const when  = fmtDateTime(x.fecha_programada);
    const trees = Array.isArray(x.arboles_objetivo) && x.arboles_objetivo.length ? `${x.arboles_objetivo.length} árboles` : 'Toda la finca';
    row.innerHTML = `
      <div class="list-cell">${when}</div>
      <div class="list-cell">${badge}</div>
      <div class="list-cell">${escapeHTML(x.mensaje||'—')}</div>
      <div class="list-cell">${trees}</div>
      <div class="list-cell actions">
        <button class="button mini" data-act="done" data-id="${id}">✔️ Hecho</button>
        <button class="button mini" data-act="snooze" data-id="${id}">⏰ +1 día</button>
      </div>
    `;
    row.addEventListener('click', onItemAction);
    return row;
  }

  function onItemAction(e){
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act= btn.getAttribute('data-act');
    if (act==='done') return completeReminder(id);
    if (act==='snooze') return snoozeReminder(id, 1);
  }

  // ===== Completar / Posponer =====
  async function completeReminder(id){
    const op = {op:'complete', data:{ id, patch:{ completado:true, fecha_completado:new Date() } }};
    if (navigator.onLine){
      try{
        await db.collection('recordatorios_asistente').doc(id).update(op.data.patch);
        await refreshAll();
      }catch(e){ queueOp(op); }
    } else {
      queueOp(op);
    }
  }

  async function snoozeReminder(id, days){
    const newDate = new Date(); newDate.setDate(newDate.getDate()+days);
    newDate.setHours(6,0,0,0);
    const op = {op:'snooze', data:{ id, patch:{ fecha_programada:newDate } }};
    if (navigator.onLine){
      try{
        await db.collection('recordatorios_asistente').doc(id).update(op.data.patch);
        await refreshAll();
      }catch(e){ queueOp(op); }
    } else {
      queueOp(op);
    }
  }

  // ===== Sugerir riego (3 días) =====
  async function suggestIrrigation(){
    if (!navigator.onLine){ alert('Se requiere conexión para sugerir.'); return; }
    try{
      const three = new Date(Date.now() - 3*24*60*60*1000);
      const snap = await db.collection('arboles').where('ultimo_riego','<=', three).limit(50).get();
      const ids = [];
      snap.forEach(d=>{ const n = parseId(d.id)||parseId(d.data()?.id); if (n) ids.push(numToTreeId(n)); });
      if (ids.length===0){ alert('No hay árboles con >3 días sin riego (límite 50).'); return; }
      quickTrees.value = ids.slice(0,50).join(', ');
      type.value = 'riego';
      message.value = 'Regar árboles sugeridos (>3 días)';
      const tmr = new Date(); tmr.setDate(tmr.getDate()+1); tmr.setHours(6,0,0,0);
      dateInput.value = tmr.toISOString().slice(0,10);
      timeInput.value = '06:00';
      alert(`Sugeridos ${ids.length} árbol(es).`);
    }catch(e){
      alert('No se pudo sugerir ahora.');
    }
  }

  // ===== Sync handler (cola) =====
  async function syncReminderOperation(op){
    if (!op || !op.op) return;
    if (op.op==='add'){
      await db.collection('recordatorios_asistente').add(op.data);
    } else if (op.op==='complete' || op.op==='snooze'){
      if (op.data && op.data.id && op.data.patch){
        await db.collection('recordatorios_asistente').doc(op.data.id).update(op.data.patch);
      }
    }
  }
  function queueOp(op){ window.offline?.add('reminders', op); }

  // ===== Utils =====
  function defaultMsgFor(t){
    if (t==='riego') return 'Revisar tanque (≥60%) y regar zona programada';
    if (t==='abono') return 'Aplicar fertilización según plan';
    if (t==='fumigacion') return 'Tratamiento fitosanitario según clima';
    if (t==='cosecha') return 'Programar corte y logística de venta';
    return 'Recordatorio';
  }
  function rruleFrom(rep, when){
    if (rep==='weekly') return 'FREQ=WEEKLY;BYHOUR='+when.getHours()+';BYMINUTE='+when.getMinutes();
    if (rep==='biweekly') return 'FREQ=WEEKLY;INTERVAL=2;BYHOUR='+when.getHours()+';BYMINUTE='+when.getMinutes();
    if (rep==='monthly') return 'FREQ=MONTHLY;BYHOUR='+when.getHours()+';BYMINUTE='+when.getMinutes();
    return '';
  }
  function parseTreeList(txt){
    const out = new Set();
    (txt||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(seg=>{
      if (seg.includes('-')){
        const [a,b] = seg.split('-').map(s=>s.trim());
        const A = parseTreeIdToNum(a), B = parseTreeIdToNum(b);
        if (A && B && B>=A) for (let n=A;n<=B;n++) out.add(numToTreeId(n));
      } else {
        const N = parseTreeIdToNum(seg); if (N) out.add(numToTreeId(N));
      }
    });
    return Array.from(out);
  }
  function parseTreeIdToNum(s){
    s = String(s||'').toUpperCase().replace(/\s+/g,'');
    if (s.startsWith('ARB')) s = s.slice(3);
    const n = Number(s.replace(/[^\d]/g,''));
    if (!Number.isFinite(n) || n<1 || n>800) return null;
    return n;
  }
  function numToTreeId(n){ return `ARB${String(n).padStart(3,'0')}`; }
  function parseId(x){
    if (!x) return null;
    const m = String(x).match(/(\d{1,3})$/);
    return m ? Number(m[1]) : null;
  }

  function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function endOfDay(d){ const x = new Date(d); x.setHours(23,59,59,999); return x; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function mergeLocalDateTime(yyyy_mm_dd, hhmm){
    if (!yyyy_mm_dd) return null;
    const [y,m,d] = yyyy_mm_dd.split('-').map(Number);
    const date = new Date(); date.setFullYear(y||1970, (m||1)-1, d||1);
    let h=6, mi=0; // default 06:00
    if (hhmm && hhmm.includes(':')) { const p=hhmm.split(':'); h=Number(p[0]||6); mi=Number(p[1]||0); }
    date.setHours(h, mi, 0, 0);
    return date;
  }
  function fmtDateTime(ts){
    try{
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('es-GT',{ weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    }catch{ return '—'; }
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function clearFormValues(){
    type.value='riego'; repeatSel.value='none'; quickTrees.value=''; message.value='';
    const n=new Date(); dateInput.value = n.toISOString().slice(0,10); timeInput.value = pad2(n.getHours()) + ':' + pad2(n.getMinutes());
  }
  function clearForm(){ clearFormValues(); }
  function setTomorrowSix(){
    const t = new Date(); t.setDate(t.getDate()+1); t.setHours(6,0,0,0);
    dateInput.value = t.toISOString().slice(0,10); timeInput.value = '06:00';
  }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar'; btn.disabled=false; }, 900); }
})();
