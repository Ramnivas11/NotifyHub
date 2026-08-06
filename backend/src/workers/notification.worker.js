require("dotenv").config();

const processor =
    require("../processors/notification.processor");
const { Worker } = require("bullmq");
const notificationService = require("../services/notification.service");
const ProviderFactory = require("../providers/email/provider.factory")
const redis = require("../config/redis");
const prisma = require("../lib/prisma");

const worker = new Worker(
    "notification-queue",
    async (job) => {
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📥 Job Received");
        console.log(job.id);
        console.log(job.data);
        await processor.process(
            job.data.notificationId
        );
    },

    {
        connection: redis
    }
)
worker.on("completed", (job) => {

    console.log(`✅ Job ${job.id} completed`);

});

worker.on("failed", (job, err) => {

    console.log(`❌ Job ${job?.id} failed`);

    console.error(err.message);

});