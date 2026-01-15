const readline = require('readline');
const db = require('./db');
const { hashPassword } = require('./auth');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function runExecute(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function setupAdmin() {
  console.log('\n=== Phish Train Lite - Admin Setup ===\n');

  // Check if any admin already exists
  const existingAdmin = await runGet('SELECT * FROM users WHERE role = ?', ['admin']);

  if (existingAdmin) {
    console.log('An admin user already exists:');
    console.log(`  Username: ${existingAdmin.username}`);
    console.log(`  Email: ${existingAdmin.email}`);
    const overwrite = await question('\nDo you want to create another admin? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      process.exit(0);
    }
  }

  // Get admin details from environment or prompt
  let username = process.env.ADMIN_USERNAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!username) {
    username = await question('Enter admin username: ');
  }

  if (!email) {
    email = await question('Enter admin email: ');
  }

  if (!password) {
    password = await question('Enter admin password (min 8 characters): ');
  }

  // Validate inputs
  if (!username || username.length < 3) {
    console.error('Error: Username must be at least 3 characters long.');
    rl.close();
    process.exit(1);
  }

  if (!email || !email.includes('@')) {
    console.error('Error: Valid email address required.');
    rl.close();
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    rl.close();
    process.exit(1);
  }

  // Check if username or email already exists
  const existingUser = await runGet(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existingUser) {
    console.error('Error: Username or email already exists.');
    rl.close();
    process.exit(1);
  }

  // Hash password and create admin
  console.log('\nCreating admin user...');
  const passwordHash = await hashPassword(password);

  const result = await runExecute(
    'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
    [username, email, passwordHash, 'admin', 1]
  );

  console.log('\n✓ Admin user created successfully!');
  console.log(`  User ID: ${result.lastID}`);
  console.log(`  Username: ${username}`);
  console.log(`  Email: ${email}`);
  console.log(`  Role: admin`);
  console.log('\nYou can now log in with these credentials.');

  rl.close();
  process.exit(0);
}

setupAdmin().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
});
