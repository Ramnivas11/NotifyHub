
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationQueue = require("../queues/notification.queue");
const createNotification = async (notificationData) => {

    const notification = await prisma.notification.create({
        data: notificationData,
    });

    try {
        await notificationQueue.add("send-notification", {
            notificationId: notification.id,
        });

        return notification;
    } catch (err) {
        await updateNotificationStatus(notification.id, "FAILED");
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
async function processNotification(notificationId) {
    try {

        const notification = await getNotificationById(notificationId)
        if (notification.status === "SENT") {
            return {
                message: "Notification already processed",
            };
        }

        await updateNotificationStatus(notificationId, "PROCESSING");

        console.log(
            `📨 Sending notification ${notification.id} to ${notification.recipient}`
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));

        await updateNotificationStatus(notificationId, "SENT");

        return {
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