import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GoogleAuthHelper } from '../../../helpers/google-auth.js';

describe('GoogleAuthHelper', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        delete process.env.GOOGLE_CLIENT_ID;
    });

    test('throws error when token is missing', async () => {
        await expect(GoogleAuthHelper.verifyToken('')).rejects.toThrow('Missing or invalid ID Token');
        await expect(GoogleAuthHelper.verifyToken(null)).rejects.toThrow('Missing or invalid ID Token');
    });

    test('throws error when Google API verification fails', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            text: async () => 'Invalid Token Signature',
        });

        await expect(GoogleAuthHelper.verifyToken('bad-id-token'))
            .rejects.toThrow('Google ID Token verification failed: Invalid Token Signature');
    });

    test('verifies valid Google ID token payload', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                email: 'user@example.com',
                email_verified: 'true',
                name: 'Google User',
                picture: 'https://example.com/avatar.jpg',
                sub: 'google-sub-123',
                aud: 'test-client-id',
            }),
        });

        process.env.GOOGLE_CLIENT_ID = 'test-client-id';

        const result = await GoogleAuthHelper.verifyToken('valid-token');
        expect(result).toEqual({
            email: 'user@example.com',
            name: 'Google User',
            picture: 'https://example.com/avatar.jpg',
            sub: 'google-sub-123',
        });
    });

    test('throws error on audience mismatch', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                email: 'user@example.com',
                email_verified: true,
                aud: 'other-client-id',
            }),
        });

        process.env.GOOGLE_CLIENT_ID = 'expected-client-id';

        await expect(GoogleAuthHelper.verifyToken('valid-token'))
            .rejects.toThrow('Google ID Token audience mismatch');
    });
});
