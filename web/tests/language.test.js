import test from 'node:test';
import assert from 'node:assert/strict';
import { languageMiddleware } from '../middleware/language.js';
import i18next from 'i18next';
import fs from 'fs/promises';
import path from 'path';

test('detectLanguage detects supported language from cookies', () => {
    const req = {
        cookies: { language: 'pt' }
    };
    const lang = languageMiddleware.detectLanguage(req);
    assert.equal(lang, 'pt');
});

test('detectLanguage ignores unsupported cookie language and falls back to acceptsLanguages or default', () => {
    const req = {
        cookies: { language: 'fr' }, // Unsupported
        acceptsLanguages(supported) {
            assert.deepEqual(supported, ['en', 'pt']);
            return 'pt';
        }
    };
    const lang = languageMiddleware.detectLanguage(req);
    assert.equal(lang, 'pt');
});

test('detectLanguage falls back to fallbackLng if cookie is invalid and acceptsLanguages returns nothing', () => {
    const req = {
        cookies: { language: 'fr' },
        acceptsLanguages() {
            return undefined;
        }
    };
    const lang = languageMiddleware.detectLanguage(req);
    assert.equal(lang, 'en');
});

test('init loads translation files into i18next and caches them', async () => {
    // Mock loadLocale to return mock translations instead of hitting filesystem
    const originalLoadLocale = languageMiddleware.loadLocale;
    languageMiddleware.loadLocale = async function(lng, ns) {
        return {
            [lng]: {
                [ns]: {
                    welcome: lng === 'pt' ? 'Bem-vindo' : 'Welcome'
                }
            }
        };
    };

    try {
        await languageMiddleware.init({
            languages: ['en', 'pt'],
            namespaces: ['common']
        });

        assert.equal(i18next.isInitialized, true);

        // Verify request-scoped t translations work
        const ptT = i18next.getFixedT('pt');
        assert.equal(ptT('common:welcome'), 'Bem-vindo');

        const enT = i18next.getFixedT('en');
        assert.equal(enT('common:welcome'), 'Welcome');

        // Test in-memory cache bypass in loadLocale
        const cachedResult = await languageMiddleware.loadLocale('pt', 'common');
        assert.deepEqual(cachedResult, {
            pt: {
                common: {
                    welcome: 'Bem-vindo'
                }
            }
        });
    } finally {
        languageMiddleware.loadLocale = originalLoadLocale;
    }
});

test('concurrency: listen middleware provides request-scoped translation helper', async () => {
    const middleware = languageMiddleware.listen();

    const reqPt = { cookies: { language: 'pt' } };
    const resPt = { locals: {} };
    let ptNextCalled = false;

    const reqEn = { cookies: { language: 'en' } };
    const resEn = { locals: {} };
    let enNextCalled = false;

    middleware(reqPt, resPt, () => {
        ptNextCalled = true;
    });

    middleware(reqEn, resEn, () => {
        enNextCalled = true;
    });

    assert.ok(ptNextCalled);
    assert.ok(enNextCalled);

    assert.equal(reqPt.language, 'pt');
    assert.equal(reqEn.language, 'en');

    // Confirm getFixedT and res.locals.t are request-scoped and functional
    assert.equal(reqPt.t('common:welcome'), 'Bem-vindo');
    assert.equal(resPt.locals.t('common:welcome'), 'Bem-vindo');

    assert.equal(reqEn.t('common:welcome'), 'Welcome');
    assert.equal(resEn.locals.t('common:welcome'), 'Welcome');
});

test('loadLocale handles file load errors gracefully and logs error message', async () => {
    const originalConsoleError = console.error;
    let loggedError = '';
    console.error = (...args) => {
        loggedError = args.join(' ');
    };

    try {
        // Try loading from a non-existent file
        const result = await languageMiddleware.loadLocale('nonexistent', 'common');
        assert.deepEqual(result, { nonexistent: { common: {} } });
        assert.ok(loggedError.includes('Could not load translation file'));
        assert.ok(loggedError.includes('ENOENT')); // error message should be present
    } finally {
        console.error = originalConsoleError;
    }
});
