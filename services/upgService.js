const axios = require('axios');
const { generateSecureHash, generateTransactionDateTime } = require('../utils/hash');

// UPG API Configuration
const UPG_BASE_URL = process.env.UPG_BASE_URL || 'https://upg.egyptianbanks.com/cube/paylink.svc/api';
const REQUEST_TO_PAY_ENDPOINT = '/RequestToPay';

/**
 * Sends Request to Pay (R2P) to UPG API
 * @param {Object} paymentData - Payment request parameters
 * @param {number} paymentData.amountTrxn - Amount in piasters (required)
 * @param {number} paymentData.currency - ISO 4217 currency code (e.g., 818 for EGP) (required)
 * @param {string} paymentData.validity - Transaction validity in minutes (optional)
 * @param {string} paymentData.merchantReference - Merchant reference (optional)
 * @param {string} paymentData.mobileNumber - Consumer mobile number or Tahweel merchant ID (required)
 * @param {string} paymentData.merchantId - UPG Merchant ID (required)
 * @param {string} paymentData.terminalId - UPG Terminal ID (required)
 * @param {string} paymentData.merchantSecretKey - Merchant secret key for HMAC (required)
 * @param {string} paymentData.loyaltyNumber - Loyalty number (optional)
 * @param {string} paymentData.customerLabel - Customer label (optional)
 * @param {string} paymentData.purposeOfTransaction - Purpose of transaction (optional)
 * @param {string} paymentData.billNumber - Bill number (optional)
 * @param {boolean} paymentData.tip - Enable tip (optional)
 * @param {number} paymentData.convenienceFeeFixed - Fixed convenience fee in piasters (optional)
 * @param {number} paymentData.convenienceFeePercentage - Convenience fee percentage (optional)
 * @returns {Promise<Object>} - UPG API response
 */
async function requestToPay(paymentData) {
    try {
        // Validate required fields
        const requiredFields = ['amountTrxn', 'currency', 'mobileNumber', 'merchantId', 'terminalId', 'merchantSecretKey'];
        for (const field of requiredFields) {
            if (!paymentData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Generate unique transaction date time
        const dateTimeLocalTrxn = generateTransactionDateTime();

        // Generate secure hash
        const secureHash = generateSecureHash(
            dateTimeLocalTrxn,
            paymentData.merchantId,
            paymentData.terminalId,
            paymentData.merchantSecretKey
        );

        // Prepare request payload according to UPG API specification
        const requestPayload = {
            AmountTrxn: parseInt(paymentData.amountTrxn),
            Currency: parseInt(paymentData.currency),
            MerchantReference: paymentData.merchantReference || '',
            MobileNumber: paymentData.mobileNumber,
            MerchantId: paymentData.merchantId,
            TerminalId: paymentData.terminalId,
            DateTimeLocalTrxn: dateTimeLocalTrxn,
            SecureHash: secureHash
        };

        // Add optional fields if provided
        if (paymentData.validity) {
            requestPayload.Validity = paymentData.validity.toString();
        }
        
        if (paymentData.loyaltyNumber) {
            requestPayload.LoyaltyNumber = paymentData.loyaltyNumber;
        }
        
        if (paymentData.customerLabel) {
            requestPayload.CustomerLabel = paymentData.customerLabel;
        }
        
        if (paymentData.purposeOfTransaction) {
            requestPayload.PurposeOfTransaction = paymentData.purposeOfTransaction;
        }
        
        if (paymentData.billNumber) {
            requestPayload.BillNumber = paymentData.billNumber;
        }
        
        if (paymentData.tip === true) {
            requestPayload.Tip = true;
        }
        
        if (paymentData.convenienceFeeFixed && !paymentData.tip && !paymentData.convenienceFeePercentage) {
            requestPayload.ConvenienceFeeFixed = parseFloat(paymentData.convenienceFeeFixed);
        }
        
        if (paymentData.convenienceFeePercentage && !paymentData.tip && !paymentData.convenienceFeeFixed) {
            requestPayload.ConvenienceFeePercentage = parseFloat(paymentData.convenienceFeePercentage);
        }

        console.log('Sending Request to Pay:', {
            ...requestPayload,
            SecureHash: '***HIDDEN***'
        });

        // Make API call to UPG
        const response = await axios.post(
            `${UPG_BASE_URL}${REQUEST_TO_PAY_ENDPOINT}`,
            requestPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout
            }
        );

        console.log('UPG API Response:', response.data);
        return response.data;

    } catch (error) {
        console.error('Request to Pay Error:', error);
        
        if (error.response) {
            // API responded with error status
            throw new Error(`UPG API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('No response received from UPG API. Please check network connectivity.');
        } else {
            // Something else happened
            throw new Error(`Request setup error: ${error.message}`);
        }
    }
}

module.exports = {
    requestToPay
};
