const crypto = require('crypto');

/**
 * Generates HMAC-SHA256 secure hash for UPG API authentication
 * @param {string} dateTimeLocalTrxn - Transaction date time in format YYMMDDHHMMSSmm
 * @param {string} merchantId - UPG Merchant ID
 * @param {string} terminalId - UPG Terminal ID
 * @param {string} merchantSecretKey - Hex encoded merchant secret key provided by Etisalat
 * @returns {string} - Uppercase hex encoded HMAC-SHA256 hash
 */
function generateSecureHash(dateTimeLocalTrxn, merchantId, terminalId, merchantSecretKey) {
    try {
        // Create the string to be hashed by concatenating parameters in alphabetical order
        // According to documentation: DateTimeLocalTrxn + MerchantId + TerminalId
        const dataString = `DateTimeLocalTrxn=${dateTimeLocalTrxn}&MerchantId=${merchantId}&TerminalId=${terminalId}`;
        
        // Convert hex encoded secret key to buffer
        const keyBuffer = Buffer.from(merchantSecretKey, 'hex');
        
        // Generate HMAC-SHA256
        const hmac = crypto.createHmac('sha256', keyBuffer);
        hmac.update(dataString, 'utf8');
        
        // Return uppercase hex encoded hash
        return hmac.digest('hex').toUpperCase();
    } catch (error) {
        throw new Error(`Failed to generate secure hash: ${error.message}`);
    }
}

/**
 * Generates unique transaction date time in UPG format
 * @returns {string} - Date time in format YYMMDDHHMMSSmm
 */
function generateTransactionDateTime() {
    const now = new Date();
    
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0').slice(0, 2);
    
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

module.exports = {
    generateSecureHash,
    generateTransactionDateTime
};
