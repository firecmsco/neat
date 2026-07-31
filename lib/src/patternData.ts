/**
 * Packs a `Pattern` into GPU textures and evaluates it analytically — once, at
 * init, into a texture that the main shader then samples normally.
 *
 * The artwork is a stack of flat-coloured shapes, so it has exact analytic
 * coverage at every edge. Drawing it through Canvas2D at a fixed 1024px throws
 * that away: edges land on a coarse grid and stair-step as soon as the camera
 * magnifies them. Evaluating it per-fragment at runtime keeps the edges exact
 * but costs roughly ten times a texture fetch, and — worse — gives up the mip
 * pyramid, so anything smaller than a pixel aliases instead of filtering.
 *
 * Baking takes both halves: shapes are rasterized analytically, at a resolution
 * chosen from the canvas rather than hardcoded, and the result is an ordinary
 * mipmapped texture that the hardware can filter anisotropically. Runtime cost
 * is one texture fetch, and generation is around a millisecond on the GPU —
 * faster than the Canvas2D path it replaces.
 *
 * The pattern reaches the bake shader as data:
 *
 *   - a **shape texture**, 5 texels per shape, holding precomputed distance
 *     coefficients, bounding box and colour;
 *   - an **aux texture** holding a 16x16 spatial grid (each cell lists the
 *     shapes whose bounding box touches it, so a fragment tests a handful
 *     rather than all of them), the stripe records, and a lookup table over u
 *     naming the stripes near any column.
 *
 * Needs WebGL2 for `texelFetch` and float textures; WebGL1 keeps the Canvas2D
 * path.
 */

import { Pattern, PatternShape } from "./pattern";

/** Grid resolution. 16x16 = 256 cells, which fills exactly one row of the aux texture. */
export const GRID_DIM = 16;
/** Aux texture width. Cells, item lists and stripes are all laid out in rows of this. */
export const AUX_WIDTH = 256;
/** Texels per shape in the shape texture. */
export const SHAPE_TEXELS = 5;
/**
 * Resolution of the stripe lookup table.
 *
 * Antialiasing stripe edges means knowing which stripes are near a fragment,
 * and scanning the stripe list per fragment to find them costs a loop with two
 * smoothsteps per iteration — measured at roughly 0.15 ms/MP, which dwarfed the
 * shape evaluation it was meant to complement. Stripes are sorted and
 * non-overlapping, so this table instead stores, for each slice of u, the index
 * of the last stripe beginning at or before it. That stripe and its successor
 * are the only two that can touch the fragment, which collapses the whole scan
 * into a constant three texel fetches.
 */
export const STRIPE_LUT_SIZE = 1024;

export const SHAPE_TYPE_TRIANGLE = 0;
export const SHAPE_TYPE_BAR = 1;
export const SHAPE_TYPE_CIRCLE = 2;

export interface PackedShape {
    type: number;
    cx: number;
    cy: number;
    bx: number;
    by: number;
    color: [number, number, number];
    /** Geometry payload, laid into texels 2..4. */
    geom: number[];
}

export interface PatternData {
    shapes: Float32Array;
    shapeCount: number;
    aux: Float32Array;
    auxHeight: number;
    itemsRow: number;
    stripesRow: number;
    stripeCount: number;
    stripeLutRow: number;
    gridDim: number;
    tile: boolean;
    background0: [number, number, number];
    background1: [number, number, number];
    baseColor: [number, number, number];
    voidAlpha: number;
    droppedSquiggles: number;
    /** Mean shapes per grid cell — the number a fragment actually pays for. */
    meanCellOccupancy: number;
}

function hexToRgbNorm(hex: string): [number, number, number] {
    const n = parseInt(hex.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Converts a shape into distance-function coefficients.
 *
 * All the per-shape trigonometry and edge-normal work happens here, once, so
 * the shader only does dot products.
 */
function packShape(shape: PatternShape, size: number): PackedShape | null {
    const color = hexToRgbNorm(shape.color);

    if (shape.kind === "triangle") {
        const v0x = shape.x / size, v0y = shape.y / size;
        const v1x = (shape.x + shape.x1) / size, v1y = (shape.y + shape.y1) / size;
        const v2x = (shape.x + shape.x2) / size, v2y = (shape.y + shape.y2) / size;

        const area2 = (v1x - v0x) * (v2y - v0y) - (v2x - v0x) * (v1y - v0y);
        if (Math.abs(area2) < 1e-9) return null;

        const cx = (v0x + v1x + v2x) / 3;
        const cy = (v0y + v1y + v2y) / 3;
        const verts: Array<[number, number]> = [[v0x, v0y], [v1x, v1y], [v2x, v2y]];

        const geom: number[] = [];
        for (let i = 0; i < 3; i++) {
            const [ax, ay] = verts[i];
            const [bx2, by2] = verts[(i + 1) % 3];
            let nx = by2 - ay;
            let ny = -(bx2 - ax);
            const len = Math.hypot(nx, ny) || 1;
            nx /= len; ny /= len;
            // Orient outward so "inside" is negative regardless of winding.
            let k = nx * (cx - ax) + ny * (cy - ay);
            if (k > 0) { nx = -nx; ny = -ny; k = -k; }
            geom.push(nx, ny, k);
        }

        return {
            type: SHAPE_TYPE_TRIANGLE, cx, cy,
            bx: Math.max(...verts.map(v => Math.abs(v[0] - cx))),
            by: Math.max(...verts.map(v => Math.abs(v[1] - cy))),
            color, geom
        };
    }

    if (shape.kind === "bar") {
        const cs = Math.cos(shape.rot);
        const sn = Math.sin(shape.rot);
        const hw = shape.width / 2 / size;
        const hh = shape.height / 2 / size;
        return {
            type: SHAPE_TYPE_BAR,
            cx: shape.x / size, cy: shape.y / size,
            bx: Math.abs(hw * cs) + Math.abs(hh * sn),
            by: Math.abs(hw * sn) + Math.abs(hh * cs),
            color, geom: [cs, sn, hw, hh]
        };
    }

    if (shape.kind === "circle") {
        const r = shape.r / size;
        const hw = shape.lineWidth / 2 / size;
        return {
            type: SHAPE_TYPE_CIRCLE,
            cx: shape.x / size, cy: shape.y / size,
            bx: r + hw, by: r + hw,
            color, geom: [r, hw]
        };
    }

    // Squiggles: cubic Béziers have no closed-form distance, so the bake
    // drops them and warns.
    return null;
}

export function buildPatternData(pattern: Pattern): PatternData {
    const size = pattern.size;

    const packed: PackedShape[] = [];
    let droppedSquiggles = 0;
    for (const shape of pattern.shapes) {
        if (shape.kind === "squiggle") { droppedSquiggles++; continue; }
        const p = packShape(shape, size);
        if (p) packed.push(p);
    }

    // ── Shape texture: SHAPE_TEXELS x N ──
    const n = Math.max(1, packed.length);
    const shapes = new Float32Array(SHAPE_TEXELS * n * 4);
    packed.forEach((s, i) => {
        const base = i * SHAPE_TEXELS * 4;
        shapes[base + 0] = s.type;
        shapes[base + 1] = s.cx;
        shapes[base + 2] = s.cy;
        shapes[base + 3] = s.bx;

        shapes[base + 4] = s.by;
        shapes[base + 5] = s.color[0];
        shapes[base + 6] = s.color[1];
        shapes[base + 7] = s.color[2];

        for (let g = 0; g < s.geom.length; g++) shapes[base + 8 + g] = s.geom[g];
    });

    // ── Grid: which shapes touch which cell ──
    // Lists are filled by walking shapes in order, which leaves each cell's list
    // ascending by shape index. That is what preserves painter order: the
    // shader draws a cell's shapes in list order, and later shapes must win.
    const cells: number[][] = Array.from({ length: GRID_DIM * GRID_DIM }, () => []);

    packed.forEach((s, i) => {
        const x0 = (s.cx - s.bx) * GRID_DIM;
        const x1 = (s.cx + s.bx) * GRID_DIM;
        const y0 = (s.cy - s.by) * GRID_DIM;
        const y1 = (s.cy + s.by) * GRID_DIM;

        let ix0 = Math.floor(x0), ix1 = Math.floor(x1);
        let iy0 = Math.floor(y0), iy1 = Math.floor(y1);

        if (pattern.tile) {
            // A shape wider than the tile covers every column; clamping the span
            // stops the wrap loop from inserting it repeatedly.
            if (ix1 - ix0 >= GRID_DIM - 1) { ix0 = 0; ix1 = GRID_DIM - 1; }
            if (iy1 - iy0 >= GRID_DIM - 1) { iy0 = 0; iy1 = GRID_DIM - 1; }
        } else {
            ix0 = Math.max(0, ix0); ix1 = Math.min(GRID_DIM - 1, ix1);
            iy0 = Math.max(0, iy0); iy1 = Math.min(GRID_DIM - 1, iy1);
        }

        for (let gy = iy0; gy <= iy1; gy++) {
            for (let gx = ix0; gx <= ix1; gx++) {
                const cx = pattern.tile ? ((gx % GRID_DIM) + GRID_DIM) % GRID_DIM : gx;
                const cy = pattern.tile ? ((gy % GRID_DIM) + GRID_DIM) % GRID_DIM : gy;
                const list = cells[cy * GRID_DIM + cx];
                // The wrap can revisit a cell when a shape spans the seam.
                if (list[list.length - 1] !== i) list.push(i);
            }
        }
    });

    const items: number[] = [];
    const cellRecords: Array<[number, number]> = [];
    for (const list of cells) {
        cellRecords.push([items.length, list.length]);
        for (const idx of list) items.push(idx);
    }

    // ── Aux texture layout ──
    const cellRows = Math.ceil((GRID_DIM * GRID_DIM) / AUX_WIDTH);
    const itemRows = Math.ceil(items.length / AUX_WIDTH);
    const stripes = pattern.stripes;

    const stripeRecords: Array<[number, number, number]> = [];
    for (const stripe of stripes) {
        // drawImage clips source and destination at the canvas edge, 1:1, so the
        // covered span is the narrower of the two clips.
        const covered = Math.min(stripe.width, size - stripe.sourceX, size - stripe.destX);
        if (covered <= 0) continue;
        stripeRecords.push([
            stripe.destX / size,
            (stripe.destX + covered) / size,
            (stripe.sourceX - stripe.destX) / size
        ]);
    }
    const stripeRows = Math.ceil(stripeRecords.length / AUX_WIDTH);
    const lutRows = STRIPE_LUT_SIZE / AUX_WIDTH;

    const itemsRow = cellRows;
    const stripesRow = itemsRow + itemRows;
    const stripeLutRow = stripesRow + stripeRows;
    const auxHeight = Math.max(1, stripeLutRow + lutRows);

    const aux = new Float32Array(AUX_WIDTH * auxHeight * 4);
    cellRecords.forEach(([start, count], c) => {
        const o = c * 4;
        aux[o] = start;
        aux[o + 1] = count;
    });
    items.forEach((idx, j) => {
        const o = (itemsRow * AUX_WIDTH + j) * 4;
        aux[o] = idx;
    });
    stripeRecords.forEach(([d0, d1, off], s) => {
        const o = (stripesRow * AUX_WIDTH + s) * 4;
        aux[o] = d0;
        aux[o + 1] = d1;
        aux[o + 2] = off;
    });

    // Stripe lookup table. Records are already ascending by destX, so a single
    // forward walk assigns each slice the last stripe that starts at or before
    // it. -1 means "no stripe starts before here", and the shader then only has
    // to consider stripe 0.
    {
        let cursor = -1;
        for (let i = 0; i < STRIPE_LUT_SIZE; i++) {
            const u = (i + 0.5) / STRIPE_LUT_SIZE;
            while (cursor + 1 < stripeRecords.length && stripeRecords[cursor + 1][0] <= u) cursor++;
            const o = ((stripeLutRow + Math.floor(i / AUX_WIDTH)) * AUX_WIDTH + (i % AUX_WIDTH)) * 4;
            aux[o] = cursor;
        }
    }

    return {
        shapes,
        shapeCount: packed.length,
        aux,
        auxHeight,
        itemsRow,
        stripesRow,
        stripeCount: stripeRecords.length,
        stripeLutRow,
        gridDim: GRID_DIM,
        tile: pattern.tile,
        background0: hexToRgbNorm(pattern.background[0]),
        background1: hexToRgbNorm(pattern.background[1]),
        baseColor: hexToRgbNorm(pattern.baseColor),
        voidAlpha: pattern.transparentVoid ? 0 : 1,
        droppedSquiggles,
        meanCellOccupancy: items.length / (GRID_DIM * GRID_DIM)
    };
}

/** Vertex stage for the bake: a full-screen triangle covering pattern uv [0,1]. */
export const PATTERN_BAKE_VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Fragment stage for the bake. Fixed source — the pattern arrives entirely as
 * texture data, so this compiles once per context no matter how the config
 * changes afterwards.
 *
 * WebGL2 only: it needs `texelFetch` and float textures.
 */
export function buildPatternBakeFrag(): string {
    return `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

// ── Analytic procedural pattern (bake) ──
uniform sampler2D u_neat_shapes;
uniform sampler2D u_neat_aux;
uniform float u_neat_grid_dim;
uniform int u_neat_items_row;
uniform int u_neat_stripes_row;
uniform int u_neat_stripe_count;
uniform int u_neat_stripe_lut_row;
uniform float u_neat_tile;
uniform vec3 u_neat_bg0;
uniform vec3 u_neat_bg1;
uniform vec3 u_neat_base;
uniform float u_neat_void_alpha;
uniform float u_neat_edge_softness;
uniform float u_neat_seam_blend;
uniform float u_neat_bake_size;

/** Half the pixel footprint measured along a unit direction g. */
float neatWidth(vec2 g, mat2 J, float soft) {
  return max(0.5 * soft * (abs(dot(g, J[0])) + abs(dot(g, J[1]))), 1e-6);
}

/**
 * Evaluates the shape stack at one point in artwork space.
 *
 * Each shape is filtered along its own surface normal rather than by a single
 * isotropic width, so an edge stays as sharp as the pixel footprint allows in
 * the direction that matters. That is what keeps a ribbon crisp when 3D
 * foreshortening squashes one screen axis far more than the other.
 */
vec3 neatShapesAt(vec2 p, mat2 J, float soft, vec3 bg) {
  vec3 col = bg;

  // A conservative isotropic bound, used only to pad the bounding-box reject.
  float rad = 0.5 * soft * (length(J[0]) + length(J[1]));

  vec2 cellUv = u_neat_tile > 0.5 ? fract(p) : clamp(p, 0.0, 0.999999);
  ivec2 cell = ivec2(floor(cellUv * u_neat_grid_dim));
  int c = cell.y * int(u_neat_grid_dim) + cell.x;
  vec4 rec = texelFetch(u_neat_aux, ivec2(c % ${AUX_WIDTH}, c / ${AUX_WIDTH}), 0);
  int start = int(rec.x);
  int count = int(rec.y);

  for (int i = 0; i < 256; i++) {
    if (i >= count) break;
    int j = start + i;
    int idx = int(texelFetch(u_neat_aux, ivec2(j % ${AUX_WIDTH}, u_neat_items_row + j / ${AUX_WIDTH}), 0).x);

    vec4 t0 = texelFetch(u_neat_shapes, ivec2(0, idx), 0);
    vec4 t1 = texelFetch(u_neat_shapes, ivec2(1, idx), 0);

    vec2 d = p - t0.yz;
    if (u_neat_tile > 0.5) d -= floor(d + 0.5);

    // The grid only narrows candidates to a cell; this rejects the ones whose
    // box still misses, before any distance work.
    if (abs(d.x) >= t0.w + rad || abs(d.y) >= t1.x + rad) continue;

    vec4 t2 = texelFetch(u_neat_shapes, ivec2(2, idx), 0);
    float e;
    vec2 g;

    if (t0.x < 0.5) {
      // Triangle: max of three outward half-plane distances. The winning
      // half-plane's normal is the surface normal there.
      vec4 t3 = texelFetch(u_neat_shapes, ivec2(3, idx), 0);
      vec4 t4 = texelFetch(u_neat_shapes, ivec2(4, idx), 0);
      vec2 n0 = t2.xy, n1 = vec2(t2.w, t3.x), n2 = t3.zw;
      float e0 = dot(d, n0) + t2.z;
      float e1 = dot(d, n1) + t3.y;
      float e2 = dot(d, n2) + t4.x;
      e = e0; g = n0;
      if (e1 > e) { e = e1; g = n1; }
      if (e2 > e) { e = e2; g = n2; }
    } else if (t0.x < 1.5) {
      // Bar: rotate into the box's frame, take the box distance, then rotate
      // the local gradient back out.
      vec2 r = vec2(dot(d, t2.xy), dot(d, vec2(-t2.y, t2.x)));
      vec2 b = abs(r) - t2.zw;
      e = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0);
      vec2 gl = b.x > b.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      if (b.x > 0.0 && b.y > 0.0) gl = normalize(max(b, 0.0));
      gl *= sign(r + 1e-20);
      g = gl.x * t2.xy + gl.y * vec2(-t2.y, t2.x);
    } else {
      // Ring: the normal is radial, flipping across the ring's centre line.
      float len = length(d);
      e = abs(len - t2.x) - t2.y;
      g = (d / max(len, 1e-6)) * sign(len - t2.x);
    }

    float w = neatWidth(g, J, soft);
    col = mix(col, t1.yzw, 1.0 - smoothstep(-w, w, e));
  }

  return col;
}

vec4 neatSamplePattern(vec2 uv, mat2 J) {
  vec2 q = fract(uv);

  // The Jacobian is measured on the incoming coordinate, before the stripe
  // remap below. That remap is discontinuous at every seam, and derivatives
  // taken after it would blow up and smear a band across each boundary.
  float soft = u_neat_edge_softness;

  // Stripe boundaries are vertical lines in pattern space, so their normal is
  // x and they get filtered along it — the same anisotropy fix the shapes get.
  float aa = neatWidth(vec2(1.0, 0.0), J, soft);

  float u = q.x;

  // Stripe edges need coverage just as much as shape edges do. A binary
  // inside/outside test leaves every matter/void boundary hard, and because
  // those boundaries are vertical in pattern space they land as long diagonals
  // on screen once the ribbon is warped — the most visible aliasing there is.
  // Bitmap mode gets this for free from bilinear filtering.
  //
  // Coverages are summed rather than maxed: stripes within a matter segment are
  // contiguous, so the two halves either side of a seam must add to 1, or the
  // seam darkens into a visible line.
  //
  // Not an early-out loop: a matter segment's last stripe can overshoot into
  // the next one, and the bitmap path resolves the overlap by draw order, so
  // the last match has to win.
  //
  // Two stripes are considered, not one. Where a pixel straddles a seam the
  // artwork lookup jumps discontinuously — the two sides come from different
  // columns of the source — so no amount of coverage on a single lookup can
  // smooth it. Both sides get evaluated and blended instead. This is the
  // dominant source of aliasing when baking: seams are vertical in pattern
  // space, so they land as long diagonals on screen. Bitmap mode hides the same
  // discontinuity under bilinear filtering.
  //
  // The lookup table names the only two candidates, so this is three fetches
  // rather than a scan over every stripe.
  int li = int(clamp(u, 0.0, 0.999999) * float(${STRIPE_LUT_SIZE}));
  int iA = int(texelFetch(u_neat_aux,
    ivec2(li % ${AUX_WIDTH}, u_neat_stripe_lut_row + li / ${AUX_WIDTH}), 0).x);
  // Three candidates, not two. The table names the last stripe *starting* at or
  // before u, so immediately past a seam that is the stripe on the right — and
  // the one on the left, whose coverage makes up the other half of the pixel,
  // is its predecessor. Considering only iA and iA+1 drops it, coverage falls to
  // a half, and the fragment blends halfway to the void colour: a dark hairline
  // down every seam.
  //
  // Coverages sum rather than max: stripes in a matter segment are contiguous,
  // and smoothstep is symmetric about its midpoint, so the two halves either
  // side of a seam add to exactly 1.
  float cov = 0.0;
  float c1 = -1.0, c2 = -1.0;
  float su1 = u, su2 = u;

  for (int k = -1; k <= 1; k++) {
    int idx = iA + k;
    if (idx < 0 || idx >= u_neat_stripe_count) continue;
    vec4 st = texelFetch(u_neat_aux,
      ivec2(idx % ${AUX_WIDTH}, u_neat_stripes_row + idx / ${AUX_WIDTH}), 0);
    float c = min(smoothstep(-aa, aa, u - st.x), smoothstep(-aa, aa, st.y - u));
    cov += c;
    // >= so a tie goes to the later stripe, matching the bitmap's draw order,
    // which is also what keeps an overshooting stripe overlapping correctly.
    if (c >= c1) { c2 = c1; su2 = su1; c1 = c; su1 = u + st.z; }
    else if (c > c2) { c2 = c; su2 = u + st.z; }
  }
  cov = clamp(cov, 0.0, 1.0);

  if (cov <= 0.0) return vec4(u_neat_base, u_neat_void_alpha);

  vec2 p = vec2(su1, q.y);
  vec3 bg = mix(u_neat_bg0, u_neat_bg1, q.y);
  vec3 col = neatShapesAt(p, J, soft, bg);

  // Blend in the far side of a seam by whatever fraction of the pixel the near
  // stripe leaves uncovered. When the near stripe covers the pixel outright the
  // weight is zero, which also keeps overlapping stripes last-wins rather than
  // ghosting them together.
  float w2 = min(max(c2, 0.0), clamp(1.0 - c1, 0.0, 1.0)) * u_neat_seam_blend;
  if (w2 > 0.001) {
    col = mix(col, neatShapesAt(vec2(su2, q.y), J, soft, bg), w2);
  }

  return vec4(mix(u_neat_base, col, cov), mix(u_neat_void_alpha, 1.0, cov));
}

void main() {
  // One output texel is exactly one unit of pattern space over the bake size,
  // and the axes are independent — so the footprint is known exactly here and
  // needs no screen-space derivatives.
  float t = 1.0 / u_neat_bake_size;
  fragColor = neatSamplePattern(v_uv, mat2(vec2(t, 0.0), vec2(0.0, t)));
}
`;
}
