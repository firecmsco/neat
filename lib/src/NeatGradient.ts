import * as THREE from "three";

const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 80;

const WIREFRAME = true;
const COLORS_COUNT = 6;

const clock = new THREE.Clock();

const LINK_ID = generateRandomString();

type SceneState = {
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
    meshes: THREE.Mesh[],
    resolution: number
}

// Interface for the Uniforms to avoid @ts-ignore and improve access speed
interface NeatUniforms {
    [key: string]: THREE.IUniform;
    u_time: { value: number };
    u_resolution: { value: THREE.Vector2 };
    u_color_pressure: { value: THREE.Vector2 };
    u_colors: { value: { is_active: number; color: THREE.Color; influence: number }[] };
    u_mouse_texture: { value: THREE.Texture | null };
}

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
    // Flow field parameters
    flowDistortionA?: number;
    flowDistortionB?: number;
    flowScale?: number;
    flowEase?: number;
    flowEnabled?: boolean;
    // Mouse interaction
    /** Strength of mouse-driven distortion */
    mouseDistortionStrength?: number;
    /** Radius / area of mouse-driven distortion in UV space (0–1-ish) */
    mouseDistortionRadius?: number;
    /** How quickly mouse trails decay/fade (0.9=slow/wobbly, 0.99=fast/sharp) */
    mouseDecayRate?: number;
    mouseDarken?: number;
    // Texture generation
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
    /**
     * Value from 0 to 1
     */
    influence?: number;
}

export type NeatController = {
    destroy: () => void;
}

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
    private _backgroundAlpha: number = 1.0;

    // Flow field properties
    private _flowDistortionA: number = 0;
    private _flowDistortionB: number = 0;
    private _flowScale: number = 1.0;
    private _flowEase: number = 0.0;
    private _flowEnabled: boolean = true;

    // Mouse interaction properties
    private _mouseDistortionStrength: number = 0.0;
    private _mouseDistortionRadius: number = 0.25;
    private _mouseDecayRate: number = 0.96;
    private _mouseDarken: number = 0.0;
    private _mouse: THREE.Vector2 = new THREE.Vector2(-1000, -1000);
    private _mouseFBO: THREE.WebGLRenderTarget | null = null;
    private _sceneMouse: THREE.Scene | null = null;
    private _cameraMouse: THREE.OrthographicCamera | null = null;
    private _mouseObjects: Array<{ mesh: THREE.Mesh, active: boolean }> = [];
    private _currentBrush: number = 0;
    private _mouseBrushBaseScale: number = 1;

    // Texture generation properties
    private _enableProceduralTexture: boolean = false;
    private _textureVoidLikelihood: number = 0.45;
    private _textureVoidWidthMin: number = 200;
    private _textureVoidWidthMax: number = 486;
    private _textureBandDensity: number = 2.15;
    private _textureColorBlending: number = 0.01;
    private _textureSeed: number = 333;
    private _textureEase: number = 0.5;
    private _proceduralTexture: THREE.Texture | null = null;
    private _proceduralBackgroundColor: string = "#000000";

    private _textureShapeTriangles: number = 20;
    private _textureShapeCircles: number = 15;
    private _textureShapeBars: number = 15;
    private _textureShapeSquiggles: number = 10;

    private requestRef: number = -1;
    private sizeObserver: ResizeObserver;
    private sceneState: SceneState;

    // Optimization: Cache uniforms to avoid lookups and object creation in render loop
    private _cachedUniforms: NeatUniforms | null = null;
    private _linkElement: HTMLAnchorElement | null = null;

    private _yOffset: number = 0;
    private _yOffsetWaveMultiplier: number = 0.004;
    private _yOffsetColorMultiplier: number = 0.004;
    private _yOffsetFlowMultiplier: number = 0.004;

    // For saving/restoring clear color
    private _tempClearColor = new THREE.Color();

    // Performance optimizations
    private _resizeTimeoutId: number | null = null;
    private _textureNeedsUpdate: boolean = false;
    private _lastColorUpdate: number = 0;
    private _linkCheckCounter: number = 0;
    private _mouseUpdateScheduled: boolean = false;
    private _pendingMousePosition: { x: number; y: number } | null = null;
    private _colorsChanged: boolean = true; // Track if colors need update

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
            // Mouse interaction
            mouseDistortionStrength = 0.0,
            mouseDistortionRadius = 0.25,
            mouseDecayRate = 0.96,
            mouseDarken = 0.0,
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
        } = config;


        this._ref = ref;

        this.destroy = this.destroy.bind(this);
        this._initScene = this._initScene.bind(this);
        this._buildMaterial = this._buildMaterial.bind(this);

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

        // Mouse interaction
        this.mouseDistortionStrength = mouseDistortionStrength;
        this.mouseDistortionRadius = mouseDistortionRadius;
        this.mouseDecayRate = mouseDecayRate;
        this.mouseDarken = mouseDarken;

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

        // FIX 1: Setup mouse resources BEFORE building the material/scene
        // This ensures u_mouse_texture isn't null during material compilation
        this._setupMouseInteraction();
        this.sceneState = this._initScene(resolution);

        let tick = seed !== undefined ? seed : getElapsedSecondsInLastHour();

        const render = () => {

            const { renderer, camera, scene } = this.sceneState;

            // Optimization: check if cached link is still valid in DOM less frequently
            this._linkCheckCounter++;
            if (this._linkCheckCounter >= 300) { // Check every ~5 seconds at 60fps
                this._linkCheckCounter = 0;
                if (!this._linkElement || !document.contains(this._linkElement)) {
                    this._linkElement = addNeatLink(ref);
                }
            }

            // Update Uniforms efficiently without creating new objects
            if (this._cachedUniforms) {
                const u = this._cachedUniforms;

                tick += clock.getDelta() * this._speed;

                u.u_time.value = tick;
                u.u_resolution.value.set(this._ref.width, this._ref.height);
                u.u_color_pressure.value.set(this._horizontalPressure, this._verticalPressure);

                // Directly assign simple values
                u.u_wave_frequency_x.value = this._waveFrequencyX;
                u.u_wave_frequency_y.value = this._waveFrequencyY;
                u.u_wave_amplitude.value = this._waveAmplitude;
                u.u_color_blending.value = this._colorBlending;
                u.u_shadows.value = this._shadows;
                u.u_highlights.value = this._highlights;
                u.u_saturation.value = this._saturation;
                u.u_brightness.value = this._brightness;
                u.u_grain_intensity.value = this._grainIntensity;
                u.u_grain_sparsity.value = this._grainSparsity;
                u.u_grain_speed.value = this._grainSpeed;
                u.u_grain_scale.value = this._grainScale;
                u.u_y_offset.value = this._yOffset;
                u.u_y_offset_wave_multiplier.value = this._yOffsetWaveMultiplier;
                u.u_y_offset_color_multiplier.value = this._yOffsetColorMultiplier;
                u.u_y_offset_flow_multiplier.value = this._yOffsetFlowMultiplier;
                u.u_flow_distortion_a.value = this._flowDistortionA;
                u.u_flow_distortion_b.value = this._flowDistortionB;
                u.u_flow_scale.value = this._flowScale;
                u.u_flow_ease.value = this._flowEase;
                u.u_flow_enabled.value = this._flowEnabled ? 1.0 : 0.0;
                u.u_mouse_distortion_strength.value = this._mouseDistortionStrength;
                u.u_mouse_distortion_radius.value = this._mouseDistortionRadius;
                u.u_mouse_darken.value = this._mouseDarken;
                u.u_enable_procedural_texture.value = this._enableProceduralTexture ? 1.0 : 0.0;

                // Only regenerate procedural texture when needed
                if (this._textureNeedsUpdate && this._enableProceduralTexture) {
                    if (this._proceduralTexture) {
                        this._proceduralTexture.dispose();
                    }
                    this._proceduralTexture = this._createProceduralTexture();
                    this._textureNeedsUpdate = false;
                }

                u.u_procedural_texture.value = this._proceduralTexture;
                u.u_texture_ease.value = this._textureEase;

                // Wireframe is a material property and must update every frame to avoid artifacts
                // @ts-ignore - access material safely
                this.sceneState.meshes[0].material.wireframe = this._wireframe;

                // Optimized Color Update: Update immediately on change, or throttle to 10 times per second
                const now = Date.now();
                const shouldUpdate = this._colorsChanged || (now - this._lastColorUpdate > 100);

                if (shouldUpdate) {
                    this._lastColorUpdate = now;
                    this._colorsChanged = false;

                    const shaderColors = u.u_colors.value;
                    for(let i = 0; i < COLORS_COUNT; i++) {
                        if (i < this._colors.length) {
                            const c = this._colors[i];
                            shaderColors[i].is_active = c.enabled ? 1.0 : 0.0;
                            shaderColors[i].color.setStyle(c.color, "");
                            shaderColors[i].influence = c.influence || 0;
                        } else {
                            shaderColors[i].is_active = 0.0;
                        }
                    }

                    u.u_colors_count.value = COLORS_COUNT;
                }
            }

            // Render mouse interaction to FBO - optimize by only rendering when needed
            if (this._mouseFBO && this._sceneMouse && this._cameraMouse && this._mouseDistortionStrength > 0) {
                let hasActiveBrushes = false;

                // Update mouse objects - decay rate controls how fast trails fade
                for(let i = 0; i < this._mouseObjects.length; i++) {
                    const obj = this._mouseObjects[i];
                    if (obj.mesh.visible) {
                        hasActiveBrushes = true;
                        obj.mesh.rotation.z += 0.01;
                        if (obj.mesh.material instanceof THREE.MeshBasicMaterial) {
                            // Decay only affects opacity
                            obj.mesh.material.opacity *= this._mouseDecayRate;

                            if (obj.mesh.material.opacity < 0.01) {
                                obj.mesh.visible = false;
                            }
                        }
                    }
                }

                // Only render FBO if there are active brushes
                if (hasActiveBrushes) {
                    // Store current clear color (likely the main background color)
                    renderer.getClearColor(this._tempClearColor);
                    const oldClearAlpha = renderer.getClearAlpha();

                    // Set clear color to Black/Transparent for the FBO.
                    renderer.setClearColor(0x000000, 0.0);

                    renderer.setRenderTarget(this._mouseFBO);
                    renderer.clear();
                    renderer.render(this._sceneMouse, this._cameraMouse);
                    renderer.setRenderTarget(null);

                    // Restore main background color for the actual scene render
                    renderer.setClearColor(this._tempClearColor, oldClearAlpha);

                    // Update mouse texture uniform
                    if (this._cachedUniforms) {
                        this._cachedUniforms.u_mouse_texture.value = this._mouseFBO.texture;
                    }
                }
            }

            // Ensure we set the clear color for the main scene explicitly before rendering
            renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
            renderer.render(scene, camera);
            this.requestRef = requestAnimationFrame(render);
        };

        const setSize = () => {

            const { renderer } = this.sceneState;
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            this.sceneState.renderer.setSize(width, height, false);
            updateCamera(this.sceneState.camera, width, height);

            // FIX 3: Update Mouse FBO and Camera on resize
            // If we don't do this, mouse coordinates map incorrectly after a resize
            if (this._mouseFBO && this._cameraMouse) {
                const fSize = height / 2;
                const aspect = width / height;
                this._mouseFBO.setSize(width / 2, height / 2);
                this._cameraMouse.left = -fSize * aspect;
                this._cameraMouse.right = fSize * aspect;
                this._cameraMouse.top = fSize;
                this._cameraMouse.bottom = -fSize;
                this._cameraMouse.updateProjectionMatrix();
            }
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
        if (this) {
            cancelAnimationFrame(this.requestRef);
            this.sizeObserver.disconnect();

            // Clear resize timeout
            if (this._resizeTimeoutId !== null) {
                clearTimeout(this._resizeTimeoutId);
                this._resizeTimeoutId = null;
            }

            // Cleanup WebGL resources
            if (this.sceneState) {
                this.sceneState.renderer.dispose();
                this.sceneState.meshes.forEach(m => {
                    m.geometry.dispose();
                    if(Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
                    else m.material.dispose();
                });
            }
            if (this._mouseFBO) this._mouseFBO.dispose();
            if (this._proceduralTexture) this._proceduralTexture.dispose();
        }
    }

    downloadAsPNG(filename = "neat.png") {
        console.log("Downloading as PNG", this._ref);
        const dataURL = this._ref.toDataURL("image/png");
        console.log("data", dataURL);
        downloadURI(dataURL, filename);
    }

    set speed(speed: number) {
        this._speed = speed / 20;
    }

    set horizontalPressure(horizontalPressure: number) {
        this._horizontalPressure = horizontalPressure / 4;
    }

    set verticalPressure(verticalPressure: number) {
        this._verticalPressure = verticalPressure / 4;
    }

    set waveFrequencyX(waveFrequencyX: number) {
        this._waveFrequencyX = waveFrequencyX * 0.04;
    }

    set waveFrequencyY(waveFrequencyY: number) {
        this._waveFrequencyY = waveFrequencyY * 0.04;
    }

    set waveAmplitude(waveAmplitude: number) {
        this._waveAmplitude = waveAmplitude * .75;
    }

    set colors(colors: NeatColor[]) {
        this._colors = colors;
        this._colorsChanged = true; // Flag for immediate update
    }

    set highlights(highlights: number) {
        this._highlights = highlights / 100;
    }

    set shadows(shadows: number) {
        this._shadows = shadows / 100;
    }

    set colorSaturation(colorSaturation: number) {
        this._saturation = colorSaturation / 10;
    }

    set colorBrightness(colorBrightness: number) {
        this._brightness = colorBrightness;
    }

    set colorBlending(colorBlending: number) {
        this._colorBlending = colorBlending / 10;
    }

    set grainScale(grainScale: number) {
        this._grainScale = grainScale == 0 ? 1 : grainScale;
    }

    set grainIntensity(grainIntensity: number) {
        this._grainIntensity = grainIntensity;
    }

    set grainSparsity(grainSparsity: number) {
        this._grainSparsity = grainSparsity;
    }

    set grainSpeed(grainSpeed: number) {
        this._grainSpeed = grainSpeed;
    }

    set wireframe(wireframe: boolean) {
        this._wireframe = wireframe;
    }

    set resolution(resolution: number) {
        this.sceneState = this._initScene(resolution);
    }

    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
    }

    set backgroundAlpha(backgroundAlpha: number) {
        this._backgroundAlpha = backgroundAlpha;
    }

    set yOffset(yOffset: number) {
        this._yOffset = yOffset;
    }

    get yOffsetWaveMultiplier(): number {
        return this._yOffsetWaveMultiplier * 1000;
    }

    set yOffsetWaveMultiplier(value: number) {
        this._yOffsetWaveMultiplier = value / 1000;
    }

    get yOffsetColorMultiplier(): number {
        return this._yOffsetColorMultiplier * 1000;
    }

    set yOffsetColorMultiplier(value: number) {
        this._yOffsetColorMultiplier = value / 1000;
    }

    get yOffsetFlowMultiplier(): number {
        return this._yOffsetFlowMultiplier * 1000;
    }

    set yOffsetFlowMultiplier(value: number) {
        this._yOffsetFlowMultiplier = value / 1000;
    }

    set flowDistortionA(value: number) {
        this._flowDistortionA = value;
    }

    set flowDistortionB(value: number) {
        this._flowDistortionB = value;
    }

    set flowScale(value: number) {
        this._flowScale = value;
    }

    set flowEase(value: number) {
        this._flowEase = value;
    }

    set flowEnabled(value: boolean) {
        this._flowEnabled = value;
    }

    get flowEnabled(): boolean {
        return this._flowEnabled;
    }


    set mouseDistortionStrength(value: number) {
        this._mouseDistortionStrength = Math.max(0, value);
    }

    set mouseDistortionRadius(value: number) {
        // Clamp to a sane range in UV space
        this._mouseDistortionRadius = Math.max(0.01, Math.min(value, 1.0));
        // Update brush scale when radius changes
        this._updateBrushScale();
    }

    _updateBrushScale() {
        if (!this._mouseObjects || this._mouseObjects.length === 0) return;
        // Radius directly controls the brush scale
        // Base geometry is 200px, so radius 0.25 = 50px, radius 1.0 = 200px
        this._mouseBrushBaseScale = this._mouseDistortionRadius;
    }

    set mouseDecayRate(value: number) {
        // Clamp between 0.9 (slow decay, more wobble) and 0.99 (fast decay, less wobble)
        this._mouseDecayRate = Math.max(0.9, Math.min(value, 0.99));
    }

    set mouseDarken(value: number) {
        this._mouseDarken = value;
    }

    set enableProceduralTexture(value: boolean) {
        this._enableProceduralTexture = value;
        if (value && !this._proceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidLikelihood(value: number) {
        this._textureVoidLikelihood = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidWidthMin(value: number) {
        this._textureVoidWidthMin = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureVoidWidthMax(value: number) {
        this._textureVoidWidthMax = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureBandDensity(value: number) {
        this._textureBandDensity = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureColorBlending(value: number) {
        this._textureColorBlending = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureSeed(value: number) {
        this._textureSeed = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    get textureEase(): number {
        return this._textureEase;
    }

    set textureEase(value: number) {
        this._textureEase = value;
    }

    set proceduralBackgroundColor(value: string) {
        this._proceduralBackgroundColor = value;
        if (this._enableProceduralTexture) {
            this._textureNeedsUpdate = true;
        }
    }

    set textureShapeTriangles(value: number) {
        this._textureShapeTriangles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeCircles(value: number) {
        this._textureShapeCircles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeBars(value: number) {
        this._textureShapeBars = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }
    set textureShapeSquiggles(value: number) {
        this._textureShapeSquiggles = value;
        if (this._enableProceduralTexture) this._textureNeedsUpdate = true;
    }

    _initScene(resolution: number): SceneState {

        const width = this._ref.width,
            height = this._ref.height;

        // Cleanup existing renderer if needed
        if (this.sceneState && this.sceneState.renderer) {
            this.sceneState.renderer.dispose();
            this.sceneState.meshes.forEach(m => {
                m.geometry.dispose();
                if(Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
                else m.material.dispose();
            });
        }

        const renderer = new THREE.WebGLRenderer({
            // antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            canvas: this._ref
        });

        renderer.setClearColor(0xFF0000, .5);
        renderer.setSize(width, height, false);

        const meshes: THREE.Mesh[] = [];

        const scene = new THREE.Scene();

        const material = this._buildMaterial(width, height);

        const geo = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240 * resolution, 240 * resolution);
        const plane = new THREE.Mesh(geo, material);
        plane.rotation.x = -Math.PI / 3.5;
        plane.position.z = -1;
        meshes.push(plane);
        scene.add(plane);

        const camera = new THREE.OrthographicCamera(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        // const camera = new THREE.PerspectiveCamera( 1000, window.innerWidth / window.innerHeight, 1, 1000000 );
        camera.position.z = 5;
        updateCamera(camera, width, height);

        return {
            renderer,
            camera,
            scene,
            meshes,
            resolution
        };
    }

    _buildMaterial(width: number, height: number) {

        // Initialize stable array structure for colors
        // We create 6 objects and just update them in the render loop to avoid GC
        const colors = Array.from({ length: COLORS_COUNT }).map((_, i) => ({
            is_active: i < this._colors.length ? (this._colors[i].enabled ? 1.0 : 0.0) : 0.0,
            color: new THREE.Color(i < this._colors.length ? this._colors[i].color : 0x000000),
            influence: i < this._colors.length ? (this._colors[i].influence || 0) : 0
        }));

        const uniforms = {
            u_time: { value: 0 },
            u_color_pressure: { value: new THREE.Vector2(this._horizontalPressure, this._verticalPressure) },
            u_wave_frequency_x: { value: this._waveFrequencyX },
            u_wave_frequency_y: { value: this._waveFrequencyY },
            u_wave_amplitude: { value: this._waveAmplitude },
            u_resolution: { value: new THREE.Vector2(width, height) },
            u_colors: { value: colors },
            u_colors_count: { value: this._colors.length },
            u_plane_width: { value: PLANE_WIDTH },
            u_plane_height: { value: PLANE_HEIGHT },
            u_shadows: { value: this._shadows },
            u_highlights: { value: this._highlights },
            u_grain_intensity: { value: this._grainIntensity },
            u_grain_sparsity: { value: this._grainSparsity },
            u_grain_scale: { value: this._grainScale },
            u_grain_speed: { value: this._grainSpeed },
            // Flow field
            u_flow_distortion_a: { value: this._flowDistortionA },
            u_flow_distortion_b: { value: this._flowDistortionB },
            u_flow_scale: { value: this._flowScale },
            u_flow_ease: { value: this._flowEase },
            u_flow_enabled: { value: this._flowEnabled ? 1.0 : 0.0 },
            // Y offset multipliers
            u_y_offset: { value: this._yOffset },
            u_y_offset_wave_multiplier: { value: this._yOffsetWaveMultiplier },
            u_y_offset_color_multiplier: { value: this._yOffsetColorMultiplier },
            u_y_offset_flow_multiplier: { value: this._yOffsetFlowMultiplier },
            // Mouse interaction
            u_mouse_distortion_strength: { value: this._mouseDistortionStrength },
            u_mouse_distortion_radius: { value: this._mouseDistortionRadius },
            u_mouse_darken: { value: this._mouseDarken },
            u_mouse_texture: { value: this._mouseFBO ? this._mouseFBO.texture : null },
            // Procedural texture
            u_procedural_texture: { value: this._proceduralTexture },
            u_enable_procedural_texture: { value: this._enableProceduralTexture ? 1.0 : 0.0 },
            u_texture_ease: { value: this._textureEase },
            u_saturation: { value: this._saturation },
            u_brightness: { value: this._brightness },
            u_color_blending: { value: this._colorBlending }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: buildUniforms() + buildNoise() + buildColorFunctions() + buildVertexShader(),
            fragmentShader: buildUniforms() + buildColorFunctions() + buildNoise() + buildFragmentShader()
        });

        // Cache the uniforms object for direct access in render loop
        this._cachedUniforms = uniforms as unknown as NeatUniforms;

        material.wireframe = WIREFRAME;
        return material;
    }

    _setupMouseInteraction() {
        if (!this._ref) return;

        const width = this._ref.width;
        const height = this._ref.height;

        // Create mouse FBO
        this._mouseFBO = new THREE.WebGLRenderTarget(width / 2, height / 2);

        // Create mouse scene and camera
        this._sceneMouse = new THREE.Scene();
        const fSize = height / 2;
        const aspect = width / height;

        // FIX 4: Ensure near plane allows viewing objects at Z=0
        // Near -100 is safer for objects at 0
        this._cameraMouse = new THREE.OrthographicCamera(
            -fSize * aspect, fSize * aspect,
            fSize, -fSize,
            0, 10000
        );
        this._cameraMouse.position.set(0, 0, 100);

        // Create brush texture - More visible and impactful
        const brushCanvas = document.createElement('canvas');
        brushCanvas.width = 128;
        brushCanvas.height = 128;
        const bCtx = brushCanvas.getContext('2d');
        if (bCtx) {
            const grd = bCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
            // Match reference implementation's stronger gradient
            grd.addColorStop(0, 'rgba(255,255,255,0.8)');
            grd.addColorStop(0.5, 'rgba(255,255,255,0.4)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            bCtx.fillStyle = grd;
            bCtx.fillRect(0, 0, 128, 128);
        }
        const brushTex = new THREE.CanvasTexture(brushCanvas);
        const brushMat = new THREE.MeshBasicMaterial({
            map: brushTex,
            transparent: true,
            opacity: 1.0,
            depthTest: false,
            blending: THREE.AdditiveBlending // Additive blending for better accumulation
        });
        // Brush geometry size - will be scaled by radius parameter
        const brushGeo = new THREE.PlaneGeometry(200, 200);

        // Create brush pool
        const brushPoolSize = 50;
        for (let i = 0; i < brushPoolSize; i++) {
            const m = new THREE.Mesh(brushGeo, brushMat.clone());
            m.visible = false;
            this._sceneMouse!.add(m);
            this._mouseObjects.push({ mesh: m, active: false });
        }

        // Initialize brush scale based on current radius
        this._updateBrushScale();

        // Add mouse move listener
        this._ref.addEventListener('mousemove', this._onMouseMove.bind(this));
    }

    _onMouseMove(e: MouseEvent) {
        if (!this._ref || !this._sceneMouse) return;

        const rect = this._ref.getBoundingClientRect();
        const width = this._ref.width;
        const height = this._ref.height;

        // Store pending mouse position
        this._pendingMousePosition = {
            x: e.clientX - rect.left - width / 2,
            y: -(e.clientY - rect.top - height / 2)
        };

        // Batch mouse updates using requestAnimationFrame
        if (!this._mouseUpdateScheduled) {
            this._mouseUpdateScheduled = true;
            requestAnimationFrame(() => {
                this._mouseUpdateScheduled = false;

                if (!this._pendingMousePosition) return;

                this._mouse.x = this._pendingMousePosition.x;
                this._mouse.y = this._pendingMousePosition.y;

                const brush = this._mouseObjects[this._currentBrush];
                brush.mesh.scale.set(this._mouseBrushBaseScale, this._mouseBrushBaseScale, 1.0);
                brush.active = true;
                brush.mesh.visible = true;
                brush.mesh.position.set(this._mouse.x, this._mouse.y, 0);
                brush.mesh.rotation.z = Math.random() * Math.PI * 2;
                if (brush.mesh.material instanceof THREE.MeshBasicMaterial) {
                    brush.mesh.material.opacity = 1.0;
                }
                this._currentBrush = (this._currentBrush + 1) % this._mouseObjects.length;

                this._pendingMousePosition = null;
            });
        }
    }

    _createProceduralTexture(): THREE.Texture {
        // Texture size - 1024 provides good balance between quality and performance
        // Reduced from 2048 for better performance
        const texSize = 1024;
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = texSize;
        sourceCanvas.height = texSize;
        const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        if (!sCtx) return new THREE.Texture();

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
        if (colors.length === 0) return new THREE.Texture();

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
            return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
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
        if (!ctx) return new THREE.Texture();

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

        const tex = new THREE.CanvasTexture(canvas);
        // Use mipmapping for better quality when texture is scaled
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        // Enable anisotropic filtering for much better quality when texture is stretched
        // 16 is a commonly supported value that dramatically improves quality
        tex.anisotropy = 16;

        // Ensure mipmaps are generated
        tex.needsUpdate = true;

        return tex;
    }


}

function updateCamera(camera: THREE.Camera, width: number, height: number) {

    const viewPortAreaRatio = 1000000;
    const areaViewPort = width * height;
    const targetPlaneArea =
        areaViewPort / viewPortAreaRatio *
        PLANE_WIDTH * PLANE_HEIGHT / 1.5;

    const ratio = width / height;

    const targetWidth = Math.sqrt(targetPlaneArea * ratio);
    const targetHeight = targetPlaneArea / targetWidth;

    let left = -PLANE_WIDTH / 2;
    let right = Math.min((left + targetWidth) / 1.5, PLANE_WIDTH / 2);

    let top = PLANE_HEIGHT / 4;
    let bottom = Math.max((top - targetHeight) / 2, -PLANE_HEIGHT / 4);

    // Fix for mobile portrait: adjust bounds for proper aspect ratio AND zoom out slightly
    if (ratio < 1) {
        // Portrait mode - scale horizontal bounds by aspect ratio to prevent stretching
        const horizontalScale = ratio;
        left = left * horizontalScale;
        right = right * horizontalScale;

        // Zoom out slightly on mobile (1.1 = 10% zoom out)
        const mobileZoomFactor = 1.1;
        left = left * mobileZoomFactor;
        right = right * mobileZoomFactor;
        top = top * mobileZoomFactor;
        bottom = bottom * mobileZoomFactor;
    }

    const near = -100;
    const far = 1000;
    if (camera instanceof THREE.OrthographicCamera) {
        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

}


// Cache shader strings to avoid repeated concatenation
let cachedVertexShader: string | null = null;
let cachedFragmentShader: string | null = null;

function buildVertexShader() {
    if (cachedVertexShader) return cachedVertexShader;
    cachedVertexShader = `
void main() {
    vUv = uv;

    // SCROLLING LOGIC
    // Separate multipliers for wave, color, and flow offsets
    float waveOffset = -u_y_offset * u_y_offset_wave_multiplier;
    float colorOffset = -u_y_offset * u_y_offset_color_multiplier;
    float flowOffset = -u_y_offset * u_y_offset_flow_multiplier;

    // 1. DISPLACEMENT (WAVES)
    // We add waveOffset to Y to scroll the wave pattern
    v_displacement_amount = cnoise( vec3(
        u_wave_frequency_x * position.x + u_time,
        u_wave_frequency_y * (position.y + waveOffset) + u_time,
        u_time
    ));

    // 2. FLOW FIELD
    // Apply flow offset to scroll the flow field mask
    vec2 baseUv = vUv;
    baseUv.y += flowOffset / u_plane_height; // Scale to match wave speed
    vec2 flowUv = baseUv;

    if (u_flow_enabled > 0.5) {
        if (u_flow_ease > 0.0 || u_flow_distortion_a > 0.0) {
            vec2 ppp = -1.0 + 2.0 * baseUv;
            ppp += 0.1 * cos((1.5 * u_flow_scale) * ppp.yx + 1.1 * u_time + vec2(0.1, 1.1));
            ppp += 0.1 * cos((2.3 * u_flow_scale) * ppp.yx + 1.3 * u_time + vec2(3.2, 3.4));
            ppp += 0.1 * cos((2.2 * u_flow_scale) * ppp.yx + 1.7 * u_time + vec2(1.8, 5.2));
            ppp += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.yx + 1.4 * u_time + vec2(6.3, 3.9));

            float r = length(ppp);
            flowUv = mix(baseUv, vec2(baseUv.x * (1.0 - u_flow_ease) + r * u_flow_ease, baseUv.y), u_flow_ease);
        }
    }

    // Pass the standard flow UV to fragment shader (for mouse/texture)
    vFlowUv = flowUv;

    // 3. COLOR MIXING
    // We take the computed flow UVs and apply the color offset
    // Scale by plane height to match wave offset speed (world space vs UV space)
    vec3 color = u_colors[0].color;
    vec2 adjustedUv = flowUv;
    adjustedUv.y += colorOffset / u_plane_height; // Scroll the color mixing pattern

    vec2 noise_cord = adjustedUv * u_color_pressure;
    const float minNoise = .0;
    const float maxNoise = .9;

    for (int i = 1; i < u_colors_count; i++) {
        if(u_colors[i].is_active > 0.5){
            float noiseFlow = (1. + float(i)) / 30.;
            float noiseSpeed = (1. + float(i)) * 0.11;
            float noiseSeed = 13. + float(i) * 7.;

            float noise = snoise(
                vec3(
                    noise_cord.x * u_color_pressure.x + u_time * noiseFlow * 2.,
                    noise_cord.y * u_color_pressure.y,
                    u_time * noiseSpeed
                ) + noiseSeed
            ) - (.1 * float(i)) + (.5 * u_color_blending);

            noise = clamp(minNoise, maxNoise + float(i) * 0.02, noise);
            color = mix(color, u_colors[i].color, smoothstep(0.0, u_color_blending, noise));
        }
    }

    v_color = color;

    // 4. VERTEX POSITION
    vec3 newPosition = position + normal * v_displacement_amount * u_wave_amplitude;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    v_new_position = gl_Position;
}
`;
    return cachedVertexShader;
}

function buildFragmentShader() {
    if (cachedFragmentShader) return cachedFragmentShader;
    cachedFragmentShader = `
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

float fbm(vec3 x) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(x * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    // MOUSE DISTORTION
    vec2 finalUv = vFlowUv;
    
    if (u_mouse_distortion_strength > 0.0) {
        vec4 mouseColor = texture2D(u_mouse_texture, vUv);
        float mouseValue = mouseColor.r;
        
        if (mouseValue > 0.001) {
            float distortionAmount = mouseValue * u_mouse_distortion_strength;
            vec2 mouseDisp = vec2(distortionAmount, distortionAmount);
            finalUv -= mouseDisp;
        }
    }
    
    vec3 baseColor;

    if (u_enable_procedural_texture > 0.5) {
        // Calculate flow field distance for ease effect
        vec2 ppp = -1.0 + 2.0 * finalUv;
        ppp += 0.1 * cos((1.5 * u_flow_scale) * ppp.yx + 1.1 * u_time + vec2(0.1, 1.1));
        ppp += 0.1 * cos((2.3 * u_flow_scale) * ppp.yx + 1.3 * u_time + vec2(3.2, 3.4));
        ppp += 0.1 * cos((2.2 * u_flow_scale) * ppp.yx + 1.7 * u_time + vec2(1.8, 5.2));
        ppp += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.yx + 1.4 * u_time + vec2(6.3, 3.9));
        float r = length(ppp); // Flow distance
        
        // Ease blending: 0 = topographic (flow), 1 = image (UV)
        float vx = (finalUv.x * u_texture_ease) + (r * (1.0 - u_texture_ease));
        float vy = (finalUv.y * u_texture_ease) + (0.0 * (1.0 - u_texture_ease));
        vec2 texUv = vec2(vx, vy);

        // PARALLAX SCROLLING
        // We manually apply a smaller offset here to make the texture lag behind
        float parallaxFactor = 0.25; // 25% speed of the color mixing
        texUv.y -= (u_y_offset * u_y_offset_color_multiplier / u_plane_height) * parallaxFactor;

        texUv *= 1.5; // Tiling scale

        vec4 texSample = texture2D(u_procedural_texture, texUv);
        baseColor = texSample.rgb;
    } else {
        baseColor = v_color;
    }

    vec3 color = baseColor;

    // Post-processing
    color += pow(v_displacement_amount, 1.0) * u_highlights;
    color -= pow(1.0 - v_displacement_amount, 2.0) * u_shadows;
    color = saturation(color, 1.0 + u_saturation);
    color = color * u_brightness;

    // Grain
    vec2 noiseCoords = gl_FragCoord.xy / u_grain_scale;
    float grain = (u_grain_speed != 0.0) ? fbm(vec3(noiseCoords, u_time * u_grain_speed)) : fbm(vec3(noiseCoords, 0.0));

    grain = grain * 0.5 + 0.5;
    grain -= 0.5;
    grain = (grain > u_grain_sparsity) ? grain : 0.0;
    grain *= u_grain_intensity;

    color += vec3(grain);

    gl_FragColor = vec4(color, 1.0);
}
    `;
    return cachedFragmentShader;
}

// Cache uniforms string as well
let cachedUniformsShader: string | null = null;

const buildUniforms = () => {
    if (cachedUniformsShader) return cachedUniformsShader;
    cachedUniformsShader = `
precision highp float;

struct Color {
    float is_active;
    vec3 color;
    float value;
};

uniform float u_grain_intensity; 
uniform float u_grain_sparsity; 
uniform float u_grain_scale; 
uniform float u_grain_speed; 
uniform float u_time;

uniform float u_wave_amplitude;
uniform float u_wave_frequency_x;
uniform float u_wave_frequency_y;

uniform vec2 u_color_pressure;

uniform float u_plane_width;
uniform float u_plane_height;

uniform float u_shadows;
uniform float u_highlights;
uniform float u_saturation;
uniform float u_brightness;

uniform float u_color_blending;

uniform int u_colors_count;
uniform Color u_colors[6];
uniform vec2 u_resolution;

uniform float u_y_offset;
uniform float u_y_offset_wave_multiplier;
uniform float u_y_offset_color_multiplier;
uniform float u_y_offset_flow_multiplier;

// Flow field uniforms
uniform float u_flow_distortion_a;
uniform float u_flow_distortion_b;
uniform float u_flow_scale;
uniform float u_flow_ease;
uniform float u_flow_enabled;

// Mouse interaction uniforms
uniform float u_mouse_distortion_strength;
uniform float u_mouse_distortion_radius;
uniform float u_mouse_darken;
uniform sampler2D u_mouse_texture;

// Procedural texture uniforms
uniform sampler2D u_procedural_texture;
uniform float u_enable_procedural_texture;
uniform float u_texture_ease;

varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;

    `;
    return cachedUniformsShader;
};

// Cache noise functions as well
let cachedNoiseShader: string | null = null;

const buildNoise = () => {
    if (cachedNoiseShader) return cachedNoiseShader;
    cachedNoiseShader = `

// 1. REPLACEMENT PERMUTE: 
// Uses a hash function (fract/sin) instead of a modular lookup table.
vec4 permute(vec4 x) {
    return floor(fract(sin(x) * 43758.5453123) * 289.0);
}

// Taylor Inverse Sqrt
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// Fade function
vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// 3D Simplex Noise
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  vec4 p = permute( permute( permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); 
  vec3 Pi1 = Pi0 + vec3(1.0); 
  
  vec3 Pf0 = fract(P); 
  vec3 Pf1 = Pf0 - vec3(1.0); 
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`;
    return cachedNoiseShader;
};

// Cache color functions as well
let cachedColorFunctionsShader: string | null = null;

const buildColorFunctions = () => {
    if (cachedColorFunctionsShader) return cachedColorFunctionsShader;
    cachedColorFunctionsShader = `

vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

float saturation(vec3 rgb)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return abs(6.0 * d + e);
}

// get saturation of a color in values between 0 and 1
float getSaturation(vec3 color) {
    float max = max(color.r, max(color.g, color.b));
    float min = min(color.r, min(color.g, color.b));
    return (max - min) / max;
}
    
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`;
    return cachedColorFunctionsShader;
};

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
    link.innerHTML = "NEAT";
}

const addNeatLink = (ref: HTMLCanvasElement): HTMLAnchorElement => {
    const existingLinks = ref.parentElement?.getElementsByTagName("a");
    if (existingLinks) {
        for (let i = 0; i < existingLinks.length; i++) {
            if (existingLinks[i].id === LINK_ID) {
                setLinkStyles(existingLinks[i]);
                return existingLinks[i];
            }
        }
    }
    const link = document.createElement("a");
    setLinkStyles(link);
    ref.parentElement?.appendChild(link);
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
