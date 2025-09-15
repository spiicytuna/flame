const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
      const res = await axios.get(`http://ip-api.com/json/${cleanIP}?fields=lat,lon`);
      if (res.data?.lat && res.data?.lon) return res.data;
    },
    async () => {
      const res = await axios.get(`https://ipinfo.io/${cleanIP}/loc`);
      if (typeof res.data === 'string' && res.data.includes(',')) {
        const [lat, lon] = res.data.trim().split(',');
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
