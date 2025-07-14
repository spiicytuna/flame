const WebSocket = require('ws');
const Logger = require('./utils/Logger');
const { getGeoFromIP } = require('./utils/geoIP');
const { getWeather } = require('./utils/weather');

const logger = new Logger();

const weatherCache = {}; // { "lat,lon": { data, timestamp } }

const WEATHER_TTL = (() => {  // set env var in docker-compose WEATHER_TTL_HOURS=1 // defaults to 3 hours
  const hours = parseInt(process.env.WEATHER_TTL_HOURS || '3');
  return hours * 60 * 60 * 1000;
})();

async function getWeatherCached(lat, lon) {
  const key = `${lat},${lon}`;
  const now = Date.now();

  if (weatherCache[key] && (now - weatherCache[key].timestamp) < WEATHER_TTL) {
    logger.log(`[Weather] Serving from cache for key ${key}`);
    return weatherCache[key].data;
  }

  try {
    logger.log(`[Weather] Fetching fresh data from WeatherAPI for key ${key}`);
    const data = await getWeather(lat, lon);
    weatherCache[key] = {
      data,
      timestamp: now
    };
    return data;
  } catch (err) {
    logger.log('[Weather] Failed to fetch weather:', err.message);
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

      try {
        const loc = await getGeoFromIP(ip);
        const lat = loc?.lat || 0;
        const lon = loc?.lon || 0;

        const weather = await getWeatherCached(lat, lon);
        if (weather) {
          client.send(JSON.stringify(weather));
          logger.log(`[Weather] WebSocket sent: ${weather.tempC || weather.temp}°C ${weather.conditionText || weather.condition} in ${weather.location || weather.name}`);
        } else {
          logger.log('[Weather] No weather data available for client');
        }
      } catch (err) {
        logger.log(`[Weather] Failed to fetch or send weather data: ${err.message}`);
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

