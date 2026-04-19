/**
 * Simple API key authentication middleware.
 * Checks the `x-api-key` request header against the API_KEY environment variable.
 */
function auth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!process.env.API_KEY) {
    console.warn('WARNING: API_KEY environment variable is not set. Auth is disabled.');
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = auth;
