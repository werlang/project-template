import { SignJWT, jwtVerify } from 'jose';

/**
 * Default fallback secret used in development mode if JWT_SECRET environment variable is not defined.
 */
const DEFAULT_DEV_SECRET = 'template-jwt-secret-dev-key';

/**
 * Converts a string secret into a Uint8Array key suitable for jose algorithms.
 *
 * @param {string} secretStr - Secret key string.
 * @returns {Uint8Array} Encoded Uint8Array key.
 */
function getSecretKey(secretStr) {
    return new TextEncoder().encode(secretStr);
}

/**
 * Asynchronously signs a payload using jose SignJWT (HS256).
 *
 * @param {Object} payload - User claims and session data to sign.
 * @param {string} [secret] - Secret key string for signing (defaults to process.env.JWT_SECRET or dev fallback).
 * @param {Object} [options] - Options for token generation.
 * @param {number} [options.expiresInSeconds=604800] - Expiration duration in seconds (default: 7 days).
 * @returns {Promise<string>} Cryptographically signed JWT token string.
 */
export async function signJwt(payload, secret = process.env.JWT_SECRET || DEFAULT_DEV_SECRET, options = {}) {
    const key = getSecretKey(secret);
    const expiresInSeconds = options.expiresInSeconds ?? (7 * 86400);

    const builder = new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt();

    if (payload.exp) {
        builder.setExpirationTime(payload.exp);
    } else {
        builder.setExpirationTime(`${expiresInSeconds}s`);
    }

    return await builder.sign(key);
}

/**
 * Asynchronously verifies a JWT token signature and expiration using jose jwtVerify.
 *
 * @param {string} token - JWT token string to verify.
 * @param {string} [secret] - Secret key string for verification (defaults to process.env.JWT_SECRET or dev fallback).
 * @returns {Promise<Object|null>} Decoded payload object if valid and unexpired; null if signature invalid or expired.
 */
export async function verifyJwt(token, secret = process.env.JWT_SECRET || DEFAULT_DEV_SECRET) {
    if (!token || typeof token !== 'string') {
        return null;
    }

    try {
        const key = getSecretKey(secret);
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch {
        return null;
    }
}
