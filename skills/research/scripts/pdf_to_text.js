#!/usr/bin/env node
/** Extract PDF text with character offset/limit via the pdftotext CLI. */

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";

function usage() {
  console.error("Usage: pdf_to_text.js <file.pdf> [--offset N] [--limit N] [--lines]");
}

function readArgs(argv) {
  if (!argv[0]) throw new Error("PDF path is required");
  const result = { file: argv[0], offset: 0, limit: undefined, lines: false };
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === "--lines") result.lines = true;
    else if (argv[i] === "--offset" || argv[i] === "--limit") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 0) throw new Error(`${argv[i - 1]} must be a non-negative integer`);
      result[argv[i - 1].slice(2)] = value;
    } else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return result;
}

function extract(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("pdftotext", ["-layout", file, "-"], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => reject(new Error(`cannot start pdftotext: ${error.message}`)));
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `pdftotext exited with ${code}`)));
  });
}

try {
  const args = readArgs(process.argv.slice(2));
  await access(args.file);
  const text = await extract(args.file);
  const values = args.lines ? text.split(/(?<=\n)/) : [...text];
  const end = args.limit === undefined ? undefined : args.offset + args.limit;
  process.stdout.write(args.lines ? values.slice(args.offset, end).join("") : values.slice(args.offset, end).join(""));
} catch (error) {
  usage();
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
