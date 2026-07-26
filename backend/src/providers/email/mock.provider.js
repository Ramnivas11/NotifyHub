const BaseEmailProvider = require("./base.provider");

class MockProvider extends BaseEmailProvider {
    async send(notification) {
        console.log("Sending notification via mock provider:");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(`Email sent to ${notification.recipient}`);
    }
}
module.exports = MockProvider