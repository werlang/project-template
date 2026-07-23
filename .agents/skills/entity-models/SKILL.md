---
name: entity-models
description: Implement OOP API entities in api/model/ using the shared Model base class and relation helper.
---

# Entity Models

Use this skill when changing entity classes or persistence-facing business behavior.

## Rules

- Entity classes live in `api/model/`.
- Extend `api/model/model.js` for standard CRUD behavior.
- Implement the Dual-ID pattern: `id` (internal `BIGINT` identity for database FKs) and `public_id` (`VARCHAR(14) NOT NULL UNIQUE` generated via `nanoid` `customAlphabet` Base62 in `Model.insert()` and exposed in public `toJSON()` / route selectors).
- Keep table fields, allowed update fields, insert fields, and entity-specific methods inside the model.
- Models are the only ordinary production code that calls `api/helpers/postgres.js`.
- Use `api/model/relation.js` for relation tables instead of duplicating relation checks in routes.
- Prefer adding an explicit model method when a workflow is repeated across routes.

## Validation

Use model unit tests for isolated behavior and integration tests when joins, auth, or real database behavior is involved.
