/* /js/gastos.js — Registro de gastos
   - Sin imports ESM; usa firebase compat global (db, auth)
   - Colección: /gastos con { fecha, categoria, descripcion, monto, proveedor }
   - Cola offline: 'expenses'
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // KPIs
  const kpiExpCount = $('kpiExpCount');
  const kpiExpTotal = $('kpiExpTotal');
  const kpiExpAvg   = $('kpiExpAvg');
  const kpiTopCat   = $('kpiTopCat');

  // Form
  const category    = $('category');
  const provider    = $('provider');
  const description = $('description');
  const amount      = $('amount');
  const dateInput   = $('dateInput');

  const saveExpenseBtn = $('saveExpenseBtn');
  const syncBtn        = $('syncBtn');
  const clearBtn       = $('clearBtn');

  // Lista
  const expList = $('expList');

  document.addEventListener('DOMContentLoaded', async ()=>{
    // Registrar cola offline
    window.offline?.register('expenses', syncQueuedExpense);

    // Defaults
    dateInput.value = new Date().toISOString().slice(0,10);

    bindUI();

    // Auth
    await ensureAuth();

    // KPIs + lista
    await Promise.all([refreshKPIs(), loadTodayExpenses()]);
  });

  function bindUI(){
    // Incrementos rápidos del monto
    document.querySelectorAll('.btn-bar .button.mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tgt = document.querySelector(btn.getAttribute('data-add'));
        const val = Number(btn.getAttribute('data-val'));
        if (!tgt) return;
        const cur = Math.max(0, Number(tgt.value||0) + val);
        tgt.value = cur.toFixed(2);
      });
    });

    saveExpenseBtn.addEventListener('click', saveExpense);
    clearBtn.addEventListener('click', clearForm);
    syncBtn.addEventListener('click', ()=> window.offline?.sync().then(()=>Promise.all([refreshKPIs(), loadTodayExpenses()])).catch(()=>{}));
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  // ---- Guardar gasto ----
  async function saveExpense(){
    const cat = category.value || 'otros';
    const prov= (provider.value||'').trim();
    const desc= (description.value||'').trim();
    const m   = round2(Number(amount.value||0));
    const d   = dateInput.value;

    if (m < 0.01) return alert('Ingresa un monto (>= 0.01).');
    if (!d) return alert('Selecciona fecha.');

    saveExpenseBtn.disabled = true;
    saveExpenseBtn.textContent = '⏳ Guardando…';

    const when = toDateAtLocal(d); // fecha a medianoche local
    const payload = {
      fecha: when,
      categoria: cat,
      descripcion: desc,
      monto: m,
      proveedor: prov
    };

    if (navigator.onLine){
      try{
        await db.collection('gastos').add(payload);
        flashOK(saveExpenseBtn, '✅ Guardado');
        clearFormValues();
        await Promise.all([refreshKPIs(), loadTodayExpenses()]);
      }catch(err){
        console.warn('saveExpense online falló, encolando:', err);
        window.offline?.add('expenses', payload);
        flashQueued(saveExpenseBtn, '⏳ En cola');
        clearFormValues();
      }
    }else{
      window.offline?.add('expenses', payload);
      flashQueued(saveExpenseBtn, '⏳ En cola');
      clearFormValues();
    }
  }

  async function syncQueuedExpense(payload){
    await db.collection('gastos').add(payload);
  }

  // ---- KPIs (hoy) ----
  async function refreshKPIs(){
    const { start, end } = dayRange();
    let count=0, total=0;
    const catMap = Object.create(null);

    try{
      const snap = await db.collection('gastos')
        .where('fecha','>=',start)
        .where('fecha','<=',end)
        .orderBy('fecha','desc').get();

      snap.forEach(d=>{
        const x = d.data();
        const m = Number(x.monto||0);
        count++;
        total += m;
        const c = String(x.categoria||'otros');
        catMap[c] = (catMap[c]||0)+m;
      });
    }catch(e){}

    const avg = count ? (total / count) : 0;
    const top = topCategory(catMap);

    kpiExpCount.textContent = count;
    kpiExpTotal.textContent = 'Q' + round2(total).toFixed(2);
    kpiExpAvg.textContent   = 'Q' + round2(avg).toFixed(2);
    kpiTopCat.textContent   = top ? top : '—';
  }

  function topCategory(map){
    let name=null, max=-1;
    for (var k in map){ if (map[k]>max){ max=map[k]; name=k; } }
    return name ? capFirst(name) : null;
  }

  // ---- Lista de hoy ----
  async function loadTodayExpenses(){
    expList.innerHTML = '';
    const { start, end } = dayRange();
    try{
      const snap = await db.collection('gastos')
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
          <div class="list-cell">${escapeHTML(capFirst(x.categoria||'—'))}</div>
          <div class="list-cell">${escapeHTML(x.proveedor||'—')}</div>
          <div class="list-cell">${escapeHTML(x.descripcion||'—')}</div>
          <div class="list-cell right">Q${Number(x.monto||0).toFixed(2)}</div>
        `;
        expList.appendChild(row);
      });
    }catch(e){}
  }

  // ---- Utils ----
  function dayRange(){ const s=new Date(); s.setHours(0,0,0,0); const e=new Date(); e.setHours(23,59,59,999); return {start:s,end:e}; }
  function fmtTime(ts){ try{ const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function round2(n){ return Math.round((isFinite(n)?n:0)*100)/100; }
  function toDateAtLocal(yyyy_mm_dd){
    const [y,m,d] = (yyyy_mm_dd||'').split('-').map(Number);
    const dt = new Date(); dt.setFullYear(y||1970, (m||1)-1, d||1); dt.setHours(0,0,0,0);
    return dt;
  }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function capFirst(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
  function clearFormValues(){
    category.value='fertilizantes'; provider.value=''; description.value='';
    amount.value='100.00'; dateInput.value=new Date().toISOString().slice(0,10);
  }
  function clearForm(){ clearFormValues(); }
  function flashOK(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar gasto'; btn.disabled=false; }, 900); }
  function flashQueued(btn, txt){ btn.textContent=txt; setTimeout(()=>{ btn.textContent='💾 Guardar gasto'; btn.disabled=false; }, 900); }
})();
