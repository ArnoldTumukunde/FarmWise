import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, Role } from '@farmwise/db';
// @ts-ignore
import AfricasTalking from 'africastalking';

const AT = AfricasTalking({
    apiKey: process.env.AT_API_KEY as string,
    username: process.env.AT_USERNAME as string,
});

const sms = AT.SMS;

export class AuthService {
    static async registerPhone(phone: string) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.upsert({
            where: { phone },
            update: { verifyToken: otp, verifyTokenExp: tokenExp },
            create: { phone, role: 'FARMER', verifyToken: otp, verifyTokenExp: tokenExp }
        });

        try {
            await sms.send({
                to: [phone],
                message: `Your FarmWise verification code is ${otp}. Expires in 15 minutes.`
            });
        } catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }

        return { success: true, message: "OTP sent successfully" };
    }

    static async verifyPhone(phone: string, otp: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || user.verifyToken !== otp || !user.verifyTokenExp || user.verifyTokenExp < new Date()) {
            throw new Error("Invalid or expired OTP");
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null, verifyTokenExp: null }
        });

        return this.generateTokens(updatedUser.id, updatedUser.role);
    }

    static async registerEmail(email: string, passwordHash: string) {
        const token = Math.random().toString(36).substring(2, 15);
        const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await prisma.user.create({
            data: { email, passwordHash, role: 'FARMER', verifyToken: token, verifyTokenExp: tokenExp }
        });

        // TODO: Send email using Resend (to be implemented in Module 8)
        console.log(`[Email Mock] Sent to ${email}: Verify token is ${token}`);

        return { success: true, message: "Verification email sent", userId: user.id };
    }

    static async verifyEmail(token: string) {
        const user = await prisma.user.findFirst({ where: { verifyToken: token } });
        if (!user || !user.verifyTokenExp || user.verifyTokenExp < new Date()) {
            throw new Error("Invalid or expired token");
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null, verifyTokenExp: null }
        });

        return this.generateTokens(updatedUser.id, updatedUser.role);
    }

    static async loginEmail(email: string, passwordPlain: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) throw new Error("Invalid credentials");
        if (!user.isVerified) throw new Error("Email not verified");

        const valid = await bcrypt.compare(passwordPlain, user.passwordHash);
        if (!valid) throw new Error("Invalid credentials");

        return this.generateTokens(user.id, user.role);
    }

    static async hashPassword(password: string) {
        return await bcrypt.hash(password, 12); // cost >= 12 as per hard constraint 4
    }

    static generateTokens(userId: string, role: string) {
        const JWT_SECRET = process.env.JWT_SECRET as string;
        const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

        const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        return { accessToken, refreshToken, user: { id: userId, role } };
    }

    static async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { success: true }; // Prevent email scanning

        const token = Math.random().toString(36).substring(2, 15);
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExp: tokenExp }
        });

        // TODO: Send email using Resend
        console.log(`[Email Mock] Sent to ${email}: Reset token is ${token}`);
        return { success: true };
    }

    static async resetPassword(token: string, newPasswordHash: string) {
        const user = await prisma.user.findFirst({ where: { resetToken: token } });
        if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
            throw new Error("Invalid or expired reset token");
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                resetToken: null,
                resetTokenExp: null
            }
        });

        return { success: true };
    }

    static verifyAccessToken(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: Role };
    }

    static verifyRefreshToken(token: string) {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { userId: string, role: Role };
    }
}
