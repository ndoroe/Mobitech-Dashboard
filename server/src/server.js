const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken, requireActive } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');
const simRoutes = require('./routes/sims');
const reportRoutes = require('./routes/reports');
const preferencesRoutes = require('./routes/preferences');

// Import email scheduler
const { initializeEmailScheduler } = require('./utils/emailScheduler');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy (behind Cloudflare / Nginx Proxy Manager)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Let React handle CSP
  crossOriginEmbedderPolicy: false
}));

// Gzip compression
app.use(compression());

// HTTP request logging via morgan
const morganFormat = process.env.LOG_FORMAT || (isProduction ? 'combined' : 'dev');
app.use(morgan(morganFormat));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

logger.info('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (isProduction) {
      logger.warn('CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    } else {
      // Allow all origins in development
      logger.debug('CORS allowing unlisted origin (dev mode):', origin);
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (for avatars)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Public API Routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected API Routes (authentication required)
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', authenticateToken, requireActive, dashboardRoutes);
app.use('/api/sims', authenticateToken, requireActive, simRoutes);
app.use('/api/reports', authenticateToken, requireActive, reportRoutes);
app.use('/api/preferences', authenticateToken, requireActive, preferencesRoutes);

// Serve React build in production
if (isProduction) {
  const buildPath = path.join(__dirname, '../../build');
  app.use(express.static(buildPath));

  // All non-API routes serve React index.html (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // 404 Handler (development only — in prod, React handles unknown routes)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
}

// Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`CORS enabled for: ${process.env.CORS_ORIGIN}`);
  
  // Initialize email scheduler for daily reports
  initializeEmailScheduler();
});

// Graceful shutdown (PM2 sends SIGINT on restart/stop)
function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    const { pool } = require('./config/database');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
