require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { requestToPay } = require('./services/upgService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration from environment variables
const CONFIG = {
    MERCHANT_ID: process.env.MERCHANT_ID,
    TERMINAL_ID: process.env.TERMINAL_ID,
    MERCHANT_SECRET_KEY: process.env.MERCHANT_SECRET_KEY,
    BASE_URL: process.env.UPG_BASE_URL || 'https://upg.egyptianbanks.com/cube/paylink.svc/api',
    CURRENCY_EGP: parseInt(process.env.DEFAULT_CURRENCY) || 818,
    DEFAULT_VALIDITY: process.env.DEFAULT_VALIDITY_MINUTES || '30'
};

// Validate required environment variables
if (!CONFIG.MERCHANT_ID || !CONFIG.TERMINAL_ID || !CONFIG.MERCHANT_SECRET_KEY) {
    console.error('❌ Missing required environment variables. Please check your .env file.');
    console.error('Required: MERCHANT_ID, TERMINAL_ID, MERCHANT_SECRET_KEY');
    process.exit(1);
}

// Routes

/**
 * GET / - Serve the main HTML page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * POST /api/request-to-pay - Process payment request (API endpoint)
 */
app.post('/api/request-to-pay', async (req, res) => {
    try {
        const {
            amount,
            mobileNumber,
            merchantReference,
            validity,
            loyaltyNumber,
            customerLabel,
            purposeOfTransaction,
            billNumber,
            tip,
            convenienceFeeFixed,
            convenienceFeePercentage
        } = req.body;

        // Validate input
        if (!amount || !mobileNumber) {
            return res.status(400).json({
                success: false,
                error: 'Amount and Mobile Number are required fields.'
            });
        }

        // Convert amount from EGP to piasters (multiply by 100)
        const amountInPiasters = Math.round(parseFloat(amount) * 100);

        if (amountInPiasters <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be greater than zero.'
            });
        }

        // Prepare payment data
        const paymentData = {
            amountTrxn: amountInPiasters,
            currency: CONFIG.CURRENCY_EGP,
            mobileNumber: mobileNumber.trim(),
            merchantId: CONFIG.MERCHANT_ID,
            terminalId: CONFIG.TERMINAL_ID,
            merchantSecretKey: CONFIG.MERCHANT_SECRET_KEY,
            merchantReference: merchantReference || `REF_${Date.now()}`,
            validity: validity || CONFIG.DEFAULT_VALIDITY
        };

        // Add optional fields if provided
        if (loyaltyNumber) paymentData.loyaltyNumber = loyaltyNumber.trim();
        if (customerLabel) paymentData.customerLabel = customerLabel.trim();
        if (purposeOfTransaction) paymentData.purposeOfTransaction = purposeOfTransaction.trim();
        if (billNumber) paymentData.billNumber = billNumber.trim();
        if (tip === 'true') paymentData.tip = true;
        if (convenienceFeeFixed && !tip) paymentData.convenienceFeeFixed = parseFloat(convenienceFeeFixed);
        if (convenienceFeePercentage && !tip && !convenienceFeeFixed) {
            paymentData.convenienceFeePercentage = parseFloat(convenienceFeePercentage);
        }

        console.log('Processing Request to Pay for amount:', amountInPiasters, 'piasters');

        // Call UPG API
        const result = await requestToPay(paymentData);

        // Return success result
        res.json({
            success: true,
            data: result,
            paymentData: {
                amount: amount,
                mobileNumber: mobileNumber,
                merchantReference: paymentData.merchantReference
            }
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Payment request failed'
        });
    }
});

/**
 * GET /status - Health check endpoint
 */
app.get('/status', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Etisalat UPG Request to Pay',
        timestamp: new Date().toISOString(),
        config: {
            merchantId: CONFIG.MERCHANT_ID,
            terminalId: CONFIG.TERMINAL_ID,
            currency: 'EGP (818)'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'An internal server error occurred. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Etisalat UPG Payment Server running on port ${PORT}`);
    console.log(`📱 Access the payment form at: http://localhost:${PORT}`);
    console.log(`🔧 Health check at: http://localhost:${PORT}/status`);
    console.log(`💳 Merchant ID: ${CONFIG.MERCHANT_ID}`);
    console.log(`🏪 Terminal ID: ${CONFIG.TERMINAL_ID}`);
});

module.exports = app;
