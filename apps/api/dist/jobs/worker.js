"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = exports.smsServiceMock = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
const db_1 = require("@farmwise/db");
const email_service_1 = require("../services/email.service");
const smsServiceMock = async (to, message) => {
    console.log(`[MOCK SMS] To: ${to} | Message length: ${message.length} | Body: ${message}`);
    if (message.length > 160) {
        console.warn(`[WARNING] SMS to ${to} exceeded 160 chars!`);
    }
    // Simulate latency
    await new Promise(r => setTimeout(r, 500));
};
exports.smsServiceMock = smsServiceMock;
exports.notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
    const { userId, type, title, body, link, emailOptions, smsOptions } = job.data;
    // 1. Create In-App Notification Record
    await db_1.prisma.notification.create({
        data: { userId, type, title, body, link }
    });
    // 2. Send Email if available
    if (emailOptions) {
        await email_service_1.emailService.sendGeneric(emailOptions.to, emailOptions.subject, emailOptions.html);
    }
    // 3. Send SMS if available
    if (smsOptions) {
        await (0, exports.smsServiceMock)(smsOptions.to, smsOptions.message);
    }
    return { success: true };
}, { connection: redis_1.bullmqConnection });
exports.notificationWorker.on('completed', job => {
    console.log(`Job [${job.id}] completed for User [${job.data.userId}]`);
});
exports.notificationWorker.on('failed', (job, err) => {
    console.error(`Job [${job?.id}] failed:`, err);
});
