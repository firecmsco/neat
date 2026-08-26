---
name: Neat Specimen Sheets
description: The static gradient guide, gallery and preset pages at neat.firecms.co
colors:
  sheet: "#0E0F12"
  plate: "#191A1F"
  well: "#08090B"
  rail: "#0A0B0D"
  stage: "#141519"
  ink: "#ECECE8"
  ink-muted: "#9EA0A8"
  rule: "rgba(236,236,232,0.16)"
  rule-strong: "rgba(236,236,232,0.34)"
typography:
  display:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "clamp(2.75rem, 7.5vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Sofia Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  deck:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1.05rem, 1.5vw, 1.24rem)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Spline Sans Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
    letterSpacing: "0.11em"
rounded:
  square: "0"
spacing:
  rail: "3.5rem"
  gutter: "clamp(1.25rem, 5vw, 4.5rem)"
  pad: "clamp(1.25rem, 4vw, 4rem)"
  section: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.square}"
    padding: "0.85rem 1.6rem"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.85rem 1.6rem"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  label-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "clamp(1.5rem, 3.5vw, 2.75rem)"
  code-well:
    backgroundColor: "{colors.well}"
    textColor: "#D8D9D4"
    rounded: "{rounded.square}"
    padding: "1.5rem clamp(1.1rem, 2.5vw, 1.75rem)"
---

# Design System: Neat Specimen Sheets

## Overview

**Creative north star: the lighting-gel swatch book.** Black card, colour samples
that read true against it, and a stamped formula under every chip. The pages
treat a gradient as a material with a recipe — reproduce the material at full
strength, then print its numbers beside it.

Two rules generate most of the system. First, **the gradient is never dimmed**:
no scrim, no tint, no overlay lies between the visitor and the artifact. Second,
**contrast is bought with objects, not veils**: where type must sit over a
gradient, it rides on an opaque plate with its own edge and shadow. The earlier
iteration of these pages violated both, muting the product to 46–72% black to
make room for text, and it is the explicit anti-reference for this system.

The register is technical rather than decorative — hairline rules, square
corners, tabular numbers, stamped mono labels — because the audience is
designers comparing options, and comparison wants a neutral, calibrated mount.

## Colors

Strategy: **restrained**. The system is achromatic on purpose. All chroma on any
page comes from the specimen itself, so the palette is a black sheet, a lifted
plate, a recessed well, and two levels of ink.

| Token | Value | Role |
|---|---|---|
| `sheet` | `#0E0F12` | The card everything is mounted on. |
| `plate` | `#191A1F` | Label plates and lifted surfaces. |
| `well` | `#08090B` | Code, recessed below the sheet. |
| `rail` | `#0A0B0D` | Top binding and colophon. |
| `stage` | `#141519` | Placeholder behind a canvas or chip before it paints. |
| `ink` | `#ECECE8` | Primary type, 16.2:1 on `sheet`. |
| `ink-muted` | `#9EA0A8` | Secondary type, 6.7:1 on `plate`. |

**The accent is computed, not chosen.** Each page tabs itself in one colour
sampled from the specimen it records: the most saturated palette entry that
clears 4.5:1 against `sheet`, falling back to `ink` when none does (Monterey and
Dark Mode both fall back). It marks prose bullets and focus rings only. Never
hard-code an accent; derive it, and never lower the 4.5:1 gate to keep a
prettier colour.

## Typography

Three faces, each with one job:

- **Sofia Sans Extra Condensed** (800/700) — every heading, button and chip name.
  The condensed width is what lets a heading run large without a line break.
- **Sofia Sans** (400) — body and deck. Inherited from the editor.
- **Spline Sans Mono** (400) — hex values, formula numbers, breadcrumbs, code.
  Monospace here is for data and measurement, never as a technical costume.

Ramp: display `clamp(2.75rem, 7.5vw, 5.25rem)` → headline `clamp(1.9rem, 3.6vw,
2.9rem)` → title `1.45rem` → body `1.0625rem` → label `0.7rem`. Display and
headline both sit at weight 800 with negative tracking; the step between them is
size, not weight.

Measure is capped at `68ch` for prose and `22ch` for headings, so a heading
breaks into two or three deliberate lines rather than running the column width.

## Layout

A single left spine organises every page. `.sheet-in` carries a 1px left rule and
`--pad` of padding; section rules extend back past that spine into the margin, so
the page reads as a ruled sheet rather than a stack of cards.

- Page frame: sticky `rail` at `3.5rem`, content max-width `74rem`.
- Chip field: `clamp(26rem, 72vh, 46rem)` of undimmed gradient, with the label
  plate anchored bottom-left and overlapping the sheet edge by `3.25rem`.
- Sections: `4.5rem` top margin, `2.75rem` above the heading — always more space
  above a heading than below it.
- Specimen format: every chip and stage is `560/294`, the same proportion as the
  captured frames and the OG images. One format across the whole system.

Breakpoints: **960px** stacks the gallery's held chip above the deck and drops
its sticky positioning; **720px** takes the label plate out of the overlay and
into the flow (the chip field must become `height:auto` and its canvas
`position:relative`, or the absolute canvas paints over the plate); **600px**
hides three of five rail links, which all still ship in the colophon.

## Elevation & Depth

Depth is reserved for objects that are physically on top of something else —
label plates over a gradient, and a chip lifted on hover. Everything else is
flat, separated by hairline rules.

- Label plate: `0 26px 60px -18px rgba(0,0,0,.75), 0 2px 8px rgba(0,0,0,.4)`
  plus a `1px` edge. On a dark specimen the edge does the separating, not the
  shadow.
- Chip hover: `translateY(-5px)` with `0 18px 34px -14px rgba(0,0,0,.8)` and the
  border stepping up to `rule-strong`.

Every shadow carries an offset and a soft blur. No zero-offset halos.

## Shapes

**Everything is square.** Radius is `0` across buttons, plates, chips, code
wells, swatches and tables — the printed-specimen language has no rounded
corners, and a rounded element anywhere in this system reads as imported from
somewhere else.

Borders are `1px` hairlines at `rule` or `rule-strong`. No border is thicker than
1px, and no border carries colour as decoration.

## Components

- **Label plate** — the only way type sits over a gradient. Opaque `plate`
  background, hairline edge, real shadow. Never translucent, never blurred: a
  veil would dim the specimen, which is the one thing this system forbids.
- **Button** — condensed uppercase at `0.09em` tracking, square, `0.85rem 1.6rem`.
  Primary is `ink` fill on `sheet` text and inverts to outline on hover; ghost is
  the reverse. The transition is `0.18s cubic-bezier(.2,.7,.3,1)`.
- **Spec table** — a real `<table>`: label left in condensed uppercase `ink-muted`,
  value right in mono with `tabular-nums`, hairline rule under each row. Formula
  data is tabular, so it is a table, not a row of stat cards.
- **Swatch** — a `5.25rem` square of the raw colour with the hex stamped beneath
  in mono. The swatch is the colour; nothing tints or rounds it.
- **Chip** — a captured frame at `560/294` with the name and a stamped formula
  line beneath. Lifts on hover and focus.
- **Held chip (gallery)** — one large live canvas that swaps to whichever chip is
  hovered or focused, with a fresh canvas element per swap so the WebGL context
  is always clean. Sticky above 960px. This is the system's one authored motion
  moment.
- **FAQ row** — hairline-ruled `<details>` with a marker drawn from two
  pseudo-element bars that rotate into a minus. Drawn geometry, not a glyph.

Motion: one easing curve, `cubic-bezier(.2,.7,.3,1)`, at `0.18s` for controls and
`0.3s` for chips. `prefers-reduced-motion` sets gradient `speed` to `0` — the
gradient stays, the movement stops.

## Do's and Don'ts

**Do**

- Reproduce the gradient at 100% intensity, always.
- Buy contrast with an opaque plate, and check type against the brightest and
  darkest frame the animation produces, not a favourable one.
- Derive the page accent from the specimen and gate it at 4.5:1.
- Keep one specimen proportion, `560/294`, everywhere.
- Put formula data in a table with tabular numerals.

**Don't**

- Don't scrim, tint, blur or overlay the gradient. This is the anti-reference.
- Don't round a corner. The system is square throughout.
- Don't fake a gradient with CSS `linear-gradient` where a real captured frame or
  live canvas belongs — that flattens a lit 3D surface into a two-stop ramp.
- Don't put text directly on a gradient without a plate behind it.
- Don't add a second accent. One page, one borrowed colour.
- Don't use monospace for emphasis or atmosphere; it is for data, hex and code.
