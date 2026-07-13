const express = require("express");

const router = express.Router();

const validate = require("../middleware/validate.middleware");

const { createNotificationSchema } = require("../validations/notification.validation");

const notificationController = require("../controllers/notification.controller");

router.get("/", notificationController.getNotifications);
router.get("/:id", notificationController.getNotificationById);

router.post(
    "/",
    validate(createNotificationSchema),
    notificationController.createNotification
);

router.patch("/:id/status", notificationController.updateNotificationById);
router.delete("/:id", notificationController.deleteNotificationById);


module.exports = router;