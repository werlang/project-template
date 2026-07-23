---
name: postgres-helper
description: Maintain the api/helpers/postgres.js SQL boundary, CRUD helper surface, and safe filter conventions.
---

# PostgreSQL Helper

Use this skill when changing `api/helpers/postgres.js` or model persistence contracts.

## Rules

- Keep raw SQL generation inside `api/helpers/postgres.js`.
- Public database access should stay CRUD-shaped: `find`, `findOne`, `get`, `insert`, `upsert`, `update`, and `delete`.
- Keep identifier quoting (double quotes `"table"`) and `$1, $2` parameter binding centralized.
- Extend filter helpers through generic operators such as `like`, `between`, `ne`, `lt`, `gt`, `lte`, and `gte`.
- Keep transaction context, raw SQL fragments, date formatting, and table reset support inside the helper so models do not format SQL directly.
- Do not move SQL construction into routes, middleware, frontend code, or general helpers.

## Validation

Run helper unit tests and at least one integration path when query behavior changes.
