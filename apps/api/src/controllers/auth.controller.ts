import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
    static async me(req: AuthRequest, res: Response) {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
        res.json({ user: { id: req.user.id, role: req.user.role } });
    }

    static async register(req: Request, res: Response) {
        try {
            const { email, phone, password, name } = req.body;
            if (email && password) {
                const hash = await AuthService.hashPassword(password);
                const result = await AuthService.registerEmail(email, hash, name);
                return res.status(201).json(result);
            } else if (phone && password) {
                const hash = await AuthService.hashPassword(password);
                const result = await AuthService.registerPhone(phone, hash, name);
                return res.status(201).json(result);
            } else if (phone) {
                const result = await AuthService.registerPhone(phone, undefined, name);
                return res.status(201).json(result);
            }
            return res.status(400).json({ error: 'Provide email+password or phone' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async verify(req: Request, res: Response) {
        try {
            const { email, phone, token, otp } = req.body;
            let result;
            if (token) {
                result = await AuthService.verifyEmail(token);
            } else if (phone && otp) {
                result = await AuthService.verifyPhone(phone, otp);
            } else {
                return res.status(400).json({ error: 'Provide token or phone+otp' });
            }

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.json({ accessToken: result.accessToken, user: result.user });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, phone, passwordPlain } = req.body;
            if (!passwordPlain || (!email && !phone)) {
                return res.status(400).json({ error: 'Email or phone plus password required' });
            }

            const result = email
                ? await AuthService.loginEmail(email, passwordPlain)
                : await AuthService.loginPhone(phone, passwordPlain);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({ accessToken: result.accessToken, user: result.user });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

            const decoded = AuthService.verifyRefreshToken(refreshToken);
            const newTokens = AuthService.generateTokens(decoded.userId, decoded.role);

            res.cookie('refreshToken', newTokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({ accessToken: newTokens.accessToken });
        } catch (error: any) {
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    }

    static async logout(req: Request, res: Response) {
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out' });
    }

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email, phone } = req.body;
            if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

            if (phone) {
                await AuthService.requestPhonePasswordReset(phone);
                return res.json({ success: true, message: 'OTP sent if account exists' });
            }

            await AuthService.requestPasswordReset(email);
            res.json({ success: true, message: 'Reset email sent if user exists' });
        } catch (error: any) {
            // Always return success to prevent user enumeration
            res.json({ success: true });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, phone, otp, newPassword } = req.body;
            if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
            if (!token && (!phone || !otp)) return res.status(400).json({ error: 'Provide token or phone+otp' });

            const hash = await AuthService.hashPassword(newPassword);

            if (phone && otp) {
                await AuthService.resetPasswordByPhone(phone, otp, hash);
            } else {
                await AuthService.resetPassword(token, hash);
            }

            res.json({ success: true, message: 'Password reset' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async resendOtp(req: Request, res: Response) {
        try {
            const { phone } = req.body;
            if (!phone) return res.status(400).json({ error: 'Phone required' });

            await AuthService.resendVerificationOtp(phone);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async resendVerification(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });

            await AuthService.resendVerificationEmail(email);
            res.json({ success: true });
        } catch (error: any) {
            // Always return success to prevent email enumeration
            res.json({ success: true });
        }
    }
}
