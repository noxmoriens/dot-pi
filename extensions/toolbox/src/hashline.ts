import xxhash from "xxhash-wasm";

let _hash: ((s: string) => string) | null = null;

async function getHasher(): Promise<(s: string) => string> {
	if (!_hash) {
		const api = await xxhash();
		_hash = (s: string) => api.h64ToString(s);
	}
	return _hash;
}

/** Strip all leading/trailing whitespace and normalize tabs */
function contentOnly(line: string): string {
	return line.trimEnd().replace(/\t/g, " ").trimStart();
}

export interface HashLine {
	contentHash: string;
	byteOffset: number;
	length: number;
	indent: string;
}

function getIndent(line: string): string {
	return line.match(/^\s*/)?.[0] ?? "";
}

export class HashLineIndex {
	private lines: HashLine[] = [];
	private hash: ((s: string) => string) | null = null;

	private constructor() {}

	static async build(text: string): Promise<HashLineIndex> {
		const idx = new HashLineIndex();
		const hash = await getHasher();
		idx.hash = hash;
		const rawLines = text.split("\n");
		// Remove trailing empty entry from final \n (not real content)
		if (text.endsWith("\n") && rawLines[rawLines.length - 1] === "") {
			rawLines.pop();
				}
				let offset = 0;
		for (const line of rawLines) {
			idx.lines.push({
				contentHash: hash(contentOnly(line)),
				byteOffset: offset,
				length: line.length,
				indent: getIndent(line),
			});
			offset += line.length + 1; // +1 for \n
		}
		return idx;
	}

	get length(): number {
		return this.lines.length;
	}

	/** Find a sequence of oldText lines by content hash. Returns the starting line index, or -1. */
	findSequence(oldText: string): number {
		if (!this.hash) return -1;
		const oldLines = oldText.split("\n");
		const oldHashes = oldLines.map((l) => this.hash!(contentOnly(l)));

		for (let i = 0; i <= this.lines.length - oldHashes.length; i++) {
			let match = true;
			for (let j = 0; j < oldHashes.length; j++) {
				if (this.lines[i + j]!.contentHash !== oldHashes[j]!) {
					match = false;
					break;
				}
			}
			if (match) return i;
		}
		return -1;
	}

	/** Get the byte range for a sequence of lines [startLine, endLine) */
	getByteRange(startLine: number, endLine: number): { start: number; end: number } {
		const start = this.lines[startLine]!.byteOffset;
		const end = this.lines[endLine - 1]!.byteOffset + this.lines[endLine - 1]!.length;
		return { start, end };
	}

	/**
	 * Given an oldText match, compute the replacement text with proper indentation
	 * matching the original file's style.
	 */
	reindent(replacement: string, startLine: number): string {
		const newLines = replacement.split("\n");
		return newLines
			.map((line, i) => {
				const orig = this.lines[startLine + i];
				if (!orig || line.trim().length === 0) return line;
				return orig.indent + line.trimStart();
			})
			.join("\n");
	}

	/**
	 * Replace lines [startLine, endLine) with new text, returning a new
	 * HashLineIndex. Only hashes the replacement lines — unchanged lines
	 * are carried over with updated byte offsets.
	 */
	async replace(
		startLine: number,
		endLine: number,
		replacementText: string,
	): Promise<HashLineIndex> {
		const hash = await getHasher();
		const oldByteLen = this.getByteRange(startLine, endLine).end -
			this.getByteRange(startLine, endLine).start;
		const newByteLen = replacementText.length;
		const delta = newByteLen - oldByteLen;

		const newLines = replacementText.split("\n");
		const newEntries: HashLine[] = [];
		let runningOffset = this.lines[startLine]!.byteOffset;
		for (const line of newLines) {
			newEntries.push({
				contentHash: hash(contentOnly(line)),
				byteOffset: runningOffset,
				length: line.length,
				indent: getIndent(line),
			});
			runningOffset += line.length + 1;
		}

		const idx = new HashLineIndex();
		idx.hash = this.hash;
		idx.lines = [
			...this.lines.slice(0, startLine),
			...newEntries,
			...this.lines.slice(endLine).map((l) => ({
				...l,
				byteOffset: l.byteOffset + delta,
			})),
		];
		return idx;
	}
}
