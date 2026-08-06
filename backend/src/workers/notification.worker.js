require("dotenv").config();

const { Worker } = require("bullmq");
const processor = require("../processors/notification.processor");
const redis = require("../config/redis");
const logger = require("../utils/logger");

const worker = new Worker(
    "notification-queue",
    async (job) => {
        logger.info("Job received by worker", {
            jobId: job.id,
            notificationId: job.data?.notificationId,
        });

        await processor.process(job.data.notificationId);
    },
    {
        connection: redis,
    }
);

worker.on("completed", (job) => {
    logger.info("Worker job completed", {
        jobId: job.id,
        notificationId: job.data?.notificationId,
    });
});

worker.on("failed", (job, err) => {
    logger.error("Worker job failed", {
        jobId: job?.id,
        notificationId: job?.data?.notificationId,
        error: err.message,
    });
});

module.exports = worker;