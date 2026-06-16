# Testing Guide

## API Tests

The API uses Vitest with separate unit and integration configs.

```bash
docker exec template-api-1 sh -c "NODE_ENV=test npm run test:unit"
docker exec template-api-1 sh -c "NODE_ENV=test npm run test:integration"
```

Unit tests mock the MySQL helper or model dependencies. Integration tests run against the composed MySQL service and reset sample data before each test file.

## Web Tests

The web service includes a small Playwright smoke test suite in `web/tests/`. Use the Playwright overlay so browser dependencies stay out of the normal web image.

```bash
docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright
docker exec template-playwright-1 npx playwright test
```

For visual or interaction-heavy changes, use Playwright as a first pass and then manually check the browser when layout, focus, or responsive behavior matters.

## Build Validation

Run a production web bundle before shipping frontend changes:

```bash
docker exec template-web-1 npm run build
```

The build emits assets into `web/public/js/` and `web/public/css/`.

## CSS Loading

The web stylesheet entrypoint is `web/src/css/index.css`. It imports `tokens.css` first, then `base.css`, then component partials. Font loading happens through CSS `@import` statements in `web/src/css/base.css`.
