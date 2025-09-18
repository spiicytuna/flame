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

/**
 * Fetch from WeatherAPI and cache result.
 * - Uses cache unless forceFresh === true AND API succeeds.
 * - On API failure, will serve cached data if available.
 * @returns {{ data: {current: {...}, forecast: [...]}, source: 'API'|'cache' }}
 */
async function fetchAndCacheWeather(lat, lon, forceFresh = false, daysOverride) {
  if (!lat || !lon) throw new Error('Missing coordinates');

  const config = await loadConfig();
  const daysRaw = typeof daysOverride === 'number' ? daysOverride : (config.forecastDays || 5);
  // WeatherAPI free plan => max 3 days
  const days = Math.max(1, Math.min(10, daysRaw));

  const key = `${lat},${lon}|days=${days}`;
  const now = Date.now();
  const cached = weatherCache[key];

  // fresh enuf cache
  if (!forceFresh && cached && now - cached.timestamp < WEATHER_TTL) {
    return { data: cached.data, source: 'cache' };
  }

  const apiKey = await getAPIKey();
  const url = `${API_URL}?key=${apiKey}&q=${lat},${lon}&days=${days}&aqi=no&alerts=no`;

  try {
    const res = await axios.get(url, { timeout: 12_000 });
    const data = res.data;

    if (!data?.current || !data?.forecast?.forecastday) {
      throw new Error(data?.error?.message || 'Weather/Forecast fetch returned invalid payload');
    }

    const combinedData = {
      current: {
        id: 1,
        externalLastUpdate: data.current.last_updated,
        tempC: data.current.temp_c,
        tempF: data.current.temp_f,
        isDay: data.current.is_day,
        cloud: data.current.cloud,
        conditionText: data.current.condition.text,
        conditionCode: data.current.condition.code,
        humidity: data.current.humidity,
        windK: data.current.wind_kph,
        windM: data.current.wind_mph,
        location: data.location?.name,
        precip_mm: data.current.precip_mm,
        precip_in: data.current.precip_in,
        vis_km: data.current.vis_km,
        vis_miles: data.current.vis_miles,
        uv: data.current.uv,
        gust_kph: data.current.gust_kph,
        gust_mph: data.current.gust_mph,
      },
      forecast: data.forecast.forecastday.map((day) => ({
        date: day.date,
        tempC: day.day.avgtemp_c,
        tempF: day.day.avgtemp_f,
        conditionText: day.day.condition.text,
        conditionCode: day.day.condition.code,
	iconUrl: day.day.condition.icon,
      })),
    };

    // store in cache
    weatherCache[key] = { data: combinedData, timestamp: now };
    logger.log(`[Weather] Fetched and cached fresh data for ${key}`);
    return { data: combinedData, source: 'API' };
  } catch (err) {
    const message =
      err?.response?.data?.error?.message || err?.message || 'Weather fetch failed';

    if (cached?.data) {
      logger.log(`[${message}] [Weather] API failed; serving cached for ${key}`, 'WARN');
      return { data: cached.data, source: 'cache' };
    }
    const prefix = `${lat},${lon}|days=`;
    const altKey = Object.keys(weatherCache).find(k => k.startsWith(prefix));
    if (altKey && weatherCache[altKey]?.data) {
      logger.log(`[${message}] [Weather] API failed; serving alt cached key ${altKey}`, 'WARN');
      return { data: weatherCache[altKey].data, source: 'cache' };
    }
    
    logger.log(`[${message}] [Weather] Failed to fetch weather (no cache).`, 'ERROR');
    throw new Error(message);
  }
}

// cache => cur weather
async function getWeather(lat, lon) {
  const { data, source } = await fetchAndCacheWeather(lat, lon);
  return data ? { ...data.current, source } : null;
}

// cache => forecast
async function getForecast(lat, lon, forceFresh, days) {
  const { data, source } = await fetchAndCacheWeather(lat, lon, !!forceFresh, days);
  return data ? { data: data.forecast, source } : null;
}

module.exports = {
  getWeather,
  getForecast,
  clearWeatherCache,
  WEATHER_TTL,
};
