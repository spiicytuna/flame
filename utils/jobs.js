const schedule = require('node-schedule');

let hours = parseInt(process.env.WEATHER_CACHE_HOURS || '3', 10);

// Warn and cap if invalid
if (isNaN(hours) || hours < 1) {
  console.warn(`[WARN] WEATHER_CACHE_HOURS must be a positive number. Defaulting to 3.`);
  hours = 3;
} else if (hours >= 24) {
  console.warn(`[WARN] WEATHER_CACHE_HOURS=${hours} is too high for cron (max 23). Capping to 23 hours.`);
  hours = 23;
}

const interval = `0 */${hours} * * *`;

module.exports = async function () {
  schedule.scheduleJob('updateWeather', interval, () => {
    console.log(`[INFO] Weather refresh triggered every ${hours}h (cron interval: "${interval}")`);
    // Optional future refresh logic here
  });
};
