/**
 * @class Cookies
 * @description Helper class for parsing, getting, setting, clearing, and formatting HTTP cookies on API requests and responses.
 */
export class Cookies {
    /** Default session cookie name used across authentication endpoints. */
    static DEFAULT_SESSION_NAME = 'app_session';

    /** Default session cookie max age (7 days in milliseconds). */
    static DEFAULT_MAX_AGE = 7 * 86400 * 1000;

    /**
     * Parses cookies from an Express request object or raw cookie header string.
     * Populates `req.cookies` if an Express request object is provided.
     *
     * @param {Object|string|null|undefined} reqOrHeader - Express request object or raw cookie header string.
     * @returns {Record<string, string>} Key-value map of cookie names and decoded values.
     */
    static parse(reqOrHeader) {
        if (!reqOrHeader) return {};

        if (typeof reqOrHeader === 'object') {
            if (reqOrHeader.cookies && typeof reqOrHeader.cookies === 'object') {
                return reqOrHeader.cookies;
            }
            const header = reqOrHeader.headers?.cookie;
            if (!header) {
                reqOrHeader.cookies = {};
                return {};
            }
            const parsed = Cookies.parseString(header);
            reqOrHeader.cookies = parsed;
            return parsed;
        }

        if (typeof reqOrHeader === 'string') {
            return Cookies.parseString(reqOrHeader);
        }

        return {};
    }

    /**
     * Parses a raw `Cookie` header string into a key-value map.
     *
     * @param {string} header - Cookie header string.
     * @returns {Record<string, string>} Key-value map of cookie names and values.
     */
    static parseString(header) {
        if (!header || typeof header !== 'string') return {};
        const cookies = {};
        const pairs = header.split(';');
        for (const pair of pairs) {
            const idx = pair.indexOf('=');
            if (idx === -1) {
                const key = pair.trim();
                if (key) cookies[key] = '';
            } else {
                const key = pair.slice(0, idx).trim();
                if (key) {
                    const rawVal = pair.slice(idx + 1).trim();
                    try {
                        cookies[key] = decodeURIComponent(rawVal);
                    } catch {
                        cookies[key] = rawVal;
                    }
                }
            }
        }
        return cookies;
    }

    /**
     * Retrieves a cookie value by name from an Express request object or cookie header string.
     *
     * @param {Object|string} reqOrHeader - Express request object or raw cookie header string.
     * @param {string} name - Cookie name to look up.
     * @returns {string|null} Cookie value or null if not present.
     */
    static get(reqOrHeader, name) {
        if (!name || typeof name !== 'string') return null;
        const cookies = Cookies.parse(reqOrHeader);
        return cookies[name] ?? null;
    }

    /**
     * Sets a cookie on an Express response object with secure default options.
     *
     * @param {Object} res - Express response object.
     * @param {string} name - Cookie name.
     * @param {string} value - Cookie value.
     * @param {Object} [options={}] - Custom options for the cookie (maxAge, httpOnly, secure, sameSite, path, domain).
     */
    static set(res, name, value, options = {}) {
        if (!res || typeof res.cookie !== 'function') {
            throw new Error('Response object with res.cookie method is required');
        }
        const defaultOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        };
        res.cookie(name, value, { ...defaultOptions, ...options });
    }

    /**
     * Clears a cookie on an Express response object.
     *
     * @param {Object} res - Express response object.
     * @param {string} name - Cookie name to clear.
     * @param {Object} [options={}] - Options for clearing the cookie (path, domain).
     */
    static clear(res, name, options = {}) {
        if (!res || typeof res.clearCookie !== 'function') {
            throw new Error('Response object with res.clearCookie method is required');
        }
        const defaultOptions = {
            path: '/',
        };
        res.clearCookie(name, { ...defaultOptions, ...options });
    }

    /**
     * Formats a cookie map object or array of cookie objects into an HTTP Cookie header string.
     *
     * @param {Record<string, string>|Array<{name: string, value: string}>|string} cookies - Cookies object, array, or string.
     * @returns {string} Formatted Cookie header string.
     */
    static stringify(cookies) {
        if (!cookies) return '';
        if (Array.isArray(cookies)) {
            return cookies
                .filter(c => c && typeof c.name === 'string' && typeof c.value !== 'undefined')
                .map(c => `${c.name}=${c.value}`)
                .join('; ');
        }
        if (typeof cookies === 'object') {
            return Object.entries(cookies)
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');
        }
        if (typeof cookies === 'string') {
            return cookies.trim();
        }
        return '';
    }
}

/** Alias for Cookies class */
export const CookiesHelper = Cookies;
