const MockProvider = require("./mock.provider");
const ResendProvider = require("./resend.provider");

const PROVIDERS = require("../../constants/provider.constants");
const PermanentProviderError = require("../../errors/permanent-provider.error");
const ERROR_CODES = require("../../constants/error-codes");

const providers = {
    [PROVIDERS.MOCK]: new MockProvider(),
    [PROVIDERS.RESEND]: new ResendProvider(),
};

class ProviderFactory {
    static getProvider(providerName) {
        const provider = providers[providerName];

        if (!provider) {
            throw new PermanentProviderError(
                `Unsupported provider: ${providerName}`,
                {
                    code: ERROR_CODES.UNSUPPORTED_PROVIDER,
                }
            );
        }

        return provider;
    }
}

module.exports = ProviderFactory;