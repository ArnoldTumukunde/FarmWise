import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../lib/redis';
import { prisma } from '@farmwise/db';
import { NotificationType } from '@prisma/client';
import { emailService } from '../services/email.service';
// @ts-ignore
import AfricasTalking from 'africastalking';

// Lazy-init AT so env vars are loaded
let _sms: any = null;
function getSms() {
    if (!_sms) {
        const at = AfricasTalking({
            apiKey: process.env.AT_API_KEY as string,
            username: process.env.AT_USERNAME as string,
        });
        _sms = at.SMS;
    }
    return _sms;
}

async function sendSms(to: string, message: string) {
    if (!process.env.AT_API_KEY) {
        console.warn('[SMS] AT_API_KEY not set — skipping SMS to', to);
        return;
    }
    try {
        await getSms().send({ to: [to], message: message.substring(0, 160) });
    } catch (err: any) {
        console.error(`[SMS] Failed to send to ${to}:`, err.message);
    }
}

export interface NotificationJobData {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    emailOptions?: { subject: string; html: string; to: string };
    smsOptions?: { to: string; message: string };
}

export const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
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
            await sendSms(smsOptions.to, smsOptions.message);
        }

        return { success: true };
    },
    { connection: bullmqConnection }
);

notificationWorker.on('completed', job => {
    console.log(`Job [${job.id}] completed for User [${job.data.userId}]`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`Job [${job?.id}] failed:`, err);
});
