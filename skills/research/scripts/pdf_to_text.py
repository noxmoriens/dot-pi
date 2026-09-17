#!/usr/bin/env python3
"""Extract PDF text with character offset/limit or line offset/limit."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def extract(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(path)
    binary = shutil.which("pdftotext")
    if not binary:
        raise RuntimeError("pdftotext is required but was not found in PATH")
    result = subprocess.run(
        [binary, "-layout", str(path), "-"],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "pdftotext failed")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--offset", type=int, default=0, help="Starting character or line index")
    parser.add_argument("--limit", type=int, default=None, help="Maximum characters or lines")
    parser.add_argument("--lines", action="store_true", help="Apply offset/limit to lines instead of characters")
    args = parser.parse_args()
    if args.offset < 0 or args.limit is not None and args.limit < 0:
        parser.error("offset and limit must be non-negative")
    try:
        text = extract(args.pdf)
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    if args.lines:
        values = text.splitlines(keepends=True)
        end = None if args.limit is None else args.offset + args.limit
        sys.stdout.write("".join(values[args.offset:end]))
    else:
        end = None if args.limit is None else args.offset + args.limit
        sys.stdout.write(text[args.offset:end])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
