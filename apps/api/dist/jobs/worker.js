import { Worker } from 'bullmq';
import { bullmqConnection } from '../lib/redis';
import { prisma } from '@farmwise/db';
import { emailService } from '../services/email.service';
export const smsServiceMock = async (to, message) => {
    console.log(`[MOCK SMS] To: ${to} | Message length: ${message.length} | Body: ${message}`);
    if (message.length > 160) {
        console.warn(`[WARNING] SMS to ${to} exceeded 160 chars!`);
    }
    // Simulate latency
    await new Promise(r => setTimeout(r, 500));
};
export const notificationWorker = new Worker('notifications', async (job) => {
    const { userId, type, title, body, link, emailOptions, smsOptions } = job.data;
    // 1. Create In-App Notification Record
    await prisma.notification.create({
        data: { userId, type, title, body, link }
    });
    // 2. Send Email if available
    if (emailOptions) {
        await emailService.sendGeneric(emailOptions.to, emailOptions.subject, emailOptions.html);
    }
    // 3. Send SMS if available
    if (smsOptions) {
        await smsServiceMock(smsOptions.to, smsOptions.message);
    }
    return { success: true };
}, { connection: bullmqConnection });
notificationWorker.on('completed', job => {
    console.log(`Job [${job.id}] completed for User [${job.data.userId}]`);
});
notificationWorker.on('failed', (job, err) => {
    console.error(`Job [${job?.id}] failed:`, err);
});
