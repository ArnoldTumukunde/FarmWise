"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
// Export our singleton Queue instance
exports.notificationQueue = new bullmq_1.Queue('notifications', {
    connection: redis_1.bullmqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
    }
});
