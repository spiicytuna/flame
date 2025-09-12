//  apps.categoryId exists ?? is NOT NULL ?? indexed ?? and FK -> categories(id)

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      // based on code... older db ! categories.section
      const [catCols0] = await sequelize.query(`PRAGMA table_info('categories');`, { transaction: t });
      const hasSection = Array.isArray(catCols0) && catCols0.some(c => c.name === 'section');
      if (!hasSection) {
        // add+backfill
        await sequelize.query(`ALTER TABLE categories ADD COLUMN section TEXT;`, { transaction: t });
        await sequelize.query(`
          UPDATE categories
          SET section = 'bookmarks'
          WHERE section IS NULL OR TRIM(section) = '';
        `, { transaction: t });
      }

      // Uncategorized exists ??
      await sequelize.query(`
        INSERT INTO categories (name, isPinned, createdAt, updatedAt, orderId, isPublic, section)
        SELECT 'Uncategorized', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
               COALESCE((SELECT MAX(orderId)+1 FROM categories), 1),
               1, 'apps'
        WHERE NOT EXISTS (
          SELECT 1 FROM categories WHERE name='Uncategorized' AND section='apps'
        );
      `, { transaction: t });

      // apps.categoryId exist ??
      const [cols1] = await sequelize.query(`PRAGMA table_info('apps');`, { transaction: t });
      const hasCategoryId = Array.isArray(cols1) && cols1.some(c => c.name === 'categoryId');

      if (!hasCategoryId) {
        await sequelize.query(`ALTER TABLE apps ADD COLUMN categoryId INTEGER;`, { transaction: t });
      }

      // backfill NULL => uncategorized
      await sequelize.query(`
        UPDATE apps
        SET categoryId = (
          SELECT id FROM categories
          WHERE name='Uncategorized' AND section='apps'
          ORDER BY id LIMIT 1
        )
        WHERE categoryId IS NULL;
      `, { transaction: t });

      const [fks] = await sequelize.query(`PRAGMA foreign_key_list('apps');`, { transaction: t });
      const hasFk = Array.isArray(fks) && fks.some(fk => fk.table === 'categories' && fk.from === 'categoryId');

      const [cols2] = await sequelize.query(`PRAGMA table_info('apps');`, { transaction: t });
      const catCol = Array.isArray(cols2) ? cols2.find(c => c.name === 'categoryId') : null;
      const isNotNull = !!catCol && catCol.notnull === 1;

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

      // index on apps(categoryId) ??
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
