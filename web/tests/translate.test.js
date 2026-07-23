import test from 'node:test';
import assert from 'node:assert/strict';
import { Translator } from '../src/js/helpers/translate.js';
import { CustomError } from '../src/js/helpers/error.js';
import { TemplateVar } from '../src/js/helpers/template-var.js';

test('Translator translates key using TemplateVar injected translations', () => {
    TemplateVar.set('translations', {
        'api-responses': {
            NAME_REQUIRED: 'Name is required.',
            INVALID_CREDENTIALS: 'Invalid credentials.',
        },
    });

    const translator = new Translator();
    assert.equal(translator.translate('NAME_REQUIRED', 'api-responses'), 'Name is required.');
    assert.equal(translator.translate('INVALID_CREDENTIALS', 'api-responses'), 'Invalid credentials.');
});

test('Translator.translateApiError translates error code from API payload or CustomError', () => {
    TemplateVar.set('translations', {
        'api-responses': {
            NAME_REQUIRED: 'Name is required.',
            CREDENTIALS_REQUIRED: 'Email and password are required.',
        },
    });

    const translator = new Translator();

    // 1. Error object with code
    const errObj = { code: 'NAME_REQUIRED', message: 'Name is required.' };
    assert.equal(translator.translateApiError(errObj), 'Name is required.');

    // 2. CustomError instance with code
    const customErr = new CustomError(400, 'Email and password are required.', null, 'CREDENTIALS_REQUIRED');
    assert.equal(translator.translateApiError(customErr), 'Email and password are required.');

    // 3. Fallback to message when code translation is missing
    const unknownErr = new CustomError(400, 'Backend fallback msg', null, 'UNKNOWN_CODE');
    assert.equal(translator.translateApiError(unknownErr), 'Backend fallback msg');
});

test('Translator handles null or empty error payload gracefully', () => {
    const translator = new Translator();
    assert.equal(translator.translateApiError(null), '');
    assert.equal(translator.translateApiError(undefined), '');
});
