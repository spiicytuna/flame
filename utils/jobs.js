const schedule = require('node-schedule');

console.log('[INFO] Weather DB update disabled. IP-based weather active.');

module.exports = async function () {
  schedule.scheduleJob('infoWeatherStub', '0 5 */4 * * *', () => {
    console.log('[INFO] No longer recording weather to SQLite. See /app/controllers/weather/getWather.js');
  });
};
