const { Queue } = require("bullmq");

const redis = require("../config/redis");

const recoveryQueue = new Queue(
    "notification-recovery",
    {
        connection: redis,
    }
);

module.exports = recoveryQueue;