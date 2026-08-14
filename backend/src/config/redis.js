require("../config/env");
const IORedis = require("ioredis");
const logger = require("../utils/logger");

const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    logger.info("Redis Connected");
});

redis.on("error", (err) => {
    logger.error("Redis Error", { error: err.message });
});

module.exports = redis;