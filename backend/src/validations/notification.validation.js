const { z } = require("zod");

const createNotificationSchema = z.object({
    channel: z.enum([
        "email",
        "sms",
        "push",
        "in-app",
    ]),

    recipient: z
        .string()
        .trim()
        .min(1, "Recipient is required"),

    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(100),

    message: z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(1000),
});

module.exports = {
    createNotificationSchema,
};