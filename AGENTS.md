# Agent Operating Guide

This repository is a generic Node/Express web/API template. Preserve the service and ownership boundaries unless the user explicitly asks to change the architecture.

## Canonical Context

- Human documentation: `README.md`, `GUIDE.md`, `TESTING.md`
- Project-local skills: `.agents/skills/*/SKILL.md`
- Runtime config: `.env.example`, `compose.yaml`, `compose.local.yaml`

## Working Rules

- Keep `web/` and `api/` responsibilities separate.
- Keep DOM access inside `web/src/js/components/`.
- Keep browser API calls inside `web/src/js/model/` through helper classes.
- Keep API persistence inside `api/model/`.
- Keep SQL generation inside `api/helpers/mysql.js`.
- Use `CustomError` and `api/middleware/error.js` for API error responses.
- Keep API response payloads camelCase.
- Add or update tests for behavior changes.
- Update documentation and `.agents/skills/` when conventions change.

## Default Validation

- API unit: `docker exec template-api-1 sh -c "NODE_ENV=test npm test -- --config jest.unit.config.mjs"`
- API integration: `docker exec template-api-1 sh -c "NODE_ENV=test npm test -- --config jest.integration.config.mjs"`
- Web build: `docker exec template-web-1 npm run build`
- Browser smoke: `docker compose -f compose.local.yaml -f compose.playwright.yaml up -d playwright` then `docker exec template-playwright-1 npx playwright test`
