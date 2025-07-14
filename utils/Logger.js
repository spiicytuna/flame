const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    const logDir = path.join('/app', 'log');

    // Ensure /app/log exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logFilePath = path.join(logDir, 'access.log');
  }

  log(message, level = 'INFO') {
    const formatted = `[${this.generateTimestamp()}] [${level}] ${message}`;

    // Write to stdout
    console.log(formatted);

    // Append to file
    fs.appendFile(this.logFilePath, formatted + '\n', err => {
      if (err) console.error(`[Logger] Failed to write log: ${err.message}`);
    });
  }

  generateTimestamp() {
    const d = new Date();

    const year = d.getFullYear();
    const month = this.pad(d.getMonth() + 1);
    const day = this.pad(d.getDate());

    const hour = this.pad(d.getHours());
    const minute = this.pad(d.getMinutes());
    const second = this.pad(d.getSeconds());
    const ms = this.pad(d.getMilliseconds(), true);

    const tz = -d.getTimezoneOffset() / 60;

    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} UTC${tz >= 0 ? '+' + tz : tz}`;
  }

  pad(value, isMs = false) {
    if (isMs) {
      if (value < 10) return `00${value}`;
      if (value < 100) return `0${value}`;
      return value.toString();
    }
    return value < 10 ? `0${value}` : value.toString();
  }
}

module.exports = Logger;
