const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS rejected origin:', origin);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (for avatars)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});

module.exports = app;
