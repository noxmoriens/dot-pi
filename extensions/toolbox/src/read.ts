import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { setCache } from "./cache.ts";

export function createReadTool(cwd: string) {
	return {
		name: "read",
		label: "read",
		description:
			"Read the contents of a file. Output is truncated to 2000 lines or 50KB (whichever is hit first). Use offset/limit for large files. Caches content for efficient subsequent edits.",
		promptSnippet: "Read file contents",
		promptGuidelines: ["Use read to examine files instead of cat or sed."],
		parameters: {
			type: "object" as const,
			properties: {
				path: {
					type: "string",
					description: "Path to the file to read (relative or absolute)",
				},
				offset: {
					type: "number",
					description: "Line number to start reading from (1-indexed)",
				},
				limit: {
					type: "number",
					description: "Maximum number of lines to read",
				},
			},
			required: ["path"],
		},
		async execute(
			_toolCallId: string,
			params: { path: string; offset?: number; limit?: number },
			_signal?: AbortSignal,
			_onUpdate?: unknown,
			ctx?: { cwd: string },
		) {
			const cwdir = ctx?.cwd ?? cwd ?? process.cwd();
			const absolutePath = resolve(cwdir, params.path);

			const content = await readFile(absolutePath, "utf-8");

			// Cache content string for subsequent edit calls.
			// HashLineIndex is built lazily on first edit.
			setCache(absolutePath, { content, index: null, mtime: Date.now() });

			const allLines = content.split("\n");
			const totalFileLines = allLines.length;
			const startLine = params.offset ? Math.max(0, params.offset - 1) : 0;

			if (startLine >= allLines.length) {
				throw new Error(`Offset ${params.offset} is beyond end of file (${allLines.length} lines total)`);
			}

			let selectedContent: string;
			let userLimitedLines: number | undefined;

			if (params.limit !== undefined) {
				const endLine = Math.min(startLine + params.limit, allLines.length);
				selectedContent = allLines.slice(startLine, endLine).join("\n");
				userLimitedLines = endLine - startLine;
			} else {
				selectedContent = allLines.slice(startLine).join("\n");
			}

			// Truncation
			const MAX_BYTES = 50 * 1024;
			const MAX_LINES = 2000;
			let truncated = false;
			let outputLines = 0;
			let outputBytes = 0;

			const outputLinesArr = selectedContent.split("\n");
			if (outputLinesArr.length > MAX_LINES) {
				selectedContent = outputLinesArr.slice(0, MAX_LINES).join("\n");
				truncated = true;
				outputLines = MAX_LINES;
			} else {
				outputLines = outputLinesArr.length;
			}

			if (Buffer.byteLength(selectedContent, "utf-8") > MAX_BYTES) {
				let truncatedBytes = MAX_BYTES;
				while (truncatedBytes > 0) {
					try {
						selectedContent = Buffer.from(selectedContent).toString("utf-8", 0, truncatedBytes);
						const decoded = Buffer.from(selectedContent, "utf-8").toString("utf-8");
						if (decoded.length > 0 || truncatedBytes === 0) break;
					} catch {
						// adjust
					}
					truncatedBytes--;
				}
				truncated = true;
				outputBytes = MAX_BYTES;
			}

			const startLineDisplay = startLine + 1;
			let outputText = selectedContent;

			if (truncated) {
				const endLineDisplay = startLineDisplay + outputLines - 1;
				const nextOffset = endLineDisplay + 1;
				if (outputBytes > 0) {
					outputText += `\n\n[Showing ${outputLines} lines (${Math.round(MAX_BYTES / 1024)}KB limit). Use offset=${nextOffset} to continue.]`;
				} else {
					outputText += `\n\n[Showing lines ${startLineDisplay}-${endLineDisplay} of ${totalFileLines}. Use offset=${nextOffset} to continue.]`;
				}
			} else if (userLimitedLines !== undefined && startLine + userLimitedLines < allLines.length) {
				const remaining = allLines.length - (startLine + userLimitedLines);
				const nextOffset = startLine + userLimitedLines + 1;
				outputText += `\n\n[${remaining} more lines in file. Use offset=${nextOffset} to continue.]`;
			}

			return {
				content: [{ type: "text" as const, text: outputText }],
				details: undefined,
			};
		},
	};
}
