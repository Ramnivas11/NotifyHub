const ProviderError = require("./provider.error");

class RetryableProviderError extends ProviderError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            retryable: true,
        });
    }
}

module.exports = RetryableProviderError;