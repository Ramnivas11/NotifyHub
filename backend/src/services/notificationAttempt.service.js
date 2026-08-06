const AppError = require("../utils/AppError");

const getNextAttemptNumber = async (db, notificationId) => {
    const lastAttempt = await db.notificationAttempt.findFirst({
        where: {
            notificationId,
        },
        orderBy: {
            attemptNumber: "desc",
        },
        select: {
            attemptNumber: true,
        },
    });

    return lastAttempt ? lastAttempt.attemptNumber + 1 : 1;
};

const createAttempt = async (db, notificationId, provider) => {
    const attemptNumber = await getNextAttemptNumber(db, notificationId);

    return db.notificationAttempt.create({
        data: {
            notificationId,
            provider,
            attemptNumber,
            status: "PROCESSING",
        },
    });
};

const markSuccess = async (db, attemptId, providerResult) => {
    return db.notificationAttempt.update({
        where: {
            id: attemptId,
        },
        data: {
            status: "SUCCESS",
            providerMessageId: providerResult.providerMessageId,
            latency: providerResult.latency,
            completedAt: new Date(),
        },
    });
};

const markFailed = async (db, attemptId, error) => {
    return db.notificationAttempt.update({
        where: {
            id: attemptId,
        },
        data: {
            status: "FAILED",
            errorCode: error.code ?? "UNKNOWN_ERROR",
            errorMessage: error.message,
            completedAt: new Date(),
        },
    });
};

const getAttemptById = async (db, attemptId) => {
    const attempt = await db.notificationAttempt.findUnique({
        where: {
            id: attemptId,
        },
    });

    if (!attempt) {
        throw new AppError("Notification attempt not found", 404);
    }

    return attempt;
};

module.exports = {
    createAttempt,
    markSuccess,
    markFailed,
    getNextAttemptNumber,
    getAttemptById,
};