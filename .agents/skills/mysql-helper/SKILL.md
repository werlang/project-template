---
name: mysql-helper
description: Maintain the api/helpers/mysql.js SQL boundary, CRUD helper surface, and safe filter conventions.
---

# MySQL Helper

Use this skill when changing `api/helpers/mysql.js` or model persistence contracts.

## Rules

- Keep raw SQL generation inside `api/helpers/mysql.js`.
- Public database access should stay CRUD-shaped: `find`, `findOne`, `get`, `insert`, `upsert`, `update`, and `delete`.
- Keep identifier quoting and placeholder binding centralized.
- Extend filter helpers through generic operators such as `like`, `between`, `ne`, `lt`, `gt`, `lte`, and `gte`.
- Keep transaction context, raw SQL fragments, date formatting, and dump support inside the helper so models do not format SQL directly.
- Do not move SQL construction into routes, middleware, frontend code, or general helpers.

## Validation

Run helper unit tests and at least one integration path when query behavior changes.
