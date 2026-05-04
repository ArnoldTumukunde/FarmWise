import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '@farmwise/db';
import { PesapalService, PesapalError } from '../services/pesapal.service';
import { resolveInstructorSharePercent } from '../services/enrollment.service';
import { NotificationService } from '../services/notification.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:4000';
const DEFAULT_CURRENCY = (process.env.PESAPAL_CURRENCY || 'UGX').toUpperCase() as 'UGX' | 'KES' | 'TZS' | 'USD';

function getIpnId(): string {
  const id = process.env.PESAPAL_IPN_ID;
  if (!id) throw new Error('PESAPAL_IPN_ID is not configured. Run scripts/pesapal-register-ipn.ts.');
  return id;
}

function buildMerchantReference(userId: string): string {
  // alphanumeric + - _ . :, max 50 chars
  return `AAN-${userId.slice(-8)}-${Date.now()}`.slice(0, 50);
}

/**
 * Compute final cart total + apply coupon. Returns the courses (with snapshotted
 * share percent) ready to bind into Payment + pending Enrollments.
 */
async function loadCheckoutPlan(userId: string, courseIds: string[], couponCode?: string) {
  if (!courseIds || courseIds.length === 0) {
    throw new Error('At least one courseId is required');
  }
  const uniq = Array.from(new Set(courseIds));

  const courses = await prisma.course.findMany({
    where: { id: { in: uniq }, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      instructorSharePercent: true,
      instructorId: true,
    },
  });

  if (courses.length !== uniq.length) {
    throw new Error('One or more courses not found or not published');
  }

  // Filter out courses the user is already actively enrolled in.
  const existing = await prisma.enrollment.findMany({
    where: { userId, courseId: { in: uniq }, status: 'ACTIVE' },
    select: { courseId: true },
  });
  const blocked = new Set(existing.map((e) => e.courseId));
  const purchasable = courses.filter((c) => !blocked.has(c.id));

  if (purchasable.length === 0) {
    throw new Error('You are already enrolled in all selected courses');
  }

  let subtotal = purchasable.reduce((sum, c) => sum + Number(c.price), 0);
  let appliedCouponId: string | null = null;
  let discountAmount = 0;

  if (couponCode) {
    const code = couponCode.toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new Error('Coupon not found');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon has expired');
    if (!coupon.isActive) throw new Error('Coupon is no longer active');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached');
    if (coupon.courseId && !purchasable.some((c) => c.id === coupon.courseId)) {
      throw new Error('Coupon is not valid for the selected courses');
    }
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * Number(coupon.value) / 100);
    } else {
      discountAmount = Math.min(Number(coupon.value), subtotal);
    }
    appliedCouponId = coupon.id;
  }

  const total = Math.max(0, subtotal - discountAmount);

  // Resolve effective share percent per course up front so we snapshot
  // consistently across the transaction.
  const sharePercents = new Map<string, number>();
  for (const c of purchasable) {
    sharePercents.set(c.id, await resolveInstructorSharePercent(c.instructorSharePercent));
  }

  return { courses: purchasable, subtotal, discountAmount, total, appliedCouponId, sharePercents };
}

// ─── POST /payments/checkout ────────────────────────────────────────────────

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { courseIds, courseId, couponCode } = req.body as {
      courseIds?: string[];
      courseId?: string;
      couponCode?: string;
    };

    const ids = courseIds && courseIds.length > 0 ? courseIds : courseId ? [courseId] : [];
    const plan = await loadCheckoutPlan(userId, ids, couponCode);

    // Free path (cart total = 0): grant access immediately, no Pesapal hop.
    if (plan.total === 0) {
      await prisma.$transaction(async (tx) => {
        for (const c of plan.courses) {
          const sharePct = plan.sharePercents.get(c.id) ?? 70;
          await tx.enrollment.upsert({
            where: { userId_courseId: { userId, courseId: c.id } },
            update: { status: 'ACTIVE', paidAmount: 0 },
            create: {
              userId,
              courseId: c.id,
              status: 'ACTIVE',
              paidAmount: 0,
              currency: DEFAULT_CURRENCY,
              instructorSharePercent: sharePct,
            },
          });
        }
        if (plan.appliedCouponId) {
          await tx.coupon.update({
            where: { id: plan.appliedCouponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });
      return res.json({ enrolled: true, freeCheckout: true, courseSlugs: plan.courses.map((c) => c.slug) });
    }

    const merchantReference = buildMerchantReference(userId);
    const description = plan.courses.length === 1
      ? plan.courses[0].title
      : `AAN Academy: ${plan.courses.length} courses`;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, profile: { select: { displayName: true } } },
    });

    // Persist Payment + PENDING enrollments in one transaction. orderTrackingId
    // gets filled in after we hear back from Pesapal.
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          userId,
          merchantReference,
          amount: plan.total,
          currency: DEFAULT_CURRENCY,
          status: 'PENDING',
          metadata: {
            courseIds: plan.courses.map((c) => c.id),
            couponId: plan.appliedCouponId,
            subtotal: plan.subtotal,
            discountAmount: plan.discountAmount,
          },
        },
      });

      for (const c of plan.courses) {
        const sharePct = plan.sharePercents.get(c.id) ?? 70;
        // Per-course price share of the cart total (after discount), rounded.
        const courseShare = plan.subtotal === 0 ? 0
          : Math.round((Number(c.price) / plan.subtotal) * plan.total);
        await tx.enrollment.upsert({
          where: { userId_courseId: { userId, courseId: c.id } },
          update: {
            status: 'PENDING',
            paidAmount: courseShare,
            currency: DEFAULT_CURRENCY,
            instructorSharePercent: sharePct,
            paymentId: p.id,
          },
          create: {
            userId,
            courseId: c.id,
            status: 'PENDING',
            paidAmount: courseShare,
            currency: DEFAULT_CURRENCY,
            instructorSharePercent: sharePct,
            paymentId: p.id,
          },
        });
      }

      if (plan.appliedCouponId) {
        await tx.coupon.update({
          where: { id: plan.appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return p;
    });

    // Now hop to Pesapal.
    const order = await PesapalService.submitOrder({
      merchantReference,
      currency: DEFAULT_CURRENCY,
      amount: plan.total,
      description,
      callbackUrl: `${FRONTEND_URL}/payments/return`,
      cancellationUrl: `${FRONTEND_URL}/cart?canceled=true`,
      notificationId: getIpnId(),
      billing: {
        email: user?.email ?? undefined,
        phone: user?.phone ?? undefined,
        firstName: user?.profile?.displayName?.split(' ')[0],
        lastName: user?.profile?.displayName?.split(' ').slice(1).join(' ') || undefined,
        countryCode: 'UG',
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { orderTrackingId: order.orderTrackingId },
    });

    return res.json({
      redirectUrl: order.redirectUrl,
      orderTrackingId: order.orderTrackingId,
      merchantReference: order.merchantReference,
    });
  } catch (err: any) {
    if (err instanceof PesapalError) {
      console.error('[checkout] Pesapal error:', err.endpoint, err.pesapalError);
    }
    return res.status(400).json({ error: err.message || 'Checkout failed' });
  }
};

// ─── IPN handler (GET + POST both supported) ───────────────────────────────
//
// Pesapal calls this when payment status changes. The payload carries no payment
// status — we MUST call GetTransactionStatus with the bearer token to fetch real
// status. Idempotent via ProcessedPesapalIpn unique key.

async function handleIpn(orderTrackingId: string | undefined, merchantReference: string | undefined, notificationType: string | undefined, res: Response) {
  if (!orderTrackingId) {
    return res.status(400).json({ error: 'OrderTrackingId is required' });
  }

  const insertCount = await prisma.$executeRaw`
    INSERT INTO "ProcessedPesapalIpn" ("orderTrackingId", "notificationType", "receivedAt")
    VALUES (${orderTrackingId}, ${notificationType ?? 'IPNCHANGE'}, NOW())
    ON CONFLICT ("orderTrackingId") DO NOTHING
  `;

  const alreadyProcessed = insertCount === 0;

  // Even if we've seen this orderTrackingId before, refetch + reconcile in case
  // Pesapal status moved (e.g. PENDING → COMPLETED → REVERSED).
  try {
    await reconcilePayment(orderTrackingId);
  } catch (err: any) {
    console.error('[ipn] reconcile failed for', orderTrackingId, err.message);
    // Don't 500 — Pesapal will retry. But we want to surface, so log loudly.
  }

  // Echo received fields back per Pesapal API 3.0 contract.
  return res.status(200).json({
    OrderNotificationType: notificationType ?? 'IPNCHANGE',
    OrderTrackingId: orderTrackingId,
    OrderMerchantReference: merchantReference ?? '',
    status: alreadyProcessed ? 'duplicate' : 'received',
  });
}

export const ipnGet = async (req: Request, res: Response) => {
  return handleIpn(
    req.query.OrderTrackingId as string | undefined,
    req.query.OrderMerchantReference as string | undefined,
    req.query.OrderNotificationType as string | undefined,
    res,
  );
};

export const ipnPost = async (req: Request, res: Response) => {
  const body = (req.body || {}) as Record<string, string | undefined>;
  return handleIpn(
    body.OrderTrackingId,
    body.OrderMerchantReference,
    body.OrderNotificationType,
    res,
  );
};

/**
 * Pull authoritative status from Pesapal and reconcile DB. Idempotent: safe to
 * call from IPN handler, frontend polling, and admin re-sync.
 */
export async function reconcilePayment(orderTrackingId: string) {
  const payment = await prisma.payment.findUnique({
    where: { orderTrackingId },
    include: { enrollments: true },
  });
  if (!payment) {
    console.warn('[reconcile] no Payment row for', orderTrackingId);
    return null;
  }

  const status = await PesapalService.getStatus(orderTrackingId);

  // Map Pesapal status_code → our PaymentStatus.
  let next: typeof payment.status = payment.status;
  switch (status.statusCode) {
    case 1: next = 'COMPLETED'; break;
    case 2: next = 'FAILED'; break;
    case 3: next = 'REVERSED'; break;
    default: next = payment.status; // INVALID — leave alone unless still pending
  }

  const baseUpdate = {
    pesapalStatusCode: status.statusCode,
    paymentMethod: status.paymentMethod ?? undefined,
    paymentAccount: status.paymentAccount ?? undefined,
    confirmationCode: status.confirmationCode ?? undefined,
    failureDescription: status.statusCode === 2 ? status.description : null,
  };

  // Idempotency: only flip to COMPLETED + grant enrollments once.
  if (next === 'COMPLETED' && payment.status !== 'COMPLETED') {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { ...baseUpdate, status: 'COMPLETED', paidAt: new Date() },
      });
      await tx.enrollment.updateMany({
        where: { paymentId: payment.id, status: 'PENDING' },
        data: { status: 'ACTIVE' },
      });
    });

    // Fire-and-forget enrollment notifications.
    try {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { phone: true, email: true },
      });
      const enrolled = await prisma.enrollment.findMany({
        where: { paymentId: payment.id, status: 'ACTIVE' },
        select: { course: { select: { title: true } } },
      });
      for (const e of enrolled) {
        await NotificationService.notifyEnrollmentConfirmed(
          payment.userId,
          e.course.title,
          user?.phone,
          user?.email,
        );
      }
    } catch (err) {
      console.error('[reconcile] notification failed:', err);
    }
  } else if (next === 'FAILED' && payment.status !== 'FAILED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { ...baseUpdate, status: 'FAILED' },
      }),
      prisma.enrollment.updateMany({
        where: { paymentId: payment.id, status: 'PENDING' },
        data: { status: 'PENDING' }, // remain PENDING; user can retry
      }),
    ]);
  } else if (next === 'REVERSED' && payment.status !== 'REVERSED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { ...baseUpdate, status: 'REVERSED' },
      }),
      prisma.enrollment.updateMany({
        where: { paymentId: payment.id, status: 'ACTIVE' },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: baseUpdate });
  }

  return prisma.payment.findUnique({ where: { id: payment.id } });
}

// ─── GET /payments/status/:orderTrackingId ──────────────────────────────────
// Frontend polls this from the return page in case IPN is delayed.

export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderTrackingId } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { orderTrackingId },
      include: {
        enrollments: { include: { course: { select: { id: true, slug: true, title: true } } } },
      },
    });

    if (!payment || payment.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Re-fetch from Pesapal if still pending.
    if (payment.status === 'PENDING') {
      try {
        await reconcilePayment(orderTrackingId);
      } catch (err: any) {
        console.warn('[status] reconcile failed:', err.message);
      }
    }

    const fresh = await prisma.payment.findUnique({
      where: { orderTrackingId },
      include: {
        enrollments: { include: { course: { select: { id: true, slug: true, title: true } } } },
      },
    });

    return res.json({
      status: fresh!.status,
      amount: Number(fresh!.amount),
      currency: fresh!.currency,
      paymentMethod: fresh!.paymentMethod,
      failureDescription: fresh!.failureDescription,
      enrollments: fresh!.enrollments.map((e) => ({
        courseId: e.courseId,
        courseSlug: e.course.slug,
        courseTitle: e.course.title,
        status: e.status,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /payments/:id/refund (admin) ──────────────────────────────────────

export const adminRefund = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, remarks } = req.body as { amount?: number; remarks?: string };

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: `Cannot refund payment with status ${payment.status}` });
    }
    if (!payment.confirmationCode) {
      return res.status(400).json({ error: 'No confirmation code available — cannot refund yet' });
    }

    const refundAmount = amount && amount > 0 ? Math.min(amount, Number(payment.amount)) : Number(payment.amount);

    // Mobile money: full refund only. Heuristic: paymentMethod contains "Mpesa", "MTN", "Airtel", "Mobile".
    const isMobileMoney = /mpesa|mtn|airtel|mobile/i.test(payment.paymentMethod ?? '');
    if (isMobileMoney && refundAmount < Number(payment.amount)) {
      return res.status(400).json({ error: 'Mobile money supports full refunds only' });
    }

    const result = await PesapalService.refund({
      confirmationCode: payment.confirmationCode,
      amount: refundAmount,
      username: req.user!.id,
      remarks: remarks || 'Admin-initiated refund',
    });
    if (!result.accepted) {
      return res.status(400).json({ error: `Refund rejected by Pesapal: ${result.message}` });
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: {
          status: 'REFUND_REQUESTED',
          refundAmount,
          refundRemarks: remarks || 'Admin-initiated',
          refundedAt: new Date(),
        },
      }),
      prisma.enrollment.updateMany({
        where: { paymentId: id, status: 'ACTIVE' },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      }),
    ]);

    return res.json({ ok: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /cart/coupon (validation only) ───────────────────────────────────

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, cartSubtotal } = req.body;
    if (!code || cartSubtotal == null) {
      return res.status(400).json({ error: 'code and cartSubtotal are required' });
    }
    const normalizedCode = code.toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    if (!coupon.isActive) return res.status(400).json({ error: 'Coupon is no longer active' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    const subtotal = Number(cartSubtotal);
    const discountAmount = coupon.type === 'PERCENTAGE'
      ? Math.round(subtotal * Number(coupon.value) / 100)
      : Math.min(Number(coupon.value), subtotal);

    // Validation only — usage count is incremented inside checkout transaction so
    // abandoned carts don't burn through limited coupons.
    return res.json({ discountAmount, couponId: coupon.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
