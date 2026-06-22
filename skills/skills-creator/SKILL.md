---
name: skills-creator
description: >
  You must use this skill when the user wants to create a reusable agent skill,
  convert a workflow into a skill, or improve an existing SKILL.md.
  Covers skill creation from scratch, extraction from session traces,
  and format guidelines for SKILL.md structure.
---

# When to use

- User says "make a skill for [X]", "extract this workflow into a skill"
- User says "convert this into SKILL.md", "improve this SKILL.md"
- Sequence of steps repeated ≥2x in session
- User provides instructions they've been copy-pasting into chat

Do NOT use when:
- User just wants a one-off answer, not reusable skill
- Skill would duplicate existing one
- Task too generic (agent already knows it)

# Step by Step

## 1. Identify Scope

What triggers should activate this? Default: derive from user's description. Is it project-specific or reusable? Ask ONE question if unclear.

Scoping: Too narrow (one command) → generalize. Too broad (DB admin + querying + reporting) → split. Just right: coherent unit composable with other skills.

## 2. Determine Source Material

Priority: execution trace (steps just run) > user-provided instructions > project artifacts (scripts, Makefile) > conversation history (user corrections = gotchas).

If source thin: ask user for one concrete example.

## 3. Structure Directory

```
skill-name/SKILL.md          (required)
skill-name/scripts/          (optional executables)
skill-name/references/       (optional docs)
skill-name/assets/           (optional templates)
```

Simple skill (<20 lines): just SKILL.md. Complex: move details to `references/`.

### Helper Scripts

When the skill involves repetitive deterministic work — validation, parsing,
aggregation, schema checking, code generation — write a script in `scripts/`
instead of instructing the agent to do it from scratch every time.

Signals that work belongs in a script:
- Agent would write the same code inline across multiple runs
- Task is deterministic (same input → same output, no judgment needed)
- Task is tedious for an LLM but trivial for code (string manipulation,
  file parsing, regex, data transformation)

Reference scripts from SKILL.md with the full directory context:

```markdown
## Steps

1. Run the validation script:
   ```
   python scripts/validate_skill.py
   ```
   This checks all SKILL.md files in the skills directory for correct
   frontmatter format.

2. Fix any failures before proceeding.
```

Always include in SKILL.md:
- The script's purpose (what it checks/does)
- How to invoke it (python path/to/script.py)
- What the output means and what to do on failure
- Do NOT include the script's source code in SKILL.md. Reference it by path.

File organization:
```
skill-name/
├── SKILL.md          # references scripts/ by path
├── scripts/
│   ├── validate.py   # invoked as: python scripts/validate.py
│   ├── generate.py
│   └── README.md     # optional: dependencies, usage notes
├── references/
│   └── schema.md     # loaded into context as needed
└── assets/
    └── template.md   # output templates
```

## 4. Write SKILL.md

### Frontmatter

```yaml
name: skill-name        # lowercase, hyphens, match dir
description: >          # use > block scalar, NOT | or ""
  You must use this skill when [triggers]. [What it does, 1 sentence].
  Also use when [secondary triggers].
```

Rules:
- Use `>` block scalar (YAML folded block). Not `|` (literal block). Not inline string.
- Description must be ~40-90 tokens. Count before finalising or use the validation script.
- Start with "You must use this skill when" — authoritative, no ambiguity.
- Focus on user intent, not implementation. Include 3-5 trigger keywords.
- No hedging. No "can be used for" or "optionally". Direct commands only.

### Body Structure

When to use (REQUIRED): positive + negative examples. Write triggers as users speak, not technical jargon.

Steps: concrete, actionable procedures. For fragile ops: be prescriptive. For flexible tasks: explain why.

Gotchas (HIGH VALUE): things agent WILL get wrong. Source: user corrections, project quirks, non-obvious edge cases.

Templates: if output format matters, provide concrete example.

### Output Rules

- SKILL.md ≤500 lines, ≤5000 tokens
- No tables — use bullet lists only
- Avoid `**` (bold) — wastes tokens. Use markdown headers only.
- Default over menu — pick one approach, mention alternatives briefly.
- Gotchas are gold — capture every correction.

## 5. Quality Checklist

- name matches directory name
- description starts with "You must use this skill when"
- description uses `>` block scalar (not `|` or inline)
- description is ~40-90 tokens (count them, or run validation script)
- Steps concrete and actionable
- Gotchas ≥1 thing agent WOULD get wrong
- No generic knowledge (agent knows what HTTP is)
- Coherent scope — not too narrow/not too broad
- Helper scripts extracted for deterministic work (if applicable)

## 6. Verify and Deliver

### Verify Description

Count tokens in the description field. If >43 tokens, trim. If <25 tokens,
the skill is underspecified — add more trigger context.

Confirm with user: "This skill will trigger when user says [keywords]. "
"Does that cover what you need?"

### Run Validation Script

Run the validation script on the new skill:
```
python scripts/validate_skill.py <target>/<name>
```

Fixes any violations reported before proceeding.

### Verify Description

Count tokens in the description field manually or via script output.
Target: ~40-90 tokens. Confirm with user:
"This skill will trigger when user says [keywords]. Does that cover what you need?"

### Verify Output

Run a test prompt through the skill manually. Check:
- It triggers correctly (agent loads the skill)
- It produces the expected output
- Gotchas catch real mistakes

Fix any issues found during verification.

### Deliver

Tell user: skill saved at `<target>/<name>/SKILL.md`. Auto-triggers based on
description. If description needs tuning, edit trigger keywords.

# Gotchas

- Token count is the most common failure. ~40-90 is the target. Count before writing or use the validation script.
- Agents default to inline strings or `|` block scalar. Enforce `>`.
- Description is the trigger mechanism. Hedging or vague triggers cause undertriggering.
- New skills need a test run. A skill that looks correct on paper can fail in practice.
- Scripts in `scripts/` must be referenced by path in SKILL.md steps. If the agent can't find the script path, it won't use it.

# Critical Rules

- Do NOT write skills for tasks agent already handles well.
- Do NOT include obvious instructions — add only project-specific context and non-obvious edge cases.
- Extract deterministic work into scripts/. Do not make the agent reinvent the same logic.
- Keep frontmatter description between ~40-90 tokens. Below 40 = underspecified, above 90 = wastes context.
- Run `python scripts/validate_skill.py <skill-dir>` after creating or modifying any skill.
