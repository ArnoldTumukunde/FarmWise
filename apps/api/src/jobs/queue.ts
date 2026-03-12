import { Queue } from 'bullmq';
import { redisClient } from '../index'; // Will refactor to a shared redis file

// Export our singleton Queue instance
export const notificationQueue = new Queue('notifications', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});
