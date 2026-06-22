import test from 'node:test';
import assert from 'node:assert/strict';
import renderMiddleware from '../middleware/render.js';

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
    assert.equal(res.render, res.templateRender);
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
