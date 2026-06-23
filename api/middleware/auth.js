import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CustomError } from '../helpers/error.js';
import { User } from '../model/user.js';

const jwtSecret = () => process.env.JWT_SECRET || 'development-secret';

/**
 * Creates a signed JWT for the user.
 *
 * @param {User} user
 * @returns {string}
 */
function createJWT(user) {
    return jwt.sign({ user: user.email }, jwtSecret(), { expiresIn: '6h' });
}

/**
 * Authenticates a user from email/password request body values.
 *
 * @param {import('express').Request} req
 * @returns {Promise<User>}
 */
async function authUser(req) {
    if (!req.body.email || !req.body.password) {
        throw new CustomError(400, 'Email and password are required.');
    }

    const user = await new User({ email: req.body.email }).getBy('email');
    const isValidPassword = await bcrypt.compare(req.body.password, user.password);
    if (!isValidPassword) {
        throw new CustomError(401, 'Invalid password.');
    }

    user.token = createJWT(user);
    req.user = user;
    return user;
}

/**
 * Authenticates a user from a bearer token.
 *
 * @param {import('express').Request} req
 * @returns {Promise<User>}
 */
async function checkUserJWT(req) {
    if (!req.headers.authorization) {
        throw new CustomError(400, 'Token not provided.');
    }

    const [, token] = req.headers.authorization.split(' ');
    if (!token) {
        throw new CustomError(400, 'Token not provided.');
    }

    let email;
    try {
        ({ user: email } = jwt.verify(token, jwtSecret()));
    }
    catch (error) {
        throw new CustomError(401, 'Invalid token.', error.message);
    }

    const user = await new User({ email }).getBy('email');
    req.user = user;
    return user;
}

/**
 * Express auth middleware factory.
 *
 * Supported modes:
 * - `user:password`: validates body email/password and sets `req.user`.
 * - `user:exists`: validates bearer token and sets `req.user`.
 * - `user:optional`: attempts bearer token validation without failing the request.
 *
 * @param {Record<string, boolean|string>} modes
 * @returns {import('express').RequestHandler}
 */
export function auth(modes = {}) {
    return async (req, res, next) => {
        const modeHandlers = {
            'user:password': authUser,
            'user:exists': checkUserJWT,
            'user:optional': async request => {
                try {
                    await checkUserJWT(request);
                }
                catch {
                    request.user = null;
                }
            },
        };

        const errors = [];
        let anyPassed = false;

        for (const mode of Object.keys(modes)) {
            if (!modeHandlers[mode]) continue;

            try {
                await modeHandlers[mode](req);
                anyPassed = true;
            }
            catch (error) {
                errors.push(error);
            }
        }

        if (!Object.keys(modes).length || anyPassed) {
            next();
            return;
        }

        next(errors[0] || new CustomError(401, 'Unauthorized.'));
    };
}
