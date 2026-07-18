const { Queue } = require("bullmq");

const redis = require("../config/redis")

const notificationQueue = new Queue("notification-queue",{
    connection:redis,
    defaultJobOptions:{
        attempts:5,
        backoff:{
            type:"exponential",
            delay:5000,
        },
        removeOnComplete:100,
        removeOnFail:100
    }
})

module.exports=notificationQueue;