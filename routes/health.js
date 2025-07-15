// for those who prefer super indepth healthcheck vs. curl <address>:<port>
//
const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3');
const loadConfig = require('../utils/loadConfig');
const geoCache = require('../utils/geoCache'); // if your cache is modularized
const logger = require('../utils/Logger');

const router = express.Router();

router.get('/', async (req, res) => {
  const results = {};
  const dbPath = '/app/data/database.db';
  const configPath = '/app/data/config.json';
  const logDir = '/app/log';
  const accessLog = path.join(logDir, 'access.log');
  const geoCachePath = '/app/data/geo-cache.json'; // adjust if needed

  try {
    // 1. DB file exists
    results.dbExists = fs.existsSync(dbPath);

    // 2. DB access
    results.dbAccessible = false;
    if (results.dbExists) {
      await new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) reject(err);
          else {
            results.dbAccessible = true;
            db.close(resolve);
          }
        });
      });
    }

    // 3. Config exists
    results.configExists = fs.existsSync(configPath);

    // 4. Port 5005 (basic test: server responded to this request)
    results.portResponding = true;

    // 5. /app/log and access.log
    results.logDirExists = fs.existsSync(logDir);
    results.accessLogExists = fs.existsSync(accessLog);

    // 6. Recent errors in access.log
    results.recentErrors = [];
    if (results.accessLogExists) {
      const lines = fs.readFileSync(accessLog, 'utf-8').split('\n');
      results.recentErrors = lines
        .slice(-50)
        .filter((l) => l.includes('[ERROR]'));
    }

    // 7. GeoIP cache exists
    const config = await loadConfig();
    results.geoCacheExists = config.weatherMode === 'geoip' ? fs.existsSync(geoCachePath) : 'not_applicable';

    // 8. Last IP has cached coordinates
    if (config.weatherMode === 'geoip' && results.accessLogExists) {
      const lines = fs.readFileSync(accessLog, 'utf-8').split('\n');
      const ipLine = lines.reverse().find(l => l.includes('Socket: new connection from'));
      const match = ipLine?.match(/from ([\d.]+)/);
      const lastIp = match?.[1];

      if (lastIp && fs.existsSync(geoCachePath)) {
        const cache = JSON.parse(fs.readFileSync(geoCachePath));
        results.geoIpCached = !!cache[lastIp];
        results.geoIpLastQueried = lastIp;
      } else {
        results.geoIpCached = false;
      }
    } else {
      results.geoIpCached = 'not_applicable';
    }

    return res.status(200).json({ status: 'ok', ...results });
  } catch (err) {
    logger.log('[Healthcheck] Error during healthcheck: ' + err.message, 'ERROR');
    return res.status(500).json({ status: 'error', message: err.message, ...results });
  }
});

module.exports = router;
