const BaseEmailProvider = require("./base.provider");
const PROVIDERS = require("../../constants/provider.constants");

class ResendProvider extends BaseEmailProvider {
    constructor() {
        super();
        this.name = PROVIDERS.RESEND;
    }

    async send(notification) {
        throw new Error("ResendProvider send() not fully implemented yet.");
    }
}

module.exports = ResendProvider;
