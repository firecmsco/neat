import { buildColorFunctions, buildNoise, buildVertUniforms, buildFragUniforms, fragmentShaderSource, vertexShaderSource } from "./shaders";
import { generatePlaneGeometry, generateSphereGeometry, generateTorusGeometry, generateCylinderGeometry, generateRibbonGeometry, OrthographicCamera, updateCamera, Matrix4 } from "./math";

console.info(
    "%c🌈 Neat Gradients%c\n\nLicensed under MIT + The Commons Clause.\nFree for personal and commercial use.\nSelling this software or its derivatives is strictly prohibited.\nhttps://neat.firecms.co",
    "font-weight: bold; font-size: 14px; color: #FF5772;", "color: inherit;"
);

const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 80;


const COLORS_COUNT = 6;

const LINK_ID = generateRandomString();

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

export class NeatGradient implements NeatController {

    private _ref: HTMLCanvasElement;

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
    private _linkElement: HTMLAnchorElement | null = null;
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
    private _linkCheckCounter: number = 0;
    private _colorsChanged: boolean = true;
    private _uniformsDirty: boolean = true;
    private _textureDirty: boolean = true;

    constructor(config: NeatConfig & { ref: HTMLCanvasElement, resolution?: number, seed?: number }) {

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

        this.glState = this._initScene(resolution);

        injectSEO();

        let tick = seed !== undefined ? seed : getElapsedSecondsInLastHour();
        let lastTime = performance.now();

        const render = () => {

            const { gl, program, locations, indexCount, indexType } = this.glState;

            // Optimization: check if cached link is still valid in DOM less frequently
            this._linkCheckCounter++;
            if (this._linkCheckCounter >= 300) { // Check every ~5 seconds at 60fps
                this._linkCheckCounter = 0;
                if (!this._linkElement || !document.contains(this._linkElement)) {
                    this._linkElement = addNeatLink(ref);
                }
            }

            if (this._initialized) {
                const timeNow = performance.now();
                tick += ((timeNow - lastTime) / 1000) * this._speed;
                lastTime = timeNow;

                gl.useProgram(program);

                gl.uniform1f(locations.uniforms['u_time'], tick);

                // Update modelViewMatrix in every frame to support dynamic rotation and auto-rotation
                const camera = this.glState.camera;
                const modelViewMatrix = new Matrix4();
                
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

                // Only upload static uniforms when they've been modified
                if (this._uniformsDirty) {
                    gl.uniform2f(locations.uniforms['u_resolution'], this._ref.clientWidth, this._ref.clientHeight);
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

            this.requestRef = requestAnimationFrame(render);
        };

        const setSize = () => {

            const { gl, camera } = this.glState;
            const width = this._ref.clientWidth;
            const height = this._ref.clientHeight;

            // Handle high DPI displays properly without scaling buffer resolution, matching client width
            this._ref.width = width;
            this._ref.height = height;

            gl.viewport(0, 0, width, height);

            updateCamera(camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);



            // Recompute projection matrix on resize
            const projLoc = this.glState.locations.uniforms["projectionMatrix"];
            gl.useProgram(this.glState.program);
            if (projLoc) gl.uniformMatrix4fv(projLoc, false, camera.projectionMatrix.elements);
        };

        // Debounce resize to prevent excessive operations
        this.sizeObserver = new ResizeObserver(() => {
            if (this._resizeTimeoutId !== null) {
                clearTimeout(this._resizeTimeoutId);
            }
            this._resizeTimeoutId = window.setTimeout(() => {
                setSize();
                this._resizeTimeoutId = null;
            }, 100); // Wait 100ms after last resize event
        });

        this.sizeObserver.observe(ref);


        render();
    }

    destroy() {
        cancelAnimationFrame(this.requestRef);
        this.sizeObserver.disconnect();

        // Clear resize timeout
        if (this._resizeTimeoutId !== null) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = null;
        }

        // Remove NEAT link
        if (this._linkElement && this._linkElement.parentElement) {
            this._linkElement.parentElement.removeChild(this._linkElement);
            this._linkElement = null;
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
        }
        if (this._proceduralTexture && this.glState) {
            this.glState.gl.deleteTexture(this._proceduralTexture);
        }
    }

    downloadAsPNG(filename = "neat.png") {
        const dataURL = this._ref.toDataURL("image/png");
        downloadURI(dataURL, filename);
    }

    /**
     * Records the canvas animation as a video with a NEAT watermark overlay.
     * @param options.durationMs  Recording duration in milliseconds (default 5000).
     * @param options.filename    Output file name (default "neat.firecms.co").
     * @param options.width       Output video width in pixels (default: current canvas width).
     * @param options.height      Output video height in pixels (default: current canvas height).
     * @param options.format      Preferred format: 'mp4' or 'webm' (default: best available).
     * @param options.onProgress  Callback with progress 0-1.
     * @param options.onComplete  Callback when recording finishes.
     * @returns A stop function to end recording early.
     */
    recordVideo(options: {
        durationMs?: number;
        filename?: string;
        width?: number;
        height?: number;
        format?: 'mp4' | 'webm';
        onProgress?: (progress: number) => void;
        onComplete?: () => void;
    } = {}): () => void {
        const {
            durationMs = 5000,
            filename = "neat.firecms.co",
            format,
            onProgress,
            onComplete,
        } = options;

        const source = this._ref;
        const width = options.width || source.width || source.clientWidth;
        const height = options.height || source.height || source.clientHeight;

        // Offscreen canvas that composites gradient + watermark each frame
        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d")!;

        // Use captureStream(0) — only captures a frame when we explicitly
        // call requestFrame() on the video track, so every composited frame
        // is guaranteed to be captured.
        const stream = offscreen.captureStream(0);
        const videoTrack = stream.getVideoTracks()[0];

        // Codec candidates ordered by preference
        const mp4Candidates = [
            "video/mp4;codecs=avc1",
            "video/mp4;codecs=avc1,opus",
            "video/mp4",
        ];
        const webmCandidates = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8,opus",
            "video/webm",
        ];

        // Build candidate list based on preferred format
        let candidates: string[];
        if (format === 'mp4') candidates = [...mp4Candidates, ...webmCandidates];
        else if (format === 'webm') candidates = [...webmCandidates, ...mp4Candidates];
        else candidates = [...mp4Candidates, ...webmCandidates];

        let mimeType = "video/webm";
        for (const candidate of candidates) {
            if (MediaRecorder.isTypeSupported(candidate)) {
                mimeType = candidate;
                break;
            }
        }

        // Scale bitrate with pixel count: 8 Mbps baseline at 720p
        const pixels = width * height;
        const baseBitrate = 8_000_000;
        const basePixels = 1280 * 720;
        const videoBitsPerSecond = Math.round(baseBitrate * Math.max(1, pixels / basePixels));

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        let stopped = false;
        let rafId: number;
        const startTime = performance.now();
        let lastProgressTime = 0;

        // Composite loop: draw source canvas + watermark overlay on each frame
        const drawFrame = () => {
            if (stopped) return;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(source, 0, 0, width, height);

            // Watermark: "NEAT" in bottom-right corner
            const fontSize = Math.max(14, Math.round(height * 0.025));
            ctx.font = `bold ${fontSize}px "Sofia Sans", sans-serif`;
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText("NEAT", width - fontSize * 0.8, height - fontSize * 0.5);
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Signal the stream to capture this frame
            // @ts-ignore – requestFrame exists on CanvasCaptureMediaStreamTrack
            if (videoTrack.requestFrame) videoTrack.requestFrame();

            // Throttle progress to ~4 updates/sec to avoid flooding React state
            if (onProgress) {
                const now = performance.now();
                if (now - lastProgressTime > 250) {
                    lastProgressTime = now;
                    onProgress(Math.min(0.99, (now - startTime) / durationMs));
                }
            }

            rafId = requestAnimationFrame(drawFrame);
        };

        recorder.onstop = () => {
            stopped = true;
            cancelAnimationFrame(rafId);

            // Use the correct file extension for the actual format
            const isMP4 = mimeType.startsWith("video/mp4");
            const ext = isMP4 ? ".mp4" : ".webm";
            const blobType = isMP4 ? "video/mp4" : "video/webm";
            const finalFilename = filename + ext;

            const blob = new Blob(chunks, { type: blobType });
            const url = URL.createObjectURL(blob);
            downloadURI(url, finalFilename);
            setTimeout(() => URL.revokeObjectURL(url), 30000);

            onProgress?.(1);
            onComplete?.();
        };

        // Start drawing frames, then start recording
        drawFrame();
        recorder.start(100); // collect data every 100ms

        // Auto-stop after the requested duration
        const timeoutId = window.setTimeout(() => {
            if (recorder.state === "recording") {
                recorder.stop();
            }
        }, durationMs);

        // Return a stop function for early termination
        return () => {
            clearTimeout(timeoutId);
            if (recorder.state === "recording") {
                recorder.stop();
            }
        };
    }
    get speed(): number {
        return this._speed * 20;
    }
    set speed(speed: number) {
        this._uniformsDirty = true;
        this._speed = speed / 20;
    }

    get horizontalPressure(): number {
        return this._horizontalPressure * 4;
    }
    set horizontalPressure(horizontalPressure: number) {
        this._uniformsDirty = true;
        this._horizontalPressure = horizontalPressure / 4;
    }

    get verticalPressure(): number {
        return this._verticalPressure * 4;
    }
    set verticalPressure(verticalPressure: number) {
        this._uniformsDirty = true;
        this._verticalPressure = verticalPressure / 4;
    }

    get waveFrequencyX(): number {
        return this._waveFrequencyX / 0.04;
    }
    set waveFrequencyX(waveFrequencyX: number) {
        this._uniformsDirty = true;
        this._waveFrequencyX = waveFrequencyX * 0.04;
    }

    get waveFrequencyY(): number {
        return this._waveFrequencyY / 0.04;
    }
    set waveFrequencyY(waveFrequencyY: number) {
        this._uniformsDirty = true;
        this._waveFrequencyY = waveFrequencyY * 0.04;
    }

    get waveAmplitude(): number {
        return this._waveAmplitude / 0.75;
    }
    set waveAmplitude(waveAmplitude: number) {
        this._uniformsDirty = true;
        this._waveAmplitude = waveAmplitude * .75;
    }

    get colors(): NeatColor[] {
        return this._colors;
    }
    set colors(colors: NeatColor[]) {
        this._uniformsDirty = true;
        this._colors = colors;
        this._cachedColorRgb = colors.map(c => this._hexToRgb(c.color));
        this._colorsChanged = true;
    }

    get highlights(): number {
        return this._highlights * 100;
    }
    set highlights(highlights: number) {
        this._uniformsDirty = true;
        this._highlights = highlights / 100;
    }

    get shadows(): number {
        return this._shadows * 100;
    }
    set shadows(shadows: number) {
        this._uniformsDirty = true;
        this._shadows = shadows / 100;
    }

    get colorSaturation(): number {
        return this._saturation * 10;
    }
    set colorSaturation(colorSaturation: number) {
        this._uniformsDirty = true;
        this._saturation = colorSaturation / 10;
    }

    get colorBrightness(): number {
        return this._brightness;
    }
    set colorBrightness(colorBrightness: number) {
        this._uniformsDirty = true;
        this._brightness = colorBrightness;
    }

    get colorBlending(): number {
        return this._colorBlending * 10;
    }
    set colorBlending(colorBlending: number) {
        this._uniformsDirty = true;
        this._colorBlending = colorBlending / 10;
    }

    get grainScale(): number {
        return this._grainScale;
    }
    set grainScale(grainScale: number) {
        this._uniformsDirty = true;
        this._grainScale = grainScale == 0 ? 1 : grainScale;
    }

    get grainIntensity(): number {
        return this._grainIntensity;
    }
    set grainIntensity(grainIntensity: number) {
        this._uniformsDirty = true;
        this._grainIntensity = grainIntensity;
    }

    get grainSparsity(): number {
        return this._grainSparsity;
    }
    set grainSparsity(grainSparsity: number) {
        this._uniformsDirty = true;
        this._grainSparsity = grainSparsity;
    }

    get grainSpeed(): number {
        return this._grainSpeed;
    }
    set grainSpeed(grainSpeed: number) {
        this._uniformsDirty = true;
        this._grainSpeed = grainSpeed;
    }

    get wireframe(): boolean {
        return this._wireframe;
    }
    set wireframe(wireframe: boolean) {
        this._uniformsDirty = true;
        this._wireframe = wireframe;
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

    get backgroundAlpha(): number {
        return this._backgroundAlpha;
    }
    set backgroundAlpha(backgroundAlpha: number) {
        this._uniformsDirty = true;
        this._backgroundAlpha = backgroundAlpha;
    }

    get yOffset(): number {
        return this._yOffset;
    }
    set yOffset(yOffset: number) {
        this._uniformsDirty = true;
        this._yOffset = yOffset;
    }

    get yOffsetWaveMultiplier(): number {
        return this._yOffsetWaveMultiplier * 1000;
    }

    set yOffsetWaveMultiplier(value: number) {
        this._uniformsDirty = true;
        this._yOffsetWaveMultiplier = value / 1000;
    }

    get yOffsetColorMultiplier(): number {
        return this._yOffsetColorMultiplier * 1000;
    }

    set yOffsetColorMultiplier(value: number) {
        this._uniformsDirty = true;
        this._yOffsetColorMultiplier = value / 1000;
    }

    get yOffsetFlowMultiplier(): number {
        return this._yOffsetFlowMultiplier * 1000;
    }

    set yOffsetFlowMultiplier(value: number) {
        this._uniformsDirty = true;
        this._yOffsetFlowMultiplier = value / 1000;
    }

    get flowDistortionA(): number {
        return this._flowDistortionA;
    }
    set flowDistortionA(value: number) {
        this._uniformsDirty = true;
        this._flowDistortionA = value;
    }

    get flowDistortionB(): number {
        return this._flowDistortionB;
    }
    set flowDistortionB(value: number) {
        this._uniformsDirty = true;
        this._flowDistortionB = value;
    }

    get flowScale(): number {
        return this._flowScale;
    }
    set flowScale(value: number) {
        this._uniformsDirty = true;
        this._flowScale = value;
    }

    get flowEase(): number {
        return this._flowEase;
    }
    set flowEase(value: number) {
        this._uniformsDirty = true;
        this._flowEase = value;
    }

    set flowEnabled(value: boolean) {
        this._uniformsDirty = true;
        this._flowEnabled = value;
    }

    get flowEnabled(): boolean {
        return this._flowEnabled;
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

    get textureVoidLikelihood(): number {
        return this._textureVoidLikelihood;
    }
    set textureVoidLikelihood(value: number) {
        this._uniformsDirty = true;
        this._textureVoidLikelihood = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureVoidWidthMin(): number {
        return this._textureVoidWidthMin;
    }
    set textureVoidWidthMin(value: number) {
        this._uniformsDirty = true;
        this._textureVoidWidthMin = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureVoidWidthMax(): number {
        return this._textureVoidWidthMax;
    }
    set textureVoidWidthMax(value: number) {
        this._uniformsDirty = true;
        this._textureVoidWidthMax = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureBandDensity(): number {
        return this._textureBandDensity;
    }
    set textureBandDensity(value: number) {
        this._uniformsDirty = true;
        this._textureBandDensity = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureColorBlending(): number {
        return this._textureColorBlending;
    }
    set textureColorBlending(value: number) {
        this._uniformsDirty = true;
        this._textureColorBlending = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureSeed(): number {
        return this._textureSeed;
    }
    set textureSeed(value: number) {
        this._uniformsDirty = true;
        this._textureSeed = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureEase(): number {
        return this._textureEase;
    }

    set textureEase(value: number) {
        this._uniformsDirty = true;
        this._textureEase = value;
    }

    get transparentTextureVoid(): boolean {
        return this._transparentTextureVoid;
    }

    set transparentTextureVoid(value: boolean) {
        this._uniformsDirty = true;
        this._transparentTextureVoid = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get proceduralBackgroundColor(): string {
        return this._proceduralBackgroundColor;
    }
    set proceduralBackgroundColor(value: string) {
        this._uniformsDirty = true;
        this._proceduralBackgroundColor = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureShapeTriangles(): number {
        return this._textureShapeTriangles;
    }
    set textureShapeTriangles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeTriangles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    get textureShapeCircles(): number {
        return this._textureShapeCircles;
    }
    set textureShapeCircles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeCircles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    get textureShapeBars(): number {
        return this._textureShapeBars;
    }
    set textureShapeBars(value: number) {
        this._uniformsDirty = true;
        this._textureShapeBars = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    get textureShapeSquiggles(): number {
        return this._textureShapeSquiggles;
    }
    set textureShapeSquiggles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeSquiggles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
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
        const width = this._ref.clientWidth;
        const height = this._ref.clientHeight;
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

    _initScene(resolution: number): WebGLState {

        const width = this._ref.clientWidth;
        const height = this._ref.clientHeight;

        const gl = this._ref.getContext("webgl2", { alpha: true, preserveDrawingBuffer: true, antialias: true }) ||
            this._ref.getContext("webgl", { alpha: true, preserveDrawingBuffer: true, antialias: true });

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

    get silhouetteFade(): number {
        return this._silhouetteFade;
    }
    set silhouetteFade(value: number) {
        if (this._silhouetteFade !== value) {
            this._silhouetteFade = value;
            this._uniformsDirty = true;
        }
    }

    get cylinderFade(): number {
        return this._cylinderFade;
    }
    set cylinderFade(value: number) {
        if (this._cylinderFade !== value) {
            this._cylinderFade = value;
            this._uniformsDirty = true;
        }
    }

    get ribbonFade(): number {
        return this._ribbonFade;
    }
    set ribbonFade(value: number) {
        if (this._ribbonFade !== value) {
            this._ribbonFade = value;
            this._uniformsDirty = true;
        }
    }

    get flatShading(): boolean {
        return this._flatShading;
    }
    set flatShading(value: boolean) {
        if (this._flatShading !== value) {
            this._flatShading = value;
            this._uniformsDirty = true;
        }
    }

    get domainWarpEnabled(): boolean {
        return this._domainWarpEnabled;
    }
    set domainWarpEnabled(enabled: boolean) {
        if (this._domainWarpEnabled !== enabled) {
            this._domainWarpEnabled = enabled;
            this._uniformsDirty = true;
        }
    }

    get domainWarpIntensity(): number {
        return this._domainWarpIntensity;
    }
    set domainWarpIntensity(intensity: number) {
        if (this._domainWarpIntensity !== intensity) {
            this._domainWarpIntensity = intensity;
            this._uniformsDirty = true;
        }
    }

    get domainWarpScale(): number {
        return this._domainWarpScale;
    }
    set domainWarpScale(scale: number) {
        if (this._domainWarpScale !== scale) {
            this._domainWarpScale = scale;
            this._uniformsDirty = true;
        }
    }

    get vignetteIntensity(): number {
        return this._vignetteIntensity;
    }
    set vignetteIntensity(intensity: number) {
        if (this._vignetteIntensity !== intensity) {
            this._vignetteIntensity = intensity;
            this._uniformsDirty = true;
        }
    }

    get vignetteRadius(): number {
        return this._vignetteRadius;
    }
    set vignetteRadius(radius: number) {
        if (this._vignetteRadius !== radius) {
            this._vignetteRadius = radius;
            this._uniformsDirty = true;
        }
    }

    get fresnelEnabled(): boolean {
        return this._fresnelEnabled;
    }
    set fresnelEnabled(enabled: boolean) {
        if (this._fresnelEnabled !== enabled) {
            this._fresnelEnabled = enabled;
            this._uniformsDirty = true;
        }
    }

    get fresnelPower(): number {
        return this._fresnelPower;
    }
    set fresnelPower(power: number) {
        if (this._fresnelPower !== power) {
            this._fresnelPower = power;
            this._uniformsDirty = true;
        }
    }

    get fresnelIntensity(): number {
        return this._fresnelIntensity;
    }
    set fresnelIntensity(intensity: number) {
        if (this._fresnelIntensity !== intensity) {
            this._fresnelIntensity = intensity;
            this._uniformsDirty = true;
        }
    }

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

    get iridescenceEnabled(): boolean {
        return this._iridescenceEnabled;
    }
    set iridescenceEnabled(enabled: boolean) {
        if (this._iridescenceEnabled !== enabled) {
            this._iridescenceEnabled = enabled;
            this._uniformsDirty = true;
        }
    }

    get iridescenceIntensity(): number {
        return this._iridescenceIntensity;
    }
    set iridescenceIntensity(intensity: number) {
        if (this._iridescenceIntensity !== intensity) {
            this._iridescenceIntensity = intensity;
            this._uniformsDirty = true;
        }
    }

    get iridescenceSpeed(): number {
        return this._iridescenceSpeed;
    }
    set iridescenceSpeed(speed: number) {
        if (this._iridescenceSpeed !== speed) {
            this._iridescenceSpeed = speed;
            this._uniformsDirty = true;
        }
    }

    get bloomIntensity(): number {
        return this._bloomIntensity;
    }
    set bloomIntensity(intensity: number) {
        if (this._bloomIntensity !== intensity) {
            this._bloomIntensity = intensity;
            this._uniformsDirty = true;
        }
    }

    get bloomThreshold(): number {
        return this._bloomThreshold;
    }
    set bloomThreshold(threshold: number) {
        if (this._bloomThreshold !== threshold) {
            this._bloomThreshold = threshold;
            this._uniformsDirty = true;
        }
    }

    get chromaticAberration(): number {
        return this._chromaticAberration;
    }
    set chromaticAberration(aberration: number) {
        if (this._chromaticAberration !== aberration) {
            this._chromaticAberration = aberration;
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

    get shapeRotationX(): number { return this._shapeRotationX; }
    set shapeRotationX(val: number) {
        this._shapeRotationX = val;
        this._uniformsDirty = true;
    }

    get shapeRotationY(): number { return this._shapeRotationY; }
    set shapeRotationY(val: number) {
        this._shapeRotationY = val;
        this._uniformsDirty = true;
    }

    get shapeRotationZ(): number { return this._shapeRotationZ; }
    set shapeRotationZ(val: number) {
        this._shapeRotationZ = val;
        this._uniformsDirty = true;
    }

    get shapeAutoRotateSpeedX(): number { return this._shapeAutoRotateSpeedX; }
    set shapeAutoRotateSpeedX(val: number) {
        this._shapeAutoRotateSpeedX = val;
        this._uniformsDirty = true;
    }

    get shapeAutoRotateSpeedY(): number { return this._shapeAutoRotateSpeedY; }
    set shapeAutoRotateSpeedY(val: number) {
        this._shapeAutoRotateSpeedY = val;
        this._uniformsDirty = true;
    }

    get sphereRadius(): number { return this._sphereRadius; }
    set sphereRadius(val: number) {
        if (this._sphereRadius !== val) {
            this._sphereRadius = val;
            this._updateGeometry();
        }
    }

    get torusRadius(): number { return this._torusRadius; }
    set torusRadius(val: number) {
        if (this._torusRadius !== val) {
            this._torusRadius = val;
            this._updateGeometry();
        }
    }

    get torusTube(): number { return this._torusTube; }
    set torusTube(val: number) {
        if (this._torusTube !== val) {
            this._torusTube = val;
            this._updateGeometry();
        }
    }

    get cylinderRadius(): number { return this._cylinderRadius; }
    set cylinderRadius(val: number) {
        if (this._cylinderRadius !== val) {
            this._cylinderRadius = val;
            this._updateGeometry();
        }
    }

    get cylinderHeight(): number { return this._cylinderHeight; }
    set cylinderHeight(val: number) {
        if (this._cylinderHeight !== val) {
            this._cylinderHeight = val;
            this._updateGeometry();
        }
    }

    get planeBend(): number { return this._planeBend; }
    set planeBend(val: number) {
        if (this._planeBend !== val) {
            this._planeBend = val;
            this._updateGeometry();
        }
    }

    get planeTwist(): number { return this._planeTwist; }
    set planeTwist(val: number) {
        if (this._planeTwist !== val) {
            this._planeTwist = val;
            this._updateGeometry();
        }
    }

    // Camera Getters and Setters
    get cameraLock(): boolean { return this._cameraLock; }
    set cameraLock(val: boolean) {
        this._cameraLock = val;
    }

    get cameraX(): number { return this._cameraX; }
    set cameraX(val: number) {
        this._cameraX = val;
        this._uniformsDirty = true;
    }

    get cameraY(): number { return this._cameraY; }
    set cameraY(val: number) {
        this._cameraY = val;
        this._uniformsDirty = true;
    }

    get cameraZ(): number { return this._cameraZ; }
    set cameraZ(val: number) {
        this._cameraZ = val;
        this._uniformsDirty = true;
    }

    get cameraRotationX(): number { return this._cameraRotationX; }
    set cameraRotationX(val: number) {
        this._cameraRotationX = val;
        this._uniformsDirty = true;
    }

    get cameraRotationY(): number { return this._cameraRotationY; }
    set cameraRotationY(val: number) {
        this._cameraRotationY = val;
        this._uniformsDirty = true;
    }

    get cameraRotationZ(): number { return this._cameraRotationZ; }
    set cameraRotationZ(val: number) {
        this._cameraRotationZ = val;
        this._uniformsDirty = true;
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
        const width = this._ref.clientWidth;
        const height = this._ref.clientHeight;
        updateCamera(this.glState.camera, width, height, PLANE_WIDTH, PLANE_HEIGHT, this._shapeType, this._cameraZoom);

        const projLoc = this.glState.locations.uniforms["projectionMatrix"];
        gl.useProgram(this.glState.program);
        if (projLoc) gl.uniformMatrix4fv(projLoc, false, this.glState.camera.projectionMatrix.elements);
        this._uniformsDirty = true;
    }
}


const setLinkStyles = (link: HTMLAnchorElement) => {
    link.id = LINK_ID;
    link.href = "https://neat.firecms.co";
    link.target = "_blank";
    link.style.position = "absolute";
    link.style.display = "block";
    link.style.bottom = "0";
    link.style.right = "0";
    link.style.padding = "10px";
    link.style.color = "#dcdcdc";
    link.style.opacity = "0.8";
    link.style.fontFamily = "sans-serif";
    link.style.fontSize = "16px";
    link.style.fontWeight = "bold";
    link.style.textDecoration = "none";
    link.style.zIndex = "10000";
    link.style.pointerEvents = "auto";
    link.setAttribute("data-n", "1");
    link.innerHTML = "NEAT";
}

const addNeatLink = (ref: HTMLCanvasElement): HTMLAnchorElement => {
    const parent = ref.parentElement;
    // Ensure parent has position so absolute link is positioned relative to it
    if (parent && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
    }
    // Search parent for existing neat link (survives HMR where LINK_ID changes)
    if (parent) {
        const existing = parent.querySelector('a[data-n]') as HTMLAnchorElement;
        if (existing) {
            setLinkStyles(existing);
            return existing;
        }
    }
    const link = document.createElement("a");
    setLinkStyles(link);
    parent?.appendChild(link);
    return link;
}

function getElapsedSecondsInLastHour() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return (minutes * 60) + seconds;
}

function generateRandomString(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

function downloadURI(uri: string, name: string) {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function injectSEO() {
    if (document.getElementById("neat-seo-schema")) return;

    // 1. JSON-LD Schema
    const script = document.createElement('script');
    script.id = "neat-seo-schema";
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "NEAT Gradient",
        "url": "https://neat.firecms.co",
        "author": {
            "@type": "Organization",
            "name": "FireCMS",
            "url": "https://firecms.co"
        },
        "description": "Beautiful, fast, heavily customizable, WebGL based gradients."
    });
    document.head.appendChild(script);

    // 2. Hidden Backlink via Shadow DOM
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.width = '1px';
    hiddenContainer.style.height = '1px';
    hiddenContainer.style.padding = '0';
    hiddenContainer.style.margin = '-1px';
    hiddenContainer.style.overflow = 'hidden';
    hiddenContainer.style.clip = 'rect(0, 0, 0, 0)';
    hiddenContainer.style.whiteSpace = 'nowrap';
    hiddenContainer.style.borderWidth = '0';

    try {
        const shadow = hiddenContainer.attachShadow({ mode: 'closed' });
        const link = document.createElement('a');
        link.href = "https://firecms.co";
        link.textContent = "FireCMS";
        shadow.appendChild(link);
    } catch (e) {
        const link = document.createElement('a');
        link.href = "https://firecms.co";
        link.textContent = "FireCMS";
        hiddenContainer.appendChild(link);
    }

    document.body.appendChild(hiddenContainer);
}
