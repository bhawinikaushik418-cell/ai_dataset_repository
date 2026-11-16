const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const { successResponse, errorResponse } = require('./utils/response');

// Route Handlers
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const datasetRoutes = require('./routes/dataset.routes');
const accessRoutes = require('./routes/access.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development Request Logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check API
app.get('/api/health', async (req, res) => {
  return successResponse(res, 200, 'AI Dataset Repository API is healthy and running.', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/access-requests', accessRoutes);
app.use('/api', reviewRoutes); // Handles /api/ratings and /api/reviews
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);

// 404 Route Not Found Handler
app.use((req, res) => {
  return errorResponse(res, 404, `API route not found: ${req.method} ${req.originalUrl}`);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Server Startup Function
async function startServer() {
  try {
    await testConnection();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` AI Dataset Repository Backend Server Online           `);
      console.log(` URL: http://localhost:${PORT}                           `);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}        `);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return server;
  } catch (error) {
    console.error('[Server] Failed to initialize backend server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
