import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
vi.mock('@farmwise/db', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        }
    },
    Role: { FARMER: 'FARMER', INSTRUCTOR: 'INSTRUCTOR', ADMIN: 'ADMIN' }
}));
// Mock process.env
process.env.JWT_SECRET = 'test_secret_for_tests_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_tests_only';
process.env.AT_API_KEY = 'test';
process.env.AT_USERNAME = 'test';
describe('AuthService', () => {
    it('should hash password', async () => {
        const hash = await AuthService.hashPassword('secret123');
        expect(hash).toBeDefined();
        expect(hash).not.toBe('secret123');
    });
    it('should generate tokens', () => {
        const tokens = AuthService.generateTokens('user-1', 'FARMER');
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        expect(tokens.user.id).toBe('user-1');
        expect(tokens.user.role).toBe('FARMER');
    });
});
