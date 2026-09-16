---
name: wayfire
description: >
  You must use this skill when user says "validate wayfire", "check wayfire
  drift", "is the index stale", "verify specs/wayfire", or before trusting
  specs/wayfire for navigation. Validates specs/wayfire/ against the current
  codebase: structural drift plus staleness via .manifest.json.
---

# When to use

Use when:
- User says "validate wayfire", "check wayfire drift", "is the index stale", "verify specs/wayfire"
- Before relying on specs/wayfire/ to navigate or brief another agent
- After a batch of code changes, to know whether the index is outdated

Do NOT use when:
- specs/wayfire/ does not exist yet — tell the user to run wayfinder first
- User wants to regenerate the index — that is wayfinder, not this skill
- User wants a code review (use code-review)

# Steps

## 1. Preconditions

- Confirm specs/wayfire/ exists and contains .manifest.json and WAYFIRE.md.
- If missing, stop and tell the user to run wayfinder. Do not create them here.

## 2. Structural drift

- Enumerate source files under the same scope and ignore list wayfinder used.
- MISSING-IN-INDEX: source files present but absent from MAPS.md/WAYFIRE.md.
- DEAD-INDEX: symbol md files (class/*.md, function/*.md) whose file:line no longer contains that symbol (file deleted, renamed, or symbol moved/removed).

## 3. Staleness

- Read .manifest.json. Capture the current gitSha (git rev-parse HEAD) and per-file mtime/size.
- STALE: source files whose mtime/size changed, or listed in `git diff --name-only <manifest.gitSha> HEAD`, since generation.
- For each STALE file, mark its indexed symbols (from WAYFIRE.md/MAPS.md) as stale.
- gitSha diff is the source of truth; mtime is a fast heuristic only.

## 4. Produce report

```
## Wayfire Report

Date: {date}
Index: specs/wayfire/ (generated at {manifest.generatedAt}, sha {manifest.gitSha})

Structural:
- MISSING-IN-INDEX: {n}  (list files)
- DEAD-INDEX: {n}        (list symbol md + last known location)

Staleness:
- STALE files: {n}       (list files)
- STALE symbols: {n}     (list symbols)

Verdict: FRESH / DRIFT / STALE

Recommendation:
- Run wayfinder to rebuild specs/wayfire/ (only if DRIFT/STALE)
```

## 5. Report only

- Present the report. Do NOT edit specs/wayfire/ or source.
- If DRIFT/STALE, recommend wayfinder; never fix the index yourself.

# Gotchas

- Read-only. Never write to specs/wayfire/ or source. Index regeneration is wayfinder's job.
- gitSha is authoritative for staleness; mtime can lie (touch, checkout). Use git diff when available.
- Use the same ignore list as wayfinder or you will false-flag build output and dependencies.
- MISSING-IN-INDEX is drift, not an error. Report and recommend wayfinder; do not delete or "fix".
- If .manifest.json is absent or malformed, staleness cannot be computed — say so and suggest wayfinder.
- No tables in any output. Bullet lists only.
