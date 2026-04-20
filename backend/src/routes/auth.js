const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_KEY;
const JWT_EXPIRES = '24h';
const TEST_EXPIRES = '2h';

// Credentials from env
const ADMIN_USER = process.env.ADMIN_USER || 'Laurent';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.DB_PASSWORD;

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, mode: 'personal' }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Case-insensitive username check
  if (username.toLowerCase() !== ADMIN_USER.toLowerCase() || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: ADMIN_USER, mode: 'personal' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({ token, mode: 'personal', expiresIn: JWT_EXPIRES });
});

/**
 * POST /api/auth/test
 * Returns a test token (no credentials needed)
 */
router.post('/test', (req, res) => {
  const token = jwt.sign(
    { username: 'test', mode: 'test' },
    JWT_SECRET,
    { expiresIn: TEST_EXPIRES }
  );

  res.json({ token, mode: 'test', expiresIn: TEST_EXPIRES });
});

/**
 * GET /api/auth/verify
 * Verify token validity
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, mode: decoded.mode, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
