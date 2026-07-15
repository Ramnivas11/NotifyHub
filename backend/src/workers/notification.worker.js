require("dotenv").config();

const { Worker } = require("bullmq");

const redis = require("../config/redis");
const prisma = require("../lib/prisma");

const worker = new Worker(
    "notification-queue",

    async (job) => {

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📨 New Job Received");
        console.log(job.data);

        const { notificationId } = job.data;

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        console.log("📄 Notification");
        console.log(notification);

        await prisma.notification.update({
            where: {
                id: notificationId,
            },
            data: {
                status: "PROCESSING",
            },
        });

        console.log("⏳ Processing...");

        await new Promise((resolve) =>
            setTimeout(resolve, 2000)
        );

        await prisma.notification.update({
            where: {
                id: notificationId,
            },
            data: {
                status: "SENT",
            },
        });

        console.log("✅ Notification Sent");
        console.log("━━━━━━━━━━━━━━━━━━━━━━\n");
    },

    {
        connection: redis,
    }
);

worker.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.log(`❌ Job ${job?.id} failed`);
    console.error(err.message);
});