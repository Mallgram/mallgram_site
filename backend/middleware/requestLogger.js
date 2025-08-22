/**
 * Request Logger Middleware
 * 
 * Logs incoming HTTP requests with detailed information including
 * timing, user context, and response metrics.
 * 
 * Features:
 * - Request/response timing
 * - User identification
 * - Request payload logging
 * - Performance monitoring
 * - Error tracking
 * 
 * @author Mallgram Backend Team
 */

const logger = require('../config/logger');

/**
 * Request logging middleware
 * Logs all incoming requests with timing and user context
 */
const requestLogger = (req, res, next) => {
    // Record request start time
    const startTime = Date.now();
    
    // Generate unique request ID
    req.requestId = generateRequestId();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override res.end to capture response metrics
    res.end = function(chunk, encoding) {
        // Calculate request duration
        const duration = Date.now() - startTime;
        
        // Prepare log data
        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: getClientIP(req),
            referer: req.get('Referer'),
            contentLength: res.get('Content-Length'),
            userId: req.user?.id || 'anonymous',
            userEmail: req.user?.email || 'anonymous',
            userRole: req.userRole || 'guest'
        };
        
        // Add query parameters if present
        if (Object.keys(req.query).length > 0) {
            logData.query = req.query;
        }
        
        // Add request body for POST/PUT/PATCH (excluding sensitive data)
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            logData.body = sanitizeRequestBody(req.body);
        }
        
        // Log based on response status
        if (res.statusCode >= 500) {
            logger.error('HTTP Request Error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP Request Warning', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
        
        // Performance monitoring for slow requests
        if (duration > 1000) {
            logger.warn('Slow Request Detected', {
                ...logData,
                performance: 'slow',
                threshold: '1000ms'
            });
        }
        
        // Call original end function
        originalEnd.call(this, chunk, encoding);
    };
    
    // Log incoming request
    logger.info('Incoming Request', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: getClientIP(req),
        userAgent: req.get('User-Agent')
    });
    
    next();
};

/**
 * Generate unique request ID
 * @returns {string} - Unique request identifier
 */
const generateRequestId = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Extract client IP address from request
 * @param {Express.Request} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
    return req.ip ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body object
 * @returns {Object} - Sanitized body object
 */
const sanitizeRequestBody = (body) => {
    if (!body || typeof body !== 'object') {
        return body;
    }
    
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'api_key',
        'apiKey',
        'auth',
        'authorization',
        'credit_card',
        'creditCard',
        'ssn',
        'social_security',
        'pin',
        'cvv',
        'cvt'
    ];
    
    const sanitized = { ...body };
    
    // Recursively sanitize nested objects
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        const result = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            
            // Check if field is sensitive
            const isSensitive = sensitiveFields.some(field => 
                lowerKey.includes(field.toLowerCase())
            );
            
            if (isSensitive) {
                result[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                result[key] = sanitizeObject(value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    };
    
    return sanitizeObject(sanitized);
};

/**
 * API endpoint-specific logger
 * For logging specific API operations with additional context
 */
const logApiOperation = (operation, details = {}) => {
    return (req, res, next) => {
        logger.info(`API Operation: ${operation}`, {
            requestId: req.requestId,
            operation,
            userId: req.user?.id,
            ...details
        });
        next();
    };
};

/**
 * Performance monitoring middleware
 * Tracks and logs performance metrics for specific routes
 */
const performanceMonitor = (threshold = 1000) => {
    return (req, res, next) => {
        const startTime = process.hrtime.bigint();
        
        // Override res.end to capture timing
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1000000;
            
            const perfData = {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                duration: `${durationMs.toFixed(2)}ms`,
                statusCode: res.statusCode,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            };
            
            // Log performance data
            if (durationMs > threshold) {
                logger.warn('Performance Alert', {
                    ...perfData,
                    alert: 'slow_request',
                    threshold: `${threshold}ms`
                });
            } else {
                logger.debug('Performance Monitor', perfData);
            }
            
            originalEnd.call(this, chunk, encoding);
        };
        
        next();
    };
};

/**
 * Error tracking middleware
 * Specifically for tracking and logging application errors
 */
const errorTracker = (req, res, next) => {
    // Add error tracking to request object
    req.trackError = (error, context = {}) => {
        logger.error('Tracked Error', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            userId: req.user?.id,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context
        });
    };
    
    next();
};

module.exports = {
    requestLogger,
    logApiOperation,
    performanceMonitor,
    errorTracker,
    generateRequestId,
    getClientIP,
    sanitizeRequestBody
};
