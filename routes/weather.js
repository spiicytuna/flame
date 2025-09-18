const express = require('express');
const router = express.Router();
const { getWeather, getForecast } = require('../controllers/weather');
const { clearWeatherCache } = require('../utils/weather');

// Main weather API
router.get('/', getWeather);

// xx day forecast
router.get('/forecast', getForecast);

// clear cache
router.get('/update', (req, res) => {
  clearWeatherCache();
  res.status(200).json({ success: true, message: 'Weather cache cleared' });
});

module.exports = router;
