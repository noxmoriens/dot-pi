import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { generateDiffString, generateUnifiedPatch } from "@earendil-works/pi-coding-agent";
import { HashLineIndex } from "./hashline.ts";
import { getCache, setCache } from "./cache.ts";

export function createEditTool(cwd: string) {
	return {
		name: "edit",
		label: "edit",
		description:
			"Edit a file using content-aware matching. Finds the target code by its content (ignoring whitespace/indentation differences), then applies the change at the exact position. Handles formatting hallucinations that break str_replace.",
		promptSnippet: "Edit file contents (content-aware)",
		promptGuidelines: [
			"Use edit to make targeted changes to files. Provide oldText and newText — indentation and whitespace don't need to match exactly.",
		],
		parameters: {
			type: "object" as const,
			properties: {
				path: {
					type: "string",
					description: "Path to the file to edit (relative or absolute)",
				},
				edits: {
					type: "array" as const,
					items: {
						type: "object" as const,
						properties: {
							oldText: {
								type: "string",
								description: "Code to find. Content is matched against the file ignoring whitespace differences.",
							},
							newText: {
								type: "string",
								description: "Replacement code. The tool preserves the original file's indentation.",
							},
						},
						required: ["oldText", "newText"],
					},
					minItems: 1,
				},
			},
			required: ["path", "edits"],
		},
		async execute(
			_toolCallId: string,
			params: { path: string; edits: Array<{ oldText: string; newText: string }> },
			_signal?: AbortSignal,
			_onUpdate?: unknown,
			ctx?: { cwd: string },
		) {
			if (!params.edits || params.edits.length === 0) {
				throw new Error("No edits provided");
			}

			const cwdir = ctx?.cwd ?? cwd ?? process.cwd();
			const absolutePath = resolve(cwdir, params.path);

			return withFileMutationQueue(absolutePath, async () => {
				// Load content from cache or disk.
				// HashLineIndex is built lazily on first edit.
				let content: string;
				let index: HashLineIndex | null;

				const cached = getCache(absolutePath);
				if (cached) {
					content = cached.content;
					index = cached.index;
				} else {
					content = await readFile(absolutePath, "utf-8");
					index = null;
				}

				const originalContent = content;
				let firstChangedLine: number | undefined;

				// Apply each edit
				for (let i = 0; i < params.edits.length; i++) {
					const { oldText, newText } = params.edits[i]!;

					if (!oldText) throw new Error(`Edit ${i}: oldText is empty`);
					if (!newText) throw new Error(`Edit ${i}: newText is empty`);

					// Build index lazily on first edit
					if (index === null) {
						index = await HashLineIndex.build(content);
					}

					// Find matching line sequence using content hash
					const matchLine = index.findSequence(oldText);
					if (matchLine < 0) {
						// Fallback: try direct text search (for non-line-based content)
						const pos = content.indexOf(oldText);
						if (pos < 0) {
							throw new Error(
								`Edit ${i}: Could not find the target code in ${params.path}. ` +
									`The content must match — indentation and whitespace are flexible, ` +
									`but the actual code structure must be the same.`,
							);
						}
						// Direct text match — use position
						content = content.slice(0, pos) + newText + content.slice(pos + oldText.length);
						if (firstChangedLine === undefined) {
							firstChangedLine = originalContent.slice(0, pos).split("\n").length;
						}
						// Full index rebuild (fallback path is rare)
						index = await HashLineIndex.build(content);
						continue;
					}

					// Get byte range of matched lines
					const oldLineCount = oldText.split("\n").length;
					const range = index.getByteRange(matchLine, matchLine + oldLineCount);

					// Re-indent the replacement to match original file style
					const replacement = index.reindent(newText, matchLine);

					// Apply via string slice+concat
					content = content.slice(0, range.start) + replacement + content.slice(range.end);

					if (firstChangedLine === undefined) {
						firstChangedLine = originalContent.slice(0, range.start).split("\n").length;
					}

					// Incrementally update index — only hashes the replacement lines
					index = await index.replace(matchLine, matchLine + oldLineCount, replacement);
				}

				// Generate diff and patch
				const newContent = content;
				const { diff, firstChangedLine: diffLine } = generateDiffString(originalContent, newContent);
				const patch = generateUnifiedPatch(absolutePath, originalContent, newContent);

				// Write to disk
				await writeFile(absolutePath, newContent, "utf-8");

				// Update cache with final state
				setCache(absolutePath, { content: newContent, index, mtime: Date.now() });

				const desc = params.edits.length === 1 ? "1 edit" : `${params.edits.length} edits`;
				return {
					content: [{ type: "text" as const, text: `Applied ${desc} to ${params.path}` }],
					details: {
						diff,
						patch,
						firstChangedLine: diffLine ?? firstChangedLine,
					},
				};
			});
		},
	};
}
