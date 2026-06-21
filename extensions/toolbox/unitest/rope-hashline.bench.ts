import { bench, describe } from "vitest";
import { Rope } from "../src/rope";
import { HashLineIndex } from "../src/hashline";

const SIZE = 100_000;
const text = `function hello() {\n  console.log("hello world");\n}\n\n`.repeat(Math.ceil(SIZE / 50)).slice(0, SIZE);
const rope = Rope.from(text);

// Build index once outside benchmark (warmup)
let index: HashLineIndex;
await HashLineIndex.build(text).then(idx => { index = idx; });

describe("HashLineIndex build", () => {
	bench("build HashLineIndex from 100KB", async () => {
		await HashLineIndex.build(text);
	});
});

describe("matching: str_replace vs hashline", () => {
	const target = `  console.log("hello world");`;

	bench("indexOf (str_replace)", () => {
		text.indexOf(target);
	});

	bench("HashLineIndex.findSequence (pre-built)", () => {
		index.findSequence(target);
	});
});

describe("matching with wrong formatting", () => {
	const targetExact = `  console.log("hello world");`;
	const targetHallucinated = `\tconsole.log("hello world")`; // tab + no semicolon

	bench("indexOf fails on hallucinated text", () => {
		text.indexOf(targetHallucinated); // always returns -1
	});

	bench("HashLineIndex handles hallucinated text", () => {
		const line = index.findSequence(targetHallucinated);
		if (line >= 0) {
			const range = index.getByteRange(line, line + targetHallucinated.split("\n").length);
			rope.replace(range.start, range.end, targetExact);
		}
	});
});

describe("Rope + HashLine: edit with position", () => {
	const pos = Math.floor(SIZE / 2);

	bench("Rope.replace at known position", () => {
		rope.replace(pos, pos + 10, '"replaced"');
	});

	bench("String slice+concat at known position", () => {
		text.slice(0, pos) + '"replaced"' + text.slice(pos + 10);
	});
});

describe("full round-trip: hashline + rope", () => {
	bench("build index + find + replace + toString", async () => {
		const idx = await HashLineIndex.build(text);
		const line = idx.findSequence('console.log("hello world");');
		if (line >= 0) {
			const range = idx.getByteRange(line, line + 1);
			let r = Rope.from(text);
			r = r.replace(range.start, range.end, 'console.log("replaced");');
			r.toString();
		}
	});
});
