/**
 * Email Service
 * 
 * Comprehensive email service using Nodemailer for sending transactional emails.
 * Integrates with Supabase for email logging and template management.
 * 
 * Features:
 * - Transactional email sending
 * - HTML and text email templates
 * - Email logging and tracking
 * - Retry mechanism for failed emails
 * - Multi-language support
 * 
 * @author Mallgram Backend Team
 */

const nodemailer = require('nodemailer');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Initialize Nodemailer transporter with SMTP configuration
     */
    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
                // Additional options for better reliability
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000, // 1 second
                rateLimit: 5 // max 5 messages per second
            });

            // Verify transporter configuration (non-blocking)
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.warn('⚠️ Email transporter verification failed. Email service will be disabled:', error.message);
                    this.transporter = null; // Disable email service if verification fails
                } else {
                    logger.info('✅ Email service initialized and verified successfully');
                }
            });

            // Log initialization (before verification)
            logger.info('✅ Email service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize email transporter:', error);
            this.transporter = null; // Ensure transporter is null on failure
        }
    }

    /**
     * Send email with retry mechanism
     * @param {Object} emailOptions - Email configuration object
     * @param {number} retries - Number of retry attempts
     * @returns {Promise<Object>} - Email send result
     */
    async sendEmail(emailOptions, retries = 3) {
        const startTime = Date.now();
        
        try {
            if (!this.transporter) {
                const errorMsg = 'Email service is disabled due to SMTP configuration issues. Please check your email settings.';
                logger.warn(errorMsg);
                return {
                    success: false,
                    error: errorMsg,
                    duration: Date.now() - startTime
                };
            }

            // Prepare email options
            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Mallgram',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER
                },
                to: emailOptions.to,
                subject: emailOptions.subject,
                text: emailOptions.text,
                html: emailOptions.html,
                ...emailOptions.additionalOptions
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);
            const duration = Date.now() - startTime;

            // Log successful email
            await this.logEmail({
                receiver_email: emailOptions.to,
                subject: emailOptions.subject,
                message: emailOptions.html || emailOptions.text,
                category: emailOptions.category || 'system',
                status: 'sent',
                receiver_id: emailOptions.userId || null
            });

            logger.info('Email sent successfully', {
                to: emailOptions.to,
                subject: emailOptions.subject,
                messageId: result.messageId,
                duration: `${duration}ms`,
                category: emailOptions.category
            });

            return {
                success: true,
                messageId: result.messageId,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Log failed email
            await this.logEmail({
                receiver_email: emailOptions.to,
                subject: emailOptions.subject,
                message: emailOptions.html || emailOptions.text,
                category: emailOptions.category || 'system',
                status: 'failed',
                receiver_id: emailOptions.userId || null
            });

            logger.error('Email send failed', {
                to: emailOptions.to,
                subject: emailOptions.subject,
                error: error.message,
                duration: `${duration}ms`,
                retries: retries
            });

            // Retry mechanism
            if (retries > 0) {
                logger.info(`Retrying email send... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                return this.sendEmail(emailOptions, retries - 1);
            }

            throw error;
        }
    }

    /**
     * Log email to database
     * @param {Object} emailData - Email data to log
     */
    async logEmail(emailData) {
        try {
            await supabase
                .from('email_log')
                .insert({
                    ...emailData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
        } catch (error) {
            logger.error('Failed to log email to database:', error);
        }
    }

    /**
     * Generate HTML email template
     * @param {string} templateName - Template name
     * @param {Object} data - Template data
     * @returns {string} - HTML email content
     */
    generateEmailTemplate(templateName, data) {
        const baseStyle = `
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { padding: 30px; line-height: 1.6; color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
                .logo { width: 60px; height: 60px; margin-bottom: 10px; }
            </style>
        `;

        const templates = {
            welcome: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8">${baseStyle}</head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Mallgram!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${data.name}!</h2>
                            <p>Thank you for joining Mallgram, your gateway to quality products from China delivered across Africa.</p>
                            <p>Your account has been successfully created. You can now:</p>
                            <ul>
                                <li>Browse thousands of products from trusted suppliers</li>
                                <li>Enjoy competitive prices and bulk discounts</li>
                                <li>Track your orders in real-time</li>
                                <li>Get support in English and French</li>
                            </ul>
                            <a href="${process.env.FRONTEND_URL}/login" class="button">Start Shopping</a>
                            <p>If you have any questions, our support team is here to help!</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Mallgram. All rights reserved.</p>
                            <p>Pan-African E-commerce Platform</p>
                        </div>
                    </div>
                </body>
                </html>
            `,

            order_confirmation: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8">${baseStyle}</head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Order Confirmed!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${data.name}!</h2>
                            <p>Your order <strong>#${data.orderNumber}</strong> has been confirmed and is being processed.</p>
                            
                            <h3>Order Details:</h3>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                                </tr>
                                ${data.items?.map(item => `
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">XAF ${item.price}</td>
                                    </tr>
                                `).join('') || ''}
                                <tr style="background-color: #f8f9fa; font-weight: bold;">
                                    <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">Total</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">XAF ${data.total}</td>
                                </tr>
                            </table>
                            
                            <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
                            <p><strong>Tracking Number:</strong> ${data.trackingNumber || 'Will be provided soon'}</p>
                            
                            <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">Track Order</a>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Mallgram. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,

            password_reset: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8">${baseStyle}</head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${data.name}!</h2>
                            <p>You requested to reset your password for your Mallgram account.</p>
                            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                            <a href="${data.resetUrl}" class="button">Reset Password</a>
                            <p>If you didn't request this password reset, please ignore this email or contact our support team.</p>
                            <p><strong>Security tip:</strong> Never share your password or reset links with anyone.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Mallgram. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,

            affiliate_payout: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8">${baseStyle}</head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Affiliate Payout Ready!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${data.name}!</h2>
                            <p>Congratulations! Your affiliate commission is ready for payout.</p>
                            
                            <h3>Payout Details:</h3>
                            <ul>
                                <li><strong>Commission Amount:</strong> XAF ${data.amount}</li>
                                <li><strong>Period:</strong> ${data.period}</li>
                                <li><strong>Total Sales:</strong> ${data.totalSales}</li>
                                <li><strong>Promo Code:</strong> ${data.promoCode}</li>
                            </ul>
                            
                            <a href="${process.env.FRONTEND_URL}/affiliate/payouts" class="button">View Payout Details</a>
                            
                            <p>The payout will be processed within 3-5 business days to your registered payment method.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Mallgram. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        return templates[templateName] || templates.welcome;
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(email, name, userId = null) {
        const html = this.generateEmailTemplate('welcome', { name });
        
        return this.sendEmail({
            to: email,
            subject: 'Welcome to Mallgram - Your Pan-African Shopping Journey Begins!',
            html,
            text: `Welcome to Mallgram, ${name}! Your account has been created successfully. Start shopping at ${process.env.FRONTEND_URL}`,
            category: 'new_user',
            userId
        });
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmationEmail(email, orderData, userId = null) {
        const html = this.generateEmailTemplate('order_confirmation', orderData);
        
        return this.sendEmail({
            to: email,
            subject: `Order Confirmation - #${orderData.orderNumber}`,
            html,
            text: `Your order #${orderData.orderNumber} has been confirmed. Total: XAF ${orderData.total}`,
            category: 'order_confirmation',
            userId
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, name, userId, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
        const html = this.generateEmailTemplate('password_reset', { name, resetUrl });
        
        return this.sendEmail({
            to: email,
            subject: 'Password Reset - Mallgram',
            html,
            text: `Reset your password by visiting: ${resetUrl}`,
            category: 'system',
            userId
        });
    }

    /**
     * Send affiliate payout notification
     */
    async sendAffiliatePayoutEmail(email, payoutData, userId = null) {
        const html = this.generateEmailTemplate('affiliate_payout', payoutData);
        
        return this.sendEmail({
            to: email,
            subject: `Affiliate Payout Ready - XAF ${payoutData.amount}`,
            html,
            text: `Your affiliate commission of XAF ${payoutData.amount} is ready for payout.`,
            category: 'affiliate',
            userId
        });
    }

    /**
     * Send promotional email
     */
    async sendPromotionalEmail(email, subject, content, userId = null) {
        return this.sendEmail({
            to: email,
            subject,
            html: content,
            text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
            category: 'promotion',
            userId
        });
    }

    /**
     * Send contact form email
     */
    async sendContactFormEmail(contactData) {
        const { name, email, subject, message, userId } = contactData;
        
        const emailContent = this.generateEmailTemplate('contact_form', {
            name,
            email,
            subject,
            message,
            submittedAt: new Date().toISOString()
        });

        const emailOptions = {
            to: process.env.CONTACT_EMAIL || process.env.FROM_EMAIL,
            subject: `Contact Form: ${subject}`,
            html: emailContent,
            replyTo: email
        };

        return await this.sendEmail(emailOptions);
    }

    /**
     * Send AI assistant inquiry email
     */
    async sendAIInquiryEmail(inquiryData) {
        const { email, name, experience, feedback, userId } = inquiryData;
        
        const emailContent = this.generateEmailTemplate('ai_inquiry', {
            name,
            email,
            experience,
            feedback,
            submittedAt: new Date().toISOString()
        });

        const emailOptions = {
            to: process.env.AI_FEEDBACK_EMAIL || process.env.FROM_EMAIL,
            subject: 'AI Assistant Experience Feedback',
            html: emailContent,
            replyTo: email
        };

        return await this.sendEmail(emailOptions);
    }

    /**
     * Send abuse report email
     */
    async sendAbuseReportEmail(reportData) {
        const { reporterEmail, reporterName, reportType, description, reportedItem, userId } = reportData;
        
        const emailContent = this.generateEmailTemplate('abuse_report', {
            reporterName,
            reporterEmail,
            reportType,
            description,
            reportedItem,
            submittedAt: new Date().toISOString()
        });

        const emailOptions = {
            to: process.env.ABUSE_REPORT_EMAIL || process.env.FROM_EMAIL,
            subject: `Abuse Report: ${reportType}`,
            html: emailContent,
            replyTo: reporterEmail
        };

        return await this.sendEmail(emailOptions);
    }

    /**
     * Send affiliate request email
     */
    async sendAffiliateRequestEmail(requestData) {
        const { 
            email, 
            name, 
            businessName, 
            website, 
            socialMedia, 
            experience, 
            motivation,
            userId 
        } = requestData;
        
        const emailContent = this.generateEmailTemplate('affiliate_request', {
            name,
            email,
            businessName,
            website,
            socialMedia,
            experience,
            motivation,
            submittedAt: new Date().toISOString()
        });

        const emailOptions = {
            to: process.env.AFFILIATE_EMAIL || process.env.FROM_EMAIL,
            subject: `Affiliate Application: ${businessName}`,
            html: emailContent,
            replyTo: email
        };

        return await this.sendEmail(emailOptions);
    }

    /**
     * Send order tracking update email
     */
    async sendOrderTrackingEmail(email, orderData, trackingUpdate, userId = null) {
        const emailContent = this.generateEmailTemplate('order_tracking', {
            ...orderData,
            ...trackingUpdate,
            updatedAt: new Date().toISOString()
        });

        const emailOptions = {
            to: email,
            subject: `Order Update: ${orderData.orderNumber}`,
            html: emailContent
        };

        return await this.sendEmail(emailOptions);
    }

    /**
     * Send bulk emails (for newsletters, promotions)
     */
    async sendBulkEmails(recipients, subject, content, category = 'promotion') {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendEmail({
                    to: recipient.email,
                    subject,
                    html: content,
                    text: content.replace(/<[^>]*>/g, ''),
                    category,
                    userId: recipient.userId
                });
                results.push({ email: recipient.email, success: true, messageId: result.messageId });
            } catch (error) {
                results.push({ email: recipient.email, success: false, error: error.message });
            }
            
            // Small delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }
}

// Export singleton instance
module.exports = new EmailService();
