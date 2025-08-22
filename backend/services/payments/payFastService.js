/**
 * PayFast Service
 * 
 * Integrates with PayFast payment gateway for South African payments.
 * Supports credit/debit cards, EFT, SnapScan, and other local payment methods.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

class PayFastService {
    constructor() {
        this.baseUrl = process.env.PAYFAST_BASE_URL || 'https://www.payfast.co.za/eng/process';
        this.sandboxUrl = 'https://sandbox.payfast.co.za/eng/process';
        this.merchantId = process.env.PAYFAST_MERCHANT_ID;
        this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
        this.passphrase = process.env.PAYFAST_PASSPHRASE;
        this.testMode = process.env.NODE_ENV !== 'production';
    }

    /**
     * Initialize PayFast payment
     */
    async initializePayment(order, user, returnUrl) {
        try {
            const reference = `mg_${order.id}_${Date.now()}`;
            
            const paymentData = {
                merchant_id: this.merchantId,
                merchant_key: this.merchantKey,
                return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
                notify_url: `${process.env.API_URL}/payments/webhook`,
                name_first: user.full_name.split(' ')[0] || user.full_name,
                name_last: user.full_name.split(' ').slice(1).join(' ') || '',
                email_address: user.email,
                m_payment_id: reference,
                amount: order.total_price.toFixed(2),
                item_name: `Mallgram Order #${order.id.slice(-8).toUpperCase()}`,
                item_description: `Payment for Mallgram order containing ${order.order_items?.length || 1} items`,
                custom_str1: order.id,
                custom_str2: user.id,
                custom_str3: 'mallgram',
                email_confirmation: '1',
                confirmation_address: user.email
            };

            // Add passphrase if configured
            if (this.passphrase) {
                paymentData.passphrase = this.passphrase;
            }

            // Generate signature
            paymentData.signature = this.generateSignature(paymentData);

            // Remove passphrase from data before sending
            delete paymentData.passphrase;

            const paymentUrl = this.testMode ? this.sandboxUrl : this.baseUrl;
            const queryString = new URLSearchParams(paymentData).toString();
            const fullPaymentUrl = `${paymentUrl}?${queryString}`;

            return {
                payment_id: reference,
                transaction_id: reference,
                payment_url: fullPaymentUrl,
                currency: 'ZAR',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
                gateway_response: paymentData,
                instructions: 'You will be redirected to PayFast to complete your payment securely.'
            };

        } catch (error) {
            logger.error('PayFast initialization failed:', error);
            throw new Error(`PayFast error: ${error.message}`);
        }
    }

    /**
     * Handle webhook from PayFast
     */
    async handleWebhook(payload, signature) {
        try {
            // PayFast sends data as URL-encoded form data
            const data = typeof payload === 'string' ? this.parseFormData(payload) : payload;

            // Verify signature
            if (!this.verifySignature(data)) {
                throw new Error('Invalid PayFast signature');
            }

            // Verify payment with PayFast
            const isValid = await this.validatePayment(data);
            if (!isValid) {
                throw new Error('Payment validation failed');
            }

            const paymentStatus = data.payment_status;
            let status = 'pending';

            if (paymentStatus === 'COMPLETE') {
                status = 'success';
            } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
                status = 'failed';
            }

            return {
                payment_id: data.custom_str1, // Order ID stored in custom_str1
                transaction_id: data.pf_payment_id || data.m_payment_id,
                status,
                gateway_response: data
            };

        } catch (error) {
            logger.error('PayFast webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentId, transactionReference) {
        try {
            // PayFast doesn't have a direct verification endpoint
            // Verification is typically done through the webhook
            // This is a placeholder implementation
            
            return {
                status: 'verified',
                response: { message: 'PayFast verification completed via webhook' }
            };

        } catch (error) {
            logger.error('PayFast verification failed:', error);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Generate PayFast signature
     */
    generateSignature(data) {
        // Create parameter string
        let paramString = '';
        const sortedKeys = Object.keys(data).filter(key => 
            key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined
        ).sort();

        sortedKeys.forEach(key => {
            paramString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
        });

        // Remove trailing &
        paramString = paramString.slice(0, -1);

        // Add passphrase if configured
        if (this.passphrase) {
            paramString += `&passphrase=${encodeURIComponent(this.passphrase.trim()).replace(/%20/g, '+')}`;
        }

        return crypto.createHash('md5').update(paramString).digest('hex');
    }

    /**
     * Verify signature from PayFast response
     */
    verifySignature(data) {
        const receivedSignature = data.signature;
        delete data.signature; // Remove signature for calculation
        
        const calculatedSignature = this.generateSignature(data);
        
        return receivedSignature === calculatedSignature;
    }

    /**
     * Validate payment with PayFast servers
     */
    async validatePayment(data) {
        try {
            const validateUrl = this.testMode 
                ? 'https://sandbox.payfast.co.za/eng/query/validate'
                : 'https://www.payfast.co.za/eng/query/validate';

            // Create parameter string for validation
            let paramString = '';
            Object.keys(data).forEach(key => {
                if (key !== 'signature') {
                    paramString += `${key}=${encodeURIComponent(data[key])}&`;
                }
            });
            paramString = paramString.slice(0, -1); // Remove trailing &

            const response = await axios.post(
                validateUrl,
                paramString,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 10000
                }
            );

            return response.data === 'VALID';

        } catch (error) {
            logger.error('PayFast validation request failed:', error);
            return false;
        }
    }

    /**
     * Parse form data string into object
     */
    parseFormData(formString) {
        const result = {};
        const pairs = formString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                result[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
            }
        });
        
        return result;
    }

    /**
     * Get supported payment methods
     */
    getSupportedPaymentMethods() {
        return [
            {
                id: 'cc',
                name: 'Credit/Debit Card',
                description: 'Visa, Mastercard'
            },
            {
                id: 'eft',
                name: 'Electronic Funds Transfer',
                description: 'Direct bank transfer'
            },
            {
                id: 'snapscan',
                name: 'SnapScan',
                description: 'Mobile payment app'
            },
            {
                id: 'mobicred',
                name: 'Mobicred',
                description: 'Buy now, pay later'
            }
        ];
    }

    /**
     * Check if PayFast is available for country
     */
    isAvailableInCountry(country) {
        // PayFast is primarily for South Africa
        return country === 'ZA';
    }

    /**
     * Format amount for PayFast
     */
    formatAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }

    /**
     * Get test card details for sandbox
     */
    getTestCardDetails() {
        if (!this.testMode) {
            return null;
        }

        return {
            card_number: '4000000000000002',
            expiry_month: '12',
            expiry_year: '2025',
            cvv: '123',
            description: 'Test card for sandbox environment'
        };
    }
}

module.exports = new PayFastService();
