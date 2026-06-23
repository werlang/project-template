import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMiddleware, flattenTranslations, safeJsonStringify } from '../middleware/render.js';

const attachMiddleware = ({ fixedVars = {}, options = {}, req = {} } = {}) => {
    const middleware = renderMiddleware(fixedVars, options);
    const res = {
        body: '',
        statusCode: 200,
        send(payload) {
            this.body = payload;
            return this;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
    };

    let nextError;
    middleware(req, res, error => {
        nextError = error;
    });

    return { res, nextError };
};

test('render middleware injects runtime vars into rendered views by default', async () => {
    const { res, nextError } = attachMiddleware({
        fixedVars: {
            appName: 'Template App',
            apiurl: 'http://api:3000',
        },
    });

    assert.equal(nextError, undefined);
    assert.equal(res.render, undefined);
    assert.equal(typeof res.templateRender, 'function');
    assert.equal(typeof res.clearRenderCache, 'function');

    await res.templateRender('index', {
        pageTitle: 'Home',
        heading: 'Template App',
        optionalValue: undefined,
    });

    assert.match(res.body, /<title>Home<\/title>/);
    assert.match(res.body, /<script id="template-vars" type="application\/json">/);
    assert.match(res.body, /"appName":"Template App"/);
    assert.doesNotMatch(res.body, /optionalValue/);
});

test('render middleware can skip sending runtime vars to the browser', async () => {
    const { res, nextError } = attachMiddleware({
        fixedVars: {
            appName: 'Template App',
        },
        options: {
            sendToClient: false,
        },
    });

    assert.equal(nextError, undefined);

    await res.templateRender('index', {
        pageTitle: 'Home',
        heading: 'Template App',
    });

    assert.match(res.body, /<title>Home<\/title>/);
    assert.doesNotMatch(res.body, /id="template-vars"/);
});

test('flattenTranslations recursively flattens translations', () => {
    const input = {
        common: {
            welcome: 'Welcome',
            home: {
                title: 'Home Page',
                subtitle: {
                    text: 'Sub title'
                }
            }
        },
        other: 'scalar value'
    };

    const expected = {
        'common:welcome': 'Welcome',
        'common:home.title': 'Home Page',
        'common:home.subtitle.text': 'Sub title',
        'other': 'scalar value'
    };

    assert.deepEqual(flattenTranslations(input), expected);
});

test('safeJsonStringify escapes HTML-sensitive characters', () => {
    const input = {
        html: '</script><script>alert("xss & co")</script>',
        lineSep: '\u2028',
        paraSep: '\u2029'
    };

    const result = safeJsonStringify(input);

    assert.ok(!result.includes('</script>'));
    assert.ok(!result.includes('<script>'));
    assert.ok(!result.includes('&'));
    assert.ok(!result.includes('\u2028'));
    assert.ok(!result.includes('\u2029'));

    assert.ok(result.includes('\\u003c/script\\u003e'));
    assert.ok(result.includes('\\u003cscript\\u003e'));
    assert.ok(result.includes('\\u0026'));
    assert.ok(result.includes('\\u2028'));
    assert.ok(result.includes('\\u2029'));

    assert.deepEqual(JSON.parse(result), input);
});
