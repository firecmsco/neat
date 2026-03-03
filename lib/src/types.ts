export type NeatConfig = {
    resolution?: number;
    speed?: number;
    horizontalPressure?: number;
    verticalPressure?: number;
    waveFrequencyX?: number;
    waveFrequencyY?: number;
    waveAmplitude?: number;
    highlights?: number;
    shadows?: number;
    colorSaturation?: number;
    colorBrightness?: number;
    colors: NeatColor[];
    colorBlending?: number;
    grainScale?: number;
    grainIntensity?: number;
    grainSparsity?: number;
    grainSpeed?: number;
    wireframe?: boolean;
    backgroundColor?: string;
    backgroundAlpha?: number;
    yOffset?: number;
    yOffsetWaveMultiplier?: number;
    yOffsetColorMultiplier?: number;
    yOffsetFlowMultiplier?: number;
    flowDistortionA?: number;
    flowDistortionB?: number;
    flowScale?: number;
    flowEase?: number;
    flowEnabled?: boolean;
    mouseDistortionStrength?: number;
    mouseDistortionRadius?: number;
    mouseDecayRate?: number;
    mouseDarken?: number;
    enableProceduralTexture?: boolean;
    textureVoidLikelihood?: number;
    textureVoidWidthMin?: number;
    textureVoidWidthMax?: number;
    textureBandDensity?: number;
    textureColorBlending?: number;
    textureSeed?: number;
    textureEase?: number;
    proceduralBackgroundColor?: string;
    textureShapeTriangles?: number;
    textureShapeCircles?: number;
    textureShapeBars?: number;
    textureShapeSquiggles?: number;
};

export type NeatColor = {
    color: string;
    enabled: boolean;
    influence?: number;
}

export type NeatController = {
    destroy: () => void;
}
