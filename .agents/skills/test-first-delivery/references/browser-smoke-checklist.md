# Browser Smoke Test Checklist

Use this checklist when verifying UI interactions, Mustache rendering, client-side scripts, or component behavior in the `web/` service.

## Checklist

- [ ] **Build Validation**: Run `docker compose -f compose.dev.yaml exec web npm run build` to confirm asset bundling completes without error.
- [ ] **DOM Ownership**: Verify DOM manipulation logic stays inside `web/src/js/components/`.
- [ ] **Browser API Boundaries**: Verify API calls are made via helper classes inside `web/src/js/model/`.
- [ ] **Data Attribute Restrictions**: Confirm no application domain data (IDs, lookup keys, values, state enums) is stored in HTML `data-*` attributes.
- [ ] **Playwright Execution**:
  ```bash
  docker compose -f compose.dev.yaml -f compose.playwright.yaml up -d playwright
  docker compose -f compose.dev.yaml -f compose.playwright.yaml exec playwright npx playwright test
  ```
- [ ] **Console Error Check**: Verify no client-side JS runtime exceptions, 404/500 API errors, or missing translation key warnings occur.
