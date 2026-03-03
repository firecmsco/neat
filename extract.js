const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Uniforms injected by THREE previously:
// NONE that we don't define manually here.

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
    // ...
    vec2 adjustedUv = flowUv;
    adjustedUv.y += colorOffset / u_plane_height; // Scroll the color mixing pattern

    vec2 noise_cord = adjustedUv * u_color_pressure;
    const float minNoise = .0;
    const float maxNoise = .9;

    for (int i = 1; i < 6; i++) {
        if(i >= u_colors_count) break;
        if(u_colors[i].is_active > 0.5){
            float noiseFlow = (1. + float(i)) / 30.;
            float noiseSpeed = (1. + float(i)) * 0.11;
            float noiseSeed = 13. + float(i) * 7.;

            float noise = snoise(
                vec3(
                    noise_cord.x + u_time * noiseFlow * 2.,
                    noise_cord.y,
                    u_time * noiseSpeed
                ) + noiseSeed
            ) - (.1 * float(i)) + (.5 * u_color_blending);

            noise = clamp(noise, minNoise, maxNoise + float(i) * 0.02);
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

const fragmentShaderSource = `

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
    color += v_displacement_amount * u_highlights;
    // Replace pow() with direct multiplication to avoid negative base undefined behavior in GLSL
    float shadowFactor = 1.0 - v_displacement_amount;
    color -= shadowFactor * shadowFactor * u_shadows;
    color = saturation(color, 1.0 + u_saturation);
    color = color * u_brightness;

    // Grain
    vec2 noiseCoords = gl_FragCoord.xy / u_grain_scale;
    float grain;
    if (u_grain_speed != 0.0) {
        grain = fbm(vec3(noiseCoords, u_time * u_grain_speed));
    } else {
        grain = fbm(vec3(noiseCoords, 0.0));
    }

    grain = grain * 0.5 + 0.5;
    grain -= 0.5;
    grain = (grain > u_grain_sparsity) ? grain : 0.0;
    grain *= u_grain_intensity;

    color += vec3(grain);

    gl_FragColor = vec4(color, 1.0);
}
`;

function buildUniforms(): string {
    return `
precision highp float;

varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_color_pressure;
uniform float u_wave_frequency_x;
uniform float u_wave_frequency_y;
uniform float u_wave_amplitude;
uniform float u_plane_width;
uniform float u_plane_height;
uniform float u_shadows;
uniform float u_highlights;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_grain_intensity; 
uniform float u_grain_sparsity; 
uniform float u_grain_scale; 
uniform float u_grain_speed; 
uniform float u_color_blending;

uniform int u_colors_count;
struct Color {
    float is_active;
    vec3 color;
    float influence;
};
uniform Color u_colors[6];

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
`;
}

function buildNoise(): string {
    return `
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
}

function buildColorFunctions(): string {
    return `
vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

float get_saturation(vec3 rgb)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return abs(6.0 * d + e);
}

// get saturation of a color in values between 0 and 1
float getSaturationMix(vec3 color) {
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

// Color related helper functions
vec3 blendColors(vec3 colorA, vec3 colorB, float weight) {
    return mix(colorA, colorB, weight);
}
`;
}

console.log(buildUniforms() + buildColorFunctions() + buildNoise() + fragmentShaderSource);
