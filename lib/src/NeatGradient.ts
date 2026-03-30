import { buildColorFunctions, buildNoise, buildVertUniforms, buildFragUniforms, fragmentShaderSource, vertexShaderSource } from "./shaders";
import { generatePlaneGeometry, OrthographicCamera, updateCamera, Matrix4 } from "./math";

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
            textureShapeTriangles = 20,
            textureShapeCircles = 15,
            textureShapeBars = 15,
            textureShapeSquiggles = 10,

            domainWarpEnabled = false,
            domainWarpIntensity = 0.5,
            domainWarpScale = 1.0,
            vignetteIntensity = 0.5,
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

                    gl.uniform1f(locations.uniforms['u_enable_procedural_texture'], this._enableProceduralTexture ? 1.0 : 0.0);
                    gl.uniform1f(locations.uniforms['u_texture_ease'], this._textureEase);

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

            updateCamera(camera, width, height);



            // Recompute projection matrix on resize
            const projLoc = gl.getUniformLocation(this.glState.program, "projectionMatrix");
            gl.useProgram(this.glState.program);
            gl.uniformMatrix4fv(projLoc, false, camera.projectionMatrix.elements);
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

    set speed(speed: number) {
        this._uniformsDirty = true;
        this._speed = speed / 20;
    }

    set horizontalPressure(horizontalPressure: number) {
        this._uniformsDirty = true;
        this._horizontalPressure = horizontalPressure / 4;
    }

    set verticalPressure(verticalPressure: number) {
        this._uniformsDirty = true;
        this._verticalPressure = verticalPressure / 4;
    }

    set waveFrequencyX(waveFrequencyX: number) {
        this._uniformsDirty = true;
        this._waveFrequencyX = waveFrequencyX * 0.04;
    }

    set waveFrequencyY(waveFrequencyY: number) {
        this._uniformsDirty = true;
        this._waveFrequencyY = waveFrequencyY * 0.04;
    }

    set waveAmplitude(waveAmplitude: number) {
        this._uniformsDirty = true;
        this._waveAmplitude = waveAmplitude * .75;
    }

    set colors(colors: NeatColor[]) {
        this._uniformsDirty = true;
        this._colors = colors;
        this._cachedColorRgb = colors.map(c => this._hexToRgb(c.color));
        this._colorsChanged = true;
    }

    set highlights(highlights: number) {
        this._uniformsDirty = true;
        this._highlights = highlights / 100;
    }

    set shadows(shadows: number) {
        this._uniformsDirty = true;
        this._shadows = shadows / 100;
    }

    set colorSaturation(colorSaturation: number) {
        this._uniformsDirty = true;
        this._saturation = colorSaturation / 10;
    }

    set colorBrightness(colorBrightness: number) {
        this._uniformsDirty = true;
        this._brightness = colorBrightness;
    }

    set colorBlending(colorBlending: number) {
        this._uniformsDirty = true;
        this._colorBlending = colorBlending / 10;
    }

    set grainScale(grainScale: number) {
        this._uniformsDirty = true;
        this._grainScale = grainScale == 0 ? 1 : grainScale;
    }

    set grainIntensity(grainIntensity: number) {
        this._uniformsDirty = true;
        this._grainIntensity = grainIntensity;
    }

    set grainSparsity(grainSparsity: number) {
        this._uniformsDirty = true;
        this._grainSparsity = grainSparsity;
    }

    set grainSpeed(grainSpeed: number) {
        this._uniformsDirty = true;
        this._grainSpeed = grainSpeed;
    }

    set wireframe(wireframe: boolean) {
        this._uniformsDirty = true;
        this._wireframe = wireframe;
    }

    set resolution(resolution: number) {
        this._uniformsDirty = true;
        if (this.glState) {
            const gl = this.glState.gl;
            gl.deleteProgram(this.glState.program);
            gl.deleteBuffer(this.glState.buffers.position);
            gl.deleteBuffer(this.glState.buffers.normal);
            gl.deleteBuffer(this.glState.buffers.uv);
            gl.deleteBuffer(this.glState.buffers.index);
            gl.deleteBuffer(this.glState.buffers.wireframeIndex);
        }
        this.glState = this._initScene(resolution);
    }

    set backgroundColor(backgroundColor: string) {
        this._uniformsDirty = true;
        this._backgroundColor = backgroundColor;
        this._backgroundColorRgb = this._hexToRgb(backgroundColor);
    }

    set backgroundAlpha(backgroundAlpha: number) {
        this._uniformsDirty = true;
        this._backgroundAlpha = backgroundAlpha;
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

    set flowDistortionA(value: number) {
        this._uniformsDirty = true;
        this._flowDistortionA = value;
    }

    set flowDistortionB(value: number) {
        this._uniformsDirty = true;
        this._flowDistortionB = value;
    }

    set flowScale(value: number) {
        this._uniformsDirty = true;
        this._flowScale = value;
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



    set enableProceduralTexture(value: boolean) {
        this._uniformsDirty = true;
        this._enableProceduralTexture = value;
        if (value && !this._proceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidLikelihood(value: number) {
        this._uniformsDirty = true;
        this._textureVoidLikelihood = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidWidthMin(value: number) {
        this._uniformsDirty = true;
        this._textureVoidWidthMin = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidWidthMax(value: number) {
        this._uniformsDirty = true;
        this._textureVoidWidthMax = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureBandDensity(value: number) {
        this._uniformsDirty = true;
        this._textureBandDensity = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureColorBlending(value: number) {
        this._uniformsDirty = true;
        this._textureColorBlending = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
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

    set proceduralBackgroundColor(value: string) {
        this._uniformsDirty = true;
        this._proceduralBackgroundColor = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureShapeTriangles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeTriangles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeCircles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeCircles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeBars(value: number) {
        this._uniformsDirty = true;
        this._textureShapeBars = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeSquiggles(value: number) {
        this._uniformsDirty = true;
        this._textureShapeSquiggles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
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

        // Generate plane geometry with Uint32Array for large meshes
        const { position, normal, uv, index, wireframeIndex } = generatePlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution);

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
        updateCamera(camera, width, height);

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

        const modelViewMatrix = new Matrix4();
        // The View Matrix is the inverse of the Camera's position
        // Camera is at [0, 0, 5], so view matrix translates by [0, 0, -5]
        modelViewMatrix.translate(-camera.position[0], -camera.position[1], -camera.position[2]);

        // The Model Matrix mimicking: plane.rotation.x = -Math.PI / 3.5; plane.position.z = -1;
        modelViewMatrix.translate(0, 0, -1);
        modelViewMatrix.rotateX(-Math.PI / 3.5);

        const mvLoc = gl.getUniformLocation(program, "modelViewMatrix");
        gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix.elements);

        const projLoc = gl.getUniformLocation(program, "projectionMatrix");
        gl.uniformMatrix4fv(projLoc, false, camera.projectionMatrix.elements);

        const planeWidthLoc = gl.getUniformLocation(program, "u_plane_width");
        gl.uniform1f(planeWidthLoc, PLANE_WIDTH);

        const planeHeightLoc = gl.getUniformLocation(program, "u_plane_height");
        gl.uniform1f(planeHeightLoc, PLANE_HEIGHT);

        const colorsCountLoc = gl.getUniformLocation(program, "u_colors_count");
        gl.uniform1i(colorsCountLoc, COLORS_COUNT);

        const uniformsList = [
            "u_time", "u_resolution", "u_color_pressure", "u_wave_frequency_x", "u_wave_frequency_y",
            "u_wave_amplitude", "u_colors_count", "u_plane_width", "u_plane_height", "u_shadows",
            "u_highlights", "u_grain_intensity", "u_grain_sparsity", "u_grain_scale", "u_grain_speed",
            "u_flow_distortion_a", "u_flow_distortion_b", "u_flow_scale", "u_flow_ease", "u_flow_enabled",
            "u_y_offset", "u_y_offset_wave_multiplier", "u_y_offset_color_multiplier", "u_y_offset_flow_multiplier",

            "u_procedural_texture", "u_enable_procedural_texture", "u_texture_ease", "u_saturation", "u_brightness", "u_color_blending",
            "u_domain_warp_enabled", "u_domain_warp_intensity", "u_domain_warp_scale",
            "u_vignette_intensity", "u_vignette_radius",
            "u_fresnel_enabled", "u_fresnel_power", "u_fresnel_intensity", "u_fresnel_color",
            "u_iridescence_enabled", "u_iridescence_intensity", "u_iridescence_speed",
            "u_bloom_intensity", "u_bloom_threshold", "u_chromatic_aberration"
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
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = texSize;
        sourceCanvas.height = texSize;
        const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
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
            sCtx.fillStyle = getInterColor();
            sCtx.beginPath();
            const x = random() * texSize;
            const y = random() * texSize;
            const s = 100 + random() * 300;
            sCtx.moveTo(x, y);
            sCtx.lineTo(x + (random() - 0.5) * s, y + (random() - 0.5) * s);
            sCtx.lineTo(x + (random() - 0.5) * s, y + (random() - 0.5) * s);
            sCtx.fill();
        }

        // Circles / rings: use configurable count
        for (let i = 0; i < this._textureShapeCircles; i++) {
            sCtx.strokeStyle = getInterColor();
            sCtx.lineWidth = 10 + random() * 50;
            sCtx.beginPath();
            const x = random() * texSize;
            const y = random() * texSize;
            const r = 50 + random() * 150;
            sCtx.arc(x, y, r, 0, Math.PI * 2);
            sCtx.stroke();
        }

        // Bars: use configurable count
        for (let i = 0; i < this._textureShapeBars; i++) {
            sCtx.fillStyle = getInterColor();
            sCtx.save();
            sCtx.translate(random() * texSize, random() * texSize);
            sCtx.rotate(random() * Math.PI);
            sCtx.fillRect(-150, -25, 300, 50);
            sCtx.restore();
        }

        // Squiggles: use configurable count
        sCtx.lineWidth = 15;
        sCtx.lineCap = 'round';
        for (let i = 0; i < this._textureShapeSquiggles; i++) {
            sCtx.strokeStyle = getInterColor();
            sCtx.beginPath();
            let x = random() * texSize;
            let y = random() * texSize;
            sCtx.moveTo(x, y);
            for (let j = 0; j < 4; j++) {
                sCtx.bezierCurveTo(
                    x + (random() - 0.5) * 300, y + (random() - 0.5) * 300,
                    x + (random() - 0.5) * 300, y + (random() - 0.5) * 300,
                    x + (random() - 0.5) * 300, y + (random() - 0.5) * 300
                );
                x += (random() - 0.5) * 300;
                y += (random() - 0.5) * 300;
            }
            sCtx.stroke();
        }

        // === MASKED CANVAS ===
        // Masking: Seed isolation
        setSeed(50000);
        const canvas = document.createElement('canvas');
        canvas.width = texSize;
        canvas.height = texSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        // Start filled with the chosen void color so gaps show that color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, texSize, texSize);

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

    set domainWarpEnabled(enabled: boolean) {
        if (this._domainWarpEnabled !== enabled) {
            this._domainWarpEnabled = enabled;
            this._uniformsDirty = true;
        }
    }
    set domainWarpIntensity(intensity: number) {
        if (this._domainWarpIntensity !== intensity) {
            this._domainWarpIntensity = intensity;
            this._uniformsDirty = true;
        }
    }
    set domainWarpScale(scale: number) {
        if (this._domainWarpScale !== scale) {
            this._domainWarpScale = scale;
            this._uniformsDirty = true;
        }
    }
    set vignetteIntensity(intensity: number) {
        if (this._vignetteIntensity !== intensity) {
            this._vignetteIntensity = intensity;
            this._uniformsDirty = true;
        }
    }
    set vignetteRadius(radius: number) {
        if (this._vignetteRadius !== radius) {
            this._vignetteRadius = radius;
            this._uniformsDirty = true;
        }
    }
    set fresnelEnabled(enabled: boolean) {
        if (this._fresnelEnabled !== enabled) {
            this._fresnelEnabled = enabled;
            this._uniformsDirty = true;
        }
    }
    set fresnelPower(power: number) {
        if (this._fresnelPower !== power) {
            this._fresnelPower = power;
            this._uniformsDirty = true;
        }
    }
    set fresnelIntensity(intensity: number) {
        if (this._fresnelIntensity !== intensity) {
            this._fresnelIntensity = intensity;
            this._uniformsDirty = true;
        }
    }
    set fresnelColor(fresnelColor: string) {
        if (this._fresnelColor !== fresnelColor) {
            this._fresnelColor = fresnelColor;
            this._fresnelColorRgb = this._hexToRgb(fresnelColor);
            this._uniformsDirty = true;
        }
    }
    set iridescenceEnabled(enabled: boolean) {
        if (this._iridescenceEnabled !== enabled) {
            this._iridescenceEnabled = enabled;
            this._uniformsDirty = true;
        }
    }
    set iridescenceIntensity(intensity: number) {
        if (this._iridescenceIntensity !== intensity) {
            this._iridescenceIntensity = intensity;
            this._uniformsDirty = true;
        }
    }
    set iridescenceSpeed(speed: number) {
        if (this._iridescenceSpeed !== speed) {
            this._iridescenceSpeed = speed;
            this._uniformsDirty = true;
        }
    }
    set bloomIntensity(intensity: number) {
        if (this._bloomIntensity !== intensity) {
            this._bloomIntensity = intensity;
            this._uniformsDirty = true;
        }
    }
    set bloomThreshold(threshold: number) {
        if (this._bloomThreshold !== threshold) {
            this._bloomThreshold = threshold;
            this._uniformsDirty = true;
        }
    }
    set chromaticAberration(aberration: number) {
        if (this._chromaticAberration !== aberration) {
            this._chromaticAberration = aberration;
            this._uniformsDirty = true;
        }
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
