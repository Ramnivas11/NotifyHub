const prisma = require("../lib/prisma");
const notificationService = require("../services/notification.service");
const notificationAttemptService = require("../services/notificationAttempt.service");
const providerFactory = require("../providers/email/provider.factory");
const logger = require("../utils/logger");

class NotificationProcessor {
    async process(notificationId) {
        logger.info("Processing notification", { notificationId });

        // 1. Load notification
        const notification = await notificationService.getById(notificationId);

        // 2. Skip already sent notifications
        if (notification.status === "SENT") {
            logger.info("Notification already sent, skipping", { notificationId });
            return;
        }

        // 3. Resolve provider
        const provider = providerFactory.getProvider(
            notification.preferredProvider
        );

        // 4. Create immutable attempt
        const attempt = await notificationAttemptService.createAttempt(
            prisma,
            notification.id,
            provider.name
        );

        try {
            // 5. Send notification
            const providerResult = await provider.send(notification);

            // 6. Persist success atomically
            await prisma.$transaction(async (tx) => {
                await notificationAttemptService.markSuccess(
                    tx,
                    attempt.id,
                    providerResult
                );

                await notificationService.markSent(
                    tx,
                    notification.id
                );
            });

            logger.info("Notification processed and sent successfully", {
                notificationId: notification.id,
                attemptId: attempt.id,
                provider: provider.name,
            });
        } catch (error) {
            // 7. Persist failure atomically
            await prisma.$transaction(async (tx) => {
                await notificationAttemptService.markFailed(
                    tx,
                    attempt.id,
                    error
                );

                await notificationService.markFailed(
                    tx,
                    notification.id
                );
            });

            logger.error("Failed to process notification", {
                notificationId: notification.id,
                attemptId: attempt.id,
                provider: provider.name,
                error: error.message,
            });

            throw error;
        }
    }
}

module.exports = new NotificationProcessor();