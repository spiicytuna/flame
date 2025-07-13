const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const loadConfig = require('./loadConfig');

const cachePath = '/app/data/geo-cache.json';
let geoCache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
  : {};

async function getGeoFromIP(ip) {
  const cleanIP = ip.replace('::ffff:', '');

  if (geoCache[cleanIP]) return geoCache[cleanIP];

  const providers = [
    async () => {
      const res = await fetch(`http://ip-api.com/json/${cleanIP}?fields=lat,lon`);
      const data = await res.json();
      if (data?.lat && data?.lon) return data;
    },
    async () => {
      const res = await fetch(`https://ipinfo.io/${cleanIP}/loc`);
      const text = await res.text();
      if (text.includes(',')) {
        const [lat, lon] = text.trim().split(',');
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      }
    }
  ];

  for (const fn of providers) {
    try {
      const loc = await fn();
      if (loc?.lat && loc?.lon) {
        geoCache[cleanIP] = loc;
        fs.writeFileSync(cachePath, JSON.stringify(geoCache, null, 2));
        return loc;
      }
    } catch {}
  }

  try {
    const config = await loadConfig();
    if (config.lat && config.long) return { lat: config.lat, lon: config.long };
  } catch {}

  return null;
}

module.exports = { getGeoFromIP };
