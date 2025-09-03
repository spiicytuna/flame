const { Sequelize } = require('sequelize');
const { join } = require('path');
const fs = require('fs'); // NEW
const Umzug = require('umzug');

// Utils
const backupDB = require('./utils/backupDb');
const Logger = require('../utils/Logger');
const logger = new Logger();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/db.sqlite',
  logging: false,
});

const umzug = new Umzug({
  migrations: {
    path: join(__dirname, './migrations'),
    // Umzug v2 passes queryInterface as the 1st param to your migration functions
    params: [sequelize.getQueryInterface()],
    pattern: /\.js$/, // explicit, just in case
  },
  storage: 'sequelize',
  storageOptions: { sequelize },
});

const connectDB = async () => {
  try {
    backupDB();
    await sequelize.authenticate();

    // Enable FKs for this connection
    await sequelize.query('PRAGMA foreign_keys = ON;');
    logger.log('SQLite PRAGMA foreign_keys = ON');

    // ---- DEBUG: show what's on disk and what's pending/executed ----
    const migDir = join(__dirname, './migrations');
    let onDisk = [];
    try {
      onDisk = fs.readdirSync(migDir).filter((f) => f.endsWith('.js'));
    } catch (e) {
      // ignore
    }
    logger.log(`Migrations on disk: ${onDisk.length ? onDisk.join(', ') : '(none)'}`);

    const executed = await umzug.executed();
    logger.log(
      `Executed migrations: ${
        executed.length ? executed.map((m) => m.file).join(', ') : '(none)'
      }`
    );

    const pending = await umzug.pending();
    logger.log(
      `Pending migrations: ${
        pending.length ? pending.map((m) => m.file).join(', ') : '(none)'
      }`
    );

    if (pending.length > 0) {
      logger.log('Executing pending migrations');
      await umzug.up();
      logger.log('Migrations completed');
    } else {
      logger.log('No pending migrations');
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
