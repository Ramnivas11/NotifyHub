const recoveryQueue = require("./recovery.queue");

const scheduleRecovery = async () => {
    await recoveryQueue.upsertJobScheduler(
        "notification-recovery-scheduler",
        {
            every: 60 * 1000,
        },
        {
            name: "recover-stuck-notifications",
            data: {},
        }
    );
};

module.exports = scheduleRecovery;