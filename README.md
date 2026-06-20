# Generic Web/API Template

This repository is a standalone Node/Express template for building server-rendered web apps backed by a JSON API and MySQL. It is designed to be forked for new projects while keeping two clear service boundaries:

- `web/`: Express server-rendered pages with Mustache, render middleware, Webpack-built page bundles, DOM components, frontend helpers, and API-backed frontend models.
- `api/`: Express JSON API with routers, middleware, entity model classes, and a MySQL helper that owns all SQL construction.

The checked-in sample `items` flow is intentionally small so new projects can replace it with their own domain entities without first removing product-specific behavior.

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
