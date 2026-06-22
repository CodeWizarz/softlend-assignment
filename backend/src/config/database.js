const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const dbPath = process.env.DB_PATH || './data/softlend.db';
const fullPath = path.resolve(path.join(__dirname, '..', '..', dbPath));

const dir = path.dirname(fullPath);
if (!require('fs').existsSync(dir)) {
  require('fs').mkdirSync(dir, { recursive: true });
}

const db = new Database(fullPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
