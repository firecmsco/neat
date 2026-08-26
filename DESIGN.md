---
name: Neat
description: Animated 3D gradient backgrounds — editor and static content pages
colors:
  bg: "#000000"
  raised: "rgba(255,255,255,0.04)"
  hairline: "rgba(255,255,255,0.1)"
  hairline-strong: "rgba(255,255,255,0.22)"
  fg: "#ffffff"
  fg-muted: "rgba(255,255,255,0.68)"
  fg-faint: "rgba(255,255,255,0.45)"
typography:
  display:
    fontFamily: "Sofia Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.65
  deck:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1.08rem, 1.6vw, 1.28rem)"
    fontWeight: 400
    lineHeight: 1.55
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
rounded:
  pill: "9999px"
  md: "0.75rem"
  sm: "0.375rem"
spacing:
  gutter: "clamp(1.25rem, 5vw, 2.5rem)"
  column: "68rem"
  section: "clamp(3rem, 6vh, 4.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0 1.35rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0 1.35rem"
  card:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "1rem"
  nav-pill:
    backgroundColor: "rgba(0,0,0,0.55)"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.4rem"
---

# Design System: Neat

## Overview

**A gradient hero at the top, then plain content on black.** This is the same
shape as the dataki landing page (`~/dataki/landing`), which is the house
pattern: `body` is solid black, the WebGL canvas is absolutely positioned
*inside the hero section only*, and every section below is ordinary content on
black.

The canvas runs at **full opacity** — the gradient is the product and is never
dimmed as a whole. Darkening is confined to the band the type sits in: an
overlay inside the hero that is transparent across the top half and resolves to
black at the bottom, so the page background continues seamlessly. The hero
scrolls away with its own section; nothing about the gradient is fixed, and
nothing fades independently of what is behind it.

Two things that overlay has to get right. It carries **ten stops rather than
two**, because a viewport-length two-stop ramp bands visibly at 8-bit alpha. And
a **dither pass** sits over the whole hero — an inline `feTurbulence` tile at
`opacity: .05` — which breaks up what banding survives. Without it, a flat pale
preset like Clouds shows clear steps down the fade.

Four approaches were built and rejected before this one. They are recorded here
because each looked reasonable while being written:

1. **A scrimmed full-page gradient.** Dimming the product to 46–72% black to make
   room for text is backwards for a product whose value is how the gradient looks.
2. **A separate design language.** Square corners, hairline-ruled card stock and
   condensed uppercase type read as a different product entirely.
3. **Mid-alpha panels at page scale.** `rgba(23,23,23,.82)` over a saturated
   gradient turns olive-brown. The editor survives that alpha only because its
   panels are a small toolbar and a sidebar.
4. **A fixed canvas behind a scrolling column.** Any fade drawn on the scrolling
   content slides across a stationary gradient, which reads as broken; and a
   full-bleed fade meeting a width-capped column leaves a hard horizontal seam.

The through-line: **contain the gradient in a section and leave everything else
alone.**

## Colors

Strategy: **restrained**. Pure black ground, white type, and one contained
gradient carrying all the colour.

Surfaces are `rgba(255,255,255,0.04)` with a `1px` `rgba(255,255,255,0.1)`
border, stepping to `0.22` on hover. Type is `#fff` for headings and emphasis,
`rgba(255,255,255,0.68)` for body, `rgba(255,255,255,0.45)` for faint labels —
all far above 4.5:1 on black. The nav pill is the only translucent surface, at
`rgba(0,0,0,0.55)` with blur, because it is small.

## Typography

**Sofia Sans throughout**, 400/500/600/700, inherited from the editor. Headings
are weight 700 with negative tracking. Monospace is only for hex values, numeric
parameters and code.

Ramp: display `clamp(2.5rem, 7vw, 4.75rem)` → headline `clamp(1.6rem, 3vw,
2.2rem)` → body `1.0625rem` → data `0.95rem`. Prose measure caps at `68ch`.

## Layout

**One column, one width, every page.** A centred container at `68rem` with a
`clamp(1.25rem, 5vw, 2.5rem)` gutter, and nothing inside sets a narrower
max-width of its own. Deck, paragraphs, headings, code, grids and footer all
resolve to the same width and share one edge, on every page — guides, presets
and gallery alike. If a measure needs changing, change the container, not the
elements, and change it for every page at once.

- Nav: a fixed pill, top-centre. Never a full-width bar.
- Hero: content runs from a fixed top padding, `clamp(8rem, 22vh, 12.5rem)`.
  Never bottom-aligned — a longer deck then pushes the heading up and the title
  lands at a different height on each page. Verified: h1 top is identical across
  guides, presets and the gallery at both 1440px and 390px.
- Sections: `clamp(3rem, 6vh, 4.5rem)` apart. No surfaces, no boxes — spacing
  and headings carry the structure.
- Preview format: every gradient thumbnail is `560/294`, matching the captured
  frames and the OG images.

Breakpoints: **860px** stacks the gallery's preview card above its grid;
**640px** shortens the hero and hides three of five nav links, all of which still
ship in the footer.

## Elevation & Depth

Almost none. Cards are a `0.04` white wash with a hairline; the only movement is
a `4px` lift on preview tiles. The nav pill is the single blurred element —
blurring a tall surface over an animating canvas stalls scrolling.

## Shapes

`0.75rem` on cards and previews, `0.375rem` on buttons, `9999px` on pills and
tags. Borders are `1px`, always.

## Components

- **Hero** — the only place a gradient appears. `min-height: min(80vh, 46rem)`,
  content bottom-aligned. Canvas `absolute; inset: 0` at full opacity (z 0), a
  ten-stop darkening overlay (z 1), a noise dither tile (z 2), content (z 3).
  Measured on the palest preset, white headlines land at 8.5:1.
- **Button** — `2.75rem` tall, `0.375rem` radius, weight 500. Primary is white
  with black text; ghost is a `rgba(255,255,255,0.28)` outline.
- **Nav pill** — fixed, centred, blurred, `9999px`.
- **Preview tile** — a captured frame at `560/294` with name and a mono formula
  line; lifts `4px` on hover.
- **Spec table** — a real `<table>`; label left in faint text, value right in
  mono with `tabular-nums`, hairline rule per row.
- **Preview card (gallery)** — a sticky card holding its own small live canvas,
  which follows whichever tile is hovered or focused.
- **Config block** — presets show only their shaping parameters; the full
  ~60-key config sits under a disclosure.

Motion: one curve, `cubic-bezier(.2,.7,.3,1)`, `0.2s` on controls, `0.28s` on
tiles. `prefers-reduced-motion` sets gradient `speed` to `0` — the gradient
stays, the movement stops.

## Do's and Don'ts

**Do**

- Put the gradient in the hero, contained, and leave the rest of the page black.
- Use a real captured frame or a live canvas for any gradient preview.
- Keep one container width across hero, content and footer.
- Check text against the brightest frame the animation can produce.

**Don't**

- Don't make the canvas `position: fixed` or run it behind the whole page.
- Don't draw a fade on scrolling content over a stationary gradient.
- Don't let a dark region change width mid-page.
- Don't scrim the gradient, or spread mid-alpha grey across a page, or lower the
  canvas opacity to buy contrast — darken the type's own band instead.
- Don't fade across a viewport with a two-stop ramp; it bands. Use many stops
  and dither.
- Don't build the page as a stack of identical boxes; spacing is the structure.
- Don't give elements their own max-width inside the column. One measure, one edge.
- Don't introduce square corners or condensed/uppercase display type.
