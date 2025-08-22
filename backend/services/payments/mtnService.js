/**
 * MTN Mobile Money Service
 * 
 * Integrates with MTN Mobile Money API for mobile payments across Africa.
 * Supports Cameroon, Ghana, Uganda, and other MTN markets.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

class MTNService {
    constructor() {
        this.baseUrl = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
        this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
        this.apiKey = process.env.MTN_MOMO_API_KEY;
        this.apiSecret = process.env.MTN_MOMO_API_SECRET;
        this.environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
    }

    /**
     * Initialize MTN Mobile Money payment
     */
    async initializePayment(order, user, phoneNumber) {
        try {
            // Get access token
            const accessToken = await this.getAccessToken();

            const paymentData = {
                amount: order.total_price.toString(),
                currency: this.getCurrency(user.country),
                externalId: `mg_${order.id}_${Date.now()}`,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: this.formatPhoneNumber(phoneNumber, user.country)
                },
                payerMessage: `Payment for Mallgram Order #${order.id.slice(-8).toUpperCase()}`,
                payeeNote: `Mallgram order payment`
            };

            const response = await axios.post(
                `${this.baseUrl}/collection/v1_0/requesttopay`,
                paymentData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Reference-Id': paymentData.externalId,
                        'X-Target-Environment': this.environment,
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );

            if (response.status === 202) {
                return {
                    payment_id: paymentData.externalId,
                    transaction_id: paymentData.externalId,
                    payment_url: null, // Mobile money doesn't use URLs
                    currency: paymentData.currency,
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
                    gateway_response: response.data,
                    instructions: `Please check your phone for the MTN Mobile Money payment request and follow the prompts to complete your payment of ${paymentData.currency} ${paymentData.amount}.`
                };
            } else {
                throw new Error('Payment initialization failed');
            }

        } catch (error) {
            logger.error('MTN Mobile Money initialization failed:', error);
            throw new Error(`MTN MoMo error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Handle webhook from MTN (polling-based status check)
     */
    async handleWebhook(payload, signature) {
        try {
            // MTN typically uses polling rather than webhooks
            // This is a placeholder for webhook handling if implemented
            
            if (payload.status === 'SUCCESSFUL') {
                return {
                    payment_id: payload.referenceId,
                    transaction_id: payload.financialTransactionId || payload.referenceId,
                    status: 'success',
                    gateway_response: payload
                };
            } else if (payload.status === 'FAILED') {
                return {
                    payment_id: payload.referenceId,
                    transaction_id: payload.referenceId,
                    status: 'failed',
                    gateway_response: payload
                };
            }

            return null;

        } catch (error) {
            logger.error('MTN webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentId, transactionReference) {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseUrl}/collection/v1_0/requesttopay/${transactionReference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Target-Environment': this.environment,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );

            const result = response.data;

            return {
                status: result.status === 'SUCCESSFUL' ? 'verified' : 'failed',
                response: result
            };

        } catch (error) {
            logger.error('MTN verification failed:', error);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Get access token for MTN API
     */
    async getAccessToken() {
        try {
            const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

            const response = await axios.post(
                `${this.baseUrl}/collection/token/`,
                {},
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );

            return response.data.access_token;

        } catch (error) {
            logger.error('MTN token generation failed:', error);
            throw new Error('Failed to get MTN access token');
        }
    }

    /**
     * Format phone number for MTN Mobile Money
     */
    formatPhoneNumber(phoneNumber, country) {
        // Remove any non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Add country code if not present
        const countryCodes = {
            'CM': '237', // Cameroon
            'GH': '233', // Ghana
            'UG': '256', // Uganda
            'RW': '250', // Rwanda
            'ZM': '260'  // Zambia
        };

        const countryCode = countryCodes[country];
        if (countryCode && !cleaned.startsWith(countryCode)) {
            // Remove leading 0 if present and add country code
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            cleaned = countryCode + cleaned;
        }

        return cleaned;
    }

    /**
     * Get currency code for country
     */
    getCurrency(country) {
        const currencyMap = {
            'CM': 'XAF', // Cameroon
            'GH': 'GHS', // Ghana
            'UG': 'UGX', // Uganda
            'RW': 'RWF', // Rwanda
            'ZM': 'ZMW'  // Zambia
        };

        return currencyMap[country] || 'XAF';
    }

    /**
     * Check payment status (for polling)
     */
    async checkPaymentStatus(transactionReference) {
        try {
            const verification = await this.verifyPayment(null, transactionReference);
            return verification.status === 'verified';
        } catch (error) {
            logger.error('MTN status check failed:', error);
            return false;
        }
    }
}

module.exports = new MTNService();
