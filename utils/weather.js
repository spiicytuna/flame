const fetch = require('node-fetch');
// const API_KEY = process.env.WEATHER_API_KEY || ''; // swap with below if you want to pull the weather API key from the docker-compose
const loadConfig = require('../utils/loadConfig');
const config = loadConfig();

const API_KEY = config.WEATHER_API_KEY || process.env.WEATHER_API_KEY || '';
if (!API_KEY) throw new Error('Missing WEATHER_API_KEY in config.json > add in Dashboard settings');

const API_URL = 'https://api.weatherapi.com/v1/current.json';

async function getWeather(lat, lon) {
  if (!API_KEY) throw new Error('Weather API key missing');

  const url = `${API_URL}?key=${API_KEY}&q=${lat},${lon}&aqi=no`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data?.current) {
    throw new Error(data.error?.message || 'Weather fetch failed');
  }

  return {
    temp: Math.round(data.current.temp_c),
    condition: data.current.condition.text,
    location: data.location.name,
    humidity: data.current.humidity,
  };
}

module.exports = {
  getWeather
};
