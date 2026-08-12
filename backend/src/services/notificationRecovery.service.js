const prisma = require("../lib/prisma");
const env = require("../config/env");

const getStuckAttempts = async () => {
    const cutoffTime = new Date(
        Date.now() -
        env.RECOVERY_THRESHOLD_MINUTES * 60 * 1000
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

module.exports = {
    getStuckAttempts,
};