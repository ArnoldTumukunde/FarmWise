import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrollmentService, resolveInstructorSharePercent } from '../enrollment.service';
import { prisma } from '@farmwise/db';

vi.mock('@farmwise/db', () => ({
  prisma: {
    enrollment: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
    platformConfig: {
      findUnique: vi.fn(),
    },
  },
}));

describe('resolveInstructorSharePercent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the per-course override when set', async () => {
    const r = await resolveInstructorSharePercent(100);
    expect(r).toBe(100);
  });

  it('clamps the per-course override to 0..100', async () => {
    expect(await resolveInstructorSharePercent(150)).toBe(100);
    expect(await resolveInstructorSharePercent(-5)).toBe(0);
  });

  it('falls back to platform default from PlatformConfig when null', async () => {
    (prisma.platformConfig.findUnique as any).mockResolvedValue({ value: '60' });
    const r = await resolveInstructorSharePercent(null);
    expect(r).toBe(60);
  });

  it('falls back to 70 when no config row', async () => {
    (prisma.platformConfig.findUnique as any).mockResolvedValue(null);
    const r = await resolveInstructorSharePercent(null);
    expect(r).toBe(70);
  });
});

describe('EnrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enrolls free course with snapshotted share percent', async () => {
    (prisma.course.findUnique as any).mockResolvedValue({ instructorSharePercent: null });
    (prisma.platformConfig.findUnique as any).mockResolvedValue({ value: '70' });

    await EnrollmentService.enrollFreeCourse('u1', 'c1');

    expect(prisma.enrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
        update: { status: 'ACTIVE', paidAmount: 0 },
        create: expect.objectContaining({
          userId: 'u1',
          courseId: 'c1',
          status: 'ACTIVE',
          paidAmount: 0,
          instructorSharePercent: 70,
        }),
      }),
    );
  });

  it('checks enrollment status', async () => {
    (prisma.enrollment.findUnique as any).mockResolvedValue({ status: 'ACTIVE' });
    expect(await EnrollmentService.isEnrolled('u1', 'c1')).toBe(true);
  });
});
