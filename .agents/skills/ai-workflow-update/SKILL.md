---
name: ai-workflow-update
description: "Update project-local agent guidance when architecture, workflows, commands, or conventions change. Auto-invoke when user or agent output indicates a reusable workflow or durable rule. Triggers: \"update docs\", \"update skill\", \"create new skill\", \"update agent instructions\", \"document recurring pattern\", \"capture reusable workflow\"."
argument-hint: "Target skill or AGENTS.md rule to update"
user-invocable: true
---

# AI Workflow Update

Use this skill when a task establishes a durable rule, alters architectural boundaries, or changes commands that should influence future agent work in this repository.

---

## 1. When to Use

Use this skill when:
- Architectural rules, ownership boundaries, or render flows change.
- New compose services, test scripts, or environment configs are added or modified.
- Project-wide coding conventions or DOM ownership rules evolve.
- Creating or revising `.agents/skills/*/SKILL.md` or `AGENTS.md`.

Do not use for task-specific, one-off implementation details unlikely to recur.

---

## 2. Auto-Invocation Guidelines

Auto-invoke this skill when:
- Prompt contains any exact trigger phrases listed above.
- Implementation introduces a reusable pattern (e.g. new helper, component class, API middleware) present across multiple files.
- Agent performs the same non-trivial refactor pattern two or more times.
- Files under `AGENTS.md` or `.agents/skills/` are added or modified.

---

## 3. Ownership Rules

Prefer updating an existing project skill before creating a new one:

- Update `AGENTS.md`: Repository-wide operating rules, canonical docs, default validation.
- Update `api-development`: Express routes, middleware, CustomError, camelCase responses.
- Update `frontend-development`: DOM components, model helpers, Mustache rendering.
- Update `entity-models`: OOP entity model inheritance and relation helpers in `api/model/`.
- Update `mysql-helper`: SQL generation, query builders, and safe filter rules in `api/helpers/mysql.js`.
- Update `css-standards`: Theme tokens, editorial styling, component CSS under `web/src/css/`.
- Update `test-first-delivery`: Testing workflows, Docker Compose test commands, Playwright checklists.
- Update `documentation-maintenance`: Consistent owner checks, documentation sync tasks.
- Update `document-touched-code`: JSDoc and intent comment requirements.
- Update `bug-review`: Code review priority rules and defect findings reporting.

Only create a new skill when no existing skill is the right long-term owner for a new cross-cutting workflow.

---

## 4. Update Workflow

1. **Identify the Durable Rule**: Confirm the rule applies beyond the current diff.
2. **Find the Canonical Home**: Select the narrowest existing skill owner or `AGENTS.md`.
3. **Verify Against Code**: Ensure documented claims match real runtime files, routes, and scripts.
4. **Apply Concise Edits**: Use directive, example-driven wording with clear YAML frontmatter triggers.
5. **Update Index**: Update `.agents/skills/README.md` if skills are added or significantly modified.
