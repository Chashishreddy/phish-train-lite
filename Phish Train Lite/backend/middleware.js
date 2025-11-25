const { verifyAccessToken } = require('./auth');
const db = require('./db');

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

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Check if user is still active
  const user = await runGet('SELECT * FROM users WHERE id = ? AND is_active = 1', [payload.id]);
  if (!user) {
    return res.status(403).json({ error: 'User account is inactive' });
  }

  req.user = {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: payload.role
  };

  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    }

    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role
      };
    }
  }

  next();
}

async function logAuditEvent(userId, username, action, resourceType, resourceId, details, ipAddress, userAgent) {
  try {
    await runExecute(
      'INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

function auditLog(action, resourceType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode < 400 && req.user) {
        const resourceId = req.params.id || data?.id || null;
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        logAuditEvent(
          req.user.id,
          req.user.username,
          action,
          resourceType,
          resourceId,
          { method: req.method, path: req.path, body: req.body },
          ipAddress,
          userAgent
        );
      }

      return originalJson(data);
    };

    next();
  };
}

function verifyCSRF(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const sessionToken = req.cookies?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  auditLog,
  verifyCSRF,
  logAuditEvent
};
