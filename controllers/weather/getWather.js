const fetch = require('node-fetch');
const { getGeoFromIP } = require('../../utils/geoIP'); // <- FIXED NAME

async function getWeatherFromAPI(lat, lon) {
  const API_KEY = process.env.WEATHER_API_KEY;
  if (!API_KEY) throw new Error('Missing WEATHER_API_KEY');

  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data.current) throw new Error('Weather API failed');

  const current = data.current;

  return {
    id: 1, // dummy ID
    externalLastUpdate: current.last_updated,
    tempC: current.temp_c,
    tempF: current.temp_f,
    isDay: current.is_day === 1,
    cloud: current.cloud,
    conditionText: current.condition.text,
    conditionCode: current.condition.code,
    humidity: current.humidity,
    windK: current.wind_kph,
    windM: current.wind_mph
  };
}

module.exports = async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const { lat, lon } = await getGeoFromIP(ip); // <- FIXED NAME
    const weather = await getWeatherFromAPI(lat, lon);

    res.status(200).json({ success: true, data: [weather] });
  } catch (err) {
    console.error('[Weather API]', err);
    res.status(500).json({ error: 'Unable to fetch weather' });
  }
};
