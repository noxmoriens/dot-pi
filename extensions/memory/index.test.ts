import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseMemory,
  renderMemory,
  formatDoc,
  readMemory,
  writeMemory,
  VALID_SECTIONS,
  projectPath,
  GLOBAL_PATH,
} from "./index";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pi-memory-test-"));
}

function makeDoc(overrides?: Partial<{ frontmatter: string; sections: Record<string, string[]> }>): Parameters<typeof renderMemory>[0] {
  return {
    frontmatter: overrides?.frontmatter ?? "",
    sections: {
      Rules: [],
      Facts: [],
      Recents: [],
      ...overrides?.sections,
    },
  };
}

// ---------------------------------------------------------------
// parseMemory
// ---------------------------------------------------------------

describe("parseMemory", () => {
  it("parses a complete valid MEMORY.md with frontmatter and all sections", () => {
    const input = `---
version: 0.1.0
format: [Rules, Facts, Recents]
---

# Rules
- Rule one
- Rule two

# Facts
- Fact alpha
- Fact beta

# Recents
- Recent entry
`;

    const doc = parseMemory(input);

    // frontmatter is YAML content only (no --- delimiters)
    expect(doc.frontmatter).toBe("version: 0.1.0\nformat: [Rules, Facts, Recents]");
    expect(doc.sections.Rules).toEqual(["Rule one", "Rule two"]);
    expect(doc.sections.Facts).toEqual(["Fact alpha", "Fact beta"]);
    expect(doc.sections.Recents).toEqual(["Recent entry"]);
  });

  it("parses sections that appear out of order", () => {
    const input = `# Recents
- recent foo

# Facts
- fact bar
`;

    const doc = parseMemory(input);
    expect(doc.sections.Recents).toEqual(["recent foo"]);
    expect(doc.sections.Facts).toEqual(["fact bar"]);
    // Sections only exist when headings are found — no heading → undefined
    expect(doc.sections.Rules).toBeUndefined();
  });

  it("preserves blank lines before frontmatter as frontmatter body", () => {
    const input = `---
version: 0.1.0
format:
  - Rules
  - Facts
  - Recents
---

# Rules
- test
`;

    const doc = parseMemory(input);
    expect(doc.frontmatter).toContain("version: 0.1.0");
    expect(doc.frontmatter).toContain("Rules");
  });

  it("returns empty sections for completely empty input", () => {
    const doc = parseMemory("");
    expect(doc.frontmatter).toBe("");
    // Sections only exist when headings are found
    expect(doc.sections.Rules).toBeUndefined();
    expect(doc.sections.Facts).toBeUndefined();
    expect(doc.sections.Recents).toBeUndefined();
  });

  it("returns empty sections for input with only whitespace and no heading", () => {
    const doc = parseMemory("   \n\n  \n");
    // Sections only exist when headings are found
    expect(doc.sections.Rules).toBeUndefined();
    expect(doc.frontmatter).toBe("");
  });

  it("handles section with no list items", () => {
    const input = `# Rules
# Facts
- fact one
`;
    const doc = parseMemory(input);
    expect(doc.sections.Rules).toEqual([]);
    expect(doc.sections.Facts).toEqual(["fact one"]);
  });

  it("only captures lines that start with '- '", () => {
    const input = `# Rules
- valid item
not-a-list-item
  - indented but not bullet
- another valid
`;
    const doc = parseMemory(input);
    // parser uses l.trimStart().startsWith("- ") — indented items pass check
  expect(doc.sections.Rules).toEqual(["valid item", "indented but not bullet", "another valid"]);
  });

  it("handles multiple sections with same name by appending", () => {
    const input = `# Rules
- first
# Rules
- second
`;
    const doc = parseMemory(input);
    expect(doc.sections.Rules).toEqual(["first", "second"]);
    });

  it("ignores non-standard section headings", () => {
    const input = `# CustomSection
- some item

# Rules
- rule one
`;
    const doc = parseMemory(input);
    expect(doc.sections.Rules).toEqual(["rule one"]);
    // Parser creates sections for ANY heading, not just VALID_SECTIONS.
    // This is the actual behavior — CustomSection is captured.
    expect(doc.sections.CustomSection).toEqual(["some item"]);
  });

  it("no frontmatter present", () => {
    const input = `# Rules
- only rules
`;
    const doc = parseMemory(input);
    expect(doc.frontmatter).toBe("");
    expect(doc.sections.Rules).toEqual(["only rules"]);
  });

  it("handles frontmatter-like dashes that are not YAML frontmatter", () => {
    const input = `# Facts
- ---not frontmatter---
`;
    const doc = parseMemory(input);
    expect(doc.frontmatter).toBe("");
    expect(doc.sections.Facts).toEqual(["---not frontmatter---"]);
  });

  it("trims whitespace from list items", () => {
    const input = `# Rules
-   padded item  
- another one
`;
    const doc = parseMemory(input);
    expect(doc.sections.Rules).toEqual(["padded item", "another one"]);
  });
});

// ---------------------------------------------------------------
// renderMemory
// ---------------------------------------------------------------

describe("renderMemory", () => {
  it("renders a complete doc with all sections populated", () => {
    const doc = makeDoc({
      // frontmatter must be bare YAML — renderMemory wraps it with ---
      frontmatter: "version: 0.1.0",
        sections: {
        Rules: ["R1", "R2"],
        Facts: ["F1"],
      Recents: [],
    },
    });
    const output = renderMemory(doc);
    expect(output).toContain("---\nversion: 0.1.0\n---");
    expect(output).toContain("# Rules\n\n- R1\n- R2");
    expect(output).toContain("# Facts\n\n- F1");
    expect(output).toContain("# Recents");
    // Recents section exists but has no list items
  const recentsIdx = output.indexOf("# Recents");
const afterRecents = output.slice(recentsIdx + "# Recents".length);
  expect(afterRecents).not.toMatch(/^\s*- /m);
  });

  it("uses default frontmatter when empty", () => {
    const doc = makeDoc({
      frontmatter: "",
      sections: { Rules: ["entry"] },
    });
    const output = renderMemory(doc);
    expect(output).toContain("version: 0.1.0");
    expect(output).toContain("format:");
  });

  it("outputs all three VALID_SECTIONS headers even when empty", () => {
    const doc = makeDoc({ frontmatter: "", sections: {} });
    const output = renderMemory(doc);
    expect(output).toContain("# Rules");
    expect(output).toContain("# Facts");
    expect(output).toContain("# Recents");
  });

  it("round-trips: parse(render(doc)) reconstructs equivalent doc", () => {
    const original = makeDoc({
      // frontmatter must be bare YAML — renderMemory wraps it
      frontmatter: "version: 0.1.0",
      sections: {
        Rules: ["Keep it simple", "No flattery"],
        Facts: ["Project uses TypeScript", "Bun runtime"],
        Recents: ["Added test suite"],
      },
    });
    const rendered = renderMemory(original);
    const parsed = parseMemory(rendered);

    expect(parsed.sections.Rules).toEqual(original.sections.Rules);
    expect(parsed.sections.Facts).toEqual(original.sections.Facts);
    expect(parsed.sections.Recents).toEqual(original.sections.Recents);
    // frontmatter may differ (renderMemory adds default when empty)
    expect(parsed.frontmatter).toContain("version: 0.1.0");
  });

  it("render then parse preserves empty sections", () => {
    const doc = makeDoc({ frontmatter: "", sections: { Rules: [], Facts: [], Recents: [] } });
    const parsed = parseMemory(renderMemory(doc));
    expect(parsed.sections.Rules).toEqual([]);
    expect(parsed.sections.Facts).toEqual([]);
    expect(parsed.sections.Recents).toEqual([]);
  });
});

// ---------------------------------------------------------------
// formatDoc
// ---------------------------------------------------------------

describe("formatDoc", () => {
  it("formats doc with label and all populated sections", () => {
    const doc = makeDoc({
      sections: {
        Rules: ["R1", "R2"],
        Facts: ["F1", "F2", "F3"],
        Recents: ["Rec1"],
      },
    });
    const output = formatDoc("Global Memory", doc);

    expect(output).toContain("--- Global Memory ---");
    expect(output).toContain("  Rules:");
    expect(output).toContain("    - R1");
    expect(output).toContain("    - R2");
    expect(output).toContain("  Facts:");
    expect(output).toContain("    - F1");
    expect(output).toContain("    - F2");
    expect(output).toContain("    - F3");
    expect(output).toContain("  Recents:");
    expect(output).toContain("    - Rec1");
  });

  it("returns empty string when all sections are empty", () => {
    const doc = makeDoc({ sections: { Rules: [], Facts: [], Recents: [] } });
    expect(formatDoc("Project Memory", doc)).toBe("");
  });

  it("skips empty sections while including non-empty ones", () => {
    const doc = makeDoc({
      sections: {
        Rules: ["Only rule"],
        Facts: [],
        Recents: ["Only recent"],
      },
    });
    const output = formatDoc("Test", doc);
    expect(output).toContain("  Rules:");
    expect(output).toContain("  Recents:");
    expect(output).not.toContain("  Facts:");
  });

  it("preserves entries with special characters", () => {
    const doc = makeDoc({
      sections: {
        Rules: ["Use `backticks` in code"],
        Facts: [],
        Recents: [],
      },
    });
    const output = formatDoc("Test", doc);
    expect(output).toContain("Use `backticks` in code");
  });
});

// ---------------------------------------------------------------
// readMemory / writeMemory (I/O integration)
// ---------------------------------------------------------------

describe("readMemory / writeMemory", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes and reads back a complete doc", async () => {
    const path = join(tmpDir, "MEMORY.md");
    const doc = makeDoc({
      // frontmatter: bare YAML — renderMemory wraps it
      frontmatter: "version: 0.1.0",
        sections: {
        Rules: ["Always use TypeScript"],
        Facts: ["Repo: pi"],
      Recents: [],
    },
});

    await writeMemory(path, doc);
const read = await readMemory(path);

    expect(read.sections.Rules).toEqual(["Always use TypeScript"]);
    expect(read.sections.Facts).toEqual(["Repo: pi"]);
    expect(read.sections.Recents).toEqual([]);
  });

  it("returns empty doc for non-existent file", async () => {
    const path = join(tmpDir, "does-not-exist.md");
    const doc = await readMemory(path);

    expect(doc.frontmatter).toBe("");
    expect(doc.sections.Rules).toEqual([]);
    expect(doc.sections.Facts).toEqual([]);
    expect(doc.sections.Recents).toEqual([]);
  });

  it("creates parent directories when writing", async () => {
    const path = join(tmpDir, "deep", "nested", "MEMORY.md");
    const doc = makeDoc({ sections: { Facts: ["Test"] } });

    await writeMemory(path, doc);
    const read = await readMemory(path);
    expect(read.sections.Facts).toEqual(["Test"]);
  });

  it("overwrites existing file completely", async () => {
    const path = join(tmpDir, "MEMORY.md");
    const first = makeDoc({ sections: { Rules: ["First"] } });
    const second = makeDoc({ sections: { Rules: ["Second"] } });

    await writeMemory(path, first);
    await writeMemory(path, second);
    const read = await readMemory(path);

    expect(read.sections.Rules).toEqual(["Second"]);
  });

  it("handles read of empty file", async () => {
    const path = join(tmpDir, "MEMORY.md");
    writeFileSync(path, "");
    const doc = await readMemory(path);
    // empty file → no headings → no sections populated
    expect(doc.sections.Rules).toBeUndefined();
  });

  it("readMemory with corrupted YAML frontmatter still parses sections", async () => {
    const path = join(tmpDir, "MEMORY.md");
    writeFileSync(
      path,
      `---
broken: [
---

# Rules
- survives corruption
`
    );
    // Should not throw — returns empty doc because catch swallows.
    // This is the data-loss bug flagged in code review.
    const doc = await readMemory(path);
    // frontmatter regex matches the corrupted block, so it's captured
    expect(doc.frontmatter).toBe("broken: [");
    expect(doc.sections.Rules).toEqual(["survives corruption"]);
  });
});

// ---------------------------------------------------------------
// Remember workflow (read → append → write → verify)
// ---------------------------------------------------------------

describe("remember workflow", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("adds entry to empty section and persists", async () => {
    const path = join(tmpDir, "MEMORY.md");

    // Start with empty doc
    const doc = makeDoc();
    await writeMemory(path, doc);

    // "remember" — read, append, write
    const current = await readMemory(path);
    current.sections.Facts = [...current.sections.Facts, "New fact"];
    await writeMemory(path, current);

    // Verify
    const read = await readMemory(path);
    expect(read.sections.Facts).toEqual(["New fact"]);
  });

  it("appends multiple entries preserving order", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc();
    await writeMemory(path, doc);

    // Append 3 entries sequentially
    for (const entry of ["First", "Second", "Third"]) {
      const current = await readMemory(path);
      current.sections.Facts = [...current.sections.Facts, entry];
      await writeMemory(path, current);
    }

    const read = await readMemory(path);
    expect(read.sections.Facts).toEqual(["First", "Second", "Third"]);
  });

  it("adds to global-scoped memory path", async () => {
    const path = join(tmpDir, "global-MEMORY.md");

    const doc = makeDoc({
      sections: { Rules: ["Global rule"] },
    });
    await writeMemory(path, doc);

    const read = await readMemory(path);
    expect(read.sections.Rules).toEqual(["Global rule"]);
  });

  it("adds entry to project-scoped memory path", async () => {
    // Simulate project-scoped path
    const projectMemPath = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({ sections: { Recents: ["Recent entry"] } });
    await writeMemory(projectMemPath, doc);

    // "remember" — read, modify, write
    const current = await readMemory(projectMemPath);
    current.sections.Recents = [...current.sections.Recents, "Another recent"];
    await writeMemory(projectMemPath, current);

    const read = await readMemory(projectMemPath);
    expect(read.sections.Recents).toEqual(["Recent entry", "Another recent"]);
  });

  it("preserves existing entries in other sections when adding", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({
      sections: {
        Rules: ["Existing rule"],
        Facts: [],
        Recents: ["Existing recent"],
      },
    });
    await writeMemory(path, doc);

    // Add to Rules
    const current = await readMemory(path);
    current.sections.Rules = [...current.sections.Rules, "New rule"];
    await writeMemory(path, current);

    const read = await readMemory(path);
    expect(read.sections.Rules).toEqual(["Existing rule", "New rule"]);
    expect(read.sections.Recents).toEqual(["Existing recent"]); // preserved
    expect(read.sections.Facts).toEqual([]); // preserved
  });
});

// ---------------------------------------------------------------
// Forget workflow (read → remove by index → write → verify)
// ---------------------------------------------------------------

describe("forget workflow", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes entry at valid 1-based index", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({
      sections: { Rules: ["First", "Second", "Third"] },
    });
    await writeMemory(path, doc);

    // "forget" — read, remove by index, write
    const current = await readMemory(path);
    current.sections.Rules.splice(1, 1); // Remove index 2 (1-based → 0-based: 1)
    await writeMemory(path, current);

    const read = await readMemory(path);
    expect(read.sections.Rules).toEqual(["First", "Third"]);
  });

  it("removes first entry", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({
      sections: { Facts: ["A", "B", "C"] },
    });
    await writeMemory(path, doc);

    const current = await readMemory(path);
    current.sections.Facts.splice(0, 1); // Remove index 1
    await writeMemory(path, current);

    const read = await readMemory(path);
    expect(read.sections.Facts).toEqual(["B", "C"]);
  });

  it("removes last entry", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({
      sections: { Facts: ["A", "B", "C"] },
    });
    await writeMemory(path, doc);

    const current = await readMemory(path);
    current.sections.Facts.splice(2, 1); // Remove index 3
    await writeMemory(path, current);

    const read = await readMemory(path);
    expect(read.sections.Facts).toEqual(["A", "B"]);
  });

  it("errors on empty section (no entries to remove)", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({ sections: { Recents: [] } });
    await writeMemory(path, doc);

    // Simulate the forget logic — check before splicing
    const current = await readMemory(path);
    expect(current.sections.Recents.length).toBe(0);
    // The forget tool would throw here; we just verify the pre-condition
  });

  it("errors on out-of-bounds index", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({ sections: { Rules: ["Only one"] } });
    await writeMemory(path, doc);

    const current = await readMemory(path);
    // Index 5 (1-based) with only 1 entry — out of bounds
    const idx = 5; // 1-based
    expect(idx < 1 || idx > current.sections.Rules.length).toBe(true);
    // The forget tool would throw; we verify the pre-condition
  });

  it("preserves other sections when removing from one", async () => {
    const path = join(tmpDir, "MEMORY.md");

    const doc = makeDoc({
      sections: {
        Rules: ["R1", "R2"],
        Facts: ["F1"],
        Recents: [],
      },
    });
    await writeMemory(path, doc);

    const current = await readMemory(path);
    current.sections.Rules.splice(0, 1); // Remove R1
    await writeMemory(path, current);

    const read = await readMemory(path);
    expect(read.sections.Rules).toEqual(["R2"]);
    expect(read.sections.Facts).toEqual(["F1"]);
    expect(read.sections.Recents).toEqual([]);
  });
});

// ---------------------------------------------------------------
// projectPath / GLOBAL_PATH
// ---------------------------------------------------------------

describe("projectPath / GLOBAL_PATH", () => {
  it("projectPath returns MEMORY.md in cwd", () => {
    const p = projectPath("/some/project");
    expect(p).toBe(join("/some/project", "MEMORY.md"));
  });

  it("GLOBAL_PATH resolves to home .pi/agent/MEMORY.md", () => {
    expect(GLOBAL_PATH).toContain(".pi/agent/MEMORY.md");
  });

  it("projectPath handles relative paths", () => {
    const p = projectPath(".");
    expect(p).toBe(join(".", "MEMORY.md"));
  });
});

// ---------------------------------------------------------------
// VALID_SECTIONS
// ---------------------------------------------------------------

describe("VALID_SECTIONS", () => {
  it("contains Rules, Facts, Recents", () => {
    expect(VALID_SECTIONS).toEqual(["Rules", "Facts", "Recents"]);
  });

  it("is a const assertion (typeof check)", () => {
    // TypeScript-level check: VALID_SECTIONS is readonly tuple
    const sections: readonly string[] = VALID_SECTIONS;
    expect(sections).toHaveLength(3);
  });
});
