const prisma = require("../lib/prisma");

const notificationService = require("../services/notification.service");
const notificationAttemptService = require("../services/notificationAttempt.service");

const providerFactory = require("../providers/email/provider.factory");

class NotificationProcessor {
    async process(notificationId) {

        // 1. Fetch notification
        const notification = await notificationService.getById(
            notificationId
        );

        if (!notification) {
            throw new Error("Notification not found.");
        }

        // 2. Already sent?
        if (notification.status === "SENT") {
            return;
        }

        // 3. Get provider
        const provider =
            providerFactory.getProvider(
                notification.preferredProvider
            );

        // 4. Create Attempt
        const attempt =
            await notificationAttemptService.createAttempt(
                prisma,
                notification.id,
                provider.name
            );

        try {

            // 5. Send Email
            const result =
                await provider.send(notification);

            // 6. Update DB
            await prisma.$transaction(async (tx) => {

                await notificationAttemptService.markSuccess(
                    tx,
                    attempt.id,
                    result
                );

                await notificationService.markSent(
                    tx,
                    notification.id
                );

            });

        } catch (error) {

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