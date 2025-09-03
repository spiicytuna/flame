'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if already exists
    const [cols] = await queryInterface.sequelize.query(
      "PRAGMA table_info('categories');"
    );
    const hasAbbrev = Array.isArray(cols) && cols.some(c => c.name === 'abbreviation');

    if (!hasAbbrev) {
      // Add the column with 3-char limit and em-dash default
      await queryInterface.addColumn('categories', 'abbreviation', {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: '—',
      });
    }

    // Backfill
    await queryInterface.sequelize.query(`
      UPDATE categories
      SET abbreviation = '—'
      WHERE abbreviation IS NULL OR TRIM(abbreviation) = '';
    `);
  },

  down: async (queryInterface /*, Sequelize */) => {
    // Only rebuild if the column exists (SQLite can't DROP COLUMN)
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
