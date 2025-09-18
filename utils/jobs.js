const schedule = require('node-schedule');
const Logger = require('./Logger');
const { clearWeatherCache } = require('./weather');
const logger = new Logger();

let hours = parseInt(process.env.WEATHER_CACHE_HOURS || '1', 10);

// Warn and cap if invalid
if (isNaN(hours) || hours < 1) {
  logger.log(`[WARN] WEATHER_CACHE_HOURS must be a positive number. Defaulting to 1.`, 'WARN');
  hours = 1;
} else if (hours >= 24) {
  logger.log(`[WARN] WEATHER_CACHE_HOURS=${hours} is too high for cron (max 23). Capping to 23 hours.`, 'WARN');
  hours = 23;
}

const interval = `0 */${hours} * * *`;

module.exports = async function () {
  // output => weather cache time
  logger.log(`[Weather] Cache is set to ${hours} hour(s). Can be changed with WEATHER_CACHE_HOURS=`);

  schedule.scheduleJob('updateWeather', interval, () => {
    logger.log(`[INFO] Weather cache cleared every ${hours}h and will be recreated on next page load. (cron interval: "${interval}")`);
    clearWeatherCache();
  });
}
