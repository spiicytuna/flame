const { getGeoFromIP } = require('../../utils/geoIP');
const { getWeather } = require('../../utils/weather');

module.exports = async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const { lat, lon } = await getGeoFromIP(ip);

    const weather = await getWeather(lat, lon); // ✅ Fixed function name

    res.status(200).json({ success: true, data: [weather] });
  } catch (err) {
    console.error('[Weather API]', err);
    res.status(500).json({ error: 'Unable to fetch weather' });
  }
};
