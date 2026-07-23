# Validation Commands

Use these Docker Compose commands to validate changes in this repository.

## Default Validation (Unit & Build)

- **API Unit Tests**:
  `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:unit"`

- **Web Build Check**:
  `docker compose -f compose.dev.yaml exec web npm run build`

- **Web Render Unit Tests**:
  `docker compose -f compose.dev.yaml exec web node --test tests/render.test.js`

- **Database Migrations** (when schema changes):
  `docker compose -f compose.dev.yaml exec api npm run db:migrate`

## Explicit Request Only (Integration & E2E)

- **API Integration Tests**:
  `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:integration"`

- **End-to-End & Browser Smoke (`playwright/`)**:
  `docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright`
  `docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test`
