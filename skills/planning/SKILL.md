---
name: planning
description: >
  You must use this skill when the user says "plan this", "break this down", "make a plan for", "decompose [task]", or when a complex task needs structured decomposition before execution. Researches, analyzes, and decomposes into atomic steps with todos. Read-only.
---

# When to use

Use when:
- User says "plan this", "make a plan", "break down [task]"
- User says "decompose", "what are the steps for", "how should I approach"
- A complex multi-step task needs structured decomposition before execution
- Before any significant implementation that needs review before coding

Do NOT use when:
- The task is trivial and can be done in one step
- The user explicitly wants to start coding immediately
- You are in execute mode (use execute skill instead)
- User just wants information (use research/deepresearch instead)

---

# Steps

## 1. Explore & Context-Gather

Scan the project to understand what exists:
- `specs/SPECS.md` and `specs/TASKS.md` if they exist — constraints and goals
- Directory structure, config files, source layout
- Git log (`git log --oneline -20`) for recent context
- Current session todos via todo tool

If requirements are vague: ask ONE clarifying question before proceeding.

## 2. Decompose

Break the problem using SCQ framework (Situation, Complication, Question):

1. Situation — what is the current state? What exists?
2. Complication — what is wrong, missing, or needs change?
3. Question — what exactly needs to be done?

Then MECE-decompose into 2-3 levels:
- Non-overlapping sub-problems
- List assumptions with test criteria (how to verify each assumption)
- Edge cases and risks per sub-problem
- Identify what needs research vs what is known

## 3. Research Gaps

For each unknown or uncertain sub-problem:
- If complex domain: spawn subagent with `deepresearch` skill
- If simple: web search, read docs, or scan code directly
- Validate or reject hypotheses. Collect evidence with sources

Do NOT skip this step. Assumptions without validation cause rework.

## 4. Produce Atomic Plan

Break into steps. ONE step = ONE concrete change:

```
Step: [action verb] [what] at [file path]
  Context: why this change
  Verify: how to confirm it works
  Edge cases: what could go wrong
```

Rules:
- Edit 3 files = 3 steps. Do not group.
- Each step must be independently verifiable.
- Include an Edge Case Register: list edge cases with detection + response per step.
- List impacted files grouped by: modify / create / read / risk.

## 5. Register Todos

Call `todo({ op: 'init', items: [...] })` with one todo per step.

Each todo:
- `title`: under 7 words, describes the specific change
- `description`: file path, action, verify condition

## 6. Present

2-3 sentence summary:
- What the plan covers
- How many steps/todos
- State: "Plan and todos ready for execution."

---

# Gotchas

- Do not group changes: editing 3 files is 3 steps. Grouping hides dependencies and makes verification harder.
- Do not skip research: assumptions you validate are worth 10x assumptions you guess.
- Plan is read-only: do NOT write code or edit files during planning. If you catch yourself about to edit, stop.
- If specs/SPECS.md exists, read it first: the constraints there may invalidate your approach.
- Vague requirements: ask once, do not guess. One targeted question unblocks the plan.
- Edge cases are not optional: every step must have at least consideration of what could go wrong.

---

# Output Format

```
## Plan: [Title]

Steps: N
Impacted: N files (N modify, N create, N read)

1. [Step title]
   File: [path]
   Action: [what to do]
   Verify: [how to confirm]
   Edge: [what could go wrong]

Todos registered via todo tool.
```
