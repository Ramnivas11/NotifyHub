const { Resend } = require("resend");

const BaseEmailProvider = require("./base.provider");
const env = require("../../config/env");

const RetryableProviderError =
    require("../../errors/retryable-provider.error");

const PermanentProviderError =
    require("../../errors/permanent-provider.error");

const PROVIDERS =
    require("../../constants/provider.constants");

const ERROR_CODES =
    require("../../constants/error-codes");

class ResendProvider extends BaseEmailProvider {
    constructor() {
        super();

        this.name = PROVIDERS.RESEND;

        this.client = new Resend(
            env.RESEND_API_KEY
        );
    }

    buildPayload(notification) {
        return {
            from: env.EMAIL_FROM,
            to: notification.recipient,
            subject: notification.title,
            html: `
                <h2>${notification.title}</h2>
                <p>${notification.message}</p>
            `,
        };
    }

    async send(notification) {
        const payload =
            this.buildPayload(notification);

        const start = Date.now();

        const { data, error } =
            await this.client.emails.send(payload);

        if (error) {
            this.translateError(error);
        }

        return {
            providerMessageId: data.id,
            provider: this.name,
            latency: Date.now() - start,
        };
    }

    translateError(error) {
        const status =
            error?.statusCode ||
            error?.status ||
            500;

        if (
            status === 429 ||
            status >= 500
        ) {
            throw new RetryableProviderError(
                error.message,
                {
                    code:
                        status === 429
                            ? ERROR_CODES.RATE_LIMITED
                            : ERROR_CODES.PROVIDER_UNAVAILABLE,
                    provider: this.name,
                    status,
                }
            );
        }

        throw new PermanentProviderError(
            error.message,
            {
                code:
                    status === 401 || status === 403
                        ? ERROR_CODES.AUTHENTICATION_FAILED
                        : ERROR_CODES.UNKNOWN_PROVIDER_ERROR,
                provider: this.name,
                status,
            }
        );
    }
}

module.exports = ResendProvider;