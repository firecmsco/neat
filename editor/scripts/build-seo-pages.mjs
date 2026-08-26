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

/**
 * The parameters that actually shape a preset's look.
 *
 * A full Neat config carries around sixty keys — texture, flow, prism, domain
 * warp, camera — and dumping all of them buries the handful anyone reads. The
 * rest sit at their defaults and stay available under the disclosure.
 */
const SHAPING_KEYS = [
    "colors", "speed", "horizontalPressure", "verticalPressure",
    "waveFrequencyX", "waveFrequencyY", "waveAmplitude",
    "shadows", "highlights", "colorBrightness", "colorSaturation",
    "wireframe", "colorBlending", "backgroundColor", "backgroundAlpha",
    "resolution", "grainScale", "grainSparsity", "grainIntensity", "grainSpeed",
];

/** Renders a config the way someone would write it by hand. */
function formatConfig(cfg, keys) {
    const wanted = keys ? keys.filter((k) => cfg[k] !== undefined) : Object.keys(cfg);
    const lines = wanted.map((k) => {
        const v = cfg[k];
        if (k === "colors") {
            const list = keys ? v.filter((c) => c.enabled) : v;
            return "  colors: [\n" +
                list.map((c) => `    { color: "${c.color}", enabled: ${c.enabled} },`).join("\n") +
                "\n  ],";
        }
        return `  ${k}: ${typeof v === "string" ? `"${v}"` : round(v)},`;
    });
    return lines.join("\n").replace(/,$/, "");
}

/* -------------------------------------------------------------------- layout */

const CSS = String.raw`
/* Same shape as the dataki landing page: the body is solid black, the gradient
   canvas is absolutely positioned inside the hero section only, and everything
   below is plain content on black. No fixed canvas, no page-wide fade. */
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}

:root{
  --bg:#000;
  --raised:rgba(255,255,255,.04);
  --hair:rgba(255,255,255,.1);
  --hair-2:rgba(255,255,255,.22);
  --fg:#fff;
  --fg-2:rgba(255,255,255,.68);
  --fg-3:rgba(255,255,255,.45);
  --r-md:.75rem;
  --r-sm:.375rem;
  --gutter:clamp(1.25rem,5vw,2.5rem);
  --col:68rem;
  --sans:'Sofia Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
}

body{margin:0;font-family:var(--sans);background:var(--bg);color:var(--fg-2);
  font-size:1.1875rem;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:var(--col);margin:0 auto;padding:0 var(--gutter)}

/* ---------------------------------------------------------------- nav pill */
.rail{position:fixed;top:1.25rem;left:50%;transform:translateX(-50%);z-index:30;
  display:flex;align-items:center;gap:.35rem;max-width:calc(100% - 1.5rem);
  background:rgba(0,0,0,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.12);border-radius:9999px;padding:.3rem .4rem}
.mark{font-weight:700;font-size:.95rem;letter-spacing:.14em;color:#fff;
  text-decoration:none;padding:.35rem .8rem;white-space:nowrap}
.rail nav{display:flex;gap:.1rem;overflow-x:auto;scrollbar-width:none}
.rail nav::-webkit-scrollbar{display:none}
.rail nav a{font-size:.75rem;font-weight:500;color:rgba(255,255,255,.62);
  text-decoration:none;white-space:nowrap;padding:.42rem .75rem;border-radius:9999px;
  transition:background .2s,color .2s}
.rail nav a:hover,.rail nav a:focus-visible{background:rgba(255,255,255,.12);color:#fff}

/* -------------------------------------------------------------------- hero */
/* The canvas lives inside this section and scrolls away with it. */
.hero{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:flex-end;
  min-height:min(80vh,46rem);padding:7rem 0 clamp(3rem,7vh,5rem)}

/* Full strength — the gradient is the product, so it is never dimmed as a whole. */
.hero canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;
  background:linear-gradient(140deg,#2E0EC7,#4CB4BB,#FF5772)}

/* Darkening is confined to the band the type sits in: the top half stays clean,
   the bottom resolves into the page. Many stops rather than two, because a long
   two-stop ramp bands badly at 8 bits. */
.hero::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(to top,
    #000 0%,rgba(0,0,0,.96) 14%,rgba(0,0,0,.88) 26%,rgba(0,0,0,.76) 38%,
    rgba(0,0,0,.6) 50%,rgba(0,0,0,.42) 61%,rgba(0,0,0,.26) 71%,
    rgba(0,0,0,.14) 80%,rgba(0,0,0,.06) 88%,transparent 96%)}

/* A dither pass over the whole hero. Eight-bit alpha ramps step visibly across a
   viewport-sized fade; a little noise breaks the bands up. */
.hero::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:140px 140px}
/* A flex item shrink-wraps to its content, so max-width + auto margins would
   centre a narrower box than the container below. Fill first, then cap. */
.hero .wrap{position:relative;z-index:3;width:100%}

.crumbs{margin:0 0 1.1rem;font-size:.8rem;color:var(--fg-3)}
.crumbs a{color:var(--fg-3);text-decoration:none}
.crumbs a:hover{color:#fff}
.crumbs span{margin:0 .45em;opacity:.6}

h1{font-weight:700;font-size:clamp(2.5rem,6.5vw,4.5rem);line-height:1.04;
  letter-spacing:-.03em;margin:0;color:#fff;text-wrap:balance}
.deck{margin:1.3rem 0 0;font-size:clamp(1.12rem,1.5vw,1.3rem);color:var(--fg-2);
  line-height:1.55}
.actions{display:flex;flex-wrap:wrap;gap:.65rem;margin:2rem 0 0}

.btn{display:inline-flex;align-items:center;justify-content:center;font-weight:500;
  font-size:.9375rem;text-decoration:none;height:2.75rem;padding:0 1.35rem;
  border-radius:var(--r-sm);background:#fff;color:#000;border:1px solid transparent;
  transition:background .2s,border-color .2s}
.btn:hover,.btn:focus-visible{background:rgba(255,255,255,.86)}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
.btn.ghost:hover,.btn.ghost:focus-visible{background:rgba(255,255,255,.1);
  border-color:rgba(255,255,255,.5)}

/* ----------------------------------------------------------------- content */
.sheet{padding:clamp(1rem,3vh,2rem) 0 clamp(3rem,7vh,5rem)}
.panel{margin:0 0 clamp(3rem,6vh,4.5rem)}
.panel:last-child{margin-bottom:0}

h2{font-weight:700;font-size:clamp(1.7rem,3vw,2.3rem);line-height:1.16;color:#fff;
  letter-spacing:-.022em;margin:0 0 1.15rem;text-wrap:balance}
h3{font-weight:600;font-size:1.1rem;color:#fff;margin:2rem 0 .6rem}
p{margin:0 0 1.15rem}
ul{margin:0 0 1.25rem;padding-left:1.2rem}
li{margin-bottom:.7rem}
li::marker{color:rgba(255,255,255,.3)}
strong{color:#fff;font-weight:600}
a{color:#fff;text-decoration:underline;text-underline-offset:.18em;
  text-decoration-color:rgba(255,255,255,.32)}
a:hover{text-decoration-color:#fff}

code{font-family:var(--mono);font-size:.86em;background:rgba(255,255,255,.08);
  border-radius:.25rem;padding:.14em .4em;word-break:break-word;color:#fff}
pre{background:var(--raised);border:1px solid var(--hair);border-radius:var(--r-md);
  padding:1.25rem 1.4rem;overflow-x:auto;margin:0 0 1.25rem;font-size:.8125rem;
  line-height:1.7;color:rgba(255,255,255,.9)}
pre code{background:none;padding:0;font-size:inherit;white-space:pre;color:inherit}

.note{border-left:1px solid var(--hair-2);padding:.15rem 0 .15rem 1.15rem;margin:1.5rem 0}
.note h3{margin:0 0 .3rem;font-size:.78rem;font-weight:600;letter-spacing:.09em;
  text-transform:uppercase;color:var(--fg-3)}
.note p{margin:0}

/* ----------------------------------------------------------------- palette */
.chips{display:flex;flex-wrap:wrap;gap:.85rem;margin:0 0 1.75rem;padding:0;list-style:none;
  max-width:none}
.chips li{margin:0}
.swatch{display:block;width:4.5rem;height:4.5rem;border-radius:var(--r-md);
  border:1px solid var(--hair-2)}
.chips code{display:block;margin-top:.5rem;background:none;padding:0;font-size:.68rem;
  color:var(--fg-3);text-align:center}

/* -------------------------------------------------------------------- spec */
table.spec{width:100%;max-width:32rem;border-collapse:collapse;margin:0}
table.spec th,table.spec td{padding:.7rem .25rem;border-bottom:1px solid var(--hair)}
table.spec tr:last-child th,table.spec tr:last-child td{border-bottom:none}
table.spec th{text-align:left;font-weight:400;font-size:.95rem;color:var(--fg-3)}
table.spec td{text-align:right;font-family:var(--mono);font-size:.95rem;
  font-variant-numeric:tabular-nums;color:#fff}

/* ----------------------------------------------------------------- fandeck */
.fandeck{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));
  gap:1.1rem;padding:0;margin:0;list-style:none;max-width:none}
.chip a{display:block;text-decoration:none;color:inherit;border-radius:var(--r-md);
  overflow:hidden;background:var(--raised);border:1px solid var(--hair);
  transition:transform .28s cubic-bezier(.2,.7,.3,1),border-color .28s}
.chip a:hover,.chip a:focus-visible{transform:translateY(-4px);border-color:var(--hair-2)}
.chip img{display:block;width:100%;height:auto;aspect-ratio:560/294;object-fit:cover;
  background:rgba(255,255,255,.04)}
.chip-label{display:block;padding:.7rem .85rem .8rem}
.chip-name{display:block;font-weight:600;font-size:.95rem;color:#fff}
.chip-form{display:block;font-family:var(--mono);font-size:.62rem;color:var(--fg-3);
  margin-top:.2rem}

/* -------------------------------------------------------------- held card */
.deckwrap{display:grid;grid-template-columns:minmax(0,17rem) minmax(0,1fr);
  gap:clamp(1.5rem,3vw,2.5rem);align-items:start}
.held{position:sticky;top:5.5rem;background:var(--raised);border:1px solid var(--hair);
  border-radius:var(--r-md);padding:1rem}
.held-stage{position:relative;aspect-ratio:560/294;border-radius:.5rem;overflow:hidden;
  background:rgba(255,255,255,.04);margin:0 0 1rem}
.held-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.held-meta h2{font-size:1.45rem;margin:0 0 .25rem;max-width:none}
.viewer-tag{margin:0 0 1.15rem;font-size:.92rem;min-height:3em}
.held-meta .btn{width:100%;margin-top:1.15rem}
.viewer-hint{font-size:.72rem;color:var(--fg-3);margin:0 0 .55rem}
@media (hover:none){.viewer-hint{display:none}}

/* --------------------------------------------------------------------- faq */
.faq details{border-bottom:1px solid var(--hair)}
.faq details:first-of-type{border-top:1px solid var(--hair)}
.faq summary{cursor:pointer;list-style:none;padding:1.15rem 2.25rem 1.15rem 0;
  position:relative;font-weight:600;font-size:1.05rem;color:#fff}
.faq summary::-webkit-details-marker{display:none}
.faq summary::before,.faq summary::after{content:"";position:absolute;right:.35rem;top:50%;
  width:.75rem;height:1px;background:rgba(255,255,255,.55);
  transition:transform .22s cubic-bezier(.2,.7,.3,1)}
.faq summary::after{transform:rotate(90deg)}
.faq details[open] summary::after{transform:rotate(0)}
.faq details p{margin:0 0 1.25rem;font-size:1rem}

/* ------------------------------------------------------------------ onward */
.onward{display:flex;flex-wrap:wrap;gap:.55rem;padding:0;margin:0;list-style:none;
  max-width:none}
.onward li{margin:0}
.onward a{display:inline-block;font-size:.9rem;font-weight:500;text-decoration:none;
  padding:.55rem 1rem;border-radius:9999px;border:1px solid rgba(255,255,255,.2);
  color:#fff;transition:background .2s,border-color .2s}
.onward a:hover,.onward a:focus-visible{background:rgba(255,255,255,.1);
  border-color:rgba(255,255,255,.45)}

/* --------------------------------------------------------------- colophon */
.colophon{border-top:1px solid var(--hair);margin-top:clamp(2rem,5vh,3.5rem);
  padding:2.75rem 0 3rem}
.colophon-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));
  gap:1.75rem;padding-bottom:2.25rem;border-bottom:1px solid var(--hair)}
.colophon h2{font-size:.72rem;font-weight:600;letter-spacing:.11em;text-transform:uppercase;
  color:var(--fg-3);margin:0 0 .7rem;max-width:none}
.colophon ul{list-style:none;padding:0;margin:0;max-width:none}
.colophon li{margin-bottom:.45rem}
.colophon a{color:var(--fg-2);text-decoration:none;font-size:.9rem}
.colophon a:hover{color:#fff}
.colophon-note{margin:1.6rem 0 0;font-size:.78rem;color:var(--fg-3);line-height:1.65}

:where(a,button,summary,[tabindex]):focus-visible{outline:2px solid rgba(255,255,255,.65);
  outline-offset:2px}

@media (max-width:860px){
  .deckwrap{grid-template-columns:1fr}
  .held{position:static}
  .viewer-tag{min-height:0}
}
@media (max-width:640px){
  body{font-size:1.0625rem;line-height:1.6}
  .rail{top:.65rem}
  .mark{font-size:.85rem;padding:.3rem .6rem}
  .rail nav a[data-optional]{display:none}
  .hero{min-height:min(72vh,34rem);padding:5.5rem 0 2.5rem}
  .fandeck{grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:.85rem}
  .swatch{width:3.5rem;height:3.5rem}
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
THESIS: These pages are the editor with room to read. Same full-bleed gradient,
  same floating translucent panels; refuses both the dark-hero-plus-card-grid
  every gradient tool ships and the scrimmed wallpaper that dims the product to
  make room for text.
OWN-WORLD: The editor's own language, taken from its source: a fixed full-bleed
  WebGL gradient with rounded translucent panels over it (rgba(23,23,23,.82),
  1px white/10 hairline, 1rem radius, backdrop blur), white rounded-md buttons,
  a floating pill nav, Sofia Sans throughout, mono only for hex, values and code.
STORY: A designer arrives from search, sees the gradient running full-bleed,
  reads what they came for on panels floating over it, and leaves knowing this is
  the same tool as the editor.
FIRST VIEWPORT: Full-bleed live gradient at 100% intensity, a floating pill nav
  centred at the top, and one translucent panel at lower left carrying the
  heading, deck and both actions.
FORM: Specimen/fandeck structure rendered in the editor's language; candidate 3
  of the grounded list; seed f8477209.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

function shell({ title, description, canonical, bodyHtml, jsonLd, ogImage, script, bodyClass }) {
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
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
${CONTRACT}
<header class="rail">
  <a class="mark" href="/">NEAT</a>
  <nav aria-label="Main">
${NAV.map(([href, label, optional]) => `    <a href="${href}"${optional ? " data-optional" : ""}>${label}</a>`).join("\n")}
  </nav>
</header>
${bodyHtml}
<footer class="colophon"><div class="wrap">
  <div class="colophon-in">
    <div>
      <h2>Explore</h2>
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
</div></footer>
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

function hero({ crumbs, h1, deck, actions }) {
    return `<section class="hero">
  <canvas id="gradient" aria-hidden="true"></canvas>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
    <h1>${esc(h1)}</h1>
    <p class="deck">${deck}</p>
    <p class="actions">${actions}</p>
  </div>
</section>`;
}

function faqSection(faq) {
    if (!faq || !faq.length) return "";
    return `<section class="panel">
  <h2>Questions</h2>
  <div class="faq">
${faq.map((f) => `    <details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}
  </div>
</section>`;
}

function onwardSection(slugs, allTitles) {
    if (!slugs || !slugs.length) return "";
    const links = slugs
        .filter((s) => allTitles[s])
        .map((s) => `    <li><a href="/${s}/">${esc(allTitles[s])}</a></li>`)
        .join("\n");
    if (!links) return "";
    return `<section class="panel">
  <h2>Keep reading</h2>
  <ul class="onward">
${links}
  </ul>
</section>`;
}

function renderGuide(guide, presets, allTitles) {
    const cfg = presets[guide.preset];
    const canonical = `${ORIGIN}/${guide.slug}/`;

    const sections = guide.sections
        .map((s) => {
            let out = `<section class="panel">\n  <h2>${esc(s.h2)}</h2>\n`;
            if (s.body) out += s.body.map((p) => `  <p>${p}</p>`).join("\n") + "\n";
            if (s.list) out += `  <ul>\n${s.list.map((li) => `    <li>${li}</li>`).join("\n")}\n  </ul>\n`;
            if (s.code) out += "  " + codeBlock(s.code) + "\n";
            if (s.after) out += s.after.map((p) => `  <p>${p}</p>`).join("\n") + "\n";
            return out + `</section>`;
        })
        .join("\n");

    const bodyHtml = `${hero({
        crumbs: `<a href="/">Neat</a><span>/</span>${esc(guide.h1)}`,
        h1: guide.h1,
        deck: guide.intro,
        actions: `<a class="btn" href="/?preset=${encodeURIComponent(guide.preset)}">Open the editor</a>
      <a class="btn ghost" href="/gradients/">${Object.keys(presets).length} presets</a>`,
    })}
<main class="sheet"><div class="wrap">
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

    const configSnippet = `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
${formatConfig(cfg, SHAPING_KEYS)}
});`;

    const fullConfigSnippet = `new NeatGradient({
  ref: document.getElementById("gradient"),
${formatConfig(cfg)}
});`;

    const swatches = colors
        .map((c) => `    <li><span class="swatch" style="background:${esc(c)}"></span><code>${esc(c)}</code></li>`)
        .join("\n");

    const bodyHtml = `${hero({
        crumbs: `<a href="/">Neat</a><span>/</span><a href="/gradients/">Gradients</a><span>/</span>${esc(name)}`,
        h1: name,
        deck: `${esc(meta.tagline)}. The gradient behind this page is this exact preset, running live.`,
        actions: `<a class="btn" href="/?preset=${encodeURIComponent(name)}">Open in the editor</a>
      <a class="btn ghost" href="/gradients/">All presets</a>`,
    })}
<main class="sheet"><div class="wrap">
  <section class="panel">
    <h2>What it is</h2>
    <p>${esc(meta.description)}</p>
    <div class="note"><h3>Good for</h3><p>${esc(meta.useCase)}</p></div>
  </section>

  <section class="panel">
    <h2>Formula</h2>
    <ul class="chips">
${swatches}
    </ul>
    ${specTable(cfg, colors.length)}
  </section>

  <section class="panel">
    <h2>Use this preset</h2>
    <p>Install the package and pass the config straight to the constructor. These are the values that shape this preset; everything else stays at its default.</p>
    <pre><code>npm install @firecms/neat</code></pre>
    <pre><code>${esc(configSnippet)}</code></pre>
    <div class="faq">
      <details>
        <summary>Every value, for an exact match</summary>
        <pre><code>${esc(fullConfigSnippet)}</code></pre>
      </details>
    </div>
    <p>Prefer a file? Open it <a href="/?preset=${encodeURIComponent(
        name
    )}">in the editor</a> and export a PNG still or an MP4 loop &mdash; see the <a href="/gradient-video-background/">gradient video guide</a>.</p>
  </section>

  <section class="panel">
    <h2>More presets</h2>
    <ul class="fandeck">
${neighbours.map(([n, c], i) => presetChip(n, c, i)).join("\n")}
    </ul>
    <p style="margin:1.25rem 0 0"><a href="/gradients/">See all ${Object.keys(presets).length} presets</a></p>
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

    const bodyHtml = `<section class="hero">
  <canvas id="gradient" aria-hidden="true"></canvas>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Neat</a><span>/</span>Gradients</nav>
    <h1>Gradient gallery</h1>
    <p class="deck">Every built-in Neat preset, rendered by the real engine. Hover one to preview it running live, then take its palette, its parameters and the code to use it.</p>
    <p class="actions">
      <a class="btn" href="/">Open the editor</a>
      <a class="btn ghost" href="/gradient-generator/">How the generator works</a>
    </p>
  </div>
</section>
<main class="sheet"><div class="wrap">
  <section class="panel">
    <div class="deckwrap">
      <div class="held">
        <div class="held-stage"><canvas id="heldCanvas" role="img"
             aria-label="Live preview of the ${esc(first)} gradient"></canvas></div>
        <div class="held-meta">
          <p class="viewer-hint">Hover a preset to preview it</p>
          <h2 id="heldName">${esc(first)}</h2>
          <p class="viewer-tag" id="heldTag">${esc((meta[first] && meta[first].tagline) || "")}</p>
          <table class="spec"><tbody id="heldSpec"></tbody></table>
          <a class="btn" id="heldOpen" href="/gradients/${slugify(first)}/">Open this preset</a>
        </div>
      </div>

      <div class="deckcol">
        <ul class="fandeck">
${entries.map(([n, c], i) => presetChip(n, c, i)).join("\n")}
        </ul>
      </div>
    </div>
  </section>

  <section class="panel">
    <h2>Picking a starting point</h2>
    <p>The parameter space is large enough that starting from scratch is rarely productive. Start from whichever preset is closest to the mood you want, then change colours first and motion second &mdash; motion is what people notice, and it is the easiest thing to overdo.</p>
    <ul>
      <li><strong>Behind body text?</strong> Fluid, Pastel, Coral, Oil Slick or Dark Mode. Low speed, low amplitude, nothing that competes.</li>
      <li><strong>Dark theme?</strong> Monterey, Night Dunes, Dark Mode or Cosmic Vortex.</li>
      <li><strong>Light theme?</strong> Clouds and Coral are the two that hold up with dark text on them.</li>
      <li><strong>Loud on purpose?</strong> Flame, Lemon, Virus or Blob.</li>
      <li><strong>Classic SaaS?</strong> Stripe, Bloom or FireCMS.</li>
    </ul>
  </section>

  <section class="panel">
    <h2>Guides</h2>
    <ul class="onward">
      <li><a href="/gradient-generator/">Gradient generator</a></li>
      <li><a href="/animated-gradient-generator/">Animated gradients</a></li>
      <li><a href="/mesh-gradient-generator/">Mesh gradients</a></li>
      <li><a href="/css-animated-gradient-background/">CSS gradients</a></li>
      <li><a href="/gradient-video-background/">Gradient video</a></li>
      <li><a href="/animated-3d-background-for-websites/">3D backgrounds</a></li>
    </ul>
  </section>
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
  var nameEl = document.getElementById("heldName");
  var tagEl = document.getElementById("heldTag");
  var specEl = document.getElementById("heldSpec");
  var openEl = document.getElementById("heldOpen");
  var canvas = document.getElementById("heldCanvas");
  if (!canvas || !window.neat || !window.neat.NeatGradient) return;

  // The hero runs its own instance and never changes; only the card follows hover.
  var heroEl = document.getElementById("gradient");
  if (heroEl) {
    try {
      var heroCfg = Object.assign({}, DATA[${JSON.stringify(first)}].cfg);
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) heroCfg.speed = 0;
      new window.neat.NeatGradient(Object.assign({ ref: heroEl }, heroCfg));
    } catch (e) {}
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null, gradient = null, timer = null;

  function apply(name) {
    var d = DATA[name];
    if (!d || name === current) return;
    current = name;

    nameEl.textContent = name;
    tagEl.textContent = d.tag;
    openEl.setAttribute("href", "/gradients/" + d.slug + "/");
    openEl.setAttribute("aria-label", "Open the " + name + " preset");
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
        bodyClass: "gallery",
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
