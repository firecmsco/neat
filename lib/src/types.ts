export type NeatConfig = {
    /**
     * License key to remove the NEAT watermark.
     * Purchase at https://neat.firecms.co
     * Format: "NEAT-<payload>.<signature>"
     */
    licenseKey?: string;
    antialias?: boolean;
    /**
     * Density of the displacement mesh, **not** the pixel resolution. At 1 the
     * grid is 240×240 segments for a plane (120×120 for the 3D shapes), capped to
     * what the canvas can actually show. Lower it to spend fewer vertices.
     */
    resolution?: number;
    /**
     * Size of the drawing buffer relative to the canvas' CSS size. 1 (default)
     * renders one pixel per CSS pixel; 0.75 renders 44% fewer pixels and lets the
     * browser scale the result up, which is usually invisible behind content and
     * is the cheapest win on low-end devices. Requires the canvas to be sized by
     * CSS — if its layout size comes from the width/height attributes, scaling is
     * ignored to avoid shrinking the element on every resize.
     */
    renderScale?: number;
    speed?: number;
    horizontalPressure?: number;
    verticalPressure?: number;
    waveFrequencyX?: number;
    waveFrequencyY?: number;
    waveAmplitude?: number;

    /**
     * Second displacement layer, sampled on a rotated domain and running at its
     * own rate. Where it crosses the base waves they interfere, which breaks up
     * the single repeating direction the base layer has on its own.
     */
    secondaryWaveEnabled?: boolean;
    secondaryWaveFrequencyX?: number;
    secondaryWaveFrequencyY?: number;
    /** Weight of the second layer against the first. 0 = base only, 10 = equal parts. */
    secondaryWaveAmplitude?: number;
    /** Rate of the second layer relative to `speed`. */
    secondaryWaveSpeed?: number;
    /** Rotation of the second layer's domain, in radians. 0 makes it run parallel to the base. */
    secondaryWaveAngle?: number;
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
    /**
     * How the procedural texture is produced. `bitmap` (default) draws the
     * shapes through Canvas2D at a fixed 1024px; `baked` rasterizes them
     * analytically on the GPU at a resolution derived from the canvas, giving
     * exact edge coverage instead of a coarse grid. Both end up as an ordinary
     * mipmapped texture, so runtime cost is the same. Squiggles are not
     * supported when baking, and `baked` needs WebGL2.
     */
    textureMode?: 'bitmap' | 'baked';
    /** Resolution of the baked texture. 0 (default) derives it from the canvas. */
    textureBakeResolution?: number;
    /** Multiplier on the antialiasing filter width used while baking, in output texels. Default 1. */
    bakeEdgeSoftness?: number;
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

    /**
     * Thin-film rainbow along the seams between colours — the oil-slick fringe,
     * as opposed to `iridescence`, which tints the whole surface by height.
     */
    prismEdgeEnabled?: boolean;
    prismEdgeIntensity?: number;
    /** Thinness of the fringe. Higher values pull it tighter onto the seam. */
    prismEdgeThinness?: number;
    /** Apparent film thickness across one seam — how far through the Newton series it runs. */
    prismEdgeSpread?: number;
    /** Rate the film appears to thicken, drifting the colours. 0 holds them still. */
    prismEdgeSpeed?: number;
    /**
     * How much the wave height varies the film thickness. This is what makes the
     * hue shift *along* a seam rather than painting the whole rim one colour, and
     * it is the only route by which the wave layers reach a flat-lit preset.
     */
    prismEdgeRipple?: number;

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
}

export type NeatController = {
    destroy: () => void;
}
