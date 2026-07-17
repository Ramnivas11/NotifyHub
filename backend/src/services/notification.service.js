
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationQueue = require("../queues/notification.queue");
const createNotification = async (notificationData) => {

    const notification = await prisma.notification.create({
        data: notificationData,
    });


    await notificationQueue.add("send-notification",{
        notificationId:notification.id
    })

    return notification;

};

const getAllNotifications = async () => {

    return prisma.notification.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

};
const getNotificationById = async(notificationId)=>{
    const notification = await prisma.notification.findUnique(({
        where:{
            id: notificationId
        }
    }))
    if(!notification){
        throw new AppError("Notification not found", 404);
    }
    return notification
}

const updateNotificationStatus = async(notificationId,status)=>{
    const notification = await prisma.notification.update({
        where:{
            id: notificationId,
        },
        data:{
            status,
        },
    })
    if(!notification){
        throw new AppError("Notification not found", 404);
    }
    return notification
}

const deleteNotification = async(notificationId)=>{
    const notification = await prisma.notification.delete({
        where:{
            id: notificationId,
        }
    })
    if(!notification){
        throw new AppError("Notification not found", 404);
    }
    return notification
}
async function processNotification(notificationId) {
    const notification = await prisma.notification.findUnique({
        where: {
            id: notificationId,
        },
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    await prisma.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            status: "PROCESSING",
        },
    });

    console.log(
        `📨 Sending notification ${notification.id} to ${notification.recipient}`
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await prisma.notification.update({
        where: {
            id: notificationId,
        },
        data: {
            status: "SENT",
        },
    });

    return {
        message: "Notification processed successfully",
    };
}

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotificationStatus,
    deleteNotification,
    processNotification
};