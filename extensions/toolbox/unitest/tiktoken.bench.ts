import { afterAll, bench, describe } from "vitest";
import { get_encoding } from "tiktoken";
import { Rope } from "../src/rope";

// Initialize tiktoken once (do NOT free until after all benchmarks)
const enc = get_encoding("cl100k_base");

const SIZE = 100_000;
const text = `function hello() {\n  console.log("hello world");\n}\n\n`.repeat(Math.ceil(SIZE / 50)).slice(0, SIZE);
const rope = Rope.from(text);

const tokens = enc.encode(text);

// Debug: check if encoding is deterministic
const targetStr = `console.log("hello world")`;
const targetTokens1 = enc.encode(targetStr);
const targetTokens2 = enc.encode(targetStr);
console.log("Deterministic check:", Array.from(targetTokens1).join(",") === Array.from(targetTokens2).join(",") ? "PASS" : "FAIL");
console.log(`Text: ${text.length} chars → ${tokens.length} tokens`);

// Find token match
function findTokenSequence(tokens: Uint32Array, target: Uint32Array): number {
	const t = Array.from(tokens);
	const tg = Array.from(target);
	for (let i = 0; i <= t.length - tg.length; i++) {
		let match = true;
		for (let j = 0; j < tg.length; j++) {
			if (t[i + j] !== tg[j]) { match = false; break; }
		}
		if (match) return i;
	}
	return -1;
}

const targetPos = text.indexOf(targetStr);
const tokenPos = findTokenSequence(tokens, targetTokens1);
console.log(`Text indexOf "${targetStr}": ${targetPos}`);
console.log(`BPE token match: ${tokenPos >= 0 ? `found at token ${tokenPos}` : "NOT FOUND"}`);

// Check matching at the expected position
if (tokenPos === -1 && targetPos >= 0) {
	// Try to find WHY it doesn't match
	const textAround = text.slice(Math.max(0, targetPos - 5), targetPos + targetStr.length + 5);
	const tokensAround = enc.encode(textAround);
	console.log(`Tokens around target: ${Array.from(tokensAround).join(",")}`);
	console.log(`Target tokens: ${Array.from(targetTokens1).join(",")}`);
	// Check if the target tokens appear anywhere in the text-around tokens
	const subPos = findTokenSequence(tokensAround, targetTokens1);
	console.log(`Substring token match in region: ${subPos >= 0 ? "FOUND" : "NOT FOUND"}`);
}

const replacementStr = `console.log("replaced world")`;
const targetTokenArr = Array.from(targetTokens1);

describe("tiktoken encode/decode", () => {
	bench("encode 100KB text", () => {
		enc.encode(text);
	});

	bench("decode all tokens", () => {
		enc.decode(tokens);
	});
});

describe("text matching: indexOf vs BPE token search", () => {
	bench("str_replace: indexOf", () => {
		text.indexOf(targetStr);
	});

	bench("BPE: token sequence search", () => {
		findTokenSequence(tokens, targetTokens1);
	});
});

describe("Rope replace vs string slice+concat", () => {
	const pos = Math.floor(SIZE / 2);
	const replacement = '"replaced"';

	bench("Rope.replace (position-based)", () => {
		rope.replace(pos, pos + 10, replacement);
	});

	bench("String slice+concat", () => {
		text.slice(0, pos) + replacement + text.slice(pos + 10);
	});
});

afterAll(() => {
	enc.free();
});
