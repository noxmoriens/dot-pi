---
name: design-doc
description: >
  You must use this skill when producing a DESIGN.md file following the Google
  DESIGN.md specification. Covers YAML design tokens, prose sections in
  canonical order, token references, and component variants. Also use when user
  says 'design doc', 'design decisions', 'design spec', 'design system doc',
  'UI/UX spec', or 'visual design'.
---

# When to use

- User says "create design doc", "design decisions", "design spec", "design system", "UI/UX spec", "visual design document"
- A new project or feature needs a documented design system before implementation
- Reviewing or updating an existing DESIGN.md

Do NOT use when:
- User just wants code generated (use frontend skill instead)
- User needs project scope or requirements specs (use specs-creator)
- An existing DESIGN.md already covers the same scope

# Steps

The output DESIGN.md has two layers: YAML frontmatter for machine-readable tokens, then markdown prose with human-readable rationale. The YAML tokens are the normative values. The prose provides context for applying them.

### 1. Determine scope and context

Read SPECS.md if it exists at specs/SPECS.md. Check for existing DESIGN.md at specs/DESIGN.md. Map what needs documenting:

- Full product, redesign, new feature, or single component?
- Target audience and usage context?
- Existing brand guidelines or design system?
- Platform (web, mobile, desktop)?

Ask the user to clarify anything not covered by existing docs.

### 2. Define design tokens (YAML frontmatter)

Build the YAML frontmatter with design tokens. The `---` fence must start and end the block. Required fields:

```yaml
---
version: alpha
name: [Project or brand name]
colors:
  primary: "[hex or OKLCH value]"
  secondary: "[value]"
  tertiary: "[value]"
  neutral: "[value]"
typography:
  [level-name]:
    fontFamily: "[font name]"
    fontSize: [value with unit]
    fontWeight: [numeric weight]
    lineHeight: [value]
rounded:
  sm: [value]
  md: [value]
  lg: [value]
spacing:
  base: [value]
  sm: [value]
  md: [value]
  lg: [value]
  xl: [value]
components:
  [component-name]:
    [property]: "[literal or {path.to.token}]"
---
```

Token types: Color (any CSS color), Dimension (number + unit), Token Reference (`{colors.primary}`), Typography (object with fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontFeature, fontVariation).

Components use token references to link to colors, typography, and rounded tokens. Variants are expressed as related keys: `button-primary`, `button-primary-hover`, `button-primary-active`.

Valid component properties: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.

If the user cannot provide complete token values, document what is known and mark the gaps. The YAML frontmatter must be valid — malformed YAML breaks the linter.

### 3. Write Overview section

The Overview defines the brand personality, target audience, and the emotional response the UI should evoke. It is the foundation for all stylistic decisions not explicitly covered by a token or rule.

Follow the philosophy: a specific reference carries more than a list of adjectives. Instead of "modern, clean, trustworthy, premium", write something like:

> A graduate-level computer science lecture handout in the tradition of an old established university. The audience is graduate students and research engineers. The design is austere, informationally dense, and proudly unconcerned with first impressions.

A single evocative sentence carries more design constraint than a dozen adjectives. Limit to 2-4 paragraphs.

### 4. Write Colors section

Document the color palette and its rationale. Format as markdown prose with a bullet list mapping each color to its purpose:

```
## Colors

[1-2 paragraphs describing the color strategy]

- **Primary ({colors.primary}):** [what it's used for and why]
- **Secondary ({colors.secondary}):** [what it's used for and why]
- **Tertiary ({colors.tertiary}):** [what it's used for and why]
- **Neutral ({colors.neutral}):** [what it's used for and why]
```

Use `{token.reference}` syntax inline to link prose to YAML token values. Every color token should have a rationale explaining when and why it is used. At minimum the `primary` color must be defined.

### 5. Write Typography section

Document the typography strategy and each type level. Include font choices and the rationale behind them:

```
## Typography

[1-2 paragraphs describing the typography strategy]

- **Headlines ({typography.h1.fontFamily}):** [rationale and usage]
- **Body ({typography.body-md.fontFamily}):** [rationale and usage]
- **Labels ({typography.label-caps.fontFamily}):** [rationale and usage]
```

Each role should reference its YAML token. If the user has not specified fonts, suggest pairings based on the overview's character (serif for editorial, sans-serif for utilitarian, mono for technical).

### 6. Write Layout section

Document the layout and spacing strategy. Describe the grid model, page anatomy, and spacing scale:

```
## Layout

[2-3 paragraphs describing the layout approach, grid system, breakpoints]

- Grid: [column count, gutter, margin]
- Page anatomy: [top bar, sidebar, main content dimensions]
- Breakpoints: [device ranges]
- Content width constraint: [max-width value]
```

Reference spacing tokens from the YAML frontmatter where relevant using `{spacing.xxx}` syntax.

### 7. Write Elevation and Depth section

Document how visual hierarchy is conveyed. If using shadows, define the elevation levels. If using a flat design, explain the alternative method (color contrast, borders, tonal layers):

```
## Elevation & Depth

[1-2 paragraphs describing the elevation strategy]

- Surface hierarchy: [layer descriptions from deepest to most elevated]
- Shadow levels: [level 1 through level N with CSS values]
```

For flat designs, state directly that elevation is achieved through color contrast rather than shadows.

### 8. Write Shapes section

Document the shape language for containers, inputs, and interactive elements:

```
## Shapes

[1-2 paragraphs describing the shape philosophy]

- Border radius: [reference to rounded tokens with rationale]
```

Reference `{rounded.xxx}` tokens from the YAML frontmatter.

### 9. Define component tokens

For each component in scope, add YAML token entries in the frontmatter under `components:`. Each component gets entries for its variants:

```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
```

Required variants: default, hover. Recommended: active/focus, disabled. Cover all states documented in the Components prose section.

### 10. Write Components section

Document each component's design decisions in prose. For each component:

```
### [Component Name]

[1-2 sentences describing the component's role]

- **Variants**: [list and when each is used]
- **States**: default, hover, active/focus-visible, disabled — visual description of each
- **Behavior**: [interaction rules, edge cases, responsive behavior]
```

Every component must document all states. Missing states is the most common failure. The YAML component tokens and the prose must be consistent — if the prose mentions a hover state, a corresponding hover variant token must exist in the frontmatter.

### 11. Write Do's and Don'ts section

This section provides guardrails. It is one of the most valuable parts of the document — strong Do's and Don'ts prevent the most regressions. Examples:

```
## Do's and Don'ts

- Do use the primary color only for the single most important action per screen
- Don't mix rounded and sharp corners in the same view
- Do maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Don't use more than two font weights on a single screen
- Don't animate `all` — animate specific properties only
- Do respect `prefers-reduced-motion`: collapse all durations to 0ms
- Don't convey information through color alone — use icons or labels
```

Aim for 8-15 items covering: color usage, typography, spacing, motion, accessibility, and component-specific rules.

The spec order for this section is last. Verify it comes after Components in the output.

### 12. Assemble and verify

Combine the YAML frontmatter and all sections into a single `specs/DESIGN.md` file. Verify:

- Frontmatter uses `---` fences, valid YAML
- All 8 sections present (can omit irrelevant ones) in canonical order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts
- Every `{path.to.token}` reference resolves to an existing YAML token
- Component entries cover default state plus hover at minimum
- Prose avoids generic adjective strings — uses specific references

If `npx @google/design.md` is available, run validation:

```
npx @google/design.md lint specs/DESIGN.md
```

If it passes, the file conforms to the spec. Address any errors or warnings before delivering.

# Gotchas

- Prose is primary, tokens are context: the spec philosophy states this explicitly. Do not dump token values without narrative. The quality of generated output depends on how clearly the intent is described, not the precision of the values.
- Generic adjectives produce generic output: "modern, clean, premium" evokes nothing specific. Use a specific reference: "a 1970s lecture handout" or "a high-end broadsheet". A specific reference carries more constraint than a dozen adjectives.
- Token references must resolve: `{colors.primary-60}` fails linting if no `primary-60` token exists. Only use `{path}` syntax for tokens that are defined.
- Sections must be in canonical order: the linter's `section-order` rule checks this. The order is: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
- Section headings are case-sensitive for section-order detection: use exactly `## Overview`, `## Colors`, `## Typography`, `## Layout`, `## Elevation & Depth`, `## Shapes`, `## Components`, `## Do's and Don'ts`. The spec recognizes `## Brand & Style` as an alias for Overview, `## Layout & Spacing` for Layout, and `## Elevation` for Elevation & Depth.
- Duplicate section headings produce a lint error: two `## Colors` sections in the same file are invalid.
- Primary color must exist when colors are defined: the linter warns if colors are present but no `primary` key exists.
- Missing typography when colors exist: the linter warns about this. Agents will use default fonts if no typography tokens are defined.
- Component contrast is checked by the linter: every component's `backgroundColor`/`textColor` pair is checked against WCAG AA (4.5:1). Verify contrast before writing values.
- Orphaned tokens produce a lint warning: if a color is defined in `colors:` but never referenced by any component via token reference, the linter flags it. Use `{color.token}` in component entries to avoid this.
- Component variants must match prose: if the prose section for a button lists a hover state, a corresponding hover variant token must exist in the frontmatter (e.g., `button-primary-hover`). Inconsistency confuses agents.
- Negative constraints are valuable: the Do's and Don'ts section carries as much weight as the Overview. A specific list of what not to do prevents more regressions than a list of what to do.
- No `TBD` or `TODO` placeholders: every section needs real content. If a section truly cannot be filled, mark it with a ponytail comment documenting what is missing and when it will be resolved.
