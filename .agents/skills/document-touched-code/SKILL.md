---
name: document-touched-code
description: "Add accurate JSDoc and focused comments when changing template code. Auto-invoke during code writing or refactoring. Triggers: \"document code\", \"jsdoc\", \"code comments\", \"add comments\", \"explain logic\"."
argument-hint: "Source file or module to document"
user-invocable: true
---

# Document Touched Code

Treat documentation as an integral part of implementation, not an optional cleanup step.

Use this skill whenever modifying or adding JavaScript/Node source files in `web/` or `api/`. Leave every touched file clearer, better documented, and easier to maintain than you found it.

---

## Default Standard

1. **JSDoc Contracts**: Add or update doc comments for all touched exported classes, methods, functions, constructors, and materially changed internal helpers. Include `@param`, `@returns`, and `@throws` (`CustomError`) annotations.
2. **Intent Comments**: Keep inline comments focused on **why** logic exists, non-obvious ordering, validation assumptions, invariant preservation, and edge cases.
3. **Project Boundaries & Conventions**:
   - `api/model/`: Document entity models, query methods, data normalization, and camelCase mapping.
   - `api/helpers/mysql.js`: Document SQL query parameters, sanitization, and transaction boundaries.
   - `web/src/js/components/`: Explain DOM component lifecycle and in-memory lookup maps (strictly avoiding `data-*` attributes for domain data).
   - `web/src/js/model/`: Document browser API helpers and REST API client calls.
4. **Remove Obsolete Comments**: Delete or rewrite comments describing outdated logic or restating obvious syntax.
5. **Accuracy**: Ensure all comments match the exact runtime behavior of the code.

---

## Workflow

1. **Identify Touched Elements**: Find every class, method, function, or internal helper modified in `web/` or `api/`.
2. **Update Signatures & JSDoc**: Update JSDoc blocks so parameters, types, return values, side-effects, and thrown `CustomError` codes match current behavior.
3. **Scan Complex Logic**: Locate non-obvious conditional branches, fallback sequences, Map keying strategies, or error handlers.
4. **Add Intent Comments**: Add concise inline comments explaining the *rationale* behind dense or non-trivial blocks.
5. **Prune Noise**: Remove redundant comments that narrate self-explanatory JavaScript lines.

---

## High-Value Comment Targets

- **Validation & Auth Guards**: Rationale for checking active states, role permissions, or payload schemas before execution.
- **SQL & Persistence**: Transaction boundaries, query parameter ordering, and table join semantics.
- **Data Lookup Maps**: Explaining in-memory lookup maps keyed by element ID/index used instead of DOM `data-*` attributes.
- **Error Handling**: Explaining machine-readable error codes thrown via `CustomError(status, message, code, data)`.
- **State & Lifecycle**: Multi-step component rendering, event cleanup, or browser API fallbacks.

---

## Comment Quality Rules

### Do
- Explain **why** a block exists or why statement ordering matters.
- Call out non-obvious assumptions, constraints, and edge-case handling.
- Use phase headers (e.g., `// Phase 1: Validate input`) to structure long functions.
- Keep comments concise and aligned with project architectural conventions.

### Do Not
- Narrate obvious syntax (e.g., `// loop through items`).
- Add generic boilerplate JSDoc that renames parameters without adding clarity.
- Leave outdated comments after changing code behavior.
- Use `data-*` attributes to pass data in comments or code examples.

---

## Reference

See [references/comment-patterns.md](references/comment-patterns.md) for concrete examples of good JSDoc, section comments, and project-specific documentation patterns.
