/**
 * Supabase Database Configuration
 * 
 * This module configures and exports the Supabase client for database operations.
 * Supabase provides PostgreSQL database with real-time subscriptions, 
 * authentication, and storage capabilities.
 * 
 * Features:
 * - Database CRUD operations
 * - Real-time subscriptions
 * - Row Level Security (RLS)
 * - Authentication integration
 * - File storage
 * 
 * @author Mallgram Backend Team
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
    logger.error('SUPABASE_URL environment variable is required');
    process.exit(1);
}

if (!process.env.SUPABASE_ANON_KEY) {
    logger.error('SUPABASE_ANON_KEY environment variable is required');
    process.exit(1);
}

// Create Supabase client with configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabaseOptions = {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'X-Client-Info': 'mallgram-backend@1.0.0'
        }
    }
};

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);

// Test connection on startup
const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            logger.error('Supabase connection test failed:', error.message);
            return false;
        }
        
        logger.info('✅ Supabase connection established successfully');
        return true;
    } catch (error) {
        logger.error('Supabase connection error:', error.message);
        return false;
    }
};

// Test connection on module load (non-blocking)
testConnection();

/**
 * Service role client for admin operations
 * This client has elevated privileges and can bypass RLS
 */
const createServiceRoleClient = () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.warn('SUPABASE_SERVICE_ROLE_KEY not configured. Admin operations may be limited.');
        return null;
    }
    
    return createClient(
        supabaseUrl, 
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};

const supabaseAdmin = createServiceRoleClient();

/**
 * Helper function to handle Supabase errors
 * @param {Object} error - Supabase error object
 * @param {string} operation - Description of the operation that failed
 * @returns {Error} - Formatted error object
 */
const handleSupabaseError = (error, operation = 'database operation') => {
    logger.error(`Supabase ${operation} failed:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
    });
    
    // Return a user-friendly error message
    const userMessage = error.message || `${operation} failed`;
    const customError = new Error(userMessage);
    customError.code = error.code;
    customError.statusCode = error.statusCode || 500;
    
    return customError;
};

/**
 * Helper function to execute database queries with error handling
 * @param {Function} queryFunction - Supabase query function
 * @param {string} operation - Description of the operation
 * @returns {Promise} - Query result or throws error
 */
const executeQuery = async (queryFunction, operation = 'query') => {
    try {
        const result = await queryFunction();
        
        if (result.error) {
            throw handleSupabaseError(result.error, operation);
        }
        
        return result;
    } catch (error) {
        if (error.message && error.code) {
            // Already handled Supabase error
            throw error;
        }
        
        // Unexpected error
        logger.error(`Unexpected error during ${operation}:`, error);
        throw new Error(`${operation} failed unexpectedly`);
    }
};

/**
 * Database health check
 * @returns {Promise<boolean>} - True if database is healthy
 */
const healthCheck = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        
        return !error;
    } catch (error) {
        return false;
    }
};

module.exports = {
    supabase,
    supabaseAdmin,
    handleSupabaseError,
    executeQuery,
    healthCheck,
    testConnection
};
