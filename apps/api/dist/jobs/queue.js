import { Queue } from 'bullmq';
import { bullmqConnection } from '../lib/redis';
// Export our singleton Queue instance
export const notificationQueue = new Queue('notifications', {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
    }
});
