'use strict';

const up = async (query) => {
  const [cols] = await query.sequelize.query(`PRAGMA table_info(apps);`);
  const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'description');

  if (!hasColumn) {
    await query.sequelize.query(`
      ALTER TABLE apps ADD COLUMN description VARCHAR(255) NOT NULL DEFAULT '';
    `);
  }
};

const down = async (query) => {};

module.exports = { up, down };
