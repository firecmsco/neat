# 🌈 Neat Gradients

Create stunning, animated 3D gradients with hardware-accelerated performance using WebGL and three.js.

[![npm version](https://badge.fury.io/js/@firecms%2Fneat.svg)](https://www.npmjs.com/package/@firecms/neat)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

**✨ [Try the Interactive Editor](https://neat.firecms.co/) ✨**

Design your perfect gradient with our visual editor, featuring 20+ presets and real-time preview. Export the config and use it in your project instantly.

![Neat Gradient Examples](https://neat.firecms.co/og_image.png)

---

## 📦 Installation

```bash
npm install @firecms/neat three
```

or

```bash
yarn add @firecms/neat three
```

> **Important:** Install `three` (not `three.js` - that's a different, incompatible package)

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
| `waveAmplitude` | `number` | `5` | `0-10` | Wave height intensity |
| `waveFrequencyX` | `number` | `2` | `0-10` | Horizontal wave frequency |
| `waveFrequencyY` | `number` | `3` | `0-10` | Vertical wave frequency |

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
    influence?: number; // Color strength (0-1, optional)
}
```

### Visual Effects

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shadows` | `number` | `0` | Shadow intensity (0-10) |
| `highlights` | `number` | `5` | Highlight intensity (0-10) |
| `grainIntensity` | `number` | `0` | Film grain amount (0-1) |
| `grainScale` | `number` | `2` | Grain size |
| `grainSpeed` | `number` | `1` | Grain animation speed |
| `wireframe` | `boolean` | `false` | Show wireframe mesh |

### Background

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `backgroundColor` | `string` | `"#FFFFFF"` | Background color (hex) |
| `backgroundAlpha` | `number` | `1` | Background opacity (0-1) |

### Performance

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resolution` | `number` | `1` | Mesh resolution (0.1-2, lower = better performance) |

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

### Mouse Interaction

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mouseDistortionStrength` | `number` | `0` | Mouse ripple intensity (0-1) |
| `mouseDistortionRadius` | `number` | `0.25` | Mouse effect radius |
| `mouseDecayRate` | `number` | `0.96` | How fast mouse trails fade (0.9-0.99) |
| `mouseDarken` | `number` | `0` | Darken area under mouse (0-1) |

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
| `proceduralBackgroundColor` | `string` | `"#000000"` | Texture void color |
| `textureShapeTriangles` | `number` | `20` | Number of triangle shapes |
| `textureShapeCircles` | `number` | `15` | Number of circle shapes |
| `textureShapeBars` | `number` | `15` | Number of bar shapes |
| `textureShapeSquiggles` | `number` | `10` | Number of squiggle shapes |

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

// Effects
gradient.grainIntensity = 0.5;
gradient.mouseDistortionStrength = 0.3;

// Texture
gradient.enableProceduralTexture = true;
gradient.textureEase = 0.7;
```

---

## 💡 Tips & Best Practices

### Performance Optimization

1. **Lower resolution for better FPS:**
   ```typescript
   resolution: 0.5  // Half resolution = ~4x faster
   ```

2. **Disable features you don't need:**
   ```typescript
   speed: 0,              // Static gradient
   grainIntensity: 0,     // No grain effect
   flowEnabled: false,    // No flow distortion
   ```

3. **Use fewer colors:**
   - 3-4 colors = best performance
   - 6 colors = more complex but slower

### Design Tips

- **Subtle animations:** `speed: 2-3`, `waveAmplitude: 3-5`
- **Dramatic effects:** `speed: 5-8`, `waveAmplitude: 8-10`
- **Smooth blending:** Higher `colorBlending` values (7-10)
- **Sharp contrasts:** Lower `colorBlending` values (3-5)

### Common Use Cases

**Hero Background:**
```typescript
{
    colors: [/* your brand colors */],
    speed: 3,
    waveAmplitude: 5,
    shadows: 2,
    highlights: 7,
    grainIntensity: 0.1
}
```

**Subtle Page Background:**
```typescript
{
    colors: [/* muted pastels */],
    speed: 1,
    waveAmplitude: 2,
    colorBlending: 9,
    backgroundAlpha: 0.7
}
```

**Interactive Section:**
```typescript
{
    colors: [/* vibrant colors */],
    speed: 4,
    mouseDistortionStrength: 0.2,
    mouseDistortionRadius: 0.3,
    mouseDarken: 0.1
}
```

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

### Mouse-Reactive Gradients

```typescript
{
    mouseDistortionStrength: 0.3,   // Strong effect
    mouseDistortionRadius: 0.4,     // Large area
    mouseDecayRate: 0.94,           // Long trails
    mouseDarken: 0.2                // Subtle darkening
}
```

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

Neat uses WebGL shaders and three.js to render dynamic 3D gradients entirely on the GPU:

1. **Mesh Generation:** Creates a subdivided plane geometry
2. **Vertex Shader:** Displaces vertices to create waves using Perlin noise
3. **Fragment Shader:** Blends colors, applies flow fields, lighting, and effects
4. **Hardware Acceleration:** All computations run on the GPU for smooth 60fps animations

The result is a performant, beautiful gradient that can run on any modern device.

---

## 📄 License

Neat is released under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**.

**You can:**
- ✅ Use freely in personal projects
- ✅ Modify and redistribute (with attribution)
- ✅ Use in open-source projects

**Commercial use requires a license.** 

### Remove the NEAT Attribution Link

For commercial projects without attribution, [become a sponsor](https://github.com/sponsors/firecmsco) and contact us at [hello@firecms.co](mailto:hello@firecms.co) for a license key.

---

## 🙏 Credits

Created by [FireCMS](https://firecms.co) with ❤️

Built with [three.js](https://threejs.org/)

---

## 🐛 Issues & Contributing

Found a bug or have a feature request? 

- **Issues:** [GitHub Issues](https://github.com/FireCMSco/neat/issues)
- **Discussions:** [GitHub Discussions](https://github.com/FireCMSco/neat/discussions)

---

## 🔗 Links

- 🌐 [Website & Editor](https://neat.firecms.co)
- 📦 [npm Package](https://www.npmjs.com/package/@firecms/neat)
- 💻 [GitHub Repository](https://github.com/FireCMSco/neat)
- 💬 [Discord Community](https://discord.gg/fxy7xsQm3m)

---

**Made with ✨ by the FireCMS team**
