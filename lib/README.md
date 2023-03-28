# Neat gradients

Create awesome 3d gradients with this library based on three.js.

Check the demo and gradients editor to find your perfect config here:
[https://neat.camberi.com/](https://neat.camberi.com/)

Neat is released under the CC license, so you can use it for free in your projects,
commercial or not. You can also modify it and redistribute it, but you must keep
the license and the credits. 

If you want to remove the Camberi link, you can reach us at hello@camberi.com

### Installation:

```
yarn install @camberi/neat three.js
```

or

```
npm install @camberi/neat three.js
```

### Usage:


```typescript
import { NeatConfig, NeatGradient } from "@camberi/neat";

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