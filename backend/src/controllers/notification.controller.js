const notificationService = require("../services/notification.service");

const asyncHandler = require("../utils/asyncHandler");

const createNotification = asyncHandler(async (req, res) => {
  const response = await notificationService.createNotification(
    req.body,
    req.idempotency,
  );

  return res.status(201).json(response);
});

const getAllNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getAllNotifications(req.query);

  return res.json({
    success: true,
    data: result.notifications,
    pagination: result.pagination,
  });
});

const getNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  const notification =
    await notificationService.getByIdWithAttempts(notificationId);

  return res.status(200).json({
    success: true,
    data: notification,
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  await notificationService.deleteNotification(notificationId);

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});

module.exports = {
  createNotification,
  getAllNotifications,
  getNotification,
  deleteNotification,
};
