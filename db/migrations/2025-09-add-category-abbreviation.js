'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasAbbrev = Array.isArray(cols) && cols.some(c => c.name === 'abbreviation');

    if (!hasAbbrev) {
      await queryInterface.sequelize.query(`
        ALTER TABLE categories
        ADD COLUMN abbreviation VARCHAR(3) NOT NULL DEFAULT '—';
      `);
    }

    await queryInterface.sequelize.query(`
      UPDATE categories
      SET abbreviation = '—'
      WHERE abbreviation IS NULL OR TRIM(abbreviation) = '';
    `);
  },

  down: async (queryInterface) => {
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasAbbrev = Array.isArray(cols) && cols.some(c => c.name === 'abbreviation');
    if (!hasAbbrev) return;

    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');
    await queryInterface.sequelize.query(`ALTER TABLE categories RENAME TO categories_old;`);
    await queryInterface.sequelize.query(`
      CREATE TABLE categories (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       VARCHAR(255) NOT NULL,
        isPinned   TINYINT DEFAULT 0,
        createdAt  DATETIME NOT NULL,
        updatedAt  DATETIME NOT NULL,
        orderId    INTEGER DEFAULT NULL,
        isPublic   INTEGER DEFAULT 1,
        section    TEXT
      );
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO categories (id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section)
      SELECT id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section
      FROM categories_old;
    `);
    await queryInterface.sequelize.query(`DROP TABLE categories_old;`);
    await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
  },
};
