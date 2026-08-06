const MockProvider = require("./mock.provider");
const ResendProvider = require("./resend.provider");

const PROVIDERS = require("../../constants/provider.constants");
const PermanentProviderError = require("../../errors/permanent-provider.error");
const ERROR_CODES = require("../../constants/error-codes");

const providerInstances = {
    [PROVIDERS.MOCK]: new MockProvider(),
    [PROVIDERS.RESEND]: new ResendProvider(),
};

class ProviderFactory {
    static getProvider(providerName) {
        const targetProvider =
            providerName || process.env.DEFAULT_PROVIDER || PROVIDERS.MOCK;
        const provider = providerInstances[targetProvider];

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