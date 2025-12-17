# Neat gradients

Create awesome 3D gradients with this library based on three.js.

Check the demo and gradients editor to find your perfect config here:
[https://neat.firecms.co/](https://neat.firecms.co/)

Neat is released under the CC license, so you can use it for free in your projects,
commercial or not. You can also modify it and redistribute it, but you must keep
the license and the credits.


## Installation

```bash
yarn add @firecms/neat three
```

or

```bash
npm install @firecms/neat three
```

## Usage

You can use the library to create a gradient in your website or application. You need to define a config and then 
create a new `NeatGradient` instance. You are encouraged to use the [gradients editor](https://neat.firecms.co/) to 
find your perfect config.


### Simple example

```typescript
import { NeatConfig, NeatGradient } from "@firecms/neat";

// Define your config
export const config: NeatConfig = {
    colors: [
        {
            color: "#FF5373",
            enabled: true
        },
        {
            color: "#FFC858",
            enabled: true
        },
        {
            color: "#17E7FF",
            enabled: true
        },
        {
            color: "#6D3BFF",
            enabled: true
        },
        {
            color: "#f5e1e5",
            enabled: false
        }
    ],
    speed: 4,
    horizontalPressure: 4,
    verticalPressure: 5,
    waveFrequencyX: 2,
    waveFrequencyY: 3,
    waveAmplitude: 5,
    shadows: 0,
    highlights: 2,
    colorSaturation: 7,
    colorBrightness: 1,
    wireframe: false,
    colorBlending: 6,
    backgroundColor: "#003FFF",
    backgroundAlpha: 1
};


// define an element with id="gradient" in your html
const neat = new NeatGradient({
    ref: document.getElementById("gradient"),
    ...config
});

// you can change the config at any time
neat.speed = 6;

// you can also destroy the gradient for cleanup
// e.g. returning from a useEffect hook in React
neat.destroy();
```

### React example

```tsx
import React, { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

export const MyComponent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const gradient = new NeatGradient({
            ref: canvasRef.current,
            colors: [
                { color: "#FF5373", enabled: true },
                { color: "#FFC858", enabled: true },
                { color: "#05d5ef", enabled: true },
                { color: "#6D3BFF", enabled: true },
                { color: "#f5e1e5", enabled: false }
            ],
            speed: 4,
            horizontalPressure: 4,
            verticalPressure: 5,
            waveFrequencyX: 2,
            waveFrequencyY: 3,
            waveAmplitude: 5,
            shadows: 0,
            highlights: 1,
            colorSaturation: 0,
            colorBrightness: 1,
            wireframe: false,
            colorBlending: 6,
            backgroundColor: "#003FFF",
            backgroundAlpha: 1,
            resolution: 0.5
        });

        return gradient.destroy;
    }, []);

    return (
        <canvas
            style={{
                isolation: "isolate",
                height: "100%",
                width: "100%",
            }}
            ref={canvasRef}
        />
    );
};
```

## Configuration Parameters

### Required Parameters

#### `ref`
- **Type:** `HTMLCanvasElement`
- **Description:** The canvas element where the gradient will be rendered
- **Required:** Yes

#### `colors`
- **Type:** `NeatColor[]`
- **Description:** Array of color objects that define the gradient palette
- **Required:** Yes
- **Color Object Properties:**
  - `color` (string): Hex color value (e.g., "#FF5373")
  - `enabled` (boolean): Whether the color is active in the gradient
  - `influence` (number, optional): Value from 0 to 1 controlling color strength

### Animation Parameters

#### `speed`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 4
- **Description:** Animation speed. Set to 0 to pause all animations (waves and flow).

### Color Pressure Parameters
*Note: These are disabled when `enableProceduralTexture` is true*

#### `horizontalPressure`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 3
- **Description:** Horizontal color distribution intensity

#### `verticalPressure`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 3
- **Description:** Vertical color distribution intensity

#### `colorBlending`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 5
- **Description:** How smoothly colors blend together

### Wave Parameters
*Note: Requires `speed > 0` to be visible*

#### `waveFrequencyX`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 5
- **Description:** Horizontal wave frequency

#### `waveFrequencyY`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 5
- **Description:** Vertical wave frequency

#### `waveAmplitude`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 3
- **Description:** Wave height/intensity

### Visual Effects Parameters

#### `shadows`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 4
- **Description:** Intensity of shadow effects

#### `highlights`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 4
- **Description:** Intensity of highlight effects

#### `colorSaturation`
- **Type:** `number`
- **Range:** -10 to 10
- **Default:** 0
- **Description:** Color saturation adjustment (negative values desaturate)

#### `colorBrightness`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 1
- **Description:** Overall brightness multiplier

### Grain Parameters

#### `grainIntensity`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.55
- **Description:** Strength of film grain effect. Set to 0 to disable grain.

#### `grainScale`
- **Type:** `number`
- **Range:** 0 to 100
- **Default:** 2
- **Description:** Size of grain particles

#### `grainSparsity`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.0
- **Description:** How sparse/scattered the grain appears

#### `grainSpeed`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 0.1
- **Description:** Animation speed of grain particles

### Shape Parameters

#### `resolution`
- **Type:** `number`
- **Range:** 0.05 to 2
- **Default:** 1
- **Description:** Mesh density/quality. Lower values improve performance but reduce visual quality.

#### `wireframe`
- **Type:** `boolean`
- **Default:** false
- **Description:** Show the 3D mesh structure. When enabled, colors, grain, and texture effects are less visible.

#### `yOffset`
- **Type:** `number`
- **Range:** 0 to 100000
- **Default:** 0
- **Description:** Vertical offset for scroll-based effects

#### `yOffsetWaveMultiplier`
- **Type:** `number`
- **Range:** 0 to 20
- **Default:** 4
- **Description:** How much vertical offset affects wave animation

#### `yOffsetColorMultiplier`
- **Type:** `number`
- **Range:** 0 to 20
- **Default:** 4
- **Description:** How much vertical offset affects color distribution

#### `yOffsetFlowMultiplier`
- **Type:** `number`
- **Range:** 0 to 20
- **Default:** 4
- **Description:** How much vertical offset affects flow field

### Background Parameters

#### `backgroundColor`
- **Type:** `string`
- **Default:** "#FFFFFF"
- **Description:** Hex color for the background

#### `backgroundAlpha`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 1.0
- **Description:** Background opacity (0 = transparent, 1 = opaque)

### Flow Field Parameters
*Note: Requires `speed > 0` and `flowEnabled: true`*

#### `flowEnabled`
- **Type:** `boolean`
- **Default:** true
- **Description:** Enable/disable flow field distortion

#### `flowDistortionA`
- **Type:** `number`
- **Range:** 0 to 5
- **Default:** 0
- **Description:** Wave amplitude for flow distortion

#### `flowDistortionB`
- **Type:** `number`
- **Range:** 0 to 10
- **Default:** 0
- **Description:** Wave frequency for flow distortion

#### `flowScale`
- **Type:** `number`
- **Range:** 0 to 5
- **Default:** 1.0
- **Description:** Scale of the flow field waves

#### `flowEase`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.0
- **Description:** Blend between original and flow-distorted state

### Mouse Interaction Parameters

#### `mouseDistortionStrength`
- **Type:** `number`
- **Range:** 0 to 2.0
- **Default:** 0.0
- **Description:** Strength of mouse-driven distortion. Set to 0 to disable.

#### `mouseDistortionRadius`
- **Type:** `number`
- **Range:** 0.05 to 2.0
- **Default:** 0.25
- **Description:** Radius/area of mouse distortion effect

#### `mouseDecayRate`
- **Type:** `number`
- **Range:** 0.90 to 0.99
- **Default:** 0.96
- **Description:** How quickly mouse trails fade (0.9 = slow/wobbly, 0.99 = fast/sharp)

#### `mouseDarken`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.0
- **Description:** Darkening effect at mouse interaction points

### Procedural Texture Parameters
*Note: When enabled, replaces color pressure controls*

#### `enableProceduralTexture`
- **Type:** `boolean`
- **Default:** false
- **Description:** Enable procedurally generated texture overlay

#### `textureVoidLikelihood`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.45
- **Description:** Frequency of gaps/voids in texture bands

#### `textureVoidWidthMin`
- **Type:** `number`
- **Range:** 10 to 200
- **Default:** 200
- **Description:** Minimum width of texture gaps in pixels

#### `textureVoidWidthMax`
- **Type:** `number`
- **Range:** 50 to 600
- **Default:** 486
- **Description:** Maximum width of texture gaps in pixels

#### `textureBandDensity`
- **Type:** `number`
- **Range:** 0.1 to 3
- **Default:** 2.15
- **Description:** Density of texture bands

#### `textureColorBlending`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.01
- **Description:** Color blending within texture

#### `textureSeed`
- **Type:** `number`
- **Range:** 0 to 1000
- **Default:** 333
- **Description:** Random seed for texture generation (change for different patterns)

#### `textureEase`
- **Type:** `number`
- **Range:** 0 to 1
- **Default:** 0.5
- **Description:** Blend between flow field and procedural texture (0 = flow, 1 = texture)

#### `proceduralBackgroundColor`
- **Type:** `string`
- **Default:** "#000000"
- **Description:** Hex color for texture void/gap areas

#### `textureShapeTriangles`
- **Type:** `number`
- **Range:** 0 to 100
- **Default:** 20
- **Description:** Number of triangle shapes in texture

#### `textureShapeCircles`
- **Type:** `number`
- **Range:** 0 to 100
- **Default:** 15
- **Description:** Number of circle shapes in texture

#### `textureShapeBars`
- **Type:** `number`
- **Range:** 0 to 100
- **Default:** 15
- **Description:** Number of bar shapes in texture

#### `textureShapeSquiggles`
- **Type:** `number`
- **Range:** 0 to 100
- **Default:** 10
- **Description:** Number of squiggle/wavy shapes in texture

## Tips

- Use the [online editor](https://neat.firecms.co/) to visually design your gradient and export the configuration
- Start with lower `resolution` values (0.5-1.0) for better performance, especially on mobile devices
- Set `speed: 0` to create static gradients without animation
- Combine `yOffset` with scroll position for scroll-based gradient effects
- Enable `wireframe: true` during development to understand the 3D mesh structure
- Procedural textures work best with `textureEase` values between 0.3 and 0.7
- For subtle effects, keep `mouseDistortionStrength` below 0.5

## NEAT Link

If you want to remove the NEAT link, you can reach us at hello@firecms.co
