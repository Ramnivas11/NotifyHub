const { Worker } = require("bullmq");

const env = require("../config/env");
const redis = require("../config/redis");
const logger = require("../utils/logger");

const notificationRecoveryService =
    require("../services/notificationRecovery.service");

const notificationProcessor =
    require("../processors/notification.processor");

const worker = new Worker(
    "notification-recovery",
    async (job) => {
        logger.info("Recovery job started", {
            jobId: job.id,
        });

        const attempts =
            await notificationRecoveryService
                .getStuckAttempts();

        if (attempts.length === 0) {
            logger.info("No stuck notification attempts found.");
            return;
        }

        logger.info(`Found ${attempts.length} stuck attempts`, {
            count: attempts.length,
        });

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
                    logger.info("Attempt was already handled, skipping", {
                        attemptId: attempt.id,
                    });
                    continue;
                }

                logger.info("Recovering notification", {
                    attemptId: attempt.id,
                    notificationId: attempt.notificationId,
                });

                await notificationProcessor.process(
                    attempt.notificationId
                );

                recovered++;

                logger.info("Notification recovered successfully", {
                    attemptId: attempt.id,
                    notificationId: attempt.notificationId,
                });
            } catch (error) {
                failed++;

                logger.error("Failed to recover notification", {
                    attemptId: attempt.id,
                    notificationId: attempt.notificationId,
                    errorCode: error.code,
                    errorMessage: error.message,
                });
            }
        }

        logger.info("Recovery summary", {
            recovered,
            skipped,
            failed,
            total: attempts.length,
        });
    },
    {
        connection: redis,
        concurrency: 1,
    }
);

worker.on("completed", (job) => {
    logger.info("Recovery job completed", {
        jobId: job.id,
    });
});

worker.on("failed", (job, error) => {
    logger.error("Recovery job failed", {
        jobId: job?.id,
        error: error.message,
    });
});

module.exports = worker;