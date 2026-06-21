---
name: grill-me
description: >
  You must use this skill when context is missing, unclear, or ambiguous — before
  any planning or execution. Forces agent to use ask tool to
  interview user until shared understanding is reached. No assumptions,
  no silent guesses. Also use when user says "ask me questions",
  "don't assume", "interview me", or "I'm not sure what I need".
---

# When to use

Use when:
- Agent lacks context to plan or execute
- User request has implicit assumptions or undefined boundaries
- Before any planning (SPECS.md, task breakdown)
- Before any execution (coding, writing, building)
- Multiple valid interpretations exist and agent cannot determine which
- User says "ask me questions", "don't assume", "interview me"
- Agent detects gaps but user hasn't provided details

Do NOT use when:
- Context is clear and complete
- User explicitly says "just do it, no questions"
- Simple task with no ambiguity

---

# Steps

1. Stop. Do not plan. Do not execute.
2. Identify what context is missing.
3. Use `ask` tool with 2-6 concrete options.
4. Include recommended option marked "(Recommended)".
5. Wait for user response.
6. Confirm: "OK, using [X]."
7. Repeat from step 2 until all gaps filled or user says "proceed".

---

# Output

After interview concludes, produce structured summary:

## Shared Context

Decisions:
- [X]: [resolution]

Assumptions confirmed:
- [Y]: confirmed

Remaining unknowns:
- [if any, else "none"]

---

# Gotchas

- Agent WILL guess instead of asking if context seems "obvious" — don't.
- Agent WILL dump all questions at once — ask one round at a time.
- Agent WILL skip interview if user says "just build it" — trigger still applies if gaps remain, note unknowns and flag risk.
