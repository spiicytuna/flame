const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', async (req, res) => {
  try {
    // Construct the path to CHANGELOG.md in the project's root directory
    const changelogPath = path.join(__dirname, '../CHANGELOG.md');
    const changelogData = fs.readFileSync(changelogPath, 'utf8');
    res.type('text/plain').send(changelogData);
  } catch (error) {
    console.error('Error reading changelog:', error);
    res.status(500).send('Error reading changelog file');
  }
});

module.exports = router;
