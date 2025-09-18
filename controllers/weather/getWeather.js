const { getGeoFromIP } = require('../../utils/geoIP');
const { getWeather } = require('../../utils/weather');
const loadConfig = require('../../utils/loadConfig');
const asyncWrapper = require('../../middleware/asyncWrapper');

const getCurrentWeather = asyncWrapper(async (req, res, next) => {
  const config = await loadConfig();
  let lat, lon;

  if (config.weatherMode === 'fixed') {
    lat = config.lat;
    lon = config.long;
  } else {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const loc = await getGeoFromIP(ip);
    lat = loc?.lat || config.lat;
    lon = loc?.lon || config.long;
  }

  const weather = await getWeather(lat, lon);
  res.status(200).json({ success: true, data: [weather] });
});

module.exports = getCurrentWeather;
