---
name: code-review-design
description: >
  You must use this skill when reviewing a plan, design, or approach before
  implementation begins. Covers design correctness, architectural fit, necessity
  of changes, commit message quality, diff size validation, backward compatibility,
  and observability. Use at the Approve gate after a plan is produced but before
  code is written. Also use when user says "review the plan", "design review",
  "check architecture", "review approach", "review PR description",
  "review commit message", "is this the right approach", or "review diff".
---

# When to use

Use when:
- User says "review the plan", "design review", "check architecture", "review approach"
- User says "review PR description", "review commit message", "is this the right way"
- User says "review diff", "check the diff size", "review backward compat"
- Approve gate — after PLAN.md + todos are produced, before execution begins
- User asks for feedback on a changelist description before committing
- Pre-PR review — before the code is written, validate the design intent

Do NOT use when:
- Code is already written and needs line-level audit (use code-review skill instead)
- User just wants a plan (use planning skill instead)
- Post-deployment review
- User explicitly asks for security audit only

---

# Steps

## 1. Collect Context

Read the plan if available (PLAN.md, TASKS.md, todos). Read SPECS.md for architecture decisions and constraints. Read the commit message or PR description if provided. If reviewing a diff, read the changed files — focus on intent, not line-level style.

## 2. Design Review

- Does the approach match what SPECS.md requires?
- Does it fit the existing architecture? Same patterns, same module boundaries?
- Is there a simpler alternative? Smallest change that achieves the goal.
- Does it over-generalize? YAGNI — build for what's needed now.
- Does it duplicate existing functionality? Grep for similar patterns.

## 3. Necessity Check

- Is this change actually needed right now?
- Could a config change, existing utility, or no-op achieve the same result?
- If it's a refactor: does it unblock something, or is it cosmetic?

## 4. Commit Message Quality

- Does it explain what changed and why? Not just "fix bug" or "update component".
- Does it reference the requirement (FR-NNN) if applicable?
- Does it match project commit convention (Commitizen, conventional commits)?
- If no commit message provided: infer what it should be and flag if the inferred purpose is unclear.

## 5. Diff Size Gate

- Estimate or measure diff size. Flag if >400 lines.
- Recommend splitting: 1 logical change per commit/diff.
- Exception: generated code, data files, lockfiles — note the exception explicitly.

## 6. Backward Compatibility

- For API changes: do existing consumers break? Check call sites in the codebase.
- For schema/data changes: is there a migration path? Are old formats still accepted?
- For interface changes: does it break existing implementations? Flag with file paths.
- If no consumers found or no API change: report "Not applicable."

## 7. Observability Check

- If this change fails in production, how would we know?
- Are there logs for the new code path?
- Is there a metric or alert for the critical operation?
- Are errors surfaced meaningfully, not silently swallowed?
- For internal logic changes: check passes if existing error handling is adequate.

## 8. Report

```
Design Review — {plan name or diff scope}

PASS / CONDITIONAL / BLOCKED

BLOCKING:
- {issue} — why it blocks, what to fix

CONDITIONS:
- {issue} — fix before proceeding

OBSERVATIONS:
- {issue} — note, not blocking

Commit message: {PASS / NEEDS WORK}
Diff size: {N lines — PASS / SUGGEST SPLIT}
Backward compat: {PASS / BREAKING / N/A}
Observability: {ADEQUATE / GAP — details}
```

---

# 9. Persist Report

After inline output, save to `specs/code-review/{context}-{date}.md`:

- Derive context from plan name, diff scope, or feature. Kebab-case. Fallback: "design-review".
- File format: report content with header:

```
# {Context} — Design Review

**Date**: {date}
**Scope**: {what was reviewed}

{report content}
```

- Create `specs/code-review/` if missing.
- Write the file.
- After writing, output brief summary: "Design review saved to `specs/code-review/{context}-{date}.md`. Verdict: {PASS / CONDITIONAL / BLOCKED}."

---

# Gotchas

- Design review is NOT code audit. Do not read line-by-line. Look at intent, structure, and approach.
- "Simpler" does not mean "rewrite everything". Smallest viable change.
- Diff size is about reviewability, not code quality. A 500-line rename is fine. A 500-line logic change is not.
- Backward compat requires checking existing call sites. Do not guess — grep the codebase.
- Necessity check is the hardest. If in doubt, flag it as an observation, not a blocker.
- Do not report style, formatting, naming, or other cosmetic concerns — those belong in code-audit review.
- Commit message review: critique clarity and completeness, not format. Format enforcement belongs in CI.
- If no plan exists and user just wants a quick design check: skip the plan-reading step, go straight to design review.
