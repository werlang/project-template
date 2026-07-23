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
- Routes must not call `api/helpers/mysql.js` directly.
- Throw `CustomError(statusCode, message, data)` for expected request or domain failures.
- Return camelCase JSON even when database columns are snake_case.
- Keep only `GET`, `POST`, `PUT`, and `DELETE` for ordinary REST resources.
- Use `Cookies.set(res, SESSION_COOKIE_NAME, token)` for setting HttpOnly session cookies on authentication endpoints.
- Route authentication checks through `auth()` middleware (`api/middleware/auth.js`), which handles HttpOnly session cookies and Bearer tokens.
- For Google OAuth authentication, use `GoogleAuthHelper.verifyToken(idToken)` (`api/helpers/google-auth.js`) and issue signed session JWTs with `signJwt` (`api/helpers/jwt.js`).

## Validation

Use unit tests for isolated route validation and integration tests for database-backed behavior.
