const { Queue } = require("bullmq");

const redis = require("../config/redis")

const notificationQueue = new Queue("notification-queue",{
    connection:redis,
})

module.exports=notificationQueue;