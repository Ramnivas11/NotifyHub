const idempotencyService = require("../services/idempotency.service");

const {
    generateRequestHash,
} = require("../utils/hash.util");

const {
    IDEMPOTENCY_ACTION,
    IDEMPOTENCY_HEADER,
} = require("../constants/idempotency.constants");



async function idempotencyMiddleware(req, res, next) {
    try {
        const key = req.header(IDEMPOTENCY_HEADER.KEY);
        if (!key) {
            return res.status(400).json({
                success: false,
                message: "Idempotency-key header is required/missing",
            })
        }
        const requestHash = generateRequestHash(req.body)
        const result = await idempotencyService.beginRequest(key, requestHash);

        switch (result.action) {
            case IDEMPOTENCY_ACTION.NEW:
            case IDEMPOTENCY_ACTION.FAILED:
                req.idempotency = {
                    key,
                }
                return next();
            case IDEMPOTENCY_ACTION.PROCESSING:
                return res.status(409).json({
                    success: false,
                    message: "REQUEST is already being processed"
                })
            case IDEMPOTENCY_ACTION.COMPLETED:
                return res.status(200).json(result.record.response);
            default:
                return res.status(500).json({
                    success: false,
                    message: "Unknown idempotency action.",
                })
        }

    } catch (error) {
        next(error)

    }

}

module.exports = idempotencyMiddleware;