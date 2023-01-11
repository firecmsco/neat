import * as THREE from "three";

const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 80;

const WIREFRAME = true;
const COLORS_COUNT = 5;

const clock = new THREE.Clock();

type SceneState = {
    renderer: THREE.WebGLRenderer,
    camera: THREE.OrthographicCamera,
    scene: THREE.Scene,
    meshes: THREE.Mesh[],
}

export type NeatConfig = {
    speed?: number;
    horizontalPressure?: number;
    verticalPressure?: number;
    waveFrequencyX?: number;
    waveFrequencyY?: number;
    waveAmplitude?: number;
    highlights?: number;
    shadows?: number;
    saturation?: number;
    colors: NeatColor[];
    colorBlending?: number;
    wireframe?: boolean;
    backgroundColor?: string;
    backgroundAlpha?: number;
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

    private _speed: number = -1;

    private _horizontalPressure: number = -1;
    private _verticalPressure: number = -1;

    private _waveFrequencyX: number = -1;
    private _waveFrequencyY: number = -1;
    private _waveAmplitude: number = -1;

    private _shadows: number = -1;
    private _highlights: number = -1;
    private _saturation: number = -1;

    private _colorBlending: number = -1;

    private _colors: NeatColor[] = [];
    private _wireframe: boolean = false;

    private _backgroundColor: string = "#FFFFFF";
    private _backgroundAlpha: number = 1.0;

    private requestRef: number = -1;
    private sizeObserver: ResizeObserver;
    private readonly sceneState: SceneState;

    constructor(config: NeatConfig & { ref: HTMLCanvasElement }) {

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
            saturation = 0,
            colorBlending = 5,
            wireframe = false,
            backgroundColor = "#FFFFFF",
            backgroundAlpha = 1.0,
        } = config;

        const width = ref.width,
            height = ref.height;

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
        this.colors = colors;
        this.shadows = shadows;
        this.highlights = highlights;
        this.saturation = saturation;
        this.wireframe = wireframe;
        this.backgroundColor = backgroundColor;
        this.backgroundAlpha = backgroundAlpha;

        this.sceneState = this._initScene(ref, width, height);

        const { renderer, camera, scene, meshes } = this.sceneState;

        let tick = 0;
        const render = () => {

            if (Math.floor(tick * 10) % 5 === 0) {
                addNeatLink(ref);
            }

            renderer.setClearColor(this._backgroundColor, this._backgroundAlpha);
            meshes.forEach((mesh) => {

                const colors = [
                    ...this._colors.map(color => ({
                        is_active: color.enabled,
                        color: new THREE.Color(color.color),
                        influence: color.influence
                    })),
                    ...Array.from({ length: COLORS_COUNT - this._colors.length }).map(() => ({
                        is_active: false,
                        color: new THREE.Color(0x000000)
                    }))
                ];

                tick += clock.getDelta() * this._speed;
                // @ts-ignore
                mesh.material.uniforms.u_time.value = tick;
                // @ts-ignore
                mesh.material.uniforms.u_resolution = { value: new THREE.Vector2(width, height) };
                // @ts-ignore
                mesh.material.uniforms.u_color_pressure = { value: new THREE.Vector2(this._horizontalPressure, this._verticalPressure) };
                // @ts-ignore
                mesh.material.uniforms.u_wave_frequency_x = { value: this._waveFrequencyX };
                // @ts-ignore
                mesh.material.uniforms.u_wave_frequency_y = { value: this._waveFrequencyY };
                // @ts-ignore
                mesh.material.uniforms.u_wave_amplitude = { value: this._waveAmplitude };
                // @ts-ignore
                mesh.material.uniforms.u_plane_width = { value: PLANE_WIDTH };
                // @ts-ignore
                mesh.material.uniforms.u_plane_height = { value: PLANE_HEIGHT };
                // @ts-ignore
                mesh.material.uniforms.u_color_blending = { value: this._colorBlending };
                // @ts-ignore
                mesh.material.uniforms.u_colors = { value: colors };
                // @ts-ignore
                mesh.material.uniforms.u_colors_count = { value: COLORS_COUNT };
                // @ts-ignore
                mesh.material.uniforms.u_shadows = { value: this._shadows };
                // @ts-ignore
                mesh.material.uniforms.u_highlights = { value: this._highlights };
                // @ts-ignore
                mesh.material.uniforms.u_saturation = { value: this._saturation };
                // @ts-ignore
                mesh.material.wireframe = this._wireframe;
            });

            renderer.render(scene, camera);
            this.requestRef = requestAnimationFrame(render);
        };

        const setSize = () => {
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            this.sceneState.renderer.setSize(width, height, false);
            updateCamera(this.sceneState.camera, width, height);
        };

        this.sizeObserver = new ResizeObserver(entries => {
            setSize();
        });

        this.sizeObserver.observe(ref);


        render();
    }

    destroy() {
        if (this) {
            cancelAnimationFrame(this.requestRef);
            this.sizeObserver.disconnect();
        }
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
    }

    set highlights(highlights: number) {
        this._highlights = highlights / 100;
    }

    set shadows(shadows: number) {
        this._shadows = shadows / 100;
    }

    set saturation(saturation: number) {
        this._saturation = saturation / 10;
    }

    set colorBlending(colorBlending: number) {
        this._colorBlending = colorBlending / 10;
    }

    set wireframe(wireframe: boolean) {
        this._wireframe = wireframe;
    }

    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
    }

    set backgroundAlpha(backgroundAlpha: number) {
        this._backgroundAlpha = backgroundAlpha;
    }

    _initScene(ref: HTMLCanvasElement, width: number, height: number): SceneState {

        const renderer = new THREE.WebGLRenderer({
            // antialias: true,
            alpha: true,
            canvas: ref
        });

        renderer.setClearColor(0xFF0000, .5);
        renderer.setSize(width, height, false);

        const meshes: THREE.Mesh[] = [];

        const scene = new THREE.Scene();

        const material = this._buildMaterial(width, height);

        const geo = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 240, 240);
        const plane = new THREE.Mesh(geo, material);
        plane.rotation.x = -Math.PI / 3.5;
        plane.position.z = -1;
        meshes.push(plane);
        scene.add(plane);

        const camera = new THREE.OrthographicCamera(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        // camera.zoom = 1;
        updateCamera(camera, width, height);

        return {
            renderer,
            camera,
            scene,
            meshes
        };
    }

    _buildMaterial(width: number, height: number) {

        const colors = [
            ...this._colors.map(color => ({
                is_active: color.enabled,
                color: new THREE.Color(color.color),
                influence: color.influence
            })),
            ...Array.from({ length: COLORS_COUNT - this._colors.length }).map(() => ({
                is_active: false,
                color: new THREE.Color(0x000000)
            }))
        ];

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
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: buildUniforms() + buildNoise() + buildColorFunctions() + buildVertexShader(),
            fragmentShader: buildUniforms() + buildColorFunctions() + buildFragmentShader()
        });

        material.wireframe = WIREFRAME;
        return material;
    }


}

function updateCamera(camera: THREE.OrthographicCamera, width: number, height: number) {

    const viewPortAreaRatio = 1000000;
    const areaViewPort = width * height;
    const targetPlaneArea =
        areaViewPort / viewPortAreaRatio *
        PLANE_WIDTH * PLANE_HEIGHT / 1.5;

    const ratio = width / height;

    const targetWidth = Math.sqrt(targetPlaneArea * ratio);
    const targetHeight = targetPlaneArea / targetWidth;

    const left = -PLANE_WIDTH / 2;
    const right = Math.min((left + targetWidth) / 1.5, PLANE_WIDTH / 2);

    const top = PLANE_HEIGHT / 4;
    const bottom = Math.max((top - targetHeight) / 2, -PLANE_HEIGHT / 4);

    const near = -100;
    const far = 1000;
    camera.left = left;
    camera.right = right;
    camera.top = top;
    camera.bottom = bottom;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
}


function buildVertexShader() {
    return `

void main() {

    vUv = uv;

    v_displacement_amount = cnoise( vec3(
        u_wave_frequency_x * position.x + u_time,
        u_wave_frequency_y * position.y + u_time,
        u_time
    ));
    
    vec3 color;

    // float t = mod(u_base_color, 100.0);
    color = u_colors[0].color;
    
    vec2 noise_cord = vUv * u_color_pressure;
    
    const float minNoise = .0;
    const float maxNoise = .9;
    
    for (int i = 1; i < u_colors_count; i++) {
    
        if(u_colors[i].is_active == 1.0){
            float noiseFlow = (1. + float(i)) / 30.;
            float noiseSpeed = (1. + float(i)) * 0.11;
            float noiseSeed = 13. + float(i) * 7.;
            
            float noise = snoise(
                vec3(
                    noise_cord.x * u_color_pressure.x + u_time * noiseFlow * 2.,
                    noise_cord.y * u_color_pressure.y,
                    u_time * noiseSpeed
                ) + noiseSeed
            );
            
            noise = clamp(minNoise, maxNoise + float(i) * 0.02, noise);
            vec3 nextColor = u_colors[i].color;
            color = mix(color, nextColor, smoothstep(0.0, u_color_blending, noise));
        }
        
    }
    
    v_color = color;
    
    vec3 newPosition = position + normal * v_displacement_amount * u_wave_amplitude;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    
    v_new_position = gl_Position;
}
`;
}

function buildFragmentShader() {
    return `

void main(){
    vec3 color = v_color;
    
    color.rgb += pow(v_displacement_amount, 1.0) * u_highlights;
    color.rgb -= pow(1.0 - v_displacement_amount, 2.0) * u_shadows;
    color = saturation(color, 1.0 + u_saturation);
    
    gl_FragColor = vec4(color,1.0);
}
`;
}

const buildUniforms = () => `
precision highp float;

struct Color {
    float is_active;
    vec3 color;
    float value;
};

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

uniform float u_color_blending;

uniform int u_colors_count;
uniform Color u_colors[5];
uniform vec2 u_resolution;

varying vec2 vUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;

    `;

const buildNoise = () => `

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float snoise(vec3 v)
{
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

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
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
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
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

// YUV to RGB matrix
mat3 yuv2rgb = mat3(1.0, 0.0, 1.13983,
                    1.0, -0.39465, -0.58060,
                    1.0, 2.03211, 0.0);

// RGB to YUV matrix
mat3 rgb2yuv = mat3(0.2126, 0.7152, 0.0722,
                    -0.09991, -0.33609, 0.43600,
                    0.615, -0.5586, -0.05639);

    `;

const buildColorFunctions = () => `

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


const setLinkStyles = (link: HTMLAnchorElement) => {
    link.id = "neat-link";
    link.href = "https://neat.camberi.com";
    link.target = "_blank";
    link.style.position = "absolute";
    link.style.display = "block";
    link.style.opacity = "1";
    link.style.bottom = "0";
    link.style.right = "0";
    link.style.padding = "10px";
    link.style.color = "#c3c3c3";
    link.style.fontFamily = "sans-serif";
    link.style.fontSize = "14px";
    link.style.textDecoration = "none";
    link.style.zIndex = "100";
    link.innerHTML = "NEAT";
}

const addNeatLink = (ref: HTMLCanvasElement) => {
    const existingLinks = ref.parentElement?.getElementsByTagName("a");
    if (existingLinks) {
        for (let i = 0; i < existingLinks.length; i++) {
            if (existingLinks[i].id === "neat-link") {
                setLinkStyles(existingLinks[i]);
                return;
            }
        }
    }
    const link = document.createElement("a");
    setLinkStyles(link);
    ref.parentElement?.appendChild(link);
}
