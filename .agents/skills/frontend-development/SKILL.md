---
name: frontend-development
description: Build or change the Express/Mustache/Webpack frontend in web/ with page scripts, DOM components, helpers, and API-backed frontend models.
---

# Frontend Development

Use this skill for changes under `web/`.

## Structure

- `web/app.js`: Express server, template routes, static assets, render middleware.
- `web/middleware/render.js`: server-to-browser runtime values through `template-vars`.
- `web/src/js/*.js`: page entry files that orchestrate the page.
- `web/src/js/components/`: the only browser classes that query, render, or mutate DOM.
- `web/src/js/model/`: the only browser classes that call API endpoints.
- `web/src/js/helpers/`: `Api`, `Request`, `TemplateVar`, `LocalData`, and frontend-only support utilities.
- `web/src/css/tokens.css`: shared color, spacing, radius, and font tokens.
- `web/src/css/base.css`: shared font imports, reset rules, and global element styles.

## Rules

- Treat pages as server-rendered first and browser-enhanced second.
- Page entry files wire components, models, and helpers together; they should not become API clients or DOM component libraries.
- Use `TemplateVar` for server-provided runtime config.
- Use frontend models for API calls.
- Keep Webpack entries aligned with page entry files.
- Load fonts through CSS `@import` in `web/src/css/base.css` and keep page CSS files slim composition layers.

## Validation

Run the web build after JS/CSS changes and use Playwright or manual browser checks for interaction-heavy changes.
