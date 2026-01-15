const fs = require('fs');
const path = require('path');
const db = require('./db');

// Database migrations system
// Usage: node migrate.js [up|down|status]

const migrationsDir = path.join(__dirname, 'migrations');

// Ensure migrations table exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

function getAppliedMigrations() {
  return new Promise((resolve, reject) => {
    db.all('SELECT version FROM schema_migrations ORDER BY version', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.version));
    });
  });
}

function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }
  return fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function runMigrations() {
  try {
    const applied = await getAppliedMigrations();
    const allFiles = getMigrationFiles();
    const pending = allFiles.filter(f => !applied.includes(f));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Found ${pending.length} pending migrations:`);

    for (const file of pending) {
      console.log(`Applying: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Execute migration
      await new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Mark as applied
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO schema_migrations (version) VALUES (?)', [file], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`✓ Applied: ${file}`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

async function showStatus() {
  try {
    const applied = await getAppliedMigrations();
    const allFiles = getMigrationFiles();
    const pending = allFiles.filter(f => !applied.includes(f));

    console.log('\n=== Migration Status ===\n');
    console.log(`Applied migrations (${applied.length}):`);
    applied.forEach(v => console.log(`  ✓ ${v}`));

    console.log(`\nPending migrations (${pending.length}):`);
    pending.forEach(f => console.log(`  ⋯ ${f}`));
    console.log('');
  } catch (error) {
    console.error('Failed to get status:', error);
  } finally {
    db.close();
  }
}

const command = process.argv[2] || 'status';

switch (command) {
  case 'up':
    runMigrations();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('Usage: node migrate.js [up|status]');
    console.log('  up     - Apply pending migrations');
    console.log('  status - Show migration status');
    process.exit(1);
}
