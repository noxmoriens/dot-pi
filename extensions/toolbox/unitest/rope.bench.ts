import { bench, describe } from "vitest";
import { Rope } from "../src/rope";

const SIZE = 100_000;
const text = "hello world\n".repeat(Math.ceil(SIZE / 12)).slice(0, SIZE);
const rope = Rope.from(text);
const center = Math.floor(SIZE / 2);

describe("Rope vs String: construction", () => {
	bench("Rope.from(string)", () => {
		Rope.from(text);
	});

	bench("String (no-op baseline)", () => {
		text;
	});
});

describe("Rope vs String: single replace at middle", () => {
	const replacement = "REPLACEMENT_TEXT_HERE";

	bench("Rope.replace", () => {
		rope.replace(center, center + 10, replacement);
	});

	bench("String slice+concat", () => {
		text.slice(0, center) + replacement + text.slice(center + 10);
	});
});

describe("Rope vs String: 10 sequential replaces", () => {
	const replacements = Array.from({ length: 10 }, (_, i) => ({
		pos: Math.floor((SIZE / 11) * (i + 1)),
		text: `REPLACE_${i}_`,
	}));

	let ropeState: Rope;
	let stringState: string;

	bench("Rope: 10 sequential replaces", () => {
		ropeState = rope;
		for (const { pos, text: repl } of replacements) {
			ropeState = ropeState.replace(pos, pos + 1, repl);
		}
	});

	bench("String: 10 sequential slice+concat", () => {
		stringState = text;
		for (const { pos, text: repl } of replacements) {
			stringState = stringState.slice(0, pos) + repl + stringState.slice(pos + 1);
		}
	});
});

describe("Rope vs String: toString after edits", () => {
	const ropeState = rope.replace(center, center + 10, "EDITED____");
	const stringState = text.slice(0, center) + "EDITED____" + text.slice(center + 10);

	bench("Rope.toString()", () => {
		ropeState.toString();
	});

	bench("String (already a string, no-op)", () => {
		stringState;
	});
});

describe("Rope vs String: charAt random access (1000 lookups)", () => {
	const indices = Array.from({ length: 1000 }, () =>
		Math.floor(Math.random() * SIZE),
	);

	bench("Rope.charAt() 1000x", () => {
		for (const i of indices) {
			rope.charAt(i);
		}
	});

	bench("String[index] 1000x", () => {
		for (const i of indices) {
			text[i];
		}
	});
});
