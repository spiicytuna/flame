'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'isCollapsed');

    if (!hasColumn) {
      await queryInterface.sequelize.query(`
        ALTER TABLE categories
        ADD COLUMN isCollapsed BOOLEAN NOT NULL DEFAULT 0;
      `);

      await queryInterface.sequelize.query(`
        UPDATE categories
        SET isCollapsed = 0
        WHERE isCollapsed IS NULL;
      `);
    }
  },

  down: async (queryInterface) => {
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'isCollapsed');
    if (!hasColumn) return;

    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');
    await queryInterface.sequelize.query(`ALTER TABLE categories RENAME TO categories_old;`);
    await queryInterface.sequelize.query(`
      CREATE TABLE categories (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           VARCHAR(255) NOT NULL,
        isPinned       TINYINT DEFAULT 0,
        createdAt      DATETIME NOT NULL,
        updatedAt      DATETIME NOT NULL,
        orderId        INTEGER DEFAULT NULL,
        isPublic       INTEGER DEFAULT 1,
        section        TEXT NOT NULL DEFAULT 'bookmarks',
        abbreviation   VARCHAR(3) NOT NULL DEFAULT '—'
      );
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO categories (id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section, abbreviation)
      SELECT id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section, abbreviation
      FROM categories_old;
    `);
    await queryInterface.sequelize.query(`DROP TABLE categories_old;`);
    await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
  },
};
