/**
 * Email Routes
 * 
 * Handles email sending services for the Mallgram platform.
 * Frontend will call these endpoints to send various types of emails.
 * 
 * Routes:
 * - POST /emails/welcome - Send welcome email
 * - POST /emails/order-confirmation - Send order confirmation
 * - POST /emails/contact - Send contact form email
 * - POST /emails/inquiry - Send AI assistant inquiry
 * - POST /emails/abuse-report - Send abuse report
 * - POST /emails/affiliate-request - Send affiliate request
 * - POST /emails/promotional - Send promotional email
 * 
 * @author Mallgram Backend Team
 */

const express = require('express');
const logger = require('../config/logger');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const router = express.Router();

/**
 * POST /emails/welcome
 * Send welcome email to new user
 */
router.post('/welcome',
    asyncHandler(async (req, res) => {
        const { email, name, userId } = req.body;

        if (!email || !name) {
            throw new ValidationError('Email and name are required');
        }

        try {
            await emailService.sendWelcomeEmail(email, name, userId);

            logger.info('Welcome email sent', { email, name, userId });

            res.json({
                success: true,
                message: 'Welcome email sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            throw new Error('Failed to send welcome email');
        }
    })
);

/**
 * POST /emails/order-confirmation
 * Send order confirmation email
 */
router.post('/order-confirmation',
    asyncHandler(async (req, res) => {
        const { email, orderData, userId } = req.body;

        if (!email || !orderData) {
            throw new ValidationError('Email and order data are required');
        }

        try {
            await emailService.sendOrderConfirmationEmail(email, orderData, userId);

            logger.info('Order confirmation email sent', { email, orderId: orderData.orderId });

            res.json({
                success: true,
                message: 'Order confirmation email sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send order confirmation email:', error);
            throw new Error('Failed to send order confirmation email');
        }
    })
);

/**
 * POST /emails/contact
 * Send contact form email
 */
router.post('/contact',
    asyncHandler(async (req, res) => {
        const { name, email, subject, message, userId } = req.body;

        if (!name || !email || !subject || !message) {
            throw new ValidationError('Name, email, subject, and message are required');
        }

        try {
            await emailService.sendContactFormEmail({
                name,
                email,
                subject,
                message,
                userId
            });

            logger.info('Contact form email sent', { email, subject });

            res.json({
                success: true,
                message: 'Contact form submitted successfully'
            });
        } catch (error) {
            logger.error('Failed to send contact form email:', error);
            throw new Error('Failed to send contact form email');
        }
    })
);

/**
 * POST /emails/inquiry
 * Send AI assistant inquiry email
 */
router.post('/inquiry',
    asyncHandler(async (req, res) => {
        const { email, name, experience, feedback, userId } = req.body;

        if (!email || !name || !experience) {
            throw new ValidationError('Email, name, and experience are required');
        }

        try {
            await emailService.sendAIInquiryEmail({
                email,
                name,
                experience,
                feedback,
                userId
            });

            logger.info('AI inquiry email sent', { email, name });

            res.json({
                success: true,
                message: 'AI assistant inquiry sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send AI inquiry email:', error);
            throw new Error('Failed to send AI inquiry email');
        }
    })
);

/**
 * POST /emails/abuse-report
 * Send abuse report email
 */
router.post('/abuse-report',
    asyncHandler(async (req, res) => {
        const { reporterEmail, reporterName, reportType, description, reportedItem, userId } = req.body;

        if (!reporterEmail || !reportType || !description) {
            throw new ValidationError('Reporter email, report type, and description are required');
        }

        try {
            await emailService.sendAbuseReportEmail({
                reporterEmail,
                reporterName,
                reportType,
                description,
                reportedItem,
                userId
            });

            logger.info('Abuse report email sent', { reporterEmail, reportType });

            res.json({
                success: true,
                message: 'Abuse report submitted successfully'
            });
        } catch (error) {
            logger.error('Failed to send abuse report email:', error);
            throw new Error('Failed to send abuse report email');
        }
    })
);

/**
 * POST /emails/affiliate-request
 * Send affiliate request email
 */
router.post('/affiliate-request',
    asyncHandler(async (req, res) => {
        const { 
            email, 
            name, 
            businessName, 
            website, 
            socialMedia, 
            experience, 
            motivation,
            userId 
        } = req.body;

        if (!email || !name || !businessName || !experience || !motivation) {
            throw new ValidationError('Email, name, business name, experience, and motivation are required');
        }

        try {
            await emailService.sendAffiliateRequestEmail({
                email,
                name,
                businessName,
                website,
                socialMedia,
                experience,
                motivation,
                userId
            });

            logger.info('Affiliate request email sent', { email, businessName });

            res.json({
                success: true,
                message: 'Affiliate request submitted successfully'
            });
        } catch (error) {
            logger.error('Failed to send affiliate request email:', error);
            throw new Error('Failed to send affiliate request email');
        }
    })
);

/**
 * POST /emails/promotional
 * Send promotional email
 */
router.post('/promotional',
    asyncHandler(async (req, res) => {
        const { email, subject, content, templateType, userId } = req.body;

        if (!email || !subject || !content) {
            throw new ValidationError('Email, subject, and content are required');
        }

        try {
            await emailService.sendPromotionalEmail(email, subject, content, templateType, userId);

            logger.info('Promotional email sent', { email, subject });

            res.json({
                success: true,
                message: 'Promotional email sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send promotional email:', error);
            throw new Error('Failed to send promotional email');
        }
    })
);

/**
 * POST /emails/password-reset
 * Send password reset email
 */
router.post('/password-reset',
    asyncHandler(async (req, res) => {
        const { email, name, resetToken, userId } = req.body;

        if (!email || !name || !resetToken) {
            throw new ValidationError('Email, name, and reset token are required');
        }

        try {
            await emailService.sendPasswordResetEmail(email, name, userId, resetToken);

            logger.info('Password reset email sent', { email });

            res.json({
                success: true,
                message: 'Password reset email sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    })
);

/**
 * POST /emails/order-tracking
 * Send order tracking update email
 */
router.post('/order-tracking',
    asyncHandler(async (req, res) => {
        const { email, orderData, trackingUpdate, userId } = req.body;

        if (!email || !orderData || !trackingUpdate) {
            throw new ValidationError('Email, order data, and tracking update are required');
        }

        try {
            await emailService.sendOrderTrackingEmail(email, orderData, trackingUpdate, userId);

            logger.info('Order tracking email sent', { email, orderId: orderData.orderId });

            res.json({
                success: true,
                message: 'Order tracking email sent successfully'
            });
        } catch (error) {
            logger.error('Failed to send order tracking email:', error);
            throw new Error('Failed to send order tracking email');
        }
    })
);

module.exports = router;
