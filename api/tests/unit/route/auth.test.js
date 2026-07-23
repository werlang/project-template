import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

let mockUserInstance;

vi.mock('../../../model/user.js', () => ({
    User: class User {
        constructor(fields = {}) {
            Object.assign(this, fields);
            this.id = fields.id || 1;
            this.email = fields.email || 'user@example.com';
            this.name = fields.name || 'Test User';
        }

        async getBy() {
            if (!mockUserInstance) return null;
            Object.assign(this, mockUserInstance);
            return this;
        }

        async insert() {
            mockUserInstance = this;
            return this;
        }

        async update(fields) {
            Object.assign(this, fields);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                name: this.name,
                email: this.email,
            };
        }
    },
}));

vi.mock('../../../helpers/google-auth.js', () => ({
    GoogleAuthHelper: {
        verifyToken: vi.fn(),
    },
}));

vi.mock('../../../helpers/jwt.js', () => ({
    signJwt: vi.fn().mockResolvedValue('mock-session-jwt'),
    verifyJwt: vi.fn().mockResolvedValue({ email: 'user@example.com' }),
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn().mockResolvedValue(true),
    },
}));

const { GoogleAuthHelper } = await import('../../../helpers/google-auth.js');
const { authRouter } = await import('../../../route/auth.js');
const { errorMiddleware } = await import('../../../middleware/error.js');

describe('auth router endpoints', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authRouter);
        app.use(errorMiddleware);

        mockUserInstance = {
            id: 1,
            name: 'Test User',
            email: 'user@example.com',
            password: '$2b$10$hashed',
        };

        vi.clearAllMocks();
    });

    test('POST /auth/google authenticates valid Google ID token and sets HttpOnly cookie', async () => {
        GoogleAuthHelper.verifyToken.mockResolvedValue({
            email: 'user@example.com',
            name: 'Google User',
            picture: 'https://example.com/pic.jpg',
            sub: 'sub-123',
        });

        const res = await request(app)
            .post('/auth/google')
            .send({ idToken: 'valid-google-token' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBe('mock-session-jwt');
        expect(res.headers['set-cookie'][0]).toContain('app_session=mock-session-jwt');
    });

    test('POST /auth/google returns 400 when ID token is missing', async () => {
        const res = await request(app)
            .post('/auth/google')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Google ID token not provided');
    });

    test('POST /auth/login authenticates password and sets HttpOnly cookie', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@example.com', password: 'secretpassword' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBe('mock-session-jwt');
        expect(res.headers['set-cookie'][0]).toContain('app_session=mock-session-jwt');
    });

    test('GET /auth/me returns current user profile when authenticated', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Cookie', 'app_session=mock-session-jwt');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('user@example.com');
    });

    test('POST /auth/logout clears session cookie', async () => {
        const res = await request(app)
            .post('/auth/logout');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.headers['set-cookie'][0]).toContain('app_session=;');
    });
});
