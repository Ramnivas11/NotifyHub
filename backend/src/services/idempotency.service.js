const prisma = require("../lib/prisma");
const {
    IDEMPOTENCY_ACTION,
    IDEMPOTENCY_STATUS,
    IDEMPOTENCY_EXPIRY,
} = require("../constants/idempotency.constants");

class IdempotencyService {
    async beginRequest(key, requestHash) {
        try {
            const expiresAt = new Date(Date.now() + IDEMPOTENCY_EXPIRY.HOURS * 60 * 60 * 1000);
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
            //p2002 is unique constraint violation
            if (err.code !== "P2002") {
                throw err;
            }

            const record = await prisma.idempotency.findUnique({
                where: { key },
            });

            if (!record) {
                throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
            }

            if (record.requestHash !== requestHash) {
                throw new Error("IDEMPOTENCY_HASH_MISMATCH");
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
                    throw new Error(
                        `Unknown idempotency status: ${record.status}`
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
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
        });
    }
}

module.exports = new IdempotencyService();