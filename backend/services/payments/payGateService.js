/**
 * PayGate Service
 * 
 * Integrates with PayGate payment gateway for South African payments.
 * Supports credit/debit cards, EFT, and other local payment methods.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

class PayGateService {
    constructor() {
        this.baseUrl = process.env.PAYGATE_BASE_URL || 'https://secure.paygate.co.za/payweb3/process.trans';
        this.payGateId = process.env.PAYGATE_ID;
        this.payGateKey = process.env.PAYGATE_SECRET_KEY;
        this.testMode = process.env.NODE_ENV !== 'production';
    }

    /**
     * Initialize PayGate payment
     */
    async initializePayment(order, user, returnUrl) {
        try {
            const reference = `mg_${order.id}_${Date.now()}`;
            const amount = Math.round(order.total_price * 100); // Convert to cents

            const paymentData = {
                PAYGATE_ID: this.payGateId,
                REFERENCE: reference,
                AMOUNT: amount,
                CURRENCY: 'ZAR',
                RETURN_URL: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
                TRANSACTION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' '),
                LOCALE: 'en-za',
                COUNTRY: 'ZAF',
                EMAIL: user.email,
                PAY_METHOD: '', // Let user choose
                PAY_METHOD_DETAIL: '',
                NOTIFY_URL: `${process.env.API_URL}/payments/webhook`,
                USER1: order.id, // Store order ID for reference
                USER2: user.id,  // Store user ID for reference
                USER3: 'mallgram'
            };

            // Generate checksum
            paymentData.CHECKSUM = this.generateChecksum(paymentData);

            // Create form data for POST request
            const formData = new URLSearchParams(paymentData);

            const response = await axios.post(
                this.baseUrl,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // PayGate returns HTML with redirect
            const responseText = response.data;
            
            // Extract PAY_REQUEST_ID from response
            const payRequestIdMatch = responseText.match(/PAY_REQUEST_ID=([^&"]+)/);
            const payRequestId = payRequestIdMatch ? payRequestIdMatch[1] : null;

            if (payRequestId) {
                const paymentUrl = `https://secure.paygate.co.za/payweb3/process.trans?PAY_REQUEST_ID=${payRequestId}`;

                return {
                    payment_id: reference,
                    transaction_id: payRequestId,
                    payment_url: paymentUrl,
                    currency: 'ZAR',
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
                    gateway_response: { PAY_REQUEST_ID: payRequestId },
                    instructions: 'You will be redirected to PayGate to complete your payment securely.'
                };
            } else {
                throw new Error('Failed to get payment URL from PayGate');
            }

        } catch (error) {
            logger.error('PayGate initialization failed:', error);
            throw new Error(`PayGate error: ${error.response?.data || error.message}`);
        }
    }

    /**
     * Handle webhook from PayGate
     */
    async handleWebhook(payload, signature) {
        try {
            // PayGate sends data as URL-encoded form data
            const data = typeof payload === 'string' ? this.parseFormData(payload) : payload;

            // Verify checksum
            if (!this.verifyChecksum(data)) {
                throw new Error('Invalid PayGate checksum');
            }

            const transactionStatus = data.TRANSACTION_STATUS;
            let status = 'pending';

            if (transactionStatus === '1') {
                status = 'success';
            } else if (transactionStatus === '2') {
                status = 'failed';
            } else if (transactionStatus === '4') {
                status = 'cancelled';
            }

            return {
                payment_id: data.USER1, // Order ID stored in USER1
                transaction_id: data.PAY_REQUEST_ID,
                status,
                gateway_response: data
            };

        } catch (error) {
            logger.error('PayGate webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentId, transactionReference) {
        try {
            const queryData = {
                PAYGATE_ID: this.payGateId,
                PAY_REQUEST_ID: transactionReference,
                REFERENCE: paymentId
            };

            queryData.CHECKSUM = this.generateChecksum(queryData);

            const formData = new URLSearchParams(queryData);

            const response = await axios.post(
                'https://secure.paygate.co.za/payweb3/query.trans',
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const result = this.parseFormData(response.data);

            return {
                status: result.TRANSACTION_STATUS === '1' ? 'verified' : 'failed',
                response: result
            };

        } catch (error) {
            logger.error('PayGate verification failed:', error);
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Generate PayGate checksum
     */
    generateChecksum(data) {
        // Create string of values in alphabetical order of keys
        const sortedKeys = Object.keys(data).filter(key => key !== 'CHECKSUM').sort();
        const valueString = sortedKeys.map(key => data[key]).join('');
        
        // Append secret key
        const stringToHash = valueString + this.payGateKey;
        
        return crypto.createHash('md5').update(stringToHash).digest('hex').toUpperCase();
    }

    /**
     * Verify checksum from PayGate response
     */
    verifyChecksum(data) {
        const receivedChecksum = data.CHECKSUM;
        const calculatedChecksum = this.generateChecksum(data);
        
        return receivedChecksum === calculatedChecksum;
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
                result[decodeURIComponent(key)] = decodeURIComponent(value);
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
                id: 'CC',
                name: 'Credit Card',
                description: 'Visa, Mastercard, American Express'
            },
            {
                id: 'EFT',
                name: 'Electronic Funds Transfer',
                description: 'Direct bank transfer'
            },
            {
                id: 'BT',
                name: 'Bank Transfer',
                description: 'Manual bank transfer'
            }
        ];
    }

    /**
     * Format amount for PayGate (in cents)
     */
    formatAmount(amount) {
        return Math.round(parseFloat(amount) * 100);
    }

    /**
     * Check if PayGate is available for country
     */
    isAvailableInCountry(country) {
        // PayGate is primarily for South Africa
        return country === 'ZA';
    }
}

module.exports = new PayGateService();
