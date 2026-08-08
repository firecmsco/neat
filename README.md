# 🌈 Neat Gradients

Create stunning, animated 3D gradients with hardware-accelerated WebGL performance.

> [!IMPORTANT]
> **As of v0.7, Neat no longer depends on three.js.** The rendering engine has been rewritten to use raw WebGL, drastically reducing the total install footprint. Zero external dependencies. If you are upgrading from a previous version, see the [Migration Guide](#-migrating-from-v06x) below.

[![npm version](https://badge.fury.io/js/@firecms%2Fneat.svg)](https://www.npmjs.com/package/@firecms/neat)
[![License: MIT + Commons Clause](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-lightgrey.svg)](https://github.com/FireCMSco/neat/blob/main/LICENSE)

**✨ [Try the Interactive Editor](https://neat.firecms.co/) ✨**

Design your perfect gradient with our visual editor, featuring 20+ presets and real-time preview. Export the config and use it in your project instantly.

![Neat Gradient Examples](https://neat.firecms.co/og_image_v3.png)

---

## 🔄 Migrating from v0.6.x

If you're upgrading from a previous version that used three.js, here's what changed:

### Bundle size

| | **v0.6.x (Three.js)** | **v0.7+ (Pure WebGL)** |
|---|---|---|
| Library bundle | ~42 KB | ~59 KB (standalone) |
| Three.js peer dep | 616 KB (122 KB gzip) | **0** |
| **Total** | **~653 KB (~133 KB gzip)** | **~59 KB (~17 KB gzip)** |

### 1. Remove the `three` dependency

```bash
npm uninstall three @types/three
```

Neat now ships with its own lightweight WebGL renderer — no external 3D library needed.

### 2. Remove mouse interaction config

The `mouseDistortionStrength`, `mouseDistortionRadius`, `mouseDecayRate`, and `mouseDarken` properties have been removed. You can safely delete them from your config objects — they will be ignored.

### 3. No API changes

All other configuration properties, methods (`destroy`, `downloadAsPNG`), and dynamic property setters work exactly the same. Your existing configs from the [editor](https://neat.firecms.co/) remain fully compatible.

---

## 📦 Installation

```bash
npm install @firecms/neat
```

or

```bash
yarn add @firecms/neat
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
    ref: document.getElementById("canvas"),
    colors: [
        { color: "#FF5772", enabled: true },
        { color: "#4CB4BB", enabled: true },
        { color: "#FFC600", enabled: true },
        { color: "#8B6AE6", enabled: true },
        { color: "#2E0EC7", enabled: true }
    ],
    speed: 4,
    waveAmplitude: 5,
    backgroundColor: "#003FFF",
    backgroundAlpha: 1
});

// Clean up when done (important for React, Vue, etc.)
gradient.destroy();
```

### React Example

```tsx
import { useEffect, useRef } from "react";
import { NeatGradient, NeatConfig } from "@firecms/neat";

function BackgroundGradient() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gradientRef = useRef<NeatGradient | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            colors: [
                { color: "#FF5772", enabled: true },
                { color: "#4CB4BB", enabled: true },
                { color: "#FFC600", enabled: true }
            ],
            speed: 3,
            waveAmplitude: 5
        });

        return () => gradientRef.current?.destroy();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1
            }}
        />
    );
}
```

---

## ⚙️ Configuration API

### Core Animation

| Property | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `speed` | `number` | `4` | `0-10` | Animation speed (0 = static) |
| `waveAmplitude` | `number` | `3` | `0-10` | Wave height intensity |
| `waveFrequencyX` | `number` | `5` | `0-10` | Horizontal wave frequency |
| `waveFrequencyY` | `number` | `5` | `0-10` | Vertical wave frequency |

#### Secondary Waves

A second displacement layer sampled on a rotated domain and running at its own
rate. On its own the base layer swells along one direction; crossing it with a
second layer makes the two interfere, so ridges break up and reform instead of
marching across the canvas.

| Property | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `secondaryWaveEnabled` | `boolean` | `false` | | Enable the second wave layer |
| `secondaryWaveFrequencyX` | `number` | `3` | `0-10` | Horizontal frequency of the second layer |
| `secondaryWaveFrequencyY` | `number` | `3` | `0-10` | Vertical frequency of the second layer |
| `secondaryWaveAmplitude` | `number` | `5` | `0-10` | Weight against the base layer (0 = base only, 10 = equal parts) |
| `secondaryWaveSpeed` | `number` | `0.6` | `0-3` | Rate relative to `speed` |
| `secondaryWaveAngle` | `number` | `1.0` | `0-π` | Domain rotation in radians (0 = parallel to the base) |

`secondaryWaveAmplitude` is a blend weight, not an extra height — the combined
displacement is renormalised so `waveAmplitude` stays the master control and the
lighting keeps the same range whatever the mix.

### Colors

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `colors` | `NeatColor[]` | Required | Array of color objects (up to 6) |
| `colorBlending` | `number` | `5` | How colors mix together (0-10) |
| `colorBrightness` | `number` | `1` | Overall brightness multiplier |
| `colorSaturation` | `number` | `0` | Color saturation adjustment (-10 to 10) |
| `horizontalPressure` | `number` | `3` | Horizontal color distribution (0-10) |
| `verticalPressure` | `number` | `3` | Vertical color distribution (0-10) |

**Color Object:**
```typescript
{
    color: string;      // Hex color (e.g., "#FF5772")
    enabled: boolean;   // Toggle color on/off
    influence?: number; // How much canvas it claims (0-2, default 1)
}
```

**`influence` is territory, not opacity.** Each color is laid over the ones before
it wherever its own noise field clears a threshold; influence moves that threshold.
Turning it down shrinks the regions the color holds rather than making it
translucent everywhere it already appears. 1 is neutral, 0 removes the color without
having to disable it, and 2 lets it dominate. It is ignored on the first color,
which is the base the rest are mixed over and so is always fully present.

### Visual Effects

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shadows` | `number` | `4` | Shadow intensity (0-10) |
| `highlights` | `number` | `4` | Highlight intensity (0-10) |
| `grainIntensity` | `number` | `0.55` | Film grain amount (0-1) |
| `grainScale` | `number` | `2` | Grain size |
| `grainSparsity` | `number` | `0.0` | Grain distribution sparsity (0-1) |
| `grainSpeed` | `number` | `0.1` | Grain animation speed |
| `wireframe` | `boolean` | `false` | Show wireframe mesh |

### Advanced Shaders & Post-Processing

#### Domain Warping

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `domainWarpEnabled` | `boolean` | `false` | Enable domain warping distortion |
| `domainWarpIntensity` | `number` | `0.5` | Strength of domain warping |
| `domainWarpScale` | `number` | `1.0` | Spatial frequency scale of warping |

#### Vignette

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `vignetteIntensity` | `number` | `0.0` | Darkness intensity at corners (0-1) |
| `vignetteRadius` | `number` | `0.8` | Radial falloff start distance |

#### Fresnel (Rim Glow)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fresnelEnabled` | `boolean` | `false` | Enable glowing outer edge shader effect |
| `fresnelPower` | `number` | `2.0` | Falloff exponent of the rim glow |
| `fresnelIntensity` | `number` | `0.5` | Brightness of the glow effect |
| `fresnelColor` | `string` | `"#FFFFFF"` | Color of the rim glow (hex) |

#### Iridescence

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `iridescenceEnabled` | `boolean` | `false` | Enable soap-bubble style color shifting |
| `iridescenceIntensity` | `number` | `0.5` | Strength of the color shift effect |
| `iridescenceSpeed` | `number` | `1.0` | Color cycle speed |

#### Prism Edges

Thin-film rainbow along the seams between colors — the oil-slick fringe you get
where two films meet. Distinct from `iridescence`, which tints the whole surface
by height: this one lives only on the boundaries and runs through the spectrum as
it crosses them. It reads the color-mix field directly, so it needs no screen-space
derivatives and works the same on WebGL1.

The fringe colors follow thin-film interference rather than a hue wheel — each
channel oscillates at a rate set by its wavelength, which produces the Newton
series a real film shows (white → straw → magenta → blue → green, washing out as
it thickens) instead of an even rainbow sweep.

The fringe **tints at constant luminance** rather than glowing on top: it takes the
surface's own brightness and supplies only the hue. Adding or screening the color
instead — the obvious approach — only ever lightens, so over a pale surface every
channel runs to white and the fringe degrades into a grey halo. Tinting keeps a
bright mass bright and a dark one dark, which is what reads as petrol on water
rather than a light behind it, and it works on light and dark backgrounds alike.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `prismEdgeEnabled` | `boolean` | `false` | Enable the fringe |
| `prismEdgeIntensity` | `number` | `0.5` | How far the fringe tints the surface (0-1) |
| `prismEdgeThinness` | `number` | `3.0` | Thinness — higher pulls the band tighter onto the seam (1-12) |
| `prismEdgeSpread` | `number` | `1.0` | Apparent film thickness across one seam — how far through the Newton series it runs, so how many bands appear (0-3) |
| `prismEdgeRipple` | `number` | `1.0` | How much the wave height varies the film thickness (0-4) |
| `prismEdgeSpeed` | `number` | `0.5` | Rate the film appears to thicken, drifting the colors (0 = still) |

`prismEdgeRipple` is what stops the fringe reading as one flat halo. A tight band
samples a single slice of the series, so without it the whole rim comes out one
color; letting the wave height modulate thickness — as it would on a real rippling
film — shifts the hue *along* the seam. It is also the only route by which the wave
layers reach a preset lit flat enough that their shading contributes nothing, so it
pairs naturally with `secondaryWave*`.

How soft the fringe is follows `colorBlending`: a wide blend gives a broad, hazy
band, a tight one gives a hard rim. Push `prismEdgeThinness` up if the fringe is
washing your base colors out to pastel.

#### Bloom (Fake Glow)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bloomIntensity` | `number` | `0.0` | Intensity of the glow bleeding from highlights |
| `bloomThreshold` | `number` | `0.7` | Brightness threshold for bloom candidate pixels |

#### Chromatic Aberration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chromaticAberration` | `number` | `0.0` | Lens color channel splitting distance |

### 3D Geometries & Shapes

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shapeType` | `'plane' \| 'sphere' \| 'torus' \| 'cylinder' \| 'ribbon'` | `'plane'` | 3D shape geometry to render the gradient on |
| `shapeRotationX` | `number` | `0` | Manual X rotation (radians) |
| `shapeRotationY` | `number` | `0` | Manual Y rotation (radians) |
| `shapeRotationZ` | `number` | `0` | Manual Z rotation (radians) |
| `shapeAutoRotateSpeedX` | `number` | `0` | Auto-rotation speed on X-axis |
| `shapeAutoRotateSpeedY` | `number` | `0` | Auto-rotation speed on Y-axis |
| `sphereRadius` | `number` | `15` | Radius of the sphere shape |
| `torusRadius` | `number` | `15` | Torus primary ring radius |
| `torusTube` | `number` | `5` | Torus inner tube thickness |
| `cylinderRadius` | `number` | `10` | Radius of the cylinder shape |
| `cylinderHeight` | `number` | `40` | Height of the cylinder shape |
| `planeBend` | `number` | `0` | Bending distortion applied to the plane geometry |
| `planeTwist` | `number` | `0` | Twisting distortion applied to the plane geometry |
| `silhouetteFade` | `number` | `0.25` | Edge transparency fade for sphere/torus |
| `cylinderFade` | `number` | `0.08` | Transparency fade towards the ends of the cylinder |
| `ribbonFade` | `number` | `0.05` | Transparency fade towards the ends of the ribbon |
| `flatShading` | `boolean` | `true` | Use flat shading for geometry normals |

### Camera Settings

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `cameraLock` | `boolean` | `false` | Lock camera controls and prevent drag rotation |
| `cameraX` | `number` | `0` | Camera offset along X-axis |
| `cameraY` | `number` | `0` | Camera offset along Y-axis |
| `cameraZ` | `number` | `0` | Camera offset along Z-axis |
| `cameraRotationX` | `number` | `0` | Camera pitch rotation (radians) |
| `cameraRotationY` | `number` | `0` | Camera yaw rotation (radians) |
| `cameraRotationZ` | `number` | `0` | Camera roll rotation (radians) |
| `cameraZoom` | `number` | `1.0` | Camera zoom factor |

### Background

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `backgroundColor` | `string` | `"#FFFFFF"` | Background color (hex) |
| `backgroundAlpha` | `number` | `1` | Background opacity (0-1) |

### Performance

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resolution` | `number` | `1` | Mesh density (0.1-2, lower = better performance) |
| `renderScale` | `number` | `1` | Drawing buffer size relative to the canvas' CSS size (0.1-3) |

**`resolution` is mesh density, not pixel resolution.** It scales the displacement
grid — 240x240 segments for a plane at `1`, 120x120 for the 3D shapes. The grid is
also capped to roughly one segment per 6 canvas pixels, so a small canvas never
pays for detail it cannot show.

The per-frame cost splits roughly evenly between the vertex shader (one Perlin
evaluation per wave layer plus one simplex evaluation per enabled color, per vertex)
and the fragment shader (dominated by film grain). Turning either side down helps;
which one to reach for depends on whether you are vertex- or fill-bound.

**`renderScale` is the pixel one.** At `0.75` the gradient renders 44% fewer pixels
and the browser scales the result up — usually invisible behind content, and the
cheapest win on low-end devices. It needs the canvas to be sized by CSS; if the
layout size comes from the width/height attributes, scaling is ignored (with a
warning) so the element cannot shrink itself on every resize.

**`speed: 0` costs nothing.** With the clock stopped every frame would be identical,
so the render loop parks itself and only wakes when you change a property. A static
gradient is a one-off render, not a 60fps redraw of the same image.

### Scroll Integration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `yOffset` | `number` | `0` | Vertical scroll offset |
| `yOffsetWaveMultiplier` | `number` | `4` | How much scroll affects waves (0-20) |
| `yOffsetColorMultiplier` | `number` | `4` | How much scroll affects colors (0-20) |
| `yOffsetFlowMultiplier` | `number` | `4` | How much scroll affects flow field (0-20) |

**Example: Parallax Scrolling**
```typescript
window.addEventListener("scroll", () => {
    gradient.yOffset = window.scrollY;
});
```

### Flow Field (Distortion)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `flowEnabled` | `boolean` | `true` | Enable flow field distortion |
| `flowDistortionA` | `number` | `0` | Primary distortion amplitude |
| `flowDistortionB` | `number` | `0` | Secondary distortion frequency |
| `flowScale` | `number` | `1` | Overall flow field scale |
| `flowEase` | `number` | `0` | Flow field smoothing (0-1) |



### Procedural Texture Overlay

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableProceduralTexture` | `boolean` | `false` | Enable texture overlay |
| `textureVoidLikelihood` | `number` | `0.45` | Gap frequency in texture (0-1) |
| `textureVoidWidthMin` | `number` | `200` | Minimum gap width |
| `textureVoidWidthMax` | `number` | `486` | Maximum gap width |
| `textureBandDensity` | `number` | `2.15` | Texture band density |
| `textureColorBlending` | `number` | `0.01` | Color mixing in texture (0-1) |
| `textureSeed` | `number` | `333` | Random seed for texture |
| `textureEase` | `number` | `0.5` | Flow/Image blend (0=flow, 1=image) |
| `transparentTextureVoid` | `boolean` | `false` | Render voids as transparent instead of using proceduralBackgroundColor |
| `proceduralBackgroundColor` | `string` | `"#000000"` | Texture void color |
| `textureShapeTriangles` | `number` | `20` | Number of triangle shapes |
| `textureShapeCircles` | `number` | `15` | Number of circle shapes |
| `textureShapeBars` | `number` | `15` | Number of bar shapes |
| `textureShapeSquiggles` | `number` | `10` | Number of squiggle shapes |

---

## 🛠️ API Methods

### `destroy()`

Cleans up the WebGL context, event listeners, and removes any injected DOM elements. Call this when the component unmounts to prevent memory leaks (essential for React, Vue, etc.).

```typescript
gradient.destroy();
```

---

## 🎨 Dynamic Property Updates

All properties can be updated in real-time:

```typescript
// Animation
gradient.speed = 6;
gradient.waveAmplitude = 8;

// Colors
gradient.colors = [
    { color: "#FF0000", enabled: true },
    { color: "#00FF00", enabled: true }
];

// 3D Shape Geometries & Auto-Rotation
gradient.shapeType = "sphere";
gradient.shapeAutoRotateSpeedY = 1.5;

// Advanced Post-Processing Effects
gradient.iridescenceEnabled = true;
gradient.fresnelEnabled = true;
gradient.fresnelColor = "#FF0055";

// Effects
gradient.grainIntensity = 0.5;

// Texture
gradient.enableProceduralTexture = true;
gradient.textureEase = 0.7;
```

---

## 💡 Tips & Best Practices

### Performance Optimization

1. **Lower the mesh density for better FPS:**
   ```typescript
   resolution: 0.5  // A quarter of the vertices
   ```

   And drop the pixel count too, which costs almost nothing visually:
   ```typescript
   renderScale: 0.75  // 44% fewer pixels, browser upscales
   ```

2. **Disable features you don't need.** Effects you switch off are compiled out of
   the shader entirely rather than branched around, so they cost exactly nothing:

   ```typescript
   speed: 0,              // Static gradient — the render loop parks
   grainIntensity: 0,     // No grain effect
   flowEnabled: false,    // No flow distortion
   ```

3. **Use fewer colors.** Each enabled color is another simplex-noise evaluation per
   vertex, so the cost is roughly linear in how many are on.

**What things actually cost.** Measured on an Apple GPU at 2880x1620 with
`resolution: 2`, as a share of frame time — treat these as rough proportions, not
absolutes, since the balance shifts with canvas size and mesh density:

| Turning off | Frame time saved |
|-------------|------------------|
| `grainIntensity: 0` | ~29% |
| Halving `resolution` | ~29% |
| `renderScale: 0.75` | ~29% |
| Each disabled color (6 → 2) | ~5% each |
| `prismEdgeEnabled: false` | ~5% |
| `secondaryWaveEnabled: false` | ~5% |
| `flowEnabled: false` | ~2% |

Grain is the single biggest switch, and the one most often left on without being
noticed. The three leaders are close enough that on a struggling device it is worth
trying all of them.

**Why grain costs what it does.** It is fractal noise — two 3D simplex evaluations
per pixel — and each of those runs three nested hash rounds built on `sin()`, so the
effect alone is roughly 24 transcendental calls per pixel per frame. There is no way
to make it cheaper without changing how it looks, so if you are fill-bound and can
live without it, turning it off is the largest single saving available.

---

## 🎯 Advanced Features

### Parallax Scrolling

Create depth by making different elements move at different speeds:

```typescript
const gradient = new NeatGradient({
    ref: canvas,
    colors: [/* ... */],
    yOffsetWaveMultiplier: 8,    // Waves move faster
    yOffsetColorMultiplier: 4,   // Colors move slower
    yOffsetFlowMultiplier: 6     // Flow in between
});

window.addEventListener("scroll", () => {
    gradient.yOffset = window.scrollY;
});
```

### Texture Overlay Effects

Add complex patterns over your gradient:

```typescript
{
    enableProceduralTexture: true,
    textureEase: 0.3,              // More topographic
    textureVoidLikelihood: 0.3,    // Fewer gaps
    textureBandDensity: 1.5,       // Wider bands
    textureShapeTriangles: 30,     // More shapes
    proceduralBackgroundColor: "#000033"  // Dark voids
}
```

## 🪞 One gradient, many canvases

Browsers only grant a handful of live WebGL contexts, and every extra `NeatGradient`
runs its own shader. So don't create one per card — create **one** gradient and mirror
it into as many plain 2D canvases as you like. Each mirror can show a different crop,
they all stay perfectly in sync, and the cost per mirror is a GPU copy instead of a
second render.

This is exactly how the [editor](https://neat.firecms.co) previews a gradient as a
website hero, a phone screen and a row of avatars at the same time.

The source gradient needs `preserveDrawingBuffer: true` — without it the drawing buffer
is cleared after compositing and there is nothing left to copy:

```typescript
import { NeatGradient } from "@firecms/neat";

const source = document.getElementById("source") as HTMLCanvasElement;

const gradient = new NeatGradient({
    ref: source,
    preserveDrawingBuffer: true,   // required to read the canvas from outside its own frame
    colors: [
        { color: "#FF5772", enabled: true },
        { color: "#4CB4BB", enabled: true },
        { color: "#FFC600", enabled: true }
    ]
});
```

Then mirror regions of it wherever you want:

```typescript
type MirrorOptions = {
    cx?: number;    // horizontal centre of the crop, 0–1
    cy?: number;    // vertical centre of the crop, 0–1
    zoom?: number;  // 1 shows as much as fits, 2 shows half
    fps?: number;   // refresh rate — drop it for small decorative mirrors
};

function mirror(target: HTMLCanvasElement, options: MirrorOptions = {}) {
    const { cx = 0.5, cy = 0.5, zoom = 1, fps = 60 } = options;
    const ctx = target.getContext("2d");
    const interval = 1000 / fps;
    let raf = 0;
    let last = 0;

    const draw = (now: number) => {
        raf = requestAnimationFrame(draw);
        if (!ctx || now - last < interval) return;
        last = now;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(target.clientWidth * dpr);
        const h = Math.round(target.clientHeight * dpr);
        if (!w || !h || !source.width || !source.height) return;
        if (target.width !== w || target.height !== h) {
            target.width = w;
            target.height = h;
        }

        // Largest crop of the source matching the target's aspect ratio, then zoomed
        const aspect = w / h;
        let cropW = source.width;
        let cropH = source.width / aspect;
        if (cropH > source.height) {
            cropH = source.height;
            cropW = source.height * aspect;
        }
        cropW /= zoom;
        cropH /= zoom;

        const sx = Math.min(Math.max(cx * source.width - cropW / 2, 0), source.width - cropW);
        const sy = Math.min(Math.max(cy * source.height - cropH / 2, 0), source.height - cropH);

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, w, h);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
}

// A hero, a tight crop for a card, and a slow-refreshing avatar
mirror(document.getElementById("hero") as HTMLCanvasElement);
mirror(document.getElementById("card") as HTMLCanvasElement, { cx: 0.3, cy: 0.4, zoom: 1.7 });
mirror(document.getElementById("avatar") as HTMLCanvasElement, { cx: 0.7, cy: 0.6, zoom: 10, fps: 10 });
```

**Things worth knowing**

- The source canvas must stay laid out. `display: none` collapses it to zero size and
  the gradient stops rendering — hide it with `position: fixed; inset: 0; z-index: -1`
  behind your content, or cover it with an opaque layer, instead.
- Use one `requestAnimationFrame` loop for all mirrors rather than one each; the example
  above is per-mirror for clarity, but a shared ticker iterating a list scales better.
- `drawImage` from a WebGL canvas is a cross-context copy — cheap on desktop, noticeable
  on phones. There, cap the device pixel ratio at 1 and run mirrors at 30 fps, and give
  small decorative ones (avatars, icons) 10 fps. Nobody can tell on a 40px circle.
- Mirrors are ordinary canvases, so they take `border-radius`, `mask-image`, `filter`
  and anything else CSS offers. A tiny mirror blurred to nothing makes a good ambient
  glow behind a layout.
- Only the source needs `preserveDrawingBuffer`. It is also what makes
  `downloadAsPNG()` and video capture work.

---

## 📖 TypeScript Support

Full TypeScript definitions included:

```typescript
import { NeatGradient, NeatConfig, NeatColor, NeatController } from "@firecms/neat";

const config: NeatConfig = {
    // ... fully typed config
};

const gradient: NeatController = new NeatGradient(config);
```

---

## 🛠️ How It Works

Neat uses custom WebGL shaders to render dynamic 3D gradients entirely on the GPU:

1. **Mesh Generation:** Creates a subdivided plane geometry
2. **Vertex Shader:** Displaces vertices to create waves using Perlin noise
3. **Fragment Shader:** Blends colors, applies flow fields, lighting, and effects
4. **Hardware Acceleration:** All computations run on the GPU for smooth 60fps animations

The result is a performant, beautiful gradient that can run on any modern device.

---

## 📄 License

Neat is released under the **MIT License + The Commons Clause**.

**You can:**
- ✅ Use freely in personal projects
- ✅ Use freely in commercial projects (e.g. SaaS landing pages, company websites)
- ✅ Modify and redistribute (with attribution)
- ✅ Use in open-source projects

**You CANNOT:**
- ❌ Sell the software
- ❌ Include it in a paid template or theme builder that you sell
- ❌ Offer the software as a paid service

### Remove the NEAT Watermark

Purchase a license key for **€12 one-time** (per domain) to remove the NEAT watermark and console branding.

**[Buy a license →](https://neat.firecms.co)**

Then pass the key in your config:

```typescript
const gradient = new NeatGradient({
    ref: canvas,
    colors: [...],
    licenseKey: "NEAT-eyJ0eXBlI..."  // Your license key
});
```

Each key is locked to the domain you specify at checkout (subdomains included). Development on `localhost` always works without a key.

---

## 🙏 Credits

Created by [FireCMS](https://firecms.co) with ❤️



---

## 🐛 Issues & Contributing

Found a bug or have a feature request? 

- **Issues:** [GitHub Issues](https://github.com/FireCMSco/neat/issues)
- **Discussions:** [GitHub Discussions](https://github.com/FireCMSco/neat/discussions)

---

## 🔗 Links

- 🌐 [Website & Editor](https://neat.firecms.co)
- 🤖 [llms.txt](https://neat.firecms.co/llms.txt) — the whole config reference in one file, for coding agents
- 📦 [npm Package](https://www.npmjs.com/package/@firecms/neat)
- 💻 [GitHub Repository](https://github.com/FireCMSco/neat)
- 💬 [Discord Community](https://discord.gg/fxy7xsQm3m)

---

**Made with ✨ by the FireCMS team**
