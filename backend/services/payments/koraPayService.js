/**
 * Kora Pay Service
 * 
 * Integrates with Kora Pay payment gateway for card payments across Africa.
 * Supports payment initialization, webhook handling, and verification.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

class KoraPayService {
    constructor() {
        this.baseUrl = process.env.KORA_PAY_BASE_URL || 'https://api.korahq.com';
        this.publicKey = process.env.KORA_PAY_PUBLIC_KEY;
        this.secretKey = process.env.KORA_PAY_SECRET_KEY;
        this.webhookSecret = process.env.KORA_PAY_WEBHOOK_SECRET;
    }

    /**
     * Initialize payment with Kora Pay
     */
    async initializePayment(order, user, returnUrl) {
        try {
            const paymentData = {
                amount: order.total_price,
                currency: this.getCurrency(user.country),
                reference: `mg_${order.id}_${Date.now()}`,
                customer: {
                    name: user.full_name,
                    email: user.email,
                    phone: user.phone_number
                },
                redirect_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                notification_url: `${process.env.API_URL}/payments/webhook`,
                description: `Mallgram Order #${order.id.slice(-8).toUpperCase()}`,
                metadata: {
                    order_id: order.id,
                    user_id: user.id,
                    platform: 'mallgram'
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/merchant/api/v1/charges/initialize`,
                paymentData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = response.data;

            if (result.status && result.data) {
                return {
                    payment_id: paymentData.reference,
                    transaction_id: result.data.reference,
                    payment_url: result.data.checkout_url,
                    currency: paymentData.currency,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
                    gateway_response: result,
                    instructions: 'You will be redirected to complete your payment securely.'
                };
            } else {
                throw new Error(result.message || 'Payment initialization failed');
            }

        } catch (error) {
            logger.error('Kora Pay initialization failed:', error);
            throw new Error(`Kora Pay error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Handle webhook from Kora Pay
     */
    async handleWebhook(payload, signature) {
        try {
            // Verify webhook signature
            if (!this.verifyWebhookSignature(payload, signature)) {
                throw new Error('Invalid webhook signature');
            }

            const event = payload;
            
            if (event.event === 'charge.success') {
                return {
                    payment_id: event.data.reference.split('_')[1], // Extract order ID
                    transaction_id: event.data.reference,
                    status: 'success',
                    gateway_response: event
                };
            } else if (event.event === 'charge.failed') {
                return {
                    payment_id: event.data.reference.split('_')[1],
                    transaction_id: event.data.reference,
                    status: 'failed',
                    gateway_response: event
                };
            }

            return null;

        } catch (error) {
            logger.error('Kora Pay webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentId, transactionReference) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/merchant/api/v1/charges/${transactionReference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`
                    }
                }
            );

            const result = response.data;

            return {
                status: result.data.status === 'success' ? 'verified' : 'failed',
                response: result
            };

        } catch (error) {
            logger.error('Kora Pay verification failed:', error);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            logger.warn('Kora Pay webhook secret not configured');
            return true; // Skip verification if not configured
        }

        const expectedSignature = crypto
            .createHmac('sha512', this.webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Get currency code for country
     */
    getCurrency(country) {
        const currencyMap = {
            'ZA': 'ZAR',
            'NG': 'NGN',
            'KE': 'KES',
            'GH': 'GHS',
            'CM': 'XAF'
        };

        return currencyMap[country] || 'USD';
    }
}

module.exports = new KoraPayService();
