/**
 * Main Express Server for Mallgram Backend
 * 
 * This is the entry point for the Mallgram e-commerce backend that serves
 * African markets with products from Chinese suppliers (Alibaba/AliExpress).
 * 
 * Key Features:
 * - RESTful API with Express.js
 * - Supabase integration for database and auth
 * - Payment gateway integrations (Kora Pay, MTN, Orange Money, etc.)
 * - AI chatbot with OpenAI integration
 * - Email notifications with Nodemailer
 * - Automated cron jobs for data synchronization
 * - Comprehensive logging and analytics
 * 
 * @author Mallgram Backend Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import custom modules
const logger = require('./config/logger');
const supabaseClient = require('./config/supabase');
const cronManager = require('./scripts/cron-manager');

// Import route handlers (only backend-specific features)
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/emails');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ===================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ===================================================================

// Enable security headers
if (process.env.HELMET_ENABLED === 'true') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
}

// Enable CORS with specific origins
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Enable compression for better performance
app.use(compression());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// ===================================================================
// HEALTH CHECK & STATUS ENDPOINTS
// ===================================================================

// Health check endpoint for load balancers and monitoring
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: require('./package.json').version
    });
});

// API status endpoint with database connectivity check
app.get('/api/status', async (req, res) => {
    try {
        // Test Supabase connection
        const { data, error } = await supabaseClient
            .from('users')
            .select('count')
            .limit(1);

        if (error) throw error;

        res.status(200).json({
            status: 'operational',
            database: 'connected',
            timestamp: new Date().toISOString(),
            services: {
                supabase: 'operational',
                openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
                email: process.env.SMTP_HOST ? 'configured' : 'not configured',
                cron: process.env.ENABLE_CRON_JOBS === 'true' ? 'enabled' : 'disabled'
            }
        });
    } catch (error) {
        logger.error('Status check failed:', error);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// ===================================================================
// API ROUTES
// ===================================================================

logger.info('Setting up API routes...');

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// Backend-specific routes only
app.use(`${API_PREFIX}/payments`, paymentRoutes);  // Payment processing
app.use(`${API_PREFIX}/ai`, aiRoutes);             // AI services
app.use(`${API_PREFIX}/emails`, emailRoutes);      // Email services

logger.info('API routes configured successfully');

logger.info('About to set up error handling...');

// Default API info endpoint
app.get(`${API_PREFIX}`, (req, res) => {
    res.json({
        name: 'Mallgram Backend API',
        version: process.env.API_VERSION || 'v1',
        description: 'Backend services for Mallgram e-commerce platform',
        endpoints: {
            payments: `${API_PREFIX}/payments`,
            ai: `${API_PREFIX}/ai`,
            emails: `${API_PREFIX}/emails`
        },
        documentation: 'https://docs.mallgram.org'
    });
});

// ===================================================================
// ERROR HANDLING
// ===================================================================

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use(errorHandler);

// ===================================================================
// SERVER STARTUP & GRACEFUL SHUTDOWN
// ===================================================================

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new requests
    if (typeof server !== 'undefined' && server) {
        server.close(() => {
            logger.info('HTTP server closed.');
            
            // Stop cron jobs
            if (process.env.ENABLE_CRON_JOBS === 'true') {
                cronManager.stopAllJobs();
                logger.info('Cron jobs stopped.');
            }
            
            // Close database connections if needed
            // supabaseClient doesn't need explicit closing
            
            logger.info('Graceful shutdown completed.');
            process.exit(0);
        });
        
        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    } else {
        logger.info('Server not started yet, exiting...');
        process.exit(0);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('About to start server...');

// Start the server
logger.info('Starting server...');
const server = app.listen(PORT, () => {
    logger.info(`🚀 Mallgram Backend Server started successfully!`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 Server running on port ${PORT}`);
    logger.info(`📚 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    logger.info(`🔧 Health Check: http://localhost:${PORT}/health`);
    
    logger.info('About to start cron jobs...');
    
    // Start cron jobs if enabled
    if (process.env.ENABLE_CRON_JOBS === 'true') {
        try {
            cronManager.startAllJobs();
            logger.info('🕒 Cron jobs started successfully');
        } catch (error) {
            logger.error('Failed to start cron jobs:', error);
        }
    }
    
    logger.info('='.repeat(60));
});

server.on('error', (error) => {
    logger.error('Server startup error:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason && reason.stack) {
        logger.error('Stack trace:', reason.stack);
    }
    process.exit(1);
});

module.exports = app;
