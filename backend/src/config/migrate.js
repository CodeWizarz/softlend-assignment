const path = require('path');
const fs = require('fs');
const db = require('./database');

function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  db.exec('CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE, run_at TEXT DEFAULT (datetime(\'now\')))');

  const applied = new Set(
    db.prepare('SELECT name FROM migrations').all().map(r => r.name)
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[SKIP] ${file} — already applied`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
    console.log(`[OK]   ${file} — applied`);
  }

  console.log('\nMigrations complete.');
}

if (require.main === module) {
  runMigrations();
  process.exit(0);
}

module.exports = runMigrations;
