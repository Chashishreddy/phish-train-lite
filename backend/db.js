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
});

module.exports = db;
