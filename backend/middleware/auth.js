/**
 * Authentication Middleware
 * 
 * Handles JWT token validation and Supabase auth integration.
 * Provides role-based access control for different user types.
 * 
 * Features:
 * - JWT token validation
 * - Supabase user session verification
 * - Role-based authorization (admin, affiliate, user)
 * - Request rate limiting per user
 * 
 * @author Mallgram Backend Team
 */

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * Verify JWT token and extract user information
 * @param {string} token - JWT token from Authorization header
 * @returns {Object} - Decoded token payload
 */
const verifyJwtToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

/**
 * Get user from Supabase by ID
 * @param {string} userId - User ID from token
 * @returns {Object} - User object from database
 */
const getUserFromDatabase = async (userId) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        logger.error('Failed to fetch user from database:', error);
        throw new Error('User not found');
    }
    
    return user;
};

/**
 * Main authentication middleware
 * Validates JWT token and attaches user to request object
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Authorization header missing',
                message: 'Please provide a valid authentication token'
            });
        }
        
        // Check if header follows Bearer token format
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        if (!token) {
            return res.status(401).json({
                error: 'Token missing',
                message: 'Please provide a valid authentication token'
            });
        }
        
        // Verify JWT token
        let decodedToken;
        try {
            decodedToken = verifyJwtToken(token);
        } catch (error) {
            return res.status(401).json({
                error: 'Invalid token',
                message: error.message
            });
        }
        
        // Get user from database
        try {
            const user = await getUserFromDatabase(decodedToken.sub || decodedToken.userId);
            
            // Attach user to request object
            req.user = user;
            req.userId = user.id;
            req.userRole = user.is_admin ? 'admin' : (user.is_affiliate ? 'affiliate' : 'user');
            
            // Log successful authentication
            logger.info('User authenticated successfully', {
                userId: user.id,
                email: user.email,
                role: req.userRole,
                endpoint: req.originalUrl
            });
            
            next();
        } catch (error) {
            return res.status(401).json({
                error: 'User not found',
                message: 'The user associated with this token does not exist'
            });
        }
        
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin privileges
 */
const requireAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate before accessing admin resources'
            });
        }
        
        // Check if user has admin privileges
        if (!req.user.is_admin) {
            logger.warn('Unauthorized admin access attempt', {
                userId: req.user.id,
                email: req.user.email,
                endpoint: req.originalUrl
            });
            
            return res.status(403).json({
                error: 'Admin access required',
                message: 'You do not have permission to access this resource'
            });
        }
        
        // Additional check for admin role in admin table
        const { data: adminRecord, error } = await supabase
            .from('admins')
            .select('role')
            .eq('user_id', req.user.id)
            .single();
        
        if (error || !adminRecord) {
            return res.status(403).json({
                error: 'Admin verification failed',
                message: 'Admin credentials could not be verified'
            });
        }
        
        req.adminRole = adminRecord.role;
        
        logger.info('Admin access granted', {
            userId: req.user.id,
            adminRole: adminRecord.role,
            endpoint: req.originalUrl
        });
        
        next();
    } catch (error) {
        logger.error('Admin authorization error:', error);
        return res.status(500).json({
            error: 'Authorization failed',
            message: 'Internal server error during authorization'
        });
    }
};

/**
 * Affiliate authorization middleware
 * Requires user to be authenticated and have affiliate privileges
 */
const requireAffiliate = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate before accessing affiliate resources'
            });
        }
        
        // Check if user has affiliate privileges
        if (!req.user.is_affiliate) {
            return res.status(403).json({
                error: 'Affiliate access required',
                message: 'You do not have permission to access this resource'
            });
        }
        
        // Get affiliate record
        const { data: affiliateRecord, error } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
        
        if (error || !affiliateRecord) {
            return res.status(403).json({
                error: 'Affiliate verification failed',
                message: 'Affiliate credentials could not be verified'
            });
        }
        
        req.affiliate = affiliateRecord;
        
        next();
    } catch (error) {
        logger.error('Affiliate authorization error:', error);
        return res.status(500).json({
            error: 'Authorization failed',
            message: 'Internal server error during authorization'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user to request if authenticated, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            // No authentication provided, continue without user
            return next();
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        if (!token) {
            return next();
        }
        
        try {
            const decodedToken = verifyJwtToken(token);
            const user = await getUserFromDatabase(decodedToken.sub || decodedToken.userId);
            
            req.user = user;
            req.userId = user.id;
            req.userRole = user.is_admin ? 'admin' : (user.is_affiliate ? 'affiliate' : 'user');
        } catch (error) {
            // Invalid token, but continue without user
            logger.warn('Optional auth failed:', error.message);
        }
        
        next();
    } catch (error) {
        logger.error('Optional auth middleware error:', error);
        next(); // Continue without authentication
    }
};

/**
 * Super admin middleware
 * Requires user to be authenticated and have super admin role
 */
const requireSuperAdmin = async (req, res, next) => {
    try {
        // First check if user is admin
        await requireAdmin(req, res, () => {});
        
        if (req.adminRole !== 'super_admin') {
            return res.status(403).json({
                error: 'Super admin access required',
                message: 'This action requires super admin privileges'
            });
        }
        
        next();
    } catch (error) {
        logger.error('Super admin authorization error:', error);
        return res.status(500).json({
            error: 'Authorization failed',
            message: 'Internal server error during authorization'
        });
    }
};

module.exports = {
    authMiddleware,
    requireAdmin,
    requireAffiliate,
    requireSuperAdmin,
    optionalAuth
};
