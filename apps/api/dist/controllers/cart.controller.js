import { prisma } from '@farmwise/db';
export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                thumbnailPublicId: true,
                                price: true,
                                instructor: {
                                    select: {
                                        id: true,
                                        profile: { select: { displayName: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.json({ items: cart?.items || [] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ error: 'courseId is required' });
        }
        // Check if already enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (enrollment && enrollment.status === 'ACTIVE') {
            return res.status(400).json({ error: 'You are already enrolled in this course' });
        }
        // Upsert cart
        const cart = await prisma.cart.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
        // Add item (ignore if already in cart)
        await prisma.cartItem.upsert({
            where: { cartId_courseId: { cartId: cart.id, courseId } },
            create: { cartId: cart.id, courseId },
            update: {},
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        // Verify ownership
        const item = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });
        if (!item || item.cart.userId !== userId) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        await prisma.cartItem.delete({ where: { id: itemId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
