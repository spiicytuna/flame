'use strict';

const up = async (query) => {
  const [cols] = await query.sequelize.query(`PRAGMA table_info(bookmarks);`);
  const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'orderId');

  if (!hasColumn) {
    await query.sequelize.query(`
      ALTER TABLE bookmarks ADD COLUMN orderId INTEGER DEFAULT NULL;
    `);
  }
};

const down = async (query) => {};

module.exports = { up, down };
