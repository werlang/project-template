# Testing Strategy & Decision Tree

Use this decision tree to determine the validation path when introducing behavior changes, bug fixes, or refactors.

```mermaid
flowchart TD
    A[Start: Behavior Change or Fix] --> B{Does target code have existing tests?}
    B -- Yes --> C[Add/update test in existing suite]
    B -- No --> D{Did user explicitly opt out of tests?}
    D -- Yes --> E[Provide manual validation checklist & note gap]
    D -- No --> F{Which layer is being changed?}
    F -- API/Backend --> G[Add unit/integration test under api/tests/]
    F -- Web/SSR/Frontend --> H[Add unit test or Playwright spec]
    F -- DB Migration --> I[Test migrate script & model assertions]
```

## Step-by-Step Decision Rules

1. **Existing Automated Tests**:
   - If the modified module already has unit or integration test coverage (e.g. under `api/tests/` or `web/tests/`), add or update failing test cases to cover the new code path before writing implementation logic.

2. **No Existing Test Suite**:
   - For `api/` changes, add unit tests targeting `api/model/`, `api/helpers/`, or `api/routes/`.
   - For `web/` changes, run `npm run build` and add render/model unit tests or update Playwright specs under `web/playwright/`.

3. **Explicit User Opt-Out**:
   - If the user explicitly asks not to write automated tests, create a manual step-by-step verification checklist and explicitly report the automated testing gap.
