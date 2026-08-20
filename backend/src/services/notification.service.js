const idempotencyService = require("./idempotency.service");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const notificationQueue = require("../queues/notification.queue");
const logger = require("../utils/logger");
const env = require("../config/env");

const createNotification = async (notificationData, idempotency = null) => {
  let notification = null;

  try {
    const preferredProvider =
      notificationData.preferredProvider || env.EMAIL_PROVIDER;
    notification = await prisma.notification.create({
      data: {
        preferredProvider,
        ...notificationData,
      },
    });

    await notificationQueue.add(
      "send-notification",
      {
        notificationId: notification.id,
      },
      {
        jobId: `notification-${notification.id}`,
      },
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
        response,
      );
    }

    return response;
  } catch (err) {
    if (idempotency) {
      try {
        await idempotencyService.failRequest(idempotency.key, err);
      } catch (cleanupErr) {
        logger.error("Failed to mark idempotency request as failed", {
          error: cleanupErr.message,
        });
      }
    }

    if (notification?.id) {
      try {
        await updateStatus(prisma, notification.id, "FAILED");
      } catch (cleanupErr) {
        logger.error(
          `Failed to update notification ${notification.id} status to FAILED`,
          { error: cleanupErr.message },
        );
      }
    }

    throw err;
  }
};

const getAllNotifications = async ({
  page = 1,
  limit = 20,
  status,
  provider,
}) => {
  const skip = (page - 1) * limit;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (provider) {
    where.preferredProvider = provider;
  }

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.notification.count({
      where,
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

const getByIdWithAttempts = async (notificationId) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
    include: {
      attempts: {
        orderBy: {
          attemptNumber: "asc",
        },
      },
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

const markPending = async (db, notificationId) => {
  return updateStatus(db, notificationId, "PENDING");
};

const markSent = async (db, notificationId) => {
  return updateStatus(db, notificationId, "SENT");
};

const markFailed = async (db, notificationId) => {
  return updateStatus(db, notificationId, "FAILED");
};

const deleteNotification = async (notificationId) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.status !== "PENDING") {
    throw new AppError(
      "Notification cannot be deleted after processing has started",
      409,
    );
  }

  const jobId = `notification-${notificationId}`;

  const job = await notificationQueue.getJob(jobId);

  if (job) {
    await job.remove();
  }

  return prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
};

const claimNotification = async (notificationId) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      status: "PENDING",
    },
    data: {
      status: "PROCESSING",
    },
  });

  return result.count === 1;
  /*
  updateMany() returns something like:
    {
      count: 1
    }
    If the notification exists and is still pending:
    PENDING → PROCESSING
    then one row is updated:
    result.count === 1 // true
  */
};

module.exports = {
  createNotification,
  getAllNotifications,
  getById,
  updateStatus,
  markProcessing,
  markSent,
  markPending,
  markFailed,
  deleteNotification,
  getByIdWithAttempts,
  claimNotification,
};
