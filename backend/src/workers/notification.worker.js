require("dotenv").config();

const { Worker } = require("bullmq");
const notificationService = require("../services/notification.service");
const redis = require("../config/redis");
const prisma = require("../lib/prisma");

const worker = new Worker(
    "notification-queue",
    async (job) => {
        await notificationService.processNotification(job.data.notificationId);
    },

    {
        connection: redis
    }
)