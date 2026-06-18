import { buildColorFunctions, buildNoise, buildVertUniforms, buildFragUniforms, fragmentShaderSource, vertexShaderSource } from "./shaders";
import { generatePlaneGeometry, generateSphereGeometry, generateTorusGeometry, generateCylinderGeometry, generateRibbonGeometry, OrthographicCamera, updateCamera, Matrix4 } from "./math";
import { verifyLicenseKey } from "./license";

function _logBranding() {
    console.info(
        "%c🌈 Neat Gradients%c\n\nLicensed under MIT + The Commons Clause.\nFree for personal and commercial use.\nSelling this software or its derivatives is strictly prohibited.\nGet a license key to remove the watermark and this message: https://neat.firecms.co",
        "font-weight: bold; font-size: 14px; color: #FF5772;", "color: inherit;"
    );
}

const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 80;


const COLORS_COUNT = 6;



export interface WebGLState {
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    program: WebGLProgram;
    buffers: {
        position: WebGLBuffer;
        normal: WebGLBuffer;
        uv: WebGLBuffer;
        index: WebGLBuffer;
        wireframeIndex: WebGLBuffer;
    };
    locations: {
        attributes: Record<string, number>;
        uniforms: Record<string, WebGLUniformLocation | null>;
    };
    camera: OrthographicCamera;
    indexCount: number;
    wireframeIndexCount: number;
    indexType: number;
}


import { NeatConfig, NeatColor, NeatController } from "./types";

// Property descriptor table for data-driven getter/setter generation.
// [publicName, privateField, getFactor, setFactor, mode]
// mode: 'u' = uniform, 't' = texture, 'g' = geometry
type PropDesc = [string, string, number, number, 'u' | 't' | 'g'];

const PROP_DESCRIPTORS: PropDesc[] = [
    // Category A: scaled uniforms (getFactor != 1 means get = _field * getFactor, set = _field = v * setFactor)
    ['speed', '_speed', 20, 1/20, 'u'],
    ['horizontalPressure', '_horizontalPressure', 4, 1/4, 'u'],
    ['verticalPressure', '_verticalPressure', 4, 1/4, 'u'],
    ['waveFrequencyX', '_waveFrequencyX', 1/0.04, 0.04, 'u'],
    ['waveFrequencyY', '_waveFrequencyY', 1/0.04, 0.04, 'u'],
    ['waveAmplitude', '_waveAmplitude', 1/0.75, 0.75, 'u'],
    ['highlights', '_highlights', 100, 1/100, 'u'],
    ['shadows', '_shadows', 100, 1/100, 'u'],
    ['colorSaturation', '_saturation', 10, 1/10, 'u'],
    ['colorBlending', '_colorBlending', 10, 1/10, 'u'],
    ['yOffsetWaveMultiplier', '_yOffsetWaveMultiplier', 1000, 1/1000, 'u'],
    ['yOffsetColorMultiplier', '_yOffsetColorMultiplier', 1000, 1/1000, 'u'],
    ['yOffsetFlowMultiplier', '_yOffsetFlowMultiplier', 1000, 1/1000, 'u'],

    // Category B+C: simple uniforms (factor = 1)
    ['colorBrightness', '_brightness', 1, 1, 'u'],
    ['grainIntensity', '_grainIntensity', 1, 1, 'u'],
    ['grainSparsity', '_grainSparsity', 1, 1, 'u'],
    ['grainSpeed', '_grainSpeed', 1, 1, 'u'],
    ['wireframe', '_wireframe', 1, 1, 'u'],
    ['backgroundAlpha', '_backgroundAlpha', 1, 1, 'u'],
    ['flowDistortionA', '_flowDistortionA', 1, 1, 'u'],
    ['flowDistortionB', '_flowDistortionB', 1, 1, 'u'],
    ['flowScale', '_flowScale', 1, 1, 'u'],
    ['flowEase', '_flowEase', 1, 1, 'u'],
    ['flowEnabled', '_flowEnabled', 1, 1, 'u'],
    ['textureEase', '_textureEase', 1, 1, 'u'],
    ['silhouetteFade', '_silhouetteFade', 1, 1, 'u'],
    ['cylinderFade', '_cylinderFade', 1, 1, 'u'],
    ['ribbonFade', '_ribbonFade', 1, 1, 'u'],
    ['flatShading', '_flatShading', 1, 1, 'u'],
    ['domainWarpEnabled', '_domainWarpEnabled', 1, 1, 'u'],
    ['domainWarpIntensity', '_domainWarpIntensity', 1, 1, 'u'],
    ['domainWarpScale', '_domainWarpScale', 1, 1, 'u'],
    ['vignetteIntensity', '_vignetteIntensity', 1, 1, 'u'],
    ['vignetteRadius', '_vignetteRadius', 1, 1, 'u'],
    ['fresnelEnabled', '_fresnelEnabled', 1, 1, 'u'],
    ['fresnelPower', '_fresnelPower', 1, 1, 'u'],
    ['fresnelIntensity', '_fresnelIntensity', 1, 1, 'u'],
    ['iridescenceEnabled', '_iridescenceEnabled', 1, 1, 'u'],
    ['iridescenceIntensity', '_iridescenceIntensity', 1, 1, 'u'],
    ['iridescenceSpeed', '_iridescenceSpeed', 1, 1, 'u'],
    ['bloomIntensity', '_bloomIntensity', 1, 1, 'u'],
    ['bloomThreshold', '_bloomThreshold', 1, 1, 'u'],
    ['chromaticAberration', '_chromaticAberration', 1, 1, 'u'],
    ['shapeRotationX', '_shapeRotationX', 1, 1, 'u'],
    ['shapeRotationY', '_shapeRotationY', 1, 1, 'u'],
    ['shapeRotationZ', '_shapeRotationZ', 1, 1, 'u'],
    ['shapeAutoRotateSpeedX', '_shapeAutoRotateSpeedX', 1, 1, 'u'],
    ['shapeAutoRotateSpeedY', '_shapeAutoRotateSpeedY', 1, 1, 'u'],
    ['cameraX', '_cameraX', 1, 1, 'u'],
    ['cameraY', '_cameraY', 1, 1, 'u'],
    ['cameraZ', '_cameraZ', 1, 1, 'u'],
    ['cameraRotationX', '_cameraRotationX', 1, 1, 'u'],
    ['cameraRotationY', '_cameraRotationY', 1, 1, 'u'],
    ['cameraRotationZ', '_cameraRotationZ', 1, 1, 'u'],

    // Category D: texture uniforms (also set _textureNeedsUpdate when texture is enabled)
    ['textureVoidLikelihood', '_textureVoidLikelihood', 1, 1, 't'],
    ['textureVoidWidthMin', '_textureVoidWidthMin', 1, 1, 't'],
    ['textureVoidWidthMax', '_textureVoidWidthMax', 1, 1, 't'],
    ['textureBandDensity', '_textureBandDensity', 1, 1, 't'],
    ['textureColorBlending', '_textureColorBlending', 1, 1, 't'],
    ['textureSeed', '_textureSeed', 1, 1, 't'],
    ['transparentTextureVoid', '_transparentTextureVoid', 1, 1, 't'],
    ['proceduralBackgroundColor', '_proceduralBackgroundColor', 1, 1, 't'],
    ['textureShapeTriangles', '_textureShapeTriangles', 1, 1, 't'],
    ['textureShapeCircles', '_textureShapeCircles', 1, 1, 't'],
    ['textureShapeBars', '_textureShapeBars', 1, 1, 't'],
    ['textureShapeSquiggles', '_textureShapeSquiggles', 1, 1, 't'],

    // Category E: geometry (setter calls _updateGeometry)
    ['sphereRadius', '_sphereRadius', 1, 1, 'g'],
    ['torusRadius', '_torusRadius', 1, 1, 'g'],
    ['torusTube', '_torusTube', 1, 1, 'g'],
    ['cylinderRadius', '_cylinderRadius', 1, 1, 'g'],
    ['cylinderHeight', '_cylinderHeight', 1, 1, 'g'],
    ['planeBend', '_planeBend', 1, 1, 'g'],
    ['planeTwist', '_planeTwist', 1, 1, 'g'],
];

// Declaration merging: expose dynamically-defined properties to TypeScript
export interface NeatGradient {
    speed: number;
    horizontalPressure: number;
    verticalPressure: number;
    waveFrequencyX: number;
    waveFrequencyY: number;
    waveAmplitude: number;
    highlights: number;
    shadows: number;
    colorSaturation: number;
    colorBlending: number;
    yOffsetWaveMultiplier: number;
    yOffsetColorMultiplier: number;
    yOffsetFlowMultiplier: number;
    colorBrightness: number;
    grainIntensity: number;
    grainSparsity: number;
    grainSpeed: number;
    wireframe: boolean;
    backgroundAlpha: number;
    flowDistortionA: number;
    flowDistortionB: number;
    flowScale: number;
    flowEase: number;
    flowEnabled: boolean;
    textureEase: number;
    silhouetteFade: number;
    cylinderFade: number;
    ribbonFade: number;
    flatShading: boolean;
    domainWarpEnabled: boolean;
    domainWarpIntensity: number;
    domainWarpScale: number;
    vignetteIntensity: number;
    vignetteRadius: number;
    fresnelEnabled: boolean;
    fresnelPower: number;
    fresnelIntensity: number;
    iridescenceEnabled: boolean;
    iridescenceIntensity: number;
    iridescenceSpeed: number;
    bloomIntensity: number;
    bloomThreshold: number;
    chromaticAberration: number;
    shapeRotationX: number;
    shapeRotationY: number;
    shapeRotationZ: number;
    shapeAutoRotateSpeedX: number;
    shapeAutoRotateSpeedY: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    cameraRotationX: number;
    cameraRotationY: number;
    cameraRotationZ: number;
    textureVoidLikelihood: number;
    textureVoidWidthMin: number;
    textureVoidWidthMax: number;
    textureBandDensity: number;
    textureColorBlending: number;
    textureSeed: number;
    transparentTextureVoid: boolean;
    proceduralBackgroundColor: string;
    textureShapeTriangles: number;
    textureShapeCircles: number;
    textureShapeBars: number;
    textureShapeSquiggles: number;
    sphereRadius: number;
    torusRadius: number;
    torusTube: number;
    cylinderRadius: number;
    cylinderHeight: number;
    planeBend: number;
    planeTwist: number;
}

export class NeatGradient implements NeatController {

    private _ref: HTMLCanvasElement;
    private _licensed: boolean = false;

    private _speed: number = -1;

    private _horizontalPressure: number = -1;
    private _verticalPressure: number = -1;

    private _waveFrequencyX: number = -1;
    private _waveFrequencyY: number = -1;
    private _waveAmplitude: number = -1;

    private _shadows: number = -1;
    private _highlights: number = -1;
    private _saturation: number = -1;
    private _brightness: number = -1;

    private _grainScale: number = -1;
    private _grainIntensity: number = -1;
    private _grainSparsity: number = -1;
    private _grainSpeed: number = -1;

    private _colorBlending: number = -1;
    private _resolution: number = 1;

    private _colors: NeatColor[] = [];
    private _wireframe: boolean = false;

    private _backgroundColor: string = "#FFFFFF";
    private _backgroundColorRgb: [number, number, number] = [1, 1, 1];
    private _backgroundAlpha: number = 1.0;

    // Flow field properties
    private _flowDistortionA: number = 0;
    private _flowDistortionB: number = 0;
    private _flowScale: number = 1.0;
    private _flowEase: number = 0.0;
    private _flowEnabled: boolean = true;

    private glState!: WebGLState;

    // Texture generation properties
    private _enableProceduralTexture: boolean = false;
    private _textureVoidLikelihood: number = 0.45;
    private _textureVoidWidthMin: number = 200;
    private _textureVoidWidthMax: number = 486;
    private _textureBandDensity: number = 2.15;
    private _textureColorBlending: number = 0.01;
    private _textureSeed: number = 333;
    private _textureEase: number = 0.5;
    private _transparentTextureVoid: boolean = false;

    // New effects
    private _domainWarpEnabled: boolean = false;
    private _domainWarpIntensity: number = 0.5;
    private _domainWarpScale: number = 1.0;

    private _vignetteIntensity: number = 0.5;
    private _vignetteRadius: number = 0.8;

    private _fresnelEnabled: boolean = false;
    private _fresnelPower: number = 2.0;
    private _fresnelIntensity: number = 0.5;
    private _fresnelColor: string = "#FFFFFF";
    private _fresnelColorRgb: [number, number, number] = [1, 1, 1];

    private _iridescenceEnabled: boolean = false;
    private _iridescenceIntensity: number = 0.5;
    private _iridescenceSpeed: number = 1.0;

    private _bloomIntensity: number = 0;
    private _bloomThreshold: number = 0.7;
    private _chromaticAberration: number = 0;
    private _silhouetteFade: number = 0.25;
    private _cylinderFade: number = 0.08;
    private _ribbonFade: number = 0.05;
    private _flatShading: boolean = true;

    // 3D Shapes config
    private _shapeType: 'plane' | 'sphere' | 'torus' | 'cylinder' | 'ribbon' = 'plane';
    private _shapeRotationX: number = 0;
    private _shapeRotationY: number = 0;
    private _shapeRotationZ: number = 0;
    private _shapeAutoRotateSpeedX: number = 0;
    private _shapeAutoRotateSpeedY: number = 0;
    private _sphereRadius: number = 15;
    private _torusRadius: number = 15;
    private _torusTube: number = 5;
    private _cylinderRadius: number = 10;
    private _cylinderHeight: number = 40;
    private _planeBend: number = 0;
    private _planeTwist: number = 0;

    // Camera settings
    private _cameraLock: boolean = false;
    private _cameraX: number = 0;
    private _cameraY: number = 0;
    private _cameraZ: number = 0;
    private _cameraRotationX: number = 0;
    private _cameraRotationY: number = 0;
    private _cameraRotationZ: number = 0;
    private _cameraZoom: number = 1.0;

    private _proceduralTexture: WebGLTexture | null = null;
    private _proceduralBackgroundColor: string = "#000000";

    private _textureShapeTriangles: number = 20;
    private _textureShapeCircles: number = 15;
    private _textureShapeBars: number = 15;
    private _textureShapeSquiggles: number = 10;

    private requestRef: number = -1;
    private sizeObserver: ResizeObserver;

    private _initialized: boolean = false;
    private _cachedColorRgb: [number, number, number][] = [];

    private _yOffset: number = 0;
    private _yOffsetWaveMultiplier: number = 0.004;
    private _yOffsetColorMultiplier: number = 0.004;
    private _yOffsetFlowMultiplier: number = 0.004;

    // Cached offscreen canvases for procedural texture generation
    private _sourceCanvas: HTMLCanvasElement | null = null;
    private _sourceCtx: CanvasRenderingContext2D | null = null;
    private _maskedCanvas: HTMLCanvasElement | null = null;
    private _maskedCtx: CanvasRenderingContext2D | null = null;

    // Performance optimizations
    private _resizeTimeoutId: number | null = null;
    private _textureNeedsUpdate: boolean = false;
    private _colorsChanged: boolean = true;
    private _uniformsDirty: boolean = true;
    private _textureDirty: boolean = true;
    private _yOffsetDirty: boolean = false;
    private _modelViewMatrix: Matrix4 = new Matrix4();
    private _isVisible: boolean = true;
    private _visibilityObserver: IntersectionObserver | null = null;
    private _visibilityHandler: (() => void) | null = null;

    // Watermark overlay (rendered inside the canvas via a separate WebGL pass)
    private _watermarkProgram: WebGLProgram | null = null;
    private _watermarkTexture: WebGLTexture | null = null;
    private _watermarkBuffer: WebGLBuffer | null = null;
    private _watermarkTexCoordBuffer: WebGLBuffer | null = null;
    private _watermarkWidth: number = 0;
    private _watermarkHeight: number = 0;
    private _watermarkMargin: number = 4;
    // Cached GL locations & reusable buffer to avoid per-frame allocations
    private _wmLocPos: number = -1;
    private _wmLocTc: number = -1;
    private _wmLocTex: WebGLUniformLocation | null = null;
    private _wmPosData: Float32Array = new Float32Array(8);
    private _wmClickHandler: ((e: MouseEvent) => void) | null = null;
    private _wmMoveHandler: ((e: MouseEvent) => void) | null = null;
    private _wmMoveRafPending: boolean = false;
    private _wmCachedRect: DOMRect | null = null;
    private _wmRectCacheTime: number = 0;
    // VAOs for fast state switching (WebGL2 only)
    private _gradientVAO: WebGLVertexArrayObject | null = null;
    private _watermarkVAO: WebGLVertexArrayObject | null = null;

    constructor(config: NeatConfig & { ref: HTMLCanvasElement, resolution?: number, seed?: number, preserveDrawingBuffer?: boolean }) {

        const {
            ref,
            speed = 4,
            horizontalPressure = 3,
            verticalPressure = 3,
            waveFrequencyX = 5,
            waveFrequencyY = 5,
            waveAmplitude = 3,
            colors,
            highlights = 4,
            shadows = 4,
            colorSaturation = 0,
            colorBrightness = 1,
            colorBlending = 5,
            grainScale = 2,
            grainIntensity = 0.55,
            grainSparsity = 0.0,
            grainSpeed = 0.1,
            wireframe = false,
            backgroundColor = "#FFFFFF",
            backgroundAlpha = 1.0,
            resolution = 1,
            seed,
            yOffset = 0,
            yOffsetWaveMultiplier = 4,
            yOffsetColorMultiplier = 4,
            yOffsetFlowMultiplier = 4,
            // Flow field parameters
            flowDistortionA = 0,
            flowDistortionB = 0,
            flowScale = 1.0,
            flowEase = 0.0,
            flowEnabled = true,

            // Texture generation
            enableProceduralTexture = false,
            textureVoidLikelihood = 0.45,
            textureVoidWidthMin = 200,
            textureVoidWidthMax = 486,
            textureBandDensity = 2.15,
            textureColorBlending = 0.01,
            textureSeed = 333,
            textureEase = 0.5,
            proceduralBackgroundColor = "#000000",
            transparentTextureVoid = false,
            textureShapeTriangles = 20,
            textureShapeCircles = 15,
            textureShapeBars = 15,
            textureShapeSquiggles = 10,

            domainWarpEnabled = false,
            domainWarpIntensity = 0.5,
            domainWarpScale = 1.0,
            vignetteIntensity = 0.0,
            vignetteRadius = 0.8,
            fresnelEnabled = false,
            fresnelPower = 2.0,
            fresnelIntensity = 0.5,
            fresnelColor = "#FFFFFF",
            iridescenceEnabled = false,
            iridescenceIntensity = 0.5,
            iridescenceSpeed = 1.0,
            bloomIntensity = 0.0,
            bloomThreshold = 0.7,
            chromaticAberration = 0.0,
            silhouetteFade = 0.25,
            cylinderFade = 0.08,
            ribbonFade = 0.05,
            flatShading = true,

            // Camera configuration
            cameraLock = false,
            cameraX = 0,
            cameraY = 0,
            cameraZ = 0,
            cameraRotationX = 0,
            cameraRotationY = 0,
            cameraRotationZ = 0,
            cameraZoom = 1.0,

            // 3D shapes default
            shapeType = 'plane',
            shapeRotationX = 0,
            shapeRotationY = 0,
            shapeRotationZ = 0,
            shapeAutoRotateSpeedX = 0,
            shapeAutoRotateSpeedY = 0,
            sphereRadius = 15,
            torusRadius = 15,
            torusTube = 5,
            cylinderRadius = 10,
            cylinderHeight = 40,
            planeBend = 0,
            planeTwist = 0,
            licenseKey,
            preserveDrawingBuffer = false,
        } = config;


        this._ref = ref;

        this.destroy = this.destroy.bind(this);
        this._initScene = this._initScene.bind(this);

        this.speed = speed;
        this.horizontalPressure = horizontalPressure;
        this.verticalPressure = verticalPressure;
        this.waveFrequencyX = waveFrequencyX;
        this.waveFrequencyY = waveFrequencyY;
        this.waveAmplitude = waveAmplitude;
        this.colorBlending = colorBlending;
        this._resolution = resolution;
        this.grainScale = grainScale;
        this.grainIntensity = grainIntensity;
        this.grainSparsity = grainSparsity;
        this.grainSpeed = grainSpeed;
        this.colors = colors;
        this.shadows = shadows;
        this.highlights = highlights;
        this.colorSaturation = colorSaturation;
        this.colorBrightness = colorBrightness;
        this.wireframe = wireframe;
        this.backgroundColor = backgroundColor;
        this.backgroundAlpha = backgroundAlpha;
        this.yOffset = yOffset;
        this.yOffsetWaveMultiplier = yOffsetWaveMultiplier;
        this.yOffsetColorMultiplier = yOffsetColorMultiplier;
        this.yOffsetFlowMultiplier = yOffsetFlowMultiplier;

        // Flow field
        this.flowDistortionA = flowDistortionA;
        this.flowDistortionB = flowDistortionB;
        this.flowScale = flowScale;
        this.flowEase = flowEase;
        this.flowEnabled = flowEnabled;



        // Texture generation
        this.enableProceduralTexture = enableProceduralTexture;
        this.textureVoidLikelihood = textureVoidLikelihood;
        this.textureVoidWidthMin = textureVoidWidthMin;
        this.textureVoidWidthMax = textureVoidWidthMax;
        this.textureBandDensity = textureBandDensity;
        this.textureColorBlending = textureColorBlending;
        this.textureSeed = textureSeed;
        this.textureEase = textureEase;
        this._proceduralBackgroundColor = proceduralBackgroundColor;
        this.transparentTextureVoid = transparentTextureVoid;

        this._textureShapeTriangles = textureShapeTriangles;
        this._textureShapeCircles = textureShapeCircles;
        this._textureShapeBars = textureShapeBars;
        this._textureShapeSquiggles = textureShapeSquiggles;

        this.domainWarpEnabled = domainWarpEnabled;
        this.domainWarpIntensity = domainWarpIntensity;
        this.domainWarpScale = domainWarpScale;
        this.vignetteIntensity = vignetteIntensity;
        this.vignetteRadius = vignetteRadius;
        this.fresnelEnabled = fresnelEnabled;
        this.fresnelPower = fresnelPower;
        this.fresnelIntensity = fresnelIntensity;
        this.fresnelColor = fresnelColor;
        this.iridescenceEnabled = iridescenceEnabled;
        this.iridescenceIntensity = iridescenceIntensity;
        this.iridescenceSpeed = iridescenceSpeed;
        this.bloomIntensity = bloomIntensity;
        this.bloomThreshold = bloomThreshold;
        this.chromaticAberration = chromaticAberration;
        this.silhouetteFade = silhouetteFade;
        this.cylinderFade = cylinderFade;
        this.ribbonFade = ribbonFade;
        this._flatShading = flatShading;

        this._cameraLock = cameraLock;
        this._cameraX = cameraX;
        this._cameraY = cameraY;
        this._cameraZ = cameraZ;
        this._cameraRotationX = cameraRotationX;
        this._cameraRotationY = cameraRotationY;
        this._cameraRotationZ = cameraRotationZ;
        this._cameraZoom = cameraZoom;

        this._shapeType = shapeType;
        this._shapeRotationX = shapeRotationX;
        this._shapeRotationY = shapeRotationY;
        this._shapeRotationZ = shapeRotationZ;
        this._shapeAutoRotateSpeedX = shapeAutoRotateSpeedX;
        this._shapeAutoRotateSpeedY = shapeAutoRotateSpeedY;
        this._sphereRadius = sphereRadius;
        this._torusRadius = torusRadius;
        this._torusTube = torusTube;
        this._cylinderRadius = cylinderRadius;
        this._cylinderHeight = cylinderHeight;
        this._planeBend = planeBend;
        this._planeTwist = planeTwist;

        this.glState = this._initScene(resolution, preserveDrawingBuffer);
        this._initWatermark();

        injectMetaGenerator();

        // License verification — async, watermark renders until verified
        if (licenseKey) {
            verifyLicenseKey(licenseKey).then((result) => {
                this._licensed = result.valid;
            });
        } else {
            _logBranding();
        }

        let tick = seed !== undefined ? seed : getElapsedSecondsInLastHour();
        let lastTime = performance.now();

        const render = () => {

            const { gl, program, locations, indexCount, indexType } = this.glState;

            if (this._initialized) {
                const timeNow = performance.now();
                tick += ((timeNow - lastTime) / 1000) * this._speed;
                lastTime = timeNow;

                gl.useProgram(program);

                gl.uniform1f(locations.uniforms['u_time'], tick);

                // Update modelViewMatrix in every frame to support dynamic rotation and auto-rotation
                const camera = this.glState.camera;
                const modelViewMatrix = this._modelViewMatrix;
                modelViewMatrix.identity();
                
                // 1. Camera translation (default camera distance + displacement)
                modelViewMatrix.translate(
                    -camera.position[0] - this._cameraX,
                    -camera.position[1] - this._cameraY,
                    -camera.position[2] - this._cameraZ
                );
                modelViewMatrix.translate(0, 0, -1);
                
                // 2. Camera rotation (revolving around target)
                modelViewMatrix.rotateX(-this._cameraRotationX);
                modelViewMatrix.rotateY(-this._cameraRotationY);
                modelViewMatrix.rotateZ(-this._cameraRotationZ);
                
                let rx = this._shapeRotationX;
                let ry = this._shapeRotationY;
                let rz = this._shapeRotationZ;
                
                if (this._shapeAutoRotateSpeedX !== 0) {
                    rx += tick * this._shapeAutoRotateSpeedX * 0.1;
                }
                if (this._shapeAutoRotateSpeedY !== 0) {
                    ry += tick * this._shapeAutoRotateSpeedY * 0.1;
                }
                
                if (this._shapeType === 'plane' || this._shapeType === 'ribbon') {
                    modelViewMatrix.rotateX(rx - Math.PI / 3.5);
                } else {
                    modelViewMatrix.rotateX(rx);
                }
                modelViewMatrix.rotateY(ry);
                modelViewMatrix.rotateZ(rz);
                
                const mvLoc = locations.uniforms["modelViewMatrix"];
                if (mvLoc) gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix.elements);

                // Fast path: only upload yOffset when it changed (scroll)
                if (this._yOffsetDirty && !this._uniformsDirty) {
                    gl.uniform1f(locations.uniforms['u_y_offset'], this._yOffset);
                    this._yOffsetDirty = false;
                }

                // Only upload static uniforms when they've been modified
                if (this._uniformsDirty) {
                    gl.uniform2f(locations.uniforms['u_resolution'], this._ref.width, this._ref.height);
                    gl.uniform2f(locations.uniforms['u_color_pressure'], this._horizontalPressure, this._verticalPressure);

                    gl.uniform1f(locations.uniforms['u_wave_frequency_x'], this._waveFrequencyX);
                    gl.uniform1f(locations.uniforms['u_wave_frequency_y'], this._waveFrequencyY);
                    gl.uniform1f(locations.uniforms['u_wave_amplitude'], this._waveAmplitude);
                    gl.uniform1f(locations.uniforms['u_color_blending'], this._colorBlending);
                    gl.uniform1f(locations.uniforms['u_shadows'], this._shadows);
                    gl.uniform1f(locations.uniforms['u_highlights'], this._highlights);
                    gl.uniform1f(locations.uniforms['u_saturation'], this._saturation);
                    gl.uniform1f(locations.uniforms['u_brightness'], this._brightness);
                    gl.uniform1f(locations.uniforms['u_grain_intensity'], this._grainIntensity);
                    gl.uniform1f(locations.uniforms['u_grain_sparsity'], this._grainSparsity);
                    gl.uniform1f(locations.uniforms['u_grain_speed'], this._grainSpeed);
                    gl.uniform1f(locations.uniforms['u_grain_scale'], this._grainScale);
                    gl.uniform1f(locations.uniforms['u_y_offset'], this._yOffset);
                    gl.uniform1f(locations.uniforms['u_y_offset_wave_multiplier'], this._yOffsetWaveMultiplier);
                    gl.uniform1f(locations.uniforms['u_y_offset_color_multiplier'], this._yOffsetColorMultiplier);
                    gl.uniform1f(locations.uniforms['u_y_offset_flow_multiplier'], this._yOffsetFlowMultiplier);
                    gl.uniform1f(locations.uniforms['u_flow_distortion_a'], this._flowDistortionA);
                    gl.uniform1f(locations.uniforms['u_flow_distortion_b'], this._flowDistortionB);
                    gl.uniform1f(locations.uniforms['u_flow_scale'], this._flowScale);
                    gl.uniform1f(locations.uniforms['u_flow_ease'], this._flowEase);
                    gl.uniform1f(locations.uniforms['u_flow_enabled'], this._flowEnabled ? 1.0 : 0.0);

                    let shapeTypeVal = 0.0;
                    if (this._shapeType === 'sphere') shapeTypeVal = 1.0;
                    else if (this._shapeType === 'torus') shapeTypeVal = 2.0;
                    else if (this._shapeType === 'cylinder') shapeTypeVal = 3.0;
                    else if (this._shapeType === 'ribbon') shapeTypeVal = 4.0;
                    gl.uniform1f(locations.uniforms['u_shape_type'], shapeTypeVal);

                    gl.uniform1f(locations.uniforms['u_enable_procedural_texture'], this._enableProceduralTexture ? 1.0 : 0.0);
                    gl.uniform1f(locations.uniforms['u_texture_ease'], this._textureEase);
                    gl.uniform1f(locations.uniforms['u_transparent_texture_void'], this._transparentTextureVoid ? 1.0 : 0.0);

                    gl.uniform1f(locations.uniforms['u_domain_warp_enabled'], this._domainWarpEnabled ? 1.0 : 0.0);
                    gl.uniform1f(locations.uniforms['u_domain_warp_intensity'], this._domainWarpIntensity);
                    gl.uniform1f(locations.uniforms['u_domain_warp_scale'], this._domainWarpScale);

                    gl.uniform1f(locations.uniforms['u_vignette_intensity'], this._vignetteIntensity);
                    gl.uniform1f(locations.uniforms['u_vignette_radius'], this._vignetteRadius);

                    gl.uniform1f(locations.uniforms['u_fresnel_enabled'], this._fresnelEnabled ? 1.0 : 0.0);
                    gl.uniform1f(locations.uniforms['u_fresnel_power'], this._fresnelPower);
                    gl.uniform1f(locations.uniforms['u_fresnel_intensity'], this._fresnelIntensity);
                    gl.uniform3fv(locations.uniforms['u_fresnel_color'], this._fresnelColorRgb);

                    gl.uniform1f(locations.uniforms['u_iridescence_enabled'], this._iridescenceEnabled ? 1.0 : 0.0);
                    gl.uniform1f(locations.uniforms['u_iridescence_intensity'], this._iridescenceIntensity);
                    gl.uniform1f(locations.uniforms['u_iridescence_speed'], this._iridescenceSpeed);

                    gl.uniform1f(locations.uniforms['u_bloom_intensity'], this._bloomIntensity);
                    gl.uniform1f(locations.uniforms['u_bloom_threshold'], this._bloomThreshold);
                    gl.uniform1f(locations.uniforms['u_chromatic_aberration'], this._chromaticAberration);
                    gl.uniform1f(locations.uniforms['u_silhouette_fade'], this._silhouetteFade);
                    gl.uniform1f(locations.uniforms['u_cylinder_fade'], this._cylinderFade);
                    gl.uniform1f(locations.uniforms['u_ribbon_fade'], this._ribbonFade);
                    gl.uniform1f(locations.uniforms['u_flat_shading'], this._flatShading ? 1.0 : 0.0);

                    this._uniformsDirty = false;
                    this._yOffsetDirty = false;
                }

                // Only regenerate procedural texture when needed
                if (this._textureNeedsUpdate && this._enableProceduralTexture) {
                    if (this._proceduralTexture) {
                        gl.deleteTexture(this._proceduralTexture);
                    }
                    this._proceduralTexture = this._createProceduralTexture(gl);
                    this._textureNeedsUpdate = false;
                    this._textureDirty = true;
                }

                // Procedural texture binding — only when texture changes
                if (this._textureDirty && this._proceduralTexture) {
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, this._proceduralTexture);
                    gl.uniform1i(locations.uniforms['u_procedural_texture'], 1);
                    this._textureDirty = false;
                }

                // Color update — only when colors have changed
                if (this._colorsChanged) {
                    this._colorsChanged = false;

                    for (let i = 0; i < COLORS_COUNT; i++) {
                        if (i < this._colors.length) {
                            const c = this._colors[i];
                            const rgb = this._cachedColorRgb[i] || [0, 0, 0];
                            gl.uniform1f(locations.uniforms[`u_colors[${i}].is_active`], c.enabled ? 1.0 : 0.0);
                            gl.uniform3fv(locations.uniforms[`u_colors[${i}].color`], rgb);
                            gl.uniform1f(locations.uniforms[`u_colors[${i}].influence`], c.influence || 0);
                        } else {
                            gl.uniform1f(locations.uniforms[`u_colors[${i}].is_active`], 0.0);
                        }
                    }

                    gl.uniform1i(locations.uniforms['u_colors_count'], COLORS_COUNT);
                }
            }


            // Draw scene
            gl.clearColor(
                this._backgroundColorRgb[0],
                this._backgroundColorRgb[1],
                this._backgroundColorRgb[2],
                this._backgroundAlpha
            );
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            if (this._wireframe) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.wireframeIndex);
                gl.drawElements(gl.LINES, this.glState.wireframeIndexCount, indexType, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.index);
            } else {
                gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0);
            }

            // Draw watermark overlay inside the canvas (skipped for licensed users)
            if (!this._licensed) this._renderWatermark(gl);

            if (this._isVisible) {
                this.requestRef = requestAnimationFrame(render);
            }
        };

        // Visibility optimization: pause rendering when off-screen or tab hidden
        this._visibilityObserver = new IntersectionObserver((entries) => {
            const wasVisible = this._isVisible;
            this._isVisible = entries[0].isIntersecting && document.visibilityState !== 'hidden';
            if (this._isVisible && !wasVisible) {
                lastTime = performance.now(); // Avoid time jump after resume
                this.requestRef = requestAnimationFrame(render);
            }
        }, { threshold: 0 });
        this._visibilityObserver.observe(ref);

        this._visibilityHandler = () => {
            const wasVisible = this._isVisible;
            if (document.visibilityState === 'hidden') {
                this._isVisible = false;
            } else {
                this._isVisible = true;
                if (!wasVisible) {
                    lastTime = performance.now();
                    this.requestRef = requestAnimationFrame(render);
                }
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        const setSize = (width: number, height: number) => {

            const { gl, camera } = this.glState;

            // Update canvas buffer dimensions to match layout size
            this._ref.width = width;
            this._ref.height = height;

            gl.viewport(0, 0, width, height);

            updateCamera(camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);

            // Recompute projection matrix on resize
            const projLoc = this.glState.locations.uniforms["projectionMatrix"];
            gl.useProgram(this.glState.program);
            if (projLoc) gl.uniformMatrix4fv(projLoc, false, camera.projectionMatrix.elements);
            this._uniformsDirty = true;
        };

        // Debounce resize to prevent excessive operations
        // Dimensions are extracted from contentRect immediately (no layout cost)
        // and captured in the closure for the debounced callback.
        this.sizeObserver = new ResizeObserver((entries) => {
            const entry = entries[entries.length - 1];
            const width = Math.round(entry.contentRect.width);
            const height = Math.round(entry.contentRect.height);
            if (this._resizeTimeoutId !== null) {
                clearTimeout(this._resizeTimeoutId);
            }
            this._resizeTimeoutId = window.setTimeout(() => {
                setSize(width, height);
                this._resizeTimeoutId = null;
            }, 100); // Wait 100ms after last resize event
        });

        this.sizeObserver.observe(ref);


        render();
    }

    destroy() {
        cancelAnimationFrame(this.requestRef);
        this.sizeObserver.disconnect();

        // Cleanup visibility observers
        if (this._visibilityObserver) {
            this._visibilityObserver.disconnect();
            this._visibilityObserver = null;
        }
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this._visibilityHandler = null;
        }

        // Clear resize timeout
        if (this._resizeTimeoutId !== null) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = null;
        }

        // Remove watermark click/hover listeners
        if (this._wmClickHandler) {
            document.removeEventListener('click', this._wmClickHandler, true);
            this._wmClickHandler = null;
        }
        if (this._wmMoveHandler) {
            document.removeEventListener('mousemove', this._wmMoveHandler);
            this._wmMoveHandler = null;
        }

        // Cleanup WebGL resources
        if (this.glState) {
            const gl = this.glState.gl;
            gl.deleteProgram(this.glState.program);
            gl.deleteBuffer(this.glState.buffers.position);
            gl.deleteBuffer(this.glState.buffers.normal);
            gl.deleteBuffer(this.glState.buffers.uv);
            gl.deleteBuffer(this.glState.buffers.index);
            gl.deleteBuffer(this.glState.buffers.wireframeIndex);

            // Cleanup watermark resources
            if (this._watermarkProgram) gl.deleteProgram(this._watermarkProgram);
            if (this._watermarkTexture) gl.deleteTexture(this._watermarkTexture);
            if (this._watermarkBuffer) gl.deleteBuffer(this._watermarkBuffer);
            if (this._watermarkTexCoordBuffer) gl.deleteBuffer(this._watermarkTexCoordBuffer);
            // Cleanup VAOs
            const gl2 = gl as WebGL2RenderingContext;
            if (gl2.deleteVertexArray) {
                if (this._gradientVAO) gl2.deleteVertexArray(this._gradientVAO);
                if (this._watermarkVAO) gl2.deleteVertexArray(this._watermarkVAO);
            }

        }
        if (this._proceduralTexture && this.glState) {
            this.glState.gl.deleteTexture(this._proceduralTexture);
        }
    }

    // ── Manual getters/setters (special logic) ──

    get colors(): NeatColor[] {
        return this._colors;
    }
    set colors(colors: NeatColor[]) {
        this._uniformsDirty = true;
        this._colors = colors;
        this._cachedColorRgb = colors.map(c => this._hexToRgb(c.color));
        this._colorsChanged = true;
    }

    get grainScale(): number {
        return this._grainScale;
    }
    set grainScale(grainScale: number) {
        this._uniformsDirty = true;
        this._grainScale = grainScale == 0 ? 1 : grainScale;
    }

    get resolution(): number {
        return this._resolution;
    }
    set resolution(resolution: number) {
        if (this._resolution === resolution) return;
        this._resolution = resolution;
        this._updateGeometry();
    }

    get backgroundColor(): string {
        return this._backgroundColor;
    }
    set backgroundColor(backgroundColor: string) {
        this._uniformsDirty = true;
        this._backgroundColor = backgroundColor;
        this._backgroundColorRgb = this._hexToRgb(backgroundColor);
    }

    get yOffset(): number {
        return this._yOffset;
    }
    set yOffset(yOffset: number) {
        if (this._yOffset !== yOffset) {
            this._yOffsetDirty = true;
            this._yOffset = yOffset;
        }
    }

    get enableProceduralTexture(): boolean {
        return this._enableProceduralTexture;
    }
    set enableProceduralTexture(value: boolean) {
        this._uniformsDirty = true;
        this._enableProceduralTexture = value;
        if (value && !this._proceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    _updateGeometry() {
        if (!this.glState) return;
        const gl = this.glState.gl;
        const resolution = this._resolution || 1;

        let geometry;
        if (this._shapeType === 'sphere') {
            geometry = generateSphereGeometry(this._sphereRadius, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'torus') {
            geometry = generateTorusGeometry(this._torusRadius, this._torusTube, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'cylinder') {
            geometry = generateCylinderGeometry(this._cylinderRadius, this._cylinderRadius, this._cylinderHeight, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'ribbon') {
            geometry = generateRibbonGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution, this._planeBend, this._planeTwist);
        } else {
            geometry = generatePlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution);
        }
        const { position, normal, uv, index, wireframeIndex } = geometry;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, normal, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.wireframeIndex);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireframeIndex, gl.STATIC_DRAW);

        // Restore default bound element buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.index);

        this.glState.indexCount = index.length;
        this.glState.wireframeIndexCount = wireframeIndex.length;
        this.glState.indexType = (index instanceof Uint32Array) ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;

        // Keep camera updated with the new shapeType and dimensions
        const width = this._ref.width;
        const height = this._ref.height;
        updateCamera(this.glState.camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);

        // Recompute projection matrix
        const projLoc = this.glState.locations.uniforms["projectionMatrix"];
        gl.useProgram(this.glState.program);
        if (projLoc) gl.uniformMatrix4fv(projLoc, false, this.glState.camera.projectionMatrix.elements);

        this._uniformsDirty = true;
    }

    _hexToRgb(hex: string): [number, number, number] {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return [
            ((bigint >> 16) & 255) / 255.0,
            ((bigint >> 8) & 255) / 255.0,
            (bigint & 255) / 255.0
        ];
    }

    _initScene(resolution: number, preserveDrawingBuffer: boolean = false): WebGLState {

        const width = this._ref.clientWidth;
        const height = this._ref.clientHeight;

        // Set canvas buffer dimensions to match layout (one-time init)
        this._ref.width = width;
        this._ref.height = height;

        const gl = this._ref.getContext("webgl2", { alpha: true, preserveDrawingBuffer, antialias: true }) ||
            this._ref.getContext("webgl", { alpha: true, preserveDrawingBuffer, antialias: true });

        if (!gl) {
            throw new Error("WebGL not supported");
        }

        const ext = gl.getExtension("OES_standard_derivatives");
        gl.getExtension("OES_element_index_uint");

        gl.viewport(0, 0, width, height);

        // Generate parametric geometry based on shapeType
        let geometry;
        if (this._shapeType === 'sphere') {
            geometry = generateSphereGeometry(this._sphereRadius, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'torus') {
            geometry = generateTorusGeometry(this._torusRadius, this._torusTube, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'cylinder') {
            geometry = generateCylinderGeometry(this._cylinderRadius, this._cylinderRadius, this._cylinderHeight, 120 * resolution, 120 * resolution);
        } else if (this._shapeType === 'ribbon') {
            geometry = generateRibbonGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution, this._planeBend, this._planeTwist);
        } else {
            geometry = generatePlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution);
        }
        const { position, normal, uv, index, wireframeIndex } = geometry;

        const positionBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

        const normalBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normal, gl.STATIC_DRAW);

        const uvBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

        const wireframeIndexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireframeIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireframeIndex, gl.STATIC_DRAW);

        // Rebind the triangle index buffer as default
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const vertShaderSourceCombined = buildVertUniforms() + "\n" + buildNoise() + "\n" + buildColorFunctions() + "\n" + vertexShaderSource;
        const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertShader, vertShaderSourceCombined);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.log("VERTEX_SHADER_ERROR_START");
            console.log("Vertex shader error: ", gl.getShaderInfoLog(vertShader));
            console.log("GL Error Code:", gl.getError());
            console.log("Vertex Shader Source Dump:");
            console.log(vertShaderSourceCombined.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n'));
            console.log("VERTEX_SHADER_ERROR_END");
        }

        const fragShaderSourceCombined = buildFragUniforms() + "\n" + buildColorFunctions() + "\n" + buildNoise() + "\n" + fragmentShaderSource;
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragShader, fragShaderSourceCombined);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.log("FRAGMENT_SHADER_ERROR_START");
            console.log("Fragment shader error: ", gl.getShaderInfoLog(fragShader));
            console.log("GL Error Code:", gl.getError());
            console.log("Fragment Shader Source Dump:");
            console.log(fragShaderSourceCombined.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n'));
            console.log("FRAGMENT_SHADER_ERROR_END");
        }

        const program = gl.createProgram()!;
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log("PROGRAM_LINK_ERROR_START");
            console.log("Program linking error: ", gl.getProgramInfoLog(program));
            console.log("GL Error Code:", gl.getError());
            console.log("PROGRAM_LINK_ERROR_END");
        }

        gl.useProgram(program);

        const camera = new OrthographicCamera(0, 0, 0, 0, 0, 1000);
        camera.position = [0, 0, 5];
        updateCamera(camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);

        // Define attributes
        const aPosition = gl.getAttribLocation(program, "position");
        const aNormal = gl.getAttribLocation(program, "normal");
        const aUv = gl.getAttribLocation(program, "uv");

        gl.enableVertexAttribArray(aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(aNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(aUv);
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // modelViewMatrix is set dynamically in the render loop

        const projLoc = gl.getUniformLocation(program, "projectionMatrix");
        gl.uniformMatrix4fv(projLoc, false, camera.projectionMatrix.elements);

        const planeWidthLoc = gl.getUniformLocation(program, "u_plane_width");
        gl.uniform1f(planeWidthLoc, PLANE_WIDTH);

        const planeHeightLoc = gl.getUniformLocation(program, "u_plane_height");
        gl.uniform1f(planeHeightLoc, PLANE_HEIGHT);

        const colorsCountLoc = gl.getUniformLocation(program, "u_colors_count");
        gl.uniform1i(colorsCountLoc, COLORS_COUNT);

        const uniformsList = [
            "projectionMatrix", "modelViewMatrix",
            "u_time", "u_resolution", "u_color_pressure", "u_wave_frequency_x", "u_wave_frequency_y",
            "u_wave_amplitude", "u_colors_count", "u_plane_width", "u_plane_height", "u_shadows",
            "u_highlights", "u_grain_intensity", "u_grain_sparsity", "u_grain_scale", "u_grain_speed",
            "u_flow_distortion_a", "u_flow_distortion_b", "u_flow_scale", "u_flow_ease", "u_flow_enabled",
            "u_y_offset", "u_y_offset_wave_multiplier", "u_y_offset_color_multiplier", "u_y_offset_flow_multiplier",

            "u_procedural_texture", "u_enable_procedural_texture", "u_texture_ease", "u_transparent_texture_void", "u_saturation", "u_brightness", "u_color_blending",
            "u_domain_warp_enabled", "u_domain_warp_intensity", "u_domain_warp_scale",
            "u_vignette_intensity", "u_vignette_radius",
            "u_fresnel_enabled", "u_fresnel_power", "u_fresnel_intensity", "u_fresnel_color",
            "u_iridescence_enabled", "u_iridescence_intensity", "u_iridescence_speed",
            "u_bloom_intensity", "u_bloom_threshold", "u_chromatic_aberration",
            "u_shape_type", "u_silhouette_fade", "u_cylinder_fade", "u_ribbon_fade", "u_flat_shading"
        ];

        const locations: WebGLState["locations"] = {
            attributes: { position: aPosition, normal: aNormal, uv: aUv },
            uniforms: {}
        };

        uniformsList.forEach(name => {
            locations.uniforms[name] = gl.getUniformLocation(program, name);
        });

        // Add colors uniforms manually
        for (let i = 0; i < COLORS_COUNT; i++) {
            locations.uniforms[`u_colors[${i}].is_active`] = gl.getUniformLocation(program, `u_colors[${i}].is_active`);
            locations.uniforms[`u_colors[${i}].color`] = gl.getUniformLocation(program, `u_colors[${i}].color`);
            locations.uniforms[`u_colors[${i}].influence`] = gl.getUniformLocation(program, `u_colors[${i}].influence`);
        }

        this._initialized = true;
        // New program needs all uniforms re-uploaded on first frame
        this._uniformsDirty = true;
        this._colorsChanged = true;
        this._textureDirty = true;

        // Enable alpha blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);

        return {
            gl,
            program,
            buffers: {
                position: positionBuffer,
                normal: normalBuffer,
                uv: uvBuffer,
                index: indexBuffer,
                wireframeIndex: wireframeIndexBuffer
            },
            locations,
            camera,
            indexCount: index.length,
            wireframeIndexCount: wireframeIndex.length,
            indexType: (index instanceof Uint32Array) ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
        };
    }



    _createProceduralTexture(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLTexture | null {
        // Texture size - 1024 provides good balance between quality and performance
        // Reduced from 2048 for better performance
        const texSize = 1024;
        
        if (!this._sourceCanvas) {
            this._sourceCanvas = document.createElement('canvas');
            this._sourceCanvas.width = texSize;
            this._sourceCanvas.height = texSize;
            this._sourceCtx = this._sourceCanvas.getContext('2d');
        }
        const sourceCanvas = this._sourceCanvas;
        const sCtx = this._sourceCtx;
        if (!sCtx) return null;

        let seed = this._textureSeed;
        const baseSeed = this._textureSeed;

        function random() {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        // Helper to reset seed for isolated shape generation
        const setSeed = (offset: number) => {
            seed = baseSeed + offset;
        };

        const colors = this._colors.filter(c => c.enabled).map(c => c.color);
        if (colors.length === 0) return null;

        const shouldTile = this._shapeType !== 'plane';
        const dxs = shouldTile ? [-1, 0, 1] : [0];
        const dys = shouldTile ? [-1, 0, 1] : [0];

        // Helper functions
        function hexToRgb(hex: string) {
            const bigint = parseInt(hex.replace('#', ''), 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        }

        function rgbToHex(r: number, g: number, b: number) {
            return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).padStart(6, '0');
        }

        const getInterColor = () => {
            const c1 = colors[Math.floor(random() * colors.length)];
            const c2 = colors[Math.floor(random() * colors.length)];
            const mix = random() * this._textureColorBlending;
            const rgb1 = hexToRgb(c1);
            const rgb2 = hexToRgb(c2);
            const r = rgb1.r + (rgb2.r - rgb1.r) * mix;
            const g = rgb1.g + (rgb2.g - rgb1.g) * mix;
            const b = rgb1.b + (rgb2.b - rgb1.b) * mix;
            return rgbToHex(r, g, b);
        };

        // === SOURCE CANVAS ===
        // Base with procedural background color so even sparse areas pick it up
        const baseColor = this._proceduralBackgroundColor || "#000000";
        sCtx.fillStyle = baseColor;
        sCtx.fillRect(0, 0, texSize, texSize);

        // Then lay a vertical gradient of mixed colors on top for richness
        const bgGrad = sCtx.createLinearGradient(0, 0, 0, texSize);
        bgGrad.addColorStop(0, getInterColor());
        bgGrad.addColorStop(1, getInterColor());
        sCtx.fillStyle = bgGrad;
        sCtx.fillRect(0, 0, texSize, texSize);

        // Triangles: use configurable count
        for (let i = 0; i < this._textureShapeTriangles; i++) {
            const fillStyle = getInterColor();
            const x = random() * texSize;
            const y = random() * texSize;
            const s = 100 + random() * 300;
            const x1 = (random() - 0.5) * s;
            const y1 = (random() - 0.5) * s;
            const x2 = (random() - 0.5) * s;
            const y2 = (random() - 0.5) * s;

            for (const dx of dxs) {
                for (const dy of dys) {
                    sCtx.fillStyle = fillStyle;
                    sCtx.beginPath();
                    const tx = x + dx * texSize;
                    const ty = y + dy * texSize;
                    sCtx.moveTo(tx, ty);
                    sCtx.lineTo(tx + x1, ty + y1);
                    sCtx.lineTo(tx + x2, ty + y2);
                    sCtx.fill();
                }
            }
        }

        // Circles / rings: use configurable count
        for (let i = 0; i < this._textureShapeCircles; i++) {
            const strokeStyle = getInterColor();
            const lineWidth = 10 + random() * 50;
            const x = random() * texSize;
            const y = random() * texSize;
            const r = 50 + random() * 150;

            for (const dx of dxs) {
                for (const dy of dys) {
                    sCtx.strokeStyle = strokeStyle;
                    sCtx.lineWidth = lineWidth;
                    sCtx.beginPath();
                    sCtx.arc(x + dx * texSize, y + dy * texSize, r, 0, Math.PI * 2);
                    sCtx.stroke();
                }
            }
        }

        // Bars: use configurable count
        for (let i = 0; i < this._textureShapeBars; i++) {
            const fillStyle = getInterColor();
            const x = random() * texSize;
            const y = random() * texSize;
            const rot = random() * Math.PI;

            for (const dx of dxs) {
                for (const dy of dys) {
                    sCtx.fillStyle = fillStyle;
                    sCtx.save();
                    sCtx.translate(x + dx * texSize, y + dy * texSize);
                    sCtx.rotate(rot);
                    sCtx.fillRect(-150, -25, 300, 50);
                    sCtx.restore();
                }
            }
        }

        // Squiggles: use configurable count
        sCtx.lineWidth = 15;
        sCtx.lineCap = 'round';
        for (let i = 0; i < this._textureShapeSquiggles; i++) {
            const strokeStyle = getInterColor();
            const x = random() * texSize;
            const y = random() * texSize;
            
            const curves: Array<{ cx1: number, cy1: number, cx2: number, cy2: number, ex: number, ey: number }> = [];
            let cx = 0;
            let cy = 0;
            for (let j = 0; j < 4; j++) {
                const ex = cx + (random() - 0.5) * 300;
                const ey = cy + (random() - 0.5) * 300;
                curves.push({
                    cx1: cx + (random() - 0.5) * 300,
                    cy1: cy + (random() - 0.5) * 300,
                    cx2: cx + (random() - 0.5) * 300,
                    cy2: cy + (random() - 0.5) * 300,
                    ex: ex,
                    ey: ey
                });
                cx = ex;
                cy = ey;
            }

            for (const dx of dxs) {
                for (const dy of dys) {
                    sCtx.strokeStyle = strokeStyle;
                    sCtx.beginPath();
                    const tx = x + dx * texSize;
                    const ty = y + dy * texSize;
                    sCtx.moveTo(tx, ty);
                    
                    for (const curve of curves) {
                        sCtx.bezierCurveTo(
                            tx + curve.cx1, ty + curve.cy1,
                            tx + curve.cx2, ty + curve.cy2,
                            tx + curve.ex, ty + curve.ey
                        );
                    }
                    sCtx.stroke();
                }
            }
        }

        // === MASKED CANVAS ===
        // Masking: Seed isolation
        setSeed(50000);
        if (!this._maskedCanvas) {
            this._maskedCanvas = document.createElement('canvas');
            this._maskedCanvas.width = texSize;
            this._maskedCanvas.height = texSize;
            this._maskedCtx = this._maskedCanvas.getContext('2d');
        }
        const canvas = this._maskedCanvas;
        const ctx = this._maskedCtx;
        if (!ctx) return null;

        // Start filled with the chosen void color so gaps show that color
        if (this._transparentTextureVoid) {
            ctx.clearRect(0, 0, texSize, texSize);
        } else {
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, texSize, texSize);
        }

        // Determine layout segments (matter vs void)
        let layoutHead = 0;
        const segments: Array<{ type: 'void' | 'matter', x: number, width: number }> = [];

        while (layoutHead < texSize) {
            const isVoid = random() < this._textureVoidLikelihood;
            if (isVoid) {
                const w = this._textureVoidWidthMin + random() * (this._textureVoidWidthMax - this._textureVoidWidthMin);
                segments.push({ type: 'void', x: layoutHead, width: w });
                layoutHead += w;
            } else {
                const w = 50 + random() * 200;
                segments.push({ type: 'matter', x: layoutHead, width: w });
                layoutHead += w;
            }
        }

        // Render only matter bands from the source into the masked canvas
        for (const seg of segments) {
            if (seg.type === 'matter') {
                const startX = seg.x;
                const endX = Math.min(seg.x + seg.width, texSize);
                let currentX = startX;

                while (currentX < endX) {
                    const stripeWidth = (2 + random() * 20) / this._textureBandDensity;
                    const sourceX = Math.floor(random() * texSize);
                    ctx.drawImage(
                        sourceCanvas,
                        sourceX, 0, stripeWidth, texSize,
                        currentX, 0, stripeWidth, texSize
                    );
                    currentX += stripeWidth;
                }
            }
            // void segments: leave as baseColor
        }

        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        const ext = gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (ext) {
            const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, max));
        }

        return tex;
    }

    // ── Manual getters/setters (special logic) ──

    get fresnelColor(): string {
        return this._fresnelColor;
    }
    set fresnelColor(fresnelColor: string) {
        if (this._fresnelColor !== fresnelColor) {
            this._fresnelColor = fresnelColor;
            this._fresnelColorRgb = this._hexToRgb(fresnelColor);
            this._uniformsDirty = true;
        }
    }

    // Getters and Setters for 3D Shapes
    get shapeType(): 'plane' | 'sphere' | 'torus' | 'cylinder' | 'ribbon' {
        return this._shapeType;
    }
    set shapeType(val: 'plane' | 'sphere' | 'torus' | 'cylinder' | 'ribbon') {
        if (this._shapeType !== val) {
            this._shapeType = val;
            this._updateGeometry();
        }
    }

    // Camera Getters and Setters
    get cameraLock(): boolean { return this._cameraLock; }
    set cameraLock(val: boolean) {
        this._cameraLock = val;
    }

    get cameraZoom(): number { return this._cameraZoom; }
    set cameraZoom(val: number) {
        if (this._cameraZoom !== val) {
            this._cameraZoom = val;
            this._updateCameraFrustum();
        }
    }

    _updateCameraFrustum() {
        if (!this.glState) return;
        const gl = this.glState.gl;
        const width = this._ref.width;
        const height = this._ref.height;
        updateCamera(this.glState.camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);

        const projLoc = this.glState.locations.uniforms["projectionMatrix"];
        gl.useProgram(this.glState.program);
        if (projLoc) gl.uniformMatrix4fv(projLoc, false, this.glState.camera.projectionMatrix.elements);
        this._uniformsDirty = true;
    }

    /**
     * Compiles the watermark shader, creates the text texture, and sets up
     * the screen-space quad buffers. Uses VAOs on WebGL2 to minimise
     * per-frame state switching (~2 calls instead of ~20).
     */
    private _initWatermark(): void {
        const gl = this.glState.gl;
        const gl2 = gl as WebGL2RenderingContext;
        const hasVAO = typeof gl2.createVertexArray === 'function';

        // ── 1. Compile watermark shader program ──
        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, WATERMARK_VS);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, WATERMARK_FS);
        gl.compileShader(fs);

        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        this._watermarkProgram = prog;

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        // ── 2. Rasterise "NEAT" text into an offscreen canvas ──
        const fontSize = 13;
        const padX = 6;
        const padY = 5;

        const measure = document.createElement('canvas').getContext('2d')!;
        measure.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const metrics = measure.measureText('NEAT');
        const textW = Math.ceil(metrics.width);
        const textH = fontSize;

        const cw = textW + padX * 2;
        const ch = textH + padY * 2;
        this._watermarkWidth = cw;
        this._watermarkHeight = ch;

        const c = document.createElement('canvas');
        c.width = cw;
        c.height = ch;
        const ctx = c.getContext('2d')!;

        ctx.clearRect(0, 0, cw, ch);
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('NEAT', cw / 2, ch / 2);

        // ── 3. Upload as a WebGL texture ──
        const tex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        this._watermarkTexture = tex;

        // ── 4. Create buffers ──
        const tcBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, tcBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW);
        this._watermarkTexCoordBuffer = tcBuf;

        const posBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW);
        this._watermarkBuffer = posBuf;

        // Cache attribute/uniform locations
        this._wmLocPos = gl.getAttribLocation(prog, 'a_wm_position');
        this._wmLocTc = gl.getAttribLocation(prog, 'a_wm_texcoord');
        this._wmLocTex = gl.getUniformLocation(prog, 'u_wm_texture');

        // ── 5. Set up VAOs (WebGL2 only) for fast state switching ──
        if (hasVAO) {
            // Watermark VAO
            this._watermarkVAO = gl2.createVertexArray();
            gl2.bindVertexArray(this._watermarkVAO);
            gl.enableVertexAttribArray(this._wmLocPos);
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.vertexAttribPointer(this._wmLocPos, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this._wmLocTc);
            gl.bindBuffer(gl.ARRAY_BUFFER, tcBuf);
            gl.vertexAttribPointer(this._wmLocTc, 2, gl.FLOAT, false, 0, 0);

            // Gradient VAO — capture current gradient attribute state
            this._gradientVAO = gl2.createVertexArray();
            gl2.bindVertexArray(this._gradientVAO);
            const locs = this.glState.locations.attributes;
            gl.enableVertexAttribArray(locs.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.position);
            gl.vertexAttribPointer(locs.position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(locs.normal);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.normal);
            gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(locs.uv);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.uv);
            gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.index);

            // Leave gradient VAO bound as default
            gl2.bindVertexArray(this._gradientVAO);
        } else {
            // WebGL1: re-bind gradient buffers (already done in _initScene)
        }

        // ── 6. Make the watermark region clickable (throttled) ──
        this._wmClickHandler = (e: MouseEvent) => {
            if (this._isOverWatermark(e)) {
                e.preventDefault();
                e.stopPropagation();
                window.open('https://neat.firecms.co', '_blank', 'noopener');
            }
        };
        this._wmMoveHandler = (e: MouseEvent) => {
            if (this._wmMoveRafPending) return;
            this._wmMoveRafPending = true;
            requestAnimationFrame(() => {
                this._wmMoveRafPending = false;
                const now = performance.now();
                if (!this._wmCachedRect || now - this._wmRectCacheTime > 100) {
                    this._wmCachedRect = this._ref.getBoundingClientRect();
                    this._wmRectCacheTime = now;
                }
                const rect = this._wmCachedRect;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cw = rect.width;
                const ch = rect.height;
                if (x < 0 || y < 0 || x > cw || y > ch) {
                    if (this._ref.style.cursor === 'pointer') this._ref.style.cursor = '';
                    if (document.body.style.cursor === 'pointer') document.body.style.cursor = '';
                    return;
                }
                const m = this._watermarkMargin;
                const ww = this._watermarkWidth;
                const wh = this._watermarkHeight;
                const left = cw - m - ww;
                const top = ch - m - wh;
                const over = x >= left && x <= cw - m && y >= top && y <= ch - m;
                this._ref.style.cursor = over ? 'pointer' : '';
                if (over) {
                    document.body.style.cursor = 'pointer';
                } else if (document.body.style.cursor === 'pointer') {
                    document.body.style.cursor = '';
                }
            });
        };
        document.addEventListener('click', this._wmClickHandler, true);
        document.addEventListener('mousemove', this._wmMoveHandler);
    }

    /** Returns true if the mouse event is inside the watermark's pixel bounds. */
    private _isOverWatermark(e: MouseEvent): boolean {
        const now = performance.now();
        if (!this._wmCachedRect || now - this._wmRectCacheTime > 100) {
            this._wmCachedRect = this._ref.getBoundingClientRect();
            this._wmRectCacheTime = now;
        }
        const rect = this._wmCachedRect;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cw = rect.width;
        const ch = rect.height;
        if (x < 0 || y < 0 || x > cw || y > ch) return false;

        const m = this._watermarkMargin;
        const ww = this._watermarkWidth;
        const wh = this._watermarkHeight;
        const left = cw - m - ww;
        const top = ch - m - wh;

        return x >= left && x <= cw - m && y >= top && y <= ch - m;
    }

    /**
     * Draws the watermark quad as a second pass after the main gradient.
     * Uses VAO switching on WebGL2 (~2 GL calls) or manual restore on WebGL1.
     */
    private _renderWatermark(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
        const prog = this._watermarkProgram;
        const tex = this._watermarkTexture;
        const posBuf = this._watermarkBuffer;
        if (!prog || !tex || !posBuf) return;

        const canvasW = this._ref.width;
        const canvasH = this._ref.height;
        if (canvasW === 0 || canvasH === 0) return;

        const margin = 4;
        const qw = this._watermarkWidth;
        const qh = this._watermarkHeight;

        const r = 1.0 - (margin / canvasW) * 2.0;
        const l = r - (qw / canvasW) * 2.0;
        const b = -1.0 + (margin / canvasH) * 2.0;
        const t = b + (qh / canvasH) * 2.0;

        const posData = this._wmPosData;
        posData[0] = l; posData[1] = b;
        posData[2] = r; posData[3] = b;
        posData[4] = l; posData[5] = t;
        posData[6] = r; posData[7] = t;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData);

        const gl2 = gl as WebGL2RenderingContext;
        const hasVAO = this._watermarkVAO !== null;

        // Switch to watermark state
        gl.useProgram(prog);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        if (hasVAO) {
            // WebGL2 fast path: single VAO bind sets all attributes
            gl2.bindVertexArray(this._watermarkVAO);
            // Re-bind position buffer since it's DYNAMIC_DRAW and was just updated
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.vertexAttribPointer(this._wmLocPos, 2, gl.FLOAT, false, 0, 0);
        } else {
            // WebGL1 fallback: manual attribute setup
            gl.enableVertexAttribArray(this._wmLocPos);
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.vertexAttribPointer(this._wmLocPos, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this._wmLocTc);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._watermarkTexCoordBuffer!);
            gl.vertexAttribPointer(this._wmLocTc, 2, gl.FLOAT, false, 0, 0);
        }

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(this._wmLocTex, 2);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Restore gradient state
        gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.glState.program);

        if (hasVAO) {
            // WebGL2 fast path: single VAO bind restores all gradient attributes
            gl2.bindVertexArray(this._gradientVAO);
        } else {
            // WebGL1 fallback: manual attribute restore
            const locs = this.glState.locations.attributes;
            gl.enableVertexAttribArray(locs.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.position);
            gl.vertexAttribPointer(locs.position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(locs.normal);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.normal);
            gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(locs.uv);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glState.buffers.uv);
            gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glState.buffers.index);
        }
    }
}

// Generate getters/setters from the descriptor table
for (const [pub, priv, gf, sf, mode] of PROP_DESCRIPTORS) {
    Object.defineProperty(NeatGradient.prototype, pub, {
        get(this: NeatGradient) {
            return gf === 1 ? (this as any)[priv] : (this as any)[priv] * gf;
        },
        set(this: NeatGradient, v: any) {
            const stored = sf === 1 ? v : v * sf;
            // Skip update if value hasn't changed (avoids unnecessary uniform uploads)
            if ((this as any)[priv] === stored) return;
            (this as any)[priv] = stored;
            (this as any)._uniformsDirty = true;
            if (mode === 't' && (this as any)._enableProceduralTexture) {
                (this as any)._textureNeedsUpdate = true;
            } else if (mode === 'g') {
                (this as any)._updateGeometry();
            }
        },
        enumerable: true,
        configurable: true,
    });
}


function getElapsedSecondsInLastHour() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return (minutes * 60) + seconds;
}



/**
 * Injects a <meta name="generator"> tag — the industry-standard, SEO-safe
 * way for tools/libraries to identify themselves (used by WordPress, Hugo, etc.).
 * This is semantically correct and will not harm the end-user's SEO.
 */
function injectMetaGenerator() {
    if (document.querySelector('meta[name="generator"][content*="NEAT"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'generator';
    meta.content = 'NEAT by FireCMS — https://neat.firecms.co';
    document.head.appendChild(meta);
}

// ── Watermark shaders (minimal pass-through for a textured screen quad) ──

const WATERMARK_VS = `
attribute vec2 a_wm_position;
attribute vec2 a_wm_texcoord;
varying vec2 v_wm_texcoord;
void main() {
    gl_Position = vec4(a_wm_position, 0.0, 1.0);
    v_wm_texcoord = a_wm_texcoord;
}
`;

const WATERMARK_FS = `
precision mediump float;
varying vec2 v_wm_texcoord;
uniform sampler2D u_wm_texture;
void main() {
    gl_FragColor = texture2D(u_wm_texture, v_wm_texcoord);
}
`;
