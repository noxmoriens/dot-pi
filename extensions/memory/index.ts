import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname, basename } from "node:path";

const GLOBAL_PATH = join(homedir(), ".pi", "agent", "MEMORY.md");

function projectPath(cwd: string): string {
  return join(cwd, "MEMORY.md");
}

interface MemoryDoc {
  frontmatter: string;
  sections: Record<string, string[]>;
}

function parseMemory(raw: string): MemoryDoc {
  const sections: Record<string, string[]> = {};
  let frontmatter = "";
  let body = raw;

  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    frontmatter = fm[1].trim();
    body = raw.slice(fm[0].length);
  }

  const parts = body.split(/(?=^# )/m);
  for (const part of parts) {
    const m = part.match(/^# (.+)$/m);
    if (m) {
      const name = m[1].trim();
      const items = part
        .split("\n")
        .filter((l) => l.trimStart().startsWith("- "))
        .map((l) => l.trimStart().slice(2).trim());
      sections[name] = items;
    }
  }

  return { frontmatter, sections };
}

function renderMemory(doc: MemoryDoc): string {
  const out: string[] = [];

  if (doc.frontmatter) {
    out.push("---", doc.frontmatter, "---", "");
  } else {
    out.push(
      "---",
      "version: 0.1.0",
      "format:",
      "  - Rules",
      "  - Facts",
      "  - Recents",
      "---",
      "",
    );
  }

  for (const [name, items] of Object.entries(doc.sections)) {
    out.push(`# ${name}`, "");
    for (const item of items) out.push(`- ${item}`);
    out.push("");
  }

  return out.join("\n");
}

async function readMemory(path: string): Promise<MemoryDoc> {
  try {
    return parseMemory(await readFile(path, "utf-8"));
  } catch {
    return {
      frontmatter: "",
      sections: { Rules: [], Facts: [], Recents: [] },
    };
  }
}

async function writeMemory(path: string, doc: MemoryDoc): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, renderMemory(doc), "utf-8");
}

const VALID_SECTIONS = ["Rules", "Facts", "Recents"] as const;
type Section = (typeof VALID_SECTIONS)[number];

function formatDoc(label: string, doc: MemoryDoc): string {
  const nonEmpty = VALID_SECTIONS.filter((s) => (doc.sections[s]?.length ?? 0) > 0);
  if (nonEmpty.length === 0) return "";

  const lines: string[] = [`--- ${label} ---`];
  for (const s of nonEmpty) {
    lines.push(`  ${s}:`);
    for (const item of doc.sections[s]) {
      lines.push(`    - ${item}`);
    }
  }
  return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
  // ---------------------------------------------------------------
  // Inject memory context into system prompt at every turn
  // ---------------------------------------------------------------
  pi.on("before_agent_start", async (event, ctx) => {
    const [globalDoc, projectDoc] = await Promise.all([
      readMemory(GLOBAL_PATH),
      readMemory(projectPath(ctx.cwd)),
    ]);

    const globalBlock = formatDoc("Global Memory", globalDoc);
    const projLabel = `Project Memory (${basename(ctx.cwd)})`;
    const projBlock = formatDoc(projLabel, projectDoc);

    const blocks = [globalBlock, projBlock].filter(Boolean);
    if (blocks.length === 0) return;

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n## Stored Memory Context\n" +
        blocks.join("\n") +
        "\n\nUse `remember` to persist new information (decisions in Rules, verified facts in Facts, observations in Recents). Use `forget` to remove outdated entries by section and index.",
    };
  });

  // ---------------------------------------------------------------
  // remember — add a memory entry
  // ---------------------------------------------------------------
  pi.registerTool({
    name: "remember",
    label: "Remember",
    description:
      "Add a memory entry to MEMORY.md. Rules: permanent decisions and conventions. Facts: verified information about the codebase. Recents: session-scoped observations.",
    promptSnippet: "Save information to persistent memory (Rules, Facts, or Recents)",
    promptGuidelines: [
      "Use remember with section Rules for permanent decisions and conventions.",
      "Use remember with section Facts for verified information about the codebase.",
      "Use remember with section Recents for session-scoped observations.",
    ],
    parameters: Type.Object({
      text: Type.String({ description: "The memory entry to save" }),
      section: StringEnum(VALID_SECTIONS),
      scope: Type.Optional(StringEnum(["project", "global"] as const)),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const path = params.scope === "global" ? GLOBAL_PATH : projectPath(ctx.cwd);
      const doc = await readMemory(path);

      if (!doc.sections[params.section]) {
        doc.sections[params.section] = [];
      }
      doc.sections[params.section].push(params.text);
      await writeMemory(path, doc);

      const scope = params.scope ?? "project";
      return {
        content: [
          {
            type: "text",
            text: `Saved to ${scope} memory / ${params.section}: ${params.text}`,
          },
        ],
        details: { path, section: params.section, scope },
      };
    },
  });

  // ---------------------------------------------------------------
  // forget — remove a memory entry by index
  // ---------------------------------------------------------------
  pi.registerTool({
    name: "forget",
    label: "Forget",
    description:
      "Remove a memory entry from a section by its 1-based index. Run `remember` or check the system prompt's Stored Memory Context section to see current entries with indices.",
    promptSnippet: "Remove outdated or incorrect memory entries",
    parameters: Type.Object({
      section: StringEnum(VALID_SECTIONS),
      index: Type.Number({ description: "1-based index of the entry to remove" }),
      scope: Type.Optional(StringEnum(["project", "global"] as const)),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const path = params.scope === "global" ? GLOBAL_PATH : projectPath(ctx.cwd);
      const doc = await readMemory(path);
      const items = doc.sections[params.section];

      if (!items || items.length === 0) {
        return {
          content: [{ type: "text", text: `No entries in ${params.section}` }],
          details: {},
          isError: true,
        };
      }

      if (params.index < 1 || params.index > items.length) {
        return {
          content: [
            {
              type: "text",
              text: `Index ${params.index} out of range — ${params.section} has ${items.length} entries (1-${items.length})`,
            },
          ],
          details: {},
          isError: true,
        };
      }

      const removed = items.splice(params.index - 1, 1)[0];
      await writeMemory(path, doc);

      const scope = params.scope ?? "project";
      return {
        content: [{ type: "text", text: `Removed from ${scope} memory / ${params.section}: ${removed}` }],
        details: { path, section: params.section, scope, removed },
      };
    },
  });

  // ---------------------------------------------------------------
  // /remember — quick-cli add to project memory
  // ---------------------------------------------------------------
  pi.registerCommand("remember", {
    description: "Save a memory entry. Usage: /remember <section> <text>",
    usage: "/remember Rules|Facts|Recents <text>",
    handler: async (args, ctx) => {
      const parts = args?.split(/\s+/);
      if (!parts || parts.length < 2) {
        ctx.ui.notify("Usage: /remember <Rules|Facts|Recents> <text>", "error");
        return;
      }

      const section = parts[0];
      if (!(VALID_SECTIONS as readonly string[]).includes(section)) {
        ctx.ui.notify("Section must be Rules, Facts, or Recents", "error");
        return;
      }

      const text = parts.slice(1).join(" ");
      const doc = await readMemory(projectPath(ctx.cwd));
      if (!doc.sections[section]) doc.sections[section] = [];
      doc.sections[section].push(text);
      await writeMemory(projectPath(ctx.cwd), doc);
      ctx.ui.notify(`Saved to ${section}: ${text}`, "info");
    },
  });

  // ---------------------------------------------------------------
  // /forget — quick-cli remove from project memory
  // ---------------------------------------------------------------
  pi.registerCommand("forget", {
    description: "Remove a memory entry. Usage: /forget <section> <index>",
    usage: "/forget Rules|Facts|Recents <index>",
    handler: async (args, ctx) => {
      const parts = args?.split(/\s+/);
      if (!parts || parts.length < 2) {
        ctx.ui.notify("Usage: /forget <Rules|Facts|Recents> <index>", "error");
        return;
      }

      const section = parts[0];
      if (!(VALID_SECTIONS as readonly string[]).includes(section)) {
        ctx.ui.notify("Section must be Rules, Facts, or Recents", "error");
        return;
      }

      const index = parseInt(parts[1], 10);
      if (isNaN(index)) {
        ctx.ui.notify("Index must be a number", "error");
        return;
      }

      const doc = await readMemory(projectPath(ctx.cwd));
      const items = doc.sections[section];
      if (!items || items.length === 0) {
        ctx.ui.notify("No entries in that section", "error");
        return;
      }

      if (index < 1 || index > items.length) {
        ctx.ui.notify(`Index out of range (1-${items.length})`, "error");
        return;
      }

      const removed = items.splice(index - 1, 1)[0];
      await writeMemory(projectPath(ctx.cwd), doc);
      ctx.ui.notify(`Removed: ${removed}`, "info");
    },
  });
}
