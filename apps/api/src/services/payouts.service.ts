import { prisma } from '@farmwise/db';

/**
 * Instructor payout module.
 *
 * Pesapal has no public split-payment API (no Stripe Connect equivalent), so
 * the platform receives full payment, snapshots the instructor share onto each
 * Enrollment row at purchase time, then settles to instructors out-of-band:
 *   1. compute pending balances per instructor
 *   2. generate a CSV that admin uploads to Openfloat
 *   3. mark batch PAID after manual confirmation
 *
 * If a payout is later marked FAILED, the included Enrollments are released
 * back to unpaid state and roll into the next batch.
 */

export interface InstructorBalanceLine {
  instructorId: string;
  instructorName: string;
  payoutPhone: string | null;
  payoutBankName: string | null;
  payoutBankAccount: string | null;
  currency: string;
  pendingAmount: number;
  enrollmentCount: number;
  enrollmentIds: string[];
}

export class PayoutsService {
  /**
   * Sum unpaid earnings per instructor across COMPLETED, non-refunded
   * enrollments not yet bound to a payout. Each enrollment carries its own
   * snapshotted instructorSharePercent — never recompute from Course.
   */
  static async computePendingBalances(): Promise<InstructorBalanceLine[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE',
        payoutId: null,
        paidAmount: { gt: 0 },
        payment: { status: 'COMPLETED' },
      },
      select: {
        id: true,
        paidAmount: true,
        currency: true,
        instructorSharePercent: true,
        course: {
          select: {
            instructorId: true,
            instructor: {
              select: {
                profile: {
                  select: {
                    displayName: true,
                    payoutPhone: true,
                    payoutBankName: true,
                    payoutBankAccount: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const byInstructor = new Map<string, InstructorBalanceLine>();
    for (const e of enrollments) {
      const id = e.course.instructorId;
      const cents = Number(e.paidAmount) * (e.instructorSharePercent / 100);
      let line = byInstructor.get(id);
      if (!line) {
        line = {
          instructorId: id,
          instructorName: e.course.instructor.profile?.displayName ?? '(unknown)',
          payoutPhone: e.course.instructor.profile?.payoutPhone ?? null,
          payoutBankName: e.course.instructor.profile?.payoutBankName ?? null,
          payoutBankAccount: e.course.instructor.profile?.payoutBankAccount ?? null,
          currency: e.currency,
          pendingAmount: 0,
          enrollmentCount: 0,
          enrollmentIds: [],
        };
        byInstructor.set(id, line);
      }
      // Multi-currency check: if instructor has earnings in mixed currencies, we
      // currently group by single currency on first sight. Real fix is per-
      // currency batch — out of scope for v1, all FarmWise sales are UGX today.
      if (line.currency !== e.currency) continue;
      line.pendingAmount += cents;
      line.enrollmentCount += 1;
      line.enrollmentIds.push(e.id);
    }

    for (const line of byInstructor.values()) {
      line.pendingAmount = Math.floor(line.pendingAmount);
    }

    return Array.from(byInstructor.values()).sort((a, b) => b.pendingAmount - a.pendingAmount);
  }

  /**
   * Create one InstructorPayout per instructor with non-zero pending balance,
   * and bind the included enrollments via payoutId. Idempotent on inputs: only
   * enrollments still unbound at execution time are included (transactional).
   */
  static async createPayoutBatch(opts: {
    instructorIds?: string[];
    minThreshold?: number;
    notes?: string;
  } = {}) {
    const { instructorIds, minThreshold = 0, notes } = opts;
    const balances = await PayoutsService.computePendingBalances();

    const targets = balances.filter(
      (b) =>
        (!instructorIds || instructorIds.includes(b.instructorId)) &&
        b.pendingAmount >= minThreshold,
    );

    if (targets.length === 0) {
      return { batches: [] as Array<{ id: string; instructorId: string; amount: number }> };
    }

    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date();

    const batches = await prisma.$transaction(async (tx) => {
      const out: Array<{ id: string; instructorId: string; amount: number; currency: string }> = [];
      for (const b of targets) {
        const payout = await tx.instructorPayout.create({
          data: {
            instructorId: b.instructorId,
            amount: b.pendingAmount,
            currency: b.currency,
            periodStart,
            periodEnd,
            status: 'PENDING',
            notes,
          },
        });
        // Bind enrollments — but only those still unbound to avoid races with
        // a parallel batch run.
        await tx.enrollment.updateMany({
          where: { id: { in: b.enrollmentIds }, payoutId: null },
          data: { payoutId: payout.id },
        });
        out.push({ id: payout.id, instructorId: b.instructorId, amount: b.pendingAmount, currency: b.currency });
      }
      return out;
    });

    return { batches };
  }

  /** Mark a payout as queued (admin downloaded CSV / uploaded to Openfloat). */
  static async markQueued(payoutId: string, reference?: string) {
    return prisma.instructorPayout.update({
      where: { id: payoutId },
      data: { status: 'QUEUED', reference },
    });
  }

  /** Mark a payout as paid (admin confirmed Openfloat disbursement landed). */
  static async markPaid(payoutId: string, reference?: string) {
    return prisma.instructorPayout.update({
      where: { id: payoutId },
      data: { status: 'PAID', reference, paidAt: new Date() },
    });
  }

  /**
   * Mark a payout as failed and release its enrollments back to the unpaid
   * pool so they roll into the next batch.
   */
  static async markFailed(payoutId: string, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const payout = await tx.instructorPayout.update({
        where: { id: payoutId },
        data: { status: 'FAILED', notes },
      });
      await tx.enrollment.updateMany({
        where: { payoutId },
        data: { payoutId: null },
      });
      return payout;
    });
  }

  /**
   * CSV format suitable for Openfloat bulk upload. Columns:
   *   Phone, Amount, Reference, FullName
   * Bank-account instructors get a separate sheet (TODO when we pick up bank
   * disbursement flow); for now we list them in the CSV but flag PHONE missing.
   */
  static async toCsv(payoutIds: string[]): Promise<string> {
    const payouts = await prisma.instructorPayout.findMany({
      where: { id: { in: payoutIds } },
      include: {
        instructor: {
          select: { profile: { select: { displayName: true, payoutPhone: true } } },
        },
      },
    });

    const lines = ['Phone,Amount,Reference,FullName'];
    for (const p of payouts) {
      const phone = (p.instructor.profile?.payoutPhone ?? '').replace(/\s+/g, '');
      const name = (p.instructor.profile?.displayName ?? '').replace(/[",]/g, ' ');
      lines.push(`${phone},${Number(p.amount).toFixed(0)},${p.id},${name}`);
    }
    return lines.join('\n') + '\n';
  }

  static async listPayouts(opts: { instructorId?: string; status?: string; limit?: number } = {}) {
    return prisma.instructorPayout.findMany({
      where: {
        ...(opts.instructorId && { instructorId: opts.instructorId }),
        ...(opts.status && { status: opts.status as any }),
      },
      include: {
        instructor: { select: { profile: { select: { displayName: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: opts.limit ?? 100,
    });
  }

  /**
   * Per-instructor summary for the instructor dashboard. Shows lifetime + pending
   * + recent payouts. Same snapshot accounting — never recomputes from Course.
   */
  static async getInstructorSummary(instructorId: string) {
    const lifetimeCompleted = await prisma.enrollment.findMany({
      where: {
        course: { instructorId },
        payment: { status: 'COMPLETED' },
        status: { in: ['ACTIVE', 'REFUNDED'] },
      },
      select: { paidAmount: true, instructorSharePercent: true, payoutId: true, status: true, refundedAt: true },
    });

    const lifetime = lifetimeCompleted.reduce(
      (sum, e) => sum + Number(e.paidAmount) * (e.instructorSharePercent / 100),
      0,
    );
    const refunded = lifetimeCompleted
      .filter((e) => e.status === 'REFUNDED')
      .reduce((s, e) => s + Number(e.paidAmount) * (e.instructorSharePercent / 100), 0);
    const pending = lifetimeCompleted
      .filter((e) => e.status === 'ACTIVE' && !e.payoutId)
      .reduce((s, e) => s + Number(e.paidAmount) * (e.instructorSharePercent / 100), 0);

    const recentPayouts = await prisma.instructorPayout.findMany({
      where: { instructorId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return {
      lifetimeEarnings: Math.floor(lifetime),
      pendingEarnings: Math.floor(pending),
      refundedEarnings: Math.floor(refunded),
      enrollmentsThisPeriod: lifetimeCompleted.filter(
        (e) => !e.payoutId && e.status === 'ACTIVE',
      ).length,
      payouts: recentPayouts,
    };
  }
}
