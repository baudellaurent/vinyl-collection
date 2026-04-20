const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_KEY;
const API_KEY = process.env.API_KEY;

/**
 * Auth middleware — accepts either:
 * 1. x-api-key header (legacy, for internal use)
 * 2. Authorization: Bearer <jwt> header (frontend login)
 *
 * Attaches req.authMode = 'personal' | 'test' to the request.
 */
function auth(req, res, next) {
  // 1. Check JWT Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.authMode = decoded.mode; // 'personal' or 'test'
      req.authUser = decoded.username;
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
