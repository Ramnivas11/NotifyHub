const AppError = require("../utils/AppError");
const { Prisma } = require("@prisma/client");

async function getNextAttemptNumber(db, notificationId) {
    const lastAttempt = await db.notification.findFirst({
        where: {
            notificationId,
        }, orderBy: {
            attemptNumber: "desc",
        },
        select: {
            attemptNumber: true,
        }
    })
    return lastAttempt
        ? lastAttempt.attemptNumber + 1
        : 1;
}

async function createAttempt(db, notificationId, provider) {
    const attemptNumber =
        await getNextAttemptNumber(
            db,
            notificationId
        );
    const attempt =
        await db.notificationAttempt.create({

            data: {

                notificationId,

                provider,

                attemptNumber,

                status: "PROCESSING",

            },

        });
    return attempt;
}


const markSuccess = async (
    db,
    attemptId,
    providerResult
) => {

    const attempt =
        await db.notificationAttempt.findUnique({
            where: {
                id: attemptId,
            },
            select: {
                notificationId: true,
            },
        });

    if (!attempt) {
        throw new AppError(
            "Attempt not found",
            404
        );
    }

    await db.notificationAttempt.update({
        where: {
            id: attemptId,
        },
        data: {
            status: AttemptStatus.SUCCESS,
            providerMessageId:
                providerResult.providerMessageId,
            latency:
                providerResult.latency,
            completedAt: new Date(),
        },
    });

    await db.notification.update({
        where: {
            id: attempt.notificationId,
        },
        data: {
            status: NotificationStatus.SENT,
        },
    });

};

const markFailed = async (
    db,
    attemptId,
    error
) => {

    const attempt =
        await db.notificationAttempt.findUnique({
            where: {
                id: attemptId,
            },
            select: {
                notificationId: true,
            },
        });

    if (!attempt) {
        throw new AppError(
            "Attempt not found",
            404
        );
    }

    await db.notificationAttempt.update({
        where: {
            id: attemptId,
        },
        data: {
            status: AttemptStatus.FAILED,
            errorCode: error.code,
            errorMessage: error.message,
            completedAt: new Date(),
        },
    });

    await db.notification.update({
        where: {
            id: attempt.notificationId,
        },
        data: {
            status: NotificationStatus.FAILED,
        },
    });

};


module.exports = {
    createAttempt,
    getNextAttemptNumber,
    markSuccess,
    markFailed
};