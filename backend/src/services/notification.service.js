const idempotencyService = require("./idempotency.service");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationQueue = require("../queues/notification.queue");

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
                await updateNotificationStatus(notification.id, "FAILED");
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
const getNotificationById = async (notificationId) => {
    const notification = await prisma.notification.findUnique(({
        where: {
            id: notificationId
        }
    }))
    if (!notification) {
        throw new AppError("Notification not found", 404);
    }
    return notification
}

const updateNotificationStatus = async (notificationId, status) => {
    const notification = await prisma.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            status,
        },
    })
    return notification

}

const deleteNotification = async (notificationId) => {
    const notification = await prisma.notification.delete({
        where: {
            id: notificationId,
        }
    })

    return notification
}
async function processNotification(notificationId, provider) {
    try {

        const [notification] = await prisma.notification.updateManyAndReturn({
            where: {
                id: notificationId,
                status: "PENDING",
            },
            data: {
                status: "PROCESSING",
            },
        })
        if (!notification) {
            return {
                message: "Notification already being processed or already completed",
            };
        }

        console.log(
            `📨 Sending notification ${notification.id} to ${notification.recipient}`
        );
        try {
            const ProviderFactory = require("../providers/email/provider.factory");
            const provider = ProviderFactory.getProvider();
            const result = await provider.send(notification);
            console.log("✅ Notification sent successfully:", result.providerMessageId);
            await updateNotificationStatus(notificationId, "SENT");
        } catch (error) {
            await updateNotificationStatus(notificationId, "FAILED");
            throw error;
        }

        return {
            success: true,
            message: "Notification processed successfully",
        };
    } catch (err) {
        try {
            await updateNotificationStatus(notificationId, "FAILED");
        } catch (updateErr) {
            console.error(
                `Failed to update notification ${notificationId} to FAILED`,
                updateErr
            );
        }

        throw err;
    }
}



module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotificationStatus,
    deleteNotification,
    processNotification
};