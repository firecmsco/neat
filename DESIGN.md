---
name: Neat
description: Animated 3D gradient backgrounds — editor and static content pages
colors:
  ground: "#0a0a0a"
  surface: "rgba(10,10,12,0.955)"
  raised: "rgba(255,255,255,0.055)"
  hairline: "rgba(255,255,255,0.1)"
  hairline-strong: "rgba(255,255,255,0.2)"
  fg: "#ffffff"
  fg-muted: "rgba(255,255,255,0.72)"
  fg-faint: "rgba(255,255,255,0.5)"
typography:
  display:
    fontFamily: "Sofia Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2.6rem, 7.5vw, 5.25rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1.65rem, 3.2vw, 2.35rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  deck:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1rem, 1.4vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9rem"
    fontWeight: 400
rounded:
  pill: "9999px"
  lg: "1.25rem"
  md: "0.75rem"
  sm: "0.375rem"
spacing:
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  panel-pad: "clamp(1.35rem, 3vw, 2.25rem)"
  stack: "1.25rem"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    height: "2.5rem"
    padding: "0 1.15rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    height: "2.5rem"
    padding: "0 1.15rem"
  reading-column:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel-pad}"
    width: "62rem"
  nav-pill:
    backgroundColor: "rgba(0,0,0,0.42)"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.4rem"
---

# Design System: Neat

## Overview

**The gradient is the ground; one near-black column sits on it.** A fixed
full-bleed WebGL canvas runs behind every surface at full intensity. Reading
content lives on a single continuous column, nearly opaque, capped at `62rem` and
centred so the gradient frames it at the page edges. The hero puts large type
directly on the gradient over a bottom-anchored fade, and full-bleed *breathers*
between sections let the gradient return at full width.

Three anti-references, all built and rejected on this project:

1. **Never scrim the gradient.** The first build dimmed it to 46–72% black to
   make room for text. For a product whose value is how the gradient looks,
   dimming it is backwards.
2. **Never invent a second design language.** A build using square corners,
   hairline-ruled card stock and condensed uppercase type read as a different
   product even with the palette corrected.
3. **Never spread mid-alpha grey across a page.** `rgba(23,23,23,0.82)` over a
   saturated gradient turns olive-brown. The editor survives that alpha because
   its panels are a small toolbar and a sidebar; at page scale it is mud. Go
   nearly opaque, or leave the gradient alone entirely.

And structurally: a page built as a vertical stack of identical rounded boxes has
no rhythm and reads as a template. One surface, punctuated by gradient.

## Colors

Strategy: **restrained achromatic chrome over unrestrained chroma**. The
interface is white-on-near-black; every colour on screen comes from the gradient.

The reading surface is `rgba(10,10,12,0.955)` — high enough alpha that no
gradient tints it, so it reads as clean black rather than mud, while the gradient
stays vivid everywhere it is allowed to show. Raised elements inside it use
`rgba(255,255,255,0.055)`; borders are `1px` of `rgba(255,255,255,0.1)`, stepping
to `0.22` on hover. The nav pill is the one genuinely translucent surface at
`rgba(0,0,0,0.4)` with blur, because it is small.

Text is `#fff`, `rgba(255,255,255,0.7)` secondary, `rgba(255,255,255,0.45)` faint.

## Typography

**Sofia Sans throughout**, at 400/500/600/700. Headings are weight 700 with
negative tracking; the step between levels is size, not face. Monospace appears
only for hex values, numeric parameters and code — never as a texture.

Ramp: display `clamp(2rem, 5vw, 3.25rem)` → headline `clamp(1.35rem, 2.4vw,
1.75rem)` → body `1rem` → data `0.9rem`. Prose measure caps around 46ch in decks
and the panel width elsewhere.

## Layout

**One column, not a card stack.** `.sheet` is a single continuous surface capped
at `62rem` (`76rem` where it holds a grid), rounded at the top where it meets the
hero. Sections are spacing inside it, never separate boxes.

- Nav: a floating pill, fixed top-centre. Never a full-width bar.
- Hero: `min-height: min(94vh, 54rem)` with type bottom-left. A `70%`-height
  bottom fade gives the type ground; the top third of the gradient is untouched.
- Breather: `clamp(7rem, 18vh, 12rem)` where the column stops and the gradient
  shows full width. One before the FAQ on guides, one before each grid.
- Preview format: every gradient thumbnail is `560/294`, matching the captured
  frames and the OG images.

Measure caps at `68ch` for prose. Breakpoints: **860px** stacks the gallery's
spec card; **640px** shortens the hero and hides three of five nav links, all of
which still ship in the colophon.

## Elevation & Depth

Depth is mostly tonal: a near-black column against a vivid gradient needs no
shadow to separate. Only two things lift — the nav pill
(`0 10px 30px -10px rgba(0,0,0,.6)` with `blur(14px)`) and preview tiles on hover
(`translateY(-4px)`, `0 18px 34px -16px rgba(0,0,0,.8)`).

One hard constraint: **blur only small surfaces.** A tall blurred element over an
animating canvas forces a full-viewport composite every frame and visibly stalls
scrolling. The nav pill is the only blurred element on the page.

## Shapes

Radius is the family signature: `1rem` panels, `0.75rem` nested groups and
previews, `0.375rem` buttons, `9999px` pills and tags. **Nothing in this system
is square.** Borders are `1px`, always, and never carry colour as decoration.

## Components

- **Reading column** — the single surface content sits on. Near-opaque, top
  corners rounded at `1.25rem`, capped at `62rem`. Not repeated per section.
- **Button** — `2.5rem` tall, `0.375rem` radius, weight 500. Primary is white on
  black text; outline is `rgba(255,255,255,0.4)` border filling to white/10 on
  hover. Transitions are `0.2s`.
- **Nav pill** — fixed, centred, blurred, `9999px`. Links are pill-shaped on
  hover.
- **Preview tile** — a captured frame at `560/294` with name and a mono formula
  line. Lifts `3px` on hover with the border stepping up.
- **Spec table** — a real `<table>`; label left in faint text, value right in
  mono with `tabular-nums`, hairline rule per row.
- **Tag row** — pill-shaped outline links for onward navigation.

Motion: one curve, `cubic-bezier(.2,.7,.3,1)`, `0.2s` on controls and `0.25s` on
tiles. The gallery's authored moment is hovering a preset to load it behind the
whole page — the same gesture as the editor's preset switcher.
`prefers-reduced-motion` sets gradient `speed` to `0`: the gradient stays, the
movement stops.

## Do's and Don'ts

**Do**

- Run the gradient full-bleed and at full intensity behind every page.
- Put content on a translucent panel when it must sit over the gradient.
- Keep radius on everything; it is the strongest family signal after the gradient.
- Use a real captured frame or live canvas for any gradient preview.
- Check text against the brightest frame the animation can produce.

**Don't**

- Don't scrim, tint or overlay the gradient to make text readable.
- Don't introduce square corners, ruled sheets, or condensed/uppercase display
  type; they broke the bond with the editor.
- Don't build the page as a stack of identical rounded boxes.
- Don't fake a gradient with CSS `linear-gradient` where a real frame belongs.
- Don't blur a tall surface over the canvas, and don't spread mid-alpha grey
  across a page — both were tried and both looked cheap.
- Don't add a second accent colour; the gradient is the colour.
