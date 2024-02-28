# Neat gradients

Create awesome 3d gradients with this library based on three.js.

Check the demo and gradients editor to find your perfect config here:
[https://neat.firecms.co/](https://neat.firecms.co/)

Neat is released under the CC license, so you can use it for free in your projects,
commercial or not. You can also modify it and redistribute it, but you must keep
the license and the credits. 


## Installation:

```
yarn install @firecms/neat three.js
```

or

```
npm install @firecms/neat three.js
```

## Usage:

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
    speed: 4, // from 0 to 10
    horizontalPressure: 4, // from 0 to 10
    verticalPressure: 5, // from 0 to 10
    waveFrequencyX: 2, // from 0 to 10
    waveFrequencyY: 3, // from 0 to 10
    waveAmplitude: 5, // from 0 to 10
    shadows: 0, // from 0 to 10
    highlights: 2, // from 0 to 10
    saturation: 7, // from -10 to 10
    wireframe: false,
    colorBlending: 6, // from 0 to 10
    backgroundColor: "#003FFF",
    backgroundAlpha: 1 // from 0 to 1
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
import React, { useEffect, useRef, useState } from "react";
import { NeatConfig, NeatGradient } from "@firecms/neat";

export const MyComponent: React.FC = () => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gradientRef = useRef<NeatGradient | null>(null);

    useEffect(() => {

        if (!canvasRef.current)
            return;

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            "colors": [
                {
                    "color": "#FF5373",
                    "enabled": true
                },
                {
                    "color": "#FFC858",
                    "enabled": true
                },
                {
                    "color": "#05d5ef",
                    "enabled": true
                },
                {
                    "color": "#6D3BFF",
                    "enabled": true
                },
                {
                    "color": "#f5e1e5",
                    "enabled": false
                }
            ],
            "speed": 4,
            "horizontalPressure": 4,
            "verticalPressure": 5,
            "waveFrequencyX": 2,
            "waveFrequencyY": 3,
            "waveAmplitude": 5,
            "shadows": 0,
            "highlights": 1,
            "colorSaturation":  0,
            "colorBrightness":  1,
            "wireframe": true,
            "colorBlending": 6,
            "backgroundAlpha": 0,
            "resolution": 1 / 2
        });

        return gradientRef.current.destroy;

    }, [canvasRef.current]);

    return (
        <canvas
            className={bgColor}
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


### NEAT link

If you want to remove the NEAT link, you can reach us at hello@firecms.co
