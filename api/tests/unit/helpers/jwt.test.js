import { describe, expect, test } from 'vitest';
import { signJwt, verifyJwt } from '../../../helpers/jwt.js';

describe('JWT helper', () => {
    const testPayload = { email: 'user@example.com', id: 101, name: 'Test User' };
    const customSecret = 'custom-secret-key-123456789';

    test('signs and verifies payload successfully with default secret', async () => {
        const token = await signJwt(testPayload);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);

        const decoded = await verifyJwt(token);
        expect(decoded).not.toBeNull();
        expect(decoded.email).toBe(testPayload.email);
        expect(decoded.id).toBe(testPayload.id);
        expect(decoded.name).toBe(testPayload.name);
    });

    test('signs and verifies payload with custom secret', async () => {
        const token = await signJwt(testPayload, customSecret);
        const decoded = await verifyJwt(token, customSecret);

        expect(decoded).not.toBeNull();
        expect(decoded.email).toBe(testPayload.email);

        // Verification fails with wrong secret
        const invalidDecoded = await verifyJwt(token, 'wrong-secret');
        expect(invalidDecoded).toBeNull();
    });

    test('returns null when verifying invalid or null tokens', async () => {
        expect(await verifyJwt(null)).toBeNull();
        expect(await verifyJwt('')).toBeNull();
        expect(await verifyJwt('invalid.jwt.token')).toBeNull();
    });
});
