/**
 * Generates the static landing pages that sit alongside the editor.
 *
 * The editor is a single client-rendered URL, which means every search query it
 * ranks for lands on the same page with no indexable copy behind it. These pages
 * are plain HTML — real content, served as-is, no JavaScript required to read
 * them — each with a live Neat canvas so the page demonstrates the thing it
 * describes rather than just claiming it exists.
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

/**
 * A gallery card showing a real captured frame.
 *
 * These used to be a CSS linear-gradient built from the palette, which turned a
 * displaced, lit, grain-textured surface into a two-stop ramp — it undersold the
 * product badly. scripts/capture-previews.mjs renders the actual engine instead.
 */
function presetCard(name) {
    const slug = slugify(name);
    const tagline = (PRESET_META_REF[name] && PRESET_META_REF[name].tagline) || "";
    return `  <li><a class="card" href="/gradients/${slug}/">
    <img class="sw" src="/gradient-previews/${slug}.webp" width="560" height="294" loading="lazy" decoding="async"
         alt="${esc(name)} gradient — ${esc(tagline.toLowerCase())}" />
    <span class="meta"><span class="nm">${esc(name)}</span><span class="tg">${esc(tagline)}</span></span>
  </a></li>`;
}

/* -------------------------------------------------------------------- layout */

const CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:'Sofia Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#0a0a0a;color:#f2f2f2;line-height:1.65;font-size:17px;-webkit-font-smoothing:antialiased}
#gradient{position:fixed;inset:0;width:100%;height:100%;z-index:0;display:block;
  background:linear-gradient(140deg,#2E0EC7,#4CB4BB,#FF5772)}
.scrim{position:fixed;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,rgba(10,10,10,.46) 0%,rgba(10,10,10,.58) 45%,rgba(10,10,10,.72) 100%)}
.page{position:relative;z-index:2}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}

header.site{padding:28px 0 12px}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{font-weight:700;font-size:22px;letter-spacing:.08em;color:#fff;text-decoration:none}
nav.site a{color:rgba(255,255,255,.72);text-decoration:none;font-size:14px;margin-left:20px;white-space:nowrap}
nav.site a:hover{color:#fff;text-decoration:underline}

.hero{padding:56px 0 8px}
h1{font-size:clamp(2.1rem,6vw,3.4rem);line-height:1.08;margin:0 0 20px;font-weight:700;letter-spacing:-.02em}
.intro{font-size:clamp(1.05rem,2.4vw,1.28rem);color:rgba(255,255,255,.86);margin:0 0 32px}
.cta{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#0a0a0a;
  padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:700;font-size:16px}
.cta:hover{transform:translateY(-1px)}
.cta.secondary{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.22)}
.ctas{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px}

main{padding:24px 0 24px}
/* Deliberately no backdrop-filter: blurring a tall element over an animating
   WebGL canvas forces a full-viewport composite every frame and stalls scrolling. */
main .wrap{background:rgba(11,11,13,.93);
  border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:8px 34px 30px;max-width:812px}
h1,.intro{text-shadow:0 2px 18px rgba(0,0,0,.55)}
h2{font-size:clamp(1.45rem,3.6vw,1.9rem);margin:52px 0 16px;font-weight:700;letter-spacing:-.01em}
h3{font-size:1.15rem;margin:32px 0 10px;font-weight:700}
p{margin:0 0 18px;color:rgba(255,255,255,.88)}
ul{margin:0 0 20px;padding-left:22px}
li{margin-bottom:11px;color:rgba(255,255,255,.88)}
a{color:#8fd4ff}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;
  background:rgba(255,255,255,.11);padding:2px 6px;border-radius:4px;word-break:break-word}
pre{background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.14);border-radius:10px;
  padding:18px;overflow-x:auto;margin:0 0 22px;font-size:14px;line-height:1.6}
pre code{background:none;padding:0;font-size:inherit;white-space:pre}

.panel{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.13);
  border-radius:14px;padding:22px 24px;margin:0 0 22px}
.panel h2,.panel h3{margin-top:0}

.swatches{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 24px;padding:0;list-style:none}
.swatches li{margin:0}
.swatch{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 14px 6px 7px;font-size:13px}
.chip{width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.3);flex:none}
.specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:12px;margin:0 0 24px;padding:0;list-style:none}
.specs li{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.13);
  border-radius:10px;padding:12px 14px;margin:0}
.specs .k{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.55)}
.specs .v{display:block;font-size:1.35rem;font-weight:700;margin-top:2px}

.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;
  margin:0 0 32px;padding:0;list-style:none}
.gallery li{margin:0}
.card{display:block;text-decoration:none;color:inherit;border-radius:12px;overflow:hidden;
  border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);height:100%}
.card:hover{border-color:rgba(255,255,255,.36)}
.card .sw{display:block;width:100%;height:132px;object-fit:cover;background:#15151a}
.card .meta{padding:12px 14px}
.card .nm{font-weight:700;font-size:15px;display:block}
.card .tg{font-size:13px;color:rgba(255,255,255,.62);display:block;margin-top:2px}

.faq details{border-top:1px solid rgba(255,255,255,.14);padding:16px 0}
.faq details:last-child{border-bottom:1px solid rgba(255,255,255,.14)}
.faq summary{cursor:pointer;font-weight:700;font-size:1.03rem;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::before{content:"+";display:inline-block;width:20px;color:rgba(255,255,255,.55)}
.faq details[open] summary::before{content:"–"}
.faq details p{margin:12px 0 0 20px}

.related{display:flex;flex-wrap:wrap;gap:10px;padding:0;list-style:none;margin:0 0 8px}
.related a{display:inline-block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);
  border-radius:999px;padding:8px 16px;text-decoration:none;color:#fff;font-size:14px}
.related a:hover{background:rgba(255,255,255,.16)}

.crumbs{font-size:14px;color:rgba(255,255,255,.6);padding:8px 0 0}
.crumbs a{color:rgba(255,255,255,.75);text-decoration:none}
.crumbs a:hover{text-decoration:underline}

footer.site{border-top:1px solid rgba(255,255,255,.14);margin-top:60px;padding:28px 0 56px;
  font-size:14px;color:rgba(255,255,255,.6)}
footer.site a{color:rgba(255,255,255,.78);text-decoration:none}
footer.site a:hover{text-decoration:underline}
footer.site .row{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:10px}

@media (max-width:640px){
  body{font-size:16px}
  .hero{padding:34px 0 4px}
  main .wrap{padding:8px 20px 24px;border-radius:12px}
  nav.site a{margin:0 14px 0 0}
  header.site .wrap{gap:8px}
}
@media (prefers-reduced-motion:reduce){.cta:hover{transform:none}}
`.trim();

function shell({ title, description, canonical, bodyHtml, jsonLd, presetConfig, ogImage }) {
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
<meta name="theme-color" content="#0a0a0a" />
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
<link href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;700&display=swap" rel="stylesheet" />
<style>${CSS}</style>
${jsonLd.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join("\n")}
</head>
<body>
<canvas id="gradient" aria-hidden="true"></canvas>
<div class="scrim" aria-hidden="true"></div>
<div class="page">
<header class="site"><div class="wrap">
  <a class="brand" href="/">NEAT</a>
  <nav class="site" aria-label="Main">
    <a href="/gradient-generator/">Generator</a>
    <a href="/gradients/">Gallery</a>
    <a href="/mesh-gradient-generator/">Mesh</a>
    <a href="/gradient-video-background/">Video</a>
    <a href="/">Open editor</a>
  </nav>
</div></header>
${bodyHtml}
<footer class="site"><div class="wrap">
  <div class="row">
    <a href="/">Editor</a>
    <a href="/gradients/">Preset gallery</a>
    <a href="/gradient-generator/">Gradient generator</a>
    <a href="/animated-gradient-generator/">Animated gradients</a>
    <a href="/mesh-gradient-generator/">Mesh gradients</a>
    <a href="/css-animated-gradient-background/">CSS gradients</a>
    <a href="/gradient-video-background/">Gradient video</a>
    <a href="/animated-3d-background-for-websites/">3D backgrounds</a>
  </div>
  <div class="row">
    <a href="https://github.com/FireCMSco/neat" rel="noopener">GitHub</a>
    <a href="https://www.npmjs.com/package/@firecms/neat" rel="noopener">npm</a>
    <a href="https://firecms.co" rel="noopener">Made by FireCMS</a>
    <a href="mailto:hello@firecms.co">hello@firecms.co</a>
  </div>
  <p style="margin:8px 0 0">Neat renders animated 3D gradients in WebGL. Free to use; MIT + Commons Clause.</p>
</div></footer>
</div>
<script src="/neat.umd.js"></script>
<script>
(function () {
  var cfg = ${JSON.stringify(presetConfig)};
  var el = document.getElementById("gradient");
  if (!el || !window.neat || !window.neat.NeatGradient) return;   // CSS fallback stays visible
  try {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) cfg.speed = 0;
    var g = new window.neat.NeatGradient(Object.assign({ ref: el }, cfg));
    if (!reduce) {
      window.addEventListener("scroll", function () { g.yOffset = window.scrollY * 0.35; }, { passive: true });
    }
  } catch (e) { /* leave the CSS gradient fallback in place */ }
})();
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------ page renderers */

const codeBlock = (c) => `<pre><code>${esc(c.text)}</code></pre>`;

function faqSection(faq) {
    if (!faq || !faq.length) return "";
    return `<h2>Frequently asked questions</h2>
<div class="faq">
${faq.map((f) => `  <details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}
</div>`;
}

function relatedSection(slugs, allTitles) {
    if (!slugs || !slugs.length) return "";
    const links = slugs
        .filter((s) => allTitles[s])
        .map((s) => `  <li><a href="/${s}/">${esc(allTitles[s])}</a></li>`)
        .join("\n");
    if (!links) return "";
    return `<h2>Related</h2>\n<ul class="related">\n${links}\n</ul>`;
}

function renderGuide(guide, presets, allTitles) {
    const cfg = presets[guide.preset];
    const canonical = `${ORIGIN}/${guide.slug}/`;

    const sections = guide.sections
        .map((s) => {
            let out = `<h2>${esc(s.h2)}</h2>\n`;
            if (s.body) out += s.body.map((p) => `<p>${p}</p>`).join("\n") + "\n";
            if (s.list) out += `<ul>\n${s.list.map((li) => `  <li>${li}</li>`).join("\n")}\n</ul>\n`;
            if (s.code) out += codeBlock(s.code) + "\n";
            if (s.after) out += s.after.map((p) => `<p>${p}</p>`).join("\n") + "\n";
            return out;
        })
        .join("\n");

    const bodyHtml = `<div class="wrap crumbs"><a href="/">Neat</a> › ${esc(guide.h1)}</div>
<section class="hero"><div class="wrap">
  <h1>${esc(guide.h1)}</h1>
  <p class="intro">${guide.intro}</p>
  <div class="ctas">
    <a class="cta" href="/?preset=${encodeURIComponent(guide.preset)}">Open the editor</a>
    <a class="cta secondary" href="/gradients/">Browse ${Object.keys(presets).length} presets</a>
  </div>
</div></section>
<main><div class="wrap">
${sections}
${faqSection(guide.faq)}
${relatedSection(guide.related, allTitles)}
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
        presetConfig: cfg,
        ogImage: `${ORIGIN}/gradient-previews/${slugify(guide.preset)}.jpg`,
    });
}

function renderPreset(name, cfg, meta, presets, neighbours) {
    const slug = slugify(name);
    const canonical = `${ORIGIN}/gradients/${slug}/`;
    const colors = enabledColors(cfg);
    const title = `${name} – Animated Gradient Preset | NEAT`;
    const description = `${meta.tagline}. ${colors.length} colours, speed ${cfg.speed}, wave amplitude ${cfg.waveAmplitude}. Open it in the free Neat gradient editor or copy the config.`;

    // JSON.stringify quotes every key; unquote the plain identifiers so the
    // snippet reads like the object someone would actually write.
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

    const swatchList = colors
        .map(
            (c) =>
                `  <li><span class="swatch"><span class="chip" style="background:${esc(c)}"></span><code>${esc(c)}</code></span></li>`
        )
        .join("\n");

    const specs = [
        ["Colours", colors.length],
        ["Speed", cfg.speed],
        ["Wave amplitude", cfg.waveAmplitude],
        ["Saturation", cfg.colorSaturation],
        ["Brightness", cfg.colorBrightness],
        ["Grain", cfg.grainScale ?? 0],
    ]
        .map(
            ([k, v]) =>
                `  <li><span class="k">${esc(k)}</span><span class="v">${esc(
                    typeof v === "number" ? Math.round(v * 100) / 100 : v
                )}</span></li>`
        )
        .join("\n");

    const cards = neighbours.map(([n]) => presetCard(n)).join("\n");

    const bodyHtml = `<div class="wrap crumbs"><a href="/">Neat</a> › <a href="/gradients/">Gradients</a> › ${esc(name)}</div>
<section class="hero"><div class="wrap">
  <h1>${esc(name)} gradient</h1>
  <p class="intro">${esc(meta.tagline)}. The gradient behind this page is this exact preset, running live.</p>
  <div class="ctas">
    <a class="cta" href="/?preset=${encodeURIComponent(name)}">Open in the editor</a>
    <a class="cta secondary" href="/gradients/">All presets</a>
  </div>
</div></section>
<main><div class="wrap">
  <p>${esc(meta.description)}</p>
  <div class="panel"><h3>Good for</h3><p style="margin:0">${esc(meta.useCase)}</p></div>

  <h2>Palette</h2>
  <ul class="swatches">
${swatchList}
  </ul>

  <h2>Parameters</h2>
  <ul class="specs">
${specs}
  </ul>

  <h2>Use this preset</h2>
  <p>Install the package and pass the config straight to the constructor. No build step and no dependencies:</p>
  <pre><code>npm install @firecms/neat</code></pre>
  <pre><code>${esc(configSnippet)}</code></pre>
  <p>Prefer a file? Open it <a href="/?preset=${encodeURIComponent(
      name
  )}">in the editor</a> and export a PNG still or an MP4 loop — see the <a href="/gradient-video-background/">gradient video guide</a>.</p>

  <h2>Other presets</h2>
  <ul class="gallery">
${cards}
  </ul>
  <p><a href="/gradients/">See all ${Object.keys(presets).length} presets →</a></p>
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
            title, description, canonical, bodyHtml, jsonLd, presetConfig: cfg,
            ogImage: `${ORIGIN}/gradient-previews/${slug}.jpg`,
        }),
    };
}

function renderHub(presets, meta) {
    const canonical = `${ORIGIN}/gradients/`;
    const entries = Object.entries(presets);

    const cards = entries.map(([n]) => presetCard(n)).join("\n");

    const bodyHtml = `<div class="wrap crumbs"><a href="/">Neat</a> › Gradients</div>
<section class="hero"><div class="wrap">
  <h1>Gradient gallery</h1>
  <p class="intro">Every built-in Neat preset, with its palette, its parameters and the code to use it. Each one opens in the editor where you can change anything about it.</p>
  <div class="ctas">
    <a class="cta" href="/">Open the editor</a>
    <a class="cta secondary" href="/gradient-generator/">How the generator works</a>
  </div>
</div></section>
<main><div class="wrap">
  <ul class="gallery">
${cards}
  </ul>

  <h2>Picking a starting point</h2>
  <p>The parameter space is large enough that starting from scratch is rarely productive. Start from whichever preset is closest to the mood you want, then change colours first and motion second — motion is what people notice, and it is the easiest thing to overdo.</p>
  <ul>
    <li><strong>Behind body text?</strong> Fluid, Pastel, Coral, Oil Slick or Dark Mode. Low speed, low amplitude, nothing that competes.</li>
    <li><strong>Dark theme?</strong> Monterey, Night Dunes, Dark Mode or Cosmic Vortex.</li>
    <li><strong>Light theme?</strong> Clouds and Coral are the two that hold up with dark text on them.</li>
    <li><strong>Loud on purpose?</strong> Flame, Lemon, Virus or Blob.</li>
    <li><strong>Classic SaaS?</strong> Stripe, Bloom or FireCMS.</li>
  </ul>

  <h2>Guides</h2>
  <ul class="related">
    <li><a href="/gradient-generator/">Gradient generator</a></li>
    <li><a href="/animated-gradient-generator/">Animated gradient generator</a></li>
    <li><a href="/mesh-gradient-generator/">Mesh gradient generator</a></li>
    <li><a href="/css-animated-gradient-background/">Animated CSS gradient background</a></li>
    <li><a href="/gradient-video-background/">Gradient video generator</a></li>
    <li><a href="/animated-3d-background-for-websites/">Animated 3D backgrounds</a></li>
  </ul>
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

    return shell({
        title: "Gradient Gallery – 25 Free Animated Gradient Presets | NEAT",
        description:
            "Browse 25 free animated gradient presets with palettes, parameters and copy-paste code. Open any of them in the free Neat gradient editor.",
        canonical,
        bodyHtml,
        jsonLd,
        presetConfig: presets["Neat"],
        ogImage: `${ORIGIN}/gradient-previews/neat.jpg`,
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
