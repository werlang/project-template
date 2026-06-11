---
name: entity-models
description: Implement OOP API entities in api/model/ using the shared Model base class and relation helper.
---

# Entity Models

Use this skill when changing entity classes or persistence-facing business behavior.

## Rules

- Entity classes live in `api/model/`.
- Extend `api/model/model.js` for standard CRUD behavior.
- Keep table fields, allowed update fields, insert fields, and entity-specific methods inside the model.
- Models are the only ordinary production code that calls `api/helpers/mysql.js`.
- Use `api/model/relation.js` for relation tables instead of duplicating relation checks in routes.
- Prefer adding an explicit model method when a workflow is repeated across routes.

## Validation

Use model unit tests for isolated behavior and integration tests when joins, auth, or real database behavior is involved.
