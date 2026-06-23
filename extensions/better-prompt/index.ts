import {
  formatSkillsForPrompt,
  getDocsPath,
  getExamplesPath,
  getReadmePath,
  type ExtensionAPI,
  type SystemPromptOptions,
} from "@earendil-works/pi-coding-agent";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Generate pi documentation section identical to buildSystemPrompt in pi-coding-agent. */
export function buildPiDocs(): string {
  const readmePath = getReadmePath();
  const docsPath = getDocsPath();
  const examplesPath = getExamplesPath();
  return [
    `Pi documentation (read only when the user asks about pi itself, its SDK, extensions, themes, skills, or TUI):`,
    `- Main documentation: ${readmePath}`,
    `- Additional docs: ${docsPath}`,
    `- Examples: ${examplesPath} (extensions, custom tools, SDK)`,
    `- When reading pi docs or examples, resolve docs/... under Additional docs and examples/... under Examples, not the current working directory`,
    `- When asked about: extensions (docs/extensions.md, examples/extensions/), themes (docs/themes.md), skills (docs/skills.md), prompt templates (docs/prompt-templates.md), TUI components (docs/tui.md), keybindings (docs/keybindings.md), SDK integrations (docs/sdk.md), custom providers (docs/custom-provider.md), adding models (docs/models.md), pi packages (docs/packages.md)`,
    `- When working on pi topics, read the docs and examples, and follow .md cross-references before implementing`,
    `- Always read pi .md files completely and follow links to related docs (e.g., tui.md for TUI API details)`,
  ].join("\n");
}

export function loadWithPriority(filename: string, cwd: string, globalBase: string): string {
  const project = join(cwd, ".pi", "agent", filename);
  const global = join(globalBase, ".pi", "agent", filename);
  try {
    return readFileSync(project, "utf-8");
  } catch {
    try {
      return readFileSync(global, "utf-8");
    } catch {
      return "";
    }
  }
}

/** LEGACY: regex-based extraction from old system prompt. Superseded by buildPiDocs(). */
export function splitPiDocs(base: string): string {
  const match = base.match(/Pi documentation[\s\S]*?(?=\n\n|<project_context>|$)/);
  return match?.[0]?.trim() ?? "";
}

export default function(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const opts: SystemPromptOptions = event.systemPromptOptions ?? {};
    const template = readFileSync(join(__dirname, "template.xml"), "utf-8");
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const tools = opts.selectedTools ?? [];
    const snippets = opts.toolSnippets ?? {};
    const toolsList = tools
      .filter((t) => !!snippets[t])
      .map((t) => `- ${t}: ${snippets[t]}`)
      .join("\n");

    const guidelines: string[] = [];
    for (const g of opts.promptGuidelines ?? []) {
      const n = g.trim();
      if (n.length > 0) guidelines.push(n);
    }
    const guidelinesBlock = guidelines.map((g) => `- ${g}`).join("\n");

    let contextBlock = "";
    if ((opts.contextFiles ?? []).length > 0) {
      contextBlock = (opts.contextFiles ?? [])
        .map((f) => `## ${f.path}\n\n${f.content}\n\n`)
        .join("");
    }

    const skillsBlock = formatSkillsForPrompt(opts.skills ?? []);

    const systemMd = loadWithPriority("SYSTEM.md", ctx.cwd ?? "", process.env.HOME ?? "~");
    const appendPrompt = opts.appendSystemPrompt ?? "";
    const piDocs = buildPiDocs();

    const result = template
      .replace(/\{\{SYSTEM\}\}/g, systemMd || "You are Claude Code.")
      .replace(/\{\{TOOLS\}\}/g, toolsList || "")
      .replace(/\{\{APPEND_SYSTEM\}\}/g, appendPrompt)
      .replace(/\{\{PI_DOCUMENTATIONS\}\}/g, piDocs)
      .replace(/\{\{TOOL_GUIDELINES\}\}/g, guidelinesBlock)
      .replace(/\{\{SKILLS\}\}/g, skillsBlock)
      .replace(/\{\{PROJECT_CONTEXT\}\}/g, contextBlock)
      .replace(/\{\{MODEL_ID\}\}/g, ctx.model?.name ?? "unknown")
      .replace(/\{\{PROVIDER\}\}/g, ctx.model?.provider ?? "unknown")
      .replace(/\{\{ARCHITECTURE\}\}/g, "unknown")
      .replace(/\{\{CONTEXT_WINDOW\}\}/g, "unknown")
      .replace(/\{\{DATE\}\}/g, date)
      .replace(/\{\{WORKDIR\}\}/g, ctx.cwd ?? "");

    return { systemPrompt: result };
  });
}
