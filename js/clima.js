/* /js/clima.js — Clima Finca La Herradura
   Estrategia:
   1) Intentar proxy: GET /api/weather?lat=..&lon=..
      (luego lo podrás montar como Cloud Function y esconder la clave)
   2) Si falla y existe localStorage.OPENWEATHER_KEY, usar OpenWeather OneCall 2.5
   3) Si falla todo, cargar último cache local (localStorage FH_WEATHER_CACHE)
   Offline-first: muestra cache y marca fecha del cache.
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  // Defaults (San Antonio La Paz)
  const DEFAULT_LOC = { name:'San Antonio La Paz', lat:14.6849, lon:-90.1235 };

  // UI refs
  const locName = $('locName'), lat = $('lat'), lon = $('lon');
  const gpsBtn = $('gpsBtn'), saveLocBtn = $('saveLocBtn'), refreshBtn = $('refreshBtn');
  const kpiTemp = $('kpiTemp'), kpiRainProb = $('kpiRainProb'), kpiWind = $('kpiWind'), kpiHumidity = $('kpiHumidity');
  const forecastGrid = $('forecastGrid'), adviceList = $('adviceList'), cacheInfo = $('cacheInfo');

  let currentLoc = loadSavedLocation();

  document.addEventListener('DOMContentLoaded', async ()=>{
    fillForm(currentLoc);
    await ensureAuth(); // por consistencia con el resto de módulos
    await loadWeather(true);

    bindUI();
  });

  function bindUI(){
    refreshBtn.addEventListener('click', ()=>loadWeather(false));
    saveLocBtn.addEventListener('click', ()=>{
      currentLoc = {
        name: (locName.value||'').trim() || DEFAULT_LOC.name,
        lat: Number(lat.value||DEFAULT_LOC.lat),
        lon: Number(lon.value||DEFAULT_LOC.lon),
      };
      localStorage.setItem('FH_LOC', JSON.stringify(currentLoc));
      alert('Ubicación predeterminada guardada.');
    });
    gpsBtn.addEventListener('click', ()=>{
      if (!navigator.geolocation) return alert('Geolocalización no disponible.');
      navigator.geolocation.getCurrentPosition(
        pos=>{
          const { latitude, longitude } = pos.coords;
          lat.value = latitude.toFixed(4);
          lon.value = longitude.toFixed(4);
          if (!locName.value) locName.value = 'Mi ubicación';
        },
        ()=> alert('No se pudo obtener la ubicación.')
      );
    });
  }

  async function ensureAuth(){
    return new Promise(resolve => auth.onAuthStateChanged(u => { if (u) resolve(u); }));
  }

  function loadSavedLocation(){
    try{ const x = JSON.parse(localStorage.getItem('FH_LOC')||'null'); if (x && Number.isFinite(x.lat) && Number.isFinite(x.lon)) return x; }catch(e){}
    return DEFAULT_LOC;
  }
  function fillForm(loc){ locName.value = loc.name; lat.value = loc.lat; lon.value = loc.lon; }

  async function loadWeather(allowCacheFirst){
    const loc = {
      name: (locName.value||currentLoc.name||DEFAULT_LOC.name),
      lat: Number(lat.value||currentLoc.lat||DEFAULT_LOC.lat),
      lon: Number(lon.value||currentLoc.lon||DEFAULT_LOC.lon)
    };

    // 1) Si se permite cache primero y estamos offline, mostrar cache inmediato
    if (allowCacheFirst && !navigator.onLine){
      const cached = readCache();
      if (cached){ renderAll(loc, cached, true); return; }
    }

    // Intentar proxy
    try{
      const url = `/api/weather?lat=${encodeURIComponent(loc.lat)}&lon=${encodeURIComponent(loc.lon)}`;
      const res = await fetch(url, { method:'GET' });
      if (res.ok){
        const data = await res.json();
        const normalized = normalizeOneCall(data);
        writeCache(normalized);
        renderAll(loc, normalized, false);
        return;
      }
    }catch(e){ /* sigue */ }

    // Intentar OpenWeather directo con clave local
    const KEY = localStorage.getItem('OPENWEATHER_KEY');
    if (KEY){
      try{
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${loc.lat}&lon=${loc.lon}&units=metric&lang=es&appid=${KEY}`;
        const res = await fetch(url);
        if (res.ok){
          const data = await res.json();
          const normalized = normalizeOneCall(data);
          writeCache(normalized);
          renderAll(loc, normalized, false);
          return;
        }
      }catch(e){ /* sigue */ }
    }

    // Último recurso: cache
    const cached = readCache();
    if (cached){
      renderAll(loc, cached, true);
      alert('No se pudo actualizar clima. Mostrando datos en cache.');
    }else{
      renderEmpty();
      alert('No hay datos de clima disponibles aún.');
    }
  }

  function normalizeOneCall(data){
    // Asegurar forma esperada
    return {
      fetchedAt: Date.now(),
      current: data.current || {},
      hourly: Array.isArray(data.hourly) ? data.hourly.slice(0,12) : [],
      daily: Array.isArray(data.daily) ? data.daily.slice(0,4) : [],
      alerts: Array.isArray(data.alerts) ? data.alerts : []
    };
  }

  function writeCache(obj){
    try{ localStorage.setItem('FH_WEATHER_CACHE', JSON.stringify(obj)); }catch(e){}
  }
  function readCache(){
    try{ const x = JSON.parse(localStorage.getItem('FH_WEATHER_CACHE')||'null'); return x || null; }catch(e){ return null; }
  }

  function renderAll(loc, wx, fromCache){
    // KPIs
    const temp = wx.current?.temp;
    const wind = wx.current?.wind_speed;
    const humidity = wx.current?.humidity;

    kpiTemp.textContent = isFinite(temp) ? (Math.round(temp) + '°C') : '—';
    kpiWind.textContent = isFinite(wind) ? (Math.round(wind*3.6) + ' km/h') : '—'; // m/s -> km/h
    kpiHumidity.textContent = isFinite(humidity) ? (Math.round(humidity) + '%') : '—';

    // Lluvia próxima 12h (probabilidad máxima)
    let maxPop = 0;
    wx.hourly.forEach(h=>{ if (isFinite(h.pop) && h.pop>maxPop) maxPop = h.pop; });
    kpiRainProb.textContent = (Math.round((maxPop||0)*100) + '%');

    // Sugerencias
    renderAdvice(wx);

    // Pronóstico (hoy + 3 días)
    renderForecast(wx);

    // Info de cache
    if (fromCache){
      cacheInfo.textContent = 'Mostrando datos en cache (' + new Date(wx.fetchedAt||Date.now()).toLocaleString('es-GT') + ').';
    } else {
      cacheInfo.textContent = '';
    }
  }

  function renderEmpty(){
    kpiTemp.textContent='—'; kpiWind.textContent='—'; kpiHumidity.textContent='—'; kpiRainProb.textContent='—';
    forecastGrid.innerHTML = '';
    adviceList.innerHTML = '<li>No hay datos.</li>';
    cacheInfo.textContent = '';
  }

  function renderForecast(wx){
    forecastGrid.innerHTML = '';
    const days = wx.daily || [];
    days.forEach((d, idx)=>{
      const date = new Date((d.dt||0)*1000);
      const label = idx===0 ? 'Hoy' : date.toLocaleDateString('es-GT',{ weekday:'short', day:'2-digit', month:'short' });
      const tmin = isFinite(d.temp?.min) ? Math.round(d.temp.min) : '—';
      const tmax = isFinite(d.temp?.max) ? Math.round(d.temp.max) : '—';
      const pop = isFinite(d.pop) ? Math.round(d.pop*100) : 0;
      const wind = isFinite(d.wind_speed) ? Math.round(d.wind_speed*3.6) : '—';
      const icon = emojiFor(d.weather && d.weather[0]);

      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.innerHTML = `
        <div class="fc-day">${label}</div>
        <div class="fc-icon">${icon}</div>
        <div class="fc-temps">${tmax}° / ${tmin}°</div>
        <div class="fc-meta">💧 ${pop}% · 💨 ${wind} km/h</div>
        <div class="fc-desc">${escapeHTML(d.weather && d.weather[0]?.description || '')}</div>
      `;
      forecastGrid.appendChild(card);
    });
  }

  function renderAdvice(wx){
    adviceList.innerHTML = '';
    const items = [];

    // Prob lluvia próxima 12h
    let maxPop = 0; wx.hourly.forEach(h=>{ if (isFinite(h.pop) && h.pop>maxPop) maxPop = h.pop; });
    if (maxPop >= 0.4) items.push('🌧️ Alta probabilidad de lluvia en próximas 12h → posponer riego.');

    // Viento hoy (para fumigación)
    const windNow = wx.current?.wind_speed || 0; // m/s
    if (windNow*3.6 >= 25) items.push('💨 Viento fuerte → evitar fumigación hoy.');

    // Calor sin lluvia
    const d0 = (wx.daily||[])[0];
    const hot = d0 && isFinite(d0.temp?.max) && d0.temp.max >= 32;
    const rainLow = d0 && (isFinite(d0.pop) ? d0.pop < 0.2 : true);
    if (hot && rainLow) items.push('🔥 Calor alto sin lluvia → aumentar riego 10–20%.');

    // Alertas del proveedor (si existieran)
    if (Array.isArray(wx.alerts) && wx.alerts.length){
      items.push('⚠️ Alertas activas en la zona (' + wx.alerts.length + '). Revisa condiciones.');
    }

    if (!items.length) items.push('✅ Sin restricciones climáticas importantes.');

    items.forEach(t=>{
      const li = document.createElement('li'); li.textContent = t; adviceList.appendChild(li);
    });
  }

  // Utilidades
  function emojiFor(w){
    const main = (w?.main||'').toLowerCase();
    const id = w?.id || 0;
    if (main.includes('thunder') || (id>=200 && id<300)) return '⛈️';
    if (main.includes('drizzle') || (id>=300 && id<400)) return '🌦️';
    if (main.includes('rain')    || (id>=500 && id<600)) return '🌧️';
    if (main.includes('snow')    || (id>=600 && id<700)) return '❄️';
    if (main.includes('mist') || main.includes('fog') || (id>=700 && id<800)) return '🌫️';
    if (id===800) return '☀️';
    if (id>800) return '⛅';
    return '🌤️';
  }
  function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

})();
