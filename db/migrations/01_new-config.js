'use strict';
const { readFile, writeFile, copyFile } = require('fs/promises');

const up = async (query) => {
  // Check if the old 'config' table still exists
  const [tables] = await query.sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='config';"
  );

  if (!tables || tables.length === 0) {
    console.log('[INFO] Old `config` table not found, skipping 01_new-config migration.');
    return;
  }

  // Proceed with migration logic only if the table exists
  await copyFile('utils/init/initialConfig.json', 'data/config.json');
  const initConfigFile = await readFile('data/config.json', 'utf-8');
  const parsedNewConfig = JSON.parse(initConfigFile);
  
  const [existingConfig] = await query.sequelize.query('SELECT * FROM config');

  for (let pair of existingConfig) {
    const { key, value, valueType } = pair;
    let newValue = value;
    if (valueType == 'number') {
      newValue = parseFloat(value);
    } else if (valueType == 'boolean') {
      newValue = value == 1;
    }
    parsedNewConfig[key] = newValue;
  }

  const newConfig = JSON.stringify(parsedNewConfig);
  await writeFile('data/config.json', newConfig);
  await query.dropTable('config');
};

const down = async (query) => {};

module.exports = { up, down };
