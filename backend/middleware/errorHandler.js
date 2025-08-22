/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling for the Mallgram backend application.
 * Provides consistent error responses and comprehensive logging.
 * 
 * Features:
 * - Standardized error response format
 * - Error logging with context
 * - Environment-specific error details
 * - Custom error types handling
 * - Security-conscious error messages
 * 
 * @author Mallgram Backend Team
 */

const logger = require('../config/logger');

/**
 * Custom error classes for different types of application errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

class ExternalServiceError extends AppError {
    constructor(service, message = 'External service error') {
        super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
        this.service = service;
    }
}

/**
 * Handle different types of known errors
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error response
 */
const handleKnownErrors = (error) => {
    // Supabase/PostgreSQL errors
    if (error.code && error.code.startsWith('23')) {
        if (error.code === '23505') {
            return new ConflictError('Resource already exists');
        }
        if (error.code === '23503') {
            return new ValidationError('Referenced resource does not exist');
        }
        if (error.code === '23502') {
            return new ValidationError('Required field is missing');
        }
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Invalid authentication token');
    }
    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Authentication token has expired');
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
        return new ValidationError(error.message);
    }
    
    // Axios/HTTP errors
    if (error.response) {
        const status = error.response.status;
        const service = error.config?.baseURL || 'External service';
        
        if (status >= 400 && status < 500) {
            return new ValidationError(`${service} client error: ${error.message}`);
        }
        if (status >= 500) {
            return new ExternalServiceError(service, error.message);
        }
    }
    
    // Return original error if not recognized
    return error;
};

/**
 * Format error response based on environment
 * @param {Error} error - The error object
 * @param {Express.Request} req - Express request object
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (error, req) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Base error response
    const errorResponse = {
        success: false,
        error: {
            message: error.message || 'An unexpected error occurred',
            code: error.code || 'INTERNAL_ERROR',
            timestamp: error.timestamp || new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        }
    };
    
    // Add field information for validation errors
    if (error.field) {
        errorResponse.error.field = error.field;
    }
    
    // Add service information for external service errors
    if (error.service) {
        errorResponse.error.service = error.service;
    }
    
    // Add detailed information in development
    if (isDevelopment) {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = {
            name: error.name,
            statusCode: error.statusCode,
            isOperational: error.isOperational
        };
        
        // Add request information for debugging
        errorResponse.debug = {
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
            user: req.user ? { id: req.user.id, email: req.user.email } : null
        };
    }
    
    // In production, hide sensitive error details for security
    if (isProduction && !error.isOperational) {
        errorResponse.error.message = 'An internal server error occurred';
        errorResponse.error.code = 'INTERNAL_ERROR';
    }
    
    return errorResponse;
};

/**
 * Log error with context information
 * @param {Error} error - The error object
 * @param {Express.Request} req - Express request object
 */
const logError = (error, req) => {
    const context = {
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || 'anonymous',
        statusCode: error.statusCode || 500,
        code: error.code || 'UNKNOWN_ERROR'
    };
    
    // Log based on error severity
    if (error.statusCode >= 500 || !error.isOperational) {
        logger.error('Server Error', {
            message: error.message,
            stack: error.stack,
            ...context
        });
    } else if (error.statusCode >= 400) {
        logger.warn('Client Error', {
            message: error.message,
            ...context
        });
    }
};

/**
 * Main error handling middleware
 * @param {Error} error - The error object
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }
    
    try {
        // Handle known error types
        const processedError = handleKnownErrors(error);
        
        // Set default status code if not provided
        const statusCode = processedError.statusCode || 500;
        
        // Log the error
        logError(processedError, req);
        
        // Format and send error response
        const errorResponse = formatErrorResponse(processedError, req);
        
        res.status(statusCode).json(errorResponse);
        
    } catch (handlerError) {
        // If error handler itself fails, log and send basic error
        logger.error('Error handler failed:', handlerError);
        
        res.status(500).json({
            success: false,
            error: {
                message: 'An unexpected error occurred',
                code: 'HANDLER_ERROR',
                timestamp: new Date().toISOString()
            }
        });
    }
};

/**
 * Handle async route errors
 * Wrapper function to catch async errors and pass them to error handler
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
    next(error);
};

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    
    // Middleware functions
    errorHandler,
    asyncHandler,
    notFoundHandler,
    
    // Utility functions
    handleKnownErrors,
    formatErrorResponse,
    logError
};
