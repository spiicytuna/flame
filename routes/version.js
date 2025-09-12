const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function tryReadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

router.get('/', (_req, res) => {
  try {
    const root = path.resolve(__dirname, '..');

    // package.json
    const pkg = tryReadJSON(path.join(root, 'package.json')) || {};
    const name = typeof pkg?.name === 'string' ? pkg.name : null;
    const version = typeof pkg?.version === 'string' ? pkg.version : null;

    // client/versionCheck.json
    const cfg =
      tryReadJSON(path.join(root, 'public', 'versionCheck.json')) ||
      tryReadJSON(path.join(root, 'client', 'versionCheck.json')) ||
      {};

    // .env override
    const owner   = process.env.OWNER  || cfg.owner  || 'spiicytuna';
    const repo    = process.env.REPO   || cfg.repo   || 'flame';
    const branches = {
      stable: process.env.BRANCH_STABLE || cfg?.branches?.stable || 'master',
      dev:    process.env.BRANCH_DEV    || cfg?.branches?.dev    || 'tuna-combo',
    };

    res.json({ name, version, owner, repo, branches });
  } catch (error) {
    console.error('Failed to read version/config:', error);
    res.status(500).json({ error: 'Could not retrieve version', name: null, version: null });
  }
});

module.exports = router;
