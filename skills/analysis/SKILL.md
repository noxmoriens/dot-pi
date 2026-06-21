---
name: analysis
description: >
  You must use this skill when working with brownfield projects, when the
  user asks "map the codebase", faces ambiguous problems needing systematic
  breakdown, or wants characterization tests before refactoring. Covers
  codebase analysis, deep thinking, char testing.
---

# When to use

- Before planning changes in unfamiliar code — map structure, dependencies, implicit contracts
- User says "analyze this", "break this down", faces ambiguous multi-dimensional problems
- User needs comprehensive research with evidence-based findings and source grading
- Before refactoring — generate characterization tests to lock current behavior
- User says "refactor this", "clean this up", "modernize this module"

Do NOT use when problem is simple, plan already exists, code has comprehensive tests, or user just wants a quick answer.

---

# Steps

## 1. Codebase Analysis

Scan directory structure. Map module boundaries and responsibilities. Trace dependency graph — flag circular dependencies as critical. Identify implicit contracts (hardcoded URLs, assumed schemas). Detect technical debt (TODO density, dead code, large files). Extract observed architecture vs docs. Synthesize artifact: structure → module map → dependency graph → contracts → debt → risks.

## 2. Deep Thinking

Frame via SCQ: Situation, Complication, Question. MECE-decompose into exclusive categories. Strip assumptions via First Principles. Form falsifiable hypotheses. Tree-of-Thought on high-impact branches. Synthesize: problem tree with edge cases and next steps.

## 3. Deep Research

Define primary question + 2-5 MECE sub-questions. Run 3-5 searches per sub-question. Grade sources: A (official/peer-reviewed), B (industry/technical blogs), C (forums), D (preprints/marketing). Deduplicate by best grade + recency. Report confidence: HIGH (≥2 A or 1 A + 2 B), MODERATE (1 A or ≥2 B), LOW (single C/D), INSUFFICIENT.

## 4. Characterization Testing

Identify target. Analyze interface (inputs, outputs, state, side effects). Generate tests: happy path → edge inputs → error cases → state-dependent → boundary values. Lock known bugs with `// KNOWN BUG` comments. All tests must pass against current code. Flag fragile tests (DB, time, network).

---

# Gotchas

- Code is truth. Do not trust README or ARCHITECTURE.md.
- Do not skip SCQ. Jumping to decomposition solves the wrong problem.
- Do not invent citations. Every reference must be collected in Phase 2.
- Characterization tests lock what code DOES, not what it SHOULD do. Do not change behavior.
- Falsifiable hypotheses only. First 2-3 "why" layers are still assumptions.
- Circular dependencies block refactoring until cycle is broken.
- >10 edge cases means MECE decomposition is wrong.
- This skill produces analysis artifacts — pass to planning, not execution.
