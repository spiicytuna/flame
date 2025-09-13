'use strict';

const tables = ['categories', 'bookmarks', 'apps'];

const up = async (query) => {
  for await (let table of tables) {
    const [cols] = await query.sequelize.query(`PRAGMA table_info(${table});`);
    const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'isPublic');

    if (!hasColumn) {
      await query.sequelize.query(`
        ALTER TABLE ${table} ADD COLUMN isPublic INTEGER DEFAULT 1;
      `);
    }
  }
};

const down = async (query) => {};

module.exports = { up, down };
