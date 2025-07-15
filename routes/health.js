const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const LOG_PATH = '/app/log/access.log';
const CONFIG_PATH = '/app/data/config.json';
const DB_PATH = '/app/data/db.sqlite';

router.get('/', async (req, res) => {
  const debug = req.query.debug === 'true';
  const errors = [];
  let status = 'healthy';

  // 1. Check config.json exists
  if (!fs.existsSync(CONFIG_PATH)) {
    errors.push('Missing config.json');
  }

  // 2. Check database exists
  if (!fs.existsSync(DB_PATH)) {
    errors.push('Missing SQLite DB');
  }

  // 3. Check log dir and access.log exists
  if (!fs.existsSync(LOG_PATH)) {
    errors.push('Missing /app/log/access.log');
  }

  // 4. Check for errors in logs (last 100 lines, scan for "ERROR")
  let recentErrors = [];
  if (fs.existsSync(LOG_PATH)) {
    const lines = fs.readFileSync(LOG_PATH, 'utf-8').split('\n').reverse().slice(0, 100);
    recentErrors = lines.filter((line) => line.includes('ERROR') || line.includes('Failed'));
    if (recentErrors.length >= 5) {
      errors.push(`${recentErrors.length} recent error lines found`);
    }
  }

  if (errors.length > 0) {
    status = 'unhealthy';
  }

  const response = {
    status,
    errors,
  };

  if (debug && recentErrors.length > 0) {
    res.json({
      status,
      errors,
      recentErrorLines: recentErrors.join('\n')
    });
  }

  res.status(status === 'healthy' ? 200 : 503).json(response);
});

module.exports = router;
