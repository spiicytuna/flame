const express = require('express');
const router = express.Router();
const getWather = require('../controllers/weather/getWather');

router.route('/').get(getWather);

module.exports = router;
