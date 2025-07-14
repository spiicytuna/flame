const fetch = require('node-fetch');
// const API_KEY = process.env.WEATHER_API_KEY || ''; // swap with below if you want to pull the weather API key from the docker-compose
const loadConfig = require('./loadConfig');

const API_URL = 'https://api.weatherapi.com/v1/current.json';

let API_KEY = ''; // cache the key once loaded

async function getAPIKey() {
  if (!API_KEY) {
    const config = await loadConfig();
    API_KEY = config.WEATHER_API_KEY || process.env.WEATHER_API_KEY || '';
    if (!API_KEY) {
      throw new Error('Missing WEATHER_API_KEY in config.json > add in Dashboard settings');
    }
  }
  return API_KEY;
}

async function getWeather(lat, lon) {
  const key = await getAPIKey();

  const url = `${API_URL}?key=${key}&q=${lat},${lon}&aqi=no`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || !data?.current) {
    throw new Error(data.error?.message || 'Weather fetch failed');
  }

  return {
    id: 1,
    externalLastUpdate: data.current.last_updated,
    tempC: data.current.temp_c,
    tempF: data.current.temp_f,
    isDay: data.current.is_day === 1,
    cloud: data.current.cloud,
    conditionText: data.current.condition.text,
    conditionCode: data.current.condition.code,
    humidity: data.current.humidity,
    windK: data.current.wind_kph,
    windM: data.current.wind_mph,
    location: data.location.name,
    precip_mm: data.current.precip_mm,
    precip_in: data.current.precip_in,
    vis_km: data.current.vis_km,
    vis_miles: data.current.vis_miles,
    uv: data.current.uv,
    gust_kph: data.current.gust_kph,
    gust_mph: data.current.gust_mph
  };
}

module.exports = {
  getWeather
};
