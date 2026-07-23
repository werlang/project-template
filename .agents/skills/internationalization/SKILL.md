---
name: internationalization
description: Manage translations and locale loading for the Web service using i18next-based middleware, server-injected template variables, and the client-side Translator helper.
---

# Internationalization

Use this skill for internationalization, locale management, and translating error codes and template strings.

## Structure

Locale files are stored by language and namespace:

```text
web/locales/
  en/
    api-responses.json
  pt/
    api-responses.json
```

## Runtime Flow

1. `languageMiddleware` (`web/middleware/language.js`) detects language from `language` cookie, `Accept-Language` header, or default fallback (`en`).
2. `renderMiddleware` (`web/middleware/render.js`) loads requested namespace JSON files and embeds them into `<script id="template-vars">`.
3. Client `Translator` helper (`web/src/js/helpers/translate.js`) reads injected translations via `TemplateVar.get('translations')` and wraps `i18next`.

## Client-Side Translation

Instantiate `Translator` in browser page entries or components:

```javascript
import { Translator } from './helpers/translate.js';

const translator = new Translator();

// Translate a key in a namespace
const title = translator.translate('title', 'index');
```

## API Error Code Localization

All REST API endpoints return a machine-readable `code` string (HTTP status codes >= 400) alongside default `message` strings. Localized translations for API error codes live in `web/locales/<lang>/api-responses.json` under the `api-responses` namespace.

Translate API errors using `translator.translateApiError(errorPayload, 'api-responses')`:

```javascript
try {
    await Item.create(data);
} catch (error) {
    const message = translator.translateApiError(error);
    new Toast(message, { tone: 'error' });
}
```

Resolution order:
1. Translates `code` against `api-responses` namespace via `i18next`.
2. Fallback to translating default `message`.
3. Fallback to default `message` string if no key exists.
