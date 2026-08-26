# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Designers first: people choosing a look for a hero section or landing page, who
arrive from a search engine with a visual problem rather than a code problem.
They are evaluating whether a gradient looks good enough to use before they care
how it is installed. Developers are a real second audience — they are the ones
who paste the config and run the install — but the page must win the visual
judgement before the code matters.

Most arrive cold from Google on a specific query ("mesh gradient generator",
"animated css gradient background"), not from the brand.

## Product Purpose

Neat renders animated 3D gradient backgrounds in the browser and gives people a
way to design one and take it away — as a config object, a still image, or a
video file. It exists so a designer can get a distinctive moving background onto
a page without commissioning motion work or writing shader code.

Success for the marketing and gallery surfaces is brand impression, not an
immediate conversion: the visitor should leave impressed by what the gradients
look like and remember Neat the next time they need one.

## Positioning

Neat is not a CSS gradient generator. A subdivided plane geometry is displaced
along its normal by a Perlin noise field and then lit, and up to six colours are
blended across that surface in a fragment shader. The depth, folding and
self-shading come from real geometry, which is why the output cannot be
expressed as a `linear-gradient()` string and why competitors producing CSS
strings are answering a different question.

## Operating Context

- The editor at neat.firecms.co is a single client-rendered URL: a full-viewport
  WebGL canvas with floating chrome, a preset switcher, and a controls panel.
- Static content pages (guides, a gallery, one page per preset) are generated at
  build time by `editor/scripts/build-seo-pages.mjs` and served by Firebase
  Hosting alongside the app.
- People evaluate a gradient by looking at it moving, full size, not by reading
  about it. Any surface that describes a gradient without showing one at full
  intensity has failed the evaluation the visitor came to make.

## Capabilities and Constraints

- npm package `@firecms/neat`; ~17 KB gzipped; no dependencies; requires WebGL.
- 25 built-in presets, each a full config (palette of up to six colours plus
  speed, wave amplitude, saturation, brightness, grain, and shape parameters).
- Exports: JavaScript config object, PNG still, MP4 or WebM recording made
  locally via MediaRecorder. There is no CSS output and no GIF export.
- Three presets (Fluid, FireCMS, Pastel) render as wireframe by design.
- The editor's scroll container is deliberately infinite — it snaps back to the
  middle near either edge — so page content cannot live inside it.
- `prefers-reduced-motion` must be honoured on any surface that animates.

## Brand Commitments

- Name: NEAT. Made by FireCMS (firecms.co). Source at github.com/FireCMSco/neat.
- Licence: MIT + Commons Clause. Free to use; an unobtrusive NEAT watermark is
  drawn on the canvas unless a licence key is set, which is a one-off €12.
- The editor's own visual language — near-black chrome, Sofia Sans, full-bleed
  gradient, minimal floating UI — is established and recognisable.
- User-confirmed latitude for the content pages: recognisably the same family as
  the editor, but free to carry far more structure, typography and editorial
  character than the editor's minimal chrome.

## Evidence on Hand

- 25 real preset configurations with verified palettes and parameters
  (`editor/src/components/presets.ts`).
- Rendered frames of every preset captured from the real engine
  (`editor/public/gradient-previews/`, webp + jpeg, 1200×630).
- Three months of Search Console data (to 2026-08-23): 5,071 clicks and 73,688
  impressions on a single URL at average position 8.05; "gradient generator"
  alone is 16,698 impressions at position 7.64.
- Public GitHub star count is displayed live in the editor UI.
- No testimonials, named customers, case studies, press, or usage benchmarks
  exist. Do not invent them.

## Product Principles

1. Show the gradient, never describe it. The artifact is the argument.
2. Be honest about what Neat is not — it does not output CSS, and saying so
   earns more trust than a hedge.
3. The visual judgement comes first; code is for the second read.
4. Motion is the product, so motion must also be optional and safe.

## Accessibility & Inclusion

Content must stay legible over a live animated background at any frame of the
animation, not just a favourable one. `prefers-reduced-motion` disables
animation rather than removing the gradient.
