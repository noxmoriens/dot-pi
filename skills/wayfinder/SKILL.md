---
name: wayfinder
description: >
  You must use this skill when user says "build codebase map", "index the code",
  "update wayfire", "generate wayfire", "codebase checkpoint", or wants a
  navigable index of functions and classes across a project. Generates
  specs/wayfire/ (MAPS.md, WAYFIRE.md, class/*.md, function/*.md) by running
  cartographer then extracting symbols per language.
---

# When to use

Use when:
- User says "build codebase map", "index the code", "update wayfire", "generate wayfire", "codebase checkpoint"
- User wants an AI to navigate a large or unfamiliar codebase without reading every file
- Before onboarding, refactor planning, or briefing another agent with project context

Do NOT use when:
- There is no codebase to index (empty project)
- User only wants a one-off file lookup (use read/grep)
- specs/wayfire already exists and user only wants to check it is fresh (use wayfire)

# Steps

## 1. Resolve scope

- Accept an optional target path argument. Default: repository source root.
- Exclude the ignore list: node_modules, .git, dist, build, .next, out, coverage, vendor, *.min.js
- If the user gave a path, index only that subtree.

## 2. Generate MAPS.md via cartographer

- Launch the cartographer subagent (Agent tool, type cartographer) with the resolved scope.
- Instruct it to produce an annotated directory tree plus a per-module function index with signatures and file:line references, written to specs/wayfire/MAPS.md.
- cartographer defaults to specs/MAPS.md. If it writes there instead, move the file: `mv specs/MAPS.md specs/wayfire/MAPS.md`.
- If specs/wayfire/ does not exist yet, create it before moving.

## 3. Build the symbol extractor

- Read references/extractor-tutorial.md for the per-language extraction recipe.
- Detect languages present in scope.
- Pick an extractor per language: tree-sitter grammar preferred; TypeScript/JavaScript via the typescript compiler API; regex fallback for trivial cases.
- For each source file extract:
  - classes: name, signature, file:line, members, purpose (from doc comment, or "undocumented")
  - functions: name, signature, file:line, params, purpose (from doc comment, or "undocumented")
- Emit one markdown file per symbol:
  - specs/wayfire/class/<SanitizedName>.md
  - specs/wayfire/function/<SanitizedName>.md
- Sanitize names for filenames: keep alphanumerics, strip path separators; append a short hash on collision.

## 4. Write WAYFIRE.md root index

- One bullet list grouped by module (top-level folder), linking each symbol md and MAPS.md.
- Use relative links only. No tables.
- Each entry: link to the md, plus file:line and a one-line purpose.

## 5. Write .manifest.json

- Capture: gitSha (git rev-parse HEAD), generatedAt (current date), and per indexed source file: { mtime, size }.
- This is the staleness baseline wayfire compares against.

## 6. Report

- Print counts: modules, classes, functions, files indexed. Point the user to specs/wayfire/WAYFIRE.md.

# Gotchas

- No tables anywhere in output md (project rule). Bullet lists and links only.
- Never write index files into the source tree. Everything lives under specs/wayfire/.
- cartographer produces MAPS.md; do not also hand-roll the tree. Reuse its output.
- Mark purpose "undocumented" when no doc comment exists. Do not invent behavior.
- Sanitize symbol filenames. Collisions or slashes break the index silently.
- .manifest.json must be valid JSON that wayfire parses. gitSha must reflect generation time.
- Large codebases: MAPS.md can get big. If unwieldy, split per top-level module into specs/wayfire/maps/<module>.md and link from WAYFIRE.md.
