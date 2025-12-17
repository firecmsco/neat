import { NeatConfig } from "@firecms/neat";

export const NEAT_PRESET = {
    colors: [
        {
            color: '#FF5772',
            enabled: true,
        },
        {
            color: '#4CB4BB',
            enabled: true,
        },
        {
            color: '#FFC600',
            enabled: true,
        },
        {
            color: '#8B6AE6',
            enabled: true,
        },
        {
            color: '#2E0EC7',
            enabled: true,
        },
        {
            color: '#FF9A9E',
            enabled: true,
        },
    ],
    speed: 2.5,
    horizontalPressure: 3,
    verticalPressure: 4,
    waveFrequencyX: 2,
    waveFrequencyY: 3,
    waveAmplitude: 5,
    shadows: 1,
    highlights: 5,
    colorBrightness: 1,
    colorSaturation: 7,
    wireframe: false,
    colorBlending: 8,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0.0,
    grainIntensity: 0,
    grainSpeed: 1,
    resolution: 1,
    yOffsetWaveMultiplier: 4,
    yOffsetColorMultiplier: 4,
    yOffsetFlowMultiplier: 4,
    enableProceduralTexture: false,
    textureEase: 0.5,
    flowEnabled: true,
} satisfies NeatConfig;

export const STRIPE_PRESET = {
    colors: [
        {
            color: '#FD113F',
            enabled: true,

        },
        {
            color: '#90E0FF',
            enabled: true,
        },
        {
            color: '#FFC858',
            enabled: true,
        },
        {
            color: '#753BFF',
            enabled: true,
        },
        {
            color: '#f5e1e5',
            enabled: false,
        },
        {
            color: '#B8D4E6',
            enabled: false,
        },
    ],
    speed: 2,
    horizontalPressure: 5,
    verticalPressure: 6,
    waveFrequencyX: 1,
    waveFrequencyY: 2,
    waveAmplitude: 10,
    shadows: 0,
    highlights: 7,
    colorBrightness: 1.05,
    colorSaturation: 0,
    wireframe: false,
    colorBlending: 9,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 0,
    grainIntensity: 0,
    grainSpeed: 0,
    resolution: 1,
    yOffsetWaveMultiplier: 6.5,
    yOffsetColorMultiplier: 5,
    yOffsetFlowMultiplier: 3,
    enableProceduralTexture: false,
    textureEase: 0.4,
    flowEnabled: false,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
} satisfies NeatConfig;

export const FIRECMS_PRESET = {
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
            "color": "#17E7FF",
            "enabled": true
        },
        {
            "color": "#6D3BFF",
            "enabled": true
        },
        {
            "color": "#f5e1e5",
            "enabled": false
        },
        {
            "color": "#A8E6CF",
            "enabled": false
        }
    ],
    "speed": 2,
    "horizontalPressure": 2,
    "verticalPressure": 5,
    "waveFrequencyX": 2,
    "waveFrequencyY": 2,
    "waveAmplitude": 5,
    "shadows": 10,
    "highlights": 8,
    "colorBrightness": 1,
    "colorSaturation": 10,
    "wireframe": true,
    "colorBlending": 6,
    "backgroundColor": "#003FFF",
    "backgroundAlpha": 1,
    "grainScale": 0,
    grainSparsity: 0,
    "grainIntensity": 0,
    "grainSpeed": 0,
    "resolution": 0.95,
    yOffsetWaveMultiplier: 3.5,
    yOffsetColorMultiplier: 3.5,
    yOffsetFlowMultiplier: 3.5,
    enableProceduralTexture: false,
    textureEase: 0.6,
    flowEnabled: false,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};
export const FUNKY_PRESET = {
    colors: [
        {
            color: '#FB5066',
            enabled: true,
        },
        {
            color: '#36CCD6',
            enabled: true,
        },
        {
            color: '#FFC600',
            enabled: true,
        },
        {
            color: '#8B6AE6',
            enabled: true,
        },
        {
            color: '#2E0EC7',
            enabled: true,
        },
        {
            color: '#FF9A9E',
            enabled: true,
        },
    ],
    speed: 1,
    horizontalPressure: 3,
    verticalPressure: 3,
    waveFrequencyX: 3,
    waveFrequencyY: 5,
    waveAmplitude: 10,
    shadows: 2,
    highlights: 6,
    colorBrightness: 1.05,
    colorSaturation: 1,
    wireframe: false,
    colorBlending: 3,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 2.4,
    resolution: 0.1,
    yOffset: 0,
    yOffsetWaveMultiplier: 7.2,
    yOffsetColorMultiplier: 6.8,
    yOffsetFlowMultiplier: 8.5,
    flowDistortionA: 1,
    flowDistortionB: 1.9,
    flowScale: 1.4,
    flowEase: 0.94,
    flowEnabled: true,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
    mouseDarken: 0.24,
    enableProceduralTexture: true,
    textureVoidLikelihood: 0.59,
    textureVoidWidthMin: 120,
    textureVoidWidthMax: 330,
    textureBandDensity: 0.1,
    textureColorBlending: 0,
    textureSeed: 478,
    textureEase: 0.86,
    proceduralBackgroundColor: '#003FFF',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
};

export const FLUID_PRESET = {
    colors: [
        {
            color: '#899D99',
            enabled: true,
        },
        {
            color: '#5f2727',
            enabled: true,
        },
        {
            color: '#373c38',
            enabled: true,
        },
        {
            color: '#0099bb',
            enabled: true,
        },
        {
            color: '#303B42',
            enabled: true,
        },
        {
            color: '#2E7075',
            enabled: true,
        },
    ],
    speed: 1.5,
    horizontalPressure: 5,
    verticalPressure: 4,
    waveFrequencyX: 4,
    waveFrequencyY: 5,
    waveAmplitude: 0,
    shadows: 4,
    highlights: 4,
    colorBrightness: 1,
    colorSaturation: 0,
    wireframe: true,
    colorBlending: 3,
    backgroundColor: '#202020',
    backgroundAlpha: 0.95,
    grainScale: 2,
    grainSparsity: 0,
    grainIntensity: 0.575,
    grainSpeed: 0.1,
    resolution: 0.7,
    yOffset: 0,
    flowDistortionA: 3.7,
    flowDistortionB: 1.4,
    flowScale: 2.9,
    flowEase: 0.32,
    flowEnabled: true,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.37,
    mouseDecayRate: 0.921,
    mouseDarken: 0.24,
    enableProceduralTexture: true,
    textureVoidLikelihood: 0.27,
    textureVoidWidthMin: 60,
    textureVoidWidthMax: 420,
    textureBandDensity: 1.2,
    textureColorBlending: 0.06,
    textureSeed: 333,
    textureEase: 1,
    proceduralBackgroundColor: '#0E0707',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    yOffsetWaveMultiplier: 5.5,
    yOffsetColorMultiplier: 5.2,
    yOffsetFlowMultiplier: 6.0,
};

export const YEX_PRESET = {
    colors: [
        {
            color: '#FF5772',
            enabled: true,
        },
        {
            color: '#4CB4BB',
            enabled: true,
        },
        {
            color: '#FFC600',
            enabled: true,
        },
        {
            color: '#8B6AE6',
            enabled: true,
        },
        {
            color: '#2E0EC7',
            enabled: true,
        },
        {
            color: '#FF9A9E',
            enabled: true,
        },
    ],
    speed: 1,
    horizontalPressure: 3,
    verticalPressure: 3,
    waveFrequencyX: 3,
    waveFrequencyY: 2,
    waveAmplitude: 7,
    shadows: 3,
    highlights: 4,
    colorBrightness: 1.05,
    colorSaturation: -2,
    wireframe: true,
    colorBlending: 4,
    backgroundColor: '#4A3805',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 2.4,
    resolution: 0.5,
    yOffset: 162,
    flowDistortionA: 1.2,
    flowDistortionB: 2.4,
    flowScale: 1.5,
    flowEase: 0.41,
    flowEnabled: true,
    mouseDistortionStrength: 0.38,
    mouseDistortionRadius: 0.05,
    mouseDecayRate: 0.97,
    mouseDarken: 0.24,
    enableProceduralTexture: true,
    textureVoidLikelihood: 0.06,
    textureVoidWidthMin: 10,
    textureVoidWidthMax: 500,
    textureBandDensity: 0.8,
    textureColorBlending: 0.06,
    textureSeed: 333,
    textureEase: 0.42,
    proceduralBackgroundColor: '#FFED00',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    yOffsetWaveMultiplier: 3.8,
    yOffsetColorMultiplier: 4.2,
    yOffsetFlowMultiplier: 5.5,
}

export const VIRUS_PRESET = {
    colors: [
        {
            color: '#FB5066',
            enabled: true,
        },
        {
            color: '#00EFFF',
            enabled: true,
        },
        {
            color: '#0F0635',
            enabled: true,
        },
        {
            color: '#8B6AE6',
            enabled: true,
        },
        {
            color: '#0F0635',
            enabled: true,
        },
        {
            color: '#FBFF00',
            enabled: true,
        },
    ],
    speed: 2,
    horizontalPressure: 3,
    verticalPressure: 3,
    waveFrequencyX: 1,
    waveFrequencyY: 0,
    waveAmplitude: 2,
    shadows: 2,
    highlights: 6,
    colorBrightness: 1.05,
    colorSaturation: 3,
    wireframe: false,
    colorBlending: 3,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 5,
    grainSparsity: 0.1,
    grainIntensity: 0.25,
    grainSpeed: 2.4,
    resolution: 0.35,
    yOffset: 123759.5,
    yOffsetWaveMultiplier: 9.5,
    yOffsetColorMultiplier: 13.7,
    yOffsetFlowMultiplier: 9.9,
    flowDistortionA: 2.2,
    flowDistortionB: 0.8,
    flowScale: 1.2,
    flowEase: 0.79,
    flowEnabled: true,
    mouseDistortionStrength: 0.89,
    mouseDistortionRadius: 0.4,
    mouseDecayRate: 0.96,
    mouseDarken: 0.24,
    enableProceduralTexture: true,
    textureVoidLikelihood: 0.44,
    textureVoidWidthMin: 140,
    textureVoidWidthMax: 150,
    textureBandDensity: 1.9,
    textureColorBlending: 0.12,
    textureSeed: 333,
    textureEase: 0.3,
    proceduralBackgroundColor: '#D0DBFB',
    textureShapeTriangles: 46,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
}

export const FLAME_PRESET = {
    "colors": [
        {
            "color": "#FF0069",
            "enabled": true
        },
        {
            "color": "#00EAFF",
            "enabled": true
        },
        {
            "color": "#FFB700",
            "enabled": true
        },
        {
            "color": "#B26AE6",
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
    "waveFrequencyX": 10,
    "waveFrequencyY": 0,
    "waveAmplitude": 10,
    "shadows": 5,
    "highlights": 10,
    "colorBrightness": 1,
    "colorSaturation": 2,
    "wireframe": false,
    "colorBlending": 9,
    "backgroundColor": "#003FFF",
    "backgroundAlpha": 1,
    "grainScale": 2,
    grainSparsity: 0,
    "grainIntensity": 0.05,
    "grainSpeed": 1,
    "resolution": 0.5,
    yOffsetWaveMultiplier: 8.5,
    yOffsetColorMultiplier: 7.8,
    yOffsetFlowMultiplier: 9.0,
    enableProceduralTexture: false,
    textureEase: 0.25,
    flowEnabled: true,
};

export const BLOOM_PRESET = {
    "colors": [
        {
            "color": "#FF0A39",
            "enabled": true
        },
        {
            "color": "#FFC858",
            "enabled": true
        },
        {
            "color": "#17E7FF",
            "enabled": true
        },
        {
            "color": "#4A21FF",
            "enabled": true
        },
        {
            "color": "#f5e1e5",
            "enabled": false
        }
    ],
    "speed": 4,
    "horizontalPressure": 6,
    "verticalPressure": 6,
    "waveFrequencyX": 0,
    "waveFrequencyY": 0,
    "waveAmplitude": 0,
    "shadows": 0,
    "highlights": 0,
    "colorBrightness": 1.95,
    "colorSaturation": 10,
    "wireframe": false,
    "colorBlending": 6,
    "backgroundColor": "#003FFF",
    "backgroundAlpha": 1,
    "grainScale": 0,
    grainSparsity: 0,
    "grainIntensity": 0,
    "grainSpeed": 0,
    "resolution": 1,
    yOffsetWaveMultiplier: 3.2,
    yOffsetColorMultiplier: 3.5,
    yOffsetFlowMultiplier: 4.0,
    enableProceduralTexture: false,
    textureEase: 0.65,
    flowEnabled: true,
};
export const SANDS_PRESET = {
    colors: [
        {
            color: '#AD6C1F',
            enabled: true,
        },
        {
            color: '#4CB4BB',
            enabled: true,
        },
        {
            color: '#FFC600',
            enabled: true,
        },
        {
            color: '#835C51',
            enabled: true,
        },
        {
            color: '#836803',
            enabled: true,
        },
    ],
    speed: 1,
    horizontalPressure: 3,
    verticalPressure: 10,
    waveFrequencyX: 2,
    waveFrequencyY: 4,
    waveAmplitude: 8,
    shadows: 1,
    highlights: 5,
    colorBrightness: 1,
    colorSaturation: 7,
    wireframe: false,
    colorBlending: 8,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 3,
    grainSparsity: 0,
    grainIntensity: 0.3,
    grainSpeed: 5,
    resolution: 1,
    yOffsetWaveMultiplier: 2.8,
    yOffsetColorMultiplier: 3.0,
    yOffsetFlowMultiplier: 2.5,
    enableProceduralTexture: false,
    textureEase: 0.55,
    flowEnabled: false,
    mouseDistortionStrength: 0.08,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const MONTEREY_PRESET = {
    colors: [
        {
            color: '#130437',
            enabled: true,
        },
        {
            color: '#B34BD0',
            enabled: true,
        },
        {
            color: '#210751',
            enabled: true,
        },
        {
            color: '#3511A5',
            enabled: true,
        },
        {
            color: '#8F3E8D',
            enabled: false,
        },
        {
            color: '#FF9A9E',
            enabled: false,
        },
    ],
    speed: 4,
    horizontalPressure: 7,
    verticalPressure: 3,
    waveFrequencyX: 0,
    waveFrequencyY: 0,
    waveAmplitude: 0,
    shadows: 4,
    highlights: 0,
    colorBrightness: 1.95,
    colorSaturation: 2,
    wireframe: false,
    colorBlending: 9,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 6,
    grainSparsity: 0,
    grainIntensity: 0.125,
    grainSpeed: 0,
    resolution: 1.15,
    yOffset: 150,
    flowDistortionA: 0.4,
    flowDistortionB: 10,
    flowScale: 3.3,
    flowEase: 0.37,
    mouseDistortionStrength: 0.15,
    mouseDarken: 0.24,
    enableProceduralTexture: false,
    textureVoidLikelihood: 0.06,
    textureVoidWidthMin: 10,
    textureVoidWidthMax: 500,
    textureBandDensity: 0.8,
    textureColorBlending: 0.06,
    textureSeed: 333,
    textureEase: 0.38,
    proceduralBackgroundColor: '#003FFF',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    yOffsetWaveMultiplier: 4.5,
    yOffsetColorMultiplier: 4.8,
    yOffsetFlowMultiplier: 5.2,
    flowEnabled: true,
};

export const ALEJANDRA_PRESET = {
    colors: [
        {
            color: '#FF5373',
            enabled: true,
        },
        {
            color: '#17E7FF',
            enabled: true,
        },
        {
            color: '#FFC858',
            enabled: true,
        },
        {
            color: '#6D3BFF',
            enabled: true,
        },
        {
            color: '#f5e1e5',
            enabled: false,
        },
    ],
    speed: 6,
    horizontalPressure: 7,
    verticalPressure: 8,
    waveFrequencyX: 1,
    waveFrequencyY: 2,
    waveAmplitude: 8,
    shadows: 4,
    highlights: 6,
    colorBrightness: 0.95,
    colorSaturation: -8,
    wireframe: false,
    colorBlending: 10,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 4,
    grainSparsity: 0,
    grainIntensity: 0.25,
    grainSpeed: 1,
    resolution: 1,
    yOffset: 0,
    flowDistortionA: 1.1,
    flowDistortionB: 0.8,
    flowScale: 1.6,
    flowEase: 0.32,
    flowEnabled: true,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
    mouseDarken: 0.24,
    enableProceduralTexture: false,
    textureVoidLikelihood: 0.27,
    textureVoidWidthMin: 60,
    textureVoidWidthMax: 420,
    textureBandDensity: 1.2,
    textureColorBlending: 0.06,
    textureSeed: 333,
    textureEase: 0.22,
    proceduralBackgroundColor: '#0E0707',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    yOffsetWaveMultiplier: 6.2,
    yOffsetColorMultiplier: 5.8,
    yOffsetFlowMultiplier: 6.5,
};

export const LEMON_PRESET = {
    "colors": [
        {
            "color": "#F2FF00",
            "enabled": true
        },
        {
            "color": "#6B00FF",
            "enabled": true
        },
        {
            "color": "#D5ECEB",
            "enabled": true
        },
        {
            "color": "#E4E4E4",
            "enabled": false
        },
        {
            "color": "#F6FFFF",
            "enabled": false
        }
    ],
    "speed": 4,
    "horizontalPressure": 4,
    "verticalPressure": 5,
    "waveFrequencyX": 1,
    "waveFrequencyY": 2,
    "waveAmplitude": 10,
    "shadows": 4,
    "highlights": 7,
    "colorBrightness": 1,
    "colorSaturation": 0,
    "wireframe": false,
    "colorBlending": 7,
    "backgroundColor": "#00A2FF",
    "backgroundAlpha": 1,
    "grainScale": 4,
    grainSparsity: 0,
    "grainIntensity": 0.2,
    "grainSpeed": 2.2,
    "resolution": 0.65,
    yOffsetWaveMultiplier: 5.0,
    yOffsetColorMultiplier: 4.5,
    yOffsetFlowMultiplier: 5.5,
    enableProceduralTexture: false,
    textureEase: 0.48,
    flowEnabled: true,
}

export const GLITCH_PRESET = {
    "colors": [
        {
            "color": "#F9F27A",
            "enabled": true
        },
        {
            "color": "#FFAB00",
            "enabled": true
        },
        {
            "color": "#17E7FF",
            "enabled": true
        },
        {
            "color": "#FF0003",
            "enabled": true
        },
        {
            "color": "#671424",
            "enabled": false
        }
    ],
    "speed": 4,
    "horizontalPressure": 4,
    "verticalPressure": 9,
    "waveFrequencyX": 0,
    "waveFrequencyY": 6,
    "waveAmplitude": 10,
    "shadows": 0,
    "highlights": 10,
    "colorBrightness": 1,
    "colorSaturation": 7,
    "wireframe": true,
    "colorBlending": 7,
    "backgroundColor": "#3600FF",
    "backgroundAlpha": 1,
    "grainScale": 0,
    grainSparsity: 0,
    "grainIntensity": 0,
    "grainSpeed": 0,
    "resolution": 1.2,
    yOffsetWaveMultiplier: 11.5,
    yOffsetColorMultiplier: 10.8,
    yOffsetFlowMultiplier: 12.0,
    enableProceduralTexture: false,
    textureEase: 0.15,
    flowEnabled: true,
}
export const PASTEL_PRESET = {
    colors: [
        {
            color: '#cdb4db',
            enabled: true,
        },
        {
            color: '#ffc8dd',
            enabled: true,
        },
        {
            color: '#ffafcc',
            enabled: true,
        },
        {
            color: '#bde0fe',
            enabled: true,
        },
        {
            color: '#a2d2ff',
            enabled: false,
        },
    ],
    speed: 4,
    horizontalPressure: 4,
    verticalPressure: 6,
    waveFrequencyX: 2,
    waveFrequencyY: 4,
    waveAmplitude: 6,
    shadows: 0,
    highlights: 4,
    colorBrightness: 1,
    colorSaturation: 3,
    wireframe: false,
    colorBlending: 5,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 0,
    resolution: 1,
    yOffsetWaveMultiplier: 2.5,
    yOffsetColorMultiplier: 2.8,
    yOffsetFlowMultiplier: 3.2,
    enableProceduralTexture: false,
    textureEase: 0.72,
    flowEnabled: true,
};

export const CLOUDS_PRESET = {
    colors: [
        {
            color: '#FFFFFF',
            enabled: true,
        },
        {
            color: '#EFE2CE',
            enabled: true,
        },
        {
            color: '#D5ECEB',
            enabled: true,
        },
        {
            color: '#E4E4E4',
            enabled: true,
        },
        {
            color: '#F6FFFF',
            enabled: true,
        },
    ],
    speed: 2,
    horizontalPressure: 4,
    verticalPressure: 5,
    waveFrequencyX: 4,
    waveFrequencyY: 3,
    waveAmplitude: 2,
    shadows: 4,
    highlights: 7,
    colorBrightness: 1,
    colorSaturation: 0,
    wireframe: false,
    colorBlending: 7,
    backgroundColor: '#00A2FF',
    backgroundAlpha: 1,
    grainScale: 100,
    grainSparsity: 0,
    grainIntensity: 0.05,
    grainSpeed: 0.3,
    resolution: 0.5,
    yOffset: 150,
    flowDistortionA: 0.4,
    flowDistortionB: 3,
    flowScale: 3.3,
    flowEase: 0.53,
    flowEnabled: true,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
    mouseDarken: 0.24,
    enableProceduralTexture: false,
    textureVoidLikelihood: 0.06,
    textureVoidWidthMin: 10,
    textureVoidWidthMax: 500,
    textureBandDensity: 0.8,
    textureColorBlending: 0.06,
    textureSeed: 333,
    proceduralBackgroundColor: '#003FFF',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
};

export const DARK_MODE = {
    colors: [
        {
            color: '#000000',
            enabled: true,
        },
        {
            color: '#001129',
            enabled: true,
        },
        {
            color: '#0F0025',
            enabled: true,
        },
        {
            color: '#14080A',
            enabled: true,
        },
        {
            color: '#001129',
            enabled: true,
        },
    ],
    speed: 2,
    horizontalPressure: 4,
    verticalPressure: 4,
    waveFrequencyX: 3,
    waveFrequencyY: 2,
    waveAmplitude: 1,
    shadows: 2,
    highlights: 2,
    colorBrightness: 1,
    colorSaturation: -1,
    wireframe: false,
    colorBlending: 7,
    backgroundColor: '#010101',
    backgroundAlpha: 1,
    grainScale: 2,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 1,
    resolution: 0.75,
    yOffset: 0,
    yOffsetWaveMultiplier: 2.2,
    yOffsetColorMultiplier: 2.5,
    yOffsetFlowMultiplier: 2.8,
    enableProceduralTexture: false,
    textureEase: 0.68,
    flowEnabled: false,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const NIGHT_DUNES = {
    colors: [
        {
            color: '#554226',
            enabled: true,
        },
        {
            color: '#03162D',
            enabled: true,
        },
        {
            color: '#002027',
            enabled: true,
        },
        {
            color: '#020210',
            enabled: true,
        },
        {
            color: '#02152A',
            enabled: true,
        },
        {
            "color": "#B8D4E6",
            "enabled": false
        }
    ],
    speed: 2,
    horizontalPressure: 3,
    verticalPressure: 5,
    waveFrequencyX: 1,
    waveFrequencyY: 3,
    waveAmplitude: 8,
    shadows: 0,
    highlights: 2,
    colorBrightness: 1,
    colorSaturation: 6,
    wireframe: false,
    colorBlending: 7,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainScale: 2,
    grainSparsity: 0,
    grainIntensity: 0.175,
    grainSpeed: 1,
    resolution: 1,
    yOffsetWaveMultiplier: 1.8,
    yOffsetColorMultiplier: 2.0,
    yOffsetFlowMultiplier: 2.2,
    enableProceduralTexture: false,
    textureEase: 0.8,
    flowEnabled: false,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};


export const PRUSSIAN_BLUE_PRESET = {
    colors: [
        {
            color: '#0b3954',
            enabled: true,
        },
        {
            color: '#087e8b',
            enabled: true,
        },
        {
            color: '#bfd7ea',
            enabled: true,
        },
        {
            color: '#ff5a5f',
            enabled: true,
        },
        {
            color: '#c81d25',
            enabled: true,
        },
        {
            "color": "#A8E6CF",
            "enabled": false
        }
    ],
    speed: 4,
    horizontalPressure: 4,
    verticalPressure: 3,
    waveFrequencyX: 0,
    waveFrequencyY: 0,
    waveAmplitude: 0,
    shadows: 2,
    highlights: 7,
    colorBrightness: 1,
    colorSaturation: 8,
    wireframe: false,
    colorBlending: 5,
    backgroundColor: '#FF0000',
    backgroundAlpha: 1,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 0,
    resolution: 0.5,
    yOffsetWaveMultiplier: 1.5,
    yOffsetColorMultiplier: 1.8,
    yOffsetFlowMultiplier: 2.0,
    enableProceduralTexture: false,
    textureEase: 0.75,
    flowEnabled: false,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const NIGHTTIME = {
    "colors": [
        {
            "color": "#FF3087",
            "enabled": true
        },
        {
            "color": "#1B36A6",
            "enabled": true
        },
        {
            "color": "#002027",
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
    "horizontalPressure": 3,
    "verticalPressure": 5,
    "waveFrequencyX": 2,
    "waveFrequencyY": 3,
    "waveAmplitude": 5,
    "shadows": 0,
    "highlights": 2,
    "colorBrightness": 1,
    "colorSaturation": 7,
    "wireframe": false,
    "colorBlending": 7,
    "backgroundColor": "#003FFF",
    "backgroundAlpha": 1,
    "grainScale": 2,
    grainSparsity: 0,
    "grainIntensity": 0.5,
    "grainSpeed": 1,
    "resolution": 1,
    yOffsetWaveMultiplier: 3.0,
    yOffsetColorMultiplier: 3.3,
    yOffsetFlowMultiplier: 3.8,
    enableProceduralTexture: false,
    textureEase: 0.58,
    flowEnabled: false,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const PSYCHEDELIC_PRESET = {
    ...STRIPE_PRESET,
    "colors": [{
        "color": "#00C5FF",
        "enabled": true
    }, { "color": "#CEFF00", "enabled": true }, {
        "color": "#17E7FF",
        "enabled": true
    }, { "color": "#6D3BFF", "enabled": true }, {
        "color": "#FFFB00",
        "enabled": true
    }],
    "speed": 4,
    "horizontalPressure": 7,
    "verticalPressure": 7,
    yOffsetWaveMultiplier: 13.5,
    yOffsetColorMultiplier: 12.8,
    yOffsetFlowMultiplier: 14.0,
    enableProceduralTexture: false,
    textureEase: 0.12,
    flowEnabled: false,
    mouseDistortionStrength: 0.15,
    mouseDistortionRadius: 0.3,
    mouseDecayRate: 0.95,
};


export const SPLASH_PRESET = {
    "colors": [
        {
            "color": "#ffbe0b",
            "enabled": true
        },
        {
            "color": "#fb5607",
            "enabled": true
        },
        {
            "color": "#ff006e",
            "enabled": true
        },
        {
            "color": "#8338ec",
            "enabled": true
        },
        {
            "color": "#3a86ff",
            "enabled": true
        }
    ],
    "speed": 4,
    "horizontalPressure": 2,
    "verticalPressure": 2,
    "waveFrequencyX": 1,
    "waveFrequencyY": 2,
    "waveAmplitude": 7,
    "shadows": 10,
    "highlights": 10,
    "colorBrightness": 1,
    "colorSaturation": 2,
    "wireframe": false,
    "colorBlending": 5,
    "backgroundColor": "#FFBE0B",
    "backgroundAlpha": 1,
    "grainScale": 2,
    "grainIntensity": 0.3,
    "grainSpeed": 0,
    "resolution": 1,
    yOffsetWaveMultiplier: 9.0,
    yOffsetColorMultiplier: 8.5,
    yOffsetFlowMultiplier: 9.5,
    enableProceduralTexture: false,
    textureEase: 0.32,
    flowEnabled: false,
    mouseDistortionStrength: 0.12,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};


export const OCEANIC_PRESET = {
    "colors": [
        {
            "color": "#005F73",
            "enabled": true
        },
        {
            "color": "#0A9396",
            "enabled": true
        },
        {
            "color": "#94D2BD",
            "enabled": true
        },
        {
            "color": "#E9D8A6",
            "enabled": true
        },
        {
            "color": "#EE9B00",
            "enabled": false
        }
    ],
    "speed": 3,
    "horizontalPressure": 5,
    "verticalPressure": 7,
    "waveFrequencyX": 2,
    "waveFrequencyY": 2,
    "waveAmplitude": 8,
    "shadows": 6,
    "highlights": 8,
    "colorBrightness": 1,
    "colorSaturation": 7,
    "wireframe": false,
    "colorBlending": 10,
    "backgroundColor": "#004E64",
    "backgroundAlpha": 1,
    "grainScale": 3,
    "grainIntensity": 0.3,
    "grainSpeed": 1,
    "resolution": 1,
    enableProceduralTexture: false,
    flowEnabled: false,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const FOREST_PRESET = {
    "colors": [
        { "color": "#2A4235", "enabled": true },
        { "color": "#769E7A", "enabled": true },
        { "color": "#B2C9AB", "enabled": true },
        { "color": "#E5E5E5", "enabled": true },
        { "color": "#C4DDC5", "enabled": false }
    ],
    "speed": 2,
    "horizontalPressure": 5,
    "verticalPressure": 5,
    "waveFrequencyX": 3,
    "waveFrequencyY": 3,
    "waveAmplitude": 4,
    "shadows": 4,
    "highlights": 6,
    "colorBrightness": 1,
    "colorSaturation": 5,
    "wireframe": false,
    "colorBlending": 8,
    "backgroundColor": "#3B7D1E",
    "backgroundAlpha": 1,
    "grainScale": 2,
    "grainIntensity": 0.2,
    "grainSpeed": 0.8,
    "resolution": 1.2,
    yOffsetWaveMultiplier: 4.2,
    yOffsetColorMultiplier: 3.8,
    yOffsetFlowMultiplier: 4.5,
    enableProceduralTexture: false,
    textureEase: 0.52,
    flowEnabled: false,
    mouseDistortionStrength: 0.08,
    mouseDistortionRadius: 0.2,
    mouseDecayRate: 0.97,
};

const OCEANS_ELEVEN_PRESET = {
    colors: [
        {
            color: '#5365FF',
            enabled: true,
        },
        {
            color: '#5864FF',
            enabled: true,
        },
        {
            color: '#322085',
            enabled: true,
        },
        {
            color: '#3B94FF',
            enabled: true,
        },
        {
            color: '#E1F0F5',
            enabled: false,
        },
    ],
    speed: 4,
    horizontalPressure: 2,
    verticalPressure: 10,
    waveFrequencyX: 2,
    waveFrequencyY: 10,
    waveAmplitude: 10,
    shadows: 10,
    highlights: 0,
    colorBrightness: 1.2,
    colorSaturation: -3,
    wireframe: false,
    colorBlending: 10,
    backgroundColor: '#003FFF',
    backgroundAlpha: 0,
    grainScale: 0,
    grainSparsity: 0,
    grainIntensity: 0,
    grainSpeed: 10,
    resolution: 1,
    yOffsetWaveMultiplier: 10.5,
    yOffsetColorMultiplier: 10.0,
    yOffsetFlowMultiplier: 11.0,
    enableProceduralTexture: false,
    textureEase: 0.28,
    flowEnabled: false,
    mouseDistortionStrength: 0.1,
    mouseDistortionRadius: 0.25,
    mouseDecayRate: 0.96,
};

export const PRESETS = {
    "Neat": NEAT_PRESET,
    "Fluid": FLUID_PRESET,
    "Flame": FLAME_PRESET,
    "Funky": FUNKY_PRESET,
    "Alejandra": ALEJANDRA_PRESET,
    "Monterey": MONTEREY_PRESET,
    "Virus": VIRUS_PRESET,
    "Sands": SANDS_PRESET,
    "Nighttime": NIGHTTIME,
    "Prussian": PRUSSIAN_BLUE_PRESET,
    "Clouds": CLOUDS_PRESET,
    "Lemon": LEMON_PRESET,
    "Yex": YEX_PRESET,
    "Psychedelic": PSYCHEDELIC_PRESET,
    "Splash": SPLASH_PRESET,
    "Dark Mode": DARK_MODE,
    "FireCMS": FIRECMS_PRESET,
    "Pastel": PASTEL_PRESET,
    "Stripe": STRIPE_PRESET,
    "Bloom": BLOOM_PRESET,
    "Glitch": GLITCH_PRESET,
    "Night Dunes": NIGHT_DUNES,
    "Oceanic": OCEANIC_PRESET
};

export const fontMap = {
    Neat: 'font-sans',
    FireCMS: 'font-rubik',
    Fluid: 'font-source-serif-pro',
    Lemon: 'font-londrina',
    Glitch: 'font-vt323',
    Flame: 'font-fredoka',
    "Dark Mode": 'font-source-serif-pro',
    Virus: 'font-lobster',
    Alejandra: 'font-lobster',
    Bloom: 'font-quicksand',
    Sands: 'font-inconsolata',
    Stripe: 'font-oswald',
    Nighttime: 'font-lobster',
    Prussian: 'font-alegreya',
    Clouds: 'font-nunito-sans',
    Monterey: 'font-merriweather',
    Psychedelic: 'font-concert-one',
    Splash: 'font-pacifico',
    Pastel: 'font-poppins',
    Oceanic: 'font-libre-baskerville',
    // Forest: 'font-source-serif-pro',
    // "Oceans Eleven": 'font-lobster',
};
