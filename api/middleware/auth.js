import bcrypt from 'bcrypt';
import { Cookies } from '../helpers/cookies.js';
import { CustomError } from '../helpers/error.js';
import { signJwt, verifyJwt } from '../helpers/jwt.js';
import { User } from '../model/user.js';

export const SESSION_COOKIE_NAME = Cookies.DEFAULT_SESSION_NAME;

/**
 * Authenticates a user from email/password request body values.
 *
 * @param {import('express').Request} req
 * @returns {Promise<User>}
 */
async function authUserPassword(req) {
    if (!req.body.email || !req.body.password) {
        throw new CustomError(400, 'Email and password are required.', 'CREDENTIALS_REQUIRED');
    }

    const user = await new User({ email: req.body.email }).getBy('email');
    if (!user || !user.password) {
        throw new CustomError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(req.body.password, user.password);
    if (!isValidPassword) {
        throw new CustomError(401, 'Invalid password.', 'INVALID_PASSWORD');
    }

    const token = await signJwt({ email: user.email, id: user.id });
    user.token = token;
    req.user = user;
    return user;
}

/**
 * Extracts and verifies JWT session token from HttpOnly cookie or Authorization Bearer header.
 *
 * @param {import('express').Request} req
 * @returns {Promise<User>}
 */
async function checkUserJWT(req) {
    let token = Cookies.get(req, SESSION_COOKIE_NAME);

    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    if (!token) {
        throw new CustomError(401, 'Token not provided.', 'TOKEN_REQUIRED');
    }

    const payload = await verifyJwt(token);
    if (!payload || !payload.email) {
        throw new CustomError(401, 'Invalid token.', 'INVALID_TOKEN');
    }

    const user = await new User({ email: payload.email }).getBy('email');
    if (!user) {
        throw new CustomError(401, 'User not found.', 'USER_NOT_FOUND');
    }

    req.user = user;
    req.sessionPayload = payload;
    return user;
}

/**
 * Express auth middleware factory supporting HttpOnly cookies and Bearer tokens.
 *
 * Supported modes:
 * - `user:password`: validates body email/password and sets `req.user`.
 * - `user:exists`: validates cookie/bearer session token and sets `req.user`.
 * - `user:optional`: attempts session token validation without failing unauthenticated requests.
 *
 * @param {Record<string, boolean|string>} modes
 * @returns {import('express').RequestHandler}
 */
export function auth(modes = {}) {
    return async (req, res, next) => {
        const modeHandlers = {
            'user:password': authUserPassword,
            'user:exists': checkUserJWT,
            'user:optional': async request => {
                try {
                    await checkUserJWT(request);
                } catch {
                    request.user = null;
                }
            },
        };

        const activeModes = Object.keys(modes);
        if (activeModes.length === 0) {
            // Default to requiring valid user session
            activeModes.push('user:exists');
        }

        const errors = [];
        let anyPassed = false;

        for (const mode of activeModes) {
            if (!modeHandlers[mode]) continue;

            try {
                await modeHandlers[mode](req);
                anyPassed = true;
                break;
            } catch (error) {
                errors.push(error);
            }
        }

        if (anyPassed) {
            next();
            return;
        }

        next(errors[0] || new CustomError(401, 'Unauthorized access. Please log in.', 'UNAUTHORIZED'));
    };
}

/** Standalone Express middleware requiring authenticated user session */
export const authMiddleware = auth({ 'user:exists': true });

/** Alias for authMiddleware */
export const requireAuth = authMiddleware;
