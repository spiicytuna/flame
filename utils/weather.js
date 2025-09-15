const axios = require('axios');
const loadConfig = require('./loadConfig');
const Logger = require('./Logger');
const logger = new Logger();

const API_URL = 'https://api.weatherapi.com/v1/forecast.json';

// const API_KEY = process.env.WEATHER_API_KEY || ''; // swap with below if you want to pull the weather API key from the docker-compose
let API_KEY = '';

// cache
let weatherCache = {};
const WEATHER_TTL = (() => {
  let hours = parseInt(process.env.WEATHER_CACHE_HOURS || '1', 10);
  if (isNaN(hours) || hours < 1) hours = 1;
  if (hours > 23) hours = 23;
  return hours * 60 * 60 * 1000;
})();

function clearWeatherCache() {
  weatherCache = {};
  logger.log('[Weather] Cache cleared');
}

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
  // caching
  const key = `${lat},${lon}`;
  const now = Date.now();

  if (weatherCache[key] && (now - weatherCache[key].timestamp) < WEATHER_TTL) {
    logger.log(`[Weather] Serving from cache for coordinates ${key}`);
    return { ...weatherCache[key].data, source: 'cache' };
  }

  // no key => return null
  const apiKey = await getAPIKey();
  if (!apiKey) return null;

  const url = `${API_URL}?key=${apiKey}&q=${lat},${lon}&aqi=no`;

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (!data?.current) {
      throw new Error(data.error?.message || 'Weather fetch failed');
    }

    const weatherData = {
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

    // store cache
    weatherCache[key] = {
      data: weatherData,
      timestamp: now
    };
    logger.log(`[Weather] Fetched fresh data for coordinates ${key}`);

    return { ...weatherData, source: 'API' };
  } catch (err) {
    const errorMessage = err.response ? err.response.data.error.message : err.message;
    logger.log(`[${errorMessage}] [Weather] Failed to fetch weather:`, 'ERROR');
    throw new Error(errorMessage);
  }
}

module.exports = {
  getWeather,
  clearWeatherCache,
  WEATHER_TTL
};
