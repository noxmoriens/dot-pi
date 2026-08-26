---
version: alpha
name: [Project Name]
description: [Brief description of the design system]
colors:
  primary: "#RRGGBB"
  secondary: "#RRGGBB"
  tertiary: "#RRGGBB"
  neutral: "#RRGGBB"
typography:
  h1:
    fontFamily: Typeface Name
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
  h2:
    fontFamily: Typeface Name
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  body-md:
    fontFamily: Typeface Name
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: Typeface Name
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.05em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 12px 24px
  button-secondary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
---

## Overview

[1-4 paragraphs describing the brand personality, target audience, emotional
response the UI should evoke. Use a specific reference rather than generic
adjectives — a single evocative comparison carries more design constraint than
a dozen adjectives. Example: "A graduate-level computer science lecture handout
in the tradition of an old established university. The audience is graduate
students and research engineers reading a printed handout. The design is
austere, informationally dense, and proudly unconcerned with first
impressions."]

## Colors

[1-2 paragraphs describing the color strategy — the palette's character, how
colors relate to each other, the role of contrast and accent in the system.]

- **Primary ({colors.primary}):** [what it is used for and why. Example: "A deep
  ink used for headlines and core text to provide maximum readability and a
  sense of permanence."]
- **Secondary ({colors.secondary}):** [what it is used for and why. Example: "A
  sophisticated slate for utilitarian elements like borders, captions, and
  metadata."]
- **Tertiary ({colors.tertiary}):** [what it is used for and why. Example: "The
  sole driver for interaction, used exclusively for primary actions and critical
  highlights."]
- **Neutral ({colors.neutral}):** [what it is used for and why. Example: "A warm
  foundation for all pages, softer than pure white to reduce eye strain."]

## Typography

[1-2 paragraphs describing the typography strategy — the rationale behind font
choices, how type creates hierarchy, reading considerations.]

- **Headlines ({typography.h1.fontFamily}):** [role and rationale. Example:
  "Set in Public Sans Semi-Bold to establish an institutional and trustworthy
  voice."]
- **Body ({typography.body-md.fontFamily}):** [role and rationale. Example:
  "Public Sans Regular ensures contemporary professionalism and long-form
  readability."]
- **Labels ({typography.label-sm.fontFamily}):** [role and rationale. Example:
  "Space Grotesk for all technical data, timestamps, and metadata — its
  geometric construction evokes the precision of a digital stopwatch."]

## Layout

[2-3 paragraphs describing the layout approach including grid model, page
anatomy, and breakpoints.]

- **Grid**: [column count, gutter width {spacing.md}, page margin {spacing.lg}]
- **Page anatomy**: [top bar height, sidebar width, main content max-width]
- **Breakpoints**: [mobile/tablet/desktop/wide ranges]
- **Spacing scale**: [base unit, scale description referencing {spacing.xxx}
  tokens]
- **Orientation**: [desktop-first or mobile-first]

## Elevation & Depth

[1-2 paragraphs describing how visual hierarchy is achieved — shadow-based or
tonal/contrast-based.]

- **Level 0**: `none` — base page surface
- **Level 1**: [CSS shadow value] — cards and content groupings
- **Level 2**: [CSS shadow value] — dropdowns and popovers
- **Level 3**: [CSS shadow value] — modals and dialogs
- **Level 4**: [CSS shadow value] — tooltips and notifications

For flat designs: state that depth is achieved through color contrast and tonal
layers instead of shadows.

## Shapes

[1-2 paragraphs describing the shape language.]

- **Corners**: containers use {rounded.md}, interactive elements use
  {rounded.sm}, pills and badges use {rounded.full}
- **Rationale**: [why this shape language was chosen — relationship to brand
  personality]

## Components

### [Component: e.g., Button]

[1-2 sentences describing the component's role in the system.]

- **Variants**: primary (default action), secondary (alternative action), ghost
  (low-emphasis action)
- **States**:
  - Default: [visual description, referencing {components.button-primary}]
  - Hover: [visual changes, referencing the hover variant]
  - Active / Focus-visible: [visual changes, keyboard focus ring style]
  - Disabled: [visual changes, cursor behavior]
- **Behavior**: [interaction rules, responsive adaptations, edge cases]

*Repeat for each component in scope. Common components: Button, Card, Input,
Chip, Tooltip, List, Checkbox, Radio Button, Toggle.*

## Do's and Don'ts

- Do [positive guideline, e.g., "use the primary color only for the single most
  important action per screen"]
- Don't [negative constraint, e.g., "mix rounded and sharp corners in the same
  view"]
- Do maintain WCAG AA contrast ratios (4.5:1 for normal text — verify with the
  linter)
- Don't convey information through color alone — pair color with icons, text
  labels, or patterns
- Do respect `prefers-reduced-motion`: collapse all animated durations to 0ms
- Don't animate the `all` property — animate specific properties only
- [Additional items specific to this design system. Aim for 8-15 items total.]

*Aim for 8-15 items. Cover: color usage, typography, layout, motion,
accessibility, and component-specific rules. Each item must be concrete and
actionable.*
