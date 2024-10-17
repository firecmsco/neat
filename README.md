# Neat gradients

Create awesome 3D gradients with this library based on three.js.

Check the demo and gradients editor to find your perfect config here:
[https://neat.firecms.co/](https://neat.firecms.co/)

Neat is released under the CC license, so you can use it for free in your
projects,
commercial or not. You can also modify it and redistribute it, but you must keep
the license and the credits.


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
    "colors": [
        {
            "color": "#FF5772",
            "enabled": true
        },
        {
            "color": "#4CB4BB",
            "enabled": true
        },
        {
            "color": "#FFC600",
            "enabled": true
        },
        {
            "color": "#8B6AE6",
            "enabled": true
        },
        {
            "color": "#2E0EC7",
            "enabled": true
        }
    ],
    "speed": 4,
    "horizontalPressure": 3,
    "verticalPressure": 4,
    "waveFrequencyX": 3,
    "waveFrequencyY": 3,
    "waveAmplitude": 8,
    "shadows": 1,
    "highlights": 5,
    "colorBrightness": 1,
    "colorSaturation": 7,
    "wireframe": false,
    "colorBlending": 8,
    "backgroundColor": "#003FFF",
    "backgroundAlpha": 1,
    "grainScale": 3,
    "grainIntensity": 0.3,
    "grainSpeed": 1,
    "resolution": 1
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

### Remove the NEAT link

If you want to remove the NEAT link, you can make a donation to the project
in the following link:
[https://github.com/sponsors/firecmsco](https://github.com/sponsors/firecmsco)
Then reach out to us at [hello@firecms.co](mailto:hello@firecms.co) and we will
send you a license key to remove the link.

### How it works

Neat is a three.js library that generates a 3d gradient based on a config
object.

It uses a custom WebGL shader to generate a 3D shape that morphs and changes
its color based on the config.

All the computations are done on the GPU, so it's very fast and efficient.
