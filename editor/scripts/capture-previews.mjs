/**
 * Renders every built-in preset with the real WebGL engine and saves the frames
 * as image assets.
 *
 * The gallery used to fake these with a CSS linear-gradient built from the
 * palette, which made a displaced, lit, grain-textured 3D surface look like a
 * two-stop ramp. These are actual frames instead.
 *
 * Output (committed, so `npm run build` needs no browser):
 *   public/gradient-previews/<slug>.webp  — 560x294, gallery cards
 *   public/gradient-previews/<slug>.jpg   — 1200x630, per-page OG image
 *
 * Run manually after changing presets:  npm run previews
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public/gradient-previews");
const UMD = path.resolve(ROOT, "../lib/dist/index.umd.js");

const OG_W = Number(process.env.CAP_W ?? 1200), OG_H = Number(process.env.CAP_H ?? 630);
const CARD_W = 560, CARD_H = 294;
// A single fixed capture time picks bad frames: the surface drifts, so one
// preset looks best early and another only once it has developed. Sample a few
// moments and keep the strongest frame instead of hand-tuning 25 timings.
const SAMPLE_MS = [800, 1700, 2900, 4300];
// Some presets drift slowly enough that none of the first four frames has the
// surface filling the frame. Keep looking, but only for those.
const EXTRA_MS = [6000, 8200, 10500, 13000, 16000, 20000];
const WEAK_SCORE = 0.45;

const require = createRequire(import.meta.url);

async function loadPresets() {
    const ts = require("typescript");
    const src = fs
        .readFileSync(path.join(ROOT, "src/components/presets.ts"), "utf8")
        .replace(/^import[^\n]*\n/gm, "");
    const js = ts.transpileModule(src, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
    }).outputText;
    const tmp = path.join(os.tmpdir(), `neat-presets-${process.pid}.mjs`);
    fs.writeFileSync(tmp, js);
    try {
        return (await import("file://" + tmp)).PRESETS;
    } finally {
        fs.rmSync(tmp, { force: true });
    }
}


/** Contrast spread + saturation. Used only to compare frames of the same preset. */
function frameScore(file) {
    const out = execFileSync("magick", [
        file, "-resize", "160x", "-format",
        "%[fx:standard_deviation] %[fx:maxima-minima]", "info:",
    ]).toString().trim().split(/\s+/).map(Number);
    const sat = Number(
        execFileSync("magick", [file, "-resize", "160x", "-colorspace", "HSL",
            "-channel", "G", "-separate", "-format", "%[fx:mean]", "info:"]).toString().trim()
    );
    const [stddev, range] = out;
    return stddev + 0.35 * sat + 0.15 * range;
}

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
    if (!fs.existsSync(UMD)) {
        console.error("[previews] ../lib/dist/index.umd.js missing — run `npm run build` in ../lib");
        process.exit(1);
    }

    const { chromium } = await import("playwright");
    const presets = await loadPresets();
    fs.mkdirSync(OUT, { recursive: true });

    // Playwright's cached chromium can be a version behind the installed package;
    // the system Chrome is already here and renders WebGL properly. Launched with
    // a throwaway profile, so it never touches the user's Chrome data.
    const SYSTEM_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const browser = await chromium.launch({
        ...(fs.existsSync(SYSTEM_CHROME) ? { executablePath: SYSTEM_CHROME } : {}),
        // Real GPU, not SwiftShader. The software path renders several presets
        // (Funky, anything with a very low resolution value) as a flat fill.
        args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"],
    });
    const page = await browser.newPage({ viewport: { width: OG_W, height: OG_H } });
    page.on("pageerror", (e) => console.error("[previews] page error:", e.message));

    await page.setContent(
        `<!DOCTYPE html><html><body style="margin:0;background:#000">
         <canvas id="c" style="width:${OG_W}px;height:${OG_H}px;display:block"></canvas>
         </body></html>`
    );
    await page.addScriptTag({ path: UMD });

    const ok = await page.evaluate(() => {
        const gl = document.getElementById("c").getContext("webgl2") || document.getElementById("c").getContext("webgl");
        return !!gl && !!window.neat?.NeatGradient;
    });
    if (!ok) {
        console.error("[previews] no WebGL context in headless chromium — aborting");
        await browser.close();
        process.exit(1);
    }

    const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
    const names = Object.keys(presets).filter((n) => !only || only.includes(n));
    for (const [i, name] of names.entries()) {
        const slug = slugify(name);

        await page.evaluate((cfg) => {
            window.__g?.destroy?.();
            const g = new window.neat.NeatGradient({ ref: document.getElementById("c"), ...cfg });
            // First-party capture of our own product for our own site: suppress the
            // watermark that would otherwise be baked into every marketing image.
            g._licensed = true;
            window.__g = g;
        }, presets[name]);

        // Sample candidate frames and score each one. Contrast spread plus
        // saturation is a decent proxy for "the surface actually fills the frame
        // and is doing something", which is what a bad frame lacks.
        let best = null;
        let prev = 0;
        const sampleAt = async (times) => {
        for (const t of times) {
            await page.waitForTimeout(t - prev);
            prev = t;
            const cand = path.join(OUT, `${slug}.cand.png`);
            await page.locator("#c").screenshot({ path: cand });
            const score = frameScore(cand);
            if (!best || score > best.score) {
                fs.rmSync(best?.file ?? "", { force: true });
                best = { file: path.join(OUT, `${slug}.best.png`), score };
                fs.renameSync(cand, best.file);
            } else {
                fs.rmSync(cand);
            }
        }
        };
        await sampleAt(SAMPLE_MS);
        if (best.score < WEAK_SCORE) await sampleAt(EXTRA_MS);

        const png = best.file;
        execFileSync("magick", [png, "-resize", `${CARD_W}x${CARD_H}!`, "-quality", "84", path.join(OUT, `${slug}.webp`)]);
        execFileSync("magick", [png, "-quality", "78", "-sampling-factor", "4:2:0", "-interlace", "Plane",
                                "-strip", path.join(OUT, `${slug}.jpg`)]);
        fs.rmSync(png);

        const kb = (f) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
        console.log(`[previews] ${String(i + 1).padStart(2)}/${names.length}  ${name.padEnd(15)} score ${best.score.toFixed(3)}  webp ${kb(slug + ".webp")}KB  jpg ${kb(slug + ".jpg")}KB`);
    }

    await browser.close();
    console.log(`[previews] wrote ${names.length * 2} files to public/gradient-previews/`);
}

main().catch((e) => {
    console.error("[previews] failed:", e);
    process.exit(1);
});
