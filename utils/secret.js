const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./Logger');
const logger = new Logger();

const secretPath = path.join(__dirname, '..', 'data', 'secret.key');

const initializeSecret = () => {
  // If user set a SECRET in their environment => respect it
  if (process.env.SECRET && process.env.SECRET !== 'CHANGE_ME') {
    logger.log('Custom SECRET environment variable found. Using it.');
    return;
  }

  try {
    // secret file already exists => read it => set env var
    if (fs.existsSync(secretPath)) {
      const secret = fs.readFileSync(secretPath, 'utf-8').trim();
      process.env.SECRET = secret;
      logger.log('Secret key loaded from file.');
    } else {
      // no secret file => generate
      logger.log('No secret key found. Generating a new one...');
      const newSecret = crypto.randomBytes(64).toString('hex');

      // save secret
      fs.writeFileSync(secretPath, newSecret, 'utf-8');

      // set cur session env var
      process.env.SECRET = newSecret;
      logger.log(`New secret key generated and saved to ${secretPath}`);
    }
  } catch (err) {
    logger.error('CRITICAL: Could not load or generate a secret key.');
    logger.error(err);

    process.exit(1);
  }
};

module.exports = { initializeSecret };
