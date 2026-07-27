const MockProvider = require("./mock.provider");
const mockProvider = new MockProvider();

class ProviderFactory {
    static getProvider(providerName = "mock") {
        switch (providerName) {
            case "mock":
                return mockProvider;

            default:
                throw new Error(
                    `Unsupported email provider: ${providerName}`
                );
        }
    }
}

module.exports = ProviderFactory;