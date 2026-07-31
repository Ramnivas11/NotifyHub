const BaseEmailProvider = require("./base.provider");

class MockProvider extends BaseEmailProvider {
    async send(notification) {

        const start = Date.now();

        const delay =
            Math.floor(Math.random() * 150) + 50;

        await new Promise(resolve =>
            setTimeout(resolve, delay)
        );

        return {
            providerMessageId: crypto.randomUUID(),
            provider: "mock",
            latency: Date.now() - start,
        };

    }
}
module.exports = MockProvider