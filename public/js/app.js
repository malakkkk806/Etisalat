// Etisalat UPG Payment Gateway - Frontend JavaScript
class PaymentGateway {
    constructor() {
        this.form = document.getElementById('paymentForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitText = document.getElementById('submitText');
        this.submitSpinner = document.getElementById('submitSpinner');
        this.alertContainer = document.getElementById('alertContainer');
        this.resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
        
        this.init();
    }

    init() {
        // Bind form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Bind tip checkbox to toggle convenience fee section
        const tipCheckbox = document.getElementById('tip');
        tipCheckbox.addEventListener('change', (e) => this.toggleConvenienceFee(e.target.checked));
        
        // Bind convenience fee inputs to prevent both being filled
        const fixedFee = document.getElementById('convenienceFeeFixed');
        const percentageFee = document.getElementById('convenienceFeePercentage');
        
        fixedFee.addEventListener('input', () => {
            if (fixedFee.value) percentageFee.disabled = true;
            else percentageFee.disabled = false;
        });
        
        percentageFee.addEventListener('input', () => {
            if (percentageFee.value) fixedFee.disabled = true;
            else fixedFee.disabled = false;
        });

        // Mobile number formatting
        const mobileInput = document.getElementById('mobileNumber');
        mobileInput.addEventListener('input', (e) => this.formatMobileNumber(e.target));
        
        // Amount validation
        const amountInput = document.getElementById('amount');
        amountInput.addEventListener('input', (e) => this.validateAmount(e.target));
    }

    formatMobileNumber(input) {
        // Remove any non-digit characters
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 14 digits
        if (value.length > 14) {
            value = value.substring(0, 14);
        }
        
        input.value = value;
    }

    validateAmount(input) {
        const value = parseFloat(input.value);
        if (value < 0.01) {
            input.setCustomValidity('Amount must be at least 0.01 EGP');
        } else if (value > 999999) {
            input.setCustomValidity('Amount cannot exceed 999,999 EGP');
        } else {
            input.setCustomValidity('');
        }
    }

    toggleConvenienceFee(tipEnabled) {
        const convenienceSection = document.getElementById('convenienceFeeSection');
        const fixedFee = document.getElementById('convenienceFeeFixed');
        const percentageFee = document.getElementById('convenienceFeePercentage');
        
        if (tipEnabled) {
            convenienceSection.classList.add('disabled');
            fixedFee.disabled = true;
            percentageFee.disabled = true;
            fixedFee.value = '';
            percentageFee.value = '';
        } else {
            convenienceSection.classList.remove('disabled');
            fixedFee.disabled = false;
            percentageFee.disabled = false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Clear previous alerts
        this.clearAlerts();
        
        // Validate form
        if (!this.form.checkValidity()) {
            this.form.classList.add('was-validated');
            this.showAlert('Please fill in all required fields correctly.', 'danger');
            return;
        }

        // Set loading state
        this.setLoadingState(true);
        
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Send request to backend
            const response = await fetch('/api/request-to-pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccessResult(result.data, formData);
            } else {
                this.showErrorResult(result.error || 'Request failed', result);
            }
            
        } catch (error) {
            console.error('Payment request error:', error);
            this.showErrorResult('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Required fields
        data.amount = parseFloat(formData.get('amount'));
        data.mobileNumber = formData.get('mobileNumber').trim();
        
        // Optional fields
        const optionalFields = [
            'merchantReference', 'validity', 'loyaltyNumber', 
            'customerLabel', 'purposeOfTransaction', 'billNumber'
        ];
        
        optionalFields.forEach(field => {
            const value = formData.get(field);
            if (value && value.trim()) {
                data[field] = value.trim();
            }
        });
        
        // Checkbox fields
        data.tip = formData.get('tip') === 'on';
        
        // Convenience fees (only if tip is not enabled)
        if (!data.tip) {
            const fixedFee = formData.get('convenienceFeeFixed');
            const percentageFee = formData.get('convenienceFeePercentage');
            
            if (fixedFee && fixedFee.trim()) {
                data.convenienceFeeFixed = parseFloat(fixedFee);
            } else if (percentageFee && percentageFee.trim()) {
                data.convenienceFeePercentage = parseFloat(percentageFee);
            }
        }
        
        return data;
    }

    showSuccessResult(result, formData) {
        const modalHeader = document.getElementById('modalHeader');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        // Set success header
        modalHeader.className = 'modal-header bg-success text-white';
        modalTitle.innerHTML = '<i class="fas fa-check-circle me-2"></i>Request Sent Successfully!';
        
        // Build success content
        let content = `
            <div class="alert alert-success">
                <i class="fas fa-mobile-alt me-2"></i>
                <strong>Payment request has been sent to ${formData.mobileNumber}</strong>
                <p class="mb-0 mt-2">The customer will receive a notification to approve or decline the payment of <strong>${formData.amount} EGP</strong>.</p>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>Amount:</strong> ${formData.amount} EGP
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>Mobile Number:</strong> ${formData.mobileNumber}
                    </div>
                </div>
        `;
        
        if (result.SystemReference) {
            content += `
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>System Reference:</strong> ${result.SystemReference}
                    </div>
                </div>
            `;
        }
        
        if (result.TxnId) {
            content += `
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>Transaction ID:</strong> ${result.TxnId}
                    </div>
                </div>
            `;
        }
        
        if (result.TxnDate) {
            content += `
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>Transaction Date:</strong> ${result.TxnDate}
                    </div>
                </div>
            `;
        }
        
        if (result.Validity) {
            content += `
                <div class="col-md-6">
                    <div class="result-item">
                        <strong>Valid For:</strong> ${result.Validity} minutes
                    </div>
                </div>
            `;
        }
        
        content += '</div>';
        
        if (formData.merchantReference) {
            content += `
                <div class="result-item mt-3">
                    <strong>Merchant Reference:</strong> ${formData.merchantReference}
                </div>
            `;
        }
        
        // Add full response details
        content += `
            <details class="mt-4">
                <summary class="btn btn-outline-secondary btn-sm mb-3">
                    <i class="fas fa-code me-2"></i>View Full Response
                </summary>
                <div class="json-output">${JSON.stringify(result, null, 2)}</div>
            </details>
        `;
        
        modalBody.innerHTML = content;
        this.resultModal.show();
        
        // Reset form
        this.form.reset();
        this.form.classList.remove('was-validated');
        this.toggleConvenienceFee(false);
    }

    showErrorResult(errorMessage, fullResult = null) {
        const modalHeader = document.getElementById('modalHeader');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        // Set error header
        modalHeader.className = 'modal-header bg-danger text-white';
        modalTitle.innerHTML = '<i class="fas fa-times-circle me-2"></i>Request Failed';
        
        // Build error content
        let content = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${errorMessage}
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Please check your details and try again. If the problem persists, contact support.
            </div>
        `;
        
        if (fullResult) {
            content += `
                <details class="mt-4">
                    <summary class="btn btn-outline-secondary btn-sm mb-3">
                        <i class="fas fa-bug me-2"></i>Technical Details
                    </summary>
                    <div class="json-output">${JSON.stringify(fullResult, null, 2)}</div>
                </details>
            `;
        }
        
        modalBody.innerHTML = content;
        this.resultModal.show();
    }

    setLoadingState(loading) {
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitText.textContent = 'Sending Request...';
            this.submitSpinner.classList.remove('d-none');
            this.form.classList.add('loading');
        } else {
            this.submitBtn.disabled = false;
            this.submitText.textContent = 'Send Payment Request';
            this.submitSpinner.classList.add('d-none');
            this.form.classList.remove('loading');
        }
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show slide-in`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        this.alertContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    clearAlerts() {
        this.alertContainer.innerHTML = '';
    }
}

// Utility functions
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy to clipboard', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy to clipboard', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 250px;';
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
}

function formatMobileNumber(number) {
    // Format Egyptian mobile number
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return number;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Etisalat UPG Payment Gateway - Frontend Initialized');
    new PaymentGateway();
    
    // Add click handlers for any copyable elements
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-copy')) {
            copyToClipboard(e.target.textContent);
        }
    });
});

// Handle browser back button
window.addEventListener('popstate', function(e) {
    location.reload();
});
