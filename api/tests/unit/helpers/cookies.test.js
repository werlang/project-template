import { describe, expect, test, vi } from 'vitest';
import { Cookies } from '../../../helpers/cookies.js';

describe('Cookies helper', () => {
    describe('parseString', () => {
        test('parses cookie header strings into object key-value pairs', () => {
            const header = 'app_session=token123; theme=dark; encoded_key=hello%20world';
            const result = Cookies.parseString(header);
            expect(result).toEqual({
                app_session: 'token123',
                theme: 'dark',
                encoded_key: 'hello world',
            });
        });

        test('returns empty object for invalid or missing header input', () => {
            expect(Cookies.parseString(null)).toEqual({});
            expect(Cookies.parseString('')).toEqual({});
            expect(Cookies.parseString(123)).toEqual({});
        });
    });

    describe('parse', () => {
        test('parses cookies from express request headers', () => {
            const req = { headers: { cookie: 'app_session=abc12345' } };
            const result = Cookies.parse(req);
            expect(result).toEqual({ app_session: 'abc12345' });
            expect(req.cookies).toEqual({ app_session: 'abc12345' });
        });

        test('returns existing req.cookies if already parsed', () => {
            const req = { cookies: { user: 'test' } };
            expect(Cookies.parse(req)).toEqual({ user: 'test' });
        });
    });

    describe('get', () => {
        test('retrieves cookie value by key', () => {
            const req = { headers: { cookie: 'app_session=jwt_token_val' } };
            expect(Cookies.get(req, 'app_session')).toBe('jwt_token_val');
            expect(Cookies.get(req, 'missing')).toBeNull();
        });
    });

    describe('set', () => {
        test('sets cookie on response object with secure defaults', () => {
            const res = { cookie: vi.fn() };
            Cookies.set(res, 'app_session', 'my_token', { maxAge: 3600000 });

            expect(res.cookie).toHaveBeenCalledWith('app_session', 'my_token', expect.objectContaining({
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 3600000,
            }));
        });

        test('throws error if response object is missing cookie method', () => {
            expect(() => Cookies.set({}, 'name', 'val')).toThrow('Response object with res.cookie method is required');
        });
    });

    describe('clear', () => {
        test('clears cookie on response object', () => {
            const res = { clearCookie: vi.fn() };
            Cookies.clear(res, 'app_session');
            expect(res.clearCookie).toHaveBeenCalledWith('app_session', { path: '/' });
        });
    });

    describe('stringify', () => {
        test('formats object or array into cookie header string', () => {
            expect(Cookies.stringify({ a: '1', b: '2' })).toBe('a=1; b=2');
            expect(Cookies.stringify([{ name: 'a', value: '1' }, { name: 'b', value: '2' }])).toBe('a=1; b=2');
        });
    });
});
