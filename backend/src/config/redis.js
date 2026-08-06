const IORedis = require("ioredis");
const logger = require("../utils/logger");

const redis = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    db: Number(process.env.REDIS_DB),
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    logger.info("Redis Connected");
});

redis.on("error", (err) => {
    logger.error("Redis Error", { error: err.message });
});

module.exports = redis;