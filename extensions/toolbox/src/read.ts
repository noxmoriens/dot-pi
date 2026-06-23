import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { truncateHead, formatSize, resizeImage, formatDimensionNote } from "@earendil-works/pi-coding-agent";
import { setCache } from "./cache.ts";

const MAX_BYTES = 50 * 1024;
const MAX_LINES = 2000;

const IMAGE_EXT_MAP: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
};

function detectImageMimeTypeFromExtension(filePath: string): string | null {
	const dot = filePath.lastIndexOf(".");
	if (dot < 0) return null;
	return IMAGE_EXT_MAP[filePath.slice(dot).toLowerCase()] ?? null;
}

export function createReadTool(cwd: string) {
	return {
		name: "read",
		label: "read",
		description:
			"Read the contents of a file. Supports text files and images (jpg, png, gif, webp). Images are sent as attachments. For text files, output is truncated to 2000 lines or 50KB (whichever is hit first). Use offset/limit for large files. Caches content for efficient subsequent edits.",
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

			// Image file — detect by extension and read as binary
			const mimeType = detectImageMimeTypeFromExtension(absolutePath);
			if (mimeType) {
				const buffer = await readFile(absolutePath);
				const resized = await resizeImage(buffer, mimeType);
				if (!resized) {
					 return {
						  content: [{
							   type: "text" as const,
							   text: `Read image file [${mimeType}]\n[Image omitted: could not be resized below the inline image size limit.]`,
						  }],
					  details: undefined,
				 };
				}
				const dimensionNote = formatDimensionNote(resized);
				const textParts = [`Read image file [${resized.mimeType}]`];
				if (dimensionNote) textParts.push(dimensionNote);
					return {
						 content: [
						  { type: "text" as const, text: textParts.join("\n") },
					  { type: "image" as const, data: resized.data, mimeType: resized.mimeType },
				 ],
			 details: undefined,
};
			}

			// Text file — read as UTF-8
			const content = await readFile(absolutePath, "utf-8");

			// Cache content string for subsequent edit calls.
			// HashLineIndex is built lazily on first edit.
			setCache(absolutePath, { content, index: null, mtime: Date.now() });

			const allLines = content.split("\n");
			// Strip trailing empty entry from final \n (not a real content line)
			if (content.endsWith("\n") && allLines[allLines.length - 1] === "") {
 allLines.pop();
			}
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

			// Use truncateHead from pi-coding-agent (handles line + byte limits cleanly)
			const truncation = truncateHead(selectedContent, { maxLines: MAX_LINES, maxBytes: MAX_BYTES });
			const startLineDisplay = startLine + 1;
			let outputText = truncation.content;

			if (truncation.firstLineExceedsLimit) {
				outputText =
					`[First line exceeds ${formatSize(MAX_BYTES)} limit. Use bash to read this file in smaller chunks.]`;
			} else if (truncation.truncated) {
				const endLineDisplay = startLineDisplay + truncation.outputLines - 1;
				const nextOffset = endLineDisplay + 1;
				if (truncation.truncatedBy === "lines") {
					outputText +=
						`\n\n[Showing lines ${startLineDisplay}-${endLineDisplay} of ${totalFileLines}. Use offset=${nextOffset} to continue.]`;
				} else {
					outputText +=
						`\n\n[Showing lines ${startLineDisplay}-${endLineDisplay} of ${totalFileLines} (${formatSize(MAX_BYTES)} limit). Use offset=${nextOffset} to continue.]`;
				}
			} else if (userLimitedLines !== undefined && startLine + userLimitedLines < allLines.length) {
				const remaining = allLines.length - (startLine + userLimitedLines);
				const nextOffset = startLine + userLimitedLines + 1;
				outputText +=
					`\n\n[${remaining} more lines in file. Use offset=${nextOffset} to continue.]`;
			}

			return {
				content: [{ type: "text" as const, text: outputText }],
				details: undefined,
			};
		},
	};
}
