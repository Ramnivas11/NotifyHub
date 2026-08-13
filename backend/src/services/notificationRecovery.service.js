const prisma = require("../lib/prisma");
const env = require("../config/env");

const getStuckAttempts = async () => {
    const cutoffTime = new Date(
        Date.now() -
        env.RECOVERY_THRESHOLD_MINUTES *
        60 *
        1000
    );

    return prisma.notificationAttempt.findMany({
        where: {
            status: "PROCESSING",
            updatedAt: {
                lt: cutoffTime,
            },
        },
        orderBy: {
            updatedAt: "asc",
        },
        include: {
            notification: true,
        },
    });
};

const claimStuckAttempt = async (
    attemptId,
    cutoffTime
) => {
    const result =
        await prisma.notificationAttempt.updateMany({
            where: {
                id: attemptId,
                status: "PROCESSING",
                updatedAt: {
                    lt: cutoffTime,
                },
            },
            data: {
                status: "FAILED",
                errorCode: "RECOVERY_TIMEOUT",
                errorMessage:
                    "Notification attempt exceeded the recovery threshold.",
                completedAt: new Date(),
            },
        });

    return result.count === 1;
};

module.exports = {
    getStuckAttempts,
    claimStuckAttempt,
};