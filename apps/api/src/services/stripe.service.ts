import Stripe from 'stripe';
import { prisma } from '@farmwise/db';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Payments will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

export class StripeService {
  /**
   * Creates a Stripe Checkout session for course purchases.
   */
  static async createCheckoutSession(userId: string, course: any, successUrl: string, cancelUrl: string) {
    // If course is free, we shouldn't be here (handled by controller), but double check
    if (Number(course.price) === 0) {
      throw new Error("Free courses should not use Stripe Checkout");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Default to USD for now
            product_data: {
              name: course.title,
              description: `Access to ${course.title} on FarmWise`,
              images: course.thumbnailPublicId ? [`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${course.thumbnailPublicId}`] : [],
            },
            unit_amount: Math.round(Number(course.price) * 100), // Stripe expects cents
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
      },
    });

    return session.url;
  }

  /**
   * Generates an onboarding link for an Instructor to connect to Stripe Connect Express.
   */
  static async createConnectAccount(instructorId: string, email: string, returnUrl: string, refreshUrl: string) {
    let instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    
    // In a real app we would have a stripeAccountId property on the user model,
    // For now we will mock this flow, as we don't have a stripeAccountId column in the schema.
    // Assuming we'll just return a mock URL for now until the schema is explicitly expanded for Connect.

    return "https://connect.stripe.com/express/mock-onboarding-url";
  }
}
