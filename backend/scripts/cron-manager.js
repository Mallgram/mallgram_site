/**
 * Cron Job Manager
 * 
 * Manages all scheduled tasks for the Mallgram backend including:
 * - Daily product synchronization from Alibaba/AliExpress
 * - Delivery tracking updates
 * - Affiliate payout processing
 * - Analytics computation
 * - Database maintenance
 * 
 * @author Mallgram Backend Team
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const { supabase } = require('../config/supabase');

// Import job modules
const productSyncJob = require('./productSync');
const deliveryTrackingJob = require('./deliveryTracking');

class CronManager {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize all cron jobs based on environment configuration
     */
    async initialize() {
        if (this.isInitialized) {
            logger.warn('Cron manager already initialized');
            return;
        }

        try {
            logger.info('🕒 Initializing cron jobs...');

            // Product Synchronization Job
            // Runs daily at 2:00 AM to sync products from external APIs
            this.scheduleJob('productSync', process.env.PRODUCT_REFRESH_SCHEDULE || '0 2 * * *', async () => {
                logger.info('Starting product synchronization job');
                await productSyncJob.execute();
            });

            // Delivery Tracking Job
            // Runs every 6 hours to update delivery statuses
            this.scheduleJob('deliveryTracking', process.env.DELIVERY_TRACKING_SCHEDULE || '0 */6 * * *', async () => {
                logger.info('Starting delivery tracking update job');
                await deliveryTrackingJob.execute();
            });

            // Bulk Shipping Job
            // Runs every hour to process orders ready for shipping (48h+ old)
            this.scheduleJob('bulkShipping', '0 * * * *', async () => {
                logger.info('Processing bulk shipping requests');
                await deliveryTrackingJob.processBulkShipping();
            });

            // Database Cleanup Job
            // Runs daily at 3:00 AM for cleanup and optimization
            this.scheduleJob('cleanup', '0 3 * * *', async () => {
                logger.info('Starting database cleanup job');
                await this.performDatabaseCleanup();
            });

            // System Health Check Job
            // Runs every hour to check system health
            this.scheduleJob('healthCheck', '0 * * * *', async () => {
                logger.debug('Performing system health check');
                await this.performHealthCheck();
            });

            this.isInitialized = true;
            logger.info(`✅ Cron manager initialized with ${this.jobs.size} jobs`);

        } catch (error) {
            logger.error('Failed to initialize cron manager:', error);
            throw error;
        }
    }

    /**
     * Schedule a new cron job
     * @param {string} name - Job name
     * @param {string} schedule - Cron schedule expression
     * @param {Function} task - Task function to execute
     * @param {Object} options - Additional options
     */
    scheduleJob(name, schedule, task, options = {}) {
        try {
            // Validate cron expression
            if (!cron.validate(schedule)) {
                throw new Error(`Invalid cron schedule: ${schedule}`);
            }

            // Wrap task with error handling and logging
            const wrappedTask = async () => {
                const startTime = Date.now();
                const jobId = `${name}-${Date.now()}`;
                
                try {
                    logger.info(`Starting cron job: ${name}`, { jobId, schedule });
                    
                    await task();
                    
                    const duration = Date.now() - startTime;
                    logger.info(`Cron job completed: ${name}`, { 
                        jobId, 
                        duration: `${duration}ms`,
                        status: 'success'
                    });

                    // Log job execution to database
                    await this.logJobExecution(name, 'success', duration);

                } catch (error) {
                    const duration = Date.now() - startTime;
                    logger.error(`Cron job failed: ${name}`, { 
                        jobId, 
                        error: error.message,
                        stack: error.stack,
                        duration: `${duration}ms`,
                        status: 'failed'
                    });

                    // Log job failure to database
                    await this.logJobExecution(name, 'failed', duration, error.message);

                    // Send alert for critical job failures
                    if (options.critical) {
                        await this.sendJobFailureAlert(name, error);
                    }
                }
            };

            // Create and start the cron job
            const job = cron.schedule(schedule, wrappedTask, {
                scheduled: false,
                timezone: 'Africa/Douala' // Cameroon timezone
            });

            this.jobs.set(name, {
                job,
                schedule,
                task: wrappedTask,
                options,
                createdAt: new Date(),
                lastRun: null,
                runCount: 0
            });

            logger.info(`Cron job scheduled: ${name}`, { schedule, options });

        } catch (error) {
            logger.error(`Failed to schedule cron job: ${name}`, error);
            throw error;
        }
    }

    /**
     * Start all scheduled jobs
     */
    startAllJobs() {
        try {
            this.jobs.forEach((jobData, name) => {
                jobData.job.start();
                logger.info(`Started cron job: ${name}`);
            });

            logger.info(`🚀 All cron jobs started (${this.jobs.size} jobs)`);
        } catch (error) {
            logger.error('Failed to start cron jobs:', error);
        }
    }

    /**
     * Stop all scheduled jobs
     */
    stopAllJobs() {
        try {
            this.jobs.forEach((jobData, name) => {
                jobData.job.stop();
                logger.info(`Stopped cron job: ${name}`);
            });

            logger.info('🛑 All cron jobs stopped');
        } catch (error) {
            logger.error('Failed to stop cron jobs:', error);
        }
    }

    /**
     * Start a specific job
     * @param {string} name - Job name
     */
    startJob(name) {
        const jobData = this.jobs.get(name);
        if (!jobData) {
            throw new Error(`Job not found: ${name}`);
        }

        jobData.job.start();
        logger.info(`Started cron job: ${name}`);
    }

    /**
     * Stop a specific job
     * @param {string} name - Job name
     */
    stopJob(name) {
        const jobData = this.jobs.get(name);
        if (!jobData) {
            throw new Error(`Job not found: ${name}`);
        }

        jobData.job.stop();
        logger.info(`Stopped cron job: ${name}`);
    }

    /**
     * Get status of all jobs
     * @returns {Array} - Array of job status objects
     */
    getJobStatuses() {
        const statuses = [];

        this.jobs.forEach((jobData, name) => {
            statuses.push({
                name,
                schedule: jobData.schedule,
                running: jobData.job.running,
                createdAt: jobData.createdAt,
                lastRun: jobData.lastRun,
                runCount: jobData.runCount,
                options: jobData.options
            });
        });

        return statuses;
    }

    /**
     * Manually execute a job
     * @param {string} name - Job name
     */
    async executeJob(name) {
        const jobData = this.jobs.get(name);
        if (!jobData) {
            throw new Error(`Job not found: ${name}`);
        }

        logger.info(`Manually executing job: ${name}`);
        await jobData.task();
    }

    /**
     * Log job execution to database
     * @param {string} jobName - Job name
     * @param {string} status - Execution status
     * @param {number} duration - Execution duration in milliseconds
     * @param {string} errorMessage - Error message if failed
     */
    async logJobExecution(jobName, status, duration, errorMessage = null) {
        try {
            await supabase
                .from('cron_job_logs')
                .insert({
                    job_name: jobName,
                    status,
                    duration_ms: duration,
                    error_message: errorMessage,
                    executed_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
        } catch (error) {
            logger.error('Failed to log job execution:', error);
        }
    }

    /**
     * Send job failure alert
     * @param {string} jobName - Job name
     * @param {Error} error - Error object
     */
    async sendJobFailureAlert(jobName, error) {
        try {
            // Get admin users for notifications
            const { data: admins } = await supabase
                .from('users')
                .select('email, full_name')
                .eq('is_admin', true);

            if (admins && admins.length > 0) {
                const emailService = require('../services/emailService');
                
                for (const admin of admins) {
                    await emailService.sendEmail({
                        to: admin.email,
                        subject: `Critical Job Failure: ${jobName}`,
                        html: `
                            <h2>Critical Job Failure Alert</h2>
                            <p><strong>Job:</strong> ${jobName}</p>
                            <p><strong>Error:</strong> ${error.message}</p>
                            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                            <p><strong>Stack Trace:</strong></p>
                            <pre>${error.stack}</pre>
                        `,
                        category: 'system'
                    });
                }
            }
        } catch (alertError) {
            logger.error('Failed to send job failure alert:', alertError);
        }
    }

    /**
     * Process pending emails in queue
     */
    async processEmailQueue() {
        try {
            const { data: pendingEmails } = await supabase
                .from('email_log')
                .select('*')
                .eq('status', 'pending')
                .limit(10);

            if (pendingEmails && pendingEmails.length > 0) {
                const emailService = require('../services/emailService');
                
                for (const email of pendingEmails) {
                    try {
                        await emailService.sendEmail({
                            to: email.receiver_email,
                            subject: email.subject,
                            html: email.message,
                            category: email.category,
                            userId: email.receiver_id
                        });

                        // Update email status to sent
                        await supabase
                            .from('email_log')
                            .update({ 
                                status: 'sent',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', email.id);

                    } catch (sendError) {
                        // Update email status to failed
                        await supabase
                            .from('email_log')
                            .update({ 
                                status: 'failed',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', email.id);
                    }
                }
            }
        } catch (error) {
            logger.error('Email queue processing failed:', error);
        }
    }

    /**
     * Perform system health check
     */
    async performHealthCheck() {
        try {
            // Check database connectivity
            const { data: dbCheck } = await supabase
                .from('users')
                .select('count')
                .limit(1);

            if (!dbCheck) {
                logger.warn('Database health check failed');
                return;
            }

            // Check memory usage
            const memUsage = process.memoryUsage();
            const memoryWarningThreshold = 500 * 1024 * 1024; // 500MB

            if (memUsage.rss > memoryWarningThreshold) {
                logger.warn('High memory usage detected', {
                    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
                });
            }

            // Check job statuses
            const jobStatuses = this.getJobStatuses();
            const failedJobs = jobStatuses.filter(job => !job.running);
            
            if (failedJobs.length > 0) {
                logger.warn('Some cron jobs are not running', { failedJobs: failedJobs.map(j => j.name) });
            }

        } catch (error) {
            logger.error('Health check failed:', error);
        }
    }

    /**
     * Perform database cleanup and maintenance
     */
    async performDatabaseCleanup() {
        try {
            logger.info('Starting database cleanup');
            
            // Clean up old logs (keep only 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            await supabase
                .from('api_logs')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString());
                
            // Clean up old email logs (keep only 90 days)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            await supabase
                .from('email_logs')
                .delete()
                .lt('created_at', ninetyDaysAgo.toISOString());
                
            // Clean up inactive products
            await productSyncJob.cleanupOldProducts();
            
            logger.info('Database cleanup completed');
            
        } catch (error) {
            logger.error('Database cleanup failed:', error);
        }
    }
}

// Export singleton instance
module.exports = new CronManager();
