# Agent Operating Guide

This repository is a generic Node/Express web/API template. Preserve the service and ownership boundaries unless the user explicitly asks to change the architecture.

## Canonical Context

- Human documentation: `README.md`, `GUIDE.md`, `TESTING.md`
- Project-local skills: `.agents/skills/*/SKILL.md`
- Runtime config: `.env.example`, `compose.yaml`, `compose.dev.yaml`

## Working Rules

- Keep `web/` and `api/` responsibilities separate.
- Keep DOM access inside `web/src/js/components/`.
- Keep browser API calls inside `web/src/js/model/` through helper classes.
- Keep API persistence inside `api/model/`.
- Keep SQL generation inside `api/helpers/mysql.js`.
- Execute versioned database migrations using `api/scripts/migrate.js` (`npm run db:migrate`) reading SQL scripts from `api/migrations/`.
- Use `CustomError` and `api/middleware/error.js` for API error responses.
- Keep API response payloads camelCase.
- Never store application data in DOM `data-*` attributes. Data attributes are for framework selectors and DOM behavior hooks only. All domain data (IDs, values, lookup mappings) must live in dedicated JavaScript structures — plain objects, Maps, or class properties.
- When rendering a list of selectable items, build a lookup map keyed by element ID or index and resolve data from the map at interaction time instead of reading `getAttribute('data-*')`.
- Add or update tests for behavior changes.
- Update documentation and `.agents/skills/` when conventions change.

## Default Validation

- API migrations: `docker compose -f compose.dev.yaml exec api npm run db:migrate`
- API unit: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:unit"`
- API integration: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:integration"`
- Web build: `docker compose -f compose.dev.yaml exec web npm run build`
- Browser smoke: `docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright` then `docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test`
