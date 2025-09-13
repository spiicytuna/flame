'use strict';

const up = async (query) => {
  const [cols] = await query.sequelize.query(`PRAGMA table_info(weather);`);
  
  if (!cols.some(c => c.name === 'humidity')) {
    await query.sequelize.query(`ALTER TABLE weather ADD COLUMN humidity INTEGER;`);
  }
  if (!cols.some(c => c.name === 'windK')) {
    await query.sequelize.query(`ALTER TABLE weather ADD COLUMN windK FLOAT;`);
  }
  if (!cols.some(c => c.name === 'windM')) {
    await query.sequelize.query(`ALTER TABLE weather ADD COLUMN windM FLOAT;`);
  }
};

const down = async (query) => {};

module.exports = { up, down };
