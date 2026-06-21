---
name: frontend
description: >
  You must use this skill when building any UI, page, or component. Covers
  design philosophy, tokens (color/typography/spacing), motion, page
  structure, and integrated frontend design methodology.
---

# When to use

- Building any UI, page, or component
- Needing design direction for warm, editorial, dark-mode aesthetic
- Starting a new project, reviewing design direction, establishing UX principles
- Writing CSS, configuring Tailwind, choosing fonts, defining visual properties
- Implementing hover, focus, transitions, loading states, page transitions
- Building page structure, layout, navigation, sidebar, cards, or reusable components

Do NOT use when project has its own established design system, or user wants a different look.

# Steps

### 1. Run color determination protocol

Scan for existing colors in Tailwind config or CSS variables. If consistent, use as-is. If inconsistent, explain what's wrong. If not found, ask user: default Warm Clay (`#c47a54`), name-match, or custom hex. Generate OKLCH palette. Validate contrast: accent/bg ≥4.5:1, text/bg ≥7:1.

### 2. Choose typography

Ask project type, suggest 2-3 pairings from references. Let user pick. Fallback only on "you choose." No hardcoding fonts.

### 3. Establish design identity

Rasa: intersection of Notion (editorial clarity), Linear (precision), Craft (writing-focused surfaces). Personality: warm, calm, spacious, soft, editorial, minimal, structured. Document anti-patterns — no neon, glassmorphism, gradient text, blue accents.

### 4. Build app shell

Top bar (h-14, breadcrumbs left, avatar right) + Sidebar (w-64, bg `#0d0d0d`, section labels) + Main (scrollable, max-w-4xl). Surface stacking: page `#090909` → app `#111111` → card `#161616` → modal `#1a1a1a`. Desktop-first; sidebar collapses to drawer on mobile.

### 5. Apply motion

Hover: bg/color only, 200ms ease, no scale. Focus: `focus-visible` ring only. Page load: stagger max 5 items, 80ms apart, 6px Y-offset. Route: opacity only, 200ms. Toggle: 200ms. Dropdown: 150ms. Wrap all in `@media (prefers-reduced-motion)`.

### 6. Wire components

Cards: bg `#161616`, rounded-xl (12px), p-6. Buttons: primary `#c47a54`, secondary bordered, ghost hover-only. Sidebar active: border-r-2 accent. Tables: subtle bottom border or hover highlight. Use color difference over borders for surfaces.

# Sub-skill reference

- design-identity — design philosophy, anti-patterns
- design-tokens — colors, typography, spacing, shadows
- ui-system — page layout, sidebar, cards, navigation
- design-motion — hover, transitions, loading states

# Gotchas

- Always load before generating HTML/CSS/JSX — tokens affect every visual decision.
- No Tailwind defaults — no blue-500, gray-800. Use resolved palette.
- Accent is earned — one warm accent (clay, amber, sage). Never blue/purple/teal as primary.
- Never animate `all` — always specify the property. Layout reflow risk.
- Reduced motion is not optional — wrap all animations.
- Use color difference for depth, not stacked shadows or bg-opacity.
- Sidebar icons stay text-secondary — accent is for active state only.
- Always constrain content width with max-w-4xl.
- Dark mode is default unless user specifies light mode.
- Don't mix warm and cool grays — all grays share undertone.
