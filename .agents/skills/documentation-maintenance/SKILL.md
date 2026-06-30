---
name: documentation-maintenance
description: Keep this template's human docs, agent guidance, and touched code comments aligned with the real web/api implementation, compose workflow, and validation commands.
---

# Documentation Maintenance

Use this skill as the final consistency pass after any change that could alter how people or agents understand, run, test, customize, or extend this template.

## Core Rule

Treat documentation, local skills, and touched code comments as part of the implementation.

If a change affects architecture, ownership boundaries, commands, routes, scripts, env vars, compose files, tests, sample entities, or developer workflow, verify whether the checked guidance still matches the code and update it in the same pass.

## Template Owners

Check the narrowest owner that already covers the changed topic.

- `README.md`: first-run setup, quick-start commands, service summary, public template positioning.
- `GUIDE.md`: architecture, ownership boundaries, render flow, helper/model/component responsibilities, customization guidance.
- `TESTING.md`: validation commands, test scope, build checks, browser-smoke workflow.
- `AGENTS.md`: repository-wide rules for future agents.
- `.agents/skills/*/SKILL.md`: project-specific workflow rules that should stay durable for future changes.
- Touched source files: JSDoc and focused local comments for exported functions, public methods, constructors, and materially changed private helpers.

## Repository-Specific Checks

Prioritize these checks for this template:

- Keep `web/` and `api/` responsibilities separate in docs and comments.
- Keep DOM ownership inside `web/src/js/components/`.
- Keep browser API calls inside `web/src/js/model/`.
- Keep API persistence inside `api/model/`.
- Keep SQL generation inside `api/helpers/mysql.js`.
- Keep API responses described as camelCase JSON payloads.
- Keep render guidance aligned with `web/middleware/render.js` and the current server-provided template-var flow.
- Keep runtime docs aligned with `compose.yaml`, standalone `compose.dev.yaml`, and `compose.playwright.yaml`.
- Treat the checked-in `items` flow as sample starter behavior unless the template itself changes that baseline.

## Update Workflow

1. Identify what changed: behavior, contract, workflow, boundary, command, or convention.
2. Search for stale references with targeted `rg` queries using changed filenames, scripts, env vars, route names, helper names, UI labels, schema fields, and compose commands.
3. Read the nearest owner before editing it.
4. Update the smallest correct owner first instead of copying the same detail across several docs.
5. If the change affects future agent behavior, update `AGENTS.md` or the relevant `.agents/skills/*/SKILL.md` in the same pass.
6. Review touched code comments and JSDoc before finishing.
7. Validate that every documented file, command, route, and script actually exists.

## Validation Commands

Use the lightest command that proves the changed documentation claim.

- API unit: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:unit"`
- API integration: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:integration"`
- Web build: `docker compose -f compose.dev.yaml exec web npm run build`
- Render-focused web test: `docker compose -f compose.dev.yaml exec web node --test tests/render.test.js`
- Browser smoke: `docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright` then `docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test`

If runtime validation is unnecessary or unavailable, finish with targeted existence checks and stale-reference searches, then report that narrower validation scope explicitly.

## Comment Standard

- Add or update JSDoc on touched exported functions, public methods, constructors, and materially changed private helpers.
- Keep local comments sparse and high-signal.
- Explain non-obvious ordering, normalization, fallback behavior, validation boundaries, caching, async flow, or edge cases.
- Remove comments that only narrate the next line or preserve obsolete behavior.

## Done Criteria

- Relevant stale docs and local skills were checked and updated where needed.
- Human docs still describe the real compose workflow, service boundaries, and validation commands.
- Agent guidance still matches the current template conventions.
- Touched code comments and JSDoc match the implementation.
- Final reporting names the docs or guidance updated, or explicitly states that the documentation pass found no required edits.
