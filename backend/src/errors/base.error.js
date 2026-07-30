class BaseError extends Error {
    constructor(message, options = {}) {
        super(message);

        this.name = this.constructor.name;
        this.code = options.code ?? "UNKNOWN_ERROR";
        this.retryable = options.retryable ?? false;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = BaseError;