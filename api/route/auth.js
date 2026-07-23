import { Router } from 'express';
import { Cookies } from '../helpers/cookies.js';
import { GoogleAuthHelper } from '../helpers/google-auth.js';
import { signJwt } from '../helpers/jwt.js';
import { auth, SESSION_COOKIE_NAME } from '../middleware/auth.js';
import { CustomError } from '../helpers/error.js';
import { User } from '../model/user.js';

export const router = Router();
const SESSION_COOKIE_MAX_AGE = process.env.SESSION_COOKIE_MAX_AGE ? Number(process.env.SESSION_COOKIE_MAX_AGE) : Cookies.DEFAULT_MAX_AGE;

/**
 * Creates a signed JWT session token for an authenticated user.
 *
 * @param {User} user - Authenticated user entity.
 * @returns {Promise<string>} Signed JWT token string.
 */
async function createSessionToken(user) {
    return await signJwt({
        id: user.id,
        email: user.email,
        name: user.name,
    });
}

/**
 * @route POST /auth/google
 * @description Authenticates a user via Google ID Token and creates a session.
 * @body {Object} { idToken?: string, credential?: string }
 * @returns {Object} JSON response containing status, session token, and user profile.
 */
router.post('/google', async (req, res, next) => {
    try {
        const { idToken, credential } = req.body || {};
        const tokenToVerify = idToken || credential;

        if (!tokenToVerify) {
            throw new CustomError(400, 'Google ID token not provided.');
        }

        const googlePayload = await GoogleAuthHelper.verifyToken(tokenToVerify);

        let user = await new User({ email: googlePayload.email }).getBy('email');
        if (!user) {
            user = await new User({
                name: googlePayload.name || googlePayload.email.split('@')[0],
                email: googlePayload.email,
                password: '',
            }).insert();
        } else if (googlePayload.name && user.name !== googlePayload.name) {
            await user.update({ name: googlePayload.name });
        }

        const sessionToken = await createSessionToken(user);

        Cookies.set(res, SESSION_COOKIE_NAME, sessionToken, {
            maxAge: SESSION_COOKIE_MAX_AGE,
        });

        return res.json({
            success: true,
            message: 'Authentication successful.',
            token: sessionToken,
            user: user.toJSON(),
        });
    } catch (error) {
        if (error.message && error.message.includes('Google ID Token')) {
            return next(new CustomError(401, error.message));
        }
        next(error);
    }
});

/**
 * @route POST /auth/login
 * @description Authenticates a user via email and password.
 * @body {Object} { email: string, password: string }
 * @returns {Object} JSON response containing status, session token, and user profile.
 */
router.post('/login', auth({ 'user:password': true }), async (req, res, next) => {
    try {
        const sessionToken = await createSessionToken(req.user);

        Cookies.set(res, SESSION_COOKIE_NAME, sessionToken, {
            maxAge: SESSION_COOKIE_MAX_AGE,
        });

        return res.json({
            success: true,
            message: 'Login successful.',
            token: sessionToken,
            user: req.user.toJSON(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /auth/me
 * @description Retrieves the currently authenticated user's profile.
 * @returns {Object} JSON response containing current user.
 */
router.get('/me', auth({ 'user:exists': true }), (req, res) => {
    return res.json({
        success: true,
        user: req.user.toJSON(),
    });
});

/**
 * @route POST /auth/logout
 * @description Logs out the user by clearing the session HttpOnly cookie.
 * @returns {Object} JSON response confirming logout.
 */
router.post('/logout', (req, res) => {
    Cookies.clear(res, SESSION_COOKIE_NAME);
    return res.json({
        success: true,
        message: 'Logout successful.',
    });
});

export const authRouter = router;
