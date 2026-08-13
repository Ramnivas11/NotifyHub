const app = require("./app");
const env = require("./config/env");

const scheduleRecovery =
    require("./queues/recovery.scheduler");

const PORT = env.PORT || 3000;

const startServer = async () => {
    try {
        await scheduleRecovery();

        app.listen(PORT, () => {
            console.log(
                `🚀 NotifyHub running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "❌ Failed to start NotifyHub",
            error
        );

        process.exit(1);
    }
};

startServer();