import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createReadTool } from "../src/read.ts";
import { createEditTool } from "../src/edit.ts";
import { clearCache } from "../src/cache.ts";

const tmpDir = mkdtempSync(join(tmpdir(), "toolbox-test-"));
const largeFile = join(tmpDir, "large.ts");

let fileCounter = 0;
function tmpFile(): string {
	fileCounter++;
	return join(tmpDir, `test_${fileCounter}.ts`);
}

const readTool = createReadTool(tmpDir);
const editTool = createEditTool(tmpDir);

function callRead(params: { path: string; offset?: number; limit?: number }) {
	return readTool.execute("call-1", params, undefined, undefined, { cwd: tmpDir } as any);
}

function callEdit(params: { path: string; edits: Array<{ oldText: string; newText: string }> }) {
	return editTool.execute("call-1", params, undefined, undefined, { cwd: tmpDir } as any);
}

beforeAll(async () => {
	await mkdir(tmpDir, { recursive: true });
	const largeContent = Array.from({ length: 3000 }, (_, i) => `line_${i}: const x = ${i};\n`).join("");
	writeFileSync(largeFile, largeContent);
});

afterAll(async () => {
	await rm(tmpDir, { recursive: true, force: true });
	clearCache();
});

describe("Read tool", () => {
	const file = tmpFile();

	beforeAll(() => {
		writeFileSync(file, `function hello() {\n  console.log("hello world");\n}\n`);
	});

	it("reads full file", async () => {
		const result = await callRead({ path: file });
		const text = result.content[0]!.text;
		expect(text).toContain('console.log("hello world")');
	});

	it("reads with offset", async () => {
		const result = await callRead({ path: file, offset: 2 });
		const text = result.content[0]!.text;
		expect(text).toContain('console.log("hello world")');
		expect(text).not.toContain("function hello");
	});

	it("reads with limit", async () => {
		const result = await callRead({ path: file, limit: 1 });
		const text = result.content[0]!.text;
		expect(text).toContain("function hello");
		expect(text).not.toContain("console.log");
	});

	it("throws on offset beyond file", async () => {
		await expect(callRead({ path: file, offset: 9999 })).rejects.toThrow(/beyond end of file/);
	});

	it("truncates at line limit", async () => {
		const result = await callRead({ path: largeFile });
		const text = result.content[0]!.text;
		expect(text).toContain("[Showing 2000 lines");
	});

	it("caches content after read", async () => {
		const f = tmpFile();
		writeFileSync(f, "hello");
		clearCache();
		await callRead({ path: f });
		const { getCache } = await import("../src/cache.ts");
		const entry = getCache(f);
		expect(entry).toBeDefined();
		expect(entry!.content).toContain("hello");
		expect(entry!.index).toBeNull();
	});
});

describe("Edit tool — single edit", () => {
	it("replaces exact text", async () => {
		const f = tmpFile();
		writeFileSync(f, `function hello() {\n  console.log("hello world");\n}\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{ oldText: '"hello world"', newText: '"goodbye world"' }],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		expect(readFileSync(f, "utf-8")).toContain('"goodbye world"');
	});

	it("replaces multi-line", async () => {
		const f = tmpFile();
		writeFileSync(f, `function alpha() {\n  return 1;\n}\n\nfunction beta() {\n  return 2;\n}\n\nfunction gamma() {\n  return 3;\n}\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{
				oldText: "function beta() {\n  return 2;\n}",
				newText: "function beta() {\n  return 42;\n}",
			}],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		expect(readFileSync(f, "utf-8")).toContain("return 42;");
	});
});

describe("Edit tool — content-aware matching", () => {
	it("handles whitespace differences (tab vs spaces, extra indentation)", async () => {
		const f = tmpFile();
		writeFileSync(f, `function greet(name) {\n\tconsole.log("Hello, " + name);\n\treturn name;\n}\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{
				oldText: '  console.log("Hello, " + name);\n  return name;',
				newText: '  console.log("Hi, " + name);\n  return name.toUpperCase();',
			}],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		const content = readFileSync(f, "utf-8");
		expect(content).toContain('"Hi, "');
		expect(content).toContain("toUpperCase()");
		expect(content).toContain("\tconsole.log");
		expect(content).toContain("\treturn name.toUpperCase()");
	});

	it("handles leading whitespace differences (tab vs spaces)", async () => {
		const f = tmpFile();
		writeFileSync(f, `function hello() {\n\tconsole.log("hello world");\n}\n`);
		clearCache();

		// oldText uses 2 spaces instead of tab — normalized by contentOnly (trimStart)
			const result = await callEdit({
			path: f,
				edits: [{
				oldText: '  console.log("hello world");',
			newText: '  console.log("modified");',
		}],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
	const content = readFileSync(f, "utf-8");
expect(content).toContain('"modified"');
	expect(content).toContain("\tconsole.log"); // original tab preserved
		});

	it("preserves original file indentation in replacement", async () => {
		const f = tmpFile();
		writeFileSync(f, `function foo() {\n    const x = 1;\n    return x;\n}\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{
				oldText: "const x = 1;\nreturn x;",
				newText: "const x = 42;\nreturn x + 1;",
			}],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		const content = readFileSync(f, "utf-8");
		expect(content).toContain("    const x = 42;");
		expect(content).toContain("    return x + 1;");
	});
});

describe("Edit tool — multi-edit", () => {
	it("applies multiple edits in one call", async () => {
		const f = tmpFile();
		writeFileSync(f, `function alpha() {\n  return 1;\n}\n\nfunction beta() {\n  return 2;\n}\n\nfunction gamma() {\n  return 3;\n}\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [
				{ oldText: "return 1;", newText: "return 10;" },
				{ oldText: "return 2;", newText: "return 20;" },
				{ oldText: "return 3;", newText: "return 30;" },
			],
		});
		expect(result.content[0]!.text).toMatch(/Applied 3 edits/);
		const content = readFileSync(f, "utf-8");
		expect(content).toContain("return 10;");
		expect(content).toContain("return 20;");
		expect(content).toContain("return 30;");
	});
});

describe("Edit tool — error cases", () => {
	it("throws when oldText not found", async () => {
		const f = tmpFile();
		writeFileSync(f, `const x = 1;\n`);
		clearCache();

		await expect(
			callEdit({
				path: f,
				edits: [{ oldText: "this does not exist anywhere", newText: "never" }],
			}),
		).rejects.toThrow(/Could not find/);
	});

	it("throws on empty oldText", async () => {
		const f = tmpFile();
		writeFileSync(f, "hello");
			clearCache();
				await expect(
				callEdit({ path: f, edits: [{ oldText: "", newText: "something" }] }),
			).rejects.toThrow(/oldText is empty/);
		});

it("throws on empty newText", async () => {
	const f = tmpFile();
		writeFileSync(f, "hello");
		clearCache();
			await expect(
				callEdit({ path: f, edits: [{ oldText: "hello", newText: "" }] }),
				).rejects.toThrow(/newText is empty/);
			});

	it("throws on no edits", async () => {
		clearCache();
		await expect(
			callEdit({
				path: tmpFile(),
				edits: [],
			}),
		).rejects.toThrow(/No edits/);
	});
});

describe("Read → Edit cache flow", () => {
	it("read then edit uses cache (no re-read)", async () => {
		const f = tmpFile();
		writeFileSync(f, `const x = 1;\nconsole.log(x);\n`);
		clearCache();

		await callRead({ path: f });
		const result = await callEdit({
			path: f,
			edits: [{ oldText: "console.log(x);", newText: "console.log(x + 1);" }],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		expect(readFileSync(f, "utf-8")).toContain("x + 1");
	});

	it("edit without prior read still works (reads from disk)", async () => {
		const f = tmpFile();
		writeFileSync(f, `const a = 1;\nconst b = 2;\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{ oldText: "const b = 2;", newText: "const b = 3;" }],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		expect(readFileSync(f, "utf-8")).toContain("b = 3");
	});
});

describe("Edit tool — diff and patch output", () => {
	it("includes diff in details", async () => {
		const f = tmpFile();
		writeFileSync(f, `const x = 1;\n`);
		clearCache();

		const result = await callEdit({
			path: f,
			edits: [{ oldText: "const x = 1;", newText: "const x = 2;" }],
		});
		expect(result.details).toBeDefined();
		expect(result.details!.diff).toBeDefined();
		expect(result.details!.patch).toBeDefined();
		expect(result.details!.patch).toContain("@@");
	});
});

describe("Edit tool — large file performance", () => {
	it("handles edit on a large file quickly", async () => {
		clearCache();

		const result = await callEdit({
			path: largeFile,
			edits: [{ oldText: "line_1500: const x = 1500;", newText: "line_1500: const x = 9999;" }],
		});
		expect(result.content[0]!.text).toMatch(/Applied 1 edit/);
		expect(readFileSync(largeFile, "utf-8")).toContain("x = 9999");
	});
});
