---
name: code-review
description: >
  You must use this skill when the user says "review this", "code review",
  or during pre-deployment gate. Covers code review (slop, dead code,
  architecture, security, test quality) and security audit (secrets,
  injections, auth, vulnerable deps, misconfigurations). Read-only.
---

# When to use

- User says "review this", "code review", "QA check", "check my PR", "is this ready to commit"
- User says "security audit", "audit this", "check for vulnerabilities", "security review"
- Pre-commit review or pre-deployment gate
- After adding new dependencies
- Onboarding a new codebase needing security assessment

Do NOT use for automated linting only, when user wants a plan, or codebase already audited with no changes since.

---

# Steps

## 1. Code Review — Slop Detection

Over-commenting on obvious code, unnecessary try-catch, over-abstraction, test subversion, hallucinated dependencies, silent error swallowing.

## 2. Code Review — Dead Code

Unused functions/variables after refactor, orphaned exports, duplicate implementations, TODO stubs.

## 3. Code Review — Architecture

Pattern consistency, correct module placement, magic numbers, over-engineering.

## 4. Security Audit — Secrets Scan

Hardcoded API keys, tokens, passwords, connection strings, `.env` committed, private keys, credentials in tests, tokens in URLs/logs/errors. Check file patterns: `*.env*`, `*.pem`, `*.key`, `credentials*`, `secrets*`.

## 5. Security Audit — Injection & Auth

Raw SQL concatenation (use parameterized queries), `eval()`/`Function()` calls, shell exec with unsanitized args, path traversal. Endpoints without auth, permissive CORS, missing CSRF, missing rate limiting.

## 6. Security Audit — Dependencies

Run project audit command (`npm audit`, `cargo audit`, etc.). Cross-reference critical deps against CVEs.

## 7. Security Audit — Data & Config

PII in logs/output, unhashed passwords (must be bcrypt/argon2), over-exposed API responses, stack traces in errors. Debug/production flags inverted, permissive permissions, exposed internal ports, TLS disabled.

## 8. Tests & Readiness

Behavioral coverage (not mirroring), sad paths tested, order-independent tests. Debug logs left in, unused imports, merge artifacts, oversized commits.

---

# Report Format

```
Issues: N critical, N high, N medium, N low

Critical: [issue] at [file:line] — [remediation]
High: [issue] at [file:line] — [remediation]
Medium: [issue] at [file:line] — [remediation]
Low: [issue] at [file:line]
```

---

# Persist Report

After inline output, save to `specs/code-review/{context}-{date}.md`:

- Derive context from branch name, plan name, or feature. Kebab-case. Fallback: "code-review".
- File format: report content with header:

```
# {Context} — Code Review

**Date**: {date}
**Scope**: {files or feature reviewed}

{report content}
```

- Create `specs/code-review/` if missing.
- Write the file.
- After writing, output brief summary: "Review saved to `specs/code-review/{context}-{date}.md`. N critical, N high, N medium, N low."

---

# Gotchas

- Read-only. Do NOT fix issues. No code changes, no edits.
- Secrets in code = auto-critical. Flag with file path and line.
- Block commit on critical issues. Report "Blocked" if critical found.
- Be specific. "Bad variable name" is useless. "Variable x at line 42 should describe its purpose" is actionable.
- Do not report style preferences. Tabs vs spaces, brace style, naming that matches project standards = skip.
- Test quality > test quantity. 100 worthless tests < 10 good tests.
- Dependency scan is minimum bar. Manually cross-reference high-severity deps.
- Report false positives as Low with a note.
