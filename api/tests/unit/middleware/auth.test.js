import { beforeEach, describe, expect, test, vi } from 'vitest';

let mockUserRecord;

vi.mock('../../../model/user.js', () => ({
    User: class User {
        constructor(fields = {}) {
            Object.assign(this, fields);
        }

        async getBy() {
            if (!mockUserRecord) return null;
            Object.assign(this, mockUserRecord);
            return this;
        }
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
    },
}));

vi.mock('../../../helpers/jwt.js', () => ({
    signJwt: vi.fn().mockResolvedValue('signed-token'),
    verifyJwt: vi.fn(),
}));

const bcrypt = (await import('bcrypt')).default;
const { signJwt, verifyJwt } = await import('../../../helpers/jwt.js');
const auth = (await import('../../../middleware/auth.js')).auth;

describe('auth middleware', () => {
    beforeEach(() => {
        mockUserRecord = {
            id: 1,
            name: 'Test User',
            email: 'user@example.com',
            password: '$2b$10$hashed',
        };
        bcrypt.compare.mockResolvedValue(true);
        verifyJwt.mockResolvedValue({ email: 'user@example.com' });
    });

    test('authenticates email/password requests', async () => {
        const req = {
            body: {
                email: 'user@example.com',
                password: 'secret',
            },
            headers: {},
        };
        const next = vi.fn();

        await auth({ 'user:password': true })(req, {}, next);

        expect(req.user.email).toBe('user@example.com');
        expect(req.user.token).toBe('signed-token');
        expect(next).toHaveBeenCalledWith();
    });

    test('authenticates requests using HttpOnly cookie token', async () => {
        const req = {
            headers: {
                cookie: 'app_session=valid-cookie-token',
            },
            body: {},
        };
        const next = vi.fn();

        await auth({ 'user:exists': true })(req, {}, next);

        expect(req.user.email).toBe('user@example.com');
        expect(next).toHaveBeenCalledWith();
    });

    test('authenticates requests using Bearer authorization header fallback', async () => {
        const req = {
            headers: {
                authorization: 'Bearer valid-header-token',
            },
            body: {},
        };
        const next = vi.fn();

        await auth({ 'user:exists': true })(req, {}, next);

        expect(req.user.email).toBe('user@example.com');
        expect(next).toHaveBeenCalledWith();
    });

    test('rejects invalid or expired tokens', async () => {
        verifyJwt.mockResolvedValue(null);
        const req = {
            headers: {
                authorization: 'Bearer bad-token',
            },
            body: {},
        };
        const next = vi.fn();

        await auth({ 'user:exists': true })(req, {}, next);

        expect(next.mock.calls[0][0].message).toBe('Invalid token.');
    });

    test('allows optional auth without token without failing', async () => {
        const req = {
            headers: {},
            body: {},
        };
        const next = vi.fn();

        await auth({ 'user:optional': true })(req, {}, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalledWith();
    });
});
