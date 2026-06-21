---
name: cli-design
description: >
  You must use this skill when building terminal UI, CLI tools, or TUI applications following the Warm Clay system. Master skill for chat-style terminal interface design that composes cli-identity, cli-tokens, and cli-components.
---

# CLI Design — Warm Clay Terminal

## Design Direction

Chat-style terminal interface for AI coding agents.
Think Claude Code, Codex CLI, or OpenCode.

The UI should feel: fast, structured, intelligent, calm,
professional, machine-like but elegant.

Not: hacker-green-on-black, cyberpunk, RGB overload, chatbox.

## Layout Structure

```
┌─────────────────────────────────────────┐
│  VIEWPORT — scrollable chat area        │
│  > user message                         │
│  ● thinking                             │
│  │ ├ reasoning step                     │
│  │ └ tool call                          │
│  ● AI response text                     │
│  ───────────────────────────────────    │
│                                         │
│  LOADING INDICATOR (optional)           │
│                                         │
│  WIDGET — pluggable panel (optional)    │
│  ┌─ widget title ───────────────────┐   │
│  │ content                           │   │
│  └──────────────────────────────────-┘   │
│                                         │
│  EDITOR INPUT — multi-line              │
│  > text here...                         │
│                                         │
│  ───────────────────────────────────    │
│  Type / for command · @ for mentions    │
│  ───────────────────────────────────    │
│  opus 4.7 · 1M (24%)                    │
└─────────────────────────────────────────┘
```

## Core Principles

1. Chat-native — conversation flows top to bottom.
   User message → thinking tree → AI response → divider.

2. Thinking is visible — AI reasoning shown as tree
   dengan `├` / `└`. Transparan. User tau apa yang terjadi.

3. Multi-line input — single-line editor is outdated.
   Multi-line dengan syntax highlight untuk code blocks.

4. Widget as plugin — center area fills with file tree,
   search panel, tool results, atau apapun. Modular.

5. Footer is dashboard — model, context usage, mode —
   selalu visible, gak pernah ngambang.

6. Consult, don't prescribe — loading indicator style, ANSI symbol set,
   color choices, dan preferensi visual lainnya harus ditanyakan ke user
   dulu, bukan dipilihkan oleh agent. Agent adalah konsultan desain,
   bukan diktator.

## Anti-AI-Slop Rules

- No Matrix green-on-black
- No ASCII art banner startup
- No loading spinner yang berputar >3s tanpa info
- No RGB rainbow di output
- No chat bubble UI (ini terminal, bukan WhatsApp)
- No emoji sebagai primary indicator
- No silent design decisions — every visual choice the user might
  care about should be a conversation, not an assumption

## Sub-skill Reference

- cli-identity — establishing design philosophy
- cli-tokens — colors, spacing, unicode symbols
- cli-components — building viewport, thinking tree, editor, widget, footer

## Gotchas

- Always load cli-identity first — design philosophy drives component decisions, not the other way around.
- Don't use all sub-skills at once — load cli-tokens only when defining tokens, cli-components only when building structure.
