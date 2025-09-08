'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // isCollapsed exists ??
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'isCollapsed');

    // no isCollapsed => add
    if (!hasColumn) {
      await queryInterface.addColumn('categories', 'isCollapsed', {
	type: queryInterface.sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false, // 0 => show | 1 => collapsed
      });

      // CYA => backfill
      await queryInterface.sequelize.query(`
        UPDATE categories
        SET isCollapsed = 0
        WHERE isCollapsed IS NULL;
      `);
    }
  },

  down: async (queryInterface) => {
    // confirmation
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasColumn = Array.isArray(cols) && cols.some(c => c.name === 'isCollapsed');
    if (!hasColumn) return;

    // disable FK => SQLite workaround
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');

    // rename cur
    await queryInterface.sequelize.query(`
      ALTER TABLE categories RENAME TO categories_old;
    `);

    // recreate w/o isCollapsed
    await queryInterface.sequelize.query(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        isPinned TINYINT DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        orderId INTEGER DEFAULT NULL,
        isPublic INTEGER DEFAULT 1,
        section TEXT NOT NULL DEFAULT 'bookmarks',
        abbreviation VARCHAR(3) NOT NULL DEFAULT '—'
      );
    `);

    // copy data back => no isCollapsed data
    await queryInterface.sequelize.query(`
      INSERT INTO categories (id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section, abbreviation)
      SELECT id, name, isPinned, createdAt, updatedAt, orderId, isPublic, section, abbreviation
      FROM categories_old;
    `);

    // drop => enable FK
    await queryInterface.sequelize.query(`DROP TABLE categories_old;`);
    await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
  },
};
