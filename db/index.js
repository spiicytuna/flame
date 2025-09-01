// db/index.js
const { Sequelize } = require('sequelize');
const { join } = require('path');
const Umzug = require('umzug');

// Utils
const backupDB = require('./utils/backupDb');
const Logger = require('../utils/Logger');
const logger = new Logger();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/db.sqlite',
  logging: false,
  // one connection is safest for sqlite
  pool: { max: 1, min: 0, idle: 10000, acquire: 30000 },
});

// log only once even if multiple connects happen
let fkLogOnce = false;

// ensure PRAGMA is applied on every new connection
sequelize.addHook('afterConnect', async (connection /*, config */) => {
  // for sqlite, `connection` is a sqlite3 Database object that supports `run`
  await new Promise((resolve, reject) => {
    connection.run('PRAGMA foreign_keys = ON;', (err) =>
      err ? reject(err) : resolve()
    );
  });
  if (!fkLogOnce) {
    logger.log('SQLite PRAGMA foreign_keys = ON');
    fkLogOnce = true;
  }
});

const umzug = new Umzug({
  migrations: {
    path: join(__dirname, './migrations'),
    params: [sequelize.getQueryInterface()],
  },
  storage: 'sequelize',
  storageOptions: { sequelize },
});

const connectDB = async () => {
  try {
    backupDB();

    await sequelize.authenticate();

    // run any pending migrations
    const pending = await umzug.pending();
    if (pending.length > 0) {
      logger.log('Executing pending migrations');
      await umzug.up();
    }

    logger.log('Connected to database');
  } catch (error) {
    logger.log(`Unable to connect to the database: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  sequelize,
};
