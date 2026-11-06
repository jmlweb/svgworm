---
name: svgworm
description: A soil cross-section where real working output is the thing you dig up.
colors:
  worm: "#de8f8a"
  worm-deep: "#933a43"
  clitellum: "#b85c5e"
  terra: "#33211a"
  rust: "#6e4530"
  sienna: "#b07a52"
  dune: "#eadbc4"
  bone: "#f5eee3"
  night: "#1a110d"
  stratum-clay: "#8a5a3c"
  surface-card: "#fbf7f0"
  hairline: "#dccbb0"
  dark-surface-raised: "#452e23"
  dark-surface-card: "#3d281f"
  dark-ink-muted: "#c4946c"
  dark-hairline: "#5a3d2f"
  dark-band-muted: "#c4a88c"
  term-bg: "#1f1510"
  term-muted: "#a88a70"
  term-attr: "#f0c27b"
  term-string: "#8fd1a6"
  term-error: "#ff8c84"
  success: "#3d9a6a"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(48px, 7.5vw, 92px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
    fontVariation: "'opsz' 96"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.5vw, 52px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontVariation: "'opsz' 72"
  title:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
  lede:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.12em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "20": "80px"
components:
  button-primary:
    backgroundColor: "{colors.worm-deep}"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.terra}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  nav-cta:
    backgroundColor: "transparent"
    textColor: "{colors.terra}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  install-tab:
    backgroundColor: "transparent"
    textColor: "{colors.rust}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  tile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.terra}"
    rounded: "{rounded.lg}"
    padding: "24px"
  terminal:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.dune}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: "24px"
  code-block:
    backgroundColor: "{colors.term-bg}"
    textColor: "{colors.dune}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: svgworm

## Overview

**Creative North Star: "The Soil Cross-Section"**

The site is a dig. Warm ground sits in layers, and real working output is what you find in it: terminals, code, a sprite's own icons. A pink worm crawls through the strata, and icons are buried in the bottom layer like pebbles. The metaphor does a job: it makes the page feel like a place where something real is being exposed, not a brochure about it.

The mood is earthy, playful and exact. The surface has a personality: clay browns, a wiggle under the claim, a worm you can pause. The content has none of that looseness: every number is measured, every code sample is what the tool writes, and every icon on the page comes from the sprite the page is selling. Density is generous on the landing page and quieter in the docs, where the same ground, type and code blocks carry a readable column.

This file records the site as built. The private Design System artifact (see `CLAUDE.local.md`) remains the brand source for the README, posts and social images, and it is a general guideline, not a strict spec. Where the two differ, this file describes `apps/site`.

**Key Characteristics:**

- Warm clay ground in both themes, never neutral gray or white.
- Horizontal bands as the main structural device, echoing soil strata.
- Code and terminals are dark in both themes, so they read as real output.
- Display type is loud and tightly tracked. Everything else is plain.
- Soft-edged and tactile: pills, 16px tiles, small lifts on hover.
- Motion is small and purposeful, and the one looping animation can be paused.

## Colors

A palette of soil browns and one pink worm, with light and dark themes that swap the ground rather than the character.

### Primary

- **Worm Pink** (worm): The shape color. The mark, the worm's body, the swatch of glow in the hero, stat figures and icons on dark bands. It is the accent on dark grounds.
- **Berry Clay** (worm-deep): The accent on light grounds. Links, emphasis, primary buttons, focus rings, kickers and step counters.

### Secondary

- **Saddle Band** (clitellum): Appears once per worm, as the saddle. It has no UI role.
- **Warm Sienna** (sienna): A decorative mid tone for the lower hero glow and the rule on callouts.

### Tertiary

These live only inside dark code surfaces.

- **Amber Attribute** (term-attr): Attribute names, numbers and constants.
- **Sprout Green** (term-string): Strings and success marks in terminals.
- **Error Coral** (term-error): Failed lines and the wavy underline on an invalid icon name.
- **Moss Check** (success): The status dot on the eyebrow and check marks on light grounds.

### Neutral

- **Bone** (bone): The light page ground.
- **Dune** (dune): The raised band in the light theme, and body text on dark grounds.
- **Pale Card** (surface-card): Tiles and cards in the light theme.
- **Topsoil** (terra): Body text in the light theme, the dark page ground, and always the stats band and dark section in the light theme.
- **Bedrock** (night): The deepest ground. Terminals in the dark theme, and the stats band and dark section there.
- **Rust** (rust): Muted text in the light theme, and a soil layer.
- **Baked Clay** (stratum-clay): The lowest soil layer in the light theme art.
- **Dry Grass Line** (hairline), **Dark Line** (dark-hairline): Borders and table rules in each theme.
- **Dark theme ground set** (dark-surface-raised, dark-surface-card, dark-ink-muted): Raised bands, cards and muted text in the dark theme.
- **Pale Silt** (dark-band-muted): Secondary text on any permanently dark band.
- **Terminal Ground** (term-bg), **Terminal Dust** (term-muted): Code surfaces in the light theme, and their muted comments. In the dark theme code sits on Bedrock.

### Named Rules

**The Worm Is a Shape Rule.** On light grounds, Worm Pink never carries text. Use Berry Clay, which `--accent` already resolves to.

**The One Saddle Rule.** The Saddle Band appears once per worm and nowhere else in the interface.

**The Theme by Token Rule.** Theme changes come from `prefers-color-scheme` swapping the semantic tokens (`--surface`, `--ink`, `--accent`). A component reads the semantic token, not a theme branch of its own.

**The Measured Contrast Rule.** Text pairs hold 4.5:1, measured on the real ground including the hero glow. Where a glow lowers contrast, the tone changes rather than the rule: the hero lede and the active install tab both exist because of a measurement.

## Typography

**Display Font:** Bricolage Grotesque (with `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Instrument Sans (with `ui-sans-serif, system-ui, sans-serif`)
**Label/Mono Font:** JetBrains Mono (with `ui-monospace, SFMono-Regular, Menlo, monospace`)

**Character:** A wide, characterful grotesque set very tight, against a calm sans that stays out of the way. The mono is the third voice, and it signals that something is real and copyable.

All three are self-hosted from `public/fonts/` as hashed variable `woff2` files.

### Hierarchy

- **Display**: The single h1 on a page. Balanced wrapping.
- **Headline**: Every h2 on the landing page. Docs h2s scale down to `clamp(24px, 3vw, 32px)`, so the reading column stays calm.
- **Title**: h3 on tiles and sub-sections. Docs cards raise it to 22px at weight 700.
- **Lede**: The paragraph under a headline, capped at 54ch in muted ink. Section ledes are 18px at 62ch.
- **Body**: Running text. Docs paragraphs cap at 68ch.
- **Label**: Uppercase kickers, tracked at 0.12em in the accent color. Docs nav titles use 12px at 0.08em.
- **Code**: Commands, paths, config keys and output. 13px in landing blocks, 13.5px in docs, 12px in terminals on phones.

### Named Rules

**The 800 Only Rule.** Bricolage Grotesque is subset to weight 800 and optical sizes 72 to 96, so it stays under 25 KB. Use it for h1, h2, stat figures, step counters and nothing else, and never ask it for another weight.

**The Upright Rule.** Only upright faces load, and `font-synthesis` is off. Emphasis is weight or the accent color: `em` renders upright in the accent, and `strong` is weight 650 in full ink, so it stands out of muted text.

**The Literal Code Rule.** Ligatures are off in code, because a `>=` glyph is not what the reader types.

## Layout

One centered column, up to 1120px with a 16px side gutter. Structure comes from full-bleed horizontal bands that alternate ground: Bone, Dune, and a dark Topsoil band. Section padding is 80px on the spacing scale of 4, 8, 12, 16, 24, 32, 48 and 80px.

The hero is two columns at roughly 1.05 to 1, copy beside a terminal. The soil band follows with a height tied to its art (`max(120px, 16.4vw)`) and overlaps the hero's bottom padding. Its bedrock layer flows into the stats band with a 1px overlap, so the ground reads as continuous. Features use a three-column bento with wide and tall tiles.

Breakpoints are functional rather than a named scale:

- **1200px:** docs gain a sticky right rail of 200px beside the 220px page nav.
- **1040px:** the bento drops to two columns.
- **860px:** the hero, agents, steps and bento go to one column, and stats to two.
- **640px:** the hero terminal is hidden, because the stats band carries the same numbers.
- **560px:** the header compresses and drops npm, and the icon showcase holds three per row.

**The No Sideways Page Rule.** The page never scrolls horizontally down to 320px. Grid tracks are `minmax(0, 1fr)`, and code scrolls inside its own box instead of wrapping.

## Elevation & Depth

Depth is layered ground first. Tonal bands do most of the work, the way strata do, and flat tiles sit on them with a hairline border. Shadows are reserved for two cases: surfaces that hold real output, and the response to a hover. In the dark theme, the shadow token deepens rather than disappears.

### Shadow Vocabulary

- **Soft Ground Shadow** (`--shadow`): The system's one shadow, a warm brown in light and near black in dark. Always on for terminals and step cards, and on hover for tiles and docs cards.
- **Accent Glow** (`0 10px 24px -10px var(--accent)`): Primary button hover only.

The site header is the one glass surface: 82% ground with a 12px backdrop blur, sticky over the page.

### Named Rules

**The Lifted Proof Rule.** At rest, only things that show real output are lifted. A tile earns its shadow by being hovered.

## Shapes

Soft-edged, like river pebbles. Tiles, terminals and steps round at 16px, code blocks, callouts and docs nav items at 8px, and inline code at 4px. Interactive chips, buttons and tabs are full pills, and counters, swatches and status dots are circles. Feature badges use 12px.

Graphics are flat fills with round line caps. The worm is one stroked path with `stroke-linecap: round`, and its ring segments come from a dash pattern on that path, not from extra shapes. The squiggle under the hero claim is the same trail, drawn as a repeating SVG.

## Components

Soft-edged and tactile: everything rounded, everything answers the pointer with a small physical move.

### Buttons

- **Shape:** Full pill, with a 1.5px border.
- **Primary:** Accent fill with ground-colored text at weight 600.
- **Hover / Focus:** Lifts 2px with the Accent Glow, and a trailing arrow nudges 3px right, both over 160ms. Focus is a 2px solid ring.
- **Ghost:** Transparent with a hairline border in ink. Hover turns the border to the accent, without a lift glow.

### Chips

- **Eyebrow:** A small pill on the card surface with a hairline border, muted 13px text and a green status dot.
- **Step labels:** Uppercase 12px pills. "You" is outlined and "generated" is filled with the accent, so authorship reads at a glance.
- **Install tabs:** Pills over real radio inputs, switched by `:has()`, with no script. The checked tab takes the accent border and soft fill, with ink text for contrast.

### Cards / Containers

- **Corner Style:** Softly rounded (16px).
- **Background:** Pale Card, or the dark theme card ground.
- **Shadow Strategy:** Flat at rest with a hairline. On hover, lifts 3px, tints the border toward the accent and takes the Soft Ground Shadow, over 200ms.
- **Border:** 1px hairline.
- **Internal Padding:** 24px.

Docs cards are the same card as one link, so the whole card is the target.

### Navigation

- **Header:** Sticky and blurred, the themed logo at 150px, then 15px links at weight 500 in ink, with GitHub as an outlined pill. Hover and current page take the accent. Targets are at least 24px.
- **Docs nav:** A 220px sticky list with 8px rounded rows. Hover takes the raised ground, and the current page takes the soft accent fill at weight 600. On phones it collapses into a `<details>` menu with no script.

### Code and Terminals

- **Terminal:** A window on the dark ground at 16px radius with the Soft Ground Shadow, a title bar with three dots in worm, sienna and rust, and output colored by role.
- **Code block:** The same ground at 8px, flat. Docs blocks use Shiki's `css-variables` theme, wired to the same terminal palette.
- **Copy button:** A small pill added by script, so without JavaScript blocks stay plain and selectable. It shows on hover on fine pointers, and always on touch, on prompt blocks and on the install line.
- **Install line:** A dark rounded line of mono. One click selects the whole command.

### Callouts

A raised block with a 4px left rule in sienna, and an uppercase 13px label. Important, warning and caution kinds use the accent for rule and label. Kinds differ by label, because sienna is decorative and never colors text.

### The Soil Band (signature)

An inline SVG of stacked strata with a worm crawling through a tunnel, and sprite icons tilted in the lowest layer as pebbles. Layers: tunnel, shadow, rim, body, ring dashes, saddle, shine. Motion is SMIL on a seamless loop. It starts paused for `prefers-reduced-motion`, pauses off screen, and has a pause button of its own.

### The Stats Band (signature)

The ground rising out of the soil's bedrock. Four figures in display type in Worm Pink, each with a 2px worm rule on its left, muted labels, and a caption stating where the numbers come from.

### The Icon Showcase (signature)

A grid of real sprite icons in hairline cells on the dark section, labeled by name in mono, split into multicolor and mono groups. A live color demo beside it changes `color` on mono icons through radio swatches and `:has()`, with no script.

### The Autocomplete Tile (signature)

An editor-style suggestion list in a tile, showing typed icon names with one active row and a caret that blinks four times and stops.

## Do's and Don'ts

### Do:

- **Do** use real output as imagery: terminal runs, generated code and icons from the page's own hashed sprite.
- **Do** build sections as full-bleed bands of ground, not as boxes floating on one background.
- **Do** keep code and terminals on the dark ground in both themes.
- **Do** make interactive switches work without script where CSS can do it, as the install tabs and color swatches do with radios and `:has()`.
- **Do** read `--surface`, `--ink` and `--accent` in components, so both themes follow.
- **Do** give any looping animation a pause control and a reduced-motion stop, and stop other autoplay within 5 seconds.
- **Do** keep the 2px solid focus ring on every control. On dark code surfaces, the ring is Worm Pink and may sit inside the box.
- **Do** check a change at phone and desktop widths, in light and dark.

### Don't:

- **Don't** set text in Worm Pink on a light ground, or use the Saddle Band as a UI color.
- **Don't** fake italics or request Bricolage Grotesque at any weight but 800.
- **Don't** use emoji in headings or prose. The logo replaces them.
- **Don't** recolor, rotate, stretch or add effects to the logo, or set the wordmark in live text.
- **Don't** add gradients or shadows to icons and illustrations. The hero's two soft radial glows are the only gradients in the interface.
- **Don't** add a shadow to a resting tile. Shadows belong to real output and to hover.
- **Don't** wrap code. A wrapped `</svg>` reads as a mistake, so blocks scroll inside their own box. Prompts meant to be pasted are the exception.
