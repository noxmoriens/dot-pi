---
name: specs-update
description: >
  You must use this skill when user says "verify spec compliance",
  "cek spec", "cek compliance", "is code matching spec",
  "spec drift check", or before release/deployment.
  Read-only compliance verification — detects drift, never edits.
---

# When to use

Use when:
- User says "verify spec", "check compliance", "cek spec"
- Before deployment or release
- After significant code changes
- User suspects code drifted from architecture
- Pre-audit preparation

Do NOT use when:
- No SPECS.md exists (use specs-creator first)
- User wants to edit spec (specs is immutable for agents)
- User just wants code review (use review skill)

---

# Steps

## 1. Read Spec

Read `specs/SPECS.md` and `specs/TASKS.md`.

Extract requirements into categories:

- Constraints: rules with violation consequences
- Architecture Decisions: chosen over rejected, with reasoning
- Anti-patterns: what to avoid
- Definitions of Done: from TASKS.md active sprint

## 2. Scan Codebase

For each requirement, scan relevant files:
- Constraints: check configs, dependencies, architecture
- Architecture decisions: check file structure, patterns used
- Anti-patterns: grep for known bad patterns
- Definitions of done: check implementation against acceptance criteria

Use `grep`, `find`, `rg` to verify. Static analysis only — runtime behavior marked UNVERIFIABLE.

## 3. Classify Each Requirement

- MATCHING: Code follows spec correctly
- DEVIATING: Code does something different from spec
- MISSING: Spec requirement has no implementation
- UNDOCUMENTED: Existing pattern not captured in spec
- UNVERIFIABLE: Cannot check via static analysis

## 4. Flag Deviations

For each deviation, assign impact:

- HIGH: violates constraint. Breaks architecture rule. Security issue.
- MEDIUM: deviates from architecture decision. Different pattern used.
- LOW: cosmetic. Naming, style, documentation.

## 5. Produce Report

```
## Compliance Report

Date: {date}

Summary:
- MATCHING: {N}
- DEVIATING: {N}
- MISSING: {N}
- UNDOCUMENTED: {N}
- UNVERIFIABLE: {N}

Verdict: PASS / FAIL / CONDITIONAL

HIGH deviations:
- {description} — file: {path}. Expected: {spec}. Actual: {code}.

MEDIUM deviations:
- ...

LOW deviations:
- ...

Recommendations:
- {action item}
- ...
```

## 6. Report Only

Present report to user. Do NOT:
- Edit code to fix deviations
- Edit SPECS.md to match code
- Create new files
- Commit changes

---

# Gotchas

- Read-only. NEVER write files. If you catch yourself about to edit, stop.
- Static analysis misses runtime behavior — mark as UNVERIFIABLE, not PASS.
- MISSING means spec says something that code doesn't implement. UNDOCUMENTED means code does something spec doesn't capture. Different classifications.
- HIGH deviations block deployment. Report them first with file paths.
- If spec is outdated (code intentionally changed but spec wasn't updated), flag as DEVIATING. Do NOT update spec to match — that's user's decision.
- Verdict logic: any HIGH = FAIL. MEDIUM ≥3 = CONDITIONAL. All MATCHING/PASS/UNVERIFIABLE = PASS.
- Do NOT recommend fixing unless user asks. Just report.
