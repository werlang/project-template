---
name: test-first-delivery
description: "Deliver template behavior changes with focused automated tests, build checks, and honest validation reporting. Auto-invoke when writing tests, fixing bugs, refactoring routes/models, or validating web/api changes. Triggers: \"test-first\", \"run test\", \"add unit test\", \"add integration test\", \"browser smoke\", \"validate changes\"."
argument-hint: "Target layer (api, web, db) or test suite name"
user-invocable: true
---

# Test-First Delivery

Use this skill whenever a task changes application behavior, fixes a bug, or refactors existing structures in this repository.

---

## 1. Default Quality Contract

Unless explicitly directed otherwise:
1. **Never Stop at Code Changes Alone**: Every behavior-changing task is incomplete without empirical verification.
2. **Follow Test-First (TDD) Cycle**: Write or update failing tests before writing minimal code to make them pass.
3. **Leave Touched Code Easy to Understand**: Enforce JSDoc/docstrings on all touched exported functions, methods, and constructors. Include focused inline comments near complex or non-obvious logic.
4. **Target 100% Coverage for Validated Scope**: Run test suites for touched files, fixing failures and gaps iteratively.
5. **State What Was Verified**: Conclude with a clear report detailing the automated tests run, manual validation performed, and any remaining gaps.

---

## 2. The TDD Workflow (Red-Green-Refactor)

For new features or bug fixes, apply the three-phase loop:

### Phase A: Red (Failing Test)
1. Write a failing test that defines the desired behavior or reproduces the reported bug.
2. Verify the test fails with a clear, expected error message before writing implementation code.
*Example:*
```javascript
describe('Item API model', () => {
  it('should format payload properties as camelCase', async () => {
    const item = await Item.findById(1);
    expect(item).toHaveProperty('createdAt');
    // Fails initially if createdAt normalization is missing
  });
});
```

### Phase B: Green (Minimal Code)
1. Write the simplest possible implementation that satisfies the test.
2. Avoid over-engineering or extra features. Run tests inside Docker to confirm green status.

### Phase C: Refactor (Clean Code)
1. Improve code structure, deduplicate, and enforce boundaries while keeping tests green.
2. Document implementation: add JSDoc for signatures and focused inline comments for intent.

---

## 3. Testing Strategy & Decision Tree

Discover project reality before executing tests. Use the decision tree to determine the validation path:

1. **Does the target area already have automated tests?**
   - **Yes** → Add or update tests within that suite (`api/tests/`, `web/tests/`).
   - **No** → Continue to step 2.
2. **Did the user explicitly request no automated test changes?**
   - **Yes** → Provide a manual validation checklist and document the automation gap.
   - **No** → Continue to step 3.
3. **Target Layer Selection**:
   - *API (Backend)*: Add unit/integration tests in `api/tests/`.
   - *Web (Frontend)*: Run asset build, add render tests, or update Playwright specs.
   - *Database*: Run migration tests with `npm run db:migrate`.

See [references/testing-decision-tree.md](references/testing-decision-tree.md) for details.

---

## 4. Documentation & Comments Standard

Maintain documentation as part of code delivery:

- **Doc Comments**: Use JSDoc to document parameters, return values, thrown errors, side effects, and machine-readable error codes for all touched exported functions and class members.
- **Inline Comments**: Keep comments focused on **why** the logic exists, non-obvious ordering, validation boundaries, and edge cases.

---

## 5. Execution Workflow (Docker Environment)

> [!IMPORTANT]
> **Host Isolation**: Python and Node are not installed on the host machine. Run all test commands inside Docker containers.
> **Test Scope Rule**: Run **unit tests only** by default during AI tasks. Integration/functional tests and E2E/Playwright browser smoke tests are reserved for **explicit requests**.

1. **Derive project commands** from [references/validation-commands.md](references/validation-commands.md).
2. **Run API Unit Tests (Default)**:
   `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:unit"`
3. **Run Web Build & Unit Tests (Default)**:
   `docker compose -f compose.dev.yaml exec web npm run build`
   `docker compose -f compose.dev.yaml exec web node --test tests/render.test.js`
4. **Run API Integration Tests (Explicit Request Only)**:
   `docker compose -f compose.dev.yaml exec api sh -c "NODE_ENV=test npm run test:integration"`
5. **Run Browser Smoke / E2E Tests (Explicit Request Only)**:
   `docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright`
   `docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test`
   See [references/browser-smoke-checklist.md](references/browser-smoke-checklist.md).

---

## 6. Done Criteria

A task is complete only when:
- Implementation code is in place and respects ownership boundaries.
- Touched code has JSDoc comments and high-signal inline intent comments.
- Relevant automated tests were created/updated and executed successfully in Docker containers.
- Final response details what commands were run, test results, and any remaining gaps.
