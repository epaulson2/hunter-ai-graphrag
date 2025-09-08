const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint with database connectivity test
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'healthy',
      database: 'unknown'
    }
  };

  try {
    // Initialize Supabase service only after environment is loaded
    const supabaseService = require('./services/supabase');
    
    // Test database connection
    const dbHealth = await supabaseService.healthCheck();
    health.services.database = 'healthy';
    
  } catch (error) {
    health.status = 'degraded';
    health.services.database = 'unhealthy';
    health.services.database_error = error.message;
    logger.error('Database health check failed:', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed health check with database statistics
app.get('/health/detailed', async (req, res) => {
  try {
    const supabaseService = require('./services/supabase');
    
    const [healthCheck, systemMetrics] = await Promise.all([
      supabaseService.healthCheck(),
      supabaseService.getSystemMetrics()
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        statistics: systemMetrics
      }
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/articles', require('./routes/articles'));
app.use('/api/knowledge-graph', require('./routes/knowledge-graph'));
app.use('/api/business-partners', require('./routes/business-partners'));
app.use('/api/content-queue', require('./routes/content-queue'));
app.use('/api/article-business-mentions', require('./routes/article-business-mentions'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Hunter AI GraphRAG server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection on startup
  try {
    const supabaseService = require('./services/supabase');
    supabaseService.healthCheck()
      .then(result => {
        logger.info('Database connection verified successfully');
      })
      .catch(error => {
        logger.error('Database connection failed:', error.message);
      });
  } catch (error) {
    logger.error('Failed to initialize Supabase service:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;