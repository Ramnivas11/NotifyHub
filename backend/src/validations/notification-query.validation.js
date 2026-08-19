const { z } = require("zod");

const notificationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    status: z
        .enum([
            "PENDING",
            "PROCESSING",
            "SENT",
            "FAILED",
        ])
        .optional(),

    provider: z
        .string()
        .min(1)
        .optional(),
});

module.exports = {
    notificationQuerySchema,
};