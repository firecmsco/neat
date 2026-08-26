/**
 * Generates the static specimen pages that sit alongside the editor.
 *
 * The editor is a single client-rendered URL, which means every search query it
 * ranks for lands on the same page with no indexable copy behind it. These pages
 * are plain HTML — real content, served as-is, no JavaScript required to read
 * them — each with a live Neat canvas at full intensity.
 *
 * Runs after `vite build`, writing into dist/. Firebase Hosting serves static
 * files ahead of the SPA rewrite, so dist/<slug>/index.html is served at /<slug>.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://neat.firecms.co";

const require = createRequire(import.meta.url);

/* ------------------------------------------------------------------ presets */

// presets.ts is TypeScript with a type-only import; transpile it with the local
// compiler rather than duplicating 2000 lines of config in this script.
async function loadPresets() {
    const ts = require("typescript");
    const srcPath = path.join(ROOT, "src/components/presets.ts");
    const stripped = fs.readFileSync(srcPath, "utf8").replace(/^import[^\n]*\n/gm, "");
    const js = ts.transpileModule(stripped, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
    }).outputText;

    const tmp = path.join(DIST, ".presets.tmp.mjs");
    fs.writeFileSync(tmp, js);
    try {
        return (await import(pathToFileUrl(tmp))).PRESETS;
    } finally {
        fs.rmSync(tmp, { force: true });
    }
}

const pathToFileUrl = (p) => "file://" + p;

/* ------------------------------------------------------------------- helpers */

const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Content strings intentionally contain inline markup (<code>, <strong>), so
// prose is trusted and only code blocks and attributes get escaped.
const slugify = (s) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const enabledColors = (cfg) => (cfg.colors || []).filter((c) => c.enabled).map((c) => c.color);

function write(relPath, contents) {
    const full = path.join(DIST, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
    return relPath;
}

/* --------------------------------------------------------------------- color */

function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

function relLuminance(hex) {
    const srgb = hexToRgb(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

const contrastOn = (hex, otherLum) => {
    const l = relLuminance(hex);
    const [hi, lo] = l > otherLum ? [l, otherLum] : [otherLum, l];
    return (hi + 0.05) / (lo + 0.05);
};

/**
 * The one chroma the page borrows from its own specimen.
 *
 * A swatch book tabs each page in the colour of the chip it records, so the
 * accent has to come from the preset rather than from a brand palette. Anything
 * that cannot clear 4.5:1 against the black sheet is rejected outright — the
 * accent marks rules and small type, so a pretty-but-illegible pick is not a
 * trade worth making.
 */
function accentFor(cfg, groundLum) {
    const candidates = enabledColors(cfg).filter((c) => contrastOn(c, groundLum) >= 4.5);
    if (!candidates.length) return "#ECECE8";
    // Most saturated of the legible ones, so the tab reads as colour, not as ink.
    return candidates
        .map((c) => {
            const [r, g, b] = hexToRgb(c);
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            return { c, sat: mx === 0 ? 0 : (mx - mn) / mx };
        })
        .sort((a, b) => b.sat - a.sat)[0].c;
}

// The sheet the specimens are mounted on; accents are judged against it.
const GROUND_LUM = relLuminance("#0E0F12");

/* ------------------------------------------------------------------ specimen */

/**
 * A chip in the fandeck: the real captured frame, its name, and its formula.
 *
 * These were once a CSS linear-gradient of the palette, which flattened a
 * displaced, lit surface into a two-stop ramp. scripts/capture-previews.mjs
 * renders the actual engine instead.
 */
function presetChip(name, cfg, i) {
    const slug = slugify(name);
    const tagline = (PRESET_META_REF[name] && PRESET_META_REF[name].tagline) || "";
    const cs = enabledColors(cfg);
    return `      <li class="chip">
        <a href="/gradients/${slug}/" data-preset="${esc(name)}">
          <img src="/gradient-previews/${slug}.webp" width="560" height="294"
               ${i < 6 ? "" : 'loading="lazy" '}decoding="async"
               alt="${esc(name)} gradient — ${esc(tagline.toLowerCase())}" />
          <span class="chip-label">
            <span class="chip-name">${esc(name)}</span>
            <span class="chip-form">${cs.length}C &middot; SPD ${esc(round(cfg.speed))} &middot; AMP ${esc(round(cfg.waveAmplitude))}</span>
          </span>
        </a>
      </li>`;
}

const round = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v);

/* -------------------------------------------------------------------- layout */

const CSS = String.raw`
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

:root{
  --card:#0E0F12;        /* the sheet: black swatch-book card */
  --plate:#191A1F;       /* label plates, lifted off the sheet */
  --well:#08090B;        /* code plates, recessed into it */
  --ink:#ECECE8;
  --ink-2:#9EA0A8;
  --rule:rgba(236,236,232,.16);
  --rule-2:rgba(236,236,232,.34);
  --accent:#ECECE8;
  --gutter:clamp(1.25rem,5vw,4.5rem);
  --pad:clamp(1.25rem,4vw,4rem);
  --rail:3.5rem;
  --sans:'Sofia Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --cond:'Sofia Sans Extra Condensed',var(--sans);
  --mono:'Spline Sans Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
}

body{margin:0;background:var(--card);color:var(--ink);font-family:var(--sans);
  font-size:1.0625rem;line-height:1.65;-webkit-font-smoothing:antialiased}

/* ------------------------------------------------------------------- binding */
.rail{position:sticky;top:0;z-index:40;background:#0A0B0D;color:var(--ink);
  height:var(--rail);display:flex;align-items:center;gap:1.5rem;
  padding:0 var(--gutter);border-bottom:1px solid rgba(236,236,232,.12)}
.mark{font-family:var(--cond);font-weight:800;font-size:1.5rem;letter-spacing:.14em;
  color:#fff;text-decoration:none;line-height:1}
.rail nav{margin-left:auto;display:flex;gap:1.4rem;overflow-x:auto;scrollbar-width:none}
.rail nav::-webkit-scrollbar{display:none}
.rail nav a{font-family:var(--cond);font-weight:600;font-size:1rem;letter-spacing:.1em;
  text-transform:uppercase;color:rgba(255,255,255,.72);text-decoration:none;white-space:nowrap;
  padding:.15rem 0;border-bottom:1px solid transparent}
.rail nav a:hover,.rail nav a:focus-visible{color:#fff;border-bottom-color:#fff}

/* ---------------------------------------------------------------- chip field */
.chipfield{position:relative;height:clamp(26rem,72vh,46rem);background:#141519}
.chipfield canvas{position:absolute;inset:0;width:100%;height:100%;display:block;
  background:linear-gradient(140deg,#2E0EC7,#4CB4BB,#FF5772)}

.plate{position:absolute;left:var(--gutter);bottom:-3.25rem;z-index:5;
  width:min(46rem,calc(100% - var(--gutter) * 2));background:var(--plate);
  border:1px solid rgba(236,236,232,.14);
  padding:clamp(1.5rem,3.5vw,2.75rem);
  box-shadow:0 26px 60px -18px rgba(0,0,0,.75),0 2px 8px rgba(0,0,0,.4)}
.crumbs{margin:0 0 1rem;font-family:var(--mono);font-size:.7rem;letter-spacing:.11em;
  text-transform:uppercase;color:var(--ink-2)}
.crumbs a{color:var(--ink-2);text-decoration:none}
.crumbs a:hover{color:var(--ink);text-decoration:underline}
.crumbs span{opacity:.5;margin:0 .45em}

h1{font-family:var(--cond);font-weight:800;font-size:clamp(2.75rem,7.5vw,5.25rem);
  line-height:.94;letter-spacing:-.02em;margin:0;text-wrap:balance}
.deck{margin:1.1rem 0 0;font-size:clamp(1.05rem,1.5vw,1.24rem);line-height:1.5;
  color:var(--ink-2);max-width:44ch}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin:1.75rem 0 0}

.btn{display:inline-block;font-family:var(--cond);font-weight:700;font-size:1.0625rem;
  letter-spacing:.09em;text-transform:uppercase;text-decoration:none;
  padding:.85rem 1.6rem;border:1px solid var(--ink);background:var(--ink);color:#0E0F12;
  transition:background .18s cubic-bezier(.2,.7,.3,1),color .18s cubic-bezier(.2,.7,.3,1)}
.btn:hover,.btn:focus-visible{background:transparent;color:var(--ink)}
.btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule-2)}
.btn.ghost:hover,.btn.ghost:focus-visible{background:var(--ink);color:#0E0F12;border-color:var(--ink)}

/* -------------------------------------------------------------------- sheet */
.sheet{background:var(--card);padding:7.5rem 0 0}
.sheet-in{max-width:74rem;margin:0 auto;padding:0 var(--gutter) 0 0;
  margin-left:var(--gutter);border-left:1px solid var(--rule);padding-left:var(--pad)}
.col{max-width:68ch}

.sect{margin-top:4.5rem;padding-top:2.75rem;position:relative}
.sect::before{content:"";position:absolute;top:0;left:calc(-1 * var(--pad) - 1px);right:0;
  height:1px;background:var(--rule)}
.sect:first-child{margin-top:0;padding-top:0}
.sect:first-child::before{display:none}

h2{font-family:var(--cond);font-weight:800;font-size:clamp(1.9rem,3.6vw,2.9rem);
  line-height:1.02;letter-spacing:-.012em;margin:0 0 1.5rem;max-width:22ch;text-wrap:balance}
h3{font-family:var(--cond);font-weight:700;font-size:1.45rem;letter-spacing:.01em;
  margin:2.5rem 0 .75rem}
p{margin:0 0 1.15rem}
.col ul:not(.chips):not(.onward):not(.fandeck){margin:0 0 1.4rem;padding-left:0;list-style:none}
.col ul:not(.chips):not(.onward):not(.fandeck) li{position:relative;padding-left:1.5rem;
  margin-bottom:.85rem}
.col ul:not(.chips):not(.onward):not(.fandeck) li::before{content:"";position:absolute;left:0;
  top:.72em;width:.6rem;height:1px;background:var(--accent)}
strong{font-weight:700}
a{color:var(--ink);text-decoration:underline;text-underline-offset:.18em;
  text-decoration-thickness:1px;text-decoration-color:var(--rule-2)}
a:hover{text-decoration-color:var(--ink)}

code{font-family:var(--mono);font-size:.86em;background:rgba(236,236,232,.1);
  padding:.12em .38em;word-break:break-word}
pre{background:var(--well);color:#D8D9D4;border:1px solid var(--rule);
  padding:1.5rem clamp(1.1rem,2.5vw,1.75rem);
  overflow-x:auto;margin:0 0 1.5rem;font-size:.875rem;line-height:1.7}
pre code{background:none;padding:0;font-size:inherit;white-space:pre;color:inherit}

/* ------------------------------------------------------------------- palette */
.chips{display:flex;flex-wrap:wrap;gap:1rem 1.15rem;margin:0 0 1.75rem;padding:0;list-style:none}
.chips li{margin:0}
.swatch{display:block;width:5.25rem;height:5.25rem;border:1px solid var(--rule-2)}
.chips code{display:block;margin-top:.55rem;background:none;padding:0;font-size:.72rem;
  letter-spacing:.06em;color:var(--ink-2)}

/* --------------------------------------------------------------------- spec */
table.spec{width:100%;max-width:34rem;border-collapse:collapse;margin:0 0 1.75rem}
table.spec th,table.spec td{padding:.8rem 0;border-bottom:1px solid var(--rule);vertical-align:baseline}
table.spec th{text-align:left;font-family:var(--cond);font-weight:600;font-size:.95rem;
  letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2)}
table.spec td{text-align:right;font-family:var(--mono);font-size:1.05rem;font-variant-numeric:tabular-nums}
table.spec tr:first-child th,table.spec tr:first-child td{border-top:1px solid var(--rule-2)}

/* ------------------------------------------------------------------- fandeck */
.fandeck{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));
  gap:1.75rem 1.5rem;padding:0;margin:0;list-style:none}
.chip a{display:block;text-decoration:none;color:inherit}
.chip img{display:block;width:100%;height:auto;aspect-ratio:560/294;object-fit:cover;
  background:#141519;border:1px solid var(--rule);
  transition:transform .3s cubic-bezier(.2,.7,.3,1),box-shadow .3s cubic-bezier(.2,.7,.3,1)}
.chip a:hover img,.chip a:focus-visible img{transform:translateY(-5px);
  box-shadow:0 18px 34px -14px rgba(0,0,0,.8);border-color:var(--rule-2)}
.chip-label{display:block;padding-top:.7rem}
.chip-name{display:block;font-family:var(--cond);font-weight:700;font-size:1.2rem;letter-spacing:.01em}
.chip-form{display:block;font-family:var(--mono);font-size:.66rem;letter-spacing:.09em;
  color:var(--ink-2);margin-top:.15rem}
.chip a:hover .chip-name{text-decoration:underline;text-underline-offset:.18em}

/* ----------------------------------------------------- the held chip (hub) */
.sheet--hub{padding-top:clamp(2.5rem,5vw,4rem)}
.sheet--hub h1{margin-bottom:0}
.sheet--hub .deck{max-width:52ch}
.sheet--hub .actions{margin-top:1.5rem}

.deckwrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);
  gap:clamp(1.5rem,3vw,3rem);align-items:start}
.held{position:sticky;top:calc(var(--rail) + 1.5rem)}
.held-stage{position:relative;aspect-ratio:560/294;background:#141519;
  border:1px solid var(--rule)}
.held-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;
  background:linear-gradient(140deg,#2E0EC7,#4CB4BB,#FF5772)}
.held-meta{padding-top:1.25rem}
.held-meta h2{font-size:clamp(1.75rem,3vw,2.4rem);margin:0 0 .3rem;max-width:none}
.viewer-tag{margin:0 0 1.25rem;color:var(--ink-2);font-size:.95rem;line-height:1.45;min-height:2.8em}
.held-meta table.spec{margin:0 0 1.5rem;max-width:none}
.held-meta table.spec th,.held-meta table.spec td{padding:.5rem 0;font-size:.85rem}
.held-meta table.spec td{font-size:.95rem}
.held-meta .btn{display:block;text-align:center}
.viewer-hint{font-family:var(--mono);font-size:.66rem;letter-spacing:.09em;
  text-transform:uppercase;color:var(--ink-2);margin:0 0 1rem}
@media (hover:none){.viewer-hint{display:none}}

/* ---------------------------------------------------------------------- faq */
.faq{margin:0}
.faq details{border-bottom:1px solid var(--rule)}
.faq details:first-of-type{border-top:1px solid var(--rule-2)}
.faq summary{cursor:pointer;list-style:none;padding:1.15rem 2.5rem 1.15rem 0;position:relative;
  font-family:var(--cond);font-weight:700;font-size:1.3rem;letter-spacing:.005em}
.faq summary::-webkit-details-marker{display:none}
.faq summary::before,.faq summary::after{content:"";position:absolute;right:.3rem;top:50%;
  width:.85rem;height:1px;background:var(--ink);transition:transform .22s cubic-bezier(.2,.7,.3,1)}
.faq summary::after{transform:rotate(90deg)}
.faq details[open] summary::after{transform:rotate(0deg)}
.faq details p{margin:0 0 1.35rem;color:var(--ink-2);max-width:64ch}

/* -------------------------------------------------------------------- onward */
.onward{display:flex;flex-wrap:wrap;gap:.6rem;padding:0;margin:0;list-style:none}
.onward a{display:inline-block;font-family:var(--cond);font-weight:600;font-size:1.05rem;
  letter-spacing:.05em;text-decoration:none;padding:.6rem 1.1rem;border:1px solid var(--rule-2);
  transition:background .18s ease,color .18s ease,border-color .18s ease}
.onward a:hover,.onward a:focus-visible{background:var(--ink);color:var(--plate);border-color:var(--ink)}

/* ----------------------------------------------------------------- colophon */
.colophon{background:#0A0B0D;color:var(--ink-2);margin-top:7rem;
  border-top:1px solid var(--rule);padding:3.5rem var(--gutter) 4rem}
.colophon-in{max-width:74rem;margin:0 auto;display:grid;
  grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:2.5rem}
.colophon h2{font-family:var(--cond);font-weight:600;font-size:.9rem;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(236,236,232,.5);margin:0 0 .9rem;max-width:none}
.colophon ul{list-style:none;padding:0;margin:0}
.colophon li{margin-bottom:.5rem}
.colophon a{color:rgba(236,236,232,.86);text-decoration:none;font-size:.95rem}
.colophon a:hover{color:#fff;text-decoration:underline}
.colophon-note{max-width:74rem;margin:2.75rem auto 0;padding-top:1.75rem;
  border-top:1px solid rgba(236,236,232,.14);font-family:var(--mono);font-size:.7rem;
  letter-spacing:.06em;color:rgba(236,236,232,.46);line-height:1.7}

:where(a,button,summary,[tabindex]):focus-visible{outline:2px solid var(--accent);
  outline-offset:3px}

/* ------------------------------------------------------------------ narrow */
@media (max-width:600px){
  /* Every link still ships in the colophon, so the rail keeps only the two a
     visitor on a phone actually reaches for. */
  .rail nav a[data-optional]{display:none}
}
@media (max-width:960px){
  .deckwrap{grid-template-columns:1fr}
  .held{position:static}
  .held-stage{aspect-ratio:16/9}
  .viewer-tag{min-height:0}
  .held-meta{padding-bottom:1rem}
}
@media (max-width:720px){
  body{font-size:1rem}
  .rail nav{gap:1.1rem}
  .sect{margin-top:3rem;padding-top:2rem}
  h2{margin-bottom:1.1rem}
  /* The plate leaves the overlay and joins the flow, so the chip field has to
     stop being a fixed box and the canvas has to stop being absolute — an
     absolute canvas inside a fixed-height parent paints straight over it. */
  .chipfield{height:auto}
  .chipfield canvas{position:relative;height:clamp(14rem,42vh,21rem)}
  .plate{position:static;width:auto;bottom:auto;left:auto;box-shadow:none;
    border-width:0 0 1px;margin:0;padding:1.5rem var(--gutter) 1.75rem}
  .sheet{padding-top:2.5rem}
  .sheet-in{margin-left:var(--gutter);padding-left:1rem;padding-right:var(--gutter)}
  .sect::before{left:-1rem}
  .swatch{width:4rem;height:4rem}
  .fandeck{grid-template-columns:repeat(auto-fill,minmax(11rem,1fr));gap:1.35rem 1rem}
}
`.trim();

const NAV = [
    ["/gradient-generator/", "Generator", true],
    ["/gradients/", "Gallery", false],
    ["/mesh-gradient-generator/", "Mesh", true],
    ["/gradient-video-background/", "Video", true],
    ["/", "Editor", false],
];

const CONTRACT = `<!--
DIRECTION CONTRACT
THESIS: A gradient is a material with a formula; these pages are its specimen
  sheets. Refuses the dark-hero-plus-card-grid every gradient tool ships, and the
  scrimmed wallpaper that dims the product to make room for text.
OWN-WORLD: A lighting-gel swatch book — black card, chips reading true against
  it, spec numbers stamped in mono. The gradient supplies all chroma, reproduced
  at full intensity and never scrimmed; plates are solid objects, never veils.
  Sofia Sans Extra Condensed display, Sofia Sans text, Spline Sans Mono for hex,
  formula values and code. Hairline rules, square plates, an accent tabbed from
  the specimen's own palette.
STORY: A designer arrives from search, sees the material moving at full size,
  judges it, reads its formula, and leaves remembering Neat.
FIRST VIEWPORT: Full-bleed live gradient at 100% intensity under a black binding
  rail; an opaque card-stock label plate at lower left carries the heading, deck
  and both actions, overlapping the sheet edge.
FORM: Specimen sheet / fandeck; candidate 3 of the grounded list; seed f8477209.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

function shell({ title, description, canonical, bodyHtml, jsonLd, accent, ogImage, script }) {
    const og = ogImage || `${ORIGIN}/og_image_v3.png`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="theme-color" content="#0E0F12" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64" />
<link rel="icon" type="image/png" href="/logo-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/logo.png" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="NEAT" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(og)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(og)}" />
<meta name="twitter:site" content="@gatti675" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;600;700&family=Sofia+Sans+Extra+Condensed:wght@600;700;800&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${CSS}</style>
${jsonLd.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join("\n")}
</head>
<body${accent && accent !== "#ECECE8" ? ` style="--accent:${esc(accent)}"` : ""}>
${CONTRACT}
<header class="rail">
  <a class="mark" href="/">NEAT</a>
  <nav aria-label="Main">
${NAV.map(([href, label, optional]) => `    <a href="${href}"${optional ? " data-optional" : ""}>${label}</a>`).join("\n")}
  </nav>
</header>
${bodyHtml}
<footer class="colophon">
  <div class="colophon-in">
    <div>
      <h2>Specimens</h2>
      <ul>
        <li><a href="/gradients/">Gradient gallery</a></li>
        <li><a href="/">Open the editor</a></li>
      </ul>
    </div>
    <div>
      <h2>Guides</h2>
      <ul>
        <li><a href="/gradient-generator/">Gradient generator</a></li>
        <li><a href="/animated-gradient-generator/">Animated gradients</a></li>
        <li><a href="/mesh-gradient-generator/">Mesh gradients</a></li>
      </ul>
    </div>
    <div>
      <h2>Techniques</h2>
      <ul>
        <li><a href="/css-animated-gradient-background/">CSS gradients</a></li>
        <li><a href="/gradient-video-background/">Gradient video</a></li>
        <li><a href="/animated-3d-background-for-websites/">3D backgrounds</a></li>
      </ul>
    </div>
    <div>
      <h2>Source</h2>
      <ul>
        <li><a href="https://github.com/FireCMSco/neat" rel="noopener">GitHub</a></li>
        <li><a href="https://www.npmjs.com/package/@firecms/neat" rel="noopener">npm</a></li>
        <li><a href="https://firecms.co" rel="noopener">FireCMS</a></li>
        <li><a href="mailto:hello@firecms.co">hello@firecms.co</a></li>
      </ul>
    </div>
  </div>
  <p class="colophon-note">Neat renders animated 3D gradients in WebGL &mdash; a displaced plane, lit, with up to six colours blended across it. Free to use under MIT + Commons Clause; an unobtrusive watermark is drawn unless a licence key is set.</p>
</footer>
<script src="/neat.umd.js"></script>
<script>
${script}
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------ page renderers */

const codeBlock = (c) => `<pre><code>${esc(c.text)}</code></pre>`;

/** One live canvas, honouring the visitor's motion preference. */
const SINGLE_CANVAS_SCRIPT = (cfg) => `(function () {
  var el = document.getElementById("gradient");
  if (!el || !window.neat || !window.neat.NeatGradient) return;   // CSS fallback stays
  try {
    var cfg = ${JSON.stringify(cfg)};
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) cfg.speed = 0;
    new window.neat.NeatGradient(Object.assign({ ref: el }, cfg));
  } catch (e) { /* leave the CSS gradient fallback in place */ }
})();`;

function chipField({ crumbs, h1, deck, actions }) {
    return `<section class="chipfield">
  <canvas id="gradient" aria-hidden="true"></canvas>
  <div class="plate">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
    <h1>${esc(h1)}</h1>
    <p class="deck">${deck}</p>
    <p class="actions">${actions}</p>
  </div>
</section>`;
}

function faqSection(faq) {
    if (!faq || !faq.length) return "";
    return `<section class="sect"><div class="col">
  <h2>Questions</h2>
  <div class="faq">
${faq.map((f) => `    <details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}
  </div>
</div></section>`;
}

function onwardSection(slugs, allTitles) {
    if (!slugs || !slugs.length) return "";
    const links = slugs
        .filter((s) => allTitles[s])
        .map((s) => `    <li><a href="/${s}/">${esc(allTitles[s])}</a></li>`)
        .join("\n");
    if (!links) return "";
    return `<section class="sect"><div class="col">
  <h2>Keep reading</h2>
  <ul class="onward">
${links}
  </ul>
</div></section>`;
}

function renderGuide(guide, presets, allTitles) {
    const cfg = presets[guide.preset];
    const canonical = `${ORIGIN}/${guide.slug}/`;

    const sections = guide.sections
        .map((s) => {
            let out = `<section class="sect"><div class="col">\n  <h2>${esc(s.h2)}</h2>\n`;
            if (s.body) out += s.body.map((p) => `  <p>${p}</p>`).join("\n") + "\n";
            if (s.list) out += `  <ul>\n${s.list.map((li) => `    <li>${li}</li>`).join("\n")}\n  </ul>\n`;
            if (s.code) out += "  " + codeBlock(s.code) + "\n";
            if (s.after) out += s.after.map((p) => `  <p>${p}</p>`).join("\n") + "\n";
            return out + `</div></section>`;
        })
        .join("\n");

    const bodyHtml = `${chipField({
        crumbs: `<a href="/">Neat</a><span>/</span>${esc(guide.h1)}`,
        h1: guide.h1,
        deck: guide.intro,
        actions: `<a class="btn" href="/?preset=${encodeURIComponent(guide.preset)}">Open the editor</a>
      <a class="btn ghost" href="/gradients/">${Object.keys(presets).length} specimens</a>`,
    })}
<main class="sheet"><div class="sheet-in">
${sections}
${faqSection(guide.faq)}
${onwardSection(guide.related, allTitles)}
</div></main>`;

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Neat", item: ORIGIN + "/" },
                { "@type": "ListItem", position: 2, name: guide.h1, item: canonical },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: guide.title,
            description: guide.metaDescription,
            url: canonical,
            mainEntityOfPage: canonical,
            author: { "@type": "Organization", name: "FireCMS", url: "https://firecms.co" },
            publisher: { "@type": "Organization", name: "FireCMS", url: "https://firecms.co" },
        },
    ];
    if (guide.faq && guide.faq.length) {
        jsonLd.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
        });
    }

    return shell({
        title: guide.title,
        description: guide.metaDescription,
        canonical,
        bodyHtml,
        jsonLd,
        accent: accentFor(cfg, GROUND_LUM),
        ogImage: `${ORIGIN}/gradient-previews/${slugify(guide.preset)}.jpg`,
        script: SINGLE_CANVAS_SCRIPT(cfg),
    });
}

function specTable(cfg, colorCount) {
    const rows = [
        ["Colours", colorCount],
        ["Speed", round(cfg.speed)],
        ["Wave amplitude", round(cfg.waveAmplitude)],
        ["Saturation", round(cfg.colorSaturation)],
        ["Brightness", round(cfg.colorBrightness)],
        ["Grain", round(cfg.grainScale ?? 0)],
    ];
    return `<table class="spec">
  <tbody>
${rows.map(([k, v]) => `    <tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("\n")}
  </tbody>
</table>`;
}

function renderPreset(name, cfg, meta, presets, neighbours) {
    const slug = slugify(name);
    const canonical = `${ORIGIN}/gradients/${slug}/`;
    const colors = enabledColors(cfg);
    const title = `${name} – Animated Gradient Preset | NEAT`;
    const description = `${meta.tagline}. ${colors.length} colours, speed ${round(cfg.speed)}, wave amplitude ${round(cfg.waveAmplitude)}. Open it in the free Neat gradient editor or copy the config.`;

    const configBody = JSON.stringify(cfg, null, 2)
        .split("\n")
        .slice(1, -1)
        .join("\n")
        .replace(/^(\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/gm, "$1$2:");

    const configSnippet = `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
${configBody}
});`;

    const swatches = colors
        .map((c) => `    <li><span class="swatch" style="background:${esc(c)}"></span><code>${esc(c)}</code></li>`)
        .join("\n");

    const bodyHtml = `${chipField({
        crumbs: `<a href="/">Neat</a><span>/</span><a href="/gradients/">Gradients</a><span>/</span>${esc(name)}`,
        h1: name,
        deck: `${esc(meta.tagline)}. The gradient behind this page is this exact preset, running live.`,
        actions: `<a class="btn" href="/?preset=${encodeURIComponent(name)}">Open in the editor</a>
      <a class="btn ghost" href="/gradients/">All specimens</a>`,
    })}
<main class="sheet"><div class="sheet-in">
  <section class="sect"><div class="col">
    <h2>What it is</h2>
    <p>${esc(meta.description)}</p>
    <h3>Good for</h3>
    <p>${esc(meta.useCase)}</p>
  </div></section>

  <section class="sect"><div class="col">
    <h2>Formula</h2>
    <ul class="chips">
${swatches}
    </ul>
    ${specTable(cfg, colors.length)}
  </div></section>

  <section class="sect"><div class="col">
    <h2>Use this preset</h2>
    <p>Install the package and pass the config straight to the constructor. No build step and no dependencies:</p>
    <pre><code>npm install @firecms/neat</code></pre>
    <pre><code>${esc(configSnippet)}</code></pre>
    <p>Prefer a file? Open it <a href="/?preset=${encodeURIComponent(
        name
    )}">in the editor</a> and export a PNG still or an MP4 loop &mdash; see the <a href="/gradient-video-background/">gradient video guide</a>.</p>
  </div></section>

  <section class="sect">
    <div class="col"><h2>Adjacent specimens</h2></div>
    <ul class="fandeck">
${neighbours.map(([n, c], i) => presetChip(n, c, i)).join("\n")}
    </ul>
    <p style="margin-top:1.75rem"><a href="/gradients/">See all ${Object.keys(presets).length} specimens</a></p>
  </section>
</div></main>`;

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Neat", item: ORIGIN + "/" },
                { "@type": "ListItem", position: 2, name: "Gradients", item: ORIGIN + "/gradients/" },
                { "@type": "ListItem", position: 3, name: name, item: canonical },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: `${name} gradient preset`,
            description: meta.description,
            url: canonical,
            creator: { "@type": "Organization", name: "FireCMS", url: "https://firecms.co" },
            license: "https://github.com/FireCMSco/neat/blob/main/LICENSE",
        },
    ];

    return {
        slug,
        html: shell({
            title,
            description,
            canonical,
            bodyHtml,
            jsonLd,
            accent: accentFor(cfg, GROUND_LUM),
            ogImage: `${ORIGIN}/gradient-previews/${slug}.jpg`,
            script: SINGLE_CANVAS_SCRIPT(cfg),
        }),
    };
}

/**
 * The gallery is the fandeck: one specimen held up large and live, the rest of
 * the deck beside it. Hovering or focusing a chip swaps what is being held, so
 * the page demonstrates the engine rather than showing 25 stills of it.
 */
function renderHub(presets, meta) {
    const canonical = `${ORIGIN}/gradients/`;
    const entries = Object.entries(presets);
    const first = entries[0][0];

    const data = Object.fromEntries(
        entries.map(([n, c]) => [
            n,
            {
                slug: slugify(n),
                tag: (meta[n] && meta[n].tagline) || "",
                spec: [
                    ["Colours", enabledColors(c).length],
                    ["Speed", round(c.speed)],
                    ["Wave amplitude", round(c.waveAmplitude)],
                    ["Saturation", round(c.colorSaturation)],
                    ["Grain", round(c.grainScale ?? 0)],
                ],
                cfg: c,
            },
        ])
    );

    const bodyHtml = `<main class="sheet sheet--hub"><div class="sheet-in">
  <section class="sect">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Neat</a><span>/</span>Gradients</nav>
    <h1>Gradient gallery</h1>
    <p class="deck">Every built-in Neat preset, held up at full size and running live. Each one carries its palette, its formula, and the code to use it.</p>
    <p class="actions">
      <a class="btn" href="/">Open the editor</a>
      <a class="btn ghost" href="/gradient-generator/">How the generator works</a>
    </p>
  </section>

  <section class="sect">
    <div class="deckwrap">
      <div class="held">
        <div class="held-stage">
          <canvas id="gradient" role="img" aria-label="Live preview of the ${esc(first)} gradient"></canvas>
        </div>
        <div class="held-meta">
          <h2 id="heldName">${esc(first)}</h2>
          <p class="viewer-tag" id="heldTag">${esc((meta[first] && meta[first].tagline) || "")}</p>
          <table class="spec"><tbody id="heldSpec"></tbody></table>
          <a class="btn" id="heldOpen" href="/gradients/${slugify(first)}/">Open this specimen</a>
        </div>
      </div>

      <div class="deckcol">
        <p class="viewer-hint">Hover a specimen to hold it up</p>
        <ul class="fandeck">
${entries.map(([n, c], i) => presetChip(n, c, i)).join("\n")}
        </ul>
      </div>
    </div>
  </section>

  <section class="sect"><div class="col">
    <h2>Picking a starting point</h2>
    <p>The parameter space is large enough that starting from scratch is rarely productive. Start from whichever specimen is closest to the mood you want, then change colours first and motion second &mdash; motion is what people notice, and it is the easiest thing to overdo.</p>
    <ul>
      <li><strong>Behind body text?</strong> Fluid, Pastel, Coral, Oil Slick or Dark Mode. Low speed, low amplitude, nothing that competes.</li>
      <li><strong>Dark theme?</strong> Monterey, Night Dunes, Dark Mode or Cosmic Vortex.</li>
      <li><strong>Light theme?</strong> Clouds and Coral are the two that hold up with dark text on them.</li>
      <li><strong>Loud on purpose?</strong> Flame, Lemon, Virus or Blob.</li>
      <li><strong>Classic SaaS?</strong> Stripe, Bloom or FireCMS.</li>
    </ul>
  </div></section>

  <section class="sect"><div class="col">
    <h2>Guides</h2>
    <ul class="onward">
      <li><a href="/gradient-generator/">Gradient generator</a></li>
      <li><a href="/animated-gradient-generator/">Animated gradients</a></li>
      <li><a href="/mesh-gradient-generator/">Mesh gradients</a></li>
      <li><a href="/css-animated-gradient-background/">CSS gradients</a></li>
      <li><a href="/gradient-video-background/">Gradient video</a></li>
      <li><a href="/animated-3d-background-for-websites/">3D backgrounds</a></li>
    </ul>
  </div></section>
</div></main>`;

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Neat", item: ORIGIN + "/" },
                { "@type": "ListItem", position: 2, name: "Gradients", item: canonical },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Neat gradient gallery",
            description: "Every built-in Neat animated gradient preset, with palettes, parameters and code.",
            url: canonical,
            mainEntity: {
                "@type": "ItemList",
                numberOfItems: entries.length,
                itemListElement: entries.map(([n], i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: n,
                    url: `${ORIGIN}/gradients/${slugify(n)}/`,
                })),
            },
        },
    ];

    const script = `(function () {
  var DATA = ${JSON.stringify(data)};
  var stage = document.querySelector(".held-stage");
  var nameEl = document.getElementById("heldName");
  var tagEl = document.getElementById("heldTag");
  var specEl = document.getElementById("heldSpec");
  var openEl = document.getElementById("heldOpen");
  var canvas = document.getElementById("gradient");
  if (!stage || !canvas || !window.neat || !window.neat.NeatGradient) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null, gradient = null, timer = null;

  function apply(name) {
    var d = DATA[name];
    if (!d || name === current) return;
    current = name;

    nameEl.textContent = name;
    tagEl.textContent = d.tag;
    openEl.setAttribute("href", "/gradients/" + d.slug + "/");
    canvas.setAttribute("aria-label", "Live preview of the " + name + " gradient");
    specEl.innerHTML = d.spec
      .map(function (r) { return "<tr><th scope=\\"row\\">" + r[0] + "</th><td>" + r[1] + "</td></tr>"; })
      .join("");

    // A fresh element per swap guarantees a clean WebGL context; reusing one
    // after destroy() leaves the old context in an unreliable state.
    try { if (gradient && gradient.destroy) gradient.destroy(); } catch (e) {}
    var next = canvas.cloneNode(false);
    canvas.replaceWith(next);
    canvas = next;

    var cfg = Object.assign({}, d.cfg);
    if (reduce) cfg.speed = 0;
    try { gradient = new window.neat.NeatGradient(Object.assign({ ref: canvas }, cfg)); }
    catch (e) { gradient = null; }
  }

  function schedule(name) {
    clearTimeout(timer);
    timer = setTimeout(function () { apply(name); }, 110);
  }

  apply(${JSON.stringify(first)});

  document.querySelectorAll(".fandeck a[data-preset]").forEach(function (a) {
    var name = a.getAttribute("data-preset");
    a.addEventListener("mouseenter", function () { schedule(name); });
    a.addEventListener("focus", function () { apply(name); });
  });
})();`;

    return shell({
        title: "Gradient Gallery – 25 Free Animated Gradient Presets | NEAT",
        description:
            "Browse 25 free animated gradient presets with palettes, parameters and copy-paste code. Open any of them in the free Neat gradient editor.",
        canonical,
        bodyHtml,
        jsonLd,
        accent: accentFor(presets[first], GROUND_LUM),
        ogImage: `${ORIGIN}/gradient-previews/neat.jpg`,
        script,
    });
}
/* ------------------------------------------------------------- link checking */

// Every internal href on a generated page must resolve to something we actually
// wrote (or a known root asset). A typo'd slug is otherwise invisible until a
// crawler finds the 404.
function validateInternalLinks(writtenPaths) {
    const known = new Set(["/", "/sitemap.xml", "/robots.txt", "/llms.txt", "/neat.umd.js"]);
    for (const rel of writtenPaths) known.add("/" + rel.replace(/index\.html$/, ""));

    const broken = [];
    for (const rel of writtenPaths) {
        const html = fs.readFileSync(path.join(DIST, rel), "utf8");
        for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
            const href = m[1];
            if (known.has(href)) continue;
            if (fs.existsSync(path.join(DIST, href.replace(/^\//, "")))) continue;
            broken.push(`${rel} -> ${href}`);
        }
    }
    if (broken.length) {
        console.error("[seo] broken internal links:\n  " + [...new Set(broken)].join("\n  "));
        process.exit(1);
    }
    console.log(`[seo] internal links OK (${known.size} routes)`);
}

// Google truncates snippets somewhere around 160 characters. Warn rather than
// fail — it costs a clipped snippet, not a broken page.
function warnOnLongDescriptions() {
    const long = [];
    for (const rel of ["index.html", ...fs.readdirSync(DIST, { recursive: true })]
        .filter((f) => typeof f === "string" && f.endsWith("index.html"))) {
        const file = path.join(DIST, rel);
        if (!fs.existsSync(file)) continue;
        const m = fs.readFileSync(file, "utf8").match(/<meta name="description" content="([^"]*)"/);
        if (m && m[1].length > 165) long.push(`${rel} (${m[1].length} chars)`);
    }
    if (long.length) console.warn("[seo] warning: meta descriptions likely to be truncated:\n  " + [...new Set(long)].join("\n  "));
}

/* ---------------------------------------------------------------------- main */

let PRESET_META_REF = {};

async function main() {
    if (!fs.existsSync(DIST)) {
        console.error("[seo] dist/ not found — run `vite build` first.");
        process.exit(1);
    }

    const { PRESET_META } = await import(pathToFileUrl(path.join(__dirname, "seo/presets-meta.mjs")));
    const { GUIDES } = await import(pathToFileUrl(path.join(__dirname, "seo/guides.mjs")));
    PRESET_META_REF = PRESET_META;

    const presets = await loadPresets();
    const presetNames = Object.keys(presets);

    // Ship the library as a stable, unhashed filename the static pages can load.
    const umd = path.resolve(ROOT, "../lib/dist/index.umd.js");
    if (!fs.existsSync(umd)) {
        console.error("[seo] ../lib/dist/index.umd.js not found — run `npm run build` in ../lib first.");
        process.exit(1);
    }
    // The editor bundles ../lib/src directly, but these pages load the built UMD,
    // so a stale dist would ship an older shader than the editor shows.
    const libSrc = path.resolve(ROOT, "../lib/src");
    const newestSrc = fs
        .readdirSync(libSrc)
        .map((f) => fs.statSync(path.join(libSrc, f)).mtimeMs)
        .reduce((a, b) => Math.max(a, b), 0);
    if (newestSrc > fs.statSync(umd).mtimeMs) {
        console.warn("[seo] warning: ../lib/dist is older than ../lib/src — run `npm run build` in ../lib");
    }
    fs.copyFileSync(umd, path.join(DIST, "neat.umd.js"));

    const previewDir = path.join(ROOT, "public/gradient-previews");
    const missing = Object.keys(presets).flatMap((n) =>
        ["webp", "jpg"]
            .map((ext) => `${slugify(n)}.${ext}`)
            .filter((f) => !fs.existsSync(path.join(previewDir, f)))
    );
    if (missing.length) {
        console.error(`[seo] missing preset previews (run \`npm run previews\`):\n  ${missing.join("\n  ")}`);
        process.exit(1);
    }

    const written = [];
    const urls = [{ loc: `${ORIGIN}/`, priority: "1.0", changefreq: "weekly" }];

    const allTitles = Object.fromEntries(GUIDES.map((g) => [g.slug, g.h1]));

    for (const guide of GUIDES) {
        if (!presets[guide.preset]) throw new Error(`Guide "${guide.slug}" references unknown preset "${guide.preset}"`);
        written.push(write(`${guide.slug}/index.html`, renderGuide(guide, presets, allTitles)));
        urls.push({ loc: `${ORIGIN}/${guide.slug}/`, priority: "0.9", changefreq: "monthly" });
    }

    written.push(write("gradients/index.html", renderHub(presets, PRESET_META)));
    urls.push({ loc: `${ORIGIN}/gradients/`, priority: "0.9", changefreq: "monthly" });

    const entries = Object.entries(presets);
    entries.forEach(([name, cfg], i) => {
        const meta = PRESET_META[name];
        if (!meta) throw new Error(`Preset "${name}" has no entry in scripts/seo/presets-meta.mjs`);
        // Six neighbours, wrapping, so every preset page links onward to different siblings.
        const neighbours = Array.from({ length: 6 }, (_, k) => entries[(i + k + 1) % entries.length]);
        const { slug, html } = renderPreset(name, cfg, meta, presets, neighbours);
        written.push(write(`gradients/${slug}/index.html`, html));
        urls.push({ loc: `${ORIGIN}/gradients/${slug}/`, priority: "0.7", changefreq: "monthly" });
    });

    const today = new Date().toISOString().slice(0, 10);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
        (u) =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n")}
</urlset>
`;
    write("sitemap.xml", sitemap);

    validateInternalLinks(written);
    warnOnLongDescriptions();

    console.log(`[seo] ${written.length} pages + sitemap.xml (${urls.length} urls)`);
    console.log(`[seo]   ${GUIDES.length} guides, 1 hub, ${presetNames.length} presets`);
}

main().catch((e) => {
    console.error("[seo] failed:", e);
    process.exit(1);
});
