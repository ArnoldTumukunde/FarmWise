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
            const { email, phone, password } = req.body;
            if (email && password) {
                const hash = await AuthService.hashPassword(password);
                const result = await AuthService.registerEmail(email, hash);
                return res.status(201).json(result);
            } else if (phone) {
                const result = await AuthService.registerPhone(phone);
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
            if (email && token) {
                result = await AuthService.verifyEmail(token);
            } else if (phone && otp) {
                result = await AuthService.verifyPhone(phone, otp);
            } else {
                return res.status(400).json({ error: 'Provide email+token or phone+otp' });
            }

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
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
            const { email, passwordPlain } = req.body;
            if (!email || !passwordPlain) return res.status(400).json({ error: 'Email and password required' });

            const result = await AuthService.loginEmail(email, passwordPlain);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
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
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        await AuthService.requestPasswordReset(email);
        res.json({ success: true, message: 'Reset email sent if user exists' });
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword required' });

            const hash = await AuthService.hashPassword(newPassword);
            await AuthService.resetPassword(token, hash);
            res.json({ success: true, message: 'Password reset' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
