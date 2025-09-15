const WebSocket = require('ws');
const Logger = require('./utils/Logger');
const { getGeoFromIP } = require('./utils/geoIP');
const { getWeather } = require('./utils/weather');
const loadConfig = require('./utils/loadConfig');

const logger = new Logger();

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
        const config = await loadConfig();
        let lat, lon;

        if (config.weatherMode === 'fixed') {
          lat = config.lat;
          lon = config.long;
        } else {
          const loc = await getGeoFromIP(ip);
          lat = loc?.lat || config.lat;
          lon = loc?.lon || config.long;
        }

        const weather = await getWeather(lat, lon);
        if (weather) {
          client.send(JSON.stringify(weather));
          const modeLabel = config.weatherMode === 'fixed' ? 'Fixed lat/lon' : 'GeoIP';
          const sourceLabel = weather.source === 'cache' ? 'from cache' : 'from API';
          logger.log(`[Weather] WebSocket sent ${sourceLabel}: ${weather.tempC || weather.temp}°C ${weather.conditionText || weather.condition} in ${weather.location || weather.name} (${modeLabel})`);
        } else {
          logger.log('[Weather] No weather data available for client');
        }
      } catch (err) {
        logger.log(`[Weather] Failed to fetch or send weather data: ${err.message}`);
      }
    });
  }
}

module.exports = Socket;
