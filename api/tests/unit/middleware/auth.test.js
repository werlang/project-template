import { beforeEach, describe, expect, test, vi } from 'vitest';

let mockUserRecord;

vi.mock('../../../model/user.js', () => ({
    User: class User {
        constructor(fields = {}) {
            Object.assign(this, fields);
        }

        async getBy() {
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

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
        verify: vi.fn(),
    },
}));

const bcrypt = (await import('bcrypt')).default;
const jwt = (await import('jsonwebtoken')).default;
const auth = (await import('../../../middleware/auth.js')).auth;

describe('auth middleware', () => {
    beforeEach(() => {
        mockUserRecord = {
            id: 1,
            name: 'Test User',
            email: 'user@example.com',
            password: 'hash',
        };
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('signed-token');
        jwt.verify.mockReturnValue({ user: 'user@example.com' });
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

    test('rejects invalid bearer tokens', async () => {
        jwt.verify.mockImplementation(() => {
            throw new Error('invalid');
        });
        const req = {
            body: {},
            headers: {
                authorization: 'Bearer bad-token',
            },
        };
        const next = vi.fn();

        await auth({ 'user:exists': true })(req, {}, next);

        expect(next.mock.calls[0][0].message).toBe('Invalid token.');
    });

    test('allows optional auth without a token', async () => {
        const req = {
            body: {},
            headers: {},
        };
        const next = vi.fn();

        await auth({ 'user:optional': true })(req, {}, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalledWith();
    });
});
