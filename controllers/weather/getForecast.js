const getGeoFromIP = require('../../utils/geoIP');
const { getForecast } = require('../../utils/weather');
const loadConfig = require('../../utils/loadConfig');
const asyncWrapper = require('../../middleware/asyncWrapper');
const Logger = require('../../utils/Logger');

const logger = new Logger();

module.exports = asyncWrapper(async (req, res) => {
  const config = await loadConfig();

  // global forecast kill
  if (config.forecastEnable === false) {
    return res.status(403).json({
      success: false,
      error: 'Forecast is disabled by configuration',
    });
  }

  const useCache = String(req.query.useCache).toLowerCase() === 'true';
  const days = Number.isFinite(+req.query.days) ? +req.query.days : undefined;

  // Resolve coordinates
  let lat, lon;
  if (config.weatherMode === 'fixed') {
    lat = config.lat;
    lon = config.long;
  } else {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
      .split(',')[0]
      .trim();

    try {
      const loc = await getGeoFromIP(ip);
      lat = loc?.lat ?? config.lat;
      lon = loc?.lon ?? config.long;
    } catch {
      lat = config.lat;
      lon = config.long;
    }
  }

  lat = typeof lat === 'string' ? parseFloat(lat) : lat;
  lon = typeof lon === 'string' ? parseFloat(lon) : lon;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res
      .status(400)
      .json({ success: false, error: 'No valid coordinates for forecast' });
  }

  const { data, source } = await getForecast(lat, lon, !useCache, days);
  if (!data) {
    return res
      .status(500)
      .json({ success: false, error: 'Could not retrieve forecast data.' });
  }

  logger.log(`[Forecast] ${String(source).toUpperCase()} → days=${data.length} for ${lat},${lon}`);
  return res.json({ success: true, data });
});
