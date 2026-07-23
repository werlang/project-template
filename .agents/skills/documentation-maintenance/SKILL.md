---
name: documentation-maintenance
description: "Keep human docs, agent guidance, and touched code comments aligned with the real web/api implementation, compose workflow, and validation commands. Auto-invoke when auditing docs or after major architectural changes. Triggers: \"audit docs\", \"check context\", \"documentation maintenance\", \"audit documentation\", \"verify docs\"."
argument-hint: "Target doc file or repository component to audit"
user-invocable: true
---

# Documentation Maintenance

Use this skill as the final consistency pass after any change that could alter how humans or agents understand, run, test, customize, or extend this template.

---

## 1. Core Rule

Treat documentation, local skills, and touched code comments as part of the implementation. Code and configuration are the source of truth. Remove or rewrite aspirational claims that are not enforced by code.

---

## 2. Template Owner Mapping

Check the narrowest owner that already covers the changed topic:

- `README.md`: First-run setup, quick-start commands, service summary, public template positioning.
- `GUIDE.md`: Architecture, ownership boundaries, render flow, helper/model/component responsibilities.
- `TESTING.md`: Validation commands, test scope, build checks, browser-smoke workflow.
- `AGENTS.md`: Repository-wide rules for future agents.
- `.agents/skills/*/SKILL.md`: Project-specific workflow rules that stay durable for future changes.
- Touched source files: JSDoc and focused local comments for exported functions, public methods, constructors, and materially changed private helpers.

---

## 3. Required Audit & Consistency Checks

Prioritize these checks during documentation audits:

- **Verification of Real Assets**: Confirm routes, scripts, env vars, ports, Docker Compose flags, and file paths are real.
- **Service Boundary Alignment**: Keep `web/` and `api/` responsibilities separate in docs and comments.
- **DOM & Browser API Conventions**: Keep DOM ownership inside `web/src/js/components/` and API calls inside `web/src/js/model/`.
- **Data Attribute Rules**: Ensure docs reflect the strict prohibition against storing domain data in HTML `data-*` attributes.
- **Persistence & SQL Conventions**: Keep API persistence inside `api/model/` and SQL generation inside `api/helpers/mysql.js`.
- **Link & Terminology Sweep**: Sweep for broken relative links, obsolete script names, and contradictory claims across all `.md` files.

---

## 4. Audit Workflow

1. **Identify Changes**: Determine what changed: behavior, contract, workflow, boundary, command, or convention.
2. **Search Stale References**: Search with targeted `rg` queries using changed filenames, scripts, env vars, route names, and compose commands.
3. **Build Mismatch Ledger**: Record discrepancies between documented claims and codebase reality.
4. **Update Smallest Owner First**: Update the primary owner document instead of duplicating details across multiple files.
5. **Update Agent Context**: If future agent behavior changes, update `AGENTS.md` or `.agents/skills/*/SKILL.md`.
6. **Validate Claims**: Run the narrowest validation command that proves documented setup or test claims exist and work.

---

## 5. Validation Commands

- **API Unit**: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:unit"`
- **API Integration**: `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:integration"`
- **Web Build**: `docker compose -f compose.dev.yaml exec web npm run build`
- **Render-Focused Web Test**: `docker compose -f compose.dev.yaml exec web node --test tests/render.test.js`
- **Browser Smoke**: `docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright` then `docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test`

---

## 6. Done Criteria

- Relevant stale docs and local skills were audited and updated.
- Human docs match the real compose workflow, service boundaries, and validation commands.
- Agent guidance matches current template conventions.
- Touched code comments and JSDoc match the implementation.
- Final reporting lists the docs updated or explicitly confirms that no documentation edits were required.
