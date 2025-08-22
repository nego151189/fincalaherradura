/* functions/index.js — MAGA: proxy HTTPS + sync diario
   - GET /api/maga-prices?force=1   → scrapea y devuelve JSON
   - Tarea diaria 06:00 America/Guatemala → guarda en /precios_maga
   - En ambos casos normaliza { price, unit:"millar", currency:"GTQ", updatedAt }
*/
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cheerio = require('cheerio');

// 🔧 Inicializar Admin una vez
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const MAGA_URL = 'https://precios.maga.gob.gt/diarios/diarios.html';

// Utilidad: extraer precio del Limón Persa desde HTML (tolerante a acentos)
async function fetchMagaHtml() {
  const res = await fetch(MAGA_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error('MAGA HTTP ' + res.status);
  return await res.text();
}
function extractLimonPersaPrice(html) {
  const $ = cheerio.load(html);
  let found = null;

  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length >= 2) {
      const product = $(tds[0]).text().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      if (product.includes('limon') && product.includes('persa')) {
        const priceText = $(tds[1]).text().replace(/[^\d.,]/g, '').replace(/,/g, '');
        const price = parseFloat(priceText);
        if (Number.isFinite(price)) found = price;
      }
    }
  });
  return found; // p.ej. 520 (por millar, GTQ)
}

async function savePriceDoc(price, source, extra = {}) {
  const doc = {
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    precio_millar_limon_persa: price,
    fuente: 'MAGA',
    url_source: MAGA_URL,
    scraping_exitoso: true,
    ...extra
  };
  await db.collection('precios_maga').add(doc);
  return doc;
}

async function lastKnownPrice() {
  const snap = await db.collection('precios_maga').orderBy('fecha', 'desc').limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return { price: d.precio_millar_limon_persa || null, fecha: d.fecha };
}

// ===== HTTPS Proxy: /api/maga-prices
exports.magaPriceProxy = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    // Si no hay force, y ya hay precio de hoy en Firestore, devuelve ese
    const today = new Date();
    today.setHours(0,0,0,0);
    const snap = await db.collection('precios_maga')
      .where('fecha', '>=', admin.firestore.Timestamp.fromDate(today))
      .orderBy('fecha', 'desc').limit(1).get();

    if (!('force' in req.query) && !snap.empty) {
      const d = snap.docs[0].data();
      return res.json({
        ok: true,
        price: d.precio_millar_limon_persa,
        unit: 'millar',
        currency: 'GTQ',
        updatedAt: d.fecha.toDate(),
        cached: true
      });
    }

    // Scraping en vivo
    const html = await fetchMagaHtml();
    const price = extractLimonPersaPrice(html);

    if (!Number.isFinite(price)) {
      const last = await lastKnownPrice();
      return res.json({
        ok: false,
        error: 'NO_PRICE_FOUND',
        lastKnown: last,
        unit: 'millar',
        currency: 'GTQ'
      });
    }

    // Guarda (fire-and-forget)
    savePriceDoc(price, 'proxy').catch(() => {});

    return res.json({
      ok: true,
      price,
      unit: 'millar',
      currency: 'GTQ',
      updatedAt: new Date(),
      cached: false
    });
  } catch (err) {
    const last = await lastKnownPrice().catch(() => null);
    return res.status(200).json({
      ok: false,
      error: String(err && err.message || err),
      lastKnown: last,
      unit: 'millar',
      currency: 'GTQ'
    });
  }
});

// ===== Cron diario 06:00 GT: guarda y opcionalmente emite alerta si sube ≥10% o >= 500 GTQ
exports.magaPriceDaily = functions.pubsub
  .schedule('0 6 * * *').timeZone('America/Guatemala')
  .onRun(async () => {
    try {
      const html = await fetchMagaHtml();
      const price = extractLimonPersaPrice(html);
      if (!Number.isFinite(price)) throw new Error('NO_PRICE_FOUND');

      const prev = await lastKnownPrice();
      const saved = await savePriceDoc(price, 'cron');

      // Alerta por subida >=10% o precio alto
      let shouldAlert = false;
      let changePct = 0;
      if (prev && prev.price) {
        changePct = ((price - prev.price) / prev.price) * 100;
        if (changePct >= 10) shouldAlert = true;
      }
      if (price >= 500) shouldAlert = true;

      if (shouldAlert) {
        const title = '💰 Precio favorable MAGA';
        const body = `Limón persa: Q${price}/millar` + (changePct ? ` (↑ ${changePct.toFixed(1)}%)` : '');
        await admin.messaging().send({
          topic: 'price-alerts',
          notification: { title, body }
        }).catch(() => {});
      }

      return saved;
    } catch (e) {
      // Registra error para análisis
      await db.collection('sync_errors').add({
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        tipo: 'maga_scraping',
        error: String(e && e.message || e)
      }).catch(() => {});
      return null;
    }
  });
