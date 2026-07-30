const NotificationError = require("./notification.error");

class ProviderError extends NotificationError {
    constructor(message, options = {}) {
        super(message, {
            code: options.code ?? "PROVIDER_ERROR",
            retryable: options.retryable ?? false,
        });
    }
}

module.exports = ProviderError;