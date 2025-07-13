const { getWeather } = require('../../utils/weather');
const Sockets = require('../../Sockets');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const cachePath = path.join(__dirname, '../../data/geo-cache.json');
let geoCache = {};

if (fs.existsSync(cachePath)) {
  try {
    geoCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  } catch (err) {
    console.error('[GeoCache] Failed to read geo-cache.json:', err);
  }
}

const weatherCache = {}; // { "lat,lon": { data, timestamp } }
const WEATHER_TTL = 3 * 60 * 60 * 1000; // 3 hours

async function getIPLocation(ip) {
  const cleanIP = ip.replace('::ffff:', '');
  if (geoCache[cleanIP]) return geoCache[cleanIP];

  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIP}?fields=lat,lon`);
    const data = await res.json();

    if (data.lat && data.lon) {
      geoCache[cleanIP] = { lat: data.lat, lon: data.lon };
      fs.writeFileSync(cachePath, JSON.stringify(geoCache, null, 2));
      return geoCache[cleanIP];
    }
  } catch (err) {
    console.error('[GeoLookup] Failed for IP:', cleanIP, err);
  }

  return null;
}

async function getWeatherCached(lat, lon) {
  const key = `${lat},${lon}`;
  const now = Date.now();

  if (weatherCache[key] && (now - weatherCache[key].timestamp) < WEATHER_TTL) {
    return weatherCache[key].data;
  }

  const data = await getWeather(lat, lon);
  weatherCache[key] = {
    data,
    timestamp: now
  };

  return data;
}

module.exports = async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const location = await getIPLocation(ip);

    if (!location?.lat || !location?.lon) {
      console.error(`[GeoLookup] Invalid or missing coordinates for IP: ${ip}`);
      return res.status(500).json({ error: 'Geolocation failed' });
    }

    const lat = location.lat;
    const lon = location.lon;

    console.log(`[Weather] Using lat=${lat}, lon=${lon} for IP=${ip}`);

    const weather = await getWeatherCached(lat, lon);

    // Emit to frontend via WebSocket (required for Flame to display it)
    try {
      const socket = Sockets.getSocket('weather');
      if (socket?.socket) {
        socket.socket.send(JSON.stringify({
          success: true,
          data: [weather]
        }));
        console.log('[Weather] WebSocket push successful');
      }
    } catch (e) {
      console.warn('[Weather] Failed to push via socket', e);
    }

    // Also respond to API call
    res.status(200).json({
      success: true,
      data: [weather]
    });
  } catch (err) {
    console.error('[Weather API] Error:', err);
    res.status(500).json({ error: 'Unable to fetch weather' });
  }
};
