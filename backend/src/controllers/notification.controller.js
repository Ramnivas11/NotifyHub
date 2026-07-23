
const notificationService = require("../services/notification.service");
const asyncHandler = require("../utils/asyncHandler");

const createNotification = asyncHandler(async (req, res) => {

    const notification = await notificationService.createNotification(req.body, req.idempotency)

    return res.status(201).json({
        success: true,
        data: notification,
    });
});

const getAllNotifications = asyncHandler(async (req, res) => {

    const notifications = await notificationService.getAllNotifications();

    return res.json({
        success: true,
        data: notifications,
    });

});
const getNotificationById = asyncHandler(async (req, res) => {
    const notificationId = Number(req.params.id)
    const notification = await notificationService.getNotificationById(notificationId);

    return res.status(200).json({
        success: true,
        data: notification,
    })
})

const updateNotificationStatus = asyncHandler(async (req, res) => {
    const notificationId = Number(req.params.id);
    const status = req.body.status;
    const notification = await notificationService.updateNotificationStatus(notificationId, status)
    return res.status(200).json({
        success: true,
        data: notification
    })

})

const deleteNotification = asyncHandler(async (req, res) => {
    const notificationId = Number(req.params.id)
    await notificationService.deleteNotification(notificationId);
    return res.status(200).json({
        success: true,
        message: "Notification deleted successfully "
    })
})

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotificationStatus,
    deleteNotification
};