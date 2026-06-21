---
name: memory-creator
description: >
  You must use this skill when MEMORY.md is missing, when the user says "create memory file" or "init memory", when memory context is empty, or when sections are missing from an existing file. Creates or repairs MEMORY.md with Rules, Facts, and Recents sections.
---

# When to use

Use when:
- `cat MEMORY.md` fails — file doesn't exist
- User says "create memory file", "setup project memory", "init memory"
- File exists but has no Rules/Facts/Recents sections

Do NOT use when:
- MEMORY.md already exists with correct structure

# Steps

1. Check if file exists — `cat MEMORY.md` for project, `cat ~/.pi/agent/MEMORY.md` for global
2. If missing or empty — `write` the Full Template below
3. If exists but missing sections — `edit` to append missing headings + frontmatter
4. Add initial entries — `edit` the file, append bullets under relevant section

# Template

```markdown
---
version: osiris-mem-v1
format:
 - Rules
 - Facts
 - Recents
---

# Rules

# Facts

# Recents
```

# Gotchas

- Global MEMORY.md (`~/.pi/agent/MEMORY.md`) only created when user explicitly asks
- No strict validation on number of entries — just keep the sections intact
- Update with `edit` or `write` tools, not memory-specialized tools
- Frontmatter must stay as the first line. Sections can be in any order
