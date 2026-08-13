const { Worker } = require("bullmq");

const redis = require("../config/redis");
const env = require("../config/env");

const notificationRecoveryService =
    require("../services/notificationRecovery.service");

const notificationProcessor =
    require("../processors/notification.processor");

const worker = new Worker(
    "notification-recovery",
    async (job) => {
        console.log(
            `🔄 Recovery job started: ${job.id}`
        );

        const attempts =
            await notificationRecoveryService
                .getStuckAttempts();

        if (attempts.length === 0) {
            console.log(
                "✅ No stuck notification attempts found."
            );

            return;
        }

        console.log(
            `🔍 Found ${attempts.length} stuck attempts`
        );

        const cutoffTime = new Date(
            Date.now() -
            env.RECOVERY_THRESHOLD_MINUTES *
            60 *
            1000
        );

        let recovered = 0;
        let skipped = 0;
        let failed = 0;

        for (const attempt of attempts) {
            try {
                const claimed =
                    await notificationRecoveryService
                        .claimStuckAttempt(
                            attempt.id,
                            cutoffTime
                        );

                if (!claimed) {
                    skipped++;

                    console.log(
                        `⏭️ Attempt ${attempt.id} was already handled.`
                    );

                    continue;
                }

                console.log(
                    `♻️ Recovering notification ${attempt.notificationId}`
                );

                await notificationProcessor.process(
                    attempt.notificationId
                );

                recovered++;

                console.log(
                    `✅ Notification ${attempt.notificationId} recovered successfully.`
                );
            } catch (error) {
                failed++;

                console.error(
                    `❌ Failed to recover notification ${attempt.notificationId}`,
                    {
                        attemptId: attempt.id,
                        errorCode: error.code,
                        errorMessage: error.message,
                    }
                );
            }
        }

        console.log(
            `📊 Recovery summary | recovered=${recovered} skipped=${skipped} failed=${failed}`
        );
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