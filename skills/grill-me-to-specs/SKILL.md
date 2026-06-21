---
name: grill-me-to-specs
description: >
  You must use this skill when the user wants a complete SPECS.md for a new
  feature, project, or system. Uses ask tool with multiple choice
  options to interview the user through all spec dimensions — project type,
  problem scope, architecture, data, UI, non-functional requirements — then
  writes the spec. Also use when user says "create specs", "write a spec",
  "plan this project", "I need a PRD", "document this feature", or
  "design this".
---

# When to use

Use when:
- User says "create specs", "write a spec", "init spec"
- New feature or project needs formal specification before implementation
- Requirements are vague and need structured interviewing
- After a "let's build X" statement with undefined scope
- User says "plan this project", "document this feature", "design this"

Do NOT use when:
- SPECS.md already exists (immutable — use specs-resume to orient)
- User explicitly asks for quick task breakdown (use planning skill)
- User says "just build it, no spec needed"
- Context is fully clear and complete in the message

# Steps

## 1. Check for existing spec

Run: `ls specs/SPECS.md 2>/dev/null`

If exists: abort. Notify user: "SPECS.md already exists. Use specs-resume to orient or ask me what to do."
Do not overwrite.

## 2. Grill via ask

Interview the user through each dimension below, one round at a time.
Each round: call `ask` with 2-6 concrete, distinct options.
Always mark your recommended option with "(Recommended)".
Wait for user response before moving to next round.

After each answer, update the growing spec section-by-section (see step 3 format).
Do not accumulate in memory — write to file incrementally.

### Round 1 — Project Identity

Ask: "What kind of project is this?"
Options template (adapt to context):
- "Web application — SaaS, dashboard, or consumer web app"
- "CLI tool — terminal-based, no GUI"
- "Library / package — reusable module published to npm/bun"
- "REST or GraphQL API — backend service, no frontend"
- "Static site / documentation — content-driven, no dynamic backend"
- "Chrome extension — browser-based tool"

Follow-up question in a later ask call if needed:
"Project name. One word, kebab-case."

### Round 2 — Problem & Scope

Ask: "Who is the target audience and what problem does this solve?"
Options template:
- "Developer tool — for engineers, solves a dev workflow problem"
- "Consumer app — end users, solves a personal productivity or entertainment need"
- "Enterprise / internal tool — for a specific organization, solves business ops"
- "API or platform service — consumed by other software, not end users"
- "Content / knowledge base — documentation, guides, reference material"

Then ask ONE question about scope boundaries:
"Scope: monolith first or modular from day one?"
Options:
- "Monolith first — ship fast, extract later (Recommended for MVPs)"
- "Modular monolith — clear internal boundaries, single deploy unit"
- "Microservices — independent deploy units from day one"

### Round 3 — Architecture & Stack

First, check project directory for existing config files:
- `ls package.json tsconfig.json bun.lock vite.config.* 2>/dev/null`
- `ls Dockerfile docker-compose.yml 2>/dev/null`

If configs exist, adapt options to match. If not, ask fresh.

Ask: "Target runtime and language?"
Options:
- "Bun + TypeScript — fastest runtime, good DX (Recommended)"
- "Node.js + TypeScript — most compatible, widest ecosystem"
- "Node.js + JavaScript — simpler, no compile step"
- "Go — compiled binary, good for CLI or API"

Ask: "Frontend approach?"
Options:
- "SSR (React/Vue + server rendering) — good for SEO, content sites"
- "SPA (React/Vue + client-side render) — app-like interactions"
- "Static site generator — markdown-driven, docs or blogs"
- "Minimal / htmx — server-rendered HTML, sprinkle JS"
- "No frontend — CLI tool, library, or API only"

Ask: "Database and storage?"
Options:
- "SQLite / Turso — simple, file-based, good for single-server (Recommended for prototypes)"
- "PostgreSQL — full-featured relational, best for production apps"
- "MySQL / MariaDB — relational, widely hosted"
- "In-memory / JSON file — no persistence, cache-only, prototyping"
- "No database — stateless service or client-only app"

### Round 4 — Data & Interfaces

Ask: "Does this need user accounts / authentication?"
Options:
- "Yes — email/password + OAuth (GitHub, Google)"
- "Yes — API key based (machine-to-machine)"
- "No — fully public, no auth"

Ask: "API style?"
Options:
- "REST — standard CRUD endpoints (Recommended)"
- "GraphQL — flexible queries, good for complex data graphs"
- "WebSocket / real-time — persistent connection, live updates"
- "No API — CLI tool or library with direct function calls"

### Round 5 — Non-functional & Release

Ask: "Deployment target?"
Options:
- "Self-hosted VPS — Docker on a VPS (DigitalOcean, Hetzner)"
- "Serverless / edge — Cloudflare Workers, Lambda, Deno Deploy"
- "PaaS — Railway, Fly.io, Heroku, Render"
- "Desktop / local — runs on user machine, no hosting"
- "npm / package registry — distributed via package manager"

Ask: "Performance requirements?"
Options:
- "Low traffic / personal use — <100 requests/min, single user"
- "Moderate — <1000 requests/min, small team"
- "High — 10k+ requests/min, production multi-tenant"
- "Unsure — optimize later, ship clean code"

## 3. Write SPECS.md

Write to `specs/SPECS.md` using the pi-osiris spec format:

```markdown
# {Project Name}

## 1. Purpose & Problem
{problem statement, target audience, differentiator. 1-2 paragraphs.}

## 2. Requirements

### Functional
- FR-001: {description}. Priority: {High/Medium/Low}. Verification: {Test/Inspection/Analysis}.
- FR-002: {description}. Priority: {High/Medium/Low}. Verification: {Test/Inspection/Analysis}.

### Non-Functional
- Performance: {targets}
- Security: {auth, encryption requirements}
- Reliability: {uptime, error handling}

## 3. Architecture Decisions
- {decision}: chosen over {rejected alternative}. {reasoning}.

## 4. Constraints
- {constraint} — {why it exists}. Consequence: {what happens if violated}.

## 5. Success Criteria
- [ ] {measurable condition}
- [ ] {measurable condition}

## 6. Non-Goals & Out of Scope
- {explicitly excluded items}

## 7. Dependencies
- {external systems, services, teams}

## 8. Decision Log
- {date}: {decision}. Context: {why}.
```

Rules:
- FR-001 starts at 1, sequential
- Priority: High = blocking, Medium = important, Low = nice-to-have
- Verification: Test = automated test, Inspection = manual review, Analysis = design review
- Keep under 300 lines
- Decision Log is append-only

After writing, show user the file and ask: "Review and confirm, or I'll adjust."

## 4. Commit (optional)

If user confirms and project has git:
```
git add specs/SPECS.md
git commit -s -m "docs(specs): add SPECS.md"
```

# Gotchas

- Agent WILL guess project type instead of asking — use ask every time. No silent assumptions.
- Agent WILL batch multiple questions into one ask call — keep it to ONE question per call. The tool supports multiple questions per invocation but that defeats the grill-me purpose here.
- Each ask call must have 2-6 concrete options. Never leave options blank or vague like "Other — tell me more."
- Always mark your recommendation."(Recommended)" on your preferred option.
- If user's answer doesn't match any option, they can type freely — capture that answer and adapt the spec accordingly.
- After the interview, write the spec immediately. Do not ask "shall I write it now?" — they asked for spec, write it.
- Inline write as you go — write sections to the file after each round, not all at once at the end.
- If user asks with non-English terms, respond in English and match their intent, not their language.
- SPECS.md is immutable after creation for agents. First write is the only write. After that, only user can request changes.
- Keep spec under 300 lines. If project is large, keep decisions in ADRs instead of bloating the spec.
