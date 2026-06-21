---
name: specs-creator
description: >
  You must use this skill when user says "create SPECS.md", "init spec",
  "bikin specs", "start new project spec", or project has no SPECS.md.
  Creates SPECS.md once — never updates. Read-only after creation.
---

# When to use

Use when:
- User says "create SPECS.md", "init project specs", "bikin specs"
- New project with no `specs/SPECS.md`
- User wants to capture architecture decisions before coding
- After grill-me session, requirements are clear

Do NOT use when:
- SPECS.md already exists (immutable — use specs-resume)
- User wants to update spec (specs is immutable for agents)
- Task is trivial single-file script

---

# Steps

## 1. Verify No Existing Spec

Check if `specs/SPECS.md` exists. If yes:

```
SPECS.md exists and is immutable for agents.
Use specs-resume to orient, or specs-update to verify compliance.
```

Abort. Do not overwrite.

## 2. Gather Source Material

Read existing context:
- `AGENTS.md` — project rules and constitution
- `README.md` — project description
- `docs/` directory — any existing docs
- `git log --oneline -20` — recent activity
- Directory structure

If context thin: use grill-me skill to interview user. Must resolve:
- Problem being solved
- Target audience
- Key differentiator from alternatives
- Technical constraints (language, framework, infra)
- Architecture decisions already made

## 3. Write SPECS.md

Write to `specs/SPECS.md` with these sections:

```
# {Project Name}

## 1. Purpose & Problem
Problem being solved + target audience + what makes it different.

## 2. Requirements
### Functional
- FR-001: {description}. Priority: {High/Medium/Low}. Verification: {Test/Inspection/Analysis}.
- FR-002: {description}. Priority: {High/Medium/Low}. Verification: {Test/Inspection/Analysis}.
### Non-Functional
- Performance, security, scalability, availability targets.

## 3. Architecture Decisions
- {decision}: chosen over {rejected alternative}. Reasoning.

## 4. Constraints
- {constraint} — why this constraint exists, consequence if violated

## 5. Success Criteria
- [ ] Code validation
- [ ] Security validation
- [ ] Performance validation

## 6. Non-Goals & Out of Scope
- {explicitly excluded items}

## 7. Dependencies
- {external systems, teams, services}

## 8. Decision Log
- {date}: {decision}. Context: why.
```

Rules:
- Keep under 300 lines
- Purpose & Problem = 1-2 paragraphs
- Each FR-NNN has priority + verification method
- Constraints: what + why + violation consequence
- Architecture decisions: chosen + rejected + reasoning
- Success criteria: measurable, testable conditions
- Non-goals: prevent scope creep
- Dependencies: external only, not internal
- Decision Log: append-only, each entry = date + decision + context

## 4. First Commit

After writing:
- `git add specs/SPECS.md`
- `git commit -s -m "docs(specs): add SPECS.md"`
- Do NOT commit after every edit — one commit for the initial create

---

# Gotchas

- SPECS.md is immutable after creation. If user wants changes, they must tell agent to overwrite. Agent never updates on its own.
- One paragraph for Purpose. Not two. Not a bullet list.
- Constraints without violation consequences are not actionable. Every constraint needs "consequence if violated".
- Anti-patterns must include root cause. "This happened because X" — not just "don't do X".
- Decision Log is append-only. Never edit existing entries.
- Keep under 300 lines. If spec grows, user archives old decisions manually.
- This skill creates only `specs/SPECS.md`. Does NOT create TASKS.md — use tasks skill for that.
