---
name: bun-workspace-bootstrap
description: >
  You must use this skill when setting up a Bun monorepo, adding workspace
  packages, or fixing "Could not resolve: @scope/pkg" errors during build.
  Covers workspace config, install order, path resolution, and common pitfalls.
---

# When to use

- Creating new Bun monorepo with workspace packages
- Adding `packages/*` to root `package.json` workspaces
- Getting `Could not resolve: @scope/pkg` during `bun build` or `bun run`
- Workspace symlinks missing in `node_modules/@scope/`
- Build works in dev but fails in CI

Do NOT use when:
- Single-package project (no workspaces needed)
- npm/pnpm/yarn monorepo (this is Bun-specific)

---

# Steps

## 1. Root package.json structure

```json
{
  "name": "@scope/mono",
  "private": true,
  "workspaces": ["packages/*"],
  "dependencies": {
    "@scope/runtime": "workspace:*"
  }
}
```

Rules:
- `workspaces: ["packages/*"]` — Bun auto-discovers all packages under `packages/`
- Root MUST list workspace packages as `workspace:*` deps — this creates symlinks in `node_modules/`
- Without root dep: `bun install` succeeds but `@scope/pkg` won't resolve

## 2. Package package.json exports

Each workspace package MUST point to source, not dist:

```json
{
  "name": "@scope/runtime",
  "main": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts"
    }
  }
}
```

Why: `bun run` reads source directly. `bun build` bundles from source. Pointing to `./dist/` breaks dev mode (dist doesn't exist yet).

## 3. Import rules

- Consumers import from `@scope/pkg` root only
- Root `src/index.ts` must re-export everything: `export * from './foo/bar.js'`
- NEVER import deep subpaths like `@scope/pkg/src/foo/bar.js` — breaks during `bun build`
- Within the same package: use relative imports (`./foo.js`)

## 4. Install + verify sequence

```bash
bun install        # creates node_modules/@scope/pkg -> ../../packages/pkg
bun test           # verify tests pass
bun run build      # verify bundle succeeds
```

If `bun install` says "Workspace not found":
- Check package has `package.json` at root
- Check path in `workspaces:` array matches actual dir

If `bun build` says "Could not resolve: @scope/pkg":
- Root `package.json` missing `@scope/pkg: workspace:*` dep
- Package `main`/`exports` points to `./dist/` instead of `./src/`

## 5. Plugin dirs are NOT workspaces

Plugin dirs (`plugins/providers/`, `plugins/skills/`) should NOT be in root `workspaces:` array. They are loaded via jiti at runtime, not bundled.

Each plugin manages its own deps with `bun install` inside the plugin dir.

---

# Common Pitfalls

- Pinning workspace versions: `"@scope/pkg": "1.0.0"` breaks symlinks. Use `workspace:*` always.
- Deep subpath imports: `@scope/pkg/src/foo` works in dev (Bun resolves from source) but fails in `bun build`. Import from root only.
- Missing root deps: workspace auto-discovery finds packages, but symlinks only created for deps listed in root `package.json`.
- Dist in main field: `"main": "./dist/index.js"` breaks `bun run` (no dist yet). Always `./src/index.ts`.
- Plugin dirs in workspaces: jiti plugins have their own `node_modules/` and resolution. Including them in workspace `packages/*` causes conflicts.

---

# Gotchas

- Bun workspace resolution differs from npm/pnpm. Errors that look like missing packages are often wrong workspace config.
- The root dep with `workspace:*` is the most commonly missed step. Without it, symlinks never create.
- Plugin dirs are NOT workspaces. Adding them to `workspaces:` breaks jiti resolution.

---

# Verification

After bootstrap, this must all pass:

```bash
bun install                    # no "Workspace not found" errors
bun test                       # all tests pass
bun run build                  # bundle + compile succeed
ls node_modules/@scope/        # symlinks to ../../packages/pkg exist
```
