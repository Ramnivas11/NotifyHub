const prisma = require("../lib/prisma");

const notificationService = require("../services/notification.service");
const notificationAttemptService = require("../services/notificationAttempt.service");

const providerFactory = require("../providers/email/provider.factory");

class NotificationProcessor {
    async process(notificationId) {

        // 1. Load notification
        const notification = await notificationService.getById(notificationId);

        // 2. Already processed
        if (notification.status === "SENT") {
            return;
        }

        // 3. Resolve provider
        const provider = providerFactory.getProvider(
            notification.preferredProvider
        );

        // 4. Create immutable attempt
        const attempt =
            await notificationAttemptService.createAttempt(
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

            throw error;
        }
    }
}

module.exports = new NotificationProcessor();