import { describe, it, expect } from "vitest";
import { HashLineIndex, contentOnly } from "./hashline.ts";

describe("contentOnly", () => {
	it("strips leading whitespace", () => {
		expect(contentOnly("  hello")).toBe("hello");
	});

	it("strips trailing whitespace", () => {
		expect(contentOnly("hello  ")).toBe("hello");
	});

	it("normalizes tabs to spaces", () => {
		expect(contentOnly("\t\t hello")).toBe("hello");
	});

	it("strips both ends with tabs", () => {
		expect(contentOnly("\tfoo  ")).toBe("foo");
	});

	it("returns empty string for whitespace-only line", () => {
		expect(contentOnly("   \t   ")).toBe("");
		expect(contentOnly("")).toBe("");
	});
});

describe("HashLineIndex", () => {
	describe("build", () => {
		it("builds index from text", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			expect(idx.length).toBe(3);
		});

		it("strips trailing empty line from split", () => {
			const idx = HashLineIndex.build("foo\nbar\n");
			expect(idx.length).toBe(2);
		});

		it("handles single line", () => {
			const idx = HashLineIndex.build("hello");
			expect(idx.length).toBe(1);
		});

		it("handles empty text", () => {
			const idx = HashLineIndex.build("");
			expect(idx.length).toBe(1);
			// single empty line
		});
	});

	describe("findSequence", () => {
		it("finds exact match", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			expect(idx.findSequence("bar")).toBe(1); // 0-indexed
		});

		it("finds match ignoring whitespace differences", () => {
			const idx = HashLineIndex.build("  foo\n  bar\n  baz");
			expect(idx.findSequence("bar")).toBe(1);
		});

		it("finds match with tab differences", () => {
			const idx = HashLineIndex.build("\tfoo\n\tbar");
			expect(idx.findSequence("    bar")).toBe(1); // tabs vs spaces
		});

		it("finds multiline sequence", () => {
			const idx = HashLineIndex.build("line1\nline2\nline3\nline4");
			expect(idx.findSequence("line2\nline3")).toBe(1);
		});

		it("finds multiline sequence with whitespace differences", () => {
			const idx = HashLineIndex.build(
				"  function foo() {\n    return 1;\n  }\n",
			);
			expect(idx.findSequence("function foo() {\n    return 1;\n}")).toBe(0);
		});

		it("finds match at start of file", () => {
			const idx = HashLineIndex.build("first\nsecond\nthird");
			expect(idx.findSequence("first")).toBe(0);
		});

		it("finds match at end of file", () => {
			const idx = HashLineIndex.build("first\nsecond\nthird");
			expect(idx.findSequence("third")).toBe(2);
		});

		it("returns -1 for no match", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			expect(idx.findSequence("qux")).toBe(-1);
		});

		it("returns -1 for partial match", () => {
			const idx = HashLineIndex.build("foobar\nbaz");
			expect(idx.findSequence("foo")).toBe(-1);
		});

		it("handles trailing whitespace in oldText", () => {
			const idx = HashLineIndex.build("const x = 1;\nconst y = 2;");
			expect(idx.findSequence("const x = 1;  ")).toBe(0);
		});

		it("matches first occurrence when content appears multiple times", () => {
			const idx = HashLineIndex.build(
				"const x = 1;\nconst y = 2;\nconst x = 1;",
			);
			expect(idx.findSequence("const x = 1;")).toBe(0); // first match
		});
	});

	describe("getByteRange", () => {
		it("returns byte range of single line (excludes trailing newline)", () => {
			const idx = HashLineIndex.build("hello\nworld");
			const range = idx.getByteRange(0, 1);
			// line 0: byteOffset=0, length=5 → end=5
			expect(range.start).toBe(0);
		expect(range.end).toBe(5);
});

			it("returns byte range of multiple lines", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			const range = idx.getByteRange(0, 2);
			// lines 0-1: byte offsets 0 and 4, lengths 3 and 3 → end=7
		expect(range.start).toBe(0);
expect(range.end).toBe(7);
		});

			it("returns byte range from middle of file", () => {
			const idx = HashLineIndex.build("aaa\nbbb\nccc\nddd");
			const range = idx.getByteRange(1, 3);
		// lines 1-2: byte offsets 4 and 8, lengths 3 and 3 → end=11
	expect(range.start).toBe(4);
expect(range.end).toBe(11);
	});
		});

	describe("reindent", () => {
		it("replaces indentation of replacement lines", () => {
			const idx = HashLineIndex.build("  foo\n  bar\n  baz");
			const result = idx.reindent("qux\nquux", 1);
			expect(result).toBe("  qux\n  quux");
		});

		it("preserves empty lines in replacement", () => {
			const idx = HashLineIndex.build("  foo\n  bar\n  baz");
			const result = idx.reindent("qux\n\nquux", 1);
			// empty line gets no indent; third line has no orig (past lines.length) → no indent
		expect(result).toBe("  qux\n\nquux");
});

		it("handles single line replacement", () => {
			const idx = HashLineIndex.build("  foo\n  bar");
			const result = idx.reindent("new", 0);
			expect(result).toBe("  new");
		});

		it("trims indentation from replacement lines", () => {
			const idx = HashLineIndex.build("  foo\n  bar");
			const result = idx.reindent("    new", 0);
			expect(result).toBe("  new");
		});
	});

	describe("replace", () => {
		it("returns new index with replaced lines", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			const newIdx = idx.replace(1, 2, "qux");
			expect(newIdx.length).toBe(3);
			// After replacement, should find new content
			expect(newIdx.findSequence("qux")).toBe(1);
			expect(newIdx.findSequence("bar")).toBe(-1);
		});

		it("handles replacement with more lines", () => {
			const idx = HashLineIndex.build("foo\nbar\nbaz");
			const newIdx = idx.replace(1, 2, "x\ny\nz");
			expect(newIdx.length).toBe(5);
			expect(newIdx.findSequence("x")).toBe(1);
			expect(newIdx.findSequence("y")).toBe(2);
			expect(newIdx.findSequence("z")).toBe(3);
		});

		it("handles replacement with fewer lines", () => {
			const idx = HashLineIndex.build("a\nb\nc\nd\ne");
			const newIdx = idx.replace(1, 4, "x"); // lines 1-3 replaced by 1 line
			expect(newIdx.length).toBe(3);
			expect(newIdx.findSequence("x")).toBe(1);
		});

		it("preserves findSequence on unchanged lines", () => {
			const idx = HashLineIndex.build("aaa\nbbb\nccc\nddd");
			const newIdx = idx.replace(1, 2, "xyz");
			// Lines 0 and 3 should still be findable.
			// After replace(1,2,"xyz"): aaa, xyz, ccc, ddd -- length 4, ddd at index 3
			expect(newIdx.findSequence("aaa")).toBe(0);
		expect(newIdx.findSequence("ddd")).toBe(3);
});

		it("supports chained replacements on the same index", () => {
			let idx = HashLineIndex.build("a\nb\nc\nd");
			idx = idx.replace(0, 1, "x");
			idx = idx.replace(2, 3, "y"); // originally "c" is now at index 2
			expect(idx.findSequence("x")).toBe(0);
			expect(idx.findSequence("y")).toBe(2);
		});
	});
});
