# Extractor Tutorial

Goal: emit one markdown file per class and per function into specs/wayfire/class/ and specs/wayfire/function/ so wayfire can later validate them and an AI can navigate without opening source.

## Output format per symbol

class/<Name>.md:

```
# <ClassName>

- Signature: `<full class/interface declaration>`
- Location: `<relPath>:<line>`
- Purpose: <from doc comment, or "undocumented">
- Members:
  - `<memberSignature>` — <purpose or undocumented>
```

function/<Name>.md:

```
# <functionName>

- Signature: `<full signature>`
- Location: `<relPath>:<line>`
- Purpose: <from doc comment, or "undocumented">
- Calls/Depends on: <noted symbols or undocumented>
```

## Language recipes

TypeScript / JavaScript (preferred, most reliable):
- Use the `typescript` package (available in node/bun projects).
- Create a Program/SourceFile, walk the compiler AST with forEachChild to find ClassDeclaration / FunctionDeclaration / arrow consts assigned to functions.
- Read the leading doc comment (getJSDocComment) for purpose.
- Emit md with getStart line numbers.

Python:
- Prefer tree-sitter-python. Query class_definition and function_definition nodes; capture the docstring as purpose.
- Fallback: the ast module to walk and dump declarations with line numbers.

Go / Rust / Java / others:
- Prefer a tree-sitter grammar for the language.
- Query class/struct/impl and function/method nodes; capture doc comments.
- Fallback: language server, or grep + regex for `func`/`def`/`class` declarations with file:line, then read the doc comment above.

Regex fallback (last resort, any language):
- Pattern per language to capture the declaration plus line number, e.g. `^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)`.
- Read the comment block immediately above for purpose.
- Mark purpose "undocumented" when none exists. Accept lower precision.

## Sanitizing filenames

- Replace path separators and spaces; keep `[A-Za-z0-9_.-]`.
- On name collision, append the first 6 hex chars of a hash of the relative path.

## Determinism note

- The extractor is heuristic. Missing a symbol or misreading a doc comment is acceptable; do not guess purpose. wayfire flags staleness structurally, not semantically.
