require("dotenv").config();

const {
    Worker,
    UnrecoverableError,
} = require("bullmq");

const processor = require("../processors/notification.processor");
const notificationService = require("../services/notification.service");
const prisma = require("../lib/prisma");
const redis = require("../config/redis");
const logger = require("../utils/logger");

const worker = new Worker(
    "notification-queue",
    async (job) => {
        const notificationId =
            job.data?.notificationId;

        logger.info("Job received by worker", {
            jobId: job.id,
            notificationId,
            attemptsMade: job.attemptsMade,
        });

        try {
            await processor.process(notificationId);
        } catch (error) {
            // Permanent provider errors must not be retried.
            if (error.retryable === false) {
                throw new UnrecoverableError(
                    error.message
                );
            }

            // Retryable errors are allowed to propagate.
            // BullMQ will handle the retry according
            // to the queue configuration.
            throw error;
        }
    },
    {
        connection: redis,
    }
);

worker.on("completed", (job) => {
    logger.info("Worker job completed", {
        jobId: job.id,
        notificationId:
            job.data?.notificationId,
    });
});

worker.on("failed", async (job, error) => {
    if (!job) {
        return;
    }

    const maxAttempts =
        job.opts.attempts ?? 1;

    const attemptsMade =
        job.attemptsMade;

    const exhausted =
        attemptsMade >= maxAttempts;

    logger.error("Worker job failed", {
        jobId: job.id,
        notificationId:
            job.data?.notificationId,
        attemptsMade,
        maxAttempts,
        exhausted,
        retryable: error.retryable,
        errorCode: error.code,
        error: error.message,
    });

    // Permanent error:
    // NotificationProcessor already marked the
    // notification as FAILED.
    //
    // Retryable error:
    // Only mark the notification FAILED when
    // BullMQ has exhausted all attempts.
    if (
        error.retryable === false ||
        exhausted
    ) {
        try {
            await notificationService.markFailed(
                prisma,
                job.data.notificationId
            );

            logger.info(
                "Notification marked as FAILED",
                {
                    notificationId:
                        job.data.notificationId,
                    reason:
                        error.retryable === false
                            ? "PERMANENT_ERROR"
                            : "RETRIES_EXHAUSTED",
                }
            );
        } catch (updateError) {
            logger.error(
                "Failed to mark notification as FAILED",
                {
                    notificationId:
                        job.data.notificationId,
                    error:
                        updateError.message,
                }
            );
        }
    }
});

module.exports = worker;