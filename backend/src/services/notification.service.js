const idempotencyService = require("./idempotency.service");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationQueue = require("../queues/notification.queue");
const notificationService = require("./notification.service");
const notificationAttemptService =
    require("./notificationAttempt.service");

const createNotification = async (notificationData, idempotency = null) => {
    let notification = null;

    try {
        notification = await prisma.notification.create({
            data: notificationData,
        });

        await notificationQueue.add(
            "send-notification",
            {
                notificationId: notification.id,
            },
            {
                jobId: notification.id,
            }
        );

        const response = {
            success: true,
            message: "Notification created successfully.",
            data: notification,
        };

        if (idempotency) {
            await idempotencyService.completeRequest(
                idempotency.key,
                notification.id,
                response
            );
        }

        return response;
    } catch (err) {
        if (idempotency) {
            try {
                await idempotencyService.failRequest(idempotency.key, err);
            } catch (cleanupErr) {
                console.error(
                    "Failed to mark idempotency request as failed",
                    cleanupErr
                );
            }
        }

        if (notification?.id) {
            try {
                await updateStatus(prisma, notification.id, "FAILED");
            } catch (cleanupErr) {
                console.error(
                    `Failed to update notification ${notification.id} status to FAILED`,
                    cleanupErr
                );
            }
        }

        throw err;
    }
};

const getAllNotifications = async () => {
    return prisma.notification.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
};

const getById = async (notificationId) => {
    const notification = await prisma.notification.findUnique({
        where: {
            id: notificationId,
        },
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    return notification;
};

const updateStatus = async (db, notificationId, status) => {
    return db.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            status,
        },
    });
};

const markProcessing = async (db, notificationId) => {
    return updateStatus(db, notificationId, "PROCESSING");
};

const markSent = async (db, notificationId) => {
    return updateStatus(db, notificationId, "SENT");
};

const markFailed = async (db, notificationId) => {
    return updateStatus(db, notificationId, "FAILED");
};

const deleteNotification = async (notificationId) => {
    return prisma.notification.delete({
        where: {
            id: notificationId,
        },
    });
};

module.exports = {
    createNotification,
    getAllNotifications,
    getById,
    updateStatus,
    markProcessing,
    markSent,
    markFailed,
    deleteNotification,
};