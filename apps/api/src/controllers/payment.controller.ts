import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StripeService, stripe } from '../services/stripe.service';
import { EnrollmentService } from '../services/enrollment.service';
import { prisma } from '@farmwise/db';

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user!.id;

    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    
    if (!course || course.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Course not found or unavailable' });
    }

    if (await EnrollmentService.isEnrolled(userId, courseId)) {
       return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    if (Number(course.price) === 0) {
      // Fast-track free courses
      await EnrollmentService.enrollFreeCourse(userId, courseId);
      return res.json({ enrolled: true, courseSlug: course.slug });
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&slug=${course.slug}`;
    const cancelUrl = `${FRONTEND_URL}/course/${course.slug}?canceled=true`;

    const url = await StripeService.createCheckoutSession(userId, course, successUrl, cancelUrl);
    
    res.json({ url });
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
    // Handle refunds here if charge.refunded
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
