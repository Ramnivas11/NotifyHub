const ProviderError = require("./provider.error");

class PermanentProviderError extends ProviderError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            retryable: false,
        });
    }
}

module.exports = PermanentProviderError;