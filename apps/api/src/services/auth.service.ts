import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, Role } from '@farmwise/db';
// @ts-ignore
import AfricasTalking from 'africastalking';
import { emailService } from './email.service';

const AT = AfricasTalking({
    apiKey: process.env.AT_API_KEY as string,
    username: process.env.AT_USERNAME as string,
});

const sms = AT.SMS;

export class AuthService {
    static async registerPhone(phone: string, passwordHash?: string, name?: string) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        const user = await prisma.user.upsert({
            where: { phone },
            update: { verifyToken: otp, verifyTokenExp: tokenExp, ...(passwordHash && { passwordHash }) },
            create: { phone, role: 'FARMER', verifyToken: otp, verifyTokenExp: tokenExp, ...(passwordHash && { passwordHash }) }
        });

        // Create profile with the user's name if provided
        if (name) {
            await prisma.profile.upsert({
                where: { userId: user.id },
                update: {},
                create: { userId: user.id, displayName: name },
            });
        }

        try {
            await sms.send({
                to: [phone],
                message: `Your AAN Academy verification code is ${otp}. Expires in 15 minutes.`
            });
        } catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }

        return { success: true, message: "OTP sent successfully" };
    }

    static async verifyPhone(phone: string, otp: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || !user.verifyToken || !user.verifyTokenExp || user.verifyTokenExp < new Date() ||
            !crypto.timingSafeEqual(Buffer.from(user.verifyToken), Buffer.from(otp))) {
            throw new Error("Invalid or expired OTP");
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null, verifyTokenExp: null }
        });

        return this.generateTokens(updatedUser.id, updatedUser.role);
    }

    static async registerEmail(email: string, passwordHash: string, name?: string) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Allow re-registration if previous account was never verified
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.isVerified) {
            throw new Error('An account with this email already exists');
        }

        const user = existing
            ? await prisma.user.update({
                where: { id: existing.id },
                data: { passwordHash, verifyToken: token, verifyTokenExp: tokenExp },
              })
            : await prisma.user.create({
                data: { email, passwordHash, role: 'FARMER', verifyToken: token, verifyTokenExp: tokenExp },
              });

        // Create or update profile with the user's name if provided
        if (name) {
            await prisma.profile.upsert({
                where: { userId: user.id },
                update: { displayName: name },
                create: { userId: user.id, displayName: name },
            });
        }

        // Send verification email via Resend (non-blocking — don't fail registration if email fails)
        try {
            await emailService.sendVerificationEmail(email, token);
        } catch (err) {
            console.error('Failed to send verification email:', err);
        }

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

    static async loginPhone(phone: string, passwordPlain: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || !user.passwordHash) throw new Error("Invalid credentials");
        if (!user.isVerified) throw new Error("Phone not verified");

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

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExp: tokenExp }
        });

        // Send password reset email via Resend
        try {
            await emailService.sendPasswordResetEmail(email, token);
        } catch (err) {
            console.error('Failed to send password reset email:', err);
            throw new Error('Failed to send reset email');
        }
        return { success: true };
    }

    static async requestPhonePasswordReset(phone: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return { success: true }; // Prevent enumeration

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: otp, resetTokenExp: tokenExp }
        });

        try {
            await sms.send({
                to: [phone],
                message: `Your AAN Academy password reset code is ${otp}. Expires in 15 minutes.`
            });
        } catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }

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

    static async resetPasswordByPhone(phone: string, otp: string, newPasswordHash: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || user.resetToken !== otp || !user.resetTokenExp || user.resetTokenExp < new Date()) {
            throw new Error("Invalid or expired OTP");
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

    static async resendVerificationEmail(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.isVerified) return { success: true }; // Prevent enumeration

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: token, verifyTokenExp: tokenExp }
        });

        await emailService.sendVerificationEmail(email, token);
        return { success: true };
    }

    static async resendVerificationOtp(phone: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || user.isVerified) return { success: true }; // Prevent enumeration

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: otp, verifyTokenExp: tokenExp }
        });

        try {
            await sms.send({
                to: [phone],
                message: `Your AAN Academy verification code is ${otp}. Expires in 15 minutes.`
            });
        } catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }

        return { success: true };
    }

    static verifyAccessToken(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: Role };
    }

    static verifyRefreshToken(token: string) {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { userId: string, role: Role };
    }
}
