# Template Guide

## Architecture

The project is split into `web`, `api`, and `postgres` services.

- `web` renders Mustache templates and serves bundled browser assets.
- `api` exposes REST endpoints and owns all server-side business behavior.
- `postgres` stores application data and is initialized from `database.sql`.

The dependency direction is:

```text
browser page script -> frontend components/helpers/models -> API routes -> API models -> PostgreSQL helper -> PostgreSQL
```

## Web Service

`web/app.js` composes the Express server, templates, static files, and render middleware.

`web/middleware/render.js` adds the async helper `res.templateRender(view, vars, languageNamespaces)`. The middleware reads Mustache templates directly from `web/view/`, merges fixed server vars with per-route vars, optionally injects those values into the `<script id="template-vars" type="application/json">` tag, and exposes `res.clearRenderCache(view?)` for cache-aware development flows. Browser code reads the injected values through `TemplateVar`.

`web/src/js/index.js` is the sample page entry. Page entry files should orchestrate work only:

- read server-provided values with helpers,
- instantiate frontend model classes,
- instantiate DOM component classes,
- wire high-level user flows.

`web/src/js/components/` contains DOM-owning classes. Components are the only browser classes that should query, mutate, or render DOM elements directly. Reuse the shared `Form`, `Input`, `Select`, and `Toast` components for guarded submits, field validation, autosave, and transient UI messages instead of rebuilding those flows in page entries.

`web/src/js/model/` contains frontend entity classes. Frontend models are the only browser classes that should call API endpoints.

`web/src/js/helpers/` contains browser support code such as `Api`, `Request`, `LocalData`, and `TemplateVar`. Keep timeout handling, content-type parsing, and API error mapping in `Request`/`Api` so frontend models can stay focused on endpoint contracts.

`web/src/css/tokens.css` owns global tokens, spacing, radii, shadows, and color variables. `web/src/css/base.css` owns the shared font imports, reset rules, and default element styles. Page CSS files import `tokens.css` and `base.css` first, then the component partials they need.

Browser smoke tests run through `compose.playwright.yaml` on top of `compose.dev.yaml`. The Playwright overlay uses a Playwright image, reaches the web service at `http://web:3000` inside the Docker network, and overrides the web runtime `API_URL` to `http://api:3000` for container-to-container browser requests.

## API Service

`api/app.js` composes the Express app. Route modules live in `api/route/` and export an Express router.

Routes should:

- read params, query, and body values,
- validate request-level input,
- instantiate model classes,
- call model methods,
- return camelCase JSON responses,
- pass errors to shared middleware (`api/middleware/error.js`), which formats responses with `{ error: true, status, type, code, message, data }`.

`api/helpers/error.js` defines `CustomError(status, message, code, data)`, allowing endpoints and models to specify machine-readable error codes (e.g., `NAME_REQUIRED`, `INVALID_CREDENTIALS`).

`web/src/js/helpers/translate.js` provides the client-side `Translator` class wrapping `i18next` and `TemplateVar`, allowing browser components to translate template strings with `translator.translate(key, ns)` and API error codes with `translator.translateApiError(errorPayload, 'api-responses')`.

`api/model/` contains entity classes. These classes own persistence, table field maps, allowed update fields, and entity-specific business behavior. All entities implement the Dual-ID strategy: internal primary keys and foreign key relationships use 8-byte `BIGINT GENERATED ALWAYS AS IDENTITY`, while external API routes and public JSON response shapes (`toJSON()`) use 14-character Base62 `public_id VARCHAR(14) NOT NULL UNIQUE` generated via `nanoid` inside base `Model.insert()`.

`api/helpers/postgres.js` is the driver helper that builds SQL for PostgreSQL. Models call CRUD-shaped helper methods such as `find`, `findOne`, `get`, `insert`, `upsert`, `update`, and `delete`, and use helper utilities such as transactions, raw fragments, date formatting, and table resets.

`api/helpers/cookies.js` provides the `Cookies` helper class for parsing incoming cookies from requests/headers and setting/clearing HttpOnly, secure, SameSite session cookies on response objects.

`api/helpers/jwt.js` provides `signJwt` and `verifyJwt` token methods powered by `jose` with standard algorithm (`HS256`), default expiration times, and fallback secret keys.

`api/helpers/google-auth.js` provides `GoogleAuthHelper.verifyToken(idToken)` to verify Google OAuth ID tokens via Google's tokeninfo API, validating email verification state and Client ID audience.

`api/middleware/auth.js` provides Express `auth` middleware supporting HttpOnly session cookies (primary) and Bearer authorization tokens (fallback). It supports required (`user:exists`), optional (`user:optional`), and password verification (`user:password`) modes.

`api/route/auth.js` and `api/route/login.js` expose authentication endpoints:
- `POST /auth/google`: authenticates Google OAuth ID token, registers or updates user profile, sets HttpOnly session cookie, and returns signed JWT + user info.
- `POST /auth/login` (and `POST /login`): authenticates password, sets HttpOnly session cookie, and returns signed JWT + user info.
- `GET /auth/me`: retrieves currently authenticated user profile from valid session.
- `POST /auth/logout`: logs out user by clearing the HttpOnly session cookie.

`api/scripts/migrate.js` runs versioned database migrations from `api/migrations/`. Migrations use PostgreSQL advisory locks (`SELECT pg_advisory_lock(...)`) and track applied versions in the `schema_migrations` table.

## Customizing For A New Project

1. Rename package names in `web/package.json` and `api/package.json`.
2. Replace the sample `items` entity with project entities.
3. Update `database.sql` with real schema tables.
4. Keep the route/model/helper boundaries intact.
5. Update `.agents/skills/` and `AGENTS.md` when project-specific workflows differ from the template.
