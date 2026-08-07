const MockProvider = require("./mock.provider");
const ResendProvider = require("./resend.provider");
const env = require("../../config/env");
const PROVIDERS = require("../../constants/provider.constants");
const PermanentProviderError = require("../../errors/permanent-provider.error");
const ERROR_CODES = require("../../constants/error-codes");

const providerRegistry = {
    [PROVIDERS.MOCK]: new MockProvider(),
    [PROVIDERS.RESEND]: new ResendProvider(),
};//registry pattern

class ProviderFactory {
    static getProvider(providerName) {
        const targetProvider =
            providerName || env.EMAIL_PROVIDER || PROVIDERS.MOCK;
        const provider = providerRegistry[targetProvider];

        if (!provider) {
            throw new PermanentProviderError(
                `Unsupported provider: ${targetProvider}`,
                {
                    code: ERROR_CODES.UNSUPPORTED_PROVIDER,
                }
            );
        }

        return provider;
    }
}

module.exports = ProviderFactory;