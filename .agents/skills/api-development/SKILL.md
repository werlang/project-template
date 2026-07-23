---
name: api-development
description: Build or change API behavior in api/ using Express routers, middleware, CustomError, model instances, and camelCase JSON responses.
---

# API Development

Use this skill for changes under `api/`.

## Rules

- Compose the service in `api/app.js`.
- Put endpoint modules in `api/route/` and export an Express router.
- Routes parse input, validate request data, instantiate models, call model methods, and shape HTTP responses.
- Routes must not call `api/helpers/postgres.js` directly.
- Throw `CustomError(status, message, code, data)` for expected request or domain failures, providing a machine-readable error code string (e.g. `NAME_REQUIRED`, `INVALID_CREDENTIALS`).
- API JSON error responses returned by `api/middleware/error.js` include `{ error: true, status, type, code, message, data }`.
- Return camelCase JSON even when database columns are snake_case. Public response payloads (`toJSON()`) use the entity's 14-character `public_id` for `id` and `publicId`.
- Parametric resource routes (e.g. `GET /items/:id`) resolve records using `getBy('public_id')` (or `new Model({ public_id: req.params.id }).getBy('public_id')`).
- Keep only `GET`, `POST`, `PUT`, and `DELETE` for ordinary REST resources.
- Use `Cookies.set(res, SESSION_COOKIE_NAME, token)` for setting HttpOnly session cookies on authentication endpoints.
- Route authentication checks through `auth()` middleware (`api/middleware/auth.js`), which handles HttpOnly session cookies and Bearer tokens.
- For Google OAuth authentication, use `GoogleAuthHelper.verifyToken(idToken)` (`api/helpers/google-auth.js`) and issue signed session JWTs with `signJwt` (`api/helpers/jwt.js`).

## Validation

Use unit tests for isolated route validation and integration tests for database-backed behavior.
