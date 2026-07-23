const express = require("express");

const router = express.Router();

const validate = require("../middleware/validate.middleware");

const { createNotificationSchema } = require("../validations/notification.validation");

const notificationController = require("../controllers/notification.controller");
const idempotencyMiddleware = require("../middleware/idempotency.middleware");

router.get("/", notificationController.getAllNotifications);
router.get("/:id", notificationController.getNotificationById);

router.post(
    "/",
    validate(createNotificationSchema),
    idempotencyMiddleware,
    notificationController.createNotification
);

router.patch("/:id/status", notificationController.updateNotificationStatus);
router.delete("/:id", notificationController.deleteNotification);


module.exports = router;