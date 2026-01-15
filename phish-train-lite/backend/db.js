const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'phish-train-lite.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    email TEXT PRIMARY KEY,
    name TEXT,
    department TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_key TEXT NOT NULL,
    scheduled_time TEXT,
    end_time TEXT,
    approval INTEGER DEFAULT 0,
    enable_sending INTEGER DEFAULT 0,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    from_email TEXT,
    manager_email TEXT,
    notified_high_clicks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaign_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    department TEXT,
    token TEXT UNIQUE,
    delivered INTEGER DEFAULT 0,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaign_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_hash TEXT,
    simulated_entry INTEGER DEFAULT 0,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employee_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employee_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES employee_groups(id) ON DELETE CASCADE,
    FOREIGN KEY(email) REFERENCES employees(email) ON DELETE CASCADE,
    UNIQUE(group_id, email)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS training_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    duration_minutes INTEGER,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employee_training_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    module_id INTEGER NOT NULL,
    status TEXT DEFAULT 'not_started',
    started_at TEXT,
    completed_at TEXT,
    score INTEGER,
    FOREIGN KEY(email) REFERENCES employees(email) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
    UNIQUE(email, module_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS learning_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT,
    url TEXT,
    content TEXT,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    module_id INTEGER,
    certificate_code TEXT UNIQUE NOT NULL,
    issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(email) REFERENCES employees(email) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES training_modules(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    secret TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scheduled_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    schedule_cron TEXT NOT NULL,
    recipients TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_run TEXT,
    next_run TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add is_simulated column to campaign_events if it doesn't exist
  db.run(`PRAGMA table_info(campaign_events)`, [], (err, rows) => {
    if (err) return;
    db.all(`PRAGMA table_info(campaign_events)`, [], (err, columns) => {
      if (err) return;
      const hasSimulatedColumn = columns.some(col => col.name === 'is_simulated');
      if (!hasSimulatedColumn) {
        db.run(`ALTER TABLE campaign_events ADD COLUMN is_simulated INTEGER DEFAULT 0`);
      }
    });
  });

  // Add created_by and updated_by to campaigns table if they don't exist
  db.all(`PRAGMA table_info(campaigns)`, [], (err, columns) => {
    if (err) return;
    const hasCreatedBy = columns.some(col => col.name === 'created_by');
    const hasUpdatedBy = columns.some(col => col.name === 'updated_by');
    const hasPaused = columns.some(col => col.name === 'paused');
    const hasRecipientCount = columns.some(col => col.name === 'recipient_count');

    if (!hasCreatedBy) {
      db.run(`ALTER TABLE campaigns ADD COLUMN created_by INTEGER REFERENCES users(id)`);
    }
    if (!hasUpdatedBy) {
      db.run(`ALTER TABLE campaigns ADD COLUMN updated_by INTEGER REFERENCES users(id)`);
    }
    if (!hasPaused) {
      db.run(`ALTER TABLE campaigns ADD COLUMN paused INTEGER DEFAULT 0`);
    }
    if (!hasRecipientCount) {
      db.run(`ALTER TABLE campaigns ADD COLUMN recipient_count INTEGER DEFAULT 0`);
    }
  });
});

module.exports = db;
