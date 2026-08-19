const express = require("express");

const router = express.Router();

const validate = require("../middleware/validate.middleware");

const {
  createNotificationSchema,
} = require("../validations/notification.validation");
const validateQuery = require("../middleware/validate-query.middleware");
const {
  notificationQuerySchema,
} = require("../validations/notification-query.validation");
const notificationController = require("../controllers/notification.controller");
const validateParam = require("../middleware/validate-param.middleware");
const {
  notificationIdSchema,
} = require("../validations/notification-id.validation");
const idempotencyMiddleware = require("../middleware/idempotency.middleware");

router.get(
  "/",
  validateQuery(notificationQuerySchema),
  notificationController.getAllNotifications,
);
router.get(
  "/:id",
  validateParam("id", notificationIdSchema),
  notificationController.getNotification,
);

router.post(
  "/",
  validate(createNotificationSchema),
  idempotencyMiddleware,
  notificationController.createNotification,
);

router.delete(
  "/:id",
  validateParam("id", notificationIdSchema),
  notificationController.deleteNotification,
);

module.exports = router;
