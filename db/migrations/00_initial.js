'use strict';

const up = async (query) => {
  await query.sequelize.query(`
    CREATE TABLE config (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        VARCHAR(255) NOT NULL UNIQUE,
      value      VARCHAR(255) NOT NULL,
      valueType  VARCHAR(255) NOT NULL,
      isLocked   TINYINT DEFAULT 0,
      createdAt  DATETIME NOT NULL,
      updatedAt  DATETIME NOT NULL
    );
  `);

  await query.sequelize.query(`
    CREATE TABLE weather (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      externalLastUpdate   VARCHAR(255),
      tempC                FLOAT,
      tempF                FLOAT,
      isDay                INTEGER,
      cloud                INTEGER,
      conditionText        TEXT,
      conditionCode        INTEGER,
      createdAt            DATETIME NOT NULL,
      updatedAt            DATETIME NOT NULL
    );
  `);

  await query.sequelize.query(`
    CREATE TABLE categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       VARCHAR(255) NOT NULL,
      isPinned   TINYINT DEFAULT 0,
      createdAt  DATETIME NOT NULL,
      updatedAt  DATETIME NOT NULL,
      orderId    INTEGER DEFAULT NULL
    );
  `);

  await query.sequelize.query(`
    CREATE TABLE bookmarks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        VARCHAR(255) NOT NULL,
      url         VARCHAR(255) NOT NULL,
      categoryId  INTEGER NOT NULL,
      icon        VARCHAR(255) DEFAULT '',
      createdAt   DATETIME NOT NULL,
      updatedAt   DATETIME NOT NULL
    );
  `);

  await query.sequelize.query(`
    CREATE TABLE apps (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       VARCHAR(255) NOT NULL,
      url        VARCHAR(255) NOT NULL,
      icon       VARCHAR(255) NOT NULL DEFAULT 'cancel',
      isPinned   TINYINT DEFAULT 0,
      createdAt  DATETIME NOT NULL,
      updatedAt  DATETIME NOT NULL,
      orderId    INTEGER DEFAULT NULL
    );
  `);
};

const down = async (query) => {
  await query.dropTable('config');
  await query.dropTable('weather');
  await query.dropTable('categories');
  await query.dropTable('bookmarks');
  await query.dropTable('apps');
};

module.exports = { up, down };
