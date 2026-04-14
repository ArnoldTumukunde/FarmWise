import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StripeService, stripe, toStripeAmount } from '../services/stripe.service';
import { EnrollmentService } from '../services/enrollment.service';
import { prisma } from '@farmwise/db';

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, couponCode } = req.body;
    const userId = req.user!.id;

    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course || course.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Course not found or unavailable' });
    }

    let finalPrice = Number(course.price);
    let appliedCouponId: string | null = null;

    // If a coupon code is provided, validate and calculate discounted price
    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase();

      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (!coupon) {
        return res.status(400).json({ error: 'Coupon not found' });
      }

      // Check expiry
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Coupon has expired' });
      }

      // Check usage limit
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      }

      // If coupon is course-specific, validate it applies to this course
      if (coupon.courseId && coupon.courseId !== courseId) {
        return res.status(400).json({ error: 'Coupon is not valid for this course' });
      }

      // Calculate discount
      let discountAmount: number;
      if (coupon.type === 'PERCENTAGE') {
        discountAmount = Math.round(finalPrice * Number(coupon.value) / 100);
      } else {
        // FIXED
        discountAmount = Math.min(Number(coupon.value), finalPrice);
      }

      finalPrice = Math.max(0, finalPrice - discountAmount);
      appliedCouponId = coupon.id;

      // Atomic increment usedCount
      await prisma.$executeRaw`
        UPDATE "Coupon"
        SET "usedCount" = "usedCount" + 1
        WHERE id = ${coupon.id}
          AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
      `;
    }

    if (finalPrice === 0) {
      // Fast-track free courses (or 100% discount)
      await EnrollmentService.enrollFreeCourse(userId, courseId);
      return res.json({ enrolled: true, courseSlug: course.slug });
    }

    // Create PENDING enrollment before Stripe session
    const { alreadyActive } = await EnrollmentService.createPendingEnrollment(userId, courseId);

    if (alreadyActive) {
      return res.json({ enrolled: true, courseSlug: course.slug });
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&slug=${course.slug}`;
    const cancelUrl = `${FRONTEND_URL}/course/${course.slug}?canceled=true`;

    // Create Stripe checkout session with the (possibly discounted) price
    const currency = 'ugx';
    const unitAmount = toStripeAmount(finalPrice, currency);

    // Check if instructor has Stripe Connect set up for revenue split
    const instructorProfile = await prisma.profile.findUnique({
      where: { userId: course.instructorId },
      select: { stripeConnectAccountId: true, stripeConnectStatus: true },
    });

    const hasConnect =
      instructorProfile?.stripeConnectAccountId &&
      instructorProfile?.stripeConnectStatus === 'active';

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: course.title,
              description: `Access to ${course.title} on AAN Academy`,
              images: course.thumbnailPublicId
                ? [`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/farmwise/${course.thumbnailPublicId}`]
                : [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        courseId: course.id,
        ...(appliedCouponId && { couponId: appliedCouponId }),
      },
    };

    // Apply 30% platform fee and route remainder to instructor via Connect
    if (hasConnect) {
      const applicationFee = toStripeAmount(
        Math.round(finalPrice * 0.3),
        currency,
      );
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: instructorProfile.stripeConnectAccountId!,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Store stripeSessionId on the enrollment
    await EnrollmentService.setStripeSessionId(userId, courseId, session.id);

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Missing stripe signature or webhook secret");
    return res.status(400).send('Webhook Error');
  }

  let event;

  try {
    // req.rawBody must be the raw buffer captured by express.json.verify
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check with raw SQL INSERT ... ON CONFLICT DO NOTHING
  // This guarantees atomic lock creation even with concurrent webhooks
  const insertCount = await prisma.$executeRaw`
    INSERT INTO "ProcessedStripeEvent" (id, "processedAt")
    VALUES (${event.id}, NOW())
    ON CONFLICT (id) DO NOTHING;
  `;

  if (insertCount === 0) {
    console.log(`Event ${event.id} already processed`);
    return res.json({ received: true });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      await EnrollmentService.activateEnrollment(session);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as any;
      await EnrollmentService.activateByPaymentIntent(paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, cartSubtotal } = req.body;

    if (!code || cartSubtotal == null) {
      return res.status(400).json({ error: 'code and cartSubtotal are required' });
    }

    const normalizedCode = code.toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Calculate discount
    const subtotal = Number(cartSubtotal);
    let discountAmount: number;

    if (coupon.type === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * Number(coupon.value) / 100);
    } else {
      // FIXED
      discountAmount = Math.min(Number(coupon.value), subtotal);
    }

    // Atomic increment usedCount using raw SQL to prevent race conditions
    await prisma.$executeRaw`
      UPDATE "Coupon"
      SET "usedCount" = "usedCount" + 1
      WHERE id = ${coupon.id}
        AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
    `;

    res.json({ discountAmount, couponId: coupon.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
