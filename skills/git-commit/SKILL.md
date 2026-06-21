---
name: git-commit
description: >
  You must use this skill when the user asks to commit changes, make a commit, or save progress to git. Commits staged file changes with proper Commitizen-style messages and sign-off.
---

# When to use

- User says "commit this" or "make a commit"
- User says "save changes to git"
- Changes have been staged and need a commit message
- User wants to group changes into logical commits

### Do NOT use when
- Changes are incomplete or untested
- The user explicitly wants to keep working before committing
- No changes have been staged

---

# Step by Step

## 1. Check Current State

Run `git status` and `git diff` to understand what changed. Do NOT blindly execute `git add .`.

## 2. Group by Functional Context

Identify logically related changes. Each group becomes one commit:

- Bug fixes go together
- Feature work goes together
- Refactoring goes separately
- Documentation changes go separately

Rule: Unrelated changes (e.g., a bug fix in File A and a new feature in File B) MUST be split into separate atomic commits.

## 3. Stage and Commit per Group

For each group:

1. `git add [specific files]` — only the files belonging to this group
2. Draft a commit message following Commitizen standard: `type(scope): description`
3. Include `-s` (Sign-off) flag

### Commit Types

- `feat` — new feature
- `fix` — bug fix
- `refactor` — code restructuring
- `docs` — documentation only
- `chore` — maintenance, tooling, config
- `test` — adding or fixing tests
- `perf` — performance improvement

### Message Format

```
type(scope): brief description in present tense

Optional body with details. Wrap at 72 characters.
```

## 4. Final Check

- [ ] Each commit is atomic (one logical change per commit)
- [ ] Messages follow `type(scope): description` format
- [ ] Sign-off flag `-s` is included
- [ ] No unrelated changes bundled together
- [ ] `git log` shows clean history

## Gotchas

- Don't commit all changes at once — group by functional context for clean git history.
- Always sign off — every commit message must include sign-off line.
