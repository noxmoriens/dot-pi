---
name: tasks-creator
description: >
  You must use this skill when creating or maintaining TASKS.md from
  SPECS.md requirements, breaking down a plan into tracked tasks, or when
  a project has no TASKS.md. Also use when user says "init tasks", "create
  tasks", "bikin tasks", or when starting execution phase.
---

# When to use

Use when:
- User says "create TASKS.md", "init tasks", "bikin tasks", "break down the spec"
- Project has `specs/SPECS.md` but no `specs/TASKS.md`
- Plan is approved and tasks need to be registered
- User says "update tasks" or "archive completed tasks"
- During the Execute gate (Phase Gates): "Tasks defined, dependencies resolved"

Do NOT use when:
- Only need to track runtime work items (use the `todo` tool instead)
- User is still in Debate or Planning phase — tasks come after plan approval
- User wants to edit SPECS.md (use specs-creator for initial, specs-update for compliance)

---

# Steps

## 1. Verify Context

Check for existing files:
- `specs/TASKS.md` — if exists, read current tasks before modifying
- `specs/SPECS.md` — must exist; tasks decompose requirements from spec
- `specs/PLAN.md` — if exists, tasks should map to planned work

If no `specs/SPECS.md` exists: stop. Tell user to create SPECS.md first. Tasks derive from requirements.

## 2. Read Requirements

Read SPECS.md. Identify all FR-NNN requirements with status:

- `High` priority = first Active batch
- `Medium` priority = next batch or Pending
- `Low` priority = Pending unless user specifies otherwise
- Already completed = Archive entry

Also check PLAN.md if it exists — tasks bridge spec requirements into execution steps.

## 3. Structure TASKS.md

Write to `specs/TASKS.md` with three sections:

```
# TASKS.md — Task Registry

## Active
Current work items being executed.

- TK-001: {short title}. Effort: {S/M/L}. Pri: {High/Med/Low}. Req: {FR-NNN}.
  {One line description of what this task produces and how to verify}

- TK-002: {short title}. Effort: {S/M/L}. Pri: {High/Med/Low}. Req: {FR-NNN}.
  {One line description}

## Pending
Future work, not yet started.

- TK-003: {short title}. Effort: {S/M/L}. Pri: {Med/Low}. Req: {FR-NNN}.
  Waiting on: {reason — dependency, approval, blocked item}

- TK-004: {short title}. Effort: {S/M/L}. Pri: {Low}. Req: {FR-NNN}.
  Waiting on: {reason}

## Archive
Completed or abandoned work.

- TK-001: {title}. Status: completed. Verified: {method}.
- TK-003: {title}. Status: abandoned. Reason: {why}.
```

Rules:
- Task IDs: TK-NNN sequential numbered
- Title: 3-7 words, action-oriented ("Implement login endpoint" not "Login")
- Effort: S (hours), M (day), L (multiple days)
- Priority: High/Medium/Low — maps to FR-NNN priority from spec
- Req: FR-NNN reference from SPECS.md. Every Active/Pending task must link to a requirement.
- One task = one deliverable. If a requirement needs multiple steps, split into multiple TK-NNN entries.
- Each Active task has a one-line description of what "done" looks like and how to verify.

## 4. Populate Sections

### Active
- First batch: the next work to execute
- Usually tasks for the first 1-2 FR-NNN requirements to implement
- Each task: ID, title, effort, priority, FR link, verification description

### Pending
- Remaining requirements not yet in Active
- Include the reason each is pending (dependency, blocked, waiting for approval)
- Partial ordering if dependencies exist

### Archive
- Start empty unless some FR-NNN are already verified complete
- Only keep the 5 most recent entries
- Never delete — mark abandoned with reason

## 5. Link to Execution

After TASKS.md is created, register Active tasks in the `todo` tool:

```
todo({ op: 'init', items: [
  { title: 'TK-001: ...', description: 'Req: FR-001. Effort: M. Pri: High.' },
]})
```
This bridges the static TASKS.md file to runtime tracking. The `todo` tool is the live execution tracker; TASKS.md is the persistent record.

---

# Maintaining TASKS.md

## When a task completes

1. Move from Active to Archive in TASKS.md
2. Mark done via `todo({ op: 'done', task: 'TK-001: ...' })`
3. Pull next task from Pending → Active (if any)

## When requirements change

1. Update SPECS.md first (via user direction — specs are immutable to agents)
2. Then update TASKS.md to reflect new/deleted/changed FR-NNN
3. Re-assign task IDs if scope changed significantly

## Archive maintenance

- Keep only the 5 most recent entries in Archive
- Older entries: delete from file (they live in git history)
- Abandoned tasks: keep with reason, only count toward 5-entry limit if user requests

---

# Gotchas

- TASKS.md and the `todo` tool serve different purposes. TASKS.md is the persistent task registry; `todo` is the runtime session tracker. Keep both in sync.
- Never delete tasks from TASKS.md — mark abandoned with reason. Deletion loses audit trail.
- Archive caps at 5 entries. Push older completed tasks out — they're still in git history.
- Every Active/Pending task MUST link to an FR-NNN. If it doesn't, the requirement isn't tracked.
- One task = one atomic unit. If a task description contains "and", split it.
- Effort estimates are rough: S (<4h), M (<1d), L (>1d). Don't overthink it.
- When moving tasks between sections, update both TASKS.md and the `todo` tool.
