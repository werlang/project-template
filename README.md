# Generic Web/API Template

This repository is a generic starter based on the `aj-private` project architecture. It keeps the same two main service boundaries:

- `web/`: Express server-rendered pages with Mustache, render middleware, Webpack-built page bundles, DOM components, frontend helpers, and API-backed frontend models.
- `api/`: Express JSON API with routers, middleware, entity model classes, and a MySQL helper that owns all SQL construction.

The template intentionally removes AutoJudge-specific judging, contest, editor, PDF, Cloudflare, and production-domain content.

## Quick Start

```bash
cp .env.example .env
docker compose -f compose.dev.yaml up -d --build
```

Open:

- Web: `http://localhost`
- API readiness: `http://localhost:3000/ready`

## Development Commands

```bash
# Start the local stack
docker compose -f compose.dev.yaml up -d --build

# API unit tests
docker exec template-api-1 sh -c "NODE_ENV=test npm run test:unit"

# API integration tests
docker exec template-api-1 sh -c "NODE_ENV=test npm run test:integration"

# Web production build
docker exec template-web-1 npm run build

# Browser smoke tests
docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright
docker exec template-playwright-1 npx playwright test
```

Read [GUIDE.md](./GUIDE.md) for the module boundaries and [TESTING.md](./TESTING.md) for validation details.
