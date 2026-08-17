const prisma = require("../lib/prisma");
const env = require("../config/env");
const providerFactory = require("../providers/email/provider.factory");

const FALLBACK_THRESHOLD = 2;

const RETRYABLE_ERROR_CODES = new Set([
    "RATE_LIMITED",
    "PROVIDER_UNAVAILABLE",
    "NETWORK_TIMEOUT",
]);

const getRecentAttempts = async (notificationId) => {
    return prisma.notificationAttempt.findMany({
        where: {
            notificationId,
        },
        orderBy: {
            attemptNumber: "desc",
        },
        select: {
            provider: true,
            status: true,
            errorCode: true,
            attemptNumber: true,
        },
        take: FALLBACK_THRESHOLD,
    });
};

const shouldUseFallback = (
    attempts,
    primaryProvider
) => {
    if (!env.EMAIL_FALLBACK_PROVIDER) {
        return false;
    }

    if (
        env.EMAIL_FALLBACK_PROVIDER ===
        primaryProvider
    ) {
        return false;
    }

    if (attempts.length < FALLBACK_THRESHOLD) {
        return false;
    }

    return attempts.every(
        (attempt) =>
            attempt.provider === primaryProvider &&
            attempt.status === "FAILED" &&
            RETRYABLE_ERROR_CODES.has(
                attempt.errorCode
            )
    );
};

const getProvider = async (notification) => {
    const primaryProvider =
        notification.preferredProvider ||
        env.EMAIL_PROVIDER;

    const fallbackProvider =
        env.EMAIL_FALLBACK_PROVIDER;

    const attempts = await getRecentAttempts(
        notification.id
    );

    // No fallback configured.
    if (!fallbackProvider) {
        return providerFactory.getProvider(
            primaryProvider
        );
    }

    // If fallback has already been selected,
    // continue using it for subsequent retries.
    const latestAttempt = attempts[0];

    if (
        latestAttempt?.provider ===
        fallbackProvider
    ) {
        return providerFactory.getProvider(
            fallbackProvider
        );
    }

    // Primary has not crossed the fallback threshold.
    if (
        !shouldUseFallback(
            attempts,
            primaryProvider
        )
    ) {
        return providerFactory.getProvider(
            primaryProvider
        );
    }

    // Primary crossed the threshold.
    return providerFactory.getProvider(
        fallbackProvider
    );
};

module.exports = {
    getProvider,
};