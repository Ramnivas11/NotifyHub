const { Worker } = require("bullmq");

const redis = require("../config/redis");

const notificationRecoveryService =
    require("../services/notificationRecovery.service");

const notificationProcessor =
    require("../processors/notification.processor");

const env = require("../config/env");

const worker = new Worker(
    "notification-recovery",
    async (job) => {

        console.log(
            `🔄 Recovery job started: ${job.id}`
        );

        const attempts =
            await notificationRecoveryService
                .getStuckAttempts();

        console.log(
            `🔍 Found ${attempts.length} stuck attempts`
        );

        const cutoffTime = new Date(
            Date.now() -
            env.RECOVERY_THRESHOLD_MINUTES *
            60 *
            1000
        );

        for (const attempt of attempts) {

            const claimed =
                await notificationRecoveryService
                    .claimStuckAttempt(
                        null,
                        attempt.id,
                        cutoffTime
                    );

            if (!claimed) {
                console.log(
                    `⏭️ Attempt ${attempt.id} was already handled`
                );

                continue;
            }

            console.log(
                `♻️ Recovering notification ${attempt.notificationId}`
            );

            await notificationProcessor.process(
                attempt.notificationId
            );
        }
    },
    {
        connection: redis,
        concurrency: 1,
    }
);

worker.on("completed", (job) => {
    console.log(
        `✅ Recovery job ${job.id} completed`
    );
});

worker.on("failed", (job, error) => {
    console.error(
        `❌ Recovery job ${job?.id} failed`,
        error
    );
});

module.exports = worker;