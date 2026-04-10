"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const enrollment_service_1 = require("../enrollment.service");
const db_1 = require("@farmwise/db");
vitest_1.vi.mock('@farmwise/db', () => ({
    prisma: {
        enrollment: {
            upsert: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
        }
    }
}));
(0, vitest_1.describe)('EnrollmentService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should activate enrollment from stripe session', async () => {
        const mockSession = {
            id: 'cs_test_123',
            metadata: { userId: 'u1', courseId: 'c1' },
            amount_total: 1000,
            payment_intent: 'pi_123'
        };
        await enrollment_service_1.EnrollmentService.activateEnrollment(mockSession);
        (0, vitest_1.expect)(db_1.prisma.enrollment.upsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
            update: { status: 'ACTIVE', paidAmount: 10, paymentId: 'pi_123' }
        }));
    });
    (0, vitest_1.it)('should enroll for a free course directly', async () => {
        await enrollment_service_1.EnrollmentService.enrollFreeCourse('u1', 'c1');
        (0, vitest_1.expect)(db_1.prisma.enrollment.upsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
            update: { status: 'ACTIVE', paidAmount: 0 }
        }));
    });
    (0, vitest_1.it)('should check enrollment status', async () => {
        db_1.prisma.enrollment.findUnique.mockResolvedValue({ status: 'ACTIVE' });
        const isEnrolled = await enrollment_service_1.EnrollmentService.isEnrolled('u1', 'c1');
        (0, vitest_1.expect)(isEnrolled).toBe(true);
    });
});
