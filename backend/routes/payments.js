/**
 * Payment Routes
 * 
 * Handles payment processing for multiple African payment gateways.
 * Supports Kora Pay, MTN Mobile Money, Orange Money, PayGate, and PayFast.
 * 
 * Routes:
 * - POST /payments/initialize - Initialize payment
 * - POST /payments/webhook - Payment webhook handler
 * - GET /payments/status/:id - Check payment status
 * - POST /payments/verify - Verify payment
 * - GET /payments/methods - Get available payment methods
 * 
 * @author Mallgram Backend Team
 */

const express = require('express');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const { logApiOperation } = require('../middleware/requestLogger');
const emailService = require('../services/emailService');

// Payment gateway services
const koraPayService = require('../services/payments/koraPayService');
const mtnService = require('../services/payments/mtnService');
const orangeService = require('../services/payments/orangeService');
const payGateService = require('../services/payments/payGateService');
const payFastService = require('../services/payments/payFastService');

const router = express.Router();

/**
 * GET /payments/methods
 * Get available payment methods based on country
 */
router.get('/methods',
    logApiOperation('get_payment_methods'),
    asyncHandler(async (req, res) => {
        const { country } = req.query;

        const paymentMethods = {
            'ZA': [ // South Africa
                {
                    id: 'paygate',
                    name: 'PayGate',
                    type: 'card',
                    logo: '/images/paygate-logo.png',
                    description: 'Credit/Debit Cards, EFT',
                    fees: '2.9% + R2.00'
                },
                {
                    id: 'payfast',
                    name: 'PayFast',
                    type: 'card',
                    logo: '/images/payfast-logo.png',
                    description: 'Credit/Debit Cards, EFT, SnapScan',
                    fees: '2.9% + R2.00'
                },
                {
                    id: 'kora',
                    name: 'Kora Pay',
                    type: 'card',
                    logo: '/images/kora-logo.png',
                    description: 'All major cards',
                    fees: '3.5%'
                }
            ],
            'CM': [ // Cameroon
                {
                    id: 'orange',
                    name: 'Orange Money',
                    type: 'mobile_money',
                    logo: '/images/orange-logo.png',
                    description: 'Mobile Money',
                    fees: '1.5%'
                },
                {
                    id: 'mtn',
                    name: 'MTN Mobile Money',
                    type: 'mobile_money',
                    logo: '/images/mtn-logo.png',
                    description: 'Mobile Money',
                    fees: '1.5%'
                },
                {
                    id: 'kora',
                    name: 'Kora Pay',
                    type: 'card',
                    logo: '/images/kora-logo.png',
                    description: 'Credit/Debit Cards',
                    fees: '3.5%'
                }
            ]
        };

        const availableMethods = country ? paymentMethods[country] || [] : paymentMethods;

        res.json({
            success: true,
            data: {
                payment_methods: availableMethods,
                country: country || 'all',
                currencies: {
                    'ZA': { code: 'ZAR', symbol: 'R' },
                    'CM': { code: 'XAF', symbol: 'XAF' }
                }
            }
        });
    })
);

/**
 * POST /payments/initialize
 * Initialize payment for an order
 */
router.post('/initialize',
    authMiddleware,
    logApiOperation('initialize_payment'),
    asyncHandler(async (req, res) => {
        const { order_id, payment_method, return_url, phone_number } = req.body;

        // Validate required fields
        if (!order_id || !payment_method) {
            throw new ValidationError('Order ID and payment method are required');
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items(
                    id,
                    quantity,
                    unit_price,
                    subtotal,
                    products(name, images)
                )
            `)
            .eq('id', order_id)
            .eq('user_id', req.user.id)
            .single();

        if (orderError || !order) {
            throw new NotFoundError('Order not found');
        }

        // Check if order is in correct state
        if (order.payment_status !== 'pending') {
            throw new ValidationError('Order payment has already been processed');
        }

        // Validate payment method requirements
        if (['mtn', 'orange'].includes(payment_method) && !phone_number) {
            throw new ValidationError('Phone number is required for mobile money payments');
        }

        try {
            let paymentResult;
            
            // Route to appropriate payment gateway
            switch (payment_method) {
                case 'kora':
                    paymentResult = await koraPayService.initializePayment(order, req.user, return_url);
                    break;
                    
                case 'mtn':
                    paymentResult = await mtnService.initializePayment(order, req.user, phone_number);
                    break;
                    
                case 'orange':
                    paymentResult = await orangeService.initializePayment(order, req.user, phone_number);
                    break;
                    
                case 'paygate':
                    paymentResult = await payGateService.initializePayment(order, req.user, return_url);
                    break;
                    
                case 'payfast':
                    paymentResult = await payFastService.initializePayment(order, req.user, return_url);
                    break;
                    
                default:
                    throw new ValidationError('Unsupported payment method');
            }

            // Store payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    id: paymentResult.payment_id,
                    order_id: order.id,
                    user_id: req.user.id,
                    payment_method,
                    amount: order.total_price,
                    currency: paymentResult.currency,
                    status: 'pending',
                    gateway_transaction_id: paymentResult.transaction_id,
                    gateway_response: paymentResult.gateway_response,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (paymentError) {
                logger.error('Failed to store payment record:', paymentError);
                throw new Error('Payment initialization failed');
            }

            // Log payment initialization
            logger.info('Payment initialized', {
                orderId: order.id,
                paymentId: payment.id,
                userId: req.user.id,
                method: payment_method,
                amount: order.total_price
            });

            res.json({
                success: true,
                data: {
                    payment_id: payment.id,
                    payment_url: paymentResult.payment_url,
                    payment_method,
                    amount: order.total_price,
                    currency: paymentResult.currency,
                    expires_at: paymentResult.expires_at,
                    instructions: paymentResult.instructions
                }
            });

        } catch (error) {
            logger.error('Payment initialization failed:', error);
            throw new Error(`Payment initialization failed: ${error.message}`);
        }
    })
);

/**
 * POST /payments/webhook
 * Handle payment webhooks from various gateways
 */
router.post('/webhook',
    logApiOperation('payment_webhook'),
    asyncHandler(async (req, res) => {
        const signature = req.headers['x-signature'] || req.headers['x-kora-signature'];
        const payload = req.body;
        
        let paymentUpdate;
        
        try {
            // Determine webhook source and verify signature
            if (req.headers['x-kora-signature']) {
                paymentUpdate = await koraPayService.handleWebhook(payload, signature);
            } else if (req.headers['x-mtn-signature']) {
                paymentUpdate = await mtnService.handleWebhook(payload, signature);
            } else if (req.headers['x-orange-signature']) {
                paymentUpdate = await orangeService.handleWebhook(payload, signature);
            } else if (req.headers['x-paygate-signature']) {
                paymentUpdate = await payGateService.handleWebhook(payload, signature);
            } else if (req.headers['x-payfast-signature']) {
                paymentUpdate = await payFastService.handleWebhook(payload, signature);
            } else {
                throw new ValidationError('Unknown webhook source');
            }

            // Update payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .update({
                    status: paymentUpdate.status,
                    gateway_transaction_id: paymentUpdate.transaction_id,
                    gateway_response: paymentUpdate.gateway_response,
                    processed_at: paymentUpdate.status === 'success' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', paymentUpdate.payment_id)
                .select()
                .single();

            if (paymentError) {
                throw new Error('Failed to update payment record');
            }

            // Update order status if payment successful
            if (paymentUpdate.status === 'success') {
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'success',
                        status: 'paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.order_id);

                // Get order details for email
                const { data: order } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        users(email, full_name),
                        order_items(
                            quantity,
                            unit_price,
                            products(name)
                        )
                    `)
                    .eq('id', payment.order_id)
                    .single();

                // Send order confirmation email
                if (order && order.users) {
                    try {
                        await emailService.sendOrderConfirmationEmail(
                            order.users.email,
                            {
                                name: order.users.full_name,
                                orderNumber: order.id.slice(-8).toUpperCase(),
                                orderId: order.id,
                                total: order.total_price,
                                items: order.order_items.map(item => ({
                                    name: item.products.name,
                                    quantity: item.quantity,
                                    price: item.unit_price
                                })),
                                estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toDateString(),
                                trackingNumber: order.tracking_number
                            },
                            order.user_id
                        );
                    } catch (emailError) {
                        logger.error('Failed to send order confirmation email:', emailError);
                    }
                }

                // Process affiliate commission if applicable
                await this.processAffiliateCommission(payment.order_id);
            }

            logger.info('Payment webhook processed', {
                paymentId: paymentUpdate.payment_id,
                status: paymentUpdate.status,
                transactionId: paymentUpdate.transaction_id
            });

            res.json({ success: true, message: 'Webhook processed successfully' });

        } catch (error) {
            logger.error('Payment webhook processing failed:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    })
);

/**
 * GET /payments/status/:id
 * Check payment status
 */
router.get('/status/:id',
    authMiddleware,
    logApiOperation('check_payment_status'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                orders(id, status, payment_status, total_price)
            `)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !payment) {
            throw new NotFoundError('Payment not found');
        }

        res.json({
            success: true,
            data: {
                payment_id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                payment_method: payment.payment_method,
                created_at: payment.created_at,
                processed_at: payment.processed_at,
                order: payment.orders
            }
        });
    })
);

/**
 * POST /payments/verify
 * Manually verify payment (for testing or troubleshooting)
 */
router.post('/verify',
    authMiddleware,
    logApiOperation('verify_payment'),
    asyncHandler(async (req, res) => {
        const { payment_id, transaction_reference } = req.body;

        if (!payment_id) {
            throw new ValidationError('Payment ID is required');
        }

        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment_id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !payment) {
            throw new NotFoundError('Payment not found');
        }

        try {
            let verificationResult;

            // Verify with appropriate gateway
            switch (payment.payment_method) {
                case 'kora':
                    verificationResult = await koraPayService.verifyPayment(payment_id, transaction_reference);
                    break;
                case 'mtn':
                    verificationResult = await mtnService.verifyPayment(payment_id, transaction_reference);
                    break;
                case 'orange':
                    verificationResult = await orangeService.verifyPayment(payment_id, transaction_reference);
                    break;
                case 'paygate':
                    verificationResult = await payGateService.verifyPayment(payment_id, transaction_reference);
                    break;
                case 'payfast':
                    verificationResult = await payFastService.verifyPayment(payment_id, transaction_reference);
                    break;
                default:
                    throw new ValidationError('Unsupported payment method for verification');
            }

            res.json({
                success: true,
                data: {
                    payment_id,
                    verification_status: verificationResult.status,
                    gateway_response: verificationResult.response,
                    verified_at: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Payment verification failed:', error);
            throw new Error(`Payment verification failed: ${error.message}`);
        }
    })
);

/**
 * Process affiliate commission for successful orders
 * @param {string} orderId - Order ID
 */
async function processAffiliateCommission(orderId) {
    try {
        // Check if order used a promo code
        const { data: order } = await supabase
            .from('orders')
            .select('promo_code_id, user_id, total_price')
            .eq('id', orderId)
            .single();

        if (order && order.promo_code_id) {
            // Get promo code details
            const { data: promoCode } = await supabase
                .from('promo_codes')
                .select('affiliate_id, admin_id')
                .eq('id', order.promo_code_id)
                .single();

            // Only process if it's an affiliate promo code
            if (promoCode && promoCode.affiliate_id) {
                await supabase
                    .from('affiliate_stats')
                    .insert({
                        affiliate_id: promoCode.affiliate_id,
                        promo_code_id: order.promo_code_id,
                        user_id: order.user_id,
                        order_id: orderId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                logger.info('Affiliate commission processed', {
                    orderId,
                    affiliateId: promoCode.affiliate_id,
                    promoCodeId: order.promo_code_id
                });
            }
        }
    } catch (error) {
        logger.error('Failed to process affiliate commission:', error);
    }
}

module.exports = router;
