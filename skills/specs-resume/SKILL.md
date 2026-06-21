---
name: specs-resume
description: >
  You must use this skill when user says "resume", "orient me",
  "what's the status", "mau mulai dari mana", "where we at",
  or at session start for existing projects. Read-only session orientation.
---

# When to use

Use when:
- User says "resume project", "orient me", "where we at"
- Starting new session on existing project with specs
- User asks "what should I work on?"
- "Mau mulai dari mana"

Do NOT use when:
- No SPECS.md exists (use specs-creator first)
- User wants to create or edit files (use other skills)
- Project is one-time or throwaway

---

# Steps

## 1. Load Memory

Read global MEMORY.md and project MEMORY.md. Capture:
- Rules (stable patterns)
- Facts (references, locations)
- Recents (unconsolidated events)

## 2. Read Spec Files

Read `specs/SPECS.md` and `specs/TASKS.md`.

From SPECS.md, extract:
- Project purpose (1 sentence summary)
- Active constraints
- Recent decision log entries

From TASKS.md, extract:
- Active sprint: number, title, status, description
- Tasks: total, done (checkbox checked), remaining (checkbox unchecked)
- Blocked tasks (status: pending)
- Archived items count

## 3. Check Session State

- `todo({ op: 'view' })` — any in-session tasks remaining?
- `git log --oneline -10` — recent commits

## 4. Present Summary

Format:

```
## {Project Name}

Purpose: {1 sentence}

{Active sprint info}

Tasks: {X} total, {Y} done, {Z} remaining
Blocked: {N} — {list blocked task titles}

Recent commits:
- {last 3-5 commits}

Memory: {1 line highlights}
```

Then ask: "Mau mulai dari mana?"

## 5. Route to Next Action

Based on user response:
- "lanjut task" → use execute skill
- "ubah sesuatu" → use planning skill
- "cek compliance" → use specs-update skill
- "bikin TASKS.md" → use tasks skill

---

# Gotchas

- 100% read-only. Do NOT create, edit, or delete any files during resume.
- If user says "update spec" during resume — refuse. SPECS.md is immutable for agents. User must tell agent to overwrite.
- If TASKS.md missing — report "No TASKS.md found. Use tasks skill to create."
- If SPECS.md missing — abort resume, recommend specs-creator.
- Keep summary short. User wants orientation, not full file dump.
- Memory loading is required. Do not skip.
