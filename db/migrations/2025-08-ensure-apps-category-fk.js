// Ensures apps.categoryId exists, is NOT NULL, indexed, and FK -> categories(id) with
// ON UPDATE CASCADE / ON DELETE RESTRICT. Idempotent for already-migrated DBs.

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      // 1) Make sure the "Uncategorized" (apps) category exists
      await sequelize.query(`
        INSERT INTO categories (name, isPinned, createdAt, updatedAt, orderId, isPublic, section)
        SELECT 'Uncategorized', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
               COALESCE((SELECT MAX(orderId)+1 FROM categories), 1),
               1, 'apps'
        WHERE NOT EXISTS (
          SELECT 1 FROM categories WHERE name='Uncategorized' AND section='apps'
        );
      `, { transaction: t });

      // 2) Does apps.categoryId exist?
      const [cols1] = await sequelize.query(`PRAGMA table_info('apps');`, { transaction: t });
      const hasCategoryId = Array.isArray(cols1) && cols1.some(c => c.name === 'categoryId');

      // If missing, add it (nullable for the moment)
      if (!hasCategoryId) {
        await sequelize.query(`ALTER TABLE apps ADD COLUMN categoryId INTEGER;`, { transaction: t });
      }

      // 3) Backfill any NULL categoryId with the "Uncategorized" apps category
      await sequelize.query(`
        UPDATE apps
        SET categoryId = (
          SELECT id FROM categories
          WHERE name='Uncategorized' AND section='apps'
          ORDER BY id LIMIT 1
        )
        WHERE categoryId IS NULL;
      `, { transaction: t });

      // 4) Check if FK already exists and column is NOT NULL
      const [fks] = await sequelize.query(`PRAGMA foreign_key_list('apps');`, { transaction: t });
      const hasFk = Array.isArray(fks) && fks.some(fk => fk.table === 'categories' && fk.from === 'categoryId');

      const [cols2] = await sequelize.query(`PRAGMA table_info('apps');`, { transaction: t });
      const catCol = Array.isArray(cols2) ? cols2.find(c => c.name === 'categoryId') : null;
      const isNotNull = !!catCol && catCol.notnull === 1;

      // 5) If NOT NULL constraint or FK are missing, rebuild table with proper schema
      if (!hasFk || !isNotNull) {
        await sequelize.query(`ALTER TABLE apps RENAME TO apps_old;`, { transaction: t });

        await sequelize.query(`
          CREATE TABLE apps (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        VARCHAR(255) NOT NULL,
            url         VARCHAR(255) NOT NULL,
            icon        VARCHAR(255) NOT NULL DEFAULT 'cancel',
            isPinned    TINYINT DEFAULT 0,
            createdAt   DATETIME NOT NULL,
            updatedAt   DATETIME NOT NULL,
            orderId     INTEGER DEFAULT NULL,
            isPublic    INTEGER DEFAULT 1,
            description VARCHAR(255) NOT NULL DEFAULT '',
            categoryId  INTEGER NOT NULL,
            FOREIGN KEY (categoryId) REFERENCES categories(id)
              ON UPDATE CASCADE
              ON DELETE RESTRICT
          );
        `, { transaction: t });

        await sequelize.query(`
          INSERT INTO apps
          (id, name, url, icon, isPinned, createdAt, updatedAt, orderId, isPublic, description, categoryId)
          SELECT id, name, url, icon, isPinned, createdAt, updatedAt, orderId, isPublic, description, categoryId
          FROM apps_old;
        `, { transaction: t });

        await sequelize.query(`DROP TABLE apps_old;`, { transaction: t });
      }

      // 6) Ensure index on apps(categoryId)
      const [idxList] = await sequelize.query(`PRAGMA index_list('apps');`, { transaction: t });
      const hasIndex = Array.isArray(idxList) && idxList.some(i => i.name === 'idx_apps_categoryId');
      if (!hasIndex) {
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_apps_categoryId ON apps(categoryId);`, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  // Down: remove the FK + NOT NULL by recreating the table with a nullable categoryId and no FK.
  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      await sequelize.query(`DROP INDEX IF EXISTS idx_apps_categoryId;`, { transaction: t });
      await sequelize.query(`ALTER TABLE apps RENAME TO apps_old;`, { transaction: t });

      await sequelize.query(`
        CREATE TABLE apps (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        VARCHAR(255) NOT NULL,
          url         VARCHAR(255) NOT NULL,
          icon        VARCHAR(255) NOT NULL DEFAULT 'cancel',
          isPinned    TINYINT DEFAULT 0,
          createdAt   DATETIME NOT NULL,
          updatedAt   DATETIME NOT NULL,
          orderId     INTEGER DEFAULT NULL,
          isPublic    INTEGER DEFAULT 1,
          description VARCHAR(255) NOT NULL DEFAULT '',
          categoryId  INTEGER
        );
      `, { transaction: t });

      await sequelize.query(`
        INSERT INTO apps
        (id, name, url, icon, isPinned, createdAt, updatedAt, orderId, isPublic, description, categoryId)
        SELECT id, name, url, icon, isPinned, createdAt, updatedAt, orderId, isPublic, description, categoryId
        FROM apps_old;
      `, { transaction: t });

      await sequelize.query(`DROP TABLE apps_old;`, { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
