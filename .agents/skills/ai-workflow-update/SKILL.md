---
name: ai-workflow-update
description: Update project-local agent guidance when architecture, workflows, commands, or conventions change.
---

# AI Workflow Update

Use this skill when changes alter how future agents should work in this repository.

## Rules

- Update `AGENTS.md` for repository-wide operating rules.
- Update `.agents/skills/*/SKILL.md` for workflow-specific conventions.
- Update `GUIDE.md` and `TESTING.md` when human-facing commands or boundaries change.
- Do not duplicate stale guidance across files; keep one canonical location for each rule.
- Validate documentation claims against the code before editing them.
