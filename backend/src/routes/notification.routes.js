const express = require("express");

const router = express.Router();

const validate = require("../middleware/validate.middleware");

const { createNotificationSchema } = require("../validations/notification.validation");

const notificationController = require("../controllers/notification.controller");

router.get("/", notificationController.getAllNotifications);
router.get("/:id", notificationController.getNotificationById);

router.post(
    "/",
    validate(createNotificationSchema),
    notificationController.createNotification
);

router.patch("/:id/status", notificationController.updateNotificationStatus);
router.delete("/:id", notificationController.deleteNotification);


module.exports = router;