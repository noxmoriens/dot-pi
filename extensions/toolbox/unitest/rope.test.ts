import { describe, it, expect } from "vitest";
import { Rope } from "../src/rope";

describe("Rope", () => {
	describe("construction", () => {
		it("creates empty rope", () => {
			const r = Rope.from("");
			expect(r.length).toBe(0);
			expect(r.toString()).toBe("");
		});

		it("creates rope from single character", () => {
			const r = Rope.from("a");
			expect(r.length).toBe(1);
			expect(r.toString()).toBe("a");
		});

		it("creates rope from short string", () => {
			const r = Rope.from("hello");
			expect(r.length).toBe(5);
			expect(r.toString()).toBe("hello");
		});

		it("creates rope at leaf threshold boundary", () => {
			const text = "x".repeat(128);
			const r = Rope.from(text);
			expect(r.length).toBe(128);
			expect(r.toString()).toBe(text);
		});

		it("creates rope just above leaf threshold", () => {
			const text = "x".repeat(129);
			const r = Rope.from(text);
			expect(r.length).toBe(129);
			expect(r.toString()).toBe(text);
		});

		it("creates rope from large string", () => {
			const text = "abc".repeat(1000); // 3000 chars
			const r = Rope.from(text);
			expect(r.length).toBe(3000);
			expect(r.toString()).toBe(text);
		});
	});

	describe("charAt", () => {
		it("returns character at valid index", () => {
			const r = Rope.from("hello");
			expect(r.charAt(0)).toBe("h");
			expect(r.charAt(2)).toBe("l");
			expect(r.charAt(4)).toBe("o");
		});

		it("returns undefined for negative index", () => {
			const r = Rope.from("hello");
			expect(r.charAt(-1)).toBeUndefined();
		});

		it("returns undefined for index >= length", () => {
			const r = Rope.from("hi");
			expect(r.charAt(2)).toBeUndefined();
			expect(r.charAt(100)).toBeUndefined();
		});

		it("returns undefined for empty rope", () => {
			const r = Rope.from("");
			expect(r.charAt(0)).toBeUndefined();
		});

		it("works on large rope", () => {
			const text = "x".repeat(1000);
			const r = Rope.from(text);
			expect(r.charAt(0)).toBe("x");
			expect(r.charAt(500)).toBe("x");
			expect(r.charAt(999)).toBe("x");
		});
	});

	describe("insert", () => {
		it("inserts at start", () => {
			const r = Rope.from("world");
			expect(r.insert(0, "hello ").toString()).toBe("hello world");
		});

		it("inserts at end", () => {
			const r = Rope.from("hello");
			expect(r.insert(5, " world").toString()).toBe("hello world");
		});

		it("inserts in middle", () => {
			const r = Rope.from("hello world");
			expect(r.insert(5, ",").toString()).toBe("hello, world");
		});

		it("inserts empty string returns same rope", () => {
			const r = Rope.from("hello");
			expect(r.insert(2, "")).toBe(r);
		});

		it("inserts into empty rope", () => {
			const r = Rope.from("");
			expect(r.insert(0, "hello").toString()).toBe("hello");
		});

		it("clamps index to valid range", () => {
			const r = Rope.from("ab");
			expect(r.insert(-1, "x").toString()).toBe("xab");
			expect(r.insert(10, "y").toString()).toBe("aby");
		});

		it("preserves original rope (immutable)", () => {
			const r = Rope.from("hello");
			r.insert(0, "x");
			expect(r.toString()).toBe("hello");
		});

		it("supports multiple sequential inserts", () => {
			let r = Rope.from("");
			r = r.insert(0, "world");
			r = r.insert(0, "hello ");
			r = r.insert(11, "!");
			expect(r.toString()).toBe("hello world!");
		});
	});

	describe("delete", () => {
		it("deletes from start", () => {
			const r = Rope.from("hello world");
			expect(r.delete(0, 6).toString()).toBe("world");
		});

		it("deletes from middle", () => {
			const r = Rope.from("hello world");
			expect(r.delete(5, 1).toString()).toBe("helloworld");
		});

		it("deletes from end", () => {
			const r = Rope.from("hello world");
			expect(r.delete(5, 6).toString()).toBe("hello");
		});

		it("deletes entire string", () => {
			const r = Rope.from("hello");
			expect(r.delete(0, 5).toString()).toBe("");
			expect(r.delete(0, 5).length).toBe(0);
		});

		it("returns same rope for zero length", () => {
			const r = Rope.from("hello");
			expect(r.delete(2, 0)).toBe(r);
		});

		it("clamps delete within bounds", () => {
			const r = Rope.from("abc");
			const deleted = r.delete(1, 100);
			expect(deleted.toString()).toBe("a");
			expect(deleted.length).toBe(1);
		});
	});

	describe("replace", () => {
		it("replaces with longer text", () => {
			const r = Rope.from("hello world");
			expect(r.replace(6, 11, "there!!").toString()).toBe("hello there!!");
		});

		it("replaces with shorter text", () => {
			const r = Rope.from("hello world");
			expect(r.replace(6, 11, "!" ).toString()).toBe("hello !");
		});

		it("replaces with same length", () => {
			const r = Rope.from("hello world");
			expect(r.replace(6, 11, "buddy").toString()).toBe("hello buddy");
		});

		it("replaces entire rope", () => {
			const r = Rope.from("hello");
			expect(r.replace(0, 5, "world").toString()).toBe("world");
		});

		it("removes text when replacement is empty", () => {
			const r = Rope.from("hello world");
			expect(r.replace(5, 6, "").toString()).toBe("helloworld");
		});

		it("inserts when start equals end", () => {
			const r = Rope.from("hello world");
			expect(r.replace(5, 5, ",").toString()).toBe("hello, world");
		});
	});

	describe("edge cases", () => {
		it("handles unicode characters", () => {
			const r = Rope.from("héllo wörld");
			expect(r.length).toBe(11);
			expect(r.charAt(1)).toBe("é");
			expect(r.charAt(7)).toBe("ö");
			expect(r.toString()).toBe("héllo wörld");
		});

		it("handles emoji (multi-byte)", () => {
			// Note: JavaScript charAt returns UTF-16 code units, so 🚀 (U+1F680)
			// is at indices 1-2 as a surrogate pair.
			const r = Rope.from("a🚀b");
			expect(r.length).toBe(4);
			expect(r.charAt(0)).toBe("a");
			expect(r.charAt(1)).toBe("\uD83D"); // high surrogate
			expect(r.charAt(2)).toBe("\uDE80"); // low surrogate
			expect(r.charAt(3)).toBe("b");
			expect(r.toString()).toBe("a🚀b");
		});

		it("handles very large rope", () => {
			const text = "x".repeat(100_000);
			const r = Rope.from(text);
			expect(r.length).toBe(100_000);
			expect(r.charAt(50_000)).toBe("x");
			expect(r.charAt(99_999)).toBe("x");
		});

		it("supports chained operations on large rope", () => {
			let r = Rope.from("a".repeat(10_000));
			r = r.insert(5_000, "INSERT");
			expect(r.length).toBe(10_006);
			expect(r.charAt(5_000)).toBe("I");
			expect(r.charAt(5_005)).toBe("T");

			r = r.delete(5_000, 6);
			expect(r.length).toBe(10_000);
			expect(r.charAt(5_000)).toBe("a");

			r = r.replace(4_000, 4_005, "REPLACE");
			expect(r.length).toBe(10_002);
			expect(r.charAt(4_000)).toBe("R");
		});
	});

	describe("rebalance", () => {
		it("produces correct result after rebalance", () => {
			let r = Rope.from("hello world");
			for (let i = 0; i < 100; i++) {
				r = r.insert(5, "!");
			}
			const original = r.toString();
			const balanced = r.rebalance();
			expect(balanced.toString()).toBe(original);
			expect(balanced.length).toBe(r.length);
		});
	});

	describe("immutability", () => {
		it("operations do not mutate the original rope", () => {
			const r = Rope.from("hello");
			r.insert(0, "x");
			expect(r.toString()).toBe("hello");

			r.delete(0, 1);
			expect(r.toString()).toBe("hello");

			r.replace(0, 2, "ab");
			expect(r.toString()).toBe("hello");
		});
	});
});
