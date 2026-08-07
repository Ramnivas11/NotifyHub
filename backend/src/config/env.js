require("dotenv").config();

const requiredEnvVariables = [
    "DATABASE_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "EMAIL_PROVIDER",
];

for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `[ENV] Missing required environment variable: ${variable}`
        );
    }
}

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,

    REDIS_URL: process.env.REDIS_URL,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    EMAIL_FROM: process.env.EMAIL_FROM,

    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
};