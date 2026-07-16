---
name: bug-review
description: Review backend and frontend template code for real defects, boundary violations, security gaps, and missing tests.
---

# Bug Review

Use this skill for code reviews or defect investigations.

## Review Priorities

- Security and authorization mistakes.
- Route/model/helper boundary violations.
- SQL injection or unsafe filter behavior.
- DOM ownership violations in frontend code.
- Application data stored in `data-*` attributes (IDs, values, error messages, grouping keys, state enums). Data attributes should only be used as framework selectors or DOM behavior hooks.
- API contract drift between frontend models and backend routes.
- Missing regression tests for changed behavior.
- Browser-visible rendering, focus, and state bugs.

## Output

Lead with findings ordered by severity and include file/line references. If no issues are found, state that clearly and name any remaining test gaps.
