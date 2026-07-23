---
name: bug-review
description: "Review backend and frontend template code for real defects, boundary violations, security gaps, and missing tests. Auto-invoke for code reviews or bug investigations. Triggers: \"bug review\", \"review code\", \"find bugs\", \"security audit\", \"check defects\"."
argument-hint: "Target directory, file, or bug report scope"
user-invocable: true
---

# Bug Review

Use this skill for code reviews, security audits, or defect investigations.

---

## Review Priorities

1. **Security & Authorization**: Inspect auth middleware, token validation, password hashing, and endpoint authorization checks.
2. **Boundary Violations**: Ensure `web/` (Mustache SSR, components, DOM) and `api/` (Express routes, models, MySQL helpers) responsibilities remain strictly decoupled.
3. **SQL & Filter Safety**: Verify queries in `api/helpers/postgres.js` use parameterized statements and safe filter builders to prevent SQL injection.
4. **DOM Ownership & Data Attributes**: Confirm DOM access lives exclusively in `web/src/js/components/` and no domain data is stored in `data-*` attributes.
5. **API Contract Drift**: Check camelCase JSON response contracts between API routes and frontend models.
6. **Missing Regression Tests**: Verify that bug fixes or behavior changes include automated tests to prevent regressions.
7. **Rendering & UX Bugs**: Check for browser-visible rendering flaws, unhandled promise rejections, missing localized error translations, and console errors.

---

## Output Standard

Lead with findings ordered by severity (Critical, High, Medium, Low), including file and line citations (`file:///path/to/file#L12-L34`). If no issues are found, state that clearly and document any remaining automated test gaps.
