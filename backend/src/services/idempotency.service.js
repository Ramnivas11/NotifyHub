const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const {
    IDEMPOTENCY_ACTION,
    IDEMPOTENCY_STATUS,
    IDEMPOTENCY_EXPIRY,
} = require("../constants/idempotency.constants");

class IdempotencyService {
    async beginRequest(key, requestHash) {
        try {
            const expiresAt = new Date(
                Date.now() + IDEMPOTENCY_EXPIRY.HOURS * 60 * 60 * 1000
            );
            const record = await prisma.idempotency.create({
                data: {
                    key,
                    requestHash,
                    status: IDEMPOTENCY_STATUS.PROCESSING,
                    processingStartedAt: new Date(),
                    expiresAt,
                },
            });

            return {
                action: IDEMPOTENCY_ACTION.NEW,
                record,
            };
        } catch (err) {
            // P2002 is unique constraint violation (key already exists)
            if (err.code !== "P2002") {
                throw err;
            }

            const record = await prisma.idempotency.findUnique({
                where: { key },
            });

            if (!record) {
                throw new AppError("IDEMPOTENCY_RECORD_NOT_FOUND", 404);
            }

            if (record.requestHash !== requestHash) {
                throw new AppError(
                    "Idempotency key payload mismatch: The same idempotency key was used with a different request body.",
                    422
                );
            }

            switch (record.status) {
                case IDEMPOTENCY_STATUS.PROCESSING:
                    return {
                        action: IDEMPOTENCY_ACTION.PROCESSING,
                        record,
                    };

                case IDEMPOTENCY_STATUS.COMPLETED:
                    return {
                        action: IDEMPOTENCY_ACTION.COMPLETED,
                        record,
                    };

                case IDEMPOTENCY_STATUS.FAILED:
                    return {
                        action: IDEMPOTENCY_ACTION.FAILED,
                        record,
                    };

                default:
                    throw new AppError(
                        `Unknown idempotency status: ${record.status}`,
                        500
                    );
            }
        }
    }

    async completeRequest(key, notificationId, response) {
        return prisma.idempotency.update({
            where: { key },
            data: {
                status: IDEMPOTENCY_STATUS.COMPLETED,
                notificationId,
                response,
                completedAt: new Date(),
                lastError: null,
            },
        });
    }

    async failRequest(key, error) {
        return prisma.idempotency.update({
            where: { key },
            data: {
                status: IDEMPOTENCY_STATUS.FAILED,
                lastError:
                    error instanceof Error ? error.message : String(error),
            },
        });
    }
}

module.exports = new IdempotencyService();