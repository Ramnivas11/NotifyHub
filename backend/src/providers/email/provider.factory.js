const MockProvider = require("./mock.provider")

class ProviderFactory {
    static getProvider() {
        return new MockProvider();
    }
}
module.exports = ProviderFactory