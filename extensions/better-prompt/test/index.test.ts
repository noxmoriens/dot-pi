import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { loadWithPriority, splitPiDocs } from "../index.ts";

describe("loadWithPriority", () => {
  const testDir = "/tmp/better-prompt-test-priority";

  it("loads from project .pi/agent first when both exist", () => {
    const projectDir = join(testDir, "project", ".pi", "agent");
    const globalBase = join(testDir, "global");
    const globalDir = join(globalBase, ".pi", "agent");
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(globalDir, { recursive: true });
    writeFileSync(join(projectDir, "SYSTEM.md"), "project content");
    writeFileSync(join(globalDir, "SYSTEM.md"), "global content");

    const result = loadWithPriority("SYSTEM.md", join(testDir, "project"), globalBase);
    assert.strictEqual(result, "project content", "project wins");

    rmSync(testDir, { recursive: true, force: true });
  });

  it("falls back to global when project missing", () => {
    const projectDir = join(testDir, "project2");
    const globalBase = join(testDir, "global2");
    const globalDir = join(globalBase, ".pi", "agent");
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(globalDir, { recursive: true });
    writeFileSync(join(globalDir, "SYSTEM.md"), "global only");

    const result = loadWithPriority("SYSTEM.md", projectDir, globalBase);
    assert.strictEqual(result, "global only", "global fallback");

    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns empty string when neither exists", () => {
    const result = loadWithPriority("NONEXISTENT.md", "/tmp/empty-dir", "/tmp");
    assert.strictEqual(result, "");
  });
});

describe("splitPiDocs", () => {
  it("extracts pi docs section", () => {
    const base =
      "Some intro\n\nPi documentation (read only when asked about workflows):\n- Main docs: /path\n\n<project_context>stuff</project_context>";
    const result = splitPiDocs(base);
    assert.ok(result.includes("Pi documentation"), "extracts pi docs");
    assert.ok(!result.includes("<project_context>"), "stops before project_context");
  });

  it("returns empty when no pi docs", () => {
    const result = splitPiDocs("No docs here.");
    assert.strictEqual(result, "");
  });
});
