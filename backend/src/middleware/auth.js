const jwt = require('jsonwebtoken');
const testStore = require('../services/testStore');

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_KEY;
const API_KEY = process.env.API_KEY;

function auth(req, res, next) {
  // 1. Check JWT Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.authMode = decoded.mode;
      req.authUser = decoded.username;
      req.authToken = token;
      // Init test session if needed
      if (decoded.mode === 'test') {
        testStore.initSession(token, decoded.exp * 1000);
      }
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
  }

  // 2. Check x-api-key (legacy)
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    req.authMode = 'personal';
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

module.exports = auth;
