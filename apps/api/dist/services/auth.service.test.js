"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_service_1 = require("./auth.service");
vitest_1.vi.mock('@farmwise/db', () => ({
    prisma: {
        user: {
            findUnique: vitest_1.vi.fn(),
            findFirst: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        }
    },
    Role: { FARMER: 'FARMER', INSTRUCTOR: 'INSTRUCTOR', ADMIN: 'ADMIN' }
}));
// Mock process.env
process.env.JWT_SECRET = 'test_secret_for_tests_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_tests_only';
process.env.AT_API_KEY = 'test';
process.env.AT_USERNAME = 'test';
(0, vitest_1.describe)('AuthService', () => {
    (0, vitest_1.it)('should hash password', async () => {
        const hash = await auth_service_1.AuthService.hashPassword('secret123');
        (0, vitest_1.expect)(hash).toBeDefined();
        (0, vitest_1.expect)(hash).not.toBe('secret123');
    });
    (0, vitest_1.it)('should generate tokens', () => {
        const tokens = auth_service_1.AuthService.generateTokens('user-1', 'FARMER');
        (0, vitest_1.expect)(tokens.accessToken).toBeDefined();
        (0, vitest_1.expect)(tokens.refreshToken).toBeDefined();
        (0, vitest_1.expect)(tokens.user.id).toBe('user-1');
        (0, vitest_1.expect)(tokens.user.role).toBe('FARMER');
    });
});
