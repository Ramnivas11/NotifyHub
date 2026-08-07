const { Resend } = require("resend");

const BaseEmailProvider = require("./base.provider");
const env = require("../../config/env");

const PROVIDERS = require("../../constants/provider.constants");

class ResendProvider extends BaseEmailProvider {
    constructor() {
        super();

        this.name = PROVIDERS.RESEND;

        this.client = new Resend(env.RESEND_API_KEY);
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
        const payload = this.buildPayload(notification);

        const start = Date.now();

        const { data, error } = await this.client.emails.send(payload);

        if (error) {
            throw error;
        }

        return {
            providerMessageId: data.id,

            provider: this.name,

            latency: Date.now() - start,
        };
    }
}

module.exports = ResendProvider;
