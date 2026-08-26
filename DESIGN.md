---
name: Neat
description: Animated 3D gradient backgrounds — editor and static content pages
colors:
  ground: "#0a0a0a"
  panel: "rgba(23,23,23,0.82)"
  panel-inner: "rgba(255,255,255,0.05)"
  hairline: "rgba(255,255,255,0.1)"
  hairline-strong: "rgba(255,255,255,0.2)"
  fg: "#ffffff"
  fg-muted: "rgba(255,255,255,0.72)"
  fg-faint: "rgba(255,255,255,0.5)"
typography:
  display:
    fontFamily: "Sofia Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sofia Sans, sans-serif"
    fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)"
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
  lg: "1rem"
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
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel-pad}"
  panel-inner:
    backgroundColor: "{colors.panel-inner}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "1rem 1.15rem"
  nav-pill:
    backgroundColor: "rgba(0,0,0,0.42)"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.4rem"
---

# Design System: Neat

## Overview

**One rule generates the whole system: the gradient is the ground, and
everything else floats on it.** A fixed full-bleed WebGL canvas sits behind every
surface at full intensity; all UI is translucent dark panels with white hairline
borders and generous corner radii, lifted above it. This is the editor's own
language, and the static content pages inherit it rather than inventing a
parallel one.

Two anti-references, both tried and rejected on this project:

1. **Never scrim the gradient.** An earlier build dimmed it to 46–72% black to
   make room for text. For a product whose entire value is how the gradient
   looks, dimming it is backwards. Contrast is bought by putting content on a
   panel, never by veiling the artifact.
2. **Never invent a second design language.** A build that used square corners,
   hairline-ruled card stock and condensed uppercase type read as a different
   product entirely, even with the palette corrected. Radius, translucency and
   Sofia Sans are the family bond.

## Colors

Strategy: **restrained achromatic chrome over unrestrained chroma**. The
interface is white-on-dark at varying alpha; every colour on screen comes from
the gradient itself.

Surfaces are expressed as alpha over the gradient, not as opaque fills:
`rgba(23,23,23,0.82)` for content panels, `rgba(255,255,255,0.05)` for groups
nested inside them, `rgba(0,0,0,0.42)` for the floating nav. Borders are always
`1px` of `rgba(255,255,255,0.1)`, stepping to `0.2` on hover.

Text is `#fff`, `rgba(255,255,255,0.72)` for secondary, `rgba(255,255,255,0.5)`
for faint labels. Against the worst-case panel composite (a panel over a pure
white gradient frame) body text measures 10.2:1.

## Typography

**Sofia Sans throughout**, at 400/500/600/700. Headings are weight 700 with
negative tracking; the step between levels is size, not face. Monospace appears
only for hex values, numeric parameters and code — never as a texture.

Ramp: display `clamp(2rem, 5vw, 3.25rem)` → headline `clamp(1.35rem, 2.4vw,
1.75rem)` → body `1rem` → data `0.9rem`. Prose measure caps around 46ch in decks
and the panel width elsewhere.

## Layout

Content is a **vertical stack of discrete panels**, `1.25rem` apart, centred and
capped at `52rem` (`68rem` for panels holding a grid). There is no page-wide
content sheet: each section is its own floating object, which is both the
editor's model and what keeps a blurred surface small enough to composite
cheaply over an animating canvas.

- Nav: a floating pill, fixed top-centre, never a full-width bar.
- Hero: `min-height: min(88vh, 52rem)`, panel bottom-left, gradient uninterrupted.
- Preview format: every gradient thumbnail is `560/294`, matching the captured
  frames and the OG images.

Breakpoints: **860px** stacks the gallery's spec card above its grid and drops
sticky positioning; **640px** collapses the hero's min-height and hides three of
five nav links, all of which still ship in the colophon.

## Elevation & Depth

Depth comes from translucency and blur, not from heavy shadow. Panels carry
`backdrop-filter: blur(12px)` and `0 20px 40px -12px rgba(0,0,0,.5)`.

One hard-won constraint: **blur only small and medium surfaces.** A tall blurred
element over an animating canvas forces a full-viewport composite every frame and
visibly stalls scrolling. The panel stack exists partly to keep every blurred
surface short.

## Shapes

Radius is the family signature: `1rem` panels, `0.75rem` nested groups and
previews, `0.375rem` buttons, `9999px` pills and tags. **Nothing in this system
is square.** Borders are `1px`, always, and never carry colour as decoration.

## Components

- **Panel** — the only surface content sits on. Translucent, hairline border,
  `1rem` radius, blurred. Nested groups use `panel-inner` at `0.75rem`.
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
  type. Both were tried and both broke the bond with the editor.
- Don't fake a gradient with CSS `linear-gradient` where a real frame belongs.
- Don't blur a tall surface over the canvas.
- Don't add a second accent colour; the gradient is the colour.
