---
name: docs-standardization
description: >
  You must use this skill when the user says 'standardize docs', 'create
  README', 'add contributing guide', or a project needs proper documentation
  structure. Covers README, CONTRIBUTING, CHANGELOG, and docs/ layout.
---

# When to use

- User says "standardize docs", "create README", "add CONTRIBUTING.md"
- User says "set up project docs", "add changelog", "document this project"
- New project with no documentation files at root
- Existing project with inconsistent or missing core docs files

Do NOT use when:
- Project has a dedicated docs site (Docusaurus, etc.) — that's a different skill
- User just wants a quick comment or one-off explanation
- SPECS.md doesn't exist yet (use specs-creator first — specs come before docs)

---

# Steps

## 1. Audit Existing Docs

Check which core files exist:
- `README.md` — project overview and entry point
- `CONTRIBUTING.md` — contribution guidelines
- `CHANGELOG.md` — version history
- `LICENSE` — legal terms
- `SECURITY.md` — security policy
- `CODE_OF_CONDUCT.md` — community standards
- `docs/` directory — detailed documentation

Report to user: which files exist, which are missing.

## 2. Create Missing Core Files

For each missing file, create using the template format below. Keep templates lean — 20-40 lines max. No bloated boilerplate.

### README.md

```markdown
# {Project Name}

{1-2 sentence description of what this project does and why it exists}

## Quick Start

```bash
{install command}
{basic usage command}
```

## Docs

{links to docs/ or spec files}
```

### CONTRIBUTING.md

```markdown
# Contributing

{how to set up dev environment, run tests, submit PRs}

See SPECS.md for project requirements and constraints.
```

### CHANGELOG.md

```markdown
# Changelog

## [Unreleased]
### Added
- {new features}
### Fixed
- {bug fixes}
```

## 3. Set Up docs/ Directory

If project needs detailed docs, create `docs/` with:

```
docs/
├── index.md              # Documentation landing page
├── getting-started.md    # Setup and onboarding
└── adr/                  # Architecture Decision Records
    └── adr-001-*.md      # Created via adr-creator skill
```

Only create sections that are needed. Do not create empty directories.

## 4. Link to Specs

If `specs/SPECS.md` exists, add a section in README:

```markdown
## Specs

- [SPECS.md](./specs/SPECS.md) — requirements and architecture
- [TASKS.md](./specs/TASKS.md) — task tracking
```

---

# File Standards

- Markdown only (`.md`). No PDF, no HTML.
- No tables. Bullet lists only.
- No bold/italic (`**` or `*`). Waste of tokens.
- One concept per file. Don't merge README and CONTRIBUTING.
- Internal links use relative paths: `./docs/guide.md`
- Preserve existing files. Never overwrite without user confirmation.

---

# Gotchas

- Do NOT touch SPECS.md or TASKS.md — those belong to the specs-driven workflow (specs-creator, specs-update).
- If SPECS.md doesn't exist yet, tell user to create specs first. Docs document the project; specs define it.
- README is the public face. Keep it concise. Move details to docs/.
- CHANGELOG is for users, not developers. List what changed, not how.
- Never create empty docs/ directories. Only create when there's actual content.
- docs/ structure should match the project's maturity. One-pager projects don't need docs/adr/.
