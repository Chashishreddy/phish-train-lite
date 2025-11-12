const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const templates = require('./templates');
const { createTransport } = require('./mailer');
const rateLimit = require('express-rate-limit');
const { isDomainAllowed, DO_NOT_SEND_DOMAINS } = require('./safety');

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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ADMIN_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

app.get('/api/templates', (req, res) => {
  res.json(templates);
});

app.get('/api/allowlist', async (req, res) => {
  try {
    const employees = await runQuery('SELECT email, name, department FROM employees ORDER BY email ASC');
    res.json({ employees, doNotSendDomains: DO_NOT_SEND_DOMAINS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/allowlist', async (req, res) => {
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

app.post('/api/allowlist/upload', textParser, async (req, res) => {
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

app.get('/api/campaigns', async (req, res) => {
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

app.post('/api/campaigns', async (req, res) => {
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
    const insertResult = await runExecute(`INSERT INTO campaigns(name, template_key, subject, scheduled_time, end_time, approval, enable_sending, smtp_host, smtp_port, smtp_user, smtp_pass, from_email, manager_email, status, created_at, updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
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
      smtp_pass || '',
      from_email || '',
      manager_email || '',
      scheduled_time ? 'scheduled' : 'draft',
      now,
      now
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

app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (['running', 'completed'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Cannot edit running or completed campaigns' });
    }

    const updateFields = [];
    const updateValues = [];
    const editable = ['name', 'template_key', 'subject', 'scheduled_time', 'end_time', 'from_email', 'manager_email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'];
    for (const key of editable) {
      if (key in req.body) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    }

    if ('enable_sending' in req.body) {
      updateFields.push('enable_sending = ?');
      updateValues.push(req.body.enable_sending ? 1 : 0);
    }
    if ('approval' in req.body) {
      updateFields.push('approval = ?');
      updateValues.push(req.body.approval ? 1 : 0);
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(req.params.id);

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

app.post('/api/campaigns/:id/approve', async (req, res) => {
  try {
    await runExecute('UPDATE campaigns SET approval = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), req.params.id]);
    const updated = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns/:id/send', async (req, res) => {
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

async function getCampaignTargets(campaignId) {
  return runQuery('SELECT * FROM campaign_targets WHERE campaign_id = ?', [campaignId]);
}

async function recordEvent(campaignId, email, eventType, ip, simulatedEntry = 0) {
  const ipHash = ip && ip !== 'unknown' ? hashValue(ip) : null;
  await runExecute('INSERT INTO campaign_events(campaign_id, email, event_type, ip_hash, simulated_entry) VALUES(?,?,?,?,?)', [
    campaignId,
    email,
    eventType,
    ipHash,
    simulatedEntry
  ]);
}

async function notifyManagerHighClicks(campaign) {
  if (!campaign.manager_email) return;
  const totalDelivered = await runGet('SELECT COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND event_type = ?', [campaign.id, 'delivered']);
  const clickCount = await runGet('SELECT COUNT(*) as count FROM campaign_events WHERE campaign_id = ? AND event_type = ?', [campaign.id, 'clicked']);
  const delivered = totalDelivered?.count || 0;
  const clicks = clickCount?.count || 0;
  if (delivered === 0) return;
  const ratio = clicks / delivered;
  if (ratio >= 0.5 && !campaign.notified_high_clicks) {
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
  const campaigns = await runQuery('SELECT * FROM campaigns WHERE approval = 1 AND status IN ("scheduled", "draft") AND scheduled_time IS NOT NULL AND scheduled_time <= ?', [now]);
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

app.get('/api/campaigns/:id/analytics', async (req, res) => {
  try {
    const campaign = await runGet('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    const totals = await runQuery('SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? GROUP BY event_type', [req.params.id]);
    const map = totals.reduce((acc, curr) => {
      acc[curr.event_type] = curr.count;
      return acc;
    }, {});
    const delivered = map.delivered || 0;
    const opened = map.opened || 0;
    const clicked = map.clicked || 0;
    const submitted = map.submitted || 0;
    const openRate = delivered ? (opened / delivered) : 0;
    const clickRate = delivered ? (clicked / delivered) : 0;
    const submitRate = clicked ? (submitted / clicked) : 0;
    res.json({ delivered, opened, clicked, submitted, openRate, clickRate, submitRate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id/export', async (req, res) => {
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
