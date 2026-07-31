/**
 * Procedural pattern description — the single source of truth for what the
 * texture *is*, independent of how it gets rasterized.
 *
 * Two consumers render this description:
 *   - the bitmap path, which paints it into a 2D canvas and uploads it as a
 *     texture (see `paintPattern`), and
 *   - the bake path, which evaluates it analytically on the GPU into a
 *     texture (see `patternData.ts`).
 *
 * Keeping generation separate from rasterization is what lets `textureMode`
 * be a real toggle: the same seed produces the same composition either way,
 * so switching modes changes sharpness and nothing else.
 *
 * Coordinates are in *pattern pixels* — the [0, size] space the original
 * canvas generator worked in. The bake normalizes by `size` on the way
 * into GLSL; keeping the description in pixels means the numbers here stay
 * directly comparable to the canvas drawing calls.
 */

import { NeatColor } from "./types";

export interface PatternTriangle {
    kind: "triangle";
    /** First vertex; the other two are stored as offsets from it. */
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
}

export interface PatternCircle {
    kind: "circle";
    x: number;
    y: number;
    r: number;
    lineWidth: number;
    color: string;
}

export interface PatternBar {
    kind: "bar";
    x: number;
    y: number;
    rot: number;
    width: number;
    height: number;
    color: string;
}

export interface PatternSquiggleCurve {
    cx1: number;
    cy1: number;
    cx2: number;
    cy2: number;
    ex: number;
    ey: number;
}

export interface PatternSquiggle {
    kind: "squiggle";
    x: number;
    y: number;
    lineWidth: number;
    color: string;
    curves: PatternSquiggleCurve[];
}

export type PatternShape = PatternTriangle | PatternCircle | PatternBar | PatternSquiggle;

/**
 * One column of "matter": pixels [destX, destX + width) sample the generated
 * artwork starting at `sourceX`. Anything not covered by a stripe is void.
 */
export interface PatternStripe {
    destX: number;
    width: number;
    sourceX: number;
}

export interface Pattern {
    /** Reference pixel size that all coordinates are expressed in. */
    size: number;
    /** Whether shapes wrap around the edges (false for the flat `plane` shape). */
    tile: boolean;
    /** Fill shown wherever there is no matter. */
    baseColor: string;
    /** Vertical background gradient, top to bottom, drawn under every shape. */
    background: [string, string];
    shapes: PatternShape[];
    stripes: PatternStripe[];
    transparentVoid: boolean;
}

export interface GeneratePatternOptions {
    size: number;
    seed: number;
    colors: NeatColor[];
    colorBlending: number;
    baseColor: string;
    tile: boolean;
    transparentVoid: boolean;
    voidLikelihood: number;
    voidWidthMin: number;
    voidWidthMax: number;
    bandDensity: number;
    triangles: number;
    circles: number;
    bars: number;
    squiggles: number;
}

function hexToRgb(hex: string) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).padStart(6, "0");
}

/**
 * Builds the pattern description.
 *
 * The order of `random()` calls here is load-bearing: it reproduces the
 * sequence the generator has always used, so existing `textureSeed` values
 * keep producing the artwork they produced before this was extracted.
 */
export function generatePattern(opts: GeneratePatternOptions): Pattern | null {
    const {
        size,
        seed: baseSeed,
        colorBlending,
        baseColor,
        tile,
        transparentVoid
    } = opts;

    let seed = baseSeed;

    function random() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    const colors = opts.colors.filter(c => c.enabled).map(c => c.color);
    if (colors.length === 0) return null;

    const getInterColor = () => {
        const c1 = colors[Math.floor(random() * colors.length)];
        const c2 = colors[Math.floor(random() * colors.length)];
        const mix = random() * colorBlending;
        const rgb1 = hexToRgb(c1);
        const rgb2 = hexToRgb(c2);
        const r = rgb1.r + (rgb2.r - rgb1.r) * mix;
        const g = rgb1.g + (rgb2.g - rgb1.g) * mix;
        const b = rgb1.b + (rgb2.b - rgb1.b) * mix;
        return rgbToHex(r, g, b);
    };

    const background: [string, string] = [getInterColor(), getInterColor()];

    const shapes: PatternShape[] = [];

    for (let i = 0; i < opts.triangles; i++) {
        const color = getInterColor();
        const x = random() * size;
        const y = random() * size;
        const s = 100 + random() * 300;
        shapes.push({
            kind: "triangle",
            x,
            y,
            x1: (random() - 0.5) * s,
            y1: (random() - 0.5) * s,
            x2: (random() - 0.5) * s,
            y2: (random() - 0.5) * s,
            color
        });
    }

    for (let i = 0; i < opts.circles; i++) {
        const color = getInterColor();
        const lineWidth = 10 + random() * 50;
        const x = random() * size;
        const y = random() * size;
        const r = 50 + random() * 150;
        shapes.push({ kind: "circle", x, y, r, lineWidth, color });
    }

    for (let i = 0; i < opts.bars; i++) {
        const color = getInterColor();
        const x = random() * size;
        const y = random() * size;
        const rot = random() * Math.PI;
        shapes.push({ kind: "bar", x, y, rot, width: 300, height: 50, color });
    }

    for (let i = 0; i < opts.squiggles; i++) {
        const color = getInterColor();
        const x = random() * size;
        const y = random() * size;

        const curves: PatternSquiggleCurve[] = [];
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
                ex,
                ey
            });
            cx = ex;
            cy = ey;
        }

        shapes.push({ kind: "squiggle", x, y, lineWidth: 15, color, curves });
    }

    // Masking uses an isolated seed so shape layout and band layout can be
    // tweaked independently of one another.
    seed = baseSeed + 50000;

    const stripes: PatternStripe[] = [];
    let layoutHead = 0;
    const segments: Array<{ type: "void" | "matter"; x: number; width: number }> = [];

    while (layoutHead < size) {
        const isVoid = random() < opts.voidLikelihood;
        if (isVoid) {
            const w = opts.voidWidthMin + random() * (opts.voidWidthMax - opts.voidWidthMin);
            segments.push({ type: "void", x: layoutHead, width: w });
            layoutHead += w;
        } else {
            const w = 50 + random() * 200;
            segments.push({ type: "matter", x: layoutHead, width: w });
            layoutHead += w;
        }
    }

    for (const seg of segments) {
        if (seg.type !== "matter") continue;
        const endX = Math.min(seg.x + seg.width, size);
        let currentX = seg.x;

        while (currentX < endX) {
            const stripeWidth = (2 + random() * 20) / opts.bandDensity;
            const sourceX = Math.floor(random() * size);
            stripes.push({ destX: currentX, width: stripeWidth, sourceX });
            currentX += stripeWidth;
        }
    }

    return {
        size,
        tile,
        baseColor,
        background,
        shapes,
        stripes,
        transparentVoid
    };
}

/**
 * Bitmap rasterization: paints the artwork into `sourceCtx`, then composites
 * the matter stripes into `destCtx`. Split out of the generator so both
 * render modes consume the same description.
 */
export function paintPattern(
    pattern: Pattern,
    sourceCanvas: HTMLCanvasElement,
    sourceCtx: CanvasRenderingContext2D,
    destCtx: CanvasRenderingContext2D
) {
    const size = pattern.size;
    const dxs = pattern.tile ? [-1, 0, 1] : [0];
    const dys = pattern.tile ? [-1, 0, 1] : [0];

    // === SOURCE CANVAS ===
    sourceCtx.fillStyle = pattern.baseColor;
    sourceCtx.fillRect(0, 0, size, size);

    const bgGrad = sourceCtx.createLinearGradient(0, 0, 0, size);
    bgGrad.addColorStop(0, pattern.background[0]);
    bgGrad.addColorStop(1, pattern.background[1]);
    sourceCtx.fillStyle = bgGrad;
    sourceCtx.fillRect(0, 0, size, size);

    for (const shape of pattern.shapes) {
        if (shape.kind === "triangle") {
            for (const dx of dxs) {
                for (const dy of dys) {
                    sourceCtx.fillStyle = shape.color;
                    sourceCtx.beginPath();
                    const tx = shape.x + dx * size;
                    const ty = shape.y + dy * size;
                    sourceCtx.moveTo(tx, ty);
                    sourceCtx.lineTo(tx + shape.x1, ty + shape.y1);
                    sourceCtx.lineTo(tx + shape.x2, ty + shape.y2);
                    sourceCtx.fill();
                }
            }
        } else if (shape.kind === "circle") {
            for (const dx of dxs) {
                for (const dy of dys) {
                    sourceCtx.strokeStyle = shape.color;
                    sourceCtx.lineWidth = shape.lineWidth;
                    sourceCtx.beginPath();
                    sourceCtx.arc(shape.x + dx * size, shape.y + dy * size, shape.r, 0, Math.PI * 2);
                    sourceCtx.stroke();
                }
            }
        } else if (shape.kind === "bar") {
            for (const dx of dxs) {
                for (const dy of dys) {
                    sourceCtx.fillStyle = shape.color;
                    sourceCtx.save();
                    sourceCtx.translate(shape.x + dx * size, shape.y + dy * size);
                    sourceCtx.rotate(shape.rot);
                    sourceCtx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                    sourceCtx.restore();
                }
            }
        } else {
            sourceCtx.lineWidth = shape.lineWidth;
            sourceCtx.lineCap = "round";
            for (const dx of dxs) {
                for (const dy of dys) {
                    sourceCtx.strokeStyle = shape.color;
                    sourceCtx.beginPath();
                    const tx = shape.x + dx * size;
                    const ty = shape.y + dy * size;
                    sourceCtx.moveTo(tx, ty);
                    for (const curve of shape.curves) {
                        sourceCtx.bezierCurveTo(
                            tx + curve.cx1, ty + curve.cy1,
                            tx + curve.cx2, ty + curve.cy2,
                            tx + curve.ex, ty + curve.ey
                        );
                    }
                    sourceCtx.stroke();
                }
            }
        }
    }

    // === MASKED CANVAS ===
    if (pattern.transparentVoid) {
        destCtx.clearRect(0, 0, size, size);
    } else {
        destCtx.fillStyle = pattern.baseColor;
        destCtx.fillRect(0, 0, size, size);
    }

    for (const stripe of pattern.stripes) {
        destCtx.drawImage(
            sourceCanvas,
            stripe.sourceX, 0, stripe.width, size,
            stripe.destX, 0, stripe.width, size
        );
    }
}
