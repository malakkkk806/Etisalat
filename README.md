# Etisalat UPG Payment Gateway - Request to Pay

A Node.js Express application implementing the **Request to Pay (R2P)** functionality from the Etisalat UPG Wallet API.

## 🚀 Features

- **Request to Pay (R2P)** implementation using Etisalat UPG production API
- Secure HMAC-SHA256 authentication
- User-friendly payment form with validation
- Support for all optional parameters (loyalty number, customer label, etc.)
- Real-time payment request processing
- Mobile-responsive design
- Error handling and validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Etisalat UPG Merchant credentials:
  - Merchant ID
  - Terminal ID
  - Merchant Secret Key

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   cd "f:\E-Wallets\Etisalat Pay"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional)
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MERCHANT_ID=your_merchant_id
   TERMINAL_ID=your_terminal_id
   MERCHANT_SECRET_KEY=your_secret_key
   NODE_ENV=production
   ```

4. **Update configuration in server.js**
   If not using environment variables, update the CONFIG object in `server.js`:
   ```javascript
   const CONFIG = {
       MERCHANT_ID: 'your_merchant_id',
       TERMINAL_ID: 'your_terminal_id',
       MERCHANT_SECRET_KEY: 'your_hex_encoded_secret_key',
       CURRENCY_EGP: 818
   };
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or your specified PORT).

## 🌐 API Endpoints

### 1. Payment Form
- **URL:** `GET /`
- **Description:** Displays the payment request form
- **Response:** HTML form for collecting payment details

### 2. Process Payment Request
- **URL:** `POST /request-to-pay`
- **Description:** Processes the Request to Pay submission
- **Parameters:**
  - `amount` (required): Amount in EGP
  - `mobileNumber` (required): Customer's mobile number
  - `merchantReference` (optional): Merchant reference
  - `validity` (optional): Request validity in minutes
  - `loyaltyNumber` (optional): Customer loyalty number
  - `customerLabel` (optional): Customer label
  - `purposeOfTransaction` (optional): Transaction purpose
  - `billNumber` (optional): Bill number
  - `tip` (optional): Enable tip option
  - `convenienceFeeFixed` (optional): Fixed convenience fee
  - `convenienceFeePercentage` (optional): Percentage convenience fee

### 3. Health Check
- **URL:** `GET /status`
- **Description:** Returns service status and configuration
- **Response:** JSON with service information

## 📱 Usage

1. **Open the application** in your browser: `http://localhost:3000`

2. **Fill the payment form:**
   - Enter the payment amount in EGP
   - Enter the customer's mobile number (Tahweel registered)
   - Optionally add merchant reference and other details
   - Select validity period for the request

3. **Submit the request:**
   - Click "Send Payment Request"
   - View the response from Etisalat UPG API
   - Share transaction details with the customer

4. **Customer receives notification:**
   - Customer gets R2P notification on their mobile device
   - They can approve or decline the payment request
   - Use the transaction reference to track payment status

## 🔐 Security Features

- **HMAC-SHA256 Authentication:** All requests are signed using merchant secret key
- **Unique Transaction IDs:** Each request generates a unique timestamp-based ID
- **Input Validation:** Form inputs are validated both client and server-side
- **Secure Hash Generation:** Implements UPG specification for secure hash calculation

## 📊 API Response

### Successful Request Response:
```json
{
    "Message": null,
    "Success": true,
    "ISOQR": "0002010102120216195195000000003752...",
    "MName": null,
    "MerchantReference": "REF_1234567890",
    "ReceiverAccountNumber": "01234567890",
    "ReceiverName": null,
    "ReceiverScheme": "UPGS-NBE-Staging",
    "SystemReference": 31922,
    "TxnDate": "20231226180303",
    "Validity": "30",
    "TxnId": 31922
}
```

## 🔧 Configuration

### Default Configuration:
- **API URL:** Production (`https://upg.egyptianbanks.com/cube/paylink.svc/api`)
- **Currency:** EGP (818)
- **Default Validity:** 30 minutes
- **Timeout:** 30 seconds

### Environment Variables:
- `PORT`: Server port (default: 3000)
- `MERCHANT_ID`: Your UPG Merchant ID
- `TERMINAL_ID`: Your UPG Terminal ID
- `MERCHANT_SECRET_KEY`: Your hex-encoded secret key
- `NODE_ENV`: Environment (development/production)

## 📝 File Structure

```
f:\E-Wallets\Etisalat Pay\
├── package.json
├── server.js                 # Main Express application
├── utils/
│   └── hash.js              # HMAC-SHA256 utility functions
├── services/
│   └── upgService.js        # UPG API integration service
└── views/
    ├── payment-form.ejs     # Payment request form
    ├── payment-result.ejs   # Payment result page
    └── error.ejs            # Error page template
```

## 🚦 Error Handling

The application handles various error scenarios:
- Invalid merchant credentials
- Network connectivity issues
- API timeout errors
- Validation failures
- UPG API errors with detailed response codes

## 📞 Support

For technical support and merchant account setup, contact Etisalat UPG integration team.

## 📄 License

MIT License - See LICENSE file for details

---

**Note:** This implementation uses the production UPG API. Ensure you have valid merchant credentials before testing with real transactions.
