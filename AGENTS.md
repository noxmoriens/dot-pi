# AGENTS.md

> **Persona and Core Principles** are defined in `APPEND_SYSTEM.md`. This file covers workflow, constraints, and communication.

---

## Workflow

### Session Start — Fresh Context

When starting in a new or cold context, always establish context **before** any code changes:

1. **Check for specs.** Look for `specs/SPECS.md`. Read it for requirements, constraints, and the active sprint.
2. **Check MEMORY.md.** Read for persistent project context, references, and past decisions.
3. **Check the task list.** Tasks are organized as **Sprints**, not arbitrary to-do lists. Understand what sprint is active and what is pending or archived.
4. **Explore the codebase.** Do a quick reconnaissance — language, framework, structure, key entry points. Build a mental map. Do not dive into implementation.

Only proceed once context is established.

### Per-Task Process

Every feature, fix, or change follows these eight steps in order.

#### Step 1 — Understand

Explore the relevant parts of the codebase to understand the big picture. Read files that will be impacted. If scope is unclear, use `find`, `grep`, or explore to map dependencies and data flow.

**Do not jump to code.**

#### Step 2 — Discuss

Align with the user through conversation or explicit questions.

- If the request is ambiguous, **ask**. Do not assume.
- If the request conflicts with specs or MEMORY.md, **flag it**.
- If multiple valid approaches exist, outline trade-offs briefly and let the user decide.

**Do not infer requirements silently.**

#### Step 3 — Plan

Break the work into tracked tasks and organize them under the current **Sprint**.

- Each task = one atomic unit of work (e.g. *"Add validation to login form"*, not *"Build auth"*).
- Order tasks by dependency — foundations first.
- Present the task list to the user for review.

#### Step 4 — Review Tasks

**Stop here.** The user reviews, adjusts, reorders, and adds missing items. Do not begin execution until the task list is confirmed.

#### Step 5 — Execute

Work through each task in order. For each task:

1. Read relevant files if not already loaded.
2. Write or edit code — for each piece, run the decision stack: **MUST → EXIST → BREAK → TIGHT → SHIP** (defined in `APPEND_SYSTEM.md`).
3. Run linters and type checks (`bun run lint`, `bun run format`, `cargo clippy`, etc.).
4. Commit with conventional commits and signed messages.

**Do not move to the next task until the current one passes all checks.**

#### Step 6 — Self Code Review

After all tasks are complete, audit everything you just wrote. Be critical:

- Does the code meet the requirements from Step 2?
- Are there breaking changes, edge cases, or regressions?
- Does the code follow project conventions (error handling, naming, structure)?
- Are there `TODO`, `FIXME`, or debug artifacts left behind?

> **Critical: No code changes during this phase.** You are reviewing only. If you find bugs, issues, or improvements — log them. Do not fix them.

#### Step 7 — Report Findings

Report what you found during the code review to the user:

- Bugs or issues discovered.
- Deviations from the original plan.
- Suggestions for the next sprint.

Update `specs/TASKS.md`:
- Move completed tasks from Active to Archive.
- Create a **new Sprint** for any bugs found — do not fix them in the current sprint.
- Add newly discovered work to Pending.

#### Step 8 — Deliver

Provide a comprehensive final summary:

- What was implemented.
- What lints, checks, and tests passed.
- Any bugs or issues found (and assigned to the next sprint).
- What is coming next in the pipeline.

---

## Hard Constraints

These are non-negotiable.

- **No mid-review fixes.** Bugs found during code review → log them, assign to the next sprint. Do not fix them in the current execution phase.
- **No silent assumptions.** If you do not know, ask. Do not infer requirements.
- **Specs are the source of truth.** If code and specs disagree, stop and ask.

---

## Communication

- **Do not use emoji or tables. Use bullet points instead.**
- **Be quiet.** Speak only when you have something to say, and be precise.
- **No flattery.** Do not flatter, hype, or self-congratulate. State facts.
- **Disagree with logic.** When you disagree, explain why with data or logic — not authority.
- **Keep it short.** If an explanation cannot be short, the thing being explained needs simplification.
- **Write for a junior engineer.** No clever tricks. No unnecessary abstractions. No "smart" one-liners.
