import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrollmentService } from '../enrollment.service';
import { prisma } from '@farmwise/db';

vi.mock('@farmwise/db', () => ({
  prisma: {
    enrollment: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    }
  }
}));

describe('EnrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should activate enrollment from stripe session', async () => {
    const mockSession = {
      id: 'cs_test_123',
      metadata: { userId: 'u1', courseId: 'c1' },
      amount_total: 1000,
      payment_intent: 'pi_123'
    } as any;

    await EnrollmentService.activateEnrollment(mockSession);

    expect(prisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
        update: { status: 'ACTIVE', paidAmount: 10, paymentId: 'pi_123' }
      })
    );
  });

  it('should enroll for a free course directly', async () => {
    await EnrollmentService.enrollFreeCourse('u1', 'c1');

    expect(prisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
        update: { status: 'ACTIVE', paidAmount: 0 }
      })
    );
  });

  it('should check enrollment status', async () => {
    (prisma.enrollment.findUnique as any).mockResolvedValue({ status: 'ACTIVE' });
    const isEnrolled = await EnrollmentService.isEnrolled('u1', 'c1');
    expect(isEnrolled).toBe(true);
  });
});
