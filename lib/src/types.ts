export type NeatConfig = {
    /**
     * License key to remove the NEAT watermark.
     * Purchase at https://neat.firecms.co
     * Format: "NEAT-<payload>.<signature>"
     */
    licenseKey?: string;
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

    // Domain warping
    domainWarpEnabled?: boolean;
    domainWarpIntensity?: number;
    domainWarpScale?: number;

    // Vignette
    vignetteIntensity?: number;
    vignetteRadius?: number;

    // Fresnel (rim glow)
    fresnelEnabled?: boolean;
    fresnelPower?: number;
    fresnelIntensity?: number;
    fresnelColor?: string;

    // Iridescence
    iridescenceEnabled?: boolean;
    iridescenceIntensity?: number;
    iridescenceSpeed?: number;

    // Bloom (fake)
    bloomIntensity?: number;
    bloomThreshold?: number;

    // Chromatic aberration
    chromaticAberration?: number;

    // 3D Shapes config
    shapeType?: 'plane' | 'sphere' | 'torus' | 'cylinder' | 'ribbon';
    shapeRotationX?: number;
    shapeRotationY?: number;
    shapeRotationZ?: number;
    shapeAutoRotateSpeedX?: number;
    shapeAutoRotateSpeedY?: number;
    sphereRadius?: number;
    torusRadius?: number;
    torusTube?: number;
    cylinderRadius?: number;
    cylinderHeight?: number;
    planeBend?: number;
    planeTwist?: number;
    transparentTextureVoid?: boolean;
    flatShading?: boolean;
    silhouetteFade?: number;
    cylinderFade?: number;
    ribbonFade?: number;

    // Camera settings
    cameraLock?: boolean;
    cameraX?: number;
    cameraY?: number;
    cameraZ?: number;
    cameraRotationX?: number;
    cameraRotationY?: number;
    cameraRotationZ?: number;
    cameraZoom?: number;
};

export type NeatColor = {
    color: string;
    enabled: boolean;
    influence?: number;
}

export type NeatController = {
    destroy: () => void;
}
