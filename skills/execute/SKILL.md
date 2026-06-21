---
name: execute
description: >
  You must use this skill when a plan exists with registered todos and the
  user says "execute", "start working", "implement", or "do the plan".
  Burns down each todo with verification before marking done — no
  re-planning, no re-research, no scope creep.
---

# When to use

Use when:
- User says "execute", "start", "implement", "do it", "work on the plan"
- A plan exists with registered todos (todos tool has items)
- User says "start from step N" or "work on todo N"
- User says "burn down these todos"

Preconditions (stop if not met):
- Plan exists (todos registered)
- First todo is actionable
- If not met: report "No plan/todos found. Run planning skill first."

---

# Steps

## Per Todo Workflow

### 1. Define Verification Criteria

Before implementing any todo, state:

```
Success looks like: [concrete condition]
Test: [how to verify]
```

Do NOT skip. This prevents false completion.

### 2. Lock

Call `todo({ op: 'start', task: 'todo content here' })`.

One todo at a time. Do not start a second until the first is done.

### 3. Execute

Implement exactly what the todo says. Nothing else.

- Not in the plan? Do not touch it.
- No scope creep. No "while I'm here" fixes.
- If blocked >2 minutes: stop and ask for guidance.

### 4. Cross-Check

Verify against the criteria from step 1:
- Exit code 0? Compiles? Tests pass?
- Re-read your edits for correctness
- Check the plan's Edge Case Register. Handle any triggered edge case immediately

### 5. Done

Call `todo({ op: 'done', task: 'todo content here' })`.

Move to next todo. Repeat.

---

## When Reality Does Not Match the Plan

If during execution you discover the plan is wrong (spec outdated, requirement changed, approach infeasible):

1. Note the deviation — what the plan said vs what reality demands
2. Log the decision — append to decision log:
   - Plan said: [original plan]
   - Actual: [what you did or need to do]
   - Reason: [why the plan was wrong]
3. Propose a revised approach — one concrete alternative with reasoning
4. Ask for approval — do not continue until user confirms

Do NOT silently deviate. Do NOT fix the plan and continue without logging.

---

## Final Report

When all todos are done (or execution stopped):

```
Done: N/N
Failed: N
Workarounds: N
Edge cases triggered: N
Deviations from plan: [list or "none"]
Decisions logged: [what changed and why]
```

---

# Gotchas

- One todo at a time: starting a second before the first is done means you lose context and introduce bugs.
- Verify before marking done: re-read the diff, check exit codes, run the relevant test. Do not rely on "it looks right".
- No scope creep: "while I'm here" changes break the plan. Note them in deviations, do not implement them.
- Stuck more than 2 minutes: ask. Spinning wastes tokens. Ask a specific question.
- Plan deviation must be logged: silent deviation is how codebases become undebuggable.
- If plan references a file that does not exist: stop. Do not create files the plan did not specify. Report the gap.

---

# Verification Criteria Examples

Bad: "Make sure it works" — too vague, cannot verify.
Good: "Success: POST /api/users returns 201 with user data. Verify: run curl and check status + body."

Bad: "Add error handling" — what errors? what response?
Good: "Success: invalid input returns 400 with descriptive message. Verify: send empty body, check 400 + error JSON."

Bad: "Refactor function" — no behavioral change criteria.
Good: "Success: existing tests pass with zero changes. Verify: run `npm test`, all green."
