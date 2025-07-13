const WebSocket = require('ws');
const Logger = require('./utils/Logger');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { getWeather } = require('./utils/weather');

const logger = new Logger();

const cachePath = path.join(__dirname, 'data', 'geo-cache.json');
let geoCache = {};

// Load existing geo-cache if available
if (fs.existsSync(cachePath)) {
  try {
    geoCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  } catch (err) {
    console.error('[GeoCache] Failed to read geo-cache.json:', err);
  }
}

const weatherCache = {}; // { "lat,lon": { data, timestamp } }
const WEATHER_TTL = 3 * 60 * 60 * 1000; // 3 hours in ms

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

  try {
    const data = await getWeather(lat, lon);
    weatherCache[key] = {
      data,
      timestamp: now
    };
    return data;
  } catch (err) {
    console.error('[Weather] Failed to fetch weather:', err);
    return null;
  }
}

class Socket {
  constructor(server) {
    this.webSocketServer = new WebSocket.Server({ server });

    this.webSocketServer.on('listening', () => {
      logger.log('Socket: listen');
    });

    this.webSocketServer.on('connection', async (client, req) => {
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      logger.log(`Socket: new connection from ${ip}`);

      const loc = await getIPLocation(ip);
      const lat = loc?.lat || 0;
      const lon = loc?.lon || 0;

      const weather = await getWeatherCached(lat, lon);
      if (weather) {
	const message = {
          type: 'weather',
          payload: {
            success: true,
            data: [
               {
                temp: weather.temp,
                condition: weather.condition,
                location: weather.location,
                humidity: weather.humidity
              }
            ]
          }
        };

        client.send(JSON.stringify(message));
        logger.log(`[Weather] WebSocket sent: ${weather.temp}°C ${weather.condition} in ${weather.location}`);

      } else {
        logger.log('[Weather] No weather data available for client');
      }
    });
  }

  send(msg) {
    this.webSocketServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
}

module.exports = Socket;
