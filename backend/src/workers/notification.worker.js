require("dotenv").config();

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
        const provider = ProviderFactory.getProvider();
        await notificationService.processNotification(job.data.notificationId, provider);
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