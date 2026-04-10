"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("@farmwise/db");
// @ts-ignore
const africastalking_1 = __importDefault(require("africastalking"));
const email_service_1 = require("./email.service");
const AT = (0, africastalking_1.default)({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const sms = AT.SMS;
class AuthService {
    static async registerPhone(phone, passwordHash, name) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        const user = await db_1.prisma.user.upsert({
            where: { phone },
            update: { verifyToken: otp, verifyTokenExp: tokenExp, ...(passwordHash && { passwordHash }) },
            create: { phone, role: 'FARMER', verifyToken: otp, verifyTokenExp: tokenExp, ...(passwordHash && { passwordHash }) }
        });
        // Create profile with the user's name if provided
        if (name) {
            await db_1.prisma.profile.upsert({
                where: { userId: user.id },
                update: {},
                create: { userId: user.id, displayName: name },
            });
        }
        try {
            await sms.send({
                to: [phone],
                message: `Your FarmWise verification code is ${otp}. Expires in 15 minutes.`
            });
        }
        catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }
        return { success: true, message: "OTP sent successfully" };
    }
    static async verifyPhone(phone, otp) {
        const user = await db_1.prisma.user.findUnique({ where: { phone } });
        if (!user || user.verifyToken !== otp || !user.verifyTokenExp || user.verifyTokenExp < new Date()) {
            throw new Error("Invalid or expired OTP");
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null, verifyTokenExp: null }
        });
        return this.generateTokens(updatedUser.id, updatedUser.role);
    }
    static async registerEmail(email, passwordHash, name) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Allow re-registration if previous account was never verified
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing && existing.isVerified) {
            throw new Error('An account with this email already exists');
        }
        const user = existing
            ? await db_1.prisma.user.update({
                where: { id: existing.id },
                data: { passwordHash, verifyToken: token, verifyTokenExp: tokenExp },
            })
            : await db_1.prisma.user.create({
                data: { email, passwordHash, role: 'FARMER', verifyToken: token, verifyTokenExp: tokenExp },
            });
        // Create or update profile with the user's name if provided
        if (name) {
            await db_1.prisma.profile.upsert({
                where: { userId: user.id },
                update: { displayName: name },
                create: { userId: user.id, displayName: name },
            });
        }
        // Send verification email via Resend (non-blocking — don't fail registration if email fails)
        try {
            await email_service_1.emailService.sendVerificationEmail(email, token);
        }
        catch (err) {
            console.error('Failed to send verification email:', err);
        }
        return { success: true, message: "Verification email sent", userId: user.id };
    }
    static async verifyEmail(token) {
        const user = await db_1.prisma.user.findFirst({ where: { verifyToken: token } });
        if (!user || !user.verifyTokenExp || user.verifyTokenExp < new Date()) {
            throw new Error("Invalid or expired token");
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null, verifyTokenExp: null }
        });
        return this.generateTokens(updatedUser.id, updatedUser.role);
    }
    static async loginEmail(email, passwordPlain) {
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash)
            throw new Error("Invalid credentials");
        if (!user.isVerified)
            throw new Error("Email not verified");
        const valid = await bcrypt_1.default.compare(passwordPlain, user.passwordHash);
        if (!valid)
            throw new Error("Invalid credentials");
        return this.generateTokens(user.id, user.role);
    }
    static async loginPhone(phone, passwordPlain) {
        const user = await db_1.prisma.user.findUnique({ where: { phone } });
        if (!user || !user.passwordHash)
            throw new Error("Invalid credentials");
        if (!user.isVerified)
            throw new Error("Phone not verified");
        const valid = await bcrypt_1.default.compare(passwordPlain, user.passwordHash);
        if (!valid)
            throw new Error("Invalid credentials");
        return this.generateTokens(user.id, user.role);
    }
    static async hashPassword(password) {
        return await bcrypt_1.default.hash(password, 12); // cost >= 12 as per hard constraint 4
    }
    static generateTokens(userId, role) {
        const JWT_SECRET = process.env.JWT_SECRET;
        const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
        const accessToken = jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return { accessToken, refreshToken, user: { id: userId, role } };
    }
    static async requestPasswordReset(email) {
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { success: true }; // Prevent email scanning
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExp: tokenExp }
        });
        // Send password reset email via Resend
        try {
            await email_service_1.emailService.sendPasswordResetEmail(email, token);
        }
        catch (err) {
            console.error('Failed to send password reset email:', err);
            throw new Error('Failed to send reset email');
        }
        return { success: true };
    }
    static async requestPhonePasswordReset(phone) {
        const user = await db_1.prisma.user.findUnique({ where: { phone } });
        if (!user)
            return { success: true }; // Prevent enumeration
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { resetToken: otp, resetTokenExp: tokenExp }
        });
        try {
            await sms.send({
                to: [phone],
                message: `Your FarmWise password reset code is ${otp}. Expires in 15 minutes.`
            });
        }
        catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }
        return { success: true };
    }
    static async resetPassword(token, newPasswordHash) {
        const user = await db_1.prisma.user.findFirst({ where: { resetToken: token } });
        if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
            throw new Error("Invalid or expired reset token");
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                resetToken: null,
                resetTokenExp: null
            }
        });
        return { success: true };
    }
    static async resetPasswordByPhone(phone, otp, newPasswordHash) {
        const user = await db_1.prisma.user.findUnique({ where: { phone } });
        if (!user || user.resetToken !== otp || !user.resetTokenExp || user.resetTokenExp < new Date()) {
            throw new Error("Invalid or expired OTP");
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                resetToken: null,
                resetTokenExp: null
            }
        });
        return { success: true };
    }
    static async resendVerificationEmail(email) {
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.isVerified)
            return { success: true }; // Prevent enumeration
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: token, verifyTokenExp: tokenExp }
        });
        await email_service_1.emailService.sendVerificationEmail(email, token);
        return { success: true };
    }
    static async resendVerificationOtp(phone) {
        const user = await db_1.prisma.user.findUnique({ where: { phone } });
        if (!user || user.isVerified)
            return { success: true }; // Prevent enumeration
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenExp = new Date(Date.now() + 15 * 60 * 1000);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: otp, verifyTokenExp: tokenExp }
        });
        try {
            await sms.send({
                to: [phone],
                message: `Your FarmWise verification code is ${otp}. Expires in 15 minutes.`
            });
        }
        catch (error) {
            console.error("SMS Error:", error);
            throw new Error("Failed to send SMS");
        }
        return { success: true };
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    }
}
exports.AuthService = AuthService;
