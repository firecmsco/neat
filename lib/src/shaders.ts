export const vertexShaderSource = `void main() {
    vUv = uv;
    vPosition = position;

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

    // 1b. SECONDARY WAVES
    // A second noise layer sampled on a rotated domain and moving at its own
    // rate. Crossing the base layer at an angle is what turns the regular swell
    // into interference, so the ridges stop repeating along one direction.
    if (NEAT_SECONDARY_WAVE_ENABLED > 0.5) {
        float t2 = u_time * u_wave2_speed;
        float ca = cos(u_wave2_angle);
        float sa = sin(u_wave2_angle);
        float px = position.x;
        float py = position.y + waveOffset;
        vec2 rp = vec2(ca * px - sa * py, sa * px + ca * py);

        float secondary = cnoise( vec3(
            u_wave2_frequency_x * rp.x + t2,
            u_wave2_frequency_y * rp.y - t2,
            t2 * 0.6 + 41.7
        ));

        // Normalised blend rather than a plain sum: the displacement drives the
        // highlight/shadow terms downstream, which expect roughly the same range
        // whatever the mix.
        v_displacement_amount = (v_displacement_amount + secondary * u_wave2_amplitude)
            / (1.0 + u_wave2_amplitude);
    }

    // 2. FLOW FIELD
    // Apply flow offset to scroll the flow field mask
    vec2 baseUv = vUv;
    baseUv.y += flowOffset / u_plane_height; // Scale to match wave speed
    vec2 flowUv = baseUv;

    if (NEAT_FLOW_ENABLED > 0.5) {
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

    // Pass the standard flow UV to fragment shader (for texture)
    vFlowUv = flowUv;

    // 3. COLOR MIXING
    // We take the computed flow UVs and apply the color offset
    // Scale by plane height to match wave offset speed (world space vs UV space)
    vec3 color = u_colors[0].color;

    vec3 distortedPos = position;
    if (NEAT_FLAT_SHADING < 0.5) {
        if (NEAT_FLOW_ENABLED > 0.5) {
            if (u_flow_ease > 0.0 || u_flow_distortion_a > 0.0) {
                vec3 ppp = position / 25.0;
                ppp.xyz += 0.1 * cos((1.5 * u_flow_scale) * ppp.yxz + 1.1 * u_time + vec3(0.1, 1.1, 2.1));
                ppp.xyz += 0.1 * cos((2.3 * u_flow_scale) * ppp.zxy + 1.3 * u_time + vec3(3.2, 3.4, 1.2));
                ppp.xyz += 0.1 * cos((2.2 * u_flow_scale) * ppp.yxz + 1.7 * u_time + vec3(1.8, 5.2, 3.1));
                ppp.xyz += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.zxy + 1.4 * u_time + vec3(6.3, 3.9, 4.5));

                float r = length(ppp);
                distortedPos = mix(position, vec3(
                    position.x * (1.0 - u_flow_ease) + r * u_flow_ease * 25.0,
                    position.y,
                    position.z * (1.0 - u_flow_ease) + r * u_flow_ease * 25.0
                ), u_flow_ease);
            }
        }
    }

    vec3 noise_cord;
    if (NEAT_FLAT_SHADING < 0.5) {
        noise_cord = vec3(distortedPos.x / 50.0, (distortedPos.y + colorOffset) / 50.0, distortedPos.z / 50.0);
    } else {
        vec2 adjustedUv = flowUv;
        adjustedUv.y += colorOffset / u_plane_height;
        noise_cord = vec3(adjustedUv, 0.0);
    }

    const float minNoise = .0;
    const float maxNoise = .9;

    // Where the colour seams are, for the prism fringe.
    //   x — how mid-transition the most-transitioning colour is, 1 on a seam and
    //       0 deep inside a colour. A max of smooth terms, so it stays continuous
    //       even where which colour is winning changes; picking one transition per
    //       vertex instead makes the varying jump between triangles and the fringe
    //       comes out as a staircase.
    //   y — total mix progress, which climbs by ~1 across each seam and so gives
    //       the hue a ramp to run along.
    vec2 edge = vec2(0.0);

    // The whole mix below is dead weight when a procedural texture is supplying the
    // colour — the fragment shader reads v_color only on the non-texture path — and
    // that is up to five simplex-noise evaluations per vertex thrown away. Both flags
    // are compile-time constants, so this folds away entirely rather than branching.
    // The prism fringe reads the same field, so it has to keep the loop alive.
    if (NEAT_PROC_TEXTURE_ENABLED < 0.5 || NEAT_PRISM_EDGE_ENABLED > 0.5) {
        for (int i = 1; i < 6; i++) {
            if (u_colors[i].is_active > 0.5) {
                float noiseFlow = (1. + float(i)) / 30.;
                float noiseSpeed = (1. + float(i)) * 0.11;
                float noiseSeed = 13. + float(i) * 7.;

                float noise_z = u_time * noiseSpeed;
                if (NEAT_FLAT_SHADING < 0.5) {
                    noise_z = noise_cord.z * u_color_pressure.x * u_color_pressure.x + u_time * noiseSpeed;
                }

                float noise = snoise(
                    vec3(
                        noise_cord.x * u_color_pressure.x * u_color_pressure.x + u_time * noiseFlow * 2.,
                        noise_cord.y * u_color_pressure.y * u_color_pressure.y,
                        noise_z
                    ) + noiseSeed
                ) - (.1 * float(i)) + (.5 * u_color_blending);

                // Influence moves the threshold this colour has to clear, so it wins
                // more or less ground against the ones under it. Scaling mixAmount
                // instead would just make it translucent over the same territory,
                // which is opacity, not influence. The span is wide enough that 0
                // pushes the whole field below the floor (the colour disappears) and
                // 2 pushes most of it above the ceiling, with 1 shifting by nothing
                // so existing configs are untouched.
                noise += (u_colors[i].influence - 1.0) * 0.6;

                noise = clamp(noise, minNoise, maxNoise + float(i) * 0.02);
                float mixAmount = smoothstep(0.0, u_color_blending, noise);
                // The bias alone leaves a faint trace at influence 0, because the
                // noise still pokes above the floor at its strongest points. Fade it
                // out over the bottom of the range so 0 means gone; above 0.08 this
                // is 1 and the useful range is untouched.
                mixAmount *= smoothstep(0.0, 0.08, u_colors[i].influence);
                color = mix(color, u_colors[i].color, mixAmount);

                if (NEAT_PRISM_EDGE_ENABLED > 0.5) {
                    // Seams found so far sit *under* this colour, so fade them by
                    // how much of them it covers before folding in its own. Without
                    // this a buried transition still lights up, and fringes appear
                    // stranded in the middle of a solid area with no seam in sight.
                    edge.x *= (1.0 - mixAmount);
                    edge.x = max(edge.x, 4.0 * mixAmount * (1.0 - mixAmount));
                    edge.y += mixAmount;
                }
            }
        }
    }

    v_color = color;
    v_edge = edge;

    // 4. FRESNEL (rim glow)
    // (Calculated in fragment shader using displacement slope approximation)

    // 5. VERTEX POSITION
    vec3 newPosition = position + normal * v_displacement_amount * u_wave_amplitude;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * mvPosition;
    v_new_position = gl_Position;
}
`;

export const fragmentShaderSource = `float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

float fbm(vec3 x) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 2; i++) {
        value += amplitude * snoise(x * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Grain-only simplex noise.
//
// Identical to snoise() above except for the hash: this uses the canonical
// polynomial permute the algorithm was published with, where snoise() uses a
// sin()-based one. Two octaves of grain therefore cost 24 sin() calls per pixel,
// which measures as the most expensive single thing in this shader.
//
// Swapping the hash changes which pattern comes out, not what kind of pattern it is
// — same lattice, same gradients, same frequency response — so grain keeps its
// character at every grain scale and drifts over time exactly as before. Lattice
// value/gradient noise is cheaper still but does not hold that property: its variance
// falls off differently with scale, so it thins out at mid scales no single gain can
// correct. Grain is random by nature, so a different draw of the same distribution is
// not something anyone can pick out.
vec4 permuteFast(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoiseFast(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permuteFast( permuteFast( permuteFast(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
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

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// Same two octaves and amplitudes as fbm(). Grain only — domain warping keeps the
// original, where the noise is a large visible structure rather than a fine overlay.
float grainFbm(vec3 x) {
    return 0.5 * snoiseFast(x) + 0.25 * snoiseFast(x * 2.0);
}

// Branchless HSL to RGB for iridescence
vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

// Thin-film interference ramp.
//
// A film reflects each wavelength by how its own period fits the extra distance
// through the film, so the channels oscillate at *different rates* set by their
// wavelengths — they do not sit at fixed offsets around a colour wheel. That is
// the whole difference between a soap film and a rainbow: the Newton series runs
// white → straw → magenta → blue → green and washes out as the film thickens,
// where a hue sweep would just cycle evenly forever. The constants are the red
// wavelength over each channel's, near enough for something decorative.
// Rescaled to peak at 1. Raw interference is dark over much of the series, and
// the fringe is screened on, which ignores dark — so untouched it simply vanishes
// at half the thicknesses. Scaling keeps the ratios between channels, so the hue
// order and the wash-out towards white both survive; only the overall level moves,
// and that is what the intensity control is for.
vec3 thinFilm(float t) {
    const vec3 inverseWavelength = vec3(1.0, 1.18, 1.42);
    vec3 f = 0.5 + 0.5 * cos(6.283185 * inverseWavelength * t);
    return f / max(max(f.r, max(f.g, f.b)), 0.0001);
}

void main() {
    vec2 finalUv = vFlowUv;
    
    vec3 baseColor;
    float texAlpha = 1.0;

    if (NEAT_PROC_TEXTURE_ENABLED > 0.5) {
        if (NEAT_FLAT_SHADING < 0.5) {
            float parallaxFactor = 0.25;
            float scrollOffset = (u_y_offset * u_y_offset_color_multiplier) * parallaxFactor;
            vec3 scrolledPos = vPosition;
            scrolledPos.y -= scrollOffset;
            
            vec3 p = (scrolledPos * 1.5) / 50.0;
            vec2 uvX = p.yz + vec2(0.5);
            vec2 uvY = p.zx + vec2(0.5);
            vec2 uvZ = p.xy + vec2(0.5);
            
            vec4 colX = texture2D(u_procedural_texture, uvX);
            vec4 colY = texture2D(u_procedural_texture, uvY);
            vec4 colZ = texture2D(u_procedural_texture, uvZ);
            
            vec3 n = normalize(vNormal);
            vec3 blendWeights = abs(n);
            blendWeights = blendWeights / (blendWeights.x + blendWeights.y + blendWeights.z + 0.0001);
            
            vec4 texSample = colX * blendWeights.x + colY * blendWeights.y + colZ * blendWeights.z;
            baseColor = texSample.rgb;
            if (u_transparent_texture_void > 0.5) {
                texAlpha = texSample.a;
            }
        } else {
            vec2 ppp = -1.0 + 2.0 * finalUv;
            ppp += 0.1 * cos((1.5 * u_flow_scale) * ppp.yx + 1.1 * u_time + vec2(0.1, 1.1));
            ppp += 0.1 * cos((2.3 * u_flow_scale) * ppp.yx + 1.3 * u_time + vec2(3.2, 3.4));
            ppp += 0.1 * cos((2.2 * u_flow_scale) * ppp.yx + 1.7 * u_time + vec2(1.8, 5.2));
            ppp += u_flow_distortion_a * cos((u_flow_distortion_b * u_flow_scale) * ppp.yx + 1.4 * u_time + vec2(6.3, 3.9));
            float r = length(ppp);
            
            float vx = (finalUv.x * u_texture_ease) + (r * (1.0 - u_texture_ease));
            float vy = (finalUv.y * u_texture_ease) + (0.0 * (1.0 - u_texture_ease));
            vec2 texUv = vec2(vx, vy);

            float parallaxFactor = 0.25;
            texUv.y -= (u_y_offset * u_y_offset_color_multiplier / u_plane_height) * parallaxFactor;
            texUv *= 1.5;

            vec4 texSample = texture2D(u_procedural_texture, texUv);
            baseColor = texSample.rgb;
            if (u_transparent_texture_void > 0.5) {
                texAlpha = texSample.a;
            }
        }
    } else {
        baseColor = v_color;
    }

    vec3 color = baseColor;

    // === DOMAIN WARPING (simplified: 3 fbm calls instead of 5) ===
    if (NEAT_DOMAIN_WARP_ENABLED > 0.5) {
        vec3 p;
        if (NEAT_FLAT_SHADING < 0.5) {
            p = vec3((vPosition / 50.0 + vec3(0.5)) * u_domain_warp_scale);
            p.z += u_time * 0.15;
        } else {
            p = vec3(finalUv * u_domain_warp_scale, u_time * 0.15);
        }
        vec2 q = vec2(fbm(p), fbm(p + vec3(5.2, 1.3, 0.0)));
        float f = fbm(p + vec3(4.0 * q, 0.0));
        vec3 warpColor = color * (1.0 + f * 0.8 * u_domain_warp_intensity);
        float pattern = clamp(f * f * f + 0.6 * f * f + 0.5 * f, 0.0, 1.0);
        color = mix(color, warpColor * (0.6 + pattern * 0.8), u_domain_warp_intensity * 0.7);
    }

    // Post-processing
    // Compute dynamic pixel-perfect normal using smooth normal
    vec3 normal = normalize(vNormal);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float ndotv = dot(normal, viewDir);
    
    // Cull back-faces for closed 3D shapes (Sphere=1, Torus=2, Cylinder=3)
    if (u_shape_type > 0.5 && u_shape_type < 3.5) {
        if (ndotv < 0.0) {
            discard;
        }
    } else {
        // Double-sided shapes (Plane, Ribbon): flip normal if back-facing
        if (ndotv < 0.0) {
            normal = -normal;
            ndotv = -ndotv;
        }
    }
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 32.0);

    // Blend smooth 3D shading with smooth height-based wave shading
    if (NEAT_FLAT_SHADING > 0.5) {
        // Flat / height-based wave shading (plane style)
        color += v_displacement_amount * u_highlights;
        float heightShadow = 1.0 - v_displacement_amount;
        color -= heightShadow * heightShadow * u_shadows;
    } else {
        // 3D shading
        color += specular * u_highlights;
        color += v_displacement_amount * u_highlights * 0.5;
        float heightShadow = 1.0 - v_displacement_amount;
        color -= heightShadow * heightShadow * u_shadows * 0.5;
        color -= (1.0 - diffuse) * u_shadows * 0.5;
    }
    color = saturation(color, 1.0 + u_saturation);
    color = color * u_brightness;

    // === IRIDESCENCE ===
    if (NEAT_IRIDESCENCE_ENABLED > 0.5) {
        float hue = fract(v_displacement_amount * 0.5 + 0.5 + u_time * u_iridescence_speed * 0.05);
        vec3 iriColor = hsl2rgb(hue, 0.8, 0.6);
        color = mix(color, iriColor, u_iridescence_intensity * abs(v_displacement_amount) * 0.6);
    }

    // === PRISM EDGES (thin-film fringe along colour seams) ===
    // Oil-slick behaviour: the rainbow lives on the boundary between two colours,
    // not on the surface, and it runs through the spectrum as you cross it. Both
    // halves come straight off the colour-mix field the vertex shader already
    // built, so no screen-space derivatives are needed.
    if (NEAT_PRISM_EDGE_ENABLED > 0.5) {
        // pow() is undefined for a zero base with a non-positive exponent, and
        // both are reachable from config — off-seam the base is exactly 0.
        float band = pow(clamp(v_edge.x, 0.0, 1.0), max(u_prism_edge_thinness, 0.001));

        // Thickness has to vary *along* the seam, not just across it. A tight band
        // samples one slice of the series, so on its own it paints the whole rim a
        // single colour — where a real slick shifts hue as you follow the edge.
        // Riding the wave height is what a film on a rippling surface actually
        // does, and it means the wave layers show through the fringe even when the
        // lighting is flat enough that their shading contributes nothing.
        float thickness = v_edge.y * u_prism_edge_spread
            + v_displacement_amount * u_prism_edge_ripple
            + u_time * u_prism_edge_speed * 0.05;
        vec3 fringe = thinFilm(thickness);

        // Tint at constant luminance rather than screening the fringe on. Screening
        // only lightens, so over a pale surface — the usual case here — every channel
        // runs towards white and the hue washes out to a grey halo. Rescaling the
        // fringe to the surface's own brightness instead keeps a bright mass bright
        // and a dark one dark while the film supplies the hue, which is what reads as
        // petrol on water rather than a glow behind it.
        const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
        vec3 tinted = fringe * (dot(color, luma) / max(dot(fringe, luma), 0.001));

        // Intensity is a blend amount here; past 1 mix() extrapolates out of gamut.
        color = mix(color, min(tinted, vec3(1.0)), band * clamp(u_prism_edge_intensity, 0.0, 1.0));
    }

    // === FRESNEL (Rim glow) ===
    if (NEAT_FRESNEL_ENABLED > 0.5) {
        float slope = 1.0 - abs(v_displacement_amount);
        float fresnel = pow(max(slope, 0.0), u_fresnel_power);
        color += u_fresnel_color * fresnel * u_fresnel_intensity;
    }

    // === VIGNETTE ===
    if (NEAT_VIGNETTE_ENABLED > 0.5 && u_vignette_intensity > 0.0) {
        vec2 vigUv = vUv;
        if (NEAT_FLAT_SHADING < 0.5) {
            vigUv = (v_new_position.xy / v_new_position.w) * 0.5 + vec2(0.5);
        }
        float dist = length(vigUv - vec2(0.5));
        float vig = smoothstep(u_vignette_radius, u_vignette_radius * 0.3, dist);
        color *= mix(1.0, vig, u_vignette_intensity);
    }

    // === FAKE BLOOM ===
    if (NEAT_BLOOM_ENABLED > 0.5 && u_bloom_intensity > 0.0) {
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        float bloomMask = smoothstep(u_bloom_threshold, 1.0, luma);
        color += color * bloomMask * u_bloom_intensity;
    }

    // === CHROMATIC ABERRATION ===
    if (NEAT_CHROMATIC_ENABLED > 0.5 && u_chromatic_aberration > 0.0) {
        float caAmount = u_chromatic_aberration * 0.008;
        vec2 caUv = vUv;
        if (NEAT_FLAT_SHADING < 0.5) {
            caUv = (v_new_position.xy / v_new_position.w) * 0.5 + vec2(0.5);
        }
        float dist = length(caUv - vec2(0.5));
        float rShift = v_displacement_amount + caAmount * dist;
        float bShift = v_displacement_amount - caAmount * dist;
        color.r *= 1.0 + rShift * caAmount * 10.0;
        color.b *= 1.0 - bShift * caAmount * 10.0;
    }

    // Grain (use cheap hash noise instead of expensive fbm when static)
    float grain = 0.0;
    if (NEAT_GRAIN_ENABLED > 0.5 && u_grain_intensity > 0.0) {
        vec2 noiseCoords = gl_FragCoord.xy / u_grain_scale;
        if (u_grain_speed != 0.0 || NEAT_FLAT_SHADING > 0.5) {
            grain = grainFbm(vec3(noiseCoords, u_time * u_grain_speed));
        } else {
            // Static grain: use cheap hash instead of fbm
            grain = random(noiseCoords) - 0.5;
        }

        grain = grain * 0.5 + 0.5;
        grain -= 0.5;
        grain = (grain > u_grain_sparsity) ? grain : 0.0;
        grain *= u_grain_intensity;
    }

    color += vec3(grain);

    float edgeAlpha = 1.0;
    
    // Silhouette falloff for 3D shapes (skip when flat shading or fade is zero)
    if (u_silhouette_fade > 0.0 && NEAT_FLAT_SHADING < 0.5) {
        edgeAlpha = smoothstep(0.0, u_silhouette_fade, ndotv);
    }
    
    // UV boundary falloff for open shapes
    if (u_shape_type == 3.0) { // Cylinder: fade top/bottom ends
        float vFade = smoothstep(0.0, u_cylinder_fade, vUv.y) * smoothstep(1.0, 1.0 - u_cylinder_fade, vUv.y);
        edgeAlpha *= vFade;
    } else if (u_shape_type == 4.0) { // Ribbon: fade all 4 borders
        float uFade = smoothstep(0.0, u_ribbon_fade, vUv.x) * smoothstep(1.0, 1.0 - u_ribbon_fade, vUv.x);
        float vFade = smoothstep(0.0, u_ribbon_fade, vUv.y) * smoothstep(1.0, 1.0 - u_ribbon_fade, vUv.y);
        edgeAlpha *= uFade * vFade;
    }

    edgeAlpha *= texAlpha;
    gl_FragColor = vec4(color, edgeAlpha);
}
`;

export function buildVertUniforms(): string {
    return `precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 v_edge;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_color_pressure;
uniform float u_wave_frequency_x;
uniform float u_wave_frequency_y;
uniform float u_wave_amplitude;

// Secondary wave layer
uniform float u_wave2_frequency_x;
uniform float u_wave2_frequency_y;
uniform float u_wave2_amplitude;
uniform float u_wave2_speed;
uniform float u_wave2_angle;
uniform float u_plane_width;
uniform float u_plane_height;
uniform float u_color_blending;

uniform int u_colors_count;
struct ColorStop {
    float is_active;
    vec3 color;
    float influence;
};
uniform ColorStop u_colors[6];

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

// Fresnel uniforms
uniform float u_fresnel_enabled;
uniform float u_fresnel_power;
uniform float u_fresnel_intensity;
uniform vec3 u_fresnel_color;

uniform float u_shape_type;
uniform float u_flat_shading;
`;
}

export function buildFragUniforms(): string {
    return `precision highp float;

varying vec2 vUv;
varying vec2 vFlowUv;
varying vec4 v_new_position;
varying vec3 v_color;
varying float v_displacement_amount;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 v_edge;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_plane_height;

uniform float u_shadows;
uniform float u_highlights;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_grain_intensity; 
uniform float u_grain_sparsity; 
uniform float u_grain_scale; 
uniform float u_grain_speed; 

uniform float u_y_offset;
uniform float u_y_offset_color_multiplier;

// Flow field uniforms
uniform float u_flow_distortion_a;
uniform float u_flow_distortion_b;
uniform float u_flow_scale;

// Procedural texture uniforms
uniform sampler2D u_procedural_texture;
uniform float u_enable_procedural_texture;
uniform float u_texture_ease;

// Domain warping uniforms
uniform float u_domain_warp_enabled;
uniform float u_domain_warp_intensity;
uniform float u_domain_warp_scale;

// Vignette uniforms
uniform float u_vignette_intensity;
uniform float u_vignette_radius;

// Fresnel uniforms (fragment side)
uniform float u_fresnel_enabled;
uniform float u_fresnel_power;
uniform float u_fresnel_intensity;
uniform vec3 u_fresnel_color;



// Iridescence uniforms
uniform float u_iridescence_enabled;
uniform float u_iridescence_intensity;
uniform float u_iridescence_speed;

// Prism edge uniforms
uniform float u_prism_edge_intensity;
uniform float u_prism_edge_thinness;
uniform float u_prism_edge_spread;
uniform float u_prism_edge_speed;
uniform float u_prism_edge_ripple;

// Bloom uniforms
uniform float u_bloom_intensity;
uniform float u_bloom_threshold;

// Chromatic aberration
uniform float u_chromatic_aberration;
uniform float u_shape_type;
uniform float u_transparent_texture_void;
uniform float u_silhouette_fade;
uniform float u_cylinder_fade;
uniform float u_ribbon_fade;
uniform float u_flat_shading;
`;
}

export function buildNoise(): string {
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

export function buildColorFunctions(): string {
    return `
vec3 saturation(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}
`;
}
