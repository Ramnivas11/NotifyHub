class BaseEmailProvider {
    async send(notification) {
        throw new Error("send() must be implemented by the provider.");
    }
}

module.exports = BaseEmailProvider;