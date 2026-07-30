const BaseError = require("./base.error");


class NotificationError extends BaseError {
    constructor(message, options = {}) {
        super(message, {
            code: options.code ?? "NOTIFICATION_ERROR",
            statusCode: options.statusCode ?? 500,
            retryable: options.retryable ?? false,
        });
    }
}

module.exports = NotificationError;