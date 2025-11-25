require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const db = require('./db');
const templates = require('./templates');
const { createTransport } = require('./mailer');
const rateLimit = require('express-rate-limit');
const { isDomainAllowed, DO_NOT_SEND_DOMAINS } = require('./safety');
const { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry, generateCSRFToken } = require('./auth');
const { authenticateToken, requireRole, optionalAuth, auditLog, verifyCSRF, logAuditEvent } = require('./middleware');
const { encrypt, decrypt } = require('./encryption');
const { generateCampaignReport, generateEmployeeReport, generateDepartmentReport, generateRepeatOffendersReport } = require('./reports');

const app = express();
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests. Slow down to keep campaigns safe.'
});

app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ADMIN_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const textParser = express.text({ type: ['text/csv', 'text/plain'], limit: '2mb' });

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
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

function maskTemplate(body, data) {
  return body
    .replace(/{{name}}/g, data.name || 'Colleague')
    .replace(/{{department}}/g, data.department || 'your team');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded?.split(',')[0] || req.ip || 'unknown');
  return ip;
}

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createToken(input) {
  return crypto.createHash('sha256').update(input + Date.now().toString() + Math.random().toString()).digest('hex');
}

function decryptCampaignPassword(campaign) {
  if (campaign && campaign.smtp_pass) {
    try {
      campaign.smtp_pass = decrypt(campaign.smtp_pass);
    } catch (error) {
      console.error('Failed to decrypt SMTP password:', error);
      campaign.smtp_pass = '';
    }
  }
  return campaign;
}

async function ensureAllowlistEmails(emails) {
  if (!emails || !emails.length) {
    throw new Error('Recipients are required and must be on the allowlist.');
  }
  const placeholders = emails.map(() => '?').join(',');
  const rows = await runQuery(`SELECT email FROM employees WHERE email IN (${placeholders})`, emails);
  if (rows.length !== emails.length) {
    throw new Error('All recipients must exist in the allowlist.');
  }
  const invalid = emails.filter(email => !isDomainAllowed(email));
  if (invalid.length) {
    throw new Error(`Recipients contain forbidden domains: ${invalid.join(', ')}`);
  }
}

// ============ AUTHENTICATION ROUTES ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await runGet('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCSRFToken();

    // Store refresh token in database
    const expiresAt = getRefreshTokenExpiry();
    await runExecute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    // Update last login
    await runExecute('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

    // Log audit event
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    await logAuditEvent(user.id, user.username, 'LOGIN', 'auth', null, { success: true }, ipAddress, userAgent);

    // Set CSRF token in cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      refreshToken,
      csrfToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email already exists
    const existingUser = await runGet(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Default role is viewer unless specified (and first user can be admin)
    const userCount = await runGet('SELECT COUNT(*) as count FROM users');
    const userRole = userCount.count === 0 ? 'admin' : (role || 'viewer');

    // Insert new user
    const result = await runExecute(
      'INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, userRole, now, now]
    );

    // Get the created user
    const newUser = await runGet('SELECT * FROM users WHERE id = ?', [result.lastID]);

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    const csrfToken = generateCSRFToken();

    // Store refresh token in database
    const expiresAt = getRefreshTokenExpiry();
    await runExecute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [newUser.id, refreshToken, expiresAt]
    );

    // Log audit event
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    await logAuditEvent(newUser.id, newUser.username, 'REGISTER', 'auth', null, { success: true }, ipAddress, userAgent);

    // Set CSRF token in cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      csrfToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database
    const storedToken = await runGet(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > ?',
      [refreshToken, payload.id, new Date().toISOString()]
    );

    if (!storedToken) {
      return res.status(403).json({ error: 'Refresh token not found or expired' });
    }

    // Get user
    const user = await runGet('SELECT * FROM users WHERE id = ? AND is_active = 1', [payload.id]);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const expiresAt = getRefreshTokenExpiry();

    // Delete old refresh token and store new one
    await runExecute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    await runExecute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, newRefreshToken, expiresAt]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Delete refresh token if provided
    if (refreshToken) {
      await runExecute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    // Delete all expired tokens for this user
    await runExecute(
      'DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < ?',
      [req.user.id, new Date().toISOString()]
    );

    // Log audit event
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    await logAuditEvent(req.user.id, req.user.username, 'LOGOUT', 'auth', null, {}, ipAddress, userAgent);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await runGet('SELECT id, username, email, role, last_login, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.get('/api/auth/csrf', (req, res) => {
  const csrfToken = generateCSRFToken();
  res.cookie('csrfToken', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ csrfToken });
});

// ============ PROTECTED API ROUTES ============

app.get('/api/templates', authenticateToken, (req, res) => {
  res.json(templates);
});

// Email Preview Endpoint
app.post('/api/preview-email', authenticateToken, requireRole('admin', 'manager'), (req, res) => {
  try {
    const { templateKey, customSubject, customBody, sampleName, sampleDepartment } = req.body;

    // Find template or use custom content
    let subject = customSubject || '';
    let body = customBody || '';

    if (templateKey && !customSubject && !customBody) {
      const template = templates.find(t => t.key === templateKey);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      subject = template.subject;
      body = template.body;
    }

    // Sample data for preview
    const name = sampleName || 'John Doe';
    const department = sampleDepartment || 'IT Department';

    // Render template with sample data
    const renderedSubject = subject.replace(/\{\{name\}\}/g, name).replace(/\{\{department\}\}/g, department);
    const renderedBody = body.replace(/\{\{name\}\}/g, name).replace(/\{\{department\}\}/g, department);

    // Generate sample tracking link
    const sampleToken = 'preview-token-12345';
    const trackingLink = `${BASE_URL}/track/click/${sampleToken}`;

    res.json({
      subject: renderedSubject,
      body: renderedBody,
      trackingLink,
      sampleData: {
        name,
        department
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/allowlist', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const employees = await runQuery('SELECT email, name, department FROM employees ORDER BY email ASC');
    res.json({ employees, doNotSendDomains: DO_NOT_SEND_DOMAINS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/allowlist/:email', authenticateToken, requireRole('admin', 'manager'), auditLog('UPDATE_ALLOWLIST_ENTRY', 'allowlist'), async (req, res) => {
  try {
    const { email } = req.params;
    const { name, department } = req.body;

    await runExecute(
      'UPDATE employees SET name = ?, department = ? WHERE email = ?',
      [name || '', department || '', email]
    );

    res.json({ message: 'Employee updated', employee: { email, name, department } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/allowlist', authenticateToken, requireRole('admin', 'manager'), auditLog('ADD_ALLOWLIST_ENTRIES', 'allowlist'), async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees)) {
      return res.status(400).json({ error: 'employees array required' });
    }
    const stmt = db.prepare('INSERT OR REPLACE INTO employees(email, name, department) VALUES(?,?,?)');
    for (const entry of employees) {
      if (!entry.email) continue;
      if (!isDomainAllowed(entry.email)) {
        console.warn(`Rejected allowlist entry for forbidden domain: ${entry.email}`);
        continue;
      }
      stmt.run(entry.email.toLowerCase(), entry.name || '', entry.department || '');
    }
    stmt.finalize();
    const saved = await runQuery('SELECT email, name, department FROM employees ORDER BY email ASC');
    res.json({ employees: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/allowlist/upload', authenticateToken, requireRole('admin', 'manager'), textParser, auditLog('UPLOAD_ALLOWLIST_CSV', 'allowlist'), async (req, res) => {
  try {
    const csv = req.body;
    if (!csv) return res.status(400).json({ error: 'CSV body required' });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const employees = [];
    for (const line of lines) {
      const [email, name, department] = line.split(',').map(part => part.trim());
      if (!email) continue;
      if (!isDomainAllowed(email)) {
        console.warn(`Rejected CSV allowlist entry for forbidden domain: ${email}`);
        continue;
      }
      employees.push({ email: email.toLowerCase(), name: name || '', department: department || '' });
    }
    const stmt = db.prepare('INSERT OR REPLACE INTO employees(email, name, department) VALUES(?,?,?)');
    for (const entry of employees) {
      stmt.run(entry.email, entry.name, entry.department);
    }
    stmt.finalize();
    res.json({ imported: employees.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate and preview CSV before importing
app.post('/api/allowlist/validate-csv', authenticateToken, requireRole('admin', 'manager'), textParser, async (req, res) => {
  try {
    const csv = req.body;
    if (!csv) return res.status(400).json({ error: 'CSV body required' });

    const lines = csv.split(/\r?\n/).filter(Boolean);
    const validEntries = [];
    const invalidEntries = [];
    const rejectedDomains = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [email, name, department] = line.split(',').map(part => part.trim());

      if (!email) {
        invalidEntries.push({ line: i + 1, reason: 'Missing email', data: line });
        continue;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        invalidEntries.push({ line: i + 1, reason: 'Invalid email format', data: line });
        continue;
      }

      if (!isDomainAllowed(email)) {
        rejectedDomains.push({ line: i + 1, email, reason: 'Forbidden domain' });
        continue;
      }

      validEntries.push({ email: email.toLowerCase(), name: name || '', department: department || '' });
    }

    res.json({
      valid: validEntries,
      invalid: invalidEntries,
      rejected: rejectedDomains,
      summary: {
        total: lines.length,
        valid: validEntries.length,
        invalid: invalidEntries.length,
        rejected: rejectedDomains.length
      }
    });
  } catch (error) {
    console.error('Failed to validate CSV:', error);
    res.status(500).json({ error: error.message || 'Failed to validate CSV' });
  }
});

// Bulk delete allowlist entries
app.post('/api/allowlist/bulk-delete', authenticateToken, requireRole('admin', 'manager'), auditLog('BULK_DELETE_ALLOWLIST', 'allowlist'), async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    const placeholders = emails.map(() => '?').join(',');

    await runExecute(`DELETE FROM employees WHERE email IN (${placeholders})`, emails);

    res.json({ message: `${emails.length} employees deleted`, count: emails.length });
  } catch (error) {
    console.error('Failed to bulk delete allowlist entries:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk delete allowlist entries' });
  }
});

// Employee Groups Management
app.get('/api/groups', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const groups = await runQuery('SELECT * FROM employee_groups ORDER BY name ASC');

    // Get member count for each group
    for (const group of groups) {
      const members = await runQuery('SELECT email FROM employee_group_members WHERE group_id = ?', [group.id]);
      group.member_count = members.length;
      group.members = members.map(m => m.email);
    }

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups', authenticateToken, requireRole('admin', 'manager'), auditLog('CREATE_GROUP', 'group'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const now = new Date().toISOString();
    const result = await runExecute(
      'INSERT INTO employee_groups (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [name, description || '', now, now]
    );

    res.json({ id: result.lastID, name, description, member_count: 0, members: [] });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'A group with this name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put('/api/groups/:id', authenticateToken, requireRole('admin', 'manager'), auditLog('UPDATE_GROUP', 'group'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const now = new Date().toISOString();
    await runExecute(
      'UPDATE employee_groups SET name = ?, description = ?, updated_at = ? WHERE id = ?',
      [name, description || '', now, id]
    );

    res.json({ message: 'Group updated' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'A group with this name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/groups/:id', authenticateToken, requireRole('admin', 'manager'), auditLog('DELETE_GROUP', 'group'), async (req, res) => {
  try {
    const { id } = req.params;
    await runExecute('DELETE FROM employee_groups WHERE id = ?', [id]);
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups/:id/members', authenticateToken, requireRole('admin', 'manager'), auditLog('ADD_GROUP_MEMBERS', 'group'), async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    const stmt = db.prepare('INSERT OR IGNORE INTO employee_group_members (group_id, email) VALUES (?, ?)');
    for (const email of emails) {
      stmt.run(id, email.toLowerCase());
    }
    stmt.finalize();

    res.json({ message: `${emails.length} members added to group` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/groups/:id/members/:email', authenticateToken, requireRole('admin', 'manager'), auditLog('REMOVE_GROUP_MEMBER', 'group'), async (req, res) => {
  try {
    const { id, email } = req.params;
    await runExecute('DELETE FROM employee_group_members WHERE group_id = ? AND email = ?', [id, email]);
    res.json({ message: 'Member removed from group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Training Modules Management
app.get('/api/training/modules', authenticateToken, async (req, res) => {
  try {
    const modules = await runQuery('SELECT * FROM training_modules WHERE is_active = 1 ORDER BY category, title');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/training/modules', authenticateToken, requireRole('admin', 'manager'), auditLog('CREATE_TRAINING_MODULE', 'training'), async (req, res) => {
  try {
    const { title, description, content, duration_minutes, category } = req.body;
    const now = new Date().toISOString();

    const result = await runExecute(
      'INSERT INTO training_modules (title, description, content, duration_minutes, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', content || '', duration_minutes || 30, category || 'General', now, now]
    );

    res.json({ id: result.lastID, message: 'Training module created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Training Progress
app.get('/api/training/progress/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const progress = await runQuery(`
      SELECT p.*, m.title, m.description, m.duration_minutes, m.category
      FROM employee_training_progress p
      JOIN training_modules m ON p.module_id = m.id
      WHERE p.email = ?
      ORDER BY m.category, m.title
    `, [email]);

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/training/progress', authenticateToken, async (req, res) => {
  try {
    const { email, module_id, status, score } = req.body;
    const now = new Date().toISOString();

    const existing = await runGet('SELECT * FROM employee_training_progress WHERE email = ? AND module_id = ?', [email, module_id]);

    if (existing) {
      await runExecute(
        'UPDATE employee_training_progress SET status = ?, score = ?, completed_at = ? WHERE email = ? AND module_id = ?',
        [status, score || null, status === 'completed' ? now : null, email, module_id]
      );
    } else {
      await runExecute(
        'INSERT INTO employee_training_progress (email, module_id, status, started_at, completed_at, score) VALUES (?, ?, ?, ?, ?, ?)',
        [email, module_id, status, now, status === 'completed' ? now : null, score || null]
      );
    }

    // Issue certificate if completed
    if (status === 'completed') {
      const certCode = crypto.randomBytes(16).toString('hex');
      await runExecute(
        'INSERT OR IGNORE INTO certificates (email, module_id, certificate_code, issued_at) VALUES (?, ?, ?, ?)',
        [email, module_id, certCode, now]
      );
    }

    res.json({ message: 'Progress updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates
app.get('/api/certificates/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const certificates = await runQuery(`
      SELECT c.*, m.title as module_title
      FROM certificates c
      LEFT JOIN training_modules m ON c.module_id = m.id
      WHERE c.email = ?
      ORDER BY c.issued_at DESC
    `, [email]);

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Learning Resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resources = await runQuery('SELECT * FROM learning_resources WHERE is_active = 1 ORDER BY category, title');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/resources', authenticateToken, requireRole('admin', 'manager'), auditLog('CREATE_RESOURCE', 'resource'), async (req, res) => {
  try {
    const { title, description, resource_type, url, content, category } = req.body;
    const now = new Date().toISOString();

    const result = await runExecute(
      'INSERT INTO learning_resources (title, description, resource_type, url, content, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', resource_type || 'article', url || '', content || '', category || 'General', now]
    );

    res.json({ id: result.lastID, message: 'Resource created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhooks Management
app.get('/api/webhooks', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const webhooks = await runQuery('SELECT * FROM webhooks ORDER BY name');
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks', authenticateToken, requireRole('admin'), auditLog('CREATE_WEBHOOK', 'webhook'), async (req, res) => {
  try {
    const { name, url, events, secret } = req.body;
    const now = new Date().toISOString();

    const result = await runExecute(
      'INSERT INTO webhooks (name, url, events, secret, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, url, JSON.stringify(events || []), secret || '', now]
    );

    res.json({ id: result.lastID, message: 'Webhook created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slack Notifications
app.post('/api/notifications/slack', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { message, channel } = req.body;
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return res.status(400).json({ error: 'Slack webhook URL not configured' });
    }

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        channel: channel || '#phishing-alerts'
      })
    });

    res.json({ message: 'Slack notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled Reports
app.get('/api/reports/scheduled', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const reports = await runQuery('SELECT * FROM scheduled_reports ORDER BY name');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports/scheduled', authenticateToken, requireRole('admin'), auditLog('CREATE_SCHEDULED_REPORT', 'report'), async (req, res) => {
  try {
    const { name, report_type, schedule_cron, recipients } = req.body;
    const now = new Date().toISOString();

    const result = await runExecute(
      'INSERT INTO scheduled_reports (name, report_type, schedule_cron, recipients, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, report_type, schedule_cron, JSON.stringify(recipients || []), now]
    );

    res.json({ id: result.lastID, message: 'Scheduled report created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const campaigns = await runQuery('SELECT * FROM campaigns ORDER BY created_at DESC');
    for (const campaign of campaigns) {
      const targets = await runQuery('SELECT email FROM campaign_targets WHERE campaign_id = ?', [campaign.id]);
      campaign.recipient_count = targets.length;
    }
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns', authenticateToken, requireRole('admin', 'manager'), auditLog('CREATE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const {
      name,
      template_key,
      subject,
      recipients,
      scheduled_time,
      end_time,
      from_email,
      manager_email,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass
    } = req.body;

    await ensureAllowlistEmails(recipients);
    const template = templates.find(t => t.key === template_key);
    if (!template) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    const approval = 0;
    const enable_sending = 0;
    const now = new Date().toISOString();

    // Encrypt SMTP password if provided
    const encryptedSmtpPass = smtp_pass ? encrypt(smtp_pass) : '';

    const insertResult = await runExecute(`INSERT INTO campaigns(name, template_key, subject, scheduled_time, end_time, approval, enable_sending, smtp_host, smtp_port, smtp_user, smtp_pass, from_email, manager_email, status, created_at, updated_at, created_by)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      name,
      template_key,
      subject || template.subject,
      scheduled_time,
      end_time,
      approval,
      enable_sending,
      smtp_host || '',
      smtp_port || null,
      smtp_user || '',
      encryptedSmtpPass,
      from_email || '',
      manager_email || '',
      scheduled_time ? 'scheduled' : 'draft',
      now,
      now,
      req.user.id
    ]);
    const campaignId = insertResult.lastID;

    const employees = await runQuery('SELECT email, name, department FROM employees WHERE email IN (' + recipients.map(() => '?').join(',') + ')', recipients);
    const stmt = db.prepare('INSERT INTO campaign_targets(campaign_id, email, name, department, token) VALUES(?,?,?,?,?)');
    for (const employee of employees) {
      const token = createToken(employee.email + campaignId);
      stmt.run(campaignId, employee.email, employee.name, employee.department, token);
    }
    stmt.finalize();

    const created = await runGet('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
    res.json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/campaigns/:id', authenticateToken, requireRole('admin', 'manager'), auditLog('UPDATE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (['running', 'completed'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Cannot edit running or completed campaigns' });
    }

    const updateFields = [];
    const updateValues = [];
    const editable = ['name', 'template_key', 'subject', 'scheduled_time', 'end_time', 'from_email', 'manager_email', 'smtp_host', 'smtp_port', 'smtp_user'];
    for (const key of editable) {
      if (key in req.body) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    }

    // Handle smtp_pass separately to encrypt it
    if ('smtp_pass' in req.body) {
      updateFields.push('smtp_pass = ?');
      updateValues.push(req.body.smtp_pass ? encrypt(req.body.smtp_pass) : '');
    }

    if ('enable_sending' in req.body) {
      updateFields.push('enable_sending = ?');
      updateValues.push(req.body.enable_sending ? 1 : 0);
    }
    if ('approval' in req.body) {
      updateFields.push('approval = ?');
      updateValues.push(req.body.approval ? 1 : 0);
    }

    updateFields.push('updated_at = ?', 'updated_by = ?');
    updateValues.push(new Date().toISOString(), req.user.id, req.params.id);

    await runExecute(`UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    if (Array.isArray(req.body.recipients)) {
      await ensureAllowlistEmails(req.body.recipients);
      await runExecute('DELETE FROM campaign_targets WHERE campaign_id = ?', [req.params.id]);
      const employees = await runQuery('SELECT email, name, department FROM employees WHERE email IN (' + req.body.recipients.map(() => '?').join(',') + ')', req.body.recipients);
      const stmt = db.prepare('INSERT INTO campaign_targets(campaign_id, email, name, department, token) VALUES(?,?,?,?,?)');
      for (const employee of employees) {
        const token = createToken(employee.email + req.params.id);
        stmt.run(req.params.id, employee.email, employee.name, employee.department, token);
      }
      stmt.finalize();
    }

    const updated = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/approve', authenticateToken, requireRole('admin'), auditLog('APPROVE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    await runExecute('UPDATE campaigns SET approval = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), req.params.id]);
    const updated = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/send', authenticateToken, requireRole('admin'), auditLog('SEND_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    if (!campaign.approval) return res.status(400).json({ error: 'Campaign must be approved before sending' });
    await runExecute('UPDATE campaigns SET status = ?, scheduled_time = ?, updated_at = ? WHERE id = ?', [
      'scheduled',
      new Date().toISOString(),
      new Date().toISOString(),
      req.params.id
    ]);
    res.json({ message: 'Campaign queued for sending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/send-test', authenticateToken, requireRole('admin', 'manager'), auditLog('SEND_TEST_EMAIL', 'campaign'), async (req, res) => {
  try {
    const { testEmail, sampleName, sampleDepartment } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    decryptCampaignPassword(campaign);

    const template = templates.find(t => t.key === campaign.template_key);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Use sample data for personalization
    const sampleData = {
      name: sampleName || 'Test User',
      department: sampleDepartment || 'Test Department',
      email: testEmail
    };

    const personalizedBody = maskTemplate(template.body, sampleData);
    const htmlBody = personalizedBody.replace(/\n/g, '<br/>');

    // Create a test tracking token
    const testToken = createToken(`test-${testEmail}-${campaign.id}`);
    const baseTrackingUrl = process.env.PUBLIC_TRACKING_URL || BASE_URL;
    const trackingPixel = `<img src="${baseTrackingUrl}/track/open/${testToken}.gif" alt="" width="1" height="1" style="display:none;"/>`;
    const clickUrl = `${baseTrackingUrl}/track/click/${testToken}`;
    const html = `<p>${htmlBody}</p><p><a href="${clickUrl}">Access secure page</a></p>${trackingPixel}`;
    const text = `${personalizedBody}\n\nAccess secure page: ${clickUrl}`;

    const transport = createTransport(campaign);
    await transport.sendMail({
      to: testEmail,
      from: campaign.from_email || process.env.MAIL_FROM || 'security-training@example.com',
      subject: `[TEST] ${campaign.subject}`,
      text,
      html
    });

    res.json({
      message: 'Test email sent successfully',
      sentTo: testEmail,
      subject: `[TEST] ${campaign.subject}`
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

app.post('/api/campaigns/:id/clone', authenticateToken, requireRole('admin', 'manager'), auditLog('CLONE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const originalCampaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!originalCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get original campaign targets
    const originalTargets = await runQuery('SELECT email FROM campaign_targets WHERE campaign_id = ?', [req.params.id]);
    const recipients = originalTargets.map(t => t.email);

    // Create new campaign with cloned data
    const now = new Date().toISOString();
    const clonedName = `${originalCampaign.name} (Copy)`;

    const result = await runExecute(
      `INSERT INTO campaigns (
        name, template_key, subject, scheduled_time, end_time,
        from_email, manager_email, smtp_server, smtp_port, smtp_user, smtp_pass,
        status, approval, enable_sending, recipient_count,
        created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'draft', 0, 0, ?, ?, ?, ?, ?)`,
      [
        clonedName,
        originalCampaign.template_key,
        originalCampaign.subject,
        originalCampaign.from_email,
        originalCampaign.manager_email,
        originalCampaign.smtp_server,
        originalCampaign.smtp_port,
        originalCampaign.smtp_user,
        originalCampaign.smtp_pass, // Already encrypted
        recipients.length,
        req.user.id,
        req.user.id,
        now,
        now
      ]
    );

    const newCampaignId = result.lastID;

    // Clone campaign targets
    if (recipients.length > 0) {
      for (const email of recipients) {
        const emp = await runGet('SELECT * FROM employees WHERE email = ?', [email]);
        if (emp) {
          const token = createToken(newCampaignId + email);
          await runExecute(
            'INSERT INTO campaign_targets (campaign_id, email, name, department, token) VALUES (?, ?, ?, ?, ?)',
            [newCampaignId, email, emp.name, emp.department, token]
          );
        }
      }
    }

    res.json({
      message: 'Campaign cloned successfully',
      id: newCampaignId,
      name: clonedName
    });
  } catch (error) {
    console.error('Failed to clone campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to clone campaign' });
  }
});

app.post('/api/campaigns/:id/pause', authenticateToken, requireRole('admin'), auditLog('PAUSE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'completed') {
      return res.status(400).json({ error: 'Cannot pause a completed campaign' });
    }

    await runExecute(
      'UPDATE campaigns SET paused = 1, updated_at = ?, updated_by = ? WHERE id = ?',
      [new Date().toISOString(), req.user.id, req.params.id]
    );

    res.json({ message: 'Campaign paused', id: req.params.id });
  } catch (error) {
    console.error('Failed to pause campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to pause campaign' });
  }
});

app.post('/api/campaigns/:id/resume', authenticateToken, requireRole('admin'), auditLog('RESUME_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await runExecute(
      'UPDATE campaigns SET paused = 0, updated_at = ?, updated_by = ? WHERE id = ?',
      [new Date().toISOString(), req.user.id, req.params.id]
    );

    res.json({ message: 'Campaign resumed', id: req.params.id });
  } catch (error) {
    console.error('Failed to resume campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to resume campaign' });
  }
});

app.post('/api/campaigns/bulk-approve', authenticateToken, requireRole('admin'), auditLog('BULK_APPROVE_CAMPAIGNS', 'campaign'), async (req, res) => {
  try {
    const { campaignIds } = req.body;

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return res.status(400).json({ error: 'Campaign IDs array is required' });
    }

    const now = new Date().toISOString();
    const placeholders = campaignIds.map(() => '?').join(',');

    await runExecute(
      `UPDATE campaigns SET approval = 1, updated_at = ?, updated_by = ? WHERE id IN (${placeholders})`,
      [now, req.user.id, ...campaignIds]
    );

    res.json({ message: `${campaignIds.length} campaigns approved`, count: campaignIds.length });
  } catch (error) {
    console.error('Failed to bulk approve campaigns:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk approve campaigns' });
  }
});

app.post('/api/campaigns/bulk-delete', authenticateToken, requireRole('admin'), auditLog('BULK_DELETE_CAMPAIGNS', 'campaign'), async (req, res) => {
  try {
    const { campaignIds } = req.body;

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return res.status(400).json({ error: 'Campaign IDs array is required' });
    }

    const placeholders = campaignIds.map(() => '?').join(',');

    // Delete campaign targets and events first (foreign key constraints)
    await runExecute(`DELETE FROM campaign_targets WHERE campaign_id IN (${placeholders})`, campaignIds);
    await runExecute(`DELETE FROM campaign_events WHERE campaign_id IN (${placeholders})`, campaignIds);
    await runExecute(`DELETE FROM campaigns WHERE id IN (${placeholders})`, campaignIds);

    res.json({ message: `${campaignIds.length} campaigns deleted`, count: campaignIds.length });
  } catch (error) {
    console.error('Failed to bulk delete campaigns:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk delete campaigns' });
  }
});

async function getCampaignTargets(campaignId) {
  return runQuery('SELECT * FROM campaign_targets WHERE campaign_id = ?', [campaignId]);
}

async function recordEvent(campaignId, email, eventType, ip, simulatedEntry = 0, isSimulated = 0) {
  const ipHash = ip && ip !== 'unknown' && ip !== 'simulated' ? hashValue(ip) : null;
  await runExecute('INSERT INTO campaign_events(campaign_id, email, event_type, ip_hash, simulated_entry, is_simulated) VALUES(?,?,?,?,?,?)', [
    campaignId,
    email,
    eventType,
    ipHash,
    simulatedEntry,
    isSimulated
  ]);
}

async function notifyManagerHighClicks(campaign) {
  if (!campaign.manager_email) return;
  const totalDelivered = await runGet('SELECT COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND event_type = ? AND is_simulated = 0', [campaign.id, 'delivered']);
  const clickCount = await runGet('SELECT COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND event_type = ? AND is_simulated = 0', [campaign.id, 'clicked']);
  const delivered = totalDelivered?.count || 0;
  const clicks = clickCount?.count || 0;
  if (delivered === 0) return;
  const ratio = clicks / delivered;
  if (ratio >= 0.5 && !campaign.notified_high_clicks) {
    decryptCampaignPassword(campaign);
    const transport = createTransport(campaign);
    await transport.sendMail({
      to: campaign.manager_email,
      from: campaign.from_email || process.env.MAIL_FROM || 'security-training@example.com',
      subject: `[Awareness] High click-through alert for campaign ${campaign.name}`,
      text: `More than 50% of recipients clicked the simulation email. Please follow up with your team for additional coaching.`,
      html: `<p>More than 50% of recipients clicked the simulation email for <strong>${campaign.name}</strong>.</p><p>Please follow up with your team for additional coaching.</p>`
    });
    await runExecute('UPDATE campaigns SET notified_high_clicks = 1 WHERE id = ?', [campaign.id]);
    campaign.notified_high_clicks = 1;
  }
}

async function sendDebrief(campaign) {
  const targets = await getCampaignTargets(campaign.id);
  if (!targets.length) return;
  decryptCampaignPassword(campaign);
  const transport = createTransport(campaign);
  for (const target of targets) {
    await transport.sendMail({
      to: target.email,
      from: campaign.from_email || process.env.MAIL_FROM || 'security-training@example.com',
      subject: `Security Simulation Debrief: ${campaign.name}`,
      text: `This message is a debrief for the internal phishing awareness simulation "${campaign.name}". The exercise is complete, and no action is required. Review the learning resources at ${process.env.DEBRIEF_URL || 'https://intranet/security-awareness'}.`,
      html: `<p>This message is a debrief for the internal phishing awareness simulation <strong>${campaign.name}</strong>. The exercise is complete, and no action is required.</p><p>Review the learning resources at <a href="${process.env.DEBRIEF_URL || 'https://intranet/security-awareness'}">our security awareness page</a>.</p>`
    });
  }
}

async function checkScheduledCampaigns() {
  const now = new Date().toISOString();
  const campaigns = await runQuery('SELECT * FROM campaigns WHERE approval = 1 AND status IN ("scheduled", "draft") AND scheduled_time IS NOT NULL AND scheduled_time <= ? AND (paused IS NULL OR paused = 0)', [now]);
  for (const campaign of campaigns) {
    await runExecute('UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?', ['running', new Date().toISOString(), campaign.id]);
    await dispatchCampaign(campaign.id);
  }
}

async function checkDebriefs() {
  const now = new Date().toISOString();
  const campaigns = await runQuery('SELECT * FROM campaigns WHERE status = "running" AND end_time IS NOT NULL AND end_time <= ?', [now]);
  for (const campaign of campaigns) {
    await sendDebrief(campaign);
    await runExecute('UPDATE campaigns SET status = "completed", updated_at = ? WHERE id = ?', [new Date().toISOString(), campaign.id]);
  }
}

async function dispatchCampaign(campaignId) {
  const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
  if (!campaign) return;

  decryptCampaignPassword(campaign);

  const targets = await getCampaignTargets(campaignId);
  const template = templates.find(t => t.key === campaign.template_key);
  if (!template) return;
  const transport = createTransport(campaign);
  const baseTrackingUrl = process.env.PUBLIC_TRACKING_URL || BASE_URL;
  for (const target of targets) {
    const personalizedBody = maskTemplate(template.body, target);
    const htmlBody = personalizedBody.replace(/\n/g, '<br/>');
    const trackingPixel = `<img src="${baseTrackingUrl}/track/open/${target.token}.gif" alt="" width="1" height="1" style="display:none;"/>`;
    const clickUrl = `${baseTrackingUrl}/track/click/${target.token}`;
    const landingUrl = `${baseTrackingUrl}/landing/${target.token}`;
    const html = `<p>${htmlBody}</p><p><a href="${clickUrl}">Access secure page</a></p>${trackingPixel}`;
    const text = `${personalizedBody}\n\nAccess secure page: ${clickUrl}`;
    await transport.sendMail({
      to: target.email,
      from: campaign.from_email || process.env.MAIL_FROM || 'security-training@example.com',
      subject: campaign.subject,
      text,
      html
    });
    await recordEvent(campaignId, target.email, 'delivered', 'internal');
    await runExecute('UPDATE campaign_targets SET delivered = 1 WHERE id = ?', [target.id]);
  }
}

app.get('/track/open/:token.gif', async (req, res) => {
  try {
    const target = await runGet('SELECT * FROM campaign_targets WHERE token = ?', [req.params.token]);
    if (target) {
      await recordEvent(target.campaign_id, target.email, 'opened', getClientIp(req));
    }
  } catch (error) {
    console.error('Failed to record open', error);
  }
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.set('Content-Type', 'image/gif');
  res.send(pixel);
});

app.get('/track/click/:token', async (req, res) => {
  try {
    const target = await runGet('SELECT * FROM campaign_targets WHERE token = ?', [req.params.token]);
    if (target) {
      await recordEvent(target.campaign_id, target.email, 'clicked', getClientIp(req));
      const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [target.campaign_id]);
      await notifyManagerHighClicks(campaign);
      return res.redirect(`/landing/${target.token}`);
    }
  } catch (error) {
    console.error('Failed to record click', error);
  }
  res.redirect('/landing/invalid');
});

app.get('/landing/:token', async (req, res) => {
  const token = req.params.token;
  const debug = req.query.debug === 'true';
  const target = await runGet('SELECT * FROM campaign_targets WHERE token = ?', [token]);
  if (!target) {
    return res.send(`<html><body><h2>Simulation Completed</h2><p>This phishing awareness exercise is not active.</p></body></html>`);
  }
  const template = `<html><body><h2>Secure Portal</h2><p>Please confirm your details to proceed.</p><form method="POST" action="/landing/${token}/submit"><label>Email</label><input name="email" type="email" value="${target.email}" readonly/><br/><label>Employee ID</label><input name="employeeId" type="text"/><br/><button type="submit">Continue</button></form>${debug ? '<p>This is a security simulation. No credentials are stored.</p>' : ''}</body></html>`;
  res.send(template);
});

app.post('/landing/:token/submit', express.urlencoded({ extended: true }), async (req, res) => {
  const token = req.params.token;
  try {
    const target = await runGet('SELECT * FROM campaign_targets WHERE token = ?', [token]);
    if (!target) {
      return res.send(`<html><body><h2>Simulation Complete</h2><p>This training link is no longer active.</p></body></html>`);
    }
    await recordEvent(target.campaign_id, target.email, 'submitted', getClientIp(req), 1);
    res.send(`<html><body><h2>Security Simulation</h2><p>Thank you for participating. This was a controlled phishing awareness exercise. No credentials were captured. Review the learning resources on our <a href="${process.env.DEBRIEF_URL || 'https://intranet/security-awareness'}">security awareness page</a>.</p></body></html>`);
  } catch (error) {
    console.error('Failed to record submission', error);
    res.status(500).send('Error');
  }
});

app.get('/api/campaigns/:id/analytics', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Not found' });

    // Get real events (is_simulated = 0)
    const realTotals = await runQuery('SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 0 GROUP BY event_type', [req.params.id]);
    const realMap = realTotals.reduce((acc, curr) => {
      acc[curr.event_type] = curr.count;
      return acc;
    }, {});

    // Get simulated events (is_simulated = 1)
    const simTotals = await runQuery('SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 1 GROUP BY event_type', [req.params.id]);
    const simMap = simTotals.reduce((acc, curr) => {
      acc[curr.event_type] = curr.count;
      return acc;
    }, {});

    // Real event counts
    const delivered = realMap.delivered || 0;
    const opened = realMap.opened || 0;
    const clicked = realMap.clicked || 0;
    const submitted = realMap.submitted || 0;
    const openRate = delivered ? (opened / delivered) : 0;
    const clickRate = delivered ? (clicked / delivered) : 0;
    const submitRate = clicked ? (submitted / clicked) : 0;

    // Simulated event counts
    const simDelivered = simMap.delivered || 0;
    const simOpened = simMap.opened || 0;
    const simClicked = simMap.clicked || 0;
    const simSubmitted = simMap.submitted || 0;
    const simOpenRate = simDelivered ? (simOpened / simDelivered) : 0;
    const simClickRate = simDelivered ? (simClicked / simDelivered) : 0;
    const simSubmitRate = simClicked ? (simSubmitted / simClicked) : 0;

    res.json({
      // Real events
      delivered,
      opened,
      clicked,
      submitted,
      openRate,
      clickRate,
      submitRate,
      // Simulated events
      simDelivered,
      simOpened,
      simClicked,
      simSubmitted,
      simOpenRate,
      simClickRate,
      simSubmitRate,
      // Has simulated data flag
      hasSimulated: simDelivered > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Analytics Endpoints

// Get all employees with aggregate statistics
app.get('/api/analytics/employees', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    // Get all unique employees from the employees table
    const employees = await runQuery('SELECT email, name, department FROM employees ORDER BY name');

    // For each employee, calculate their aggregate statistics across all campaigns
    const employeeStats = await Promise.all(employees.map(async (emp) => {
      // Count total campaigns the employee was targeted in
      const totalCampaigns = await runGet(
        'SELECT COUNT(DISTINCT campaign_id) as count FROM campaign_targets WHERE email = ?',
        [emp.email]
      );

      // Get event counts (excluding simulated data)
      const eventCounts = await runQuery(
        'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE email = ? AND is_simulated = 0 GROUP BY event_type',
        [emp.email]
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const opened = eventMap.opened || 0;
      const clicked = eventMap.clicked || 0;
      const submitted = eventMap.submitted || 0;

      // Calculate rates
      const openRate = delivered ? (opened / delivered) : 0;
      const clickRate = delivered ? (clicked / delivered) : 0;
      const submitRate = clicked ? (submitted / clicked) : 0;

      // Calculate risk score (0-100, higher = riskier)
      // Weight: click = 40pts, submit = 60pts
      const riskScore = Math.min(100, Math.round(
        (clicked > 0 ? 40 : 0) + (submitted > 0 ? 60 : 0)
      ));

      // Get most recent activity
      const lastActivity = await runGet(
        'SELECT timestamp FROM campaign_events WHERE email = ? AND is_simulated = 0 ORDER BY timestamp DESC LIMIT 1',
        [emp.email]
      );

      return {
        email: emp.email,
        name: emp.name || emp.email,
        department: emp.department || 'Unknown',
        totalCampaigns: totalCampaigns.count,
        delivered,
        opened,
        clicked,
        submitted,
        openRate: Math.round(openRate * 100),
        clickRate: Math.round(clickRate * 100),
        submitRate: Math.round(submitRate * 100),
        riskScore,
        lastActivity: lastActivity?.timestamp || null
      };
    }));

    res.json(employeeStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed analytics for a specific employee
app.get('/api/analytics/employees/:email', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    // Get employee info
    const employee = await runGet('SELECT * FROM employees WHERE email = ?', [email]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get all campaigns this employee was targeted in
    const campaigns = await runQuery(`
      SELECT
        c.id,
        c.name,
        c.subject,
        c.scheduled_time,
        c.status,
        ct.delivered
      FROM campaigns c
      JOIN campaign_targets ct ON c.id = ct.campaign_id
      WHERE ct.email = ?
      ORDER BY c.scheduled_time DESC
    `, [email]);

    // For each campaign, get the employee's event history
    const campaignHistory = await Promise.all(campaigns.map(async (campaign) => {
      const events = await runQuery(
        'SELECT event_type, timestamp, is_simulated FROM campaign_events WHERE campaign_id = ? AND email = ? ORDER BY timestamp ASC',
        [campaign.id, email]
      );

      const eventMap = events.reduce((acc, curr) => {
        if (!acc[curr.event_type]) {
          acc[curr.event_type] = {
            timestamp: curr.timestamp,
            is_simulated: curr.is_simulated
          };
        }
        return acc;
      }, {});

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        subject: campaign.subject,
        scheduledTime: campaign.scheduled_time,
        status: campaign.status,
        delivered: campaign.delivered,
        opened: eventMap.opened ? true : false,
        openedAt: eventMap.opened?.timestamp || null,
        clicked: eventMap.clicked ? true : false,
        clickedAt: eventMap.clicked?.timestamp || null,
        submitted: eventMap.submitted ? true : false,
        submittedAt: eventMap.submitted?.timestamp || null,
        events: events.map(e => ({
          type: e.event_type,
          timestamp: e.timestamp,
          isSimulated: e.is_simulated === 1
        }))
      };
    }));

    // Calculate overall statistics
    const totalCampaigns = campaigns.length;
    const opened = campaignHistory.filter(c => c.opened).length;
    const clicked = campaignHistory.filter(c => c.clicked).length;
    const submitted = campaignHistory.filter(c => c.submitted).length;
    const delivered = campaigns.filter(c => c.delivered).length;

    const openRate = delivered ? (opened / delivered) : 0;
    const clickRate = delivered ? (clicked / delivered) : 0;
    const submitRate = clicked ? (submitted / clicked) : 0;

    // Risk trend (last 5 campaigns)
    const recentCampaigns = campaignHistory.slice(0, 5);
    const recentClicks = recentCampaigns.filter(c => c.clicked).length;
    const recentSubmits = recentCampaigns.filter(c => c.submitted).length;
    const riskTrend = recentCampaigns.length > 0
      ? Math.round(((recentClicks + recentSubmits * 2) / recentCampaigns.length) * 100)
      : 0;

    res.json({
      employee: {
        email: employee.email,
        name: employee.name || employee.email,
        department: employee.department || 'Unknown',
        createdAt: employee.created_at
      },
      statistics: {
        totalCampaigns,
        delivered,
        opened,
        clicked,
        submitted,
        openRate: Math.round(openRate * 100),
        clickRate: Math.round(clickRate * 100),
        submitRate: Math.round(submitRate * 100),
        riskTrend
      },
      campaignHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historical Trends and Comparison Endpoints

// Get campaign performance trends over time
app.get('/api/analytics/trends', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all campaigns within the time period
    const campaigns = await runQuery(
      'SELECT id, name, scheduled_time, status FROM campaigns WHERE scheduled_time >= ? ORDER BY scheduled_time ASC',
      [startDate.toISOString()]
    );

    // For each campaign, get its metrics
    const trendsData = await Promise.all(campaigns.map(async (campaign) => {
      const eventCounts = await runQuery(
        'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 0 GROUP BY event_type',
        [campaign.id]
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const opened = eventMap.opened || 0;
      const clicked = eventMap.clicked || 0;
      const submitted = eventMap.submitted || 0;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        scheduledTime: campaign.scheduled_time,
        status: campaign.status,
        delivered,
        opened,
        clicked,
        submitted,
        openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
        clickRate: delivered ? Math.round((clicked / delivered) * 100) : 0,
        submitRate: clicked ? Math.round((submitted / clicked) * 100) : 0
      };
    }));

    // Calculate aggregate trends
    const totalDelivered = trendsData.reduce((sum, c) => sum + c.delivered, 0);
    const totalOpened = trendsData.reduce((sum, c) => sum + c.opened, 0);
    const totalClicked = trendsData.reduce((sum, c) => sum + c.clicked, 0);
    const totalSubmitted = trendsData.reduce((sum, c) => sum + c.submitted, 0);

    res.json({
      period: days,
      totalCampaigns: trendsData.length,
      aggregate: {
        delivered: totalDelivered,
        opened: totalOpened,
        clicked: totalClicked,
        submitted: totalSubmitted,
        openRate: totalDelivered ? Math.round((totalOpened / totalDelivered) * 100) : 0,
        clickRate: totalDelivered ? Math.round((totalClicked / totalDelivered) * 100) : 0,
        submitRate: totalClicked ? Math.round((totalSubmitted / totalClicked) * 100) : 0
      },
      campaigns: trendsData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare multiple campaigns side by side
app.get('/api/analytics/compare', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const { ids } = req.query; // comma-separated campaign IDs
    if (!ids) {
      return res.status(400).json({ error: 'Campaign IDs required' });
    }

    const campaignIds = ids.split(',').map(id => parseInt(id.trim()));

    // Get campaign details and metrics for each
    const comparisons = await Promise.all(campaignIds.map(async (id) => {
      const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [id]);
      if (!campaign) return null;

      // Get event counts
      const eventCounts = await runQuery(
        'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 0 GROUP BY event_type',
        [id]
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const opened = eventMap.opened || 0;
      const clicked = eventMap.clicked || 0;
      const submitted = eventMap.submitted || 0;

      // Get department breakdown
      const deptBreakdown = await runQuery(`
        SELECT
          ct.department,
          COUNT(DISTINCT ct.email) as total,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'clicked' THEN ce.email END) as clicked,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'submitted' THEN ce.email END) as submitted
        FROM campaign_targets ct
        LEFT JOIN campaign_events ce ON ct.campaign_id = ce.campaign_id AND ct.email = ce.email AND ce.is_simulated = 0
        WHERE ct.campaign_id = ?
        GROUP BY ct.department
      `, [id]);

      return {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        scheduledTime: campaign.scheduled_time,
        status: campaign.status,
        metrics: {
          delivered,
          opened,
          clicked,
          submitted,
          openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
          clickRate: delivered ? Math.round((clicked / delivered) * 100) : 0,
          submitRate: clicked ? Math.round((submitted / clicked) * 100) : 0
        },
        departmentBreakdown: deptBreakdown.map(dept => ({
          department: dept.department || 'Unknown',
          total: dept.total,
          clicked: dept.clicked,
          submitted: dept.submitted,
          clickRate: dept.total ? Math.round((dept.clicked / dept.total) * 100) : 0,
          submitRate: dept.total ? Math.round((dept.submitted / dept.total) * 100) : 0
        }))
      };
    }));

    // Filter out null results (campaigns not found)
    const validComparisons = comparisons.filter(c => c !== null);

    res.json({
      campaigns: validComparisons,
      summary: {
        totalCampaigns: validComparisons.length,
        avgOpenRate: validComparisons.length > 0
          ? Math.round(validComparisons.reduce((sum, c) => sum + c.metrics.openRate, 0) / validComparisons.length)
          : 0,
        avgClickRate: validComparisons.length > 0
          ? Math.round(validComparisons.reduce((sum, c) => sum + c.metrics.clickRate, 0) / validComparisons.length)
          : 0,
        avgSubmitRate: validComparisons.length > 0
          ? Math.round(validComparisons.reduce((sum, c) => sum + c.metrics.submitRate, 0) / validComparisons.length)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Department Risk Scoring Endpoint
app.get('/api/analytics/departments', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    // Get all unique departments from employees table
    const departments = await runQuery(
      'SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != "" ORDER BY department'
    );

    const deptStats = await Promise.all(departments.map(async (dept) => {
      const deptName = dept.department;

      // Get all employees in this department
      const employees = await runQuery(
        'SELECT email FROM employees WHERE department = ?',
        [deptName]
      );

      const employeeEmails = employees.map(e => e.email);
      if (employeeEmails.length === 0) {
        return null;
      }

      const placeholders = employeeEmails.map(() => '?').join(',');

      // Get aggregate event counts for this department (excluding simulated)
      const eventCounts = await runQuery(
        `SELECT event_type, COUNT(*) as count FROM campaign_events
         WHERE email IN (${placeholders}) AND is_simulated = 0
         GROUP BY event_type`,
        employeeEmails
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const opened = eventMap.opened || 0;
      const clicked = eventMap.clicked || 0;
      const submitted = eventMap.submitted || 0;

      // Calculate rates
      const openRate = delivered ? (opened / delivered) : 0;
      const clickRate = delivered ? (clicked / delivered) : 0;
      const submitRate = clicked ? (submitted / clicked) : 0;

      // Count repeat offenders (employees who clicked in multiple campaigns)
      const repeatOffenders = await runQuery(
        `SELECT email, COUNT(DISTINCT campaign_id) as campaigns_clicked
         FROM campaign_events
         WHERE email IN (${placeholders})
         AND event_type = 'clicked'
         AND is_simulated = 0
         GROUP BY email
         HAVING campaigns_clicked > 1`,
        employeeEmails
      );

      // Count high-risk employees (those who submitted credentials)
      const highRisk = await runQuery(
        `SELECT DISTINCT email FROM campaign_events
         WHERE email IN (${placeholders})
         AND event_type = 'submitted'
         AND is_simulated = 0`,
        employeeEmails
      );

      // Calculate department risk score (0-100)
      // Factors:
      // - Click rate: 0-40 points
      // - Submit rate: 0-40 points
      // - Repeat offender rate: 0-20 points
      const clickScore = Math.min(40, clickRate * 80); // Scale to 40 points max
      const submitScore = Math.min(40, submitRate * 80); // Scale to 40 points max
      const repeatScore = Math.min(20, (repeatOffenders.length / employeeEmails.length) * 100); // Scale to 20 points max
      const riskScore = Math.round(clickScore + submitScore + repeatScore);

      // Get recent trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentClicks = await runGet(
        `SELECT COUNT(*) as count FROM campaign_events ce
         JOIN campaigns c ON ce.campaign_id = c.id
         WHERE ce.email IN (${placeholders})
         AND ce.event_type = 'clicked'
         AND ce.is_simulated = 0
         AND c.scheduled_time >= ?`,
        [...employeeEmails, thirtyDaysAgo.toISOString()]
      );

      return {
        department: deptName,
        totalEmployees: employeeEmails.length,
        delivered,
        opened,
        clicked,
        submitted,
        openRate: Math.round(openRate * 100),
        clickRate: Math.round(clickRate * 100),
        submitRate: Math.round(submitRate * 100),
        repeatOffenders: repeatOffenders.length,
        highRiskEmployees: highRisk.length,
        riskScore,
        recentActivity: recentClicks.count
      };
    }));

    // Filter out null results and sort by risk score descending
    const validDepts = deptStats.filter(d => d !== null).sort((a, b) => b.riskScore - a.riskScore);

    // Calculate organization-wide summary
    const totalEmployees = validDepts.reduce((sum, d) => sum + d.totalEmployees, 0);
    const totalClicked = validDepts.reduce((sum, d) => sum + d.clicked, 0);
    const totalSubmitted = validDepts.reduce((sum, d) => sum + d.submitted, 0);
    const avgRiskScore = validDepts.length > 0
      ? Math.round(validDepts.reduce((sum, d) => sum + d.riskScore, 0) / validDepts.length)
      : 0;

    res.json({
      departments: validDepts,
      summary: {
        totalDepartments: validDepts.length,
        totalEmployees,
        highestRiskDept: validDepts.length > 0 ? validDepts[0].department : null,
        lowestRiskDept: validDepts.length > 0 ? validDepts[validDepts.length - 1].department : null,
        avgRiskScore,
        highRiskDepartments: validDepts.filter(d => d.riskScore >= 60).length,
        mediumRiskDepartments: validDepts.filter(d => d.riskScore >= 30 && d.riskScore < 60).length,
        lowRiskDepartments: validDepts.filter(d => d.riskScore < 30).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Repeat Offender Tracking Endpoint
app.get('/api/analytics/repeat-offenders', authenticateToken, requireRole('admin', 'manager', 'viewer'), async (req, res) => {
  try {
    const { minCampaigns = '2', eventType = 'clicked' } = req.query;
    const threshold = parseInt(minCampaigns);

    // Get employees who have performed the specified action in multiple campaigns
    const repeatOffenders = await runQuery(`
      SELECT
        ce.email,
        e.name,
        e.department,
        COUNT(DISTINCT ce.campaign_id) as campaign_count,
        COUNT(*) as total_events,
        MIN(ce.timestamp) as first_offense,
        MAX(ce.timestamp) as last_offense
      FROM campaign_events ce
      LEFT JOIN employees e ON ce.email = e.email
      WHERE ce.event_type = ? AND ce.is_simulated = 0
      GROUP BY ce.email
      HAVING campaign_count >= ?
      ORDER BY campaign_count DESC, last_offense DESC
    `, [eventType, threshold]);

    // For each repeat offender, get detailed campaign history
    const detailedOffenders = await Promise.all(repeatOffenders.map(async (offender) => {
      // Get list of campaigns they fell for
      const campaigns = await runQuery(`
        SELECT DISTINCT
          c.id,
          c.name,
          c.scheduled_time,
          ce.timestamp as event_timestamp,
          ce.event_type
        FROM campaign_events ce
        JOIN campaigns c ON ce.campaign_id = c.id
        WHERE ce.email = ? AND ce.is_simulated = 0
        ORDER BY ce.timestamp DESC
      `, [offender.email]);

      // Check if they've submitted credentials
      const hasSubmitted = await runGet(`
        SELECT COUNT(*) as count
        FROM campaign_events
        WHERE email = ? AND event_type = 'submitted' AND is_simulated = 0
      `, [offender.email]);

      // Get their latest activity
      const recentActivity = await runQuery(`
        SELECT event_type, timestamp
        FROM campaign_events
        WHERE email = ? AND is_simulated = 0
        ORDER BY timestamp DESC
        LIMIT 5
      `, [offender.email]);

      // Calculate risk score based on frequency and recency
      const daysSinceFirst = Math.floor((new Date() - new Date(offender.first_offense)) / (1000 * 60 * 60 * 24));
      const daysSinceLast = Math.floor((new Date() - new Date(offender.last_offense)) / (1000 * 60 * 60 * 24));
      const frequencyScore = Math.min(50, offender.campaign_count * 10); // Up to 50 points
      const recencyScore = Math.max(0, 30 - daysSinceLast); // Up to 30 points, decreases with time
      const severityScore = hasSubmitted.count > 0 ? 20 : 0; // 20 points if submitted credentials
      const riskScore = Math.round(frequencyScore + recencyScore + severityScore);

      return {
        email: offender.email,
        name: offender.name || offender.email,
        department: offender.department || 'Unknown',
        campaignCount: offender.campaign_count,
        totalEvents: offender.total_events,
        firstOffense: offender.first_offense,
        lastOffense: offender.last_offense,
        daysSinceFirst,
        daysSinceLast,
        hasSubmitted: hasSubmitted.count > 0,
        submittedCount: hasSubmitted.count,
        riskScore,
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          scheduledTime: c.scheduled_time,
          eventTimestamp: c.event_timestamp,
          eventType: c.event_type
        })),
        recentActivity: recentActivity.map(a => ({
          eventType: a.event_type,
          timestamp: a.timestamp
        }))
      };
    }));

    // Sort by risk score descending
    const sortedOffenders = detailedOffenders.sort((a, b) => b.riskScore - a.riskScore);

    // Calculate summary statistics
    const totalOffenders = sortedOffenders.length;
    const avgCampaignCount = totalOffenders > 0
      ? Math.round(sortedOffenders.reduce((sum, o) => sum + o.campaignCount, 0) / totalOffenders * 10) / 10
      : 0;
    const highRiskCount = sortedOffenders.filter(o => o.riskScore >= 60).length;
    const submittedCredentials = sortedOffenders.filter(o => o.hasSubmitted).length;

    // Department breakdown
    const deptBreakdown = {};
    sortedOffenders.forEach(o => {
      if (!deptBreakdown[o.department]) {
        deptBreakdown[o.department] = 0;
      }
      deptBreakdown[o.department]++;
    });

    const topDepartments = Object.entries(deptBreakdown)
      .map(([dept, count]) => ({ department: dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      offenders: sortedOffenders,
      summary: {
        totalOffenders,
        avgCampaignCount,
        highRiskCount,
        submittedCredentials,
        threshold,
        eventType
      },
      departmentBreakdown: topDepartments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF Report Generation Endpoints

// Generate Campaign PDF Report
app.get('/api/reports/campaign/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Get analytics data
    const eventCounts = await runQuery(
      'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 0 GROUP BY event_type',
      [req.params.id]
    );

    const eventMap = eventCounts.reduce((acc, curr) => {
      acc[curr.event_type] = curr.count;
      return acc;
    }, {});

    const delivered = eventMap.delivered || 0;
    const opened = eventMap.opened || 0;
    const clicked = eventMap.clicked || 0;
    const submitted = eventMap.submitted || 0;

    // Get simulated data
    const simEventCounts = await runQuery(
      'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND is_simulated = 1 GROUP BY event_type',
      [req.params.id]
    );

    const simEventMap = simEventCounts.reduce((acc, curr) => {
      acc[curr.event_type] = curr.count;
      return acc;
    }, {});

    const analytics = {
      delivered,
      opened,
      clicked,
      submitted,
      openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
      clickRate: delivered ? Math.round((clicked / delivered) * 100) : 0,
      submitRate: clicked ? Math.round((submitted / clicked) * 100) : 0,
      simDelivered: simEventMap.delivered || 0,
      simOpened: simEventMap.opened || 0,
      simClicked: simEventMap.clicked || 0,
      simSubmitted: simEventMap.submitted || 0,
      simOpenRate: simEventMap.delivered ? Math.round((simEventMap.opened / simEventMap.delivered) * 100) : 0,
      simClickRate: simEventMap.delivered ? Math.round((simEventMap.clicked / simEventMap.delivered) * 100) : 0,
      simSubmitRate: simEventMap.clicked ? Math.round((simEventMap.submitted / simEventMap.clicked) * 100) : 0,
      hasSimulated: (simEventMap.delivered || 0) > 0
    };

    const pdfBuffer = await generateCampaignReport(campaign, analytics);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaign.id}-report.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate Employee Analytics PDF Report
app.get('/api/reports/employees', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const employees = await runQuery('SELECT email, name, department FROM employees ORDER BY name');

    const employeeStats = await Promise.all(employees.map(async (emp) => {
      const eventCounts = await runQuery(
        'SELECT event_type, COUNT(*) as count FROM campaign_events WHERE email = ? AND is_simulated = 0 GROUP BY event_type',
        [emp.email]
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const clicked = eventMap.clicked || 0;
      const submitted = eventMap.submitted || 0;

      const clickRate = delivered ? Math.round((clicked / delivered) * 100) : 0;
      const riskScore = Math.min(100, Math.round((clicked > 0 ? 40 : 0) + (submitted > 0 ? 60 : 0)));

      return {
        email: emp.email,
        name: emp.name || emp.email,
        department: emp.department || 'Unknown',
        clickRate,
        riskScore
      };
    }));

    const pdfBuffer = await generateEmployeeReport(employeeStats);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="employee-analytics-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate Department Risk PDF Report
app.get('/api/reports/departments', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    // Reuse the department analytics logic
    const departments = await runQuery(
      'SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != "" ORDER BY department'
    );

    const deptStats = await Promise.all(departments.map(async (dept) => {
      const employees = await runQuery(
        'SELECT email FROM employees WHERE department = ?',
        [dept.department]
      );

      const employeeEmails = employees.map(e => e.email);
      if (employeeEmails.length === 0) return null;

      const placeholders = employeeEmails.map(() => '?').join(',');

      const eventCounts = await runQuery(
        `SELECT event_type, COUNT(*) as count FROM campaign_events
         WHERE email IN (${placeholders}) AND is_simulated = 0
         GROUP BY event_type`,
        employeeEmails
      );

      const eventMap = eventCounts.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {});

      const delivered = eventMap.delivered || 0;
      const clicked = eventMap.clicked || 0;

      const clickRate = delivered ? Math.round((clicked / delivered) * 100) : 0;

      const repeatOffenders = await runQuery(
        `SELECT COUNT(DISTINCT email) as count
         FROM (
           SELECT email, COUNT(DISTINCT campaign_id) as campaigns_clicked
           FROM campaign_events
           WHERE email IN (${placeholders})
           AND event_type = 'clicked'
           AND is_simulated = 0
           GROUP BY email
           HAVING campaigns_clicked > 1
         )`,
        employeeEmails
      );

      const riskScore = Math.round(Math.min(40, clickRate * 0.8) + Math.min(20, (repeatOffenders[0].count / employeeEmails.length) * 100));

      return {
        department: dept.department,
        totalEmployees: employeeEmails.length,
        clickRate,
        repeatOffenders: repeatOffenders[0].count,
        riskScore
      };
    }));

    const validDepts = deptStats.filter(d => d !== null).sort((a, b) => b.riskScore - a.riskScore);

    const departmentData = {
      departments: validDepts,
      summary: {
        totalDepartments: validDepts.length,
        totalEmployees: validDepts.reduce((sum, d) => sum + d.totalEmployees, 0),
        avgRiskScore: validDepts.length > 0
          ? Math.round(validDepts.reduce((sum, d) => sum + d.riskScore, 0) / validDepts.length)
          : 0,
        highRiskDepartments: validDepts.filter(d => d.riskScore >= 60).length,
        highestRiskDept: validDepts.length > 0 ? validDepts[0].department : null,
        lowestRiskDept: validDepts.length > 0 ? validDepts[validDepts.length - 1].department : null
      }
    };

    const pdfBuffer = await generateDepartmentReport(departmentData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="department-risk-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate Repeat Offenders PDF Report
app.get('/api/reports/repeat-offenders', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { minCampaigns = '2', eventType = 'clicked' } = req.query;

    // Reuse repeat offenders logic
    const repeatOffenders = await runQuery(`
      SELECT
        ce.email,
        e.name,
        e.department,
        COUNT(DISTINCT ce.campaign_id) as campaign_count,
        MIN(ce.timestamp) as first_offense,
        MAX(ce.timestamp) as last_offense
      FROM campaign_events ce
      LEFT JOIN employees e ON ce.email = e.email
      WHERE ce.event_type = ? AND ce.is_simulated = 0
      GROUP BY ce.email
      HAVING campaign_count >= ?
      ORDER BY campaign_count DESC, last_offense DESC
    `, [eventType, parseInt(minCampaigns)]);

    const detailedOffenders = await Promise.all(repeatOffenders.map(async (offender) => {
      const hasSubmitted = await runGet(`
        SELECT COUNT(*) as count
        FROM campaign_events
        WHERE email = ? AND event_type = 'submitted' AND is_simulated = 0
      `, [offender.email]);

      const daysSinceLast = Math.floor((new Date() - new Date(offender.last_offense)) / (1000 * 60 * 60 * 24));
      const riskScore = Math.min(100, offender.campaign_count * 10 + (hasSubmitted.count > 0 ? 20 : 0));

      return {
        email: offender.email,
        name: offender.name || offender.email,
        department: offender.department || 'Unknown',
        campaignCount: offender.campaign_count,
        lastOffense: offender.last_offense,
        daysSinceLast,
        hasSubmitted: hasSubmitted.count > 0,
        riskScore
      };
    }));

    const offendersData = {
      offenders: detailedOffenders.sort((a, b) => b.riskScore - a.riskScore),
      summary: {
        totalOffenders: detailedOffenders.length,
        avgCampaignCount: detailedOffenders.length > 0
          ? Math.round(detailedOffenders.reduce((sum, o) => sum + o.campaignCount, 0) / detailedOffenders.length * 10) / 10
          : 0,
        highRiskCount: detailedOffenders.filter(o => o.riskScore >= 60).length,
        submittedCredentials: detailedOffenders.filter(o => o.hasSubmitted).length,
        threshold: parseInt(minCampaigns),
        eventType
      }
    };

    const pdfBuffer = await generateRepeatOffendersReport(offendersData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="repeat-offenders-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

app.get('/api/campaigns/:id/export', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const rows = await runQuery('SELECT email, event_type, timestamp, simulated_entry FROM campaign_events WHERE campaign_id = ? ORDER BY timestamp ASC', [req.params.id]);
    const header = 'email,event_type,timestamp,simulated_entry\n';
    const csv = rows.map(row => `${row.email},${row.event_type},${row.timestamp},${row.simulated_entry}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campaign-results.csv"');
    res.send(header + csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/simulate', authenticateToken, requireRole('admin', 'manager'), auditLog('SIMULATE_CAMPAIGN', 'campaign'), async (req, res) => {
  try {
    const { openRate = 0.6, clickRate = 0.3, submitRate = 0.1 } = req.body;
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const targets = await getCampaignTargets(req.params.id);

    if (targets.length === 0) {
      return res.status(400).json({ error: 'Campaign has no targets' });
    }

    let stats = {
      targets: targets.length,
      delivered: 0,
      opened: 0,
      clicked: 0,
      submitted: 0
    };

    // Simulate events for each target
    for (const target of targets) {
      // Always deliver
      await recordEvent(campaign.id, target.email, 'delivered', 'simulated', 0, 1);
      stats.delivered++;

      // Simulate open based on openRate
      if (Math.random() < openRate) {
        await recordEvent(campaign.id, target.email, 'opened', 'simulated', 0, 1);
        stats.opened++;

        // Simulate click based on clickRate (conditional on open)
        if (Math.random() < clickRate) {
          await recordEvent(campaign.id, target.email, 'clicked', 'simulated', 0, 1);
          stats.clicked++;

          // Simulate submit based on submitRate (conditional on click)
          if (Math.random() < submitRate) {
            await recordEvent(campaign.id, target.email, 'submitted', 'simulated', 1, 1);
            stats.submitted++;
          }
        }
      }
    }

    // Check if threshold reached (this will only count real events, not simulated)
    await notifyManagerHighClicks(campaign);

    res.json({
      message: 'Simulation completed successfully',
      stats,
      rates: {
        openRate: stats.opened / stats.delivered,
        clickRate: stats.clicked / stats.delivered,
        submitRate: stats.clicked > 0 ? stats.submitted / stats.clicked : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/campaigns/:id/simulate', authenticateToken, requireRole('admin', 'manager'), auditLog('CLEAR_SIMULATED_DATA', 'campaign'), async (req, res) => {
  try {
    const result = await runExecute('DELETE FROM campaign_events WHERE campaign_id = ? AND is_simulated = 1', [req.params.id]);
    res.json({
      message: 'Simulated events cleared successfully',
      deleted: result.changes || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

setInterval(() => {
  checkScheduledCampaigns().catch(err => console.error('Scheduling error', err));
  checkDebriefs().catch(err => console.error('Debrief error', err));
}, 60000);

app.listen(PORT, () => {
  console.log(`Phishing awareness training API running on port ${PORT}`);
  console.log(`Ensure campaigns are approved before enabling delivery.`);
});
