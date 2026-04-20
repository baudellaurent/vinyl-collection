require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const collectionRoutes = require('./routes/collection');
const searchRoutes = require('./routes/search');
const discographyRoutes = require('./routes/discography');
const maintenanceRoutes = require('./routes/maintenance');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
}));
app.use(express.json());

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Stricter limiter for external API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests, please slow down.' },
});

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth middleware)
app.use('/api/auth', authRoutes);

// Routes
app.use('/api/collection', collectionRoutes);
app.use('/api/search', apiLimiter, searchRoutes);
app.use('/api/discography', apiLimiter, discographyRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Vinyl Collection API running on port ${PORT}`);
});

module.exports = app;
