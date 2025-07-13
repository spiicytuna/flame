const schedule = require('node-schedule');
const interval = process.env.WEATHER_UPDATE_INTERVAL || '0 0 */3 * * *';

module.exports = async function () {
  schedule.scheduleJob('updateWeather', interval, () => {
    console.log(`[INFO] Weather refresh triggered by schedule: ${interval}`);
    // Put optional refresh logic here if needed
  });
};
