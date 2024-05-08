# Neat gradients

Create awesome 3D gradients with this library based on three.js.

Check the demo and gradients editor to find your perfect config here:
[https://neat.firecms.co/](https://neat.firecms.co/)

Neat is released under the CC license, so you can use it for free in your
projects,
commercial or not. You can also modify it and redistribute it, but you must keep
the license and the credits.

If you want to remove the NEAT link, you can reach us at hello@firecms.co

### Installation:

```
yarn install @firecms/neat three.js
```

or

```
npm install @firecms/neat three.js
```

### Usage:

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
    saturation: 7,
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

### How it works

Neat is a three.js library that generates a 3d gradient based on a config
object.

It uses a custom WebGL shader to generate a 3D shape that morphs and changes
its color based on the config.

All the computations are done on the GPU, so it's very fast and efficient.
