import Stripe from 'stripe';
import { prisma } from '@farmwise/db';
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set. Payments will not work.");
}
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2023-10-16',
});
/**
 * Zero-decimal currencies should NOT be multiplied by 100.
 * UGX, KES, TZS, etc. are zero-decimal in Stripe.
 */
const ZERO_DECIMAL_CURRENCIES = new Set(['ugx', 'kes', 'tzs', 'ghs', 'jpy', 'krw']);
export function toStripeAmount(amount, currency) {
    return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
        ? Math.round(amount)
        : Math.round(amount * 100);
}
export class StripeService {
    /**
     * Creates a Stripe Checkout session for course purchases.
     */
    static async createCheckoutSession(userId, course, successUrl, cancelUrl) {
        // If course is free, we shouldn't be here (handled by controller), but double check
        if (Number(course.price) === 0) {
            throw new Error("Free courses should not use Stripe Checkout");
        }
        const currency = 'ugx';
        const unitAmount = toStripeAmount(Number(course.price), currency);
        // Check if instructor has Stripe Connect set up for revenue split
        const instructorProfile = await prisma.profile.findUnique({
            where: { userId: course.instructorId },
            select: { stripeConnectAccountId: true, stripeConnectStatus: true },
        });
        const hasConnect = instructorProfile?.stripeConnectAccountId &&
            instructorProfile?.stripeConnectStatus === 'active';
        const sessionParams = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: course.title,
                            description: `Access to ${course.title} on FarmWise`,
                            images: course.thumbnailPublicId ? [`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${course.thumbnailPublicId}`] : [],
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
            },
        };
        // Apply 30% platform fee and route remainder to instructor via Connect
        if (hasConnect) {
            const applicationFee = toStripeAmount(Math.round(Number(course.price) * 0.3), currency);
            sessionParams.payment_intent_data = {
                application_fee_amount: applicationFee,
                transfer_data: {
                    destination: instructorProfile.stripeConnectAccountId,
                },
            };
        }
        const session = await stripe.checkout.sessions.create(sessionParams);
        return session;
    }
    /**
     * Generates an onboarding link for an Instructor to connect to Stripe Connect Express.
     */
    static async createConnectAccount(instructorId, email, returnUrl, refreshUrl) {
        let instructor = await prisma.user.findUnique({ where: { id: instructorId } });
        // In a real app we would have a stripeAccountId property on the user model,
        // For now we will mock this flow, as we don't have a stripeAccountId column in the schema.
        // Assuming we'll just return a mock URL for now until the schema is explicitly expanded for Connect.
        return "https://connect.stripe.com/express/mock-onboarding-url";
    }
}
