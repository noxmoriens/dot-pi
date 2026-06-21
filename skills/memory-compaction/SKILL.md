---
name: memory-compaction
description: >
  You must use this skill when MEMORY.md (project or global) exceeds ~300-500
  tokens. Applies LRU-based score decay, re-ranks entries by architectural
  importance, consolidates up to 3 related items per cycle.
---

# When to use

Use when:
- Project `MEMORY.md` or global `MEMORY.md` exceeds ~300-500 tokens
- Agent detects memory bloat — too many entries, stale recents, low-value facts
- After a session where many new entries were added
- User says "compact memory", "clean up memory", "tidy MEMORY.md"

Do NOT use when:
- MEMORY.md is under 300 tokens
- Memory is brand new (just initialized)
- User is actively adding knowledge (let them finish first)

---

# Behavior

## 1. Trigger Check

Before running, measure token estimate:

```
Token estimate ≈ total chars in MEMORY.md / 4
```

If < 300 tokens: skip. Report "Memory under threshold, no compaction needed."
If ≥ 300 tokens: proceed.

Check BOTH project MEMORY.md and global MEMORY.md independently.

## 2. Score Decay — LRU

Every scored entry `[0.xx]` decays based on recency of access:

- Referenced this session: 0 (no decay)
- Last referenced 1-2 sessions ago: -0.10
- Last referenced 3-5 sessions ago: -0.20
- Not referenced in >5 sessions: -0.30

LRU tracking: look for entries NOT mentioned, used, or reinforced recently.
Entries without recent reinforcement have NO timestamp evidence → treat as LRU.

Rules:
- Floor at `[0.05]` — never decay below this
- `[0.05]` entries are eviction candidates (not automatically removed yet)
- Single session = single run of the agent

## 3. Re-rank by Classification

After decay, classify each entry into one of:

- Architecturally important: code structure, dependencies, project conventions, security rules, tool config. Score boost +0.10, never evicted unless replaced.
- Must persist: verified facts, critical references, active patterns. Keep unless contradicted.
- Elimination candidate: score ≤ 0.10 OR no recent reference OR speculative/uncertain. Flag for removal or merge.

Classification rules:
- Rules section entries default to "architecturally important"
- Facts with [0.95] score default to "must persist"
- Recents older than 2 sessions default to "elimination candidate"
- Explicit `[arch]` or `[core]` tag in content = architecturally important
- Agent may override based on context

Apply score adjustments:
- Architecturally important: +0.10 (cap at 0.95)
- Elimination candidate: no boost, eligible for removal

## 4. Compaction — Max 3 Related Items

Hard limit: max 3 items per compaction cycle.

Process:
1. Identify groups of RELATED entries:
   - Same topic/module (e.g., all entries about "tui", "mcp", "telegram")
   - Redundant/overlapping information
   - Rules that can be merged

2. For each group, consolidate into ONE entry:
   - New score = highest score among merged items (confidence wins)
   - Content = merged, deduplicated, concise
   - Classification = highest importance among merged items

3. Perform at most 3 compactions per run:
   - Pick the 3 most impactful groups
   - If fewer than 3 groups exist, compact all
   - Do NOT exceed 3 — partial compaction is better than over-consolidation

4. Removal:
   - Elimination candidates NOT merged into any group → remove
   - `[0.05]` entries → remove
   - Keep at least 1 entry per section (Rules, Facts, Recents) even if all are candidates

## 5. Post-Compaction Validation

After compaction:
- Re-estimate token count
- If still >500 tokens, note "Still above threshold — more compactions needed next session"
- If <300 tokens, report "Memory healthy"

---

# Output

After compaction, append a compact log entry to the Recents section:

```
- YYYY-MM-DD: memory compacted — [N] entries consolidated into [M], [K] removed. Score floor [0.xx]. [X] groups at max 3.
```

---

# Gotchas

- Hard cap 3 compactions per cycle. Do NOT exceed even if more groups exist.
- Never evict the last entry in a section. Each section (Rules, Facts, Recents) must have ≥1 entry.
- Architecturally important entries are sacred — do NOT merge them with low-value entries unless they overlap exactly.
- LRU is inferred from lack of reference evidence. If unsure, treat as "not recently referenced" (conservative).
- Score floor 0.05 — never go below. 0.05 entries = eviction candidates, removed at next compaction.
- Backup before compacting: if MEMORY.md > 500 tokens, read the full file before writing changes.
