---
name: test-first-delivery
description: Deliver template behavior changes with focused automated tests, build checks, and honest validation reporting.
---

# Test-First Delivery

Use this skill whenever behavior changes.

## Workflow

1. Identify the owner of the behavior: API, web, database, or cross-service.
2. Add or update the smallest useful test before or alongside the implementation.
3. Run the narrowest command that can prove the changed contract.
4. Run broader checks when the change touches shared boundaries.
5. Report what was validated and what could not be validated.

## Commands

- API unit: `docker exec template-api-1 sh -c "NODE_ENV=test npm run test:unit"`
- API integration: `docker exec template-api-1 sh -c "NODE_ENV=test npm run test:integration"`
- Web build: `docker exec template-web-1 npm run build`
- Browser smoke: `docker exec template-playwright-1 npx playwright test`
