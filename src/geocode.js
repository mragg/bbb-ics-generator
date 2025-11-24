const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.resolve(__dirname, '../field-cache.json');

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return [];
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Holt/fügt Geo zu einem Spielfeld-Objekt, cached im Array
async function getCoordsForSpielfeld(spielfeld) {
  const cache = loadCache();
  const key = spielfeld.id || spielfeld.basketballBundSpielfeldId;

  let entry = cache.find(f => f.basketballBundSpielfeldId === key);
  if (entry && entry.lat && entry.lon) return entry; // Wenn im Cache, zurückgeben

  const address = `${spielfeld.bezeichnung}, ${spielfeld.strasse}, ${spielfeld.plz} ${spielfeld.ort}, Deutschland`;
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'bbb-ics-generator/1.0 oliver-eder.de' }
    });
    if (res.data?.length && res.data[0].lat && res.data[0].lon) {
      const cachedObj = {
        basketballBundSpielfeldId: key,
        bezeichnung: spielfeld.bezeichnung,
        strasse: spielfeld.strasse,
        plz: spielfeld.plz,
        ort: spielfeld.ort,
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon)
      };
      cache.push(cachedObj);
      saveCache(cache);
      return cachedObj;
    }
  } catch (err) {
    console.error('[Geocode] Fehler bei', address, err.message);
  }
  // Auch im Fehlerfall: Spielfeld ohne Koordinaten zurückgeben
  return {
    basketballBundSpielfeldId: key,
    ...spielfeld
  };
}

module.exports = { getCoordsForSpielfeld };
