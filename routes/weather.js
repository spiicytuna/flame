const express = require('express');
const router = express.Router();
const getWather = require('../controllers/weather/getWather');
const { clearWeatherCache } = require('../Socket');

// Main weather API
router.get('/', getWather);

// Weather cache clearing endpoint
router.get('/update', (req, res) => {
  clearWeatherCache();
  res.status(200).json({ success: true, message: 'Weather cache cleared' });
});

module.exports = router;
