/**
 * Orange Money Service
 * 
 * Integrates with Orange Money API for mobile payments in West and Central Africa.
 * Supports Cameroon, Senegal, Mali, and other Orange markets.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

class OrangeService {
    constructor() {
        this.baseUrl = process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com';
        this.clientId = process.env.ORANGE_MONEY_CLIENT_ID;
        this.clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
        this.merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
        this.environment = process.env.ORANGE_MONEY_ENVIRONMENT || 'sandbox';
    }

    /**
     * Initialize Orange Money payment
     */
    async initializePayment(order, user, phoneNumber) {
        try {
            // Get access token
            const accessToken = await this.getAccessToken();

            const paymentData = {
                merchant_key: this.merchantKey,
                currency: this.getCurrency(user.country),
                order_id: `mg_${order.id}_${Date.now()}`,
                amount: order.total_price,
                return_url: `${process.env.FRONTEND_URL}/payment/success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
                notif_url: `${process.env.API_URL}/payments/webhook`,
                lang: 'en',
                reference: `Mallgram Order #${order.id.slice(-8).toUpperCase()}`,
                customer: {
                    name: user.full_name,
                    email: user.email,
                    phone: this.formatPhoneNumber(phoneNumber, user.country)
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/orange-money-webpay/dev/v1/webpayment`,
                paymentData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            const result = response.data;

            if (result.status && result.pay_token) {
                return {
                    payment_id: paymentData.order_id,
                    transaction_id: result.pay_token,
                    payment_url: result.payment_url,
                    currency: paymentData.currency,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
                    gateway_response: result,
                    instructions: 'You will be redirected to Orange Money to complete your payment.'
                };
            } else {
                throw new Error(result.message || 'Payment initialization failed');
            }

        } catch (error) {
            logger.error('Orange Money initialization failed:', error);
            throw new Error(`Orange Money error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Handle webhook from Orange Money
     */
    async handleWebhook(payload, signature) {
        try {
            // Verify webhook signature if provided
            if (signature && !this.verifyWebhookSignature(payload, signature)) {
                throw new Error('Invalid webhook signature');
            }

            if (payload.status === 'SUCCESS') {
                return {
                    payment_id: payload.order_id,
                    transaction_id: payload.txnid || payload.pay_token,
                    status: 'success',
                    gateway_response: payload
                };
            } else if (payload.status === 'FAILED' || payload.status === 'CANCELLED') {
                return {
                    payment_id: payload.order_id,
                    transaction_id: payload.txnid || payload.pay_token,
                    status: 'failed',
                    gateway_response: payload
                };
            }

            return null;

        } catch (error) {
            logger.error('Orange Money webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentId, transactionReference) {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseUrl}/orange-money-webpay/dev/v1/transactionstatus`,
                {
                    order_id: paymentId,
                    amount: null, // Amount verification optional
                    pay_token: transactionReference
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = response.data;

            return {
                status: result.status === 'SUCCESS' ? 'verified' : 'failed',
                response: result
            };

        } catch (error) {
            logger.error('Orange Money verification failed:', error);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Get access token for Orange Money API
     */
    async getAccessToken() {
        try {
            const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await axios.post(
                `${this.baseUrl}/oauth/v2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            return response.data.access_token;

        } catch (error) {
            logger.error('Orange Money token generation failed:', error);
            throw new Error('Failed to get Orange Money access token');
        }
    }

    /**
     * Format phone number for Orange Money
     */
    formatPhoneNumber(phoneNumber, country) {
        // Remove any non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Add country code if not present
        const countryCodes = {
            'CM': '237', // Cameroon
            'SN': '221', // Senegal
            'ML': '223', // Mali
            'BF': '226', // Burkina Faso
            'CI': '225', // Ivory Coast
            'NE': '227', // Niger
            'MG': '261'  // Madagascar
        };

        const countryCode = countryCodes[country];
        if (countryCode && !cleaned.startsWith(countryCode)) {
            // Remove leading 0 if present and add country code
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            cleaned = countryCode + cleaned;
        }

        return `+${cleaned}`;
    }

    /**
     * Get currency code for country
     */
    getCurrency(country) {
        const currencyMap = {
            'CM': 'XAF', // Cameroon
            'SN': 'XOF', // Senegal
            'ML': 'XOF', // Mali
            'BF': 'XOF', // Burkina Faso
            'CI': 'XOF', // Ivory Coast
            'NE': 'XOF', // Niger
            'MG': 'MGA'  // Madagascar
        };

        return currencyMap[country] || 'XAF';
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.merchantKey) {
            logger.warn('Orange Money merchant key not configured');
            return true; // Skip verification if not configured
        }

        try {
            // Orange Money signature verification logic
            const expectedSignature = crypto
                .createHash('md5')
                .update(JSON.stringify(payload) + this.merchantKey)
                .digest('hex');

            return signature.toLowerCase() === expectedSignature.toLowerCase();
        } catch (error) {
            logger.error('Orange Money signature verification failed:', error);
            return false;
        }
    }

    /**
     * Check if Orange Money is available in country
     */
    isAvailableInCountry(country) {
        const supportedCountries = ['CM', 'SN', 'ML', 'BF', 'CI', 'NE', 'MG'];
        return supportedCountries.includes(country);
    }
}

module.exports = new OrangeService();
