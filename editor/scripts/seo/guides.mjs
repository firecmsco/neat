// Content for the standalone guide pages.
//
// Each of these exists because Search Console shows real, repeated demand that
// the single-page editor cannot answer on its own. Keep them honest: where Neat
// is the wrong tool for the query, the page says so and gives the reader what
// they actually came for.

export const GUIDES = [
    {
        slug: "gradient-generator",
        preset: "Neat",
        title: "Gradient Generator – Free Animated Gradient Backgrounds",
        metaDescription:
            "A free gradient generator for animated, GPU-rendered gradient backgrounds. Pick a palette, tune the waves, then export to code, PNG or MP4.",
        h1: "Gradient generator",
        intro:
            "Neat is a free gradient generator that renders in WebGL rather than CSS. You pick colours, adjust how they move, and export either a config object you drop into a site or a flat PNG or MP4 file. Everything runs in the browser — nothing is uploaded, and there is no account.",
        sections: [
            {
                h2: "What this generator makes",
                body: [
                    "Most gradient generators output a CSS <code>linear-gradient()</code> or <code>radial-gradient()</code> string: two or three colour stops along a straight axis, rendered once and then static. That is the right tool for a button fill or a card background, and if that is what you are after, a CSS generator will serve you better than this one.",
                    "Neat does something different. It renders a subdivided plane on the GPU, displaces it with Perlin noise to create waves, and blends up to six colours across the resulting surface in a fragment shader. The output is a moving surface with visible depth, running at 60fps, that you place behind your page as a single <code>&lt;canvas&gt;</code>.",
                ],
            },
            {
                h2: "Using it",
                body: [
                    "Open the editor and you land on a live gradient. The controls on the right change it in real time — there is no render step and no preview button. The parameters worth knowing:",
                ],
                list: [
                    "<strong>Colours</strong> — up to six, each individually toggleable. Adding a near-black or pure white to an otherwise mid-tone palette is what produces highlights and shadow, because the shader treats them as luminance rather than just another hue.",
                    "<strong>Wave amplitude</strong> — how far the plane is displaced. At 0 you get a flat colour field; at 10 the surface folds over itself.",
                    "<strong>Speed</strong> — how fast the noise field advances. Below 1 the movement stops reading as animation and starts reading as texture.",
                    "<strong>Saturation and brightness</strong> — applied after blending, so they affect the whole composition rather than individual stops. Negative saturation is how you get the muted, print-like presets.",
                    "<strong>Grain</strong> — a procedural noise pass on top. Its main practical use is breaking up colour banding across large dark areas.",
                ],
            },
            {
                h2: "Exporting",
                body: [
                    "Three routes out, depending on what you need:",
                ],
                list: [
                    "<strong>Config object</strong> — a plain JavaScript object you pass to the <code>@firecms/neat</code> package. This keeps the gradient live and animated on your site.",
                    "<strong>PNG</strong> — a still frame at your current canvas size, for when you need a flat image.",
                    "<strong>MP4 or WebM</strong> — a recorded loop, for video editors, presentations, or as a <code>&lt;video&gt;</code> poster where you would rather not ship WebGL.",
                ],
                code: {
                    lang: "bash",
                    text: "npm install @firecms/neat",
                },
            },
            {
                h2: "Putting it on a page",
                body: [
                    "The exported config goes straight into the constructor. One canvas, one object, no build step required:",
                ],
                code: {
                    lang: "html",
                    text: `<canvas id="gradient" style="position:fixed;inset:0;width:100%;height:100%"></canvas>

<script type="module">
  import { NeatGradient } from "@firecms/neat";

  const gradient = new NeatGradient({
    ref: document.getElementById("gradient"),
    // ...paste your exported config here
  });
</script>`,
                },
            },
        ],
        faq: [
            {
                q: "Is this gradient generator free?",
                a: "Yes. The editor and the npm package are free to use. An unobtrusive NEAT watermark is drawn on the canvas unless a licence key is set, which is a one-off €12. PNG and video exports are not watermarked differently from the live canvas.",
            },
            {
                q: "Does it output CSS gradients?",
                a: "No. Neat renders in WebGL, not CSS, so there is no linear-gradient string to copy. If you need a static CSS gradient for a button or card, a dedicated CSS gradient generator is the better tool. If you want the animated look with CSS only, see our guide to animated CSS gradient backgrounds.",
            },
            {
                q: "Will it slow my site down?",
                a: "The package is around 17 KB gzipped with no dependencies, and rendering happens on the GPU rather than the main thread. The practical cost is GPU time on low-end devices; if that matters for your audience, export a PNG or a short MP4 loop instead of shipping the live canvas.",
            },
            {
                q: "Do I need to know WebGL or shader code?",
                a: "No. The editor exposes everything as sliders and colour pickers, and the exported config is a plain object. You never touch the shader unless you want to.",
            },
        ],
        related: ["animated-gradient-generator", "mesh-gradient-generator", "css-animated-gradient-background", "gradient-video-background"],
    },

    {
        slug: "mesh-gradient-generator",
        preset: "Coral",
        title: "Mesh Gradient Generator – Free Animated Mesh Gradients",
        metaDescription:
            "Generate animated mesh gradients in the browser. Blend up to six colours across a displaced 3D surface, then export to code, PNG or MP4. Free, no account.",
        h1: "Mesh gradient generator",
        intro:
            "A mesh gradient blends colours across a surface in two dimensions rather than along a single axis, which is why the results look organic instead of like a colour ramp. Neat generates them on the GPU and animates them, so the mesh drifts rather than sitting still.",
        sections: [
            {
                h2: "What a mesh gradient actually is",
                body: [
                    "In a linear gradient, every colour stop sits on one straight line and the renderer interpolates between neighbours. There is exactly one axis, so the result always reads as a ramp.",
                    "A mesh gradient places colour influence points across a two-dimensional surface and blends between all of them at once. Because each point pulls colour in every direction, the boundaries curve and pool the way ink does in water. That is the whole visual difference, and it is why mesh gradients became the default look for product marketing around 2020.",
                    "Neat adds a third element: the surface itself is not flat. A subdivided plane is displaced with Perlin noise before the colours are blended across it, so shading follows real geometry. Set wave amplitude to 0 and you get a conventional flat mesh gradient; raise it and the mesh gains depth.",
                ],
            },
            {
                h2: "Making one",
                body: [
                    "Start from a preset close to what you want rather than from scratch — the parameter space is large and a cold start is rarely productive. Pastel, Coral and Oil Slick are the closest to the classic flat mesh look; Monterey and Night Dunes are the dark equivalents.",
                    "From there:",
                ],
                list: [
                    "Set <strong>wave amplitude</strong> to 0 or 1 for a flat mesh. Higher values are a different aesthetic — good, but no longer what most people mean by mesh gradient.",
                    "Use four to six colours. Two or three tends to collapse back into looking like a linear gradient.",
                    "Keep <strong>speed</strong> low, around 0.5 to 1.5. Mesh gradients read as premium when they drift; at high speed they read as a screensaver.",
                    "Add <strong>grain</strong> if you see banding. Large areas of smoothly interpolated colour are exactly where 8-bit-per-channel banding shows up, and a noise pass hides it for free.",
                ],
            },
            {
                h2: "Exporting a mesh gradient",
                body: [
                    "If you need a still mesh gradient — for a slide, a thumbnail, an OG image — export a PNG and you are done. If you want it animated on a site, take the config and pass it to the package:",
                ],
                code: {
                    lang: "javascript",
                    text: `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
  colors: [
    { color: "#E3D1E6", enabled: true },
    { color: "#ffc8dd", enabled: true },
    { color: "#ffafcc", enabled: true },
    { color: "#C5E2FF", enabled: true },
  ],
  speed: 1,
  waveAmplitude: 0,   // flat mesh
  colorSaturation: -4,
  colorBrightness: 1,
  grainScale: 2,
});`,
                },
            },
        ],
        faq: [
            {
                q: "What is the difference between a mesh gradient and a linear gradient?",
                a: "A linear gradient interpolates colours along one axis, so it always reads as a ramp. A mesh gradient blends between colour points spread across a two-dimensional surface, so boundaries curve and pool. Mesh gradients look organic; linear gradients look mechanical.",
            },
            {
                q: "Can I export a mesh gradient as a PNG?",
                a: "Yes. The editor exports a still PNG at your current canvas size, plus MP4 or WebM if you want the animation as a video file.",
            },
            {
                q: "Can I make a static mesh gradient in CSS?",
                a: "Approximately. Layering several radial-gradient() backgrounds at different positions gets you a passable flat mesh, and it costs nothing to render. It cannot animate smoothly or produce the depth shading that a displaced 3D surface gives you, which is the trade-off.",
            },
            {
                q: "How many colours should a mesh gradient use?",
                a: "Four to six. Fewer than four and it tends to collapse back into looking linear; more than six and the individual colours stop being distinguishable.",
            },
        ],
        related: ["gradient-generator", "animated-gradient-generator", "css-animated-gradient-background"],
    },

    {
        slug: "css-animated-gradient-background",
        preset: "Oil Slick",
        title: "Animated CSS Gradient Background – Code and Generator",
        metaDescription:
            "Copy-paste CSS for an animated gradient background, plus when to reach for WebGL instead. Working code, and a free generator for GPU-rendered gradients.",
        h1: "Animated CSS gradient background",
        intro:
            "There are two ways to get a moving gradient behind a page, and they are not interchangeable. This page gives you working CSS for the first, and explains where it stops being enough.",
        sections: [
            {
                h2: "The pure CSS version",
                body: [
                    "The standard trick is to make the gradient much wider than the viewport and animate <code>background-position</code>. Nothing else in CSS will interpolate gradient colour stops, so this is the technique whether or not it is the one you wanted:",
                ],
                code: {
                    lang: "css",
                    text: `.animated-gradient {
  background: linear-gradient(120deg, #FF5772, #4CB4BB, #FFC600, #8B6AE6);
  background-size: 400% 400%;
  animation: gradient-drift 18s ease infinite;
}

@keyframes gradient-drift {
  0%   { background-position:   0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position:   0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .animated-gradient { animation: none; }
}`,
                },
            },
            {
                h2: "What that gets you, and what it does not",
                body: [
                    "It is about ten lines, needs no JavaScript, works everywhere, and costs essentially nothing. For a lot of sites that is the correct answer and you can stop reading here.",
                    "The limitation is structural rather than a matter of effort. You are sliding a fixed image behind a window, so the motion is always linear and always loops visibly. There is no depth, because there is no surface being lit. Colours cannot pool or fold into each other, because <code>linear-gradient()</code> only interpolates along one axis. And on a large viewport, animating <code>background-position</code> on a huge background image is one of the more expensive things you can ask a compositor to do repeatedly.",
                    "A slightly better-behaved variant animates a transform on an oversized pseudo-element instead, which keeps the work on the GPU:",
                ],
                code: {
                    lang: "css",
                    text: `.gradient-host { position: relative; overflow: hidden; isolation: isolate; }

.gradient-host::before {
  content: "";
  position: absolute;
  inset: -50%;
  z-index: -1;
  background: conic-gradient(from 0deg, #FF5772, #4CB4BB, #FFC600, #8B6AE6, #FF5772);
  filter: blur(80px);
  animation: gradient-spin 24s linear infinite;
  will-change: transform;
}

@keyframes gradient-spin { to { transform: rotate(1turn); } }`,
                },
            },
            {
                h2: "When to use WebGL instead",
                body: [
                    "If you need the colours to actually move through each other rather than past the window — folding, pooling, catching light — CSS cannot express that. It has no concept of a surface with geometry.",
                    "Neat renders a displaced 3D plane on the GPU and blends up to six colours across it in a fragment shader. That is where the depth comes from. The cost is roughly 17 KB gzipped and a <code>&lt;canvas&gt;</code> element:",
                ],
                code: {
                    lang: "javascript",
                    text: `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
  colors: [
    { color: "#FF5772", enabled: true },
    { color: "#4CB4BB", enabled: true },
    { color: "#FFC600", enabled: true },
    { color: "#8B6AE6", enabled: true },
  ],
  speed: 2.5,
  waveAmplitude: 5,
  colorSaturation: 7,
});

// Respect the user's motion preference
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gradient.speed = 0;
}`,
                },
            },
            {
                h2: "A note on reduced motion",
                body: [
                    "Whichever route you take, honour <code>prefers-reduced-motion</code>. A full-viewport animated background is exactly the category of motion that setting exists for, and both examples above show how to disable it. A still gradient is not a degraded experience — several of the presets here are close to motionless by design.",
                ],
            },
        ],
        faq: [
            {
                q: "How do I animate a CSS gradient?",
                a: "Make the gradient larger than its container with background-size, then animate background-position in a keyframe loop. CSS cannot interpolate gradient colour stops directly, so moving the gradient behind a fixed window is the available technique.",
            },
            {
                q: "Is an animated CSS gradient bad for performance?",
                a: "Animating background-position on a full-viewport element forces repeated compositing work and can cost noticeably on low-end devices. Animating a transform on an oversized blurred pseudo-element is cheaper because it stays on the GPU.",
            },
            {
                q: "Can CSS produce a mesh gradient?",
                a: "Approximately, by layering several radial-gradient() backgrounds at different positions. It works for a static flat mesh but cannot animate smoothly or produce depth shading.",
            },
            {
                q: "Does Neat output CSS?",
                a: "No. Neat renders to a canvas with WebGL, so the export is a JavaScript config object, a PNG, or a video file. If you specifically need a CSS string, use the copy-paste code on this page.",
            },
        ],
        related: ["gradient-generator", "mesh-gradient-generator", "animated-3d-background-for-websites"],
    },

    {
        slug: "gradient-video-background",
        preset: "Cosmic Vortex",
        title: "Gradient Video Generator – Export Animated Gradients to MP4",
        metaDescription:
            "Generate an animated gradient and export it as MP4 or WebM. Free gradient video generator for backgrounds, presentations and video editing. No account.",
        h1: "Gradient video generator",
        intro:
            "Design an animated gradient in the browser and record it straight to a video file. Useful when you need a moving gradient somewhere that cannot run WebGL — a video editor timeline, a slide deck, a social post, or a <code>&lt;video&gt;</code> element you would rather ship than a canvas.",
        sections: [
            {
                h2: "Recording a gradient",
                body: [
                    "The editor records the live canvas directly, so what you see is what lands in the file. Set the gradient up first, then record — there is no separate render queue and no server round trip. Recording happens entirely on your machine via the browser's MediaRecorder API.",
                    "Format depends on your browser. MP4 with H.264 is preferred where the browser supports it, with WebM as the fallback; Chrome and Edge will generally give you MP4, Firefox will give you WebM.",
                ],
            },
            {
                h2: "Getting a clean loop",
                body: [
                    "The animation is driven by a continuous noise field rather than a fixed-length timeline, so there is no natural loop point. In practice that means a recording will not seam perfectly if you cut it and repeat it.",
                    "Two ways around it, depending on what you need:",
                ],
                list: [
                    "<strong>Record long, cross-fade short.</strong> Take 20–30 seconds and cross-fade the last second into the first in your editor. At low speed values the colours change slowly enough that a one-second dissolve is invisible.",
                    "<strong>Drop the speed.</strong> At speed 0.5 or below, any two frames a few seconds apart are close enough that a hard cut reads as continuous.",
                ],
            },
            {
                h2: "Using it as a page background",
                body: [
                    "If you are shipping the video to a website rather than the live canvas, the usual attributes apply — and <code>playsinline</code> matters, without it iOS will take the video fullscreen:",
                ],
                code: {
                    lang: "html",
                    text: `<video
  autoplay
  loop
  muted
  playsinline
  poster="gradient-poster.jpg"
  style="position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1">
  <source src="gradient.mp4" type="video/mp4" />
  <source src="gradient.webm" type="video/webm" />
</video>`,
                },
            },
            {
                h2: "Video file or live canvas?",
                body: [
                    "A recorded video is a fixed size and a fixed composition — it will letterbox or crop at aspect ratios you did not record for, and a 20-second 1080p loop is typically a few megabytes. The live canvas is around 17 KB gzipped, adapts to any viewport, and can react to scroll or pointer position, but it needs WebGL and costs GPU time.",
                    "As a rough rule: use the video when the destination is not a web page, or when you need guaranteed identical output everywhere. Use the canvas when it is your own site and you want it to fit the viewport properly.",
                ],
            },
        ],
        faq: [
            {
                q: "Can I export an animated gradient as MP4?",
                a: "Yes. The editor records the live canvas to MP4 where the browser supports H.264, and falls back to WebM otherwise. Recording is local — nothing is uploaded.",
            },
            {
                q: "Can I export a gradient as a GIF?",
                a: "Not directly. Export MP4 or WebM and convert, which will also give you a far smaller file than a GIF at the same quality — GIF is limited to 256 colours, which is unkind to a gradient.",
            },
            {
                q: "How do I make the gradient video loop seamlessly?",
                a: "The animation is driven by a continuous noise field, so there is no exact loop point. Record 20 to 30 seconds and cross-fade the end into the beginning, or drop the speed below 0.5 so a hard cut is imperceptible.",
            },
            {
                q: "Is the gradient video free to use commercially?",
                a: "The tool is free to use. An unobtrusive NEAT watermark is drawn on the canvas unless a licence key is set, which is a one-off €12 and removes it from recordings as well.",
            },
        ],
        related: ["gradient-generator", "animated-gradient-generator", "animated-3d-background-for-websites"],
    },

    {
        slug: "animated-3d-background-for-websites",
        preset: "Monterey",
        title: "Animated 3D Backgrounds for Websites – Free Generator",
        metaDescription:
            "Add an animated 3D background to your website. GPU-rendered, ~17 KB, no dependencies, works with React, Vue or plain JavaScript. Free, 25 presets.",
        h1: "Animated 3D backgrounds for websites",
        intro:
            "Neat renders a displaced 3D surface in WebGL and animates it behind your page. It is one canvas element and a config object, it does not require a 3D library, and it does not need you to know anything about shaders.",
        sections: [
            {
                h2: "Why it looks three-dimensional",
                body: [
                    "Most \"3D\" backgrounds on the web are 2D images with a parallax offset. This is not that. A subdivided plane geometry is displaced along its normal by a Perlin noise field, then lit — so the light and shadow you see follow actual geometry, and the surface occludes itself as it folds.",
                    "That is also why the wave amplitude control has such a large effect. At 0 the plane stays flat and you get a conventional 2D mesh gradient; as you raise it, the surface starts folding and the shading appears with it.",
                ],
            },
            {
                h2: "Adding it to a site",
                body: [
                    "Position a canvas behind your content and hand it to the constructor. Framework-agnostic, because it only needs a DOM node:",
                ],
                code: {
                    lang: "javascript",
                    text: `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
  colors: [
    { color: "#130437", enabled: true },
    { color: "#B34BD0", enabled: true },
    { color: "#210751", enabled: true },
    { color: "#3511A5", enabled: true },
  ],
  speed: 4,
  waveAmplitude: 0,
  colorBrightness: 1.95,
  grainScale: 6,
});

// Clean up on unmount
// gradient.destroy();`,
                },
            },
            {
                h2: "In React",
                body: [
                    "Create it in an effect and destroy it in the cleanup. The common mistake is letting a re-render construct a second instance on the same canvas:",
                ],
                code: {
                    lang: "jsx",
                    text: `import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

export function GradientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const gradient = new NeatGradient({
      ref: canvasRef.current,
      colors: [
        { color: "#130437", enabled: true },
        { color: "#B34BD0", enabled: true },
        { color: "#3511A5", enabled: true },
      ],
      speed: 4,
      waveAmplitude: 0,
    });
    return () => gradient.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -1 }}
    />
  );
}`,
                },
            },
            {
                h2: "Reacting to scroll",
                body: [
                    "Setting <code>yOffset</code> advances the noise field, so tying it to scroll position makes the surface evolve as the reader moves down the page rather than only with time:",
                ],
                code: {
                    lang: "javascript",
                    text: `window.addEventListener("scroll", () => {
  gradient.yOffset = window.scrollY;
}, { passive: true });`,
                },
            },
            {
                h2: "Keeping it usable",
                body: [
                    "A full-viewport animated background is easy to get wrong. Three things worth holding to:",
                ],
                list: [
                    "<strong>Contrast first.</strong> Check your body text against the brightest and darkest frames the gradient produces, not just the one on screen when you happened to look. Dark presets with a bright colour in the palette are the usual offenders.",
                    "<strong>Honour <code>prefers-reduced-motion</code>.</strong> Set <code>speed</code> to 0 rather than removing the gradient — a still one still looks intentional.",
                    "<strong>Have a fallback.</strong> WebGL can be unavailable or blocked. A CSS gradient as the canvas element's own background costs nothing and means the page never renders bare.",
                ],
            },
        ],
        faq: [
            {
                q: "How do I add an animated 3D background to my website?",
                a: "Install @firecms/neat, add a canvas element positioned behind your content, and pass it to the NeatGradient constructor along with a config object. It works with React, Vue, Svelte or plain JavaScript because it only needs a DOM node.",
            },
            {
                q: "Does an animated 3D background hurt page speed?",
                a: "The package is around 17 KB gzipped with no dependencies, and rendering runs on the GPU rather than the main thread, so it does not block interaction. The real cost is GPU time on low-end devices — export a still PNG or a short video loop if that is a concern for your audience.",
            },
            {
                q: "Does it work on mobile?",
                a: "Yes, on any device with WebGL support, which is effectively every current phone. Lower the wave amplitude and speed on small screens if you want to be conservative about battery.",
            },
            {
                q: "Do I need Three.js?",
                a: "No. Neat has no dependencies and talks to WebGL directly.",
            },
        ],
        related: ["gradient-generator", "animated-gradient-generator", "css-animated-gradient-background", "gradient-video-background"],
    },

    {
        slug: "animated-gradient-generator",
        preset: "Stripe",
        title: "Animated Gradient Generator – Free Moving Gradient Backgrounds",
        metaDescription:
            "Free animated gradient generator. Create moving gradient backgrounds with 25 presets, tune colour, speed and wave motion, then export to code, PNG or MP4.",
        h1: "Animated gradient generator",
        intro:
            "Create a moving gradient background and export it as code, a still image, or a video. Twenty-five presets to start from, six colour slots, and controls for how the surface moves. Free, runs entirely in your browser.",
        sections: [
            {
                h2: "The controls that matter",
                body: [
                    "There are a lot of sliders. In practice four of them determine most of the result, and the rest are refinement:",
                ],
                list: [
                    "<strong>Speed</strong> — the single biggest lever on how the gradient reads. Above 3 it is energetic and attention-seeking. Between 1 and 2 it reads as ambient. Below 0.5 it stops registering as animation and becomes texture that happens to change.",
                    "<strong>Wave amplitude</strong> — depth. 0 gives a flat 2D colour field; 10 folds the surface over itself. Most production sites want 0 to 5.",
                    "<strong>Colours</strong> — up to six. The useful trick is including one very dark or very light colour: the shader treats it as luminance, so it produces highlights and shadow rather than just another hue.",
                    "<strong>Colour saturation</strong> — applied after blending. Negative values are how the muted, editorial-looking presets are made, and they are usually what a design needs when full saturation feels cheap.",
                ],
            },
            {
                h2: "Speed, honestly",
                body: [
                    "The most common mistake with animated gradients is running them too fast. A background that moves quickly competes with the content in front of it, and because it never stops, it never stops competing.",
                    "If the gradient sits behind text someone is meant to read, start at speed 1 and go down from there. Reserve the higher values for pages with almost no copy — a splash screen, a launch page, a video backdrop.",
                ],
            },
            {
                h2: "Exporting",
                body: [
                    "The config export is a plain object with no framework assumptions:",
                ],
                code: {
                    lang: "javascript",
                    text: `import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
  ref: document.getElementById("gradient"),
  colors: [
    { color: "#FD113F", enabled: true },
    { color: "#90E0FF", enabled: true },
    { color: "#FFC858", enabled: true },
    { color: "#753BFF", enabled: true },
  ],
  speed: 2,
  waveAmplitude: 10,
  colorBrightness: 1.05,
});`,
                },
                after: [
                    "You can also take a PNG for a still frame, or record MP4 or WebM if the destination is not a web page.",
                ],
            },
        ],
        faq: [
            {
                q: "What is the best speed for an animated gradient background?",
                a: "Between 0.5 and 1.5 for anything sitting behind text. Higher values compete with the content, and because the animation never stops, it never stops competing. Save speeds above 3 for pages with almost no copy.",
            },
            {
                q: "Can I use an animated gradient behind text?",
                a: "Yes, but check contrast against the brightest and darkest frames the gradient produces rather than whichever one happens to be on screen. A low-speed, low-amplitude preset with a semi-transparent overlay is the reliable approach.",
            },
            {
                q: "How many colours can an animated gradient have?",
                a: "Up to six, each individually toggleable. Including one very dark or very light colour gives you highlights and shadow, because the shader reads it as luminance.",
            },
            {
                q: "Can I export the animation as a file?",
                a: "Yes — PNG for a still frame, MP4 or WebM for the animation. Both are produced locally in the browser.",
            },
        ],
        related: ["gradient-generator", "mesh-gradient-generator", "gradient-video-background", "animated-3d-background-for-websites"],
    },
];
