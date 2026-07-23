import { Router } from 'express';
import { Cookies } from '../helpers/cookies.js';
import { GoogleAuthHelper } from '../helpers/google-auth.js';
import { signJwt } from '../helpers/jwt.js';
import { auth, SESSION_COOKIE_NAME } from '../middleware/auth.js';
import { CustomError } from '../helpers/error.js';
import { User } from '../model/user.js';

const router = Router();
const SESSION_COOKIE_MAX_AGE = process.env.SESSION_COOKIE_MAX_AGE ? Number(process.env.SESSION_COOKIE_MAX_AGE) : Cookies.DEFAULT_MAX_AGE;

/**
 * Standard password login handler setting HttpOnly session cookie.
 */
router.post('/', auth({ 'user:password': true }), async (req, res, next) => {
    try {
        const sessionToken = await signJwt({
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
        });

        Cookies.set(res, SESSION_COOKIE_NAME, sessionToken, {
            maxAge: SESSION_COOKIE_MAX_AGE,
        });

        res.send({
            success: true,
            message: 'Login successful.',
            user: req.user.toJSON(),
            token: sessionToken,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Google ID token authentication handler setting HttpOnly session cookie.
 */
router.post('/google', async (req, res, next) => {
    try {
        const { idToken, credential } = req.body || {};
        const tokenToVerify = idToken || credential;

        if (!tokenToVerify) {
            throw new CustomError(400, 'Google ID token not provided.', 'GOOGLE_TOKEN_REQUIRED');
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

        const sessionToken = await signJwt({
            id: user.id,
            email: user.email,
            name: user.name,
        });

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
            return next(new CustomError(401, error.message, 'INVALID_GOOGLE_TOKEN'));
        }
        next(error);
    }
});

export const loginRouter = router;
