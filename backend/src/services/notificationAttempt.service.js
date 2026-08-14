const AppError = require("../utils/AppError");

const MAX_ATTEMPT_NUMBER_RETRIES = 3;

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

const isAttemptNumberConflict = (error) => {
    return (
        error?.code === "P2002" &&
        Array.isArray(error?.meta?.target) &&
        error.meta.target.includes("notificationId") &&
        error.meta.target.includes("attemptNumber")
    );
};

const createAttempt = async (db, notificationId, provider) => {
    for (
        let retry = 0;
        retry < MAX_ATTEMPT_NUMBER_RETRIES;
        retry++
    ) {
        const attemptNumber = await getNextAttemptNumber(
            db,
            notificationId
        );

        try {
            return await db.notificationAttempt.create({
                data: {
                    notificationId,
                    provider,
                    attemptNumber,
                    status: "PROCESSING",
                },
            });
        } catch (error) {
            if (!isAttemptNumberConflict(error)) {
                throw error;
            }

            if (retry === MAX_ATTEMPT_NUMBER_RETRIES - 1) {
                throw error;
            }
        }
    }

    throw new AppError(
        "Failed to create notification attempt",
        500
    );
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
        throw new AppError(
            "Notification attempt not found",
            404
        );
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