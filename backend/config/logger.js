/**
 * Winston Logger Configuration
 * 
 * Comprehensive logging setup for the Mallgram backend application.
 * Provides structured logging with different levels, file rotation,
 * and console output for development.
 * 
 * Log Levels:
 * - error: Error messages that need immediate attention
 * - warn: Warning messages for potential issues
 * - info: General information about application flow
 * - debug: Detailed debugging information
 * 
 * @author Mallgram Backend Team
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += '\n' + JSON.stringify(meta, null, 2);
        }
        
        return msg;
    })
);

// Create transports array
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || 'info',
            format: consoleFormat
        })
    );
}

// File transport for all logs
transports.push(
    new DailyRotateFile({
        filename: path.join(logsDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        format: logFormat,
        level: process.env.LOG_LEVEL || 'info'
    })
);

// Error-only file transport
transports.push(
    new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        format: logFormat,
        level: 'error'
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'mallgram-backend',
        version: require('../package.json').version,
        environment: process.env.NODE_ENV || 'development'
    },
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

// Add performance timing utility
logger.startTimer = (label) => {
    const start = Date.now();
    return {
        done: (message = 'Operation completed') => {
            const duration = Date.now() - start;
            logger.info(`${message} [${label}]`, { duration: `${duration}ms` });
        }
    };
};

// Add request logging utility
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || 'anonymous'
    };
    
    if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
    } else {
        logger.info('HTTP Request', logData);
    }
};

// Add error logging utility
logger.logError = (error, context = {}) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        ...context
    };
    
    logger.error('Application Error', errorInfo);
};

// Add API call logging utility
logger.logApiCall = (service, endpoint, method, duration, statusCode, error = null) => {
    const logData = {
        service,
        endpoint,
        method,
        duration: `${duration}ms`,
        statusCode
    };
    
    if (error) {
        logger.error(`External API Error: ${service}`, { ...logData, error: error.message });
    } else if (statusCode >= 400) {
        logger.warn(`External API Warning: ${service}`, logData);
    } else {
        logger.info(`External API Call: ${service}`, logData);
    }
};

// Add database operation logging utility
logger.logDbOperation = (operation, table, duration, recordCount = null, error = null) => {
    const logData = {
        operation,
        table,
        duration: `${duration}ms`,
        recordCount
    };
    
    if (error) {
        logger.error(`Database Error: ${operation}`, { ...logData, error: error.message });
    } else {
        logger.info(`Database Operation: ${operation}`, logData);
    }
};

// Stream for Morgan HTTP logging (if needed)
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;
